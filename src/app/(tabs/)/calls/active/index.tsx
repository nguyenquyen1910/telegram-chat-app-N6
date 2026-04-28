import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCall } from '@/hooks/useCall';
import { MOCK_CURRENT_USER } from '@/constants/chat';
import { RTCView } from 'react-native-webrtc';

const { width, height } = Dimensions.get('window');

export default function ActiveCallScreen() {
  const router = useRouter();
  const { activeCall, endCall, toggleMute, toggleVideo, switchCamera, toggleSpeaker } = useCall(MOCK_CURRENT_USER.uid);

  const [localMuted, setLocalMuted] = useState(false);
  const [localVideoOff, setLocalVideoOff] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

  const remoteVideoRef = useRef<RTCView>(null);
  const localVideoRef = useRef<RTCView>(null);

  useEffect(() => {
    if (activeCall) {
      setLocalMuted(activeCall.isMuted);
      setLocalVideoOff(activeCall.isVideoOff);
      setSpeakerOn(activeCall.isSpeakerOn);
    }
  }, [activeCall]);

  useEffect(() => {
    const backHandler = Platform.OS === 'android'
      ? () => {
          endCall();
          return true;
        }
      : undefined;

    if (backHandler) {
      // Add back handler if needed
    }
    return () => {
      // Remove back handler
    };
  }, [endCall]);

  if (!activeCall) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không có cuộc gọi đang diễn ra</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isVideoCall = activeCall.metaData.type === 'video';
  const localStream = activeCall.localStream;
  const remoteStream = activeCall.remoteStream;

  const handleEndCall = async () => {
    await endCall();
    router.back();
  };

  const handleToggleMute = () => {
    toggleMute();
    setLocalMuted(!localMuted);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setLocalVideoOff(!localVideoOff);
  };

  const handleSwitchCamera = async () => {
    await switchCamera();
  };

  const handleToggleSpeaker = () => {
    toggleSpeaker();
    setSpeakerOn(!speakerOn);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderVoiceCall = () => (
    <View style={styles.voiceCallContainer}>
      <View style={styles.voiceAvatar}>
        <Text style={styles.voiceAvatarText}>
          {activeCall.metaData.callerId === MOCK_CURRENT_USER.uid ? 'Bạn' : '?'}
        </Text>
        {activeCall.metaData.direction === 'incoming' && (
          <View style={styles.voiceCallIndicator}>
            <Text style={styles.voiceCallIndicatorText}>📞</Text>
          </View>
        )}
      </View>
      <Text style={styles.voiceCallerName}>
        {activeCall.metaData.direction === 'incoming' ? 'Người gọi' : 'Người nhận'}
      </Text>
      <Text style={styles.voiceStatus}>
        {formatDuration(activeCall.duration)}
      </Text>

      <View style={styles.voiceControls}>
        <TouchableOpacity
          style={[styles.controlButton, localMuted && styles.controlButtonActive]}
          onPress={handleToggleMute}
        >
          <Text style={styles.controlIcon}>
            {localMuted ? '🔇' : '🎤'}
          </Text>
          <Text style={styles.controlLabel}>
            {localMuted ? 'Bật mic' : 'Tắt mic'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !speakerOn && styles.controlButtonActive]}
          onPress={handleToggleSpeaker}
        >
          <Text style={styles.controlIcon}>
            {speakerOn ? '🔊' : '🔈'}
          </Text>
          <Text style={styles.controlLabel}>
            {speakerOn ? 'Loa' : 'Tắt loa'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endCallButtonVoice} onPress={handleEndCall}>
          <Text style={styles.endCallIconVoice}>📞</Text>
          <Text style={styles.endCallLabelVoice}>Kết thúc</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVideoCall = () => (
    <View style={styles.videoContainer}>
      {remoteStream ? (
        <RTCView
          ref={remoteVideoRef}
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={[styles.remoteVideo, styles.remoteVideoPlaceholder]}>
          <Text style={styles.remoteVideoText}>Đang chờ video...</Text>
        </View>
      )}

      {localStream && !localVideoOff && (
        <View style={styles.localVideoContainer}>
          <RTCView
            ref={localVideoRef}
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={true}
          />
          <View style={styles.localVideoBadge}>
            <Text style={styles.localVideoBadgeText}>Bạn</Text>
          </View>
        </View>
      )}

      <View style={styles.topBar}>
        <Text style={styles.callDuration}>
          {formatDuration(activeCall.duration)}
        </Text>
        <Text style={styles.callStatus}>
          {activeCall.metaData.direction === 'incoming' ? 'Đầu vào' : 'Đầu ra'}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, localMuted && styles.controlButtonActive]}
          onPress={handleToggleMute}
        >
          <Text style={styles.controlIcon}>
            {localMuted ? '🔇' : '🎤'}
          </Text>
          <Text style={styles.controlLabel}>
            {localMuted ? 'Mic' : 'Mic'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, localVideoOff && styles.controlButtonActive]}
          onPress={handleToggleVideo}
        >
          <Text style={styles.controlIcon}>
            {localVideoOff ? '📷' : '📹'}
          </Text>
          <Text style={styles.controlLabel}>
            {localVideoOff ? 'Video' : 'Video'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !speakerOn && styles.controlButtonActive]}
          onPress={handleToggleSpeaker}
        >
          <Text style={styles.controlIcon}>
            {speakerOn ? '🔊' : '🔈'}
          </Text>
          <Text style={styles.controlLabel}>
            {speakerOn ? 'Loa' : 'Loa'}
          </Text>
        </TouchableOpacity>

        {isVideoCall && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleSwitchCamera}
          >
            <Text style={styles.controlIcon}>🔄</Text>
            <Text style={styles.controlLabel}>Chuyển</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {isVideoCall ? renderVideoCall() : renderVoiceCall()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
  voiceCallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  voiceAvatar: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#54A5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative'
  },
  voiceAvatarText: {
    fontSize: 90,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  voiceCallIndicator: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 8
  },
  voiceCallIndicatorText: {
    fontSize: 16
  },
  voiceCallerName: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12
  },
  voiceStatus: {
    fontSize: 20,
    color: '#CCCCCC'
  },
  voiceControls: {
    marginTop: 80,
    alignItems: 'center'
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 16
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)'
  },
  controlIcon: {
    fontSize: 28,
    marginBottom: 4
  },
  controlLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500'
  },
  endCallButtonVoice: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B30',
    marginTop: 20
  },
  endCallIconVoice: {
    fontSize: 32,
    color: '#FFFFFF',
    transform: [{ rotate: '135deg' }]
  },
  endCallLabelVoice: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4
  },
  videoContainer: {
    flex: 1
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject
  },
  remoteVideoPlaceholder: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  remoteVideoText: {
    color: '#FFFFFF',
    fontSize: 18
  },
  localVideoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 16,
    width: 100,
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  localVideo: {
    width: '100%',
    height: '100%'
  },
  localVideoBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  localVideoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500'
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  callDuration: {
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8
  },
  callStatus: {
    fontSize: 12,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center'
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16
  }
});
