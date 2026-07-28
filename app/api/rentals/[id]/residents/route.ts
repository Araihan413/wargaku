import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import {
  getRentalPropertyById,
  listRentalResidents,
  getRentalResidentByNik,
  createRentalResident,
} from '@/db/queries/rental';
import { createRentalResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/mail';
import { getTenantFamilyWelcomeEmail } from '@/lib/emails/templates';

/**
 * @openapi
 * /api/rentals/{id}/residents:
 *   get:
 *     summary: Mendapatkan daftar penghuni sewa terpaginasi pada properti tertentu (Pengurus & Koordinator Kost Pemilik)
 *     tags: [Penghuni Sewa]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Properti Sewa
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Index mulai data
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Pencarian berdasarkan Nama atau NIK penghuni sewa
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter status aktif/tidak aktif (check-out)
 *     responses:
 *       200:
 *         description: Daftar penghuni sewa berhasil diambil
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses ke properti ini
 *       404:
 *         description: Properti sewa tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   post:
 *     summary: Mendaftarkan check-in penghuni sewa baru (Pengurus & Koordinator Kost Pemilik)
 *     tags: [Penghuni Sewa]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Properti Sewa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantType
 *               - name
 *               - nik
 *               - phone
 *               - roomNumber
 *               - checkInDate
 *             properties:
 *               tenantType:
 *                 type: string
 *                 enum: [perorangan, keluarga]
 *                 description: Tipe penyewa
 *               name:
 *                 type: string
 *                 description: Nama lengkap penyewa
 *               nik:
 *                 type: string
 *                 description: NIK penyewa
 *               phone:
 *                 type: string
 *                 description: Nomor telepon penyewa
 *               roomNumber:
 *                 type: string
 *                 description: Nomor/nama kamar yang disewa
 *               checkInDate:
 *                 type: string
 *                 format: date
 *                 description: Tanggal check-in
 *               familyCardFile:
 *                 type: string
 *                 description: URL/path file kartu keluarga
 *               identityCardFile:
 *                 type: string
 *                 description: URL/path file KTP
 *               employmentCertificateFile:
 *                 type: string
 *                 description: URL/path file surat keterangan kerja (opsional)
 *               marriageCertificateFile:
 *                 type: string
 *                 description: URL/path file surat nikah (opsional)
 *     responses:
 *       201:
 *         description: Penyewa berhasil melakukan check-in
 *       400:
 *         description: Validasi input gagal atau NIK sudah terdaftar
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses atau kapasitas kamar penuh
 *       404:
 *         description: Properti sewa tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
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

    // Check authorization: RT/Admin (manage-boarding), coordinator, or owner
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

    // Check write authorization: RT/Admin (manage-boarding) or direct coordinator
    const isGlobalAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator) {
      return NextResponse.json({ error: 'Hanya pengelola (koordinator) atau pengurus RT yang dapat mendaftarkan check-in' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createRentalResidentSchema.parse(body);

    // Drizzle date() columns accept a Date object directly — no manual string conversion needed
    const checkInDate = validatedData.checkInDate instanceof Date
      ? validatedData.checkInDate
      : new Date(String(validatedData.checkInDate));

    // 1. Validasi NIK Unik
    const existingResident = await getRentalResidentByNik(validatedData.nik);
    if (existingResident) {
      return NextResponse.json(
        { error: `NIK ${validatedData.nik} sudah terdaftar di sistem kependudukan.` },
        { status: 400 }
      );
    }

    // 2. Validasi Batas Kapasitas Kamar
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

      // a. Check if NIK or Email already exists in users table
      const existingUserByEmail = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, validatedData.email))
        .limit(1);
      if (existingUserByEmail.length > 0) {
        return NextResponse.json({ error: `Email ${validatedData.email} sudah terdaftar di sistem.` }, { status: 400 });
      }

      const existingUserByNik = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.nik, validatedData.nik))
        .limit(1);
      if (existingUserByNik.length > 0) {
        return NextResponse.json({ error: `NIK ${validatedData.nik} sudah terdaftar di sistem.` }, { status: 400 });
      }

      // b. Generate random temporary password
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(randomPassword);

      // c. Transactional insertion
      await db.transaction(async (tx) => {
        const userId = crypto.randomUUID();

        // 1. Create user
        await tx.insert(schema.users).values({
          id: userId,
          name: validatedData.name,
          email: validatedData.email!,
          password: hashedPassword,
          nik: validatedData.nik,
          phone: validatedData.phone || null,
          roleId: 6, // Warga
          status: 'active', // Active so they can log in
          dwellingId: property.dwellingId,
          unitNumber: validatedData.roomNumber || null,
        });

        // 2. Create account (Better Auth credential provider)
        await tx.insert(schema.accounts).values({
          id: crypto.randomUUID(),
          accountId: validatedData.email!,
          providerId: 'credential',
          userId: userId,
          password: hashedPassword,
        });

        // 3. Create family
        const [insertFamily] = await tx.insert(schema.families).values({
          dwellingId: property.dwellingId,
          familyNumber: validatedData.nik,
          headUserId: userId,
          headName: validatedData.name,
          unitNumber: validatedData.roomNumber || null,
          verificationStatus: 'draft',
          checkInDate: checkInDate,
          isActive: true,
        });
        const familyId = insertFamily.insertId;

        // 4. Create single resident entry for family tenant in residents table
        const [insertResident] = await tx.insert(schema.residents).values({
          rentalPropertyId: propertyId,
          dwellingId: property.dwellingId,
          familyId: familyId,
          userId: userId,
          residentType: 'sewa_keluarga',
          relationship: 'Kepala_Keluarga',
          name: validatedData.name,
          nik: validatedData.nik,
          gender: 'L',
          phone: validatedData.phone || null,
          roomNumber: validatedData.roomNumber || null,
          checkInDate: checkInDate,
          ktpFile: null, // No KTP file initially
          verificationStatus: 'pending',
          createdBy: session.user.id,
          isActive: true,
          notes: validatedData.notes || null,
        });
        residentId = insertResident.insertId;
      });

      // d. Send welcome email with login credentials
      const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const loginLink = `${origin}/login`;
      try {
        await sendEmail({
          to: { email: validatedData.email, name: validatedData.name },
          subject: "Akun Keluarga Penyewa Wargaku Berhasil Dibuat",
          htmlContent: getTenantFamilyWelcomeEmail(validatedData.name, validatedData.email, randomPassword, loginLink),
        });
      } catch (mailErr) {
        console.error("Gagal mengirim email kredensial penyewa:", mailErr);
      }
    } else {
      // Tipe perorangan
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
