import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types/chat';
import { Timestamp } from 'firebase/firestore';

// Helper: icon và màu theo loại file
function getFileIcon(fileName: string): { icon: string; color: string; bg: string; label: string } {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'pdf':
      return { icon: 'document-text', color: '#E53935', bg: '#FFEBEE', label: 'PDF' };
    case 'doc': case 'docx':
      return { icon: 'document-text', color: '#1565C0', bg: '#E3F2FD', label: ext.toUpperCase() };
    case 'xls': case 'xlsx': case 'csv':
      return { icon: 'grid-outline', color: '#2E7D32', bg: '#E8F5E9', label: ext.toUpperCase() };
    case 'ppt': case 'pptx':
      return { icon: 'easel-outline', color: '#E65100', bg: '#FFF3E0', label: ext.toUpperCase() };
    case 'zip': case 'rar': case '7z': case 'tar': case 'gz':
      return { icon: 'file-tray-stacked', color: '#F9A825', bg: '#FFFDE7', label: ext.toUpperCase() };
    case 'mp3': case 'wav': case 'aac': case 'flac':
      return { icon: 'musical-notes', color: '#8E24AA', bg: '#F3E5F5', label: ext.toUpperCase() };
    case 'js': case 'ts': case 'jsx': case 'tsx':
      return { icon: 'code-slash', color: '#F9A825', bg: '#FFFDE7', label: ext.toUpperCase() };
    case 'json': case 'xml': case 'html': case 'css':
      return { icon: 'code-slash', color: '#3949AB', bg: '#E8EAF6', label: ext.toUpperCase() };
    case 'apk':
      return { icon: 'logo-android', color: '#43A047', bg: '#E8F5E9', label: 'APK' };
    default:
      return { icon: 'document-attach', color: '#50A8EB', bg: '#E3F2FD', label: ext.toUpperCase() || 'FILE' };
  }
}

function formatDate(timestamp: Timestamp): string {
  try {
    const date = timestamp.toDate();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} lúc ${hours}:${minutes}`;
  } catch {
    return '';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

interface FileListProps {
  fileMessages: Message[];
  onFilePress?: (fileUrl: string, fileName: string) => void;
}

export default function FileList({ fileMessages, onFilePress }: FileListProps) {
  if (fileMessages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-outline" size={48} color="#CCC" />
        <Text style={styles.emptyText}>Chưa có file nào</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Message }) => {
    const fileInfo = getFileIcon(item.fileName || '');

    return (
      <TouchableOpacity
        style={styles.fileRow}
        activeOpacity={0.7}
        onPress={() => onFilePress?.(item.imageUrl || '', item.fileName || 'File')}
      >
        {/* File icon */}
        <View style={[styles.fileIconBox, { backgroundColor: fileInfo.bg }]}>
          <Text style={[styles.fileIconLabel, { color: fileInfo.color }]}>{fileInfo.label}</Text>
        </View>

        {/* File info */}
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>{item.fileName || 'File'}</Text>
          <Text style={styles.fileMeta}>
            {formatFileSize(item.fileSize || 0)}, {formatDate(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={fileMessages}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
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
  listContent: {
    paddingHorizontal: 0,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileIconLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
    marginBottom: 3,
  },
  fileMeta: {
    fontSize: 13,
    color: '#999',
  },
});
