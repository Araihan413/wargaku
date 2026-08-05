import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import {
  getActivityById,
  updateActivity,
  deleteActivity,
} from '@/db/queries/communication/activity.queries';
import { deleteNotificationsByRedirectLink } from '@/lib/notifications';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actId = parseInt(id, 10);

    if (isNaN(actId)) {
      return NextResponse.json({ error: 'ID kegiatan tidak valid' }, { status: 400 });
    }

    const item = await getActivityById(actId);

    if (!item) {
      return NextResponse.json({ error: 'Kegiatan RT tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error in GET /api/activities/[id]:', error);
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

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-activities');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk mengedit kegiatan RT' }, { status: 403 });
    }


    const { id } = await params;
    const actId = parseInt(id, 10);

    if (isNaN(actId)) {
      return NextResponse.json({ error: 'ID kegiatan tidak valid' }, { status: 400 });
    }

    const body = await request.json();

    await updateActivity(actId, body);

    return NextResponse.json({ message: 'Kegiatan RT berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: 'Kegiatan RT tidak ditemukan' }, { status: 404 });
      }
      if (error.message === "NO_CHANGES") {
        return NextResponse.json({ error: 'Tidak ada data yang diperbarui' }, { status: 400 });
      }
      if (error.message === "PINNED_LIMIT_EXCEEDED") {
        return NextResponse.json(
          { error: 'Maksimal 1 kegiatan RT yang dapat disematkan secara bersamaan' },
          { status: 400 }
        );
      }
    }
    console.error('Error in PATCH /api/activities/[id]:', error);
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

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-activities');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk menghapus kegiatan RT' }, { status: 403 });
    }


    const { id } = await params;
    const actId = parseInt(id, 10);

    if (isNaN(actId)) {
      return NextResponse.json({ error: 'ID kegiatan tidak valid' }, { status: 400 });
    }

    await deleteActivity(actId);

    // Hapus notifikasi terkait yang pernah dikirimkan ke warga
    deleteNotificationsByRedirectLink("/kegiatan").catch((err) =>
      console.error("Gagal menghapus notifikasi kegiatan:", err)
    );

    return NextResponse.json({ message: 'Kegiatan RT berhasil dihapus' });
  } catch (error: any) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: 'Kegiatan RT tidak ditemukan' }, { status: 404 });
    }
    console.error('Error in DELETE /api/activities/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
