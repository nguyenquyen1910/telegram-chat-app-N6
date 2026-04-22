import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReplyPreviewProps } from '@/types/chat';

export default function ReplyPreview({
  senderName,
  messageText,
  onCancel,
  isInBubble = false,
}: ReplyPreviewProps) {
  if (isInBubble) {
    return (
      <View style={styles.inBubbleContainer}>
        <View style={styles.blueLine} />
        <View style={styles.inBubbleContent}>
          <Text style={styles.senderName} numberOfLines={1}>{senderName}</Text>
          <Text style={styles.inBubbleText} numberOfLines={1}>{messageText}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.barContainer}>
      <View style={styles.barBlueLine} />
      <View style={styles.barContent}>
        <Text style={styles.senderName} numberOfLines={1}>{senderName}</Text>
        <Text style={styles.barText} numberOfLines={1}>{messageText}</Text>
      </View>
      {onCancel && (
        <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close-circle" size={22} color="#8E8E93" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  blueLine: {
    width: 2,
    backgroundColor: '#007AFF',
    borderRadius: 1,
    marginRight: 8,
  },
  inBubbleContent: {
    flex: 1,
  },
  senderName: {
    color: '#037EE5',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.15,
  },
  inBubbleText: {
    color: 'rgba(0,0,0,0.7)',
    fontSize: 14,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
  },
  barBlueLine: {
    width: 2,
    height: 36,
    backgroundColor: '#007AFF',
    borderRadius: 1,
    marginRight: 12,
  },
  barContent: {
    flex: 1,
  },
  barText: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 2,
  },
});
