"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  CreditCard,
  Building,
  Info,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/PermissionGuard";
import { RefreshButton } from "@/components/RefreshButton";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";

interface ActiveRule {
  id: number;
  name: string;
  amount: number;
  isMandatory: boolean;
}

interface FeeHistoryItem {
  id: number;
  feeRuleId: number;
  feeRuleName: string;
  period: string;
  amountBilled: number;
  amountPaid: number;
  paymentDate: string | null;
  paymentMethod: "cash" | "transfer" | null;
  status: "unpaid" | "partially_paid" | "paid";
  isMandatory: boolean;
  recordedByName: string | null;
  createdAt: string;
}

interface WargaFeeData {
  hasFamily: boolean;
  familyId: number | null;
  familyNumber: string | null;
  currentPeriod: string;
  currentMonthStatus: "paid" | "partially_paid" | "unpaid";
  currentMonthBilled: number;
  currentMonthPaid: number;
  currentMonthRemaining: number;
  previousMonthsUnpaidBalance: number;
  totalUnpaidBalance: number;
  totalPaidThisYear: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number;
  lastPaymentStatus: string | null;
  activeRules: ActiveRule[];
  history: FeeHistoryItem[];
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: "all", label: "Semua Status" },
  { value: "paid", label: "Lunas (Terverifikasi)" },
  { value: "partially_paid", label: "Terbayar Sebagian" },
  { value: "unpaid", label: "Belum Ada Catatan" },
];

export default function WargaMyFeesPage() {
  return (
    <PermissionGuard requiredPermission="view-my-fees">
      <WargaMyFeesContent />
    </PermissionGuard>
  );
}

