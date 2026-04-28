import { Platform } from 'react-native';

// ICE servers configuration
export const CALL_ICE_SERVERS = [
  // Google STUN servers (free)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },

  // Add TURN server here for production (required for NAT traversal)
  // Example:
  // {
  //   urls: 'turn:your-turn-server.com:3478',
  //   username: 'your-username',
  //   credential: 'your-password'
  // }
];

// Call configuration
export const CALL_CONFIG = {
  // Timeout for call to be answered (seconds)
  CALL_TIMEOUT: 45,

  // ICE gathering timeout (milliseconds)
  ICE_GATHERING_TIMEOUT: 8000,

  // Media constraints for video call
  VIDEO_CONSTRAINTS: {
    audio: true,
    video: {
      facingMode: 'user', // 'user' for front camera, 'environment' for back
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 }
    }
  },

  // Media constraints for voice call only
  VOICE_CONSTRAINTS: {
    audio: true,
    video: false
  },

  // SDP negotiation constraints
  SDP_OFFER_CONSTRAINTS: {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  },

  // Video bitrate optimization (0 = auto)
  VIDEO_BITRATE: 2500000, // 2.5 Mbps

  // Audio codec preference
  PREFERRED_AUDIO_CODEC: 'opus',

  // Video codec preference
  PREFERRED_VIDEO_CODEC: 'VP8'
};

// Firebase collection names
export const CALL_COLLECTION = 'calls';
export const CALL_HISTORY_COLLECTION = 'callHistory';

// UI Constants
export const CALL_UI = {
  INCOMING_CALL_ANIMATION_DURATION: 1000,
  RINGTONE_VOLUME: 1.0,
  VIBRATION_PATTERN: [0, 500, 300, 500], // milliseconds

  // Colors
  PRIMARY_COLOR: '#54A5E8',
  SUCCESS_COLOR: '#21C004',
  DANGER_COLOR: '#FF3B30',
  BACKGROUND_COLOR: '#000000',
  OVERLAY_COLOR: 'rgba(0,0,0,0.9)'
};

// Screen names for navigation
export const CALL_SCREENS = {
  INCOMING: '/(tabs)/calls/incoming/[callId]',
  OUTGOING: '/(tabs)/calls/outgoing/[userId]',
  ACTIVE: '/(tabs)/calls/active/[callId]'
};

// Ringtone and audio file paths (add these to your assets)
// Note: files must exist at assets/sounds/ before using these
export const CALL_ASSETS = {
  get RINGTONE() {
    try { return require('../assets/sounds/ringtone.mp3'); } catch { return null; }
  },
  get CALL_END_SOUND() {
    try { return require('../assets/sounds/call-end.mp3'); } catch { return null; }
  },
  get DTMF_TONE() {
    try { return require('../assets/sounds/dtmf.mp3'); } catch { return null; }
  },
};

// Platform-specific settings
export const PLATFORM_CONFIG = {
  ios: {
    // iOS requires specific audio session configuration
    prefersSpeaker: true,
    allowsBluetooth: true,
    allowsAirPlay: true
  },
  android: {
    // Android audio routing
    useSpeaker: true,
    handleAudioFocus: true
  }
};

// Error messages
export const CALL_ERRORS = {
  PERMISSION_DENIED: 'Camera and microphone permissions are required for calls',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  CALL_FAILED: 'Failed to establish call. Please try again.',
  USER_UNAVAILABLE: 'User is not available',
  CALL_TIMEOUT: 'Call timed out',
  ICE_FAILED: 'Connection failed. Check your network.',
  UNKNOWN_ERROR: 'An unknown error occurred'
};
