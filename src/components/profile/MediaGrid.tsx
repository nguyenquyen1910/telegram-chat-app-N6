import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types/chat';

interface MediaGridProps {
  messages: Message[];
  onImagePress?: (imageUrl: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 2;
const GRID_COLS = 3;
const GRID_ITEM = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS + 1)) / GRID_COLS;

export default function MediaGrid({ messages, onImagePress }: MediaGridProps) {
  if (messages.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="images-outline" size={48} color="#CCC" />
        <Text style={styles.emptyText}>Chưa có media nào</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {messages.map((item) => {
        const isVideo = !!(item.imageUrl?.includes('/video/upload/') || /\.(mp4|mov|avi|mkv|webm|3gp)$/i.test(item.fileName || ''));
        const thumb = isVideo ? item.imageUrl!.replace('/upload/', '/upload/so_0,w_400,c_fill,f_jpg/') : item.imageUrl;
        return (
          <TouchableOpacity key={item.id} style={styles.item} activeOpacity={0.8} onPress={() => onImagePress?.(item.imageUrl || '')}>
            <Image source={{ uri: thumb }} style={styles.image} resizeMode="cover" />
            {isVideo && (
              <View style={styles.videoIcon}>
                <Ionicons name="play" size={18} color="#FFF" style={{ marginLeft: 2 }} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: GRID_GAP / 2 },
  item: { width: GRID_ITEM, height: GRID_ITEM, margin: GRID_GAP / 2, position: 'relative' as const },
  image: { width: '100%', height: '100%' },
  videoIcon: {
    position: 'absolute', bottom: 6, left: 6, width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  emptyWrap: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { color: '#999', fontSize: 15, marginTop: 12 },
});
