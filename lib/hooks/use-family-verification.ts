"use client";

import { useState, useEffect, useCallback } from "react";
import { useRoleStore } from "@/lib/store/use-role-store";

export type VerificationStatusType = "draft" | "pending" | "verified" | "rejected" | "changes_pending" | "unsubmitted";

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
  const currentRoleId = userRoleId === 6 ? 6 : (activeRoleId ?? userRoleId ?? undefined);

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatusType>("unsubmitted");
  const [hasVerified, setHasVerified] = useState<boolean>(false);
  const [hasFamily, setHasFamily] = useState<boolean>(false);
  const [hasUploadedKK, setHasUploadedKK] = useState<boolean>(false);
  const [verificationNote, setVerificationNote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refetchIndex, setRefetchIndex] = useState<number>(0);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setRefetchIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (currentRoleId !== 6 && currentRoleId !== 5) return;

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
          setIsLoading(false);
        }
      }
    }

    loadStatus();

    return () => {
      ignore = true;
    };
  }, [currentRoleId, refetchIndex]);

  const isNonWarga = currentRoleId !== undefined && currentRoleId !== 6 && currentRoleId !== 5;

  return {
    isVerified: isNonWarga || hasVerified || verificationStatus === "verified" || verificationStatus === "changes_pending",
    hasVerified: isNonWarga ? true : hasVerified,
    hasFamily,
    verificationStatus: isNonWarga ? "verified" : verificationStatus,
    hasUploadedKK: isNonWarga ? true : hasUploadedKK,
    verificationNote: isNonWarga ? null : verificationNote,
    isLoading: isNonWarga ? false : (currentRoleId === undefined ? true : isLoading),
    refetch,
  };
}

