import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileActionsProps {
  onMessage: () => void;
  onMute: () => void;
  onCall: () => void;
  onVideoCall: () => void;
}

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

function ActionButton({ icon, label, onPress }: ActionButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionItem}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={22} color="#62AAEF" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ProfileActions({
  onMessage,
  onMute,
  onCall,
  onVideoCall,
}: ProfileActionsProps) {
  return (
    <View style={styles.container}>
      <ActionButton icon="chatbubble" label="Nhắn tin" onPress={onMessage} />
      <ActionButton icon="notifications-off" label="Tắt âm" onPress={onMute} />
      <ActionButton icon="call" label="Gọi" onPress={onCall} />
      <ActionButton icon="videocam" label="Video" onPress={onVideoCall} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#17212B',
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E2C3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    color: '#8E9BAA',
    fontSize: 12,
  },
});
