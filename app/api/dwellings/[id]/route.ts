import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { updateDwelling, deleteDwelling } from '@/db/queries/kependudukan';
import { z } from 'zod';

const updateDwellingSchema = z.object({
  blockNumber: z.string().min(1, 'Nomor blok wajib diisi').max(20),
  houseNumber: z.string().min(1, 'Nomor rumah wajib diisi').max(20),
  type: z.enum(['permanen', 'kos', 'homestay']),
  isActive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth and permission check
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

    const { id } = await params;
    const dwellingId = Number(id);

    // 2. Validate body
    const body = await request.json();
    const validatedData = updateDwellingSchema.parse(body);

    await updateDwelling(dwellingId, {
      blockNumber: validatedData.blockNumber.toUpperCase(),
      houseNumber: validatedData.houseNumber.trim(),
      type: validatedData.type,
      isActive: validatedData.isActive,
      notes: validatedData.notes,
    });

    return NextResponse.json({ success: true, message: 'Data hunian berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in PUT /api/dwellings/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth and permission check
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

    const { id } = await params;
    const dwellingId = Number(id);

    await deleteDwelling(dwellingId);

    return NextResponse.json({ success: true, message: 'Hunian berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in DELETE /api/dwellings/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
