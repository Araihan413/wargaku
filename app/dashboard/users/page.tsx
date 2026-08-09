"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { UserItem, RoleItem, PaginationMetadata } from "./types";
import { UserSearchFilter } from "./_components/UserSearchFilter";
import { UserTable } from "./_components/UserTable";
import { AddUserModal } from "./_components/AddUserModal";
import { MutateRoleModal } from "./_components/MutateRoleModal";
import { EditUserModal } from "./_components/EditUserModal";
import { UserDetailModal } from "./_components/UserDetailModal";
import { ResetPasswordSuccessModal } from "./_components/ResetPasswordSuccessModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function UserManagementPage() {
  return (
    <PermissionGuard requiredPermission="manage-users">
      <UserManagementContent />
    </PermissionGuard>
  );
}

function UserManagementContent() {

  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id ?? "";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [metadata, setMetadata] = useState<PaginationMetadata>({ total: 0, limit: 10, offset: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals & Popups States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMutateModalOpen, setIsMutateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserItem | null>(null);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserItem | null>(null);

  // Reset Password States
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<UserItem | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Reset Password Success Modal State
  const [isResetSuccessOpen, setIsResetSuccessOpen] = useState(false);
  const [resetResultData, setResetResultData] = useState<{
    userName: string;
    userEmail: string;
    temporaryPassword: string;
  } | null>(null);

  const openEditModal = (user: UserItem) => {
    setSelectedUserForEdit(user);
    setIsEditModalOpen(true);
  };

  const openDetailModal = (user: UserItem) => {
    setSelectedUserForDetail(user);
    setIsDetailModalOpen(true);
  };

  const fetchUsers = useCallback(async () => {
    await Promise.resolve(); // Defers state updates to avoid synchronous setState in useEffect
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      let url = `/api/users?limit=${itemsPerPage}&offset=${offset}`;

      if (debouncedSearchQuery) url += `&query=${encodeURIComponent(debouncedSearchQuery)}`;
      if (selectedRole) url += `&roleId=${selectedRole}`;
      if (selectedStatus) url += `&status=${selectedStatus}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setRoles(data.roles);
        setMetadata(data.metadata);
      } else {
        toast.error("Gagal mengambil data pengguna");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem saat mengambil data");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchQuery, selectedRole, selectedStatus]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchUsers();
      }
    });
    return () => {
      active = false;
    };
  }, [fetchUsers]);

  const handleToggleSuspend = async (user: UserItem, targetStatus?: "active" | "suspended") => {
    const nextStatus = targetStatus || (user.status === "suspended" ? "active" : "suspended");
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suspend_toggle",
          payload: { status: nextStatus }
        })
      });

      if (res.ok) {
        toast.success(
          nextStatus === "suspended"
            ? `Akun ${user.name} berhasil ditangguhkan`
            : `Akun ${user.name} berhasil diaktifkan`
        );
        fetchUsers();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Gagal mengubah status akun");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleResetPassword = (user: UserItem) => {
    setUserToReset(user);
    setIsResetConfirmOpen(true);
  };

  const executeResetPassword = async () => {
    if (!userToReset) return;
    setIsResettingPassword(true);
    try {
      const res = await fetch(`/api/users/${userToReset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsResetConfirmOpen(false);
        setResetResultData({
          userName: data.userName || userToReset.name,
          userEmail: data.userEmail || userToReset.email,
          temporaryPassword: data.temporaryPassword,
        });
        setIsResetSuccessOpen(true);
        setUserToReset(null);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Gagal mereset password");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsResettingPassword(false);
    }
  };


  const openMutateModal = (user: UserItem) => {
    setSelectedUser(user);
    setIsMutateModalOpen(true);
  };

  const totalPages = Math.ceil(metadata.total / itemsPerPage) || 1;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-heading-main tracking-tight">
            Manajemen Pengguna
          </h1>
          <p className="text-sm text-gray-secondary-text">
            Kelola semua kredensial login, peran akses, dan status penangguhan akun warga & dinas.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-900 transition-colors shadow-lg shadow-primary/25 cursor-pointer"
        >
          <UserPlus className="h-4.5 w-4.5" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Bar Pencarian & Filter */}
      <UserSearchFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        roles={roles}
        setCurrentPage={setCurrentPage}
      />

      {/* Tabel Pengguna */}
      <UserTable
        users={users}
        isLoading={isLoading}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        totalItems={metadata.total}
        currentUserId={currentUserId}
        onMutateRole={openMutateModal}
        onResetPassword={handleResetPassword}
        onToggleSuspend={handleToggleSuspend}
        onEdit={openEditModal}
        onDetail={openDetailModal}
      />

      {/* Modal Dialog: Tambah Pengguna Baru */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchUsers();
        }}
        roles={roles}
      />

      {/* Modal Dialog: Mutasi Peran */}
      {selectedUser && (
        <MutateRoleModal
          key={selectedUser.id}
          isOpen={isMutateModalOpen}
          onClose={() => {
            setIsMutateModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSuccess={() => {
            setIsMutateModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
          }}
        />
      )}


      {/* Modal Dialog: Edit Profil Pengguna */}
      {selectedUserForEdit && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUserForEdit(null);
          }}
          user={selectedUserForEdit}
          roles={roles}
          isSelf={selectedUserForEdit.id === currentUserId}
          onSuccess={() => {
            fetchUsers();
          }}
        />
      )}

      {/* Modal Dialog: Detail Profil Pengguna */}
      {selectedUserForDetail && (
        <UserDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedUserForDetail(null);
          }}
          user={selectedUserForDetail}
        />
      )}

      {/* Modal Dialog: Konfirmasi Reset Password */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => {
          setIsResetConfirmOpen(false);
          setUserToReset(null);
        }}
        onConfirm={executeResetPassword}
        title="Reset Password Pengguna?"
        description={
          <p>
            Apakah Anda yakin ingin mereset password untuk <span className="font-bold text-gray-heading-main">{userToReset?.name}</span>? 
            Password akan di-reset menjadi default sistem.
          </p>
        }
        confirmText="Ya, Reset"
        cancelText="Batal"
        variant="warning"
        isLoading={isResettingPassword}
      />

      {/* Modal Dialog: Hasil Reset Password Sukses */}
      {resetResultData && (
        <ResetPasswordSuccessModal
          isOpen={isResetSuccessOpen}
          onClose={() => {
            setIsResetSuccessOpen(false);
            setResetResultData(null);
          }}
          userName={resetResultData.userName}
          userEmail={resetResultData.userEmail}
          temporaryPassword={resetResultData.temporaryPassword}
        />
      )}

    </div>
  );
}

