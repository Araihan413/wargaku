"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
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
  if (pathname.startsWith("/dashboard/qr-codes")) return "Cetak QR Code RT & Sekre";
  if (pathname.startsWith("/dashboard/approvals/registration")) return "Persetujuan Registrasi";
  if (pathname.startsWith("/dashboard/approvals/documents")) return "Verifikasi Kependudukan";
  if (pathname.startsWith("/dashboard/surat/approvals")) return "Persetujuan Surat";
  if (pathname.startsWith("/dashboard/surat/archive")) return "Arsip Surat RT";
  if (pathname.startsWith("/dashboard/kas/transactions")) return "Laporan Transaksi Kas";
  if (pathname.startsWith("/dashboard/kas/iuran")) return "Laporan Pembayaran Iuran";
  if (pathname.startsWith("/dashboard/announcements")) return "Kelola Pengumuman";
  if (pathname.startsWith("/dashboard/activities")) return "Kelola Kegiatan";
  if (pathname.startsWith("/dashboard/complaints")) return "Tanggapan Pengaduan";
  if (pathname.startsWith("/dashboard/surat")) return "Kelola Surat Pengantar";
  if (pathname === "/dashboard/kas" || pathname.startsWith("/dashboard/kas/reports")) return "Laporan Keuangan RT";
  if (pathname.startsWith("/dashboard/kas/income")) return "Catat Pemasukan Kas";
  if (pathname.startsWith("/dashboard/kas/expense")) return "Catat Pengeluaran Kas";
  if (pathname.startsWith("/dashboard/iuran/manage")) return "Kelola & Setor Iuran";
  if (pathname.startsWith("/dashboard/iuran/tunggakan")) return "Laporan Tunggakan Iuran";
  if (pathname.startsWith("/dashboard/rentals")) return "Kelola Penyewa Kos";
  if (pathname.startsWith("/dashboard/my-properties")) return "Aset Properti Sewa";
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

  const [assignedRoles, setAssignedRoles] = useState<number[]>([]);
  const [primaryRoleId, setPrimaryRoleId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchAssignedRoles() {
      try {
        const res = await fetch(`/api/permissions/my-permissions`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const serverRoleId = typeof data.roleId === "number" ? data.roleId : 6;
            const serverAllowed = Array.isArray(data.allowedRoles) && data.allowedRoles.length > 0 ? data.allowedRoles : [serverRoleId];

            setAssignedRoles(serverAllowed);
            setPrimaryRoleId(serverRoleId);
            initialize(serverRoleId, serverAllowed);
          }
        }
      } catch (err) {
        console.error("Failed to fetch assigned roles in Navbar:", err);
      }
    }
    fetchAssignedRoles();
    return () => {
      isMounted = false;
    };
  }, [initialize]);

  const allowedRoles = React.useMemo(() => {
    const list = new Set<number>(assignedRoles);
    if (primaryRoleId) list.add(primaryRoleId);
    return Array.from(list).sort((a, b) => a - b);
  }, [assignedRoles, primaryRoleId]);

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

  // Simpan halaman terakhir yang diakses untuk role yang sedang aktif
  useEffect(() => {
    if (activeRoleId && pathname.startsWith("/dashboard")) {
      try {
        localStorage.setItem(`last_path_role_${activeRoleId}`, pathname);
      } catch (e) {
        // Abaikan error jika storage penuh
      }
    }
  }, [pathname, activeRoleId]);

  // Handle Switch Role
  const handleSwitchRole = (roleId: number) => {
    if (roleId === activeRoleId) return;
    setActiveRoleId(roleId);
    setIsProfileOpen(false);
    toast.success(`Beralih ke Mode ${getRoleLabel(roleId)}`);
    
    // Redirect ke halaman terakhir role tersebut jika ada
    try {
      const lastPath = localStorage.getItem(`last_path_role_${roleId}`);
      if (lastPath && lastPath.startsWith("/dashboard")) {
        router.push(lastPath);
        return;
      }
    } catch (e) {
      // Abaikan jika storage error
    }
    
    // Fallback ke dashboard utama jika belum ada riwayat
    router.push("/dashboard");
  };

  return (
    <header className="fixed top-0 right-0 z-20 flex h-16 items-center justify-between border-b border-gray-border bg-gray-card/95 backdrop-blur-xl px-6 transition-all duration-300 left-0 lg:left-70 group-data-[sidebar-collapsed=true]/layout:lg:left-20">
      {/* Left section: Hamburger / Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl border border-gray-border hover:bg-gray-sidebar-hover text-gray-secondary-text cursor-pointer transition-colors"
          title="Buka Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-gray-heading-main tracking-tight hidden sm:block">
            {getPageTitle(pathname)}
          </h1>
          <p className="text-[10px] font-semibold text-gray-secondary-text hidden sm:block">
            Sistem Informasi Pengelolaan Lingkungan RT
          </p>
        </div>
      </div>

      {/* Right section: Profile Dropdown & Notifications */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <NotificationBell />

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 rounded-2xl border border-gray-border/80 bg-gray-card p-1.5 pr-3 transition-all duration-200 hover:bg-gray-sidebar-hover hover:border-gray-border cursor-pointer shadow-2xs"
          >
            <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user?.name || "Avatar"}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="font-extrabold text-xs text-primary">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-extrabold text-gray-heading-main leading-tight line-clamp-1">
                {user?.name || "Pengguna"}
              </span>
              <span className="text-[10px] font-bold text-primary leading-tight">
                {getRoleLabel(activeRoleId ?? primaryRoleId ?? 6)}
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-secondary-text transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Profile & Role Switcher Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-border bg-gray-card p-2 shadow-xl animate-in fade-in-50 zoom-in-95 z-50">
              {/* Role Switcher Section */}
              {allowedRoles.length > 1 && (
                <div className="px-3 py-2 border-b border-gray-divider mb-1.5">
                  <div className="flex items-center gap-1.5 mb-2 text-gray-placeholder">
                    <Shield className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Mode Tampilan</span>
                  </div>
                  <div className="space-y-1">
                    {allowedRoles.map((rId) => {
                      const isActive = activeRoleId === rId;
                      let label = `Mode ${getRoleLabel(rId)}`;
                      if (rId === 6) label = "Mode Warga Personal";
                      else if (rId >= 1 && rId <= 4) label = `Mode Kedinasan (${getRoleLabel(rId)})`;
                      else if (rId === 5) label = "Mode Koordinator Kost";

                      return (
                        <button
                          key={rId}
                          type="button"
                          onClick={() => handleSwitchRole(rId)}
                          className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                            isActive
                              ? "bg-primary text-white"
                              : "text-gray-heading-main hover:bg-gray-sidebar-hover"
                          }`}
                        >
                          <span>{label}</span>
                          {isActive && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
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
                  onClick={() => {
                    setIsProfileOpen(false);
                    router.push("/dashboard/profile");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-heading-main hover:bg-gray-sidebar-hover cursor-pointer transition-colors text-left"
                >
                  <User className="h-4 w-4 text-primary" />
                  <span>Pengaturan Profil</span>
                </button>
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
