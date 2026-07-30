import React, { useSyncExternalStore } from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";
import { DashboardStats } from "../../types";

interface FinanceSectionProps {
  cashSummary: DashboardStats["cashSummary"];
  cashflowTrend: DashboardStats["cashflowTrend"];
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function FinanceSection({ cashSummary, cashflowTrend }: FinanceSectionProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-heading-main">Tren Arus Kas (Cashflow)</h3>
            <p className="text-xs text-gray-secondary-text">Arus pemasukan vs pengeluaran disetujui bulanan</p>
          </div>
          <div className="mt-2 sm:mt-0 flex gap-2">
            <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
              Aktif
            </span>
          </div>
        </div>

        {/* Indicator info on mobile */}
        <div className="flex justify-end sm:hidden mb-1">
          <span className="text-[10px] text-gray-400 font-medium">↔ Usap untuk melihat detail bulan</span>
        </div>

        {/* Horizontal Scroll Wrapper on Mobile */}
        <div className="w-full overflow-x-auto pb-1 scrollbar-thin">
          <div className="min-w-125 sm:min-w-full h-62.5">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => {
                      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}jt`;
                      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
                      return `${v}`;
                    }}
                    width={45}
                  />
                  <Tooltip formatter={(value) => [`Rp ${Number(value || 0).toLocaleString("id-ID")}`, ""]} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, marginTop: 10 }} />
                  <Bar name="Pemasukan" dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar name="Pengeluaran" dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-secondary-text">Memuat grafik...</div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-divider pt-4 mt-4 grid grid-cols-3 gap-2 sm:gap-4 text-center">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-secondary-text">Saldo Kas Aktual</p>
          <h4 className="text-xs sm:text-sm font-extrabold text-gray-heading-main mt-1">
            Rp {cashSummary.currentBalance.toLocaleString("id-ID")}
          </h4>
          <p className="text-[9px] text-gray-secondary-text mt-0.5">Total kas saat ini</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-secondary-text">Partisipasi Iuran</p>
          <h4 className="text-xs sm:text-sm font-extrabold text-gray-heading-main mt-1">
            {cashSummary.participationRate}%
          </h4>
          <p className="text-[9px] text-gray-secondary-text mt-0.5">KK membayar bulan ini</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-secondary-text">Realisasi Penerimaan</p>
          <h4 className="text-xs sm:text-sm font-extrabold text-gray-heading-main mt-1">
            Rp {cashSummary.paidIuran.toLocaleString("id-ID")}
          </h4>
          <p className="text-[9px] text-gray-secondary-text mt-0.5">Dari Rp {cashSummary.billedIuran.toLocaleString("id-ID")}</p>
        </div>
      </div>
    </div>
  );
}
