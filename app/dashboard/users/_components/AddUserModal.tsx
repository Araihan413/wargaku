import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  User,
  Mail,
  Lock,
  CreditCard,
  Phone,
  Loader2,
  Building2,
  Check,
  CheckCircle,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { createUserByAdminSchema, CreateUserByAdminType } from "@/lib/validations/user";
import { FormField } from "@/components/FormField";
import { RoleItem } from "../types";
import { CustomSelect } from "@/components/CustomSelect";

interface DwellingOption {
  id: number;
  blockNumber: string;
  houseNumber: string;
  label?: string;
  type?: string;
}

interface RentalPropertyOption {
  id: number;
  name: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roles: RoleItem[];
  fixedRoleId?: number;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  roles,
  fixedRoleId,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [dwellings, setDwellings] = useState<DwellingOption[]>([]);
  const [isLoadingDwellings, setIsLoadingDwellings] = useState(false);
  const [rentalProperties, setRentalProperties] = useState<RentalPropertyOption[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  // Success view state after user creation
  const [createdData, setCreatedData] = useState<{
    name: string;
    email: string;
    generatedPassword?: string | null;
    emailSent: boolean;
  } | null>(null);

  const defaultRoles = fixedRoleId ? [fixedRoleId] : [6];

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserByAdminType>({
    resolver: zodResolver(createUserByAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      nik: "",
      phone: "",
      roles: defaultRoles,
      status: "active",
      familyNumber: "",
      dwellingId: undefined,
      rentalPropertyId: undefined,
      gender: undefined,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedRoles = watch("roles") || [];
  const isWargaSelected = selectedRoles.includes(6);
  const isCoordSelected = selectedRoles.includes(5);
  const isSuperAdminSelected = selectedRoles.includes(1);
  const selectedOfficerRole = selectedRoles.find((r) => [2, 3, 4].includes(r));

  // Reset form saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      setCreatedData(null);
      reset({
        name: "",
        email: "",
        password: "",
        nik: "",
        phone: "",
        roles: fixedRoleId ? [fixedRoleId] : [6],
        status: "active",
        familyNumber: "",
        dwellingId: undefined,
        rentalPropertyId: undefined,
        gender: undefined,
      });
    }
  }, [isOpen, fixedRoleId, reset]);

  // Fetch dwellings ketika modal terbuka & Warga terpilih
  useEffect(() => {
    if (!isOpen) return;

    const fetchDwellings = async () => {
      setIsLoadingDwellings(true);
      try {
        const res = await fetch("/api/dwellings");
        if (res.ok) {
          const data = await res.json();
          // Saring: Hanya hunian non-homestay (permanen/kos) yang diizinkan untuk Warga
          const validDwellings = Array.isArray(data)
            ? data.filter((d: any) => d.type !== 'homestay')
            : [];
          setDwellings(validDwellings);
        }
      } catch (err) {
        console.error("Gagal memuat hunian:", err);
      } finally {
        setIsLoadingDwellings(false);
      }
    };

    fetchDwellings();
  }, [isOpen]);

  // Fetch rental properties jika Koordinator Kos terpilih
  useEffect(() => {
    if (!isOpen || !isCoordSelected) return;

    const fetchProperties = async () => {
      setIsLoadingProperties(true);
      try {
        const res = await fetch("/api/rental-properties");
        if (res.ok) {
          const data = await res.json();
          const propsList = Array.isArray(data) ? data : data.data || [];
          setRentalProperties(propsList);
        }
      } catch (err) {
        console.error("Gagal memuat properti kos:", err);
      } finally {
        setIsLoadingProperties(false);
      }
    };

    fetchProperties();
  }, [isOpen, isCoordSelected]);

  const handleClose = () => {
    reset();
    setShowPassword(false);
    setCreatedData(null);
    onClose();
  };

  const handleRoleToggle = (roleId: number) => {
    let newRoles = [...selectedRoles];

    if (newRoles.includes(roleId)) {
      // Jika role yang diklik sudah terpilih, hapus (tidak jadi terpilih/unselect)
      newRoles = newRoles.filter((r) => r !== roleId);
    } else {
      // Jika role belum terpilih:
      if (roleId === 1) {
        // Role Super Admin bersifat eksklusif (hapus role lainnya)
        newRoles = [1];
      } else {
        // Hapus Super Admin (1) jika role lain terpilih
        newRoles = newRoles.filter((r) => r !== 1);

        // Aturan Anti Pengurus Ganda (2: RT, 3: Sekre, 4: Bendahara)
        if ([2, 3, 4].includes(roleId)) {
          newRoles = newRoles.filter((r) => ![2, 3, 4].includes(r));
        }

        newRoles.push(roleId);
      }
    }

    setValue("roles", newRoles, { shouldValidate: true });
  };

  const onFormError = (formErrors: any) => {
    const keys = Object.keys(formErrors);
    if (keys.length > 0) {
      const firstMsg = formErrors[keys[0]]?.message || "Harap isi semua kolom wajib dengan benar";
      toast.error(`Periksa Input: ${firstMsg}`);
    }
  };

  const handleCreateUser = async (data: CreateUserByAdminType) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Pengguna baru berhasil ditambahkan");
        setCreatedData({
          name: data.name,
          email: data.email,
          generatedPassword: result.generatedPassword,
          emailSent: result.emailSent ?? false,
        });
      } else {
        toast.error(result.error || "Gagal menambahkan pengguna");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Berhasil disalin ke papan klip!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-heading-main">
            {createdData ? "Kredensial Pengguna Baru" : "Tambah Pengguna Baru"}
          </h3>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {createdData ? (
          /* SUCCESS VIEW (SHOW CREDENTIALS & EMAIL STATUS) */
          <div className="flex flex-col flex-1 overflow-y-auto space-y-5">
            <div className="flex flex-col items-center text-center space-y-2 pt-2">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <h3 className="text-base font-bold text-gray-heading-main">Akun Berhasil Dibuat!</h3>
              <p className="text-xs text-gray-secondary-text max-w-sm">
                Kredensial login berikut telah dibuat untuk <strong>{createdData.name}</strong>.
              </p>
            </div>

            <div className="border border-gray-border rounded-2xl bg-gray-sidebar-hover/20 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-border/60 pb-2.5">
                <div>
                  <span className="text-[10px] text-gray-placeholder font-bold uppercase tracking-wider block">Email Login</span>
                  <span className="text-sm font-semibold text-gray-heading-main font-mono">{createdData.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdData.email)}
                  className="p-1.5 text-gray-secondary-text hover:text-primary hover:bg-white rounded-lg border border-gray-border/60 bg-gray-card shadow-sm transition-all cursor-pointer"
                  title="Salin Email"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-placeholder font-bold uppercase tracking-wider block">Password Kredensial</span>
                  <span className="text-sm font-bold text-gray-heading-main font-mono tracking-wider">{createdData.generatedPassword}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdData.generatedPassword || "")}
                  className="p-1.5 text-gray-secondary-text hover:text-primary hover:bg-white rounded-lg border border-gray-border/60 bg-gray-card shadow-sm transition-all cursor-pointer"
                  title="Salin Password"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            {createdData.emailSent ? (
              <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs leading-relaxed">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <span className="font-bold block">Email Berhasil Terkirim</span>
                  Informasi kredensial login telah otomatis dikirimkan ke email (<strong>{createdData.email}</strong>).
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs leading-relaxed">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <span className="font-bold block">Pemberitahuan Email</span>
                  Email kredensial belum dapat terkirim otomatis (kendala SMTP/Brevo). **Harap salin kredensial di atas secara manual** dan berikan kepada pengguna via WhatsApp.
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 mt-auto">
              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  handleClose();
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-900 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleSubmit(handleCreateUser, onFormError)} className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable Container for Fields */}
            <div className="flex-1 overflow-y-auto pr-1.5 pb-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-placeholder">
            
