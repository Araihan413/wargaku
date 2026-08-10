import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import { listActivities, createActivity } from '@/db/queries/communication/activity.queries';
import { notifyAllWarga } from '@/lib/notifications';

/**
 * @openapi
 * /api/activities:
 *   get:
 *     summary: Mendapatkan daftar kegiatan RT
 *     description: Mengambil daftar agenda atau kegiatan RT. Dapat difilter berdasarkan status (akan datang/lalu) dan pencarian.
 *     tags:
 *       - Kegiatan & Agenda
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian judul atau deskripsi kegiatan
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, upcoming, past]
 *           default: all
 *         description: Filter waktu kegiatan
 *       - in: query
 *         name: isPinned
 *         schema:
 *           type: boolean
 *         description: Filter kegiatan yang disematkan
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar kegiatan
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filter = (searchParams.get('filter') || 'all') as 'all' | 'upcoming' | 'past';
    const isPinnedParam = searchParams.get('isPinned');

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const items = await listActivities({
      search,
      filter,
      isPinned: isPinnedParam === 'true',
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error in GET /api/activities:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/activities:
 *   post:
 *     summary: Membuat jadwal kegiatan RT baru
 *     description: |
 *       Membuat agenda/kegiatan RT baru dan secara otomatis mengirim notifikasi "dinas" ke seluruh warga terdaftar. 
 *       Hanya pengguna dengan izin manage-activities yang dapat mengakses ini.
 *     tags:
 *       - Kegiatan & Agenda
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
 *               - eventDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               attachments:
 *                 type: string
 *                 description: URL lampiran file (opsional)
 *     responses:
 *       201:
 *         description: Kegiatan RT berhasil ditambahkan dan dinotifikasikan
 *       400:
 *         description: Data tidak lengkap (judul dan eventDate wajib)
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
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-activities');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk membuat kegiatan RT' }, { status: 403 });
    }


    const body = await request.json();
    const { title, description, eventDate, location, attachments } = body;

    if (!title || !eventDate) {
      return NextResponse.json(
        { error: 'Judul dan tanggal/waktu kegiatan wajib diisi' },
        { status: 400 }
      );
    }

    const newId = await createActivity(
      { title, description, eventDate, location, attachments },
      session.user.id
    );

    // Broadcast notifikasi kegiatan ke seluruh warga
    notifyAllWarga({
      title: `[KEGIATAN RT] ${title}`,
      message: description || `Agenda kegiatan RT baru: ${title}`,
      category: "dinas",
      redirectLink: "/kegiatan",
    }).catch((notifErr) =>
      console.error("Gagal broadcast notifikasi kegiatan:", notifErr)
    );

    return NextResponse.json(
      { message: 'Kegiatan RT berhasil ditambahkan', id: newId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/activities:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
