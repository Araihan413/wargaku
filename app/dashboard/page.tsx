"use client";

import React, { useEffect } from "react";
import { useRoleStore } from "@/lib/store/use-role-store";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { SuperAdminDashboard } from "./_components/SuperAdminDashboard";
import { KetuaRTDashboard } from "./_components/KetuaRTDashboard";
import { WargaDashboard } from "./_components/WargaDashboard";
import { SekretarisDashboard } from "./_components/SekretarisDashboard";
import { BendaharaDashboard } from "./_components/BendaharaDashboard";
import { KoordinatorKosDashboard } from "./_components/KoordinatorKosDashboard";

export default function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const { activeRoleId, initialize } = useRoleStore();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  const userBaseRoleId = session?.user?.roleId || 6;
  const isOfficer = userBaseRoleId >= 2 && userBaseRoleId <= 5;
  const allowedRoles = React.useMemo(() => {
    if (userBaseRoleId === 1) return [1];
    return isOfficer ? [userBaseRoleId, 6] : [6];
  }, [isOfficer, userBaseRoleId]);

  useEffect(() => {
    if (session?.user) {
      initialize(session.user.roleId, allowedRoles);
    }
  }, [session, initialize, allowedRoles]);

  if (isPending) {
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

  const currentRoleId = validActiveRole ?? session.user.roleId;

  // Render dashboard based on active role
  switch (currentRoleId) {
    case 1: // Super Admin
      return <SuperAdminDashboard />;
    case 2: // Ketua RT
      return <KetuaRTDashboard />;
    case 3: // Sekretaris
      return <SekretarisDashboard />;
    case 4: // Bendahara
      return <BendaharaDashboard />;
    case 5: // Koordinator Kost
      return <KoordinatorKosDashboard />;
    default: // Warga
      return <WargaDashboard />;
  }
}