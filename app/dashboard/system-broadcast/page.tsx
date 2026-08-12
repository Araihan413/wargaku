"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Radio,
  Plus,
  Wrench,
  AlertTriangle,
  Sparkles,
  Info,
  Trash2,
  Power,
  Search,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useRoleStore } from "@/lib/store/use-role-store";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { BroadcastAdminItem, CreateBroadcastPayload } from "./types";
import { CreateBroadcastModal } from "./_components/CreateBroadcastModal";
import { TableSkeleton } from "@/components/TableSkeleton";

export default function SystemBroadcastPage() {
  const { activeRoleId } = useRoleStore();
  const [broadcasts, setBroadcasts] = useState<BroadcastAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [filterType, setFilterType] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm delete state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSuperAdmin = activeRoleId === 1;

  const fetchBroadcasts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/broadcasts?admin=true");
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(data);
      } else {
        toast.error("Gagal mengambil data broadcast");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchBroadcasts();
    }
  }, [isSuperAdmin, fetchBroadcasts]);

  const handleCreateBroadcast = async (payload: CreateBroadcastPayload) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Broadcast sistem berhasil dibuat!");
        setIsModalOpen(false);
        fetchBroadcasts();
      } else {
        toast.error(data.error || "Gagal membuat broadcast");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: BroadcastAdminItem) => {
    try {
      const res = await fetch(`/api/broadcasts/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });

      if (res.ok) {
        setBroadcasts((prev) =>
          prev.map((b) => (b.id === item.id ? { ...b, isActive: !item.isActive } : b))
        );
        toast.success(
          !item.isActive
            ? "Broadcast berhasil diaktifkan kembali"
            : "Broadcast berhasil ditarik/ditinggalkan"
        );
      } else {
        toast.error("Gagal mengubah status broadcast");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi");
    }
  };

  const handleDeleteBroadcast = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/broadcasts/${deleteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setBroadcasts((prev) => prev.filter((b) => b.id !== deleteId));
        toast.success("Broadcast berhasil dihapus permanen");
        setDeleteId(null);
      } else {
        toast.error("Gagal menghapus broadcast");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBroadcasts = broadcasts.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      b.message.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesType = filterType === "all" || b.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "maintenance":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <Wrench className="w-3 h-3" /> Maintenance
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3" /> Peringatan
          </span>
        );
      case "feature":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> Fitur Baru
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <Info className="w-3 h-3" /> Informasi
          </span>
        );
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-6 text-center bg-gray-card rounded-2xl border border-gray-border">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-3" />
        <h3 className="text-base font-bold text-gray-heading-main">Akses Terbatas</h3>
        <p className="text-xs text-gray-secondary-text mt-1 max-w-sm">
          Halaman ini khusus untuk Super Admin untuk mengelola broadcast pengumuman sistem.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
            Manajemen Broadcast Sistem
          </h1>
          <p className="text-sm text-gray-secondary-text mt-1">
            Buat dan kelola pengumuman sistem yang akan tampil sebagai banner di dashboard seluruh pengguna.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-900 transition-colors shadow-lg shadow-primary/25 cursor-pointer shrink-0"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Buat Broadcast Baru</span>
        </button>
      </div>

      {/* 2. Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-card p-4 rounded-2xl border border-gray-border/60 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul atau isi broadcast..."
            className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2 text-xs text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["all", "info", "maintenance", "feature", "warning"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer whitespace-nowrap ${
                filterType === t
                  ? "bg-primary text-white"
                  : "bg-gray-card border border-gray-border text-gray-secondary-text hover:text-gray-heading-main"
              }`}
            >
              {t === "all" ? "Semua Tipe" : t}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Data Table */}
      <div className="bg-gray-card rounded-2xl border border-gray-border/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-gray-border/80 bg-gray-sidebar-hover/80 text-[11px] font-bold text-gray-heading-small">
                <tr>
                  <th className="py-3 px-4">Pesan & Kategori</th>
                  <th className="py-3 px-4">Target Peran</th>
                  <th className="py-3 px-4">Status & Masa Berlaku</th>
                  <th className="py-3 px-4">Interaksi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border/60 text-xs">
                <TableSkeleton rowCount={4} colCount={5} />
              </tbody>
            </table>
          </div>
        ) : filteredBroadcasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Radio className="h-10 w-10 text-gray-placeholder mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-gray-heading-main">Tidak Ada Broadcast</h3>
            <p className="text-xs text-gray-placeholder mt-1">
              {searchQuery ? "Tidak ditemukan broadcast yang sesuai pencarian." : "Belum ada broadcast sistem yang pernah dibuat."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse min-w-212">
              <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 min-w-60">Tipe & Judul</th>
                  <th className="py-3.5 px-4 min-w-75">Pesan Pengumuman</th>
                  <th className="py-3.5 px-4 min-w-37.5 text-center">Saluran</th>
                  <th className="py-3.5 px-4 min-w-35 text-center">Status Banner</th>
                  <th className="py-3.5 px-4 min-w-25 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border/60">
                {filteredBroadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-sidebar-hover/40 transition">
                    <td className="p-4 align-top space-y-1.5">
                      <div>{getTypeBadge(b.type)}</div>
                      <h4 className="font-bold text-gray-heading-main text-xs">{b.title}</h4>
                      <p className="text-[10px] text-gray-placeholder">
                        Oleh: {b.authorName || "Super Admin"} • {new Date(b.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </td>
                    <td className="p-4 align-top max-w-md">
                      <p className="text-xs text-gray-body-text-btn line-clamp-3 leading-relaxed">
                        {b.message}
                      </p>
                      {b.expiresAt && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-2 font-semibold">
                          <Calendar className="w-3 h-3" /> Expired: {new Date(b.expiresAt).toLocaleString("id-ID")}
                        </span>
                      )}
                    </td>
                    <td className="p-4 align-top text-center space-y-1">
                      <span className="block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Banner Dashboard
                      </span>
                      {b.sendPush && (
                        <span className="block text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          Push OneSignal
                        </span>
                      )}
                      {b.sendInAppNotif && (
                        <span className="block text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          Lonceng Warga
                        </span>
                      )}
                    </td>
                    <td className="p-4 align-top text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(b)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition ${
                          b.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{b.isActive ? "Aktif" : "Ditarik"}</span>
                      </button>
                    </td>
                    <td className="p-4 align-top text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => setDeleteId(b.id)}
                        className="p-2 text-gray-placeholder hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Hapus Broadcast"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modular Create Broadcast Modal */}
      <CreateBroadcastModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBroadcast}
        isSubmitting={isSubmitting}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteBroadcast}
        title="Hapus Broadcast Sistem"
        description="Apakah Anda yakin ingin menghapus broadcast ini secara permanen?"
        confirmText="Hapus Permanen"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
