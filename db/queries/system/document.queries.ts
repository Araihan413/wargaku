import { db } from "@/db";
import { families, familyMembers, rentalContracts, cashTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hasPermission } from "@/lib/rbac";
import { decryptPII } from "@/lib/crypto-pii";

export type DocumentType = "kk" | "ktp-member" | "ktp-tenant" | "receipt";

export interface DocumentAccessResult {
  success: boolean;
  fileUrl?: string;
  defaultFilename?: string;
  status: 200 | 400 | 403 | 404;
  errorMessage?: string;
}

/**
 * Memverifikasi hak akses dan mengambil file URL dokumen kependudukan atau transaksi.
 */
export async function getDocumentAccess(
  type: string,
  id: number,
  userId: string,
  effectiveRoleId: number | null
): Promise<DocumentAccessResult> {

  // 1. TYPE: kk  →  families.kk_file
  if (type === "kk") {
    const family = await db.query.families.findFirst({
      where: eq(families.id, id),
      columns: { id: true, kkFile: true, headUserId: true, familyNumber: true },
    });

    if (!family) return { success: false, status: 404, errorMessage: "Data Kartu Keluarga tidak ditemukan." };
    if (!family.kkFile) return { success: false, status: 404, errorMessage: "Berkas Scan KK belum diunggah." };

    const hasViewPerm = await hasPermission(effectiveRoleId, "view-residents");
    const isOwner = family.headUserId === userId;

    if (!hasViewPerm && !isOwner) {
      return { success: false, status: 403, errorMessage: "Anda tidak memiliki izin untuk mengakses dokumen Kartu Keluarga ini." };
    }

    const decryptedFamilyNo = decryptPII(family.familyNumber);
    return {
      success: true,
      status: 200,
      fileUrl: family.kkFile,
      defaultFilename: `Kartu-Keluarga-${decryptedFamilyNo || id}.pdf`,
    };
  }

  // 2. TYPE: ktp-member  →  family_members.ktp_file
  if (type === "ktp-member") {
    const member = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.id, id),
      columns: { id: true, ktpFile: true, familyId: true, userId: true, name: true, nik: true },
    });

    if (!member) return { success: false, status: 404, errorMessage: "Data anggota keluarga tidak ditemukan." };
    if (!member.ktpFile) return { success: false, status: 404, errorMessage: "Berkas KTP anggota keluarga belum diunggah." };

    const family = await db.query.families.findFirst({
      where: eq(families.id, member.familyId),
      columns: { id: true, headUserId: true },
    });

    const hasViewPerm = await hasPermission(effectiveRoleId, "view-residents");
    const isHeadOfFamily = family?.headUserId === userId;
    const isOwnKtp = member.userId === userId;

    if (!hasViewPerm && !isHeadOfFamily && !isOwnKtp) {
      return { success: false, status: 403, errorMessage: "Anda tidak memiliki izin untuk mengakses berkas KTP ini." };
    }

    const cleanName = (member.name || "Warga").replace(/[^a-zA-Z0-9]/g, "_");
    return {
      success: true,
      status: 200,
      fileUrl: member.ktpFile,
      defaultFilename: `KTP-${cleanName}-${id}.pdf`,
    };
  }

  // 3. TYPE: ktp-tenant  →  rental_contracts.individual_ktp_file
  if (type === "ktp-tenant") {
    const contract = await db.query.rentalContracts.findFirst({
      where: eq(rentalContracts.id, id),
      columns: { id: true, individualKtpFile: true, individualName: true, userId: true },
    });

    if (!contract) return { success: false, status: 404, errorMessage: "Data kontrak sewa tidak ditemukan." };
    if (!contract.individualKtpFile) return { success: false, status: 404, errorMessage: "Berkas Scan KTP penyewa belum diunggah." };

    const hasManagePerm = await hasPermission(effectiveRoleId, "manage-boarding");
    const hasViewPerm = await hasPermission(effectiveRoleId, "view-residents");
    const isOwnContract = contract.userId === userId;

    if (!hasManagePerm && !hasViewPerm && !isOwnContract) {
      return { success: false, status: 403, errorMessage: "Anda tidak memiliki izin untuk mengakses berkas KTP penyewa ini." };
    }

    const cleanName = (contract.individualName || "Penyewa").replace(/[^a-zA-Z0-9]/g, "_");
    return {
      success: true,
      status: 200,
      fileUrl: contract.individualKtpFile,
      defaultFilename: `KTP-Penyewa-${cleanName}-${id}.pdf`,
    };
  }


  // 4. TYPE: receipt  →  cash_transactions.receipt_file
  if (type === "receipt") {
    const transaction = await db.query.cashTransactions.findFirst({
      where: eq(cashTransactions.id, id),
      columns: { id: true, receiptFile: true, description: true },
    });

    if (!transaction) return { success: false, status: 404, errorMessage: "Data transaksi tidak ditemukan." };
    if (!transaction.receiptFile) return { success: false, status: 404, errorMessage: "Bukti nota untuk transaksi ini belum diunggah." };

    // Semua user yang sudah login boleh melihat nota kas RT (transparansi)
    return {
      success: true,
      status: 200,
      fileUrl: transaction.receiptFile,
      defaultFilename: `Nota-Kas-RT-${id}.pdf`,
    };
  }

  return {
    success: false,
    status: 400,
    errorMessage: `Tipe berkas '${type}' tidak dikenali.`,
  };
}
