"use client";

import React, { useEffect, useState } from "react";
import { useRoleStore } from "@/lib/store/use-role-store";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { SuperAdminDashboard } from "./_components/SuperAdminDashboard";
import { KetuaRTDashboard } from "./_components/KetuaRTDashboard";
import { WargaDashboard } from "./_components/WargaDashboard";
import { SekretarisDashboard } from "./_components/SekretarisDashboard";
import { BendaharaDashboard } from "./_components/BendaharaDashboard";
import { KoordinatorKosDashboard } from "./_components/KoordinatorKosDashboard";
import { IdleAccountNotice } from "@/components/IdleAccountNotice";

export default function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const { activeRoleId } = useRoleStore();
  const router = useRouter();

  const [assignedRoles, setAssignedRoles] = useState<number[]>([]);
  const userBaseRoleId = session?.user?.roleId ?? (assignedRoles.length > 0 ? assignedRoles[0] : null);
  const [isRolesLoaded, setIsRolesLoaded] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    let isMounted = true;
    async function fetchAssignedRoles() {
      if (!session?.user) return;
      try {
        const res = await fetch(`/api/permissions/my-permissions`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.allowedRoles)) {
            setAssignedRoles(data.allowedRoles);
            
            // Initialize useRoleStore synchronously before re-rendering
            // to ensure activeRoleId is populated properly for new sessions
            const baseRole = session.user.roleId ?? (data.allowedRoles.length > 0 ? data.allowedRoles[0] : null);
            const isOfficer = typeof baseRole === 'number' && baseRole >= 2 && baseRole <= 4;
            const fetchedAllowedRoles = Array.from(
              new Set([...data.allowedRoles, isOfficer ? 6 : null].filter((r): r is number => typeof r === 'number'))
            ).sort((a: any, b: any) => a - b);
            
            useRoleStore.getState().initialize(baseRole, fetchedAllowedRoles);
            
            setIsRolesLoaded(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch assigned roles in Dashboard:", err);
        if (isMounted) setIsRolesLoaded(true);
      }
    }
    fetchAssignedRoles();
    return () => {
      isMounted = false;
    };
  }, [session?.user]);

  const isOfficer = typeof userBaseRoleId === 'number' && userBaseRoleId >= 2 && userBaseRoleId <= 4;
  const allowedRoles = React.useMemo(() => {
    const list = new Set<number>(assignedRoles);
    if (isOfficer) list.add(6);
    return Array.from(list).sort((a, b) => a - b);
  }, [assignedRoles, isOfficer]);

  // Efek untuk mengembalikan pengguna ke menu terakhir yang dibuka saat sesi baru dimulai
  useEffect(() => {
    if (session?.user && activeRoleId !== null && typeof window !== "undefined") {
      const hasRedirected = sessionStorage.getItem("has_initial_redirected");
      if (!hasRedirected) {
        sessionStorage.setItem("has_initial_redirected", "true");
        try {
          const lastPath = localStorage.getItem(`last_path_role_${activeRoleId}`);
          if (lastPath && lastPath.startsWith("/dashboard") && lastPath !== "/dashboard") {
            router.push(lastPath);
          }
        } catch {
          // Abaikan jika storage bermasalah
        }
      }
    }
  }, [session?.user, activeRoleId, router]);

  if (isPending || !isRolesLoaded) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  const validActiveRole =
    activeRoleId !== null && allowedRoles.includes(activeRoleId)
      ? activeRoleId
      : null;

  const currentRoleId =
    validActiveRole ??
    (allowedRoles.length > 0
      ? userBaseRoleId && allowedRoles.includes(userBaseRoleId)
        ? userBaseRoleId
        : allowedRoles[0]
      : null);

  if (!currentRoleId) {
    return <IdleAccountNotice userName={session.user.name} />;
  }

  // Render dashboard based on active role
  switch (currentRoleId) {
    case 1:
      return <SuperAdminDashboard />;
    case 2:
      return <KetuaRTDashboard />;
    case 3:
      return <SekretarisDashboard />;
    case 4:
      return <BendaharaDashboard />;
    case 5:
      return <KoordinatorKosDashboard />;
    case 6:
      return <WargaDashboard />;
    default:
      return <IdleAccountNotice userName={session.user.name} />;
  }
}
