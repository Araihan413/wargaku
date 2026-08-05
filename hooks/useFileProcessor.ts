"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { FileValidationOptions, ProcessedFileResult } from "@/lib/file-processor/types";
import { processFile } from "@/lib/file-processor/engine";

export interface UploadSuccessResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
}

export function useFileProcessor(options: FileValidationOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Memproses file lokal (Validasi + Optimasi + Konversi PDF jika perlu)
   */
  const handleProcessFile = useCallback(
    async (file: File): Promise<ProcessedFileResult | null> => {
      setIsProcessing(true);
      setError(null);

      try {
        const result = await processFile(file, options);
        return result;
      } catch (err: any) {
        const msg = err.message || "Gagal memproses berkas.";
        setError(msg);
        toast.error(msg);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [options]
  );

  /**
   * Memproses file secara lokal lalu langsung mengunggahnya ke endpoint API /api/upload
   */
  const handleUploadFile = useCallback(
    async (
      file: File,
      folderName = "documents",
      oldFileUrl?: string | null
    ): Promise<UploadSuccessResult | null> => {
      const processed = await handleProcessFile(file);
      if (!processed) return null;

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", processed.file);
        formData.append("folder", folderName);
        if (oldFileUrl) {
          formData.append("oldFileUrl", oldFileUrl);
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal mengunggah berkas ke server.");
        }

        const data: UploadSuccessResult = await res.json();
        return data;
      } catch (err: any) {
        const msg = err.message || "Gagal mengunggah berkas.";
        setError(msg);
        toast.error(msg);
        return null;
      } finally {
        setIsUploading(false);
        if (processed.previewUrl) {
          URL.revokeObjectURL(processed.previewUrl);
        }
      }
    },
    [handleProcessFile]
  );

  return {
    isProcessing,
    isUploading,
    isLoading: isProcessing || isUploading,
    error,
    processFile: handleProcessFile,
    uploadFile: handleUploadFile,
  };
}
