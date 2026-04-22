import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
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
        <Text style={styles.emptyText}>Chưa có media nào</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      onPress={() => onImagePress?.(item.imageUrl || '')}
      activeOpacity={0.8}
      style={{ width: ITEM_SIZE, height: ITEM_SIZE, margin: ITEM_MARGIN / 2 }}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#8E9BAA',
    fontSize: 15,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
