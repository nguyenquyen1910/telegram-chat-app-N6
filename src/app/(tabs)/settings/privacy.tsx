import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SecurityItem {
  id: string;
  iconBg: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}

interface PrivacyItem {
  id: string;
  label: string;
  value: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SECURITY_ROWS: SecurityItem[] = [
  { id: 'blocked',      iconBg: '#FF3A2F', iconName: 'ban',          label: 'Blocked Users',        value: '9' },
  { id: 'sessions',     iconBg: '#FD9400', iconName: 'desktop',      label: 'Active Sessions',      value: '2' },
  { id: 'passcode',     iconBg: '#4CD964', iconName: 'scan',         label: 'Passcode & Face ID',   value: 'Off' },
  { id: 'two_step',     iconBg: '#1E94F8', iconName: 'key',          label: 'Two-Step Verification',value: 'On' },
];

const PRIVACY_ROWS: PrivacyItem[] = [
  { id: 'phone',     label: 'Phone Number',       value: 'My Contacts' },
  { id: 'lastseen',  label: 'Last Seen & Online', value: 'Nobody (+14)' },
  { id: 'photo',     label: 'Profile Photo',      value: 'Everybody' },
  { id: 'calls',     label: 'Voice Calls',        value: 'Nobody (+7)' },
  { id: 'fwd',       label: 'Forwarded Messages', value: 'Everybody' },
  { id: 'groups',    label: 'Groups & Channels',  value: 'Everybody' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChevronRight = () => (
  <Ionicons name="chevron-forward" size={17} color="rgba(60,60,67,0.3)" />
);

// Dòng security có icon màu
function SecurityRow({ item, isLast }: { item: SecurityItem; isLast: boolean }) {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={() => console.log('[Privacy] Security row pressed:', item.id)}
    >
      {/* Icon */}
      <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.iconName} size={18} color="#FFF" />
      </View>

      {/* Label */}
      <Text style={styles.rowLabel}>{item.label}</Text>

      {/* Trailing */}
      <View style={styles.rowTrail}>
        <Text style={styles.rowValue}>{item.value}</Text>
        <ChevronRight />
      </View>
    </TouchableOpacity>
  );
}

// Dòng privacy không có icon
function PrivacyRow({ item, isLast }: { item: PrivacyItem; isLast: boolean }) {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      style={[styles.row, styles.rowPad, !isLast && styles.rowBorder]}
      onPress={() => console.log('[Privacy] Privacy row pressed:', item.id)}
    >
      <Text style={styles.rowLabel}>{item.label}</Text>
      <View style={styles.rowTrail}>
        <Text style={styles.rowValue}>{item.value}</Text>
        <ChevronRight />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PrivacyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

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
                console.log('[Privacy] Back pressed');
                navigation.goBack();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={20} color="#037EE5" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Center: Title */}
          <Text style={styles.navTitle}>Privacy and Security</Text>

          {/* Right: placeholder */}
          <View style={styles.navBarSide} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Security Rows ─────────────────────────────── */}
          <View style={[styles.section, { marginTop: 16 }]}>
            {SECURITY_ROWS.map((item, i) => (
              <SecurityRow
                key={item.id}
                item={item}
                isLast={i === SECURITY_ROWS.length - 1}
              />
            ))}
          </View>

          {/* ── Privacy Section ───────────────────────────── */}
          <Text style={styles.sectionHeading}>PRIVACY</Text>
          <View style={styles.section}>
            {PRIVACY_ROWS.map((item, i) => (
              <PrivacyRow
                key={item.id}
                item={item}
                isLast={i === PRIVACY_ROWS.length - 1}
              />
            ))}
          </View>
          <Text style={styles.caption}>
            Change who can add you to groups and channels.
          </Text>

          {/* ── Automatically Delete My Account ───────────── */}
          <Text style={styles.sectionHeading}>AUTOMATICALLY DELETE MY ACCOUNT</Text>
          <View style={styles.section}>
            <TouchableOpacity
              activeOpacity={0.6}
              style={[styles.row, styles.rowPad]}
              onPress={() => console.log('[Privacy] If Away For pressed')}
            >
              <Text style={styles.rowLabel}>If Away For</Text>
              <View style={styles.rowTrail}>
                <Text style={styles.rowValue}>6 months</Text>
                <ChevronRight />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.caption}>
            If you do not come online at least once within this period, your
            account will be deleted along with all messages and contacts.
          </Text>

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

  // ── Row base
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ROW_BG,
    paddingRight: 16,
  },
  // Row với padding trái bình thường (không icon)
  rowPad: {
    paddingLeft: 16,
  },
  rowBorder: {
    borderBottomWidth: 0.33,
    borderBottomColor: SEPARATOR,
  },
  rowLabel: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    letterSpacing: -0.4,
    fontWeight: '400',
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

  // ── Icon box (Security rows)
  iconBox: {
    width: 29,
    height: 29,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
    marginRight: 12,
  },

  // ── Caption
  caption: {
    fontSize: 14,
    color: '#636366',
    letterSpacing: -0.15,
    lineHeight: 17,
    marginHorizontal: 16,
    marginTop: 8,
  },
});
