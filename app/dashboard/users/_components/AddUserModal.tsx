import React, { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { createUserSchema, CreateUserType } from "@/lib/validations/user";
import { FormField } from "@/components/FormField";
import { RoleItem } from "../types";
import { CustomSelect } from "@/components/CustomSelect";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roles: RoleItem[];
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  roles,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserType>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      nik: "",
      phone: "",
      roleId: 6,
      status: "active",
    },
  });

  const handleClose = () => {
    reset();
    setShowPassword(false);
    onClose();
  };

  const handleCreateUser = async (data: CreateUserType) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Pengguna baru berhasil ditambahkan secara manual");
        reset();
        setShowPassword(false);
        onSuccess();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Gagal menambahkan pengguna");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-heading-main">
            Tambah Pengguna Baru
          </h3>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit(handleCreateUser)} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Container for Fields */}
          <div className="flex-1 overflow-y-auto pr-1.5 pb-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-placeholder">
            <FormField
              id="name"
              label="Nama Lengkap"
              type="text"
              placeholder="Contoh: Ahmad Raihan"
              registerProps={register("name")}
              icon={User}
              error={errors.name?.message}
            />

            <FormField
              id="email"
              label="Email"
              type="email"
              placeholder="name@example.com"
              registerProps={register("email")}
              icon={Mail}
              error={errors.email?.message}
            />

            <FormField
              id="password"
              label="Password Akun"
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 6 karakter"
              registerProps={register("password")}
              icon={Lock}
              isPassword={true}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              error={errors.password?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                id="nik"
                label="NIK (Opsional)"
                type="text"
                placeholder="16 digit NIK"
                registerProps={register("nik")}
                icon={CreditCard}
                error={errors.nik?.message}
              />
              <FormField
                id="phone"
                label="Telepon (Opsional)"
                type="text"
                placeholder="Contoh: 081234567890"
                registerProps={register("phone")}
                icon={Phone}
                error={errors.phone?.message}
              />
            </div>

            {/* Pilihan Peran */}
            <div>
              <label className="block text-xs font-bold text-gray-heading-main uppercase tracking-wider mb-2">
                Peran Akses / Role
              </label>
              <Controller
                control={control}
                name="roleId"
                render={({ field }) => (
                  <CustomSelect
                    value={field.value.toString()}
                    onChange={(val) => field.onChange(val ? parseInt(val, 10) : 6)}
                    options={roles.map((r) => ({
                      value: r.id.toString(),
                      label: r.name,
                    }))}
                    placeholder="Pilih Peran Akses"
                  />
                )}
              />
              {errors.roleId && (
                <p className="text-xs text-error mt-1">{errors.roleId.message}</p>
              )}
            </div>
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
      </div>
    </div>
  );
};
