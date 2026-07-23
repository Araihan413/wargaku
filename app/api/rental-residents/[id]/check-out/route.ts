import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { getRentalResidentById, getRentalPropertyById, updateRentalResident } from '@/db/queries/rental';
import { checkOutResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/rental-residents/{id}/check-out:
 *   post:
 *     summary: Melakukan check-out (penonaktifan) penghuni sewa (Pengurus & Koordinator Kost Pemilik)
 *     tags: [Penghuni Sewa]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Penghuni Sewa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - checkOutDate
 *               - inactiveReason
 *             properties:
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *                 description: Tanggal check-out
 *               inactiveReason:
 *                 type: string
 *                 description: Alasan check-out / penonaktifan
 *     responses:
 *       200:
 *         description: Penyewa berhasil check-out
 *       400:
 *         description: Validasi input gagal atau ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses ke data penghuni ini
 *       404:
 *         description: Penghuni atau properti sewa tidak ditemukan
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
    const residentId = Number(id);

    if (isNaN(residentId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const resident = await getRentalResidentById(residentId);
    if (!resident) {
      return NextResponse.json({ error: 'Penghuni tidak ditemukan' }, { status: 404 });
    }

    if (resident.verificationStatus !== 'verified') {
      return NextResponse.json({ error: 'Penyewa dengan status pending/ditolak tidak dapat melakukan check-out' }, { status: 400 });
    }

    const property = await getRentalPropertyById(resident.rentalPropertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    // Check write authorization: RT/Admin (manage-boarding) or direct coordinator
    const isGlobalAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator) {
      return NextResponse.json({ error: 'Hanya pengelola (koordinator) atau pengurus RT yang dapat memproses check-out' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = checkOutResidentSchema.parse(body);

    await updateRentalResident(residentId, {
      isActive: false,
      checkOutDate: validatedData.checkOutDate,
      inactiveReason: validatedData.inactiveReason,
      updatedBy: session.user.id,
    });

    return NextResponse.json({ message: 'Penyewa berhasil check-out' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/rental-residents/[id]/check-out:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