              {/* Pilihan Peran / Roles Multi-Select */}
              {!fixedRoleId && (
                <div>
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Peran Akses / Role <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((r) => {
                      const isChecked = selectedRoles.includes(r.id);
                      const isNonAdminSelected = selectedRoles.some((id) => id !== 1);
                      const isSuperAdminDisabled =
                        (isSuperAdminSelected && r.id !== 1) || (!isChecked && isNonAdminSelected && r.id === 1);
                      const isOfficerDisabled =
                        !isChecked &&
                        selectedOfficerRole !== undefined &&
                        [2, 3, 4].includes(r.id);

                      const isDisabled = isSuperAdminDisabled || isOfficerDisabled;

                      return (
                        <button
                          key={r.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleRoleToggle(r.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isChecked
                              ? "bg-primary/10 border-primary text-primary shadow-sm"
                              : "bg-gray-card border-gray-border text-gray-heading-main hover:bg-gray-sidebar-hover"
                          } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                          <span>{r.name}</span>
                          {isChecked && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {errors.roles && (
                    <p className="text-xs font-semibold text-error mt-1">{errors.roles.message}</p>
                  )}
                </div>
              )}

              <FormField
                id="name"
                label="Nama Lengkap"
                type="text"
                required={true}
                placeholder="Contoh: Ahmad Raihan"
                registerProps={register("name")}
                icon={User}
                error={errors.name?.message}
              />

              <FormField
                id="email"
                label="Email"
                type="email"
                required={true}
                placeholder="name@example.com"
                registerProps={register("email")}
                icon={Mail}
                error={errors.email?.message}
              />

              <FormField
                id="password"
                label="Password Akun"
                type={showPassword ? "text" : "password"}
                required={false}
                placeholder="Opsional (Auto-generate jika dikosongkan)"
                registerProps={register("password")}
                icon={Lock}
                isPassword={true}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                error={errors.password?.message}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  id="nik"
                  label="NIK"
                  type="text"
                  required={isWargaSelected}
                  maxLength={16}
                  placeholder="16 digit NIK (misal: 3171012304950001)"
                  note={
                    isWargaSelected
                      ? "Wajib 16 digit NIK KTP untuk verifikasi kependudukan"
                      : "16 digit NIK KTP (opsional)"
                  }
                  registerProps={register("nik", {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16);
                    },
                  })}
                  icon={CreditCard}
                  error={errors.nik?.message}
                />
                <FormField
                  id="phone"
                  label="Nomor Telepon"
                  type="text"
                  required={false}
                  maxLength={15}
                  placeholder="Contoh: 081234567890"
                  registerProps={register("phone", {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 15);
                    },
                  })}
                  icon={Phone}
                  error={errors.phone?.message}
                />
              </div>

              {/* Section Kondisional Warga (Role 6) */}
              {isWargaSelected && (
                <div className="border-t border-gray-border pt-4 mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                    Informasi Kepala Keluarga & Hunian
                  </h4>

                  <FormField
                    id="familyNumber"
                    label="Nomor Kartu Keluarga (KK)"
                    type="text"
                    required={false}
                    maxLength={16}
                    placeholder="16 digit nomor KK (opsional)"
                    registerProps={register("familyNumber", {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16);
                      },
                    })}
                    icon={CreditCard}
                    error={errors.familyNumber?.message}
                  />

                  {/* Dropdown Alamat Hunian (Non-Homestay Filtered) */}
                  <div className="space-y-1">
                    {isLoadingDwellings ? (
                      <div className="flex items-center gap-2 py-2 px-3 border border-gray-border rounded-xl bg-gray-sidebar-hover text-gray-placeholder text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Memuat hunian...
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
                            options={dwellings.map((d) => ({
                              value: d.id.toString(),
                              label: d.label || `Blok ${d.blockNumber} No. ${d.houseNumber}`,
                            }))}
                            placeholder="Pilih Alamat Hunian..."
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

                  {/* Select Jenis Kelamin */}
                  <div className="space-y-1">
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          label="Jenis Kelamin"
                          required={false}
                          value={field.value || ""}
                          onChange={(val) => field.onChange(val || undefined)}
                          options={[
                            { value: "L", label: "Laki-laki" },
                            { value: "P", label: "Perempuan" },
                          ]}
                          placeholder="Pilih Jenis Kelamin..."
                        />
                      )}
                    />
                    {errors.gender && (
                      <p className="text-xs font-semibold text-error mt-0.5">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Section Kondisional Koordinator Kos (Role 5) */}
              {isCoordSelected && (
                <div className="border-t border-gray-border pt-4 mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    <span>Properti Kos Kelolaan</span>
                  </h4>

                  <div className="space-y-1">
                    {isLoadingProperties ? (
                      <div className="flex items-center gap-2 py-2 px-3 border border-gray-border rounded-xl bg-gray-sidebar-hover text-gray-placeholder text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Memuat properti kos...
                      </div>
                    ) : (
                      <Controller
                        name="rentalPropertyId"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            label="Pilih Properti Kos"
                            required={true}
                            value={field.value ? field.value.toString() : ""}
                            onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                            options={rentalProperties.map((p) => ({
                              value: p.id.toString(),
                              label: p.name,
                            }))}
                            placeholder="Pilih Properti Kos..."
                          />
                        )}
                      />
                    )}
                    {errors.rentalPropertyId && (
                      <p className="text-xs font-semibold text-error mt-0.5">
                        {errors.rentalPropertyId.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-border pt-4 mt-4 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-gray-border px-4 py-2 text-sm font-semibold text-gray-heading-main hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-900 transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Simpan Pengguna</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
