import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { listComplaints, createComplaint, checkIpRateLimit } from '@/db/queries';
import { notifyRoles } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed =
      effectiveRoleId === 1 ||
      effectiveRoleId === 2 ||
      effectiveRoleId === 3 ||
      (await hasPermission(effectiveRoleId, 'manage-complaints'));

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

    const isRateLimitOk = await checkIpRateLimit(clientIp);
    if (!isRateLimitOk) {
      return NextResponse.json(
        { error: 'Batas pengiriman laporan tercapai. Anda hanya dapat mengirim maksimal 4 laporan per jam.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { reporterName, reporterPhone, category, description, photoPath, dwellingId } = body;

    if (!reporterName?.trim()) return NextResponse.json({ error: 'Nama pelapor wajib diisi' }, { status: 400 });
    if (!category) return NextResponse.json({ error: 'Kategori pengaduan wajib dipilih' }, { status: 400 });
    if (!description?.trim()) return NextResponse.json({ error: 'Rincian pengaduan wajib diisi' }, { status: 400 });

    const complaintRes = await createComplaint({
      reporterName: reporterName.trim(),
      reporterPhone: reporterPhone?.trim() || null,
      category,
      description: description.trim(),
      photoPath: photoPath || null,
      dwellingId: dwellingId ? Number(dwellingId) : null,
      ipAddress: clientIp,
    });

    notifyRoles(['ketua-rt', 'sekretaris'], {
      title: `Pengaduan Warga Baru [${category}]`,
      message: `Laporan baru dari ${reporterName.trim()}: "${description.trim().slice(0, 60)}..."`,
      category: 'dinas',
      redirectLink: '/dashboard/complaints',
    }).catch((err) => console.error('Gagal kirim notifikasi pengaduan:', err));

    return NextResponse.json(
      {
        success: true,
        data: {
          id: complaintRes.id,
          trackingCode: complaintRes.trackingCode,
        },
        message: 'Laporan pengaduan berhasil dikirim. Terima kasih atas kepedulian Anda!',
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
