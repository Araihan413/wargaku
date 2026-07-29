export interface CashTransactionItem {
  id: number;
  type: "income" | "expense";
  amount: number;
  transactionDate: string;
  category: string;
  description?: string | null;
  receiptFile?: string | null;
  status: "pending" | "approved";
  createdBy: string;
  creatorName?: string | null;
  approvedBy?: string | null;
  approverName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const INCOME_CATEGORIES = [
  { value: "Sumbangan Donatur", label: "Sumbangan Donatur / Warga" },
  { value: "Bantuan Pemerintah", label: "Bantuan / Hibah Pemerintah" },
  { value: "Hasil Usaha/Bazar RT", label: "Hasil Usaha / Bazar RT" },
  { value: "Penjualan Daur Ulang", label: "Penjualan Barang Daur Ulang" },
  { value: "Bunga Bank", label: "Bunga Bank / Jasa Giro" },
  { value: "Lainnya", label: "Lainnya (Pemasukan Non-Iuran)" },
];

export const EXPENSE_CATEGORIES = [
  { value: "Operasional RT", label: "Operasional Admin & Kantor RT" },
  { value: "Kebersihan & Sampah", label: "Honor Kebersihan & Pengangkutan Sampah" },
  { value: "Keamanan & Ronda", label: "Honor Keamanan, Ronda & Perlengkapan Pos" },
  { value: "Acara/Kegiatan RT", label: "Penyelenggaraan Acara / PHBN RT" },
  { value: "Perbaikan & Pemeliharaan", label: "Perbaikan Fasilitas / Jalan / Lampu" },
  { value: "Santunan/Sosial", label: "Santunan Duka & Bantuan Sosial Warga" },
  { value: "Lainnya", label: "Lainnya (Pengeluaran Kas)" },
];
