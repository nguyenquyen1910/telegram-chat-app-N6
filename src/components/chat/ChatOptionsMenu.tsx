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
}

export default function ChatOptionsMenu({
  visible,
  onClose,
  onChangeWallpaper,
}: ChatOptionsMenuProps) {
  const menuItems: ChatOptionsMenuItem[] = [
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
      icon: 'notifications-off-outline',
      label: 'Tắt thông báo',
      onPress: () => {
        onClose();
      },
    },
    {
      id: 'search',
      icon: 'search-outline',
      label: 'Tìm tin nhắn',
      onPress: () => {
        onClose();
      },
    },
    {
      id: 'clear',
      icon: 'trash-outline',
      label: 'Xóa cuộc trò chuyện',
      color: '#CC2929',
      onPress: () => {
        onClose();
      },
    },
  ];

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
