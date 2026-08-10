import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { getRentalPropertyById, updateRentalProperty, deleteRentalProperty, cleanupOldCoordinatorRole, getMaxActiveRoomNumber } from '@/db/queries/property/rental-property.queries';
import { updateRentalPropertySchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/rental-properties/{id}:
 *   get:
 *     summary: Mendapatkan detail properti sewa
 *     description: Mengambil data detail properti sewa (kos/kontrakan) beserta informasi pengelolanya berdasarkan ID. Koordinator (Role 5) hanya dapat melihat properti yang dikelolanya.
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
 *         description: Berhasil mendapatkan detail properti sewa
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses ke properti ini
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

    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const isKoordinatorKost = effectiveRoleId === 5;
    if (isKoordinatorKost && property.coordinatorUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    return NextResponse.json(property);
  } catch (error: any) {
    console.error('Error in GET /api/rental-properties/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/rental-properties/{id}:
 *   put:
 *     summary: Memperbarui data properti sewa
 *     description: Mengubah data properti sewa (nama, kontak, total kamar, status aktif). Hanya dapat diubah oleh Admin/RT atau Koordinator yang mengelola properti tersebut.
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
 *         description: Properti sewa berhasil diperbarui
 *       400:
 *         description: Validasi gagal atau mencoba mengurangi kamar yang masih aktif
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

    const isKoordinatorKost = effectiveRoleId === 5;
    if (isKoordinatorKost && existingProperty.coordinatorUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateRentalPropertySchema.parse(body);

    if (validatedData.totalRooms !== undefined) {
      const maxActiveRoom = await getMaxActiveRoomNumber(propertyId);
      if (validatedData.totalRooms < maxActiveRoom) {
        return NextResponse.json({ error: `Tidak dapat mengurangi jumlah kamar menjadi ${validatedData.totalRooms}, karena kamar nomor ${maxActiveRoom.toString().padStart(2, '0')} masih memiliki penyewa aktif.` }, { status: 400 });
      }
    }

    const previousCoordinatorUserId = existingProperty.coordinatorUserId;

    await updateRentalProperty(propertyId, {
      name: validatedData.name,
      coordinatorUserId: validatedData.coordinatorUserId || undefined,
      contactPerson: validatedData.contactPerson,
      phone: validatedData.phone,
      totalRooms: validatedData.totalRooms,
      notes: validatedData.notes || undefined,
      isActive: validatedData.isActive,
    });

    if (previousCoordinatorUserId && previousCoordinatorUserId !== validatedData.coordinatorUserId) {
      await cleanupOldCoordinatorRole(previousCoordinatorUserId);
    }

    return NextResponse.json({ message: 'Properti sewa berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Error in PUT /api/rental-properties/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/rental-properties/{id}:
 *   delete:
 *     summary: Menghapus (Nonaktifkan) properti sewa
 *     description: Menonaktifkan properti sewa (ubah isActive = false). Tidak dapat dilakukan jika masih ada penyewa/penghuni aktif.
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
 *         description: Properti sewa berhasil dinonaktifkan
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
    console.error('Error in DELETE /api/rental-properties/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
