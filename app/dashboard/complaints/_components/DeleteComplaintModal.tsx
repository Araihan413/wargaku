"use client";

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { ComplaintItem } from "../types";
import { toast } from "sonner";

interface DeleteComplaintModalProps {
  complaint: ComplaintItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const DeleteComplaintModal: React.FC<DeleteComplaintModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !complaint) return null;

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Pengaduan berhasil dihapus");
        onRefresh();
        onClose();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menghapus pengaduan");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-gray-card border border-gray-border rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-border pb-3">
          <div className="flex items-center gap-2.5 text-error">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-base font-extrabold text-gray-heading-main">
              Konfirmasi Hapus Pengaduan
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-secondary-text hover:bg-gray-sidebar-hover cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 text-xs text-gray-heading-main">
          <p>
            Apakah Anda yakin ingin menghapus laporan pengaduan ini secara permanen?
          </p>
          <div className="p-3 rounded-xl border border-gray-border bg-gray-page-bg/60 space-y-1 font-mono">
            <div>
              Kode: <span className="font-bold text-primary">#{complaint.trackingCode}</span>
            </div>
            <div>
              Pelapor: <span className="font-bold">{complaint.reporterName}</span>
            </div>
          </div>
          <p className="text-error font-medium text-[11px]">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-border bg-gray-card text-xs font-bold text-gray-heading-main hover:bg-gray-sidebar-hover transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl bg-error text-white text-xs font-extrabold shadow-sm hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Menghapus..." : "Hapus Pengaduan"}
          </button>
        </div>
      </div>
    </div>
  );
};
