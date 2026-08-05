import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { getRentalPropertyById } from '@/db/queries/property/rental-property.queries';
import {
  listTenantContracts,
  createTenantContract,
  createFamilyTenantWithUser,
} from '@/db/queries/property/tenant.queries';
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

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
    const query = searchParams.get('query') || undefined;

    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    const result = await listTenantContracts({
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

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isGlobalAllowed = await hasPermission(effectiveRoleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;
    const isOwner = property.dwelling?.ownerUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator && !isOwner) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses untuk menambah penghuni di properti ini' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData: any = createRentalResidentSchema.parse(body);

    const checkInDate = new Date(validatedData.checkInDate);
    let contractId: number;

    if (validatedData.tenantType === 'keluarga' || validatedData.tenantType === 'family') {
      if (!validatedData.email) {
        return NextResponse.json({ error: 'Email Kepala Keluarga wajib diisi untuk tipe sewa keluarga' }, { status: 400 });
      }

      const requestOrigin = request.headers.get('origin') || undefined;
      contractId = await createFamilyTenantWithUser(
        {
          rentalPropertyId: propertyId,
          roomNumber: validatedData.roomNumber || '',
          tenantType: 'family',
          name: validatedData.name,
          email: validatedData.email,
          nik: validatedData.nik,
          phone: validatedData.phone,
          dwellingId: property.dwellingId,
          checkInDate,
        },
        requestOrigin
      );
    } else {
      contractId = await createTenantContract({
        rentalPropertyId: propertyId,
        roomNumber: validatedData.roomNumber || '',
        tenantType: 'individual',
        individualName: validatedData.name,
        individualNik: validatedData.nik,
        individualGender: validatedData.gender,
        individualBirthPlace: validatedData.birthPlace,
        individualBirthDate: validatedData.birthDate,
        individualPhone: validatedData.phone,
        individualKtpFile: validatedData.ktpFile,
        checkInDate,
      });
    }

    return NextResponse.json({ message: 'Penghuni sewa berhasil didaftarkan', id: contractId }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Error in POST /api/rentals/[id]/residents:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
