import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import { listAnnouncements, createAnnouncement } from '@/db/queries';
import { notifyAllWarga } from '@/lib/notifications';

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
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const isPinnedParam = searchParams.get('isPinned');

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-announcements');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk membuat pengumuman' }, { status: 403 });
    }


    const body = await request.json();
    const { title, content, category, attachments } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Judul, konten, dan kategori pengumuman wajib diisi' },
        { status: 400 }
      );
    }

    if (!['umum', 'penting', 'mendesak'].includes(category)) {
      return NextResponse.json({ error: 'Kategori pengumuman tidak valid' }, { status: 400 });
    }

    const newId = await createAnnouncement({ title, content, category, attachments }, session.user.id);

    // Broadcast notifikasi pengumuman ke seluruh warga
    notifyAllWarga({
      title: `[PENGUMUMAN ${category.toUpperCase()}] ${title}`,
      message: content.length > 120 ? content.slice(0, 117) + "..." : content,
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
    console.error('Error in POST /api/announcements:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
