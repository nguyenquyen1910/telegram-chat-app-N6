import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types/chat';

interface LinkListProps {
  messages: Message[];
}

function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s]+/i);
  return m ? m[0] : null;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function domainColor(domain: string): string {
  const c = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#FF5722', '#607D8B'];
  let h = 0;
  for (let i = 0; i < domain.length; i++) h = domain.charCodeAt(i) + ((h << 5) - h);
  return c[Math.abs(h) % c.length];
}

export default function LinkList({ messages }: LinkListProps) {
  if (messages.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="link-outline" size={48} color="#CCC" />
        <Text style={styles.emptyText}>Chưa có link nào</Text>
      </View>
    );
  }

  return (
    <View>
      {messages.map((item) => {
        const url = extractUrl(item.text || '');
        if (!url) return null;
        const domain = getDomain(url);
        const title = (item.text || '').replace(/https?:\/\/[^\s]+/gi, '').trim() || domain;
        return (
          <TouchableOpacity key={item.id} style={styles.linkRow} activeOpacity={0.7} onPress={() => Linking.openURL(url).catch(() => {})}>
            <View style={[styles.linkIcon, { backgroundColor: domainColor(domain) }]}>
              <Text style={styles.linkInitial}>{domain.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle} numberOfLines={2}>{title}</Text>
              <Text style={styles.linkUrl} numberOfLines={1}>{url}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linkRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  linkIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  linkInitial: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  linkInfo: { flex: 1 },
  linkTitle: { fontSize: 15, fontWeight: '500', color: '#222', marginBottom: 3, lineHeight: 20 },
  linkUrl: { fontSize: 13, color: '#4CAF50' },
  emptyWrap: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { color: '#999', fontSize: 15, marginTop: 12 },
});
