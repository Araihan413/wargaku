import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getFamilyById } from '@/db/queries/kependudukan';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    const family = await getFamilyById(familyId);
    if (!family) {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }

    // Pastikan user adalah Kepala Keluarga atau pemilik KK ini
    if (family.headUserId !== session.user.id) {
      return NextResponse.json({ error: 'Hanya Kepala Keluarga yang berhak mengajukan perubahan data' }, { status: 403 });
    }

    // Ubah status verifikasi kembali ke draft agar pengurusan edit/upload KK terbuka
    await db
      .update(schema.families)
      .set({
        verificationStatus: 'draft',
        verificationNote: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.families.id, familyId));

    return NextResponse.json({
      success: true,
      message: 'Permohonan perubahan data berhasil diajukan. Halaman kelola data telah dibuka kembali.',
    });
  } catch (error: any) {
    console.error('Error in POST /api/families/[id]/request-change:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
