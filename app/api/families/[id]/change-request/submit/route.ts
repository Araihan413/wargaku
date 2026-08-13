import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getFamilyById } from '@/db/queries/population/family.queries';
import { getUserById } from '@/db/queries/auth/user.queries';
import {
  getActiveChangeRequest,
  submitChangeRequest,
} from '@/db/queries/population/family-change-request.queries';
import { notifyRoles } from '@/lib/notifications';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familyId = Number(id);

    if (isNaN(familyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const currentUser = await getUserById(session.user.id);
    if (!currentUser || currentUser.status !== 'active') {
      return NextResponse.json(
        { error: 'Akun Anda belum aktif atau sedang ditangguhkan' },
        { status: 403 }
      );
    }

    const activeRequest = await getActiveChangeRequest(familyId);
    if (!activeRequest) {
      return NextResponse.json(
        { error: 'Tidak ada permohonan perubahan data yang sedang aktif' },
        { status: 404 }
      );
    }

    if (activeRequest.headUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    await submitChangeRequest(activeRequest.id, session.user.id);
    const family = await getFamilyById(familyId).catch(() => null);
    notifyRoles(['ketua-rt', 'sekretaris'], {
      title: 'Permohonan Perubahan Data KK Baru',
      message: `Kepala Keluarga ${session.user.name || 'Warga'} mengajukan permohonan perubahan data KK${family?.familyNumber ? ` No. ${family.familyNumber}` : ''} untuk diverifikasi.`,
      category: 'dinas',
      redirectLink: `/dashboard/approvals/documents/${familyId}?changeRequestId=${activeRequest.id}`,
    });

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'SUBMIT_FAMILY_CHANGE_REQUEST',
      module: 'kependudukan',
      description: `${session.user.name} mengirimkan permohonan perubahan data Kartu Keluarga ID #${familyId} untuk diverifikasi RT.`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Permohonan perubahan data Kartu Keluarga berhasil dikirim ke Ketua RT untuk verifikasi.',
    });
  } catch (error: any) {
    if (error.message === 'NO_KK_FILE') {
      return NextResponse.json({ error: 'Harap unggah berkas Scan KK terlebih dahulu sebelum mengirim' }, { status: 400 });
    }
    if (error.message === 'NO_ACTIVE_MEMBERS') {
      return NextResponse.json({ error: 'Kartu Keluarga harus memiliki minimal 1 anggota keluarga yang aktif' }, { status: 400 });
    }
    if (error.message === 'INVALID_STATUS') {
      return NextResponse.json({ error: 'Permohonan sedang dalam proses verifikasi atau status tidak valid' }, { status: 400 });
    }
    console.error('Error in POST /api/families/[id]/change-request/submit:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
