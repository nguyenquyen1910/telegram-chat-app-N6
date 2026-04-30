import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  Image, Animated, Dimensions, Platform, PanResponder, Modal, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { loadProfile } from '@/services/profileService';
import { uploadAvatar, removeAvatar } from '@/services/avatarService';
import { formatPhoneNumber } from '@/utils/format';

const { width: SW, height: SH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 83;
const HERO_MIN = 190;   // chiều cao thu gọn
const HERO_MAX = SH * 0.48; // chiều cao mở rộng

// ─── SettingRow ───────────────────────────────────────────────────────────────

interface RowProps {
  iconBg: string; iconName: keyof typeof Ionicons.glyphMap;
  label: string; trailingText?: string; badge?: number | string;
  badgeStyle?: 'number' | 'new'; onPress: () => void; isLast?: boolean;
}
function SettingRow({ iconBg, iconName, label, trailingText, badge, badgeStyle = 'number', onPress, isLast = false }: RowProps) {
  return (
    <TouchableOpacity activeOpacity={0.6} style={s.row} onPress={onPress}>
      <View style={[s.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={18} color="#FFF" />
      </View>
      <View style={[s.rowRight, !isLast && s.rowBorder]}>
        <View style={s.rowLabelRow}>
          <Text style={s.rowLabel}>{label}</Text>
          {badgeStyle === 'new' && badge != null && (
            <View style={s.newBadge}><Text style={s.newBadgeText}>MỚI</Text></View>
          )}
        </View>
        <View style={s.rowTrail}>
          {trailingText != null && <Text style={s.trailing}>{trailingText}</Text>}
          {badgeStyle === 'number' && badge != null && <Text style={s.trailing}>{badge}</Text>}
          <Ionicons name="chevron-forward" size={17} color="rgba(60,60,67,0.3)" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser, updateAvatarUrl } = useAuth();
  const [username, setUsername] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [uploading, setUploading] = useState(false);

  const profileName = user?.displayName || 'User';
  const profilePhone = formatPhoneNumber(user?.phoneNumber || '');
  const profileAvatar = user?.avatarUrl || user?.photoURL || null;
  const subLine = [profilePhone, username ? `@${username}` : ''].filter(Boolean).join(' • ');

  useEffect(() => { if (user?.uid) loadProfile(user.uid).then((p) => { if (p.username) setUsername(p.username); }); }, [user?.uid]);

  const pickAvatar = async () => {
    if (uploading) return; // guard: kĥch hoạt upload trùng lập
    setShowAvatarSheet(false);
    await new Promise(r => setTimeout(r, 350));
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Cần quyền', 'Hãy cho phép truy cập thư viện ảnh.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images' as any, allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!result.canceled && result.assets[0] && user?.uid) {
      setUploading(true);
      try {
        const cloudUrl = await uploadAvatar(user.uid, result.assets[0].uri);
        updateAvatarUrl(cloudUrl); // ← cập nhật AuthContext ngay → cả 2 màn hình đồng bộ
      } catch (e: any) {
        console.error('[pickAvatar] upload error:', e);
        Alert.alert('Lỗi upload', e?.message || 'Không thể tải ảnh lên.');
      } finally { setUploading(false); }
    }
  };

  const deleteAvatar = async () => {
    setShowAvatarSheet(false);
    if (!user?.uid) return;
    setUploading(true);
    try {
      await removeAvatar(user.uid);
      updateAvatarUrl(null); // ← cập nhật AuthContext ngay → cả 2 màn hình đồng bộ
    }
    catch { Alert.alert('Lỗi', 'Không thể xóa ảnh.'); }
    finally { setUploading(false); }
  };

  // ── Animated values ──────────────────────────────────────────────────────────
  const expandAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollYRef = useRef(0);
  const scrollStartYRef = useRef(0);

  // PanResponder trên hero – nhận gesture kéo xuống khi đang ở đầu trang
  const heroPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        !expanded && scrollYRef.current <= 2 && g.dy > 6 && g.dy > Math.abs(g.dx) * 1.2,
      onPanResponderRelease: (_, g) => {
        if (g.dy > 12) doExpand();
      },
    })
  ).current;

  const doExpand = () => {
    setExpanded(true);
    Animated.spring(expandAnim, { toValue: 1, useNativeDriver: false, tension: 45, friction: 9 }).start();
  };

  const doCollapse = () => {
    Animated.spring(expandAnim, { toValue: 0, useNativeDriver: false, tension: 45, friction: 9 }).start(() => setExpanded(false));
  };

  // NavBar
  const NAV_H = 44 + insets.top;

  // Hero height – bắt đầu từ 0 (không có paddingTop), bao gồm cả vùng navBar
  const HERO_COLLAPSED = NAV_H + 190; // navBar area + nội dung profile
  const heroHeight = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [HERO_COLLAPSED, HERO_MAX] });
  const navBgOp = scrollY.interpolate({ inputRange: [HERO_COLLAPSED - 30, HERO_COLLAPSED + 10], outputRange: [0, 1], extrapolate: 'clamp' });
  const navTitleOp = scrollY.interpolate({ inputRange: [HERO_COLLAPSED - 20, HERO_COLLAPSED + 20], outputRange: [0, 1], extrapolate: 'clamp' });

  // Collapsed avatar/name: fade out khi expand
  const collapsedOp = expandAnim.interpolate({ inputRange: [0, 0.35], outputRange: [1, 0], extrapolate: 'clamp' });
  // Expanded text (tên ở bottom-left): fade in khi expand
  const expandedOp = expandAnim.interpolate({ inputRange: [0.55, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  // Photo background opacity
  const photoBgOp = expandAnim.interpolate({ inputRange: [0, 0.65], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={s.screen}>
      <StatusBar barStyle={expanded ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* ── ScrollView ────────────────────────────────────────── */}
      <Animated.ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces
        refreshControl={
          Platform.OS === 'android' ? (
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                if (!expanded) doExpand();
              }}
              colors={['transparent']}
              progressBackgroundColor="transparent"
              tintColor="transparent"
              // Đẩy cái vòng xoay load trang lùi tuốt lên trên khỏi màn hình để ẩn hoàn toàn
              progressViewOffset={-200}
            />
          ) : undefined
        }
        // Detect pull-down: khi kéo xuống tại đầu trang
        onScrollBeginDrag={(e) => { scrollStartYRef.current = e.nativeEvent.contentOffset.y; }}
        onScrollEndDrag={(e) => {
          const vy = (e.nativeEvent as any).velocity?.y ?? 0;
          const endY = e.nativeEvent.contentOffset.y;
          const atTop = scrollStartYRef.current <= 5 && endY <= 5;
          // Nếu velocity âm (kéo xuống) khi đang ở đầu trang → expand
          if (atTop && (vy < -0.05 || endY < scrollStartYRef.current - 3) && !expanded) {
            doExpand();
          }
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
            listener: (e: any) => {
              scrollYRef.current = e.nativeEvent.contentOffset.y;
              // Khi expanded và scroll lên → thu gọn
              if (expanded && scrollYRef.current > 40) doCollapse();
            },
          }
        )}
      >
        {/* ── Hero section ──────────────────────────────────── */}
        <Animated.View style={[s.hero, { height: heroHeight }]}>

          {/* Background photo (khi expanded) */}
          {profileAvatar ? (
            <Animated.Image
              key={profileAvatar} // remount khi URL đổi → bypass cache
              source={{ uri: profileAvatar }}
              style={[StyleSheet.absoluteFillObject, { opacity: photoBgOp }]}
              resizeMode="cover"
            />
          ) : (
            // Fallback gradient khi không có ảnh
            <Animated.View style={[StyleSheet.absoluteFillObject, s.heroBgFallback, { opacity: photoBgOp }]} />
          )}

          {/* Dark gradient overlay */}
          <Animated.View style={[StyleSheet.absoluteFillObject, s.heroDarkOverlay, { opacity: photoBgOp }]} />

          {/* ── Collapsed content: avatar + name ── */}
          <Animated.View
            style={[s.collapsedContent, { opacity: collapsedOp, paddingTop: NAV_H }]}
            pointerEvents={expanded ? 'none' : 'box-none'}
            {...heroPan.panHandlers}
          >
            <TouchableOpacity activeOpacity={0.85} onPress={doExpand}>
              {profileAvatar
                ? <Image key={profileAvatar} source={{ uri: profileAvatar }} style={s.avatar} /> // key → remount khi đổi ảnh
                : <View style={s.avatarFallback}><Ionicons name="person" size={40} color="#FFF" /></View>
              }
            </TouchableOpacity>
            <Text style={s.profileName}>{profileName}</Text>
            {subLine ? <Text style={s.profileSub}>{subLine}</Text> : null}
          </Animated.View>

          {/* ── Expanded content: tên + info ở bottom-left ── */}
          <Animated.View style={[s.expandedContent, { opacity: expandedOp, paddingBottom: 20 }]} pointerEvents="none">
            <Text style={s.expandedName}>{profileName}</Text>
            {subLine ? <Text style={s.expandedSub}>{subLine}</Text> : null}
          </Animated.View>

          {/* Tap để collapse khi đang expanded */}
          {expanded && (
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={doCollapse} activeOpacity={1} />
          )}
        </Animated.View>

        {/* ── Đổi ảnh ─────────────────────────────────────────── */}
        <View style={[s.section, { marginTop: 8 }]}>
          <TouchableOpacity activeOpacity={0.6} style={s.changeAvatarRow} onPress={() => setShowAvatarSheet(true)}>
            {uploading
              ? <ActivityIndicator size="small" color={BLUE} />
              : <Ionicons name="camera-outline" size={20} color={BLUE} />
            }
            <Text style={s.changeAvatarText}>Đổi ảnh đại diện</Text>
          </TouchableOpacity>
        </View>

        {/* ── Group 1 ─────────────────────────────────────── */}
        <View style={[s.section, { marginTop: 20 }]}>
          <SettingRow iconBg="#E8405A" iconName="person" label="Trang cá nhân" onPress={() => {}} />
          <SettingRow iconBg="#2AABEE" iconName="wallet" label="Wallet" badge="MỚI" badgeStyle="new" isLast onPress={() => {}} />
        </View>

        {/* ── Group 2 ─────────────────────────────────────── */}
        <View style={[s.section, { marginTop: 20 }]}>
          <SettingRow iconBg="#0A84FF" iconName="bookmark" label="Tin nhắn đã lưu" onPress={() => {}} />
          <SettingRow iconBg="#34C759" iconName="call" label="Cuộc gọi gần đây" onPress={() => {}} />
          <SettingRow iconBg="#FF9500" iconName="phone-portrait" label="Thiết bị" badge={2} onPress={() => {}} />
          <SettingRow iconBg="#2AABEE" iconName="albums" label="Thư mục chat" isLast onPress={() => {}} />
        </View>

        {/* ── Group 3 ─────────────────────────────────────── */}
        <View style={[s.section, { marginTop: 20 }]}>
          <SettingRow iconBg="#FF3B30" iconName="notifications" label="Thông báo và Âm báo" onPress={() => router.push('/(tabs)/settings/notifications')} />
          <SettingRow iconBg="#8E8E93" iconName="lock-closed" label="Riêng tư và Bảo mật" onPress={() => router.push('/(tabs)/settings/privacy')} />
          <SettingRow iconBg="#34C759" iconName="server" label="Dữ liệu và Bộ nhớ" onPress={() => router.push('/(tabs)/settings/data-storage')} />
          <SettingRow iconBg="#35AADB" iconName="color-palette" label="Giao diện" onPress={() => router.push('/(tabs)/settings/appearance')} />
          <SettingRow iconBg="#FF9500" iconName="battery-half" label="Tiết kiệm pin" trailingText="Tắt" onPress={() => {}} />
          <SettingRow iconBg="#5856D6" iconName="globe" label="Ngôn ngữ" trailingText="Tiếng Việt" isLast onPress={() => router.push('/(tabs)/settings/language')} />
        </View>
      </Animated.ScrollView>

      {/* ── NavBar overlay (absolute trên cùng) ─────────────── */}
      <View style={[s.navOverlay, { paddingTop: insets.top }]} pointerEvents="box-none">
        {/* Background màu – chỉ hiện khi scroll qua header */}
        <Animated.View style={[s.navBg, { opacity: navBgOp }]} />

        <View style={s.navBar} pointerEvents="box-none">
          {/* QR button – hình tròn khi expanded */}
          <TouchableOpacity style={s.navSide}>
            {expanded
              ? <View style={s.navCircleBtn}><Ionicons name="qr-code-outline" size={18} color="#FFF" /></View>
              : <Ionicons name="qr-code-outline" size={22} color={BLUE} />
            }
          </TouchableOpacity>

          {/* Title – chỉ hiện khi scroll past header */}
          <Animated.Text style={[s.navTitle, { opacity: navTitleOp }]}>{profileName}</Animated.Text>

          {/* Sửa button – pill shape khi expanded */}
          <TouchableOpacity style={[s.navSide, s.navSideRight]} onPress={() => router.push('/(tabs)/settings/edit-profile')}>
            {expanded
              ? <View style={s.navPillBtn}><Text style={s.navPillText}>Sửa</Text></View>
              : <Text style={s.editText}>Sửa</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
      {/* ── Avatar Action Sheet Modal ─────────────────────── */}
      <Modal visible={showAvatarSheet} transparent animationType="slide" onRequestClose={() => setShowAvatarSheet(false)}>
        <View style={s.sheetModalWrap}>
          {/* Nền mờ – tap để đóng */}
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowAvatarSheet(false)} />
          {/* Sheet content ở dưới cùng */}
          <View style={[s.sheetContainer, { paddingBottom: insets.bottom + 10 }]}>
            <View style={s.sheetCard}>
              <TouchableOpacity style={s.sheetOption} onPress={pickAvatar}>
                <Text style={s.sheetBlue}>Đặt ảnh đại diện</Text>
              </TouchableOpacity>
              <View style={s.sheetSep} />
              <TouchableOpacity style={s.sheetOption} onPress={() => setShowAvatarSheet(false)}>
                <Text style={s.sheetBlue}>Đặt emoji</Text>
              </TouchableOpacity>
              <View style={s.sheetSep} />
              <TouchableOpacity style={s.sheetOption} onPress={deleteAvatar}>
                <Text style={s.sheetRed}>Xóa bỏ ảnh</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.sheetCancel} onPress={() => setShowAvatarSheet(false)}>
              <Text style={[s.sheetBlue, { fontWeight: '600' }]}>Hủy bỏ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BLUE = '#037EE5';
const BG = '#F2F2F7';
const WHITE = '#FFFFFF';
const SEP = 'rgba(60,60,67,0.29)';

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  // NavBar overlay
  navOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  navBg: { ...StyleSheet.absoluteFillObject, backgroundColor: BG, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEP },
  navBar: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  navSide: { minWidth: 60, justifyContent: 'center' },
  navSideRight: { alignItems: 'flex-end' },
  // Nút QR hình tròn khi expanded
  navCircleBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  // Nút Sửa dạng pill khi expanded
  navPillBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  navPillText: { color: '#FFF', fontSize: 15, fontWeight: '500', letterSpacing: -0.3 },
  navTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: '#000', letterSpacing: -0.4, textAlign: 'center' },
  editText: { fontSize: 17, color: BLUE, letterSpacing: -0.4, fontWeight: '500' },

  // Hero section
  hero: { overflow: 'hidden', backgroundColor: BG },
  heroBgFallback: { backgroundColor: '#3A3A3C' },
  heroDarkOverlay: { backgroundColor: 'rgba(0,0,0,0.3)' },

  // Collapsed content (centered)
  collapsedContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
  },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarFallback: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#B0B0B8', justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 22, fontWeight: '600', color: '#000', letterSpacing: -0.5, marginTop: 12, marginBottom: 4, textAlign: 'center' },
  profileSub: { fontSize: 15, color: '#7E7E82', letterSpacing: -0.24, lineHeight: 20, textAlign: 'center' },

  // Expanded content (bottom-left)
  expandedContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    // Gradient-like padding
  },
  expandedName: { fontSize: 24, fontWeight: '700', color: '#FFF', letterSpacing: -0.5, marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  expandedSub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.2, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },

  // Section
  section: { backgroundColor: WHITE, borderTopWidth: 0.33, borderBottomWidth: 0.33, borderColor: SEP },
  changeAvatarRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 10 },
  changeAvatarText: { fontSize: 17, color: BLUE, letterSpacing: -0.4 },

  // Row
  row: { flexDirection: 'row', alignItems: 'center', height: 44, paddingLeft: 15, paddingRight: 15, backgroundColor: WHITE },
  rowRight: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: '100%', paddingLeft: 12 },
  rowBorder: { borderBottomWidth: 0.33, borderBottomColor: SEP },
  rowLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  rowLabel: { fontSize: 17, color: '#000', letterSpacing: -0.4, fontWeight: '400' },
  rowTrail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trailing: { fontSize: 17, color: 'rgba(60,60,67,0.6)', letterSpacing: -0.4 },
  iconBox: { width: 29, height: 29, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  newBadge: { backgroundColor: '#2AABEE', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  newBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  // Action sheet
  sheetModalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheetContainer: { paddingHorizontal: 10, gap: 8 },
  sheetCard: { backgroundColor: WHITE, borderRadius: 14, overflow: 'hidden' },
  sheetOption: { height: 56, justifyContent: 'center', alignItems: 'center' },
  sheetSep: { height: StyleSheet.hairlineWidth, backgroundColor: SEP },
  sheetBlue: { fontSize: 18, color: BLUE },
  sheetRed: { fontSize: 18, color: '#FF3B30' },
  sheetCancel: { backgroundColor: WHITE, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center' },
});
