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

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#64748B"];

interface SocialSectionProps {
  religionDistribution: DashboardStats["religionDistribution"];
  educationDistribution: DashboardStats["educationDistribution"];
  occupationDistribution: DashboardStats["occupationDistribution"];
  totalWargaAktif: number;
}

export function SocialSection({
  religionDistribution,
  educationDistribution,
  occupationDistribution,
  totalWargaAktif,
}: SocialSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Sebaran Agama */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm flex flex-col justify-between">
        <h3 className="text-lg font-bold text-gray-heading-main mb-4">Sebaran Agama</h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-50 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={religionDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="count"
                  nameKey="religion"
                  labelLine={false}
                  label={(props) => {
                    const { cx, cy, midAngle, innerRadius, outerRadius: or, percent } = props;
                    if (!percent || percent <= 0.06) return null;
                    const RADIAN = Math.PI / 180;
                    const radius = (innerRadius ?? 0) + ((or ?? 75) - (innerRadius ?? 0)) * 0.55;
                    const x = (cx ?? 0) + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
                    const y = (cy ?? 0) + radius * Math.sin(-(midAngle ?? 0) * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontSize: "10px", fontWeight: 700 }}
                      >
                        {`${Math.round(percent * 100)}%`}
                      </text>
                    );
                  }}
                  style={{ outline: "none" }}
                  stroke="none"
                >
                  {religionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ outline: "none" }} stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value || 0} Jiwa`, "Jumlah"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {(() => {
            const totalReligion = religionDistribution.reduce((sum, r) => sum + r.count, 0);
            return religionDistribution.map((item, idx) => {
              const pct = totalReligion > 0 ? Math.round((item.count / totalReligion) * 100) : 0;
              return (
                <div key={item.religion} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-gray-secondary-text truncate">{item.religion}:</span>
                  <span className="font-semibold text-gray-heading-main whitespace-nowrap">{item.count} <span className="text-[10px] text-gray-secondary-text font-normal">({pct}%)</span></span>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Tingkat Pendidikan */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm flex flex-col justify-between">
        <h3 className="text-lg font-bold text-gray-heading-main mb-4">Tingkat Pendidikan</h3>
        <div className="flex-1 flex flex-col justify-center space-y-3.5">
          {educationDistribution.slice(0, 6).map((item, idx) => {
            const percent = Math.round((item.count / totalWargaAktif) * 100) || 0;
            return (
              <div key={item.education} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-secondary-text truncate max-w-[70%]" title={item.education}>
                    {item.education}
                  </span>
                  <span className="text-gray-heading-main font-bold">
                    {item.count} <span className="text-[10px] text-gray-secondary-text font-normal">({percent}%)</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: COLORS[(idx + 1) % COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
          {educationDistribution.length === 0 && (
            <p className="text-sm text-gray-secondary-text text-center py-6">Tidak ada data pendidikan</p>
          )}
        </div>
      </div>

      {/* Sebaran Pekerjaan */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm lg:col-span-1">
        <h3 className="text-lg font-bold text-gray-heading-main mb-6">Pekerjaan Terbanyak Warga (Top 8)</h3>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={occupationDistribution}
              margin={{ top: 0, right: 20, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="occupation"
                type="category"
                tick={{ fontSize: 11, fill: "#334155" }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip cursor={{ fill: "#F8FAFC" }} formatter={(value) => [`${value || 0} Jiwa`, "Jumlah"]} />
              <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={16} style={{ outline: "none" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
