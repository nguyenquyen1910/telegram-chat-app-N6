import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubbleProps } from '@/types/chat';
import { formatMessageTime } from '@/constants/chat';
import ImageMessage from './ImageMessage';
import ReplyPreview from './ReplyPreview';

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
            fileName={message.fileName || 'Image'}
            fileSize={message.fileSize || 0}
            onPress={() => onImagePress?.(message.imageUrl!)}
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
            <Ionicons name="checkmark-done" size={14} color="#21C004" style={{ marginLeft: 3 }} />
          )}
          {isOutgoing && message.status === 'sent' && (
            <Ionicons name="checkmark" size={14} color="#21C004" style={{ marginLeft: 3 }} />
          )}
          {isOutgoing && message.status === 'sending' && (
            <Ionicons name="time-outline" size={12} color="#8E8E93" style={{ marginLeft: 3 }} />
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
    borderWidth: 0.5,
    borderColor: '#B5CADD',
  },
  outgoingBubble: {
    backgroundColor: '#E1FEC6',
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
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.4,
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
    fontStyle: 'italic',
    lineHeight: 13,
  },
  timeOutgoing: {
    color: '#2DA430',
  },
  timeIncoming: {
    color: '#8E8E93',
  },
});
