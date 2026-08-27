"use client";

import React, { useState, useSyncExternalStore } from "react";
import Script from "next/script";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { OneSignalProvider } from "@/components/OneSignalProvider";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SystemBroadcastBanner } from "@/components/SystemBroadcastBanner";
import { useRoleStore } from "@/lib/store/use-role-store";

const subscribeSidebar = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

const getSidebarSnapshot = () => {
  if (typeof window === "undefined") return "false";
  return localStorage.getItem("sidebar_collapsed") ?? "false";
};

const getSidebarServerSnapshot = () => {
  return "false";
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const sidebarState = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot
  );
  const isCollapsed = sidebarState === "true";

  const handleToggleCollapse = (collapsed: boolean) => {
    localStorage.setItem("sidebar_collapsed", String(collapsed));
    window.dispatchEvent(new Event("storage"));
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("has_initial_redirected");
      // Bersihkan juga history path di localStorage agar tidak nyangkut jika login akun lain
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("last_path_role_")) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        // Abaikan
      }
    }
    useRoleStore.getState().resetRole();
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Berhasil keluar dari akun");
          // Gunakan hard redirect untuk membersihkan status memori client-side sepenuhnya
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/login";
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Gagal keluar");
          setIsLoggingOut(false);
        }
      },
    });
  };

  const user = session?.user;

  React.useEffect(() => {
    // Lewati pengalihan jika sedang dalam proses logout manual untuk menghindari konflik transisi rute
    if (!isPending && !isLoggingOut) {
      if (!user) {
        router.push("/login");
      } else {
        const userStatus = (user as any).status;
        if (userStatus === "pending" || userStatus === "suspended") {
          useRoleStore.getState().resetRole();
          authClient.signOut().then(() => {
            if (userStatus === "pending") {
              toast.error(
                "Akun Anda berstatus PENDING (menunggu verifikasi RT). Akses dashboard belum diizinkan."
              );
            } else {
              toast.error("Akun Anda ditangguhkan.");
            }
            router.push("/login");
          });
        }
      }
    }
  }, [user, isPending, isLoggingOut, router]);

  if (isPending || isLoggingOut) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-page-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const currentStatus = (session.user as any).status;
  if (currentStatus === "pending" || currentStatus === "suspended") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-page-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      data-sidebar-collapsed={isCollapsed}
      className="group/layout flex min-h-screen bg-gray-page-bg font-sans antialiased text-gray-body-text-btn selection:bg-primary/20"
    >
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="lazyOnload"
      />
      <OneSignalProvider />

      {/* Top Navbar */}
      <Navbar
        onOpenMobile={() => setIsMobileDrawerOpen(true)}
        handleLogout={handleLogout}
      />

      {/* Sidebar Component */}
      <Sidebar
        isOpenMobile={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
        isCollapsed={isCollapsed}
        setIsCollapsed={handleToggleCollapse}
        user={user}
        handleLogout={handleLogout}
      />

      {/* Main Content Pane */}
      <main className={`flex-1 min-w-0 pt-16 transition-all duration-300 print:p-0 print:pt-0 print:pl-0 print:m-0 print:bg-white ${
        isCollapsed ? "lg:pl-20" : "lg:pl-70"
      }`}>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none print:space-y-0">
          <div className="print:hidden space-y-4">
            <Breadcrumb />
            <SystemBroadcastBanner />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
