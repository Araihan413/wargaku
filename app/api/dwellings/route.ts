import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { createDwelling, createDwellingsBulk, listDwellingsAdmin, listActiveDwellingsPublic, createAuditLog } from '@/db/queries';
import { getClientIp } from '@/lib/audit-logger';
import { z } from 'zod';

const createDwellingSchema = z.object({
  mode: z.enum(['single', 'bulk']),
  blockNumber: z.string().min(1, 'Nomor blok wajib diisi').max(20),
  houseNumber: z.string().optional().nullable(),
  type: z.enum(['permanen', 'kos', 'homestay']),
  notes: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? null : val), z.string().optional().nullable()),
  latitude: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? null : val), z.string().optional().nullable()),
  longitude: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? null : val), z.string().optional().nullable()),
  ownerUserId: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? null : val), z.string().optional().nullable()),
  ownerName: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? null : val), z.string().optional().nullable()),
  ownerPhone: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? null : val), z.string().optional().nullable()),
  startNumber: z.preprocess((val) => (val === '' ? null : val), z.number().int().positive().optional().nullable()),
  endNumber: z.preprocess((val) => (val === '' ? null : val), z.number().int().positive().optional().nullable()),
}).superRefine((data, ctx) => {
  if (data.mode === 'single') {
    if (!data.houseNumber || data.houseNumber.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['houseNumber'],
        message: 'Nomor rumah wajib diisi untuk input tunggal',
      });
    }
  } else {
    if (data.startNumber === undefined || data.startNumber === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startNumber'],
        message: 'Nomor awal wajib diisi untuk input massal',
      });
    }
    if (data.endNumber === undefined || data.endNumber === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endNumber'],
        message: 'Nomor akhir wajib diisi untuk input massal',
      });
    }
    if (data.startNumber && data.endNumber && data.startNumber > data.endNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endNumber'],
        message: 'Nomor akhir harus lebih besar atau sama dengan nomor awal',
      });
    }
  }
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (isAdmin) {
      if (!session) {
        return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
      }
      const effectiveRoleId = await getEffectiveRoleId(session);
      const isAllowed = await hasPermission(effectiveRoleId, 'view-residents');
      if (!isAllowed) {
        return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
      }

      const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
      const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
      const query = searchParams.get('query') || undefined;
      const type = (searchParams.get('type') as 'permanen' | 'kos' | 'homestay') || undefined;
      
      let isActive: boolean | undefined = undefined;
      if (searchParams.get('isActive') !== null) {
        isActive = searchParams.get('isActive') === 'true';
      }

      const result = await listDwellingsAdmin({
        limit,
        offset,
        query,
        type,
        isActive,
      });

      return NextResponse.json(result);
    }

    const formattedData = await listActiveDwellingsPublic();
    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('Error in GET /api/dwellings:', error);
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
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-dwellings');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createDwellingSchema.parse(body);

    if (validatedData.mode === 'single') {
      const dwellingId = await createDwelling({
        blockNumber: validatedData.blockNumber.toUpperCase(),
        houseNumber: validatedData.houseNumber!.trim(),
        type: validatedData.type,
        notes: validatedData.notes,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        ownerUserId: validatedData.ownerUserId,
      });

      const ipAddress = await getClientIp(request);
      const typeLabel = validatedData.type === 'kos' ? 'Rumah Kost' : validatedData.type === 'homestay' ? 'Homestay' : 'Rumah Tinggal';
      await createAuditLog({
        userId: session.user.id,
        action: 'CREATE_DWELLING',
        module: 'hunian',
        description: `Menambah hunian baru: Blok ${validatedData.blockNumber.toUpperCase()} No. ${validatedData.houseNumber!.trim()} (Tipe: ${typeLabel})`,
        ipAddress,
      });

      return NextResponse.json({ success: true, id: dwellingId, message: 'Hunian berhasil ditambahkan' }, { status: 201 });
    } else {
      const dwellingsInserted = await createDwellingsBulk({
        blockNumber: validatedData.blockNumber.toUpperCase(),
        startNumber: validatedData.startNumber!,
        endNumber: validatedData.endNumber!,
        type: validatedData.type,
      });

      const ipAddress = await getClientIp(request);
      const typeLabel = validatedData.type === 'kos' ? 'Rumah Kost' : validatedData.type === 'homestay' ? 'Homestay' : 'Rumah Tinggal';
      await createAuditLog({
        userId: session.user.id,
        action: 'CREATE_DWELLINGS_BULK',
        module: 'hunian',
        description: `Melakukan penambahan massal ${dwellingsInserted.length} unit hunian baru: Blok ${validatedData.blockNumber.toUpperCase()} No. ${validatedData.startNumber} s/d No. ${validatedData.endNumber} (Tipe: ${typeLabel})`,
        ipAddress,
      });

      return NextResponse.json({
        success: true,
        count: dwellingsInserted.length,
        message: `${dwellingsInserted.length} Hunian berhasil digenerate secara massal`,
      }, { status: 201 });
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const firstIssueMessage = error.issues[0]?.message || 'Input tidak valid';
      return NextResponse.json({ error: firstIssueMessage, issues: error.issues }, { status: 400 });
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

    console.error('Error in POST /api/dwellings:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menambahkan hunian baru. Silakan periksa kembali input Anda.' },
      { status: 400 }
    );
  }
}
