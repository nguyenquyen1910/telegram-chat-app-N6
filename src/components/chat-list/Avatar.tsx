import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const COLORS = [
  '#FF7B7B', '#E469C6', '#9B64E2', '#647DE2',
  '#54A5E8', '#54C5E8', '#52CD9F', '#7FD857',
  '#F4A349', '#F47B49'
];

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  isOnline?: boolean;
}

export function Avatar({ uri, name, size = 52, isOnline = false }: AvatarProps) {
  const getInitial = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const backgroundColor = useMemo(() => {
    if (!name) return COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
  }, [name]);

  const radius = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {uri ? (
        <Image 
          source={{ uri }} 
          style={[styles.image, { width: size, height: size, borderRadius: radius }]} 
        />
      ) : (
        <View 
          style={[
            styles.placeholder, 
            { width: size, height: size, borderRadius: radius, backgroundColor }
          ]}
        >
          <Text style={[styles.letter, { fontSize: size * 0.4 }]}>
            {getInitial(name)}
          </Text>
        </View>
      )}

      {isOnline && (
        <View style={[styles.onlineIndicator, { 
          bottom: size * 0.02, 
          right: size * 0.02,
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: (size * 0.28) / 2
        }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: '#E5E5EA',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    color: '#FFF',
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFF',
    zIndex: 1,
  },
});
