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
    backgroundColor: '#17212B',
    marginTop: 8,
  },
  infoRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#0E1621',
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  infoLabel: {
    color: '#8E9BAA',
    fontSize: 13,
    marginTop: 2,
  },
  infoLink: {
    color: '#62AAEF',
    fontSize: 16,
  },
});
