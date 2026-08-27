import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import { reactivateTenantContract, getTenantContractById } from '@/db/queries/property/tenant.queries';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';
import { reactivateRentalResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/rental-residents/{id}/reactivate:
 *   post:
 *     summary: Mengaktifkan kembali kontrak sewa yang sudah check-out
 *     description: Mengubah status isActive kontrak sewa kembali menjadi true.
 *     tags:
 *       - Properti & Sewa
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Kontrak penyewa berhasil diaktifkan kembali
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       404:
 *         description: Kontrak sewa tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const { id } = await params;
    const contractId = Number(id);

    if (isNaN(contractId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const rawBody = await request.json().catch(() => ({}));
    reactivateRentalResidentSchema.parse(rawBody);

    const contract = await getTenantContractById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Kontrak sewa tidak ditemukan' }, { status: 404 });
    }

    await reactivateTenantContract(contractId);

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'REACTIVATE_TENANT',
      module: 'sewa',
      description: `Mengaktifkan kembali kontrak sewa ID #${contractId}.`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({ message: 'Kontrak penyewa berhasil diaktifkan kembali' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data tidak valid', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/rental-residents/[id]/reactivate:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

