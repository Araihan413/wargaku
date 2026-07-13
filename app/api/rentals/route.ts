import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { listRentalProperties, createRentalProperty } from '@/db/queries/rental';
import { createRentalPropertySchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

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
    const coordinatorUserId = isKoordinatorKost ? Number(session.user.id) : undefined;

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
    const propertyId = await createRentalProperty(validatedData);

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
