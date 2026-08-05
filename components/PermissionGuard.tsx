"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, Loader2, Home } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRoleStore } from "@/lib/store/use-role-store";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRoles?: number[];
  fallbackUrl?: string;
}

export function PermissionGuard({
  children,
  requiredPermission,
  requiredRoles,
  fallbackUrl = "/dashboard",
}: PermissionGuardProps) {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const { activeRoleId } = useRoleStore();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuthorization() {
      if (isSessionPending) return;

      if (!session) {
        if (isMounted) setIsAuthorized(false);
        setIsCheckingPermission(false);
        return;
      }

      let effectiveRole = activeRoleId;

      if (effectiveRole === null && typeof window !== "undefined") {
        const match = document.cookie.match(/(?:^|; )active_role_id=([^;]*)/);
        if (match) {
          const cookieRoleId = parseInt(match[1], 10);
          if (!isNaN(cookieRoleId)) {
            effectiveRole = cookieRoleId;
          }
        }
      }

      if (effectiveRole === null) {
        if (isMounted) setIsCheckingPermission(true);
        return;
      }

      // 1. Role-based check
      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(effectiveRole) && effectiveRole !== 1) {
          if (isMounted) setIsAuthorized(false);
          setIsCheckingPermission(false);
          return;
        }
      }

      // 2. Permission slug-based check via /api/permissions/my-permissions
      if (requiredPermission) {
        try {
          const res = await fetch(`/api/permissions/my-permissions?roleId=${effectiveRole}`);
          if (res.ok) {
            const data = await res.json();
            const permissions: Array<{ slug: string }> = data.permissions || [];
            const hasPerm = effectiveRole === 1 || permissions.some((p) => p.slug === requiredPermission);

            if (isMounted) setIsAuthorized(hasPerm);
          } else {
            if (isMounted) setIsAuthorized(false);
          }
        } catch (err) {
          console.error("Error in PermissionGuard check:", err);
          if (isMounted) setIsAuthorized(false);
        } finally {
          if (isMounted) setIsCheckingPermission(false);
        }
        return;
      }

      if (isMounted) setIsAuthorized(true);
      setIsCheckingPermission(false);
    }

    checkAuthorization();

    return () => {
      isMounted = false;
    };
  }, [session, isSessionPending, activeRoleId, requiredPermission, requiredRoles]);

  if (isSessionPending || isCheckingPermission) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-gray-secondary-text">
          Memeriksa Izin Akses Halaman...
        </span>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="mx-auto max-w-lg my-16 rounded-3xl border border-red-200 bg-red-50/60 p-8 text-center shadow-xl space-y-6 animate-in fade-in duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10 text-error">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-gray-heading-main">
            Akses Ditolak (403 Unauthorized)
          </h3>
          <p className="text-sm text-gray-secondary-text leading-relaxed">
            Peran atau hak akses akun Anda saat ini tidak diizinkan untuk membuka halaman ini.
          </p>
        </div>
        <div className="flex justify-center pt-2">
          <Link
            href={fallbackUrl}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-5 py-3 text-xs font-extrabold shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            <span>Kembali ke Beranda Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
