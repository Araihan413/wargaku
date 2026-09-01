"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { CurrencyInput } from "@/components/CurrencyInput";
import { FeeRule } from "../../types";
import { toast } from "sonner";

interface AddFeeRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingRule?: FeeRule | null;
}

export const AddFeeRuleModal: React.FC<AddFeeRuleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingRule = null,
}) => {
  const isEdit = !!existingRule;
  const [name, setName] = useState(existingRule?.name || "");
  const [amount, setAmount] = useState(existingRule ? String(existingRule.amount) : "");
  const [isActive, setIsActive] = useState(existingRule?.isActive !== false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount.replace(/[^0-9]/g, ""));
    if (!name.trim()) {
      toast.error("Nama iuran wajib diisi");
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Nominal iuran harus lebih dari 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/fee-rules/${existingRule!.id}` : "/api/fee-rules";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: numericAmount,
          isMandatory: true,
          ...(isEdit ? { isActive } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan aturan iuran");

      toast.success(isEdit ? "Aturan iuran berhasil diperbarui!" : "Aturan iuran berhasil dibuat dan tagihan bulan ini di-generate!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-heading-main">
            {isEdit ? "Edit Aturan Iuran" : "Buat Aturan Iuran Baru"}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Nama Iuran<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Iuran Kebersihan Bulanan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <CurrencyInput
            label="Nominal per KK / Bulan"
            required
            value={amount}
            onChange={setAmount}
            placeholder="50.000"
          />

          {isEdit && (
            <div>
              <CustomSelect
                label="Status Aturan Iuran"
                required
                options={[
                  { label: "Aktif (Otomatis ditagihkan setiap bulan)", value: "true" },
                  { label: "Non-Aktif (Dihentikan)", value: "false" },
                ]}
                value={isActive ? "true" : "false"}
                onChange={(v) => setIsActive(v === "true")}
                placeholder="Pilih Status"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-gray-border pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-border rounded-xl text-xs font-bold text-gray-heading-main hover:bg-gray-sidebar-hover transition cursor-pointer">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isEdit ? "Simpan Perubahan" : "Buat & Generate Tagihan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
