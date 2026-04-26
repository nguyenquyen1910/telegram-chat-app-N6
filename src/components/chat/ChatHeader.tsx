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
  onCallPress,
  onMenuPress,
}: ChatHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Back button - 48x48 touch area */}
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.navButton}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="chevron-back" size={28} color="#037EE5" />
          <Text style={styles.backText}>Tin nhắn</Text>
        </TouchableOpacity>

        {/* Avatar + Info */}
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
          <View style={styles.infoContainer}>
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={[styles.statusText, isOnline && styles.statusOnline]}>
              {isOnline ? 'trực tuyến' : lastSeen}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right action buttons */}
        <View style={styles.rightActions}>
          {/* Call button */}
          <TouchableOpacity
            onPress={onCallPress}
            style={styles.navButton}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="call-outline" size={22} color="#222222" />
          </TouchableOpacity>

          {/* More button */}
          <TouchableOpacity
            onPress={onMenuPress}
            style={styles.moreButton}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#222222" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F8F3',
    paddingTop: STATUSBAR_HEIGHT + 4,
    paddingBottom: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 43,
    height: 43,
    borderRadius: 36,
    backgroundColor: '#50A8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    color: '#222222',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  statusText: {
    color: '#A8A8A8',
    fontSize: 14,
    lineHeight: 16,
    marginTop: 1,
  },
  statusOnline: {
    color: '#50A8EB',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButton: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
