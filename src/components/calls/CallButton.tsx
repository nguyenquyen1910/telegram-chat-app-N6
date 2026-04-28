import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CallButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  iconColor?: string;
  backgroundColor?: string;
  onPress: () => void;
  style?: ViewStyle;
  iconStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const CallButton: React.FC<CallButtonProps> = ({
  icon,
  size = 28,
  iconColor = '#FFFFFF',
  backgroundColor = '#34C759',
  onPress,
  style,
  iconStyle,
  accessibilityLabel,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, style]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={size} color={iconColor} style={iconStyle} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
