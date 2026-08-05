"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Home } from "lucide-react";
import { toast } from "sonner";
import { CustomSelect } from "@/components/CustomSelect";

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
  const [dwellingId, setDwellingId] = useState("");
  const [familyNumber, setFamilyNumber] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
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
            // Filter: Homestay (sewa harian) bukan tempat tinggal Kartu Keluarga (KK)
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

    if (!dwellingId) {
      toast.error("Silakan pilih hunian / alamat rumah Anda.");
      return;
    }
    if (!familyNumber || familyNumber.trim().length < 16) {
      toast.error("Nomor Kartu Keluarga (KK) wajib 16 digit.");
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
          unitNumber: unitNumber.trim() || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-gray-card border border-gray-border p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-heading-main">
                Daftarkan Kartu Keluarga Saya
              </h3>
              <p className="text-xs text-gray-secondary-text">
                Lengkapi data KK Anda untuk mengaktifkan akses Warga
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Readonly User Info */}
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-secondary-text">Kepala Keluarga:</span>
              <span className="font-bold text-gray-heading-main">{userName || "Akun Anda"}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-secondary-text">NIK Terdaftar:</span>
              <span className="font-mono font-bold text-primary">{userNik || "-"}</span>
            </div>
          </div>

          {/* Nomor KK Field */}
          <div>
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Nomor Kartu Keluarga (KK) <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={16}
              value={familyNumber}
              onChange={(e) => setFamilyNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="3171012345678901 (16 digit)"
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm font-mono text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Dwelling Dropdown */}
          <div>
            <CustomSelect
              label="Alamat / Hunian Rumah"
              required
              value={dwellingId}
              onChange={setDwellingId}
              options={dwellings.map((d) => ({
                value: String(d.id),
                label: d.label,
              }))}
            />
          </div>

          {/* Nomor Unit Field (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Nomor Unit / Kavling / Kamar
            </label>
            <input
              type="text"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              placeholder="Contoh: Unit A-02 atau Kamar 1"
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-gray-border text-xs font-semibold text-gray-heading-main hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingDwellings}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
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
