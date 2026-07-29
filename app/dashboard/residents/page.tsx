"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, AlertTriangle, Loader2, Home, Search } from "lucide-react";
import { toast } from "sonner";
import { ResidentsTabNav } from "./_components/ResidentsTabNav";
import { KKSearchFilter } from "./_components/KKSearchFilter";
import { KKTable } from "./_components/KKTable";
import { EditKKModal } from "./_components/EditKKModal";
import { FamilyItem } from "./types";
import { CustomSelect } from "@/components/CustomSelect";
import { DwellingTable, DwellingItem } from "./_components/DwellingTable";
import { AddDwellingModal } from "./_components/AddDwellingModal";
import { EditDwellingModal } from "./_components/EditDwellingModal";
import { DwellingDetailModal } from "./_components/DwellingDetailModal";
import { RentalTable, RentalResidentItem } from "./_components/RentalTable";
import { EditTenantModal } from "./_components/EditTenantModal";
import { CheckInTenantModal } from "./_components/CheckInTenantModal";
import { VerifyTenantModal } from "./_components/VerifyTenantModal";
import { CheckOutTenantModal } from "./_components/CheckOutTenantModal";
import { TenantDetailModal } from "./_components/TenantDetailModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { CoordinatorTable, CoordinatorItem } from "./_components/CoordinatorTable";
import { AddCoordinatorModal } from "./_components/AddCoordinatorModal";
import { EditCoordinatorModal } from "./_components/EditCoordinatorModal";
import { CoordinatorDetailModal } from "./_components/CoordinatorDetailModal";
import { AddUserModal } from "../users/_components/AddUserModal";
import { authClient } from "@/lib/auth-client";
import { useRoleStore } from "@/lib/store/use-role-store";

