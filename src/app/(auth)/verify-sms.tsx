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
    Modal,
    Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verifySmsOTP, registerUser } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';

const CODE_LENGTH = 6;

export default function VerifySmsScreen() {
    const { phoneNumber, email } = useLocalSearchParams<{
        phoneNumber: string;
        email: string;
    }>();
    const router = useRouter();
    const { setIsVerifying } = useAuth();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 300);
    }, []);

    useEffect(() => {
        if (code.length === CODE_LENGTH) {
            handleVerify();
        }
    }, [code]);

    const playSuccessAnimation = () => {
        setShowSuccess(true);
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 3,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleVerify = async () => {
        if (code.length !== CODE_LENGTH) return;
        setIsLoading(true);
        try {
            await verifySmsOTP(code);
            await registerUser(phoneNumber, email);
            playSuccessAnimation();
        } catch (error: any) {
            Alert.alert('Sai mã', error.message || 'Mã SMS không đúng.');
            setCode('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoToChat = () => {
        setShowSuccess(false);
        setIsVerifying(false);
        router.replace('/(tabs)/chat');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        setIsVerifying(false);
                        router.back();
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>

                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="chatbubble-outline" size={40} color="#34C759" />
                    </View>
                </View>

                <Text style={styles.title}>SMS Verification</Text>
                <Text style={styles.subtitle}>
                    We've sent an SMS code to{'\n'}
                    <Text style={styles.phoneText}>{phoneNumber}</Text>
                </Text>

                <View style={styles.infoBadge}>
                    <Ionicons name="information-circle" size={16} color="#856404" />
                    <Text style={styles.infoBadgeText}>
                        Emulator mode: use code 123456
                    </Text>
                </View>

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
                    <ActivityIndicator size="large" color="#34C759" style={{ marginTop: 24 }} />
                )}

                <View style={styles.stepContainer}>
                    <View style={styles.stepRow}>
                        <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                        <Text style={styles.stepTextDone}>Email verified</Text>
                    </View>
                    <View style={styles.stepRow}>
                        <Ionicons name="ellipse" size={20} color="#007AFF" />
                        <Text style={styles.stepTextActive}>SMS verification</Text>
                    </View>
                </View>
            </View>

            {/* Success Modal */}
            <Modal visible={showSuccess} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.successModal}>
                        {/* Animated checkmark */}
                        <Animated.View
                            style={[
                                styles.successIconCircle,
                                { transform: [{ scale: scaleAnim }] },
                            ]}
                        >
                            <Ionicons name="checkmark-circle" size={72} color="#34C759" />
                        </Animated.View>

                        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                            <Text style={styles.successTitle}>Welcome!</Text>
                            <Text style={styles.successSubtitle}>
                                Your account has been created successfully
                            </Text>

                            <View style={styles.successInfoCard}>
                                <View style={styles.successInfoRow}>
                                    <Ionicons name="call-outline" size={16} color="#8E8E93" />
                                    <Text style={styles.successInfoText}>{phoneNumber}</Text>
                                </View>
                                <View style={styles.successDivider} />
                                <View style={styles.successInfoRow}>
                                    <Ionicons name="mail-outline" size={16} color="#8E8E93" />
                                    <Text style={styles.successInfoText}>{email}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.successButton}
                                onPress={handleGoToChat}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
                                <Text style={styles.successButtonText}>Start Messaging</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>
            </Modal>
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
        backgroundColor: '#F0FFF4', justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
    phoneText: { fontWeight: '600', color: '#000000' },
    infoBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FFF3CD', borderRadius: 8,
        paddingVertical: 8, paddingHorizontal: 16, marginBottom: 24,
    },
    infoBadgeText: { fontSize: 13, color: '#856404' },
    codeContainer: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    codeBox: {
        width: 46, height: 54, borderRadius: 10, borderWidth: 1.5,
        borderColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F9F9',
    },
    codeBoxFilled: { borderColor: '#34C759', backgroundColor: '#F0FFF4' },
    codeBoxActive: { borderColor: '#34C759', borderWidth: 2 },
    codeDigit: { fontSize: 22, fontWeight: '700', color: '#000000' },
    hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },
    stepContainer: { marginTop: 40, alignSelf: 'flex-start', paddingLeft: 12 },
    stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    stepTextDone: { fontSize: 14, color: '#34C759', fontWeight: '500' },
    stepTextActive: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
    // Success Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
    },
    successModal: {
        backgroundColor: '#FFFFFF', borderRadius: 20,
        padding: 32, width: '85%', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    },
    successIconCircle: { marginBottom: 16 },
    successTitle: { fontSize: 26, fontWeight: '700', color: '#000000', marginBottom: 8 },
    successSubtitle: {
        fontSize: 15, color: '#8E8E93', textAlign: 'center',
        lineHeight: 20, marginBottom: 24,
    },
    successInfoCard: {
        backgroundColor: '#F9F9F9', borderRadius: 12,
        padding: 16, width: '100%', marginBottom: 24,
    },
    successInfoRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6,
    },
    successInfoText: { fontSize: 14, color: '#333333', fontWeight: '500' },
    successDivider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 6 },
    successButton: {
        backgroundColor: '#007AFF', borderRadius: 14,
        paddingVertical: 16, paddingHorizontal: 32,
        flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%',
        justifyContent: 'center',
    },
    successButtonText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
});
