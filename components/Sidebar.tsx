"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Settings,
  Users,
  UserCheck,
  LifeBuoy,
  Clock,
  Wallet,
  CircleDollarSign,
  Megaphone,
  Search,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  User,
  Lock,
  Radio,
} from "lucide-react";

interface SidebarSubItem {
  title: string;
  href: string;
  permission?: string;
  requiresVerification?: boolean;
}

interface SidebarItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  subItems?: SidebarSubItem[];
  permission?: string;
  requiresVerification?: boolean;
}

// Full schema of dynamic, permission-driven sidebar items (1-to-1 unique permissions)
const sidebarItems: SidebarItem[] = [
  // 0. Dashboard Utama (Semua Role)
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },

  // 1. Super Admin Control & Monitoring (Dynamic Permitted)
  {
    title: "Manajemen Pengguna",
    icon: UserCheck,
    href: "/dashboard/users",
    permission: "manage-users",
  },
  {
    title: "Keamanan & Otoritas",
    icon: ShieldCheck,
    subItems: [
      { title: "Role & Permission", href: "/dashboard/permissions", permission: "manage-roles" },
      { title: "Log Aktivitas Audit", href: "/dashboard/audit-logs", permission: "view-audit-logs" },
    ],
  },
  {
    title: "Laporan Pengaduan Global",
    icon: LifeBuoy,
    href: "/dashboard/complaints-report",
    permission: "view-complaints-report",
  },
  {
    title: "Konfigurasi Sistem",
    icon: Settings,
    href: "/dashboard/system-config",
    permission: "manage-system-config",
  },
  {
    title: "Broadcast Sistem",
    icon: Radio,
    href: "/dashboard/system-broadcast",
    permission: "manage-system-config",
  },

  // 2. Modul Kependudukan & Hunian RT (Dynamic Permitted)
  {
    title: "Kelola Kependudukan",
    icon: Users,
    subItems: [
      { title: "Data Warga & Hunian", href: "/dashboard/residents", permission: "view-residents" },
      { title: "Kelompok Warga", href: "/dashboard/smart-groups", permission: "manage-smart-groups" },
      { title: "Cetak QR Code RT", href: "/dashboard/qr-codes", permission: "manage-dwellings" },
    ],
  },

  // 3. Modul Antrean Persetujuan RT (Dynamic Permitted)
  {
    title: "Antrean Persetujuan",
    icon: Clock,
    subItems: [
      { title: "Persetujuan Registrasi", href: "/dashboard/approvals/registration", permission: "verify-registrations" },
      { title: "Verifikasi Kependudukan", href: "/dashboard/approvals/documents", permission: "verify-documents" },
    ],
  },

  // 4. Modul Kas RT / Cashflow (Dynamic Permitted)
  {
    title: "Kas RT (Cashflow)",
    icon: Wallet,
    subItems: [
      { title: "Catat Pemasukan Kas", href: "/dashboard/kas/income", permission: "manage-income" },
      { title: "Catat Pengeluaran Kas", href: "/dashboard/kas/expense", permission: "manage-expense" },
      { title: "Laporan Keuangan Kas RT", href: "/dashboard/kas/reports", permission: "view-finance" },
    ],
  },

  // 5. Modul Iuran Warga (Dynamic Permitted)
  {
    title: "Iuran Warga",
    icon: CircleDollarSign,
    subItems: [
      { title: "Kelola & Setor Iuran", href: "/dashboard/iuran/manage", permission: "manage-iuran" },
      { title: "Laporan Tunggakan Iuran", href: "/dashboard/iuran/tunggakan", permission: "view-arrears" },
    ],
  },

  // 6. Modul Portal Informasi & Layanan (Dynamic Permitted)
  {
    title: "Portal Informasi & Layanan",
    icon: Megaphone,
    subItems: [
      { title: "Kelola Pengumuman", href: "/dashboard/announcements", permission: "manage-announcements" },
      { title: "Kelola Kegiatan RT", href: "/dashboard/activities", permission: "manage-activities" },
      { title: "Tanggapan Pengaduan Warga", href: "/dashboard/complaints", permission: "manage-complaints" },
    ],
  },

  // 7. Modul Properti Sewa (Koordinator Kos / Merangkap)
  {
    title: "Kelola Penyewa Kos",
    icon: Building2,
    href: "/dashboard/rentals",
    permission: "manage-boarding",
  },

  // 8. Fitur Personal Warga (Dynamic Permitted)
  {
    title: "Kelola Anggota Keluarga",
    icon: User,
    href: "/dashboard/family",
    permission: "manage-family-profile",
  },
  {
    title: "Peta Hunian & Tetangga",
    icon: Search,
    href: "/dashboard/neighborhood",
    permission: "view-neighborhood-map",
    requiresVerification: true,
  },
  {
    title: "Status & Histori Iuran",
    icon: Wallet,
    href: "/dashboard/my-fees",
    permission: "view-my-fees",
    requiresVerification: true,
  },
  {
    title: "Aset Properti Sewa",
    icon: Building2,
    href: "/dashboard/my-properties",
    permission: "manage-my-properties",
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

  // State untuk floating popover
  const [hoveredItem, setHoveredItem] = useState<{
    item: SidebarItem;
    top: number;
  } | null>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (item: SidebarItem, e: React.MouseEvent) => {
    if (!isCollapsed) return;
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoveredItem({ item, top: rect.top });
  };

  const handleMouseLeave = () => {
    if (!isCollapsed) return;
    hoverTimeout.current = setTimeout(() => {
      setHoveredItem(null);
    }, 150);
  };

  const { activeRoleId } = useRoleStore();
  const currentRoleId = activeRoleId ?? 6;
  const { isVerified, hasFamily, verificationStatus, isLoading: isVerificationLoading } = useFamilyVerification(currentRoleId);

  const [pendingRegCount, setPendingRegCount] = useState<number>(0);
  const [pendingDocCount, setPendingDocCount] = useState<number>(0);

  useEffect(() => {
    if (currentRoleId !== 2 && currentRoleId !== 3) return;

    const fetchCounts = async () => {
      try {
        const [regRes, familyDocRes, rentalDocRes] = await Promise.all([
          fetch("/api/approvals/registration"),
          fetch("/api/approvals/documents?type=family&status=pending"),
          fetch("/api/approvals/documents?type=rental_resident&status=pending")
        ]);

        if (regRes.ok) {
          const regData = await regRes.json();
          setPendingRegCount(regData.data?.length || 0);
        }
        
        let familyCount = 0;
        let rentalCount = 0;

        if (familyDocRes.ok) {
          const famData = await familyDocRes.json();
          familyCount = famData.data?.length || 0;
        }
        if (rentalDocRes.ok) {
          const rentData = await rentalDocRes.json();
          rentalCount = rentData.data?.length || 0;
        }

        setPendingDocCount(familyCount + rentalCount);
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

  const isUnlockedStatus =
    isVerified ||
    verificationStatus === "verified" ||
    verificationStatus === "changes_pending";

  const isLocked = (requiresVerification?: boolean) =>
    currentRoleId === 6 && Boolean(requiresVerification) && !isVerificationLoading && !isUnlockedStatus;

  const [userPermissions, setUserPermissions] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(`cached_permissions_role_${currentRoleId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }
    return [];
  });
  const [isFetchingPermissions, setIsFetchingPermissions] = useState(() => userPermissions.length === 0);

  useEffect(() => {
    let isMounted = true;
    async function fetchPermissions() {
      setIsFetchingPermissions(true);
      try {
        const res = await fetch(`/api/permissions/my-permissions?roleId=${currentRoleId}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            const rawPerms = Array.isArray(json.permissions) ? json.permissions : [];
            const slugs = rawPerms.map((p: any) => (typeof p === "string" ? p : p.slug)).filter(Boolean);
            setUserPermissions(slugs);
            if (typeof window !== "undefined") {
              sessionStorage.setItem(`cached_permissions_role_${currentRoleId}`, JSON.stringify(slugs));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch permissions in Sidebar:", err);
      } finally {
        if (isMounted) {
          setIsFetchingPermissions(false);
        }
      }
    }
    fetchPermissions();
    return () => {
      isMounted = false;
    };
  }, [currentRoleId]);

  // Filter items matching the current active role and permission matrix
  const filteredItems = useMemo(() => {
    if (activeRoleId === null) {
      // Tampilkan hanya menu dasar (Dashboard) saat role belum terinisialisasi atau saat logout
      return sidebarItems.filter(item => !item.permission && !item.requiresVerification);
    }

    return sidebarItems
      .map((item) => {
        // Cek filter permission eksplisit jika ada
        if (item.permission && !userPermissions.includes(item.permission)) {
          return null;
        }

        // Aturan khusus Koordinator Kos (Role 5): Fitur Warga personal disyaratkan registrasi KK
        if (
          currentRoleId === 5 &&
          (item.title === "Kelola Anggota Keluarga" ||
            item.href === "/dashboard/my-properties" ||
            item.href === "/dashboard/neighborhood") &&
          !hasFamily
        ) {
          return null;
        }

        // Jika item memiliki subItems, filter subItems yang berizin
        if (item.subItems) {
          const validSubItems = item.subItems.filter((sub) => {
            if (sub.permission && !userPermissions.includes(sub.permission)) {
              return false;
            }
            return true;
          });

          // Jika setelah difilter subItems kosong, auto-hide menu induk ini
          if (validSubItems.length === 0) {
            return null;
          }

          return { ...item, subItems: validSubItems };
        }

        return item;
      })
      .filter((item): item is SidebarItem => item !== null);
  }, [activeRoleId, currentRoleId, userPermissions, hasFamily]);

  const isActive = useCallback(
    (href?: string) => {
      if (!href) return false;
      if (href === "/dashboard") return pathname === "/dashboard";
      if (href === "/dashboard/family" && pathname.startsWith("/dashboard/family/surat")) {
        return false;
      }
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
  );

  const isChildActive = useCallback(
    (subItems?: SidebarSubItem[]) =>
      subItems ? subItems.some((sub) => isActive(sub.href)) : false,
    [isActive]
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
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
          {isFetchingPermissions ? (
            /* Skeleton Loaders */
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${isCollapsed ? "justify-center" : "justify-start"} animate-pulse`}>
                <div className="h-5 w-5 rounded-md bg-gray-border shrink-0" />
                {!isCollapsed && <div className="h-4 w-32 rounded-md bg-gray-border" />}
              </div>
            ))
          ) : (
            filteredItems.map((item, index) => {
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
              <div 
                key={`${item.title}-${index}`} 
                className="relative"
                onMouseEnter={(e) => handleMouseEnter(item, e)}
                onMouseLeave={handleMouseLeave}
              >
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
                ) : (() => {
                  const itemLocked = isLocked(item.requiresVerification);
                  return (
                    <Link
                      href={item.href || "#"}
                      onClick={(e) => {
                        if (itemLocked) {
                          e.preventDefault();
                          toast.error("Menu ini terkunci. Unggah scan KK dan tunggu verifikasi Ketua RT.");
                          return;
                        }
                        onCloseMobile();
                      }}
                      className={`${parentClassName} ${
                        itemLocked ? "cursor-not-allowed" : ""
                      }`}
                    >
                      <div className={iconContainerClassName}>
                        <div className="relative shrink-0 flex items-center justify-center">
                          <Icon className={`h-5 w-5 transition-opacity ${itemLocked ? "opacity-40" : ""}`} />
                          {itemLocked && (
                            <div className="absolute -bottom-1 -right-1 flex p-1 items-center justify-center bg-amber-500 text-white rounded-2xl opacity-80">
                              <Lock className="h-3 w-3 stroke-[2.5]" />
                            </div>
                          )}
                        </div>
                        <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                          isCollapsed 
                            ? 'opacity-0 max-w-0 pointer-events-none duration-150 delay-0' 
                            : 'opacity-100 max-w-xs duration-300 delay-200'
                        } ${itemLocked ? "opacity-50 font-medium" : ""}`}>
                          {item.title}
                        </span>
                      </div>
                    </Link>
                  );
                })()}

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
              </div>
            );
          }))}
        </nav>

        {/* Sidebar Footer / User Profile Card */}
        <div className="border-t border-gray-border/60 p-4 bg-gray-card">
          <div
            className={`flex items-center gap-3 ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            {/* User Details (Clickable Link to /dashboard/profile) */}
            <Link
              href="/dashboard/profile"
              onClick={onCloseMobile}
              className="flex items-center gap-3 min-w-0 group/user cursor-pointer rounded-xl p-1 -m-1"
              title="Buka Profil Saya"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-sidebar-hover border border-gray-border text-gray-heading-main overflow-hidden relative">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "Foto Profil"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div className={`flex flex-col min-w-0 transition-all duration-300 overflow-hidden whitespace-nowrap ${
                isCollapsed 
                  ? 'opacity-0 max-w-0 pointer-events-none duration-150 delay-0' 
                  : 'opacity-100 max-w-xs duration-300 delay-200'
              }`}>
                <span className="text-xs font-bold text-gray-heading-main group-hover/user:text-primary transition-colors truncate">
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
            </Link>

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

      {/* Floating Tooltip / Popover (Desktop Collapsed Mode) */}
      {isCollapsed && hoveredItem && (
        <div
          className="fixed left-20 z-100"
          style={{ top: hoveredItem.top }}
          onMouseEnter={() => {
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          {hoveredItem.item.subItems ? (
            /* Popover Submenu */
            <div className="ml-1 mt-1 w-56 rounded-xl border border-gray-border bg-gray-card/95 backdrop-blur-xl p-2.5 shadow-2xl origin-top-left animate-in fade-in zoom-in-95 duration-200">
              <div className="mb-1.5 px-3 pb-1.5 border-b border-gray-border/50">
                <span className="text-xs font-bold text-gray-heading-main">
                  {hoveredItem.item.title}
                </span>
              </div>
              <div>
                {hoveredItem.item.subItems.map((sub, idx) => {
                  const isSubActive = isActive(sub.href);
                  const isLast = idx === hoveredItem.item.subItems!.length - 1;
                  const isSubLocked = isLocked(sub.requiresVerification);
                  return (
                    <div key={sub.href} className="relative pl-7 text-left">
                      <div className="pb-1">
                        <div className={`absolute left-4 top-0 w-0.5 bg-gray-divider ${isLast ? "h-0" : "bottom-0"}`} />
                        <div className="absolute left-4 top-0 w-3 h-4.25 rounded-bl-md border-l-2 border-b-2 border-gray-divider" />
                        <Link
                          href={sub.href}
                          onClick={(e) => {
                            if (isSubLocked) {
                              e.preventDefault();
                              toast.error("Menu ini terkunci. Unggah scan KK dan tunggu verifikasi Ketua RT.");
                              return;
                            }
                            setHoveredItem(null);
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
          ) : (
            /* Standard Tooltip */
            <div className="ml-3 mt-1.5 bg-[#1E293B] text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
              {hoveredItem.item.title}
            </div>
          )}
        </div>
      )}
    </>
  );
};
