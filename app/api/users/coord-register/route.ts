import { NextResponse } from 'next/server';
import { registerCoord } from '@/db/queries/users';
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

    const hashedPassword = await hashPassword(password);
    await registerCoord(id, email, nik, hashedPassword);

    return NextResponse.json({
      success: true,
      message: 'Registrasi koordinator berhasil diselesaikan',
    });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Calon koordinator tidak ditemukan atau sudah terregistrasi' },
          { status: 404 }
        );
      }
      if (error.message === 'EMAIL_EXISTS') {
        return NextResponse.json({ error: 'Alamat email ini sudah terdaftar di sistem' }, { status: 409 });
      }
      if (error.message === 'NIK_EXISTS') {
        return NextResponse.json({ error: 'NIK ini sudah terdaftar di sistem' }, { status: 409 });
      }
    }
    console.error('Error in POST /api/users/coord-register:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
