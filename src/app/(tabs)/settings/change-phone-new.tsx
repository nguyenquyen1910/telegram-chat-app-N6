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
  SectionList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { checkPhoneExists } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';

// Đã chuyển sang expo-image để tải nhanh


// ─── Country list ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  { name: 'Afghanistan', en: 'Afghanistan', code: '+93', flag: '🇦🇫' },
  { name: 'Ai Cập', en: 'Egypt', code: '+20', flag: '🇪🇬' },
  { name: 'Albania', en: 'Albania', code: '+355', flag: '🇦🇱' },
  { name: 'Algeria', en: 'Algeria', code: '+213', flag: '🇩🇿' },
  { name: 'Andorra', en: 'Andorra', code: '+376', flag: '🇦🇩' },
  { name: 'Angola', en: 'Angola', code: '+244', flag: '🇦🇴' },
  { name: 'Anguilla', en: 'Anguilla', code: '+1264', flag: '🇦🇮' },
  { name: 'Antigua và Barbuda', en: 'Antigua & Barbuda', code: '+1268', flag: '🇦🇬' },
  { name: 'Argentina', en: 'Argentina', code: '+54', flag: '🇦🇷' },
  { name: 'Armenia', en: 'Armenia', code: '+374', flag: '🇦🇲' },
  { name: 'Hoa Kỳ', en: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'Hàn Quốc', en: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'Nhật Bản', en: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'Thái Lan', en: 'Thailand', code: '+66', flag: '🇹🇭' },
  { name: 'Trung Quốc', en: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Việt Nam', en: 'Vietnam', code: '+84', flag: '🇻🇳' },
];

