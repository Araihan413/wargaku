"use client";

import React, { useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { executeWithFileUpload } from "@/lib/upload-helper";
import { KtpUploadInput } from "@/components/KtpUploadInput";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { CustomSelect } from "@/components/CustomSelect";
import { commonOccupations, commonEducations, relationshipOptions, religionOptions, genderOptions } from "@/lib/constants";
import { calculateAge } from "@/lib/date-format";

interface AddWargaMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  familyId: number;
  isRentalFamily?: boolean;
  onCustomSubmit?: (data: any) => Promise<boolean>;
}

export const AddWargaMemberModal: React.FC<AddWargaMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  familyId,
  isRentalFamily = false,
  onCustomSubmit,
}) => {
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [relationship, setRelationship] = useState<"Suami" | "Istri" | "Anak" | "Orang_Tua" | "Lainnya">("Istri");
  const [gender, setGender] = useState<"L" | "P">("P");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [occupation, setOccupation] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [religion, setReligion] = useState("Islam");
  const [phone, setPhone] = useState("");
  const [ktpFile, setKtpFile] = useState<File | string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const age = calculateAge(birthDate);
  const isKtpRequired = Boolean(isRentalFamily && age >= 18);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nik.trim()) {
      toast.error("Nama dan NIK wajib diisi");
      return;
    }

    if (nik.length !== 16) {
      toast.error("NIK harus terdiri dari 16 digit angka");
      return;
    }

    if (!birthPlace.trim()) {
      toast.error("Tempat Lahir wajib diisi");
      return;
    }

    if (!birthDate) {
      toast.error("Tanggal Lahir wajib diisi");
      return;
    }

    if (!educationLevel.trim()) {
      toast.error("Pendidikan Terakhir wajib diisi / dipilih");
      return;
    }

    if (!occupation.trim()) {
      toast.error("Pekerjaan wajib diisi / dipilih");
      return;
    }

    if (isKtpRequired && !ktpFile) {
      toast.error("Scan KTP wajib diunggah untuk anggota keluarga penyewa berusia 18 tahun ke atas");
      return;
    }

    setIsLoading(true);

    try {
      const result = await executeWithFileUpload({
        file: ktpFile,
        folder: "ktp",
        submitFn: async (finalKtpUrl) => {
          const payload = {
            familyId,
            name,
            nik,
            relationship,
            gender,
            birthPlace: birthPlace.trim(),
            birthDate,
            occupation: occupation.trim(),
            educationLevel: educationLevel.trim(),
            religion,
            phone: phone.trim() || null,
            ktpFile: finalKtpUrl,
          };

          if (onCustomSubmit) {
            const ok = await onCustomSubmit(payload);
            return {
              ok,
              json: async () => ({ message: "Success" }),
            } as any;
          }

          return fetch("/api/family-members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        },
        successMessage: `Anggota keluarga "${name}" berhasil ditambahkan`,
      });

      if (result.success) {
        onSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border border-gray-border bg-gray-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary-900">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-heading-main">
                Tambah Anggota Keluarga
              </h3>
              <p className="text-xs text-gray-secondary-text">
                Masukkan biodata lengkap anggota keluarga baru sesuai dokumen resmi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-secondary-text hover:bg-gray-sidebar-hover cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Nama Lengkap <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Siti Rahmawati"
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>

            {/* NIK */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                NIK (16 Digit) <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                placeholder="327301..."
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm font-mono text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>

            {/* Hubungan */}
            <div className="space-y-1">
              <CustomSelect
                label="Hubungan Keluarga"
                required={true}
                value={relationship}
                onChange={(val) => setRelationship(val as any)}
                options={relationshipOptions.filter((opt) => opt.value !== "Kepala_Keluarga")}
                placeholder="-- Pilih Hubungan --"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <CustomSelect
                label="Jenis Kelamin"
                required={true}
                value={gender}
                onChange={(val) => setGender(val as any)}
                options={genderOptions}
                placeholder="-- Pilih Jenis Kelamin --"
              />
            </div>

            {/* Tempat Lahir */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Tempat Lahir <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="Contoh: Bandung"
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>

            {/* Tanggal Lahir */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Tanggal Lahir <span className="text-red-500 ml-0.5">*</span>
                {birthDate && (
                  <span className="text-xs text-gray-secondary-text font-normal ml-1.5">
                    (Usia: {age} thn)
                  </span>
                )}
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>

            {/* Pekerjaan */}
            <div className="space-y-1">
              <AutocompleteInput
                label="Pekerjaan"
                required={true}
                value={occupation}
                onChange={setOccupation}
                suggestions={commonOccupations}
                placeholder="Contoh: Karyawan Swasta"
              />
            </div>

            {/* Pendidikan */}
            <div className="space-y-1">
              <AutocompleteInput
                label="Pendidikan Terakhir"
                required={true}
                value={educationLevel}
                onChange={setEducationLevel}
                suggestions={commonEducations}
                placeholder="Contoh: S1 / SMA"
              />
            </div>

            {/* Agama */}
            <div className="space-y-1">
              <CustomSelect
                label="Agama"
                required={true}
                value={religion}
                onChange={(val) => setReligion(val)}
                options={religionOptions}
                placeholder="-- Pilih Agama --"
              />
            </div>

            {/* No HP */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                No. HP / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Scan KTP File Upload */}
            <div className="sm:col-span-2 border-t border-gray-border pt-3">
              <KtpUploadInput
                value={ktpFile}
                onChange={setKtpFile}
                label={isKtpRequired ? "Unggah Scan KTP (Wajib untuk usia 18+ thn)" : "Unggah Scan KTP"}
                required={isKtpRequired}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-border pt-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-border px-4 py-2 text-xs font-semibold text-gray-secondary-text hover:bg-gray-sidebar-hover cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary-900 cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Tambah Anggota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
