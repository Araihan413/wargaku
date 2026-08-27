import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import { getTenantContractById, updateTenantContract } from '@/db/queries/property/tenant.queries';
import { resubmitRentalResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/rental-residents/{id}/resubmit:
 *   post:
 *     summary: Mengajukan ulang verifikasi data penyewa yang ditolak
 *     description: Mengubah status verifikasi data penyewa (kontrak) dari rejected menjadi pending kembali.
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
 *         description: Verifikasi berhasil diajukan ulang
 *       400:
 *         description: ID tidak valid atau status bukan rejected
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
    const validated = resubmitRentalResidentSchema.parse(rawBody);

    const existingContract = await getTenantContractById(contractId);
    
    if (!existingContract) {
      return NextResponse.json({ error: 'Data penyewa tidak ditemukan' }, { status: 404 });
    }

    if (existingContract.verificationStatus !== 'rejected') {
      return NextResponse.json({ error: 'Hanya data yang ditolak yang bisa dikirim ulang' }, { status: 400 });
    }

    await updateTenantContract(contractId, {
      ...validated,
      verificationStatus: 'pending',
      verificationNote: null,
    });

    return NextResponse.json({ message: 'Verifikasi berhasil diajukan ulang ke RT' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data tidak valid', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/rental-residents/[id]/resubmit:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

