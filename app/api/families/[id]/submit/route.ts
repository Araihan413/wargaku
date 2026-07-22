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
      return NextResponse.json({ error: 'Hanya Kepala Keluarga yang berhak mengirimkan berkas KK' }, { status: 403 });
    }

    // Pastikan berkas KK sudah diunggah
    if (!family.kkFile) {
      return NextResponse.json({ error: 'Harap unggah berkas Scan KK terlebih dahulu sebelum mengirim' }, { status: 400 });
    }

    // Periksa status saat ini, hanya boleh kirim jika berstatus draft atau rejected
    if (family.verificationStatus !== 'draft' && family.verificationStatus !== 'rejected') {
      return NextResponse.json({ error: 'Data KK sudah dikirim atau sedang dalam proses verifikasi' }, { status: 400 });
    }

    // Ubah status verifikasi ke pending
    await db
      .update(schema.families)
      .set({
        verificationStatus: 'pending',
        verificationNote: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.families.id, familyId));

    return NextResponse.json({
      success: true,
      message: 'Berkas Kartu Keluarga berhasil dikirim ke Ketua RT untuk verifikasi.',
    });
  } catch (error: any) {
    console.error('Error in POST /api/families/[id]/submit:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
