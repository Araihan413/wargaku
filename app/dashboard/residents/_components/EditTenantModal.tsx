import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, FileText, Phone, User, Calendar, MapPin, Briefcase, Home, Upload, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { updateRentalResidentSchema } from "@/lib/validations/rental";
import { FileUploadModal } from "@/components/FileUploadModal";
import { uploadFileToCloudinary } from "@/lib/upload-helper";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { RentalResidentItem } from "./RentalTable";

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

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resident: RentalResidentItem | null;
}

const religionOptions: SelectOption[] = [
  { value: "Islam", label: "Islam" },
  { value: "Kristen", label: "Kristen" },
  { value: "Katolik", label: "Katolik" },
  { value: "Hindu", label: "Hindu" },
  { value: "Buddha", label: "Buddha" },
  { value: "Khonghucu", label: "Khonghucu" },
  { value: "Lainnya", label: "Lainnya" },
];

const tenantTypeOptions: SelectOption[] = [
  { value: "perorangan", label: "Perorangan (Individu)" },
  { value: "keluarga", label: "Keluarga (Satu KK)" },
];

export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  resident,
}) => {
  const [showKtpModal, setShowKtpModal] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(updateRentalResidentSchema),
  });

  const ktpFile = watch("ktpFile");

  // Populate data when resident changes
  useEffect(() => {
    if (resident) {
      reset({
        name: resident.name,
        nik: resident.nik,
        phone: resident.phone || "",
        tenantType: resident.tenantType,
        roomNumber: resident.roomNumber || "",
        checkInDate: resident.checkInDate ? new Date(resident.checkInDate) : new Date(),
        occupation: resident.occupation || "",
        educationLevel: resident.educationLevel || "",
        religion: (resident.religion as any) || null,
        originAddress: resident.originAddress || "",
        ktpFile: resident.ktpFile || "",
      });
    }
  }, [resident, reset]);

  const handleSelectLocalKtp = (file: File) => {
    setValue("ktpFile", file as any);
    toast.success("Berkas KTP lokal berhasil dipilih!");
  };

  const handleSelectDriveKtp = (url: string) => {
    setValue("ktpFile", url);
    toast.success("Tautan Google Drive KTP berhasil dipilih!");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: any) => {
    if (!resident) return;

    try {
      let finalKtpUrl = resident.ktpFile || "";

      if (data.ktpFile instanceof File) {
        try {
          const uploadRes = await uploadFileToCloudinary(data.ktpFile, "ktp");
          finalKtpUrl = uploadRes.url;
        } catch {
          toast.error("Gagal mengunggah berkas KTP.");
          return;
        }
      } else if (typeof data.ktpFile === "string") {
        finalKtpUrl = data.ktpFile;
      }

      // Convert Date object to YYYY-MM-DD string
      let checkInDateStr = resident.checkInDate;
      if (data.checkInDate instanceof Date) {
        checkInDateStr = data.checkInDate.toISOString().split("T")[0];
      } else if (typeof data.checkInDate === "string") {
        checkInDateStr = data.checkInDate.split("T")[0];
      }

      const response = await fetch(`/api/rental-residents/${resident.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          checkInDate: checkInDateStr,
          ktpFile: finalKtpUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal memperbarui data penyewa");
      }

      toast.success("Data penyewa berhasil diperbarui.");
      handleClose();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan koneksi");
    }
  };

  if (!isOpen || !resident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                      value={field.value || ""}
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
                      value={field.value || ""}
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
                      value={field.value || ""}
                      onChange={field.onChange}
                      options={religionOptions}
                      placeholder="-- Pilih Agama --"
                    />
                  )}
                />
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
            <div className="space-y-2.5 border-t border-gray-border pt-3">
              <label className="text-sm font-semibold text-black/80 tracking-wider mb-1.5 flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-primary" />
                <span>Berkas Scan KTP Penyewa <span className="text-error">*</span></span>
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowKtpModal(true)}
                  className="rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-2 text-xs font-bold text-primary flex items-center justify-center gap-2 cursor-pointer transition-colors max-w-full truncate"
                >
                  <Upload className="h-4 w-4 shrink-0" />
                  <span className="truncate font-sans font-bold">
                    {ktpFile
                      ? (((ktpFile as any) instanceof File) ? (ktpFile as any).name : "KTP Terpasang (Ganti Berkas)")
                      : "Pilih Berkas KTP"}
                  </span>
                </button>

                {ktpFile ? (
                  <span className="text-[11px] font-medium text-emerald-600 truncate flex items-center gap-1">
                    ✓ Berkas KTP Terpasang (Unggah Saat Simpan)
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                    ⚠️ Wajib Unggah Berkas KTP
                  </span>
                )}
              </div>
              {errors.ktpFile && (
                <p className="text-xs text-error font-semibold mt-1">{errors.ktpFile.message}</p>
              )}
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

      <FileUploadModal
        isOpen={showKtpModal}
        onClose={() => setShowKtpModal(false)}
        title="Pilih Berkas KTP Penyewa"
        description="Pilih sumber dokumen Scan KTP untuk memperbarui data penyewa."
        onSelectLocalFile={handleSelectLocalKtp}
        onSelectDriveUrl={handleSelectDriveKtp}
        isLoading={false}
      />
    </div>
  );
};
