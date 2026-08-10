import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import { generateTagihanForRule } from '@/db/queries/finance/fee.queries';

/**
 * @openapi
 * /api/fee-rules/{id}/generate:
 *   post:
 *     summary: Melakukan generate tagihan manual untuk suatu aturan iuran
 *     description: Menghasilkan tagihan baru (untuk periode bulan berjalan) bagi semua KK aktif yang belum memiliki tagihan untuk aturan iuran ini.
 *     tags:
 *       - Iuran & Keuangan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID aturan iuran
 *     responses:
 *       200:
 *         description: Tagihan berhasil dibuat (mengembalikan jumlah tagihan baru dan yang di-skip)
 *       400:
 *         description: ID tidak valid atau aturan iuran sudah tidak aktif
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Aturan iuran tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowed = await hasPermission(effectiveRoleId, 'manage-iuran');
    if (!allowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk generate tagihan iuran' }, { status: 403 });
    }

    const resolvedParams = await params;
    const ruleId = parseInt(resolvedParams.id, 10);
    if (isNaN(ruleId)) {
      return NextResponse.json({ error: 'ID aturan iuran tidak valid' }, { status: 400 });
    }

    const result = await generateTagihanForRule(ruleId);
    return NextResponse.json({
      message: `Tagihan periode ${result.period} berhasil dibuat (${result.generated} baru, ${result.skipped} sudah ada)`,
      data: result,
    });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Aturan iuran tidak ditemukan' }, { status: 404 });
    }
    if (err.message === 'RULE_INACTIVE') {
      return NextResponse.json({ error: 'Aturan iuran sudah non-aktif, tidak dapat generate tagihan baru' }, { status: 400 });
    }
    console.error('[POST /api/fee-rules/[id]/generate]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
