import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUE = '#037EE5';
const SECTION_BG = '#EFEFF4';
const ROW_BG = '#FFFFFF';
const SEPARATOR = 'rgba(60,60,67,0.29)';

// ─── Language Data ────────────────────────────────────────────────────────────

interface Language {
  id: string;
  name: string;
  native: string;
}

const ALL_LANGUAGES: Language[] = [
  { id: 'en',    name: 'English',             native: 'English' },
  { id: 'ar',    name: 'Arabic',              native: 'العربية' },
  { id: 'ca',    name: 'Catalan',             native: 'Català' },
  { id: 'nl',    name: 'Dutch',               native: 'Nederlands' },
  { id: 'fr',    name: 'French',              native: 'Français' },
  { id: 'de',    name: 'German',              native: 'Deutsch' },
  { id: 'id',    name: 'Indonesian',          native: 'Bahasa Indonesia' },
  { id: 'it',    name: 'Italian',             native: 'Italiano' },
  { id: 'ko',    name: 'Korean',              native: '한국어' },
  { id: 'ms',    name: 'Malay',               native: 'Bahasa Melayu' },
  { id: 'fa',    name: 'Persian',             native: 'فارسی' },
  { id: 'pt_br', name: 'Portuguese (Brazil)', native: 'Português (Brasil)' },
  { id: 'pt',    name: 'Portuguese',          native: 'Português' },
  { id: 'ru',    name: 'Russian',             native: 'Русский' },
  { id: 'es',    name: 'Spanish',             native: 'Español' },
  { id: 'tr',    name: 'Turkish',             native: 'Türkçe' },
  { id: 'uk',    name: 'Ukrainian',           native: 'Українська' },
  { id: 'vi',    name: 'Vietnamese',          native: 'Tiếng Việt' },
  { id: 'zh',    name: 'Chinese (Simplified)',native: '中文（简体）' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LanguageScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState('en');
  const [query, setQuery] = useState('');

  const filtered = query.trim() === ''
    ? ALL_LANGUAGES
    : ALL_LANGUAGES.filter(
        (l) =>
          l.name.toLowerCase().includes(query.toLowerCase()) ||
          l.native.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ── Navigation Bar ──────────────────────────────── */}
        <View style={styles.navBar}>
          {/* Left: Back */}
          <View style={styles.navBarSide}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={20} color={BLUE} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Center: Title */}
          <Text style={styles.navTitle}>Language</Text>

          {/* Right: placeholder */}
          <View style={styles.navBarSide} />
        </View>

        {/* ── Search Bar ──────────────────────────────────── */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="rgba(60,60,67,0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="rgba(60,60,67,0.6)"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {/* ── Language List ────────────────────────────────── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            {filtered.map((lang, i) => {
              const isSelected = lang.id === selected;
              const isLast = i === filtered.length - 1;
              return (
                <TouchableOpacity
                  key={lang.id}
                  activeOpacity={0.6}
                  style={[styles.row, !isLast && styles.rowBorder]}
                  onPress={() => {
                    setSelected(lang.id);
                    console.log('[Language] Selected:', lang.id);
                  }}
                >
                  {/* Text */}
                  <View style={styles.rowTexts}>
                    <Text style={styles.rowName}>{lang.name}</Text>
                    <Text style={styles.rowNative}>{lang.native}</Text>
                  </View>

                  {/* Checkmark */}
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={BLUE} />
                  )}
                </TouchableOpacity>
              );
            })}

            {filtered.length === 0 && (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No results for "{query}"</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SECTION_BG },
  safeArea: { flex: 1, backgroundColor: SECTION_BG },

  // ── Nav Bar
  navBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderBottomWidth: 0.33,
    borderBottomColor: '#A6A6AA',
    paddingHorizontal: 16,
  },
  navBarSide: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 17, color: BLUE, letterSpacing: -0.4 },
  navTitle: {
    fontSize: 17, fontWeight: '600', color: '#000',
    letterSpacing: -0.4, textAlign: 'center',
  },

  // ── Search
  searchWrap: {
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.33,
    borderBottomColor: '#A6A6AA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(118,118,128,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    letterSpacing: -0.4,
    paddingVertical: 0,
  },

  // ── List
  scroll: { flex: 1 },
  section: {
    backgroundColor: ROW_BG,
    marginTop: 16,
    borderTopWidth: 0.33,
    borderBottomWidth: 0.33,
    borderColor: SEPARATOR,
  },
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: ROW_BG,
  },
  rowBorder: { borderBottomWidth: 0.33, borderBottomColor: SEPARATOR },
  rowTexts: { flex: 1 },
  rowName: { fontSize: 17, color: '#000', letterSpacing: -0.4, fontWeight: '400' },
  rowNative: { fontSize: 13, color: '#000', letterSpacing: -0.1, marginTop: 1 },

  // ── Empty
  emptyWrap: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#8E8E93' },
});
