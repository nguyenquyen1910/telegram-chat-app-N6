import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUE = '#037EE5';
const SECTION_BG = '#EFEFF4';
const ROW_BG = '#FFFFFF';
const SEPARATOR = 'rgba(60,60,67,0.29)';
const STEPS = 7; // 0..6

// ─── Types ────────────────────────────────────────────────────────────────────

type ThemeId = 'classic' | 'day' | 'night' | 'tinted';
type AppIconId = 'default' | 'default_x' | 'classic' | 'classic_x';

interface ThemeOption {
  id: ThemeId;
  label: string;
  bg: string;
  bubble1: string;
  bubble2: string;
}

interface AppIconOption {
  id: AppIconId;
  label: string;
  topColor: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const THEMES: ThemeOption[] = [
  { id: 'classic', label: 'Classic',     bg: '#CCE4F9', bubble1: '#FFFFFF', bubble2: '#E1FEC6' },
  { id: 'day',     label: 'Day',         bg: '#D4DDE6', bubble1: '#FFFFFF', bubble2: '#057AFE' },
  { id: 'night',   label: 'Night',       bg: '#000000', bubble1: '#202020', bubble2: '#313131' },
  { id: 'tinted',  label: 'Tinted Blue', bg: '#18222D', bubble1: '#213140', bubble2: '#3E6A97' },
];

const APP_ICONS: AppIconOption[] = [
  { id: 'default',   label: 'Default',   topColor: '#34B0DF' },
  { id: 'default_x', label: 'Default X', topColor: '#424D58' },
  { id: 'classic',   label: 'Classic',   topColor: '#34B0DF' },
  { id: 'classic_x', label: 'Classic X', topColor: '#424D58' },
];

// ─── Custom Dot Slider ────────────────────────────────────────────────────────

function DotSlider({
  steps,
  value,
  onChange,
}: {
  steps: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const [width, setWidth] = useState(0);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      if (width === 0) return;
      const x = evt.nativeEvent.locationX;
      const step = Math.round((x / width) * (steps - 1));
      onChange(Math.min(Math.max(step, 0), steps - 1));
    },
    onPanResponderMove: (evt) => {
      if (width === 0) return;
      const x = evt.nativeEvent.locationX;
      const step = Math.round((x / width) * (steps - 1));
      onChange(Math.min(Math.max(step, 0), steps - 1));
    },
  });

  const dots = Array.from({ length: steps });
  const filledFrac = value / (steps - 1);

  return (
    <View
      style={sliderStyles.track}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      {/* Filled rail */}
      <View style={[sliderStyles.railFilled, { flex: filledFrac }]} />
      {/* Unfilled rail */}
      <View style={[sliderStyles.railEmpty, { flex: 1 - filledFrac }]} />

      {/* Dots overlay */}
      <View style={sliderStyles.dotsOverlay}>
        {dots.map((_, i) => {
          const filled = i <= value;
          const isThumb = i === value;
          return (
            <View key={i} style={sliderStyles.dotWrap}>
              {isThumb ? (
                <View style={sliderStyles.thumb} />
              ) : (
                <View style={[sliderStyles.dot, filled ? sliderStyles.dotFilled : sliderStyles.dotEmpty]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  track: {
    flex: 1,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  railFilled: { height: 2, backgroundColor: BLUE },
  railEmpty: { height: 2, backgroundColor: '#BAB9BE' },
  dotsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotWrap: { alignItems: 'center', justifyContent: 'center', width: 12, height: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, borderWidth: 1.5, borderColor: '#FFF' },
  dotFilled: { backgroundColor: BLUE },
  dotEmpty: { backgroundColor: '#BAB9BE' },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChevronRight = () => (
  <Ionicons name="chevron-forward" size={17} color="rgba(60,60,67,0.3)" />
);

function ChatPreview() {
  return (
    <View style={previewStyles.container}>
      <View style={previewStyles.receivedWrap}>
        <View style={previewStyles.receivedBubble}>
          <View style={previewStyles.replyBar}>
            <View style={previewStyles.replyLine} />
            <View>
              <Text style={previewStyles.replyName}>Bob Harris</Text>
              <Text style={previewStyles.replyText}>Good morning! 👋</Text>
            </View>
          </View>
          <View style={previewStyles.bubbleRow}>
            <Text style={previewStyles.receivedText}>Do you know what time it is?</Text>
            <Text style={previewStyles.timestamp}>00:20</Text>
          </View>
        </View>
      </View>
      <View style={previewStyles.sentWrap}>
        <View style={previewStyles.sentBubble}>
          <View style={previewStyles.bubbleRow}>
            <Text style={previewStyles.sentText}>It's morning in Tokyo 😎</Text>
            <Text style={previewStyles.timestampGreen}>00:20 ✓✓</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ThemeCard({ theme, selected, onPress }: { theme: ThemeOption; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={themeStyles.wrapper}>
      <View style={[themeStyles.card, { backgroundColor: theme.bg }, selected ? themeStyles.cardSelected : themeStyles.cardIdle]}>
        <View style={[themeStyles.bubble, { backgroundColor: theme.bubble1 }]} />
        <View style={[themeStyles.bubble, themeStyles.bubbleRight, { backgroundColor: theme.bubble2 }]} />
      </View>
      <Text style={[themeStyles.label, selected && themeStyles.labelSelected]}>{theme.label}</Text>
    </TouchableOpacity>
  );
}

function AppIconCard({ icon, selected, onPress }: { icon: AppIconOption; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={iconStyles.wrapper}>
      <View style={[iconStyles.card, selected ? iconStyles.cardSelected : iconStyles.cardIdle, { backgroundColor: icon.topColor }]}>
        <Ionicons name="paper-plane" size={28} color="#FFF" style={{ transform: [{ rotate: '20deg' }] }} />
      </View>
      <Text style={[iconStyles.label, selected && iconStyles.labelSelected]}>{icon.label}</Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AppearanceScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('classic');
  const [textSizeStep, setTextSizeStep] = useState(2); // 0..6
  const [selectedIcon, setSelectedIcon] = useState<AppIconId>('default');

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Nav Bar */}
        <View style={styles.navBar}>
          <View style={styles.navBarSide}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="chevron-back" size={20} color={BLUE} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.navTitle}>Appearance</Text>
          <View style={[styles.navBarSide, styles.navBarRight]}>
            <TouchableOpacity onPress={() => console.log('[Appearance] Share')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="share-outline" size={22} color={BLUE} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}>

          {/* COLOR THEME */}
          <Text style={styles.sectionHeading}>COLOR THEME</Text>
          <ChatPreview />
          <View style={styles.themeStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeRow}>
              {THEMES.map((t) => (
                <ThemeCard key={t.id} theme={t} selected={selectedTheme === t.id}
                  onPress={() => setSelectedTheme(t.id)} />
              ))}
            </ScrollView>
          </View>

          {/* Rows */}
          <View style={[styles.section, { marginTop: 16 }]}>
            <TouchableOpacity activeOpacity={0.6} style={[styles.row, styles.rowBorder]}
              onPress={() => console.log('[Appearance] Chat Background')}>
              <Text style={styles.rowLabel}>Chat Background</Text>
              <ChevronRight />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.6} style={styles.row}
              onPress={() => console.log('[Appearance] Auto-Night Mode')}>
              <Text style={styles.rowLabel}>Auto-Night Mode</Text>
              <View style={styles.rowTrail}>
                <Text style={styles.rowValue}>Disabled</Text>
                <ChevronRight />
              </View>
            </TouchableOpacity>
          </View>

          {/* TEXT SIZE */}
          <Text style={styles.sectionHeading}>TEXT SIZE</Text>
          <View style={styles.section}>
            <View style={styles.textSizeRow}>
              <Text style={styles.textSizeSmall}>A</Text>
              <DotSlider steps={STEPS} value={textSizeStep}
                onChange={(v) => setTextSizeStep(v)} />
              <Text style={styles.textSizeLarge}>A</Text>
            </View>
          </View>

          {/* APP ICON */}
          <Text style={styles.sectionHeading}>APP ICON</Text>
          <View style={[styles.section, styles.iconSection]}>
            {APP_ICONS.map((icon) => (
              <AppIconCard key={icon.id} icon={icon} selected={selectedIcon === icon.id}
                onPress={() => setSelectedIcon(icon.id)} />
            ))}
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
  navBarRight: { alignItems: 'flex-end' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 17, color: BLUE, letterSpacing: -0.4 },
  navTitle: { fontSize: 17, fontWeight: '600', color: '#000', letterSpacing: -0.4, textAlign: 'center' },
  scroll: { flex: 1 },
  sectionHeading: {
    fontSize: 14, color: '#636366', letterSpacing: -0.15,
    textTransform: 'uppercase', marginHorizontal: 16, marginTop: 20, marginBottom: 0,
  },
  section: {
    backgroundColor: ROW_BG,
    borderTopWidth: 0.33,
    borderBottomWidth: 0.33,
    borderColor: SEPARATOR,
  },
  row: {
    height: 44, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: ROW_BG,
  },
  rowBorder: { borderBottomWidth: 0.33, borderBottomColor: SEPARATOR },
  rowLabel: { fontSize: 17, color: '#000', letterSpacing: -0.4 },
  rowTrail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { fontSize: 17, color: 'rgba(60,60,67,0.6)', letterSpacing: -0.4 },
  themeStrip: {
    backgroundColor: ROW_BG,
    borderTopWidth: 0.33, borderBottomWidth: 0.33, borderColor: SEPARATOR,
    paddingVertical: 12,
  },
  themeRow: { paddingHorizontal: 12, gap: 12, flexDirection: 'row' },
  textSizeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  textSizeSmall: { fontSize: 13, color: '#000' },
  textSizeLarge: { fontSize: 26, fontWeight: '300', color: '#000' },
  iconSection: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 16, gap: 8,
  },
});

const previewStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(43,120,205,0.5)',
    paddingHorizontal: 12, paddingVertical: 12,
    borderTopWidth: 0.33, borderBottomWidth: 0.33, borderColor: SEPARATOR, gap: 8,
  },
  receivedWrap: { alignItems: 'flex-start' },
  receivedBubble: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 0.33, borderColor: '#B5CADD', padding: 10, maxWidth: '78%',
  },
  replyBar: { flexDirection: 'row', marginBottom: 4, gap: 6 },
  replyLine: { width: 2.5, backgroundColor: '#007AFF', borderRadius: 1 },
  replyName: { fontSize: 13, fontWeight: '500', color: BLUE, letterSpacing: -0.15 },
  replyText: { fontSize: 13, color: '#000', letterSpacing: -0.15 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  receivedText: { fontSize: 16, color: '#000', letterSpacing: -0.4 },
  timestamp: { fontSize: 11, color: '#8E8E93', fontStyle: 'italic' },
  sentWrap: { alignItems: 'flex-end' },
  sentBubble: {
    backgroundColor: '#E1FEC6', borderRadius: 14,
    borderWidth: 0.33, borderColor: '#B5CADD', padding: 10, maxWidth: '80%',
  },
  sentText: { fontSize: 16, color: '#000', letterSpacing: -0.4 },
  timestampGreen: { fontSize: 11, color: '#2DA430', fontStyle: 'italic' },
});

const themeStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 6 },
  card: { width: 90, height: 62, borderRadius: 14, padding: 8, gap: 6, justifyContent: 'center' },
  cardSelected: { borderWidth: 2, borderColor: BLUE },
  cardIdle: { borderWidth: 1, borderColor: 'rgba(120,120,128,0.2)' },
  bubble: { height: 14, borderRadius: 7, width: '70%', alignSelf: 'flex-start', opacity: 0.8 },
  bubbleRight: { alignSelf: 'flex-end', width: '55%' },
  label: { fontSize: 12, color: '#000', textAlign: 'center' },
  labelSelected: { color: BLUE, fontWeight: '600' },
});

const iconStyles = StyleSheet.create({
  wrapper: { flex: 1, alignItems: 'center', gap: 6 },
  card: { width: 62, height: 62, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardSelected: { borderWidth: 2.5, borderColor: BLUE },
  cardIdle: { borderWidth: 1, borderColor: 'rgba(120,120,128,0.2)' },
  label: { fontSize: 12, color: '#000', textAlign: 'center' },
  labelSelected: { color: BLUE, fontWeight: '600' },
});
