"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { CashTransactionItem } from "../types";
import { ExpenseKpiCards } from "./_components/ExpenseKpiCards";
import { ExpenseFilterBar } from "./_components/ExpenseFilterBar";
import { ExpenseTable } from "./_components/ExpenseTable";
import { AddExpenseModal } from "./_components/AddExpenseModal";
import { EditExpenseModal } from "./_components/EditExpenseModal";
import { ExpenseSkeleton } from "./_components/ExpenseSkeleton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function CatatPengeluaranPage() {
  return (
    <PermissionGuard requiredPermission="manage-expense">
      <CatatPengeluaranContent />
    </PermissionGuard>
  );
}

function CatatPengeluaranContent() {
  const [items, setItems] = useState<CashTransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalFilteredAmount, setTotalFilteredAmount] = useState<number>(0);
  const [totalMonthAmount, setTotalMonthAmount] = useState<number>(0);
  const [totalItemsCount, setTotalItemsCount] = useState<number>(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 400);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CashTransactionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<CashTransactionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExpenseData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type: "expense" });
      if (debouncedQuery) params.append("query", debouncedQuery);
      if (selectedCategory) params.append("category", selectedCategory);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      const monthParams = new URLSearchParams({
        type: "expense",
        startDate: startOfMonth,
        endDate: endOfMonth,
      });

      const [resFiltered, resMonth] = await Promise.all([
        fetch(`/api/cash-transactions?${params.toString()}`),
        fetch(`/api/cash-transactions?${monthParams.toString()}`),
      ]);

      if (!resFiltered.ok) {
        throw new Error("Gagal mengambil data pengeluaran kas");
      }

      const dataFiltered = await resFiltered.json();
      const dataMonth = resMonth.ok ? await resMonth.json() : null;

      setItems(dataFiltered.items || []);
      setTotalFilteredAmount(dataFiltered.metadata?.totalAmount || 0);
      setTotalItemsCount(dataFiltered.metadata?.total || 0);
      if (dataMonth) {
        setTotalMonthAmount(dataMonth.metadata?.totalAmount || 0);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, selectedCategory, startDate, endDate]);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        const params = new URLSearchParams({ type: "expense" });
        if (debouncedQuery) params.append("query", debouncedQuery);
        if (selectedCategory) params.append("category", selectedCategory);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
        const monthParams = new URLSearchParams({
          type: "expense",
          startDate: startOfMonth,
          endDate: endOfMonth,
        });

        const [resFiltered, resMonth] = await Promise.all([
          fetch(`/api/cash-transactions?${params.toString()}`),
          fetch(`/api/cash-transactions?${monthParams.toString()}`),
        ]);

        if (!resFiltered.ok) {
          throw new Error("Gagal mengambil data pengeluaran kas");
        }

        const dataFiltered = await resFiltered.json();
        const dataMonth = resMonth.ok ? await resMonth.json() : null;

        if (!isCancelled) {
          setItems(dataFiltered.items || []);
          setTotalFilteredAmount(dataFiltered.metadata?.totalAmount || 0);
          setTotalItemsCount(dataFiltered.metadata?.total || 0);
          if (dataMonth) {
            setTotalMonthAmount(dataMonth.metadata?.totalAmount || 0);
          }
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
  }, [debouncedQuery, selectedCategory, startDate, endDate]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setStartDate("");
    setEndDate("");
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/cash-transactions/${deletingItem.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus data pengeluaran");
      }

      toast.success("Data pengeluaran kas berhasil dihapus!");
      setDeletingItem(null);
      fetchExpenseData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && items.length === 0) {
    return <ExpenseSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main flex items-center gap-2.5">
              Catat Pengeluaran Kas RT
            </h1>
            <p className="text-sm text-gray-secondary-text mt-0.5">
              Pencatatan uang keluar untuk operasional, kebersihan, kegiatan, & pemeliharaan RT.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Pengeluaran Baru</span>
          </button>
        </div>

        {/* KPI Cards */}
        <ExpenseKpiCards
          totalMonth={totalMonthAmount}
          totalFiltered={totalFilteredAmount}
          totalItemsCount={totalItemsCount}
        />

        {/* Filter Bar */}
        <ExpenseFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onReset={handleResetFilters}
          isLoading={isLoading}
        />

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-rose-700 text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchExpenseData}
              className="underline text-xs font-bold hover:text-rose-900 cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Expense Table */}
        <ExpenseTable
          items={items}
          isLoading={isLoading}
          onEdit={(item) => setEditingItem(item)}
          onDelete={(item) => setDeletingItem(item)}
        />

        {/* Modals */}
        <AddExpenseModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            fetchExpenseData();
          }}
        />

        <EditExpenseModal
          key={editingItem?.id || "new-expense-modal"}
          isOpen={!!editingItem}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            fetchExpenseData();
          }}
        />

        <ConfirmModal
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDeleteConfirm}
          title="Hapus Catatan Pengeluaran"
          description={`Apakah Anda yakin ingin menghapus catatan pengeluaran "${deletingItem?.description}" sejumlah Rp ${deletingItem?.amount?.toLocaleString("id-ID")}?`}
          confirmText="Hapus Pengeluaran"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
  );
}
