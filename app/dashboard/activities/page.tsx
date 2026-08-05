"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { RefreshButton } from "@/components/RefreshButton";
import { ActivityItem } from "./types";
import { ActivityTable } from "./_components/ActivityTable";
import { AddActivityModal } from "./_components/AddActivityModal";
import { EditActivityModal } from "./_components/EditActivityModal";
import { ActivityDetailModal } from "./_components/ActivityDetailModal";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function ActivitiesPage() {
  return (
    <PermissionGuard requiredPermission="manage-activities">
      <ActivitiesContent />
    </PermissionGuard>
  );
}

function ActivitiesContent() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "past">("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEditItem, setSelectedEditItem] = useState<ActivityItem | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<ActivityItem | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/activities?filter=${activeFilter}`);
      if (!res.ok) {
        throw new Error("Gagal mengambil data kegiatan RT");
      }
      const data = await res.json();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/activities?filter=${activeFilter}`);
        if (!res.ok) {
          throw new Error("Gagal mengambil data kegiatan RT");
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
  }, [activeFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main flex items-center gap-2.5">
            <span>Kelola Kegiatan RT</span>
          </h1>
          <p className="text-sm text-gray-secondary-text mt-1">
            Jadwalkan rapat warga, kerja bakti, posyandu, dan agenda kegiatan sosial RT lainnya.
          </p>
        </div>

        <RefreshButton
          onClick={fetchActivities}
          isLoading={isLoading}
        />
      </div>

      {error ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-error" />
          <h3 className="mt-3 text-base font-semibold text-gray-heading-main">Gagal Memuat Kegiatan RT</h3>
          <p className="mt-1 max-w-md text-xs text-gray-secondary-text">{error}</p>
          <button
            type="button"
            onClick={fetchActivities}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-primary-900 cursor-pointer"
          >
            Muat Ulang
          </button>
        </div>
      ) : (
        <ActivityTable
          items={items}
          isLoading={isLoading}
          activeFilter={activeFilter}
          onFilterChange={(f) => setActiveFilter(f)}
          onRefresh={fetchActivities}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenEditModal={(item) => setSelectedEditItem(item)}
          onOpenDetailModal={(item) => setSelectedDetailItem(item)}
        />
      )}

      {/* Modals */}
      <AddActivityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchActivities}
      />

      <EditActivityModal
        isOpen={!!selectedEditItem}
        onClose={() => setSelectedEditItem(null)}
        activity={selectedEditItem}
        onSuccess={fetchActivities}
      />

      <ActivityDetailModal
        isOpen={!!selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        activity={selectedDetailItem}
      />
    </div>
  );
}
