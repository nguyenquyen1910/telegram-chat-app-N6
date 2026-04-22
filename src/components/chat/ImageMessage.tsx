import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ImageMessageProps } from '@/types/chat';
import { formatFileSize } from '@/constants/chat';

export default function ImageMessage({
  imageUrl,
  fileName,
  fileSize,
  onPress,
}: ImageMessageProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
      <Image source={{ uri: imageUrl }} style={styles.thumbnail} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
        <Text style={styles.fileSize}>{formatFileSize(fileSize)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  fileName: {
    color: '#3EAA3C',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  fileSize: {
    color: '#6FB26A',
    fontSize: 13,
    marginTop: 2,
    letterSpacing: -0.1,
  },
});
