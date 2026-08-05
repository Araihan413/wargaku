import { NextResponse } from 'next/server';
import { getPendingCoordInfo } from '@/db/queries/auth/user.queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const user = await getPendingCoordInfo(id);

    if (!user) {
      return NextResponse.json(
        { error: 'Calon koordinator tidak ditemukan atau sudah terregistrasi' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: user.name,
      phone: user.phone,
    });
  } catch (error: any) {
    console.error('Error in GET /api/users/coord-info:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
