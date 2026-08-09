"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { RefreshButton } from "@/components/RefreshButton";
import {
  AuditLogItem,
  AuditLogStats,
  AuditLogPagination,
  AuditLogFilterState,
} from "./types";
import { AuditLogKpiCards } from "./_components/AuditLogKpiCards";
import { AuditLogFilterBar } from "./_components/AuditLogFilterBar";
import { AuditLogTable } from "./_components/AuditLogTable";
import { AuditLogDetailModal } from "./_components/AuditLogDetailModal";

import { PermissionGuard } from "@/components/PermissionGuard";

export default function AuditLogsPage() {
  return (
    <PermissionGuard requiredPermission="view-audit-logs">
      <AuditLogsContent />
    </PermissionGuard>
  );
}

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [pagination, setPagination] = useState<AuditLogPagination>({
    totalLogs: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 15,
  });

  const [filter, setFilter] = useState<AuditLogFilterState>({
    search: "",
    module: "all",
    dateRange: "all",
    page: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("page", String(filter.page));
      queryParams.set("limit", "15");
      if (filter.module !== "all") queryParams.set("module", filter.module);
      if (filter.search.trim() !== "") queryParams.set("search", filter.search.trim());
      if (filter.dateRange !== "all") queryParams.set("dateRange", filter.dateRange);

      const res = await fetch(`/api/audit-logs?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error("Gagal mengambil data log aktivitas audit");
      }
      const json = await res.json();
      setLogs(json.logs);
      setPagination(json.pagination);
      setStats(json.stats);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        const queryParams = new URLSearchParams();
        queryParams.set("page", String(filter.page));
        queryParams.set("limit", "15");
        if (filter.module !== "all") queryParams.set("module", filter.module);
        if (filter.search.trim() !== "") queryParams.set("search", filter.search.trim());
        if (filter.dateRange !== "all") queryParams.set("dateRange", filter.dateRange);

        const res = await fetch(`/api/audit-logs?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error("Gagal mengambil data log aktivitas audit");
        }
        const json = await res.json();
        if (!isCancelled) {
          setLogs(json.logs);
          setPagination(json.pagination);
          setStats(json.stats);
          setError(null);
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
  }, [filter]);

  const handleFilterChange = (newFilter: Partial<AuditLogFilterState>) => {
    setFilter((prev) => ({
      ...prev,
      ...newFilter,
    }));
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams();
      if (filter.module !== "all") queryParams.set("module", filter.module);
      if (filter.search.trim() !== "") queryParams.set("search", filter.search.trim());
      if (filter.dateRange !== "all") queryParams.set("dateRange", filter.dateRange);

      const url = `/api/audit-logs/export?${queryParams.toString()}`;
      window.open(url, "_blank");
      toast.success("File CSV laporan audit log sedang diunduh.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal mengunduh file ekspor CSV");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="space-y-8 animate-pulse pb-12">
        <div className="space-y-2">
          <div className="h-8 w-72 bg-gray-border/60 rounded-xl" />
          <div className="h-4 w-96 bg-gray-border/40 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-gray-card border border-gray-border rounded-2xl p-4"
            />
          ))}
        </div>
        <div className="h-96 bg-gray-card border border-gray-border rounded-2xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-error" />
        <h3 className="mt-4 text-lg font-semibold text-gray-heading-main">
          Terjadi Kesalahan
        </h3>
        <p className="mt-2 max-w-md text-sm text-gray-secondary-text">
          {error || "Data audit log tidak dapat ditampilkan."}
        </p>
        <div className="mt-4">
          <RefreshButton onClick={fetchLogsData} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
          Log Aktivitas (Audit Trail Keamanan)
        </h1>
        <p className="text-sm text-gray-secondary-text mt-0.5">
          Rekam jejak riwayat mutasi data, otorisasi, dan transaksi sistem untuk keamanan & audit investigasi.
        </p>
      </div>

      {/* 1. KPI Summary Cards */}
      <AuditLogKpiCards stats={stats} />

      {/* 2. Filter Bar */}
      <AuditLogFilterBar
        filter={filter}
        onFilterChange={handleFilterChange}
        onExportCsv={handleExportCsv}
        isExporting={isExporting}
      />

      {/* 3. Audit Log Table */}
      <AuditLogTable
        logs={logs}
        pagination={pagination}
        onPageChange={(page) => handleFilterChange({ page })}
        onSelectLog={(log) => setSelectedLog(log)}
      />

      {/* 4. Detail Modal */}
      <AuditLogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
