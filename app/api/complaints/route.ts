import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { listComplaints, createComplaint, checkIpRateLimit } from '@/db/queries/complaints';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const isAllowed =
      session.user.roleId === 1 ||
      session.user.roleId === 2 ||
      session.user.roleId === 3 ||
      (await hasPermission(session.user.roleId, 'manage-complaints'));

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();

    const result = await listComplaints({ status, category, search });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/complaints:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const reqHeaders = await headers();
    const forwarded = reqHeaders.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : reqHeaders.get('x-real-ip') || '127.0.0.1';

    // 1. Rate Limiting Check (Max 4 laporan / IP / jam)
    const isRateLimitOk = await checkIpRateLimit(clientIp);
    if (!isRateLimitOk) {
      return NextResponse.json(
        { error: 'Batas pengiriman laporan tercapai. Anda hanya dapat mengirim maksimal 4 laporan per jam.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { reporterName, reporterPhone, category, description, photoPath, dwellingId, turnstileToken } = body;

    if (!reporterName || !category || !description) {
      return NextResponse.json(
        { error: 'Nama pelapor, kategori, dan deskripsi laporan wajib diisi' },
        { status: 400 }
      );
    }

    // 2. Strict Turnstile Verification
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'Verifikasi CAPTCHA bot wajib diselesaikan sebelum mengirim laporan' },
        { status: 400 }
      );
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Variabel TURNSTILE_SECRET_KEY belum dikonfigurasi di server .env' },
        { status: 400 }
      );
    }

    const turnstileRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: secretKey,
          response: turnstileToken,
          remoteip: clientIp,
        }),
      }
    );

    const turnstileJson = await turnstileRes.json();
    if (!turnstileJson.success) {
      return NextResponse.json(
        { error: 'Verifikasi bot/CAPTCHA gagal. Silakan muat ulang dan coba lagi.' },
        { status: 400 }
      );
    }

    // 3. Simpan Laporan ke Database
    const created = await createComplaint({
      reporterName,
      reporterPhone,
      category,
      description,
      photoPath,
      dwellingId,
      ipAddress: clientIp,
    });

    return NextResponse.json(
      {
        message: 'Laporan pengaduan berhasil dikirim',
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/complaints:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

