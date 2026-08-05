"use client";

import React, { useState } from "react";
import { WargaFamilyMember } from "../types";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeleteWargaMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: WargaFamilyMember | null;
}

export const DeleteWargaMemberModal: React.FC<DeleteWargaMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  member,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !member) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/family-members/${member.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Anggota keluarga "${member.name}" berhasil dihapus dari KK`);
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menghapus anggota keluarga");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan koneksi sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-gray-border bg-gray-card shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-gray-secondary-text hover:bg-gray-sidebar-hover cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-heading-main">
            Hapus Anggota Keluarga?
          </h3>
          <p className="text-xs text-gray-secondary-text mt-1 leading-relaxed">
            Apakah Anda yakin ingin menghapus <span className="font-bold text-gray-heading-main">{member.name}</span> (NIK: {member.nik}) dari daftar Kartu Keluarga? Tindakan ini akan menghapus biodata anggota keluarga tersebut.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-border px-4 py-2 text-xs font-semibold text-gray-secondary-text hover:bg-gray-sidebar-hover cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="rounded-xl bg-error hover:bg-red-700 px-4 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Ya, Hapus Anggota
          </button>
        </div>
      </div>
    </div>
  );
};
