import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, isVerifying } = useAuth();

  // If still loading, show nothing (splash screen handles this)
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If already authenticated AND not in the middle of OTP verification, redirect to chat
  if (isAuthenticated && !isVerifying) {
    return <Redirect href="/(tabs)/chat" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="enter-email" />
      <Stack.Screen name="verify-code" />
      <Stack.Screen name="verify-sms" />
      <Stack.Screen name="setup-profile" />
    </Stack>
  );
}
