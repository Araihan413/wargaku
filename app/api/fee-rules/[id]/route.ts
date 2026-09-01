import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import { updateFeeRule, deleteFeeRule } from '@/db/queries/finance/fee.queries';
import { z } from 'zod';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

const updateFeeRuleSchema = z.object({
  name: z.string().min(1, 'Nama iuran wajib diisi'),
  amount: z.number().positive('Nominal iuran harus lebih dari 0'),
  isMandatory: z.boolean().default(true),
  isActive: z.boolean().optional(),
});

/**
 * @openapi
 * /api/fee-rules/{id}:
 *   put:
 *     summary: Memperbarui aturan iuran
 *     description: Memperbarui nama atau nominal dari aturan iuran (contoh Uang Kebersihan). Membutuhkan izin manage-iuran.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               isMandatory:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Aturan iuran berhasil diperbarui
 *       400:
 *         description: Data input tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin untuk mengedit
 *       404:
 *         description: Aturan iuran tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function PUT(
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

    const body = await request.json();
    const parsed = updateFeeRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid', issues: parsed.error.issues }, { status: 400 });
    }

    await updateFeeRule(ruleId, parsed.data);

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'UPDATE_FEE_RULE',
      module: 'keuangan',
      description: `Memperbarui aturan iuran ID #${ruleId}: "${parsed.data.name}" menjadi Rp ${Number(parsed.data.amount).toLocaleString('id-ID')}.`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({ message: 'Aturan iuran berhasil diperbarui' });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Aturan iuran tidak ditemukan' }, { status: 404 });
    }
    console.error('[PUT /api/fee-rules/[id]]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/fee-rules/{id}:
 *   delete:
 *     summary: Menghapus atau menonaktifkan aturan iuran
 *     description: Menghapus aturan iuran jika belum pernah dibayarkan. Jika sudah ada history pembayaran, aturan akan dinonaktifkan (soft delete).
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
 *         description: Aturan iuran berhasil dihapus atau dinonaktifkan
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Aturan iuran tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function DELETE(
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

    const result = await deleteFeeRule(ruleId);

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'DELETE_FEE_RULE',
      module: 'keuangan',
      description: `${result.softDeleted ? 'Menonaktifkan' : 'Menghapus'} aturan iuran ID #${ruleId}.`,
      ipAddress,
    }).catch(() => null);

    if (result.softDeleted) {
      return NextResponse.json({
        message: 'Aturan iuran dinonaktifkan karena sudah memiliki riwayat pembayaran warga.',
        softDeleted: true,
      });
    }
    return NextResponse.json({ message: 'Aturan iuran berhasil dihapus', softDeleted: false });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Aturan iuran tidak ditemukan' }, { status: 404 });
    }
    console.error('[DELETE /api/fee-rules/[id]]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
