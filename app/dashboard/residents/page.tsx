"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ResidentsTabNav } from "./_components/ResidentsTabNav";
import { KKSearchFilter } from "./_components/KKSearchFilter";
import { KKTable } from "./_components/KKTable";
import { AddKKModal } from "./_components/AddKKModal";
import { EditKKModal } from "./_components/EditKKModal";
import { FamilyItem } from "./types";
import { CustomSelect } from "@/components/CustomSelect";
import { SearchInput } from "@/components/SearchInput";
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
import { EditCoordinatorModal } from "./_components/EditCoordinatorModal";
import { CoordinatorDetailModal } from "./_components/CoordinatorDetailModal";
import { DeactivateCoordinatorModal } from "./_components/DeactivateCoordinatorModal";
import { CreateResidentAccountModal } from "./_components/CreateResidentAccountModal";
import { ResidentsSkeleton } from "./_components/ResidentsSkeleton";
import { AddUserModal } from "../users/_components/AddUserModal";
import { authClient } from "@/lib/auth-client";
import { useRoleStore } from "@/lib/store/use-role-store";

import { PermissionGuard } from "@/components/PermissionGuard";

export default function ResidentsPage() {
  return (
    <PermissionGuard requiredPermission="view-residents">
      <ResidentsContent />
    </PermissionGuard>
  );
}

function ResidentsContent() {
  const { data: session } = authClient.useSession();
  const { activeRoleId } = useRoleStore();
  const currentRole = Number(activeRoleId || session?.user?.roleId || 6);

  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/permissions/my-permissions?roleId=${currentRole}`)
      .then((res) => res.json())
      .then((data) => {
        const rawPerms = Array.isArray(data.permissions) ? data.permissions : [];
        const slugs = rawPerms.map((p: any) => (typeof p === "string" ? p : p.slug)).filter(Boolean);
        setUserPermissions(slugs);
      })
      .catch((err) => console.error("Error fetching permissions:", err));
  }, [currentRole]);

  // Evaluasi berbasis izin secara murni & dinamis (bebas dari hardcode role ID)
  const canManage = userPermissions.includes("manage-residents");
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

  // Coordinator states
  const [coordinatorsList, setCoordinatorsList] = useState<CoordinatorItem[]>([]);
  const [isCoordinatorsLoading, setIsCoordinatorsLoading] = useState(false);
  const [isAddCoordinatorOpen, setIsAddCoordinatorOpen] = useState(false);
  const [isDeactivateCoordOpen, setIsDeactivateCoordOpen] = useState(false);
  const [selectedCoordForDeactivate, setSelectedCoordForDeactivate] = useState<CoordinatorItem | null>(null);
  const [selectedCoordinatorStatus, setSelectedCoordinatorStatus] = useState("");
  const [coordinatorsCurrentPage, setCoordinatorsCurrentPage] = useState(1);
  const [selectedCoordinatorForEdit, setSelectedCoordinatorForEdit] = useState<CoordinatorItem | null>(null);
  const [isEditCoordinatorOpen, setIsEditCoordinatorOpen] = useState(false);
  const [selectedCoordinatorForDetail, setSelectedCoordinatorForDetail] = useState<CoordinatorItem | null>(null);
  const [isDetailCoordinatorOpen, setIsDetailCoordinatorOpen] = useState(false);

  // Disable KK Confirmation states
  const [isAddKKOpen, setIsAddKKOpen] = useState(false);
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


  const filteredCoordinators = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    return coordinatorsList.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q));

      const matchesStatus =
        !selectedCoordinatorStatus || c.status === selectedCoordinatorStatus;

      return matchesSearch && matchesStatus;
    });
  }, [coordinatorsList, debouncedSearchQuery, selectedCoordinatorStatus]);

  const coordinatorsTotalPages = Math.ceil(filteredCoordinators.length / itemsPerPage) || 1;

  const paginatedCoordinators = useMemo(() => {
    const startIndex = (coordinatorsCurrentPage - 1) * itemsPerPage;
    return filteredCoordinators.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCoordinators, coordinatorsCurrentPage, itemsPerPage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (isLoading && families.length === 0) {
    return <ResidentsSkeleton />;
  }

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
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => setIsAddKKOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all"
            >
              <Plus className="h-4.5 w-4.5" />
              Daftar KK
            </button>
            <button
              onClick={() => setIsAddWargaOpen(true)}
              className="flex items-center gap-2 bg-gray-card hover:bg-gray-sidebar-hover text-gray-heading-main border border-gray-border px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all"
            >
              <Plus className="h-4.5 w-4.5" />
              Tambah Akun
            </button>
          </div>
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
      <ResidentsTabNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery("");
        }}
      />

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
            isLoading={isLoading}
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
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setRentersCurrentPage(1);
              }}
              placeholder="Cari nama penyewa atau NIK..."
              containerClassName="flex-1 w-full"
              isLoading={isRentersLoading}
            />

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
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setDwellingsCurrentPage(1);
              }}
              placeholder="Cari berdasarkan blok atau nomor rumah..."
              containerClassName="flex-1 w-full"
              isLoading={isDwellingsLoading}
            />

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
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setCoordinatorsCurrentPage(1);
              }}
              placeholder="Cari nama koordinator atau NIK..."
              containerClassName="flex-1 w-full"
              isLoading={isCoordinatorsLoading}
            />

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
      <DeactivateCoordinatorModal
        isOpen={isDeactivateCoordOpen}
        onClose={() => {
          setIsDeactivateCoordOpen(false);
          setSelectedCoordForDeactivate(null);
        }}
        onSuccess={() => {
          setIsDeactivateCoordOpen(false);
          setSelectedCoordForDeactivate(null);
          fetchCoordinators();
        }}
        coordinator={selectedCoordForDeactivate}
      />

      <AddUserModal
        isOpen={isAddCoordinatorOpen}
        onClose={() => setIsAddCoordinatorOpen(false)}
        onSuccess={() => {
          setIsAddCoordinatorOpen(false);
          fetchCoordinators();
        }}
        roles={[]}
        fixedRoleId={5}
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

      <AddKKModal
        isOpen={isAddKKOpen}
        onClose={() => setIsAddKKOpen(false)}
        onSuccess={() => {
          setIsAddKKOpen(false);
          fetchFamilies();
        }}
      />

      <CreateResidentAccountModal
        isOpen={isAddWargaOpen}
        onClose={() => setIsAddWargaOpen(false)}
        onSuccess={() => {
          setIsAddWargaOpen(false);
          fetchFamilies();
        }}
      />
    </div>
  );
}
