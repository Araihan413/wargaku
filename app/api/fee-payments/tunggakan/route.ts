import { NextResponse } from 'next/server';
import { validateApiAuth, hasPermission } from '@/lib/rbac';
import { listUnpaidByFamily } from '@/db/queries/finance/fee.queries';

/**
 * @openapi
 * /api/fee-payments/tunggakan:
 *   get:
 *     summary: Mendapatkan rekapitulasi tunggakan iuran per KK
 *     description: Menampilkan daftar tunggakan yang dikelompokkan per KK. Jika `ruleId` disertakan, akan memfilter berdasarkan aturan iuran tertentu.
 *     tags:
 *       - Iuran & Keuangan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleId
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan ID aturan iuran
 *     responses:
 *       200:
 *         description: Berhasil mengambil data rekapitulasi tunggakan
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses (butuh view-arrears atau manage-iuran)
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const allowed = (await hasPermission(roleId, 'view-arrears')) || (await hasPermission(roleId, 'manage-iuran'));
    if (!allowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ruleIdStr = searchParams.get('ruleId');
    const ruleId = ruleIdStr ? parseInt(ruleIdStr, 10) : null;

    const result = await listUnpaidByFamily(ruleId);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/fee-payments/tunggakan]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
