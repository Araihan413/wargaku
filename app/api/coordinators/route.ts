import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, sql, or } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { sendEmail } from '@/lib/mail';
import { getCoordWelcomeWithPasswordEmail } from '@/lib/emails/templates';
import { z } from 'zod';

const createCoordinatorSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid').max(100),
  nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
  phone: z.string().min(10, 'Nomor HP minimal 10 digit').max(15).optional().nullable(),
  existingUserId: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    // Hanya RT/Admin yang boleh mengelola koordinator
    const isAllowed = await hasPermission(session.user.roleId, 'manage-dwellings');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const coordinators = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        phone: schema.users.phone,
        nik: schema.users.nik,
        status: schema.users.status,
        createdAt: schema.users.createdAt,
        propertiesCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${schema.rentalProperties} rp 
          WHERE rp.coordinator_user_id = ${schema.users.id}
            AND rp.is_active = true
        )`.mapWith(Number)
      })
      .from(schema.users)
      .where(eq(schema.users.roleId, 5))
      .orderBy(schema.users.name);

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

    let targetUserId = validated.existingUserId;
    let isNewUserCreated = false;
    let generatedPassword = "";
    let emailSentSuccessfully = false;

    // A. JIKA MEMASUKKAN USER YANG SUDAH TERDAFTAR AKUNNYA DI TABEL USERS
    if (targetUserId) {
      const [existingUser] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, targetUserId))
        .limit(1);

      if (!existingUser) {
        return NextResponse.json({ error: 'Pengguna yang dipilih tidak ditemukan' }, { status: 404 });
      }

      // Update role menjadi Koordinator Kos (5) dan status menjadi active
      await db
        .update(schema.users)
        .set({
          roleId: 5,
          status: 'active',
          phone: validated.phone || existingUser.phone,
        })
        .where(eq(schema.users.id, targetUserId));
    } 
    // B. JIKA TIDAK MEMBAWA ID (CARI BERDASARKAN NIK ATAU EMAIL, ATAU BUAT BARU)
    else {
      // 1. Cek apakah NIK atau Email sudah dipakai di tabel users
      const [existingAccount] = await db
        .select()
        .from(schema.users)
        .where(
          or(
            eq(schema.users.email, validated.email),
            eq(schema.users.nik, validated.nik)
          )
        )
        .limit(1);

      if (existingAccount) {
        // Akun sudah ada, langsung ubah rolenya menjadi Koordinator
        targetUserId = existingAccount.id;
        await db
          .update(schema.users)
          .set({
            roleId: 5,
            status: 'active',
            phone: validated.phone || existingAccount.phone,
          })
          .where(eq(schema.users.id, targetUserId));
      } else {
        // Akun belum ada di tabel users sama sekali -> Buat akun baru
        targetUserId = crypto.randomUUID();
        isNewUserCreated = true;

        // Generate password default acak
        generatedPassword = Math.random().toString(36).substring(2, 10);
        const hashedPassword = await hashPassword(generatedPassword);

        // a. Insert ke tabel users
        await db.insert(schema.users).values({
          id: targetUserId,
          name: validated.name,
          email: validated.email,
          nik: validated.nik,
          phone: validated.phone || null,
          roleId: 5, // Koordinator Kos
          status: 'active', // Langsung active karena dibuat oleh RT
        });

        // b. Insert ke tabel accounts untuk Better Auth credentials
        await db.insert(schema.accounts).values({
          id: crypto.randomUUID(),
          accountId: validated.email,
          providerId: 'credential',
          userId: targetUserId,
          password: hashedPassword,
        });

        // c. Kirim email berisi password acak
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const loginLink = `${appUrl}/login`;
          
          await sendEmail({
            to: { email: validated.email, name: validated.name },
            subject: 'Aktivasi Akun Koordinator Kos - Wargaku',
            htmlContent: getCoordWelcomeWithPasswordEmail(validated.name, validated.email, generatedPassword, loginLink),
          });
          emailSentSuccessfully = true;
        } catch (emailErr) {
          console.error("Gagal mengirim email kredensial:", emailErr);
          emailSentSuccessfully = false;
        }
      }
    }

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
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/coordinators:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
