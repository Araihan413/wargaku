import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
} from "recharts";
import { DashboardStats } from "../../types";


interface DemographySectionProps {
  genderDistribution: DashboardStats["genderDistribution"];
  ageDistribution: DashboardStats["ageDistribution"];
  totalWargaAktif: number;
}

export function DemographySection({
  genderDistribution,
  ageDistribution,
  totalWargaAktif,
}: DemographySectionProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Rasio Gender */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-heading-main mb-6">Rasio Gender</h3>
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
          <div className="h-55 w-55">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="gender"
                  style={{ outline: "none" }}
                >
                  {genderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#2563EB" : "#EC4899"} style={{ outline: "none" }} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value || 0} Jiwa`, "Jumlah"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 w-full sm:w-auto min-w-37.5">
            {genderDistribution.map((item, index) => {
              const percent = Math.round((item.count / totalWargaAktif) * 100) || 0;
              return (
                <div key={item.gender} className="flex items-center justify-between gap-4 border-b border-gray-divider pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: index === 0 ? "#2563EB" : "#EC4899" }} />
                    <span className="text-sm font-medium text-gray-heading-small">{item.gender}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-heading-main">{item.count}</span>
                    <span className="text-xs text-gray-secondary-text ml-1">({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Distribusi Usia */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-heading-main mb-6">Distribusi Kelompok Usia</h3>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#F8FAFC" }} formatter={(value) => [`${value || 0} Jiwa`, "Jumlah"]} />
              <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
