import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { listAnnouncements, createAnnouncement } from '@/db/queries/announcements';

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

    const isAllowed =
      session.user.roleId === 1 ||
      session.user.roleId === 2 ||
      session.user.roleId === 3 ||
      await hasPermission(session.user.roleId, 'manage-announcements');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk membuat pengumuman' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, category } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Judul, konten, dan kategori pengumuman wajib diisi' },
        { status: 400 }
      );
    }

    if (!['umum', 'penting', 'mendesak'].includes(category)) {
      return NextResponse.json({ error: 'Kategori pengumuman tidak valid' }, { status: 400 });
    }

    const newId = await createAnnouncement({ title, content, category }, session.user.id);

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
