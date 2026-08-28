import React from "react";
import { TrendingDown, Calendar, Wallet } from "lucide-react";

interface ExpenseKpiCardsProps {
  totalMonth: number;
  totalFiltered: number;
  totalItemsCount: number;
}

export const ExpenseKpiCards: React.FC<ExpenseKpiCardsProps> = ({
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
      <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/70 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
            Total Pengeluaran (Tersaring)
          </span>
          <div className="p-2 bg-rose-500 text-white rounded-xl">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <h3 className="text-2xl font-black text-rose-700">
          {formatCurrency(totalFiltered)}
        </h3>
        <p className="text-[11px] text-rose-800/80 font-medium">
          Dihitung dari kriteria filter aktif saat ini
        </p>
      </div>

      <div className="p-5 rounded-2xl border border-amber-100 bg-amber-50/70 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Pengeluaran Bulan Ini
          </span>
          <div className="p-2 bg-amber-500 text-white rounded-xl">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
        <h3 className="text-2xl font-black text-amber-700">
          {formatCurrency(totalMonth)}
        </h3>
        <p className="text-[11px] text-amber-800/80 font-medium">
          Akumulasi total pengeluaran kas bulan berjalan
        </p>
      </div>

      <div className="p-5 rounded-2xl border border-sky-100 bg-sky-50/70 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
            Total Catatan Pengeluaran
          </span>
          <div className="p-2 bg-primary text-white rounded-xl">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>
        <h3 className="text-2xl font-black text-primary">
          {totalItemsCount} Transaksi
        </h3>
        <p className="text-[11px] text-sky-800/80 font-medium">
          Jumlah baris pengeluaran kas tersimpan
        </p>
      </div>
    </div>
  );
};