export default function ResidentsPage() {
  const { data: session } = authClient.useSession();
  const { activeRoleId } = useRoleStore();
  const currentRole = activeRoleId || session?.user?.roleId || 6;
  const canManage = currentRole === 1 || currentRole === 2;
  const isReadOnly = !canManage;

  const [activeTab, setActiveTab] = useState<"kk" | "penyewa" | "hunian" | "koordinator">("kk");

  // Kartu Keluarga List states
  const [families, setFamilies] = useState<FamilyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedActive, setSelectedActive] = useState("true"); // Default to show only active

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFamilyForEdit, setSelectedFamilyForEdit] = useState<FamilyItem | null>(null);

  // Dwellings states
  const [dwellingsList, setDwellingsList] = useState<DwellingItem[]>([]);
  const [dwellingsTotalItems, setDwellingsTotalItems] = useState(0);
  const [dwellingsCurrentPage, setDwellingsCurrentPage] = useState(1);
  const [isDwellingsLoading, setIsDwellingsLoading] = useState(false);
  const [isAddDwellingOpen, setIsAddDwellingOpen] = useState(false);
  const [isEditDwellingOpen, setIsEditDwellingOpen] = useState(false);
  const [selectedDwellingForEdit, setSelectedDwellingForEdit] = useState<DwellingItem | null>(null);
  const [selectedDwellingType, setSelectedDwellingType] = useState("");
  const [selectedDwellingForDetail, setSelectedDwellingForDetail] = useState<number | null>(null);
  const [isDetailDwellingOpen, setIsDetailDwellingOpen] = useState(false);

  // Renters states
  const [rentersList, setRentersList] = useState<RentalResidentItem[]>([]);
  const [isRentersLoading, setIsRentersLoading] = useState(false);
  const [rentersTotalItems, setRentersTotalItems] = useState(0);
  const [rentersCurrentPage, setRentersCurrentPage] = useState(1);
  const [selectedRenterActive, setSelectedRenterActive] = useState("true");
  const [selectedRenterVerify, setSelectedRenterVerify] = useState("");
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditRenterOpen, setIsEditRenterOpen] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState<RentalResidentItem | null>(null);
  const [isReactivateRenterModalOpen, setIsReactivateRenterModalOpen] = useState(false);
  const [selectedRenterForReactivate, setSelectedRenterForReactivate] = useState<RentalResidentItem | null>(null);
  const [isReactivatingRenter, setIsReactivatingRenter] = useState(false);

  // Coordinator states
  const [coordinatorsList, setCoordinatorsList] = useState<CoordinatorItem[]>([]);
  const [isCoordinatorsLoading, setIsCoordinatorsLoading] = useState(false);
  const [isAddCoordinatorOpen, setIsAddCoordinatorOpen] = useState(false);
  const [isDeactivateCoordOpen, setIsDeactivateCoordOpen] = useState(false);
  const [selectedCoordForDeactivate, setSelectedCoordForDeactivate] = useState<CoordinatorItem | null>(null);
  const [isDeactivatingCoord, setIsDeactivatingCoord] = useState(false);
  const [selectedCoordinatorStatus, setSelectedCoordinatorStatus] = useState("");
  const [coordinatorsCurrentPage, setCoordinatorsCurrentPage] = useState(1);
  const [selectedCoordinatorForEdit, setSelectedCoordinatorForEdit] = useState<CoordinatorItem | null>(null);
  const [isEditCoordinatorOpen, setIsEditCoordinatorOpen] = useState(false);
  const [selectedCoordinatorForDetail, setSelectedCoordinatorForDetail] = useState<CoordinatorItem | null>(null);
  const [isDetailCoordinatorOpen, setIsDetailCoordinatorOpen] = useState(false);

  // Disable KK Confirmation states
  const [isAddWargaOpen, setIsAddWargaOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [selectedFamilyForDisable, setSelectedFamilyForDisable] = useState<FamilyItem | null>(null);
  const [isDisabling, setIsDisabling] = useState(false);

  // Disable Dwelling Confirmation states
  const [isDisableDwellingConfirmOpen, setIsDisableDwellingConfirmOpen] = useState(false);
  const [dwellingToDisable, setDwellingToDisable] = useState<DwellingItem | null>(null);
  const [isDisablingDwelling, setIsDisablingDwelling] = useState(false);

  // Fetch Families
  const fetchFamilies = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      let url = `/api/families?limit=${itemsPerPage}&offset=${offset}`;

      if (debouncedSearchQuery) {
        url += `&query=${encodeURIComponent(debouncedSearchQuery)}`;
      }
      if (selectedStatus) {
        url += `&verificationStatus=${selectedStatus}`;
      }
      if (selectedActive) {
        url += `&isActive=${selectedActive}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFamilies(data.data || []);
        setTotalItems(data.metadata?.total || 0);
      } else {
        toast.error("Gagal memuat data Kartu Keluarga");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem saat memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, selectedStatus, selectedActive]);

  useEffect(() => {
    if (activeTab === "kk") {
      Promise.resolve().then(() => {
        fetchFamilies();
      });
    }
  }, [activeTab, fetchFamilies]);

  // Fetch Dwellings
  const fetchDwellings = useCallback(async () => {
    setIsDwellingsLoading(true);
    try {
      const offset = (dwellingsCurrentPage - 1) * itemsPerPage;
      let url = `/api/dwellings?admin=true&limit=${itemsPerPage}&offset=${offset}`;

      if (debouncedSearchQuery) {
        url += `&query=${encodeURIComponent(debouncedSearchQuery)}`;
      }
      if (selectedDwellingType) {
        url += `&type=${selectedDwellingType}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDwellingsList(data.data || []);
        setDwellingsTotalItems(data.metadata?.total || 0);
      } else {
        toast.error("Gagal memuat data hunian");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem saat memuat data hunian");
    } finally {
      setIsDwellingsLoading(false);
    }
  }, [dwellingsCurrentPage, debouncedSearchQuery, selectedDwellingType]);

  useEffect(() => {
    if (activeTab === "hunian") {
      Promise.resolve().then(() => {
        fetchDwellings();
      });
    }
  }, [activeTab, fetchDwellings]);

  const handleDisableDwelling = (dwelling: DwellingItem) => {
    setDwellingToDisable(dwelling);
    setIsDisableDwellingConfirmOpen(true);
  };

  const executeDisableDwelling = async () => {
    if (!dwellingToDisable) return;
    setIsDisablingDwelling(true);
    try {
      const res = await fetch(`/api/dwellings/${dwellingToDisable.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Hunian berhasil dinonaktifkan");
        fetchDwellings();
        setIsDisableDwellingConfirmOpen(false);
        setDwellingToDisable(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menonaktifkan hunian");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat menonaktifkan hunian");
    } finally {
      setIsDisablingDwelling(false);
    }
  };

  // Fetch Renters
  const fetchRenters = useCallback(async () => {
    setIsRentersLoading(true);
    try {
      const offset = (rentersCurrentPage - 1) * itemsPerPage;
      let url = `/api/rental-residents?limit=${itemsPerPage}&offset=${offset}&tenantType=perorangan`;

      if (debouncedSearchQuery) {
        url += `&query=${encodeURIComponent(debouncedSearchQuery)}`;
      }
      if (selectedRenterActive) {
        url += `&isActive=${selectedRenterActive}`;
      }
      if (selectedRenterVerify) {
        url += `&verificationStatus=${selectedRenterVerify}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRentersList(data.data || []);
        setRentersTotalItems(data.metadata?.total || 0);
      } else {
        toast.error("Gagal memuat data penyewa");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem saat memuat data penyewa");
    } finally {
      setIsRentersLoading(false);
    }
  }, [rentersCurrentPage, debouncedSearchQuery, selectedRenterActive, selectedRenterVerify]);

  useEffect(() => {
    if (activeTab === "penyewa") {
      Promise.resolve().then(() => {
        fetchRenters();
      });
    }
  }, [activeTab, fetchRenters]);

  // Fetch Coordinators
  const fetchCoordinators = useCallback(async () => {
    setIsCoordinatorsLoading(true);
    try {
      const res = await fetch("/api/coordinators");
      if (res.ok) {
        const data = await res.json();
        setCoordinatorsList(data);
      } else {
        toast.error("Gagal mengambil data koordinator");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi saat memuat data koordinator");
    } finally {
      setIsCoordinatorsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "koordinator") {
      Promise.resolve().then(() => {
        fetchCoordinators();
      });
    }
  }, [activeTab, fetchCoordinators]);

  const handleDeactivateCoordinator = async () => {
    if (!selectedCoordForDeactivate) return;
    setIsDeactivatingCoord(true);
    try {
      const res = await fetch(`/api/coordinators/${selectedCoordForDeactivate.id}`, {
        method: "PUT",
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(result.message || "Akun koordinator berhasil dinonaktifkan");
        setIsDeactivateCoordOpen(false);
        setSelectedCoordForDeactivate(null);
        fetchCoordinators();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menonaktifkan koordinator");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsDeactivatingCoord(false);
    }
  };

  const handleDisableKK = async () => {
    if (!selectedFamilyForDisable) return;
    setIsDisabling(true);
    try {
      const res = await fetch(`/api/families/${selectedFamilyForDisable.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Kartu Keluarga berhasil dinonaktifkan");
        setIsDisableModalOpen(false);
        setSelectedFamilyForDisable(null);
        fetchFamilies();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menonaktifkan Kartu Keluarga");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat menonaktifkan KK");
    } finally {
      setIsDisabling(false);
    }
  };

  const handleReactivateKK = async (family: FamilyItem) => {
    try {
      const res = await fetch(`/api/families/${family.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true, checkOutDate: null }),
      });

      if (res.ok) {
        toast.success("Kartu Keluarga berhasil diaktifkan kembali");
        fetchFamilies();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mengaktifkan kembali Kartu Keluarga");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat mengaktifkan kembali KK");
    }
  };

  const executeReactivateRenter = async () => {
    if (!selectedRenterForReactivate) return;
    setIsReactivatingRenter(true);
    try {
      const res = await fetch(`/api/rental-residents/${selectedRenterForReactivate.id}/reactivate`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Penyewa berhasil diaktifkan kembali");
        fetchRenters();
        setIsReactivateRenterModalOpen(false);
        setSelectedRenterForReactivate(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mengaktifkan kembali penyewa");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat mengaktifkan kembali penyewa");
    } finally {
      setIsReactivatingRenter(false);
    }
  };

  const filteredCoordinators = useMemo(() => {
    return coordinatorsList.filter((c) => {
      const matchesSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.nik && c.nik.includes(searchQuery)) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        !selectedCoordinatorStatus || c.status === selectedCoordinatorStatus;

      return matchesSearch && matchesStatus;
    });
  }, [coordinatorsList, searchQuery, selectedCoordinatorStatus]);

  const coordinatorsTotalPages = Math.ceil(filteredCoordinators.length / itemsPerPage) || 1;

  const paginatedCoordinators = useMemo(() => {
    const startIndex = (coordinatorsCurrentPage - 1) * itemsPerPage;
    return filteredCoordinators.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCoordinators, coordinatorsCurrentPage, itemsPerPage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
            Data Warga & Hunian
          </h1>
          <p className="text-sm text-gray-secondary-text mt-1">
            Kelola data Kartu Keluarga, warga tetap, penyewa kontrak/kos, serta data hunian RT.
          </p>
        </div>

        {canManage && activeTab === "hunian" && (
          <button
            onClick={() => setIsAddDwellingOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="h-4.5 w-4.5" />
            Tambah Hunian
          </button>
        )}

        {canManage && activeTab === "kk" && (
          <button
            onClick={() => setIsAddWargaOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="h-4.5 w-4.5" />
            Tambah Akun Warga
          </button>
        )}

        {canManage && activeTab === "penyewa" && (
          <button
            onClick={() => setIsCheckInOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="h-4.5 w-4.5" />
            Check-In Penyewa
          </button>
        )}

        {canManage && activeTab === "koordinator" && (
          <button
            onClick={() => setIsAddCoordinatorOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="h-4.5 w-4.5" />
            Tambah Koordinator
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <ResidentsTabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Contents */}
      {activeTab === "kk" && (
        <div className="space-y-4">
          <KKSearchFilter
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedActive={selectedActive}
            setSelectedActive={setSelectedActive}
            setCurrentPage={setCurrentPage}
          />

          <KKTable
            families={families}
            isLoading={isLoading}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            isReadOnly={isReadOnly}
            onEdit={(family) => {
              setSelectedFamilyForEdit(family);
              setIsEditModalOpen(true);
            }}
            onDisable={(family) => {
              setSelectedFamilyForDisable(family);
              setIsDisableModalOpen(true);
            }}
            onReactivate={handleReactivateKK}
          />
        </div>
      )}

      {activeTab === "penyewa" && (
        <div className="space-y-4">
          {/* Renters Search & Filters */}
          <div className="flex flex-col md:flex-row items-center gap-4 bg-gray-card border border-gray-border p-4 rounded-2xl shadow-sm">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Cari nama penyewa atau NIK..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setRentersCurrentPage(1);
                }}
                className="w-full text-xs bg-gray-sidebar-hover/30 border border-gray-border rounded-xl pl-10 pr-4 py-3 placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary transition-all"
              />
              <Home className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-placeholder" />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Filter Keaktifan */}
              <div className="w-full sm:w-44">
                <CustomSelect
                  value={selectedRenterActive}
                  onChange={(val: string) => {
                    setSelectedRenterActive(val);
                    setRentersCurrentPage(1);
                  }}
                  options={[
                    { value: "true", label: "Aktif Huni" },
                    { value: "false", label: "Sudah Keluar" },
                    { value: "", label: "Semua Penyewa" },
                  ]}
                  placeholder="Status Aktif"
                />
              </div>

              {/* Filter Verifikasi */}
              <div className="w-full sm:w-48">
                <CustomSelect
                  value={selectedRenterVerify}
                  onChange={(val: string) => {
                    setSelectedRenterVerify(val);
                    setRentersCurrentPage(1);
                  }}
                  options={[
                    { value: "", label: "Semua Verifikasi" },
                    { value: "pending", label: "Pending" },
                    { value: "verified", label: "Terverifikasi" },
                    { value: "rejected", label: "Ditolak" },
                  ]}
                  placeholder="Status Verifikasi"
                />
              </div>
            </div>
          </div>

          <RentalTable
            residents={rentersList}
            isLoading={isRentersLoading}
            currentPage={rentersCurrentPage}
            setCurrentPage={setRentersCurrentPage}
            totalPages={Math.ceil(rentersTotalItems / itemsPerPage) || 1}
            totalItems={rentersTotalItems}
            isReadOnly={isReadOnly}
            onDetail={(renter) => {
              setSelectedRenter(renter);
              setIsDetailOpen(true);
            }}
            onVerify={(renter) => {
              setSelectedRenter(renter);
              setIsVerifyOpen(true);
            }}
            onCheckOut={(renter) => {
              setSelectedRenter(renter);
              setIsCheckOutOpen(true);
            }}
            onReactivate={(renter) => {
              setSelectedRenterForReactivate(renter);
              setIsReactivateRenterModalOpen(true);
            }}
            onEdit={(renter) => {
              setSelectedRenter(renter);
              setIsEditRenterOpen(true);
            }}
          />
        </div>
      )}

      {activeTab === "hunian" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-card border border-gray-border p-4 rounded-2xl shadow-sm">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Cari berdasarkan blok atau nomor rumah..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDwellingsCurrentPage(1);
                }}
                className="w-full text-xs bg-gray-sidebar-hover/30 border border-gray-border rounded-xl pl-10 pr-4 py-2.5 placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary transition-all"
              />
              <Home className="absolute left-3.5 top-3 h-4 w-4 text-gray-placeholder" />
            </div>

            <div className="w-full sm:w-48 shrink-0">
              <CustomSelect
                value={selectedDwellingType}
                onChange={(val) => {
                  setSelectedDwellingType(val);
                  setDwellingsCurrentPage(1);
                }}
                options={[
                  { value: "", label: "Semua Tipe Hunian" },
                  { value: "permanen", label: "Permanen" },
                  { value: "kos", label: "Kos" },
                  { value: "homestay", label: "Homestay" },
                ]}
                placeholder="Tipe Hunian"
              />
            </div>
          </div>

          <DwellingTable
            dwellings={dwellingsList}
            isLoading={isDwellingsLoading}
            currentPage={dwellingsCurrentPage}
            setCurrentPage={setDwellingsCurrentPage}
            totalPages={Math.ceil(dwellingsTotalItems / itemsPerPage) || 1}
            totalItems={dwellingsTotalItems}
            isReadOnly={isReadOnly}
            onDetail={(dwelling) => {
              setSelectedDwellingForDetail(dwelling.id);
              setIsDetailDwellingOpen(true);
            }}
            onEdit={(dwelling) => {
              setSelectedDwellingForEdit(dwelling);
              setIsEditDwellingOpen(true);
            }}
            onDisable={handleDisableDwelling}
          />
        </div>
      )}

      {activeTab === "koordinator" && (
        <div className="space-y-4">
          {/* Coordinators Search & Filters */}
          <div className="flex flex-col md:flex-row items-center gap-4 bg-gray-card border border-gray-border p-4 rounded-2xl shadow-sm">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Cari nama koordinator atau NIK..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCoordinatorsCurrentPage(1);
                }}
                className="w-full text-xs bg-gray-sidebar-hover/30 border border-gray-border rounded-xl pl-10 pr-4 py-2.5 placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary transition-all"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-placeholder" />
            </div>

            <div className="w-full sm:w-48 shrink-0">
              <CustomSelect
                value={selectedCoordinatorStatus}
                onChange={(val) => {
                  setSelectedCoordinatorStatus(val);
                  setCoordinatorsCurrentPage(1);
                }}
                options={[
                  { value: "", label: "Semua Status" },
                  { value: "active", label: "Aktif" },
                  { value: "pending", label: "Pending" },
                  { value: "suspended", label: "Nonaktif" },
                ]}
                placeholder="Status Akun"
              />
            </div>
          </div>

          <CoordinatorTable
            coordinators={paginatedCoordinators}
            isLoading={isCoordinatorsLoading}
            currentPage={coordinatorsCurrentPage}
            setCurrentPage={setCoordinatorsCurrentPage}
            totalPages={coordinatorsTotalPages}
            totalItems={filteredCoordinators.length}
            isReadOnly={isReadOnly}
            onDetail={(coord) => {
              setSelectedCoordinatorForDetail(coord);
              setIsDetailCoordinatorOpen(true);
            }}
            onEdit={(coord) => {
              setSelectedCoordinatorForEdit(coord);
              setIsEditCoordinatorOpen(true);
            }}
            onDeactivate={(coord) => {
              setSelectedCoordForDeactivate(coord);
              setIsDeactivateCoordOpen(true);
            }}
          />
        </div>
      )}

      {/* Modals */}
      <EditKKModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedFamilyForEdit(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedFamilyForEdit(null);
          fetchFamilies();
        }}
        family={selectedFamilyForEdit}
      />

      {/* Disable Confirmation Modal */}
      {isDisableModalOpen && selectedFamilyForDisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4 text-error">
              <div className="p-2 bg-error/10 rounded-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-heading-main">
                Nonaktifkan Kartu Keluarga?
              </h3>
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-secondary-text leading-relaxed">
                Apakah Anda yakin ingin menonaktifkan Kartu Keluarga dengan nomor{" "}
                <strong className="text-gray-heading-main font-semibold">
                  {selectedFamilyForDisable.familyNumber}
                </strong>{" "}
                (Kepala Keluarga: {selectedFamilyForDisable.headName})?
              </p>
              <div className="p-3 bg-error/5 border border-error/20 rounded-xl text-xs text-error font-semibold leading-relaxed">
                Tindakan ini juga akan otomatis menonaktifkan seluruh anggota keluarga di dalam KK ini dan mengatur tanggal keluar (check-out) mereka menjadi hari ini.
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsDisableModalOpen(false);
                  setSelectedFamilyForDisable(null);
                }}
                disabled={isDisabling}
                className="px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-sm font-semibold text-gray-secondary-text cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDisableKK}
                disabled={isDisabling}
                className="flex items-center gap-1.5 px-4 py-2 bg-error hover:bg-red-700 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all"
              >
                {isDisabling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menonaktifkan...
                  </>
                ) : (
                  "Ya, Nonaktifkan KK"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dwellings Modals */}
      <AddDwellingModal
        isOpen={isAddDwellingOpen}
        onClose={() => setIsAddDwellingOpen(false)}
        onSuccess={() => {
          setIsAddDwellingOpen(false);
          fetchDwellings();
        }}
      />

      <EditDwellingModal
        isOpen={isEditDwellingOpen}
        onClose={() => {
          setIsEditDwellingOpen(false);
          setSelectedDwellingForEdit(null);
        }}
        onSuccess={() => {
          setIsEditDwellingOpen(false);
          setSelectedDwellingForEdit(null);
          fetchDwellings();
        }}
        dwelling={selectedDwellingForEdit}
      />

      {/* Renters Modals */}
      <CheckInTenantModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSuccess={() => {
          setIsCheckInOpen(false);
          fetchRenters();
        }}
      />

      <VerifyTenantModal
        isOpen={isVerifyOpen}
        onClose={() => {
          setIsVerifyOpen(false);
          setSelectedRenter(null);
        }}
        onSuccess={() => {
          setIsVerifyOpen(false);
          setSelectedRenter(null);
          fetchRenters();
        }}
        resident={selectedRenter}
      />

      <CheckOutTenantModal
        isOpen={isCheckOutOpen}
        onClose={() => {
          setIsCheckOutOpen(false);
          setSelectedRenter(null);
        }}
        onSuccess={() => {
          setIsCheckOutOpen(false);
          setSelectedRenter(null);
          fetchRenters();
        }}
        resident={selectedRenter}
      />

      <TenantDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRenter(null);
        }}
        resident={selectedRenter}
      />

      <EditTenantModal
        isOpen={isEditRenterOpen}
        onClose={() => {
          setIsEditRenterOpen(false);
          setSelectedRenter(null);
        }}
        onSuccess={() => {
          setIsEditRenterOpen(false);
          setSelectedRenter(null);
          fetchRenters();
        }}
        resident={selectedRenter}
      />

      {/* Modal Dialog: Konfirmasi Aktifkan Kembali Penyewa */}
      <ConfirmModal
        isOpen={isReactivateRenterModalOpen}
        onClose={() => {
          setIsReactivateRenterModalOpen(false);
          setSelectedRenterForReactivate(null);
        }}
        onConfirm={executeReactivateRenter}
        title="Aktifkan Kembali Penyewa (Check-In)?"
        description={
          <p>
            Apakah Anda yakin ingin mengaktifkan kembali penyewa <strong>{selectedRenterForReactivate?.name}</strong>?
            Tindakan ini akan memulihkan status keaktifan penyewa dan akun terkait (jika ada).
          </p>
        }
        confirmText="Ya, Aktifkan Kembali"
        cancelText="Batal"
        variant="primary"
        isLoading={isReactivatingRenter}
      />

      <DwellingDetailModal
        isOpen={isDetailDwellingOpen}
        onClose={() => {
          setIsDetailDwellingOpen(false);
          setSelectedDwellingForDetail(null);
        }}
        dwellingId={selectedDwellingForDetail}
      />

      {/* Modal Dialog: Konfirmasi Nonaktifkan Hunian */}
      <ConfirmModal
        isOpen={isDisableDwellingConfirmOpen}
        onClose={() => {
          setIsDisableDwellingConfirmOpen(false);
          setDwellingToDisable(null);
        }}
        onConfirm={executeDisableDwelling}
        title="Nonaktifkan Hunian?"
        description={
          <p>
            Apakah Anda yakin ingin menonaktifkan hunian <strong>Blok {dwellingToDisable?.blockNumber} No. {dwellingToDisable?.houseNumber}</strong>?
            Tindakan ini akan menonaktifkan hunian tersebut di dalam sistem.
          </p>
        }
        confirmText="Ya, Nonaktifkan"
        cancelText="Batal"
        variant="danger"
        isLoading={isDisablingDwelling}
      />

      {/* Modal Dialog: Konfirmasi Copot Jabatan Koordinator */}
      <ConfirmModal
        isOpen={isDeactivateCoordOpen}
        onClose={() => {
          setIsDeactivateCoordOpen(false);
          setSelectedCoordForDeactivate(null);
        }}
        onConfirm={handleDeactivateCoordinator}
        title="Copot Jabatan Koordinator?"
        description={
          <div className="space-y-2 text-xs leading-relaxed text-gray-secondary-text">
            <p>
              Apakah Anda yakin ingin mencopot jabatan dan menonaktifkan akun koordinator untuk <strong>{selectedCoordForDeactivate?.name}</strong>?
            </p>
            <p className="font-semibold text-amber-600">
              ! PENTING: Tindakan ini otomatis mengalihkan seluruh properti sewa yang dikelolanya kembali ke Pemilik Properti masing-masing.
            </p>
          </div>
        }
        confirmText="Ya, Copot Jabatan"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeactivatingCoord}
      />

      <AddCoordinatorModal
        isOpen={isAddCoordinatorOpen}
        onClose={() => setIsAddCoordinatorOpen(false)}
        onSuccess={() => {
          setIsAddCoordinatorOpen(false);
          fetchCoordinators();
        }}
      />

      <EditCoordinatorModal
        isOpen={isEditCoordinatorOpen}
        onClose={() => {
          setIsEditCoordinatorOpen(false);
          setSelectedCoordinatorForEdit(null);
        }}
        onSuccess={() => {
          setIsEditCoordinatorOpen(false);
          setSelectedCoordinatorForEdit(null);
          fetchCoordinators();
        }}
        coordinator={selectedCoordinatorForEdit}
      />

      <CoordinatorDetailModal
        isOpen={isDetailCoordinatorOpen}
        onClose={() => {
          setIsDetailCoordinatorOpen(false);
          setSelectedCoordinatorForDetail(null);
        }}
        coordinator={selectedCoordinatorForDetail}
      />

      <AddUserModal
        isOpen={isAddWargaOpen}
        onClose={() => setIsAddWargaOpen(false)}
        onSuccess={() => {
          setIsAddWargaOpen(false);
          fetchFamilies();
        }}
        roles={[]}
        fixedRoleId={6}
      />
    </div>
  );
}
