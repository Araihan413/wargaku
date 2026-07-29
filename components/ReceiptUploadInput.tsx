"use client";

import React, { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { FileUploadModal } from "@/components/FileUploadModal";

interface ReceiptUploadInputProps {
  value: File | string | null | undefined;
  onChange: (value: File | string | null) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export const ReceiptUploadInput: React.FC<ReceiptUploadInputProps> = ({
  value,
  onChange,
  label = "Foto Kwitansi / Bukti Nota",
  required = false,
  disabled = false,
  error,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleSelectLocal = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran berkas bukti melebihi batas maksimum 5MB.");
      return;
    }
    onChange(file);
    toast.success("Berkas bukti berhasil dipilih!");
  };

  const getDisplayName = () => {
    if (value) {
      if (typeof value === "string") {
        return "Bukti Nota Terunggah (Klik untuk mengganti)";
      }
      return value.name;
    }
    return disabled ? "Berkas Bukti Terkunci" : "Pilih Foto Kwitansi / Bukti Nota";
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {value ? (
        <div className="flex items-center justify-between p-3.5 border border-emerald-200 bg-emerald-50/60 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-emerald-900 truncate">
                {getDisplayName()}
              </p>
              <p className="text-[10px] text-emerald-700 font-medium">
                Siap disimpan (Upload Atomik)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              disabled={disabled}
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              Ganti
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled}
              className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 transition cursor-pointer"
              title="Hapus Bukti"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && setShowModal(true)}
          className={`relative border border-dashed rounded-xl p-4 text-center transition-all ${
            disabled
              ? "border-gray-border/40 opacity-60 bg-gray-border/10 cursor-not-allowed"
              : "border-gray-border hover:border-primary hover:bg-gray-sidebar-hover/20 cursor-pointer bg-gray-card"
          }`}
        >
          <div className="space-y-1 text-xs text-gray-secondary-text">
            <Upload className="h-5 w-5 text-gray-placeholder mx-auto" />
            <p className="font-bold text-gray-heading-main truncate max-w-full px-2">
              {getDisplayName()}
            </p>
            <p className="text-[10px] text-gray-placeholder">
              Maksimal 5MB (JPG/PNG/PDF atau Google Drive)
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-error font-semibold mt-0.5">{error}</p>}

      {!disabled && (
        <FileUploadModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`Unggah ${label}`}
          description={`Pilih foto kwitansi/nota dari perangkat lokal atau masukkan tautan Google Drive.`}
          onSelectLocalFile={handleSelectLocal}
          isLoading={false}
        />
      )}
    </div>
  );
};
