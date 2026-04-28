import { Timestamp, FieldValue } from "firebase/firestore";
import { MediaStream, RTCPeerConnection, RTCIceCandidate } from "react-native-webrtc";

// ==================== User ====================
export interface User {
  uid: string;
  displayName: string;
  phoneNumber: string;
  avatarUrl: string;
  bio: string;
  lastSeen: Timestamp | null;
  isOnline: boolean;
  createdAt: Timestamp;
}

// ==================== Conversation ====================
export interface LastMessage {
  text: string;
  senderId: string;
  timestamp: Timestamp;
  type: MessageType;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: LastMessage | null;
  updatedAt: Timestamp;
  type: "private" | "group";
  groupName?: string;
  groupAvatar?: string;
}

// ==================== Message ====================
export type MessageType = "text" | "image" | "file" | "reply";
export type MessageStatus = "sending" | "sent" | "delivered" | "read";

export interface ReplyTo {
  messageId: string;
  text: string;
  senderName: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  type: MessageType;
  imageUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileThumbnail?: string;
  replyTo?: ReplyTo;
  status: MessageStatus;
  createdAt: Timestamp;
}

// ==================== Media Upload ====================
export interface UploadResult {
  url: string;
  size: number;
  publicId: string;
}

// ==================== Component Props ====================
export interface ChatHeaderProps {
  userName: string;
  userAvatar: string;
  lastSeen: string;
  isOnline: boolean;
  onBackPress: () => void;
  onProfilePress: () => void;
  userId?: string;
  onVoiceCallPress?: () => void;
  onVideoCallPress?: () => void;
}

export interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  senderName?: string;
  onReply?: (message: Message) => void;
  onImagePress?: (imageUrl: string) => void;
}

export interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendImage: () => void;
  replyingTo: Message | null;
  replyingSenderName?: string;
  onCancelReply: () => void;
}

export interface ImageMessageProps {
  imageUrl: string;
  fileName: string;
  fileSize: number;
  onPress?: () => void;
}

export interface ReplyPreviewProps {
  senderName: string;
  messageText: string;
  onCancel?: () => void;
  /** Whether this is inline in a bubble (no cancel button) */
  isInBubble?: boolean;
}

// WebRCT types
export type CallType = "voice" | "video";
export type CallStatus =
  | "ringing"
  | "connected"
  | "ended"
  | "missed"
  | "rejected";
export type CallDirection = "incoming" | "outgoing";


export interface CallMetadata {
  id: string;
  type: CallType;
  callerId: string;
  calleeId: string;
  status: CallStatus;
  direction: CallDirection;
  startedAt: Timestamp | FieldValue;
  endedAt?: Timestamp | FieldValue;
  duration?: number;
  offerSDP?: string;
  answerSDP?: string;
  iceCandidates: RTCIceCandidate[];
}

export interface ActiveCall {
  callId: string;
  metaData: CallMetadata;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  duration: number;
}
