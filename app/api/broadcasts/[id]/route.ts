import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { updateBroadcast, deleteBroadcast } from '@/db/queries/system/broadcast.queries';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

/**
 * @openapi
 * /api/broadcasts/{id}:
 *   patch:
 *     summary: Memperbarui atau menonaktifkan broadcast sistem (Super Admin)
 *     description: Mengubah status isActive, teks, atau jenis broadcast sistem. Membutuhkan izin manage-system-config.
 *     tags:
 *       - Broadcast Sistem
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Broadcast berhasil diperbarui
 *       403:
 *         description: Tidak memiliki akses
 *   delete:
 *     summary: Menghapus broadcast sistem (Super Admin)
 *     description: Menghapus baris broadcast dari sistem. Membutuhkan izin manage-system-config.
 *     tags:
 *       - Broadcast Sistem
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Broadcast berhasil dihapus
 *       403:
 *         description: Tidak memiliki akses
 */

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-system-config');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const broadcastId = parseInt(id);

    if (isNaN(broadcastId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    await updateBroadcast(broadcastId, body);

    const ipAddress = await getClientIp(request);
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE_SYSTEM_BROADCAST',
      module: 'sistem',
      description: `Memperbarui status/isi broadcast sistem ID #${broadcastId}`,
      ipAddress,
    });

    return NextResponse.json({ success: true, message: 'Broadcast berhasil diperbarui' });
  } catch (error: any) {
    console.error('Error in PATCH /api/broadcasts/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-system-config');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const broadcastId = parseInt(id);

    if (isNaN(broadcastId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    await deleteBroadcast(broadcastId);

    const ipAddress = await getClientIp(request);
    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE_SYSTEM_BROADCAST',
      module: 'sistem',
      description: `Menghapus broadcast sistem ID #${broadcastId}`,
      ipAddress,
    });

    return NextResponse.json({ success: true, message: 'Broadcast berhasil dihapus' });
  } catch (error: any) {
    console.error('Error in DELETE /api/broadcasts/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
