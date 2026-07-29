import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getMyFamily } from '@/db/queries/kependudukan';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const family = await getMyFamily(session.user.id, session.user.familyNumber);

    if (!family) {
      return NextResponse.json(
        { error: 'Kartu Keluarga Anda belum terdaftar di sistem. Silakan hubungi Ketua RT.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: family.id,
      familyNumber: family.familyNumber,
      headUserId: family.headUserId,
      headName: family.headName,
      verificationStatus: family.verificationStatus,
      verificationNote: family.verificationNote,
      kkFile: family.kkFile,
      dwellingId: family.dwellingId,
      hasVerified: family.hasVerified,
    });
  } catch (error: any) {
    console.error('Error in GET /api/families/my:', error);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
