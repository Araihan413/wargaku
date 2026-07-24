"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { KKDetailCard } from "./_components/KKDetailCard";
import { AnggotaTable } from "./_components/AnggotaTable";
import { AddAnggotaModal } from "./_components/AddAnggotaModal";
import { EditAnggotaModal } from "./_components/EditAnggotaModal";
import { NonaktifkanAnggotaModal } from "./_components/NonaktifkanAnggotaModal";
import { PindahKKModal } from "./_components/PindahKKModal";
import { GantiKepalaKeluargaModal } from "./_components/GantiKepalaKeluargaModal";
import { FamilyDocumentsCard } from "./_components/FamilyDocumentsCard";
import { FamilyDetail, FamilyMemberItem } from "../../types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FamilyDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const familyId = Number(resolvedParams.id);

  const [familyDetail, setFamilyDetail] = useState<FamilyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<FamilyMemberItem | null>(null);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [selectedMemberForDisable, setSelectedMemberForDisable] = useState<FamilyMemberItem | null>(null);
  const [isPindahModalOpen, setIsPindahModalOpen] = useState(false);
  const [selectedMemberForPindah, setSelectedMemberForPindah] = useState<FamilyMemberItem | null>(null);
  const [isGantiKepalaModalOpen, setIsGantiKepalaModalOpen] = useState(false);

  // Fetch Family Details
  const fetchFamilyDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/families/${familyId}`);
      if (res.ok) {
        const data = await res.json();
        setFamilyDetail(data);
      } else {
        toast.error("Gagal memuat rincian Kartu Keluarga");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem saat mengambil data");
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    if (familyId) {
      Promise.resolve().then(() => {
        fetchFamilyDetails();
      });
    }
  }, [familyId, fetchFamilyDetails]);

  const handleReactivateMember = async (member: FamilyMemberItem) => {
    try {
      const res = await fetch(`/api/warga/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true, inactiveReason: null }),
      });

      if (res.ok) {
        toast.success(`Anggota keluarga "${member.name}" berhasil diaktifkan kembali`);
        fetchFamilyDetails();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mengaktifkan kembali anggota keluarga");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat mengaktifkan kembali anggota keluarga");
    }
  };

  if (isLoading && !familyDetail) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-gray-placeholder">Memuat detail Kartu Keluarga...</span>
      </div>
    );
  }

  if (!familyDetail) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-6 text-center border border-gray-border bg-gray-card rounded-2xl">
        <h3 className="text-lg font-bold text-gray-heading-main">Kartu Keluarga Tidak Ditemukan</h3>
        <p className="text-sm text-gray-secondary-text mt-1 max-w-sm">
          Data Kartu Keluarga tidak ditemukan atau Anda tidak memiliki izin untuk melihatnya.
        </p>
        <Link
          href="/dashboard/residents"
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary hover:underline cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Data Warga
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/residents"
            className="p-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-gray-secondary-text cursor-pointer transition-colors"
            title="Kembali ke Daftar KK"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
              Rincian Kartu Keluarga
            </h1>
            <p className="text-sm text-gray-secondary-text mt-1">
              Rincian lengkap Kartu Keluarga, alamat, and anggota keluarga warga tetap.
            </p>
          </div>
        </div>

        {familyDetail.isActive && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all self-start sm:self-auto"
          >
            <UserPlus className="h-4.5 w-4.5" />
            Tambah Anggota
          </button>
        )}
      </div>

      {/* Family Detail Card */}
      <KKDetailCard
        familyDetail={familyDetail}
        onChangeHead={() => setIsGantiKepalaModalOpen(true)}
      />

      {/* Family Documents Download & View Section */}
      <FamilyDocumentsCard familyDetail={familyDetail} />

      {/* Family Members Table */}
      <AnggotaTable
        members={familyDetail.members || []}
        onEdit={(member) => {
          setSelectedMemberForEdit(member);
          setIsEditModalOpen(true);
        }}
        onDisable={(member) => {
          setSelectedMemberForDisable(member);
          setIsDisableModalOpen(true);
        }}
        onReactivate={handleReactivateMember}
        onTransfer={(member) => {
          setSelectedMemberForPindah(member);
          setIsPindahModalOpen(true);
        }}
      />

      {/* Modals */}
      <AddAnggotaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchFamilyDetails();
        }}
        familyId={familyId}
      />

      <EditAnggotaModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMemberForEdit(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedMemberForEdit(null);
          fetchFamilyDetails();
        }}
        member={selectedMemberForEdit}
      />

      <NonaktifkanAnggotaModal
        isOpen={isDisableModalOpen}
        onClose={() => {
          setIsDisableModalOpen(false);
          setSelectedMemberForDisable(null);
        }}
        onSuccess={() => {
          setIsDisableModalOpen(false);
          setSelectedMemberForDisable(null);
          fetchFamilyDetails();
        }}
        member={selectedMemberForDisable}
      />

      {/* Pindah KK Modal */}
      {selectedMemberForPindah && (
        <PindahKKModal
          isOpen={isPindahModalOpen}
          onClose={() => {
            setIsPindahModalOpen(false);
            setSelectedMemberForPindah(null);
          }}
          onSuccess={() => {
            setIsPindahModalOpen(false);
            setSelectedMemberForPindah(null);
            fetchFamilyDetails();
          }}
          memberId={selectedMemberForPindah.id}
          memberName={selectedMemberForPindah.name}
          memberNik={selectedMemberForPindah.nik}
          currentFamilyId={familyId}
        />
      )}

      {/* Ganti Kepala Keluarga Modal */}
      <GantiKepalaKeluargaModal
        isOpen={isGantiKepalaModalOpen}
        onClose={() => setIsGantiKepalaModalOpen(false)}
        onSuccess={() => {
          setIsGantiKepalaModalOpen(false);
          fetchFamilyDetails();
        }}
        familyId={familyId}
        members={familyDetail.members || []}
        currentHeadName={familyDetail.headName}
      />
    </div>
  );
}
