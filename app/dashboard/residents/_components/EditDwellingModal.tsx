import React, { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Home, Pencil, MapPin, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { DwellingItem } from "./DwellingTable";
import { z } from "zod";
import { OwnerSearchSelect } from "./OwnerSearchSelect";

const editDwellingSchema = z.object({
  blockNumber: z.string().min(1, "Nomor blok wajib diisi").max(20),
  houseNumber: z.string().min(1, "Nomor rumah wajib diisi").max(20),
  type: z.enum(["permanen", "kos", "homestay"]),
  isActive: z.boolean(),
  notes: z.string().optional().nullable(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  ownerUserId: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  ownerPhone: z.string().optional().nullable(),
});

type EditDwellingForm = z.infer<typeof editDwellingSchema>;

interface EditDwellingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dwelling: DwellingItem | null;
}

const dwellingTypeOptions: SelectOption[] = [
  { value: "permanen", label: "Rumah Tetap (Permanen)" },
  { value: "kos", label: "Kos / Kontrakan" },
  { value: "homestay", label: "Homestay / Penginapan" },
];

export const EditDwellingModal: React.FC<EditDwellingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  dwelling,
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditDwellingForm>({
    resolver: zodResolver(editDwellingSchema),
    defaultValues: {
      blockNumber: "",
      houseNumber: "",
      type: "permanen",
      isActive: true,
      notes: "",
      latitude: "",
      longitude: "",
      ownerUserId: "",
      ownerName: "-",
      ownerPhone: "-",
    },
  });

  const ownerUserId = useWatch({
    control,
    name: "ownerUserId",
  });

  const ownerName = useWatch({
    control,
    name: "ownerName",
  });

  const handleOwnerSelect = (user: any | null) => {
    if (user) {
      setValue("ownerUserId", user.id);
      setValue("ownerName", user.name);
      setValue("ownerPhone", user.phone || "-");
    } else {
      setValue("ownerUserId", "");
      setValue("ownerName", "-");
      setValue("ownerPhone", "-");
    }
  };

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setIsLoadingUsers(true);
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetch("/api/users?limit=100&status=active")
        .then((res) => res.json())
        .then((data) => {
          setUsers(data.users || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoadingUsers(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (dwelling) {
      reset({
        blockNumber: dwelling.blockNumber,
        houseNumber: dwelling.houseNumber,
        type: dwelling.type,
        isActive: dwelling.isActive,
        notes: dwelling.notes || "",
        latitude: dwelling.latitude || "",
        longitude: dwelling.longitude || "",
        ownerUserId: dwelling.ownerUserId || "",
        ownerName: dwelling.ownerName || "-",
        ownerPhone: dwelling.ownerPhone || "-",
      });
    }
  }, [dwelling, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: EditDwellingForm) => {
    if (!dwelling) return;

    try {
      const response = await fetch(`/api/dwellings/${dwelling.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengubah data hunian");
      }

      toast.success(result.message || "Hunian berhasil diubah");
      handleClose();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan koneksi");
    }
  };

  if (!isOpen || !dwelling) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-gray-card border border-gray-border rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden z-10 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-heading-main">Ubah Alamat Hunian</h3>
              <p className="text-[10px] text-gray-secondary-text">Edit detail Blok A/No Rumah bangunan</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="grid grid-cols-2 gap-4">
              {/* Block Number */}
              <FormField
                id="blockNumber"
                label="Nama/Nomor Blok"
                type="text"
                placeholder="Contoh: A"
                registerProps={register("blockNumber")}
                icon={Home}
                error={errors.blockNumber?.message}
              />

              {/* House Number */}
              <FormField
                id="houseNumber"
                label="Nomor Rumah"
                type="text"
                placeholder="Contoh: 12"
                registerProps={register("houseNumber")}
                icon={Home}
                error={errors.houseNumber?.message}
              />
            </div>

            {/* Dwelling Type */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-body-text-btn tracking-wider mb-2">
                Tipe Hunian
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div>
                    <CustomSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={dwellingTypeOptions}
                      placeholder="-- Pilih Tipe Hunian --"
                    />
                    {errors.type && (
                      <p className="text-xs text-error font-medium mt-1">
                        {errors.type.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Is Active Status checkbox */}
            <div className="flex items-center gap-2 py-2">
              <input
                id="isActive"
                type="checkbox"
                {...register("isActive")}
                className="w-4 h-4 rounded-md border-gray-border text-primary bg-gray-card focus:ring-primary focus:ring-offset-0 focus:outline-none"
              />
              <label htmlFor="isActive" className="text-sm font-semibold text-gray-body-text-btn tracking-wider cursor-pointer">
                Hunian Fisik Aktif
              </label>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-body-text-btn tracking-wider mb-2">
                Catatan Hunian (Opsional)
              </label>
              <textarea
                id="notes"
                placeholder="Contoh: Depan pos satpam, cat pagar hitam"
                rows={3}
                {...register("notes")}
                className="w-full rounded-xl border border-gray-border bg-gray-card py-3 px-4 text-gray-heading-main placeholder-gray-placeholder sm:text-sm outline-none transition-all resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.notes && (
                <p className="text-xs text-error font-medium mt-1">
                  {errors.notes.message}
                </p>
              )}
            </div>

            {/* Latitude & Longitude */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                id="latitude"
                label="Latitude (Opsional)"
                type="text"
                placeholder="Contoh: -6.200000"
                registerProps={register("latitude")}
                icon={MapPin}
                error={errors.latitude?.message}
              />
              <FormField
                id="longitude"
                label="Longitude (Opsional)"
                type="text"
                placeholder="Contoh: 106.816666"
                registerProps={register("longitude")}
                icon={MapPin}
                error={errors.longitude?.message}
              />
            </div>
            <p className="text-[10px] text-gray-placeholder -mt-2">
              Tips: Anda dapat menyalin koordinat ini dari Google Maps (klik kanan pada peta &rarr; salin koordinat).
            </p>

            {/* Owner Aset (Optional) */}
            <div className="space-y-4 border-t border-gray-border/50 pt-4 animate-in slide-in-from-top-2 duration-200">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Pemilik Hunian/Aset</h4>
              
              <div>
                <label className="block text-sm font-semibold text-gray-body-text-btn tracking-wider mb-2">
                  Pilih Pemilik Terdaftar (Opsional)
                </label>
                <OwnerSearchSelect
                  users={users}
                  isLoading={isLoadingUsers}
                  selectedUserId={ownerUserId}
                  selectedUserName={ownerName}
                  onSelect={handleOwnerSelect}
                />
              </div>

              <FormField
                id="ownerName"
                label="Nama Pemilik (Otomatis)"
                type="text"
                placeholder="-"
                registerProps={register("ownerName")}
                icon={User}
                error={errors.ownerName?.message}
                readOnly={true}
              />

              <FormField
                id="ownerPhone"
                label="No HP Pemilik (Otomatis)"
                type="text"
                placeholder="-"
                registerProps={register("ownerPhone")}
                icon={Phone}
                error={errors.ownerPhone?.message}
                readOnly={true}
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
