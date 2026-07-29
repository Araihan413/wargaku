"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AlertTriangle, Save, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { RefreshButton } from "@/components/RefreshButton";
import {
  RolePermissionMatrixData,
  MatrixState,
  PermissionModuleGroup,
} from "./types";
import { RolePermissionKpiCards } from "./_components/RolePermissionKpiCards";
import { PermissionFilterBar } from "./_components/PermissionFilterBar";
import { RolePermissionMatrixTable } from "./_components/RolePermissionMatrixTable";

export default function RolePermissionsPage() {
  const [data, setData] = useState<RolePermissionMatrixData | null>(null);
  const [initialMatrix, setInitialMatrix] = useState<MatrixState>({});
  const [currentMatrix, setCurrentMatrix] = useState<MatrixState>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");

  const fetchMatrixData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/permissions");
      if (!res.ok) {
        throw new Error("Gagal mengambil data matriks role & permission");
      }
      const json: RolePermissionMatrixData = await res.json();
      setData(json);
      setInitialMatrix(JSON.parse(JSON.stringify(json.matrix)));
      setCurrentMatrix(JSON.parse(JSON.stringify(json.matrix)));
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
        const res = await fetch("/api/permissions");
        if (!res.ok) {
          throw new Error("Gagal mengambil data matriks role & permission");
        }
        const json: RolePermissionMatrixData = await res.json();
        if (!isCancelled) {
          setData(json);
          setInitialMatrix(JSON.parse(JSON.stringify(json.matrix)));
          setCurrentMatrix(JSON.parse(JSON.stringify(json.matrix)));
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
  }, []);

  // Check if currentMatrix differs from initialMatrix
  const hasChanges = useMemo(() => {
    if (!data) return false;
    for (const role of data.roles) {
      const initialIds = (initialMatrix[role.id] || []).slice().sort();
      const currentIds = (currentMatrix[role.id] || []).slice().sort();
      if (JSON.stringify(initialIds) !== JSON.stringify(currentIds)) {
        return true;
      }
    }
    return false;
  }, [data, initialMatrix, currentMatrix]);

  // Toggle permission ID for a role
  const handleTogglePermission = (roleId: number, permissionId: number) => {
    setCurrentMatrix((prev) => {
      const rolePerms = prev[roleId] ? [...prev[roleId]] : [];
      const index = rolePerms.indexOf(permissionId);
      if (index > -1) {
        rolePerms.splice(index, 1);
      } else {
        rolePerms.push(permissionId);
      }
      return {
        ...prev,
        [roleId]: rolePerms,
      };
    });
  };

  const handleResetChanges = () => {
    setCurrentMatrix(JSON.parse(JSON.stringify(initialMatrix)));
    toast.info("Perubahan hak akses dibatalkan.");
  };

  const handleSaveChanges = async () => {
    if (!data || !hasChanges) return;

    setIsSaving(true);
    try {
      // Collect modified roles
      const modifiedRoles = data.roles.filter((role) => {
        const initIds = (initialMatrix[role.id] || []).slice().sort();
        const currIds = (currentMatrix[role.id] || []).slice().sort();
        return JSON.stringify(initIds) !== JSON.stringify(currIds);
      });

      for (const role of modifiedRoles) {
        const permissionIds = currentMatrix[role.id] || [];
        const res = await fetch("/api/permissions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleId: role.id, permissionIds }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(
            errJson.error || `Gagal menyimpan izin untuk role ${role.name}`
          );
        }
      }

      toast.success("Berhasil menyimpan matriks hak akses permission!");
      setInitialMatrix(JSON.parse(JSON.stringify(currentMatrix)));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menyimpan perubahan hak akses");
    } finally {
      setIsSaving(false);
    }
  };

  // Filtering module groups by search and module select
  const filteredModuleGroups: PermissionModuleGroup[] = useMemo(() => {
    if (!data) return [];
    return data.moduleGroups
      .filter((group) => {
        if (selectedModule !== "all" && group.module !== selectedModule) {
          return false;
        }
        return true;
      })
      .map((group) => {
        const filteredPerms = group.permissions.filter((perm) => {
          if (!searchQuery) return true;
          const q = searchQuery.toLowerCase();
          return (
            perm.name.toLowerCase().includes(q) ||
            perm.slug.toLowerCase().includes(q) ||
            perm.description?.toLowerCase().includes(q)
          );
        });
        return {
          ...group,
          permissions: filteredPerms,
        };
      })
      .filter((group) => group.permissions.length > 0);
  }, [data, searchQuery, selectedModule]);

  const moduleOptions = useMemo(() => {
    if (!data) return [];
    return data.moduleGroups.map((g) => ({
      value: g.module,
      label: `Modul: ${g.module} (${g.permissions.length} izin)`,
    }));
  }, [data]);

  if (isLoading && !data) {
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

  if (error || !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-error" />
        <h3 className="mt-4 text-lg font-semibold text-gray-heading-main">
          Terjadi Kesalahan
        </h3>
        <p className="mt-2 max-w-md text-sm text-gray-secondary-text">
          {error || "Data matriks permission tidak dapat ditampilkan."}
        </p>
        <div className="mt-4">
          <RefreshButton onClick={fetchMatrixData} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 relative">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
            Manajemen Role & Permission (RBAC)
          </h1>
          <p className="text-sm text-gray-secondary-text mt-0.5">
            Pengaturan matriks hak akses 17 permission MVP secara dinamis per modul untuk 6 role sistem.
          </p>
        </div>
      </div>

      {/* 1. KPI Summary Cards */}
      <RolePermissionKpiCards data={data} currentMatrix={currentMatrix} />

      {/* 2. Filter Bar */}
      <PermissionFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedModule={selectedModule}
        onModuleChange={setSelectedModule}
        moduleOptions={moduleOptions}
        hasChanges={hasChanges}
        onResetChanges={handleResetChanges}
      />

      {/* 3. Interactive Matrix Table */}
      <RolePermissionMatrixTable
        data={data}
        matrix={currentMatrix}
        onTogglePermission={handleTogglePermission}
        filteredModuleGroups={filteredModuleGroups}
      />

      {/* Floating Unsaved Changes Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-gray-heading-main text-white p-4 rounded-2xl shadow-2xl border border-gray-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold">
                Simpan Perubahan Hak Akses!
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetChanges}
                disabled={isSaving}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>

              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
