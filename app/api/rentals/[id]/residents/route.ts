import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import {
  getRentalPropertyById,
  listRentalResidents,
  getRentalResidentByNik,
  createRentalResident,
} from '@/db/queries/rental';
import { createRentalResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/rentals/{id}/residents:
 *   get:
 *     summary: Mendapatkan daftar penghuni sewa terpaginasi pada properti tertentu (Pengurus & Koordinator Kost Pemilik)
 *     tags: [Penghuni Sewa]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Properti Sewa
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
 *         description: Pencarian berdasarkan Nama atau NIK penghuni sewa
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter status aktif/tidak aktif (check-out)
 *     responses:
 *       200:
 *         description: Daftar penghuni sewa berhasil diambil
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
 *   post:
 *     summary: Mendaftarkan check-in penghuni sewa baru (Pengurus & Koordinator Kost Pemilik)
 *     tags: [Penghuni Sewa]
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
 *             required:
 *               - tenantType
 *               - name
 *               - nik
 *               - phone
 *               - roomNumber
 *               - checkInDate
 *             properties:
 *               tenantType:
 *                 type: string
 *                 enum: [perorangan, keluarga]
 *                 description: Tipe penyewa
 *               name:
 *                 type: string
 *                 description: Nama lengkap penyewa
 *               nik:
 *                 type: string
 *                 description: NIK penyewa
 *               phone:
 *                 type: string
 *                 description: Nomor telepon penyewa
 *               roomNumber:
 *                 type: string
 *                 description: Nomor/nama kamar yang disewa
 *               checkInDate:
 *                 type: string
 *                 format: date
 *                 description: Tanggal check-in
 *               familyCardFile:
 *                 type: string
 *                 description: URL/path file kartu keluarga
 *               identityCardFile:
 *                 type: string
 *                 description: URL/path file KTP
 *               employmentCertificateFile:
 *                 type: string
 *                 description: URL/path file surat keterangan kerja (opsional)
 *               marriageCertificateFile:
 *                 type: string
 *                 description: URL/path file surat nikah (opsional)
 *     responses:
 *       201:
 *         description: Penyewa berhasil melakukan check-in
 *       400:
 *         description: Validasi input gagal atau NIK sudah terdaftar
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses atau kapasitas kamar penuh
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

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
    const query = searchParams.get('query') || undefined;

    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    const result = await listRentalResidents({
      rentalPropertyId: propertyId,
      limit,
      offset,
      isActive,
      query,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/rentals/[id]/residents:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

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
    const validatedData = createRentalResidentSchema.parse(body);

    // 1. Validasi NIK Unik
    const existingResident = await getRentalResidentByNik(validatedData.nik);
    if (existingResident) {
      return NextResponse.json(
        { error: `NIK ${validatedData.nik} sudah terdaftar di sistem kependudukan.` },
        { status: 400 }
      );
    }

    // 2. Validasi Batas Kapasitas Kamar
    if (property.activeResidentsCount >= property.totalRooms) {
      return NextResponse.json(
        { error: 'Kamar penuh, kapasitas properti sewa telah maksimum' },
        { status: 403 }
      );
    }

    const residentId = await createRentalResident({
      ...validatedData,
      rentalPropertyId: propertyId,
      createdBy: Number(session.user.id),
    });

    return NextResponse.json(
      { id: residentId, message: 'Penyewa berhasil melakukan check-in' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/rentals/[id]/residents:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
