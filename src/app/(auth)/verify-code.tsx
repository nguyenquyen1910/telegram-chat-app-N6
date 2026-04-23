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
import { sendOTP, verifyOTP } from '@/services/auth';
const CODE_LENGTH = 6;
export default function VerifyCodeScreen() {
    const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const inputRef = useRef<TextInput>(null);
    // Countdown timer other send again OTP
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);
    // Auto focus input when open screen
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 300);
    }, []);
    // When enter code → auto verify
    useEffect(() => {
        if (code.length === CODE_LENGTH) {
            handleVerify();
        }
    }, [code]);
    const handleVerify = async () => {
        if (code.length !== CODE_LENGTH) return;
        setIsLoading(true);
        try {
            await verifyOTP(code);
            // If success, AuthContext will auto detect user → redirect to (tabs)
            router.replace('/(tabs)/chat');
        } catch (error: any) {
            Alert.alert('Wrong code', 'The verification code is incorrect. Please try again.');
            setCode('');
        } finally {
            setIsLoading(false);
        }
    };
    const handleResend = async () => {
        if (countdown > 0 || !phoneNumber) return;
        try {
            await sendOTP(phoneNumber);
            setCountdown(60);
            Alert.alert('Đã gửi', 'Mã OTP mới đã được gửi.');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể gửi lại mã. Vui lòng thử lại.');
        }
    };
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header icon */}
                <View style={styles.iconContainer}>
                    <Text style={styles.lockIcon}>💬</Text>
                </View>
                <Text style={styles.title}>Enter Code</Text>
                <Text style={styles.subtitle}>
                    We've sent an SMS with an activation code{'\n'}to your phone{' '}
                    <Text style={styles.phoneText}>{phoneNumber}</Text>
                </Text>
                {/* show code input */}
                <View style={styles.codeContainer}>
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
                </View>
                {/* Hidden real input for catch keyboard */}
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
                {/* Loading indicator */}
                {isLoading && (
                    <ActivityIndicator
                        size="large"
                        color="#007AFF"
                        style={{ marginTop: 24 }}
                    />
                )}
                {/* Resend code button */}
                <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResend}
                    disabled={countdown > 0}
                >
                    <Text
                        style={[
                            styles.resendText,
                            countdown > 0 && styles.resendTextDisabled,
                        ]}
                    >
                        {countdown > 0
                            ? `Gửi lại mã sau ${countdown}s`
                            : 'Gửi lại mã'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 16,
    },
    lockIcon: {
        fontSize: 64,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    phoneText: {
        fontWeight: '600',
        color: '#000000',
    },
    codeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    codeBox: {
        width: 48,
        height: 56,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
    },
    codeBoxFilled: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F7FF',
    },
    codeBoxActive: {
        borderColor: '#007AFF',
        borderWidth: 2,
    },
    codeDigit: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000000',
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
        height: 0,
        width: 0,
    },
    resendButton: {
        marginTop: 32,
        paddingVertical: 12,
    },
    resendText: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: '500',
    },
    resendTextDisabled: {
        color: '#C7C7CC',
    },
});