import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { getDwellingById, updateDwelling, deleteDwelling, validateAndChangeDwellingType } from '@/db/queries/population/dwelling.queries';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';
import { z } from 'zod';

const updateDwellingSchema = z.object({
  blockNumber: z.string().min(1, 'Nomor blok wajib diisi').max(20),
  houseNumber: z.string().min(1, 'Nomor rumah wajib diisi').max(20),
  type: z.enum(['permanen', 'kos', 'homestay']),
  isActive: z.boolean().optional(),
  notes: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? null : val), z.string().optional().nullable()),
  latitude: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? null : val), z.string().optional().nullable()),
  longitude: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? null : val), z.string().optional().nullable()),
  ownerUserId: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? null : val), z.string().optional().nullable()),
  ownerName: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? null : val), z.string().optional().nullable()),
  ownerPhone: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? null : val), z.string().optional().nullable()),
});

export async function PUT(
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
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-dwellings');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { id } = await params;
    const dwellingId = Number(id);

    const body = await request.json();
    const validatedData = updateDwellingSchema.parse(body);

    const currentDwelling = await getDwellingById(dwellingId);
    if (!currentDwelling) {
      return NextResponse.json({ error: 'Hunian tidak ditemukan' }, { status: 404 });
    }

    try {
      await validateAndChangeDwellingType(dwellingId, currentDwelling.type, validatedData.type);
    } catch (err: any) {
      if (err.message === 'HAS_ACTIVE_FAMILIES') {
        return NextResponse.json(
          { error: 'Tipe hunian permanen tidak dapat diubah menjadi kos/homestay selama terdapat Kartu Keluarga aktif yang terdaftar di hunian ini.' },
          { status: 400 }
        );
      }
      if (err.message === 'HAS_ACTIVE_TENANTS') {
        return NextResponse.json(
          { error: 'Tipe kos/homestay tidak dapat diubah selama terdapat penghuni sewa aktif. Silakan check-out semua penghuni sewa terlebih dahulu.' },
          { status: 400 }
        );
      }
      throw err;
    }

    await updateDwelling(dwellingId, {
      blockNumber: validatedData.blockNumber.toUpperCase(),
      houseNumber: validatedData.houseNumber.trim(),
      type: validatedData.type,
      isActive: validatedData.isActive,
      notes: validatedData.notes,
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      ownerUserId: validatedData.ownerUserId,
    });

    const ipAddress = await getClientIp(request);
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE_DWELLING',
      module: 'hunian',
      description: `Memperbarui data hunian ID #${dwellingId}: Blok ${validatedData.blockNumber.toUpperCase()} No. ${validatedData.houseNumber.trim()}`,
      ipAddress,
    });

    return NextResponse.json({ success: true, message: 'Data hunian berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', issues: error.issues }, { status: 400 });
    }

    const errMsg = error.message || '';
    if (
      errMsg.includes('DWELLING_ADDRESS_EXISTS') ||
      errMsg.includes('ER_DUP_ENTRY') ||
      errMsg.includes('unique_address_idx')
    ) {
      let block = '';
      let house = '';
      if (errMsg.includes('DWELLING_ADDRESS_EXISTS:')) {
        const parts = errMsg.split(':');
        block = parts[1] || '';
        house = parts[2] || '';
      }
      const addressLabel = block && house ? `Blok ${block} No. ${house}` : 'tersebut';
      return NextResponse.json(
        { error: `Alamat hunian (${addressLabel}) sudah terdaftar di sistem. Silakan gunakan kombinasi Blok dan Nomor Rumah lain.` },
        { status: 400 }
      );
    }

    console.error('Error in PUT /api/dwellings/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
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
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-dwellings');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { id } = await params;
    const dwellingId = Number(id);

    const currentDwelling = await getDwellingById(dwellingId);
    if (!currentDwelling) {
      return NextResponse.json({ error: 'Hunian tidak ditemukan' }, { status: 404 });
    }

    // Pengecekan penghuni aktif sebelum menonaktifkan hunian
    if (currentDwelling.type === 'permanen' && 'families' in currentDwelling && currentDwelling.families && currentDwelling.families.length > 0) {
      return NextResponse.json({ error: 'Gagal menonaktifkan hunian. Masih terdapat Kartu Keluarga aktif yang terdaftar di hunian ini. Harap pindahkan atau nonaktifkan KK terlebih dahulu.' }, { status: 400 });
    }

    if ((currentDwelling.type === 'kos' || currentDwelling.type === 'homestay') && 'property' in currentDwelling && currentDwelling.property && currentDwelling.property.activeTenants > 0) {
      return NextResponse.json({ error: 'Gagal menonaktifkan hunian. Masih terdapat penghuni sewa yang aktif. Harap proses check-out seluruh penyewa terlebih dahulu.' }, { status: 400 });
    }

    await deleteDwelling(dwellingId);

    const ipAddress = await getClientIp(request);
    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE_DWELLING',
      module: 'hunian',
      description: `Menonaktifkan hunian ID #${dwellingId}: Blok ${currentDwelling.blockNumber} No. ${currentDwelling.houseNumber}`,
      ipAddress,
    });

    return NextResponse.json({ success: true, message: 'Hunian berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in DELETE /api/dwellings/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
