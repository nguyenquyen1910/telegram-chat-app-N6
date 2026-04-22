import { CLOUDINARY_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET, IMAGE_QUALITY } from '@/constants/chat';
import { UploadResult } from '@/types/chat';

/**
 * Upload ảnh lên Cloudinary (unsigned upload)
 * Trả về URL public và dung lượng file
 */
export async function uploadImage(localUri: string): Promise<UploadResult> {
  // Tạo form data cho Cloudinary API
  const formData = new FormData();

  // Xác định file extension và MIME type
  const uriParts = localUri.split('.');
  const fileType = uriParts[uriParts.length - 1] || 'jpg';
  const mimeType = `image/${fileType === 'png' ? 'png' : 'jpeg'}`;

  formData.append('file', {
    uri: localUri,
    type: mimeType,
    name: `upload_${Date.now()}.${fileType}`,
  } as any);

  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'telegram-chat');
  formData.append('quality', String(Math.round(IMAGE_QUALITY * 100)));

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
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
