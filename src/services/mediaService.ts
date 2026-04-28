import { CLOUDINARY_UPLOAD_URL, CLOUDINARY_VIDEO_UPLOAD_URL, CLOUDINARY_RAW_UPLOAD_URL, CLOUDINARY_AUTO_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET, IMAGE_QUALITY } from '@/constants/chat';
import { UploadResult } from '@/types/chat';

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp'];

/**
 * Upload ảnh hoặc video lên Cloudinary (unsigned upload)
 * Tự detect loại file và dùng đúng endpoint
 */
export async function uploadImage(localUri: string): Promise<UploadResult> {
  const formData = new FormData();

  // Xác định file extension và loại file
  const uriParts = localUri.split('.');
  const fileType = (uriParts[uriParts.length - 1] || 'jpg').toLowerCase();
  const isVideo = VIDEO_EXTENSIONS.includes(fileType);

  const mimeType = isVideo
    ? `video/${fileType === 'mov' ? 'quicktime' : fileType}`
    : `image/${fileType === 'png' ? 'png' : 'jpeg'}`;

  const uploadUrl = isVideo ? CLOUDINARY_VIDEO_UPLOAD_URL : CLOUDINARY_UPLOAD_URL;

  formData.append('file', {
    uri: localUri,
    type: mimeType,
    name: `upload_${Date.now()}.${fileType}`,
  } as any);

  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'telegram-chat');
  if (!isVideo) {
    formData.append('quality', String(Math.round(IMAGE_QUALITY * 100)));
  }

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      size: data.bytes,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Tạo thumbnail URL từ Cloudinary URL
 * Sử dụng Cloudinary transformations
 */
export function getThumbnailUrl(originalUrl: string, width = 150, height = 150): string {
  if (!originalUrl.includes('cloudinary.com')) {
    return originalUrl; // Không phải Cloudinary URL, trả về nguyên
  }

  // Chèn transformation vào URL
  // Format: .../upload/c_fill,w_150,h_150/...
  return originalUrl.replace('/upload/', `/upload/c_fill,w_${width},h_${height}/`);
}

/**
 * Validate kích thước ảnh trước khi upload
 */
export function validateImageSize(fileSize: number, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxBytes;
}

import { Platform } from 'react-native';

/**
 * Upload file bất kỳ lên Cloudinary (raw upload)
 * Hỗ trợ PDF, DOC, ZIP, v.v.
 */
export async function uploadFile(localUri: string, fileName: string, mimeType: string): Promise<UploadResult> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // Web: cần fetch blob từ URI rồi append
    const response = await fetch(localUri);
    const blob = await response.blob();
    formData.append('file', blob, fileName || `file_${Date.now()}`);
  } else {
    // Native (iOS/Android): dùng RN-style object
    formData.append('file', {
      uri: localUri,
      type: mimeType || 'application/octet-stream',
      name: fileName || `file_${Date.now()}`,
    } as any);
  }

  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'telegram-chat/files');

  try {
    const response = await fetch(CLOUDINARY_AUTO_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`File upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      size: data.bytes,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error('Cloudinary file upload error:', error);
    throw error;
  }
}

/**
 * Format dung lượng file cho hiển thị
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
  return `${size} ${units[i]}`;
}

/**
 * Lấy thông tin icon và màu sắc dựa vào tên file
 */
export function getFileIcon(fileName: string): { icon: string; color: string; bg: string } {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'pdf':
      return { icon: 'document-text', color: '#E53935', bg: '#FFEBEE' };
    case 'doc': case 'docx':
      return { icon: 'document-text', color: '#1565C0', bg: '#E3F2FD' };
    case 'xls': case 'xlsx': case 'csv':
      return { icon: 'grid-outline', color: '#2E7D32', bg: '#E8F5E9' };
    case 'ppt': case 'pptx':
      return { icon: 'easel-outline', color: '#E65100', bg: '#FFF3E0' };
    case 'zip': case 'rar': case '7z': case 'tar': case 'gz':
      return { icon: 'file-tray-stacked', color: '#F9A825', bg: '#FFFDE7' };
    case 'mp3': case 'wav': case 'aac': case 'flac':
      return { icon: 'musical-notes', color: '#8E24AA', bg: '#F3E5F5' };
    case 'mp4': case 'mov': case 'avi': case 'mkv':
      return { icon: 'videocam', color: '#D81B60', bg: '#FCE4EC' };
    case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp':
      return { icon: 'image', color: '#00897B', bg: '#E0F2F1' };
    case 'txt': case 'log':
      return { icon: 'document-outline', color: '#546E7A', bg: '#ECEFF1' };
    case 'json': case 'xml': case 'js': case 'ts': case 'html': case 'css':
      return { icon: 'code-slash', color: '#3949AB', bg: '#E8EAF6' };
    case 'apk':
      return { icon: 'logo-android', color: '#43A047', bg: '#E8F5E9' };
    default:
      return { icon: 'document-attach', color: '#50A8EB', bg: '#E3F2FD' };
  }
}

