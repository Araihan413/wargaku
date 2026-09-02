"use client";

import React, { useState } from "react";
import { Eye, Edit2, Trash2, Pin, Plus, Calendar, User, Clock } from "lucide-react";
import { AnnouncementItem, AnnouncementCategory } from "../types";
import { SearchInput } from "@/components/SearchInput";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";

interface AnnouncementTableProps {
  items: AnnouncementItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: AnnouncementItem) => void;
  onOpenDetailModal: (item: AnnouncementItem) => void;
}

export const AnnouncementTable: React.FC<AnnouncementTableProps> = ({
  items,
  isLoading,
  onRefresh,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDetailModal,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingItem, setDeletingItem] = useState<AnnouncementItem | null>(null);
  const [pinningId, setPinningId] = useState<number | null>(null);

  const safeItems = Array.isArray(items) ? items : [];

  const filteredItems = safeItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTogglePin = async (item: AnnouncementItem) => {
    if (!item.isPinned) {
      const currentPinnedCount = safeItems.filter((i) => i.isPinned).length;
      if (currentPinnedCount >= 3) {
        toast.error("Maksimal 3 pengumuman yang dapat disematkan secara bersamaan");
        return;
      }
    }

    setPinningId(item.id);
    try {
      const res = await fetch(`/api/announcements/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !item.isPinned }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah status sematan");
      }

      toast.success(
        item.isPinned ? "Sematkan pengumuman dilepas" : "Pengumuman disematkan di bagian atas"
      );
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setPinningId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setDeletingId(deletingItem.id);
    try {
      const res = await fetch(`/api/announcements/${deletingItem.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus pengumuman");
      }

      toast.success("Pengumuman berhasil dihapus");
      setDeletingItem(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryBadge = (category: AnnouncementCategory) => {
    switch (category) {
      case "mendesak":
        return <span className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-600">Mendesak</span>;
      case "penting":
        return <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-600">Penting</span>;
      default:
        return <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-600">Umum</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Filters & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-card border border-gray-border p-4 rounded-2xl shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari pengumuman..."
            containerClassName="w-full sm:w-72"
            isLoading={isLoading}
          />

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 bg-gray-sidebar-hover/40 p-1 rounded-xl border border-gray-border/60 overflow-x-auto w-full sm:w-auto">
            {[
              { id: "all", label: "Semua Kategori" },
              { id: "umum", label: "Umum" },
              { id: "penting", label: "Penting" },
              { id: "mendesak", label: "Mendesak" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white shadow-xs"
                    : "text-gray-secondary-text hover:text-gray-heading-main"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Announcement Button */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-900 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Pengumuman Baru</span>
        </button>
      </div>

      {/* Announcements Table / List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-card border border-gray-border rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-border bg-gray-card p-12 text-center text-xs text-gray-secondary-text">
          <Clock className="h-10 w-10 text-gray-border mb-3" />
          <h4 className="text-sm font-bold text-gray-heading-main">Tidak ada pengumuman ditemukan</h4>
          <p className="mt-1">Coba ubah kata kunci pencarian atau kategori filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const dateStr = item.publishedAt
              ? new Date(item.publishedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : new Date(item.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border bg-gray-card shadow-xs transition-all hover:border-primary/40 ${
                  item.isPinned ? "border-purple-500/30 bg-purple-500/5" : "border-gray-border"
                }`}
              >
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {getCategoryBadge(item.category)}
                    {item.isPinned && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[11px] font-bold text-purple-600">
                        <Pin className="h-3 w-3 fill-current" />
                        <span>Disematkan</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-gray-secondary-text ml-auto sm:ml-0">
                      <Calendar className="h-3 w-3 text-primary" />
                      {dateStr}
                    </span>
                    {item.creatorName && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-secondary-text">
                        • <User className="h-3 w-3 text-gray-placeholder" /> {item.creatorName}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold text-gray-heading-main line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-gray-secondary-text line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 border-t sm:border-t-0 border-gray-border/60 pt-3 sm:pt-0 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    title="Lihat Pratinjau"
                    onClick={() => onOpenDetailModal(item)}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-border bg-gray-card px-2.5 py-1.5 text-xs font-bold text-gray-secondary-text hover:text-gray-heading-main hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Pratinjau</span>
                  </button>

                  <button
                    type="button"
                    title={item.isPinned ? "Lepas Sematan" : "Sematkan"}
                    disabled={pinningId === item.id}
                    onClick={() => handleTogglePin(item)}
                    className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                      item.isPinned
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-600 hover:bg-purple-500/20"
                        : "border-gray-border bg-gray-card text-gray-secondary-text hover:text-purple-600 hover:bg-purple-500/10"
                    }`}
                  >
                    <Pin className={`h-3.5 w-3.5 ${item.isPinned ? "fill-current" : ""}`} />
                  </button>

                  <button
                    type="button"
                    title="Edit Pengumuman"
                    onClick={() => onOpenEditModal(item)}
                    className="rounded-xl border border-gray-border bg-gray-card p-1.5 text-gray-secondary-text hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    title="Hapus Pengumuman"
                    disabled={deletingId === item.id}
                    onClick={() => setDeletingItem(item)}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-600 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Pengumuman"
        description={`Apakah Anda yakin ingin menghapus pengumuman "${deletingItem?.title}"?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={Boolean(deletingId)}
      />
    </div>
  );
};
