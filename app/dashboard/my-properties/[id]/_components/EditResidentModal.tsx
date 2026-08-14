"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { uploadFileToCloudinary } from "@/lib/upload-helper";
import { KtpUploadInput } from "@/components/KtpUploadInput";
import { RentalResidentItem } from "../types";
import { formatDateForInput } from "@/lib/date-format";

interface EditResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resident: RentalResidentItem | null;
}

export const EditResidentModal: React.FC<EditResidentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  resident,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [phone, setPhone] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [ktpFile, setKtpFile] = useState<File | string | null>(null);

  useEffect(() => {
    if (isOpen && resident) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(resident.name || "");
      setNik(resident.nik || "");
      setPhone(resident.phone || "");
      setCheckInDate(formatDateForInput(resident.checkInDate));
      setKtpFile(resident.ktpFile || null);
    }
  }, [isOpen, resident]);

  if (!isOpen || !resident) return null;

  const isVerified = resident.verificationStatus === "verified";
  const existingKtpUrl = resident.ktpFile || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nik.length !== 16) {
      toast.error("NIK harus terdiri dari 16 digit angka");
      return;
    }

    setIsSubmitting(true);
    let ktpUrl = existingKtpUrl;

    try {
      if (ktpFile instanceof File) {
        const uploadRes = await uploadFileToCloudinary(ktpFile, "ktp");
        ktpUrl = uploadRes.url;
      } else if (typeof ktpFile === "string") {
        ktpUrl = ktpFile;
      }

      const res = await fetch(`/api/rental-residents/${resident.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nik,
          phone,
          checkInDate: new Date(checkInDate),
          ktpFile: ktpUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Perubahan data penyewa berhasil disimpan.");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Gagal memperbarui data penyewa");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-gray-card border border-gray-border rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-gray-sidebar-hover text-gray-secondary-text hover:text-gray-heading-main transition-all cursor-pointer z-20"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 shrink-0 pr-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-primary/10 text-primary rounded-xl">
              <Edit3 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-heading-main">
              {isVerified ? "Ubah Data Penyewa" : "Perbaiki Data Penyewa"}
            </h2>
          </div>
          <p className="text-xs text-gray-secondary-text">
            {isVerified 
              ? "Ubah data kontak dan operasional penyewa yang terverifikasi." 
              : "Perbaiki data penyewa agar dapat diajukan kembali ke RT."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Container for Fields */}
          <div className="flex-1 overflow-y-auto pr-1.5 pb-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-placeholder">
            {/* Verified Banner */}
            {isVerified && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-5 space-y-1">
                <span className="text-xs font-bold text-emerald-700 block">Data Telah Terverifikasi RT:</span>
                <p className="text-xs text-emerald-600 leading-relaxed">
                  Data identitas utama (Nama, NIK, Tanggal Check-In, KTP) telah diverifikasi dan dikunci. Anda hanya dapat mengubah data kontak & informasi operasional lainnya.
                </p>
              </div>
            )}

            {/* Rejection Note Alert Banner */}
            {resident.verificationStatus === "rejected" && resident.verificationNote && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-5 space-y-1">
                <span className="text-xs font-bold text-rose-700 block">Alasan Penolakan RT:</span>
                <p className="text-xs text-rose-600 leading-relaxed italic">
                  &ldquo;{resident.verificationNote}&rdquo;
                </p>
              </div>
            )}

            {/* Name & NIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Nama Lengkap Penyewa <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Sesuai KTP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  disabled={isVerified}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  NIK (16 Digit) <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="16 Digit NIK"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  disabled={isVerified}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Nomor WhatsApp <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>

            {/* Check-In Date */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Tanggal Masuk / Check-In <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                required
                disabled={isVerified}
              />
            </div>

            {/* KTP Document Component */}
            <div className="space-y-1.5">
              <KtpUploadInput
                value={ktpFile}
                onChange={setKtpFile}
                label="Unggah Scan KTP"
                disabled={isVerified}
                existingUrl={existingKtpUrl}
              />
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-border shrink-0 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-border hover:bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-900 disabled:bg-primary/50 text-xs font-bold text-white cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
