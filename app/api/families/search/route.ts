import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

/**
 * GET /api/families/search?kk=...
 * Memverifikasi No. KK secara persis (exact match 16 digit).
 * Menggantikan sistem autocomplete (LIKE) untuk keamanan privasi agar orang tidak bisa menebak data warga.
 */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kk = searchParams.get('kk')?.replace(/\D/g, '') ?? '';

    if (kk.length !== 16) {
      return NextResponse.json({ error: 'Nomor KK harus 16 digit angka' }, { status: 400 });
    }

    const [family] = await db
      .select({
        id: schema.families.id,
        familyNumber: schema.families.familyNumber,
        headName: schema.users.name,
        headNik: schema.familyMembers.nik,
        dwellingId: schema.families.dwellingId,
        verificationStatus: schema.families.verificationStatus,
      })
      .from(schema.families)
      .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
      .leftJoin(
        schema.familyMembers,
        and(
          eq(schema.familyMembers.familyId, schema.families.id),
          eq(schema.familyMembers.relationship, 'Kepala_Keluarga')
        )
      )
      .where(
        and(
          eq(schema.families.isActive, true),
          isNotNull(schema.families.headUserId),
          eq(schema.families.familyNumber, kk)
        )
      )
      .limit(1);

    if (!family) {
       return NextResponse.json({ found: false });
    }

    // Masking NIK untuk keamanan ekstra (hanya tampilkan 4 digit awal dan 4 digit akhir)
    let maskedNik = null;
    if (family.headNik) {
       maskedNik = family.headNik.substring(0, 4) + '********' + family.headNik.substring(12);
    }

    return NextResponse.json({
       found: true,
       data: {
          ...family,
          headNik: maskedNik
       }
    });

  } catch (error: any) {
    console.error('Error in GET /api/families/search:', error);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}

