import { Timestamp } from 'firebase/firestore';
import { Message, User, Conversation } from '@/types/chat';

// ==================== Cloudinary Config ====================
export const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';
export const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'your_upload_preset';
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// ==================== Chat Constants ====================
export const MESSAGES_PER_PAGE = 20;
export const MAX_IMAGE_SIZE_MB = 10;
export const IMAGE_QUALITY = 0.7;
export const THUMBNAIL_SIZE = { width: 150, height: 150 };

// ==================== Mock Data ====================
export const MOCK_CURRENT_USER: User = {
  uid: 'user_me',
  displayName: 'You',
  phoneNumber: '+84 90 1234567',
  avatarUrl: '',
  bio: 'Hey there! I am using Telegram',
  lastSeen: null,
  isOnline: true,
  createdAt: Timestamp.now(),
};

export const MOCK_OTHER_USER: User = {
  uid: 'user_martha',
  displayName: 'Martha Craig',
  phoneNumber: '+84 35 6927326',
  avatarUrl: 'https://i.pravatar.cc/150?img=47',
  bio: 'Digital Nomad 🌏',
  lastSeen: Timestamp.now(),
  isOnline: true,
  createdAt: Timestamp.now(),
};

const now = Date.now();
const minute = 60 * 1000;

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_1',
    senderId: 'user_me',
    text: 'Good morning!',
    type: 'text',
    status: 'read',
    createdAt: Timestamp.fromMillis(now - 120 * minute),
  },
  {
    id: 'msg_2',
    conversationId: 'conv_1',
    senderId: 'user_me',
    text: 'Japan looks amazing!',
    type: 'text',
    status: 'read',
    createdAt: Timestamp.fromMillis(now - 119 * minute),
  },
  {
    id: 'msg_3',
    conversationId: 'conv_1',
    senderId: 'user_me',
    text: '',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400',
    fileName: 'IMG_0475.PNG',
    fileSize: 2516582,
    status: 'read',
    createdAt: Timestamp.fromMillis(now - 115 * minute),
  },
  {
    id: 'msg_4',
    conversationId: 'conv_1',
    senderId: 'user_me',
    text: '',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    fileName: 'IMG_0481.PNG',
    fileSize: 2936012,
    status: 'read',
    createdAt: Timestamp.fromMillis(now - 114 * minute),
  },
  {
    id: 'msg_5',
    conversationId: 'conv_1',
    senderId: 'user_martha',
    text: 'Do you know what time is it?',
    type: 'reply',
    replyTo: {
      messageId: 'msg_1',
      text: 'Good morning!',
      senderName: 'Martha Craig',
    },
    status: 'read',
    createdAt: Timestamp.fromMillis(now - 80 * minute),
  },
  {
    id: 'msg_6',
    conversationId: 'conv_1',
    senderId: 'user_me',
    text: "It's morning in Tokyo 😎",
    type: 'text',
    status: 'read',
    createdAt: Timestamp.fromMillis(now - 77 * minute),
  },
  {
    id: 'msg_7',
    conversationId: 'conv_1',
    senderId: 'user_martha',
    text: 'What is the most popular meal in Japan?',
    type: 'text',
    status: 'read',
    createdAt: Timestamp.fromMillis(now - 75 * minute),
  },
  {
    id: 'msg_8',
    conversationId: 'conv_1',
    senderId: 'user_martha',
    text: 'Do you like it?',
    type: 'text',
    status: 'read',
    createdAt: Timestamp.fromMillis(now - 74 * minute),
  },
  {
    id: 'msg_9',
    conversationId: 'conv_1',
    senderId: 'user_me',
    text: 'I think top two are:',
    type: 'text',
    status: 'read',
    createdAt: Timestamp.fromMillis(now - 70 * minute),
  },
  {
    id: 'msg_10',
    conversationId: 'conv_1',
    senderId: 'user_me',
    text: '',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400',
    fileName: 'IMG_0483.PNG',
    fileSize: 2936012,
    status: 'read',
    createdAt: Timestamp.fromMillis(now - 69 * minute),
  },
  {
    id: 'msg_11',
    conversationId: 'conv_1',
    senderId: 'user_me',
    text: '',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    fileName: 'IMG_0484.PNG',
    fileSize: 2726297,
    status: 'read',
    createdAt: Timestamp.fromMillis(now - 68 * minute),
  },
];

export const MOCK_CONVERSATION: Conversation = {
  id: 'conv_1',
  participants: ['user_me', 'user_martha'],
  lastMessage: {
    text: '',
    senderId: 'user_me',
    timestamp: Timestamp.fromMillis(now - 68 * minute),
    type: 'image',
  },
  updatedAt: Timestamp.fromMillis(now - 68 * minute),
  type: 'private',
};

// ==================== Helpers ====================
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function formatMessageTime(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatLastSeen(timestamp: Timestamp | null, isOnline: boolean): string {
  if (isOnline) return 'online';
  if (!timestamp) return 'last seen recently';
  
  const now = Date.now();
  const diff = now - timestamp.toMillis();
  const minutes = Math.floor(diff / (60 * 1000));
  
  if (minutes < 1) return 'last seen just now';
  if (minutes < 60) return `last seen ${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `last seen ${hours}h ago`;
  
  const date = timestamp.toDate();
  return `last seen ${date.toLocaleDateString()}`;
}
