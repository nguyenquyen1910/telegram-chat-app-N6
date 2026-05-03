import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VideoView as LKVideoView } from '@livekit/react-native';
import type { VideoTrack } from 'livekit-client';

interface VideoViewProps {
  track: VideoTrack;
  style?: any;
  mirror?: boolean;
}

export function VideoView({ track, style, mirror = false }: VideoViewProps) {
  return (
    <View style={[styles.container, style]}>
      <LKVideoView
        videoTrack={track}
        style={styles.video}
        mirror={mirror}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
});