import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FilterTabsProps, ConversationFilter } from '@/types/chat';
import { TelegramColors } from '@/constants/colors';

const TABS: { id: ConversationFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'private', label: 'Cá nhân' },
  { id: 'group', label: 'Nhóm' },
];

function FilterTabs({ activeTab, onTabChange, counts }: FilterTabsProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts?.[tab.id] || 0;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabChange(tab.id)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label} {count > 0 ? `(${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  scroll: {
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: TelegramColors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: TelegramColors.primary,
    fontWeight: '600',
  },
});

export default React.memo(FilterTabs);
