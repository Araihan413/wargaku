import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import { listAnnouncements, createAnnouncement } from '@/db/queries';
import { notifyAllWarga } from '@/lib/notifications';
import { createAnnouncementSchema } from '@/lib/validations/layanan';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/announcements:
 *   get:
 *     summary: Mendapatkan daftar pengumuman
 *     description: Mengambil daftar pengumuman RT dengan dukungan pencarian, filter berdasarkan kategori, dan status disematkan (pinned).
 *     tags:
 *       - Pengumuman & Informasi
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian judul atau isi
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [umum, penting, mendesak]
 *         description: Filter berdasarkan kategori pengumuman
 *       - in: query
 *         name: isPinned
 *         schema:
 *           type: boolean
 *         description: Filter pengumuman yang disematkan
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar pengumuman
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { session, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const isPinnedParam = searchParams.get('isPinned');

    const items = await listAnnouncements({
      search,
      category,
      isPinned: isPinnedParam === 'true',
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error in GET /api/announcements:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/announcements:
 *   post:
 *     summary: Membuat pengumuman baru
 *     description: |
 *       Membuat pengumuman RT baru dan secara otomatis mengirim notifikasi "dinas" ke seluruh warga terdaftar. 
 *       Hanya pengguna dengan izin manage-announcements (biasanya pengurus RT/RW) yang dapat mengakses ini.
 *     tags:
 *       - Pengumuman & Informasi
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [umum, penting, mendesak]
 *               attachments:
 *                 type: string
 *                 description: URL lampiran file (opsional)
 *     responses:
 *       201:
 *         description: Pengumuman berhasil dibuat dan dinotifikasikan
 *       400:
 *         description: Data tidak lengkap atau kategori tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const { session, errorResponse } = await validateApiAuth('manage-announcements');
    if (errorResponse || !session) return errorResponse;

    const body = await request.json();
    const validated = createAnnouncementSchema.parse(body);

    const newId = await createAnnouncement(
      {
        title: validated.title,
        content: validated.content,
        category: validated.category,
        attachments: validated.attachments || undefined,
      },
      session.user.id
    );

    // Broadcast notifikasi pengumuman ke seluruh warga
    notifyAllWarga({
      title: `[PENGUMUMAN ${validated.category.toUpperCase()}] ${validated.title}`,
      message: validated.content.length > 120 ? validated.content.slice(0, 117) + "..." : validated.content,
      category: "dinas",
      redirectLink: "/pengumuman",
    }).catch((notifErr) =>
      console.error("Gagal broadcast notifikasi pengumuman:", notifErr)
    );

    return NextResponse.json(
      { message: 'Pengumuman berhasil dibuat', id: newId },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data pengumuman tidak valid', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/announcements:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

