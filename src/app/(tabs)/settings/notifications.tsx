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

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotifSectionState {
  showNotifications: boolean;
  messagePreview: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChevronRight = () => (
  <Ionicons name="chevron-forward" size={17} color="rgba(60,60,67,0.3)" />
);

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
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
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

// Dòng có chevron + giá trị phụ
function LinkRow({
  label,
  value,
  onPress,
  isLast = false,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={onPress}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowTrail}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        <ChevronRight />
      </View>
    </TouchableOpacity>
  );
}

// Một nhóm section thông báo (Message / Group / Channel)
function NotifSection({
  heading,
  caption,
  state,
  exceptionsValue,
  tag,
  onToggleNotif,
  onTogglePreview,
  onSound,
  onExceptions,
}: {
  heading: string;
  caption: string;
  state: NotifSectionState;
  exceptionsValue: string;
  tag: string;
  onToggleNotif: (v: boolean) => void;
  onTogglePreview: (v: boolean) => void;
  onSound: () => void;
  onExceptions: () => void;
}) {
  return (
    <>
      <Text style={styles.sectionHeading}>{heading}</Text>
      <View style={styles.section}>
        <SwitchRow
          label="Show Notifications"
          value={state.showNotifications}
          onChange={onToggleNotif}
        />
        <SwitchRow
          label="Message Preview"
          value={state.messagePreview}
          onChange={onTogglePreview}
        />
        <LinkRow label="Sound" value="None" onPress={onSound} />
        <LinkRow
          label="Exceptions"
          value={exceptionsValue}
          onPress={onExceptions}
          isLast
        />
      </View>
      <Text style={styles.caption}>{caption}</Text>
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // "Show Notifications From" section
  const [allAccounts, setAllAccounts] = useState(true);

  // Message Notifications
  const [msgState, setMsgState] = useState<NotifSectionState>({
    showNotifications: true,
    messagePreview: false,
  });

  // Group Notifications
  const [groupState, setGroupState] = useState<NotifSectionState>({
    showNotifications: false,
    messagePreview: false,
  });

  // Channel Notifications
  const [channelState, setChannelState] = useState<NotifSectionState>({
    showNotifications: false,
    messagePreview: false,
  });

  const handleBack = () => {
    console.log('[Notifications] Back pressed');
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ── Navigation Bar ─────────────────────────────── */}
        <View style={styles.navBar}>
          {/* Left: Back */}
          <View style={styles.navBarSide}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={20} color="#037EE5" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Center: Title */}
          <Text style={styles.navTitle}>Notifications</Text>

          {/* Right: empty placeholder for symmetry */}
          <View style={styles.navBarSide} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Show Notifications From ────────────────────── */}
          <Text style={styles.sectionHeading}>SHOW NOTIFICATIONS FROM</Text>
          <View style={styles.section}>
            <SwitchRow
              label="All Accounts"
              value={allAccounts}
              onChange={(v) => {
                setAllAccounts(v);
                console.log('[Notifications] All Accounts:', v);
              }}
              isLast
            />
          </View>
          <Text style={styles.caption}>
            Turn this off if you want to receive notifications only from your active account.
          </Text>

          {/* ── Message Notifications ─────────────────────── */}
          <NotifSection
            heading="MESSAGE NOTIFICATIONS"
            caption="Set custom notifications for specific users."
            state={msgState}
            exceptionsValue="66 chats"
            tag="msg"
            onToggleNotif={(v) => {
              setMsgState((s) => ({ ...s, showNotifications: v }));
              console.log('[Notifications] Message – Show Notifications:', v);
            }}
            onTogglePreview={(v) => {
              setMsgState((s) => ({ ...s, messagePreview: v }));
              console.log('[Notifications] Message – Message Preview:', v);
            }}
            onSound={() => console.log('[Notifications] Message – Sound pressed')}
            onExceptions={() => console.log('[Notifications] Message – Exceptions pressed')}
          />

          {/* ── Group Notifications ───────────────────────── */}
          <NotifSection
            heading="GROUP NOTIFICATIONS"
            caption="Set custom notifications for specific groups."
            state={groupState}
            exceptionsValue="Add"
            tag="group"
            onToggleNotif={(v) => {
              setGroupState((s) => ({ ...s, showNotifications: v }));
              console.log('[Notifications] Group – Show Notifications:', v);
            }}
            onTogglePreview={(v) => {
              setGroupState((s) => ({ ...s, messagePreview: v }));
              console.log('[Notifications] Group – Message Preview:', v);
            }}
            onSound={() => console.log('[Notifications] Group – Sound pressed')}
            onExceptions={() => console.log('[Notifications] Group – Exceptions pressed')}
          />

          {/* ── Channel Notifications ─────────────────────── */}
          <NotifSection
            heading="CHANNEL NOTIFICATIONS"
            caption="Set custom notifications for specific channels."
            state={channelState}
            exceptionsValue="5 channels"
            tag="channel"
            onToggleNotif={(v) => {
              setChannelState((s) => ({ ...s, showNotifications: v }));
              console.log('[Notifications] Channel – Show Notifications:', v);
            }}
            onTogglePreview={(v) => {
              setChannelState((s) => ({ ...s, messagePreview: v }));
              console.log('[Notifications] Channel – Message Preview:', v);
            }}
            onSound={() => console.log('[Notifications] Channel – Sound pressed')}
            onExceptions={() => console.log('[Notifications] Channel – Exceptions pressed')}
          />

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
  navBarSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
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

  // ── Section heading (uppercase label)
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

  // ── Generic row
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: ROW_BG,
  },
  rowBorder: {
    borderBottomWidth: 0.33,
    borderBottomColor: SEPARATOR,
  },
  rowLabel: {
    fontSize: 17,
    color: '#000',
    letterSpacing: -0.4,
    fontWeight: '400',
    flex: 1,
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
