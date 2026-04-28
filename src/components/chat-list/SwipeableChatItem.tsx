import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { ChatItem, ChatWithUser } from './ChatItem';

interface SwipeableChatItemProps {
  chat: ChatWithUser;
  onPress: () => void;
  onDelete?: () => void;
  onMute?: () => void;
  onPin?: () => void;
  isMuted?: boolean;
  currentUid?: string | null;
}

export function SwipeableChatItem({ 
  chat, 
  onPress, 
  onDelete, 
  onMute, 
  onPin,
  isMuted,
  currentUid 
}: SwipeableChatItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const closeSwipeable = () => {
    swipeableRef.current?.close();
  };

  const handleDelete = () => {
    closeSwipeable();
    onDelete?.();
  };

  const handleMute = () => {
    closeSwipeable();
    onMute?.();
  };

  const renderRightActions = () => {
    return (
      <View style={styles.actionsContainer}>
        {onMute && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.muteBtn]} 
            onPress={handleMute}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isMuted ? "volume-high" : "volume-mute"} 
              size={22} 
              color="#FFF" 
            />
            <Text style={styles.actionLabel}>
              {isMuted ? 'Bật' : 'Tắt'}
            </Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.deleteBtn]} 
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={22} color="#FFF" />
            <Text style={styles.actionLabel}>Xóa</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <ChatItem chat={chat} currentUid={currentUid} onPress={onPress} isMuted={isMuted} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    width: 160,
  },
  actionBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  muteBtn: {
    backgroundColor: '#8E8E93',
  },
  deleteBtn: {
    backgroundColor: '#FF3B30',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});
