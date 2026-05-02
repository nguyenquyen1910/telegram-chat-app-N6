import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  Dimensions, Share, Image as RNImage, Animated,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';

const { width: SW } = Dimensions.get('window');
const QR_SIZE = Math.round(Math.min(SW * 0.48, 220));

const EMOJI_ASSETS = {
  house:   require('@/assets/stickers/house.webp'),
  chick:   require('@/assets/stickers/chick.webp'),
  snowman: require('@/assets/stickers/snowman.webp'),
  gem:     require('@/assets/stickers/gem.webp'),
};

const THEMES = [
  {
    id: 'green',
    from: '#5BAD72' as const, to: '#A8D8A0' as const,
    darkFrom: '#0D2010' as const, darkTo: '#1A3A20' as const,
    qrColor: '#2E6B3E',
    darkQrColor: '#5BAD72',
    emoji: EMOJI_ASSETS.house,
    patterns: ['🌿', '🍃', '🌱', '🌾', '🍀', '🌲', '🐸', '🦋'],
  },
  {
    id: 'yellow',
    from: '#F5C842' as const, to: '#F9A825' as const,
    darkFrom: '#201800' as const, darkTo: '#332800' as const,
    qrColor: '#8B5E00',
    darkQrColor: '#F5C842',
    emoji: EMOJI_ASSETS.chick,
    patterns: ['☀️', '🌻', '🌼', '✨', '⭐', '🌟', '🌤️', '🐤'],
  },
  {
    id: 'snow',
    from: '#8EC5FC' as const, to: '#4A90D9' as const,
    darkFrom: '#0A1520' as const, darkTo: '#162840' as const,
    qrColor: '#1A4F7A',
    darkQrColor: '#8EC5FC',
    emoji: EMOJI_ASSETS.snowman,
    patterns: ['❄️', '🌨️', '⛄', '🏔️', '🌬️', '💨', '🌙', '⛅'],
  },
  {
    id: 'diamond',
    from: '#D4A0E8' as const, to: '#9B5FC0' as const,
    darkFrom: '#150D20' as const, darkTo: '#251535' as const,
    qrColor: '#5B2A8A',
    darkQrColor: '#D4A0E8',
    emoji: EMOJI_ASSETS.gem,
    patterns: ['💜', '🔮', '✨', '💫', '🌟', '🪄', '🦄', '💐'],
  },
];

const PATTERN_POSITIONS = [
  { top: '3%',  left: '6%',   rotate: '-15deg', opacity: 0.35, size: 30 },
  { top: '5%',  left: '40%',  rotate: '8deg',   opacity: 0.22, size: 22 },
  { top: '4%',  left: '78%',  rotate: '20deg',  opacity: 0.28, size: 26 },
  { top: '14%', left: '18%',  rotate: '25deg',  opacity: 0.2,  size: 20 },
  { top: '16%', left: '68%',  rotate: '-10deg', opacity: 0.3,  size: 28 },
  { top: '18%', left: '88%',  rotate: '-8deg',  opacity: 0.25, size: 24 },
  { top: '28%', left: '4%',   rotate: '30deg',  opacity: 0.22, size: 22 },
  { top: '32%', left: '55%',  rotate: '-20deg', opacity: 0.18, size: 20 },
  { top: '30%', left: '85%',  rotate: '12deg',  opacity: 0.28, size: 26 },
  { top: '42%', left: '2%',   rotate: '-25deg', opacity: 0.3,  size: 24 },
  { top: '45%', left: '88%',  rotate: '18deg',  opacity: 0.25, size: 22 },
  { top: '52%', left: '14%',  rotate: '5deg',   opacity: 0.2,  size: 20 },
  { top: '55%', left: '78%',  rotate: '-15deg', opacity: 0.28, size: 26 },
  { top: '65%', left: '8%',   rotate: '10deg',  opacity: 0.22, size: 22 },
  { top: '67%', left: '45%',  rotate: '-8deg',  opacity: 0.2,  size: 24 },
  { top: '68%', left: '82%',  rotate: '22deg',  opacity: 0.3,  size: 28 },
  { top: '76%', left: '28%',  rotate: '-18deg', opacity: 0.25, size: 22 },
  { top: '78%', left: '65%',  rotate: '14deg',  opacity: 0.22, size: 20 },
];

