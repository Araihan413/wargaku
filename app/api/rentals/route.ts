import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { listRentalProperties, createRentalProperty } from '@/db/queries/rental';
import { createRentalPropertySchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';
import { validateAndParseRoomPattern, generateDefaultRooms } from '@/lib/room-helper';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * @openapi
 * /api/rentals:
 *   get:
 *     summary: Mendapatkan daftar properti sewa (kos, kontrakan, homestay) terpaginasi (Khusus Pengurus & Koordinator Kost)
 *     tags: [Properti Sewa]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Index mulai data
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Pencarian berdasarkan nama properti sewa
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter status aktif/nonaktif
 *     responses:
 *       200:
 *         description: Daftar properti sewa berhasil diambil
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses (manage-boarding)
 *       500:
 *         description: Kesalahan server internal
 *   post:
 *     summary: Mendaftarkan properti sewa baru (Khusus Pengurus & Koordinator Kost)
 *     tags: [Properti Sewa]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dwellingId
 *               - name
 *               - type
 *               - totalRooms
 *               - monthlyRate
 *             properties:
 *               dwellingId:
 *                 type: integer
 *                 description: ID tempat tinggal
 *               name:
 *                 type: string
 *                 description: Nama properti sewa
 *               type:
 *                 type: string
 *                 enum: [kos, kontrakan, homestay, lainnya]
 *                 description: Tipe properti sewa
 *               totalRooms:
 *                 type: integer
 *                 description: Jumlah kamar total
 *               monthlyRate:
 *                 type: integer
 *                 description: Tarif bulanan dalam rupiah
 *               coordinatorUserId:
 *                 type: integer
 *                 description: ID koordinator sewa (opsional bagi RT/RW, dipaksa ke diri sendiri untuk Koordinator)
 *     responses:
 *       201:
 *         description: Properti sewa berhasil didaftarkan
 *       400:
 *         description: Validasi input gagal
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses (manage-boarding)
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
    const query = searchParams.get('query') || undefined;
    
    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    // Jika user adalah Koordinator Kost (roleId = 5), paksa filter coordinatorUserId
    const isKoordinatorKost = session.user.roleId === 5;
    const coordinatorUserId = isKoordinatorKost ? session.user.id : undefined;

    const result = await listRentalProperties({
      limit,
      offset,
      query,
      isActive,
      coordinatorUserId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/rentals:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    
    // Jika user adalah Koordinator Kost (roleId = 5), paksa coordinatorUserId ke ID user sendiri
    const isKoordinatorKost = session.user.roleId === 5;
    if (isKoordinatorKost) {
      body.coordinatorUserId = Number(session.user.id);
    }

    const validatedData = createRentalPropertySchema.parse(body);

    // Check if there is already an active rental property for this dwellingId
    const [existingRental] = await db
      .select({ id: schema.rentalProperties.id })
      .from(schema.rentalProperties)
      .where(
        and(
          eq(schema.rentalProperties.dwellingId, validatedData.dwellingId),
          eq(schema.rentalProperties.isActive, true)
        )
      )
      .limit(1);

    if (existingRental) {
      return NextResponse.json({ error: 'Properti sewa aktif sudah terdaftar untuk hunian ini' }, { status: 400 });
    }

    // Process and validate roomPattern / roomList
    let finalRoomList: string[] = [];
    if (validatedData.roomPattern) {
      const parsed = validateAndParseRoomPattern(validatedData.roomPattern);
      if (!parsed.isValid) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      finalRoomList = parsed.rooms;
      // Auto-update totalRooms if a pattern is used
      validatedData.totalRooms = finalRoomList.length;
    } else {
      // Default fallback: numbers padded with zero
      finalRoomList = generateDefaultRooms(validatedData.totalRooms);
    }

    const propertyId = await createRentalProperty({
      ...validatedData,
      roomList: finalRoomList,
    });

    return NextResponse.json(
      { id: propertyId, message: 'Properti sewa berhasil didaftarkan' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/rentals:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 400 });
  }
}
