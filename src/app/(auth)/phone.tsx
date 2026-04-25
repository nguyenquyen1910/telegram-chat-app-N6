import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

// List of popular countries
const COUNTRIES = [
  { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭' },
];

export default function PhoneScreen() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const fullPhoneNumber = `${selectedCountry.code}${phoneNumber}`;

  const handleContinue = () => {
    if (phoneNumber.length < 9) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmAndGoToEmail = () => {
    setShowConfirm(false);
    // Navigate to email screen, passing the phone number
    router.push({
      pathname: '/(auth)/enter-email',
      params: { phoneNumber: fullPhoneNumber },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.phoneIcon}>📞</Text>
        </View>

        <Text style={styles.title}>Your Phone</Text>
        <Text style={styles.subtitle}>
          Please confirm your country code{'\n'}and enter your phone number.
        </Text>

        {/* Select country */}
        <TouchableOpacity
          style={styles.countryRow}
          onPress={() => setShowCountryPicker(true)}
        >
          <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
          <Text style={styles.countryName}>{selectedCountry.name}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Enter phone number */}
        <View style={styles.phoneRow}>
          <Text style={styles.countryCode}>{selectedCountry.code}</Text>
          <View style={styles.phoneInputDivider} />
          <TextInput
            style={styles.phoneInput}
            placeholder="Your phone number"
            placeholderTextColor="#C7C7CC"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            autoFocus
          />
        </View>

        <View style={styles.divider} />

        {/* Continue button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            phoneNumber.length < 9 && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={phoneNumber.length < 9}
        >
          <Text
            style={[
              styles.continueText,
              phoneNumber.length < 9 && styles.continueTextDisabled,
            ]}
          >
            Continue
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Modal confirm phone number */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalPhone}>{fullPhoneNumber}</Text>
            <Text style={styles.modalSubtitle}>
              Is this the correct number?
            </Text>

            <TouchableOpacity onPress={() => setShowConfirm(false)}>
              <Text style={styles.modalEdit}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalContinue}
              onPress={handleConfirmAndGoToEmail}
            >
              <Text style={styles.modalContinueText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal select country */}
      <Modal visible={showCountryPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.countryPickerContent}>
            <Text style={styles.countryPickerTitle}>Select Country</Text>
            {COUNTRIES.map((country) => (
              <TouchableOpacity
                key={country.code}
                style={styles.countryItem}
                onPress={() => {
                  setSelectedCountry(country);
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.countryItemFlag}>{country.flag}</Text>
                <Text style={styles.countryItemName}>{country.name}</Text>
                <Text style={styles.countryItemCode}>{country.code}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.countryPickerCancel}
              onPress={() => setShowCountryPicker(false)}
            >
              <Text style={styles.countryPickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  phoneIcon: {
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
    marginBottom: 32,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    fontSize: 17,
    color: '#007AFF',
    flex: 1,
  },
  chevron: {
    fontSize: 22,
    color: '#C7C7CC',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  countryCode: {
    fontSize: 17,
    fontWeight: '500',
    width: 50,
  },
  phoneInputDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: '#C6C6C8',
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
  },
  continueButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  continueButtonDisabled: {
    backgroundColor: '#F2F2F7',
  },
  continueText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  continueTextDisabled: {
    color: '#C7C7CC',
  },
  // Modal confirm
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalPhone: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 16,
  },
  modalEdit: {
    fontSize: 17,
    color: '#007AFF',
    marginBottom: 16,
  },
  modalContinue: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 60,
  },
  modalContinueText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  // Country picker
  countryPickerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    width: '85%',
  },
  countryPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  countryItemFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryItemName: {
    fontSize: 17,
    flex: 1,
  },
  countryItemCode: {
    fontSize: 15,
    color: '#8E8E93',
  },
  countryPickerCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  countryPickerCancelText: {
    fontSize: 17,
    color: '#FF3B30',
    fontWeight: '600',
  },
});
