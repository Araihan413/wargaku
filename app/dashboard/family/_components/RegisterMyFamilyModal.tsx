"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Home, CreditCard, User } from "lucide-react";
import { toast } from "sonner";
import { CustomSelect } from "@/components/CustomSelect";
import { FormField } from "@/components/FormField";

interface RegisterMyFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userName?: string;
  userNik?: string;
}

interface DwellingOption {
  id: number;
  label: string;
}

export function RegisterMyFamilyModal({
  isOpen,
  onClose,
  onSuccess,
  userName,
  userNik,
}: RegisterMyFamilyModalProps) {
  const [nik, setNik] = useState(userNik || "");
  const [familyNumber, setFamilyNumber] = useState("");
  const [dwellingId, setDwellingId] = useState("");
  const [dwellings, setDwellings] = useState<DwellingOption[]>([]);
  const [isLoadingDwellings, setIsLoadingDwellings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchDwellings() {
      setIsLoadingDwellings(true);
      try {
        const res = await fetch("/api/dwellings");

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const validKkDwellings = data.filter((d: any) => d.type !== 'homestay');
            setDwellings(
              validKkDwellings.map((d: any) => ({
                id: d.id,
                label: `Blok ${d.blockNumber} No. ${d.houseNumber} (${d.type === 'kos' ? 'Rumah Kost' : 'Rumah Permanen'})`,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data hunian:", err);
      } finally {
        setIsLoadingDwellings(false);
      }
    }

    fetchDwellings();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nik || nik.trim().length < 16) {
      toast.error("NIK Kepala Keluarga wajib 16 digit.");
      return;
    }
    if (!familyNumber || familyNumber.trim().length < 16) {
      toast.error("Nomor Kartu Keluarga (KK) wajib 16 digit.");
      return;
    }
    if (!dwellingId) {
      toast.error("Silakan pilih hunian / alamat rumah Anda.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/families/my-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dwellingId: Number(dwellingId),
          familyNumber: familyNumber.trim(),
          nik: nik.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Kartu Keluarga Anda berhasil didaftarkan!");
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mendaftarkan Kartu Keluarga.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header Fixed */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Home className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-heading-main">
                Daftarkan Kartu Keluarga Saya
              </h3>
              <p className="text-xs text-gray-secondary-text mt-0.5">
                Lengkapi data wajib KK untuk mengaktifkan akses Kepala Keluarga
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form dengan Scroll Rapih */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1.5 pb-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-placeholder">
            {/* Informational Readonly Account Card */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-secondary-text">Kepala Keluarga:</span>
                <span className="font-bold text-gray-heading-main">{userName || "Akun Anda"}</span>
              </div>
            </div>

            {/* Field NIK Kepala Keluarga */}
            <FormField
              id="nik"
              label="NIK Kepala Keluarga"
              type="text"
              required={true}
              maxLength={16}
              placeholder="16 digit NIK Kepala Keluarga"
              registerProps={{
                value: nik,
                onChange: (e: any) => setNik(e.target.value.replace(/\D/g, "")),
              }}
              icon={User}
            />

            {/* Field Nomor Kartu Keluarga (KK) */}
            <FormField
              id="familyNumber"
              label="Nomor Kartu Keluarga (KK)"
              type="text"
              required={true}
              maxLength={16}
              placeholder="16 digit Nomor Kartu Keluarga"
              registerProps={{
                value: familyNumber,
                onChange: (e: any) => setFamilyNumber(e.target.value.replace(/\D/g, "")),
              }}
              icon={CreditCard}
            />

            {/* Field Alamat Rumah / Hunian */}
            <div>
              {isLoadingDwellings ? (
                <div className="flex items-center gap-2 py-2.5 px-3.5 border border-gray-border rounded-xl bg-gray-sidebar-hover text-gray-placeholder text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Memuat daftar hunian RT...
                </div>
              ) : (
                <CustomSelect
                  label="Alamat Rumah / Hunian"
                  required={true}
                  value={dwellingId}
                  onChange={setDwellingId}
                  options={dwellings.map((d) => ({
                    value: String(d.id),
                    label: d.label,
                  }))}
                  placeholder="Pilih Alamat Hunian Rumah..."
                />
              )}
            </div>
          </div>

          {/* Footer Actions Fixed */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-border pt-4 mt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-sm font-semibold text-gray-secondary-text cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingDwellings}
              className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-900 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <span>Simpan & Aktifkan KK</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
