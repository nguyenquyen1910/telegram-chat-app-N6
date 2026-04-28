import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCall } from '@/hooks/useCall';
import { signalingService } from '@/services/signalingService';
import { getUserById } from '@/services/userService';
import { MOCK_CURRENT_USER } from '@/constants/chat';
import { CallMetadata, User } from '@/types/chat';

interface CallHistoryItem extends CallMetadata {
  otherUser?: User | null;
}

export default function CallsScreen() {
  const router = useRouter();
  const { initiateCall } = useCall(MOCK_CURRENT_USER.uid);

  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Group calls by date
  const groupCallsByDate = (calls: CallHistoryItem[]) => {
    const groups: { [key: string]: CallHistoryItem[] } = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    calls.forEach(call => {
      const callDate = call.startedAt instanceof Date
        ? call.startedAt
        : (call.startedAt as any)?.toDate?.() || new Date(call.startedAt as any);

      let groupKey: string;
      const date = new Date(callDate);

      if (date >= today) {
        groupKey = 'Hôm nay';
      } else if (date >= yesterday) {
        groupKey = 'Hôm qua';
      } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        groupKey = 'Tuần này';
      } else {
        groupKey = date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(call);
    });

    // Convert to array format for FlatList
    const sections = Object.keys(groups).map(date => ({
      date,
      data: groups[date]
    }));

    return sections;
  };

  // Load call history
  useEffect(() => {
    const loadCallHistory = async () => {
      try {
        const history = await signalingService.getCallHistory(MOCK_CURRENT_USER.uid, 100);

        // Fetch user info for each call
        const enrichedCalls = await Promise.all(
          history.map(async (call) => {
            const otherUserId = call.callerId === MOCK_CURRENT_USER.uid
              ? call.calleeId
              : call.callerId;

            let otherUser: User | null = null;
            try {
              otherUser = await getUserById(otherUserId);
            } catch (error) {
              console.log('User not found:', otherUserId);
            }

            return {
              ...call,
              otherUser
            };
          })
        );

        setCallHistory(enrichedCalls);
      } catch (error) {
        console.error('Error loading call history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCallHistory();

    // Subscribe to real-time updates
    const unsubscribe = signalingService.subscribeToCallHistory(
      MOCK_CURRENT_USER.uid,
      async (updatedHistory) => {
        const enriched = await Promise.all(
          updatedHistory.map(async (call) => {
            const otherUserId = call.callerId === MOCK_CURRENT_USER.uid
              ? call.calleeId
              : call.callerId;

            let otherUser: User | null = null;
            try {
              otherUser = await getUserById(otherUserId);
            } catch (error) {
              console.log('User not found:', otherUserId);
            }

            return { ...call, otherUser };
          })
        );
        setCallHistory(enriched);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleCallPress = useCallback(async (call: CallHistoryItem) => {
    const targetUserId = call.callerId === MOCK_CURRENT_USER.uid
      ? call.calleeId
      : call.callerId;

    // Navigate to outgoing call screen
    router.push({
      pathname: '/(tabs)/calls/outgoing/[userId]',
      params: { userId: targetUserId }
    });
  }, [router]);

  const handleDeleteCall = useCallback(async (callId: string) => {
    try {
      await signalingService.deleteCallFromHistory(MOCK_CURRENT_USER.uid, callId);
    } catch (error) {
      console.error('Error deleting call:', error);
    }
  }, []);

  const renderCallItem = useCallback(({ item }: { item: CallHistoryItem }) => {
    const isIncoming = item.direction === 'incoming';
    const isMissed = item.status === 'missed';
    const isVideo = item.type === 'video';

    // Determine icon and color
    let iconName: string;
    let iconColor: string;

    if (isMissed) {
      iconName = isIncoming ? 'call-received' : 'call-made';
      iconColor = '#FF3B30';
    } else {
      iconName = isIncoming ? 'call-received' : 'call-made';
      iconColor = isVideo ? '#54A5E8' : '#34C759';
    }

    const displayName = item.otherUser?.displayName || 'Unknown';
    const avatarUrl = item.otherUser?.avatarUrl || '';

    const callTime = item.startedAt instanceof Date
      ? item.startedAt
      : (item.startedAt as any)?.toDate?.() || new Date(item.startedAt as any);

    const timeString = callTime.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const durationString = item.duration
      ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`
      : '';

    return (
      <TouchableOpacity
        style={styles.callItem}
        onPress={() => handleCallPress(item)}
        activeOpacity={0.6}
      >
        {/* Avatar or icon */}
        <View style={styles.callIconContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.callAvatar} />
          ) : (
            <View style={[styles.callAvatarPlaceholder, { backgroundColor: iconColor }]}>
              <Ionicons name={iconName as any} size={24} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Call info */}
        <View style={styles.callInfo}>
          <View style={styles.callTopRow}>
            <Text style={styles.callName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.callTime}>{timeString}</Text>
          </View>

          <View style={styles.callBottomRow}>
            <Ionicons
              name={iconName as any}
              size={14}
              color={iconColor}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.callType}>
              {isVideo ? 'Video' : 'Thoại'} • {isMissed ? 'Không trả lời' : isIncoming ? 'Đầu vào' : 'Đầu ra'}
            </Text>
            {durationString && !isMissed && (
              <Text style={styles.callDuration}> • {durationString}</Text>
            )}
          </View>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCall(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [handleCallPress, handleDeleteCall]);

  const renderSectionHeader = useCallback(({ section }: { section: { date: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.date}</Text>
    </View>
  ), []);

  const sections = groupCallsByDate(callHistory);

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />
          <View style={styles.header}>
            <View style={styles.leftSpacer} />
            <Text style={styles.headerTitle}>Cuộc gọi</Text>
            <View style={styles.rightSpacer} />
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

        <View style={styles.header}>
          <View style={styles.leftSpacer} />
          <Text style={styles.headerTitle}>Cuộc gọi</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              // TODO: Implement edit/select mode
            }}
          >
            <Text style={styles.editButtonText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>

        {callHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="call-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Lịch sử cuộc gọi</Text>
            <Text style={styles.emptySubtext}>Chưa có cuộc gọi nào</Text>
          </View>
        ) : (
          <FlatList
            data={sections}
            keyExtractor={(section) => section.date}
            renderItem={({ item }) => (
              <View>
                {renderSectionHeader({ section: { date: item.date } })}
                {item.data.map((call) => renderCallItem({ item: call }))}
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 0,
    backgroundColor: '#F7F7F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    height: 44,
  },
  leftSpacer: {
    width: 32,
    height: 32,
  },
  rightSpacer: {
    width: 32,
    height: 32,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    zIndex: 10,
  },
  editButtonText: {
    color: '#54A5E8',
    fontSize: 17,
  },
  addButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    zIndex: 10,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  callIconContainer: {
    marginRight: 12,
  },
  callAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  callAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callInfo: {
    flex: 1,
    marginRight: 8,
  },
  callTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  callName: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  callTime: {
    color: '#8E8E93',
    fontSize: 14,
  },
  callBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callType: {
    color: '#8E8E93',
    fontSize: 13,
  },
  callDuration: {
    color: '#8E8E93',
    fontSize: 13,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
