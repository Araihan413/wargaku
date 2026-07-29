"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { RefreshButton } from "@/components/RefreshButton";
import {
  ComplaintsReportOverview,
  ComplaintReportItem,
  AnnouncementReportItem,
  ActivityReportItem,
  ComplaintsReportFilterState,
  ReportPagination,
  ReportTabType,
} from "./types";
import { ComplaintsReportKpiCards } from "./_components/ComplaintsReportKpiCards";
import { ComplaintsReportTabs } from "./_components/ComplaintsReportTabs";
import { ComplaintsReportFilterBar } from "./_components/ComplaintsReportFilterBar";
import { ComplaintsTable } from "./_components/ComplaintsTable";
import { AnnouncementsTable } from "./_components/AnnouncementsTable";
import { ActivitiesTable } from "./_components/ActivitiesTable";
import { ComplaintDetailModal } from "./_components/ComplaintDetailModal";

const DEFAULT_PAGINATION: ReportPagination = {
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
  limit: 15,
};

export default function ComplaintsReportPage() {
  const [overview, setOverview] = useState<ComplaintsReportOverview | null>(null);
  const [complaints, setComplaints] = useState<ComplaintReportItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementReportItem[]>([]);
  const [activities, setActivities] = useState<ActivityReportItem[]>([]);
  const [pagination, setPagination] = useState<ReportPagination>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintReportItem | null>(null);

  const [filter, setFilter] = useState<ComplaintsReportFilterState>({
    tab: "complaints",
    search: "",
    status: "all",
    category: "all",
    filter: "all",
    page: 1,
  });

  const handleFilterChange = (newFilter: Partial<ComplaintsReportFilterState>) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  };

  const handleTabChange = (tab: ReportTabType) => {
    setFilter({
      tab,
      search: "",
      status: "all",
      category: "all",
      filter: "all",
      page: 1,
    });
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("type", filter.tab);
        params.set("page", String(filter.page));
        params.set("limit", "15");
        if (filter.search.trim()) params.set("search", filter.search.trim());
        if (filter.status !== "all") params.set("status", filter.status);
        if (filter.category !== "all") params.set("category", filter.category);
        if (filter.filter !== "all") params.set("filter", filter.filter);

        const res = await fetch(`/api/complaints-report?${params.toString()}`);
        if (!res.ok) throw new Error("Gagal memuat data postingan & pengaduan");

        const json = await res.json();

        if (!isCancelled) {
          setOverview(json.overview);
          setPagination(json.pagination || DEFAULT_PAGINATION);
          setError(null);

          if (json.type === "announcements") {
            setAnnouncements(json.data);
          } else if (json.type === "activities") {
            setActivities(json.data);
          } else {
            setComplaints(json.data);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Terjadi kesalahan koneksi");
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [filter]);

  // ─── Loading Skeleton ─────────────────────────────────────────────
  if (isLoading && !overview) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="space-y-2">
          <div className="h-8 w-80 bg-gray-border/60 rounded-xl" />
          <div className="h-4 w-96 bg-gray-border/40 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-card border border-gray-border rounded-2xl" />
          ))}
        </div>
        <div className="h-12 bg-gray-card border border-gray-border rounded-2xl" />
        <div className="h-12 bg-gray-card border border-gray-border rounded-2xl" />
        <div className="h-96 bg-gray-card border border-gray-border rounded-2xl" />
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────
  if (error || !overview) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-error" />
        <h3 className="mt-4 text-lg font-semibold text-gray-heading-main">Terjadi Kesalahan</h3>
        <p className="mt-2 max-w-md text-sm text-gray-secondary-text">
          {error || "Data tidak dapat ditampilkan."}
        </p>
        <div className="mt-4">
          <RefreshButton
            onClick={() => setFilter((prev) => ({ ...prev }))}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
          Postingan & Pengaduan Warga
        </h1>
        <p className="text-sm text-gray-secondary-text mt-0.5">
          Pantau laporan aduan publik, pengumuman resmi, dan agenda kegiatan RT secara menyeluruh (Read-Only).
        </p>
      </div>

      {/* 1. KPI Overview Cards */}
      <ComplaintsReportKpiCards overview={overview} />

      {/* 2. Tab Navigation */}
      <ComplaintsReportTabs activeTab={filter.tab} onTabChange={handleTabChange} />

      {/* 3. Filter Bar (contextual per tab) */}
      <ComplaintsReportFilterBar filter={filter} onFilterChange={handleFilterChange} />

      {/* 4. Content Table per Tab */}
      {filter.tab === "complaints" && (
        <ComplaintsTable
          data={complaints}
          pagination={pagination}
          onPageChange={(page) => handleFilterChange({ page })}
          onSelectItem={(item) => setSelectedComplaint(item)}
        />
      )}

      {filter.tab === "announcements" && (
        <AnnouncementsTable
          data={announcements}
          pagination={pagination}
          onPageChange={(page) => handleFilterChange({ page })}
        />
      )}

      {filter.tab === "activities" && (
        <ActivitiesTable
          data={activities}
          pagination={pagination}
          onPageChange={(page) => handleFilterChange({ page })}
        />
      )}

      {/* 5. Complaint Detail Modal */}
      <ComplaintDetailModal
        item={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
}
