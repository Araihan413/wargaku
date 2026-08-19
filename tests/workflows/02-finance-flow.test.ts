import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Skema transaksi kas
const cashTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    message: 'Tipe transaksi harus berupa pemasukan (income) atau pengeluaran (expense)',
  }),
  amount: z.number().positive('Nominal harus lebih besar dari 0'),
  category: z.string().min(1, 'Kategori transaksi wajib diisi'),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
});

describe('WF-02: Alur Keuangan & Kas RT', () => {
  describe('Alur Benar (Happy Path)', () => {
    it('WF-FIN-01: harus memproses transaksi pemasukan dan menambah saldo kas', () => {
      const initialBalance = 1000000; // Rp 1.000.000

      const incomeTransaction = {
        type: 'income' as const,
        amount: 500000,
        category: 'Iuran Warga',
        description: 'Pembayaran iuran bulan Agustus',
        date: '2026-08-19',
      };

      const parsed = cashTransactionSchema.safeParse(incomeTransaction);
      expect(parsed.success).toBe(true);

      const calculateNewBalance = (current: number, tx: typeof incomeTransaction) => {
        return tx.type === 'income' ? current + tx.amount : current - tx.amount;
      };

      const newBalance = calculateNewBalance(initialBalance, incomeTransaction);
      expect(newBalance).toBe(1500000);
    });

    it('WF-FIN-02: harus memproses transaksi pengeluaran dan memotong saldo kas', () => {
      const initialBalance = 1500000;

      const expenseTransaction = {
        type: 'expense' as const,
        amount: 300000,
        category: 'Kebersihan Lingkungan',
        description: 'Biaya angkut sampah',
        date: '2026-08-19',
      };

      const parsed = cashTransactionSchema.safeParse(expenseTransaction);
      expect(parsed.success).toBe(true);

      const newBalance = initialBalance - expenseTransaction.amount;
      expect(newBalance).toBe(1200000);
    });
  });

  describe('Alur Salah / Abuse (Negative Path)', () => {
    it('WF-FIN-03: harus menolak transaksi dengan nominal negatif atau nol', () => {
      const zeroAmountPayload = {
        type: 'income',
        amount: 0, // Dilarang Rp 0
        category: 'Iuran',
        date: '2026-08-19',
      };

      const negativeAmountPayload = {
        type: 'income',
        amount: -500000, // Dilarang nominal minus
        category: 'Iuran',
        date: '2026-08-19',
      };

      expect(cashTransactionSchema.safeParse(zeroAmountPayload).success).toBe(false);
      expect(cashTransactionSchema.safeParse(negativeAmountPayload).success).toBe(false);
    });

    it('WF-FIN-04: menolak aksi mutasi kas jika pengguna bukan Bendahara atau Admin', () => {
      type Role = 'warga' | 'bendahara' | 'super_admin';

      const authorizeFinanceMutation = (userRole: Role) => {
        const allowedRoles: Role[] = ['bendahara', 'super_admin'];
        if (!allowedRoles.includes(userRole)) {
          return { status: 403, error: 'Forbidden: Hanya Bendahara yang diizinkan mengelola kas' };
        }
        return { status: 200, success: true };
      };

      // Warga biasa mencoba mutasi kas
      const wargaAttempt = authorizeFinanceMutation('warga');
      expect(wargaAttempt.status).toBe(403);
      expect(wargaAttempt.error).toContain('Forbidden');

      // Bendahara mutasi kas
      const bendaharaAttempt = authorizeFinanceMutation('bendahara');
      expect(bendaharaAttempt.status).toBe(200);
    });
  });
});
