import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { reactivateTenantContract, getTenantContractById } from '@/db/queries/property/tenant.queries';

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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { id } = await params;
    const contractId = Number(id);

    if (isNaN(contractId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const contract = await getTenantContractById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Kontrak sewa tidak ditemukan' }, { status: 404 });
    }

    await reactivateTenantContract(contractId);

    return NextResponse.json({ message: 'Kontrak penyewa berhasil diaktifkan kembali' });
  } catch (error: any) {
    console.error('Error in POST /api/rental-residents/[id]/reactivate:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
