import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/calls/Avatar';
import { CallButton } from '@/components/calls/CallButton';
import { IconButton } from '@/components/calls/IconButton';
import { useCall } from '@/hooks/useCall';
import { useAuth } from '@/hooks/useAuth';
import { getUserById } from '@/services/userService';
import { User } from '@/types/chat';
import { CALL_UI } from '@/constants/calls';

export default function IncomingCallScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { incomingCall, answerCall, rejectCall } = useCall(currentUser?.uid || '');
  const [callerProfile, setCallerProfile] = React.useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  // Fetch caller profile when incoming call arrives
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (incomingCall?.callerId) {
        const profile = await getUserById(incomingCall.callerId);
        setCallerProfile(profile);
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [incomingCall?.callerId]);

  // If no incoming call, go back
  React.useEffect(() => {
    if (!incomingCall) {
      router.back();
    }
  }, [incomingCall, router]);

  if (!incomingCall) {
    return null;
  }

  const handleAccept = async () => {
    try {
      await answerCall(incomingCall.id);
      // Navigate to active call screen using correct Expo Router v3 syntax
      router.replace({
        pathname: '/(tabs)/calls/active/[callId]',
        params: { callId: incomingCall.id },
      });
    } catch (error) {
      console.error('Failed to answer call:', error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectCall(incomingCall.id);
      router.back();
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
  };

  const callerName = callerProfile?.displayName || incomingCall.callerId || 'Unknown';
  // avatarUrl is the correct field on User (not photoURL)
  const callerAvatar = callerProfile?.avatarUrl || '';

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1080' }}
      style={styles.background}
      blurRadius={80}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={CALL_UI.OVERLAY_COLOR} />

        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="close"
            size={28}
            color="#FFFFFF"
            onPress={handleReject}
            style={styles.headerButton}
            accessibilityLabel="Từ chối cuộc gọi"
          />
          <Text style={styles.headerTitle}>Cuộc gọi đến</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {loadingProfile ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <Avatar
              uri={callerAvatar}
              name={callerName}
              size={120}
              showBorder={true}
              borderColor="rgba(255,255,255,0.4)"
            />
          )}
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callType}>
            {incomingCall.type === 'video' ? 'Video call' : 'Voice call'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <CallButton
            icon="call"
            size={70}
            backgroundColor={CALL_UI.DANGER_COLOR}
            onPress={handleReject}
            accessibilityLabel="Từ chối cuộc gọi"
          />
          <CallButton
            icon="call"
            size={70}
            backgroundColor={CALL_UI.SUCCESS_COLOR}
            onPress={handleAccept}
            accessibilityLabel="Chấp nhận cuộc gọi"
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: CALL_UI.OVERLAY_COLOR,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callerName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
  },
  callType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 40,
  },
});
