"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleStore } from "@/lib/store/use-role-store";
import { useFamilyVerification } from "@/lib/hooks/use-family-verification";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function FamilyVerificationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { activeRoleId } = useRoleStore();
  const baseRoleId = session?.user?.roleId;
  const currentRoleId = baseRoleId === 6 ? 6 : (activeRoleId ?? baseRoleId);

  const { isVerified, isLoading } = useFamilyVerification(baseRoleId);

  useEffect(() => {
    if (!isLoading && currentRoleId === 6 && !isVerified) {
      toast.error("Menu ini terkunci. Lengkapi biodata dan unggah scan KK terlebih dahulu untuk diverifikasi Ketua RT.");
      router.replace("/dashboard/family");
    }
  }, [isLoading, currentRoleId, isVerified, router]);

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium text-gray-placeholder">Memeriksa status verifikasi Warga...</span>
      </div>
    );
  }

  if (currentRoleId === 6 && !isVerified) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium text-gray-placeholder">Mengalihkan ke halaman Kelola Keluarga...</span>
      </div>
    );
  }

  return <>{children}</>;
}
