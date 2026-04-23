import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { BadgeProps } from '@/types/chat';

function Badge({ count, muted = false, style }: BadgeProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (count > 0) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 400 })
      );
    }
  }, [count, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count === 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: muted ? '#C7C7CC' : '#54A5E8' },
        style,
        animatedStyle,
      ]}
    >
      <Text style={styles.text}>{displayCount}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default React.memo(Badge);
