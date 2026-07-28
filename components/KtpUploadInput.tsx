"use client";

import React, { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { FileUploadModal } from "@/components/FileUploadModal";

interface KtpUploadInputProps {
  value: File | string | null | undefined;
  onChange: (value: File | string | null) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  existingUrl?: string;
  error?: string;
}

export const KtpUploadInput: React.FC<KtpUploadInputProps> = ({
  value,
  onChange,
  label = "Berkas Scan KTP",
  required = false,
  disabled = false,
  existingUrl = "",
  error,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleSelectLocal = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran berkas KTP melebihi batas maksimum 2MB.");
      return;
    }
    onChange(file);
    toast.success("Berkas KTP berhasil diimpor!");
  };

  // Get displayed file name/status
  const getDisplayName = () => {
    if (value) {
      if (typeof value === "string") {
        return "Scan KTP Terunggah (Pilih Ulang)";
      }
      return value.name;
    }
    return disabled ? "Berkas KTP Terkunci" : "Pilih Berkas Scan KTP";
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div
        onClick={() => !disabled && setShowModal(true)}
        className={`relative border border-dashed rounded-xl p-4 text-center transition-all ${
          disabled
            ? "border-gray-border/40 opacity-60 bg-gray-border/10 cursor-not-allowed"
            : "border-gray-border hover:border-primary hover:bg-gray-sidebar-hover/20 cursor-pointer"
        }`}
      >
        <div className="space-y-1 text-xs text-gray-secondary-text">
          {value ? (
            <FileText className="h-6 w-6 text-emerald-600 mx-auto" />
          ) : (
            <Upload className="h-6 w-6 text-gray-placeholder mx-auto" />
          )}
          <p className="font-bold text-gray-heading-main truncate max-w-full px-2">
            {getDisplayName()}
          </p>
          <p className="text-[10px] text-gray-placeholder">Maksimal ukuran 2MB (JPG/PNG/PDF)</p>
        </div>
      </div>

      {existingUrl && !value && (
        <p className="text-[10px] text-primary font-semibold">
          * Sudah ada scan KTP tersimpan.
        </p>
      )}

      {error && (
        <p className="text-xs text-error font-semibold mt-0.5">{error}</p>
      )}

      {!disabled && (
        <FileUploadModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`Unggah ${label}`}
          description={`Pilih metode pengunggahan berkas ${label} dari perangkat lokal atau gunakan tautan Google Drive.`}
          onSelectLocalFile={handleSelectLocal}
          isLoading={false}
        />
      )}
    </div>
  );
};
