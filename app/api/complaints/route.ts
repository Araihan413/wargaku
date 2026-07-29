import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { listComplaints, createComplaint } from '@/db/queries/complaints';

export async function GET(request: Request) {
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
      (await hasPermission(session.user.roleId, 'manage-complaints'));

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();

    const result = await listComplaints({ status, category, search });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/complaints:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reporterName, reporterPhone, category, description, photoPath, dwellingId } = body;

    if (!reporterName || !category || !description) {
      return NextResponse.json(
        { error: 'Nama pelapor, kategori, dan deskripsi laporan wajib diisi' },
        { status: 400 }
      );
    }

    const created = await createComplaint({
      reporterName,
      reporterPhone,
      category,
      description,
      photoPath,
      dwellingId,
    });

    return NextResponse.json(
      {
        message: 'Laporan pengaduan berhasil dikirim',
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/complaints:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
