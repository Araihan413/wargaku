"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Home, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { WargaKKHeader } from "./_components/WargaKKHeader";
import { WargaMemberTable } from "./_components/WargaMemberTable";
import { AddWargaMemberModal } from "./_components/AddWargaMemberModal";
import { EditWargaMemberModal } from "./_components/EditWargaMemberModal";
import { DeleteWargaMemberModal } from "./_components/DeleteWargaMemberModal";
import { WargaFamilyDetail, WargaFamilyMember } from "./types";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function StandaloneWargaFamilyPage() {
  return (
    <PermissionGuard requiredPermission="manage-family-profile">
      <WargaFamilyContent />
    </PermissionGuard>
  );
}

function WargaFamilyContent() {
  const [familyId, setFamilyId] = useState<number | null>(null);
  const [familyDetail, setFamilyDetail] = useState<WargaFamilyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<WargaFamilyMember | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMemberForDelete, setSelectedMemberForDelete] = useState<WargaFamilyMember | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedMemberForRestore, setSelectedMemberForRestore] = useState<WargaFamilyMember | null>(null);
  const [isRestoringMember, setIsRestoringMember] = useState(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);

  const [isSubmittingToRT, setIsSubmittingToRT] = useState(false);
  const [isCancellingChange, setIsCancellingChange] = useState(false);
  const [showCancelChangeConfirm, setShowCancelChangeConfirm] = useState(false);
  const [isCancellingSubmit, setIsCancellingSubmit] = useState(false);
  const [showCancelSubmitConfirm, setShowCancelSubmitConfirm] = useState(false);

  // Change request helpers
  const activeChangeReq = familyDetail?.changeRequest;
  const isChangeDraftActive = Boolean(
    activeChangeReq && (activeChangeReq.status === "draft" || activeChangeReq.status === "rejected")
  );
  const isChangePending = Boolean(activeChangeReq && activeChangeReq.status === "pending");

  const displayedMembers = isChangeDraftActive || isChangePending
    ? activeChangeReq?.draftData.members || []
    : familyDetail?.members || [];

  const isPending = isChangePending || (!activeChangeReq && familyDetail?.verificationStatus === "pending");
  const isLocked = isChangePending || (!activeChangeReq && (familyDetail?.verificationStatus === "verified" || familyDetail?.verificationStatus === "pending"));

  // Helper to fetch family details
  const fetchFamilyDetails = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/families/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFamilyDetail(data);
      } else {
        const err = await res.json();
        setError(err.error || "Gagal memuat rincian Kartu Keluarga");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem saat mengambil data");
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const res = await fetch("/api/families/my");
        if (!res.ok) {
          const data = await res.json();
          if (isMounted) {
            setError(data.error || "Gagal memuat data Kartu Keluarga Anda.");
          }
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        if (!data.isHeadOfFamily) {
          setError("Akses Ditolak: Hanya Kepala Keluarga yang berhak mengelola data keluarga.");
          setIsLoading(false);
          return;
        }

        setFamilyId(data.id);
        const detailRes = await fetch(`/api/families/${data.id}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          if (isMounted) {
            setFamilyDetail(detailData);
          }
        } else {
          const err = await detailRes.json();
          if (isMounted) {
            setError(err.error || "Gagal memuat rincian Kartu Keluarga");
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("Terjadi kesalahan koneksi sistem.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Custom handlers for Draft Change Request
  const handleAddMemberToDraft = async (data: any): Promise<boolean> => {
    if (!familyDetail?.changeRequest) return false;
    const currentMembers = familyDetail.changeRequest.draftData.members || [];
    const newMember: WargaFamilyMember = {
      ...data,
      id: Date.now(),
      tempId: String(Date.now()),
      isActive: true,
      _action: "create",
    };
    const updated = [...currentMembers, newMember];
    try {
      const res = await fetch(`/api/families/${familyDetail.id}/change-request`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyNumber: familyDetail.changeRequest.familyNumber || familyDetail.familyNumber,
          kkFile: familyDetail.changeRequest.kkFile || familyDetail.kkFile,
          members: updated,
        }),
      });

      if (res.ok) {
        toast.success(`Anggota keluarga "${data.name}" berhasil ditambahkan ke draf`);
        fetchFamilyDetails(familyDetail.id);
        return true;
      }
      const err = await res.json();
      toast.error(err.error || "Gagal menambahkan anggota ke draf");
      return false;
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan draf");
      return false;
    }
  };

  const handleEditMemberInDraft = async (data: any): Promise<boolean> => {
    if (!familyDetail?.changeRequest || !selectedMemberForEdit) return false;
    const currentMembers = familyDetail.changeRequest.draftData.members || [];
    const updated = currentMembers.map((m) => {
      const match = (selectedMemberForEdit.id && m.id === selectedMemberForEdit.id) ||
                    (selectedMemberForEdit.tempId && m.tempId === selectedMemberForEdit.tempId);
      if (!match) return m;
      return {
        ...m,
        ...data,
        _action: m.id && m._action !== "create" ? "update" : m._action || "update",
      };
    });

    try {
      const res = await fetch(`/api/families/${familyDetail.id}/change-request`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyNumber: familyDetail.changeRequest.familyNumber || familyDetail.familyNumber,
          kkFile: familyDetail.changeRequest.kkFile || familyDetail.kkFile,
          members: updated,
        }),
      });

      if (res.ok) {
        fetchFamilyDetails(familyDetail.id);
        return true;
      }
      const err = await res.json();
      toast.error(err.error || "Gagal memperbarui data anggota di draf");
      return false;
    } catch {
      toast.error("Terjadi kesalahan sistem saat memperbarui draf");
      return false;
    }
  };

  const handleDeleteMemberInDraft = async (member: WargaFamilyMember, note: string) => {
    if (!familyDetail?.changeRequest) return;
    const currentMembers = familyDetail.changeRequest.draftData.members || [];
    let updated: WargaFamilyMember[];

    if (member.tempId || member._action === "create") {
      updated = currentMembers.filter((m) => m !== member && m.tempId !== member.tempId);
    } else {
      updated = currentMembers.map((m) => {
        if (m.id === member.id) {
          return {
            ...m,
            isActive: false,
            inactiveNote: note || "Dinonaktifkan oleh Kepala Keluarga",
            _action: "delete" as const,
          };
        }
        return m;
      });
    }

    try {
      const res = await fetch(`/api/families/${familyDetail.id}/change-request`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyNumber: familyDetail.changeRequest.familyNumber || familyDetail.familyNumber,
          kkFile: familyDetail.changeRequest.kkFile || familyDetail.kkFile,
          members: updated,
        }),
      });

      if (res.ok) {
        fetchFamilyDetails(familyDetail.id);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menonaktifkan anggota di draf");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleCancelChange = async () => {
    if (!familyDetail) return;
    setIsCancellingChange(true);
    try {
      const res = await fetch(`/api/families/${familyDetail.id}/change-request`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Draf perubahan berhasil dibatalkan!");
        setShowCancelChangeConfirm(false);
        fetchFamilyDetails(familyDetail.id);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal membatalkan perubahan");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsCancellingChange(false);
    }
  };

  const handleSubmitToRT = async () => {
    if (!familyDetail) return;
    setIsSubmittingToRT(true);
    try {
      const endpoint = isChangeDraftActive
        ? `/api/families/${familyDetail.id}/change-request/submit`
        : `/api/families/${familyDetail.id}/submit`;

      const res = await fetch(endpoint, {
        method: "POST",
      });

      if (res.ok) {
        toast.success(
          isChangeDraftActive
            ? "Permohonan perubahan data KK berhasil dikirim ke RT!"
            : "Berkas Kartu Keluarga berhasil dikirim ke RT!"
        );
        setIsConfirmSubmitOpen(false);
        fetchFamilyDetails(familyDetail.id);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mengirim berkas ke RT");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat mengirim.");
    } finally {
      setIsSubmittingToRT(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!familyDetail) return;
    setIsCancellingSubmit(true);
    try {
      const endpoint = isChangePending
        ? `/api/families/${familyDetail.id}/change-request`
        : `/api/families/${familyDetail.id}/submit`;

      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        toast.success("Pengajuan verifikasi berhasil dibatalkan!");
        setShowCancelSubmitConfirm(false);
        if (familyId) fetchFamilyDetails(familyId);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal membatalkan pengajuan");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsCancellingSubmit(false);
    }
  };

  const handleRestoreMember = async () => {
    if (!selectedMemberForRestore || !familyId) return;
    setIsRestoringMember(true);
    try {
      if (isChangeDraftActive && activeChangeReq) {
        const currentMembers = activeChangeReq.draftData.members || [];
        const updated = currentMembers.map((m) => {
          if (m.id === selectedMemberForRestore.id || (m.tempId && m.tempId === selectedMemberForRestore.tempId)) {
            return {
              ...m,
              isActive: true,
              inactiveNote: null,
              _action: m.id ? ("update" as const) : ("create" as const),
            };
          }
          return m;
        });
        const res = await fetch(`/api/families/${familyDetail.id}/change-request`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            familyNumber: activeChangeReq.familyNumber || familyDetail.familyNumber,
            kkFile: activeChangeReq.kkFile || familyDetail.kkFile,
            members: updated,
          }),
        });

        if (res.ok) {
          toast.success(`${selectedMemberForRestore.name} berhasil diaktifkan kembali di draf!`);
          setIsRestoreModalOpen(false);
          setSelectedMemberForRestore(null);
          fetchFamilyDetails(familyId);
        } else {
          const err = await res.json();
          toast.error(err.error || "Gagal mengaktifkan kembali anggota");
        }
      } else {
        const res = await fetch(`/api/family-members/${selectedMemberForRestore.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true, inactiveNote: null }),
        });
        if (res.ok) {
          toast.success(`${selectedMemberForRestore.name} berhasil diaktifkan kembali!`);
          setIsRestoreModalOpen(false);
          setSelectedMemberForRestore(null);
          fetchFamilyDetails(familyId);
        } else {
          const err = await res.json();
          toast.error(err.error || "Gagal mengaktifkan kembali anggota");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsRestoringMember(false);
    }
  };

  if (isLoading && !familyDetail) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="h-56 w-full rounded-3xl bg-gray-card border border-gray-border p-6 shadow-xs" />
        <div className="h-72 w-full rounded-3xl bg-gray-card border border-gray-border p-6 shadow-xs" />
        <div className="h-44 w-full rounded-3xl bg-gray-card border border-gray-border p-6 shadow-xs" />
      </div>
    );
  }

  if (error || !familyDetail) {
    return (
      <div className="mx-auto max-w-md my-12 rounded-3xl border border-red-100 bg-red-50/50 p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-gray-heading-main">Keluarga Belum Terdaftar</h3>
        <p className="mt-2 text-sm text-gray-secondary-text leading-relaxed">
          {error || "Data Kartu Keluarga Anda belum terdaftar di sistem. Silakan hubungi Ketua RT."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-900 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all"
          >
            <Home className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-heading-main">
            Kelola Anggota Keluarga
          </h1>
          <p className="text-xs sm:text-sm text-gray-secondary-text mt-0.5">
            Lengkapi berkas Kartu Keluarga, scan KTP, dan atur biodata anggota keluarga Anda.
          </p>
        </div>
      </div>

      {/* 1. Header Card & Verification Alert Status */}
      <WargaKKHeader
        family={familyDetail}
        isLocked={isLocked}
        onRefresh={() => {
          if (familyId) fetchFamilyDetails(familyId);
        }}
        onCancelChange={() => setShowCancelChangeConfirm(true)}
      />

      {/* 2. List of Family Members Table */}
      <WargaMemberTable
        members={displayedMembers}
        isLocked={isLocked}
        isPending={isPending}
        onAddMember={() => setIsAddModalOpen(true)}
        onEditMember={(member) => {
          setSelectedMemberForEdit(member);
          setIsEditModalOpen(true);
        }}
        onDeleteMember={(member) => {
          setSelectedMemberForDelete(member);
          setIsDeleteModalOpen(true);
        }}
        onRestoreMember={(member) => {
          setSelectedMemberForRestore(member);
          setIsRestoreModalOpen(true);
        }}
      />

      {/* Modals */}
      {/* Add Member Modal */}
      {familyId && (
        <AddWargaMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchFamilyDetails(familyId);
          }}
          familyId={familyId}
          onCustomSubmit={isChangeDraftActive ? handleAddMemberToDraft : undefined}
        />
      )}

      {/* Edit Member Modal */}
      <EditWargaMemberModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMemberForEdit(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedMemberForEdit(null);
          if (familyId) fetchFamilyDetails(familyId);
        }}
        member={selectedMemberForEdit}
        isLocked={isLocked}
        onCustomSubmit={isChangeDraftActive ? handleEditMemberInDraft : undefined}
      />

      {/* Delete Member Modal */}
      <DeleteWargaMemberModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMemberForDelete(null);
        }}
        onSuccess={() => {
          setIsDeleteModalOpen(false);
          setSelectedMemberForDelete(null);
          if (familyId) fetchFamilyDetails(familyId);
        }}
        member={selectedMemberForDelete}
        onCustomDelete={isChangeDraftActive ? handleDeleteMemberInDraft : undefined}
      />

      {/* Restore Member Confirm Modal */}
      <ConfirmModal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setIsRestoreModalOpen(false);
          setSelectedMemberForRestore(null);
        }}
        onConfirm={handleRestoreMember}
        title="Aktifkan Kembali Anggota"
        description={selectedMemberForRestore ? `Apakah Anda yakin ingin mengaktifkan kembali ${selectedMemberForRestore.name} sebagai anggota keluarga aktif?` : ""}
        confirmText="Ya, Aktifkan"
        cancelText="Batal"
        isLoading={isRestoringMember}
        variant="primary"
      />

      {/* Confirm Submit to RT Modal */}
      <ConfirmModal
        isOpen={isConfirmSubmitOpen}
        onClose={() => setIsConfirmSubmitOpen(false)}
        onConfirm={handleSubmitToRT}
        title="Konfirmasi Pengiriman Data"
        description={
          isChangeDraftActive
            ? "Apakah Anda yakin usulan perubahan data Kartu Keluarga sudah sesuai? Berkas usulan akan dikirim ke RT untuk ditinjau."
            : "Apakah Anda yakin data Kartu Keluarga sudah sesuai? Setelah dikirim, data akan dikunci untuk verifikasi RT."
        }
        confirmText="Ya, Kirim"
        cancelText="Batal"
        isLoading={isSubmittingToRT}
        variant="primary"
      />

      {/* Confirm Cancel Submit Modal */}
      <ConfirmModal
        isOpen={showCancelSubmitConfirm}
        onClose={() => setShowCancelSubmitConfirm(false)}
        onConfirm={handleCancelSubmit}
        title="Batalkan Pengajuan Verifikasi"
        description="Apakah Anda yakin ingin membatalkan pengajuan verifikasi ke RT? Data Anda akan kembali dapat disunting."
        confirmText="Ya, Batalkan"
        cancelText="Batal"
        isLoading={isCancellingSubmit}
        variant="danger"
      />

      {/* Confirm Cancel Change Modal */}
      <ConfirmModal
        isOpen={showCancelChangeConfirm}
        onClose={() => setShowCancelChangeConfirm(false)}
        onConfirm={handleCancelChange}
        title="Batalkan Perubahan Data"
        description="Apakah Anda yakin ingin membatalkan draf perubahan data KK ini? Seluruh draf usulan akan dibuang dan data resmi Anda tetap utuh."
        confirmText="Ya, Batalkan"
        cancelText="Batal"
        isLoading={isCancellingChange}
        variant="danger"
      />

      {/* Action Button Section for Editable States (draft, rejected, or active change draft) */}
      {!isLocked && (isChangeDraftActive || familyDetail.verificationStatus === "draft" || familyDetail.verificationStatus === "rejected") && (
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 pt-4 border-t border-gray-border/40 mt-6">
          <button
            type="button"
            onClick={() => setIsConfirmSubmitOpen(true)}
            disabled={isSubmittingToRT || (!familyDetail.kkFile && !activeChangeReq?.kkFile)}
            title={(!familyDetail.kkFile && !activeChangeReq?.kkFile) ? "Harap unggah berkas Scan KK terlebih dahulu" : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 text-sm font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] duration-150 disabled:hover:scale-100 cursor-pointer"
          >
            {isSubmittingToRT ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Send className="h-4.5 w-4.5" />
            )}
            <span>
              {isChangeDraftActive
                ? "Kirim Perubahan ke RT"
                : familyDetail.verificationStatus === "rejected"
                ? "Ajukan Ulang ke RT"
                : "Verifikasi Ke RT"}
            </span>
          </button>
        </div>
      )}

      {/* Action Button Section for Pending State */}
      {(isChangePending || (!activeChangeReq && familyDetail.verificationStatus === "pending")) && (
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 pt-4 border-t border-gray-border/40 mt-6">
          <button
            type="button"
            onClick={() => setShowCancelSubmitConfirm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-800 px-5 py-3 text-sm font-bold transition-all shadow-md cursor-pointer duration-150 active:scale-95"
          >
            <XCircle className="h-4.5 w-4.5 text-red-700" />
            <span>Batalkan Pengajuan Verifikasi</span>
          </button>
        </div>
      )}
    </div>
  );
}
