"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Download, X, Eye, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { formatLocalDate } from "@/lib/date-format";

export interface AttachmentItemData {
  name: string;
  url: string;
  type: "image" | "pdf";
}

export function parseAttachments(attachmentsStr?: string | null): AttachmentItemData[] {
  if (!attachmentsStr) return [];
  try {
    if (attachmentsStr.startsWith("[")) {
      const parsed = JSON.parse(attachmentsStr);
      return parsed.map((item: any) => ({
        name: item.name || "Lampiran File",
        url: item.url || item,
        type: item.type || (item.url?.toLowerCase().includes(".pdf") ? "pdf" : "image"),
      }));
    }
    return [
      {
        name: "Lampiran File",
        url: attachmentsStr,
        type: attachmentsStr.toLowerCase().includes(".pdf") ? "pdf" : "image",
      },
    ];
  } catch {
    return [];
  }
}

export function isEdited(createdAt?: string | null, updatedAt?: string | null): boolean {
  if (!createdAt || !updatedAt) return false;
  try {
    const createdTime = new Date(createdAt).getTime();
    const updatedTime = new Date(updatedAt).getTime();
    return updatedTime - createdTime >= 30000;
  } catch {
    return false;
  }
}

export function formatUpdatedDate(updatedAt?: string | null): string {
  return formatLocalDate(updatedAt, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }, "");
}

interface PublicAttachmentListProps {
  attachmentsStr?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  showEditedBadge?: boolean;
  compact?: boolean;
}

const emptySubscribe = () => () => {};

