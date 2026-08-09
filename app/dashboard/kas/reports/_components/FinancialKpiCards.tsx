import React from "react";
import { Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { FinancialReportSummary } from "../types";

interface FinancialKpiCardsProps {
  summary: FinancialReportSummary;
  periodLabel: string;
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
};

export const FinancialKpiCards: React.FC<FinancialKpiCardsProps> = ({ summary, periodLabel }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Saldo Awal */}
      <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-blue-900 tracking-wider">
            Saldo Awal
          </span>
          <div className="p-2 bg-blue-600 text-white rounded-xl">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight">
            {formatRupiah(summary.openingBalance)}
          </h3>
          <p className="text-[11px] text-blue-800/80 font-medium mt-1">
            Sebelum periode {periodLabel}
          </p>
        </div>
      </div>

      {/* Total Pemasukan */}
      <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-emerald-900 tracking-wider">
            Total Pemasukan
          </span>
          <div className="p-2 bg-emerald-600 text-white rounded-xl">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
            +{formatRupiah(summary.totalIncome)}
          </h3>
          <p className="text-[11px] text-emerald-800/80 font-medium mt-1">
            Kas: {formatRupiah(summary.totalCashIncome)} | Iuran: {formatRupiah(summary.totalFeeIncome)}
          </p>
        </div>
      </div>

      {/* Total Pengeluaran */}
      <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-rose-900 tracking-wider">
            Total Pengeluaran
          </span>
          <div className="p-2 bg-rose-600 text-white rounded-xl">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight">
            -{formatRupiah(summary.totalExpense)}
          </h3>
          <p className="text-[11px] text-rose-800/80 font-medium mt-1">
            Transaksi pengeluaran
          </p>
        </div>
      </div>

      {/* Saldo Akhir */}
      <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-primary tracking-wider">
            Saldo Akhir
          </span>
          <div className="p-2 bg-primary text-white rounded-xl shadow-xs">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
            {formatRupiah(summary.endingBalance)}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                summary.netChange >= 0
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {summary.netChange >= 0 ? "+" : ""}
              {formatRupiah(summary.netChange)} (Net)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
