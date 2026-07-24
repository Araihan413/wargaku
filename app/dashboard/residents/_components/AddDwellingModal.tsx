import React, { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Home, Layers, PlusCircle, MapPin, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { z } from "zod";
import { OwnerSearchSelect } from "./OwnerSearchSelect";

const addDwellingSchema = z.object({
  mode: z.enum(["single", "bulk"]),
  blockNumber: z.string().min(1, "Nomor blok wajib diisi").max(20),
  houseNumber: z.string().optional().nullable(),
  type: z.enum(["permanen", "kos", "homestay"]),
  notes: z.string().optional().nullable(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  ownerUserId: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  ownerPhone: z.string().optional().nullable(),
  startNumber: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().int().positive()).optional(),
  endNumber: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().int().positive()).optional(),
}).superRefine((data, ctx) => {
  if (data.mode === "single") {
    if (!data.houseNumber || data.houseNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["houseNumber"],
        message: "Nomor rumah wajib diisi untuk input tunggal",
      });
    }
  } else {
    if (data.startNumber === undefined || data.startNumber === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startNumber"],
        message: "Nomor awal wajib diisi untuk input massal",
      });
    }
    if (data.endNumber === undefined || data.endNumber === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endNumber"],
        message: "Nomor akhir wajib diisi untuk input massal",
      });
    }
    if (data.startNumber && data.endNumber && data.startNumber > data.endNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endNumber"],
        message: "Nomor akhir harus lebih besar atau sama dengan nomor awal",
      });
    }
  }
});

interface AddDwellingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const dwellingTypeOptions: SelectOption[] = [
  { value: "permanen", label: "Rumah Tetap (Permanen)" },
  { value: "kos", label: "Kos / Kontrakan" },
  { value: "homestay", label: "Homestay / Penginapan" },
];

export const AddDwellingModal: React.FC<AddDwellingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(addDwellingSchema),
    defaultValues: {
      mode: "single" as "single" | "bulk",
      blockNumber: "",
      houseNumber: "",
      type: "permanen" as "permanen" | "kos" | "homestay",
      notes: "",
      latitude: "",
      longitude: "",
      ownerUserId: "",
      ownerName: "-",
      ownerPhone: "-",
      startNumber: undefined as number | undefined,
      endNumber: undefined as number | undefined,
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

  React.useEffect(() => {
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

  const handleTabChange = (tab: "single" | "bulk") => {
    setActiveTab(tab);
    setValue("mode", tab);
  };

  const handleClose = () => {
    reset();
    setActiveTab("single");
    onClose();
  };

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/dwellings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal menyimpan data hunian");
      }

      toast.success(result.message || "Hunian berhasil ditambahkan");
      reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan koneksi");
    }
  };

  if (!isOpen) return null;

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
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-heading-main">Tambah Alamat Hunian</h3>
              <p className="text-[10px] text-gray-secondary-text">Pilih metode penginputan alamat rumah</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-gray-border bg-gray-sidebar-hover/10 px-6 shrink-0">
          <button
            type="button"
            onClick={() => handleTabChange("single")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === "single"
                ? "border-primary text-primary"
                : "border-transparent text-gray-secondary-text hover:text-gray-heading-main"
            }`}
          >
            <Home className="h-4 w-4" />
            Input Tunggal
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("bulk")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === "bulk"
                ? "border-primary text-primary"
                : "border-transparent text-gray-secondary-text hover:text-gray-heading-main"
            }`}
          >
            <Layers className="h-4 w-4" />
            Generate Massal (Bulk)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* Block Number */}
            <FormField
              id="blockNumber"
              label="Blok Hunian"
              type="text"
              required={true}
              placeholder="Contoh: A, B, C, atau Gang Merpati"
              registerProps={register("blockNumber")}
              icon={Home}
              error={errors.blockNumber?.message}
            />

            {/* Dwelling Type */}
            <div className="space-y-1.5">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div>
                    <CustomSelect
                      label="Tipe Hunian"
                      required={true}
                      value={field.value}
                      onChange={field.onChange}
                      options={dwellingTypeOptions}
                      placeholder="-- Pilih Tipe Hunian --"
                    />
                    {errors.type && (
                      <p className="text-xs text-error font-semibold mt-1">
                        {errors.type.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {activeTab === "single" ? (
              <>
                {/* House Number (Single) */}
                <FormField
                  id="houseNumber"
                  label="Nomor Rumah"
                  type="text"
                  required={true}
                  placeholder="Contoh: 12, 14A, 35B"
                  registerProps={register("houseNumber")}
                  icon={Home}
                  error={errors.houseNumber?.message}
                />

                {/* Notes (Single) */}
                <div className="space-y-1.5">
                  <label htmlFor="notes" className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Catatan Hunian
                  </label>
                  <textarea
                    id="notes"
                    placeholder="Contoh: Depan pos satpam, cat pagar hitam"
                    rows={3}
                    {...register("notes")}
                    className="w-full rounded-xl border border-gray-border bg-gray-card py-2.5 px-3.5 text-gray-heading-main placeholder-gray-placeholder text-sm outline-none transition-all resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {errors.notes && (
                    <p className="text-xs text-error font-semibold mt-1">
                      {errors.notes.message}
                    </p>
                  )}
                </div>

                {/* Latitude & Longitude (Single) */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    id="latitude"
                    label="Latitude"
                    type="text"
                    placeholder="Contoh: -6.200000"
                    registerProps={register("latitude")}
                    icon={MapPin}
                    error={errors.latitude?.message}
                  />
                  <FormField
                    id="longitude"
                    label="Longitude"
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

                {/* Owner Aset */}
                <div className="space-y-4 border-t border-gray-border/50 pt-4 animate-in slide-in-from-top-2 duration-200">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Pemilik Hunian/Aset</h4>
                  
                  <div>
                    <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                      Pilih Pemilik Terdaftar
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
                    label="Nama Pemilik"
                    type="text"
                    placeholder="-"
                    registerProps={register("ownerName")}
                    icon={User}
                    error={errors.ownerName?.message}
                    readOnly={true}
                  />

                  <FormField
                    id="ownerPhone"
                    label="No HP Pemilik"
                    type="text"
                    placeholder="-"
                    registerProps={register("ownerPhone")}
                    icon={Phone}
                    error={errors.ownerPhone?.message}
                    readOnly={true}
                  />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* Start Number (Bulk) */}
                <FormField
                  id="startNumber"
                  label="Nomor Rumah Awal"
                  type="number"
                  required={true}
                  placeholder="Contoh: 1"
                  registerProps={register("startNumber")}
                  icon={Home}
                  error={errors.startNumber?.message}
                />

                {/* End Number (Bulk) */}
                <FormField
                  id="endNumber"
                  label="Nomor Rumah Akhir"
                  type="number"
                  required={true}
                  placeholder="Contoh: 50"
                  registerProps={register("endNumber")}
                  icon={Home}
                  error={errors.endNumber?.message}
                />
              </div>
            )}
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
              ) : activeTab === "single" ? (
                "Simpan Alamat"
              ) : (
                "Generate Massal"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