export const PublicAttachmentList: React.FC<PublicAttachmentListProps> = ({
  attachmentsStr,
  createdAt,
  updatedAt,
  showEditedBadge = false,
  compact = false,
}) => {
  const items = parseAttachments(attachmentsStr);
  const itemIsEdited = showEditedBadge && isEdited(createdAt, updatedAt);
  const [zoomItem, setZoomItem] = useState<AttachmentItemData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const isClient = React.useSyncExternalStore(emptySubscribe, () => true, () => false);

  const handleDownload = async (url: string, fileName: string) => {
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName || "berkas_lampiran";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch {
      window.open(url, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const pdfItems = items.filter((it) => it.type === "pdf" || it.url.toLowerCase().includes(".pdf"));
  const imageItems = items.filter((it) => it.type === "image" && !it.url.toLowerCase().includes(".pdf"));

  /* ------------------------------------------------------------- */
  /* LIGHTBOX PORTAL: Rendered directly on document.body           */
  /* ------------------------------------------------------------- */
  const lightboxPortal = zoomItem && isClient && typeof document !== "undefined" ? createPortal(
    <div
      className="fixed inset-0 z-999 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        setZoomItem(null);
      }}
    >
      {/* Top Action Bar */}
      <div
        className="flex items-center justify-between gap-4 max-w-5xl w-full mx-auto pb-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs shrink-0">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold truncate max-w-xs sm:max-w-md">
              {zoomItem.name || "Pratinjau Gambar Lampiran"}
            </h4>
            <p className="text-[10px] text-white/70">Resolusi Penuh</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleDownload(zoomItem.url, zoomItem.name || "lampiran_gambar.jpg")}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Unduh Gambar</span>
          </button>
          <button
            type="button"
            onClick={() => setZoomItem(null)}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/30 text-white transition backdrop-blur-xs cursor-pointer"
            title="Tutup Pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Central Image Container */}
      <div
        className="relative flex-1 w-full max-w-5xl mx-auto flex items-center justify-center my-2 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={zoomItem.url}
          alt={zoomItem.name || "Gambar Resolusi Penuh"}
          fill
          className="object-contain"
        />
      </div>

      {/* Bottom Hint */}
      <div className="text-center text-[11px] text-white/60 pt-2">
        Klik tombol di atas untuk mengunduh atau klik di luar area gambar untuk menutup
      </div>
    </div>,
    document.body
  ) : null;

  if (items.length === 0 && !itemIsEdited) return null;

  /* ------------------------------------------------------------- */
  /* MODE 1: COMPACT PREVIEW (Untuk Kartu Grid Luar)              */
  /* ------------------------------------------------------------- */
  if (compact) {
    return (
      <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
        {/* Edited Badge on Card if needed */}
        {itemIsEdited && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[10px] font-bold text-blue-800">
            <span>Diperbarui: {formatUpdatedDate(updatedAt)}</span>
          </div>
        )}

        {/* Compact Attachments Chips / Thumbnails */}
        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Compact PDF Clickable Link */}
            {pdfItems.map((pdf, idx) => (
              <a
                key={`pdf-${idx}`}
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 hover:border-rose-300 text-[11px] font-bold text-rose-700 hover:text-rose-800 max-w-full transition-all cursor-pointer shadow-2xs group"
                title={`Buka Dokumen PDF: ${pdf.name || "Surat Resmi (.pdf)"}`}
              >
                <FileText className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate max-w-32.5 sm:max-w-42.5">
                  {pdf.name || "Surat Resmi (.pdf)"}
                </span>
              </a>
            ))}

            {/* Compact Image Thumbnails */}
            {imageItems.map((img, idx) => (
              <button
                key={`img-${idx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomItem(img);
                }}
                className="group relative w-9 h-9 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:border-emerald-500 transition-all shrink-0 cursor-pointer shadow-2xs"
                title={`Lihat Gambar: ${img.name || `Lampiran ${idx + 1}`}`}
              >
                <Image
                  src={img.url}
                  alt={img.name || `Lampiran ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Lightbox Portal */}
        {lightboxPortal}
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* MODE 2: FULL DETAIL PREVIEW (Untuk Di Dalam Modal Popup)       */
  /* ------------------------------------------------------------- */
  return (
    <div className="space-y-3 pt-2">
      {/* Indicator Badge: Single badge on card */}
      {itemIsEdited && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-bold text-blue-800 shadow-2xs">
          <span>Diperbarui: {formatUpdatedDate(updatedAt)}</span>
        </div>
      )}

      {/* Render Attachments if Present */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Lampiran Berkas Resmi
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
              {items.length} Berkas
            </span>
          </div>

          {/* 1. Streamlined PDF Documents Section */}
          {pdfItems.length > 0 && (
            <div className="space-y-2">
              {pdfItems.map((pdf, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-rose-50/60 border border-rose-200/70 hover:bg-rose-50 transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 shadow-2xs">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {pdf.name || "Dokumen Surat Resmi (.pdf)"}
                      </h4>
                      <p className="text-[10px] text-rose-600 font-medium">
                        Dokumen PDF Resmi
                      </p>
                    </div>
                  </div>

                  {/* Actions for PDF */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <a
                      href={pdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-100/50 text-rose-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-rose-600" />
                      <span>Buka Dokumen</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDownload(pdf.url, pdf.name || "dokumen_lampiran.pdf")}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                      title="Unduh Berkas PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Unduh</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Image Attachments Section */}
          {imageItems.length > 0 && (
            <div>
              {imageItems.length === 1 ? (
                /* Single Image: Hero Poster Banner */
                <div
                  onClick={() => setZoomItem(imageItems[0])}
                  className="group relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs cursor-pointer"
                >
                  <Image
                    src={imageItems[0].url}
                    alt={imageItems[0].name || "Poster Lampiran"}
                    fill
                    className="object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity flex items-end justify-between p-3.5">
                    <div className="text-white">
                      <p className="text-xs font-bold truncate max-w-xs sm:max-w-md">
                        {imageItems[0].name || "Poster Lampiran"}
                      </p>
                      <span className="text-[10px] text-white/80 font-medium">Klik untuk memperbesar</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-white/20 backdrop-blur-xs text-white group-hover:bg-white group-hover:text-slate-900 transition-colors">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Multiple Images: Gallery Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {imageItems.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setZoomItem(img)}
                      className="group relative h-24 sm:h-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs cursor-pointer"
                    >
                      <Image
                        src={img.url}
                        alt={img.name || `Lampiran ${idx + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <ImageIcon className="h-4 w-4 drop-shadow-md" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Portal */}
      {lightboxPortal}
    </div>
  );
};
