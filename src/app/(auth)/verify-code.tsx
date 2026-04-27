import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verifyEmailOTP, resendEmailOTP, loginUser } from '@/services/auth';

const CODE_LENGTH = 6;

export default function VerifyCodeScreen() {
    const { phoneNumber, email, mode } = useLocalSearchParams<{
        phoneNumber: string;
        email: string;
        mode: 'login' | 'register';
    }>();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const inputRef = useRef<TextInput>(null);

    const isLoginMode = mode === 'login';

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 300);
    }, []);

    useEffect(() => {
        if (code.length === CODE_LENGTH) {
            handleVerify();
        }
    }, [code]);

    const handleVerify = async () => {
        if (code.length !== CODE_LENGTH) return;
        setIsLoading(true);
        try {
            await verifyEmailOTP(code);

            if (isLoginMode) {
                await loginUser(phoneNumber);
                router.replace('/(tabs)/chat');
            } else {
                router.push({
                    pathname: '/(auth)/verify-sms',
                    params: { phoneNumber, email },
                });
            }
        } catch (error: any) {
            Alert.alert('Sai mã', error.message || 'Mã xác thực không đúng.');
            setCode('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        try {
            await resendEmailOTP();
            setCountdown(60);
            Alert.alert('Đã gửi', 'Mã xác thực mới đã được gửi tới email.');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể gửi lại mã.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Back button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/(auth)/welcome');
                        }
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>

                {/* Header icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="mail-outline" size={40} color="#007AFF" />
                    </View>
                </View>

                <Text style={styles.title}>
                    {isLoginMode ? 'Login Verification' : 'Email Verification'}
                </Text>
                <Text style={styles.subtitle}>
                    We've sent a verification code to{'\n'}
                    <Text style={styles.emailText}>{email}</Text>
                </Text>

                {/* Phone info */}
                <View style={styles.phoneInfoRow}>
                    <Ionicons name="call-outline" size={16} color="#8E8E93" />
                    <Text style={styles.phoneInfoValue}>{phoneNumber}</Text>
                </View>

                {/* Code input boxes */}
                <TouchableOpacity 
                    style={styles.codeContainer} 
                    onPress={() => inputRef.current?.focus()} 
                    activeOpacity={1}
                >
                    {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.codeBox,
                                index < code.length && styles.codeBoxFilled,
                                index === code.length && styles.codeBoxActive,
                            ]}
                        >
                            <Text style={styles.codeDigit}>
                                {code[index] || ''}
                            </Text>
                        </View>
                    ))}
                </TouchableOpacity>

                {/* Hidden input */}
                <TextInput
                    ref={inputRef}
                    style={styles.hiddenInput}
                    value={code}
                    onChangeText={(text) => {
                        if (text.length <= CODE_LENGTH) {
                            setCode(text.replace(/[^0-9]/g, ''));
                        }
                    }}
                    keyboardType="number-pad"
                    maxLength={CODE_LENGTH}
                    autoFocus
                />

                {isLoading && (
                    <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 24 }} />
                )}

                {/* Resend */}
                <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResend}
                    disabled={countdown > 0}
                >
                    <Ionicons
                        name="refresh-outline"
                        size={16}
                        color={countdown > 0 ? '#C7C7CC' : '#007AFF'}
                        style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
                        {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Gửi lại mã'}
                    </Text>
                </TouchableOpacity>

                {/* Hint */}
                <View style={styles.hintRow}>
                    <Ionicons name="information-circle-outline" size={16} color="#8E8E93" />
                    <Text style={styles.hintText}>
                        Check your email inbox (and spam folder) for the code.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 16, alignItems: 'center' },
    backButton: { alignSelf: 'flex-start', marginBottom: 16, padding: 8 },
    iconContainer: { marginBottom: 16 },
    iconCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
    emailText: { fontWeight: '600', color: '#007AFF' },
    phoneInfoRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7',
        borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, marginBottom: 24, gap: 8,
    },
    phoneInfoValue: { fontSize: 15, fontWeight: '500', color: '#000000' },
    codeContainer: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    codeBox: {
        width: 46, height: 54, borderRadius: 10, borderWidth: 1.5,
        borderColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F9F9',
    },
    codeBoxFilled: { borderColor: '#007AFF', backgroundColor: '#F0F7FF' },
    codeBoxActive: { borderColor: '#007AFF', borderWidth: 2 },
    codeDigit: { fontSize: 22, fontWeight: '700', color: '#000000' },
    hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },
    resendButton: { flexDirection: 'row', alignItems: 'center', marginTop: 32, paddingVertical: 12 },
    resendText: { fontSize: 15, color: '#007AFF', fontWeight: '500' },
    resendTextDisabled: { color: '#C7C7CC' },
    hintRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 6 },
    hintText: { fontSize: 13, color: '#8E8E93', lineHeight: 18 },
});