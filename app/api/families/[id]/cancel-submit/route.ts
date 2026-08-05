import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { cancelSubmitFamily } from '@/db/queries/population/family.queries';

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

    await cancelSubmitFamily(familyId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Pengajuan verifikasi Kartu Keluarga berhasil dibatalkan dan dikembalikan ke Draf.',
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Hanya Kepala Keluarga yang berhak membatalkan pengajuan berkas KK' }, { status: 403 });
    }
    if (error.message === 'INVALID_STATUS') {
      return NextResponse.json({ error: 'Pengajuan tidak dapat dibatalkan karena tidak berstatus pending' }, { status: 400 });
    }
    console.error('Error in POST /api/families/[id]/cancel-submit:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
