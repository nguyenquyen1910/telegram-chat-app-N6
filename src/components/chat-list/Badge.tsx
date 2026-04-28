import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

interface BadgeProps {
  count: number;
  muted?: boolean;
}

export function Badge({ count, muted = false }: BadgeProps) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (count > 0) {
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      scale.setValue(0);
    }
  }, [count, scale]);

  if (count === 0) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        muted ? styles.muted : styles.active,
        { transform: [{ scale }] }
      ]}
    >
      <Text style={styles.text}>
        {count > 99 ? '99+' : count}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  active: {
    backgroundColor: '#54A5E8', // Telegram blue
  },
  muted: {
    backgroundColor: '#C7C7CC', // Gray for muted chats
  },
  text: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
