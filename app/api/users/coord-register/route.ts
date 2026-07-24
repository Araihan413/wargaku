import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, isNull, ne, or } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';

const nikRegex = /^[0-9]{16}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, email, nik, password } = body;

    if (!id || !email || !nik || !password) {
      return NextResponse.json({ error: 'Seluruh kolom wajib diisi' }, { status: 400 });
    }

    if (!nikRegex.test(nik)) {
      return NextResponse.json({ error: 'NIK harus terdiri dari 16 digit angka' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Kata sandi minimal terdiri dari 6 karakter' }, { status: 400 });
    }

    // 1. Verify that the pending coordinator user exists by ID and hasn't registered yet
    const [user] = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.id, id),
          eq(schema.users.roleId, 5), // Koordinator Kost
          isNull(schema.users.password)
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Calon koordinator tidak ditemukan atau sudah terregistrasi' },
        { status: 404 }
      );
    }

    // 2. Check if the NIK or Email is already registered by another user
    const [conflictUser] = await db
      .select({ id: schema.users.id, email: schema.users.email, nik: schema.users.nik })
      .from(schema.users)
      .where(
        and(
          ne(schema.users.id, id),
          or(
            eq(schema.users.email, email),
            eq(schema.users.nik, nik)
          )
        )
      )
      .limit(1);

    if (conflictUser) {
      if (conflictUser.email === email) {
        return NextResponse.json({ error: 'Alamat email ini sudah terdaftar di sistem' }, { status: 409 });
      }
      if (conflictUser.nik === nik) {
        return NextResponse.json({ error: 'NIK ini sudah terdaftar di sistem' }, { status: 409 });
      }
    }

    // 3. Hash password and update user details
    const hashedPassword = await hashPassword(password);

    await db
      .update(schema.users)
      .set({
        email: email,
        nik: nik,
        password: hashedPassword,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id));

    // 4. Send notification to Ketua RT (roleId: 2)
    try {
      const rts = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.roleId, 2));

      if (rts.length > 0) {
        const insertPromises = rts.map((rt) =>
          db.insert(schema.notifications).values({
            userId: rt.id,
            title: "Registrasi Koordinator Baru",
            message: `Koordinator bernama ${user.name} telah menyelesaikan pendaftaran koordinator kos. Silakan tinjau.`,
            category: "dinas",
            redirectLink: `/dashboard/approvals/registration`,
          })
        );
        await Promise.all(insertPromises);
      }
    } catch (notifErr) {
      console.error("Gagal mengirim notifikasi registrasi koordinator ke RT:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Registrasi koordinator berhasil diselesaikan',
    });
  } catch (error: any) {
    console.error('Error in POST /api/users/coord-register:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
