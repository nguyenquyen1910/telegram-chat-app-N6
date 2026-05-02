import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TelegramColors } from '@/constants/colors';

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
    <TouchableOpacity onPress={onPress} style={styles.actionItem} activeOpacity={0.7}>
      <Ionicons name={icon} size={24} color={TelegramColors.primary} style={{ marginBottom: 6 }} />
      <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
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
      <ActionButton icon="chatbubble" label="message" onPress={onMessage} />
      <ActionButton icon="call" label="call" onPress={onCall} />
      <ActionButton icon="videocam" label="video" onPress={onVideoCall} />
      <ActionButton icon="notifications" label="mute" onPress={onMute} />
      <ActionButton icon="ellipsis-horizontal" label="more" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    justifyContent: 'space-between',
    gap: 8,
  },
  actionItem: {
    flex: 1,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    paddingHorizontal: 2,
  },
  actionLabel: {
    color: TelegramColors.primary,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});



