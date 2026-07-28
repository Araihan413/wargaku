import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, User, CreditCard, Calendar, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createWargaSchema } from "@/lib/validations/kependudukan";
import { FormField } from "@/components/FormField";
import { CustomSelect } from "@/components/CustomSelect";
import { uploadFileToCloudinary } from "@/lib/upload-helper";
import { KtpUploadInput } from "@/components/KtpUploadInput";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { commonOccupations, commonEducations, genderOptions, relationshipOptions, religionOptions } from "@/lib/constants";

interface AddAnggotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  familyId: number;
}

export const AddAnggotaModal: React.FC<AddAnggotaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  familyId,
}) => {
  const [ktpFile, setKtpFile] = useState<File | string | null>(null);
  const [isUploadingKtp, setIsUploadingKtp] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createWargaSchema),
    defaultValues: {
      familyId: familyId,
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

  const handleClose = () => {
    reset();
    setKtpFile(null);
    onClose();
  };

  const onSubmit = async (data: any) => {
    setIsUploadingKtp(true);
    try {
      let finalKtpUrl = null;
      if (ktpFile instanceof File) {
        try {
          const uploadRes = await uploadFileToCloudinary(ktpFile, "ktp");
          finalKtpUrl = uploadRes.url;
        } catch {
          toast.error("Gagal mengunggah berkas KTP.");
          setIsUploadingKtp(false);
          return;
        }
      } else if (typeof ktpFile === "string") {
        finalKtpUrl = ktpFile;
      }

      const payload = {
        ...data,
        familyId: Number(familyId),
        birthPlace: data.birthPlace || null,
        birthDate: data.birthDate || null,
        occupation: data.occupation || null,
        educationLevel: data.educationLevel || null,
        religion: data.religion || null,
        phone: data.phone || null,
        ktpFile: finalKtpUrl,
      };

      const res = await fetch("/api/warga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Anggota keluarga baru berhasil ditambahkan");
        reset();
        setKtpFile(null);
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menambahkan anggota keluarga");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsUploadingKtp(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-heading-main">
            Tambah Anggota Keluarga
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
                      value={field.value}
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
                      value={field.value}
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
                placeholder=""
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
                      value={field.value || ""}
                      onChange={(val) => field.onChange(val)}
                      options={religionOptions}
                      placeholder="Pilih..."
                    />
                  )}
                />
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
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Pekerjaan
                </label>
                <Controller
                  name="occupation"
                  control={control}
                  render={({ field }) => (
                    <AutocompleteInput
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
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Pendidikan Terakhir
                </label>
                <Controller
                  name="educationLevel"
                  control={control}
                  render={({ field }) => (
                    <AutocompleteInput
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

            {/* Scan KTP File Upload */}
            <div className="border-t border-gray-border pt-3">
              <KtpUploadInput
                value={ktpFile}
                onChange={setKtpFile}
                label="Berkas Scan KTP Anggota"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-border pt-4 mt-4 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || isUploadingKtp}
              className="px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-sm font-semibold text-gray-secondary-text cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingKtp}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-900 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all"
            >
              {isSubmitting || isUploadingKtp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menambahkan...
                </>
              ) : (
                "Tambah Anggota"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
