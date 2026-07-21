import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dwellings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { createDwelling, createDwellingsBulk, listDwellingsAdmin } from '@/db/queries/kependudukan';
import { z } from 'zod';

const createDwellingSchema = z.object({
  mode: z.enum(['single', 'bulk']),
  blockNumber: z.string().min(1, 'Nomor blok wajib diisi').max(20),
  houseNumber: z.string().optional().nullable(),
  type: z.enum(['permanen', 'kos', 'homestay']),
  notes: z.string().optional().nullable(),
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

    // 1. Get Session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (isAdmin) {
      // Check auth and permissions for admin view
      if (!session) {
        return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
      }
      const isAllowed = await hasPermission(session.user.roleId, 'view-residents');
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

    // 2. Public view: return simple dropdown list
    const activeDwellings = await db
      .select({
        id: dwellings.id,
        blockNumber: dwellings.blockNumber,
        houseNumber: dwellings.houseNumber,
        type: dwellings.type,
      })
      .from(dwellings)
      .where(eq(dwellings.isActive, true));

    // Format label dropdown
    const formattedData = activeDwellings.map((d) => {
      const label = `Blok ${d.blockNumber} No. ${d.houseNumber}`;
      return {
        id: d.id,
        label,
        blockNumber: d.blockNumber,
        houseNumber: d.houseNumber,
        type: d.type,
      };
    });

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

    // 2. Validate body
    const body = await request.json();
    const validatedData = createDwellingSchema.parse(body);

    if (validatedData.mode === 'single') {
      const dwellingId = await createDwelling({
        blockNumber: validatedData.blockNumber.toUpperCase(),
        houseNumber: validatedData.houseNumber!.trim(),
        type: validatedData.type,
        notes: validatedData.notes,
      });
      return NextResponse.json({ success: true, id: dwellingId, message: 'Hunian berhasil ditambahkan' }, { status: 201 });
    } else {
      const dwellingsInserted = await createDwellingsBulk({
        blockNumber: validatedData.blockNumber.toUpperCase(),
        startNumber: validatedData.startNumber!,
        endNumber: validatedData.endNumber!,
        type: validatedData.type,
      });
      return NextResponse.json({
        success: true,
        count: dwellingsInserted.length,
        message: `${dwellingsInserted.length} Hunian berhasil digenerate secara massal`,
      }, { status: 201 });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/dwellings:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 400 }
    );
  }
}
