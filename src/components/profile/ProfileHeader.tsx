import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface ProfileHeaderProps {
  displayName: string;
  avatarUrl: string;
  lastSeen: string;
  isOnline: boolean;
}

export default function ProfileHeader({
  displayName,
  avatarUrl,
  lastSeen,
  isOnline,
}: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.status}>{isOnline ? 'trực tuyến' : lastSeen}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#17212B',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#54A5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '600',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  status: {
    color: '#8E9BAA',
    fontSize: 14,
    marginTop: 4,
  },
});
