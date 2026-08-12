"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";

export type DocumentType = "kk" | "ktp-member" | "ktp-tenant" | "receipt";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: DocumentType;
  recordId: number;
  title?: string;
  downloadFilename?: string;
}

const TYPE_LABELS: Record<DocumentType, { label: string; badgeColor: string }> = {
  kk: { label: "Kartu Keluarga", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
  "ktp-member": { label: "KTP Warga", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "ktp-tenant": { label: "KTP Penghuni Kos", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
  receipt: { label: "Bukti Nota Kas RT", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
};

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  type,
  recordId,
  title,
  downloadFilename,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const streamUrl = `/api/documents/stream?type=${type}&id=${recordId}`;
  const downloadUrl = `${streamUrl}&download=1`;
  const typeMeta = TYPE_LABELS[type] || { label: "Dokumen", badgeColor: "bg-gray-100 text-gray-700 border-gray-200" };
  const displayTitle = title || typeMeta.label;

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-5xl h-[88vh] bg-gray-card border border-gray-border rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-border bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-primary/10 text-primary rounded-2xl shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-gray-heading-main truncate max-w-xs sm:max-w-md">
                  {displayTitle}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeMeta.badgeColor}`}>
                  {typeMeta.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-secondary-text flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span>Dokumen Resmi Terverifikasi Sistem</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Open in New Tab */}
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-border text-xs font-semibold text-gray-secondary-text hover:text-gray-heading-main hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
              title="Buka Layar Penuh di Tab Baru"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Layar Penuh</span>
            </a>

            {/* Download Button */}
            <a
              href={downloadUrl}
              download={downloadFilename || true}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-900 shadow-xs transition-all cursor-pointer"
              title="Unduh Berkas Asli"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Unduh</span>
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-placeholder hover:text-gray-heading-main hover:bg-gray-sidebar-hover transition-colors cursor-pointer ml-1"
              title="Tutup (ESC)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="relative flex-1 bg-slate-900/5 p-2 sm:p-4 flex items-center justify-center overflow-hidden">
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-card/80 backdrop-blur-xs z-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold text-gray-placeholder">
                Mengambil & mendekripsi berkas aman...
              </span>
            </div>
          )}

          {/* Error State */}
          {hasError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm space-y-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-full">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h4 className="text-sm font-bold text-gray-heading-main">Gagal Memuat Pratinjau</h4>
              <p className="text-xs text-gray-secondary-text leading-relaxed">
                Berkas tidak dapat ditampilkan atau sesi Anda telah berakhir.
              </p>
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-primary hover:underline"
              >
                Coba buka langsung di tab baru
              </a>
            </div>
          ) : (
            <iframe
              key={`${type}-${recordId}`}
              src={streamUrl}
              className="w-full h-full rounded-2xl border border-gray-border bg-white shadow-xs"
              title={displayTitle}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          )}
        </div>

        {/* Footer Security Watermark */}
        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-border flex items-center justify-between text-[11px] text-gray-secondary-text shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Sesi Terenkripsi &bull; Hak Akses Diaudit</span>
          </div>
          <span>WargaKu Secure Viewer</span>
        </div>
      </div>
    </div>
  );
};
