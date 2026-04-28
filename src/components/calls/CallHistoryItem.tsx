import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/calls/Avatar';
import { CallMetadata } from '@/types/chat';
import { CALL_UI } from '@/constants/calls';

interface CallHistoryItemProps {
  call: CallMetadata;
  onPress?: (call: CallMetadata) => void;
  userName?: string; // Display name for the other participant
  userAvatar?: string; // Avatar URL for the other participant
}

export const CallHistoryItem: React.FC<CallHistoryItemProps> = ({
  call,
  onPress,
  userName,
  userAvatar,
}) => {
  const getCallIcon = () => {
    if (call.status === 'missed') {
      return { name: 'call' as const, color: CALL_UI.DANGER_COLOR };
    }
    if (call.type === 'video') {
      return { name: 'videocam' as const, color: CALL_UI.PRIMARY_COLOR };
    }
    return { name: 'call' as const, color: CALL_UI.SUCCESS_COLOR };
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Không rõ';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hôm qua';
    } else if (days < 7) {
      const daysMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return daysMap[date.getDay()];
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  const icon = getCallIcon();
  const displayName = userName || call.callerId || 'Unknown';
  const isIncoming = call.direction === 'incoming';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(call)}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`Cuộc gọi ${isIncoming ? 'đến' : 'đi'} từ ${displayName}, ${call.status === 'missed' ? 'nhỡ' : call.type === 'video' ? 'video' : 'voice'}`}
    >
      <Avatar
        uri={userAvatar}
        name={displayName}
        size={40}
        showBorder={false}
      />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.details} numberOfLines={1}>
          {call.status === 'missed' ? 'Cuộc gọi nhỡ' :
           isIncoming ? 'Cuộc gọi đến' : 'Cuộc gọi đi'}
          {call.type === 'video' ? ' • Video' : ''}
          {formatDuration(call.duration) && ` • ${formatDuration(call.duration)}`}
        </Text>
      </View>

      <View style={styles.right}>
        <Ionicons name={icon.name} size={18} color={icon.color} />
        <Text style={styles.time}>{formatDate(call.startedAt)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  info: {
    flex: 1,
    marginRight: 8,
    marginLeft: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  details: {
    fontSize: 14,
    color: '#8E8E93',
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  time: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
});
