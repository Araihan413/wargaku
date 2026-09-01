import { NextResponse } from 'next/server';
import { validateApiAuth, hasPermission } from '@/lib/rbac';
import { listPayments } from '@/db/queries/finance/fee.queries';

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
 *         description: Periode tagihan (contoh 2026-08 atau all)
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

