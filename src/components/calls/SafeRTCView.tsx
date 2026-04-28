/**
 * SafeRTCView - Wraps RTCView from react-native-webrtc with graceful fallback.
 * When the native module is not available (e.g. Expo Go), renders a placeholder
 * instead of crashing the app.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface SafeRTCViewProps {
  streamURL: string;
  style?: ViewStyle;
  objectFit?: 'contain' | 'cover';
  mirror?: boolean;
}

let RTCViewComponent: React.ComponentType<any> | null = null;
let loadAttempted = false;

function getRTCView(): React.ComponentType<any> | null {
  if (!loadAttempted) {
    loadAttempted = true;
    try {
      const webrtc = require('react-native-webrtc');
      RTCViewComponent = webrtc.RTCView;
    } catch {
      RTCViewComponent = null;
    }
  }
  return RTCViewComponent;
}

export const SafeRTCView: React.FC<SafeRTCViewProps> = ({
  streamURL,
  style,
  objectFit = 'cover',
  mirror = false,
}) => {
  const RTCView = getRTCView();

  if (!RTCView) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>Video không khả dụng</Text>
        <Text style={styles.placeholderSub}>(Native module chưa được cài đặt)</Text>
      </View>
    );
  }

  return (
    <RTCView
      streamURL={streamURL}
      style={style}
      objectFit={objectFit}
      mirror={mirror}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginBottom: 4,
  },
  placeholderSub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
});
