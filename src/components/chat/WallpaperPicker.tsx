import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WALLPAPER_OPTIONS } from '@/hooks/useChatWallpaper';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_SIZE = (SCREEN_WIDTH - 60) / 3;

interface WallpaperPickerProps {
  visible: boolean;
  onClose: () => void;
  currentWallpaperId: string;
  onSelect: (id: string) => void;
}

export default function WallpaperPicker({
  visible,
  onClose,
  currentWallpaperId,
  onSelect,
}: WallpaperPickerProps) {
  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Chọn hình nền</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#222222" />
            </TouchableOpacity>
          </View>

          {/* Grid */}
          <ScrollView
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          >
            {WALLPAPER_OPTIONS.map((wp) => {
              const isSelected = wp.id === currentWallpaperId;
              return (
                <TouchableOpacity
                  key={wp.id}
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => handleSelect(wp.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.preview,
                      { backgroundColor: wp.colors[0] },
                    ]}
                  >
                    {wp.type === 'gradient' && wp.colors.length >= 2 && (
                      <View
                        style={[
                          StyleSheet.absoluteFill,
                          {
                            backgroundColor: wp.colors[1],
                            opacity: 0.6,
                            borderRadius: 10,
                          },
                        ]}
                      />
                    )}
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.label, isSelected && styles.labelSelected]} numberOfLines={1}>
                    {wp.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#D9D9D9',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  item: {
    width: ITEM_SIZE,
    alignItems: 'center',
  },
  itemSelected: {},
  preview: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#50A8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 6,
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
  },
  labelSelected: {
    color: '#50A8EB',
    fontWeight: '600',
  },
});
