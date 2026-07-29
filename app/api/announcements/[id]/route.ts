import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import {
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/db/queries/announcements';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const annId = parseInt(id, 10);

    if (isNaN(annId)) {
      return NextResponse.json({ error: 'ID pengumuman tidak valid' }, { status: 400 });
    }

    const item = await getAnnouncementById(annId);

    if (!item) {
      return NextResponse.json({ error: 'Pengumuman tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error in GET /api/announcements/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ error: 'Tidak memiliki izin untuk mengedit pengumuman' }, { status: 403 });
    }

    const { id } = await params;
    const annId = parseInt(id, 10);

    if (isNaN(annId)) {
      return NextResponse.json({ error: 'ID pengumuman tidak valid' }, { status: 400 });
    }

    const body = await request.json();

    await updateAnnouncement(annId, body);

    return NextResponse.json({ message: 'Pengumuman berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: 'Pengumuman tidak ditemukan' }, { status: 404 });
      }
      if (error.message === "NO_CHANGES") {
        return NextResponse.json({ error: 'Tidak ada data yang diperbarui' }, { status: 400 });
      }
      if (error.message === "PINNED_LIMIT_EXCEEDED") {
        return NextResponse.json(
          { error: 'Maksimal 3 pengumuman yang dapat disematkan secara bersamaan' },
          { status: 400 }
        );
      }
    }
    console.error('Error in PATCH /api/announcements/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ error: 'Tidak memiliki izin untuk menghapus pengumuman' }, { status: 403 });
    }

    const { id } = await params;
    const annId = parseInt(id, 10);

    if (isNaN(annId)) {
      return NextResponse.json({ error: 'ID pengumuman tidak valid' }, { status: 400 });
    }

    await deleteAnnouncement(annId);

    return NextResponse.json({ message: 'Pengumuman berhasil dihapus' });
  } catch (error: any) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: 'Pengumuman tidak ditemukan' }, { status: 404 });
    }
    console.error('Error in DELETE /api/announcements/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
