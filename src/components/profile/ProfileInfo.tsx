import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfileInfoProps {
  phoneNumber: string;
  bio?: string;
  username?: string;
}

export default function ProfileInfo({ phoneNumber, bio, username }: ProfileInfoProps) {
  return (
    <View style={styles.container}>
      <View style={styles.infoRow}>
        <Text style={styles.infoValue}>{phoneNumber}</Text>
        <Text style={styles.infoLabel}>Di động</Text>
      </View>

      {bio && (
        <View style={styles.infoRow}>
          <Text style={styles.infoValue}>{bio}</Text>
          <Text style={styles.infoLabel}>Tiểu sử</Text>
        </View>
      )}

      {username && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLink}>@{username}</Text>
          <Text style={styles.infoLabel}>Tên người dùng</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  infoValue: {
    color: '#010101',
    fontSize: 16,
  },
  infoLabel: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  infoLink: {
    color: '#4CAF50',
    fontSize: 16,
  },
});
