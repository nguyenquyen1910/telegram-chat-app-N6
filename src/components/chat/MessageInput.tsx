import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageInputProps } from '@/types/chat';
import ReplyPreview from './ReplyPreview';

export default function MessageInput({
  onSendText,
  onAttach,
  onSendImage,
  pendingImage,
  onCancelImage,
  replyingTo,
  replyingSenderName,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSaveEdit,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const hasText = text.trim().length > 0;
  const hasPendingImage = !!pendingImage;

  // Fill text when editing starts
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || '');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [editingMessage]);

  const handleSend = () => {
    // Editing mode — save edit
    if (editingMessage) {
      if (hasText) {
        onSaveEdit(editingMessage.id, text.trim());
        setText('');
      }
      return;
    }

    if (hasPendingImage) {
      onSendImage(pendingImage!.uri, pendingImage!.fileName, text.trim());
      setText('');
      return;
    }

    if (!hasText) return;
    onSendText(text.trim());
    setText('');
  };

  return (
    <View style={styles.container}>
      {/* Edit preview bar */}
      {editingMessage && (
        <View style={styles.editBar}>
          <View style={styles.editBarLine} />
          <View style={styles.editBarContent}>
            <Text style={styles.editBarLabel}>Đang sửa tin nhắn</Text>
            <Text style={styles.editBarText} numberOfLines={1}>{editingMessage.text}</Text>
          </View>
          <TouchableOpacity onPress={() => { onCancelEdit(); setText(''); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={22} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      )}

      {/* Reply preview bar */}
      {!editingMessage && replyingTo && (
        <ReplyPreview
          senderName={replyingSenderName || 'User'}
          messageText={replyingTo.type === 'image' ? '📷 Ảnh' : replyingTo.text}
          onCancel={onCancelReply}
        />
      )}

      {/* Image preview bar - Telegram style */}
      {hasPendingImage && (
        <View style={styles.imagePreviewBar}>
          <Image source={{ uri: pendingImage!.uri }} style={styles.previewThumb} />
          <View style={styles.previewInfo}>
            <Text style={styles.previewLabel}>Ảnh</Text>
            <Text style={styles.previewFileName} numberOfLines={1}>
              {pendingImage!.fileName}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelImage} style={styles.previewCancel}>
            <Ionicons name="close-circle" size={22} color="#A8A8A8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input row - Telegram Write Bar layout */}
      <View style={styles.inputRow}>
        {/* Sticker/Emoji button */}
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="happy-outline" size={26} color="#A8A8A8" />
        </TouchableOpacity>

        {/* Message field */}
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder={hasPendingImage ? 'Thêm chú thích...' : 'Tin nhắn'}
            placeholderTextColor="#AEAEB2"
            value={text}
            onChangeText={setText}
            multiline
            returnKeyType="default"
          />
        </View>

        {/* Attach button */}
        <TouchableOpacity onPress={onAttach} style={styles.iconButton}>
          <Ionicons
            name="attach"
            size={26}
            color="#A8A8A8"
            style={{ transform: [{ rotate: '-45deg' }] }}
          />
        </TouchableOpacity>

        {/* Voice or Send button */}
        {hasText || hasPendingImage ? (
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Ionicons name="send" size={20} color="#FFFFFF" />
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
  // ======= Image Preview =======
  imagePreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#F9F9F9',
  },
  previewThumb: {
    width: 42,
    height: 42,
    borderRadius: 6,
    marginRight: 10,
  },
  previewInfo: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#50A8EB',
  },
  previewFileName: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 1,
  },
  previewCancel: {
    padding: 4,
  },
  // ======= Input Row =======
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 8,
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
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#50A8EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  // ======= Edit Bar =======
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
  },
  editBarLine: {
    width: 2,
    height: 36,
    backgroundColor: '#50A8EB',
    borderRadius: 1,
    marginRight: 12,
  },
  editBarContent: {
    flex: 1,
  },
  editBarLabel: {
    color: '#50A8EB',
    fontSize: 14,
    fontWeight: '500',
  },
  editBarText: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 2,
  },
});
