import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import {
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
} from '@/db/queries/communication/complaint.queries';

export async function GET(
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

    const { id } = await params;
    const complaintId = parseInt(id, 10);

    if (isNaN(complaintId)) {
      return NextResponse.json({ error: 'ID pengaduan tidak valid' }, { status: 400 });
    }

    const complaint = await getComplaintById(complaintId);

    if (!complaint) {
      return NextResponse.json({ error: 'Data pengaduan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ data: complaint });
  } catch (error: any) {
    console.error('Error in GET /api/complaints/[id]:', error);
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
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-complaints');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }


    const { id } = await params;
    const complaintId = parseInt(id, 10);

    if (isNaN(complaintId)) {
      return NextResponse.json({ error: 'ID pengaduan tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const { status, responseNote } = body;

    await updateComplaintStatus(complaintId, { status, responseNote }, session.user.id);

    return NextResponse.json({ message: 'Status pengaduan berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: 'Data pengaduan tidak ditemukan' }, { status: 404 });
    }
    console.error('Error in PATCH /api/complaints/[id]:', error);
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
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-complaints');

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Tidak memiliki izin untuk menghapus pengaduan' },
        { status: 403 }
      );
    }


    const { id } = await params;
    const complaintId = parseInt(id, 10);

    if (isNaN(complaintId)) {
      return NextResponse.json({ error: 'ID pengaduan tidak valid' }, { status: 400 });
    }

    await deleteComplaint(complaintId);

    return NextResponse.json({ message: 'Pengaduan berhasil dihapus' });
  } catch (error: any) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: 'Data pengaduan tidak ditemukan' }, { status: 404 });
    }
    console.error('Error in DELETE /api/complaints/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
