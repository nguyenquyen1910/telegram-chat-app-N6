import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatOptionsMenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress: () => void;
}

interface ChatOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onChangeWallpaper: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onSearch?: () => void;
  onAddContact?: () => void;
  conversationType?: 'private' | 'group';
  onAddMember?: () => void;
  onChangeGroupAvatar?: () => void;
  onRenameGroup?: () => void;
  onLeaveGroup?: () => void;
}

export default function ChatOptionsMenu({
  visible,
  onClose,
  onChangeWallpaper,
  isMuted = false,
  onToggleMute,
  onSearch,
  onAddContact,
  conversationType = 'private',
  onAddMember,
  onChangeGroupAvatar,
  onRenameGroup,
  onLeaveGroup,
}: ChatOptionsMenuProps) {
  const menuItems: ChatOptionsMenuItem[] = [];

  if (conversationType === 'group') {
    menuItems.push({
      id: 'add_member',
      icon: 'person-add-outline',
      label: 'Thêm thành viên',
      onPress: () => {
        onClose();
        setTimeout(() => onAddMember?.(), 300);
      },
    });
    menuItems.push({
      id: 'change_avatar',
      icon: 'camera-outline',
      label: 'Đổi ảnh nhóm',
      onPress: () => {
        onClose();
        setTimeout(() => onChangeGroupAvatar?.(), 300);
      },
    });
    menuItems.push({
      id: 'rename_group',
      icon: 'pencil-outline',
      label: 'Đổi tên nhóm',
      onPress: () => {
        onClose();
        setTimeout(() => onRenameGroup?.(), 300);
      },
    });
  } else {
    menuItems.push({
      id: 'add_contact',
      icon: 'person-add-outline',
      label: 'Thêm vào danh bạ',
      onPress: () => {
        onClose();
        setTimeout(() => onAddContact?.(), 300);
      },
    });
  }

  menuItems.push(
    {
      id: 'wallpaper',
      icon: 'image-outline',
      label: 'Đổi hình nền',
      onPress: () => {
        onClose();
        setTimeout(onChangeWallpaper, 300);
      },
    },
    {
      id: 'mute',
      icon: isMuted ? 'notifications-outline' : 'notifications-off-outline',
      label: isMuted ? 'Bật thông báo' : 'Tắt thông báo',
      onPress: () => {
        onClose();
        onToggleMute?.();
      },
    },
    {
      id: 'search',
      icon: 'search-outline',
      label: 'Tìm tin nhắn',
      onPress: () => {
        onClose();
        setTimeout(() => onSearch?.(), 300);
      },
    }
  );

  if (conversationType === 'group') {
    menuItems.push({
      id: 'leave_group',
      icon: 'log-out-outline',
      label: 'Rời nhóm',
      color: '#CC2929',
      onPress: () => {
        onClose();
        setTimeout(() => onLeaveGroup?.(), 300);
      },
    });
  } else {
    menuItems.push({
      id: 'clear',
      icon: 'trash-outline',
      label: 'Xóa cuộc trò chuyện',
      color: '#CC2929',
      onPress: () => {
        onClose();
      },
    });
  }

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={item.onPress}
              activeOpacity={0.6}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={item.color || '#222222'}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuLabel, item.color ? { color: item.color } : null]}>
                {item.label}
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 12,
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  menuIcon: {
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 16,
    color: '#222222',
    fontWeight: '400',
  },
});
