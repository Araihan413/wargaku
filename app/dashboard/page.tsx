"use client";

import React, { useEffect } from "react";
import { useRoleStore } from "@/lib/store/use-role-store";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { KetuaRTDashboard } from "./_components/KetuaRTDashboard";

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

  const currentRoleId = activeRoleId ?? session.user.roleId;

  // Render dashboard based on active role
  switch (currentRoleId) {
    case 1: // Super Admin
      return (
        <div className="space-y-4 rounded-2xl border border-gray-border bg-gray-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-heading-main">Dashboard Super Admin</h1>
          <p className="text-gray-secondary-text">
            Selamat datang di panel utama Super Admin. Silakan gunakan menu sidebar untuk mengelola wewenang, konfigurasi, audit log, dan data wilayah secara terpusat.
          </p>
        </div>
      );
    case 2: // Ketua RT
      return <KetuaRTDashboard />;
    case 3: // Sekretaris
      return (
        <div className="space-y-4 rounded-2xl border border-gray-border bg-gray-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-heading-main">Dashboard Sekretaris</h1>
          <p className="text-gray-secondary-text">
            Selamat datang di panel administrasi Sekretaris. Gunakan menu sidebar untuk mengelola data surat keluar/masuk, verifikasi pendaftaran warga, mengelola pengumuman, dan kegiatan RT.
          </p>
        </div>
      );
    case 4: // Bendahara
      return (
        <div className="space-y-4 rounded-2xl border border-gray-border bg-gray-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-heading-main">Dashboard Bendahara</h1>
          <p className="text-gray-secondary-text">
            Selamat datang di panel keuangan Bendahara. Gunakan menu sidebar untuk mengelola pencatatan pemasukan, pengajuan pengeluaran kas, serta administrasi iuran warga.
          </p>
        </div>
      );
    default: // Warga / Koordinator Kost
      return (
        <div className="space-y-4 rounded-2xl border border-gray-border bg-gray-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-heading-main">Dashboard Warga</h1>
          <p className="text-gray-secondary-text">
            Selamat datang di aplikasi layanan Wargaku. Di sini Anda dapat melihat pengumuman, kegiatan mendatang, transparansi keuangan kas RT, mengajukan surat pengantar, dan membuat laporan pengaduan secara mandiri.
          </p>
        </div>
      );
  }
}