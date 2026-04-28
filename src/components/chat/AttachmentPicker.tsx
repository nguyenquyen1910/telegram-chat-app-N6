import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

type TabType = 'gallery' | 'file' | 'contact';

interface AttachmentPickerProps {
  visible: boolean;
  onClose: () => void;
  onPickImage: (uri: string, fileName: string) => void;
  onPickFile: (uri: string, fileName: string, fileSize: number, mimeType: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function AttachmentPicker({
  visible,
  onClose,
  onPickImage,
  onPickFile,
}: AttachmentPickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('gallery');

  const tabs: { id: TabType; icon: string; label: string }[] = [
    { id: 'gallery', icon: 'images', label: 'Bộ sưu tập' },
    { id: 'file', icon: 'document-text-outline', label: 'File' },
    { id: 'contact', icon: 'person-outline', label: 'Liên hệ' },
  ];

  const handlePickFromGallery = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép truy cập thư viện ảnh/video.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.7,
        allowsEditing: false,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        const fileName = asset.fileName || `${isVideo ? 'VID' : 'IMG'}_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
        onPickImage(asset.uri, fileName);
        onClose();
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh/video.');
    }
  }, [onPickImage, onClose]);

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onPickFile(
          asset.uri,
          asset.name || `FILE_${Date.now()}`,
          asset.size || 0,
          asset.mimeType || 'application/octet-stream'
        );
        onClose();
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn file.');
    }
  }, [onPickFile, onClose]);

  const renderGalleryTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.galleryAction} onPress={handlePickFromGallery}>
        <View style={styles.galleryIconCircle}>
          <Ionicons name="images-outline" size={32} color="#50A8EB" />
        </View>
        <Text style={styles.galleryActionText}>Chọn ảnh hoặc video</Text>
        <Text style={styles.gallerySubText}>Từ thư viện thiết bị</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.galleryAction}
        onPress={async () => {
          try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
              Alert.alert('Cần quyền camera', 'Vui lòng cho phép truy cập camera.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              quality: 0.7,
              allowsEditing: false,
            });
            if (!result.canceled && result.assets?.length > 0) {
              const asset = result.assets[0];
              const fileName = asset.fileName || `PHOTO_${Date.now()}.jpg`;
              onPickImage(asset.uri, fileName);
              onClose();
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể mở camera.');
          }
        }}
      >
        <View style={styles.galleryIconCircle}>
          <Ionicons name="camera-outline" size={32} color="#50A8EB" />
        </View>
        <Text style={styles.galleryActionText}>Chụp ảnh</Text>
        <Text style={styles.gallerySubText}>Mở camera</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFileTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.galleryAction} onPress={handlePickFile}>
        <View style={[styles.galleryIconCircle, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="document-attach-outline" size={32} color="#4CAF50" />
        </View>
        <Text style={styles.galleryActionText}>Chọn file</Text>
        <Text style={styles.gallerySubText}>PDF, DOC, ZIP, và nhiều loại khác</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContactTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.comingSoon}>
        <Ionicons name="construct-outline" size={48} color="#CCC" />
        <Text style={styles.comingSoonText}>Tính năng đang phát triển</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Tab bar */}
          <View style={styles.tabBar}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <View style={[
                  styles.tabIconWrapper,
                  activeTab === tab.id && styles.tabIconWrapperActive,
                ]}>
                  <Ionicons
                    name={tab.icon as any}
                    size={24}
                    color={activeTab === tab.id ? '#50A8EB' : '#999'}
                  />
                </View>
                <Text style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.tabLabelActive,
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          {activeTab === 'gallery' && renderGalleryTab()}
          {activeTab === 'file' && renderFileTab()}
          {activeTab === 'contact' && renderContactTab()}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    minHeight: 360,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  // ======= Tab Bar =======
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabItemActive: {},
  tabIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabIconWrapperActive: {
    backgroundColor: '#E3F2FD',
  },
  tabLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#50A8EB',
    fontWeight: '600',
  },
  // ======= Content =======
  tabContent: {
    padding: 20,
  },
  galleryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  galleryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  galleryActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
    flex: 1,
  },
  gallerySubText: {
    fontSize: 13,
    color: '#999',
    position: 'absolute',
    left: 72,
    bottom: 16,
  },
  // ======= Coming Soon =======
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  comingSoonText: {
    marginTop: 12,
    fontSize: 15,
    color: '#999',
  },
});
