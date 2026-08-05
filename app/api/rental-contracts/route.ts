import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { getRentalPropertyById } from '@/db/queries/property/rental-property.queries';
import {
  listTenantContracts,
  createTenantContract,
  createFamilyTenantWithUser,
  terminateTenantContract,
} from '@/db/queries/property/tenant.queries';
import { createRentalResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';
import { notifyRoles } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('rentalPropertyId') || searchParams.get('propertyId');
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;

    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    const propertyId = propertyIdParam ? Number(propertyIdParam) : 0;
    const result = await listTenantContracts({
      rentalPropertyId: propertyId,
      limit,
      offset,
      isActive,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/rental-contracts:', error);
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

    const body = await request.json();
    const validatedData: any = createRentalResidentSchema.parse(body);

    const rentalPropId = validatedData.rentalPropertyId || validatedData.dwellingId;
    const property = await getRentalPropertyById(rentalPropId);
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

    const checkInDate = new Date(validatedData.checkInDate);
    let contractId: number;

    if (validatedData.tenantType === 'keluarga' || validatedData.tenantType === 'family') {
      if (!validatedData.email) {
        return NextResponse.json({ error: 'Email Kepala Keluarga wajib diisi untuk tipe sewa keluarga' }, { status: 400 });
      }

      const requestOrigin = request.headers.get('origin') || undefined;
      contractId = await createFamilyTenantWithUser(
        {
          rentalPropertyId: rentalPropId,
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
        rentalPropertyId: rentalPropId,
        roomNumber: validatedData.roomNumber || '',
        tenantType: 'individual',
        individualName: validatedData.name,
        individualNik: validatedData.nik,
        individualPhone: validatedData.phone,
        individualKtpFile: validatedData.ktpFile,
        checkInDate,
      });
    }

    await notifyRoles(['1', '2'], {
      title: 'Pendaftaran Penghuni Kos Baru',
      message: `Penghuni baru (${validatedData.name}) telah didaftarkan di ${property.name}.`,
      redirectLink: '/dashboard/rentals',
    });

    return NextResponse.json(
      { message: 'Penghuni sewa berhasil didaftarkan', contractId },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Error in POST /api/rental-contracts:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractIdParam = searchParams.get('id');

    if (!contractIdParam) {
      return NextResponse.json({ error: 'ID Kontrak wajib diisi' }, { status: 400 });
    }

    const contractId = Number(contractIdParam);
    await terminateTenantContract(contractId);

    return NextResponse.json({ message: 'Kontrak sewa berhasil diakhiri' });
  } catch (error: any) {
    console.error('Error in DELETE /api/rental-contracts:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
