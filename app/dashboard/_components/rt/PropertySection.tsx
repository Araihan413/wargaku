import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { DashboardStats } from "../../types";

const DWELLING_COLORS: Record<string, string> = {
  "Terisi (Tetap)": "#2563EB",
  "Kos & Homestay": "#F59E0B",
  "Hunian Kosong": "#94A3B8",
};

const DEFAULT_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#64748B"];

interface PropertySectionProps {
  dwellingDistribution: DashboardStats["dwellingDistribution"];
  occupancyRate: DashboardStats["occupancyRate"];
}

export function PropertySection({ dwellingDistribution, occupancyRate }: PropertySectionProps) {
  const totalDwellings = dwellingDistribution.reduce((sum, item) => sum + item.count, 0);

  const chartData = totalDwellings === 0
    ? [{ type: "Belum Ada Data", count: 1 }]
    : dwellingDistribution;

  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-gray-heading-main mb-6">Hunian & Okupansi Kamar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="h-45 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={totalDwellings === 0 ? 0 : 3}
                  dataKey="count"
                  nameKey="type"
                  style={{ outline: "none" }}
                >
                  {chartData.map((entry, index) => {
                    const fill = totalDwellings === 0
                      ? "#CBD5E1"
                      : DWELLING_COLORS[entry.type] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                    return <Cell key={`cell-${index}`} fill={fill} style={{ outline: "none" }} />;
                  })}
                </Pie>
                <Tooltip formatter={(value) => [`${totalDwellings === 0 ? 0 : value || 0} Hunian`, "Jumlah"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Progress and lists */}
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-border bg-gray-page-bg p-4">
              <div className="flex items-center justify-between text-xs text-gray-secondary-text mb-1">
                <span className="font-semibold tracking-wider">Kamar Sewa</span>
                <span className="font-bold text-primary">{occupancyRate.occupancyPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-divider overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${occupancyRate.occupancyPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-secondary-text mt-2">
                <span>Terisi: {occupancyRate.filledRooms} kamar</span>
                <span>Total: {occupancyRate.totalRooms} kamar</span>
              </div>
            </div>

            <div className="text-xs space-y-1.5">
              {dwellingDistribution.map((item, idx) => {
                const color = DWELLING_COLORS[item.type] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                return (
                  <div key={item.type} className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-gray-secondary-text">{item.type}</span>
                    </div>
                    <span className="font-bold text-gray-heading-main">{item.count} unit</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-divider pt-4 mt-4 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-secondary-text">Total Properti Hunian</p>
          <h4 className="text-lg font-extrabold text-gray-heading-main mt-1">
            {totalDwellings} Unit
          </h4>
          <p className="text-[10px] text-gray-secondary-text">Terdata di wilayah RT</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-secondary-text">Rumah Kosong</p>
          <h4 className="text-lg font-extrabold text-gray-heading-main mt-1">
            {dwellingDistribution.find((d) => d.type === "Hunian Kosong" || d.type === "Rumah Kosong")?.count || 0} Unit
          </h4>
          <p className="text-[10px] text-gray-secondary-text">Belum terisi / kosong</p>
        </div>
      </div>
    </div>
  );
}
