"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  UserX,
  Loader2,
  CheckCircle2,
  Eye,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { DocumentPreviewModal } from "./_components/DocumentPreviewModal";
import { VerifyConfirmModal } from "./_components/VerifyConfirmModal";
import { PermissionGuard } from "@/components/PermissionGuard";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { RefreshButton } from "@/components/RefreshButton";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";

const STATUS_OPTIONS: SelectOption[] = [
  { value: "pending", label: "Menunggu Review" },
  { value: "verified", label: "Terverifikasi" },
  { value: "rejected", label: "Ditolak" },
];

interface FamilyItem {

  id: number;
  familyNumber: string;
  headName: string;
  unitNumber?: string | null;
  kkFile?: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationNote?: string | null;
  checkInDate: string;
  blockNumber: string;
  houseNumber: string;
  memberCount: number;
}

interface RentalResidentItem {
  id: number;
  name: string;
  nik: string;
  phone?: string | null;
  tenantType: "perorangan" | "keluarga";
  roomNumber?: string | null;
  checkInDate: string;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationNote?: string | null;
  ktpFile?: string | null;
  propertyName: string;
  blockNumber: string;
  houseNumber: string;
}

export default function DocumentApprovalsPage() {
  return (
    <PermissionGuard requiredPermission="verify-documents">
      <DocumentApprovalsContent />
    </PermissionGuard>
  );
}

