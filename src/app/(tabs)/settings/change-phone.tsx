import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import WebView from 'react-native-webview';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { formatPhoneNumber } from '@/utils/format';

const INJECTED_JS = `
  document.body.style.backgroundColor = '#F2F2F7';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.display = 'flex';
  document.body.style.alignItems = 'center';
  document.body.style.justifyContent = 'center';
  var img = document.querySelector('img');
  if (img) {
    img.style.mixBlendMode = 'multiply';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
  }
  true;
`;

const BLUE = '#037EE5';
const BG = '#F2F2F7';

export default function ChangePhoneScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const currentPhone = formatPhoneNumber(user?.phoneNumber || '');

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Header ── */}
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Đổi số</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      {/* ── Body: tất cả nội dung gộp chung, căn giữa màn hình ── */}
      <View style={[s.body, { paddingBottom: Math.max(insets.bottom, 16) }]}>

        {/* GIF động vịt – bọc trong View cứng kích thước để WebView không phình */}
        <View style={s.illustrationWrap}>
          <WebView
            source={require('@/assets/stickers/telegram_duck.gif')}
            injectedJavaScript={INJECTED_JS}
            style={StyleSheet.absoluteFill}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            originWhitelist={['*']}
            allowsInlineMediaPlayback
          />
        </View>

        <Text style={s.phone}>{currentPhone}</Text>

        <Text style={s.desc}>
          Bạn có thể thay đổi số Telegram tại đây. Tài khoản của bạn cùng tất cả dữ liệu trên đám mây – tin nhắn, media, danh bạ, v.v. sẽ được chuyển sang số mới.
        </Text>

        {/* Nút nằm ngay dưới description, không sticky bottom */}
        <TouchableOpacity
          style={s.changeBtn}
          activeOpacity={0.75}
          onPress={() => router.replace('/(tabs)/settings/change-phone-new')}
        >
          <Text style={s.changeBtnText}>Đổi số</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 40, color: BLUE, lineHeight: 48, marginTop: -6, fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#000' },

  // Body căn giữa – toàn bộ nội dung (sticker + text + nút) trong 1 khối
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // Container cứng – giữ WebView không phình
  illustrationWrap: {
    width: 160,
    height: 160,
    marginBottom: 6,
    backgroundColor: BG,
    overflow: 'hidden',
  },

  illustration: {
    width: 160,
    height: 160,
    marginBottom: 6,
    backgroundColor: BG,
  },

  phone: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 6,
  },

  desc: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 20,
  },

  changeBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 52,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  changeBtnText: { fontSize: 17, fontWeight: '500', color: BLUE },
});
