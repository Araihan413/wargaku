import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    let family = null;

    // 1. Try finding by familyNumber if the user has it in their profile
    if (session.user.familyNumber) {
      const [res] = await db
        .select()
        .from(schema.families)
        .where(eq(schema.families.familyNumber, session.user.familyNumber))
        .limit(1);
      family = res;
    }

    // 2. If not found, try finding where headUserId is this user's ID
    if (!family) {
      const [res] = await db
        .select()
        .from(schema.families)
        .where(eq(schema.families.headUserId, session.user.id))
        .limit(1);
      family = res;
    }

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
    });
  } catch (error: any) {
    console.error('Error in GET /api/families/my:', error);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
