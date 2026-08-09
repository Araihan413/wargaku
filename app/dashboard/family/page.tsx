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
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);

  const [isSubmittingToRT, setIsSubmittingToRT] = useState(false);
  const [isCancellingChange, setIsCancellingChange] = useState(false);
  const [showCancelChangeConfirm, setShowCancelChangeConfirm] = useState(false);

  const handleCancelChange = async () => {
    if (!familyDetail) return;
    setIsCancellingChange(true);
    try {
      const res = await fetch(`/api/families/${familyDetail.id}/cancel-change`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Perubahan berhasil dibatalkan!");
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
      const res = await fetch(`/api/families/${familyDetail.id}/submit`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Berkas Kartu Keluarga berhasil dikirim ke RT!");
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

  const handleConfirmSubmit = () => {
    setIsConfirmSubmitOpen(true);
  };

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

  if (isLoading && !familyDetail) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium text-gray-placeholder">Memuat Data Kartu Keluarga...</span>
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



  const isLocked = familyDetail.verificationStatus === "verified" || familyDetail.verificationStatus === "pending";



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
        onRefresh={() => {
          if (familyId) fetchFamilyDetails(familyId);
        }}
      />

      {/* 2. List of Family Members Table */}
      <WargaMemberTable
        members={familyDetail.members || []}
        isLocked={isLocked}
        onAddMember={() => setIsAddModalOpen(true)}
        onEditMember={(member) => {
          setSelectedMemberForEdit(member);
          setIsEditModalOpen(true);
        }}
        onDeleteMember={(member) => {
          setSelectedMemberForDelete(member);
          setIsDeleteModalOpen(true);
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
      />

      {/* Confirm Submit to RT Modal */}
      <ConfirmModal
        isOpen={isConfirmSubmitOpen}
        onClose={() => setIsConfirmSubmitOpen(false)}
        onConfirm={handleSubmitToRT}
        title="Konfirmasi Pengiriman Data"
        description="Apakah Anda yakin data Kartu Keluarga sudah sesuai? Setelah dikirim, data akan dikunci untuk verifikasi RT."
        confirmText="Ya, Kirim"
        cancelText="Batal"
        isLoading={isSubmittingToRT}
        variant="primary"
      />

      {/* Confirm Cancel Change Modal */}
      <ConfirmModal
        isOpen={showCancelChangeConfirm}
        onClose={() => setShowCancelChangeConfirm(false)}
        onConfirm={handleCancelChange}
        title="Batalkan Perubahan Data"
        description="Apakah Anda yakin ingin membatalkan pengajuan perubahan data KK ini? Status KK Anda akan dikunci kembali ke Terverifikasi."
        confirmText="Ya, Batalkan"
        cancelText="Batal"
        isLoading={isCancellingChange}
        variant="danger"
      />

      {/* Action Button Section for Editable States (draft, changes_pending, rejected) */}
      {!isLocked && (familyDetail.verificationStatus === "draft" || familyDetail.verificationStatus === "changes_pending" || familyDetail.verificationStatus === "rejected") && (
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 pt-4 border-t border-gray-border/40 mt-6">
          {/* Kirim / Verifikasi Ke RT */}
          <button
            type="button"
            onClick={handleConfirmSubmit}
            disabled={isSubmittingToRT || !familyDetail.kkFile}
            title={!familyDetail.kkFile ? "Harap unggah berkas Scan KK terlebih dahulu" : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 text-sm font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] duration-150 disabled:hover:scale-100 cursor-pointer"
          >
            {isSubmittingToRT ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Send className="h-4.5 w-4.5" />
            )}
            <span>
              {familyDetail.verificationStatus === "changes_pending"
                ? "Kirim Perubahan"
                : familyDetail.verificationStatus === "rejected"
                ? "Ajukan Ulang"
                : "Verifikasi Ke RT"}
            </span>
          </button>
        </div>
      )}

      {/* Action Button Section for Pending State (Sedang Menunggu Verifikasi RT) */}
      {familyDetail.verificationStatus === "pending" && (
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 pt-4 border-t border-gray-border/40 mt-6">
          <button
            type="button"
            onClick={() => {
              // Panggil penanganan batalkan submit
              const cancelBtn = document.querySelector<HTMLButtonElement>('[data-action="cancel-submit"]');
              if (cancelBtn) cancelBtn.click();
              else {
                fetch(`/api/families/${familyDetail.id}/cancel-submit`, { method: "POST" })
                  .then((res) => {
                    if (res.ok) {
                      toast.success("Pengajuan verifikasi berhasil dibatalkan!");
                      if (familyId) fetchFamilyDetails(familyId);
                    }
                  });
              }
            }}
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
