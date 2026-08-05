import { uploadToCloudinary, deleteCloudinaryFileByUrl, deleteFromCloudinary } from "@/lib/cloudinary";

export interface StandaloneUploadOptions {
  buffer: Buffer;
  folder: string;
  fileName?: string;
  format?: string;
  oldFileUrl?: string | null;
}

export interface AtomicTransactionOptions<T> {
  fileBuffer: Buffer;
  folder: string;
  fileName?: string;
  format?: string;
  oldFileUrl?: string | null;
  /** Fungsi eksekusi query database yang menerima hasil upload file baru */
  dbOperation: (uploadResult: { url: string; publicId: string; format: string; resourceType: string }) => Promise<T>;
}

/**
 * 1. Helper untuk API Standalone Upload (/api/upload).
 * Mengunggah file baru ke Cloudinary dan otomatis menghapus file lama jika oldFileUrl disertakan.
 */
export async function uploadSingleFile({
  buffer,
  folder,
  fileName,
  format,
  oldFileUrl,
}: StandaloneUploadOptions) {
  const result = await uploadToCloudinary(buffer, folder, fileName, format);

  // Jika ada URL file lama, bersihkan file lama di Cloudinary di background
  if (oldFileUrl) {
    deleteCloudinaryFileByUrl(oldFileUrl).catch((err) =>
      console.error("[Cloudinary Cleanup] Gagal menghapus file lama:", err)
    );
  }

  return result;
}

/**
 * 2. Helper Transaksi Atomic (Upload + Database Query).
 * Memiliki proteksi ROLLBACK OTOMATIS: jika dbOperation gagal/throw error, file baru otomatis dihapus dari Cloudinary.
 * File lama HANYA dihapus dari Cloudinary jika dbOperation terkonfirmasi sukses.
 */
export async function uploadAndExecuteWithRollback<T>({
  fileBuffer,
  folder,
  fileName,
  format,
  oldFileUrl,
  dbOperation,
}: AtomicTransactionOptions<T>): Promise<T> {
  // Step 1: Upload file baru ke Cloudinary
  const uploadResult = await uploadToCloudinary(fileBuffer, folder, fileName, format);

  try {
    // Step 2: Eksekusi transaksi / query database
    const result = await dbOperation({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      format: uploadResult.format,
      resourceType: uploadResult.resourceType,
    });

    // Step 3: JIKA SUKSES: Hapus file lama di Cloudinary (jika ada file lama)
    if (oldFileUrl && oldFileUrl !== uploadResult.url) {
      deleteCloudinaryFileByUrl(oldFileUrl).catch((err) =>
        console.error("[Cloudinary Cleanup] Gagal menghapus file lama:", err)
      );
    }

    return result;
  } catch (error) {
    // Step 4: JIKA DB GAGAL -> ROLLBACK OTOMATIS: Hapus file baru yang terlanjur ter-upload ke Cloudinary
    console.error("[Cloudinary Rollback] DB Transaction gagal! Menghapus file baru:", uploadResult.publicId);
    await deleteFromCloudinary(uploadResult.publicId).catch((err) =>
      console.error("[Cloudinary Rollback Error] Gagal menghapus file baru:", err)
    );

    // Re-throw error agar caller API route bisa merespon HTTP error yang sesuai
    throw error;
  }
}
