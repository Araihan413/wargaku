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
      return NextResponse.json({ error: 'Hanya Kepala Keluarga yang berhak membatalkan perubahan KK' }, { status: 403 });
    }

    // Periksa status saat ini, hanya boleh batal jika berstatus draft
    if (family.verificationStatus !== 'draft') {
      return NextResponse.json({ error: 'Pembatalan perubahan hanya dapat dilakukan jika KK berstatus Draf' }, { status: 400 });
    }

    // Pastikan KK sudah pernah diverifikasi sebelumnya
    if (!family.hasVerified) {
      return NextResponse.json({ error: 'Kartu Keluarga belum pernah diverifikasi sebelumnya' }, { status: 400 });
    }

    // Deteksi jika ada perubahan data anggota keluarga atau KK sejak draf dibuka
    const baseTime = family.draftOpenedAt ? new Date(family.draftOpenedAt).getTime() : new Date(family.updatedAt).getTime();
    
    // 1. Cek apakah ada anggota yang baru dibuat/diubah setelah draf dibuka
    const hasMemberChanges = (family.members || []).some((member) => {
      const memberUpdated = new Date(member.updatedAt).getTime();
      const memberCreated = new Date(member.createdAt).getTime();
      return memberUpdated > baseTime + 2000 || memberCreated > baseTime + 2000;
    });

    // 2. Cek apakah file KK atau detail KK lainnya diubah setelah draf dibuka
    const hasFamilyChanges = new Date(family.updatedAt).getTime() > baseTime + 2000;

    if (hasMemberChanges || hasFamilyChanges) {
      return NextResponse.json({ error: 'Tidak dapat membatalkan perubahan karena data sudah diubah' }, { status: 400 });
    }

    // Kembalikan status ke verified
    await db
      .update(schema.families)
      .set({
        verificationStatus: 'verified',
        verificationNote: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.families.id, familyId));

    return NextResponse.json({
      success: true,
      message: 'Perubahan berhasil dibatalkan dan status dikembalikan ke Terverifikasi.',
    });
  } catch (error: any) {
    console.error('Error in POST /api/families/[id]/cancel-change:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
