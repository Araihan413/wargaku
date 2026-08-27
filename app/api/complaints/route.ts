import { NextResponse } from 'next/server';
import { validateApiAuth, hasPermission } from '@/lib/rbac';
import { listComplaints, createComplaint, checkIpRateLimit } from '@/db/queries';
import { notifyRoles } from '@/lib/notifications';
import { getClientIp } from '@/lib/audit-logger';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { createComplaintSchema } from '@/lib/validations/layanan';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/complaints:
 *   get:
 *     summary: Mendapatkan daftar pengaduan warga
 *     description: Mengambil seluruh laporan pengaduan yang diajukan warga. Dapat difilter berdasarkan status atau kategori. Membutuhkan izin kelola (Ketua RT/Sekretaris atau manage-complaints).
 *     tags:
 *       - Pengaduan & Aspirasi
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [menunggu, proses, selesai, ditolak]
 *         description: Filter berdasarkan status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Infrastruktur, Kebersihan, Keamanan, Sosial, Lainnya]
 *         description: Filter berdasarkan kategori
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan kode tiket, nama pelapor, atau deskripsi
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar pengaduan
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const isAllowed =
      roleId === 1 ||
      roleId === 2 ||
      roleId === 3 ||
      (await hasPermission(roleId, 'manage-complaints'));

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();

    const result = await listComplaints({ status, category, search });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/complaints:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/complaints:
 *   post:
 *     summary: Mengirim laporan pengaduan (Publik)
 *     description: |
 *       Mengirim laporan pengaduan baru dari warga (bersifat publik, tidak wajib login).
 *       Dilengkapi dengan pembatasan limit (maks 4 laporan per jam per IP Address) 
 *       serta notifikasi langsung ke pengurus RT (Ketua & Sekretaris).
 *     tags:
 *       - Pengaduan & Aspirasi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reporterName
 *               - category
 *               - description
 *             properties:
 *               reporterName:
 *                 type: string
 *               reporterPhone:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Infrastruktur, Kebersihan, Keamanan, Sosial, Lainnya]
 *               description:
 *                 type: string
 *               photoPath:
 *                 type: string
 *                 description: URL foto bukti
 *               dwellingId:
 *                 type: integer
 *                 description: ID hunian (jika ada kaitannya dengan lokasi)
 *     responses:
 *       201:
 *         description: Laporan pengaduan berhasil dikirim (mengembalikan ID dan Kode Tiket)
 *       400:
 *         description: Input tidak valid
 *       429:
 *         description: Terlalu banyak percobaan (Rate Limit)
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const clientIp = (await getClientIp(request)) || '127.0.0.1';

    const isRateLimitOk = await checkIpRateLimit(clientIp);
    if (!isRateLimitOk) {
      return NextResponse.json(
        { error: 'Batas pengiriman laporan tercapai. Anda hanya dapat mengirim maksimal 4 laporan per jam.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = createComplaintSchema.parse(body);

    // Verifikasi Keamanan Cloudflare Turnstile (Anti-Bot & Spam)
    const turnstileResult = await verifyTurnstileToken(validated.turnstileToken || '', clientIp);
    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: turnstileResult.error || 'Verifikasi keamanan bot gagal.' },
        { status: 400 }
      );
    }

    const complaintRes = await createComplaint({
      reporterName: validated.reporterName,
      reporterPhone: validated.reporterPhone || null,
      category: validated.category,
      description: validated.description,
      photoPath: validated.photoPath || null,
      dwellingId: validated.dwellingId || null,
      ipAddress: clientIp,
    });

    notifyRoles(['ketua-rt', 'sekretaris'], {
      title: `Pengaduan Warga Baru [${validated.category}]`,
      message: `Laporan baru dari ${validated.reporterName}: "${validated.description.slice(0, 60)}..."`,
      category: 'dinas',
      redirectLink: '/dashboard/complaints',
    }).catch((err) => console.error('Gagal kirim notifikasi pengaduan:', err));

    return NextResponse.json(
      {
        success: true,
        data: {
          id: complaintRes.id,
          trackingCode: complaintRes.trackingCode,
        },
        message: 'Laporan pengaduan berhasil dikirim. Terima kasih atas kepedulian Anda!',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data pengaduan tidak valid', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/complaints:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
