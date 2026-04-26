import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubbleProps } from '@/types/chat';
import { formatMessageTime } from '@/constants/chat';
import ReplyPreview from './ReplyPreview';
import VoiceMessage from './VoiceMessage';

export default function MessageBubble({
  message,
  isOutgoing,
  senderName,
  onReply,
  onImagePress,
}: MessageBubbleProps) {
  const timeStr = formatMessageTime(message.createdAt);
  const hasImage = message.type === 'image' && message.imageUrl;
  const hasText = !!message.text;

  const handleLongPress = () => {
    onReply?.(message);
  };

  // Render time + status (dùng chung)
  const renderTimeStatus = (light?: boolean) => (
    <View style={styles.timeRow}>
      <Text style={[
        styles.timeText,
        light ? styles.timeLight : (isOutgoing ? styles.timeOutgoing : styles.timeIncoming),
      ]}>
        {timeStr}
      </Text>
      {isOutgoing && message.status === 'read' && (
        <Ionicons name="checkmark-done" size={14} color={light ? '#FFFFFF' : '#4ECC5E'} style={{ marginLeft: 3 }} />
      )}
      {isOutgoing && message.status === 'sent' && (
        <Ionicons name="checkmark" size={14} color={light ? '#FFFFFF' : '#A8A8A8'} style={{ marginLeft: 3 }} />
      )}
      {isOutgoing && message.status === 'delivered' && (
        <Ionicons name="checkmark-done" size={14} color={light ? '#FFFFFF' : '#A8A8A8'} style={{ marginLeft: 3 }} />
      )}
      {isOutgoing && message.status === 'sending' && (
        <Ionicons name="time-outline" size={12} color={light ? '#FFFFFF' : '#A8A8A8'} style={{ marginLeft: 3 }} />
      )}
    </View>
  );

  return (
    <View style={[styles.wrapper, isOutgoing ? styles.wrapperOutgoing : styles.wrapperIncoming]}>
      <TouchableOpacity
        onLongPress={handleLongPress}
        activeOpacity={0.8}
        delayLongPress={300}
        style={[
          styles.bubble,
          isOutgoing ? styles.outgoingBubble : styles.incomingBubble,
          hasImage && styles.imageBubble,
        ]}
      >
        {/* Reply preview */}
        {message.type === 'reply' && message.replyTo && (
          <ReplyPreview
            senderName={message.replyTo.senderName}
            messageText={message.replyTo.text}
            isInBubble
          />
        )}

        {/* Image — chiếm toàn bộ chiều rộng bubble */}
        {hasImage && (
          <TouchableOpacity
            onPress={() => onImagePress?.(message.imageUrl!)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: message.imageUrl }}
              style={[
                styles.image,
                !hasText && (isOutgoing ? styles.imageOnlyOutgoing : styles.imageOnlyIncoming),
              ]}
              resizeMode="cover"
            />
            {/* Nếu chỉ có ảnh (không text), hiện time overlay trên ảnh */}
            {!hasText && (
              <View style={styles.imageTimeOverlay}>
                {renderTimeStatus(true)}
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Voice message */}
        {message.type === 'voice' && (
          <VoiceMessage
            duration={message.voiceDuration || 0}
            isOutgoing={isOutgoing}
          />
        )}

        {/* Text content + Time (cùng 1 flow, không duplicate) */}
        {hasText && (
          <View style={hasImage ? styles.captionContainer : undefined}>
            <Text style={styles.messageText}>
              {message.text}
            </Text>
            {renderTimeStatus()}
          </View>
        )}

        {/* Time cho voice/reply không có text */}
        {!hasText && !hasImage && (message.type === 'voice') && (
          renderTimeStatus()
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingHorizontal: 8,
  },
  wrapperOutgoing: {
    justifyContent: 'flex-end',
  },
  wrapperIncoming: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  outgoingBubble: {
    backgroundColor: '#EEFFDE',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  incomingBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 4,
  },
  // ======= Image Bubble =======
  imageBubble: {
    width: '80%',
    maxWidth: '80%',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 240,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  imageOnlyOutgoing: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  imageOnlyIncoming: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 16,
  },
  imageTimeOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  // ======= Caption (text dưới ảnh) =======
  captionContainer: {
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 5,
  },
  messageText: {
    color: '#000000',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.3,
  },
  // ======= Time Row =======
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    lineHeight: 13,
  },
  timeOutgoing: {
    color: '#6DB870',
  },
  timeIncoming: {
    color: '#8E8E93',
  },
  timeLight: {
    color: '#FFFFFF',
  },
});
