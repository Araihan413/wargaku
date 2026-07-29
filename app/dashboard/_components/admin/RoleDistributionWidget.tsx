import React from "react";
import { ShieldAlert, UserCheck } from "lucide-react";
import Link from "next/link";
import { RoleDistribution } from "./types";

interface RoleDistributionWidgetProps {
  distribution: RoleDistribution;
}

export const RoleDistributionWidget: React.FC<RoleDistributionWidgetProps> = ({ distribution }) => {
  const rolesList = [
    { label: "Super Admin", count: distribution.superAdminCount, color: "bg-indigo-500", limit: "Maks. 2 Akun" },
    { label: "Ketua RT", count: distribution.ketuaRtCount, color: "bg-blue-500", limit: "Pengurus RT" },
    { label: "Sekretaris", count: distribution.sekretarisCount, color: "bg-sky-500", limit: "Pengurus RT" },
    { label: "Bendahara", count: distribution.bendaharaCount, color: "bg-emerald-500", limit: "Pengurus RT" },
    { label: "Koordinator Kos", count: distribution.koordinatorKosCount, color: "bg-amber-500", limit: "Pengelola Sewa" },
    { label: "Warga", count: distribution.wargaCount, color: "bg-purple-500", limit: "Pengguna Akhir" },
  ];

  const totalAccounts = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="border border-gray-border bg-gray-card rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-heading-main tracking-tight">
              Distribusi Peran Pengguna (RBAC)
            </h3>
            <p className="text-xs text-gray-secondary-text">
              Total {totalAccounts} akun terdaftar dalam sistem
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/permissions"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold"
        >
          <span>Matriks Permission</span>
        </Link>
      </div>

      {/* Warning Super Admin Limit */}
      {distribution.superAdminCount >= 2 && (
        <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Batas maksimal akun <strong>Super Admin aktif (2 Akun)</strong> telah tercapai.
          </span>
        </div>
      )}

      {/* Role list grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {rolesList.map((role, idx) => (
          <div key={idx} className="p-3 bg-gray-50/70 border border-gray-border/60 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${role.color}`} />
              <span className="text-xs font-bold text-gray-heading-main truncate">{role.label}</span>
            </div>
            <p className="text-xl font-black text-gray-heading-main font-mono">{role.count}</p>
            <p className="text-[10px] text-gray-secondary-text">{role.limit}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
