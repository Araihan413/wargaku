import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import { recordBatchMultiMonthPayment } from '@/db/queries/finance/fee.queries';
import { notifyUser } from '@/lib/notifications';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';
import { recordPaymentSchema } from '@/lib/validations/keuangan';

/**
 * @openapi
 * /api/fee-payments/pay:
 *   post:
 *     summary: "Mencatat pembayaran iuran warga (fleksibel: 1 bulan, tunggakan, atau bayar dimuka)"
 *     description: |
 *       Mencatat pembayaran iuran secara fleksibel dan atomik.
 *       Sistem secara otomatis mengalokasikan pembayaran ke tagihan lama (tunggakan), bulan berjalan,
 *       hingga bulan-bulan mendatang (advance), dan menyinkronkan 1 entri ke Kas RT (Cash Transactions).
 *       Membutuhkan izin manage-iuran.
 *     tags:
 *       - Iuran & Keuangan
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - familyId
 *               - feeRuleId
 *               - amountPaid
 *               - paymentMethod
 *               - paymentDate
 *             properties:
 *               familyId:
 *                 type: integer
 *               feeRuleId:
 *                 type: integer
 *               amountPaid:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, transfer]
 *               paymentDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Pembayaran iuran berhasil dicatat dan disinkronkan ke Kas RT
 *       400:
 *         description: Data tidak valid atau nominal tidak sesuai
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const { session, errorResponse } = await validateApiAuth('manage-iuran');
    if (errorResponse || !session) return errorResponse;

    const body = await request.json();
    const parsed = recordPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid', issues: parsed.error.issues }, { status: 400 });
    }

    const result = await recordBatchMultiMonthPayment(parsed.data, session.user.id);

    // Kirim notifikasi personal ke kepala keluarga
    if (result.headUserId) {
      const periodListText = result.paidPeriods.join(', ');
      notifyUser(result.headUserId, {
        title: `Pembayaran Iuran ${result.ruleName} Berhasil`,
        message: `Pembayaran iuran ${result.ruleName} sebesar Rp ${result.amountPaid.toLocaleString('id-ID')} (${result.totalMonthsCovered} bulan: ${periodListText}) telah tercatat LUNAS.`,
        category: 'personal',
        redirectLink: '/dashboard/finance',
      }).catch((notifErr: any) => console.error('Gagal kirim notifikasi pembayaran iuran:', notifErr));
    }

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'BATCH_FEE_PAYMENT',
      module: 'keuangan',
      description: `Mencatat pembayaran iuran ${result.ruleName} untuk ${result.headName || 'Warga'} sebesar Rp ${result.amountPaid.toLocaleString('id-ID')} (${result.totalMonthsCovered} Bulan).`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({
      message: `Berhasil mencatat pembayaran iuran ${result.totalMonthsCovered} bulan (Rp ${result.amountPaid.toLocaleString('id-ID')})`,
      data: result,
    });
  } catch (err: any) {
    if (err.message === 'RULE_NOT_FOUND_OR_INACTIVE') {
      return NextResponse.json({ error: 'Aturan iuran tidak ditemukan atau sudah non-aktif' }, { status: 404 });
    }
    if (err.message === 'FAMILY_NOT_FOUND') {
      return NextResponse.json({ error: 'Data keluarga tidak ditemukan' }, { status: 404 });
    }
    if (err.message === 'INVALID_AMOUNT') {
      return NextResponse.json({ error: 'Nominal pembayaran harus lebih dari 0' }, { status: 400 });
    }
    console.error('[POST /api/fee-payments/pay]', err);
    return NextResponse.json({ error: err.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
