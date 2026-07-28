"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ChevronDown, User, LogOut, Check, Shield } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRoleStore } from "@/lib/store/use-role-store";
import { toast } from "sonner";
import { NotificationBell } from "./NotificationBell";

interface NavbarProps {
  onOpenMobile: () => void;
  handleLogout: () => void;
}

// Map path to friendly Title
const getPageTitle = (pathname: string): string => {
  if (pathname === "/dashboard") return "Ringkasan Dashboard";
  if (pathname.startsWith("/dashboard/users")) return "Manajemen Pengguna";
  if (pathname.startsWith("/dashboard/permissions")) return "Role & Permission";
  if (pathname.startsWith("/dashboard/audit-logs")) return "Log Aktivitas";
  if (pathname.startsWith("/dashboard/residents")) return "Data Kependudukan";
  if (pathname.startsWith("/dashboard/kas-report")) return "Laporan Keuangan Kas";
  if (pathname.startsWith("/dashboard/complaints-report")) return "Laporan Pengaduan";
  if (pathname.startsWith("/dashboard/system-config")) return "Konfigurasi Sistem";
  if (pathname.startsWith("/dashboard/smart-groups")) return "Kelompok Warga (Smart Group)";
  if (pathname.startsWith("/dashboard/qr-codes")) return "Cetak QR Code Rumah";
  if (pathname.startsWith("/dashboard/approvals/registration")) return "Persetujuan Registrasi";
  if (pathname.startsWith("/dashboard/approvals/documents")) return "Verifikasi Kependudukan";
  if (pathname.startsWith("/dashboard/approvals/kas")) return "Persetujuan Kas";
  if (pathname.startsWith("/dashboard/surat/approvals")) return "Persetujuan Surat";
  if (pathname.startsWith("/dashboard/surat/archive")) return "Arsip Surat RT";
  if (pathname.startsWith("/dashboard/kas/transactions")) return "Laporan Transaksi Kas";
  if (pathname.startsWith("/dashboard/kas/iuran")) return "Laporan Pembayaran Iuran";
  if (pathname.startsWith("/dashboard/announcements")) return "Kelola Pengumuman";
  if (pathname.startsWith("/dashboard/activities")) return "Kelola Kegiatan";
  if (pathname.startsWith("/dashboard/complaints")) return "Tanggapan Pengaduan";
  if (pathname.startsWith("/dashboard/surat")) return "Kelola Surat Pengantar";
  if (pathname.startsWith("/dashboard/kas/income")) return "Catat Pemasukan Kas";
  if (pathname.startsWith("/dashboard/kas/expense")) return "Catat Pengeluaran Kas";
  if (pathname.startsWith("/dashboard/iuran/manage")) return "Kelola & Setor Iuran";
  if (pathname.startsWith("/dashboard/iuran/tunggakan")) return "Laporan Tunggakan Iuran";
  if (pathname.startsWith("/dashboard/rentals")) return "Kelola Properti Sewa";
  if (pathname.startsWith("/dashboard/family/surat")) return "Riwayat & Pengajuan Surat";
  if (pathname.startsWith("/dashboard/family")) return "Kelola Anggota Keluarga";
  
  return "Sistem Smart RT";
};

