import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Tạm thời dùng mock data, sau này thay bằng dữ liệu thật từ auth/API

const MOCK_USER = {
  name: 'Jacob W.',
  phone: '+1 202 555 0147',
  username: '@jacob_d',
  avatar: null as string | null,
};

const MOCK_ACCOUNTS = [
  { id: 'acc_1', name: 'Jacob Design', avatar: null as string | null },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingRowProps {
  iconBg: string;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
  onPress: () => void;
  isLast?: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChevronRight = () => (
  <Ionicons name="chevron-forward" size={17} color="rgba(60,60,67,0.3)" />
);

function SettingRow({
  iconBg,
  iconName,
  label,
  badge,
  onPress,
  isLast = false,
}: SettingRowProps) {
  return (
    <TouchableOpacity activeOpacity={0.6} style={styles.row} onPress={onPress}>
      {/* Icon box */}
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={18} color="#FFFFFF" />
      </View>

      {/* Label + border + trailing */}
      <View style={[styles.rowRight, !isLast && styles.rowRightBorder]}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowTrail}>
          {badge !== undefined && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
          <ChevronRight />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

// Chiều cao Tab Bar chuẩn của Expo tabs (83px) + padding thêm
const TAB_BAR_HEIGHT = 83;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ── Navigation Bar ─────────────────────────────── */}
        <View style={styles.navBar}>
          {/* Hàng tiêu đề */}
          <View style={styles.navTitleRow}>
            <Text style={styles.navTitle}>Settings</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/(tabs)/settings/edit-profile')}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.searchBar}
            onPress={() => console.log('[Settings] Search pressed')}
          >
            <Ionicons name="search" size={15} color="rgba(60,60,67,0.6)" />
            <Text style={styles.searchPlaceholder}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* ── Scrollable Content ─────────────────────────── */}
        {/*
          FIX 1: Dùng contentContainerStyle với paddingBottom để nội dung
          cuối cùng không bị Tab Bar che khuất khi cuộn tới cuối
        */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            // paddingBottom động = chiều cao tab bar thực tế + khoảng thở thêm
            { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Profile Info ─────────────────────────────── */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.profileRow}
            onPress={() =>
              console.log('[Settings] Profile pressed – user:', MOCK_USER.name)
            }
          >
            <View style={styles.avatarWrapper}>
              {MOCK_USER.avatar ? (
                <Image source={{ uri: MOCK_USER.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="person" size={36} color="#FFFFFF" />
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{MOCK_USER.name}</Text>
              <Text style={styles.profileSub}>{MOCK_USER.phone}</Text>
              <Text style={styles.profileSub}>{MOCK_USER.username}</Text>
            </View>

            <ChevronRight />
          </TouchableOpacity>

          {/* ── Row Accounts ─────────────────────────────── */}
          <View style={styles.section}>
            {/* Danh sách account khác (mock) */}
            {MOCK_ACCOUNTS.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                activeOpacity={0.6}
                style={styles.row}
                onPress={() =>
                  console.log('[Settings] Switch account pressed – id:', acc.id)
                }
              >
                <View style={[styles.iconBox, { backgroundColor: '#FF9500' }]}>
                  <Ionicons name="color-palette" size={18} color="#FFF" />
                </View>
                <View style={[styles.rowRight, styles.rowRightBorder]}>
                  <Text style={styles.rowLabel}>{acc.name}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Add Account */}
            <TouchableOpacity
              activeOpacity={0.6}
              style={styles.row}
              onPress={() => console.log('[Settings] Add Account pressed')}
            >
              <View style={[styles.iconBox, styles.iconBoxTransparent]}>
                <Ionicons name="add" size={22} color="#007AFF" />
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowLabel, styles.addAccountText]}>
                  Add Account
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Quick Links ──────────────────────────────── */}
          <View style={styles.section}>
            <SettingRow
              iconBg="#0A84FF"
              iconName="bookmark"
              label="Saved Messages"
              onPress={() => console.log('[Settings] Saved Messages pressed')}
            />
            <SettingRow
              iconBg="#34C759"
              iconName="call"
              label="Recent Calls"
              onPress={() => console.log('[Settings] Recent Calls pressed')}
            />
            <SettingRow
              iconBg="#FF9500"
              iconName="happy"
              label="Stickers"
              badge={15}
              isLast
              onPress={() => console.log('[Settings] Stickers pressed')}
            />
          </View>

          {/* ── Settings Rows ────────────────────────────── */}
          <View style={styles.section}>
            <SettingRow
              iconBg="#FF3B30"
              iconName="notifications"
              label="Notifications and Sounds"
              onPress={() =>
                console.log('[Settings] Notifications and Sounds pressed')
              }
            />
            <SettingRow
              iconBg="#8E8E93"
              iconName="lock-closed"
              label="Privacy and Security"
              onPress={() =>
                console.log('[Settings] Privacy and Security pressed')
              }
            />
            <SettingRow
              iconBg="#34C759"
              iconName="server"
              label="Data and Storage"
              onPress={() => console.log('[Settings] Data and Storage pressed')}
            />
            <SettingRow
              iconBg="#35AADB"
              iconName="brush"
              label="Appearance"
              isLast
              onPress={() => console.log('[Settings] Appearance pressed')}
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BLUE = '#037EE5';
const SECTION_BG = '#EFEFF4';
const ROW_BG = '#FFFFFF';
const SEPARATOR = 'rgba(60,60,67,0.29)';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SECTION_BG,
  },
  safeArea: {
    flex: 1,
    backgroundColor: SECTION_BG,
  },

  // ── Nav Bar
  navBar: {
    backgroundColor: '#F6F6F6',
    borderBottomWidth: 0.33,
    borderBottomColor: '#A6A6AA',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 36,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  editBtn: {
    position: 'absolute',
    right: 0,
    paddingVertical: 4,
  },
  editText: {
    fontSize: 17,
    color: BLUE,
    letterSpacing: -0.4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(118,118,128,0.12)',
    borderRadius: 10,
    paddingVertical: 7,
    gap: 6,
  },
  searchPlaceholder: {
    fontSize: 17,
    color: 'rgba(60,60,67,0.6)',
    letterSpacing: -0.4,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    // paddingBottom được tính động qua insets, xem ScrollView bên trên
  },

  // ── Profile
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ROW_BG,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.33,
    borderBottomWidth: 0.33,
    borderColor: SEPARATOR,
  },
  avatarWrapper: {
    width: 66,
    height: 66,
    borderRadius: 33,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatar: { width: 66, height: 66, borderRadius: 33 },
  avatarFallback: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#B0B0B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 19,
    fontWeight: '500',
    color: '#000',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  profileSub: {
    fontSize: 15,
    color: '#7E7E82',
    letterSpacing: -0.24,
    lineHeight: 20,
  },

  // ── Section card
  section: {
    backgroundColor: ROW_BG,
    marginTop: 20,
    borderTopWidth: 0.33,
    borderBottomWidth: 0.33,
    borderColor: SEPARATOR,
  },

  // ── Generic row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingLeft: 15,
    paddingRight: 15,
    backgroundColor: ROW_BG,
  },
  rowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingLeft: 12,
  },
  rowRightBorder: {
    borderBottomWidth: 0.33,
    borderBottomColor: SEPARATOR,
  },
  rowLabel: {
    fontSize: 17,
    color: '#000',
    letterSpacing: -0.4,
    fontWeight: '400',
  },
  rowTrail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // ── Icon box
  iconBox: {
    width: 29,
    height: 29,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxTransparent: {
    backgroundColor: 'transparent',
  },

  // ── Add Account
  addAccountText: { color: BLUE },

  // ── Badge
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 16,
  },
});
