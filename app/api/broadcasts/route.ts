import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import {
  getActiveBroadcastsForUser,
  listAllBroadcastsAdmin,
  createBroadcast,
} from '@/db/queries/system/broadcast.queries';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

/**
 * @openapi
 * /api/broadcasts:
 *   get:
 *     summary: Mendapatkan daftar broadcast sistem aktif
 *     description: Mengambil notifikasi broadcast sistem yang aktif dan belum di-dismiss oleh pengguna yang sedang login. Jika role = Super Admin dan query `admin=true`, mengembalikan seluruh riwayat broadcast.
 *     tags:
 *       - Broadcast Sistem
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar broadcast
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 *   post:
 *     summary: Membuat broadcast sistem baru (Super Admin)
 *     description: Membuat pengumuman sistem baru untuk ditampilkan sebagai banner di dashboard seluruh warga. Membutuhkan role Super Admin.
 *     tags:
 *       - Broadcast Sistem
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [info, maintenance, feature, warning]
 *               sendPush:
 *                 type: boolean
 *               sendInAppNotif:
 *                 type: boolean
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Broadcast berhasil dibuat
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki hak akses Super Admin
 *       500:
 *         description: Kesalahan server internal
 */

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';

    if (isAdmin) {
      const effectiveRoleId = await getEffectiveRoleId(session);
      const isAllowed = await hasPermission(effectiveRoleId, 'manage-system-config');
      if (!isAllowed) {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
      }
      const broadcasts = await listAllBroadcastsAdmin();
      return NextResponse.json(broadcasts);
    }

    const activeBroadcasts = await getActiveBroadcastsForUser(session.user.id);
    return NextResponse.json(activeBroadcasts);
  } catch (error: any) {
    console.error('Error in GET /api/broadcasts:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
      return NextResponse.json(
        { error: 'Hanya pengelola sistem yang diizinkan membuat broadcast sistem' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, message, type, sendPush, sendInAppNotif, expiresAt } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Judul dan pesan broadcast wajib diisi' },
        { status: 400 }
      );
    }

    const broadcastId = await createBroadcast({
      title: title.trim(),
      message: message.trim(),
      type: type || 'info',
      sendPush: !!sendPush,
      sendInAppNotif: !!sendInAppNotif,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: session.user.id,
    });

    const ipAddress = await getClientIp(request);
    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE_SYSTEM_BROADCAST',
      module: 'sistem',
      description: `Membuat broadcast sistem baru: "${title}" (Kategori: ${type || 'info'})`,
      ipAddress,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Broadcast sistem berhasil dibuat',
        broadcastId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/broadcasts:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
