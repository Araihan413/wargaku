"use client";

import { useState, useEffect, useCallback } from "react";
import { useRoleStore } from "@/lib/store/use-role-store";

export type VerificationStatusType = "draft" | "pending" | "verified" | "rejected" | "unsubmitted";

export interface FamilyVerificationState {
  isVerified: boolean;
  hasVerified: boolean;
  hasFamily: boolean;
  verificationStatus: VerificationStatusType;
  hasUploadedKK: boolean;
  verificationNote: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useFamilyVerification(userRoleId?: number | null): FamilyVerificationState {
  const { activeRoleId } = useRoleStore();
  const currentRoleId = userRoleId !== undefined && userRoleId !== null ? userRoleId : activeRoleId;
  const isWargaOrCoord = currentRoleId === 6 || currentRoleId === 5;
  const isRoleResolved = typeof currentRoleId === "number" && currentRoleId > 0;

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatusType>("unsubmitted");
  const [hasVerified, setHasVerified] = useState<boolean>(false);
  const [hasFamily, setHasFamily] = useState<boolean>(false);
  const [hasUploadedKK, setHasUploadedKK] = useState<boolean>(false);
  const [verificationNote, setVerificationNote] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [refetchIndex, setRefetchIndex] = useState<number>(0);

  const refetch = useCallback(async () => {
    if (!isWargaOrCoord) return;
    setIsFetching(true);
    setRefetchIndex((prev) => prev + 1);
  }, [isWargaOrCoord]);

  useEffect(() => {
    if (!isRoleResolved || !isWargaOrCoord) {
      return;
    }

    let ignore = false;

    async function loadStatus() {
      try {
        const res = await fetch("/api/families/my");
        if (ignore) return;
        if (res.status === 404) {
          setHasFamily(false);
          setVerificationStatus("unsubmitted");
          setHasUploadedKK(false);
          setVerificationNote(null);
        } else if (res.ok) {
          const data = await res.json();
          if (ignore) return;
          setHasFamily(true);
          setVerificationStatus(data.verificationStatus || "pending");
          setHasVerified(Boolean(data.hasVerified));
          setHasUploadedKK(Boolean(data.kkFile));
          setVerificationNote(data.verificationNote || null);
        } else {
          setHasFamily(false);
          setVerificationStatus("unsubmitted");
          setHasVerified(false);
          setHasUploadedKK(false);
        }
      } catch (err) {
        if (ignore) return;
        console.error("Error fetching family verification status:", err);
        setHasFamily(false);
        setVerificationStatus("unsubmitted");
      } finally {
        if (!ignore) {
          setIsFetching(false);
          setHasLoadedOnce(true);
        }
      }
    }

    loadStatus();

    return () => {
      ignore = true;
    };
  }, [isRoleResolved, isWargaOrCoord, currentRoleId, refetchIndex]);

  // Jika role belum diketahui / resolved, tahan dalam status isLoading
  if (!isRoleResolved) {
    return {
      isVerified: false,
      hasVerified: false,
      hasFamily: false,
      verificationStatus: "unsubmitted",
      hasUploadedKK: false,
      verificationNote: null,
      isLoading: true,
      refetch,
    };
  }

  // Jika bukan role warga atau koordinator, langsung verified dan tidak loading
  if (!isWargaOrCoord) {
    return {
      isVerified: true,
      hasVerified: true,
      hasFamily: false,
      verificationStatus: "verified",
      hasUploadedKK: true,
      verificationNote: null,
      isLoading: false,
      refetch,
    };
  }

  const isLoading = !hasLoadedOnce || isFetching;

  return {
    isVerified: hasVerified || verificationStatus === "verified",
    hasVerified,
    hasFamily,
    verificationStatus,
    hasUploadedKK,
    verificationNote,
    isLoading,
    refetch,
  };
}
