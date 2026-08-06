"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, User, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { DwellingOption, UserOption } from "../types";

interface AddKKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddKKModal: React.FC<AddKKModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dwellings, setDwellings] = useState<DwellingOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [headUserId, setHeadUserId] = useState("");
  const [familyNumber, setFamilyNumber] = useState("");
  const [dwellingId, setDwellingId] = useState("");
  const [headNik, setHeadNik] = useState("");

  const selectedUser = users.find((u) => u.id === headUserId);

  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const resDwellings = await fetch("/api/dwellings");
        const dataDwellings = resDwellings.ok ? await resDwellings.json() : [];
        const validKkDwellings = Array.isArray(dataDwellings)
          ? dataDwellings.filter((d: any) => d.type !== "homestay")
          : [];
        setDwellings(validKkDwellings);

        const resUsers = await fetch("/api/users?limit=100&status=active&withoutFamily=true");
        if (resUsers.ok) {
          const dataUsers = await resUsers.json();
          setUsers(dataUsers.users || []);
        }
      } catch (err) {
        console.error("Gagal memuat opsi form:", err);
        toast.error("Gagal memuat daftar hunian atau warga.");
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [isOpen]);

  const handleClose = () => {
    setHeadUserId("");
    setFamilyNumber("");
    setDwellingId("");
    setHeadNik("");
    onClose();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!headUserId) {
      toast.error("Silakan pilih akun Kepala Keluarga.");
      return;
    }
    if (selectedUser && !selectedUser.nik && (!headNik || headNik.trim().length < 16)) {
      toast.error("NIK Kepala Keluarga wajib 16 digit.");
      return;
    }
    if (!familyNumber || familyNumber.trim().length < 16) {
      toast.error("Nomor Kartu Keluarga (KK) wajib 16 digit.");
      return;
    }
    if (!dwellingId) {
      toast.error("Silakan pilih hunian / alamat rumah.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        headUserId,
        headName: selectedUser?.name,
        familyNumber: familyNumber.trim(),
        dwellingId: Number(dwellingId),
        nik: selectedUser?.nik || headNik.trim() || undefined,
      };

      const res = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Kartu Keluarga berhasil terdaftar!");
        onSuccess();
        handleClose();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mendaftarkan Kartu Keluarga.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem saat menyimpan Kartu Keluarga.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dwellingSelectOptions: SelectOption[] = dwellings.map((d: any) => ({
    value: d.id.toString(),
    label: d.label || `Blok ${d.blockNumber} No. ${d.houseNumber} (${d.type === "kos" ? "Rumah Kost" : "Rumah Permanen"})`,
  }));

  const userSelectOptions: SelectOption[] = users.map((u) => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }));

  if (!isOpen) return null;

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
                Daftarkan Kartu Keluarga Baru
              </h3>
              <p className="text-xs text-gray-secondary-text mt-0.5">
                Pilih akun warga & isi data wajib KK untuk mendaftarkan keluarga baru
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

        {/* Modal Body / Form dengan Scroll Rapih */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1.5 pb-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-placeholder">
            
            {/* 1. Pilih Akun Kepala Keluarga */}
            <div>
              {isLoadingOptions ? (
                <div className="flex items-center gap-2 py-2.5 px-3.5 border border-gray-border rounded-xl bg-gray-sidebar-hover text-gray-placeholder text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Memuat daftar warga tanpa KK...
                </div>
              ) : (
                <CustomSelect
                  label="Akun Kepala Keluarga"
                  required={true}
                  value={headUserId}
                  onChange={setHeadUserId}
                  options={userSelectOptions}
                  placeholder="Pilih Akun Pengguna Kepala Keluarga..."
                />
              )}
            </div>

            {/* Informational Readonly Account Card saat akun dipilih */}
            {selectedUser && (
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-3.5 space-y-1.5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-secondary-text">Nama Kepala Keluarga:</span>
                  <span className="font-bold text-gray-heading-main">{selectedUser.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-secondary-text">NIK Terdaftar:</span>
                  <span className="font-mono font-bold text-primary">{selectedUser.nik || "-"}</span>
                </div>
              </div>
            )}

            {/* 2. Field NIK Kepala Keluarga (Hanya jika NIK pada akun terpilih belum terdaftar) */}
            {selectedUser && !selectedUser.nik && (
              <FormField
                id="headNik"
                label="NIK Kepala Keluarga"
                type="text"
                required={true}
                maxLength={16}
                placeholder="16 digit NIK KTP Kepala Keluarga"
                registerProps={{
                  value: headNik,
                  onChange: (e: any) => setHeadNik(e.target.value.replace(/\D/g, "")),
                }}
                icon={User}
              />
            )}

            {/* 3. Field Nomor Kartu Keluarga (KK) */}
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

            {/* 4. Field Alamat Rumah / Hunian */}
            <div>
              {isLoadingOptions ? (
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
                  options={dwellingSelectOptions}
                  placeholder="Pilih Alamat Hunian Rumah..."
                />
              )}
            </div>

          </div>

          {/* Footer Actions Fixed */}
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
              disabled={isSubmitting || isLoadingOptions}
              className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-900 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <span>Daftarkan KK</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
