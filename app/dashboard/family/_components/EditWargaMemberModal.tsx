"use client";

import React, { useState, useEffect } from "react";
import { WargaFamilyMember } from "../types";
import { X, Loader2, Edit2 } from "lucide-react";
import { toast } from "sonner";

import { uploadFileToCloudinary } from "@/lib/upload-helper";
import { KtpUploadInput } from "@/components/KtpUploadInput";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { CustomSelect } from "@/components/CustomSelect";
import { commonOccupations, commonEducations, relationshipOptions, religionOptions, genderOptions } from "@/lib/constants";
import { formatDateForInput, calculateAge } from "@/lib/date-format";
import { createWargaSchema } from "@/lib/validations/kependudukan";

interface EditWargaMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: WargaFamilyMember | null;
  isLocked?: boolean;
  isRentalFamily?: boolean;
  onCustomSubmit?: (data: any) => Promise<boolean>;
}

export const EditWargaMemberModal: React.FC<EditWargaMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  member,
  isLocked = false,
  isRentalFamily = false,
  onCustomSubmit,
}) => {
  const [name, setName] = useState(member?.name || "");
  const [nik, setNik] = useState(member?.nik || "");
  const [relationship, setRelationship] = useState<"Kepala_Keluarga" | "Suami" | "Istri" | "Anak" | "Orang_Tua" | "Mertua" | "Sepupu" | "Lainnya">(
    (member?.relationship as any) || "Istri"
  );
  const [gender, setGender] = useState<"L" | "P">(member?.gender || "L");
  const [birthPlace, setBirthPlace] = useState(member?.birthPlace ?? (member as any)?.birth_place ?? "");
  const [birthDate, setBirthDate] = useState(formatDateForInput(member?.birthDate ?? (member as any)?.birth_date));
  const [occupation, setOccupation] = useState(member?.occupation || "");
  const [educationLevel, setEducationLevel] = useState(member?.educationLevel ?? (member as any)?.education_level ?? "");
  const [religion, setReligion] = useState((member?.religion as any) || "Islam");
  const [phone, setPhone] = useState(member?.phone || "");
  const [isKtpSameVillage, setIsKtpSameVillage] = useState<boolean>(member?.isKtpSameVillage ?? (member as any)?.is_ktp_same_village ?? true);
  const [ktpAddress, setKtpAddress] = useState(member?.ktpAddress ?? (member as any)?.ktp_address ?? "");
  const [villageName, setVillageName] = useState<string>("");
  const [ktpFile, setKtpFile] = useState<File | string | null>(member?.ktpFile ?? (member as any)?.ktp_file ?? null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadVillageInfo() {
      try {
        const res = await fetch("/api/public/portal");
        if (res.ok) {
          const data = await res.json();
          if (data?.settings?.villageName) {
            setVillageName(data.settings.villageName);
          }
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadVillageInfo();
  }, []);

  useEffect(() => {
    if (isOpen && member) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(member.name || "");
      setNik(member.nik || "");
      setRelationship((member.relationship as any) || "Istri");
      setGender(member.gender || "L");
      setBirthPlace(member.birthPlace ?? (member as any)?.birth_place ?? "");
      setBirthDate(formatDateForInput(member.birthDate ?? (member as any)?.birth_date));
      setOccupation(member.occupation || "");
      setEducationLevel(member.educationLevel ?? (member as any)?.education_level ?? "");
      setReligion((member.religion as any) || "Islam");
      setPhone(member.phone || "");
      setIsKtpSameVillage(member.isKtpSameVillage ?? (member as any)?.is_ktp_same_village ?? true);
      setKtpAddress(member.ktpAddress ?? (member as any)?.ktp_address ?? "");
      setKtpFile(member.ktpFile ?? (member as any)?.ktp_file ?? null);
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const age = calculateAge(birthDate);
  const isKtpRequired = Boolean(isRentalFamily && age >= 18);
  const isHead = member.relationship === "Kepala_Keluarga";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isKtpRequired && !ktpFile) {
      toast.error("Scan KTP wajib diunggah untuk anggota keluarga penyewa berusia 18 tahun ke atas");
      return;
    }

    if (!isKtpSameVillage && !ktpAddress.trim()) {
      toast.error("Alamat asal KTP luar kelurahan wajib diisi");
      return;
    }

    const payloadToValidate = {
      familyId: member.familyId || 1,
      name: isHead && isLocked ? member.name : name.trim(),
      nik: isHead && isLocked ? member.nik : nik.trim(),
      relationship: isHead ? "Kepala_Keluarga" : relationship,
      gender: isHead && isLocked ? member.gender : gender,
      birthPlace: birthPlace.trim(),
      birthDate,
      occupation: occupation.trim(),
      educationLevel: educationLevel.trim(),
      religion: religion.trim() || "Islam",
      phone: phone.trim() || null,
      isKtpSameVillage,
      ktpAddress: !isKtpSameVillage ? ktpAddress.trim() : null,
      ktpFile: typeof ktpFile === "string" ? ktpFile : null,
    };

    const parsed = createWargaSchema.safeParse(payloadToValidate);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Data anggota keluarga tidak valid";
      toast.error(firstError);
      return;
    }

    setIsLoading(true);

    try {
      let finalKtpUrl: string | null = null;

      if (ktpFile instanceof File) {
        try {
          const uploadRes = await uploadFileToCloudinary(ktpFile, "ktp");
          finalKtpUrl = uploadRes.url;
        } catch {
          setIsLoading(false);
          return;
        }
      } else {

        finalKtpUrl = ktpFile;
      }

      const payload = {
        name: parsed.data.name,
        nik: parsed.data.nik,
        relationship: parsed.data.relationship,
        gender: parsed.data.gender,
        birthPlace: parsed.data.birthPlace,
        birthDate: parsed.data.birthDate ? (parsed.data.birthDate instanceof Date ? parsed.data.birthDate.toISOString().split("T")[0] : String(parsed.data.birthDate)) : birthDate,
        occupation: parsed.data.occupation,
        educationLevel: parsed.data.educationLevel,
        religion: parsed.data.religion,
        phone: parsed.data.phone,
        isKtpSameVillage: parsed.data.isKtpSameVillage,
        ktpAddress: parsed.data.ktpAddress,
        ktpFile: finalKtpUrl,
      };

      if (onCustomSubmit) {
        const ok = await onCustomSubmit(payload);
        if (ok) {
          onSuccess();
          onClose();
        }
        return;
      }

      const res = await fetch(`/api/family-members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Data anggota "${name}" berhasil diperbarui`);
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal memperbarui data anggota");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat memperbarui anggota.");
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
                Perbarui biodata lengkap dan berkas Scan KTP untuk {member.name}.
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
          {isHead && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 p-3 text-xs text-amber-800">
              Peran sebagai <strong>Kepala Keluarga</strong> terhubung dengan akun utama keluarga ini.
            </div>
          )}

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
                disabled={isHead && isLocked}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
                disabled={isHead && isLocked}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm font-mono text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                required
              />
            </div>

            {/* Hubungan */}
            <div className="space-y-1">
              {isHead ? (
                <div>
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Hubungan Keluarga <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value="Kepala Keluarga"
                    disabled
                    className="w-full bg-gray-sidebar-hover/40 border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-secondary-text cursor-not-allowed"
                  />
                </div>
              ) : (
                <CustomSelect
                  label="Hubungan Keluarga"
                  required={true}
                  value={relationship}
                  onChange={(val) => setRelationship(val as any)}
                  options={relationshipOptions.filter((opt) => opt.value !== "Kepala_Keluarga")}
                  placeholder="-- Pilih Hubungan --"
                  disabled={isLocked}
                />
              )}
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
                disabled={isHead && isLocked}
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

            {/* Status Domisili KTP (Ramah Orang Tua) */}
            <div className="sm:col-span-2 rounded-2xl border border-gray-border bg-gray-sidebar-hover/40 p-4 space-y-3">
              <label className="block text-sm font-semibold text-black/80 tracking-wider">
                Status Alamat KTP <span className="text-red-500 ml-0.5">*</span>
              </label>
              <p className="text-xs text-gray-secondary-text">
                Apakah alamat pada KTP warga ini berada di {villageName ? `Kelurahan ${villageName}` : "Kelurahan setempat"}?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isKtpSameVillage ? "border-primary bg-primary/5 text-primary-900 font-semibold" : "border-gray-border bg-gray-card text-gray-heading-main hover:bg-gray-sidebar-hover"}`}>
                  <input
                    type="radio"
                    name="editIsKtpSameVillage"
                    checked={isKtpSameVillage === true}
                    onChange={() => {
                      setIsKtpSameVillage(true);
                      setKtpAddress("");
                    }}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-xs">
                    YA, KTP {villageName ? `Kel. ${villageName}` : "Kelurahan Setempat"}
                  </span>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${!isKtpSameVillage ? "border-primary bg-primary/5 text-primary-900 font-semibold" : "border-gray-border bg-gray-card text-gray-heading-main hover:bg-gray-sidebar-hover"}`}>
                  <input
                    type="radio"
                    name="editIsKtpSameVillage"
                    checked={isKtpSameVillage === false}
                    onChange={() => setIsKtpSameVillage(false)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-xs">
                    TIDAK, KTP Luar Kelurahan
                  </span>
                </label>
              </div>

              {!isKtpSameVillage && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-gray-heading-main mb-1.5">
                    Alamat / Kota Asal Sesuai KTP <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={ktpAddress}
                    onChange={(e) => setKtpAddress(e.target.value)}
                    placeholder="Contoh: Jl. Dago No. 10, Kel. Dago, Kota Bandung"
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    required={!isKtpSameVillage}
                  />
                </div>
              )}
            </div>

            {/* Scan KTP File Upload */}
            <div className="sm:col-span-2 border-t border-gray-border pt-3">
              <KtpUploadInput
                value={ktpFile}
                onChange={setKtpFile}
                label={isKtpRequired ? "Unggah Scan KTP (Wajib untuk usia 18+ thn)" : "Unggah Scan KTP"}
                required={isKtpRequired}
                existingUrl={typeof ktpFile === "string" ? ktpFile : undefined}
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
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
