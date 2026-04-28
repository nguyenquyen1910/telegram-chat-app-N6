import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CallHistoryItem } from '@/components/calls/CallHistoryItem';
import { useCall } from '@/hooks/useCall';
import { useAuth } from '@/hooks/useAuth';
import { getUsersByIds } from '@/services/userService';
import { CallMetadata, User } from '@/types/chat';

// Memoized list item to prevent unnecessary re-renders
const MemoCallHistoryItem = memo(CallHistoryItem);

export default function CallsScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { getCallHistory } = useCall(currentUser?.uid || '');
  const [callHistory, setCallHistory] = useState<CallMetadata[]>([]);
  const [profiles, setProfiles] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCallHistory = useCallback(async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    try {
      const history = await getCallHistory(currentUser.uid);
      setCallHistory(history);

      // Batch-fetch all participant profiles at once (avoids N+1)
      const userIds = new Set<string>();
      history.forEach(call => {
        if (call.callerId) userIds.add(call.callerId);
        if (call.calleeId) userIds.add(call.calleeId);
      });

      const fetchedProfiles = await getUsersByIds(Array.from(userIds));
      setProfiles(fetchedProfiles);
    } catch (error) {
      console.error('Failed to load call history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  // Note: `profiles` intentionally excluded from deps to avoid infinite loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCallHistory, currentUser?.uid]);

  useEffect(() => {
    loadCallHistory();
  }, [loadCallHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCallHistory();
  }, [loadCallHistory]);

  const handleCallPress = useCallback((call: CallMetadata) => {
    const otherUserId = call.callerId === currentUser?.uid ? call.calleeId : call.callerId;
    if (otherUserId) {
      router.push(`/(tabs)/chat/${otherUserId}`);
    }
  }, [currentUser?.uid, router]);

  // Stable item renderer — wrapped in useCallback to avoid FlatList re-renders
  const renderItem = useCallback(({ item }: { item: CallMetadata }) => {
    const otherUserId = item.callerId === currentUser?.uid ? item.calleeId : item.callerId;
    const profile = otherUserId ? profiles.get(otherUserId) : null;
    return (
      <MemoCallHistoryItem
        call={item}
        onPress={handleCallPress}
        userName={profile?.displayName || otherUserId || 'Unknown'}
        userAvatar={profile?.avatarUrl || ''}
      />
    );
  }, [profiles, currentUser?.uid, handleCallPress]);

  const keyExtractor = useCallback((item: CallMetadata) => item.id, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Lịch sử gọi</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <StatusBar style="dark" />
          {renderHeader()}
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
        <StatusBar style="dark" />
        {renderHeader()}

        {callHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="call-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Chưa có lịch sử gọi</Text>
          </View>
        ) : (
          <FlatList
            data={callHistory}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            ListHeaderComponent={() => <View style={styles.listHeaderSpacer} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F7F7F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  listHeaderSpacer: {
    height: 8,
    backgroundColor: '#F7F7F7',
  },
  listContent: {
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
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
});
