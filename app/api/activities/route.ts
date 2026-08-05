import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import { listActivities, createActivity } from '@/db/queries/communication/activity.queries';
import { notifyAllWarga } from '@/lib/notifications';

// GET /api/activities - Fetch list of RT activities
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

// POST /api/activities - Create new activity
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
