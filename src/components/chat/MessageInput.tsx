import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
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

      {/* Input row - theo Figma Write Bar layout */}
      <View style={styles.inputRow}>
        {/* Sticker/Emoji button - 44x48 */}
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="happy-outline" size={26} color="#A8A8A8" />
        </TouchableOpacity>

        {/* Message field - fills remaining space */}
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
        </View>

        {/* Attach button - 44x48 */}
        <TouchableOpacity onPress={onSendImage} style={styles.iconButton}>
          <Ionicons
            name="attach"
            size={26}
            color="#A8A8A8"
            style={{ transform: [{ rotate: '-45deg' }] }}
          />
        </TouchableOpacity>

        {/* Voice or Send button - 44x48 */}
        {hasText ? (
          <TouchableOpacity onPress={handleSend} style={styles.iconButton}>
            <Ionicons name="send" size={22} color="#50A8EB" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="mic-outline" size={26} color="#A8A8A8" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 28,
  },
  iconButton: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    color: '#000000',
    lineHeight: 22,
    maxHeight: 100,
    paddingVertical: 0,
  },
});
