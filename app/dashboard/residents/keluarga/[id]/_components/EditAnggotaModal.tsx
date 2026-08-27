import React, { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, User, CreditCard, Calendar, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateWargaSchema } from "@/lib/validations/kependudukan";
import { FormField } from "@/components/FormField";
import { CustomSelect } from "@/components/CustomSelect";
import { FamilyMemberItem } from "../../../types";
import { uploadFileToCloudinary } from "@/lib/upload-helper";
import { KtpUploadInput } from "@/components/KtpUploadInput";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { commonOccupations, commonEducations, genderOptions, relationshipOptions, religionOptions } from "@/lib/constants";
import { formatDateForInput, calculateAge } from "@/lib/date-format";

interface EditAnggotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: FamilyMemberItem | null;
  familyVerificationStatus?: string;
  isRentalFamily?: boolean;
}

export const EditAnggotaModal: React.FC<EditAnggotaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  member,
  familyVerificationStatus: _familyVerificationStatus,
  isRentalFamily = false,
}) => {
  const [ktpFile, setKtpFile] = useState<File | string | null>(null);
  const [isUploadingKtp, setIsUploadingKtp] = useState(false);
  const [isKtpSameVillage, setIsKtpSameVillage] = useState<boolean>(true);
  const [ktpAddress, setKtpAddress] = useState("");
  const [villageName, setVillageName] = useState<string>("");

  React.useEffect(() => {
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
        // Fallback
      }
    }
    loadVillageInfo();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(updateWargaSchema),
    defaultValues: {
      name: "",
      nik: "",
      birthPlace: "",
      birthDate: "",
      gender: "L" as any,
      relationship: "Anak" as any,
      occupation: "",
      educationLevel: "",
      religion: "Islam" as any,
      phone: "",
      ktpFile: "",
    },
  });

  useEffect(() => {
    if (isOpen && member) {
      reset({
        name: member.name || "",
        nik: member.nik || "",
        birthPlace: member.birthPlace || "",
        birthDate: formatDateForInput(member.birthDate),
        gender: member.gender || "L",
        relationship: member.relationship || "Anak",
        occupation: member.occupation || "",
        educationLevel: member.educationLevel || "",
        religion: (member.religion as any) || "Islam",
        phone: member.phone || "",
        ktpFile: member.ktpFile || "",
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKtpFile(member.ktpFile || null);
      setIsKtpSameVillage((member as any).isKtpSameVillage ?? (member as any).is_ktp_same_village ?? true);
      setKtpAddress((member as any).ktpAddress ?? (member as any).ktp_address ?? "");
    }
  }, [isOpen, member, reset]);

  const birthDateValue = useWatch({ control, name: "birthDate" }) as string | undefined;
  const age = calculateAge(birthDateValue);
  const isKtpRequired = Boolean(isRentalFamily && age >= 18);

  const handleClose = () => {
    onClose();
  };

  const onSubmit = async (data: any) => {
    if (!member) return;

    if (isKtpRequired && !ktpFile) {
      toast.error("Scan KTP wajib diunggah untuk anggota keluarga penyewa berusia 18 tahun ke atas");
      return;
    }

    setIsUploadingKtp(true);
    try {
      let finalKtpUrl = member.ktpFile || null;
      if (ktpFile instanceof File) {
        try {
          const uploadRes = await uploadFileToCloudinary(ktpFile, "ktp");
          finalKtpUrl = uploadRes.url;
        } catch {
          setIsUploadingKtp(false);
          return;
        }
      } else if (typeof ktpFile === "string" || ktpFile === null) {

        finalKtpUrl = ktpFile;
      }

      const payload = {
        ...data,
        birthPlace: data.birthPlace ? data.birthPlace.trim() : "",
        birthDate: data.birthDate || null,
        occupation: data.occupation ? data.occupation.trim() : "",
        educationLevel: data.educationLevel ? data.educationLevel.trim() : "",
        religion: data.religion || "Islam",
        phone: data.phone ? data.phone.trim() : null,
        isKtpSameVillage,
        ktpAddress: !isKtpSameVillage ? ktpAddress.trim() : null,
        ktpFile: finalKtpUrl,
      };

      const res = await fetch(`/api/family-members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Data anggota keluarga berhasil diperbarui");
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal memperbarui data anggota keluarga");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsUploadingKtp(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-heading-main">
            Edit Data Anggota Keluarga
          </h3>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1.5 pb-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* Name */}
            <FormField
              id="name"
              label="Nama Lengkap"
              type="text"
              required={true}
              placeholder="Sesuai KTP / Akta Kelahiran"
              registerProps={register("name")}
              icon={User}
              error={errors.name?.message}
            />

            {/* NIK */}
            <FormField
              id="nik"
              label="Nomor Induk Kependudukan (NIK)"
              type="text"
              required={true}
              placeholder="16 digit nomor NIK"
              maxLength={16}
              registerProps={register("nik")}
              icon={CreditCard}
              error={errors.nik?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Gender */}
              <div className="space-y-1">
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Jenis Kelamin"
                      required={true}
                      value={field.value || ""}
                      onChange={(val) => field.onChange(val)}
                      options={genderOptions}
                      placeholder="Pilih..."
                    />
                  )}
                />
                {errors.gender && (
                  <p className="text-xs font-semibold text-error mt-0.5">
                    {errors.gender.message}
                  </p>
                )}
              </div>

              {/* Relationship */}
              <div className="space-y-1">
                <Controller
                  name="relationship"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Hubungan Keluarga"
                      required={true}
                      value={field.value || ""}
                      onChange={(val) => field.onChange(val)}
                      options={relationshipOptions}
                      placeholder="Pilih..."
                    />
                  )}
                />
                {errors.relationship && (
                  <p className="text-xs font-semibold text-error mt-0.5">
                    {errors.relationship.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Birth Place */}
              <FormField
                id="birthPlace"
                label="Tempat Lahir"
                type="text"
                required={true}
                placeholder="Contoh: Jakarta"
                registerProps={register("birthPlace")}
                icon={User}
                error={errors.birthPlace?.message}
              />

              {/* Birth Date */}
              <FormField
                id="birthDate"
                label="Tanggal Lahir"
                type="date"
                required={true}
                placeholder=""
                note={birthDateValue ? `Usia: ${age} thn` : undefined}
                registerProps={register("birthDate")}
                icon={Calendar}
                error={errors.birthDate?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Religion */}
              <div className="space-y-1">
                <Controller
                  name="religion"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Agama"
                      required={true}
                      value={field.value || "Islam"}
                      onChange={(val) => field.onChange(val)}
                      options={religionOptions}
                      placeholder="Pilih..."
                    />
                  )}
                />
                {errors.religion && (
                  <p className="text-xs font-semibold text-error mt-0.5">
                    {errors.religion.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <FormField
                id="phone"
                label="No. HP / WhatsApp"
                type="text"
                placeholder="Contoh: 08123456789"
                registerProps={register("phone")}
                icon={Phone}
                error={errors.phone?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Occupation */}
              <div className="space-y-1">
                <Controller
                  name="occupation"
                  control={control}
                  render={({ field }) => (
                    <AutocompleteInput
                      label="Pekerjaan"
                      required={true}
                      value={field.value || ""}
                      onChange={field.onChange}
                      suggestions={commonOccupations}
                      placeholder="Contoh: Karyawan Swasta"
                    />
                  )}
                />
                {errors.occupation && (
                  <p className="text-xs font-semibold text-error mt-0.5">
                    {errors.occupation.message}
                  </p>
                )}
              </div>

              {/* Education Level */}
              <div className="space-y-1">
                <Controller
                  name="educationLevel"
                  control={control}
                  render={({ field }) => (
                    <AutocompleteInput
                      label="Pendidikan Terakhir"
                      required={true}
                      value={field.value || ""}
                      onChange={field.onChange}
                      suggestions={commonEducations}
                      placeholder="Contoh: S1 / SMA"
                    />
                  )}
                />
                {errors.educationLevel && (
                  <p className="text-xs font-semibold text-error mt-0.5">
                    {errors.educationLevel.message}
                  </p>
                )}
              </div>
            </div>

            {/* Status Domisili KTP (Ramah Orang Tua) */}
            <div className="rounded-2xl border border-gray-border bg-gray-sidebar-hover/40 p-4 space-y-3">
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
                    name="editAnggotaIsKtpSameVillage"
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
                    name="editAnggotaIsKtpSameVillage"
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
            <div className="border-t border-gray-border pt-3">
              <KtpUploadInput
                value={ktpFile}
                onChange={setKtpFile}
                label={isKtpRequired ? "Berkas Scan KTP Anggota (Wajib untuk usia 18+ thn)" : "Berkas Scan KTP Anggota"}
                required={isKtpRequired}
                existingUrl={typeof ktpFile === "string" ? ktpFile : undefined}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-border pt-4 mt-4 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || isUploadingKtp}
              className="rounded-xl border border-gray-border px-4 py-2 text-xs font-semibold text-gray-secondary-text hover:bg-gray-sidebar-hover cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingKtp}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary-900 cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
            >
              {(isSubmitting || isUploadingKtp) && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
