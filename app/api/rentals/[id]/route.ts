import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { getRentalPropertyById, updateRentalProperty, deleteRentalProperty } from '@/db/queries/rental';
import { updateRentalPropertySchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/rentals/{id}:
 *   get:
 *     summary: Mendapatkan detail informasi properti sewa tertentu (Pengurus & Koordinator Kost Pemilik)
 *     tags: [Properti Sewa]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Properti Sewa
 *     responses:
 *       200:
 *         description: Detail properti sewa berhasil diambil
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses ke properti ini
 *       404:
 *         description: Properti sewa tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   put:
 *     summary: Memperbarui data properti sewa (Pengurus & Koordinator Kost Pemilik)
 *     tags: [Properti Sewa]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Properti Sewa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [kos, kontrakan, homestay, lainnya]
 *               totalRooms:
 *                 type: integer
 *               monthlyRate:
 *                 type: integer
 *               coordinatorUserId:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Informasi properti sewa berhasil diperbarui
 *       400:
 *         description: Validasi input gagal atau ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses ke properti ini
 *       404:
 *         description: Properti sewa tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Menonaktifkan properti sewa / Soft Delete (Pengurus & Koordinator Kost Pemilik)
 *     tags: [Properti Sewa]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Properti Sewa
 *     responses:
 *       200:
 *         description: Properti sewa berhasil dinonaktifkan
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses ke properti ini
 *       404:
 *         description: Properti sewa tidak ditemukan
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

    const isAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
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

    // Cek otorisasi kepemilikan untuk Koordinator Kost
    const isKoordinatorKost = session.user.roleId === 5;
    if (isKoordinatorKost && property.coordinatorUserId !== Number(session.user.id)) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    return NextResponse.json(property);
  } catch (error: any) {
    console.error('Error in GET /api/rentals/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

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

    const isAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
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

    // Cek otorisasi kepemilikan untuk Koordinator Kost
    const isKoordinatorKost = session.user.roleId === 5;
    if (isKoordinatorKost && property.coordinatorUserId !== Number(session.user.id)) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    const body = await request.json();

    // Koordinator Kost tidak boleh mengganti koordinator ke orang lain
    if (isKoordinatorKost) {
      body.coordinatorUserId = Number(session.user.id);
    }

    const validatedData = updateRentalPropertySchema.parse(body);
    await updateRentalProperty(propertyId, validatedData);

    return NextResponse.json({ message: 'Informasi properti sewa berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in PUT /api/rentals/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

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

    const isAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
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

    // Cek otorisasi kepemilikan untuk Koordinator Kost
    const isKoordinatorKost = session.user.roleId === 5;
    if (isKoordinatorKost && property.coordinatorUserId !== Number(session.user.id)) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    await deleteRentalProperty(propertyId);

    return NextResponse.json({ message: 'Properti sewa berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in DELETE /api/rentals/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
