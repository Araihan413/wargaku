import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import { listActivities, createActivity } from '@/db/queries/communication/activity.queries';
import { notifyAllWarga } from '@/lib/notifications';
import { createActivitySchema } from '@/lib/validations/layanan';
import { ZodError } from 'zod';

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
    const { session, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filter = (searchParams.get('filter') || 'all') as 'all' | 'upcoming' | 'past';
    const isPinnedParam = searchParams.get('isPinned');

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
    const { session, errorResponse } = await validateApiAuth('manage-activities');
    if (errorResponse || !session) return errorResponse;

    const body = await request.json();
    const validated = createActivitySchema.parse(body);

    const newId = await createActivity(
      {
        title: validated.title,
        description: validated.description || '',
        eventDate: validated.eventDate,
        location: validated.location || '',
        attachments: validated.attachments || undefined,
      },
      session.user.id
    );

    // Broadcast notifikasi kegiatan ke seluruh warga
    notifyAllWarga({
      title: `[KEGIATAN RT] ${validated.title}`,
      message: validated.description || `Agenda kegiatan RT baru: ${validated.title}`,
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
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data kegiatan tidak valid', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/activities:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

