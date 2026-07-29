import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import {
  getRentalPropertyById,
  listRentalResidents,
  getRentalResidentByNik,
  createRentalResident,
  createFamilyRentalResident,
} from '@/db/queries/rental';
import { createRentalResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

export async function GET(
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

    const { id } = await params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const isGlobalAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;
    const isOwner = property.dwelling?.ownerUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator && !isOwner) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
    const query = searchParams.get('query') || undefined;

    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    const result = await listRentalResidents({
      rentalPropertyId: propertyId,
      limit,
      offset,
      isActive,
      query,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/rentals/[id]/residents:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

export async function POST(
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

    const { id } = await params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const isGlobalAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator) {
      return NextResponse.json({ error: 'Hanya pengelola (koordinator) atau pengurus RT yang dapat mendaftarkan check-in' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createRentalResidentSchema.parse(body);

    const checkInDate = validatedData.checkInDate instanceof Date
      ? validatedData.checkInDate
      : new Date(String(validatedData.checkInDate));

    const existingResident = await getRentalResidentByNik(validatedData.nik);
    if (existingResident) {
      return NextResponse.json(
        { error: `NIK ${validatedData.nik} sudah terdaftar di sistem kependudukan.` },
        { status: 400 }
      );
    }

    if (property.activeResidentsCount >= property.totalRooms) {
      return NextResponse.json(
        { error: 'Kamar penuh, kapasitas properti sewa telah maksimum' },
        { status: 403 }
      );
    }

    let residentId: number;

    if (validatedData.tenantType === 'keluarga') {
      if (!validatedData.email) {
        return NextResponse.json({ error: 'Email Kepala Keluarga wajib diisi untuk tipe sewa keluarga' }, { status: 400 });
      }

      const requestOrigin = request.headers.get("origin") || undefined;
      residentId = await createFamilyRentalResident(validatedData, property, checkInDate, session.user.id, requestOrigin);
    } else {
      residentId = await createRentalResident({
        ...validatedData,
        checkInDate: checkInDate,
        rentalPropertyId: propertyId,
        createdBy: session.user.id,
      });
    }

    return NextResponse.json(
      { id: residentId!, message: 'Penyewa berhasil melakukan check-in' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate entry'))) {
      return NextResponse.json(
        { error: 'NIK atau Email sudah terdaftar di sistem kependudukan. Silakan periksa kembali data Anda.' },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/rentals/[id]/residents:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
