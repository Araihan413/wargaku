"use client";

import React, { useState } from "react";
import { X, Loader2, Wallet, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { CurrencyInput } from "@/components/CurrencyInput";
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
  const monthlyRate = Number(payment?.ruleMonthlyAmount ?? payment?.amountBilled ?? 0);

  const [amountPaid, setAmountPaid] = useState<string>(() => {
    if (!payment) return "";
    const defaultNominal = payment.amountDue > 0 ? payment.amountDue : monthlyRate;
    return String(defaultNominal);
  });
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !payment) return null;

  const numericAmount = Number(amountPaid.replace(/[^0-9]/g, ""));
  const totalArrears = payment.totalArrears && payment.totalArrears > 0 ? payment.totalArrears : payment.amountDue;
  const unpaidCount = payment.unpaidMonthsCount && payment.unpaidMonthsCount > 0 ? payment.unpaidMonthsCount : (payment.status !== "paid" ? 1 : 0);
  const pastArrearsCount = payment.pastArrearsCount || 0;

  // Hitung simulasi alokasi bulan
  const calculateAllocation = () => {
    if (numericAmount <= 0) return { monthsCount: 0, previewList: [] };

    let money = numericAmount;
    const previewList: { period: string; type: "arrears" | "current" | "advance"; amount: number; isFull: boolean }[] = [];

    const now = new Date();
    const currentPeriodStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // 1. Alokasikan ke tagihan yang belum lunas (termasuk tunggakan lampau, bulan ini, maupun sisa parsial advance)
    const existingUnpaidBills = payment.unpaidBills && payment.unpaidBills.length > 0
      ? payment.unpaidBills
      : (payment.status !== "paid" ? [{ period: payment.period, amountBilled: monthlyRate, amountPaid: 0, amountDue: payment.amountDue > 0 ? payment.amountDue : monthlyRate }] : []);

    for (const bill of existingUnpaidBills) {
      if (money <= 0) break;
      const due = bill.amountDue;
      const periodType = bill.period < currentPeriodStr ? "arrears" : bill.period === currentPeriodStr ? "current" : "advance";

      if (money >= due) {
        previewList.push({
          period: bill.period,
          type: periodType,
          amount: due,
          isFull: true,
        });
        money -= due;
      } else {
        previewList.push({
          period: bill.period,
          type: periodType,
          amount: money,
          isFull: false,
        });
        money = 0;
      }
    }

    // 2. Jika masih ada sisa, alokasikan ke bulan-bulan depan (Advance)
    const latestKnownPeriod = existingUnpaidBills.length > 0
      ? existingUnpaidBills[existingUnpaidBills.length - 1].period
      : (payment.paidUntilPeriod && payment.paidUntilPeriod >= currentPeriodStr ? payment.paidUntilPeriod : (payment.period !== "Semua Periode" ? payment.period : currentPeriodStr));

    let lastP = previewList.length > 0 ? previewList[previewList.length - 1].period : latestKnownPeriod;

    while (money > 0) {
      const [y, m] = lastP.split("-").map(Number);
      const nextDate = new Date(y, m, 1);
      lastP = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

      if (money >= monthlyRate) {
        previewList.push({
          period: lastP,
          type: "advance",
          amount: monthlyRate,
          isFull: true,
        });
        money -= monthlyRate;
      } else {
        previewList.push({
          period: lastP,
          type: "advance",
          amount: money,
          isFull: false,
        });
        money = 0;
      }
    }

    return {
      monthsCount: previewList.length,
      previewList,
    };
  };

  const allocation = calculateAllocation();

  const handlePresetClick = (months: number) => {
    setAmountPaid(String(monthlyRate * months));
  };

  const handlePayAllArrears = () => {
    setAmountPaid(String(totalArrears));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!numericAmount || numericAmount <= 0) {
      toast.error("Nominal bayar harus lebih dari 0");
      return;
    }

    if (!paymentDate) {
      toast.error("Tanggal bayar wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/fee-payments/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: payment.familyId,
          feeRuleId: payment.feeRuleId,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-gray-border bg-gray-card shadow-2xl overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-center justify-between border-b border-gray-border px-5 py-4 shrink-0 bg-gray-card">
          <div>
            <h3 className="text-base font-bold text-gray-heading-main flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600 shrink-0" />
              Catat Pembayaran Iuran
            </h3>
            <p className="text-[11px] text-gray-placeholder mt-0.5">
              {payment.feeRuleName.toLowerCase().startsWith("iuran") ? payment.feeRuleName : `Iuran ${payment.feeRuleName}`} · Rp {monthlyRate.toLocaleString("id-ID")}/bulan
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form with Scrollable Body & Sticky Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
            {/* Info KK */}
            <div className="p-3.5 rounded-xl bg-gray-sidebar-hover border border-gray-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-heading-main truncate">{payment.headName}</p>
                  <p className="text-[10px] text-gray-secondary-text font-mono truncate">
                    {payment.familyNumber} · Blok {payment.dwellingBlock} / No. {payment.dwellingHouse}
                  </p>
                </div>
                {pastArrearsCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 shrink-0 whitespace-nowrap self-start sm:self-auto">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>Nunggak {pastArrearsCount} Bulan</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 shrink-0 whitespace-nowrap self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>Status Lancar</span>
                  </span>
                )}
              </div>
            </div>

            {/* Preset Buttons (1-Click) */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-gray-secondary-text">
                Pilihan Cepat (1-Klik):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {unpaidCount > 1 && (
                  <button
                    type="button"
                    onClick={handlePayAllArrears}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    Lunasi Semua Tagihan ({unpaidCount} Bln - Rp {totalArrears.toLocaleString("id-ID")})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handlePresetClick(1)}
                  className="px-3 py-1.5 rounded-xl bg-gray-card hover:bg-gray-sidebar-hover border border-gray-border text-xs font-bold text-gray-heading-main transition cursor-pointer"
                >
                  1 Bulan
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick(3)}
                  className="px-3 py-1.5 rounded-xl bg-gray-card hover:bg-gray-sidebar-hover border border-gray-border text-xs font-bold text-gray-heading-main transition cursor-pointer"
                >
                  3 Bulan
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick(6)}
                  className="px-3 py-1.5 rounded-xl bg-gray-card hover:bg-gray-sidebar-hover border border-gray-border text-xs font-bold text-gray-heading-main transition cursor-pointer"
                >
                  6 Bulan
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick(12)}
                  className="px-3 py-1.5 rounded-xl bg-gray-card hover:bg-gray-sidebar-hover border border-gray-border text-xs font-bold text-gray-heading-main transition cursor-pointer"
                >
                  1 Tahun (12 Bln)
                </button>
              </div>
            </div>

            {/* Nominal Input */}
            <div>
              <CurrencyInput
                label="Nominal Uang Diterima"
                required
                value={amountPaid}
                onChange={setAmountPaid}
                placeholder="Masukkan nominal uang..."
              />
            </div>

            {/* Smart Allocation Preview */}
            {numericAmount > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between font-bold text-emerald-900 border-b border-emerald-200 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Melunasi {allocation.monthsCount} Periode Bulan:
                  </span>
                  <span className="font-mono">Rp {numericAmount.toLocaleString("id-ID")}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                  {allocation.previewList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-white border border-emerald-100 shadow-2xs flex flex-col justify-between text-[11px]"
                    >
                      <span className="font-bold text-gray-heading-main flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        {item.period}
                      </span>
                      <span className={`text-[10px] font-semibold ${item.type === "arrears" ? "text-amber-700" : item.type === "advance" ? "text-blue-700" : "text-emerald-700"}`}>
                        {item.type === "arrears" ? "Tunggakan" : item.type === "advance" ? "Di Muka" : "Bulan Ini"} ({item.isFull ? "Lunas" : `Rp ${item.amount.toLocaleString("id-ID")}`})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metode & Tanggal Bayar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <CustomSelect
                  label="Metode Bayar"
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
          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-border px-5 py-3.5 bg-gray-card shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-border rounded-xl text-xs font-bold text-gray-heading-main hover:bg-gray-sidebar-hover transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numericAmount <= 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  <span>
                    Simpan Pembayaran {allocation.monthsCount > 0 ? `(${allocation.monthsCount} Bulan)` : ""}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
