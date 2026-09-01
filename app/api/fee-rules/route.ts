import { NextResponse } from 'next/server';
import { validateApiAuth, hasPermission } from '@/lib/rbac';
import { listFeeRules, createFeeRule } from '@/db/queries/finance/fee.queries';
import { notifyAllWarga, notifyRoles } from '@/lib/notifications';
import { z } from 'zod';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

const createFeeRuleSchema = z.object({
  name: z.string().min(1, 'Nama iuran wajib diisi'),
  amount: z.number().positive('Nominal iuran harus lebih dari 0'),
  isMandatory: z.boolean().default(true),
});

/**
 * @openapi
 * /api/fee-rules:
 *   get:
 *     summary: Mendapatkan daftar aturan iuran
 *     description: Mengambil semua daftar aturan iuran (seperti Uang Sampah, Keamanan, dll) yang aktif di sistem. Membutuhkan hak akses manage-iuran atau view-arrears.
 *     tags:
 *       - Iuran & Keuangan
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar aturan iuran
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const allowed = (await hasPermission(roleId, 'manage-iuran')) || (await hasPermission(roleId, 'view-arrears'));
    if (!allowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') !== 'false';

    const data = await listFeeRules(includeInactive);
    return NextResponse.json({ data });
  } catch (err) {
    console.error('[GET /api/fee-rules]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/fee-rules:
 *   post:
 *     summary: Membuat aturan iuran baru dan tagihan massal
 *     description: "Membuat aturan iuran baru (contoh: Iuran Agustus) dan langsung men-generate tagihan (bills) ke seluruh KK yang aktif pada periode berjalan, serta mengirim notifikasi."
 *     tags:
 *       - Iuran & Keuangan
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nama iuran (misal, Iuran Kebersihan)
 *               amount:
 *                 type: number
 *                 description: Nominal iuran (lebih dari 0)
 *               isMandatory:
 *                 type: boolean
 *                 description: Apakah iuran ini wajib
 *                 default: true
 *     responses:
 *       201:
 *         description: Aturan iuran berhasil dibuat dan tagihan diterbitkan
 *       400:
 *         description: Data input tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin untuk membuat aturan iuran
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const { session, errorResponse } = await validateApiAuth('manage-iuran');
    if (errorResponse || !session) return errorResponse;

    const body = await request.json();
    const parsed = createFeeRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid', issues: parsed.error.issues }, { status: 400 });
    }

    const { id, period } = await createFeeRule(parsed.data, session.user.id);

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'CREATE_FEE_RULE',
      module: 'keuangan',
      description: `Membuat aturan iuran baru: "${parsed.data.name}" sebesar Rp ${Number(parsed.data.amount).toLocaleString('id-ID')} periode ${period}.`,
      ipAddress,
    }).catch(() => null);

    notifyAllWarga({
      title: 'Tagihan Iuran RT Baru',
      message: `Tagihan '${parsed.data.name}' periode ${period} sebesar Rp ${Number(parsed.data.amount).toLocaleString('id-ID')} telah diterbitkan.`,
      category: 'personal',
      redirectLink: '/dashboard/finance',
    }).catch((notifErr: any) => console.error('Gagal broadcast notifikasi iuran baru:', notifErr));

    notifyRoles(['4'], {
      title: 'Daftar Tagihan Iuran Berhasil Dibuat',
      message: `Aturan '${parsed.data.name}' berhasil dibuat oleh pengurus. Siap menerima catatan pembayaran warga.`,
      category: 'dinas',
      redirectLink: '/dashboard/finance',
    }).catch((notifErr: any) => console.error('Gagal notifyRole bendahara:', notifErr));

    return NextResponse.json({ message: 'Aturan iuran berhasil dibuat & tagihan periode diterbitkan', data: { id, period } }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/fee-rules]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