export default function ChangePhoneNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const fullPhone = `${selectedCountry.code}${phoneNumber}`;
  const isValid = phoneNumber.length >= 9;

  // Search và phân nhóm quốc gia
  const sectionListRef = React.useRef<SectionList>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredSections = React.useMemo(() => {
    let filtered = COUNTRIES;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.en.toLowerCase().includes(q) || 
        c.code.includes(q)
      );
    }
    const grouped = filtered.reduce((acc, curr) => {
      const letter = curr.name[0].toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(curr);
      return acc;
    }, {} as Record<string, typeof COUNTRIES>);

    return Object.keys(grouped)
      .sort()
      .map(letter => ({ title: letter, data: grouped[letter] }));
  }, [searchQuery]);

  const alphabet = React.useMemo(() => {
    return Object.keys(
      COUNTRIES.reduce((acc, curr) => {
        acc[curr.name[0].toUpperCase()] = true;
        return acc;
      }, {} as Record<string, boolean>)
    ).sort();
  }, []);

  const scrollToLetter = (letter: string) => {
    const index = filteredSections.findIndex(s => s.title === letter);
    if (index !== -1 && sectionListRef.current) {
      sectionListRef.current.scrollToLocation({ sectionIndex: index, itemIndex: 0, animated: true });
    }
  };

  React.useEffect(() => {
    if (!showCountryPicker) setSearchQuery('');
  }, [showCountryPicker]);

  const handleContinue = () => {
    Keyboard.dismiss();
    if (!isValid) return;
    if (fullPhone === user?.phoneNumber) {
      Alert.alert('Số trùng', 'Số mới không được giống số hiện tại.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmPhoneNumber = async () => {
    setShowConfirmModal(false);
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
        {/* Sticker điện thoại đỏ động */}
        <View style={s.illustrationWrap}>
          <Image
            source={require('@/assets/stickers/telephone_red.webp')}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
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

      {/* ── Confirm Modal ── */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={s.confirmModalBg}>
          <View style={s.confirmBox}>
            <Text style={s.confirmPhone}>{selectedCountry.code} {phoneNumber}</Text>
            <Text style={s.confirmSubtitle}>Đây đúng là số của bạn chứ?</Text>
            <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={s.editBtn} activeOpacity={0.7}>
              <Text style={s.editBtnText}>Sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.confirmBtn} onPress={handleConfirmPhoneNumber} activeOpacity={0.8}>
              <Text style={s.confirmBtnText}>Tiếp tục</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Country picker modal (Premium Full Screen) ── */}
      <Modal visible={showCountryPicker} transparent={false} animationType="slide">
        <View style={s.pickerScreen}>
          {/* Header */}
          <View style={s.pickerHeader}>
            <TouchableOpacity style={s.pickerCloseBtn} onPress={() => setShowCountryPicker(false)}>
              <Text style={s.pickerCloseIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={s.pickerTitle}>Quốc gia</Text>
            <View style={{ width: 32 }} />
          </View>

          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={s.pickerListWrap}>
              <SectionList
                ref={sectionListRef}
                sections={filteredSections}
                keyExtractor={(item) => item.code + item.name}
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderSectionHeader={({ section: { title } }) => (
                  <View style={s.sectionHeader}>
                    <Text style={s.sectionHeaderText}>{title}</Text>
                  </View>
                )}
                renderItem={({ item, index, section }) => {
                  const isFirst = index === 0;
                  const isLast = index === section.data.length - 1;
                  return (
                    <TouchableOpacity
                      style={[
                        s.pickerItem,
                        isFirst && { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
                        isLast && { borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderBottomWidth: 0 }
                      ]}
                      onPress={() => {
                        setSelectedCountry(item);
                        setShowCountryPicker(false);
                      }}
                    >
                      <Text style={s.pickerFlag}>{item.flag}</Text>
                      <View style={s.pickerItemInfo}>
                        <Text style={s.pickerName}>{item.name}</Text>
                        <Text style={s.pickerEn}>{item.en}</Text>
                      </View>
                      <Text style={s.pickerCode}>{item.code}</Text>
                    </TouchableOpacity>
                  );
                }}
              />

              {searchQuery === '' ? (
                <View style={s.alphabetWrap}>
                  {alphabet.map((letter) => (
                    <TouchableOpacity key={letter} onPress={() => scrollToLetter(letter)} hitSlop={{top: 2, bottom: 2, left: 10, right: 10}}>
                      <Text style={s.alphabetText}>{letter}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={s.floatingSearchWrap}>
              <View style={s.searchBox}>
                <Ionicons name="search" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Tìm kiếm"
                  placeholderTextColor="#8E8E93"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
                {searchQuery !== '' ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </KeyboardAvoidingView>
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

  pickerScreen: { flex: 1, backgroundColor: '#F2F2F7', paddingTop: Platform.OS === 'ios' ? 44 : 16 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  pickerCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' },
  pickerCloseIcon: { fontSize: 16, color: '#000', fontWeight: '500' },
  pickerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },

  pickerListWrap: { flex: 1, paddingLeft: 16, paddingRight: 24 },
  sectionHeader: { paddingVertical: 8, paddingHorizontal: 4, marginTop: 4 },
  sectionHeaderText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  pickerFlag: { fontSize: 24, marginRight: 12 },
  pickerItemInfo: { flex: 1 },
  pickerName: { fontSize: 16, color: '#000', fontWeight: '400', marginBottom: 2 },
  pickerEn: { fontSize: 13, color: '#8E8E93' },
  pickerCode: { fontSize: 16, color: '#8E8E93' },

  alphabetWrap: { position: 'absolute', right: 2, top: 40, bottom: 100, justifyContent: 'center', alignItems: 'center', width: 20 },
  alphabetText: { fontSize: 11, color: '#3882F8', fontWeight: '600', marginVertical: 1.5 },

  floatingSearchWrap: { position: 'absolute', bottom: 24, left: 16, right: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 24, height: 48, paddingHorizontal: 16 },
  searchInput: { flex: 1, fontSize: 17, color: '#000' },

  confirmModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  confirmBox: { backgroundColor: '#FFFFFF', borderRadius: 28, paddingTop: 36, paddingBottom: 24, paddingHorizontal: 24, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  confirmPhone: { fontSize: 30, fontWeight: '700', color: '#000', marginBottom: 12, textAlign: 'center' },
  confirmSubtitle: { fontSize: 16, color: '#000', marginBottom: 24, textAlign: 'center' },
  editBtn: { paddingVertical: 8, marginBottom: 16 },
  editBtnText: { fontSize: 17, color: '#3882F8', fontWeight: '400' },
  confirmBtn: { backgroundColor: '#3882F8', borderRadius: 27, height: 54, width: '100%', justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});
