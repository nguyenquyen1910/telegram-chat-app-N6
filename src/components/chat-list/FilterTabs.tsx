import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Badge } from './Badge';

export type FilterTabType = 'all' | 'private' | 'group';

interface TabItem {
  id: FilterTabType;
  label: string;
  count?: number;
}

interface FilterTabsProps {
  tabs: TabItem[];
  activeTab: FilterTabType;
  onTabChange: (tab: FilterTabType) => void;
}

export function FilterTabs({ tabs, activeTab, onTabChange }: FilterTabsProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count !== undefined && tab.count > 0 && (
                <View style={styles.badgeContainer}>
                  <Badge count={tab.count} muted={!isActive} />
                </View>
              )}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#54A5E8', // Telegram blue
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#54A5E8',
    fontWeight: '600',
  },
  badgeContainer: {
    marginLeft: 6,
    transform: [{ scale: 0.85 }], // Slightly smaller badge on tabs
  },
});