function DocumentApprovalsContent() {
  const [activeTab, setActiveTab] = useState<"family" | "rental_resident">("family");
  const [statusFilter, setStatusFilter] = useState<"pending" | "verified" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 400);

  const [familiesList, setFamiliesList] = useState<FamilyItem[]>([]);
  const [rentalList, setRentalList] = useState<RentalResidentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab pending indicator counts
  const [familyPendingCount, setFamilyPendingCount] = useState<number>(0);
  const [rentalPendingCount, setRentalPendingCount] = useState<number>(0);

  const fetchPendingCounts = useCallback(async () => {
    try {
      const [famRes, rentRes] = await Promise.all([
        fetch("/api/approvals/documents?type=family&status=pending"),
        fetch("/api/approvals/documents?type=rental_resident&status=pending")
      ]);
      if (famRes.ok) {
        const famData = await famRes.json();
        setFamilyPendingCount(famData.data?.length || 0);
      }
      if (rentRes.ok) {
        const rentData = await rentRes.json();
        setRentalPendingCount(rentData.data?.length || 0);
      }
    } catch (err) {
      console.error("Error fetching pending tab counts:", err);
    }
  }, []);

  // Modal states
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    await Promise.resolve(); // Defers state updates to avoid synchronous setState in useEffect
    setIsLoading(true);
    try {
      const url = `/api/approvals/documents?type=${activeTab}&status=${statusFilter}&query=${encodeURIComponent(debouncedQuery)}`;
      const res = await fetch(url);
      const result = await res.json();
      if (res.ok) {
        if (activeTab === "family") {
          setFamiliesList(result.data || []);
        } else {
          setRentalList(result.data || []);
        }
      } else {
        toast.error(result.error || "Gagal memuat antrean dokumen");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, statusFilter, debouncedQuery]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchDocuments();
        fetchPendingCounts();
      }
    });
    return () => {
      active = false;
    };
  }, [fetchDocuments, fetchPendingCounts]);

  const handleActionConfirm = async (rejectReason?: string) => {
    if (!selectedId || !confirmAction) return;

    try {
      const res = await fetch(`/api/approvals/documents/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          action: confirmAction,
          rejectReason,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(result.message || "Tindakan berhasil disimpan");
        fetchDocuments();
        fetchPendingCounts();
      } else {
        throw new Error(result.error || "Gagal memperbarui status dokumen");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
      throw err; // throw back to modal to keep loading state if needed, or handle inside modal
    }
  };

  const handleOpenPreview = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    setIsPreviewOpen(true);
  };

  const handleOpenConfirm = (id: number, name: string, action: "approve" | "reject") => {
    setSelectedId(id);
    setSelectedTitle(name);
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleRefresh = () => {
    fetchDocuments();
    fetchPendingCounts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
            Verifikasi Kependudukan
          </h1>
          <p className="text-sm text-gray-secondary-text mt-1">
            Tinjau dan verifikasi data kependudukan beserta dokumen pendukung (KK & KTP) warga secara mandiri
          </p>
        </div>
        <RefreshButton onClick={handleRefresh} isLoading={isLoading} />
      </div>


      {/* Tabs & Controls */}
      <div className="bg-gray-card border border-gray-border rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Tab buttons */}
          <div className="flex bg-gray-sidebar-hover/40 p-1 rounded-xl w-fit">
            <button
              onClick={() => {
                setActiveTab("family");
                setFamiliesList([]);
              }}
              className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "family"
                  ? "bg-gray-card text-gray-heading-main shadow-xs"
                  : "text-gray-secondary-text hover:text-gray-heading-main"
              }`}
            >
              <span>Kartu Keluarga Warga</span>
              {familyPendingCount > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("rental_resident");
                setRentalList([]);
              }}
              className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "rental_resident"
                  ? "bg-gray-card text-gray-heading-main shadow-xs"
                  : "text-gray-secondary-text hover:text-gray-heading-main"
              }`}
            >
              <span>KTP Penghuni (Sewa/Kos)</span>
              {rentalPendingCount > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-placeholder" />
              <input
                type="text"
                placeholder={
                  activeTab === "family"
                    ? "Cari nama KK / nomor KK..."
                    : "Cari nama penghuni / NIK..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 bg-gray-sidebar-hover/20 border border-gray-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-gray-placeholder text-gray-heading-main"
              />
            </div>

            {/* Status Selector */}
            <div className="w-full sm:w-44">
              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as any)}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-gray-placeholder gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              Memuat data dokumen...
            </div>
          ) : activeTab === "family" ? (
            familiesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-gray-placeholder gap-2 min-h-60">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <h4 className="text-gray-heading-main text-sm font-semibold">Semua Bersih!</h4>
                <p className="max-w-xs text-[10px] leading-relaxed text-gray-secondary-text">
                  Tidak ada dokumen Kartu Keluarga yang menunggu verifikasi Anda dengan kriteria saat ini.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-border bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text">
                    <th className="py-4 px-5">Kepala Keluarga</th>
                    <th className="py-4 px-5">Nomor KK</th>
                    <th className="py-4 px-5">Alamat Alokasi</th>
                    <th className="py-4 px-5 text-center">Jumlah Anggota</th>
                    <th className="py-4 px-5 text-center">Mulai Tinggal</th>
                    <th className="py-4 px-5 text-center">Tinjau KK & Anggota</th>
                    {statusFilter === "rejected" && <th className="py-4 px-5">Alasan Ditolak</th>}
                    <th className="py-4 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
                  {familiesList.map((fam) => {
                    const addressStr = `Blok ${fam.blockNumber} No. ${fam.houseNumber}`;
                    return (
                      <tr key={fam.id} className="hover:bg-gray-sidebar-hover/5 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-semibold text-gray-heading-main">{fam.headName}</div>
                        </td>
                        <td className="py-4 px-5 font-mono text-sm font-semibold text-gray-secondary-text">{fam.familyNumber}</td>
                        <td className="py-4 px-5 text-gray-secondary-text">
                          <div>
                            <span className="text-gray-heading-main font-semibold">{addressStr}</span>
                            {fam.unitNumber && (
                              <span className="ml-1.5 text-[10px] font-semibold bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-secondary-text">
                                {fam.unitNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center font-semibold text-gray-heading-main">
                          <span>{fam.memberCount} orang</span>
                        </td>
                        <td className="py-4 px-5 font-semibold text-center text-gray-secondary-text">
                          <span>{formatDate(fam.checkInDate)}</span>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <Link
                            href={`/dashboard/approvals/documents/${fam.id}`}
                            className="px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Tinjau Berkas
                          </Link>
                        </td>
                        {statusFilter === "rejected" && (
                          <td className="py-4 px-5 max-w-xs truncate text-rose-600 font-medium">
                            {fam.verificationNote || "-"}
                          </td>
                        )}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {statusFilter !== "verified" && (
                              <button
                                onClick={() => handleOpenConfirm(fam.id, fam.headName, "approve")}
                                className="p-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                                title="Setujui KK"
                              >
                                <UserCheck className="h-4.5 w-4.5" />
                              </button>
                            )}
                            {statusFilter !== "rejected" && (
                              <button
                                onClick={() => handleOpenConfirm(fam.id, fam.headName, "reject")}
                                className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                                title="Tolak KK"
                              >
                                <UserX className="h-4.5 w-4.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : rentalList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-gray-placeholder gap-2 min-h-60">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <h4 className="text-gray-heading-main text-sm font-semibold">Semua Bersih!</h4>
              <p className="max-w-xs text-[10px] leading-relaxed text-gray-secondary-text">
                Tidak ada dokumen KTP Penghuni Sewa yang menunggu verifikasi Anda dengan kriteria saat ini.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-border bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text">
                  <th className="py-4 px-5">Nama Penghuni</th>
                  <th className="py-4 px-5">NIK</th>
                  <th className="py-4 px-5">Properti Sewa</th>
                  <th className="py-4 px-5">No Kamar / Hunian</th>
                  <th className="py-4 px-5 text-center">Tipe Sewa</th>
                  <th className="py-4 px-5 text-center">Mulai Sewa</th>
                  <th className="py-4 px-5 text-center">Berkas KTP</th>
                  {statusFilter === "rejected" && <th className="py-4 px-5">Alasan Ditolak</th>}
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
                {rentalList.map((ren) => {
                  const addressStr = `Blok ${ren.blockNumber} No. ${ren.houseNumber}`;
                  return (
                    <tr key={ren.id} className="hover:bg-gray-sidebar-hover/5 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-gray-heading-main">{ren.name}</div>
                        {ren.phone && (
                          <div className="text-xs text-gray-secondary-text mt-0.5">
                            <span>{ren.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 font-mono text-gray-secondary-text">{ren.nik}</td>
                      <td className="py-4 px-5">
                        <span className="font-medium">{ren.propertyName}</span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="text-gray-heading-main">
                          Kamar: <span className="font-semibold">{ren.roomNumber || "-"}</span>
                        </div>
                        <div className="text-xs text-gray-secondary-text mt-0.5">{addressStr}</div>
                      </td>
                      <td className="py-4 px-5 text-center font-medium capitalize">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] ${
                            ren.tenantType === "keluarga"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {ren.tenantType}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center text-gray-secondary-text">
                        <span>{formatDate(ren.checkInDate)}</span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        {ren.ktpFile ? (
                          <button
                            onClick={() => handleOpenPreview(ren.ktpFile!, `KTP - ${ren.name}`)}
                            className="px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Pratinjau
                          </button>
                        ) : (
                          <span className="text-gray-placeholder italic text-[10px]">Belum diunggah</span>
                        )}
                      </td>
                      {statusFilter === "rejected" && (
                        <td className="py-4 px-5 max-w-xs truncate text-rose-600 font-medium">
                          {ren.verificationNote || "-"}
                        </td>
                      )}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {statusFilter !== "verified" && (
                            <button
                              onClick={() => handleOpenConfirm(ren.id, ren.name, "approve")}
                              className="p-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                              title="Setujui KTP"
                            >
                              <UserCheck className="h-4.5 w-4.5" />
                            </button>
                          )}
                          {statusFilter !== "rejected" && (
                            <button
                              onClick={() => handleOpenConfirm(ren.id, ren.name, "reject")}
                              className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Tolak KTP"
                            >
                              <UserX className="h-4.5 w-4.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fileUrl={previewUrl}
        title={previewTitle}
      />

      {/* Verify Confirm/Reject Modal */}
      <VerifyConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        action={confirmAction}
        title={selectedTitle}
        onConfirm={handleActionConfirm}
      />
    </div>
  );
}
