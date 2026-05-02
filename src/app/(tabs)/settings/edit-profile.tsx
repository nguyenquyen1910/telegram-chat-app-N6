import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  Image, ScrollView, TextInput, KeyboardAvoidingView,
  Platform, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { uploadAvatar, removeAvatar } from '@/services/avatarService';
import { loadProfile, saveProfile, formatBirthday, Birthday } from '@/services/profileService';
import DateWheelPicker from '@/components/DateWheelPicker';
import { signOutUser, changeDisplayName } from '@/services/auth';
import { useRouter, useFocusEffect } from 'expo-router';
import { formatPhoneNumber } from '@/utils/format';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser, updateAvatarUrl } = useAuth();

  const nameParts = (user?.displayName || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [birthday, setBirthday] = useState<Birthday | null>(null);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Birthday>({ day: 1, month: 1, year: new Date().getFullYear() - 20 });

  // userAvatar: local preview khi đang upload, sau đó dùng user.avatarUrl (AuthContext)
  const userAvatar = localAvatar || user?.avatarUrl || user?.photoURL || null;
  const userPhone = formatPhoneNumber(user?.phoneNumber || '');

  // Đọc profile data từ cache mỗi khi trang được focus (để cập nhật username từ màn hình edit-username)
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;
      loadProfile(user.uid).then((p) => {
        if (p.username !== undefined) setUsername(p.username);
        if (p.birthday) { setBirthday(p.birthday); setPickerDate(p.birthday); }
        if (p.bio !== undefined) setBio(p.bio);
      });
    }, [user?.uid])
  );

  // ── Avatar picker ────────────────────────────────────────────────────────────

  const pickImage = async () => {
    if (uploading) return; // guard: kỳch hoạt upload trùng lập
    setShowAvatarSheet(false);
    // Chờ Modal đóng xong (animation) trước khi mở native picker
    await new Promise(r => setTimeout(r, 350));
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Hãy cho phép ứng dụng truy cập thư viện ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setLocalAvatar(uri); // preview ngay khi đang upload
      if (user?.uid) {
        setUploading(true);
        try {
          const cloudUrl = await uploadAvatar(user.uid, uri);
          setLocalAvatar(null);        // xóa local preview
          updateAvatarUrl(cloudUrl);   // ← cập nhật AuthContext → cả 2 màn hình đồng bộ
        } catch (e: any) {
          console.error('[pickImage] upload error:', e);
          Alert.alert('Lỗi tải ảnh', e?.message || 'Upload thất bại.');
          setLocalAvatar(null);
        } finally {
          setUploading(false);
        }
      }
    }
  };

  const takePhoto = async () => {
    setShowAvatarSheet(false);
    await new Promise(r => setTimeout(r, 350));
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Hãy cho phép ứng dụng truy cập camera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setLocalAvatar(uri);
      if (user?.uid) {
        setUploading(true);
        try {
          await uploadAvatar(user.uid, uri);
          await refreshUser(); // ← cập nhật AuthContext ngay sau upload
        } catch (e: any) {
          Alert.alert('Lỗi', e?.message || 'Không thể tải ảnh lên.');
        } finally {
          setUploading(false);
        }
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setShowAvatarSheet(false);
    if (user?.uid) {
      setUploading(true);
      try {
        await removeAvatar(user.uid);
        updateAvatarUrl(null); // ← cập nhật AuthContext → cả 2 màn hình đồng bộ
        setLocalAvatar(null);
      } catch (e) {
        Alert.alert('Lỗi', 'Không thể xóa ảnh.');
      } finally {
        setUploading(false);
      }
    }
  };

  // ── Save & navigation ────────────────────────────────────────────────────────

  const handleDone = async () => {
    if (user?.uid) {
      // 1. Cập nhật profile (username, bio, birthday)
      await saveProfile(user.uid, { username, bio, birthday });
      
      // 2. Cập nhật Tên (displayName)
      const newDisplayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      if (newDisplayName !== user.displayName) {
        await changeDisplayName(user.uid, newDisplayName);
        await refreshUser(); // Cập nhật lại AuthContext
      }
    }
    router.replace('/(tabs)/settings');
  };

  const handleCancel = () => router.replace('/(tabs)/settings');

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOutUser();
      router.replace('/(auth)/welcome');
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
        <SafeAreaView style={s.safeArea} edges={['top']}>

          {/* ── NavBar ──────────────────────────────────────── */}
          <View style={s.navBar}>
            <TouchableOpacity style={s.navSide} onPress={handleCancel}>
              <View style={s.navPillBtn}><Text style={s.navPillText}>Hủy bỏ</Text></View>
            </TouchableOpacity>
            <Text style={s.navTitle}>Chỉnh sửa hồ sơ</Text>
            <TouchableOpacity style={[s.navSide, s.navSideRight]} onPress={handleDone}>
              <View style={s.navPillBtn}><Text style={s.navPillText}>Xong</Text></View>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Avatar section ──────────────────────────── */}
            <View style={s.avatarSection}>
              <TouchableOpacity onPress={() => setShowAvatarSheet(true)} style={s.avatarTouch}>
                {uploading ? (
                  <View style={s.avatarFallback}><ActivityIndicator color="#FFF" /></View>
                ) : userAvatar ? (
                  <Image
                    key={userAvatar} // key → remount khi URL đổi, bypass RN image cache
                    source={{ uri: userAvatar }}
                    style={s.avatar}
                  />
                ) : (
                  <View style={s.avatarFallback}><Ionicons name="person" size={40} color="#FFF" /></View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowAvatarSheet(true)}>
                <Text style={s.avatarLink}>Đặt ảnh đại diện</Text>
              </TouchableOpacity>
            </View>

            {/* ── Name inputs ─────────────────────────────── */}
            <View style={s.card}>
              <TextInput style={s.input} value={firstName} onChangeText={setFirstName}
                placeholder="Họ" placeholderTextColor="#C7C7CC" returnKeyType="next" />
              <View style={s.sep} />
              <TextInput style={s.input} value={lastName} onChangeText={setLastName}
                placeholder="Tên" placeholderTextColor="#C7C7CC" returnKeyType="next" />
            </View>
            <Text style={s.helperText}>Nhập tên và thêm một ảnh đại diện tùy chọn.</Text>

            {/* ── Bio ─────────────────────────────────────── */}
            <View style={s.card}>
              <TextInput style={[s.input, { minHeight: 44 }]} value={bio} onChangeText={setBio}
                placeholder="Giới thiệu" placeholderTextColor="#C7C7CC" multiline returnKeyType="done" />
            </View>
            <Text style={s.helperText}>
              Bạn có thể giới thiệu đôi chút về mình. Chọn người xem được câu này ở{' '}
              <Text style={{ color: '#037EE5' }}>Cài đặt.</Text>
            </Text>

            {/* ── Sinh nhật ──────────────────────────────── */}
            <View style={[s.card, { marginTop: 20 }]}>
              <TouchableOpacity
                style={s.infoRow}
                activeOpacity={0.6}
                onPress={() => {
                  if (!showBirthdayPicker) {
                    // Mở picker, khởi tạo với ngày hiện tại hoặc đã lưu
                    if (birthday) setPickerDate(birthday);
                  }
                  setShowBirthdayPicker(!showBirthdayPicker);
                }}
              >
                <Text style={s.infoLabel}>Sinh nhật</Text>
                <Text style={[s.infoValue, birthday && { color: '#037EE5' }]}>
                  {birthday ? formatBirthday(birthday) : 'Chưa đặt'}
                </Text>
              </TouchableOpacity>

              {showBirthdayPicker && (
                <View style={s.birthdayPickerWrap}>
                  <View style={s.sep} />
                  <DateWheelPicker
                    day={pickerDate.day}
                    month={pickerDate.month}
                    year={pickerDate.year}
                    onChange={(d, m, y) => {
                      const newDate = { day: d, month: m, year: y };
                      setPickerDate(newDate);
                      setBirthday(newDate); // cập nhật trực tiếp khi cuộn
                    }}
                  />
                  <View style={s.sep} />
                  <TouchableOpacity
                    style={{ paddingVertical: 14, paddingHorizontal: 16 }}
                    onPress={() => {
                      setBirthday(null);
                      setShowBirthdayPicker(false);
                    }}
                  >
                    <Text style={{ color: '#FF3B30', fontSize: 17 }}>Xóa bỏ sinh nhật</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {!showBirthdayPicker && (
              <Text style={s.helperText}>
                Chỉ người trong danh bạ thấy sinh nhật bạn.{' '}
                <Text style={{ color: '#037EE5' }}>Đổi ›</Text>
              </Text>
            )}

            {/* ── Info rows ───────────────────────────────── */}
            <View style={[s.card, { marginTop: 20 }]}>
              <TouchableOpacity
                style={s.infoRow}
                activeOpacity={0.6}
                onPress={() => router.push('/(tabs)/settings/change-phone')}
              >
                <Text style={s.infoLabel}>Đổi số</Text>
                <View style={s.infoTrail}>
                  <Text style={s.infoValue}>{userPhone}</Text>
                  <Ionicons name="chevron-forward" size={17} color="rgba(60,60,67,0.3)" />
                </View>
              </TouchableOpacity>
              <View style={s.sep} />
              <TouchableOpacity 
                style={s.infoRow} 
                activeOpacity={0.6}
                onPress={() => router.push('/(tabs)/settings/edit-username')}
              >
                <Text style={s.infoLabel}>Tên người dùng</Text>
                <View style={s.infoTrail}>
                  {username ? <Text style={s.infoValue}>@{username}</Text> : <Text style={s.infoValue}>Chưa đặt</Text>}
                  <Ionicons name="chevron-forward" size={17} color="rgba(60,60,67,0.3)" />
                </View>
              </TouchableOpacity>
              <View style={s.sep} />
              <TouchableOpacity style={s.infoRow} activeOpacity={0.6}>
                <Text style={s.infoLabel}>Màu của bạn</Text>
                <Ionicons name="chevron-forward" size={17} color="rgba(60,60,67,0.3)" />
              </TouchableOpacity>
            </View>

            {/* ── Add account ─────────────────────────────── */}
            <View style={[s.card, { marginTop: 20 }]}>
              <TouchableOpacity style={s.centeredRow} activeOpacity={0.6}>
                <Text style={s.blueText}>Thêm tài khoản khác</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.helperText}>Bạn có thể kết nối nhiều tài khoản với số điện thoại khác nhau.</Text>

            {/* ── Logout ──────────────────────────────────── */}
            <View style={[s.card, { marginTop: 20 }]}>
              <TouchableOpacity style={s.centeredRow} activeOpacity={0.6} onPress={() => setShowLogout(true)}>
                <Text style={s.redText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* ── Avatar Action Sheet ──────────────────────────────── */}
      <Modal visible={showAvatarSheet} transparent animationType="slide" onRequestClose={() => setShowAvatarSheet(false)}>
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setShowAvatarSheet(false)} />
        <View style={[s.sheetContainer, { paddingBottom: insets.bottom + 8 }]}>
          <View style={s.sheetCard}>
            <TouchableOpacity style={s.sheetOption} onPress={pickImage}>
              <Text style={s.sheetBlue}>Đặt ảnh đại diện</Text>
            </TouchableOpacity>
            <View style={s.sheetSep} />
            <TouchableOpacity style={s.sheetOption} onPress={takePhoto}>
              <Text style={s.sheetBlue}>Chụp ảnh</Text>
            </TouchableOpacity>
            {userAvatar ? (
              <>
                <View style={s.sheetSep} />
                <TouchableOpacity style={s.sheetOption} onPress={handleRemoveAvatar}>
                  <Text style={s.sheetRed}>Xóa bỏ ảnh</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
          <TouchableOpacity style={s.sheetCancel} onPress={() => setShowAvatarSheet(false)}>
            <Text style={s.sheetBlue}>Hủy bỏ</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Logout confirm ───────────────────────────────────── */}
      <Modal visible={showLogout} transparent animationType="fade" onRequestClose={() => setShowLogout(false)}>
        <View style={s.logoutOverlay}>
          <View style={s.logoutCard}>
            <Text style={s.logoutTitle}>Đăng xuất</Text>
            <Text style={s.logoutSub}>Bạn có chắc muốn đăng xuất không?</Text>
            <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout} disabled={isLoggingOut}>
              <Text style={s.logoutBtnText}>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.logoutCancelBtn} onPress={() => setShowLogout(false)}>
              <Text style={s.logoutCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BLUE = '#037EE5';
const BG = '#F2F2F7';
const WHITE = '#FFFFFF';
const SEP = 'rgba(60,60,67,0.29)';

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  safeArea: { flex: 1, backgroundColor: BG },

  // NavBar
  navBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  navSide: { minWidth: 80, justifyContent: 'center' },
  navSideRight: { alignItems: 'flex-end' },
  navTitle: { fontSize: 17, fontWeight: '600', color: '#000', letterSpacing: -0.4 },
  navPillBtn: { backgroundColor: WHITE, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  navPillText: { fontSize: 15, color: '#000', fontWeight: '500' },

  // Scroll
  scroll: { flex: 1 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  avatarTouch: { marginBottom: 10 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarFallback: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#B0B0B8', justifyContent: 'center', alignItems: 'center' },
  avatarLink: { fontSize: 16, color: BLUE, fontWeight: '500' },

  // Card
  card: { backgroundColor: WHITE, borderRadius: 12, marginHorizontal: 16, overflow: 'hidden' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: SEP, marginLeft: 16 },
  input: { height: 44, paddingHorizontal: 16, fontSize: 17, color: '#000', letterSpacing: -0.4 },
  helperText: { fontSize: 13, color: '#8E8E93', marginHorizontal: 20, marginTop: 8, lineHeight: 18 },

  // Info row
  infoRow: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  infoLabel: { fontSize: 17, color: '#000', letterSpacing: -0.4 },
  infoTrail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoValue: { fontSize: 17, color: 'rgba(60,60,67,0.6)', letterSpacing: -0.4 },
  usernameAt: { fontSize: 17, color: 'rgba(60,60,67,0.6)' },
  usernameInput: { fontSize: 17, color: '#000', letterSpacing: -0.4, minWidth: 60, maxWidth: 120, padding: 0, textAlign: 'right' },
  birthdayPickerWrap: { paddingHorizontal: 4, paddingBottom: 4, backgroundColor: '#FFF' },

  // Centered row
  centeredRow: { height: 44, justifyContent: 'center', alignItems: 'center' },
  blueText: { fontSize: 17, color: BLUE, fontWeight: '500' },
  redText: { fontSize: 17, color: '#FF3B30', fontWeight: '500' },

  // Action sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetContainer: { paddingHorizontal: 10, gap: 10 },
  sheetCard: { backgroundColor: WHITE, borderRadius: 14, overflow: 'hidden' },
  sheetOption: { height: 56, justifyContent: 'center', alignItems: 'center' },
  sheetSep: { height: StyleSheet.hairlineWidth, backgroundColor: SEP },
  sheetBlue: { fontSize: 18, color: BLUE, letterSpacing: 0.2 },
  sheetRed: { fontSize: 18, color: '#FF3B30', letterSpacing: 0.2 },
  sheetCancel: { backgroundColor: WHITE, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center' },

  // Logout modal
  logoutOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  logoutCard: { backgroundColor: WHITE, borderRadius: 20, padding: 28, width: '78%', alignItems: 'center' },
  logoutTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 8 },
  logoutSub: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  logoutBtn: { backgroundColor: '#FF3B30', borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
  logoutBtnText: { fontSize: 17, fontWeight: '600', color: WHITE },
  logoutCancelBtn: { backgroundColor: '#F2F2F7', borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center' },
  logoutCancelText: { fontSize: 17, fontWeight: '600', color: BLUE },
});
