import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { getRentalPropertyById, updateRentalProperty, deleteRentalProperty } from '@/db/queries/rental';
import { updateRentalPropertySchema } from '@/lib/validations/rental';
import { validateAndParseRoomPattern, generateDefaultRooms } from '@/lib/room-helper';
import { ZodError } from 'zod';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

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
    if (isKoordinatorKost && property.coordinatorUserId !== session.user.id) {
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
    if (isKoordinatorKost && property.coordinatorUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    const body = await request.json();
    const oldCoordinatorId = property.coordinatorUserId;

    // Koordinator Kost tidak boleh mengganti koordinator ke orang lain
    if (isKoordinatorKost) {
      body.coordinatorUserId = session.user.id;
    }

    const validatedData = updateRentalPropertySchema.parse(body);

    // If roomPattern or totalRooms is updated, rebuild roomList
    if ('roomPattern' in body || 'totalRooms' in body) {
      let finalRoomList: string[] = [];
      const pattern = 'roomPattern' in body ? validatedData.roomPattern : property.roomPattern;
      
      if (pattern) {
        const parsed = validateAndParseRoomPattern(pattern);
        if (!parsed.isValid) {
          return NextResponse.json({ error: parsed.error }, { status: 400 });
        }
        finalRoomList = parsed.rooms;
        validatedData.totalRooms = finalRoomList.length;
      } else {
        const total = 'totalRooms' in body ? (validatedData.totalRooms ?? 0) : (property.totalRooms ?? 0);
        finalRoomList = generateDefaultRooms(total);
      }
      validatedData.roomList = finalRoomList;
    }

    await updateRentalProperty(propertyId, validatedData);

    // Jika coordinatorUserId berubah, lakukan pembersihan status koordinator lama
    if (oldCoordinatorId && validatedData.coordinatorUserId !== oldCoordinatorId) {
      // Hitung apakah koordinator lama masih memegang properti sewa aktif lainnya
      const activePropertiesCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.rentalProperties)
        .where(and(
          eq(schema.rentalProperties.coordinatorUserId, oldCoordinatorId),
          eq(schema.rentalProperties.isActive, true)
        ))
        .then(res => Number(res[0]?.count || 0));

      if (activePropertiesCount === 0) {
        // Cek apakah user koordinator lama terdaftar sebagai warga tetap (mempunyai NIK di family_members)
        const [oldCoordinatorUser] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, oldCoordinatorId))
          .limit(1);

        if (oldCoordinatorUser) {
          let isResident = false;
          if (oldCoordinatorUser.nik) {
            const [residentCheck] = await db
              .select()
              .from(schema.familyMembers)
              .where(eq(schema.familyMembers.nik, oldCoordinatorUser.nik))
              .limit(1);
            if (residentCheck) {
              isResident = true;
            }
          }

          if (isResident) {
            // Jika warga setempat -> Turunkan role menjadi Warga biasa (4)
            await db
              .update(schema.users)
              .set({ roleId: 4 })
              .where(eq(schema.users.id, oldCoordinatorId));
          } else {
            // Jika orang luar -> Suspend akun login-nya
            await db
              .update(schema.users)
              .set({ status: 'suspended' })
              .where(eq(schema.users.id, oldCoordinatorId));
          }
        }
      }
    }

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
    if (isKoordinatorKost && property.coordinatorUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    await deleteRentalProperty(propertyId);

    return NextResponse.json({ message: 'Properti sewa berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in DELETE /api/rentals/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
