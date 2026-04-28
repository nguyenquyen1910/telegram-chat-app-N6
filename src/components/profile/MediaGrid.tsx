import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types/chat';

interface MediaGridProps {
  mediaMessages: Message[];
  onImagePress?: (imageUrl: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_MARGIN = 2;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function MediaGrid({ mediaMessages, onImagePress }: MediaGridProps) {
  if (mediaMessages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={48} color="#CCC" />
        <Text style={styles.emptyText}>Chưa có media nào</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Message }) => {
    // Detect video
    const isVideo = item.imageUrl && (
      item.imageUrl.includes('/video/upload/') ||
      /\.(mp4|mov|avi|mkv|webm|3gp)$/i.test(item.fileName || '')
    );

    // Video thumbnail
    const thumbnailUrl = isVideo
      ? item.imageUrl!.replace('/upload/', '/upload/so_0,w_400,c_fill,f_jpg/')
      : item.imageUrl;

    return (
      <TouchableOpacity
        onPress={() => onImagePress?.(item.imageUrl || '')}
        activeOpacity={0.8}
        style={styles.itemContainer}
      >
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Video overlay icon */}
        {isVideo && (
          <View style={styles.videoOverlay}>
            <Ionicons name="play" size={20} color="#FFF" style={{ marginLeft: 2 }} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={mediaMessages}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={{ padding: ITEM_MARGIN / 2 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#999',
    fontSize: 15,
    marginTop: 12,
  },
  itemContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: ITEM_MARGIN / 2,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
