import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TelegramColors } from '@/constants/colors';

export default function CallsScreen() {
  const handleAddCallPress = () => {
    console.log('Add call pressed');
  };

  return (
    <View style={styles.fullContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

        <View style={styles.header}>
          <View style={styles.leftSpacer} />

          <Text style={styles.headerTitle}>Cuộc gọi</Text>

          <TouchableOpacity onPress={handleAddCallPress} style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={28} color={TelegramColors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.emptyState}>
            <Ionicons name="call-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Lịch sử cuộc gọi sẽ hiển thị ở đây</Text>
            <Text style={styles.emptySubtext}>Chưa có cuộc gọi nào</Text>
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
  leftSpacer: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  addButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    zIndex: 10,
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
