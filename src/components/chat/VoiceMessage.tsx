import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VoiceMessageProps {
  duration: number;
  isOutgoing: boolean;
}

export default function VoiceMessage({ duration, isOutgoing }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Tạo waveform bars giả
  const waveformBars = [3, 5, 8, 12, 7, 14, 10, 6, 11, 15, 8, 13, 5, 9, 12, 7, 4, 10, 14, 6, 8, 11, 5, 13, 9];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.playButton, isOutgoing ? styles.playButtonOutgoing : styles.playButtonIncoming]}
        onPress={() => setIsPlaying(!isPlaying)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={18}
          color={isOutgoing ? '#4ECC5E' : '#50A8EB'}
        />
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        {waveformBars.map((height, index) => (
          <View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: height,
                backgroundColor: isOutgoing
                  ? 'rgba(78, 204, 94, 0.6)'
                  : 'rgba(80, 168, 235, 0.6)',
              },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.duration, isOutgoing ? styles.durationOutgoing : styles.durationIncoming]}>
        {formatDuration(duration)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
    paddingVertical: 2,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  playButtonOutgoing: {
    backgroundColor: 'rgba(78, 204, 94, 0.15)',
  },
  playButtonIncoming: {
    backgroundColor: 'rgba(80, 168, 235, 0.15)',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1.5,
    height: 20,
  },
  waveformBar: {
    width: 2.5,
    borderRadius: 1.5,
    minHeight: 3,
  },
  duration: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '400',
  },
  durationOutgoing: {
    color: '#6DB870',
  },
  durationIncoming: {
    color: '#8E8E93',
  },
});
