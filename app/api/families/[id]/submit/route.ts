import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { submitFamily, getFamilyById } from '@/db/queries/population/family.queries';
import { notifyRoles } from '@/lib/notifications';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

/**
 * @openapi
 * /api/families/{id}/submit:
 *   post:
 *     summary: Mengajukan verifikasi Kartu Keluarga ke RT
 *     description: Mengirimkan data Kartu Keluarga (yang berstatus draft) untuk diverifikasi oleh Ketua RT. Membutuhkan file scan KK yang sudah diunggah.
 *     tags:
 *       - Kepala Keluarga
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kartu Keluarga
 *     responses:
 *       200:
 *         description: Berkas Kartu Keluarga berhasil dikirim ke Ketua RT
 *       400:
 *         description: Harap unggah berkas Scan KK terlebih dahulu atau status tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Hanya Kepala Keluarga yang berhak mengirimkan
 *       404:
 *         description: Kartu Keluarga tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
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

    await submitFamily(familyId, session.user.id);

    // Notifikasi ke Ketua RT + Sekretaris bahwa ada berkas KK baru menunggu verifikasi
    const family = await getFamilyById(familyId).catch(() => null);
    notifyRoles(["ketua-rt", "sekretaris"], {
      title: "Berkas KK Menunggu Verifikasi",
      message: `Berkas Kartu Keluarga${family?.familyNumber ? ` No. ${family.familyNumber}` : ''} telah dikirim oleh ${session.user.name || 'Warga'} untuk verifikasi.`,
      category: "dinas",
      redirectLink: "/dashboard/approvals/verification",
    });

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'SUBMIT_FAMILY',
      module: 'kependudukan',
      description: `${session.user.name} mengajukan verifikasi Kartu Keluarga ID #${familyId}${family?.familyNumber ? ` (No. KK: ${family.familyNumber})` : ''}.`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Berkas Kartu Keluarga berhasil dikirim ke Ketua RT untuk verifikasi.',
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Hanya Kepala Keluarga yang berhak mengirimkan berkas KK' }, { status: 403 });
    }
    if (error.message === 'NO_KK_FILE') {
      return NextResponse.json({ error: 'Harap unggah berkas Scan KK terlebih dahulu sebelum mengirim' }, { status: 400 });
    }
    if (error.message === 'INVALID_STATUS') {
      return NextResponse.json({ error: 'Data KK sudah dikirim atau sedang dalam proses verifikasi' }, { status: 400 });
    }
    console.error('Error in POST /api/families/[id]/submit:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
