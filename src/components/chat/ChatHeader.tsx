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
  isGroup,
  onBackPress,
  onProfilePress,
  onCallPress,
  onMenuPress,
}: ChatHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Back button */}
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backButton}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="arrow-back" size={24} color="#222222" />
        </TouchableOpacity>

        {/* Avatar + Name + Status — chiếm hết giữa */}
        <TouchableOpacity
          onPress={onProfilePress}
          style={styles.profileSection}
          activeOpacity={0.7}
        >
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
          ) : isGroup ? (
            <View style={styles.avatarPlaceholderGroup}>
              <Ionicons name="people" size={24} color="#FFFFFF" />
            </View>
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

        {/* Right: Call + Menu — căn lề phải */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            onPress={onCallPress}
            style={styles.actionButton}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="call-outline" size={22} color="#222222" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onMenuPress}
            style={styles.actionButton}
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
  backButton: {
    width: 40,
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#50A8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderGroup: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#50A8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  infoContainer: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    color: '#222222',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  statusText: {
    color: '#A8A8A8',
    fontSize: 13,
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
  actionButton: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
