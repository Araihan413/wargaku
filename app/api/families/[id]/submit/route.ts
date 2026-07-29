import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { submitFamily } from '@/db/queries/kependudukan';

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

    await submitFamily(familyId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Berkas Kartu Keluarga berhasil dikirim ke Ketua RT untuk verifikasi.',
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Hanya Kepala Keluarga yang berhak mengirimkan berkas KK' }, { status: 403 });
    }
    if (error.message === 'NO_KK_FILE') {
      return NextResponse.json({ error: 'Harap unggah berkas Scan KK terlebih dahulu sebelum mengirim' }, { status: 400 });
    }
    if (error.message === 'INVALID_STATUS') {
      return NextResponse.json({ error: 'Data KK sudah dikirim atau sedang dalam proses verifikasi' }, { status: 400 });
    }
    console.error('Error in POST /api/families/[id]/submit:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
