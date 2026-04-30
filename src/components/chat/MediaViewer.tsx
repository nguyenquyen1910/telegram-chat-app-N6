import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

interface MediaViewerProps {
  visible: boolean;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'file';
  fileName?: string;
  onClose: () => void;
}

export default function MediaViewer({ visible, mediaUrl, mediaType, fileName, onClose }: MediaViewerProps) {
  const [loading, setLoading] = useState(true);

  // HTML để phát video
  const videoHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }
        video {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      <video
        src="${mediaUrl}"
        controls
        autoplay
        playsinline
        style="width:100%; height:100%;"
      ></video>
    </body>
    </html>
  `;

  // HTML để hiện file (dùng Google Docs Viewer cho PDF/DOC/XLS/PPT)
  const getFileViewerUrl = () => {
    const ext = (fileName || mediaUrl).split('.').pop()?.toLowerCase() || '';
    const viewableExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    
    if (viewableExts.includes(ext)) {
      // Google Docs Viewer — mở file public qua proxy, bypass 401
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(mediaUrl)}`;
    }
    return mediaUrl;
  };

  const fileHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100vw;
          height: 100vh;
          font-family: -apple-system, sans-serif;
        }
        iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .fallback {
          text-align: center;
          padding: 40px 20px;
        }
        .fallback .icon { font-size: 64px; margin-bottom: 16px; }
        .fallback .name { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 8px; word-break: break-all; }
        .fallback .hint { font-size: 14px; color: #888; }
        .btn {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 32px;
          background: #50A8EB;
          color: white;
          border-radius: 24px;
          text-decoration: none;
          font-size: 16px;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <iframe src="${getFileViewerUrl()}" onload="document.querySelector('.fallback')?.remove()"></iframe>
      <div class="fallback">
        <div class="icon">📄</div>
        <div class="name">${fileName || 'File'}</div>
        <div class="hint">Đang tải file...</div>
      </div>
    </body>
    </html>
  `;

  const renderContent = () => {
    switch (mediaType) {
      case 'image':
        return (
          <Image
            source={{ uri: mediaUrl }}
            style={styles.image}
            resizeMode="contain"
            onLoadEnd={() => setLoading(false)}
          />
        );
      case 'video':
        return (
          <WebView
            source={{ html: videoHtml }}
            style={styles.webview}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            onLoadEnd={() => setLoading(false)}
          />
        );
      case 'file':
        return (
          <WebView
            source={{ html: fileHtml }}
            style={[styles.webview, { backgroundColor: '#f5f5f5' }]}
            javaScriptEnabled
            domStorageEnabled
            onLoadEnd={() => setLoading(false)}
          />
        );
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false} statusBarTranslucent>
      <View style={[styles.container, mediaType === 'file' && { backgroundColor: '#f5f5f5' }]}>
        <StatusBar barStyle={mediaType === 'file' ? 'dark-content' : 'light-content'} backgroundColor={mediaType === 'file' ? '#f5f5f5' : '#000'} />

        {/* Header */}
        <View style={[styles.header, mediaType === 'file' && styles.headerFile]}>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, mediaType === 'file' && styles.closeBtnFile]}>
            <Ionicons name="close" size={28} color={mediaType === 'file' ? '#333' : '#FFF'} />
          </TouchableOpacity>
          {mediaType === 'file' && fileName && (
            <Text style={styles.headerTitle} numberOfLines={1}>{fileName}</Text>
          )}
        </View>

        {/* Content */}
        <View style={[
          styles.content,
          mediaType === 'image' ? styles.contentFullscreen : styles.contentWithHeader,
        ]}>
          {loading && (
            <ActivityIndicator size="large" color={mediaType === 'file' ? '#50A8EB' : '#FFF'} style={styles.loader} />
          )}
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: STATUSBAR_HEIGHT + 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerFile: {
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnFile: {
    backgroundColor: '#E8E8E8',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentFullscreen: {
    marginTop: 0,
  },
  contentWithHeader: {
    marginTop: STATUSBAR_HEIGHT + 60,
  },
  loader: {
    position: 'absolute',
    zIndex: 5,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  webview: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
  },
});
