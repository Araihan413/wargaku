import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { requestFamilyChange } from '@/db/queries/kependudukan';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familyId = Number(id);

    if (isNaN(familyId)) {
      return NextResponse.json({ error: 'ID Kartu Keluarga tidak valid' }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    await requestFamilyChange(familyId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Permohonan perubahan data berhasil diajukan. Halaman kelola data telah dibuka kembali.',
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Hanya Kepala Keluarga yang berhak mengajukan perubahan data' }, { status: 403 });
    }
    console.error('Error in POST /api/families/[id]/request-change:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
