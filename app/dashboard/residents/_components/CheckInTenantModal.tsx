import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, UserPlus, FileText, Phone, User, Calendar, MapPin, Briefcase, Home } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { createRentalResidentSchema } from "@/lib/validations/rental";

interface CheckInTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RentalPropertyOption {
  id: number;
  name: string;
  blockNumber: string;
  houseNumber: string;
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

export const CheckInTenantModal: React.FC<CheckInTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [properties, setProperties] = useState<RentalPropertyOption[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createRentalResidentSchema),
    defaultValues: {
      tenantType: "perorangan" as "perorangan" | "keluarga",
      name: "",
      nik: "",
      phone: "",
      originAddress: "",
      occupation: "",
      educationLevel: "",
      religion: "Islam" as any,
      roomNumber: "",
      checkInDate: new Date(),
      ktpFile: "",
    },
  });

  // Fetch active rental properties
  useEffect(() => {
    if (!isOpen) return;

    const fetchProperties = async () => {
      setIsLoadingProperties(true);
      try {
        const res = await fetch("/api/rentals?isActive=true");
        if (res.ok) {
          const data = await res.json();
          // The response has `data` which is an array of rentalProperties. Let's see if we need to fetch their dwellings.
          // In the database query `listRentalProperties`, it returns rentalProperties data.
          // Let's fetch details or map them.
          // Wait! In `listRentalProperties`, does it return blockNumber & houseNumber?
          // Let's check `listRentalProperties` in `db/queries/rental.ts` again. It returns `data` which is an array of rentalProperties.
          // In db, `rentalProperties` table has no blockNumber/houseNumber, but they references `dwellings.id`.
          // Wait! In `/api/rentals` endpoint, the GET handler returns `listRentalProperties` which is not joined with dwellings!
          // Ah! Let's check if the API returns dwelling details.
          // If it doesn't, we can fetch active dwellings or active rentals list.
          // Wait, let's look at `/api/rentals` results. It has `dwellingId`.
          // We can fetch active dwellings or we can look up from `/api/dwellings` which contains the label!
          // Actually, let's fetch `/api/rentals?isActive=true` and load the dwellings to show name and block/house.
          // Wait! Let's write a simple helper fetch in this modal or make the dropdown list names.
          // Let's first map the properties.
          const propertiesData = data.data || [];
          
          // Let's fetch all dwellings to map ID to label.
          const dwellingsRes = await fetch("/api/dwellings");
          if (dwellingsRes.ok) {
            const dwellingsData = await dwellingsRes.json();
            const mapped = propertiesData.map((p: any) => {
              const d = dwellingsData.find((dw: any) => dw.id === p.dwellingId);
              return {
                id: p.id,
                name: p.name,
                blockNumber: d?.blockNumber || "",
                houseNumber: d?.houseNumber || "",
              };
            });
            setProperties(mapped);
          } else {
            setProperties(propertiesData.map((p: any) => ({
              id: p.id,
              name: p.name,
              blockNumber: "",
              houseNumber: "",
            })));
          }
        } else {
          toast.error("Gagal memuat properti sewa");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingProperties(false);
      }
    };

    fetchProperties();
  }, [isOpen]);

  const propertyOptions: SelectOption[] = properties.map((p) => ({
    value: String(p.id),
    label: `${p.name} (Blok ${p.blockNumber} No. ${p.houseNumber})`,
  }));

  const handleClose = () => {
    reset();
    setSelectedPropertyId("");
    onClose();
  };

  const onSubmit = async (data: any) => {
    if (!selectedPropertyId) {
      toast.error("Properti sewa wajib dipilih");
      return;
    }

    try {
      // Simulate file upload setting
      const submitData = {
        ...data,
        ktpFile: data.ktpFile || `/uploads/ktp/ktp_${data.nik}.jpg`,
      };

      const response = await fetch(`/api/rentals/${selectedPropertyId}/residents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal melakukan check-in penyewa");
      }

      toast.success("Penyewa berhasil check-in. Menunggu verifikasi dokumen.");
      handleClose();
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
      <div className="relative w-full max-w-2xl bg-gray-card border border-gray-border rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden z-10 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-heading-main">Check-In Penyewa Baru</h3>
              <p className="text-[10px] text-gray-secondary-text">Daftarkan penyewa kos/kontrakan baru</p>
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
            {/* Property Selector */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-body-text-btn tracking-wider mb-2">
                Pilih Properti Sewa
              </label>
              {isLoadingProperties ? (
                <div className="flex items-center gap-2 text-xs text-gray-placeholder py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Memuat daftar properti sewa...
                </div>
              ) : (
                <CustomSelect
                  value={selectedPropertyId}
                  onChange={(val) => setSelectedPropertyId(val)}
                  options={propertyOptions}
                  placeholder="-- Pilih Properti Sewa --"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tenant Type */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-body-text-btn tracking-wider mb-2">
                  Tipe Penyewa
                </label>
                <Controller
                  name="tenantType"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value}
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
                placeholder="Contoh: 08123456789"
                registerProps={register("phone")}
                icon={Phone}
                error={errors.phone?.message}
              />

              {/* Check-In Date */}
              <div className="space-y-1.5">
                <label htmlFor="checkInDate" className="block text-sm font-semibold text-gray-body-text-btn tracking-wider mb-2">
                  Tanggal Masuk (Check-In)
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
                        className="w-full rounded-xl border border-gray-border bg-gray-card py-3 pl-10 pr-3 text-gray-heading-main placeholder-gray-placeholder sm:text-sm outline-none transition-all cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    )}
                  />
                  <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-placeholder pointer-events-none" />
                </div>
                {errors.checkInDate && (
                  <p className="text-xs text-error font-medium mt-1">{errors.checkInDate.message as string}</p>
                )}
              </div>
            </div>

            <hr className="border-gray-border" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Occupation */}
              <FormField
                id="occupation"
                label="Pekerjaan (Opsional)"
                type="text"
                placeholder="Pekerjaan utama"
                registerProps={register("occupation")}
                icon={Briefcase}
                error={errors.occupation?.message}
              />

              {/* Religion */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-body-text-btn tracking-wider mb-2">
                  Agama (Opsional)
                </label>
                <Controller
                  name="religion"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
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
              <label htmlFor="originAddress" className="block text-sm font-semibold text-gray-body-text-btn tracking-wider mb-2">
                Alamat Asal / KTP (Opsional)
              </label>
              <div className="relative">
                <textarea
                  id="originAddress"
                  placeholder="Alamat asal sesuai KTP"
                  rows={2}
                  {...register("originAddress")}
                  className="w-full rounded-xl border border-gray-border bg-gray-card py-3 pl-10 pr-3 text-gray-heading-main placeholder-gray-placeholder sm:text-sm outline-none transition-all resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-placeholder" />
              </div>
              {errors.originAddress && (
                <p className="text-xs text-error font-medium mt-1">{errors.originAddress.message}</p>
              )}
            </div>

            {/* Mock KTP upload input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-body-text-btn tracking-wider mb-2">
                Upload Foto / Scan KTP (Simulasi)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="File KTP (otomatis dibuat jika kosong)"
                  {...register("ktpFile")}
                  className="flex-1 rounded-xl border border-gray-border bg-gray-card py-3 px-4 text-gray-heading-main placeholder-gray-placeholder sm:text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => {
                    setValue("ktpFile", `/uploads/ktp/ktp_${Math.floor(100000 + Math.random() * 900000)}.jpg`);
                    toast.success("Foto KTP disimulasikan berhasil diunggah!");
                  }}
                  className="px-4 py-3 bg-gray-sidebar-hover hover:bg-gray-border/50 border border-gray-border rounded-xl text-sm font-semibold text-gray-heading-main cursor-pointer transition-all"
                >
                  Ambil Foto KTP
                </button>
              </div>
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
                  Mendaftarkan...
                </>
              ) : (
                "Daftarkan Penyewa"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
