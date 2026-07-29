import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { listCoordinators, createCoordinator, createCoordinatorSchema } from '@/db/queries/coordinators';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const isAllowed =
      (await hasPermission(session.user.roleId, 'view-residents')) ||
      (await hasPermission(session.user.roleId, 'view-dwelling-details')) ||
      (await hasPermission(session.user.roleId, 'manage-dwellings'));

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const coordinators = await listCoordinators();

    return NextResponse.json(coordinators);
  } catch (error: any) {
    console.error('Error in GET /api/coordinators:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
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

    const isAllowed = await hasPermission(session.user.roleId, 'manage-dwellings');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createCoordinatorSchema.parse(body);

    const { targetUserId, isNewUserCreated, generatedPassword, emailSentSuccessfully } =
      await createCoordinator(validated);

    return NextResponse.json({
      success: true,
      message: isNewUserCreated
        ? 'Akun koordinator baru berhasil dibuat dan didaftarkan.'
        : 'Pengguna berhasil dipromosikan sebagai koordinator.',
      data: {
        userId: targetUserId,
        isNewUserCreated,
        generatedPassword: generatedPassword || null,
        emailSent: emailSentSuccessfully,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', issues: error.issues }, { status: 400 });
    }
    if (error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'Pengguna yang dipilih tidak ditemukan' }, { status: 404 });
    }
    console.error('Error in POST /api/coordinators:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
