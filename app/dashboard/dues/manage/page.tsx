"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Plus, Users, Wallet, AlertCircle } from "lucide-react";
import { FeeRule, FeePaymentItem } from "../types";
import { FeeRuleCard } from "./_components/FeeRuleCard";
import { AddFeeRuleModal } from "./_components/AddFeeRuleModal";
import { PaymentMatrixTable } from "./_components/PaymentMatrixTable";
import { PayIuranModal } from "./_components/PayIuranModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CustomSelect } from "@/components/CustomSelect";
import { SearchInput } from "@/components/SearchInput";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/PermissionGuard";
import { DuesManageSkeleton } from "./_components/DuesManageSkeleton";

export default function KelolaManagedPage() {
  return (
    <PermissionGuard requiredPermission="manage-iuran">
      <KelolaManagedContent />
    </PermissionGuard>
  );
}

function KelolaManagedContent() {
  // Fee Rules state
  const [rules, setRules] = useState<FeeRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [selectedRule, setSelectedRule] = useState<FeeRule | null>(null);
  const [editingRule, setEditingRule] = useState<FeeRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<FeeRule | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [generatingRuleId, setGeneratingRuleId] = useState<number | null>(null);

  // Payments state
  const [payments, setPayments] = useState<FeePaymentItem[]>([]);
  const [paymentSummary, setPaymentSummary] = useState({ total: 0, paid: 0, partiallyPaid: 0, unpaid: 0, totalCollected: 0, totalDue: 0 });
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [payingItem, setPayingItem] = useState<FeePaymentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [isDeletingRule, setIsDeletingRule] = useState(false);

  // Period selector - default to current month
  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  // Generate past 12 months options
  const periodOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("id-ID", { month: "long", year: "numeric" });
    return { value: val, label };
  });

  const fetchRules = useCallback(async () => {
    setIsLoadingRules(true);
    try {
      const res = await fetch("/api/fee-rules");
      if (res.ok) {
        const data = await res.json();
        setRules(data.data || []);
        if (!selectedRule && data.data.length > 0) {
          setSelectedRule(data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRules(false);
    }
  }, [selectedRule]);

  const fetchPayments = useCallback(async () => {
    if (!selectedRule) return;
    setIsLoadingPayments(true);
    try {
      const params = new URLSearchParams({
        ruleId: String(selectedRule.id),
        period: selectedPeriod,
      });
      if (debouncedSearchQuery) params.set("query", debouncedSearchQuery);
      const res = await fetch(`/api/fee-payments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.data || []);
        setPaymentSummary(data.summary || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPayments(false);
    }
  }, [selectedRule, selectedPeriod, debouncedSearchQuery]);

  useEffect(() => {
    let isCancelled = false;
    async function loadRules() {
      setIsLoadingRules(true);
      try {
        const res = await fetch("/api/fee-rules");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setRules(data.data || []);
            if (data.data.length > 0) {
              setSelectedRule((prev) => prev ?? data.data[0]);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!isCancelled) setIsLoadingRules(false);
      }
    }
    loadRules();
    return () => { isCancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedRule) return;
    let isCancelled = false;
    async function loadPayments() {
      setIsLoadingPayments(true);
      try {
        const params = new URLSearchParams({
          ruleId: String(selectedRule!.id),
          period: selectedPeriod,
        });
        if (debouncedSearchQuery) params.set("query", debouncedSearchQuery);
        const res = await fetch(`/api/fee-payments?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setPayments(data.data || []);
            setPaymentSummary(data.summary || {});
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!isCancelled) setIsLoadingPayments(false);
      }
    }
    loadPayments();
    return () => { isCancelled = true; };
  }, [selectedRule, selectedPeriod, debouncedSearchQuery]);

  const handleGenerate = async (rule: FeeRule) => {
    setGeneratingRuleId(rule.id);
    try {
      const res = await fetch(`/api/fee-rules/${rule.id}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal generate tagihan");
      toast.success(data.message);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setGeneratingRuleId(null);
    }
  };

  const handleDeleteRule = async () => {
    if (!deletingRule) return;
    setIsDeletingRule(true);
    try {
      const res = await fetch(`/api/fee-rules/${deletingRule.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus aturan iuran");
      toast.success("Aturan iuran berhasil dihapus");
      setDeletingRule(null);
      if (selectedRule?.id === deletingRule.id) setSelectedRule(null);
      fetchRules();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setIsDeletingRule(false);
    }
  };

  if (isLoadingRules && rules.length === 0) {
    return <DuesManageSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">Kelola Iuran Warga</h1>
          <p className="text-sm text-gray-secondary-text mt-0.5">Konfigurasi tarif iuran dan pencatatan setoran warga per periode.</p>
        </div>
        <button
          onClick={() => { setEditingRule(null); setIsRuleModalOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Aturan Iuran</span>
        </button>
      </div>

      {/* Fee Rules Section */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-5 space-y-3">
        <h2 className="text-sm font-bold text-gray-heading-main flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Daftar Aturan Iuran
        </h2>

        {isLoadingRules ? (
          <div className="text-center py-8 text-xs text-gray-secondary-text font-semibold">Memuat...</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-gray-heading-main">Belum ada aturan iuran</p>
            <p className="text-xs text-gray-secondary-text max-w-xs mx-auto">
              Klik tombol &quot;Buat Aturan Iuran&quot; untuk menetapkan tarif dan memulai tagihan otomatis kepada warga.
            </p>
            <button
              onClick={() => { setEditingRule(null); setIsRuleModalOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Buat Aturan Iuran Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                onClick={() => setSelectedRule(rule)}
                className={`cursor-pointer rounded-2xl transition-all ring-2 ${selectedRule?.id === rule.id ? "ring-primary" : "ring-transparent"}`}
              >
                <FeeRuleCard
                  rule={rule}
                  onEdit={(r) => { setEditingRule(r); setIsRuleModalOpen(true); }}
                  onDelete={setDeletingRule}
                  onGenerate={handleGenerate}
                  isGenerating={generatingRuleId === rule.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Matrix Section */}
      {selectedRule && (
        <div className="rounded-2xl border border-gray-border bg-gray-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-heading-main flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-600" />
                Daftar Tagihan: {selectedRule.name}
              </h2>
              <p className="text-xs text-gray-secondary-text mt-0.5">
                Nominal: <strong>Rp {selectedRule.amount.toLocaleString("id-ID")}/KK</strong> ·{" "}
                {selectedRule.isMandatory ? "Iuran Wajib" : "Sukarela"}
              </p>
            </div>
            <div className="w-52">
              <CustomSelect
                value={selectedPeriod}
                onChange={(val) => setSelectedPeriod(val)}
                options={periodOptions}
                size="sm"
              />
            </div>
          </div>

          {/* Summary KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total KK", value: paymentSummary.total, color: "text-gray-heading-main", bg: "bg-gray-sidebar-hover" },
              { label: "Lunas", value: paymentSummary.paid, color: "text-emerald-700", bg: "bg-emerald-50" },
              { label: "Kurang Bayar", value: paymentSummary.partiallyPaid, color: "text-amber-700", bg: "bg-amber-50" },
              { label: "Belum Bayar", value: paymentSummary.unpaid, color: "text-rose-700", bg: "bg-rose-50" },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-xl p-3 border border-gray-border`}>
                <p className="text-[10px] font-semibold text-gray-secondary-text uppercase tracking-wider">{item.label}</p>
                <p className={`text-2xl font-black mt-0.5 ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari kepala keluarga..."
            containerClassName="w-full sm:w-72"
          />

          <PaymentMatrixTable
            payments={payments}
            isLoading={isLoadingPayments}
            onPay={setPayingItem}
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-gray-border text-xs font-semibold text-gray-secondary-text">
            <span>
              Total Terkumpul: <strong className="text-emerald-700 font-mono">Rp {paymentSummary.totalCollected?.toLocaleString("id-ID") || "0"}</strong>
            </span>
            <span>
              Total Belum Terkumpul: <strong className="text-rose-700 font-mono">Rp {paymentSummary.totalDue?.toLocaleString("id-ID") || "0"}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddFeeRuleModal
        key={editingRule?.id || "new-rule"}
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSuccess={() => { fetchRules(); fetchPayments(); }}
        existingRule={editingRule}
      />

      {payingItem && (
        <PayIuranModal
          key={payingItem.id}
          isOpen={!!payingItem}
          onClose={() => setPayingItem(null)}
          onSuccess={() => { setPayingItem(null); fetchPayments(); }}
          payment={payingItem}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingRule}
        onClose={() => setDeletingRule(null)}
        onConfirm={handleDeleteRule}
        title="Hapus Aturan Iuran"
        description={
          <span>
            Anda yakin ingin menghapus aturan iuran <strong>&quot;{deletingRule?.name}&quot;</strong>? Tagihan yang belum dibayar akan dibersihkan. Jika sudah ada pembayaran lunas, riwayat pembukuan kas tetap tersimpan aman di arsip.
          </span>
        }
        confirmText="Hapus Aturan"
        variant="danger"
        isLoading={isDeletingRule}
      />
    </div>
  );
}
