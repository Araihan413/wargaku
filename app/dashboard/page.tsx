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
  const { activeRoleId, initialize } = useRoleStore();
  const router = useRouter();

  const userBaseRoleId = session?.user?.roleId || 6;
  const [assignedRoles, setAssignedRoles] = useState<number[]>([userBaseRoleId]);
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

  const isOfficer = userBaseRoleId >= 2 && userBaseRoleId <= 4;
  const allowedRoles = React.useMemo(() => {
    const list = new Set<number>(assignedRoles);
    if (isOfficer) list.add(6);
    return Array.from(list).sort((a, b) => a - b);
  }, [assignedRoles, isOfficer]);


  useEffect(() => {
    if (session?.user && isRolesLoaded) {
      initialize(session.user.roleId, allowedRoles);
    }
  }, [session, isRolesLoaded, initialize, allowedRoles]);

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
      ? allowedRoles.includes(userBaseRoleId)
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
