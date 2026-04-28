import { Timestamp } from 'firebase/firestore';

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
  type: 'private' | 'group';
  lastReadBy?: { [uid: string]: Timestamp };
  mutedBy?: { [uid: string]: boolean };
  wallpaperId?: string;
  groupName?: string;
  groupAvatar?: string;
}

// ==================== Message ====================
export type MessageType = 'text' | 'image' | 'file' | 'reply' | 'voice';
export type MessageStatus = 'sending' | 'sent' | 'read';

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
  imageWidth?: number;
  imageHeight?: number;
  fileThumbnail?: string;
  replyTo?: ReplyTo;
  voiceDuration?: number;
  status: MessageStatus;
  createdAt: Timestamp;
  // Message actions
  reactions?: { [emoji: string]: string[] };
  isRevoked?: boolean;
  deletedFor?: string[];
  isEdited?: boolean;
}

// ==================== Media Upload ====================
export interface UploadResult {
  url: string;
  size: number;
  publicId: string;
  width?: number;
  height?: number;
}

// ==================== Component Props ====================
export interface ChatHeaderProps {
  userName: string;
  userAvatar: string;
  lastSeen: string;
  isOnline: boolean;
  onBackPress: () => void;
  onProfilePress: () => void;
  onCallPress?: () => void;
  onMenuPress?: () => void;
}

export interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  senderName?: string;
  isHighlighted?: boolean;
  currentUid?: string;
  onLongPress?: (message: Message) => void;
  onImagePress?: (imageUrl: string) => void;
  onFilePress?: (fileUrl: string, fileName: string) => void;
}

export interface MessageInputProps {
  onSendText: (text: string) => void;
  onAttach: () => void;
  onSendImage: (uri: string, fileName: string, caption: string) => void;
  pendingImage: { uri: string; fileName: string } | null;
  onCancelImage: () => void;
  replyingTo: Message | null;
  replyingSenderName?: string;
  onCancelReply: () => void;
  editingMessage: Message | null;
  onCancelEdit: () => void;
  onSaveEdit: (messageId: string, newText: string) => void;
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
