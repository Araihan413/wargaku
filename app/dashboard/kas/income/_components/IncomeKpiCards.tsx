import React from "react";
import { TrendingUp, Calendar, Wallet } from "lucide-react";

interface IncomeKpiCardsProps {
  totalMonth: number;
  totalFiltered: number;
  totalItemsCount: number;
}

export const IncomeKpiCards: React.FC<IncomeKpiCardsProps> = ({
  totalMonth,
  totalFiltered,
  totalItemsCount,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Total Pemasukan (Tersaring)
          </span>
          <div className="p-2 bg-emerald-500 text-white rounded-xl">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <h3 className="text-2xl font-black text-emerald-700">
          {formatCurrency(totalFiltered)}
        </h3>
        <p className="text-[11px] text-emerald-800/80 font-medium">
          Dihitung dari kriteria filter aktif saat ini
        </p>
      </div>

      <div className="p-5 rounded-2xl border border-teal-100 bg-teal-50/70 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
            Pemasukan Bulan Ini
          </span>
          <div className="p-2 bg-teal-500 text-white rounded-xl">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
        <h3 className="text-2xl font-black text-teal-700">
          {formatCurrency(totalMonth)}
        </h3>
        <p className="text-[11px] text-teal-800/80 font-medium">
          Akumulasi pemasukan kas non-iuran bulan berjalan
        </p>
      </div>

      <div className="p-5 rounded-2xl border border-sky-100 bg-sky-50/70 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
            Total Catatan Pemasukan
          </span>
          <div className="p-2 bg-primary text-white rounded-xl">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <h3 className="text-2xl font-black text-primary">
          {totalItemsCount} Transaksi
        </h3>
        <p className="text-[11px] text-sky-800/80 font-medium">
          Jumlah baris catatan pemasukan tersimpan
        </p>
      </div>
    </div>
  );
};
