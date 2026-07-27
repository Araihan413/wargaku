"use client";

import React, { useState } from "react";
import { X, Loader2, UserPlus, Upload } from "lucide-react";
import { toast } from "sonner";

import { uploadFileToCloudinary } from "@/lib/upload-helper";
import { FileUploadModal } from "@/components/FileUploadModal";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { commonOccupations, commonEducations } from "@/lib/constants";

const relationshipOptions: SelectOption[] = [
  { value: "Istri", label: "Istri" },
  { value: "Suami", label: "Suami" },
  { value: "Anak", label: "Anak" },
  { value: "Orang_Tua", label: "Orang Tua" },
  { value: "Lainnya", label: "Lainnya" },
];

const genderOptions: SelectOption[] = [
  { value: "P", label: "Perempuan" },
  { value: "L", label: "Laki-laki" },
];

const religionOptions: SelectOption[] = [
  { value: "Islam", label: "Islam" },
  { value: "Kristen", label: "Kristen" },
  { value: "Katolik", label: "Katolik" },
  { value: "Hindu", label: "Hindu" },
  { value: "Buddha", label: "Buddha" },
  { value: "Khonghucu", label: "Khonghucu" },
  { value: "Lainnya", label: "Lainnya" },
];

interface AddWargaMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  familyId: number;
}

export const AddWargaMemberModal: React.FC<AddWargaMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  familyId,
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
  const [showKtpModal, setShowKtpModal] = useState(false);

  const handleSelectLocalKtp = (file: File) => {
    setKtpFile(file);
    toast.success("Berkas KTP lokal berhasil dipilih!");
  };

  const handleSelectDriveKtp = (url: string) => {
    setKtpFile(url);
    toast.success("Tautan Google Drive KTP berhasil dipilih!");
  };

  if (!isOpen) return null;

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

    setIsLoading(true);

    try {
      let finalKtpUrl: string | null = null;

      if (ktpFile instanceof File) {
        try {
          const uploadRes = await uploadFileToCloudinary(ktpFile, "ktp");
          finalKtpUrl = uploadRes.url;
        } catch (err) {
          toast.error("Gagal mengunggah berkas KTP.");
          setIsLoading(false);
          return;
        }
      } else if (typeof ktpFile === "string") {
        finalKtpUrl = ktpFile;
      }

      const res = await fetch("/api/warga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          name,
          nik,
          relationship,
          gender,
          birthPlace: birthPlace || null,
          birthDate: birthDate || null,
          occupation: occupation || null,
          educationLevel: educationLevel || null,
          religion: religion || null,
          phone: phone || null,
          ktpFile: finalKtpUrl,
        }),
      });

      if (res.ok) {
        toast.success(`Anggota keluarga "${name}" berhasil ditambahkan`);
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menambahkan anggota keluarga");
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
                Masukkan biodata anggota keluarga baru sesuai dokumen resmi.
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
                options={relationshipOptions}
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

            {/* No HP */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">No. HP / WA</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234..."
                c bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Tempat Lahir */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">Tempat Lahir</label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="Contoh: Bandung"
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Tanggal Lahir */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">Tanggal Lahir</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Pekerjaan */}
            <div className="space-y-1">
              <AutocompleteInput
                label="Pekerjaan"
                value={occupation}
                onChange={setOccupation}
                suggestions={commonOccupations}
                placeholder="Contoh: Karyawan Swasta"
              />
            </div>

            {/* Pendidikan */}
            <div className="space-y-1">
              <AutocompleteInput
                label="Pendidikan"
                value={educationLevel}
                onChange={setEducationLevel}
                suggestions={commonEducations}
                placeholder="Contoh: S1 / SMA"
              />
            </div>

            {/* Agama */}
            <div className="space-y-1 sm:col-span-2">
              <CustomSelect
                label="Agama"
                value={religion}
                onChange={(val) => setReligion(val)}
                options={religionOptions}
                placeholder="-- Pilih Agama --"
              />
            </div>

            {/* Scan KTP File Upload */}
            <div className="space-y-2.5 sm:col-span-2 border-t border-gray-border pt-3">
              <label className="text-xs font-bold text-gray-heading-main flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-primary" />
                <span>Berkas Scan KTP Anggota</span>
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowKtpModal(true)}
                  className="rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-2 text-xs font-bold text-primary flex items-center justify-center gap-2 cursor-pointer transition-colors max-w-full truncate"
                >
                  <Upload className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {ktpFile
                      ? (ktpFile instanceof File ? ktpFile.name : "Google Drive Terpilih")
                      : "Pilih Berkas KTP"}
                  </span>
                </button>

                {ktpFile ? (
                  <span className="text-[11px] font-medium text-emerald-600 truncate flex items-center gap-1">
                    ✓ Berkas KTP Terpasang (Unggah Saat Simpan)
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-secondary-text">
                    Belum ada berkas KTP dipilih
                  </span>
                )}
              </div>

              <p className="text-[11px] text-gray-secondary-text">
                Format: JPG, PNG, WebP, atau PDF (Maksimal 5MB).
              </p>
            </div>
          </div>

          <FileUploadModal
            isOpen={showKtpModal}
            onClose={() => setShowKtpModal(false)}
            title="Unggah Scan KTP Anggota"
            description="Pilih metode pengunggahan berkas KTP dari perangkat lokal Anda atau gunakan tautan Google Drive."
            onSelectLocalFile={handleSelectLocalKtp}
            onSelectDriveUrl={handleSelectDriveKtp}
            isLoading={false}
          />

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