function makeQRHtml(value: string, color: string, size: number, bg = 'white') {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${size}px;height:${size}px;background:${bg};
  display:flex;align-items:center;justify-content:center;overflow:hidden;}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
</head><body><div id="q"></div>
<script>new QRCode(document.getElementById("q"),{
  text:"${value}",width:${size-8},height:${size-8},
  colorDark:"${color}",colorLight:"${bg}",
  correctLevel:QRCode.CorrectLevel.H
});</script></body></html>`;
}

export default function QRCodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [themeIdx, setThemeIdx] = useState(0);
  const [isDark, setIsDark] = useState(false);

  const tileScales = useRef(THEMES.map((_, i) => new Animated.Value(i === 0 ? 1.25 : 1))).current;
  // Animate dark mode transition
  const darkAnim = useRef(new Animated.Value(0)).current;

  const theme = THEMES[themeIdx];

  const username = (user as any)?.username || '';
  const displayName = user?.displayName || 'User';
  const avatar = user?.avatarUrl || user?.photoURL || null;
  const qrValue = `tgapp://user/${user?.uid || 'unknown'}`;
  const displayText = username ? `@${username.toUpperCase()}` : displayName.toUpperCase();

  // Colors based on dark mode
  const bgColors = isDark
    ? ([theme.darkFrom, theme.darkTo] as const)
    : ([theme.to, theme.from] as const);
  const qrDotColor = isDark ? theme.darkQrColor : theme.qrColor;
  const cardBg     = isDark ? '#1C1E2A' : '#FFFFFF';
  const cardBorder = isDark ? theme.darkQrColor : 'transparent';
  const usernameCl = isDark ? theme.darkQrColor : theme.qrColor;
  const sheetBg    = isDark ? '#1C1E2A' : '#FFFFFF';
  const sheetTitle = isDark ? '#FFFFFF' : '#000000';
  const btnBg      = isDark ? '#2C2F3E' : '#F0F0F5';
  const btnColor   = isDark ? '#FFFFFF' : '#333333';
  const scanColor  = isDark ? theme.darkQrColor : '#037EE5';
  const qrWebBg    = isDark ? '#1C1E2A' : 'white';
  const patternOp  = isDark ? 1.8 : 1; // boost pattern opacity in dark

  const toggleDark = () => {
    Animated.timing(darkAnim, {
      toValue: isDark ? 0 : 1, duration: 300, useNativeDriver: false,
    }).start();
    setIsDark(d => !d);
  };

  const selectTheme = (i: number) => {
    if (i === themeIdx) return;
    Animated.parallel([
      Animated.spring(tileScales[themeIdx], { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(tileScales[i], { toValue: 1.45, duration: 120, useNativeDriver: true }),
        Animated.spring(tileScales[i], { toValue: 1.25, friction: 4, useNativeDriver: true }),
      ]),
    ]).start();
    setThemeIdx(i);
  };

  const handleShare = async () => {
    await Share.share({ message: `Nhắn tin cho tôi!\n${username ? `@${username}` : displayName}` });
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={bgColors}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Scattered pattern */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {PATTERN_POSITIONS.map((pos, i) => (
          <Text key={i} style={{
            position: 'absolute', top: pos.top as any, left: pos.left as any,
            fontSize: pos.size,
            opacity: Math.min(pos.opacity * patternOp, isDark ? 0.6 : 0.38),
            transform: [{ rotate: pos.rotate }],
          }}>
            {theme.patterns[i % theme.patterns.length]}
          </Text>
        ))}
      </View>

      {/* Top: avatar + card */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: insets.top + 8 }}>
        <View style={{ width: SW - 40, alignItems: 'center' }}>
          {/* Avatar */}
          <View style={s.avatarWrap}>
            {avatar ? (
              <RNImage source={{ uri: avatar }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Ionicons name="person" size={36} color="#FFF" />
              </View>
            )}
          </View>

          {/* Card */}
          <View style={[s.card, {
            backgroundColor: cardBg,
            borderWidth: isDark ? 1.5 : 0,
            borderColor: cardBorder,
          }]}>
            <View style={[s.qrWrap, { backgroundColor: qrWebBg }]}>
              <WebView
                style={{ width: QR_SIZE, height: QR_SIZE, backgroundColor: qrWebBg }}
                source={{ html: makeQRHtml(qrValue, qrDotColor, QR_SIZE, qrWebBg) }}
                scrollEnabled={false} originWhitelist={['*']}
                showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}
              />
            </View>
            <Text style={[s.username, { color: usernameCl }]}>{displayText}</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={[s.sheet, { backgroundColor: sheetBg, paddingBottom: insets.bottom + 8 }]}>
        <View style={s.sheetHeader}>
          {/* Close */}
          <TouchableOpacity style={[s.sheetBtn, { backgroundColor: btnBg }]} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={btnColor} />
          </TouchableOpacity>

          <Text style={[s.sheetTitle, { color: sheetTitle }]}>Mã QR</Text>

          {/* Dark / Light toggle */}
          <TouchableOpacity
            style={[s.sheetBtn, { backgroundColor: btnBg }]}
            onPress={toggleDark}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={20}
              color={isDark ? '#F5C842' : '#5B6A8A'}
            />
          </TouchableOpacity>
        </View>

        {/* Theme tiles */}
        <View style={s.themeRow}>
          {THEMES.map((t, i) => (
            <TouchableOpacity
              key={t.id}
              style={[s.themeItem, themeIdx === i && { borderColor: isDark ? t.darkQrColor : '#037EE5' }]}
              onPress={() => selectTheme(i)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isDark ? [t.darkFrom, t.darkTo] : [t.from, t.to]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.themePrev}
              >
                <Animated.View style={{ transform: [{ scale: tileScales[i] }] }}>
                  <ExpoImage source={t.emoji} style={s.tileEmoji} contentFit="contain" autoplay />
                </Animated.View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.shareBtn, isDark && { backgroundColor: theme.darkQrColor }]}
          activeOpacity={0.85}
          onPress={handleShare}
        >
          <Text style={s.shareBtnText}>Chia sẻ mã QR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.scanRow}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/settings/qr-scan')}
        >
          <Ionicons name="qr-code-outline" size={20} color={scanColor} />
          <Text style={[s.scanText, { color: scanColor }]}>Quét mã QR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },

  avatarWrap: {
    zIndex: 10, marginBottom: -38,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 20,
  },
  avatar: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: '#FFF' },
  avatarFallback: { backgroundColor: '#8888AA', justifyContent: 'center', alignItems: 'center' },

  card: {
    borderRadius: 24,
    paddingTop: 48, paddingBottom: 16, paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
  qrWrap: {
    width: QR_SIZE, height: QR_SIZE,
    borderRadius: 10, overflow: 'hidden',
    marginBottom: 12,
  },
  username: { fontSize: 17, fontWeight: '800', letterSpacing: 1.2 },

  sheet: {
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 }, elevation: 16,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, marginBottom: 4,
  },
  sheetBtn: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetTitle: { fontSize: 17, fontWeight: '700' },

  themeRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 4, paddingHorizontal: 2, marginBottom: 2,
  },
  themeItem: {
    borderRadius: 16, borderWidth: 2.5, borderColor: 'transparent',
    overflow: 'hidden', flex: 1, marginHorizontal: 4,
  },
  themePrev: {
    height: 72, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  tileEmoji: { width: 40, height: 40 },

  shareBtn: {
    backgroundColor: '#037EE5', borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', marginTop: 12,
  },
  shareBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

  scanRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 10, paddingVertical: 6,
  },
  scanText: { fontSize: 16, fontWeight: '500' },
});
