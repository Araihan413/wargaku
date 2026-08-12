"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  UserX,
  Loader2,
  Users,
  CheckCircle2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { RefreshButton } from "@/components/RefreshButton";
import { PermissionGuard } from "@/components/PermissionGuard";
import { TableSkeleton } from "@/components/TableSkeleton";


interface PendingUser {

  id: string;
  name: string;
  email: string;
  nik: string;
  roleId?: number;
  phone?: string | null;
  familyNumber?: string | null;
  unitNumber?: string | null;
  createdAt: string;
  dwellingId?: number | null;
  blockNumber?: string | null;
  houseNumber?: string | null;
}

export default function RegistrationApprovalsPage() {
  return (
    <PermissionGuard requiredPermission="verify-registrations">
      <RegistrationApprovalsContent />
    </PermissionGuard>
  );
}

function RegistrationApprovalsContent() {
  const [pendingList, setPendingList] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchPendingUsers = useCallback(async () => {
    await Promise.resolve(); // Defers state updates to avoid synchronous setState in useEffect
    setIsLoading(true);
    try {
      const res = await fetch("/api/approvals/registration");
      if (res.ok) {
        const result = await res.json();
        setPendingList(result.data || []);
      } else {
        toast.error("Gagal memuat antrean persetujuan registrasi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchPendingUsers();
      }
    });
    return () => {
      active = false;
    };
  }, [fetchPendingUsers]);

  const handleApprove = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/approvals/registration/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(`Akun warga ${selectedUser.name} berhasil diaktifkan`);
        setIsApproveOpen(false);
        setSelectedUser(null);
        fetchPendingUsers();
      } else {
        throw new Error(result.error || "Gagal menyetujui pendaftaran");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/approvals/registration/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectReason: rejectReason,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(`Pendaftaran ${selectedUser.name} telah ditolak dan akun dihapus`);
        setIsRejectOpen(false);
        setSelectedUser(null);
        setRejectReason("");
        fetchPendingUsers();
      } else {
        throw new Error(result.error || "Gagal menolak pendaftaran");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
            Persetujuan Registrasi
          </h1>
          <p className="text-sm text-gray-secondary-text mt-1">
            Tinjau pendaftaran warga mandiri (Kepala Keluarga) sebelum mengizinkan login dan membuat Kartu Keluarga otomatis.
          </p>
        </div>
        <RefreshButton onClick={fetchPendingUsers} isLoading={isLoading} />
      </div>


      {/* Main Content Card */}
      <div className="bg-gray-card border border-gray-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-heading-main">Antrean Registrasi Warga</h3>
              <p className="text-[10px] text-gray-secondary-text">Daftar calon warga yang mendaftar secara mandiri</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
            {pendingList.length} Pengajuan Pending
          </span>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
                <tr>
                  <th className="py-4 px-5">Nama & Kontak</th>
                  <th className="py-4 px-5">Tipe Akun</th>
                  <th className="py-4 px-5">NIK</th>
                  <th className="py-4 px-5">Nomor KK</th>
                  <th className="py-4 px-5">Rencana Alamat</th>
                  <th className="py-4 px-5 text-center">Tanggal Daftar</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
                <TableSkeleton rowCount={4} colCount={7} />
              </tbody>
            </table>
          ) : pendingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-gray-placeholder gap-2 min-h-60">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <h4 className="text-gray-heading-main text-sm font-semibold">Semua Bersih!</h4>
              <p className="max-w-xs text-[10px] leading-relaxed text-gray-secondary-text">
                Tidak ada pendaftaran warga mandiri baru yang menunggu persetujuan Anda saat ini.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
                <tr>
                  <th className="py-4 px-5">Nama & Kontak</th>
                  <th className="py-4 px-5">Tipe Akun</th>
                  <th className="py-4 px-5">NIK</th>
                  <th className="py-4 px-5">Nomor KK</th>
                  <th className="py-4 px-5">Rencana Alamat</th>
                  <th className="py-4 px-5 text-center">Tanggal Daftar</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
                {pendingList.map((user) => {
                  const addressStr = user.blockNumber
                    ? `Blok ${user.blockNumber} No. ${user.houseNumber || "-"}`
                    : "Belum diset";

                  return (
                    <tr key={user.id} className="hover:bg-gray-sidebar-hover/40 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-heading-main">
                            {user.name}
                          </span>
                          <span className="text-xs text-gray-secondary-text">
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="text-xs text-gray-secondary-text">
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {user.roleId === 5 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold whitespace-nowrap">
                            Koordinator Kos
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold whitespace-nowrap">
                            Warga (KK)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 font-mono text-gray-secondary-text">{user.nik}</td>
                      <td className="py-4 px-5 font-mono text-gray-secondary-text">{user.familyNumber || "-"}</td>
                      <td className="py-4 px-5 text-gray-secondary-text">
                        <span>
                          {addressStr} {user.unitNumber ? `(Unit ${user.unitNumber})` : ""}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center text-gray-secondary-text">
                        <span>{formatDate(user.createdAt)}</span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsApproveOpen(true);
                            }}
                            className="p-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            title="Setujui Pendaftaran"
                          >
                            <UserCheck className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsRejectOpen(true);
                            }}
                            className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                            title="Tolak Pendaftaran"
                          >
                            <UserX className="h-4.5 w-4.5" />
                          </button>
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

      {/* Modal Approve Confirmation */}
      {isApproveOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsApproveOpen(false)}
          />
          <div className="relative w-full max-w-md bg-gray-card border border-gray-border rounded-2xl shadow-xl p-6 z-10 mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-emerald-600">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-gray-heading-main">Setujui Pendaftaran Akun?</h3>
            </div>

            <div className="space-y-3 mb-6 text-xs text-gray-secondary-text leading-relaxed">
              <p>
                Apakah Anda yakin ingin menyetujui pendaftaran mandiri{" "}
                <strong className="text-gray-heading-main font-semibold">
                  {selectedUser.roleId === 5 ? "Koordinator Kos" : "Warga (KK)"}
                </strong>{" "}
                atas nama <strong className="text-gray-heading-main font-semibold">{selectedUser.name}</strong>?
              </p>
              {selectedUser.roleId === 5 ? (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 font-medium">
                  Setelah disetujui, akun Koordinator Kos akan aktif dan dapat langsung ditunjuk oleh pemilik properti sewa di wilayah RT ini.
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-medium">
                  Setelah disetujui, akun warga akan aktif, dan sistem secara otomatis membuat Kartu Keluarga baru dengan Nomor KK <strong>{selectedUser.familyNumber}</strong> dengan <strong>{selectedUser.name}</strong> sebagai Kepala Keluarga.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsApproveOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-xs font-semibold text-gray-secondary-text cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Ya, Setujui"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject with Reason */}
      {isRejectOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsRejectOpen(false)}
          />
          <div className="relative w-full max-w-md bg-gray-card border border-gray-border rounded-2xl shadow-xl z-10 mx-4 animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-heading-main">Tolak Pendaftaran Warga</h3>
                  <p className="text-[10px] text-gray-secondary-text">Kirim alasan penolakan dan hapus pendaftaran</p>
                </div>
              </div>
              <button
                onClick={() => setIsRejectOpen(false)}
                className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-amber-700 leading-relaxed font-semibold">
                Apakah Anda yakin ingin menolak pendaftaran warga <strong className="text-gray-heading-main font-bold">{selectedUser.name}</strong>? Data akun akan dihapus sehingga warga harus mendaftar ulang dengan data yang benar.
              </div>

              {/* Reject Reason input */}
              <div className="space-y-1.5">
                <label htmlFor="reason" className="block text-sm font-semibold text-gray-body-text-btn tracking-wider mb-2">
                  Alasan Penolakan (Kirim via Email Simulasi)
                </label>
                <textarea
                  id="reason"
                  required
                  placeholder="Contoh: Nomor KK tidak ditemukan, NIK tidak terdaftar di dukcapil, atau Anda memilih hunian/Blok yang salah."
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-border bg-gray-card py-3 px-4 text-gray-heading-main placeholder:text-gray-placeholder sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-border px-6 py-4 shrink-0">
              <button
                type="button"
                onClick={() => setIsRejectOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-xs font-semibold text-gray-secondary-text cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Tolak & Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
