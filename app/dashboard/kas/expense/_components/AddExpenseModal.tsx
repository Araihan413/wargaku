import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { ReceiptUploadInput } from "@/components/ReceiptUploadInput";
import { executeWithFileUpload } from "@/lib/upload-helper";
import { EXPENSE_CATEGORIES } from "../../types";
import { toast } from "sonner";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [category, setCategory] = useState<string>("Operasional RT");
  const [receiptFile, setReceiptFile] = useState<File | string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("Judul / Keperluan pengeluaran wajib diisi");
      return;
    }

    const numericAmount = Number(amount.replace(/[^0-9]/g, ""));
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Nominal pengeluaran harus lebih dari 0");
      return;
    }

    if (!transactionDate) {
      toast.error("Tanggal pengeluaran wajib diisi");
      return;
    }

    if (!category) {
      toast.error("Kategori pengeluaran wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await executeWithFileUpload({
        file: receiptFile,
        folder: "receipts",
        submitFn: async (fileUrl) => {
          return fetch("/api/kas/expense", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: numericAmount,
              transactionDate,
              category,
              description,
              receiptFile: fileUrl,
            }),
          });
        },
        successMessage: "Pengeluaran kas berhasil dicatat!",
        errorMessage: "Gagal mencatat pengeluaran kas",
      });

      if (result.success) {
        onSuccess();
        onClose();
        setDescription("");
        setAmount("");
        setReceiptFile(null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-heading-main">
            Catat Pengeluaran Kas RT
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Judul / Keperluan */}
          <div>
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Judul / Keperluan Pengeluaran<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Pembelian Bola Lampu & Kabel Jalan RT 03"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Nominal Pengeluaran (Rp)<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="number"
              placeholder="Contoh: 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono font-bold"
            />
          </div>

          {/* Tanggal & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Tanggal Pengeluaran<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <CustomSelect
                label="Kategori Pengeluaran"
                required
                options={EXPENSE_CATEGORIES}
                value={category}
                onChange={setCategory}
                placeholder="Pilih Kategori"
              />
            </div>
          </div>

          {/* Upload Nota / Bukti Pembelian */}
          <ReceiptUploadInput
            value={receiptFile}
            onChange={setReceiptFile}
            label="Foto Nota / Kwitansi Fisik"
          />

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-border pt-4 mt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-border rounded-xl text-xs font-bold text-gray-heading-main hover:bg-gray-sidebar-hover transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Simpan Pengeluaran</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
