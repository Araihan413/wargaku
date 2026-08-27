import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Configure Cloudinary credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
}

/**
 * Uploads a Buffer stream to Cloudinary under the specified folder
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folderName: string,
  fileName?: string,
  format?: string,
): Promise<CloudinaryUploadResult> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Konfigurasi Cloudinary (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET) belum diatur di environment variable (.env).');
  }

  const folder = `wargaku/${folderName}`;

  return new Promise((resolve, reject) => {
    const SENSITIVE_FOLDERS = ["kk", "ktp", "receipts"];
    const isSensitive = SENSITIVE_FOLDERS.includes(folderName);

    const uploadOptions: Record<string, any> = {
      folder,
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
    };

    // Berkas sensitif (KK, KTP, Nota) disimpan sebagai 'authenticated' —
    // tidak dapat diakses via direct URL publik tanpa signed token.
    if (isSensitive) {
      uploadOptions.type = "authenticated";
    }

    if (fileName) {
      uploadOptions.filename_override = fileName;
    }

    // Jika folder berupa kk/ktp atau format pdf di-request, pastikan disimpan sebagai PDF
    if (folderName === "kk" || folderName === "ktp" || format === "pdf") {
      uploadOptions.format = "pdf";
    } else {
      // Optimasi gambar otomatis Cloudinary saat upload (q_auto, f_auto, resize max 1920px tanpa ubah rasio)
      uploadOptions.transformation = [
        { width: 1920, height: 1920, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          console.error('Cloudinary upload stream error:', error);
          return reject(error || new Error('Gagal mengunggah file ke Cloudinary.'));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          resourceType: result.resource_type,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

export { cloudinary };

/**
 * Extracts the Cloudinary public_id from a full Cloudinary URL.
 * 
 * Example:
 *   Input:  "https://res.cloudinary.com/xxx/image/upload/v1234567890/wargaku/kk/scan_kk_abc123.png"
 *   Output: "wargaku/kk/scan_kk_abc123"
 * 
 * Returns null if the URL is not a valid Cloudinary URL.
 */
export function extractPublicIdFromUrl(url: string, keepExtension = false): string | null {
  if (!url || !url.includes('res.cloudinary.com')) return null;

  try {
    let uploadIndex = url.indexOf('/upload/');
    let typeLength = '/upload/'.length;
    if (uploadIndex === -1) {
      uploadIndex = url.indexOf('/authenticated/');
      typeLength = '/authenticated/'.length;
    }
    if (uploadIndex === -1) {
      uploadIndex = url.indexOf('/private/');
      typeLength = '/private/'.length;
    }
    if (uploadIndex === -1) return null;

    let afterUpload = url.substring(uploadIndex + typeLength);

    // Strip signature prefix if present (e.g. "s--RDnvSXUq--/")
    if (/^s--[^/]+--\//.test(afterUpload)) {
      afterUpload = afterUpload.replace(/^s--[^/]+--\//, '');
    }

    // Strip version prefix if present (e.g. "v1234567890/")
    if (/^v\d+\//.test(afterUpload)) {
      afterUpload = afterUpload.replace(/^v\d+\//, '');
    }

    if (!keepExtension) {
      const lastDotIndex = afterUpload.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        afterUpload = afterUpload.substring(0, lastDotIndex);
      }
    }
    return afterUpload || null;
  } catch {
    return null;
  }
}

/**
 * Deletes a file from Cloudinary by its public_id.
 * Silently logs errors without throwing — deletion failure should not block the main operation.
 */
export async function deleteFromCloudinary(publicId: string, resourceType: string = 'image'): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    
    if (result.result === 'ok') {
      console.log(`[Cloudinary] File berhasil dihapus: ${publicId}`);
      return true;
    } else {
      console.warn(`[Cloudinary] Gagal menghapus file ${publicId}:`, result);
      return false;
    }
  } catch (error) {
    console.error(`[Cloudinary] Error saat menghapus file ${publicId}:`, error);
    return false;
  }
}

/**
 * Deletes a Cloudinary file using its full URL.
 * Extracts publicId from the URL, then calls deleteFromCloudinary.
 * Does nothing if the URL is not a Cloudinary URL (e.g., Google Drive link).
 */
export async function deleteCloudinaryFileByUrl(url: string): Promise<boolean> {
  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) return false;

  // Try deleting as 'image' first (covers jpg, png, webp, pdf uploaded as image)
  const imageResult = await deleteFromCloudinary(publicId, 'image');
  if (imageResult) return true;

  // Fallback: try as 'raw' (covers PDF uploaded as raw)
  const rawResult = await deleteFromCloudinary(publicId, 'raw');
  return rawResult;
}

/**
 * Generate a time-limited signed URL for a Cloudinary asset.
 * URL will be valid for `expiresInSeconds` seconds (default: 600 = 10 minutes).
 *
 * Use this ONLY on the server side (API routes). Never expose the signed URL
 * in persistent storage — only deliver it transiently to the browser.
 *
 * @param publicId  - The Cloudinary public_id of the asset
 * @param resourceType - 'image' (default) or 'raw'
 * @param expiresInSeconds - Validity window in seconds (default 600 = 10 min)
 * @param deliveryType - 'authenticated' (default) or 'upload' or 'private'
 */
export function generateSignedUrl(
  publicId: string,
  resourceType: 'image' | 'raw' = 'image',
  expiresInSeconds = 600,
  deliveryType: 'upload' | 'authenticated' | 'private' = 'authenticated',
): string {
  return cloudinary.url(publicId, {
    sign_url: true,
    type: deliveryType,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    resource_type: resourceType,
    secure: true,
  });
}

/**
 * Helper to safely extract an array of URLs from an attachments JSON string or plain URL.
 */
export function parseUrlsFromAttachments(attachments: string | null | undefined): string[] {
  if (!attachments) return [];
  try {
    if (attachments.startsWith("[")) {
      const parsed: Array<{ url?: string } | string> = JSON.parse(attachments);
      return parsed
        .map((item) => (typeof item === "string" ? item : item.url || ""))
        .filter(Boolean);
    }
    return [attachments];
  } catch {
    return attachments ? [attachments] : [];
  }
}
