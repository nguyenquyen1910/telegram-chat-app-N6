import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChevronRight = () => (
  <Ionicons name="chevron-forward" size={17} color="rgba(60,60,67,0.3)" />
);

// Dòng đơn giản chỉ có label + chevron
function LinkRow({
  label,
  value,
  subtitle,
  onPress,
  isLast = false,
}: {
  label: string;
  value?: string;
  subtitle?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      style={[styles.row, !isLast && styles.rowBorder, subtitle ? styles.rowTall : null]}
      onPress={onPress}
    >
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.rowTrail}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <ChevronRight />
      </View>
    </TouchableOpacity>
  );
}

// Dòng có Switch
function SwitchRow({
  label,
  value,
  onChange,
  isLast = false,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.row, styles.rowPad, !isLast && styles.rowBorder]}>
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E5E5EA', true: '#34C759' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E5E5EA"
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DataStorageScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Auto-Play Media
  const [autoPlayGifs, setAutoPlayGifs] = useState(false);
  const [autoPlayVideos, setAutoPlayVideos] = useState(false);

  // Other
  const [saveIncoming, setSaveIncoming] = useState(false);
  const [saveEdited, setSaveEdited] = useState(false);

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
              onPress={() => {
                console.log('[DataStorage] Back pressed');
                navigation.goBack();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={20} color="#037EE5" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Center: Title */}
          <Text style={styles.navTitle}>Data and Storage</Text>

          {/* Right: placeholder */}
          <View style={styles.navBarSide} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Storage / Network Usage ───────────────────── */}
          <View style={[styles.section, { marginTop: 16 }]}>
            <LinkRow
              label="Storage Usage"
              onPress={() => console.log('[DataStorage] Storage Usage pressed')}
            />
            <LinkRow
              label="Network Usage"
              onPress={() => console.log('[DataStorage] Network Usage pressed')}
              isLast
            />
          </View>

          {/* ── Automatic Media Download ──────────────────── */}
          <Text style={styles.sectionHeading}>AUTOMATIC MEDIA DOWNLOAD</Text>
          <View style={styles.section}>
            {/* Using Cellular */}
            <LinkRow
              label="Using Cellular"
              subtitle="Disabled"
              onPress={() => console.log('[DataStorage] Using Cellular pressed')}
            />
            {/* Using Wi-Fi */}
            <LinkRow
              label="Using Wi-Fi"
              subtitle="Disabled"
              onPress={() => console.log('[DataStorage] Using Wi-Fi pressed')}
            />
            {/* Reset — blue text, full-width row, no chevron */}
            <TouchableOpacity
              activeOpacity={0.6}
              style={[styles.row, styles.rowPad]}
              onPress={() => console.log('[DataStorage] Reset Auto-Download pressed')}
            >
              <Text style={styles.resetText}>Reset Auto-Download Settings</Text>
            </TouchableOpacity>
          </View>

          {/* ── Auto-Play Media ───────────────────────────── */}
          <Text style={styles.sectionHeading}>AUTO-PLAY MEDIA</Text>
          <View style={styles.section}>
            <SwitchRow
              label="GIFs"
              value={autoPlayGifs}
              onChange={(v) => {
                setAutoPlayGifs(v);
                console.log('[DataStorage] GIFs auto-play:', v);
              }}
            />
            <SwitchRow
              label="Videos"
              value={autoPlayVideos}
              onChange={(v) => {
                setAutoPlayVideos(v);
                console.log('[DataStorage] Videos auto-play:', v);
              }}
              isLast
            />
          </View>

          {/* ── Voice Calls ───────────────────────────────── */}
          <Text style={styles.sectionHeading}>VOICE CALLS</Text>
          <View style={styles.section}>
            <LinkRow
              label="Use Less Data"
              value="Never"
              onPress={() => console.log('[DataStorage] Use Less Data pressed')}
              isLast
            />
          </View>

          {/* ── Other ─────────────────────────────────────── */}
          <Text style={styles.sectionHeading}>OTHER</Text>
          <View style={styles.section}>
            <LinkRow
              label="Save Incoming Photos"
              onPress={() => console.log('[DataStorage] Save Incoming Photos pressed')}
            />
            <SwitchRow
              label="Save Edited Photos"
              value={saveEdited}
              onChange={(v) => {
                setSaveEdited(v);
                console.log('[DataStorage] Save Edited Photos:', v);
              }}
              isLast
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
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.4,
    textAlign: 'center',
  },

  // ── Scroll
  scroll: { flex: 1 },

  // ── Section heading
  sectionHeading: {
    fontSize: 14,
    color: '#636366',
    letterSpacing: -0.15,
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },

  // ── Section card
  section: {
    backgroundColor: ROW_BG,
    borderTopWidth: 0.33,
    borderBottomWidth: 0.33,
    borderColor: SEPARATOR,
  },

  // ── Row
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ROW_BG,
    paddingHorizontal: 16,
  },
  rowPad: {},
  rowTall: { minHeight: 56, paddingVertical: 9 },
  rowBorder: {
    borderBottomWidth: 0.33,
    borderBottomColor: SEPARATOR,
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: 17,
    color: '#000',
    letterSpacing: -0.4,
    fontWeight: '400',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    letterSpacing: -0.1,
    marginTop: 2,
  },
  rowTrail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    fontSize: 17,
    color: 'rgba(60,60,67,0.6)',
    letterSpacing: -0.4,
  },

  // ── Reset button (blue text)
  resetText: {
    fontSize: 17,
    color: BLUE,
    letterSpacing: -0.4,
    paddingVertical: 12,
  },
});
