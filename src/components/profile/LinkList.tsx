import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types/chat';
import { Timestamp } from 'firebase/firestore';

// Extract URL từ text
function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

// Lấy domain từ URL
function getDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Lấy chữ cái đầu của domain làm icon
function getDomainInitial(domain: string): string {
  return domain.charAt(0).toUpperCase();
}

// Màu ngẫu nhiên theo domain
function getDomainColor(domain: string): string {
  const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#FF5722', '#607D8B'];
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Group messages theo tháng
function groupByMonth(messages: Message[]): { title: string; data: Message[] }[] {
  const groups: { [key: string]: Message[] } = {};
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  for (const msg of messages) {
    try {
      const date = msg.createdAt.toDate();
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const title = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    } catch {
      // Skip invalid timestamps
    }
  }

  return Object.entries(groups).map(([, msgs]) => {
    const date = msgs[0].createdAt.toDate();
    const title = `${monthNames[date.getMonth()]}`;
    return { title, data: msgs };
  });
}

interface LinkListProps {
  linkMessages: Message[];
}

export default function LinkList({ linkMessages }: LinkListProps) {
  const grouped = useMemo(() => groupByMonth(linkMessages), [linkMessages]);

  if (linkMessages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="link-outline" size={48} color="#CCC" />
        <Text style={styles.emptyText}>Chưa có link nào</Text>
      </View>
    );
  }

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  // Flatten grouped data into a single list with section headers
  const flatData: ({ type: 'header'; title: string } | { type: 'item'; message: Message })[] = [];
  for (const group of grouped) {
    flatData.push({ type: 'header', title: group.title });
    for (const msg of group.data) {
      flatData.push({ type: 'item', message: msg });
    }
  }

  const renderItem = ({ item }: { item: typeof flatData[0] }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
      );
    }

    const msg = item.message;
    const url = extractUrl(msg.text || '');
    if (!url) return null;

    const domain = getDomain(url);
    const initial = getDomainInitial(domain);
    const color = getDomainColor(domain);

    // Lấy phần text không phải URL làm title
    const textWithoutUrl = (msg.text || '').replace(/https?:\/\/[^\s]+/gi, '').trim();
    const title = textWithoutUrl || domain;

    return (
      <TouchableOpacity
        style={styles.linkRow}
        activeOpacity={0.7}
        onPress={() => handleOpenLink(url)}
      >
        {/* Domain icon */}
        <View style={[styles.linkIcon, { backgroundColor: color }]}>
          <Text style={styles.linkInitial}>{initial}</Text>
        </View>

        {/* Link info */}
        <View style={styles.linkInfo}>
          <Text style={styles.linkTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.linkUrl} numberOfLines={1}>{url}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={flatData}
      renderItem={renderItem}
      keyExtractor={(item, index) => item.type === 'header' ? `header-${index}` : `link-${item.message.id}`}
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
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: '#F6F8F3',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  linkInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
    marginBottom: 3,
    lineHeight: 20,
  },
  linkUrl: {
    fontSize: 13,
    color: '#4CAF50',
    lineHeight: 18,
  },
});
