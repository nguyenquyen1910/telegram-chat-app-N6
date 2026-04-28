import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types/chat';
import { formatMessageTime } from '@/constants/chat';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

const EMOJI_LIST = ['😢', '🥰', '❤️', '👍', '👎', '🔥', '👏'];

interface MessageActionMenuProps {
  visible: boolean;
  message: Message | null;
  isOutgoing: boolean;
  onClose: () => void;
  onReply: (message: Message) => void;
  onCopy: (text: string) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onRevoke: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
}

export default function MessageActionMenu({
  visible,
  message,
  isOutgoing,
  onClose,
  onReply,
  onCopy,
  onEdit,
  onDelete,
  onRevoke,
  onReaction,
}: MessageActionMenuProps) {
  if (!message) return null;

  const timeStr = formatMessageTime(message.createdAt);
  const hasText = !!message.text && !message.isRevoked;
  const isTextMessage = message.type === 'text' || message.type === 'reply';

  const handleAction = (action: () => void) => {
    onClose();
    setTimeout(action, 150);
  };

  type ActionItem = {
    icon: string;
    label: string;
    onPress: () => void;
    danger?: boolean;
    show: boolean;
  };

  const actions: ActionItem[] = [
    {
      icon: 'arrow-undo-outline',
      label: 'Trả lời',
      onPress: () => handleAction(() => onReply(message)),
      show: !message.isRevoked,
    },
    {
      icon: 'copy-outline',
      label: 'Sao chép',
      onPress: () => handleAction(() => onCopy(message.text)),
      show: hasText,
    },
    {
      icon: 'create-outline',
      label: 'Sửa',
      onPress: () => handleAction(() => onEdit(message)),
      show: isOutgoing && isTextMessage && !message.isRevoked,
    },
    {
      icon: 'trash-outline',
      label: 'Xoá cho tôi',
      onPress: () => handleAction(() => onDelete(message.id)),
      show: true,
    },
    {
      icon: 'close-circle-outline',
      label: 'Thu hồi',
      onPress: () => handleAction(() => onRevoke(message.id)),
      danger: true,
      show: isOutgoing && !message.isRevoked,
    },
  ];

  const visibleActions = actions.filter((a) => a.show);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menuContainer} onStartShouldSetResponder={() => true}>
          {/* Emoji bar */}
          <View style={styles.emojiBar}>
            {EMOJI_LIST.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiBtn}
                onPress={() => {
                  onReaction(message.id, emoji);
                  onClose();
                }}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Message info */}
          <View style={styles.infoRow}>
            {isOutgoing && message.status === 'read' && (
              <Ionicons name="checkmark-done" size={14} color="#50A8EB" style={{ marginRight: 4 }} />
            )}
            <Text style={styles.infoText}>{timeStr}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action items */}
          {visibleActions.map((action, index) => (
            <TouchableOpacity
              key={action.label}
              style={[
                styles.actionItem,
                index === visibleActions.length - 1 && styles.actionItemLast,
              ]}
              onPress={action.onPress}
              activeOpacity={0.6}
            >
              <Ionicons
                name={action.icon as any}
                size={20}
                color={action.danger ? '#E53935' : '#333'}
                style={styles.actionIcon}
              />
              <Text style={[styles.actionLabel, action.danger && styles.actionLabelDanger]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.72,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  // ======= Emoji Bar =======
  emojiBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },
  emojiBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  // ======= Info Row =======
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#999',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#EFEFEF',
  },
  // ======= Actions =======
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  actionItemLast: {
    borderBottomWidth: 0,
  },
  actionIcon: {
    marginRight: 14,
    width: 22,
  },
  actionLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  actionLabelDanger: {
    color: '#E53935',
  },
});
