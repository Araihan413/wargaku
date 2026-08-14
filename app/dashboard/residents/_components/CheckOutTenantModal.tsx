"use client";

import React, { useState } from "react";
import { X, Loader2, LogOut, Calendar } from "lucide-react";
import { toast } from "sonner";

import { RentalResidentItem } from "./RentalTable";

interface CheckOutTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resident: RentalResidentItem | null;
}

export const CheckOutTenantModal: React.FC<CheckOutTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  resident,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkOutDate, setCheckOutDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [autoFreeVacantRoom, setAutoFreeVacantRoom] = useState(true);

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
          notes: notes || null,
          autoFreeVacantRoom,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal memproses check-out");
      }

      toast.success("Penyewa berhasil di-check-out dari hunian sewa");
      handleClose();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCheckOutDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setAutoFreeVacantRoom(true);
    onClose();
  };

  if (!isOpen || !resident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-gray-card border border-gray-border rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-heading-main">Proses Check-Out Penyewa</h3>
              <p className="text-[10px] text-gray-secondary-text">Tandai status penyewa selesai sewa</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl text-xs text-amber-800 leading-relaxed font-medium">
              Apakah Anda yakin ingin men-check-out penyewa <strong className="text-gray-heading-main font-bold">{resident.name}</strong> dari hunian sewa <strong>{resident.propertyName}</strong>? Status penyewa akan menjadi tidak aktif.
            </div>

            {/* Check-Out Date */}
            <div className="space-y-1.5">
              <label htmlFor="checkOutDate" className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Tanggal Keluar (Check-Out) <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="checkOutDate"
                  value={checkOutDate}
                  min={resident?.checkInDate ? resident.checkInDate.split('T')[0] : undefined}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  required
                />
                <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-gray-placeholder pointer-events-none" />
              </div>
            </div>

            {/* Checkout Keterangan */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Keterangan
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan mengenai check-out (opsional)"
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-xs text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                rows={3}
              />
            </div>

            {/* Auto Free Vacant Room Toggle */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-sidebar-hover/60 border border-gray-border">
              <input
                type="checkbox"
                id="adminCheckOutAutoFree"
                checked={autoFreeVacantRoom}
                onChange={(e) => setAutoFreeVacantRoom(e.target.checked)}
                className="h-4 w-4 rounded border-gray-border text-primary focus:ring-primary/20 cursor-pointer"
              />
              <label htmlFor="adminCheckOutAutoFree" className="text-xs font-semibold text-gray-heading-main cursor-pointer select-none">
                Otomatis tambah 1 kamar kosong (Kurangi kamar terisi)
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-border px-6 py-4 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-xs font-semibold text-gray-secondary-text cursor-pointer transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all disabled:opacity-50"
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
