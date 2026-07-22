"use client";

import { toast } from "sonner";

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
    if (err.message && !err.message.includes("Gagal mengunggah berkas")) {
      toast.error(err.message, { id: toastId });
    }
    throw err;
  }
}
