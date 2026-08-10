import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import {
  getRentalPropertyById,
  updateRentalProperty,
  deleteRentalProperty,
  cleanupOldCoordinatorRole,
  getMaxActiveRoomNumber,
} from '@/db/queries/property/rental-property.queries';
import { updateRentalPropertySchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/rentals/{id}:
 *   get:
 *     summary: Mendapatkan detail properti Kos
 *     description: Mengambil data detail properti kos.
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
 *         description: Berhasil mendapatkan detail properti
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       404:
 *         description: Properti tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(
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
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error: any) {
    console.error('Error in GET /api/rentals/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/rentals/{id}:
 *   put:
 *     summary: Memperbarui data properti Kos
 *     description: Memperbarui detail properti Kos. Sama seperti /api/rental-properties/{id}.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               coordinatorUserId:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               phone:
 *                 type: string
 *               totalRooms:
 *                 type: integer
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Properti Kos berhasil diperbarui
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Properti tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function PUT(
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

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-boarding');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { id } = await params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const existingProperty = await getRentalPropertyById(propertyId);
    if (!existingProperty) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateRentalPropertySchema.parse(body);

    if (validatedData.totalRooms !== undefined) {
      const maxActiveRoom = await getMaxActiveRoomNumber(propertyId);
      if (validatedData.totalRooms < maxActiveRoom) {
        return NextResponse.json({ error: `Tidak dapat mengurangi jumlah kamar menjadi ${validatedData.totalRooms}, karena kamar nomor ${maxActiveRoom.toString().padStart(2, '0')} masih memiliki penyewa aktif.` }, { status: 400 });
      }
    }

    const oldCoordinatorId = existingProperty.coordinatorUserId;

    await updateRentalProperty(propertyId, {
      name: validatedData.name,
      coordinatorUserId: validatedData.coordinatorUserId,
      contactPerson: validatedData.contactPerson,
      phone: validatedData.phone,
      totalRooms: validatedData.totalRooms,
      notes: validatedData.notes,
      isActive: validatedData.isActive,
    });

    if (
      oldCoordinatorId &&
      validatedData.coordinatorUserId &&
      oldCoordinatorId !== validatedData.coordinatorUserId
    ) {
      await cleanupOldCoordinatorRole(oldCoordinatorId);
    }

    return NextResponse.json({ message: 'Properti sewa berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Error in PUT /api/rentals/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/rentals/{id}:
 *   delete:
 *     summary: Menghapus (Nonaktifkan) properti Kos
 *     description: Menonaktifkan properti Kos (ubah isActive = false). Tidak dapat dilakukan jika masih ada penyewa/penghuni aktif.
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
 *         description: Properti Kos berhasil dinonaktifkan
 *       400:
 *         description: ID tidak valid atau masih ada penyewa aktif
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Properti tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function DELETE(
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

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-boarding');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { id } = await params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const existingProperty = await getRentalPropertyById(propertyId);
    if (!existingProperty) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    if (existingProperty.activeContracts > 0) {
      return NextResponse.json({ error: 'Gagal menonaktifkan properti. Harap proses check-out seluruh penghuni yang masih aktif terlebih dahulu.' }, { status: 400 });
    }

    await deleteRentalProperty(propertyId);

    if (existingProperty.coordinatorUserId) {
      await cleanupOldCoordinatorRole(existingProperty.coordinatorUserId);
    }

    return NextResponse.json({ message: 'Properti sewa berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in DELETE /api/rentals/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
