import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, User, CreditCard, Calendar, Phone, Briefcase, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateWargaSchema } from "@/lib/validations/kependudukan";
import { FormField } from "@/components/FormField";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { FamilyMemberItem } from "../../../types";

interface EditAnggotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: FamilyMemberItem | null;
}

export const EditAnggotaModal: React.FC<EditAnggotaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  member,
}) => {
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

  // Populate data when modal opens
  useEffect(() => {
    if (!isOpen || !member) return;

    reset({
      name: member.name,
      nik: member.nik,
      birthPlace: member.birthPlace || "",
      birthDate: member.birthDate ? member.birthDate.split("T")[0] : "",
      gender: member.gender,
      relationship: member.relationship,
      occupation: member.occupation || "",
      educationLevel: member.educationLevel || "",
      religion: member.religion || ("Islam" as any),
      phone: member.phone || "",
      ktpFile: member.ktpFile || "",
    });
  }, [isOpen, member, reset]);

  const handleClose = () => {
    onClose();
  };

  const onSubmit = async (data: any) => {
    if (!member) return;

    try {
      const payload = {
        ...data,
        birthPlace: data.birthPlace || null,
        birthDate: data.birthDate || null,
        occupation: data.occupation || null,
        educationLevel: data.educationLevel || null,
        religion: data.religion || null,
        phone: data.phone || null,
        ktpFile: data.ktpFile || null,
      };

      const res = await fetch(`/api/warga/${member.id}`, {
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
    }
  };

  if (!isOpen || !member) return null;

  const genderOptions: SelectOption[] = [
    { value: "L", label: "Laki-laki" },
    { value: "P", label: "Perempuan" },
  ];

  const relationshipOptions: SelectOption[] = [
    { value: "Kepala_Keluarga", label: "Kepala Keluarga" },
    { value: "Suami", label: "Suami" },
    { value: "Istri", label: "Istri" },
    { value: "Anak", label: "Anak" },
    { value: "Orang_Tua", label: "Orang Tua" },
    { value: "Lainnya", label: "Lainnya" },
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-heading-main">
            Ubah Data Anggota Keluarga
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
              <FormField
                id="occupation"
                label="Pekerjaan"
                type="text"
                placeholder="Contoh: Karyawan Swasta"
                registerProps={register("occupation")}
                icon={Briefcase}
                error={errors.occupation?.message}
              />

              {/* Education Level */}
              <FormField
                id="educationLevel"
                label="Pendidikan Terakhir"
                type="text"
                placeholder="Contoh: S1 Teknik Informatika"
                registerProps={register("educationLevel")}
                icon={GraduationCap}
                error={errors.educationLevel?.message}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-border pt-4 mt-4 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-sm font-semibold text-gray-secondary-text cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-900 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
