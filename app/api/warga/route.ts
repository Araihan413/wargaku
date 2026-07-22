import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { listFamilyMembers, createFamilyMember, getFamilyById } from '@/db/queries/kependudukan';
import { createWargaSchema } from '@/lib/validations/kependudukan';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/warga:
 *   get:
 *     summary: Mendapatkan daftar warga terpaginasi (Khusus Pengurus)
 *     tags: [Warga]
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
 *         description: Pencarian berdasarkan Nama atau NIK
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
 *           enum: [Kepala_Keluarga, Istri, Anak, Orang_Tua, Lainnya]
 *         description: Filter hubungan keluarga
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter status aktif
 *     responses:
 *       200:
 *         description: Daftar warga berhasil diambil
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses (view-residents)
 *       500:
 *         description: Kesalahan server internal
 *   post:
 *     summary: Menambahkan anggota keluarga baru (Pengurus & Pemilik KK)
 *     tags: [Warga]
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
 *               - name
 *               - nik
 *               - gender
 *               - relationship
 *             properties:
 *               familyId:
 *                 type: integer
 *               name:
 *                 type: string
 *               nik:
 *                 type: string
 *               birthPlace:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [L, P]
 *               relationship:
 *                 type: string
 *                 enum: [Kepala_Keluarga, Istri, Anak, Orang_Tua, Lainnya]
 *               occupation:
 *                 type: string
 *               educationLevel:
 *                 type: string
 *               phone:
 *                 type: string
 *               ktpFile:
 *                 type: string
 *     responses:
 *       201:
 *         description: Anggota keluarga berhasil ditambahkan
 *       400:
 *         description: Validasi gagal atau NIK sudah terdaftar
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Terkunci (status verified) atau tidak memiliki izin akses
 *       444:
 *         description: Kartu Keluarga tidak ditemukan
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

    const isAllowed = await hasPermission(session.user.roleId, 'view-residents');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
    const query = searchParams.get('query') || undefined;
    const gender = searchParams.get('gender') as 'L' | 'P' || undefined;
    const relationship = searchParams.get('relationship') as 'Kepala_Keluarga' | 'Suami' | 'Istri' | 'Anak' | 'Orang_Tua' | 'Lainnya' || undefined;
    
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
    console.error('Error in GET /api/warga:', error);
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

    const body = await request.json();
    const validatedData = createWargaSchema.parse(body);

    const family = await getFamilyById(validatedData.familyId);
    if (!family) {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }

    const hasManagePerm = await hasPermission(session.user.roleId, 'manage-residents');
    const isOwnFamily = family.headUserId === session.user.id;
    const hasOwnFamilyPerm = await hasPermission(session.user.roleId, 'manage-own-family');

    if (!hasManagePerm && !(hasOwnFamilyPerm && isOwnFamily)) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    // Aturan Lock untuk Warga (hanya bisa ubah jika berstatus draft atau rejected)
    if (!hasManagePerm) {
      if (family.verificationStatus === 'verified' || family.verificationStatus === 'pending') {
        return NextResponse.json(
          { error: 'Data keluarga sedang dalam proses verifikasi atau telah disetujui RT. Silakan ajukan perubahan data terlebih dahulu.' },
          { status: 403 }
        );
      }
    }

    const memberId = await createFamilyMember(validatedData);

    return NextResponse.json({ id: memberId, message: 'Anggota keluarga berhasil ditambahkan' }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/warga:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 400 });
  }
}
