import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { WebView } from 'react-native-webview';
import { useAuth } from '@/context/AuthContext';
import { getOrCreateConversation } from '@/services/chatService';

const { width: SW, height: SH } = Dimensions.get('window');
const FINDER = SW * 0.65;

// HTML cho jsQR: load script TRƯỚC, sau đó mới xử lý ảnh
function makeDecoderHtml(base64: string) {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head><body style="margin:0;background:#000">
<canvas id="c" style="display:none"></canvas>
<script>
// Timeout 12s phòng CDN chậm
var _timeout = setTimeout(function() {
  window.ReactNativeWebView.postMessage(JSON.stringify({ ok: false, err: 'timeout' }));
}, 12000);

function runDecode() {
  clearTimeout(_timeout);
  var img = new Image();
  img.onload = function() {
    var c = document.getElementById('c');
    c.width = img.width; c.height = img.height;
    var ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var d = ctx.getImageData(0, 0, img.width, img.height);
    var code = jsQR(d.data, d.width, d.height, { inversionAttempts: 'attemptBoth' });
    if (code) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ ok: true, data: code.data }));
    } else {
      window.ReactNativeWebView.postMessage(JSON.stringify({ ok: false }));
    }
  };
  img.onerror = function() {
    window.ReactNativeWebView.postMessage(JSON.stringify({ ok: false, err: 'img_error' }));
  };
  img.src = 'data:image/jpeg;base64,${base64}';
}

