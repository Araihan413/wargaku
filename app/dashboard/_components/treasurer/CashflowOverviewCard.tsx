import React from "react";
import { ArrowUpRight, ArrowDownRight, Users } from "lucide-react";

import { TreasurerDashboardStats } from "./types";

interface CashflowOverviewCardProps {
  stats: TreasurerDashboardStats;
}

export const CashflowOverviewCard: React.FC<CashflowOverviewCardProps> = ({ stats }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const netMonthCashflow = stats.thisMonthIncome - stats.thisMonthExpense;

  const maxVal = Math.max(stats.thisMonthIncome, stats.thisMonthExpense, 1);
  const incomePercent = Math.round((stats.thisMonthIncome / maxVal) * 100);
  const expensePercent = Math.round((stats.thisMonthExpense / maxVal) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Cashflow Comparison Card */}
      <div className="lg:col-span-2 border border-gray-border bg-gray-card rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-gray-heading-main">
              Ringkasan Arus Kas Bulan Ini
            </h3>
            <p className="text-xs text-gray-secondary-text mt-0.5">
              Perbandingan total pemasukan dan pengeluaran kas RT pada bulan berjalan.
            </p>
          </div>
        </div>

        {/* Comparison Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-emerald-600 flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" /> Total Pemasukan Bulan Ini
              </span>
              <span className="text-gray-heading-main font-mono">{formatCurrency(stats.thisMonthIncome)}</span>
            </div>
            <div className="h-3 w-full bg-gray-page-bg rounded-full overflow-hidden border border-gray-border/60">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${incomePercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-rose-600 flex items-center gap-1">
                <ArrowDownRight className="h-4 w-4" /> Total Pengeluaran Bulan Ini
              </span>
              <span className="text-gray-heading-main font-mono">{formatCurrency(stats.thisMonthExpense)}</span>
            </div>
            <div className="h-3 w-full bg-gray-page-bg rounded-full overflow-hidden border border-gray-border/60">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${expensePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Net Cashflow Summary Box */}
        <div className="p-4 rounded-xl border border-gray-border bg-gray-page-bg/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-secondary-text">
            Selisih Bersih (Net Cashflow Bulan Ini)
          </span>
          <p className={`text-lg font-black mt-0.5 ${netMonthCashflow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {netMonthCashflow >= 0 ? "+" : ""}{formatCurrency(netMonthCashflow)}
          </p>
        </div>
      </div>

      {/* Dues Compliance Status Card */}
      <div className="lg:col-span-1 border border-gray-border bg-gray-card rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-heading-main">
                Status Iuran Warga
              </h4>
              <span className="text-xs text-gray-secondary-text font-medium block">
                Periode {stats.duesStats.currentPeriod}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-center space-y-1">
            <span className="text-xs font-bold text-gray-secondary-text uppercase tracking-wider block">
              Tingkat Pembayaran KK
            </span>
            <span className="text-3xl font-black text-primary font-mono block">
              {stats.duesStats.duesPaidPercentage}%
            </span>
            <span className="text-xs font-medium text-gray-heading-main block">
              {stats.duesStats.paidFamiliesCount} KK Lunas dari {stats.duesStats.totalActiveFamilies} KK Aktif
            </span>
          </div>

          <div className="space-y-2 pt-1 text-xs font-bold">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span>KK Sudah Lunas</span>
              <span className="font-mono">{stats.duesStats.paidFamiliesCount} KK</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <span>KK Belum Lunas</span>
              <span className="font-mono">{stats.duesStats.unpaidFamiliesCount} KK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
