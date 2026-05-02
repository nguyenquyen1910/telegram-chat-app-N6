import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { loadProfile, saveProfile, checkUsernameExists } from '@/services/profileService';

export default function EditUsernameScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [initialUsername, setInitialUsername] = useState('');
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load initial username
  useEffect(() => {
    if (!user?.uid) return;
    loadProfile(user.uid).then((p) => {
      if (p.username) {
        setInitialUsername(p.username);
        setUsername(p.username);
      }
    });
  }, [user?.uid]);

  // Debounced Validation
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    
    const val = username.trim();
    if (val === '') {
      return;
    }

    if (val === initialUsername) {
      // Unchanged is valid
      return;
    }

    // Length check
    if (val.length < 5) {
      setErrorMsg('Độ dài tối thiểu là 5 ký tự.');
      return;
    }

    // Regex check: a-z, 0-9, _
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      setErrorMsg('Chỉ được sử dụng a-z, 0-9 và gạch dưới.');
      return;
    }

    // Firebase check
    setIsChecking(true);
    const timeoutId = setTimeout(async () => {
      try {
        const exists = await checkUsernameExists(val, user?.uid);
        if (exists) {
          setErrorMsg('Tên đã tồn tại.');
        } else {
          setSuccessMsg(`${val} dùng được.`);
        }
      } catch (e) {
        setErrorMsg('Lỗi kiểm tra mạng.');
      } finally {
        setIsChecking(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [username, initialUsername, user?.uid]);

  const canSave = !isChecking && !errorMsg && !isSaving && (username.trim() === '' || username.trim().length >= 5);

  const handleSave = async () => {
    if (!canSave || !user?.uid) return;
    setIsSaving(true);
    try {
      await saveProfile(user.uid, { username: username.trim() });
      router.back();
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

  const getStatusColor = () => {
    if (errorMsg) return '#FF3B30';
    if (successMsg) return '#34C759';
    return '#8E8E93';
  };

  return (
    <KeyboardAvoidingView style={s.modalWrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.4)" />
      
      {/* Backdrop */}
      <TouchableOpacity 
        style={StyleSheet.absoluteFill} 
        activeOpacity={1} 
        onPress={() => router.back()} 
      />

      {/* Modal Content */}
      <View style={s.sheetContainer}>
        <SafeAreaView style={s.safeTop} edges={['top']}>
          
          {/* ── Header ─────────────────────────────────────────────── */}
          <View style={s.header}>
            <TouchableOpacity style={s.navBtn} onPress={() => router.back()}>
              <Text style={s.navBtnText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Tên người dùng</Text>
            <TouchableOpacity style={s.navBtn} onPress={handleSave} disabled={!canSave}>
              {isSaving ? (
                <ActivityIndicator color="#037EE5" />
              ) : (
                <Text style={[s.navBtnText, !canSave && s.navBtnTextDisabled, { fontWeight: '600' }]}>Xong</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Content ────────────────────────────────────────────── */}
          <View style={s.content}>
            <Text style={s.sectionTitle}>TÊN NGƯỜI DÙNG</Text>
            
            <View style={s.inputContainer}>
              <Text style={s.inputPrefix}>Tên người dùng</Text>
              <TextInput
                style={s.input}
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                placeholderTextColor="#C7C7CC"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSave}
                autoFocus
              />
              {isChecking ? (
                <ActivityIndicator size="small" color="#8E8E93" style={{ marginRight: 16 }} />
              ) : username.length > 0 ? (
                <TouchableOpacity onPress={() => setUsername('')} style={s.clearBtn}>
                  <Ionicons name="close-circle" size={16} color="#C7C7CC" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Validation Message */}
            <View style={s.messageContainer}>
              {(errorMsg || successMsg) ? (
                <Text style={[s.statusText, { color: getStatusColor() }]}>
                  {errorMsg || successMsg}
                </Text>
              ) : null}

              <Text style={s.helperText}>
                Bạn có thể chọn tên người dùng trên <Text style={{ fontWeight: '600' }}>Telegram</Text>. Mọi người sẽ có thể tìm bạn bằng tên người dùng này và liên lạc với bạn mà không cần số điện thoại.
              </Text>
              
              <Text style={[s.helperText, { marginTop: 16 }]}>
                Bạn có thể sử dụng <Text style={{ fontWeight: '600' }}>a-z, 0-9</Text> và gạch dưới. Độ dài tối thiểu là <Text style={{ fontWeight: '600' }}>5 ký tự</Text>.
              </Text>

              {username.trim().length >= 5 && !errorMsg ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={s.helperText}>Link này mở cuộc chat với bạn:</Text>
                  <Text style={s.linkText}>https://t.me/{username.trim()}</Text>
                </View>
              ) : null}
            </View>

          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)', // Dimmed background
  },
  sheetContainer: {
    flex: 1,
    marginTop: 12, // Space from top to simulate iOS page sheet (small gap)
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
  },
  safeTop: { flex: 1 },
  
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  navBtn: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  navBtnText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  navBtnTextDisabled: {
    color: '#8E8E93',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },

  content: {
    flex: 1,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 32,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 48,
    paddingLeft: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  inputPrefix: {
    fontSize: 17,
    color: '#000',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    height: '100%',
  },
  clearBtn: {
    padding: 12,
  },
  messageContainer: {
    paddingHorizontal: 32,
    paddingTop: 12,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 12,
  },
  helperText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#037EE5',
    lineHeight: 20,
    marginTop: 2,
  },
});
