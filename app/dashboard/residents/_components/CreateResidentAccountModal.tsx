"use client";

import React, { useState, useEffect } from "react";
import { X, Mail, Lock, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";

interface CreateResidentAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FamilyMemberOption {
  id: number;
  name: string;
  nik: string;
}

export const CreateResidentAccountModal: React.FC<CreateResidentAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [availableHeads, setAvailableHeads] = useState<FamilyMemberOption[]>([]);
  const [isLoadingHeads, setIsLoadingHeads] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedNik, setSelectedNik] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const selectedHead = availableHeads.find(h => h.nik === selectedNik);

  useEffect(() => {
    if (!isOpen) return;

    const fetchAvailableHeads = async () => {
      setIsLoadingHeads(true);
      try {
        const res = await fetch("/api/family-members/without-account");
        if (res.ok) {
          const data = await res.json();
          setAvailableHeads(data);
        } else {
          toast.error("Gagal memuat daftar Kepala Keluarga.");
        }
      } catch (err) {
        console.error("Gagal memuat daftar warga:", err);
        toast.error("Terjadi kesalahan sistem saat memuat data warga.");
      } finally {
        setIsLoadingHeads(false);
      }
    };

    fetchAvailableHeads();
  }, [isOpen]);

  const handleClose = () => {
    setSelectedNik("");
    setEmail("");
    setPassword("");
    onClose();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedNik) {
      toast.error("Silakan pilih warga Kepala Keluarga.");
      return;
    }
    if (!email) {
      toast.error("Email wajib diisi.");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }
    if (!selectedHead) {
      toast.error("Kepala Keluarga tidak valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create user account via Next API (which calls createUserWithAccount to handle Auto-Link via NIK)
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: 6, // Warga role
          name: selectedHead.name, // Use the physical name
          email,
          password,
          nik: selectedHead.nik, // Auto-Link key
        }),
      });

      if (res.ok) {
        toast.success("Akun berhasil dibuat dan ditautkan ke data keluarga!");
        onSuccess();
        handleClose();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal membuat akun.");
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Gagal membuat akun warga");
    } finally {
      setIsSubmitting(false);
    }
  };

  const headOptions: SelectOption[] = availableHeads.map((h) => ({
    value: h.nik,
    label: `${h.name} (NIK: ${h.nik})`,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-heading-main">
                Buat Akun Perwakilan Keluarga
              </h3>
              <p className="text-xs text-gray-secondary-text mt-0.5">
                Pilih Kepala Keluarga yang sudah terdata untuk dibuatkan akses login
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1.5 pb-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-placeholder">
            
            {/* 1. Pilih Kepala Keluarga */}
            <div>
              {isLoadingHeads ? (
                <div className="flex items-center gap-2 py-2.5 px-3.5 border border-gray-border rounded-xl bg-gray-sidebar-hover text-gray-placeholder text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Memuat daftar Kepala Keluarga...
                </div>
              ) : headOptions.length === 0 ? (
                <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl text-xs text-amber-900">
                  <strong>Tidak ada data tersedia.</strong> Semua Kepala Keluarga saat ini sudah memiliki akun, atau belum ada data Kepala Keluarga fisik yang didaftarkan.
                </div>
              ) : (
                <CustomSelect
                  label="Pilih Kepala Keluarga"
                  required={true}
                  value={selectedNik}
                  onChange={setSelectedNik}
                  options={headOptions}
                  placeholder="Cari berdasarkan nama atau NIK..."
                />
              )}
            </div>

            {selectedHead && (
              <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3.5 flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-secondary-text">Terpilih:</span>
                  <span className="font-bold text-gray-heading-main">{selectedHead.name}</span>
                </div>

                <FormField
                  id="email"
                  label="Email Warga"
                  type="email"
                  required={true}
                  placeholder="Alamat email aktif"
                  registerProps={{
                    value: email,
                    onChange: (e: any) => setEmail(e.target.value),
                  }}
                  icon={Mail}
                />
                
                <FormField
                  id="password"
                  label="Password"
                  type="text" // Show password by default for admin convenience
                  required={true}
                  placeholder="Minimal 6 karakter"
                  registerProps={{
                    value: password,
                    onChange: (e: any) => setPassword(e.target.value),
                  }}
                  icon={Lock}
                />
              </div>
            )}
            
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
              disabled={isSubmitting || isLoadingHeads || !selectedNik}
              className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-900 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Membuat Akun...</span>
                </>
              ) : (
                <span>Buat Akun & Tautkan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
