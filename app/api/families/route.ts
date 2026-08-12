import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { listFamilies, createFamilyWithHeadMember } from '@/db/queries';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

/**
 * @openapi
 * /api/families:
 *   get:
 *     summary: Mendapatkan daftar Kepala Keluarga (Admin)
 *     description: Mengambil daftar keluarga/KK yang terdaftar. Mendukung paginasi, pencarian, dan filter status verifikasi.
 *     tags:
 *       - Kepala Keluarga
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
 *         description: Kata kunci pencarian (Nomor KK atau Nama Kepala Keluarga)
 *       - in: query
 *         name: verificationStatus
 *         schema:
 *           type: string
 *           enum: [draft, pending, verified, rejected]
 *         description: Filter status verifikasi
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter status aktif
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar keluarga
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses (Bukan Admin)
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

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'view-residents');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
    const query = searchParams.get('query') || undefined;
    const verificationStatus = searchParams.get('verificationStatus') as 'draft' | 'pending' | 'verified' | 'rejected' || undefined;
    
    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    const result = await listFamilies({
      limit,
      offset,
      query,
      verificationStatus,
      isActive,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/families:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/families:
 *   post:
 *     summary: Membuat data Kepala Keluarga baru (Admin)
 *     description: Menambahkan data Kartu Keluarga baru beserta data anggota pertama (Kepala Keluarga). Hanya dapat dilakukan oleh admin.
 *     tags:
 *       - Kepala Keluarga
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - familyCardNumber
 *               - headNik
 *               - headName
 *             properties:
 *               familyCardNumber:
 *                 type: string
 *               dwellingId:
 *                 type: integer
 *                 nullable: true
 *               addressDetail:
 *                 type: string
 *               headNik:
 *                 type: string
 *               headName:
 *                 type: string
 *               headGender:
 *                 type: string
 *               headBirthPlace:
 *                 type: string
 *               headBirthDate:
 *                 type: string
 *               headReligion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Kartu Keluarga berhasil dibuat
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-residents');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const body = await request.json();
    const familyId = await createFamilyWithHeadMember(body);

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'CREATE_FAMILY',
      module: 'kependudukan',
      description: `Membuat Kartu Keluarga baru (No. KK: ${body.familyCardNumber || '-'}, Kepala Keluarga: ${body.headName || '-'}).`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({ id: familyId, message: 'Kartu Keluarga berhasil dibuat' }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/families:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
