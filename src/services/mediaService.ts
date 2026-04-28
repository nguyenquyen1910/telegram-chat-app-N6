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
