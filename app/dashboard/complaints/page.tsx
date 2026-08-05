"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { useRoleStore } from "@/lib/store/use-role-store";
import { ComplaintKpiCards } from "./_components/ComplaintKpiCards";
import { ComplaintFilterBar } from "./_components/ComplaintFilterBar";
import { ComplaintTable } from "./_components/ComplaintTable";
import { ComplaintDetailModal } from "./_components/ComplaintDetailModal";
import { DeleteComplaintModal } from "./_components/DeleteComplaintModal";
import { ComplaintItem, ComplaintKpiSummary } from "./types";
import { RefreshCw } from "lucide-react"; 
import { toast } from "sonner";
import { RefreshButton } from "@/components/RefreshButton";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function ComplaintsDashboardPage() {
  return (
    <PermissionGuard requiredPermission="manage-complaints">
      <ComplaintsDashboardContent />
    </PermissionGuard>
  );
}

function ComplaintsDashboardContent() {
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const { activeRoleId } = useRoleStore();

  const [stats, setStats] = useState<ComplaintKpiSummary>({
    total: 0,
    menunggu: 0,
    proses: 0,
    selesai: 0,
    ditolak: 0,
  });
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [complaintToDelete, setComplaintToDelete] = useState<ComplaintItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const currentRole = activeRoleId || session?.user?.roleId || 6;
  const canDelete = currentRole === 1 || currentRole === 2;

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.append("status", status);
      if (category !== "all") params.append("category", category);
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

      const res = await fetch(`/api/complaints?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setStats(json.stats || { total: 0, menunggu: 0, proses: 0, selesai: 0, ditolak: 0 });
        setComplaints(json.data || []);
      } else {
        toast.error("Gagal mengambil data pengaduan warga");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  }, [status, category, debouncedSearch]);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        const params = new URLSearchParams();
        if (status !== "all") params.append("status", status);
        if (category !== "all") params.append("category", category);
        if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

        const res = await fetch(`/api/complaints?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled) {
            setStats(json.stats || { total: 0, menunggu: 0, proses: 0, selesai: 0, ditolak: 0 });
            setComplaints(json.data || []);
          }
        } else {
          if (!isCancelled) {
            toast.error("Gagal mengambil data pengaduan warga");
          }
        }
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          toast.error("Terjadi kesalahan koneksi");
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
  }, [status, category, debouncedSearch]);

  const handleResetFilters = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
  };

  const handleOpenDetail = (complaint: ComplaintItem) => {
    setSelectedComplaint(complaint);
    setIsDetailModalOpen(true);
  };

  const handleOpenDelete = (complaint: ComplaintItem) => {
    setComplaintToDelete(complaint);
    setIsDeleteModalOpen(true);
  };

  if (isSessionLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
              Kelola Pengaduan Warga
            </h1>
          </div>
          <p className="text-sm text-gray-secondary-text mt-1">
            Respon, tinjau bukti foto lampiran, dan perbarui status laporan pengaduan dari warga setempat.
          </p>
        </div>

        <RefreshButton
          onClick={fetchComplaints}
          isLoading={isLoading}
        />
      </div>

      {/* KPI Cards */}
      <ComplaintKpiCards
        summary={stats}
        activeStatus={status}
        onSelectStatus={setStatus}
      />

      {/* Filter Bar */}
      <ComplaintFilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        status={status}
        onStatusChange={setStatus}
        onReset={handleResetFilters}
      />

      {/* Table List */}
      <ComplaintTable
        complaints={complaints}
        isLoading={isLoading}
        onSelectComplaint={handleOpenDetail}
        onDeleteComplaint={handleOpenDelete}
        canDelete={canDelete}
      />

      {/* Detail & Response Modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onRefresh={fetchComplaints}
      />

      {/* Delete Confirmation Modal */}
      <DeleteComplaintModal
        complaint={complaintToDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onRefresh={fetchComplaints}
      />
    </div>
  );
}
