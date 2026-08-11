"use client";

import React from "react";
import {
  MessageSquare,
  Clock,
  Eye,
  Trash2,
  ExternalLink,
  PenBox
} from "lucide-react";
import { ComplaintItem } from "../types";

interface ComplaintTableProps {
  complaints: ComplaintItem[];
  isLoading: boolean;
  onSelectComplaint: (complaint: ComplaintItem) => void;
  onDeleteComplaint?: (complaint: ComplaintItem) => void;
  canDelete?: boolean;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({
  complaints,
  isLoading,
  onSelectComplaint,
  onDeleteComplaint,
  canDelete = false,
}) => {
  const getStatusBadge = (status: ComplaintItem["status"]) => {
    switch (status) {
      case "menunggu":
        return (
          <span className="inline-flex items-center rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-xs font-extrabold text-rose-600">
            Menunggu Respon
          </span>
        );
      case "proses":
        return (
          <span className="inline-flex items-center rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-extrabold text-amber-600">
            Sedang Diproses
          </span>
        );
      case "selesai":
        return (
          <span className="inline-flex items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-extrabold text-emerald-600">
            Selesai Ditangani
          </span>
        );
      case "ditolak":
        return (
          <span className="inline-flex items-center rounded-lg bg-gray-500/10 border border-gray-500/20 px-2.5 py-1 text-xs font-extrabold text-gray-600">
            Ditolak
          </span>
        );
    }
  };

  const getCategoryBadge = (category: ComplaintItem["category"]) => {
    return (
      <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
        {category}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-border bg-gray-card p-8 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-gray-border/60 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-border/40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-border bg-gray-card p-12 text-center">
        <div className="rounded-2xl bg-gray-sidebar-hover p-4 text-gray-placeholder mb-3">
          <MessageSquare className="h-8 w-8" />
        </div>
        <h3 className="text-base font-bold text-gray-heading-main">
          Tidak Ada Pengaduan
        </h3>
        <p className="mt-1 text-xs text-gray-secondary-text max-w-sm">
          Belum ada laporan pengaduan warga yang sesuai dengan kriteria filter saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
            <tr>
              <th className="px-4 py-3.5">Kode / Tanggal</th>
              <th className="px-4 py-3.5">Pelapor</th>
              <th className="px-4 py-3.5">Kategori</th>
              <th className="px-4 py-3.5">Ringkasan Laporan</th>
              <th className="px-4 py-3.5 text-center">Bukti Foto</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border/60 text-gray-heading-main">
            {complaints.map((item) => {
              const formattedDate = new Date(item.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              const waNumber = item.reporterPhone
                ? item.reporterPhone.replace(/[^0-9]/g, "").replace(/^0/, "62")
                : null;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-gray-sidebar-hover/30 transition-colors"
                >
                  {/* Tracking code & date */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="font-mono font-bold text-primary text-xs">
                      #{item.trackingCode}
                    </div>
                    <div className="text-[11px] text-gray-secondary-text flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{formattedDate}</span>
                    </div>
                  </td>

                  {/* Reporter info */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="font-bold text-gray-heading-main">{item.reporterName}</div>
                    {item.reporterPhone ? (
                      <a
                        href={`https://wa.me/${waNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline mt-0.5"
                      >
                        <span>{item.reporterPhone}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-gray-placeholder">-</span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5 align-middle">
                    {getCategoryBadge(item.category)}
                  </td>

                  {/* Summary Description */}
                  <td className="px-4 py-3.5 align-middle max-w-xs">
                    <p className="line-clamp-2 text-xs text-gray-heading-main leading-relaxed">
                      {item.description}
                    </p>
                    {item.dwellingAddress && (
                      <span className="inline-block text-[10px] text-gray-secondary-text mt-1 bg-gray-page-bg border border-gray-border rounded px-1.5 py-0.5">
                        📍 {item.dwellingAddress}
                      </span>
                    )}
                  </td>

                  {/* Bukti Foto */}
                  <td className="px-4 py-3.5 align-middle text-center">
                    {item.photoPath ? (
                      <button
                        type="button"
                        onClick={() => onSelectComplaint(item)}
                        title="Lihat Foto Bukti"
                        className="inline-flex items-center justify-center p-2 rounded-xl border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white transition cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-placeholder">-</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5 align-middle">
                    {getStatusBadge(item.status)}
                    {item.handlerName && (
                      <div className="text-[10px] text-gray-secondary-text mt-1">
                        Oleh: <span className="font-semibold">{item.handlerName}</span>
                      </div>
                    )}
                  </td>

                  {/* Action buttons */}
                  <td className="px-4 py-3.5 align-middle text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectComplaint(item)}
                        title="Tanggapi Pengaduan"
                        className="p-2 rounded-md border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white transition cursor-pointer"
                      >
                        <PenBox className="h-4 w-4" />
                      </button>

                      {canDelete && onDeleteComplaint && (
                        <button
                          type="button"
                          onClick={() => onDeleteComplaint(item)}
                          className="p-2 rounded-md border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                          title="Hapus Pengaduan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
