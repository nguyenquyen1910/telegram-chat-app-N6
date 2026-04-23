import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { AvatarProps } from '@/types/chat';

const COLORS = [
  '#FF5E5E', '#FF925E', '#FFCA5E', '#73E952', '#52E9B4',
  '#52CAE9', '#5283E9', '#8A52E9', '#D952E9', '#E952A2'
];

function getHashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function Avatar({
  imageUrl,
  name,
  size = 'medium',
  isOnline = false,
  showOnlineIndicator = false,
}: AvatarProps) {
  const dimensions = {
    small: 36,
    medium: 52,
    large: 64,
  };
  const d = dimensions[size];

  const bgColor = useMemo(() => {
    return COLORS[getHashString(name || ' ') % COLORS.length];
  }, [name]);

  const initial = useMemo(() => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }, [name]);

  return (
    <View style={[styles.container, { width: d, height: d }]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: d, height: d, borderRadius: d / 2 }}
        />
      ) : (
        <View style={[styles.placeholder, { width: d, height: d, borderRadius: d / 2, backgroundColor: bgColor }]}>
          <Text style={[styles.initial, { fontSize: size === 'small' ? 16 : size === 'medium' ? 22 : 28 }]}>
            {initial}
          </Text>
        </View>
      )}

      {showOnlineIndicator && isOnline && (
        <View style={[styles.onlineIndicator, { 
          width: size === 'small' ? 10 : 14, 
          height: size === 'small' ? 10 : 14,
          borderRadius: size === 'small' ? 5 : 7,
          right: size === 'small' ? -1 : 0,
          bottom: size === 'small' ? -1 : 0,
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
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: '#FFF',
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: '#4DCD5E',
    borderWidth: 2,
    borderColor: '#FFF',
  },
});

export default React.memo(Avatar);
