import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubbleProps } from '@/types/chat';
import { formatMessageTime } from '@/constants/chat';
import ImageMessage from './ImageMessage';
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

  const handleLongPress = () => {
    onReply?.(message);
  };

  return (
    <View style={[styles.wrapper, isOutgoing ? styles.wrapperOutgoing : styles.wrapperIncoming]}>
      <TouchableOpacity
        onLongPress={handleLongPress}
        activeOpacity={0.8}
        delayLongPress={300}
        style={[
          styles.bubble,
          isOutgoing ? styles.outgoingBubble : styles.incomingBubble,
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

        {/* Image message */}
        {message.type === 'image' && message.imageUrl && (
          <ImageMessage
            imageUrl={message.imageUrl}
            fileName={message.fileName || 'Ảnh'}
            fileSize={message.fileSize || 0}
            onPress={() => onImagePress?.(message.imageUrl!)}
          />
        )}

        {/* Voice message */}
        {message.type === 'voice' && (
          <VoiceMessage
            duration={message.voiceDuration || 0}
            isOutgoing={isOutgoing}
          />
        )}

        {/* Text content */}
        {message.text ? (
          <View style={styles.textRow}>
            <Text style={styles.messageText}>
              {message.text}
            </Text>
            {/* Invisible spacer for time */}
            <Text style={styles.timeSpacer}>
              {'  '}{timeStr}{isOutgoing ? ' ✓✓' : ''}
            </Text>
          </View>
        ) : null}

        {/* Time + Read status */}
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, isOutgoing ? styles.timeOutgoing : styles.timeIncoming]}>
            {timeStr}
          </Text>

          {isOutgoing && message.status === 'read' && (
            <Ionicons name="checkmark-done" size={14} color="#4ECC5E" style={{ marginLeft: 3 }} />
          )}
          {isOutgoing && message.status === 'sent' && (
            <Ionicons name="checkmark-done" size={14} color="#A8A8A8" style={{ marginLeft: 3 }} />
          )}
          {isOutgoing && message.status === 'delivered' && (
            <Ionicons name="checkmark-done" size={14} color="#A8A8A8" style={{ marginLeft: 3 }} />
          )}
          {isOutgoing && message.status === 'sending' && (
            <Ionicons name="time-outline" size={12} color="#A8A8A8" style={{ marginLeft: 3 }} />
          )}
        </View>
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
  textRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  messageText: {
    color: '#000000',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.3,
  },
  timeSpacer: {
    color: 'transparent',
    fontSize: 11,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: -14,
    marginBottom: -2,
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
});
