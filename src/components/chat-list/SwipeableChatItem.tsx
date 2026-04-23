import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import ChatItem from './ChatItem';
import { ChatItemProps } from '@/types/chat';

export default function SwipeableChatItem({ item, onPress }: ChatItemProps) {
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionsContainer}>
        <View style={[styles.actionButton, { backgroundColor: '#C7C7CC' }]}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="notifications-off" size={24} color="#FFF" />
          </Animated.View>
        </View>
        <View style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="trash" size={24} color="#FFF" />
          </Animated.View>
        </View>
      </View>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [0, 0.8, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.leftActionsContainer}>
        <View style={[styles.actionButton, { backgroundColor: '#54A5E8' }]}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="chatbox-ellipses" size={24} color="#FFF" />
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      overshootRight={false}
      overshootLeft={false}
    >
      <ChatItem item={item} onPress={onPress} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rightActionsContainer: {
    flexDirection: 'row',
  },
  leftActionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
