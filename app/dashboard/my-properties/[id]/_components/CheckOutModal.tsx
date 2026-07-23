"use client";

import React, { useState } from "react";
import { X, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resident: {
    id: number;
    name: string;
    roomNumber?: string | null;
  } | null;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  resident,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkOutDate, setCheckOutDate] = useState(new Date().toISOString().split("T")[0]);
  const [inactiveReason, setInactiveReason] = useState<"pindah" | "meninggal">("pindah");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resident) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/rental-residents/${resident.id}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkOutDate: new Date(checkOutDate),
          inactiveReason,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Penyewa berhasil di-check-out dari properti.");
        onSuccess();
        handleClose();
      } else {
        toast.error(data.error || "Gagal memproses check-out penyewa");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCheckOutDate(new Date().toISOString().split("T")[0]);
    setInactiveReason("pindah");
    onClose();
  };

  if (!isOpen || !resident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-gray-card border border-gray-border rounded-3xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-gray-sidebar-hover text-gray-secondary-text hover:text-gray-heading-main transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <LogOut className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-heading-main">Proses Check-Out Penyewa</h2>
        </div>
        <p className="text-xs text-gray-secondary-text mb-6">
          Penyewa <strong>{resident.name}</strong> ({resident.roomNumber || "Tanpa Kamar"}) akan dinonaktifkan dari hunian.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Check-Out Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-heading-main block">Tanggal Keluar (Check-Out)</label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3.5 py-2.5 text-xs text-gray-heading-main focus:outline-none focus:border-primary transition-all"
              required
            />
          </div>

          {/* Inactive Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-heading-main block">Alasan Penonaktifan</label>
            <select
              value={inactiveReason}
              onChange={(e) => setInactiveReason(e.target.value as "pindah" | "meninggal")}
              className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3 py-2.5 text-xs text-gray-heading-main focus:outline-none focus:border-primary transition-all"
            >
              <option value="pindah" className="bg-gray-card">Selesai Sewa / Pindah</option>
              <option value="meninggal" className="bg-gray-card">Meninggal Dunia</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-border/50">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-border hover:bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 text-xs font-bold text-white cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Check-Out Penyewa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
