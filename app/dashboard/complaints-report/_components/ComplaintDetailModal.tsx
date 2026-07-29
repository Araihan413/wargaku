import React from "react";
import { X, MessageSquareWarning, User, Tag, FileText, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { ComplaintReportItem } from "../types";
import Image from "next/image";

interface ComplaintDetailModalProps {
  item: ComplaintReportItem | null;
  onClose: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  menunggu: {
    label: "Menunggu Tindakan",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  proses: {
    label: "Sedang Diproses",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  selesai: {
    label: "Selesai Ditangani",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  ditolak: {
    label: "Laporan Ditolak",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  item,
  onClose,
}) => {
  if (!item) return null;

  const status = statusConfig[item.status] || {
    label: item.status,
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-gray-card border border-gray-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-heading-main tracking-tight">
                Detail Laporan Aduan
              </h3>
              <p className="text-xs text-gray-secondary-text font-mono">
                {item.trackingCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-placeholder hover:text-gray-heading-main hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold ${status.className}`}>
            {status.label}
          </span>
          <span className="text-xs text-gray-secondary-text">
            Dilaporkan: {formatDate(item.createdAt)}
          </span>
        </div>

        {/* Pelapor & Kategori */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-gray-50/80 border border-gray-border/60 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-gray-secondary-text font-bold text-[11px]">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Data Pelapor</span>
            </div>
            <p className="text-sm font-extrabold text-gray-heading-main">{item.reporterName}</p>
            <p className="text-[11px] text-gray-secondary-text">{item.reporterPhone || "Tidak ada nomor"}</p>
          </div>

          <div className="p-3 bg-gray-50/80 border border-gray-border/60 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-gray-secondary-text font-bold text-[11px]">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kategori Aduan</span>
            </div>
            <p className="text-sm font-extrabold text-indigo-700">{item.category}</p>
            {item.resolvedAt && (
              <p className="text-[11px] text-gray-secondary-text">
                Diselesaikan: {formatDate(item.resolvedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Deskripsi Aduan */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-heading-main">
            <FileText className="w-3.5 h-3.5 text-gray-secondary-text" />
            Deskripsi Lengkap Aduan:
          </label>
          <div className="p-3 bg-gray-100/80 border border-gray-border rounded-xl text-sm text-gray-heading-main leading-relaxed whitespace-pre-wrap">
            {item.description}
          </div>
        </div>

        {/* Foto Bukti */}
        {item.photoPath && (
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-heading-main">
              <ImageIcon className="w-3.5 h-3.5 text-gray-secondary-text" />
              Foto Lampiran Bukti Aduan:
            </label>
            <div className="rounded-xl overflow-hidden border border-gray-border">
              <Image
                src={`/uploads/${item.photoPath}`}
                alt="Foto Bukti Aduan"
                className="w-full max-h-64 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
        )}

        {/* Catatan Tanggapan RT */}
        {item.responseNote && (
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-heading-main">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Tanggapan Resmi Pengurus RT:
            </label>
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/60 rounded-xl text-sm text-gray-heading-main leading-relaxed whitespace-pre-wrap">
              {item.responseNote}
            </div>
            {item.handlerName && (
              <p className="text-[11px] text-gray-secondary-text text-right">
                — Ditangani oleh: <strong>{item.handlerName}</strong>
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-gray-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-heading-main rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
};
