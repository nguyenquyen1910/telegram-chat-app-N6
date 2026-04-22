import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TelegramColors } from '@/constants/colors';

export default function SettingsScreen() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const userAvatar = null;

  const handleAvatarPress = () => {
    console.log('Avatar pressed');
  };

  const handleEditPress = () => {
    console.log('Edit pressed');
  };

  return (
    <View style={styles.fullContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

        <View style={styles.header}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarButton}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            ) : (
              <Ionicons name="person-circle" size={32} color="#8E8E93" />
            )}
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Cài đặt</Text>

          <TouchableOpacity onPress={handleEditPress} style={styles.editButton}>
            <Text style={styles.editText}>Sửa</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.emptyState}>
            <Ionicons name="settings-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Cài đặt sẽ được hiển thị ở đây</Text>
            <Text style={styles.emptySubtext}>Chưa có cài đặt nào</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 0,
    backgroundColor: '#F7F7F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    height: 44,
  },
  avatarButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    marginTop: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    zIndex: 10,
  },
  editText: {
    color: TelegramColors.primary,
    fontSize: 17,
    fontWeight: '400',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
});