function WargaMyFeesContent() {
  const [data, setData] = useState<WargaFeeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/warga/fees");
      const result = await res.json();
      if (res.ok) {
        setData(result);
      } else {
        toast.error(result.error || "Gagal memuat data iuran warga");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi sistem");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const res = await fetch("/api/warga/fees");
        const result = await res.json();
        if (isMounted) {
          if (res.ok) {
            setData(result);
          } else {
            toast.error(result.error || "Gagal memuat data iuran warga");
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          toast.error("Terjadi kesalahan koneksi sistem");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatPeriodLabel = (periodStr: string) => {
    if (!periodStr || !periodStr.includes("-")) return periodStr;
    const [year, month] = periodStr.split("-");
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${monthNames[mIdx] || month} ${year}`;
  };

  // Filter history
  const filteredHistory = (data?.history || []).filter((h) => {
    if (yearFilter !== "all" && !h.period.startsWith(yearFilter)) return false;
    if (statusFilter !== "all" && h.status !== statusFilter) return false;
    return true;
  });

  const availableYears: SelectOption[] = [
    { value: "all", label: "Semua Tahun" },
    { value: "2026", label: "Tahun 2026" },
    { value: "2025", label: "Tahun 2025" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-border pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-heading-main flex items-center gap-2.5">
            Status & Histori Iuran Warga
          </h1>
          <p className="text-xs text-gray-secondary-text mt-1">
            Pantau catatan kelunasan dan riwayat pembayaran iuran keluarga yang telah dicatat oleh Bendahara RT.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <RefreshButton onClick={handleRefresh} isLoading={isLoading} />
        </div>
      </div>

      {/* Info Banner Strict Read-Only */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm text-xs text-blue-900 leading-relaxed">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-blue-950">Informasi Pembayaran Iuran Warga</h4>
          <p className="mt-0.5">
            Pembayaran iuran dilakukan secara langsung ke Bendahara RT. Setelah pembayaran Anda diterima pengurus RT akan mencatatnya.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-medium text-gray-placeholder">Memuat data iuran...</span>
        </div>
      ) : !data || !data.hasFamily ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center max-w-md mx-auto space-y-3">
          <AlertCircle className="h-10 w-10 text-amber-600 mx-auto" />
          <h3 className="text-sm font-bold text-amber-900">Kartu Keluarga Belum Terhubung</h3>
          <p className="text-xs text-amber-800 leading-relaxed">
            Akun Anda belum terhubung dengan data Kartu Keluarga (KK) terdaftar di RT. Silakan lengkapi atau minta Ketua RT memverifikasi KK Anda terlebih dahulu.
          </p>
        </div>
      ) : (
        <>
          {/* Section 1: KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Tunggakan Bulan-Bulan Sebelumnya */}
            <div className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-secondary-text tracking-wider">
                  Tunggakan Bulan-Bulan Sebelumnya
                </span>
                <div
                  className={`p-2 rounded-xl ${
                    data.previousMonthsUnpaidBalance === 0
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {data.previousMonthsUnpaidBalance === 0 ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </div>
              </div>
              <div className="pt-1">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold inline-block border ${
                    data.previousMonthsUnpaidBalance === 0
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-rose-100 text-rose-800 border-rose-300"
                  }`}
                >
                  {data.previousMonthsUnpaidBalance === 0 ? "Lunas" : "Ada Tunggakan"}
                </span>
              </div>
              <div className={`text-xl font-black pt-1 ${data.previousMonthsUnpaidBalance === 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatRupiah(data.previousMonthsUnpaidBalance)}
              </div>
              <p className="text-[11px] text-gray-secondary-text">
                {data.previousMonthsUnpaidBalance === 0
                  ? "Tidak ada tunggakan"
                  : "Akumulasi tunggakan"}
              </p>
            </div>

            {/* Card 2: Sisa Tagihan Bulan Ini */}
            <div className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-secondary-text tracking-wider">
                  Sisa Tagihan Bulan Ini ({data.currentPeriod})
                </span>
                <div
                  className={`p-2 rounded-xl ${
                    data.currentMonthRemaining === 0
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {data.currentMonthRemaining === 0 ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </div>
              </div>
              <div className="pt-1">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold inline-block border ${
                    data.currentMonthRemaining === 0
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-rose-100 text-rose-800 border-rose-300"
                  }`}
                >
                  {data.currentMonthRemaining === 0 ? "Lunas" : "Belum Lunas"}
                </span>
              </div>
              <div className={`text-xl font-black pt-1 ${data.currentMonthRemaining === 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatRupiah(data.currentMonthRemaining)}
              </div>
              <p className="text-[11px] text-gray-secondary-text">
                {data.currentMonthRemaining === 0
                  ? "Iuran bulan ini telah lunas"
                  : `Sisa dari total tagihan ${formatRupiah(data.currentMonthBilled)}`}
              </p>
            </div>

            {/* Card 3: Total Setoran Terinput */}
            <div className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-secondary-text tracking-wider">
                  Total Setoran Terinput ({new Date().getFullYear()})
                </span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-purple-700 dark:text-purple-300 pt-2">
                {formatRupiah(data.totalPaidThisYear)}
              </div>
              <p className="text-[11px] text-gray-secondary-text">
                Jumlah total pembayaran yang telah diinput
              </p>
            </div>

            {/* Card 4: Tanggal Setoran Terakhir */}
            <div className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-secondary-text tracking-wider">
                  Setoran Terakhir Dicatat
                </span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <div className="text-lg font-bold text-gray-heading-main pt-2">
                {formatDate(data.lastPaymentDate)}
              </div>
              <p className="text-[11px] text-gray-secondary-text">
                {data.lastPaymentAmount > 0
                  ? `Nominal Setoran: ${formatRupiah(data.lastPaymentAmount)}`
                  : "Belum Ada Setoran Dicatat"}
              </p>
            </div>
          </div>

          {/* Section 2: Tariff / Rules Active */}
          <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-heading-main tracking-wider flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              <span>Daftar Tarif Iuran Berlaku di RT</span>
            </h3>

            {data.activeRules.length === 0 ? (
              <p className="text-xs text-gray-placeholder">Belum ada aturan iuran aktif yang ditetapkan pengurus RT.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {data.activeRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl border border-gray-border bg-gray-sidebar-hover/30 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-heading-main">{rule.name}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          rule.isMandatory
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {rule.isMandatory ? "Wajib" : "Sukarela"}
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-primary">
                      {formatRupiah(rule.amount)} <span className="text-[10px] font-normal text-gray-secondary-text">/ bulan</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Histori Pembayaran Table */}
          <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-border pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-heading-main flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Histori Catatan Pembayaran Iuran Keluarga</span>
                </h3>
                <p className="text-xs text-gray-secondary-text mt-0.5">
                  Nomor KK: <strong className="font-semibold text-gray-heading-main">{data.familyNumber || "-"}</strong>
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-40">
                  <CustomSelect
                    value={yearFilter}
                    onChange={(val) => setYearFilter(val)}
                    options={availableYears}
                  />
                </div>
                <div className="w-48">
                  <CustomSelect
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    options={STATUS_OPTIONS}
                  />
                </div>
              </div>
            </div>

            {/* Table Content */}
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-placeholder space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                <p className="font-semibold">Belum ada riwayat iuran untuk filter terpilih.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-border bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text">
                      <th className="py-3.5 px-4">Periode</th>
                      <th className="py-3.5 px-4">Jenis Iuran</th>
                      <th className="py-3.5 px-4 text-right">Tagihan</th>
                      <th className="py-3.5 px-4 text-right">Dibayar</th>
                      <th className="py-3.5 px-4 text-right">Sisa Tagihan</th>
                      <th className="py-3.5 px-4 text-center">Tanggal Dicatat</th>
                      <th className="py-3.5 px-4 text-center">Metode</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Pencatat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-border text-xs text-gray-heading-main">
                    {filteredHistory.map((item) => {
                      const remaining = Math.max(0, item.amountBilled - item.amountPaid);
                      return (
                        <tr key={item.id} className="hover:bg-gray-sidebar-hover/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-heading-main">
                            {formatPeriodLabel(item.period)}
                          </td>
                          <td className="py-3.5 px-4 font-medium">
                            {item.feeRuleName}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-gray-secondary-text">
                            {formatRupiah(item.amountBilled)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                            {formatRupiah(item.amountPaid)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold">
                            {remaining === 0 ? (
                              <span className="text-emerald-600 font-bold">Rp 0 (Lunas)</span>
                            ) : (
                              <span className="text-rose-600 font-bold">{formatRupiah(remaining)}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center text-gray-secondary-text">
                            {formatDate(item.paymentDate)}
                          </td>
                          <td className="py-3.5 px-4 text-center capitalize">
                            {item.paymentMethod ? (
                              <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded font-semibold text-gray-secondary-text">
                                {item.paymentMethod === "cash" ? "Tunai" : "Transfer"}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.status === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : item.status === "partially_paid"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {item.status === "paid"
                                ? "Lunas"
                                : item.status === "partially_paid"
                                ? "Sebagian"
                                : "Belum Ada Catatan"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-secondary-text font-medium">
                            {item.recordedByName || "Bendahara RT"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
