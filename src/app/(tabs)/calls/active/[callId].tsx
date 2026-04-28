import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeRTCView } from '@/components/calls/SafeRTCView';
import { CallControls } from '@/components/calls/CallControls';
import { Avatar } from '@/components/calls/Avatar';
import { useCall } from '@/hooks/useCall';
import { useAuth } from '@/hooks/useAuth';
import { getUserById } from '@/services/userService';
import { User } from '@/types/chat';
import { CALL_UI } from '@/constants/calls';

export default function ActiveCallScreen() {
  const router = useRouter();
  const { callId } = useLocalSearchParams<{ callId: string }>();
  const { user: currentUser } = useAuth();
  const { activeCall, endCall, toggleMute, toggleVideo, switchCamera, toggleSpeaker } = useCall(currentUser?.uid || '');
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [remoteProfile, setRemoteProfile] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Fetch remote participant profile
  useEffect(() => {
    if (!activeCall || !currentUser) return;

    const remoteId = activeCall.metaData.callerId === currentUser.uid
      ? activeCall.metaData.calleeId
      : activeCall.metaData.callerId;

    if (!remoteId) return;

    setLoadingProfile(true);
    getUserById(remoteId).then(profile => {
      setRemoteProfile(profile);
      setLoadingProfile(false);
    });
  }, [activeCall?.callId, currentUser?.uid]); // Only re-run if callId or user changes

  // Redirect if no active call or wrong callId
  useEffect(() => {
    if (!activeCall || activeCall.callId !== callId) {
      router.back();
    }
  }, [activeCall?.callId, callId, router]);

  if (!activeCall || activeCall.callId !== callId) {
    return null;
  }

  const isVideoCall = activeCall.metaData.type === 'video';
  const remoteStream = activeCall.remoteStream;
  const localStream = activeCall.localStream;

  // Connection quality based on ICE state - recalculates on duration tick (every 1s)
  const connectionQuality = useMemo((): 'excellent' | 'good' | 'fair' | 'poor' => {
    try {
      // Lazy load webrtcService to avoid crash when native module not available
      const { webrtcService } = require('@/services/webrtcService');
      const state = webrtcService.getConnectionState();
      switch (state) {
        case 'connected':
        case 'completed':
          return 'excellent';
        case 'checking':
          return 'fair';
        case 'new':
          return 'good';
        default:
          return 'poor';
      }
    } catch {
      return 'poor';
    }
  }, [activeCall.duration]); // Recalculate each second via duration tick

  const handleSwitchCamera = useCallback(async () => {
    try {
      await switchCamera();
      setIsFrontCamera(prev => !prev);
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  }, [switchCamera]);

  const handleEndCall = useCallback(async () => {
    await endCall();
    router.back();
  }, [endCall, router]);

  // Remote participant info
  const remoteParticipantId =
    activeCall.metaData.callerId === currentUser?.uid
      ? activeCall.metaData.calleeId
      : activeCall.metaData.callerId;
  const remoteName = remoteProfile?.displayName || remoteParticipantId || 'Unknown';
  const remoteAvatar = remoteProfile?.avatarUrl || ''; // avatarUrl not photoURL

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={CALL_UI.BACKGROUND_COLOR} />

      {/* Video Container */}
      <View style={styles.videoContainer}>
        {isVideoCall && remoteStream ? (
          <SafeRTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        ) : isVideoCall ? (
          <View style={styles.noVideoPlaceholder}>
            <Text style={styles.noVideoText}>Camera đã tắt</Text>
          </View>
        ) : (
          <View style={styles.voiceCallBackground}>
            <Avatar
              uri={remoteAvatar}
              name={remoteName}
              size={150}
              showBorder={true}
              borderColor="rgba(255,255,255,0.3)"
            />
          </View>
        )}

        {/* Local Video PiP */}
        {isVideoCall && localStream && !activeCall.isVideoOff && (
          <View style={styles.localVideoContainer}>
            <SafeRTCView
              streamURL={localStream.toURL()}
              style={styles.localVideo}
              objectFit="cover"
              mirror={true}
            />
          </View>
        )}
      </View>

      {/* Call Info Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeCall.metaData.direction === 'incoming' ? 'Cuộc gọi đến' : 'Cuộc gọi đi'}
          </Text>
        </View>

        {/* Participant Info */}
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>{remoteName}</Text>
          <Text style={styles.callStatus}>
            {activeCall.metaData.status === 'connected'
              ? formatDuration(activeCall.duration)
              : 'Đang kết nối...'}
          </Text>
        </View>

        {/* Call Controls */}
        <View style={styles.controlsContainer}>
          <CallControls
            isMuted={activeCall.isMuted}
            isVideoOff={activeCall.isVideoOff}
            isSpeakerOn={activeCall.isSpeakerOn}
            isFrontCamera={isFrontCamera}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onToggleSpeaker={toggleSpeaker}
            onSwitchCamera={handleSwitchCamera}
            onEndCall={handleEndCall}
            showVideoControls={isVideoCall}
            connectionQuality={connectionQuality}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CALL_UI.BACKGROUND_COLOR,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  noVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideoText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 12,
  },
  voiceCallBackground: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '500',
  },
  participantInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  participantName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 6,
  },
  callStatus: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  controlsContainer: {
    alignItems: 'center',
  },
});
