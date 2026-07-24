"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, UserCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";

interface ChangeCoordinatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  propertyId: number;
  currentCoordinatorId: string | null | undefined;
  ownerUserId: string | null | undefined;
  ownerName: string | null | undefined;
}

export const ChangeCoordinatorModal: React.FC<ChangeCoordinatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  propertyId,
  currentCoordinatorId,
  ownerUserId,
  ownerName,
}) => {
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCoordId, setSelectedCoordId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all coordinators from the API
  useEffect(() => {
    if (!isOpen) return;

    const fetchCoordinators = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/coordinators");
        if (res.ok) {
          const data = await res.json();
          // Filter out suspended coordinators
          const activeCoords = data.filter((c: any) => c.status !== "suspended");
          setCoordinators(activeCoords);
        }
      } catch (err) {
        console.error("Gagal memuat daftar koordinator:", err);
        toast.error("Gagal memuat daftar koordinator");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoordinators();
  }, [isOpen]);

  // Set initial selected value
  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => {
        setSelectedCoordId(currentCoordinatorId || ownerUserId || "");
      });
    }
  }, [isOpen, currentCoordinatorId, ownerUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/rentals/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coordinatorUserId: selectedCoordId || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal mengubah koordinator");
      }

      toast.success("Koordinator properti sewa berhasil diperbarui");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build options for CustomSelect
  const selectOptions: SelectOption[] = [];

  // 1. Add Owner option at the very top
  if (ownerUserId) {
    selectOptions.push({
      value: ownerUserId,
      label: `👑 Kelola Sendiri oleh Pemilik (${ownerName || "Tidak Diketahui"})`,
    });
  }

  // 2. Add other coordinators
  coordinators.forEach((c) => {
    // Avoid duplicating the owner option if the owner is also a coordinator
    if (c.id !== ownerUserId) {
      selectOptions.push({
        value: c.id,
        label: `👤 ${c.name} (Kos Dikelola: ${c.propertiesCount})`,
      });
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-card border border-gray-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-gray-heading-main">
              Ganti Koordinator Properti Sewa
            </h2>
          </div>
          {!isSubmitting && (
            <button
              onClick={onClose}
              className="text-gray-placeholder hover:text-gray-heading-main p-1.5 rounded-lg hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-placeholder text-xs">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                Memuat koordinator...
              </div>
            ) : (
              <div className="space-y-4">
                <CustomSelect
                  label="Pilih Koordinator Pengelola"
                  required
                  value={selectedCoordId}
                  onChange={(val) => setSelectedCoordId(val)}
                  options={selectOptions}
                />

                {/* Warning message about automatic suspension */}
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <span className="font-bold block">Peringatan Deaktivasi Otomatis</span>
                    Jika koordinator sebelumnya dicopot dan tidak lagi mengelola kos lain di sistem ini, akun login-nya akan **dinonaktifkan (suspended) secara otomatis** demi keamanan data.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end border-t border-gray-border px-6 py-4 shrink-0 gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-sidebar-hover hover:bg-gray-border/50 border border-gray-border rounded-xl text-xs font-semibold text-gray-heading-main cursor-pointer transition-all disabled:opacity-50"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading || !selectedCoordId}
              className="px-5 py-2.5 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Koordinator"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
