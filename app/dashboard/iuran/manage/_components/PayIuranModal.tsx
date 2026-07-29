"use client";

import React, { useState } from "react";
import { X, Loader2, Wallet } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { FeePaymentItem, PAYMENT_METHOD_OPTIONS } from "../../types";
import { toast } from "sonner";

interface PayIuranModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payment: FeePaymentItem | null;
}

export const PayIuranModal: React.FC<PayIuranModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  payment,
}) => {
  const [amountPaid, setAmountPaid] = useState<string>(
    payment ? String(payment.amountDue) : ""
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !payment) return null;

  const numericAmount = Number(amountPaid.replace(/[^0-9]/g, ""));
  const willBeFullyPaid = numericAmount >= payment.amountDue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!numericAmount || numericAmount <= 0) {
      toast.error("Nominal bayar harus lebih dari 0");
      return;
    }

    if (numericAmount > payment.amountDue) {
      toast.error(`Nominal bayar tidak boleh melebihi sisa tagihan (Rp ${payment.amountDue.toLocaleString("id-ID")})`);
      return;
    }

    if (!paymentDate) {
      toast.error("Tanggal bayar wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/iuran/payments/${payment.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: numericAmount,
          paymentMethod,
          paymentDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencatat pembayaran");

      toast.success(data.message);
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
      <div className="relative w-full max-w-md rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-heading-main flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            Catat Pembayaran Iuran
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info KK */}
        <div className="p-3 rounded-xl bg-gray-sidebar-hover border border-gray-border mb-4">
          <p className="text-xs font-bold text-gray-heading-main">{payment.headName}</p>
          <p className="text-[10px] text-gray-secondary-text font-mono mt-0.5">{payment.familyNumber} · Blok {payment.dwellingBlock} / No. {payment.dwellingHouse}</p>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <p className="text-[10px] text-gray-secondary-text font-semibold">Periode</p>
              <p className="text-xs font-bold text-gray-heading-main">{payment.period}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-secondary-text font-semibold">Total Tagihan</p>
              <p className="text-xs font-bold text-gray-heading-main font-mono">Rp {payment.amountBilled.toLocaleString("id-ID")}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-secondary-text font-semibold">Sudah Dibayar</p>
              <p className="text-xs font-bold text-emerald-700 font-mono">Rp {payment.amountPaid.toLocaleString("id-ID")}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-secondary-text font-semibold">Sisa Tagihan</p>
              <p className="text-xs font-bold text-rose-700 font-mono">Rp {payment.amountDue.toLocaleString("id-ID")}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nominal */}
          <div>
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Nominal Uang Diterima (Rp)<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              max={payment.amountDue}
              required
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main font-mono font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <div className="flex gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setAmountPaid(String(payment.amountDue))}
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                Bayar Lunas (Rp {payment.amountDue.toLocaleString("id-ID")})
              </button>
            </div>
          </div>

          {/* Metode & Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <CustomSelect
                label="Metode Pembayaran"
                required
                options={PAYMENT_METHOD_OPTIONS}
                value={paymentMethod}
                onChange={setPaymentMethod}
                placeholder="Pilih Metode"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Tanggal Bayar<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Preview status */}
          {numericAmount > 0 && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${willBeFullyPaid ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-amber-50 border border-amber-200 text-amber-800"}`}>
              {willBeFullyPaid
                ? "✅ Setelah pembayaran ini, tagihan akan berstatus LUNAS."
                : `⚠️ Setelah pembayaran ini, masih ada sisa Rp ${(payment.amountDue - numericAmount).toLocaleString("id-ID")} (status: Kurang Bayar).`}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-gray-border pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-border rounded-xl text-xs font-bold text-gray-heading-main hover:bg-gray-sidebar-hover transition cursor-pointer">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Simpan Pembayaran</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
