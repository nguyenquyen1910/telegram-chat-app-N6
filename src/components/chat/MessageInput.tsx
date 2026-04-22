import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageInputProps } from '@/types/chat';
import ReplyPreview from './ReplyPreview';

export default function MessageInput({
  onSendText,
  onSendImage,
  replyingTo,
  replyingSenderName,
  onCancelReply,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const hasText = text.trim().length > 0;

  const handleSend = () => {
    if (!hasText) return;
    onSendText(text.trim());
    setText('');
  };

  return (
    <View style={styles.container}>
      {/* Reply preview bar */}
      {replyingTo && (
        <ReplyPreview
          senderName={replyingSenderName || 'User'}
          messageText={replyingTo.type === 'image' ? '📷 Ảnh' : replyingTo.text}
          onCancel={onCancelReply}
        />
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        {/* Attach button */}
        <TouchableOpacity onPress={onSendImage} style={styles.iconButton}>
          <Ionicons name="attach" size={26} color="#858E99" style={{ transform: [{ rotate: '-45deg' }] }} />
        </TouchableOpacity>

        {/* Input field */}
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Tin nhắn"
            placeholderTextColor="#AEAEB2"
            value={text}
            onChangeText={setText}
            multiline
            returnKeyType="default"
          />
          {!hasText && (
            <TouchableOpacity style={styles.stickerButton}>
              <Ionicons name="happy-outline" size={22} color="#858E99" />
            </TouchableOpacity>
          )}
        </View>

        {/* Send or Mic */}
        {hasText ? (
          <TouchableOpacity onPress={handleSend} style={styles.iconButton}>
            <Ionicons name="send" size={24} color="#037EE5" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="mic-outline" size={26} color="#858E99" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F6F6',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(166,166,170,0.3)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 28,
  },
  iconButton: {
    padding: 6,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 16.5,
    marginHorizontal: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 33,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
    letterSpacing: -0.4,
    lineHeight: 22,
    maxHeight: 100,
    paddingVertical: 0,
  },
  stickerButton: {
    marginLeft: 4,
  },
});
