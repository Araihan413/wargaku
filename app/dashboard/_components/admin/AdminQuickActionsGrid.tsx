import React from "react";
import { Users, ShieldCheck, Activity, Settings, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const AdminQuickActionsGrid: React.FC = () => {
  const quickActions = [
    {
      title: "Manajemen Pengguna",
      description: "CRUD akun pengguna, reset password, suspend & mutasi peran.",
      href: "/dashboard/users",
      icon: Users,
      badge: "User Account CRUD",
      color: "bg-blue-500 text-white",
      borderColor: "border-blue-100 hover:border-blue-300",
    },
    {
      title: "Role & Permission (RBAC)",
      description: "Pengaturan matriks hak akses otorisasi dinamis per modul.",
      href: "/dashboard/permissions",
      icon: ShieldCheck,
      badge: "Dynamic RBAC",
      color: "bg-indigo-500 text-white",
      borderColor: "border-indigo-100 hover:border-indigo-300",
    },
    {
      title: "Log Aktivitas (Audit Trail)",
      description: "Catatan riwayat pencatatan keamanan dan mutasi data.",
      href: "/dashboard/audit-logs",
      icon: Activity,
      badge: "Security Trail",
      color: "bg-purple-500 text-white",
      borderColor: "border-purple-100 hover:border-purple-300",
    },
    {
      title: "Konfigurasi Sistem",
      description: "Branding nama wilayah RT/RW, logo kop surat, & kontak official.",
      href: "/dashboard/system-config",
      icon: Settings,
      badge: "System Metadata",
      color: "bg-emerald-500 text-white",
      borderColor: "border-emerald-100 hover:border-emerald-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {quickActions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <Link
            key={idx}
            href={action.href}
            className={`p-5 rounded-2xl border ${action.borderColor} bg-gray-card shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between space-y-3 cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl ${action.color} shadow-xs`}>
                <Icon className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-placeholder group-hover:text-primary transition-colors" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-secondary-text uppercase tracking-wider">
                {action.badge}
              </span>
              <h4 className="text-base font-extrabold text-gray-heading-main tracking-tight group-hover:text-primary transition-colors">
                {action.title}
              </h4>
              <p className="text-xs text-gray-secondary-text mt-1 line-clamp-2">
                {action.description}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
