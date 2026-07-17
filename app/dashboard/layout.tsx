"use client";

import React, { useState, useSyncExternalStore } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Berhasil keluar dari akun");
          router.push("/login");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Gagal keluar");
        }
      },
    });
  };

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-page-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  return (
    <div
      data-sidebar-collapsed={isCollapsed}
      className="group/layout flex min-h-screen bg-gray-page-bg font-sans antialiased text-gray-body-text-btn selection:bg-primary/20"
    >
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
      <main className={`flex-1 min-w-0 pt-16 transition-all duration-300 ${
        isCollapsed ? "lg:pl-20" : "lg:pl-72"
      }`}>
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
