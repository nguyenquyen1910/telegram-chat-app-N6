import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { verifySmsOTP, changePhoneNumber } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';
import { formatPhoneNumber } from '@/utils/format';
import { Image } from 'expo-image';

const CODE_LENGTH = 6;

// (Đã chuyển sang sử dụng expo-image và local asset để tối ưu tốc độ)

export default function ChangePhoneVerifyScreen() {
    const { newPhone } = useLocalSearchParams<{ newPhone: string }>();
    const router = useRouter();
    const { user, updatePhoneNumber } = useAuth();
    const insets = useSafeAreaInsets();

    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const inputRef = useRef<TextInput>(null);

    // Đếm ngược gửi lại
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => setCountdown(p => p - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    // Auto-focus
    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 300);
        return () => clearTimeout(t);
    }, []);

    // Auto-verify khi đủ 6 ký tự
    useEffect(() => {
        if (code.length === CODE_LENGTH) handleVerify();
    }, [code]);

    const handleVerify = async () => {
        if (code.length !== CODE_LENGTH) return;
        setIsLoading(true);
        try {
            await verifySmsOTP(code);

            if (user?.uid) {
                await changePhoneNumber(user.uid, newPhone);
                updatePhoneNumber(newPhone);
            }

            Alert.alert(
                'Thành công',
                `Số điện thoại đã được đổi thành\n${formatPhoneNumber(newPhone)}`,
                [{
                    text: 'Xong',
                    onPress: () => {
                        // Lùi lại đúng 2 màn hình trong stack 
                        // (Từ Verify -> qua New -> về Profile) để đảm bảo nút Back hoạt động đúng.
                        router.dismiss(2);
                    }
                }]
            );
        } catch (error: any) {
            Alert.alert('Sai mã', error.message || 'Mã xác thực không đúng. Hãy thử lại.');
            setCode('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = () => {
        if (countdown > 0) return;
        setCountdown(60);
        Alert.alert('Đã gửi', 'Mã xác thực mới đã được gửi.');
    };

    return (
        <View style={s.screen}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
            <SafeAreaView style={s.safeTop} edges={['top']}>

                {/* ── Header ─────────────────────────────────────────────── */}
                <View style={s.header}>
                    <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                        <Text style={s.backArrow}>‹</Text>
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Xác nhận mã</Text>
                    <View style={{ width: 44 }} />
                </View>
            </SafeAreaView>

            {/* ── Content card ─────────────────────────────────────────── */}
            <View style={s.content}>
                {/* Sticker */}
                <View style={s.illustrationWrap}>
                    <Image
                        source={require('@/assets/stickers/speech_balloon.webp')}
                        style={StyleSheet.absoluteFill}
                        contentFit="contain"
                    />
                </View>

                <Text style={s.title}>Nhập mã code</Text>

                <Text style={s.hint}>
                    Chúng tôi đã gửi một tin nhắn SMS chứa mã kích hoạt tới điện thoại của bạn <Text style={s.hintPhone}>{formatPhoneNumber(newPhone)}</Text>
                </Text>

                {/* ── OTP boxes ── */}
                <TouchableOpacity
                    style={s.codeRow}
                    onPress={() => inputRef.current?.focus()}
                    activeOpacity={1}
                >
                    {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                s.box,
                                i < code.length && s.boxFilled,
                                i === code.length && s.boxActive,
                            ]}
                        >
                            <Text style={s.boxDigit}>{code[i] || ''}</Text>
                        </View>
                    ))}
                </TouchableOpacity>

                {/* Hidden input */}
                <TextInput
                    ref={inputRef}
                    style={s.hiddenInput}
                    value={code}
                    onChangeText={t => {
                        if (t.length <= CODE_LENGTH) setCode(t.replace(/[^0-9]/g, ''));
                    }}
                    keyboardType="number-pad"
                    maxLength={CODE_LENGTH}
                    autoFocus
                />

                {isLoading && (
                    <ActivityIndicator color={BLUE} style={{ marginTop: 20 }} />
                )}

                {/* Gửi lại */}
                <TouchableOpacity
                    style={s.resendRow}
                    onPress={handleResend}
                    disabled={countdown > 0}
                >
                    <Ionicons
                        name="refresh-outline"
                        size={15}
                        color={countdown > 0 ? '#C7C7CC' : BLUE}
                    />
                    <Text style={[s.resendText, countdown > 0 && s.resendDisabled]}>
                        {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const BLUE = '#037EE5';
const BG = '#F2F2F7';
const SEP = 'rgba(60,60,67,0.29)';

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#FFFFFF' },
    safeTop: { backgroundColor: '#FFFFFF' },

    // Header
    header: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 44, height: 44,
        justifyContent: 'center', alignItems: 'center',
    },
    backArrow: {
        fontSize: 32, color: '#000',
        lineHeight: 38, fontWeight: '300',
    },
    headerTitle: {
        display: 'none',
    },

    // Content
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 40,
        backgroundColor: '#FFFFFF',
    },

    // Sticker
    illustrationWrap: {
        width: 100, height: 100,
        marginBottom: 16,
        backgroundColor: 'transparent',
    },

    title: {
        fontSize: 24, fontWeight: '700',
        color: '#000', marginBottom: 12,
    },

    hint: {
        fontSize: 15, color: '#8E8E93',
        textAlign: 'center', lineHeight: 22,
        marginBottom: 32,
    },
    hintPhone: {
        fontWeight: '600', color: '#000',
    },

    // OTP boxes
    codeRow: {
        flexDirection: 'row', gap: 8,
        marginBottom: 8,
    },
    box: {
        width: 44, height: 54, borderRadius: 10,
        borderWidth: 1, borderColor: '#D1D1D6',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center', alignItems: 'center',
    },
    boxFilled: { borderColor: '#D1D1D6', backgroundColor: '#FFFFFF' },
    boxActive: { borderColor: '#3882F8', borderWidth: 2 },
    boxDigit: { fontSize: 24, fontWeight: '600', color: '#000' },

    hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },

    // Resend
    resendRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 14, marginTop: 24,
    },
    resendText: { fontSize: 15, fontWeight: '500', color: BLUE },
    resendDisabled: { color: '#C7C7CC' },
});
