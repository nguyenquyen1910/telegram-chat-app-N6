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
    Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { verifySmsOTP, changePhoneNumber } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';
import { formatPhoneNumber } from '@/utils/format';

const CODE_LENGTH = 6;

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
                        // dismissAll xóa toàn bộ modal stack (change-phone-new + verify)
                        // rồi navigate về settings để không còn đường back về màn verify
                        router.dismissAll();
                        router.replace('/(tabs)/settings');
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
                {/* Icon vòng tròn */}
                <View style={s.iconRing}>
                    <Ionicons name="phone-portrait-outline" size={36} color={BLUE} />
                </View>

                <Text style={s.title}>Nhập mã SMS</Text>

                {/* Số mới hiển thị */}
                <View style={s.phoneChip}>
                    <Ionicons name="call-outline" size={15} color={BLUE} />
                    <Text style={s.phoneChipText}>{formatPhoneNumber(newPhone)}</Text>
                </View>

                <Text style={s.hint}>
                    Mã xác thực đã được gửi đến số điện thoại trên.
                </Text>

                {/* ── Dev badge ── */}
                <View style={s.devBadge}>
                    <Ionicons name="code-slash-outline" size={14} color="#856404" />
                    <Text style={s.devText}>
                        Chế độ phát triển: nhập mã{' '}
                        <Text style={s.devCode}>123456</Text>
                    </Text>
                </View>

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
    screen: { flex: 1, backgroundColor: BG },
    safeTop: { backgroundColor: BG },

    // Header – giống edit-profile
    header: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        backgroundColor: BG,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: SEP,
    },
    backBtn: {
        width: 44, height: 44,
        justifyContent: 'center', alignItems: 'center',
    },
    backArrow: {
        fontSize: 40, color: BLUE,
        lineHeight: 48, marginTop: -6, fontWeight: '300',
    },
    headerTitle: {
        fontSize: 17, fontWeight: '600', color: '#000',
    },

    // Content
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 36,
    },

    // Icon
    iconRing: {
        width: 76, height: 76, borderRadius: 38,
        backgroundColor: '#E8F2FF',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 20,
    },

    title: {
        fontSize: 22, fontWeight: '700',
        color: '#000', marginBottom: 16,
    },

    // Phone chip
    phoneChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 8,
        marginBottom: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: SEP,
    },
    phoneChipText: {
        fontSize: 15, fontWeight: '600', color: '#000',
    },

    hint: {
        fontSize: 14, color: '#8E8E93',
        textAlign: 'center', lineHeight: 20,
        marginBottom: 20, paddingHorizontal: 8,
    },

    // Dev badge
    devBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FFF9C4',
        borderRadius: 8,
        paddingVertical: 7, paddingHorizontal: 14,
        marginBottom: 28,
    },
    devText: { fontSize: 13, color: '#856404' },
    devCode: { fontWeight: '700', fontFamily: 'monospace' },

    // OTP boxes
    codeRow: {
        flexDirection: 'row', gap: 10,
        marginBottom: 8,
    },
    box: {
        width: 46, height: 54, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#D1D1D6',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center', alignItems: 'center',
    },
    boxFilled: { borderColor: BLUE, backgroundColor: '#EEF5FF' },
    boxActive: { borderColor: BLUE, borderWidth: 2 },
    boxDigit: { fontSize: 24, fontWeight: '700', color: '#000' },

    hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },

    // Resend
    resendRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 14, marginTop: 24,
    },
    resendText: { fontSize: 15, fontWeight: '500', color: BLUE },
    resendDisabled: { color: '#C7C7CC' },
});
