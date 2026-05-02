import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TelegramColors } from '@/constants/colors';

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
        <Text style={styles.infoLabel}>mobile</Text>
      </View>

      {bio && (
        <View style={styles.infoRow}>
          <Text style={styles.infoValue}>{bio}</Text>
          <Text style={styles.infoLabel}>bio</Text>
        </View>
      )}

      {username && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLink}>@{username}</Text>
          <Text style={styles.infoLabel}>username</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  infoRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  infoValue: {
    color: '#010101',
    fontSize: 16,
    fontWeight: '400',
  },
  infoLabel: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 4,
  },
  infoLink: {
    color: TelegramColors.primary,
    fontSize: 16,
    fontWeight: '400',
  },
});


