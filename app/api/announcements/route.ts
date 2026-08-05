import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import { listAnnouncements, createAnnouncement } from '@/db/queries';
import { notifyAllWarga } from '@/lib/notifications';

// GET /api/announcements - Fetch list of announcements
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

// POST /api/announcements - Create new announcement
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
