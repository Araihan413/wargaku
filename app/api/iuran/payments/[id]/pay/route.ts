import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { recordPayment, payIuranSchema } from "@/db/queries/iuran";

// POST /api/iuran/payments/[id]/pay
// Record payment for a fee_payment record + sync to cash_transactions income
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });

    const roleId = session.user.roleId;
    if (roleId !== 1 && roleId !== 4) {
      return NextResponse.json({ error: "Hanya Bendahara yang dapat mencatat pembayaran iuran" }, { status: 403 });
    }

    const { id } = await params;
    const paymentId = parseInt(id, 10);

    const body = await request.json();
    const parsed = payIuranSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", issues: parsed.error.issues }, { status: 400 });
    }

    const result = await recordPayment(paymentId, parsed.data, session.user.id);

    return NextResponse.json({
      message:
        result.newStatus === "paid"
          ? "Iuran berhasil lunas! Saldo kas RT telah diperbarui."
          : `Pembayaran sebagian tercatat. Sisa tagihan: Rp ${result.amountDue.toLocaleString("id-ID")}`,
      newStatus: result.newStatus,
      newAmountPaid: result.newAmountPaid,
      amountDue: result.amountDue,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Data tagihan tidak ditemukan" }, { status: 404 });
      }
      if (err.message === "ALREADY_PAID") {
        return NextResponse.json({ error: "Tagihan ini sudah lunas" }, { status: 400 });
      }
      if (err.message.startsWith("OVERPAY:")) {
        const remaining = Number(err.message.split(":")[1]);
        return NextResponse.json(
          { error: `Nominal bayar melebihi sisa tagihan (Rp ${remaining.toLocaleString("id-ID")})` },
          { status: 400 },
        );
      }
    }
    console.error("[POST /api/iuran/payments/[id]/pay]", err);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
