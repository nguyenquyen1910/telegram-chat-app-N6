import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_STICKER_SETS = [
  {
    id: 'set_1',
    name: 'Simba',
    count: 25,
    emoji: '🦁',
    avatar: 'https://em-content.zobj.net/source/apple/354/lion_1f981.png',
  },
  {
    id: 'set_2',
    name: 'Diggy animated',
    count: 25,
    emoji: '🐑',
    avatar: 'https://em-content.zobj.net/source/apple/354/sheep_1f411.png',
  },
  {
    id: 'set_3',
    name: 'Ted',
    count: 25,
    emoji: '🐻',
    avatar: 'https://em-content.zobj.net/source/apple/354/bear_1f43b.png',
  },
  {
    id: 'set_4',
    name: 'Egg Yolk',
    count: 25,
    emoji: '🍳',
    avatar: 'https://em-content.zobj.net/source/apple/354/cooking_1f373.png',
  },
  {
    id: 'set_5',
    name: 'Screaming Checkin',
    count: 25,
    emoji: '🐓',
    avatar: 'https://em-content.zobj.net/source/apple/354/rooster_1f413.png',
  },
  {
    id: 'set_6',
    name: 'Melie the Cavy',
    count: 25,
    emoji: '🐹',
    avatar: 'https://em-content.zobj.net/source/apple/354/hamster_1f439.png',
  },
  {
    id: 'set_7',
    name: 'Tom & Jerry',
    count: 25,
    emoji: '🐱',
    avatar: 'https://em-content.zobj.net/source/apple/354/cat-face_1f431.png',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChevronRight = () => (
  <Ionicons name="chevron-forward" size={17} color="rgba(60,60,67,0.3)" />
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StickersScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [loopAnimated, setLoopAnimated] = useState(true);

  const handleBack = () => {
    console.log('[Stickers] Back pressed');
    navigation.goBack();
  };

  const handleEdit = () => {
    console.log('[Stickers] Edit pressed');
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
          <Text style={styles.navTitle}>Stickers</Text>

          {/* Right: Edit */}
          <View style={[styles.navBarSide, styles.navBarRight]}>
            <TouchableOpacity
              onPress={handleEdit}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Rows Section ─────────────────────────────── */}
          <View style={styles.section}>

            {/* Suggest by Emoji */}
            <TouchableOpacity
              activeOpacity={0.6}
              style={styles.row}
              onPress={() => console.log('[Stickers] Suggest by Emoji pressed')}
            >
              <Text style={styles.rowLabel}>Suggest by Emoji</Text>
              <View style={styles.rowTrail}>
                <Text style={styles.rowValue}>All Sets</Text>
                <ChevronRight />
              </View>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Trending Stickers */}
            <TouchableOpacity
              activeOpacity={0.6}
              style={styles.row}
              onPress={() => console.log('[Stickers] Trending Stickers pressed')}
            >
              <Text style={styles.rowLabel}>Trending Stickers</Text>
              <View style={styles.rowTrail}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>15</Text>
                </View>
                <ChevronRight />
              </View>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Archived Stickers */}
            <TouchableOpacity
              activeOpacity={0.6}
              style={styles.row}
              onPress={() => console.log('[Stickers] Archived Stickers pressed')}
            >
              <Text style={styles.rowLabel}>Archived Stickers</Text>
              <View style={styles.rowTrail}>
                <Text style={styles.rowValue}>46</Text>
                <ChevronRight />
              </View>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Masks */}
            <TouchableOpacity
              activeOpacity={0.6}
              style={styles.row}
              onPress={() => console.log('[Stickers] Masks pressed')}
            >
              <Text style={styles.rowLabel}>Masks</Text>
              <ChevronRight />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Loop Animated Stickers */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Loop Animated Stickers</Text>
              <Switch
                value={loopAnimated}
                onValueChange={(val) => {
                  setLoopAnimated(val);
                  console.log('[Stickers] Loop Animated Stickers:', val);
                }}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E5EA"
              />
            </View>
          </View>

          {/* Helper text */}
          <Text style={styles.helperText}>
            Animated stickers will play in chat continuously.
          </Text>

          {/* ── Sticker Sets Section ─────────────────────── */}
          <Text style={styles.sectionHeading}>STICKER SETS</Text>

          <View style={styles.section}>
            {MOCK_STICKER_SETS.map((set, index) => (
              <View key={set.id}>
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={styles.stickerSetRow}
                  onPress={() =>
                    console.log('[Stickers] Sticker set pressed:', set.name)
                  }
                >
                  {/* Avatar */}
                  <Image
                    source={{ uri: set.avatar }}
                    style={styles.stickerAvatar}
                    defaultSource={{ uri: `https://via.placeholder.com/44x44/EFEFF4/636366?text=${set.emoji}` }}
                  />

                  {/* Info */}
                  <View style={styles.stickerInfo}>
                    <Text style={styles.stickerName}>{set.name}</Text>
                    <Text style={styles.stickerCount}>{set.count} stickers</Text>
                  </View>
                </TouchableOpacity>

                {/* Separator */}
                {index < MOCK_STICKER_SETS.length - 1 && (
                  <View style={styles.stickerSeparator} />
                )}
              </View>
            ))}
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
  navBarRight: {
    alignItems: 'flex-end',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backText: {
    fontSize: 17,
    color: BLUE,
    letterSpacing: -0.4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  editText: {
    fontSize: 17,
    color: BLUE,
    letterSpacing: -0.4,
  },

  // ── Scroll
  scroll: { flex: 1 },

  // ── Section card
  section: {
    backgroundColor: ROW_BG,
    borderTopWidth: 0.33,
    borderBottomWidth: 0.33,
    borderColor: SEPARATOR,
    marginTop: 0,
  },

  // ── Generic row
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: ROW_BG,
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
  rowValue: {
    fontSize: 17,
    color: 'rgba(60,60,67,0.6)',
    letterSpacing: -0.4,
  },

  // ── Separator
  separator: {
    height: 0.33,
    backgroundColor: SEPARATOR,
    marginLeft: 16,
  },

  // ── Badge (Trending)
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
    textAlign: 'center',
    lineHeight: 16,
  },

  // ── Helper text
  helperText: {
    fontSize: 14,
    color: '#636366',
    letterSpacing: -0.15,
    lineHeight: 17,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
  },

  // ── Section heading
  sectionHeading: {
    fontSize: 14,
    color: '#636366',
    letterSpacing: -0.15,
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginBottom: 8,
  },

  // ── Sticker Set row
  stickerSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: ROW_BG,
    minHeight: 60,
  },
  stickerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFEFF4',
    marginRight: 12,
  },
  stickerInfo: {
    flex: 1,
  },
  stickerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  stickerCount: {
    fontSize: 14,
    color: '#8E8E93',
    letterSpacing: -0.2,
  },
  stickerSeparator: {
    height: 0.33,
    backgroundColor: SEPARATOR,
    marginLeft: 72, // căn từ sau avatar
  },
});
