import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { cancelFamilyChange } from '@/db/queries/population/family.queries';

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

    await cancelFamilyChange(familyId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Perubahan berhasil dibatalkan dan status dikembalikan ke Terverifikasi.',
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Hanya Kepala Keluarga yang berhak membatalkan perubahan KK' }, { status: 403 });
    }
    if (error.message === 'INVALID_STATUS') {
      return NextResponse.json({ error: 'Pembatalan perubahan hanya dapat dilakukan jika KK berstatus Draf' }, { status: 400 });
    }
    console.error('Error in POST /api/families/[id]/cancel-change:', error);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
