"use client";

import React, { useState } from "react";
import { WargaFamilyMember } from "../types";
import { X, Loader2, Edit2, Upload, Lock } from "lucide-react";
import { toast } from "sonner";

import { uploadFileToCloudinary } from "@/lib/upload-helper";
import { FileUploadModal } from "@/components/FileUploadModal";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";

const commonOccupations = [
  "Belum/Tidak Bekerja",
  "Mengurus Rumah Tangga",
  "Pelajar/Mahasiswa",
  "Pensiunan",
  "Pegawai Negeri Sipil (PNS)",
  "Tentara Nasional Indonesia (TNI)",
  "Kepolisian RI (POLRI)",
  "Karyawan Swasta",
  "Karyawan BUMN",
  "Karyawan BUMD",
  "Buruh Harian Lepas",
  "Petani/Pekebun",
  "Nelayan",
  "Pedagang",
  "Wiraswasta",
];

const commonEducations = [
  "Tidak/Belum Sekolah",
  "SD / Sederajat",
  "SMP / Sederajat",
  "SMA / SMK / Sederajat",
  "Diploma I / II",
  "Akademi / Diploma III (D3)",
  "Diploma IV / Sarjana (S1)",
  "Magister (S2)",
  "Doktor (S3)",
];

const relationshipOptions: SelectOption[] = [
  { value: "Kepala_Keluarga", label: "Kepala Keluarga" },
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

interface EditWargaMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: WargaFamilyMember | null;
}

export const EditWargaMemberModal: React.FC<EditWargaMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  member,
}) => {
  const [prevMember, setPrevMember] = useState<WargaFamilyMember | null>(null);

  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [relationship, setRelationship] = useState<any>("Istri");
  const [gender, setGender] = useState<"L" | "P">("L");
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

  // Synchronize form state with props during render without useEffect to prevent cascading renders
  if (member !== prevMember) {
    setPrevMember(member);
    if (member) {
      setName(member.name || "");
      setNik(member.nik || "");
      setRelationship(member.relationship || "Istri");
      setGender(member.gender || "L");
      setBirthPlace(member.birthPlace || "");
      setBirthDate(member.birthDate ? member.birthDate.split("T")[0] : "");
      setOccupation(member.occupation || "");
      setEducationLevel(member.educationLevel || "");
      setReligion(member.religion || "Islam");
      setPhone(member.phone || "");
      setKtpFile(member.ktpFile || null);
    }
  }

  if (!isOpen || !member) return null;

  const isHead = member.relationship === "Kepala_Keluarga";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else {
        finalKtpUrl = ktpFile;
      }

      const res = await fetch(`/api/warga/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        toast.success(`Biodata "${name}" berhasil diperbarui`);
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mengedit data anggota keluarga");
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
              <Edit2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-heading-main">
                Edit Data Anggota Keluarga
              </h3>
              <p className="text-xs text-gray-secondary-text">
                Perbarui biodata dan berkas Scan KTP untuk {member.name}.
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
              <label className="text-xs font-bold text-gray-heading-main flex items-center justify-between">
                <span>Nama Lengkap <span className="text-error">*</span></span>
                {isHead && <span className="text-[10px] text-gray-placeholder flex items-center gap-1"><Lock className="h-3 w-3" /> Akun Utama</span>}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isHead}
                className={`w-full rounded-xl border border-gray-border px-3.5 py-2 text-xs text-gray-heading-main focus:outline-none ${
                  isHead ? "bg-gray-sidebar-hover opacity-70 cursor-not-allowed" : "bg-gray-page-bg focus:border-primary"
                }`}
                required
              />
            </div>

            {/* NIK */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-heading-main flex items-center justify-between">
                <span>NIK (16 Digit) <span className="text-error">*</span></span>
                {isHead && <span className="text-[10px] text-gray-placeholder flex items-center gap-1"><Lock className="h-3 w-3" /> Akun Utama</span>}
              </label>
              <input
                type="text"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                disabled={isHead}
                className={`w-full rounded-xl border border-gray-border px-3.5 py-2 text-xs font-mono text-gray-heading-main focus:outline-none ${
                  isHead ? "bg-gray-sidebar-hover opacity-70 cursor-not-allowed" : "bg-gray-page-bg focus:border-primary"
                }`}
                required
              />
            </div>

            {/* Hubungan */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-heading-main">Hubungan Keluarga</label>
              <CustomSelect
                value={relationship}
                onChange={(val) => setRelationship(val as any)}
                options={relationshipOptions}
                placeholder="-- Pilih Hubungan --"
                disabled={isHead}
                size="sm"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-heading-main">Jenis Kelamin</label>
              <CustomSelect
                value={gender}
                onChange={(val) => setGender(val as any)}
                options={genderOptions}
                placeholder="-- Pilih Jenis Kelamin --"
                size="sm"
              />
            </div>

            {/* No HP */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-heading-main">No. HP / WA</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234..."
                className="w-full rounded-xl border border-gray-border bg-gray-page-bg px-3.5 py-2 text-xs text-gray-heading-main focus:border-primary focus:outline-none"
              />
            </div>

            {/* Tempat Lahir */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-heading-main">Tempat Lahir</label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="Contoh: Bandung"
                className="w-full rounded-xl border border-gray-border bg-gray-page-bg px-3.5 py-2 text-xs text-gray-heading-main focus:border-primary focus:outline-none"
              />
            </div>

            {/* Tanggal Lahir */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-heading-main">Tanggal Lahir</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-xl border border-gray-border bg-gray-page-bg px-3.5 py-2 text-xs text-gray-heading-main focus:border-primary focus:outline-none"
              />
            </div>

            {/* Pekerjaan */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-heading-main">Pekerjaan</label>
              <AutocompleteInput
                value={occupation}
                onChange={setOccupation}
                suggestions={commonOccupations}
                placeholder="Contoh: Wiraswasta"
              />
            </div>

            {/* Pendidikan */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-heading-main">Pendidikan</label>
              <AutocompleteInput
                value={educationLevel}
                onChange={setEducationLevel}
                suggestions={commonEducations}
                placeholder="Contoh: S1 / SMA"
              />
            </div>

            {/* Agama */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-bold text-gray-heading-main">Agama</label>
              <CustomSelect
                value={religion}
                onChange={(val) => setReligion(val)}
                options={religionOptions}
                placeholder="-- Pilih Agama --"
                size="sm"
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
                      ? (ktpFile instanceof File ? ktpFile.name : "KTP Terunggah (Pilih Ulang)")
                      : "Pilih Berkas KTP"}
                  </span>
                </button>

                {ktpFile ? (
                  <span className="text-[11px] font-medium text-emerald-600 truncate flex items-center gap-1">
                    ✓ Berkas KTP Terpasang {ktpFile instanceof File && "(Unggah Saat Simpan)"}
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
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
