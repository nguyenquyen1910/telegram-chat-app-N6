import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  Image, Animated, Dimensions, Platform, PanResponder, ScrollView, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/context/AuthContext';
import { loadProfile, formatBirthday, Birthday } from '@/services/profileService';
import { formatPhoneNumber } from '@/utils/format';

const { width: SW, height: SH } = Dimensions.get('window');
const HERO_MIN = 190;
const HERO_MAX = SH * 0.48;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState<Birthday | null>(null);
  const [bio, setBio] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [tabsY, setTabsY] = useState(1000);
  
  const [phoneMenuState, setPhoneMenuState] = useState({ visible: false, y: 0 });
  const [birthdayMenuState, setBirthdayMenuState] = useState({ visible: false, y: 0 });
  const [bioMenuState, setBioMenuState] = useState({ visible: false, y: 0 });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastText, setToastText] = useState('');
  const toastOp = useRef(new Animated.Value(0)).current;
  const phoneRowRef = useRef<View>(null);
  const birthdayRowRef = useRef<View>(null);
  const bioRowRef = useRef<View>(null);

  const profileName = user?.displayName || 'User';
  const profilePhone = formatPhoneNumber(user?.phoneNumber || '');
  const profileAvatar = user?.avatarUrl || user?.photoURL || null;

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadProfile(user.uid).then((p) => {
          setUsername(p.username || '');
          setBirthday(p.birthday || null);
          setBio(p.bio || '');
        });
      }
    }, [user?.uid])
  );

  const openPhoneMenu = () => {
    phoneRowRef.current?.measureInWindow((x, y, w, h) => {
      setPhoneMenuState({ visible: true, y: y + h + 5 });
    });
  };

  const openBirthdayMenu = () => {
    birthdayRowRef.current?.measureInWindow((x, y, w, h) => {
      setBirthdayMenuState({ visible: true, y: y + h + 5 });
    });
  };

  const showToastMsg = (msg: string) => {
    setToastText(msg);
    setToastVisible(true);
    toastOp.setValue(0);
    Animated.sequence([
      Animated.timing(toastOp, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOp, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };

  const handleCopyPhone = async () => {
    setPhoneMenuState({ ...phoneMenuState, visible: false });
    await Clipboard.setStringAsync(profilePhone);
    showToastMsg('Đã sao chép số điện thoại.');
  };

  const handleCopyBirthday = async () => {
    setBirthdayMenuState({ ...birthdayMenuState, visible: false });
    if (!birthday) return;
    await Clipboard.setStringAsync(formatBirthday(birthday));
    showToastMsg('Đã chép sinh nhật.');
  };

  const handleChangePhone = () => {
    setPhoneMenuState({ ...phoneMenuState, visible: false });
    router.push('/(tabs)/settings/change-phone');
  };

  const handleChangeBirthday = () => {
    setBirthdayMenuState({ ...birthdayMenuState, visible: false });
    router.push('/(tabs)/settings/edit-profile?openBirthday=true');
  };

  const openBioMenu = () => {
    bioRowRef.current?.measureInWindow((x, y, w, h) => {
      setBioMenuState({ visible: true, y: y + h + 5 });
    });
  };

  const handleCopyBio = async () => {
    setBioMenuState({ ...bioMenuState, visible: false });
    await Clipboard.setStringAsync(bio);
    showToastMsg('Đã chép giới thiệu.');
  };

  const handleChangeBio = () => {
    setBioMenuState({ ...bioMenuState, visible: false });
    router.push('/(tabs)/settings/edit-profile?openBio=true');
  };

  // ── Animated values ──
  const expandAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollYRef = useRef(0);
  const scrollStartYRef = useRef(0);

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

  const NAV_H = 44 + insets.top;
  const HERO_COLLAPSED = NAV_H + 190;
  const heroHeight = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [HERO_COLLAPSED, HERO_MAX] });
  const navBgOp = scrollY.interpolate({ inputRange: [HERO_COLLAPSED - 30, HERO_COLLAPSED + 10], outputRange: [0, 1], extrapolate: 'clamp' });
  const navTitleOp = scrollY.interpolate({ inputRange: [HERO_COLLAPSED - 20, HERO_COLLAPSED + 20], outputRange: [0, 1], extrapolate: 'clamp' });
  
  const morphThreshold = Math.max(0, tabsY - NAV_H);
  const editOp = scrollY.interpolate({ inputRange: [morphThreshold - 30, morphThreshold - 5], outputRange: [1, 0], extrapolate: 'clamp' });
  const moreOp = scrollY.interpolate({ inputRange: [morphThreshold - 10, morphThreshold + 15], outputRange: [0, 1], extrapolate: 'clamp' });

  const stickyTranslateY = scrollY.interpolate({
    inputRange: [-1, morphThreshold, morphThreshold + 1],
    outputRange: [0, 0, 1]
  });

  const collapsedOp = expandAnim.interpolate({ inputRange: [0, 0.35], outputRange: [1, 0], extrapolate: 'clamp' });
  const expandedOp = expandAnim.interpolate({ inputRange: [0.55, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const photoBgOp = expandAnim.interpolate({ inputRange: [0, 0.65], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={s.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={expanded ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* ── NavBar Overlay ── */}
      <View style={[s.navOverlay, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Animated.View style={[s.navBg, { opacity: navBgOp }]} />
        <View style={s.navBar} pointerEvents="box-none">
          <TouchableOpacity style={s.navSide} onPress={() => router.back()}>
            <View style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </View>
          </TouchableOpacity>

          <Animated.View style={[s.navTitleWrap, { opacity: navTitleOp }]}>
            <Text style={s.navTitle}>{profileName}</Text>
            <Text style={s.navSubTitle}>trực tuyến</Text>
          </Animated.View>

          <TouchableOpacity 
            style={[s.navSide, s.navSideRight]} 
            onPress={() => {
              if (scrollYRef.current > morphThreshold - 15) {
                setShowMoreMenu(true);
              } else {
                router.push('/(tabs)/settings/edit-profile');
              }
            }}
          >
            <Animated.View style={[s.editBtnWrap, { opacity: editOp, position: 'absolute', right: 0 }]}>
              <View style={s.editBtnInner}>
                <Ionicons name="add-circle-outline" size={18} color="#000" />
                <Text style={s.editText}>Sửa</Text>
              </View>
            </Animated.View>

            <Animated.View style={[s.backBtn, { opacity: moreOp, position: 'absolute', right: 0 }]}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={true}
        onScrollBeginDrag={(e) => { scrollStartYRef.current = e.nativeEvent.contentOffset.y; }}
        onScrollEndDrag={(e) => {
          const vy = (e.nativeEvent as any).velocity?.y ?? 0;
          const endY = e.nativeEvent.contentOffset.y;
          const atTop = scrollStartYRef.current <= 5 && endY <= 5;
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
              if (expanded && scrollYRef.current > 40) doCollapse();
            },
          }
        )}
      >
        {/* ── Hero Section ── */}
        <Animated.View style={[s.hero, { height: heroHeight }]}>
          {profileAvatar ? (
            <Animated.Image
              key={profileAvatar}
              source={{ uri: profileAvatar }}
              style={[StyleSheet.absoluteFillObject, { opacity: photoBgOp }]}
              resizeMode="cover"
            />
          ) : (
            <Animated.View style={[StyleSheet.absoluteFillObject, s.heroBgFallback, { opacity: photoBgOp }]} />
          )}

          <Animated.View style={[StyleSheet.absoluteFillObject, s.heroDarkOverlay, { opacity: photoBgOp }]} />

          <Animated.View
            style={[s.collapsedContent, { opacity: collapsedOp, paddingTop: NAV_H }]}
            pointerEvents={expanded ? 'none' : 'box-none'}
            {...heroPan.panHandlers}
          >
            <TouchableOpacity activeOpacity={0.85} onPress={doExpand}>
              {profileAvatar ? (
                <Image key={profileAvatar} source={{ uri: profileAvatar }} style={s.avatar} />
              ) : (
                <View style={s.avatarFallback}><Ionicons name="person" size={40} color="#FFF" /></View>
              )}
            </TouchableOpacity>
            <Text style={s.profileName}>{profileName}</Text>
            <Text style={s.profileStatus}>trực tuyến</Text>
          </Animated.View>

          <Animated.View style={[s.expandedContent, { opacity: expandedOp, paddingBottom: 20 }]} pointerEvents="none">
            <Text style={s.expandedName}>{profileName}</Text>
            <Text style={s.expandedSub}>trực tuyến</Text>
          </Animated.View>

          {expanded && (
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={doCollapse} activeOpacity={1} />
          )}
        </Animated.View>

        {/* ── Info Card ── */}
        <View style={s.card}>
          <TouchableOpacity 
            ref={phoneRowRef as any}
            style={s.infoRow}
            activeOpacity={0.7}
            onPress={openPhoneMenu}
          >
            <View>
              <Text style={s.infoLabel}>di động</Text>
              <Text style={s.infoValueBlue}>{profilePhone}</Text>
            </View>
          </TouchableOpacity>
          <View style={s.sep} />
          <View style={s.infoRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>tên người dùng</Text>
              <Text style={s.infoValueBlue}>{username ? `@${username}` : 'Chưa đặt'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/settings/qr-code')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="qr-code-outline" size={24} color="#037EE5" style={{ opacity: 0.8 }} />
            </TouchableOpacity>
          </View>
          <View style={s.sep} />
          <TouchableOpacity 
            ref={birthdayRowRef as any}
            style={s.infoRow}
            activeOpacity={0.7}
            onPress={openBirthdayMenu}
            onLongPress={openBirthdayMenu}
          >
            <View>
              <Text style={s.infoLabel}>sinh nhật</Text>
              <Text style={s.infoValueBlack}>{birthday ? formatBirthday(birthday) : 'Chưa đặt'}</Text>
            </View>
          </TouchableOpacity>
          {bio ? (
            <>
              <View style={s.sep} />
              <TouchableOpacity
                ref={bioRowRef as any}
                style={s.infoRow}
                activeOpacity={0.7}
                onPress={openBioMenu}
                onLongPress={openBioMenu}
              >
                <View>
                  <Text style={s.infoLabel}>giới thiệu</Text>
                  <Text style={s.infoValueBlack}>{bio}</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {/* ── Media Tabs & Content (wrapped for full scroll) ── */}
        <Animated.View onLayout={(e) => setTabsY(e.nativeEvent.layout.y)} style={{ zIndex: 5, transform: [{ translateY: stickyTranslateY }], backgroundColor: BG }}>
          <View style={{ zIndex: 10, paddingBottom: 10 }}>
            <View style={s.tabsRow}>
              <View style={s.tabActive}>
                <Text style={s.tabTextActive}>Bài đăng</Text>
              </View>
            </View>
            <View style={s.subTabsRow}>
              <View style={s.subTabPill}>
                <Text style={s.subTabText}>Tất cả Tin</Text>
              </View>
              <View style={s.subTabPillTransparent}>
                <Text style={s.subTabText}>+ Thêm album</Text>
              </View>
            </View>
          </View>

          <View style={{ minHeight: SH - NAV_H, zIndex: 1 }}>
            {/* ── Empty State ── */}
            <View style={s.emptyState}>
              <ExpoImage source={require('@/assets/stickers/artist_palette.webp')} style={s.emptyImage} contentFit="contain" />
              <Text style={s.emptyTitle}>Chưa có gì hết...</Text>
              <Text style={s.emptySub}>Hình và video đã đăng sẽ hiện{'\n'}trên trang cá nhân của bạn</Text>
            </View>
            {/* ── Add Story Button ── */}
            <View style={s.addStoryWrap}>
              <TouchableOpacity style={s.addStoryBtn} activeOpacity={0.8}>
                <Text style={s.addStoryText}>Thêm tin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.ScrollView>

      {/* ── Dropdown Menu ── */}
      {showMoreMenu && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 999, elevation: 999 }]}>
          <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={() => setShowMoreMenu(false)}>
            <View style={[s.menuDropdown, { top: insets.top + 44 }]}>
              <TouchableOpacity style={s.menuItem} onPress={() => setShowMoreMenu(false)}>
                <Ionicons name="add-circle-outline" size={22} color="#000" />
                <Text style={s.menuItemText}>Thêm Tin</Text>
              </TouchableOpacity>
              <View style={s.menuSep} />
              <TouchableOpacity style={s.menuItem} onPress={() => setShowMoreMenu(false)}>
                <Ionicons name="grid-outline" size={22} color="#000" />
                <Text style={s.menuItemText}>Sắp xếp lại</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Phone Options Menu ── */}
      {phoneMenuState.visible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
          <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={() => setPhoneMenuState({ ...phoneMenuState, visible: false })}>
            <View style={[s.menuDropdown, { top: phoneMenuState.y }]}>
              <TouchableOpacity style={s.menuItem} onPress={handleChangePhone}>
                <Ionicons name="create-outline" size={22} color="#000" />
                <Text style={s.menuItemText}>Thay đổi số</Text>
              </TouchableOpacity>
              <View style={s.menuSep} />
              <TouchableOpacity style={s.menuItem} onPress={handleCopyPhone}>
                <Ionicons name="copy-outline" size={22} color="#000" />
                <Text style={s.menuItemText}>Sao chép số</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Birthday Options Menu ── */}
      {birthdayMenuState.visible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
          <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={() => setBirthdayMenuState({ ...birthdayMenuState, visible: false })}>
            <View style={[s.menuDropdown, { top: birthdayMenuState.y }]}>
              <TouchableOpacity style={s.menuItem} onPress={handleChangeBirthday}>
                <Ionicons name="create-outline" size={22} color="#000" />
                <Text style={s.menuItemText}>Sửa sinh nhật</Text>
              </TouchableOpacity>
              {birthday && (
                <>
                  <View style={s.menuSep} />
                  <TouchableOpacity style={s.menuItem} onPress={handleCopyBirthday}>
                    <Ionicons name="copy-outline" size={22} color="#000" />
                    <Text style={s.menuItemText}>Chép</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bio Options Menu ── */}
      {bioMenuState.visible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
          <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={() => setBioMenuState({ ...bioMenuState, visible: false })}>
            <View style={[s.menuDropdown, { top: bioMenuState.y }]}>
              <TouchableOpacity style={s.menuItem} onPress={handleChangeBio}>
                <Ionicons name="create-outline" size={22} color="#000" />
                <Text style={s.menuItemText}>Sửa giới thiệu</Text>
              </TouchableOpacity>
              <View style={s.menuSep} />
              <TouchableOpacity style={s.menuItem} onPress={handleCopyBio}>
                <Ionicons name="copy-outline" size={22} color="#000" />
                <Text style={s.menuItemText}>Chép giới thiệu</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Toast ── */}
      {toastVisible && (
        <Animated.View style={[s.toastContainer, { opacity: toastOp }]} pointerEvents="none">
          <Ionicons name="copy" size={20} color="#FFF" style={{ opacity: 0.8 }} />
          <Text style={s.toastText}>{toastText}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const BLUE = '#037EE5';
const BG = '#F2F2F7';
const WHITE = '#FFFFFF';
const SEP = 'rgba(60,60,67,0.15)';

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  // NavBar overlay
  navOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  navBg: { ...StyleSheet.absoluteFillObject, backgroundColor: BG, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEP },
  navBar: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  navSide: { minWidth: 60, height: 44, justifyContent: 'center' },
  navSideRight: { alignItems: 'flex-end' },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  editBtnWrap: { borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 12, paddingVertical: 6 },
  editBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editText: { fontSize: 16, fontWeight: '600', color: '#000' },
  navTitleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontWeight: '600', color: '#000', textAlign: 'center' },
  navSubTitle: { fontSize: 13, color: '#8E8E93', textAlign: 'center' },

  // Hero section
  hero: { overflow: 'hidden', backgroundColor: BG },
  heroBgFallback: { backgroundColor: '#3A3A3C' },
  heroDarkOverlay: { backgroundColor: 'rgba(0,0,0,0.3)' },

  collapsedContent: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#B0B0B8', justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 24, fontWeight: '700', color: '#000', letterSpacing: -0.5, marginTop: 12, marginBottom: 2, textAlign: 'center' },
  profileStatus: { fontSize: 15, color: '#8E8E93', textAlign: 'center' },

  expandedContent: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20 },
  expandedName: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  expandedSub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },

  // Info Card
  card: { backgroundColor: WHITE, borderRadius: 20, marginHorizontal: 16, paddingVertical: 6, marginTop: 12 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: SEP, marginLeft: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  infoLabel: { fontSize: 13, color: '#000', marginBottom: 2 },
  infoValueBlue: { fontSize: 17, color: BLUE, fontWeight: '400' },
  infoValueBlack: { fontSize: 17, color: '#000', fontWeight: '400' },

  // Media Tabs
  tabsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  tabActive: { backgroundColor: WHITE, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  tabTextActive: { fontSize: 15, fontWeight: '600', color: '#000' },
  
  subTabsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 12 },
  subTabPill: { backgroundColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  subTabPillTransparent: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  subTabText: { fontSize: 15, fontWeight: '500', color: '#000' },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 32 },
  emptyImage: { width: 120, height: 120, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#000', marginBottom: 8 },
  emptySub: { fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 20 },

  // Add Story Button
  addStoryWrap: { paddingHorizontal: 16, marginTop: 32 },
  addStoryBtn: { backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  addStoryText: { color: WHITE, fontSize: 17, fontWeight: '600' },

  // Dropdown Menu
  menuOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  menuDropdown: { position: 'absolute', right: 16, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, minWidth: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  menuItemText: { fontSize: 16, fontWeight: '400', color: '#000' },
  menuSep: { height: StyleSheet.hairlineWidth, backgroundColor: SEP, marginLeft: 50 },

  // Toast
  toastContainer: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: '#323232',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 2000,
  },
  toastText: { color: '#FFF', fontSize: 15, fontWeight: '500' },
});
