import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatHeaderProps } from '@/types/chat';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

export default function ChatHeader({
  userName,
  userAvatar,
  lastSeen,
  isOnline,
  onBackPress,
  onProfilePress,
}: ChatHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Back button */}
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color="#037EE5" />
          <Text style={styles.backText}>Tin nhắn</Text>
        </TouchableOpacity>

        {/* Center: Name + Status */}
        <TouchableOpacity
          onPress={onProfilePress}
          style={styles.centerInfo}
        >
          <Text style={styles.userName} numberOfLines={1}>
            {userName}
          </Text>
          <Text style={styles.statusText}>
            {isOnline ? 'trực tuyến' : lastSeen}
          </Text>
        </TouchableOpacity>

        {/* Right: Avatar */}
        <TouchableOpacity onPress={onProfilePress}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F6F6',
    paddingTop: STATUSBAR_HEIGHT + 4,
    paddingBottom: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(166,166,170,0.3)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -4,
  },
  backText: {
    color: '#037EE5',
    fontSize: 17,
    marginLeft: -2,
  },
  centerInfo: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  userName: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.4,
  },
  statusText: {
    color: '#787878',
    fontSize: 13,
    marginTop: 2,
  },
  avatar: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
  },
  avatarPlaceholder: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: '#54A5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
