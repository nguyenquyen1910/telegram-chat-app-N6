import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubbleProps } from '@/types/chat';
import { formatMessageTime } from '@/constants/chat';
import { formatFileSize, getFileIcon } from '@/services/mediaService';
import ReplyPreview from './ReplyPreview';
import VoiceMessage from './VoiceMessage';


export default function MessageBubble({
  message,
  isOutgoing,
  senderName,
  isHighlighted,
  currentUid,
  showSeenLabel,
  onLongPress,
  onImagePress,
  onFilePress,
}: MessageBubbleProps) {
  const timeStr = formatMessageTime(message.createdAt);
  const hasImage = !message.isRevoked && message.type === 'image' && message.imageUrl;
  const hasText = !message.isRevoked && !!message.text;
  const hasReply = !message.isRevoked && message.type === 'reply' && message.replyTo;
  const isFile = !message.isRevoked && message.type === 'file';

  // Detect video
  const isVideo = hasImage && (
    message.imageUrl!.includes('/video/upload/') ||
    /\.(mp4|mov|avi|mkv|webm|3gp)$/i.test(message.fileName || '')
  );

  // Video thumbnail
  const thumbnailUrl = isVideo
    ? message.imageUrl!.replace('/upload/', '/upload/so_0,w_400,c_fill,f_jpg/') 
    : message.imageUrl;

  // Dynamic image height: giữ nguyên tỉ lệ ảnh gốc
  const screenWidth = Dimensions.get('window').width;
  const imageContainerWidth = screenWidth * 0.8 - 16; // 80% screen - padding
  const imageHeight = (message.imageWidth && message.imageHeight && message.imageWidth > 0)
    ? Math.round((imageContainerWidth * message.imageHeight) / message.imageWidth)
    : 240; // fallback cho ảnh cũ chưa có kích thước
  // Giới hạn chiều cao tối thiểu và tối đa
  const clampedImageHeight = Math.max(120, Math.min(imageHeight, 400));

  const handleLongPress = () => {
    onLongPress?.(message);
  };

  // Reactions
  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([, uids]) => uids.length > 0);

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
        <Ionicons name="checkmark" size={14} color={light ? '#FFFFFF' : '#6DB870'} style={{ marginLeft: 3 }} />
      )}
      {isOutgoing && message.status === 'sending' && (
        <Ionicons name="time-outline" size={12} color={light ? '#FFFFFF' : '#A8A8A8'} style={{ marginLeft: 3 }} />
      )}
      {message.isEdited && !message.isRevoked && (
        <Text style={{ fontSize: 11, color: light ? '#ddd' : '#999', fontStyle: 'italic', marginLeft: 4 }}>đã sửa</Text>
      )}
    </View>
  );

  return (
    <View style={[styles.wrapper, isOutgoing ? styles.wrapperOutgoing : styles.wrapperIncoming]}>
      <View style={[styles.bubbleColumn, hasImage && styles.bubbleColumnImage]}>
        <TouchableOpacity
          onLongPress={handleLongPress}
          activeOpacity={0.8}
          delayLongPress={300}
          style={[
            styles.bubble,
            isOutgoing ? styles.outgoingBubble : styles.incomingBubble,
            hasImage && styles.imageBubble,
            isHighlighted && styles.highlightedBubble,
            message.isRevoked && styles.revokedBubble,
            hasReply && styles.replyBubble,
          ]}
        >
          {/* Revoked message */}
          {message.isRevoked && (
            <View style={{ paddingVertical: 2 }}>
              <Text style={styles.revokedText}>Tin nhắn đã thu hồi</Text>
              {renderTimeStatus()}
            </View>
          )}

          {/* Reply preview */}
          {!message.isRevoked && message.type === 'reply' && message.replyTo && (
            <ReplyPreview
              senderName={message.replyTo.senderName}
              messageText={message.replyTo.text}
              isInBubble
            />
          )}

          {/* Image/Video */}
          {hasImage && (
            <TouchableOpacity
              onPress={() => onImagePress?.(message.imageUrl!)}
              onLongPress={handleLongPress}
              delayLongPress={300}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: thumbnailUrl }}
                style={[
                  styles.image,
                  { height: clampedImageHeight },
                  !hasText && (isOutgoing ? styles.imageOnlyOutgoing : styles.imageOnlyIncoming),
                ]}
                resizeMode="cover"
              />
              {isVideo && (
                <View style={styles.playIconOverlay}>
                  <View style={styles.playIconCircle}>
                    <Ionicons name="play" size={28} color="#FFF" style={{ marginLeft: 3 }} />
                  </View>
                </View>
              )}
              {!hasText && (
                <View style={styles.imageTimeOverlay}>
                  {renderTimeStatus(true)}
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Voice message */}
          {!message.isRevoked && message.type === 'voice' && (
            <VoiceMessage
              duration={message.voiceDuration || 0}
              isOutgoing={isOutgoing}
            />
          )}

          {/* File message */}
          {isFile && (
            <TouchableOpacity
              style={styles.fileContainer}
              onPress={() => {
                if (message.imageUrl) {
                  onFilePress?.(message.imageUrl, message.fileName || 'File');
                }
              }}
              onLongPress={handleLongPress}
              delayLongPress={300}
              activeOpacity={0.7}
            >
              <View style={[styles.fileIconCircle, { backgroundColor: isOutgoing ? 'rgba(255,255,255,0.85)' : getFileIcon(message.fileName || '').bg }]}>
                <Ionicons
                  name={getFileIcon(message.fileName || '').icon as any}
                  size={24}
                  color={getFileIcon(message.fileName || '').color}
                />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {message.fileName || 'File'}
                </Text>
                <Text style={[styles.fileSize, isOutgoing && styles.fileSizeOutgoing]}>
                  {formatFileSize(message.fileSize || 0)}
                </Text>
              </View>
              <Ionicons name="download-outline" size={20} color={isOutgoing ? '#98D89B' : '#50A8EB'} />
            </TouchableOpacity>
          )}

          {/* Text + Time */}
          {hasText && (
            <View style={hasImage ? styles.captionContainer : undefined}>
              <Text style={styles.messageText}>
                {message.text}
              </Text>
              {renderTimeStatus()}
            </View>
          )}

          {/* Time cho voice/file không có text */}
          {!hasText && !hasImage && !message.isRevoked && (message.type === 'voice' || isFile) && (
            renderTimeStatus()
          )}
        </TouchableOpacity>

        {/* Emoji reactions — below bubble */}
        {reactionEntries.length > 0 && (
          <View style={[styles.reactionsRow, isOutgoing ? styles.reactionsRowOutgoing : styles.reactionsRowIncoming]}>
            {reactionEntries.map(([emoji, uids]) => {
              const isMine = currentUid ? uids.includes(currentUid) : false;
              return (
                <View key={emoji} style={[styles.reactionBadge, isMine && styles.reactionBadgeMine]}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  {uids.length > 1 && <Text style={styles.reactionCount}>{uids.length}</Text>}
                </View>
              );
            })}
          </View>
        )}

        {isOutgoing && showSeenLabel && <Text style={styles.seenLabel}>Đã xem</Text>}
      </View>
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
  bubbleColumn: {
    flexDirection: 'column',
    maxWidth: '80%',
  },
  bubble: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  replyBubble: {
    minWidth: '55%',
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
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  bubbleColumnImage: {
    width: '80%',
  },
  image: {
    width: '100%',
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
  // ======= Search Highlight =======
  highlightedBubble: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: '#FFFDE7',
  },
  // ======= Video Play Icon =======
  playIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ======= File Message =======
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    minWidth: 200,
  },
  fileIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fileIconCircleOutgoing: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  fileInfo: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222',
  },
  fileSize: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  fileSizeOutgoing: {
    color: '#98D89B',
  },
  // ======= Revoked Message =======
  revokedBubble: {
    opacity: 0.7,
  },
  revokedText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#999',
    letterSpacing: -0.2,
  },
  // ======= Reactions =======
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -4,
    marginBottom: 2,
  },
  reactionsRowOutgoing: {
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  reactionsRowIncoming: {
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  seenLabel: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 4,
    fontSize: 11,
    color: '#5F9B63',
    fontWeight: '500',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  reactionBadgeMine: {
    backgroundColor: '#E3F2FD',
    borderColor: '#90CAF9',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 3,
    fontWeight: '500',
  },
});
