"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from '@/public/logo/logo.webp';
import Image from "next/image";
import { useRoleStore } from "@/lib/store/use-role-store";
import { useFamilyVerification } from "@/lib/hooks/use-family-verification";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ShieldCheck,
  Activity,
  Settings,
  Users,
  Clock,
  FileText,
  Wallet,
  Megaphone,
  LifeBuoy,
  FileSignature,
  UserCheck,
  Coins,
  CreditCard,
  Home,
  Search,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  User,
  Lock,
} from "lucide-react";

interface SidebarSubItem {
  title: string;
  href: string;
  requiresVerification?: boolean;
}

interface SidebarItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  subItems?: SidebarSubItem[];
  roles: number[];
  requiresVerification?: boolean;
}

// Full schema of dynamic, role-based sidebar items
const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: [1, 2, 3, 4, 5, 6],
  },
  // Super Admin Menus (Role 1)
  {
    title: "Keamanan & Otoritas",
    icon: ShieldCheck,
    roles: [1],
    subItems: [
      { title: "Manajemen Pengguna", href: "/dashboard/users" },
      { title: "Role & Permission", href: "/dashboard/permissions" },
      { title: "Log Aktivitas", href: "/dashboard/audit-logs" },
    ],
  },
  {
    title: "Pemantauan Wilayah",
    icon: Activity,
    roles: [1],
    subItems: [
      { title: "Data Kependudukan", href: "/dashboard/residents" },
      { title: "Laporan Keuangan Kas", href: "/dashboard/kas-report" },
      { title: "Postingan & Pengaduan", href: "/dashboard/complaints-report" },
    ],
  },
  {
    title: "Konfigurasi Sistem",
    icon: Settings,
    href: "/dashboard/system-config",
    roles: [1],
  },

  // Ketua RT Menus (Role 2)
  {
    title: "Kelola Kependudukan",
    icon: Users,
    roles: [2],
    subItems: [
      { title: "Data Warga & Hunian", href: "/dashboard/residents" },
      { title: "Kelompok Warga", href: "/dashboard/smart-groups" },
      { title: "Cetak QR Code", href: "/dashboard/qr-codes" },
    ],
  },
  {
    title: "Antrean Persetujuan",
    icon: Clock,
    roles: [2],
    subItems: [
      { title: "Persetujuan Registrasi", href: "/dashboard/approvals/registration" },
      { title: "Verifikasi Kependudukan", href: "/dashboard/approvals/documents" },
      { title: "Persetujuan Kas Masuk/Keluar", href: "/dashboard/approvals/kas" },
    ],
  },
  {
    title: "Layanan Surat RT",
    icon: FileText,
    roles: [2],
    subItems: [
      { title: "Persetujuan Surat", href: "/dashboard/surat/approvals" },
      { title: "Arsip Surat RT", href: "/dashboard/surat/archive" },
    ],
  },
  {
    title: "Laporan Keuangan RT",
    icon: Wallet,
    roles: [2],
    subItems: [
      { title: "Laporan Transaksi Kas", href: "/dashboard/kas/transactions" },
      { title: "Laporan Pembayaran Iuran", href: "/dashboard/kas/iuran" },
    ],
  },
  {
    title: "Portal Informasi",
    icon: Megaphone,
    roles: [2, 3], // Both Ketua RT (2) & Sekretaris (3) have access
    subItems: [
      { title: "Kelola Pengumuman", href: "/dashboard/announcements" },
      { title: "Kelola Kegiatan", href: "/dashboard/activities" },
    ],
  },
  {
    title: "Respon Pengaduan",
    icon: LifeBuoy,
    href: "/dashboard/complaints",
    roles: [2],
  },

  // Sekretaris Menus (Role 3)
  {
    title: "Kelola Surat",
    icon: FileSignature,
    href: "/dashboard/surat",
    roles: [3],
  },
  {
    title: "Kelola Pengaduan",
    icon: LifeBuoy,
    href: "/dashboard/complaints",
    roles: [3],
  },
  {
    title: "Kependudukan & Approval",
    icon: UserCheck,
    roles: [3],
    subItems: [
      { title: "Data Warga (Read-Only)", href: "/dashboard/residents" },
      { title: "Persetujuan Registrasi", href: "/dashboard/approvals/registration" },
      { title: "Cetak QR Code", href: "/dashboard/qr-codes" },
    ],
  },

  // Bendahara Menus (Role 4)
  {
    title: "Kas RT (Cashflow)",
    icon: Coins,
    roles: [4],
    subItems: [
      { title: "Catat Pemasukan", href: "/dashboard/kas/income" },
      { title: "Catat Pengeluaran", href: "/dashboard/kas/expense" },
    ],
  },
  {
    title: "Iuran Warga",
    icon: CreditCard,
    roles: [4],
    subItems: [
      { title: "Kelola & Setor Iuran", href: "/dashboard/iuran/manage" },
      { title: "Laporan Tunggakan", href: "/dashboard/iuran/tunggakan" },
    ],
  },

  // Koordinator Kos (Role 5)
  {
    title: "Kelola Properti Sewa",
    icon: Home,
    href: "/dashboard/rentals",
    roles: [5],
  },

  // Warga Menus (Role 6)
  {
    title: "Administrasi Keluarga",
    icon: Users,
    roles: [6],
    subItems: [
      { title: "Kelola Anggota Keluarga", href: "/dashboard/family" },
      { title: "Riwayat & Pengajuan Surat", href: "/dashboard/family/surat", requiresVerification: true },
    ],
  },
  {
    title: "Peta Hunian & Tetangga",
    icon: Search,
    href: "/dashboard/neighborhood",
    roles: [1, 2, 3, 4, 6],
    requiresVerification: true,
  },
  {
    title: "Kelola Properti Pribadi",
    icon: Building2,
    href: "/dashboard/my-properties",
    roles: [6],
    requiresVerification: true,
  },
];

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  user: any;
  handleLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  setIsCollapsed,
  user,
  handleLogout,
}) => {
  const pathname = usePathname();
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const { activeRoleId } = useRoleStore();
  const baseRoleId = user?.roleId;
  const currentRoleId = baseRoleId === 6 ? 6 : (activeRoleId ?? baseRoleId);
  const { isVerified, isLoading: isVerificationLoading } = useFamilyVerification(baseRoleId);

  const [pendingRegCount, setPendingRegCount] = useState<number>(0);
  const [pendingDocCount, setPendingDocCount] = useState<number>(0);

  useEffect(() => {
    if (currentRoleId !== 2 && currentRoleId !== 3) return;

    const fetchCounts = async () => {
      try {
        const [regRes, docRes] = await Promise.all([
          fetch("/api/approvals/registration"),
          fetch("/api/approvals/documents?type=family&status=pending")
        ]);

        if (regRes.ok) {
          const regData = await regRes.json();
          setPendingRegCount(regData.data?.length || 0);
        }
        if (docRes.ok) {
          const docData = await docRes.json();
          setPendingDocCount(docData.data?.length || 0);
        }
      } catch (err) {
        console.error("Error fetching approvals count:", err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [currentRoleId]);

  const totalPendingApprovals = pendingRegCount + pendingDocCount;

  const getBadgeCount = (href: string) => {
    if (href === "/dashboard/approvals/registration") return pendingRegCount;
    if (href === "/dashboard/approvals/documents") return pendingDocCount;
    return 0;
  };

  const isLocked = (requiresVerification?: boolean) =>
    currentRoleId === 6 && Boolean(requiresVerification) && !isVerificationLoading && !isVerified;

  // Filter items matching the current active role
  const filteredItems = useMemo(() => {
    return sidebarItems.filter((item) =>
      item.roles.includes(currentRoleId)
    );
  }, [currentRoleId]);

  const isActive = (href?: string) => (href ? pathname === href : false);
  const isChildActive = useCallback(
    (subItems?: SidebarSubItem[]) =>
      subItems ? subItems.some((sub) => pathname === sub.href) : false,
    [pathname]
  );

  // Keep accordion open if a child item is active
  useEffect(() => {
    filteredItems.forEach((item) => {
      if (item.subItems && isChildActive(item.subItems)) {
        setActiveAccordion(item.title);
      }
    });
  }, [pathname, filteredItems, isChildActive]);

  const toggleAccordion = (title: string) => {
    setActiveAccordion(activeAccordion === title ? null : title);
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-card border-r border-gray-border transition-all duration-300 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${isCollapsed ? "lg:w-20" : "lg:w-70"}`}
      >
        {/* Sidebar Header / Logo Section */} 
        <div className={`relative flex h-20 items-center justify-between border-b border-gray-border/60 ${isCollapsed ? 'px-4' : 'px-6'}`}>
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center select-none"
          >
            {/* Logo */}
            <div className="flex items-center justify-center">
              <Image src={logo} alt="Logo Wargaku" width={48} height={48} priority />
            </div>

            <div className={`flex flex-col justify-center items-center transition-all duration-300 overflow-hidden whitespace-nowrap ${
              isCollapsed 
                ? 'opacity-0 max-w-0 ml-0 pointer-events-none duration-150 delay-0' 
                : 'opacity-100 max-w-xs ml-3 duration-300 delay-200'
            }`}>
              <span className="text-3xl font-bold tracking-tight leading-tight text-primary-900">
                Warga <span className="text-secondary -ml-1.5">Ku</span>
              </span>
              <span className="text-[8px] font-bold text-gray-secondary-text">
                Terhubung, Tertata, Untuk Kita Semua
              </span>
            </div>
          </Link>

          {/* Mobile Drawer Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-gray-secondary-text hover:bg-gray-sidebar-hover lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Desktop Toggle Collapse Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-7 h-6 w-6 items-center justify-center rounded-full border border-gray-border bg-gray-card shadow-md text-gray-placeholder hover:text-primary transition-all duration-200 hover:scale-105 cursor-pointer z-50"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <nav className={`flex-1 px-3 py-4 space-y-1.5 scrollbar-thin ${
          isCollapsed ? "overflow-y-auto lg:overflow-visible lg:overflow-y-visible" : "overflow-y-auto"
        }`}>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const hasSub = !!item.subItems;
            const open = activeAccordion === item.title;
            const parentActive = item.href ? isActive(item.href) : isChildActive(item.subItems);

            // Base parent class for both Button and Link (always transparent container)
            const parentClassName = "flex items-center text-sm font-semibold rounded-xl cursor-pointer w-full bg-transparent text-gray-heading-main p-0 justify-start";

            // Base icon container class (handles background, width, active, and hover states)
            const iconContainerClassName = `flex items-center min-w-0 transition-all duration-300 py-3 rounded-xl ${
              parentActive
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "text-gray-heading-main group-hover:bg-gray-sidebar-hover"
            } ${
              isCollapsed
                ? "w-full max-w-[44px] px-0 justify-center gap-0 ml-[6px] delay-200"
                : "w-full max-w-[264px] px-3 justify-start gap-3 ml-0 delay-0"
            }`;

            return (
              <div key={item.title} className="relative group">
                {/* Accordion / Direct Link Button */}
                {hasSub ? (
                  <button
                    type="button"
                    onClick={() => !isCollapsed && toggleAccordion(item.title)}
                    className={parentClassName}
                  >
                    <div className={iconContainerClassName}>
                      <div className="relative shrink-0">
                        <Icon className="h-5 w-5" />
                        {item.title === "Antrean Persetujuan" && totalPendingApprovals > 0 && isCollapsed && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-600 border border-white" />
                        )}
                      </div>
                      <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                        isCollapsed 
                          ? 'opacity-0 max-w-0 pointer-events-none duration-150 delay-0' 
                          : 'opacity-100 max-w-xs duration-300 delay-200'
                      }`}>
                        {item.title}
                      </span>
                      {item.title === "Antrean Persetujuan" && totalPendingApprovals > 0 && !isCollapsed && (
                        <span className="ml-2 inline-flex items-center justify-center px-1 py-0.5 text-[8px] font-bold leading-none text-white bg-rose-600 rounded-full shrink-0">
                          {totalPendingApprovals}
                        </span>
                      )}
                      <ChevronDown
                        className={`h-4 w-4 text-current transition-all duration-300 ml-auto ${
                          isCollapsed 
                            ? 'opacity-0 scale-0 pointer-events-none duration-150 delay-0 hidden' 
                            : 'opacity-100 scale-100 duration-300 delay-200'
                        } ${open ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>
                ) : (
                  <Link
                    href={item.href || "#"}
                    onClick={(e) => {
                      if (isLocked(item.requiresVerification)) {
                        e.preventDefault();
                        toast.error("Menu ini terkunci. Unggah scan KK dan tunggu verifikasi Ketua RT.");
                        return;
                      }
                      onCloseMobile();
                    }}
                    className={`${parentClassName} ${
                      isLocked(item.requiresVerification)
                        ? "opacity-60 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <div className={iconContainerClassName}>
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                        isCollapsed 
                          ? 'opacity-0 max-w-0 pointer-events-none duration-150 delay-0' 
                          : 'opacity-100 max-w-xs duration-300 delay-200'
                      }`}>
                        {item.title}
                      </span>
                      {isLocked(item.requiresVerification) && (
                        <Lock className="h-3.5 w-3.5 text-amber-500 ml-auto shrink-0" />
                      )}
                    </div>
                  </Link>
                )}

                {/* Submenu Accordion Panel (Desktop Expanded / Mobile) */}
                {hasSub && !isCollapsed && open && (
                  <div className="mt-1">
                    {item.subItems!.map((sub, idx) => {
                      const isSubActive = isActive(sub.href);
                      const isLast = idx === item.subItems!.length - 1;
                      const isSubLocked = isLocked(sub.requiresVerification);
                      return (
                        <div key={sub.href} className="relative pl-7">
                          <div className="pb-1">
                          {/* Vertical Connector Path */}
                          <div
                            className={`absolute left-4 top-0 w-0.5 bg-gray-divider ${
                              isLast ? "h-0" : "bottom-0"
                            }`}
                          />
                          {/* Horizontal Branch Lengkung Path */}
                          <div className="absolute left-4 top-0 w-3 h-4.25 rounded-bl-md border-l-2 border-b-2 border-gray-divider" /> 
                          

                          <Link
                            href={sub.href}
                            onClick={(e) => {
                              if (isSubLocked) {
                                e.preventDefault();
                                toast.error("Menu ini terkunci. Unggah scan KK dan tunggu verifikasi Ketua RT.");
                                return;
                              }
                              onCloseMobile();
                            }}
                            className={`flex items-center justify-between rounded-lg py-2 px-3 text-xs font-semibold transition-colors ${
                              isSubLocked
                                ? "text-gray-secondary-text/60 cursor-not-allowed"
                                : isSubActive
                                ? "bg-primary/10 text-primary font-bold"
                                : "text-gray-secondary-text hover:text-gray-heading-main hover:bg-gray-sidebar-hover"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {sub.title}
                              {getBadgeCount(sub.href) > 0 && (
                                <span className="inline-flex items-center justify-center px-1 py-0.5 text-[8px] font-bold leading-none text-white bg-rose-600 rounded-full shrink-0">
                                  {getBadgeCount(sub.href)}
                                </span>
                              )}
                            </span>
                            {isSubLocked && <Lock className="h-3 w-3 text-amber-500 shrink-0 ml-1.5" />}
                          </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Floating Tooltip showing Menu Name (Desktop Collapsed Mode) */}
                {isCollapsed && (
                  <div className="absolute left-full top-2 ml-3 z-50 bg-[#1E293B] text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-lg opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap">
                    {item.title}
                  </div>
                )}

                {/* Floating Popover Submenu Panel (Desktop Collapsed Mode) */}
                {hasSub && isCollapsed && (
                  <div className="absolute left-full top-10 -ml-4 z-50 w-56 rounded-xl border border-gray-border bg-gray-card/95 backdrop-blur-xl p-2.5 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 origin-top-left">
                    <div>
                      {item.subItems!.map((sub, idx) => {
                        const isSubActive = isActive(sub.href);
                        const isLast = idx === item.subItems!.length - 1;
                        const isSubLocked = isLocked(sub.requiresVerification);
                        return (
                          <div key={sub.href} className="relative pl-7 text-left"> 
                            <div className="pb-1">
                              {/* Vertical Connector Path */}
                              <div
                                className={`absolute left-4 top-0 w-0.5 bg-gray-divider ${
                                isLast ? "h-0" : "bottom-0"
                              }`}
                              />
                              {/* Horizontal Branch Lengkung Path */}
                              <div className="absolute left-4 top-0 w-3 h-4.25 rounded-bl-md border-l-2 border-b-2 border-gray-divider" /> 

                              <Link
                                href={sub.href}
                                onClick={(e) => {
                                  if (isSubLocked) {
                                    e.preventDefault();
                                    toast.error("Menu ini terkunci. Unggah scan KK dan tunggu verifikasi Ketua RT.");
                                    return;
                                  }
                                  onCloseMobile();
                                }}
                                className={`flex items-center justify-between rounded-lg py-2 px-3 text-xs font-semibold transition-colors ${
                                  isSubLocked
                                    ? "text-gray-secondary-text/60 cursor-not-allowed"
                                    : isSubActive
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "text-gray-secondary-text hover:text-gray-heading-main hover:bg-gray-sidebar-hover"
                                }`}
                              >
                               <span className="flex items-center gap-2">
                                 {sub.title}
                                 {getBadgeCount(sub.href) > 0 && (
                                   <span className="inline-flex items-center justify-center px-1 py-0.5 text-[8px] font-bold leading-none text-white bg-rose-600 rounded-full shrink-0">
                                     {getBadgeCount(sub.href)}
                                   </span>
                                 )}
                               </span>
                               {isSubLocked && <Lock className="h-3 w-3 text-amber-500 shrink-0 ml-1.5" />}
                             </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile Card */}
        <div className="border-t border-gray-border/60 p-4 bg-gray-card">
          <div
            className={`flex items-center gap-3 ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            {/* User Details */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-sidebar-hover border border-gray-border text-gray-heading-main">
                <User className="h-5 w-5" />
              </div>
              <div className={`flex flex-col min-w-0 transition-all duration-300 overflow-hidden whitespace-nowrap ${
                isCollapsed 
                  ? 'opacity-0 max-w-0 pointer-events-none duration-150 delay-0' 
                  : 'opacity-100 max-w-xs duration-300 delay-200'
              }`}>
                <span className="text-xs font-bold text-gray-heading-main truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-gray-secondary-text leading-tight truncate">
                  {currentRoleId === 1 && "Super Admin"}
                  {currentRoleId === 2 && "Ketua RT"}
                  {currentRoleId === 3 && "Sekretaris"}
                  {currentRoleId === 4 && "Bendahara"}
                  {currentRoleId === 5 && "Koordinator Kost"}
                  {currentRoleId === 6 && "Warga"}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className={`rounded-lg p-2 text-gray-secondary-text hover:text-error hover:bg-gray-sidebar-hover cursor-pointer transition-all duration-300 ${
                isCollapsed 
                  ? 'opacity-0 max-w-0 pointer-events-none duration-150 delay-0 scale-0' 
                  : 'opacity-100 max-w-xs duration-300 delay-200 scale-100'
              }`}
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
