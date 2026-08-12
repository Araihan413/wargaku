import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import { listPayments, recordPayment } from '@/db/queries/finance/fee.queries';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowed = (await hasPermission(effectiveRoleId, 'manage-iuran')) || (await hasPermission(effectiveRoleId, 'view-arrears'));
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowed = await hasPermission(effectiveRoleId, 'manage-iuran');
    if (!allowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk mencatat pembayaran' }, { status: 403 });
    }

    const body = await request.json();
    const { paymentId, status } = body;

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Data paymentId dan status wajib diisi' }, { status: 400 });
    }

    const updated = await recordPayment(paymentId, status, session.user.id);

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'RECORD_FEE_PAYMENT',
      module: 'keuangan',
      description: `Mencatat status pembayaran iuran ID #${paymentId} menjadi "${status}".`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({ message: 'Pembayaran iuran berhasil diperbarui', data: updated });
  } catch (err) {
    console.error('[POST /api/fee-payments]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
