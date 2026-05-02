import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { AuthUser } from '@/services/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AccountSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AccountSwitcherModal({ visible, onClose }: AccountSwitcherModalProps) {
  const { user, accounts, switchAccount, setAddingAccount } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleAddAccount = () => {
    onClose();
    setAddingAccount(true);
    router.push('/(auth)/phone');
  };

  const handleSwitch = async (uid: string) => {
    if (user?.uid === uid) {
      onClose();
      return;
    }
    await switchAccount(uid);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[s.menuContainer, { bottom: Math.max(insets.bottom, 8) + 60 }]}>
        
        {/* Add Account Option */}
        <TouchableOpacity style={s.menuItem} onPress={handleAddAccount}>
          <View style={s.iconWrap}>
            <Ionicons name="add" size={24} color="#000" />
          </View>
          <Text style={s.menuText}>Thêm tài khoản</Text>
        </TouchableOpacity>

        <View style={s.separator} />

        {/* List of Accounts */}
        {accounts.map((acc: AuthUser) => {
          const isActive = acc.uid === user?.uid;
          const avatar = acc.avatarUrl || acc.photoURL;
          
          return (
            <TouchableOpacity 
              key={acc.uid} 
              style={[s.menuItem, isActive && s.activeItem]} 
              onPress={() => handleSwitch(acc.uid)}
            >
              <View style={s.avatarWrap}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={s.avatar} />
                ) : (
                  <View style={s.avatarFallback}>
                    <Ionicons name="person" size={16} color="#FFF" />
                  </View>
                )}
              </View>
              <Text style={s.menuText} numberOfLines={1}>
                {acc.displayName || acc.username || acc.phoneNumber || 'Tài khoản'}
              </Text>
              {isActive && (
                <Ionicons name="checkmark" size={20} color="#037EE5" style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    right: 16,
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeItem: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  iconWrap: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarWrap: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#B0B0B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60,60,67,0.2)',
    marginVertical: 4,
  },
});
