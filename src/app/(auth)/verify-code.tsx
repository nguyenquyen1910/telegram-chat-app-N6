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
import { verifyEmailOTP, resendEmailOTP } from '@/services/auth';

const CODE_LENGTH = 6;

export default function VerifyCodeScreen() {
    const { phoneNumber, email } = useLocalSearchParams<{ phoneNumber: string; email: string }>();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const inputRef = useRef<TextInput>(null);

    // Countdown timer for resend
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

    // When enter full code → auto verify
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
            // If success → redirect to main chat screen
            router.replace('/(tabs)/chat');
        } catch (error: any) {
            Alert.alert('Sai mã', error.message || 'Mã xác thực không đúng. Vui lòng thử lại.');
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
            Alert.alert('Đã gửi', 'Mã xác thực mới đã được gửi tới email của bạn.');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể gửi lại mã. Vui lòng thử lại.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Back button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>

                {/* Header icon */}
                <View style={styles.iconContainer}>
                    <Text style={styles.lockIcon}>📧</Text>
                </View>

                <Text style={styles.title}>Enter Code</Text>
                <Text style={styles.subtitle}>
                    We've sent a verification code to{'\n'}
                    <Text style={styles.emailText}>{email}</Text>
                </Text>

                {/* Phone info */}
                <View style={styles.phoneInfoRow}>
                    <Text style={styles.phoneInfoLabel}>📞</Text>
                    <Text style={styles.phoneInfoValue}>{phoneNumber}</Text>
                </View>

                {/* Code input boxes */}
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

                {/* Hidden real input for keyboard */}
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

                {/* Hint text */}
                <Text style={styles.hintText}>
                    💡 Check your email inbox (and spam folder) for the code.
                </Text>
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
        paddingTop: 20,
        alignItems: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 16,
        paddingVertical: 8,
    },
    backText: {
        fontSize: 17,
        color: '#007AFF',
        fontWeight: '500',
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
        marginBottom: 16,
    },
    emailText: {
        fontWeight: '600',
        color: '#007AFF',
    },
    phoneInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    phoneInfoLabel: {
        fontSize: 16,
        marginRight: 8,
    },
    phoneInfoValue: {
        fontSize: 15,
        fontWeight: '500',
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
    hintText: {
        fontSize: 13,
        color: '#8E8E93',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 18,
    },
});