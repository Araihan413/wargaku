import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import { generateTagihanForRule } from '@/db/queries/finance/fee.queries';
import { notifyUser } from '@/lib/notifications';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

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
    const { session, errorResponse } = await validateApiAuth('manage-iuran');
    if (errorResponse || !session) return errorResponse;

    const resolvedParams = await params;
    const ruleId = parseInt(resolvedParams.id, 10);
    if (isNaN(ruleId)) {
      return NextResponse.json({ error: 'ID aturan iuran tidak valid' }, { status: 400 });
    }

    const result = await generateTagihanForRule(ruleId);

    // Kirim notifikasi lonceng HANYA ke warga yang baru dibuatkan tagihannya (tidak double)
    if (result.generated > 0 && result.newlyBilledHeadUserIds.length > 0) {
      const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(Number(result.ruleAmount));

      const title = 'Tagihan Iuran Baru';
      const message = `Tagihan Iuran "${result.ruleName}" periode ${result.period} sebesar ${formattedAmount} telah diterbitkan. Mohon lakukan pembayaran.`;

      for (const headUserId of result.newlyBilledHeadUserIds) {
        notifyUser(headUserId, {
          title,
          message,
          category: 'personal',
          redirectLink: '/dashboard/my-fees',
        }).catch((err) => console.error('Gagal mengirim notifikasi iuran baru:', err));
      }
    }

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'GENERATE_FEE_BILLS',
      module: 'keuangan',
      description: `Generate tagihan "${result.ruleName}" periode ${result.period}: ${result.generated} tagihan baru diterbitkan, ${result.skipped} sudah ada.`,
      ipAddress,
    }).catch(() => null);

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
