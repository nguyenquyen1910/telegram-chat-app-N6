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
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';

export default function SetupProfileScreen() {
    const { phoneNumber, email } = useLocalSearchParams<{
        phoneNumber: string;
        email: string;
    }>();
    const router = useRouter();
    const { setIsVerifying, isAddingAccount, setAddingAccount } = useAuth();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const firstNameRef = useRef<TextInput>(null);
    const lastNameRef = useRef<TextInput>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        setTimeout(() => firstNameRef.current?.focus(), 400);
    }, []);

    const handleContinue = async () => {
        const trimmedFirst = firstName.trim();
        if (!trimmedFirst) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên của bạn.');
            return;
        }

        setIsLoading(true);
        try {
            const displayName = lastName.trim()
                ? `${trimmedFirst} ${lastName.trim()}`
                : trimmedFirst;

            await registerUser(phoneNumber, email, displayName);
            setIsVerifying(false);
            if (isAddingAccount) {
                setAddingAccount(false);
                router.replace('/(tabs)/settings');
            } else {
                router.replace('/(tabs)/chat');
            }
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể tạo tài khoản.');
        } finally {
            setIsLoading(false);
        }
    };

    // Get avatar initial letter
    const avatarLetter = firstName.trim() ? firstName.trim()[0].toUpperCase() : '';

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.content}>
                    {/* Back button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#007AFF" />
                    </TouchableOpacity>

                    <Animated.View
                        style={[
                            styles.mainContent,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        {/* Avatar preview */}
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarCircle}>
                                {avatarLetter ? (
                                    <Text style={styles.avatarLetter}>{avatarLetter}</Text>
                                ) : (
                                    <Ionicons name="person" size={44} color="#FFFFFF" />
                                )}
                            </View>
                            <TouchableOpacity style={styles.cameraButton}>
                                <Ionicons name="camera" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Thông tin của bạn</Text>
                        <Text style={styles.subtitle}>
                            Nhập tên của bạn và thêm ảnh đại diện (tuỳ chọn)
                        </Text>

                        {/* Input fields */}
                        <View style={styles.inputGroup}>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color="#8E8E93"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    ref={firstNameRef}
                                    style={styles.input}
                                    placeholder="Tên (bắt buộc)"
                                    placeholderTextColor="#C7C7CC"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    returnKeyType="next"
                                    onSubmitEditing={() => lastNameRef.current?.focus()}
                                    maxLength={30}
                                    autoCapitalize="words"
                                />
                                {firstName.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => setFirstName('')}
                                        style={styles.clearButton}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={18}
                                            color="#C7C7CC"
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.inputDivider} />

                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="people-outline"
                                    size={20}
                                    color="#8E8E93"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    ref={lastNameRef}
                                    style={styles.input}
                                    placeholder="Họ (tuỳ chọn)"
                                    placeholderTextColor="#C7C7CC"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    returnKeyType="done"
                                    onSubmitEditing={handleContinue}
                                    maxLength={30}
                                    autoCapitalize="words"
                                />
                                {lastName.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => setLastName('')}
                                        style={styles.clearButton}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={18}
                                            color="#C7C7CC"
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* User info summary */}
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Ionicons name="call-outline" size={16} color="#8E8E93" />
                                <Text style={styles.infoText}>{phoneNumber}</Text>
                            </View>
                            <View style={styles.infoDivider} />
                            <View style={styles.infoRow}>
                                <Ionicons name="mail-outline" size={16} color="#8E8E93" />
                                <Text style={styles.infoText}>{email}</Text>
                            </View>
                        </View>

                        {/* Steps indicator */}
                        <View style={styles.stepContainer}>
                            <View style={styles.stepRow}>
                                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                                <Text style={styles.stepTextDone}>Email đã xác thực</Text>
                            </View>
                            <View style={styles.stepRow}>
                                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                                <Text style={styles.stepTextDone}>SMS đã xác thực</Text>
                            </View>
                            <View style={styles.stepRow}>
                                <Ionicons name="ellipse" size={20} color="#007AFF" />
                                <Text style={styles.stepTextActive}>Thiết lập hồ sơ</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Continue button */}
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            !firstName.trim() && styles.continueButtonDisabled,
                        ]}
                        onPress={handleContinue}
                        disabled={isLoading || !firstName.trim()}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                                <Text style={styles.continueButtonText}>Hoàn tất đăng ký</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 8,
        padding: 8,
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
    },

    // Avatar
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    avatarCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        fontSize: 40,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#34C759',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },

    // Title
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 28,
        paddingHorizontal: 16,
    },

    // Inputs
    inputGroup: {
        width: '100%',
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        overflow: 'hidden',
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        height: 50,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#000000',
        height: '100%',
    },
    clearButton: {
        padding: 4,
    },
    inputDivider: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginLeft: 46,
    },

    // Info card
    infoCard: {
        width: '100%',
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        padding: 14,
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#333333',
        fontWeight: '500',
    },
    infoDivider: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginVertical: 6,
    },

    // Steps
    stepContainer: {
        alignSelf: 'flex-start',
        paddingLeft: 4,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    stepTextDone: {
        fontSize: 14,
        color: '#34C759',
        fontWeight: '500',
    },
    stepTextActive: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },

    // Continue button
    continueButton: {
        backgroundColor: '#007AFF',
        borderRadius: 14,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32,
    },
    continueButtonDisabled: {
        backgroundColor: '#B0D4FF',
    },
    continueButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
