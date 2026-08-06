import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, FileText, Phone, User, Calendar, MapPin, Briefcase, Home, GraduationCap } from "lucide-react";
import { FormField } from "@/components/FormField";
import { CustomSelect } from "@/components/CustomSelect";
import { updateRentalResidentSchema } from "@/lib/validations/rental";
import { executeWithFileUpload } from "@/lib/upload-helper";
import { KtpUploadInput } from "@/components/KtpUploadInput";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { RentalResidentItem } from "./RentalTable";
import { commonOccupations, commonEducations, religionOptions, tenantTypeOptions } from "@/lib/constants";

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resident: RentalResidentItem | null;
}

export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  resident,
}) => {

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(updateRentalResidentSchema),
  });

  // Populate data when resident changes or modal opens
  useEffect(() => {
    if (isOpen && resident) {
      reset({
        name: resident.name || "",
        nik: resident.nik || "",
        phone: resident.phone || "",
        tenantType: resident.tenantType || "perorangan",
        roomNumber: resident.roomNumber || "",
        checkInDate: resident.checkInDate ? (typeof resident.checkInDate === "string" ? new Date(resident.checkInDate) : resident.checkInDate) : new Date(),
        occupation: resident.occupation || "",
        educationLevel: resident.educationLevel || "",
        religion: (resident.religion as any) || null,
        originAddress: resident.originAddress || "",
        ktpFile: resident.ktpFile || "",
      });
    }
  }, [isOpen, resident, reset]);

  const handleClose = () => {
    onClose();
  };

  const onSubmit = async (data: any) => {
    if (!resident) return;

    // Convert Date object to YYYY-MM-DD string
    let checkInDateStr = resident.checkInDate;
    if (data.checkInDate instanceof Date) {
      checkInDateStr = data.checkInDate.toISOString().split("T")[0];
    } else if (typeof data.checkInDate === "string") {
      checkInDateStr = data.checkInDate.split("T")[0];
    }

    const result = await executeWithFileUpload({
      file: data.ktpFile,
      folder: "ktp",
      submitFn: (finalKtpUrl) =>
        fetch(`/api/rental-residents/${resident.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            checkInDate: checkInDateStr,
            ktpFile: finalKtpUrl,
          }),
        }),
      successMessage: "Data penyewa berhasil diperbarui.",
    });

    if (result.success) {
      handleClose();
      onSuccess();
    }
  };

  if (!isOpen || !resident) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm cursor-default"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-gray-card border border-gray-border rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-heading-main">Edit Data Penyewa</h3>
              <p className="text-[10px] text-gray-secondary-text">Perbarui rincian data penyewa kos/kontrakan</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3 text-xs text-primary leading-relaxed font-semibold mb-2">
              <Home className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Properti: {resident.propertyName}</p>
                <p className="mt-0.5">Blok {resident.blockNumber} No. {resident.houseNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tenant Type */}
              <div className="space-y-1.5">
                <Controller
                  name="tenantType"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Tipe Penyewa"
                      required={true}
                      value={field.value || ""}
                      onChange={field.onChange}
                      options={tenantTypeOptions}
                      placeholder="-- Tipe --"
                    />
                  )}
                />
                {errors.tenantType && (
                  <p className="text-xs text-error font-semibold mt-1">
                    {errors.tenantType.message as string}
                  </p>
                )}
              </div>

              {/* Room/Kamar Number */}
              <FormField
                id="roomNumber"
                label="Nomor Kamar / Unit"
                type="text"
                required={true}
                placeholder="Contoh: B1, Kamar 04"
                registerProps={register("roomNumber")}
                icon={Home}
                error={errors.roomNumber?.message}
              />
            </div>

            <hr className="border-gray-border" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <FormField
                id="name"
                label="Nama Lengkap Penyewa"
                type="text"
                required={true}
                placeholder="Nama sesuai KTP"
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
                placeholder="16 Digit NIK"
                registerProps={register("nik")}
                icon={FileText}
                error={errors.nik?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone/WhatsApp */}
              <FormField
                id="phone"
                label="Nomor HP / WhatsApp"
                type="text"
                required={true}
                placeholder="Contoh: 08123456789"
                registerProps={register("phone")}
                icon={Phone}
                error={errors.phone?.message}
              />

              {/* Check-In Date */}
              <div className="space-y-1.5">
                <label htmlFor="checkInDate" className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Tanggal Masuk (Check-In) <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <Controller
                    name="checkInDate"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="date"
                        id="checkInDate"
                        value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : typeof field.value === "string" && field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        className="w-full rounded-xl border border-gray-border bg-gray-card py-2.5 pl-10 pr-3 text-gray-heading-main placeholder-gray-placeholder text-sm outline-none transition-all cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    )}
                  />
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-gray-placeholder pointer-events-none" />
                </div>
                {errors.checkInDate && (
                  <p className="text-xs text-error font-semibold mt-1">{errors.checkInDate.message as string}</p>
                )}
              </div>
            </div>

            <hr className="border-gray-border" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Occupation */}
              <div className="space-y-1.5">
                <Controller
                  name="occupation"
                  control={control}
                  render={({ field }) => (
                    <AutocompleteInput
                      label="Pekerjaan"
                      value={(field.value as string) || ""}
                      onChange={field.onChange}
                      suggestions={commonOccupations}
                      placeholder="Pekerjaan utama"
                      icon={Briefcase}
                    />
                  )}
                />
                {errors.occupation && (
                  <p className="text-xs text-error font-semibold mt-1">{errors.occupation.message}</p>
                )}
              </div>

              {/* Education Level */}
              <div className="space-y-1.5">
                <Controller
                  name="educationLevel"
                  control={control}
                  render={({ field }) => (
                    <AutocompleteInput
                      label="Pendidikan Terakhir"
                      value={(field.value as string) || ""}
                      onChange={field.onChange}
                      suggestions={commonEducations}
                      placeholder="Contoh: S1 / SMA"
                      icon={GraduationCap}
                    />
                  )}
                />
                {errors.educationLevel && (
                  <p className="text-xs text-error font-semibold mt-1">{errors.educationLevel.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Religion */}
              <div className="space-y-1.5">
                <Controller
                  name="religion"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Agama"
                      value={(field.value as string) || ""}
                      onChange={field.onChange}
                      options={religionOptions}
                      placeholder="-- Pilih Agama --"
                    />
                  )}
                />
                {errors.religion && (
                  <p className="text-xs text-error font-semibold mt-1">
                    {errors.religion.message as string}
                  </p>
                )}
              </div>
            </div>

            {/* Origin Address */}
            <div className="space-y-1.5">
              <label htmlFor="originAddress" className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Alamat Asal / KTP
              </label>
              <div className="relative">
                <textarea
                  id="originAddress"
                  placeholder="Alamat asal sesuai KTP"
                  rows={2}
                  {...register("originAddress")}
                  className="w-full rounded-xl border border-gray-border bg-gray-card py-2.5 pl-10 pr-3.5 text-gray-heading-main placeholder-gray-placeholder text-sm outline-none transition-all resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-gray-placeholder" />
              </div>
              {errors.originAddress && (
                <p className="text-xs text-error font-semibold mt-1">{errors.originAddress.message}</p>
              )}
            </div>

            {/* Scan KTP File Upload */}
            <div className="border-t border-gray-border pt-3">
              <Controller
                name="ktpFile"
                control={control}
                render={({ field }) => (
                  <KtpUploadInput
                    value={field.value as string | File | null | undefined}
                    onChange={field.onChange}
                    label="Berkas Scan KTP Penyewa"
                    required
                    error={errors.ktpFile?.message as string}
                  />
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-border px-6 py-4 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-xs font-semibold text-gray-secondary-text cursor-pointer transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all disabled:opacity-50"
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
