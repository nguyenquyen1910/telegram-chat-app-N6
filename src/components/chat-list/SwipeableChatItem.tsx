import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
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
}

export function SwipeableChatItem({ 
  chat, 
  onPress, 
  onDelete, 
  onMute, 
  onPin,
  isMuted 
}: SwipeableChatItemProps) {
  
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-150, -50, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.actionsContainer}>
        {onMute && (
          <Animated.View style={[styles.actionBtn, styles.muteBtn, { transform: [{ scale }] }]}>
            <Ionicons name={isMuted ? "volume-high" : "volume-mute"} size={26} color="#FFF" />
          </Animated.View>
        )}
        {onDelete && (
          <Animated.View style={[styles.actionBtn, styles.deleteBtn, { transform: [{ scale }] }]}>
            <Ionicons name="trash" size={26} color="#FFF" />
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      <ChatItem chat={chat} onPress={onPress} isMuted={isMuted} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    width: 150,
  },
  actionBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteBtn: {
    backgroundColor: '#C7C7CC', // Gray
  },
  deleteBtn: {
    backgroundColor: '#FF3B30', // Red
  },
});
