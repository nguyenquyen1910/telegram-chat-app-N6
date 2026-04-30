import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
  ScrollView,
  Keyboard,
} from 'react-native';
import WebView from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { checkPhoneExists } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';

// URL sticker điện thoại đỏ – Telegram animated emoji chính thức (WebP trong suốt)
const PHONE_STICKER_URL =
  'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Objects/Telephone.webp';

// HTML nhúng vào WebView để hiển thị animated sticker, mix-blend-mode xóa nền trắng
const PHONE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:100%;height:100%;background:transparent;display:flex;align-items:center;justify-content:center;overflow:hidden;}
  img{width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply;}
</style>
</head>
<body>
  <img src="${PHONE_STICKER_URL}" alt="phone"/>
</body>
</html>`;


// ─── Country list ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  { name: 'Việt Nam', code: '+84', flag: '🇻🇳' },
  { name: 'Hoa Kỳ', code: '+1', flag: '🇺🇸' },
  { name: 'Nhật Bản', code: '+81', flag: '🇯🇵' },
  { name: 'Hàn Quốc', code: '+82', flag: '🇰🇷' },
  { name: 'Trung Quốc', code: '+86', flag: '🇨🇳' },
  { name: 'Thái Lan', code: '+66', flag: '🇹🇭' },
];

export default function ChangePhoneNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const fullPhone = `${selectedCountry.code}${phoneNumber}`;
  const isValid = phoneNumber.length >= 9;

  const handleContinue = async () => {
    Keyboard.dismiss();
    if (!isValid) return;
    if (fullPhone === user?.phoneNumber) {
      Alert.alert('Số trùng', 'Số mới không được giống số hiện tại.');
      return;
    }
    setIsChecking(true);
    try {
      const exists = await checkPhoneExists(fullPhone);
      if (exists) {
        Alert.alert('Số đã tồn tại', 'Số này đã liên kết với tài khoản khác.');
        return;
      }
      router.push({
        pathname: '/(tabs)/settings/change-phone-verify',
        params: { newPhone: fullPhone },
      });
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể kiểm tra số. Vui lòng thử lại.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Nút back nổi, không có header bar ── */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={s.backBtn}
      >
        <Text style={s.backArrow}>‹</Text>
      </TouchableOpacity>

      {/* ── ScrollView với keyboardShouldPersistTaps ── */}
      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Sticker điện thoại đỏ động – WebView mix-blend-mode xóa nền trắng */}
        <View style={s.illustrationWrap}>
          <WebView
            source={{ html: PHONE_HTML }}
            style={StyleSheet.absoluteFill}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            originWhitelist={['*']}
            allowsInlineMediaPlayback
          />
        </View>

        <Text style={s.title}>Số mới</Text>
        <Text style={s.subtitle}>
          Số mới của bạn sẽ nhận được mã xác nhận bằng cuộc gọi hoặc SMS.
        </Text>

        {/* Country row */}
        <TouchableOpacity
          style={s.countryRow}
          onPress={() => setShowCountryPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={s.countryFlag}>{selectedCountry.flag}</Text>
          <Text style={s.countryName}>{selectedCountry.name}</Text>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>

        <View style={s.divider} />

        {/* Phone input – dùng View thuần, autoFocus trực tiếp */}
        <View style={s.phoneRow}>
          <Text style={s.countryCode}>{selectedCountry.code}</Text>
          <View style={s.phoneSep} />
          <TextInput
            style={s.phoneInput}
            placeholder="Số điện thoại"
            placeholderTextColor="#C7C7CC"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </View>

        <View style={s.divider} />

        {/* Continue button */}
        <TouchableOpacity
          style={[s.continueBtn, isValid && s.continueBtnActive]}
          onPress={handleContinue}
          disabled={!isValid || isChecking}
          activeOpacity={0.75}
        >
          {isChecking ? (
            <ActivityIndicator color={isValid ? '#2481CC' : '#AEAEB2'} />
          ) : (
            <Text style={[s.continueText, isValid && s.continueTextActive]}>
              Tiếp tục
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Country picker modal ── */}
      <Modal visible={showCountryPicker} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.pickerSheet}>
            <View style={s.pickerHandle} />
            <Text style={s.pickerTitle}>Chọn quốc gia</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {COUNTRIES.map(c => (
                <TouchableOpacity
                  key={c.code}
                  style={s.pickerItem}
                  onPress={() => {
                    setSelectedCountry(c);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={s.pickerFlag}>{c.flag}</Text>
                  <Text style={s.pickerName}>{c.name}</Text>
                  <Text style={s.pickerCode}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={s.pickerCancel}
              onPress={() => setShowCountryPicker(false)}
            >
              <Text style={s.pickerCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },

  // Nút back nổi góc trên trái – không có header bar
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  backArrow: { fontSize: 40, color: '#2481CC', lineHeight: 48, marginTop: -6, fontWeight: '300' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60 },

  illustrationWrap: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  iconWrap: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 72 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20, marginBottom: 28 },

  countryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  countryFlag: { fontSize: 22, marginRight: 10 },
  countryName: { fontSize: 17, color: '#2481CC', flex: 1 },
  chevron: { fontSize: 24, color: '#C7C7CC', fontWeight: '300' },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#C6C6C8' },

  phoneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  countryCode: { fontSize: 17, fontWeight: '500', color: '#000', width: 48 },
  phoneSep: { width: StyleSheet.hairlineWidth, height: 22, backgroundColor: '#C6C6C8', marginHorizontal: 14 },
  phoneInput: { flex: 1, fontSize: 17, color: '#000', paddingVertical: 0 },

  continueBtn: { backgroundColor: '#F2F2F7', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  continueBtnActive: { backgroundColor: '#F2F2F7' },
  continueText: { fontSize: 17, fontWeight: '600', color: '#AEAEB2' },
  continueTextActive: { color: '#2481CC' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 36, maxHeight: '70%' },
  pickerHandle: { width: 40, height: 4, backgroundColor: '#D1D1D6', borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
  pickerTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', color: '#000', marginBottom: 12 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  pickerFlag: { fontSize: 22, marginRight: 12 },
  pickerName: { fontSize: 17, flex: 1, color: '#000' },
  pickerCode: { fontSize: 15, color: '#8E8E93' },
  pickerCancel: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  pickerCancelText: { fontSize: 17, color: '#FF3B30', fontWeight: '600' },
});
