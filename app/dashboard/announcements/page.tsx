"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { RefreshButton } from "@/components/RefreshButton";
import { AnnouncementItem } from "./types";
import { AnnouncementTable } from "./_components/AnnouncementTable";
import { AddAnnouncementModal } from "./_components/AddAnnouncementModal";
import { EditAnnouncementModal } from "./_components/EditAnnouncementModal";
import { AnnouncementDetailModal } from "./_components/AnnouncementDetailModal";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function AnnouncementsPage() {
  return (
    <PermissionGuard requiredPermission="manage-announcements">
      <AnnouncementsContent />
    </PermissionGuard>
  );
}

function AnnouncementsContent() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEditItem, setSelectedEditItem] = useState<AnnouncementItem | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<AnnouncementItem | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/announcements");
      if (!res.ok) {
        throw new Error("Gagal mengambil data pengumuman");
      }
      const data = await res.json();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        const res = await fetch("/api/announcements");
        if (!res.ok) {
          throw new Error("Gagal mengambil data pengumuman");
        }
        const data = await res.json();
        if (!isCancelled) {
          setItems(data);
        }
      } catch (err: any) {
        console.error(err);
        if (!isCancelled) {
          setError(err.message || "Terjadi kesalahan koneksi");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main flex items-center gap-2.5">
            <span>Kelola Pengumuman Warga</span>
          </h1>
          <p className="text-sm text-gray-secondary-text mt-1">
            Publikasikan informasi penting, pengumuman umum, dan informasi darurat untuk seluruh warga RT.
          </p>
        </div>

        <RefreshButton
          onClick={fetchAnnouncements}
          isLoading={isLoading}
        />
      </div>

      {error ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-error" />
          <h3 className="mt-3 text-base font-semibold text-gray-heading-main">Gagal Memuat Pengumuman</h3>
          <p className="mt-1 max-w-md text-xs text-gray-secondary-text">{error}</p>
          <button
            type="button"
            onClick={fetchAnnouncements}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-primary-900 cursor-pointer"
          >
            Muat Ulang
          </button>
        </div>
      ) : (
        <AnnouncementTable
          items={items}
          isLoading={isLoading}
          onRefresh={fetchAnnouncements}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenEditModal={(item) => setSelectedEditItem(item)}
          onOpenDetailModal={(item) => setSelectedDetailItem(item)}
        />
      )}

      {/* Modals */}
      <AddAnnouncementModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchAnnouncements}
      />

      <EditAnnouncementModal
        isOpen={!!selectedEditItem}
        onClose={() => setSelectedEditItem(null)}
        announcement={selectedEditItem}
        onSuccess={fetchAnnouncements}
      />

      <AnnouncementDetailModal
        isOpen={!!selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        announcement={selectedDetailItem}
      />
    </div>
  );
}
