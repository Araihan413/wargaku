"use client";

import { useState } from "react";
import { Eye, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type SecureDocType = "kk" | "ktp-member" | "ktp-tenant" | "receipt";

interface SecureDocumentLinkProps {
  /** Tipe dokumen — menentukan endpoint dan otorisasi di backend */
  type: SecureDocType;
  /** ID record dari database (family.id / familyMember.id / rentalContract.id / cashTransaction.id) */
  recordId: number;
  /** Mode 'view' membuka di tab baru; mode 'download' mengunduh file */
  mode?: "view" | "download";
  /** Nama file untuk diunduh (hanya dipakai saat mode='download') */
  downloadFilename?: string;
  /** Teks atau node yang ditampilkan di dalam tombol */
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  /** Atribut title native untuk tooltip HTML */
  title?: string;
}

/**
 * SecureDocumentLink
 *
 * Komponen tombol yang secara aman mengakses berkas sensitif (KK, KTP, Nota) melalui
 * API proxy `/api/documents/secure-url`. Tidak pernah memaparkan URL Cloudinary asli
 * ke browser — hanya menggunakan signed URL sementara (berlaku 10 menit).
 */
export function SecureDocumentLink({
  type,
  recordId,
  mode = "view",
  downloadFilename,
  children,
  className,
  disabled = false,
  title,
}: SecureDocumentLinkProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || disabled) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/documents/secure-url?type=${type}&id=${recordId}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal memuat berkas. Silakan coba lagi.");
        return;
      }

      const { signedUrl } = data;

      if (mode === "download" && downloadFilename) {
        // Unduh file sebagai blob agar nama file sesuai
        const fileRes = await fetch(signedUrl);
        if (!fileRes.ok) throw new Error("Gagal mengunduh berkas dari server.");
        const blob = await fileRes.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = downloadFilename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        // Buka di tab baru
        window.open(signedUrl, "_blank", "noreferrer");
      }
    } catch (err: any) {
      console.error("[SecureDocumentLink] Error:", err);
      toast.error(err.message || "Terjadi kesalahan saat membuka berkas.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading || disabled}
      className={className}
      title={title}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : mode === "download" ? (
        children ?? <Download className="h-4 w-4" />
      ) : (
        children ?? <Eye className="h-4 w-4" />
      )}
    </button>
  );
}
