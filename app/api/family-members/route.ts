import { NextResponse } from 'next/server';
import { validateApiAuth, hasPermission } from '@/lib/rbac';
import { listFamilyMembers, createFamilyMember } from '@/db/queries/population/family-member.queries';
import { getFamilyById } from '@/db/queries/population/family.queries';
import { getUserById } from '@/db/queries/auth/user.queries';
import { createWargaSchema } from '@/lib/validations/kependudukan';
import { ZodError } from 'zod';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';
import { calculateAge } from '@/lib/date-format';

/**
 * @openapi
 * /api/family-members:
 *   get:
 *     summary: Mendapatkan daftar anggota keluarga (Warga)
 *     description: Mengambil seluruh daftar anggota keluarga (warga). Memerlukan izin view-residents.
 *     tags:
 *       - Kependudukan
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
 *         description: Offset data
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian (NIK atau Nama Anggota Keluarga)
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [L, P]
 *         description: Filter jenis kelamin
 *       - in: query
 *         name: relationship
 *         schema:
 *           type: string
 *         description: Filter hubungan keluarga
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter status aktif
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar anggota keluarga
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { errorResponse } = await validateApiAuth('view-residents');
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
    const query = searchParams.get('query') || searchParams.get('search') || undefined;
    const gender = (searchParams.get('gender') as 'L' | 'P') || undefined;
    const relationship = searchParams.get('relationship') || undefined;
    
    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    const result = await listFamilyMembers({
      limit,
      offset,
      query,
      gender,
      relationship,
      isActive,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/family-members:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/family-members:
 *   post:
 *     summary: Menambahkan anggota keluarga baru
 *     description: Menambahkan data warga ke dalam Kartu Keluarga. Hanya dapat dilakukan oleh Kepala Keluarga (jika status KK belum diajukan/verifikasi) atau oleh Admin/RT dengan izin manage-residents.
 *     tags:
 *       - Kependudukan
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - familyId
 *               - nik
 *               - name
 *               - gender
 *               - relationship
 *             properties:
 *               familyId:
 *                 type: integer
 *               nik:
 *                 type: string
 *               name:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [L, P]
 *               relationship:
 *                 type: string
 *               birthPlace:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               phone:
 *                 type: string
 *               occupation:
 *                 type: string
 *               educationLevel:
 *                 type: string
 *               ktpFile:
 *                 type: string
 *     responses:
 *       201:
 *         description: Anggota keluarga berhasil ditambahkan
 *       400:
 *         description: Validasi input gagal, atau Kartu Keluarga sedang diverifikasi sehingga tidak dapat diubah
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Kartu Keluarga tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const isOfficer = await hasPermission(roleId, 'manage-residents');

    const body = await request.json();
    const validatedData = createWargaSchema.parse(body);

    const family = await getFamilyById(validatedData.familyId);
    if (!family) {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }

    const isHeadOfFamily = family.headUserId === session.user.id;
    if (!isOfficer && !isHeadOfFamily) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    if (!isOfficer) {
      const currentUser = await getUserById(session.user.id);
      if (!currentUser || currentUser.status !== 'active') {
        return NextResponse.json(
          { error: 'Akun Anda belum aktif atau sedang ditangguhkan' },
          { status: 403 }
        );
      }
    }

    // Jika warga biasa, periksa status verifikasi KK (hanya draft, rejected yang boleh langsung)
    if (!isOfficer) {
      const allowedStatuses = ['draft', 'rejected'];
      if (!allowedStatuses.includes(family.verificationStatus)) {
        return NextResponse.json(
          { error: 'Data Kartu Keluarga sedang dikunci untuk verifikasi RT. Silakan ajukan perubahan data terlebih dahulu.' },
          { status: 400 }
        );
      }
    }

    // Validasi aturan KTP untuk Keluarga Penyewa (usia >= 18 tahun wajib KTP)
    const isRentalFamily = family.dwellingType === 'kos' || family.dwellingType === 'homestay';
    const memberAge = calculateAge(validatedData.birthDate);

    if (isRentalFamily && memberAge >= 18 && !validatedData.ktpFile) {
      return NextResponse.json(
        { error: 'Anggota keluarga penyewa dengan usia 18 tahun ke atas wajib mengunggah Scan KTP.' },
        { status: 400 }
      );
    }

    const memberId = await createFamilyMember({
      familyId: validatedData.familyId,
      nik: validatedData.nik,
      name: validatedData.name,
      gender: validatedData.gender,
      relationship: validatedData.relationship,
      birthPlace: validatedData.birthPlace,
      birthDate: validatedData.birthDate ? String(validatedData.birthDate) : null,
      phone: validatedData.phone,
      occupation: validatedData.occupation,
      educationLevel: validatedData.educationLevel,
      ktpFile: validatedData.ktpFile,
    });

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'ADD_FAMILY_MEMBER',
      module: 'kependudukan',
      description: `Menambahkan anggota keluarga baru: ${validatedData.name} (NIK: ${validatedData.nik}) ke KK ID #${validatedData.familyId}.`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json(
      { message: 'Anggota keluarga berhasil ditambahkan', id: memberId },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Error in POST /api/family-members:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
