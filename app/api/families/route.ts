import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { listFamilies } from '@/db/queries/kependudukan';

/**
 * @openapi
 * /api/families:
 *   get:
 *     summary: Mendapatkan daftar Kartu Keluarga terpaginasi (Khusus Pengurus)
 *     tags: [Kartu Keluarga]
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
 *         description: Pencarian berdasarkan nomor KK atau nama kepala keluarga
 *       - in: query
 *         name: verificationStatus
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *         description: Filter status verifikasi
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter status aktif/nonaktif
 *     responses:
 *       200:
 *         description: Daftar Kartu Keluarga berhasil diambil
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses (view-residents)
 *       500:
 *         description: Kesalahan server internal
 *   post:
 *     summary: Membuat Kartu Keluarga baru (Khusus Pengurus)
 *     tags: [Kartu Keluarga]
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
 *               - familyNumber
 *               - headUserId
 *               - headName
 *               - checkInDate
 *             properties:
 *               dwellingId:
 *                 type: integer
 *               familyNumber:
 *                 type: string
 *               headUserId:
 *                 type: integer
 *               headName:
 *                 type: string
 *               unitNumber:
 *                 type: string
 *               kkFile:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Kartu Keluarga berhasil dibuat
 *       400:
 *         description: Validasi input gagal atau NIK kepala keluarga tidak ditemukan di users
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses (manage-residents)
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
    const verificationStatus = searchParams.get('verificationStatus') as 'draft' | 'pending' | 'verified' | 'rejected' || undefined;
    
    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    let hasVerified: boolean | undefined = undefined;
    const hasVerifiedParam = searchParams.get('hasVerified');
    if (hasVerifiedParam === 'true') {
      hasVerified = true;
    } else if (hasVerifiedParam === 'false') {
      hasVerified = false;
    } else if (hasVerifiedParam === 'all') {
      hasVerified = undefined;
    } else {
      // Default: Hanya tampilkan Kartu Keluarga yang SUDAH TERVERIFIKASI (hasVerified = true)
      hasVerified = true;
    }

    const result = await listFamilies({
      limit,
      offset,
      query,
      verificationStatus,
      hasVerified,
      isActive,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/families:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}


