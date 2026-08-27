import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, CreditCard, Calendar, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateFamilySchema } from "@/lib/validations/kependudukan";
import { FormField } from "@/components/FormField";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { DwellingOption, FamilyItem } from "../types";

interface EditKKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  family: FamilyItem | null;
}

export const EditKKModal: React.FC<EditKKModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  family,
}) => {
  const [dwellings, setDwellings] = useState<DwellingOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(updateFamilySchema),
    defaultValues: {
      dwellingId: undefined as any,
      familyNumber: "",
      unitNumber: "",
      checkInDate: "",
      verificationStatus: "pending" as any,
      verificationNote: "",
    },
  });

  // Populate data when modal opens
  useEffect(() => {
    if (!isOpen || !family) return;

    // Set form values
    reset({
      dwellingId: family.dwellingId,
      familyNumber: family.familyNumber,
      unitNumber: family.unitNumber || "",
      checkInDate: family.checkInDate ? family.checkInDate.split("T")[0] : "",
      verificationStatus: family.verificationStatus,
      verificationNote: family.verificationNote || "",
    });

    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const resDwellings = await fetch("/api/dwellings");
        const dataDwellings = resDwellings.ok ? await resDwellings.json() : [];
        setDwellings(dataDwellings);
      } catch (err) {
        console.error("Gagal memuat opsi hunian:", err);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [isOpen, family, reset]);

  const handleClose = () => {
    onClose();
  };

  const onSubmit = async (data: any) => {
    if (!family) return;

    try {
      const payload = {
        ...data,
        dwellingId: Number(data.dwellingId),
        unitNumber: data.unitNumber || null,
        verificationNote: data.verificationNote || null,
      };

      const res = await fetch(`/api/families/${family.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Kartu Keluarga berhasil diperbarui");
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal memperbarui Kartu Keluarga");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem");
    }
  };

  if (!isOpen || !family) return null;

  const dwellingSelectOptions: SelectOption[] = dwellings
    .filter((d: any) => d.type !== "homestay")
    .map((d: any) => ({
      value: d.id.toString(),
      label: d.label || `Blok ${d.blockNumber} No. ${d.houseNumber} (${d.type === "kos" ? "Rumah Kost" : "Rumah Permanen"})`,
    }));


  const verificationOptions: SelectOption[] = [
    { value: "draft", label: "Draft" },
    { value: "pending", label: "Pending" },
    { value: "verified", label: "Terverifikasi" },
    { value: "rejected", label: "Ditolak" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-heading-main">
            Ubah Data Kartu Keluarga
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
            
            <div className="bg-gray-sidebar-hover/40 border border-gray-border rounded-xl p-3 mb-2">
              <span className="text-xs font-semibold text-gray-secondary-text block">Kepala Keluarga Asosiasi:</span>
              <span className="text-sm font-bold text-gray-heading-main">{family.headName}</span>
            </div>

            {/* KK Number */}
            <FormField
              id="familyNumber"
              label="Nomor Kartu Keluarga (KK)"
              type="text"
              required={true}
              placeholder="16 digit nomor KK"
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

            {/* Unit Number */}
            <FormField
              id="unitNumber"
              label="Nomor Unit"
              type="text"
              placeholder="Contoh: A-10, Lt. 2 (Jika apartemen/kos/kontrakan)"
              registerProps={register("unitNumber")}
              icon={Home}
              error={errors.unitNumber?.message}
            />

            {/* Check In Date */}
            <FormField
              id="checkInDate"
              label="Tanggal Masuk Hunian"
              type="date"
              required={true}
              placeholder=""
              registerProps={register("checkInDate")}
              icon={Calendar}
              error={errors.checkInDate?.message}
            />

            <div className="border-t border-gray-border my-4 pt-4 space-y-4">
              <span className="text-sm font-bold text-gray-heading-main block">
                Persetujuan & Verifikasi
              </span>

              {/* Status Verifikasi */}
              <div className="space-y-1">
                <Controller
                  name="verificationStatus"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Status Verifikasi"
                      required={true}
                      value={field.value || ""}
                      onChange={(val) => field.onChange(val)}
                      options={verificationOptions}
                      placeholder="Pilih Status..."
                    />
                  )}
                />
                {errors.verificationStatus && (
                  <p className="text-xs font-semibold text-error mt-0.5">
                    {errors.verificationStatus.message}
                  </p>
                )}
              </div>

              {/* Catatan Verifikasi */}
              <div className="space-y-1">
                <label htmlFor="verificationNote" className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Catatan Verifikasi
                </label>
                <textarea
                  id="verificationNote"
                  rows={2}
                  placeholder="Beri alasan jika berkas KK ditolak atau catatan tambahan..."
                  {...register("verificationNote")}
                  className="block w-full rounded-xl border border-gray-border bg-gray-card py-2.5 px-3.5 text-gray-heading-main placeholder-gray-placeholder text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
                {errors.verificationNote && (
                  <p className="text-xs font-semibold text-error mt-0.5">
                    {errors.verificationNote.message}
                  </p>
                )}
              </div>
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
