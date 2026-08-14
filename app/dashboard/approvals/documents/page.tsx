"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  FileText,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { VerifyConfirmModal } from "./_components/VerifyConfirmModal";
import { PermissionGuard } from "@/components/PermissionGuard";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { RefreshButton } from "@/components/RefreshButton";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { TableSkeleton } from "@/components/TableSkeleton";
import { SecureDocumentLink } from "@/components/SecureDocumentLink";

const STATUS_OPTIONS: SelectOption[] = [
  { value: "pending", label: "Menunggu Review" },
  { value: "verified", label: "Terverifikasi / Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

const SUBTYPE_OPTIONS: SelectOption[] = [
  { value: "all", label: "Semua Jenis Pengajuan" },
  { value: "registration", label: "Registrasi Baru" },
  { value: "change_request", label: "Perubahan Data" },
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
  submissionType: "registration" | "change_request";
  submissionLabel: string;
  changeRequestId?: number | null;
}

interface RentalResidentItem {
  id: number;
  name: string;
  nik: string;
  phone?: string | null;
  tenantType: "perorangan" | "keluarga";
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
  const [subTypeFilter, setSubTypeFilter] = useState<"all" | "registration" | "change_request">("all");
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
        fetch("/api/approvals/documents?type=family&subType=all&status=pending"),
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

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    await Promise.resolve(); // Defers state updates to avoid synchronous setState in useEffect
    setIsLoading(true);
    try {
      const url = `/api/approvals/documents?type=${activeTab}&subType=${subTypeFilter}&status=${statusFilter}&query=${encodeURIComponent(debouncedQuery)}`;
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
  }, [activeTab, subTypeFilter, statusFilter, debouncedQuery]);

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
      <div className="bg-gray-card border border-gray-border rounded-2xl p-5 space-y-4 shadow-xs">
        {/* Row 1: Tab Navigation */}
        <div className="flex items-center justify-between border-b border-gray-border/60 pb-3">
          <div className="flex bg-gray-sidebar-hover/60 p-1 rounded-xl w-fit">
            <button
              onClick={() => {
                setActiveTab("family");
                setFamiliesList([]);
              }}
              className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "family"
                  ? "bg-gray-card text-gray-heading-main shadow-xs"
                  : "text-gray-secondary-text hover:text-gray-heading-main"
              }`}
            >
              <span>Data Keluarga</span>
              {familyPendingCount > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("rental_resident");
                setRentalList([]);
              }}
              className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "rental_resident"
                  ? "bg-gray-card text-gray-heading-main shadow-xs"
                  : "text-gray-secondary-text hover:text-gray-heading-main"
              }`}
            >
              <span>Data Penyewa</span>
              {rentalPendingCount > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Search & Filters Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-placeholder" />
            <input
              type="text"
              placeholder={
                activeTab === "family"
                  ? "Cari nama kepala keluarga / nomor KK..."
                  : "Cari nama penghuni / NIK..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-gray-sidebar-hover/20 border border-gray-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-placeholder text-gray-heading-main transition-all"
            />
          </div>

          {/* Filters Selectors */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
            {/* SubType Selector (Khusus Tab Data Keluarga) */}
            {activeTab === "family" && (
              <div className="w-full sm:w-56">
                <CustomSelect
                  value={subTypeFilter}
                  onChange={(val) => setSubTypeFilter(val as any)}
                  options={SUBTYPE_OPTIONS}
                />
              </div>
            )}

            {/* Status Selector */}
            <div className="w-full sm:w-52">
              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as any)}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto scrollbar-thin">
          {isLoading ? (
            <table className="w-full min-w-240 text-left border-collapse text-xs">
              <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
                <tr>
                  <th className="py-4 px-5 min-w-45">Kepala Keluarga / Penyewa</th>
                  <th className="py-4 px-5 min-w-35">Nomor Identitas</th>
                  <th className="py-4 px-5 min-w-35">Alamat / Properti</th>
                  <th className="py-4 px-5 min-w-27.5 text-center">Detail</th>
                  <th className="py-4 px-5 min-w-30 text-center">Status Berkas</th>
                  <th className="py-4 px-5 min-w-25 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
                <TableSkeleton rowCount={5} colCount={6} />
              </tbody>
            </table>
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
              <table className="w-full min-w-240 text-left border-collapse text-xs">
                <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
                  <tr>
                    <th className="py-4 px-5 min-w-45">Kepala Keluarga</th>
                    <th className="py-4 px-5 min-w-35">Nomor KK</th>
                    <th className="py-4 px-5 min-w-35 text-center">Jenis Pengajuan</th>
                    <th className="py-4 px-5 min-w-32.5">Alamat Alokasi</th>
                    <th className="py-4 px-5 min-w-27.5 text-center">Jumlah Anggota</th>
                    <th className="py-4 px-5 min-w-30 text-center">Mulai Tinggal / Diajukan</th>
                    <th className="py-4 px-5 min-w-30 text-center">Tinjau KK & Anggota</th>
                    {statusFilter === "rejected" && <th className="py-4 px-5 min-w-37.5">Alasan Ditolak</th>}
                    <th className="py-4 px-5 min-w-25 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
                  {familiesList.map((fam) => {
                    const addressStr = `Blok ${fam.blockNumber} No. ${fam.houseNumber}`;
                    return (
                      <tr key={`${fam.submissionType}-${fam.id}-${fam.changeRequestId || "reg"}`} className="hover:bg-gray-sidebar-hover/5 transition-colors">
                        <td className="py-4 px-5 min-w-45">
                          <div className="font-semibold text-gray-heading-main">{fam.headName}</div>
                        </td>
                        <td className="py-4 px-5 min-w-35 font-mono text-sm font-semibold text-gray-secondary-text">{fam.familyNumber}</td>
                        <td className="py-4 px-5 min-w-35 text-center">
                          {fam.submissionType === "change_request" ? (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                              title="Usulan perubahan data dari KK yang sudah terdaftar"
                            >
                              <FileText className="h-3 w-3 text-amber-600" />
                              Perubahan Data
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                              title="Pendaftaran Kartu Keluarga Baru"
                            >
                              <UserPlus className="h-3 w-3 text-emerald-600" />
                              Registrasi Baru
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 min-w-32.5 text-gray-secondary-text">
                          <div>
                            <span className="text-gray-heading-main font-semibold">{addressStr}</span>
                            {fam.unitNumber && (
                              <span className="ml-1.5 text-[10px] font-semibold bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-secondary-text">
                                {fam.unitNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5 min-w-27.5 text-center font-semibold text-gray-heading-main">
                          <span>{fam.memberCount} orang</span>
                        </td>
                        <td className="py-4 px-5 min-w-30 font-semibold text-center text-gray-secondary-text">
                          <span>{formatDate(fam.checkInDate)}</span>
                        </td>
                        <td className="py-4 px-5 min-w-30 text-center">
                          <Link
                            href={`/dashboard/approvals/documents/${fam.id}${fam.changeRequestId ? `?changeRequestId=${fam.changeRequestId}` : ""}`}
                            className="px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Tinjau
                          </Link>
                        </td>
                        {statusFilter === "rejected" && (
                          <td className="py-4 px-5 min-w-37.5 max-w-xs truncate text-rose-600 font-medium">
                            {fam.verificationNote || "-"}
                          </td>
                        )}
                        <td className="py-4 px-5 min-w-25 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {statusFilter === "pending" ? (
                              <>
                                <button
                                  onClick={() => handleOpenConfirm(fam.id, fam.headName, "approve")}
                                  className="p-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                                  title={fam.submissionType === "change_request" ? "Setujui Perubahan" : "Setujui KK"}
                                >
                                  <UserCheck className="h-4.5 w-4.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenConfirm(fam.id, fam.headName, "reject")}
                                  className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                                  title={fam.submissionType === "change_request" ? "Tolak Perubahan" : "Tolak KK"}
                                >
                                  <UserX className="h-4.5 w-4.5" />
                                </button>
                              </>
                            ) : statusFilter === "verified" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Disetujui</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Ditolak</span>
                              </span>
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
            <table className="w-full min-w-240 text-left border-collapse text-xs">
              <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
                <tr>
                  <th className="py-4 px-5 min-w-45">Nama Penghuni</th>
                  <th className="py-4 px-5 min-w-35">NIK</th>
                  <th className="py-4 px-5 min-w-35">Properti Sewa</th>
                  <th className="py-4 px-5 min-w-32.5">Alamat Hunian</th>
                  <th className="py-4 px-5 min-w-25 text-center">Tipe Sewa</th>
                  <th className="py-4 px-5 min-w-27.5 text-center">Mulai Sewa</th>
                  <th className="py-4 px-5 min-w-27.5 text-center">Berkas KTP</th>
                  {statusFilter === "rejected" && <th className="py-4 px-5 min-w-37.5">Alasan Ditolak</th>}
                  <th className="py-4 px-5 min-w-25 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
                {rentalList.map((ren) => {
                  const addressStr = `Blok ${ren.blockNumber} No. ${ren.houseNumber}`;
                  return (
                    <tr key={ren.id} className="hover:bg-gray-sidebar-hover/5 transition-colors">
                      <td className="py-4 px-5 min-w-45">
                        <div className="font-semibold text-gray-heading-main">{ren.name}</div>
                        {ren.phone && (
                          <div className="text-xs text-gray-secondary-text mt-0.5">
                            <span>{ren.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 min-w-35 font-mono text-gray-secondary-text font-semibold">{ren.nik}</td>
                      <td className="py-4 px-5 min-w-35">
                        <span className="font-semibold">{ren.propertyName}</span>
                      </td>
                      <td className="py-4 px-5 min-w-32.5">
                        <div className="text-gray-heading-main">
                          <span className="font-semibold">{addressStr}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 min-w-25 text-center font-medium capitalize">
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
                      <td className="py-4 px-5 min-w-27.5 font-semibold text-center text-gray-secondary-text">
                        <span>{formatDate(ren.checkInDate)}</span>
                      </td>
                      <td className="py-4 px-5 min-w-27.5 text-center">
                        {ren.ktpFile ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <SecureDocumentLink
                              type="ktp-tenant"
                              recordId={ren.id}
                              mode="view"
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Lihat Berkas KTP"
                            >
                              <Eye className="h-3 w-3" />
                              Lihat
                            </SecureDocumentLink>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-placeholder italic">Belum unggah</span>
                        )}
                      </td>
                      {statusFilter === "rejected" && (
                        <td className="py-4 px-5 min-w-37.5 max-w-xs truncate text-rose-600 font-medium">
                          {ren.verificationNote || "-"}
                        </td>
                      )}
                      <td className="py-4 px-5 min-w-25 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {statusFilter === "pending" ? (
                            <>
                              <button
                                onClick={() => handleOpenConfirm(ren.id, ren.name, "approve")}
                                className="p-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                                title="Setujui Berkas Penyewa"
                              >
                                <UserCheck className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleOpenConfirm(ren.id, ren.name, "reject")}
                                className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                                title="Tolak Berkas Penyewa"
                              >
                                <UserX className="h-4.5 w-4.5" />
                              </button>
                            </>
                          ) : statusFilter === "verified" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Disetujui</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Ditolak</span>
                            </span>
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
