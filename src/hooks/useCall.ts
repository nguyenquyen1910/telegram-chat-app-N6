import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, Alert } from "react-native";
import { Camera } from "expo-camera";
import * as Haptics from "expo-haptics";
import { webrtcService } from "@/services/webrtcService";
import { signalingService } from "@/services/signalingService";
import { CallMetadata, CallType, CallStatus, ActiveCall } from "@/types/chat";
import { CALL_CONFIG, CALL_ERRORS, CALL_UI } from "@/constants/calls";
import { Timestamp } from "firebase/firestore";

interface UseCallReturn {
  activeCall: ActiveCall | null;
  incomingCall: CallMetadata | null;
  isCalling: boolean;
  error: string | null;
  initiateCall: (targetUserId: string, callType: CallType) => Promise<string>;
  answerCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => Promise<void>;
  toggleSpeaker: () => void;
  getCallHistory: (userId: string, limitCount?: number) => Promise<CallMetadata[]>;
}

/**
 * Request camera and audio permissions
 * @param needCamera - Whether camera permission is needed (for video calls)
 * @returns true if all required permissions granted
 */
const requestPermissions = async (needCamera: boolean): Promise<boolean> => {
  try {
    // Use Expo APIs — works on both iOS and Android
    if (needCamera) {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      if (!cameraStatus.granted) {
        Alert.alert(
          'Quyền truy cập bị từ chối',
          'Ứng dụng cần quyền camera để thực hiện cuộc gọi video. Vui lòng cấp quyền trong cài đặt.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    // Dynamic require to avoid crash when native module not compiled yet
    const { Audio } = require('expo-av');
    const audioStatus = await Audio.requestPermissionsAsync();
    if (!audioStatus.granted) {
      Alert.alert(
        'Quyền truy cập bị từ chối',
        'Ứng dụng cần quyền microphone để thực hiện cuộc gọi. Vui lòng cấp quyền trong cài đặt.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn('Permission request failed (audio module unavailable):', error);
    // Return true so call can still proceed without audio permission check
    return true;
  }
};

export function useCall(currentUserId: string): UseCallReturn {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallMetadata | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for mutable values without re-renders
  const callDurationInterval = useRef<NodeJS.Timeout | null>(null);
  const callStartTime = useRef<number | null>(null);
  const ringtoneSound = useRef<any | null>(null);
  const activeCallIdRef = useRef<string | null>(null);
  const activeCallRef = useRef<ActiveCall | null>(null);
  const callUnsubscribeRef = useRef<(() => void) | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addedIceCandidates = useRef<Set<string>>(new Set());

  // Keep activeCallRef in sync
  useEffect(() => {
    activeCallRef.current = activeCall;
  });

  // WebRTC event listeners (set up once)
  useEffect(() => {
    webrtcService.onIceCandidate = async (candidate) => {
      if (activeCallIdRef.current) {
        try {
          await signalingService.addIceCandidate(activeCallIdRef.current, candidate);
        } catch (err) {
          console.error("Failed to send ICE candidate:", err);
        }
      }
    };

    webrtcService.onRemoteStream = (stream) => {
      setActiveCall((prev) =>
        prev ? { ...prev, remoteStream: stream } : null
      );
    };

    webrtcService.onConnectionStateChange = (state) => {
      console.log("[useCall] Connection state:", state);
      if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        handleCallEnd();
      }
    };

    return () => {
      cleanup();
    };
  }, []);

  // Incoming calls subscription
  useEffect(() => {
    const unsubscribe = signalingService.subscribeToIncomingCalls(
      currentUserId,
      (call, event) => {
        if (event === 'added' || event === 'modified') {
          if (call.status === "ringing" && !incomingCall && call.calleeId === currentUserId) {
            setIncomingCall(call);
            playRingtone();
            triggerHapticNotification();
          }
        } else if (event === 'removed') {
          // Call is no longer ringing (answered, rejected, or missed)
          if (incomingCall && incomingCall.id === call.id) {
            stopRingtone();
            setIncomingCall(null);
          }
        }
      },
    );
    return () => unsubscribe();
  }, [currentUserId, incomingCall]);

  const initiateCall = useCallback(
    async (targetUserId: string, callType: CallType): Promise<string> => {
      try {
        // Request permissions first
        const hasPermissions = await requestPermissions(callType === 'video');
        if (!hasPermissions) {
          throw new Error(CALL_ERRORS.PERMISSION_DENIED);
        }

        // End any existing call
        if (activeCallIdRef.current) {
          await handleCallEnd("missed");
        }

        setIsCalling(true);
        setError(null);
        addedIceCandidates.current.clear();

        // Clear any pending timeout
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }

        // Create call in Firestore
        const callId = await signalingService.createCall(
          currentUserId,
          targetUserId,
          callType,
        );

        // Create peer connection and get local stream
        const peerConnection = await webrtcService.createPeerConnection(
          callType === "video",
        );
        const localStream = webrtcService.getLocalStream();

        // Create and set offer
        const offer = await webrtcService.createOffer();
        await signalingService.setOffer(
          callId,
          offer.sdp,
          webrtcService.getIceCandidates(),
        );

        // Subscribe to call updates (answer SDP, status changes)
        const unsubscribe = signalingService.subscribeToCall(
          callId,
          async (updatedCall) => {
            // Handle answer SDP
            if (updatedCall.answerSDP && activeCallIdRef.current === callId) {
              try {
                await webrtcService.setRemoteDescription(
                  updatedCall.answerSDP,
                  "answer",
                );
              } catch (err) {
                console.error("Failed to set remote description:", err);
              }
            }

            // Start timer when call connects and clear ringing timeout
            if (updatedCall.status === "connected" && activeCallIdRef.current === callId) {
              startCallTimer();
              if (callTimeoutRef.current) {
                clearTimeout(callTimeoutRef.current);
                callTimeoutRef.current = null;
              }
            }

            // Process new ICE candidates from the remote peer
            if (updatedCall.iceCandidates) {
              updatedCall.iceCandidates.forEach(candidate => {
                const key = candidate.candidate;
                if (key && !addedIceCandidates.current.has(key)) {
                  addedIceCandidates.current.add(key);
                  webrtcService.addIceCandidate(candidate).catch(err => {
                    console.log('Failed to add ICE candidate:', err);
                  });
                }
              });
            }

            // Handle call termination (ended, rejected, missed)
            if (
              (updatedCall.status === "ended" ||
                updatedCall.status === "rejected" ||
                updatedCall.status === "missed") &&
              activeCallIdRef.current === callId
            ) {
              await handleCallEnd(updatedCall.status);
            }
          },
        );

        callUnsubscribeRef.current = unsubscribe;

        // Set active call state
        const newActiveCall: ActiveCall = {
          callId,
          metaData: {
            id: callId,
            type: callType,
            callerId: currentUserId,
            calleeId: targetUserId,
            status: "ringing",
            direction: "outgoing",
            startedAt: Timestamp.now(),
            iceCandidates: [],
          },
          localStream,
          remoteStream: null,
          peerConnection,
          isMuted: false,
          isVideoOff: false,
          isSpeakerOn: true,
          duration: 0,
        };
        // Update ref immediately (before setState) for handleCallEnd to have latest value
        activeCallRef.current = newActiveCall;
        setActiveCall(newActiveCall);
        activeCallIdRef.current = callId;

        // Timeout for no answer
        callTimeoutRef.current = setTimeout(async () => {
          if (activeCallIdRef.current === callId) {
            await handleCallEnd("missed");
          }
        }, CALL_CONFIG.CALL_TIMEOUT * 1000);

        return callId;
      } catch (err: any) {
        // Clear timeout on error
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
        setError(err.message || CALL_ERRORS.CALL_FAILED);
        setIsCalling(false);
        throw err;
      }
    },
    [currentUserId],
  );

  const answerCall = useCallback(
    async (callId: string): Promise<void> => {
      try {
        const call = incomingCall;
        if (!call || call.id !== callId) return;

        // Request permissions before answering
        const hasPermissions = await requestPermissions(call.type === 'video');
        if (!hasPermissions) {
          throw new Error(CALL_ERRORS.PERMISSION_DENIED);
        }

        stopRingtone();
        addedIceCandidates.current.clear();

        // Clear any pending timeout (just in case)
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }

        await signalingService.acceptCall(callId);

        const peerConnection = await webrtcService.createPeerConnection(
          call.type === "video",
        );
        const localStream = webrtcService.getLocalStream();

        if (call.offerSDP) {
          await webrtcService.setRemoteDescription(call.offerSDP, "offer");
        }
        if (call.iceCandidates?.length) {
          // Mark these candidates as already added to avoid duplicates
          call.iceCandidates.forEach(c => addedIceCandidates.current.add(c.candidate));
          await webrtcService.addIceCandidates(call.iceCandidates);
        }

        const answer = await webrtcService.createAnswer();
        await signalingService.setAnswer(
          callId,
          answer.sdp,
          webrtcService.getIceCandidates(),
        );

        startCallTimer();

        const newActiveCall: ActiveCall = {
          callId,
          metaData: {
            ...call,
            status: "connected",
            direction: "incoming",
          },
          localStream,
          remoteStream: null,
          peerConnection,
          isMuted: false,
          isVideoOff: false,
          isSpeakerOn: true,
          duration: 0,
        };
        // Update ref immediately
        activeCallRef.current = newActiveCall;
        setActiveCall(newActiveCall);
        activeCallIdRef.current = callId;

        // Subscribe to call updates for ICE candidates and status changes
        const unsubscribe = signalingService.subscribeToCall(
          callId,
          async (updatedCall) => {
            // Process new ICE candidates from caller
            if (updatedCall.iceCandidates) {
              updatedCall.iceCandidates.forEach(candidate => {
                const key = candidate.candidate;
                if (key && !addedIceCandidates.current.has(key)) {
                  addedIceCandidates.current.add(key);
                  webrtcService.addIceCandidate(candidate).catch(err => {
                    console.log('Failed to add ICE candidate:', err);
                  });
                }
              });
            }

            // Handle call termination
            if (
              updatedCall.status === "ended" ||
              updatedCall.status === "rejected" ||
              updatedCall.status === "missed"
            ) {
              await handleCallEnd(updatedCall.status);
            }
          },
        );
        callUnsubscribeRef.current = unsubscribe;

        setIncomingCall(null);
      } catch (err: any) {
        setError(err.message || CALL_ERRORS.CALL_FAILED);
      }
    },
    [incomingCall],
  );

  const rejectCall = useCallback(async (callId: string): Promise<void> => {
    try {
      stopRingtone();
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      await signalingService.rejectCall(callId);
      setIncomingCall(null);
    } catch (err: any) {
      setError(err.message || CALL_ERRORS.CALL_FAILED);
    }
  }, []);

  const endCall = useCallback(async (): Promise<void> => {
    await handleCallEnd("ended");
  }, []);

  // Stable handleCallEnd using refs (no dependencies)
  const handleCallEnd = useCallback(async (endStatus: CallStatus = "ended"): Promise<void> => {
    const currentCall = activeCallRef.current;
    if (!currentCall) return;

    const duration = callStartTime.current
      ? Math.floor((Date.now() - callStartTime.current) / 1000)
      : 0;

    const callId = currentCall.callId;

    // Clear timeout if exists
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (endStatus === "missed" && currentCall.metaData.direction === "outgoing") {
      await signalingService.missCall(callId).catch(console.error);
    } else if (endStatus === "ended") {
      await signalingService.endCall(callId, duration).catch(console.error);
    }

    // Cleanup WebRTC resources
    webrtcService.cleanup();

    // Cancel call subscription if exists
    if (callUnsubscribeRef.current) {
      callUnsubscribeRef.current();
      callUnsubscribeRef.current = null;
    }

    stopCallTimer();
    stopRingtone();
    addedIceCandidates.current.clear();

    // Clear state only if this is still the active call
    if (activeCallIdRef.current === callId) {
      setActiveCall(null);
      setIsCalling(false);
      activeCallIdRef.current = null;
    }
    callStartTime.current = null;
  }, []); // No deps - uses refs

  const toggleMute = useCallback(() => {
    if (!activeCall) return;
    const newMutedState = !activeCall.isMuted;
    webrtcService.toggleAudio(!newMutedState);
    setActiveCall((prev) =>
      prev ? { ...prev, isMuted: newMutedState } : null
    );
  }, [activeCall]);

  const toggleVideo = useCallback(() => {
    if (!activeCall) return;
    const newVideoOffState = !activeCall.isVideoOff;
    webrtcService.toggleVideo(!newVideoOffState);
    setActiveCall((prev) =>
      prev ? { ...prev, isVideoOff: newVideoOffState } : null
    );
  }, [activeCall]);

  const switchCamera = useCallback(async () => {
    try {
      await webrtcService.switchCamera();
    } catch (err) {
      console.error("Failed to switch camera:", err);
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    if (!activeCall) return;
    const newState = !activeCall.isSpeakerOn;
    setActiveCall((prev) => (prev ? { ...prev, isSpeakerOn: newState } : null));
    // TODO: Implement actual speaker control using react-native-audio-tools
    // For now, this only updates UI state
  }, [activeCall]);

  const startCallTimer = useCallback(() => {
    callStartTime.current = Date.now();
    if (callDurationInterval.current) {
      clearInterval(callDurationInterval.current);
    }
    callDurationInterval.current = setInterval(() => {
      if (callStartTime.current && activeCallIdRef.current) {
        const duration = Math.floor(
          (Date.now() - callStartTime.current) / 1000,
        );
        setActiveCall((prev) =>
          prev && prev.callId === activeCallIdRef.current
            ? { ...prev, duration }
            : prev
        );
      }
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (callDurationInterval.current) {
      clearInterval(callDurationInterval.current);
      callDurationInterval.current = null;
    }
  }, []);

  const playRingtone = async () => {
    try {
      // Dynamic import to avoid crash when native module not available (e.g. Expo Go)
      const { Audio } = require('expo-av');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      ringtoneSound.current = new Audio.Sound();

      try {
        // @ts-ignore - dynamic require for asset
        const ringtoneAsset = require('@/assets/sounds/ringtone.mp3');
        await ringtoneSound.current.loadAsync(ringtoneAsset);
        await ringtoneSound.current.setVolumeAsync(CALL_UI.RINGTONE_VOLUME);
        await ringtoneSound.current.setIsLoopingAsync(true);
        await ringtoneSound.current.playAsync();
      } catch (assetError) {
        console.warn("Ringtone asset not found or cannot be loaded:", assetError);
      }
    } catch (error) {
      console.warn("Audio not available (native module missing):", error);
    }
  };

  const stopRingtone = async () => {
    try {
      if (ringtoneSound.current) {
        try {
          await ringtoneSound.current.stopAsync();
          await ringtoneSound.current.unloadAsync();
        } catch (e) {
          console.error("Error stopping ringtone:", e);
        }
        ringtoneSound.current = null;
      }
    } catch (error) {
      console.error("Error in stopRingtone:", error);
    }
  };

  const triggerHapticNotification = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log("Haptics not available");
    }
  };

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (activeCallIdRef.current) {
      handleCallEnd();
    } else {
      // No active call but still cleanup leftover resources
      stopRingtone();
      stopCallTimer();
      if (callUnsubscribeRef.current) {
        callUnsubscribeRef.current();
        callUnsubscribeRef.current = null;
      }
    }
    // No longer call global signaling cleanup here to avoid affecting other components
  }, [handleCallEnd]);

  return {
    activeCall,
    incomingCall,
    isCalling,
    error,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    toggleSpeaker,
    getCallHistory: signalingService.getCallHistory.bind(signalingService),
  };
}