// Load jsQR từ CDN rồi mới chạy decode
var s = document.createElement('script');
s.onload = runDecode;
s.onerror = function() {
  window.ReactNativeWebView.postMessage(JSON.stringify({ ok: false, err: 'script_error' }));
};
s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
document.head.appendChild(s);
</script></body></html>`;
}

export default function QRScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [navigating, setNavigating] = useState(false);
  // Gallery QR decoder
  const [decoderHtml, setDecoderHtml] = useState<string | null>(null);
  const [decoderLoading, setDecoderLoading] = useState(false);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  const handleScan = async ({ data }: BarcodeScanningResult) => {
    if (scanned || navigating) return;
    setScanned(true);

    const match = data.match(/^tgapp:\/\/user\/(.+)$/);
    if (!match) {
      Alert.alert(
        'Mã QR không hợp lệ',
        'Đây không phải mã QR của ứng dụng.',
        [{ text: 'Quét lại', onPress: () => setScanned(false) }]
      );
      return;
    }

    const scannedUid = match[1];
    const currentUid = (user as any)?.uid;

    if (!currentUid) {
      Alert.alert('Lỗi', 'Bạn chưa đăng nhập.', [{ text: 'OK', onPress: () => setScanned(false) }]);
      return;
    }

    if (scannedUid === currentUid) {
      Alert.alert('Thông báo', 'Đây là mã QR của chính bạn.', [{ text: 'OK', onPress: () => setScanned(false) }]);
      return;
    }

    try {
      setNavigating(true);
      const chatId = await getOrCreateConversation(currentUid, scannedUid);

      // 1. Đóng hết modal settings (qr-scan + qr-code)
      router.dismissAll();

      // 2. Reset tab chat về danh sách (xóa stack cũ), sau đó push chat detail
      //    dùng setTimeout nhỏ để dismissAll hoàn tất trước
      setTimeout(() => {
        router.navigate('/(tabs)/chat' as any);          // về root chat list
        setTimeout(() => {
          router.push({ pathname: '/(tabs)/chat/[chatId]', params: { chatId } } as any);
        }, 80);
      }, 50);
    } catch (err) {
      console.error('[QRScan] getOrCreateConversation error:', err);
      Alert.alert('Lỗi', 'Không thể mở cuộc trò chuyện. Vui lòng thử lại.', [
        { text: 'Quét lại', onPress: () => { setScanned(false); setNavigating(false); } },
      ]);
    }
  };

  // Xử lý kết quả decode từ WebView jsQR
  const handleDecoderMessage = async (event: any) => {
    setDecoderHtml(null);
    setDecoderLoading(false);

    let result: { ok: boolean; data?: string; err?: string };
    try { result = JSON.parse(event.nativeEvent.data); }
    catch { return; }

    if (!result.ok) {
      const msg = result.err === 'timeout'
        ? 'Quá trình đọc QR bị timeout. Vui lòng kiểm tra kết nối internet và thử lại.'
        : result.err === 'script_error'
        ? 'Không thể tải thư viện đọc QR. Vui lòng kiểm tra kết nối internet.'
        : 'Không tìm thấy mã QR trong ảnh này. Hãy chọn ảnh chụp rõ mã QR.';
      Alert.alert('Không đọc được QR', msg, [{ text: 'OK' }]);
      return;
    }

    // Dùng chung logic handleScan
    const match = result.data!.match(/^tgapp:\/\/user\/(.+)$/);
    if (!match) {
      Alert.alert('Mã QR không hợp lệ', 'Đây không phải mã QR của ứng dụng.');
      return;
    }
    const scannedUid = match[1];
    const currentUid = (user as any)?.uid;
    if (!currentUid) { Alert.alert('Lỗi', 'Bạn chưa đăng nhập.'); return; }
    if (scannedUid === currentUid) {
      Alert.alert('Thông báo', 'Đây là mã QR của chính bạn.');
      return;
    }
    try {
      setNavigating(true);
      const chatId = await getOrCreateConversation(currentUid, scannedUid);
      router.dismissAll();
      setTimeout(() => {
        router.navigate('/(tabs)/chat' as any);
        setTimeout(() => {
          router.push({ pathname: '/(tabs)/chat/[chatId]', params: { chatId } } as any);
        }, 80);
      }, 50);
    } catch {
      setNavigating(false);
      Alert.alert('Lỗi', 'Không thể mở cuộc trò chuyện.');
    }
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (res.canceled || !res.assets?.[0]) return;

    setDecoderLoading(true);
    try {
      // Resize xuống tối đa 1000px để jsQR xử lý nhanh hơn
      const manipulated = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 1000 } }],
        { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (!manipulated.base64) throw new Error('no_base64');
      setDecoderHtml(makeDecoderHtml(manipulated.base64));
    } catch {
      setDecoderLoading(false);
      Alert.alert('Lỗi', 'Không thể đọc ảnh. Vui lòng thử lại.');
    }
  };

  if (hasPermission === false) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Ionicons name="camera-off-outline" size={56} color="#666" />
        <Text style={{ color: '#AAA', marginTop: 12, textAlign: 'center', paddingHorizontal: 32 }}>
          Không có quyền camera.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#037EE5', fontSize: 16 }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera full screen */}
      {hasPermission && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleScan}
        />
      )}

      {/* Dark overlay with transparent finder hole */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top dark */}
        <View style={[s.darkBlock, { height: (SH - FINDER) / 2 }]} />
        <View style={{ flexDirection: 'row', height: FINDER }}>
          <View style={[s.darkBlock, { flex: 1 }]} />
          {/* Transparent finder zone */}
          <View style={{ width: FINDER }} />
          <View style={[s.darkBlock, { flex: 1 }]} />
        </View>
        {/* Bottom dark */}
        <View style={[s.darkBlock, { flex: 1 }]} />
      </View>

      {/* Finder corners */}
      <View style={[s.finderWrap, {
        top: (SH - FINDER) / 2,
        left: (SW - FINDER) / 2,
        width: FINDER,
        height: FINDER,
      }]} pointerEvents="none">
        <View style={[s.corner, s.tl]} />
        <View style={[s.corner, s.tr]} />
        <View style={[s.corner, s.bl]} />
        <View style={[s.corner, s.br]} />
      </View>

      {/* ── Header: Back ── */}
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
          <Text style={s.backText}>Quay lại</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom Buttons ── */}
      <View style={[s.bottomRow, { bottom: insets.bottom + 40 }]}>
        {/* Gallery */}
        <TouchableOpacity style={s.circleBtn} onPress={pickFromGallery} activeOpacity={0.7}>
          <Ionicons name="image-outline" size={26} color="#FFF" />
        </TouchableOpacity>

        {/* Torch */}
        <TouchableOpacity style={[s.circleBtn, torch && s.circleBtnActive]} onPress={() => setTorch(t => !t)} activeOpacity={0.7}>
          <Ionicons name="flashlight" size={26} color={torch ? '#FFD700' : '#FFF'} />
        </TouchableOpacity>
      </View>
      {/* Hidden WebView jsQR decoder */}
      {decoderHtml && (
        <WebView
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          source={{ html: decoderHtml }}
          originWhitelist={['*']}
          javaScriptEnabled
          onMessage={handleDecoderMessage}
          onError={() => {
            setDecoderHtml(null);
            setDecoderLoading(false);
            Alert.alert('Lỗi', 'Không thể khởi tạo bộ đọc QR.');
          }}
        />
      )}

      {/* Loading / Navigating overlay */}
      {(navigating || decoderLoading) && (
        <View style={s.navOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={{ color: '#FFF', marginTop: 12, fontSize: 15 }}>
            {navigating ? 'Đang mở cuộc trò chuyện...' : 'Đang đọc mã QR...'}
          </Text>
        </View>
      )}
    </View>
  );
}

const CORNER_SIZE = 28;
const BORDER = 3;
const RADIUS = 6;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },

  darkBlock: { backgroundColor: 'rgba(0,0,0,0.72)' },

  finderWrap: { position: 'absolute' },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#FFF',
  },
  tl: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderTopLeftRadius: RADIUS },
  tr: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER, borderTopRightRadius: RADIUS },
  bl: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderBottomLeftRadius: RADIUS },
  br: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderBottomRightRadius: RADIUS },

  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: 8,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 4,
    alignSelf: 'flex-start',
  },
  backText: { color: '#FFF', fontSize: 17, fontWeight: '400' },

  bottomRow: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
  },
  circleBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(80,80,80,0.75)',
    justifyContent: 'center', alignItems: 'center',
  },
  circleBtnActive: {
    backgroundColor: 'rgba(120,100,20,0.8)',
  },
  navOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
