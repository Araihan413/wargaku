import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getFamilyById } from '@/db/queries/kependudukan';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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
      return NextResponse.json({ error: 'Hanya Kepala Keluarga yang berhak membatalkan pengajuan berkas KK' }, { status: 403 });
    }

    // Periksa status saat ini, hanya boleh batal jika berstatus pending
    if (family.verificationStatus !== 'pending') {
      return NextResponse.json({ error: 'Pengajuan tidak dapat dibatalkan karena tidak berstatus pending' }, { status: 400 });
    }

    // Ubah status verifikasi kembali ke draft
    await db
      .update(schema.families)
      .set({
        verificationStatus: 'draft',
        verificationNote: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.families.id, familyId));

    // Hapus notifikasi "Verifikasi KK Baru" yang dikirim ke RT
    try {
      await db
        .delete(schema.notifications)
        .where(
          and(
            eq(schema.notifications.redirectLink, `/dashboard/approvals/documents/${familyId}`),
            eq(schema.notifications.category, 'dinas')
          )
        );
    } catch (notifErr) {
      console.error("Failed to delete notifications on cancel-submit:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Pengajuan verifikasi Kartu Keluarga berhasil dibatalkan dan dikembalikan ke Draf.',
    });
  } catch (error: any) {
    console.error('Error in POST /api/families/[id]/cancel-submit:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
