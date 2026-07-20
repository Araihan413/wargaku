import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
} from "recharts";
import { DashboardStats } from "../../types";

interface MutationSectionProps {
  populationMutations: DashboardStats["populationMutations"];
}

export function MutationSection({ populationMutations }: MutationSectionProps) {
  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-heading-main">Mutasi Penduduk</h3>
          <p className="text-xs text-gray-secondary-text">Grafik check-in vs check-out warga tetap & pendatang 6 bulan terakhir</p>
        </div>
        <div className="mt-2 sm:mt-0 flex gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-[#10B981]">
            <span className="h-2 w-4 rounded-sm bg-[#10B981]/20 border border-[#10B981]" />
            Check-In (Masuk)
          </div>
          <div className="flex items-center gap-1.5 text-[#EF4444]">
            <span className="h-2 w-4 rounded-sm bg-[#EF4444]/20 border border-[#EF4444]" />
            Check-Out (Keluar)
          </div>
        </div>
      </div>
      <div className="h-70 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={populationMutations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => [`${value || 0} Orang`, ""]} />
            <Area
              type="monotone"
              dataKey="checkIn"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorIn)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="checkOut"
              stroke="#EF4444"
              fillOpacity={1}
              fill="url(#colorOut)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
