import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { sendEmailOTP } from '@/services/auth';

export default function EnterEmailScreen() {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendOTP = async () => {
    if (!isValidEmail) {
      Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ');
      return;
    }

    setIsSending(true);
    try {
      await sendEmailOTP(email, phoneNumber);
      router.push({
        pathname: '/(auth)/verify-code',
        params: { phoneNumber, email },
      });
    } catch (error: any) {
      console.error('Send email OTP error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.emailIcon}>📧</Text>
        </View>

        <Text style={styles.title}>Your Email</Text>
        <Text style={styles.subtitle}>
          We'll send a verification code to your email{'\n'}to verify your account.
        </Text>

        {/* Phone number display */}
        <View style={styles.phoneInfoRow}>
          <Text style={styles.phoneInfoLabel}>Phone:</Text>
          <Text style={styles.phoneInfoValue}>{phoneNumber}</Text>
        </View>

        <View style={styles.divider} />

        {/* Email input */}
        <View style={styles.emailRow}>
          <Text style={styles.emailLabel}>✉️</Text>
          <TextInput
            style={styles.emailInput}
            placeholder="Enter your email"
            placeholderTextColor="#C7C7CC"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            autoFocus
          />
        </View>

        <View style={styles.divider} />

        {/* Info text */}
        <Text style={styles.infoText}>
          📨 A 6-digit verification code will be sent to your email address.
        </Text>

        {/* Continue button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isValidEmail && styles.continueButtonDisabled,
          ]}
          onPress={handleSendOTP}
          disabled={!isValidEmail || isSending}
        >
          {isSending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.continueText,
                !isValidEmail && styles.continueTextDisabled,
              ]}
            >
              Send Code
            </Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Loading overlay */}
      {isSending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Sending verification code...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
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
    alignItems: 'center',
    marginBottom: 16,
  },
  emailIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  phoneInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  phoneInfoLabel: {
    fontSize: 15,
    color: '#8E8E93',
    marginRight: 8,
  },
  phoneInfoValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  emailLabel: {
    fontSize: 22,
    marginRight: 12,
  },
  emailInput: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
  },
  infoText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  continueButtonDisabled: {
    backgroundColor: '#B0D4FF',
  },
  continueText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueTextDisabled: {
    color: '#FFFFFF',
  },
  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
