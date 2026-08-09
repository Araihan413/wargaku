"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { CoordinatorItem } from "./CoordinatorTable";

const editCoordinatorSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid").max(100),
  phone: z.string().min(10, "Nomor HP minimal 10 digit").max(15).optional().nullable().or(z.literal("")),
});

type EditCoordinatorInput = z.infer<typeof editCoordinatorSchema>;

interface EditCoordinatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  coordinator: CoordinatorItem | null;
}

export const EditCoordinatorModal: React.FC<EditCoordinatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  coordinator,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditCoordinatorInput>({
    resolver: zodResolver(editCoordinatorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  // Pre-populate form data when coordinator changes
  useEffect(() => {
    if (coordinator && isOpen) {
      reset({
        name: coordinator.name,
        email: coordinator.email,
        phone: coordinator.phone || "",
      });
    }
  }, [coordinator, isOpen, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: EditCoordinatorInput) => {
    if (!coordinator) return;
    try {
      const res = await fetch(`/api/users/${coordinator.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_profile",
          payload: {
            ...data,
            roleId: 5, // Coordinator role remains 5
          },
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal memperbarui data koordinator");
      }

      toast.success(result.message || "Data koordinator berhasil diperbarui");
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    }
  };

  if (!isOpen || !coordinator) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-card border border-gray-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-gray-heading-main">
              Edit Data Koordinator
            </h2>
          </div>
          {!isSubmitting && (
            <button
              onClick={handleClose}
              className="text-gray-placeholder hover:text-gray-heading-main p-1.5 rounded-lg hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Nama Lengkap <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  disabled={isSubmitting}
                  {...register("name")}
                  placeholder="Nama sesuai KTP"
                  className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                />
                {errors.name && <p className="text-[10px] text-red-500 font-semibold">{errors.name.message}</p>}
              </div>


              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  readOnly
                  className={`w-full bg-gray-sidebar-hover border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-placeholder focus:outline-none transition-all cursor-not-allowed`}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="text"
                  disabled={isSubmitting}
                  {...register("phone")}
                  placeholder="Contoh: 08123456789"
                  className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                />
                {errors.phone && <p className="text-[10px] text-red-500 font-semibold">{errors.phone.message}</p>}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end border-t border-gray-border px-6 py-4 shrink-0 gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="px-5 py-2.5 bg-gray-sidebar-hover hover:bg-gray-border/50 border border-gray-border rounded-xl text-xs font-semibold text-gray-heading-main cursor-pointer transition-all disabled:opacity-50"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
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
