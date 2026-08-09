"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Receipt, Calendar, Wallet } from "lucide-react";

export function WargaFeeWidget() {
  const [feeData, setFeeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchFees() {
      try {
        const res = await fetch("/api/warga/fees");
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setFeeData(json);
        }
      } catch (err) {
        console.error("Error fetching warga fee widget data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchFees();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || !feeData) return null;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isCurrentMonthPaid = feeData.currentMonthRemaining === 0;

  return (
    <div className="rounded-3xl border border-gray-border bg-gray-card p-6 shadow-sm space-y-4 transition-all">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center justify-between border-b border-gray-border pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-heading-main">
              Ringkasan Status Iuran Keluarga ({feeData.currentPeriod})
            </h3>
            <p className="text-[11px] text-gray-secondary-text">
              Status pencatatan iuran dari Bendahara RT
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/my-fees"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Pantau Histori &rarr;</span>
        </Link>
      </div>

      {/* Grid 2 Kolom Bersebelahan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kolom 1: Sisa Tagihan Bulan Ini */}
        <div
          className={`rounded-2xl border p-4.5 flex items-start gap-3.5 transition-all ${
            isCurrentMonthPaid
              ? "border-emerald-200 bg-emerald-50/40"
              : "border-rose-200 bg-rose-50/40"
          }`}
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
              isCurrentMonthPaid
                ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                : "bg-rose-100 text-rose-700 border-rose-300"
            }`}
          >
            {isCurrentMonthPaid ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-secondary-text truncate">
                Sisa Tagihan Bulan Ini
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                  isCurrentMonthPaid
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-rose-100 text-rose-800 border-rose-300"
                }`}
              >
                {isCurrentMonthPaid ? "Lunas" : "Belum Lunas"}
              </span>
            </div>
            <div className={`text-xl font-black ${isCurrentMonthPaid ? "text-emerald-700" : "text-rose-700"}`}>
              {formatRupiah(feeData.currentMonthRemaining)}
            </div>
            <p className="text-[11px] text-gray-secondary-text">
              {isCurrentMonthPaid
                ? "Iuran bulan ini telah lunas 🟢"
                : `Total sisa tagihan tunggakan: ${formatRupiah(feeData.totalUnpaidBalance)}`}
            </p>
          </div>
        </div>

        {/* Kolom 2: Setoran Terakhir Dicatat */}
        <div className="rounded-2xl border border-gray-border bg-gray-sidebar-hover/40 p-4.5 flex items-start gap-3.5 transition-all">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 border border-blue-200">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-secondary-text truncate">
                Setoran Terakhir Dicatat
              </span>
              {feeData.lastPaymentDate && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                  {formatDate(feeData.lastPaymentDate)}
                </span>
              )}
            </div>
            <div className="text-xl font-black text-gray-heading-main">
              {feeData.lastPaymentAmount > 0 ? formatRupiah(feeData.lastPaymentAmount) : "-"}
            </div>
            <p className="text-[11px] text-gray-secondary-text">
              {feeData.lastPaymentDate
                ? `Setoran pada ${formatDate(feeData.lastPaymentDate)} oleh Bendahara RT`
                : "Belum ada riwayat setoran tercatat"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
