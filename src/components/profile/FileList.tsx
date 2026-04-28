import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import { Message } from '@/types/chat';
import { getFileIcon } from '@/services/mediaService';

interface FileListProps {
  messages: Message[];
  onFilePress?: (fileUrl: string, fileName: string) => void;
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(ts: Timestamp): string {
  try {
    const d = ts.toDate();
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear().toString().slice(2)} lúc ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch { return ''; }
}

export default function FileList({ messages, onFilePress }: FileListProps) {
  if (messages.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="document-outline" size={48} color="#CCC" />
        <Text style={styles.emptyText}>Chưa có file nào</Text>
      </View>
    );
  }

  return (
    <View>
      {messages.map((item) => {
        const fileInfo = getFileIcon(item.fileName || '');
        return (
          <TouchableOpacity key={item.id} style={styles.fileRow} activeOpacity={0.7} onPress={() => onFilePress?.(item.imageUrl || '', item.fileName || 'File')}>
            <View style={[styles.fileIconBox, { backgroundColor: fileInfo.bg }]}>
              <Ionicons name={fileInfo.icon as any} size={24} color={fileInfo.color} />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{item.fileName || 'File'}</Text>
              <Text style={styles.fileMeta}>{formatFileSize(item.fileSize || 0)}, {formatDate(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  fileIconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: '500', color: '#222', marginBottom: 3 },
  fileMeta: { fontSize: 13, color: '#999' },
  emptyWrap: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { color: '#999', fontSize: 15, marginTop: 12 },
});
