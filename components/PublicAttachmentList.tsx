"use client";

import React, { useState } from "react";
import { FileText, ExternalLink, X, Image as ImageIcon } from "lucide-react";
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
    return updatedTime - createdTime >= 30000; // Beda 30 detik atau lebih (artinya pernah di-update)
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
}

export const PublicAttachmentList: React.FC<PublicAttachmentListProps> = ({
  attachmentsStr,
  createdAt,
  updatedAt,
  showEditedBadge = false,
}) => {
  const items = parseAttachments(attachmentsStr);
  const itemIsEdited = showEditedBadge && isEdited(createdAt, updatedAt);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  if (items.length === 0 && !itemIsEdited) return null;

  return (
    <div className="space-y-3 pt-2">
      {/* Indicator Badge: Single badge on card */}
      {itemIsEdited && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200/80 text-[11px] font-bold text-blue-800">
          <span>Diperbarui: {formatUpdatedDate(updatedAt)}</span>
        </div>
      )}

      {/* Render Attachments if Present */}
      {items.length > 0 && (
        <div className="space-y-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Lampiran Berkas ({items.length}):
          </span>

          <div className="flex flex-wrap gap-2.5">
            {items.map((item, idx) => {
              const isPdf = item.type === "pdf" || item.url.toLowerCase().includes(".pdf");

              if (isPdf) {
                return (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold transition-all shadow-2xs group cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-rose-600 shrink-0" />
                    <span className="truncate max-w-40 sm:max-w-50">
                      {item.name || "Buka Surat Resmi (.pdf)"}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-rose-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </a>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setZoomUrl(item.url)}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 group hover:border-blue-500 transition cursor-pointer"
                >
                  <Image
                    src={item.url}
                    alt={item.name || "Poster Lampiran"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {zoomUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[70vh] w-full h-full flex items-center justify-center">
            <Image
              src={zoomUrl}
              alt="Lampiran Gambar Resolusi Penuh"
              fill
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => setZoomUrl(null)}
              className="absolute top-0 right-0 p-2 rounded-full bg-blue-500/80 text-white hover:bg-white/40 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
