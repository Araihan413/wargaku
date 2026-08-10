import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { and, eq, ne, sql } from 'drizzle-orm';

import {
  getRentalPropertyById,
  updateRentalProperty,
  deleteRentalProperty,
  isPropertyOwner,
  getMaxActiveRoomNumber,
} from '@/db/queries/property/rental-property.queries';
import { findOrCreatePendingCoordinatorByPhone, getUserFullProfile } from '@/db/queries/auth/user.queries';
import { updateRentalPropertySchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/my-properties/{id}:
 *   get:
 *     summary: Mendapatkan detail properti pribadi
 *     description: Mengambil data detail properti milik pengguna (termasuk data koordinator) berdasarkan ID properti. Hanya bisa diakses oleh pemilik properti.
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
 *       403:
 *         description: Tidak memiliki hak akses (bukan pemilik)
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

    const isOwner = await isPropertyOwner(propertyId, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Anda tidak memiliki hak akses untuk properti ini' }, { status: 403 });
    }

    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 });
    }

    let coordinator = null;
    if (property.coordinatorUserId) {
      coordinator = await getUserFullProfile(property.coordinatorUserId);
    }

    return NextResponse.json({
      ...property,
      coordinator,
    });

  } catch (error: any) {
    console.error('Error in GET /api/my-properties/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/my-properties/{id}:
 *   put:
 *     summary: Memperbarui data properti pribadi
 *     description: Memperbarui informasi kos/kontrakan (fasilitas, aturan, koordinator, jumlah kamar). Akan otomatis mengubah Role 5 jika koordinator diganti.
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
 *               type:
 *                 type: string
 *                 enum: [kos, kontrakan, unit_komersial, lainnya]
 *               status:
 *                 type: string
 *                 enum: [aktif, renovasi, tidak_disewakan]
 *               totalRooms:
 *                 type: integer
 *               facilities:
 *                 type: string
 *               rules:
 *                 type: string
 *               coordinatorUserId:
 *                 type: string
 *               coordinatorName:
 *                 type: string
 *               coordinatorPhone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Properti berhasil diperbarui
 *       400:
 *         description: Validasi gagal atau tidak dapat mengurangi jumlah kamar yang masih aktif
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki hak akses
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

    const { id } = await params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const isOwner = await isPropertyOwner(propertyId, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Anda tidak memiliki hak akses untuk properti ini' }, { status: 403 });
    }

    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateRentalPropertySchema.parse(body);

    if (validated.totalRooms !== undefined) {
      const maxActiveRoom = await getMaxActiveRoomNumber(propertyId);
      if (validated.totalRooms < maxActiveRoom) {
        return NextResponse.json({ error: `Tidak dapat mengurangi jumlah kamar menjadi ${validated.totalRooms}, karena kamar nomor ${maxActiveRoom.toString().padStart(2, '0')} masih memiliki penyewa aktif.` }, { status: 400 });
      }
    }


    const oldCoordinatorId = property.coordinatorUserId;
    let newCoordinatorId = validated.coordinatorUserId ? String(validated.coordinatorUserId) : null;
    
    if (!newCoordinatorId && body.coordinatorName && body.coordinatorPhone) {
      newCoordinatorId = await findOrCreatePendingCoordinatorByPhone(body.coordinatorName, body.coordinatorPhone);
    }

    if (!newCoordinatorId) {
      newCoordinatorId = session.user.id;
    }

    // 1. Auto-assign Role 5 to new coordinator
    await db.insert(schema.userRoles).values({
      userId: newCoordinatorId,
      roleId: 5,
      isPrimary: false,
    }).onDuplicateKeyUpdate({ set: { id: sql`id` } });

    // 2. If coordinator changed, remove Role 5 from old coordinator if no remaining active properties
    if (oldCoordinatorId && oldCoordinatorId !== newCoordinatorId) {
      const remainingManaged = await db
        .select({ id: schema.rentalProperties.id })
        .from(schema.rentalProperties)
        .where(
          and(
            eq(schema.rentalProperties.coordinatorUserId, oldCoordinatorId),
            ne(schema.rentalProperties.id, propertyId),
            eq(schema.rentalProperties.isActive, true)
          )
        );

      if (remainingManaged.length === 0) {
        await db
          .delete(schema.userRoles)
          .where(
            and(
              eq(schema.userRoles.userId, oldCoordinatorId),
              eq(schema.userRoles.roleId, 5)
            )
          );
      }
    }

    await updateRentalProperty(propertyId, {
      ...validated,
      coordinatorUserId: newCoordinatorId,
    });

    return NextResponse.json({ message: 'Properti pribadi berhasil diperbarui' });

  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi input gagal' }, { status: 400 });
    }
    console.error('Error in PUT /api/my-properties/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/my-properties/{id}:
 *   delete:
 *     summary: Menghapus (Nonaktifkan) properti pribadi
 *     description: Menonaktifkan properti (isActive = false). Tidak dapat dilakukan jika masih ada penyewa/kontrak yang aktif di dalam properti tersebut.
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
 *         description: Properti berhasil dinonaktifkan
 *       400:
 *         description: ID tidak valid atau masih ada penyewa aktif
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki hak akses
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

    const { id } = await params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const isOwner = await isPropertyOwner(propertyId, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Anda tidak memiliki hak akses untuk properti ini' }, { status: 403 });
    }
    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 });
    }

    if (property.activeContracts > 0) {
      return NextResponse.json({ error: 'Gagal menonaktifkan properti. Harap proses check-out seluruh penghuni yang masih aktif terlebih dahulu.' }, { status: 400 });
    }

    await deleteRentalProperty(propertyId);

    return NextResponse.json({ message: 'Properti pribadi berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in DELETE /api/my-properties/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
