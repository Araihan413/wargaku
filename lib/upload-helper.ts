"use client";

import { toast } from "sonner";
import { validateFile } from "@/lib/file-processor/engine";
import { FILE_PRESETS } from "@/lib/file-processor/presets";

export interface UploadResponse {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
}

export type UploadFolderCategory = 
  | "kk"
  | "ktp"
  | "receipts"
  | "avatars"
  | "complaints"
  | "dwellings"
  | "documents";

/**
 * Client helper to upload a single File to Cloudinary via /api/upload
 */
export async function uploadFileToCloudinary(
  file: File,
  folder: UploadFolderCategory = "documents"
): Promise<UploadResponse> {
  // Ponytail: Reuse existing engine validation & presets
  const preset = FILE_PRESETS[folder.toUpperCase()] || FILE_PRESETS.DOCUMENT;
  const validation = validateFile(file, preset);
  if (!validation.valid) {
    const msg = validation.error || "Berkas tidak valid.";
    toast.error(msg);
    throw new Error(msg);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const toastId = toast.loading(`Mengunggah berkas ${file.name} ke Cloudinary...`);


  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error || "Gagal mengunggah berkas.", { id: toastId });
      throw new Error(json.error || "Gagal mengunggah berkas.");
    }

    toast.success("Berkas berhasil diunggah!", { id: toastId });
    return json as UploadResponse;
  } catch (err: any) {
    if (err.message && !err.message.includes("Gagal mengunggah berkas") && !err.message.includes("melebihi batas") && !err.message.includes("Format berkas")) {
      toast.error(err.message, { id: toastId });
    }
    throw err;
  }
}


/**
 * Client helper to delete an uploaded file from Cloudinary (used for rollback on failure)
 */
export async function deleteFileFromCloudinary(urlOrPublicId: string): Promise<boolean> {
  if (!urlOrPublicId) return false;
  try {
    const isUrl = urlOrPublicId.startsWith("http");
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isUrl ? { url: urlOrPublicId } : { publicId: urlOrPublicId }),
    });
    return true;
  } catch (err) {
    console.error("Gagal membatalkan upload file Cloudinary:", err);
    return false;
  }
}

export interface AtomicSubmitOptions<T = any> {
  file?: File | string | null;
  folder?: UploadFolderCategory;
  submitFn: (fileUrl: string | null) => Promise<Response>;
  successMessage?: string | ((data: T) => string);
  errorMessage?: string;
  showSuccessToast?: boolean;
}

/**
 * Executes a form submission that involves an optional file upload to Cloudinary,
 * with AUTOMATED ROLLBACK: if backend API submission fails or throws an exception,
 * the newly uploaded Cloudinary file is automatically deleted.
 */
export async function executeWithFileUpload<T = any>({
  file,
  folder = "documents",
  submitFn,
  successMessage,
  errorMessage,
  showSuccessToast = true,
}: AtomicSubmitOptions<T>): Promise<{ success: boolean; data?: T; error?: string }> {
  let uploadedUrl: string | null = null;
  let uploadedPublicId: string | null = null;
  let isNewUpload = false;

  try {
    if (file instanceof File) {
      const uploadRes = await uploadFileToCloudinary(file, folder);
      uploadedUrl = uploadRes.url;
      uploadedPublicId = uploadRes.publicId;
      isNewUpload = true;
    } else if (typeof file === "string" && file.trim() !== "") {
      uploadedUrl = file;
    }

    const res = await submitFn(uploadedUrl);
    const data = await res.json();

    if (!res.ok) {
      if (isNewUpload && (uploadedPublicId || uploadedUrl)) {
        await deleteFileFromCloudinary(uploadedPublicId || uploadedUrl!);
      }
      const errorMsg = data.issues?.[0]?.message || data.error || errorMessage || "Gagal memproses data";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (showSuccessToast && successMessage) {
      const msg = typeof successMessage === "function" ? successMessage(data) : successMessage;
      toast.success(msg);
    }
    return { success: true, data };
  } catch (err: any) {
    if (isNewUpload && (uploadedPublicId || uploadedUrl)) {
      await deleteFileFromCloudinary(uploadedPublicId || uploadedUrl!);
    }
    const msg = err.message || errorMessage || "Terjadi kesalahan sistem";
    toast.error(msg);
    return { success: false, error: msg };
  }
}
