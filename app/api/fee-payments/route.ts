import { NextResponse } from 'next/server';
import { validateApiAuth, hasPermission } from '@/lib/rbac';
import { listPayments, recordPayment } from '@/db/queries/finance/fee.queries';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';
import { recordPaymentSchema } from '@/lib/validations/keuangan';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/fee-payments:
 *   get:
 *     summary: Mendapatkan daftar tagihan pembayaran iuran
 *     description: Mengambil daftar tagihan berdasarkan ID aturan iuran (ruleId), periode, dan query pencarian. Membutuhkan hak akses manage-iuran atau view-arrears.
 *     tags:
 *       - Iuran & Keuangan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID aturan iuran
 *       - in: query
 *         name: period
 *         required: false
 *         schema:
 *           type: string
 *         description: Periode tagihan (contoh 2026-08)
 *       - in: query
 *         name: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Pencarian berdasarkan nama KK
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar tagihan
 *       400:
 *         description: Parameter ruleId tidak valid atau tidak ada
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const allowed = (await hasPermission(roleId, 'manage-iuran')) || (await hasPermission(roleId, 'view-arrears'));
    if (!allowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId') ? parseInt(searchParams.get('ruleId')!, 10) : null;
    const period = searchParams.get('period') || null;
    const searchQuery = searchParams.get('query') || searchParams.get('search') || '';

    if (!ruleId) {
      return NextResponse.json({ error: 'Parameter ruleId diperlukan' }, { status: 400 });
    }

    const result = await listPayments(ruleId, period, searchQuery);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/fee-payments]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/fee-payments:
 *   post:
 *     summary: Mencatat atau memperbarui status pembayaran iuran
 *     description: Mengubah status pembayaran (misal dari unpaid menjadi paid) dan mencatat user pengurus yang merekam pembayaran. Membutuhkan hak akses manage-iuran.
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
 *               - paymentId
 *               - status
 *             properties:
 *               paymentId:
 *                 type: integer
 *                 description: ID record pembayaran
 *               status:
 *                 type: string
 *                 enum: [unpaid, partially_paid, paid]
 *                 description: Status pembayaran
 *     responses:
 *       200:
 *         description: Pembayaran iuran berhasil diperbarui
 *       400:
 *         description: Data input tidak valid (paymentId atau status kosong)
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
    const validated = recordPaymentSchema.parse(body);

    const updated = await recordPayment(
      validated.paymentId,
      {
        amountPaid: validated.amountPaid,
        paymentMethod: validated.paymentMethod,
        paymentDate: validated.paymentDate,
      },
      session.user.id
    );

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'RECORD_FEE_PAYMENT',
      module: 'keuangan',
      description: `Mencatat pembayaran iuran ID #${validated.paymentId} sebesar Rp ${validated.amountPaid.toLocaleString('id-ID')} via ${validated.paymentMethod}.`,
      ipAddress,
    }).catch(() => null);


    return NextResponse.json({ message: 'Pembayaran iuran berhasil diperbarui', data: updated });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Data tidak valid', issues: err.issues }, { status: 400 });
    }
    console.error('[POST /api/fee-payments]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}

