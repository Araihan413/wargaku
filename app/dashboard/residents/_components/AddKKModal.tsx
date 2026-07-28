import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, CreditCard, Calendar, User, Home, Loader2, Info, Upload } from "lucide-react";
import { toast } from "sonner";
import { createFamilySchema } from "@/lib/validations/kependudukan";
import { FormField } from "@/components/FormField";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { DwellingOption, UserOption } from "../types";
import { executeWithFileUpload } from "@/lib/upload-helper";

interface AddKKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddKKModal: React.FC<AddKKModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dwellings, setDwellings] = useState<DwellingOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const handleKKFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("kkFile", file as any);
    }
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createFamilySchema),
    defaultValues: {
      dwellingId: undefined as any,
      familyNumber: "",
      headUserId: "",
      headName: "",
      unitNumber: "",
      kkFile: "",
      checkInDate: "",
    },
  });

  // Fetch dwellings and users for dropdowns
  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      try {
        // Fetch active dwellings
        const resDwellings = await fetch("/api/dwellings");
        const dataDwellings = await resDwellings.ok ? await resDwellings.json() : [];
        setDwellings(dataDwellings);

        // Fetch active users to select as Head of Family
        const resUsers = await fetch("/api/users?limit=100&status=active&withoutFamily=true");
        if (resUsers.ok) {
          const dataUsers = await resUsers.json();
          setUsers(dataUsers.users || []);
        }
      } catch (err) {
        console.error("Gagal memuat opsi form:", err);
        toast.error("Gagal memuat daftar hunian atau warga.");
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [isOpen]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: any) => {
    const result = await executeWithFileUpload({
      file: data.kkFile,
      folder: "kk",
      submitFn: (kkFileUrl) => {
        const payload = {
          ...data,
          dwellingId: Number(data.dwellingId),
          unitNumber: data.unitNumber || null,
          kkFile: kkFileUrl || null,
        };

        return fetch("/api/families", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      },
      successMessage: "Kartu Keluarga baru berhasil didaftarkan",
    });

    if (result.success) {
      reset();
      onSuccess();
    }
  };

  if (!isOpen) return null;

  const dwellingSelectOptions: SelectOption[] = dwellings.map((d: any) => ({
    value: d.id.toString(),
    label: d.label || `${d.streetName} No. ${d.houseNumber}`,
  }));

  const userSelectOptions: SelectOption[] = users.map((u) => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-heading-main">
            Daftarkan Kartu Keluarga Baru
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
            {/* KK Number */}
             <FormField
              id="familyNumber"
              label="Nomor Kartu Keluarga (KK)"
              type="text"
              required={true}
              placeholder="16 digit nomor Kartu Keluarga"
              registerProps={register("familyNumber")}
              icon={CreditCard}
              error={errors.familyNumber?.message}
            />

            {/* Dwelling Allocation */}
            <div className="space-y-1">
              {isLoadingOptions ? (
                <div className="flex items-center gap-2 py-2 px-3 border border-gray-border rounded-xl bg-gray-sidebar-hover text-gray-placeholder text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Memuat daftar hunian...
                </div>
              ) : (
                <Controller
                  name="dwellingId"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Alamat Rumah / Hunian"
                      required={true}
                      value={field.value ? field.value.toString() : ""}
                      onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                      options={dwellingSelectOptions}
                      placeholder="Pilih Hunian Warga..."
                    />
                  )}
                />
              )}
              {errors.dwellingId && (
                <p className="text-xs font-semibold text-error mt-0.5">
                  {errors.dwellingId.message}
                </p>
              )}
            </div>

            {/* Unit Number (Optional) */}
            <FormField
              id="unitNumber"
              label="Nomor Unit"
              type="text"
              placeholder="Contoh: A-10, Lt. 2 (Jika apartemen/kos/kontrakan)"
              registerProps={register("unitNumber")}
              icon={Home}
              error={errors.unitNumber?.message}
            />

            {/* Head of Family User Account */}
            <div className="space-y-1">
              {isLoadingOptions ? (
                <div className="flex items-center gap-2 py-2 px-3 border border-gray-border rounded-xl bg-gray-sidebar-hover text-gray-placeholder text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Memuat daftar warga...
                </div>
              ) : (
                <Controller
                  name="headUserId"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Akun Kepala Keluarga"
                      required={true}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        // Auto-populate Head Name
                        const selected = users.find((u) => u.id === val);
                        if (selected) {
                          setValue("headName", selected.name);
                        }
                      }}
                      options={userSelectOptions}
                      placeholder="Pilih Akun Kepala Keluarga..."
                    />
                  )}
                />
              )}
              {errors.headUserId && (
                <p className="text-xs font-semibold text-error mt-0.5">
                  {errors.headUserId.message}
                </p>
              )}
            </div>

            {/* Head Name */}
            <FormField
              id="headName"
              label="Nama Lengkap Kepala Keluarga"
              type="text"
              required={true}
              placeholder="Otomatis terisi dari pilihan akun di atas"
              registerProps={register("headName")}
              icon={User}
              error={errors.headName?.message}
            />

            {/* Scan KK File Upload */}
            <div className="space-y-2 border-t border-gray-border pt-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-black/80 tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-primary" />
                  <span>Unggah Berkas Scan KK</span>
                </label>
                {isSubmitting && (
                  <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Mengunggah...
                  </span>
                )}
              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={isSubmitting}
                onChange={handleKKFileUpload}
                className="block w-full text-xs text-gray-secondary-text file:mr-3 file:rounded-xl file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary hover:file:bg-primary/20 cursor-pointer disabled:opacity-60"
              />

              <input
                type="hidden"
                {...register("kkFile")}
              />
            </div>

            {/* Check In Date */}
            <FormField
              id="checkInDate"
              label="Tanggal Masuk Hunian"
              type="date"
              placeholder=""
              registerProps={register("checkInDate")}
              icon={Calendar}
              error={errors.checkInDate?.message}
            />

            <div className="rounded-xl bg-primary-100/30 border border-primary/20 p-3.5 flex items-start gap-3 mt-4">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-gray-secondary-text leading-relaxed">
                Pendaftaran KK baru otomatis memasukkan akun Kepala Keluarga terpilih sebagai anggota keluarga pertama dalam database. Anggota keluarga lain dapat ditambahkan dari halaman detail KK.
              </p>
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
                  Mendaftarkan...
                </>
              ) : (
                "Daftarkan KK"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