// Role name mapping
const getRoleLabel = (roleId: number): string => {
  switch (roleId) {
    case 1: return "Super Admin";
    case 2: return "Ketua RT";
    case 3: return "Sekretaris";
    case 4: return "Bendahara";
    case 5: return "Koordinator Kost";
    case 6: return "Warga";
    default: return "Pengguna";
  }
};

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobile, handleLogout }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  // Switched Role Zustand Store
  const { activeRoleId, setActiveRoleId, initialize } = useRoleStore();

  // Dropdown UI States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Switched Role Allowed Options (Only Pengurus RT: Ketua RT [2], Sekretaris [3], Bendahara [4])
  const userBaseRoleId = user?.roleId || 6;
  const isOfficer = userBaseRoleId >= 2 && userBaseRoleId <= 4;
  
  const allowedRoles = React.useMemo(() => {
    if (userBaseRoleId === 1) return [1];
    return isOfficer ? [userBaseRoleId, 6] : [userBaseRoleId];
  }, [isOfficer, userBaseRoleId]);

  // Initialize Switched Role Store
  useEffect(() => {
    if (userBaseRoleId) {
      initialize(userBaseRoleId, allowedRoles);
    }
  }, [userBaseRoleId, allowedRoles, initialize]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Switch Role
  const handleSwitchRole = (roleId: number) => {
    if (roleId === activeRoleId) return;
    setActiveRoleId(roleId);
    setIsProfileOpen(false);
    toast.success(`Beralih ke Mode ${getRoleLabel(roleId)}`);
    router.push("/dashboard");
  };

  return (
    <header className="fixed top-0 right-0 z-40 flex h-16 items-center justify-between border-b border-gray-border bg-gray-card/95 backdrop-blur-xl px-6 transition-all duration-300 left-0 lg:left-70 group-data-[sidebar-collapsed=true]/layout:lg:left-20">
      {/* Left section: Hamburger / Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobile}
          className="rounded-xl p-2 text-gray-heading-main hover:bg-gray-sidebar-hover lg:hidden cursor-pointer transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex flex-col">
          <span className="text-sm font-bold text-gray-heading-main tracking-tight">
            {getPageTitle(pathname)}
          </span>
          <span className="text-[10px] text-gray-secondary-text leading-tight">
            Wargaku &bull; Smart System RT
          </span>
        </div>
      </div>

      {/* Right section: Notification & Switched Profile Dropdown */}
      <div className="flex items-center gap-4">
        {/* Lonceng Notifikasi */}
        <NotificationBell />

        {/* Switched Profile & Role Switcher */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-gray-border bg-gray-card p-1.5 pr-3 hover:bg-gray-sidebar-hover cursor-pointer transition-all duration-200 text-left"
          >
            {/* Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-900-20 text-primary-900 border border-primary/20">
              <User className="h-4 w-4" />
            </div>

            {/* User Meta */}
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold text-gray-heading-main leading-tight truncate max-w-28">
                {user?.name}
              </span>
              <span className="text-[9px] font-semibold text-gray-secondary-text uppercase tracking-wider">
                {activeRoleId ? getRoleLabel(activeRoleId) : "Memuat..."}
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-placeholder transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Panel */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2.5 z-50 w-64 rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-2 transition-all duration-200 animate-in fade-in slide-in-from-top-3">
              {/* Switched Role Section */}
              {isOfficer && (
                <div className="px-3 py-2 border-b border-gray-divider mb-1.5">
                  <div className="flex items-center gap-1.5 mb-2 text-gray-placeholder">
                    <Shield className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Mode Tampilan</span>
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleSwitchRole(userBaseRoleId)}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        activeRoleId === userBaseRoleId
                          ? "bg-primary text-white"
                          : "text-gray-heading-main hover:bg-gray-sidebar-hover"
                      }`}
                    >
                      <span>Mode Dinas ({getRoleLabel(userBaseRoleId)})</span>
                      {activeRoleId === userBaseRoleId && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchRole(6)}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        activeRoleId === 6
                          ? "bg-primary text-white"
                          : "text-gray-heading-main hover:bg-gray-sidebar-hover"
                      }`}
                    >
                      <span>Mode Personal (Warga)</span>
                      {activeRoleId === 6 && <Check className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* General Options */}
              <div className="space-y-0.5">
                <div className="px-3 py-1.5 text-left md:hidden border-b border-gray-divider mb-1">
                  <p className="text-xs font-bold text-gray-heading-main truncate">{user?.name}</p>
                  <p className="text-[9px] text-gray-secondary-text truncate">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-error hover:bg-error-20 cursor-pointer transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
