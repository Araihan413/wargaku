import React from "react";
import { CategoryBreakdownItem } from "../types";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface CategoryBreakdownProps {
  incomeBreakdown: CategoryBreakdownItem[];
  expenseBreakdown: CategoryBreakdownItem[];
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
};

export const CategoryBreakdownChart: React.FC<CategoryBreakdownProps> = ({
  incomeBreakdown,
  expenseBreakdown,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* Pemasukan Breakdown */}
      <div className="border border-gray-border bg-gray-card rounded-2xl p-4 md:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-border mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-heading-main">Rincian Sumber Pemasukan</h3>
          </div>
          <span className="text-xs text-gray-secondary-text font-medium">{incomeBreakdown.length} Kategori</span>
        </div>

        {incomeBreakdown.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-secondary-text">Belum ada data pemasukan pada periode ini.</div>
        ) : (
          <div className="space-y-3.5">
            {incomeBreakdown.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-heading-main">{item.category}</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {formatRupiah(item.amount)} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pengeluaran Breakdown */}
      <div className="border border-gray-border bg-gray-card rounded-2xl p-4 md:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-border mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-heading-main">Rincian Alokasi Pengeluaran</h3>
          </div>
          <span className="text-xs text-gray-secondary-text font-medium">{expenseBreakdown.length} Kategori</span>
        </div>

        {expenseBreakdown.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-secondary-text">Belum ada data pengeluaran pada periode ini.</div>
        ) : (
          <div className="space-y-3.5">
            {expenseBreakdown.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-heading-main">{item.category}</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {formatRupiah(item.amount)} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
