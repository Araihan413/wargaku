"use client";

import React, { useState } from "react";
import { Eye, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DocumentViewerModal, DocumentType } from "./DocumentViewerModal";

export type SecureDocType = DocumentType;

interface SecureDocumentLinkProps {
  /** Tipe dokumen — menentukan endpoint dan otorisasi di backend */
  type: SecureDocType;
  /** ID record dari database (family.id / familyMember.id / rentalContract.id / cashTransaction.id) */
  recordId: number;
  /** Mode 'view' membuka in-app popup modal; mode 'download' mengunduh file */
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
 * streaming proxy internal `/api/documents/stream` dan menampilkan Popup Modal In-App
 * tanpa memaparkan URL Cloudinary asli ke browser (Anti-Incognito Leak).
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleClick = async () => {
    if (disabled || isDownloading) return;

    if (mode === "view") {
      setIsModalOpen(true);
      return;
    }

    // Mode download: unduh file melalui streaming proxy
    setIsDownloading(true);
    try {
      const downloadUrl = `/api/documents/stream?type=${type}&id=${recordId}&download=1`;
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        let errMsg = "Gagal mengunduh berkas.";
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = downloadFilename || `dokumen-${type}-${recordId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error("[SecureDocumentLink] Download error:", err);
      toast.error(err.message || "Terjadi kesalahan saat mengunduh berkas.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isDownloading}
        className={className}
        title={title}
      >
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : mode === "download" ? (
          children ?? <Download className="h-4 w-4" />
        ) : (
          children ?? <Eye className="h-4 w-4" />
        )}
      </button>

      {/* Modal Popup Viewer */}
      {mode === "view" && isModalOpen && (
        <DocumentViewerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          type={type}
          recordId={recordId}
          title={title}
          downloadFilename={downloadFilename}
        />
      )}
    </>
  );
}
