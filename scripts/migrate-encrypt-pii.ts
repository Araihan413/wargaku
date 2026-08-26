/**
 * Skrip Migrasi PII Otomatis
 * 
 * Urutan Operasi:
 * 1. Drop index lama pada kolom `family_number` dan `nik` agar bisa diubah ke tipe TEXT.
 * 2. Tambah kolom `family_number_hash` dan `nik_hash` (VARCHAR 64).
 * 3. Ubah kolom `family_number` dan `nik` menjadi TEXT NOT NULL.
 * 4. Enkripsi semua data NIK & No KK lama serta isi kolom hash.
 * 5. Buat UNIQUE INDEX pada kolom hash (`family_number_hash_idx` & `nik_hash_idx`).
 */

import "dotenv/config";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { encryptPII, hashPII, isPIIEncryptionActive } from "@/lib/crypto-pii";
import { sql, eq } from "drizzle-orm";

async function executeSafeSql(query: string, label: string) {
  try {
    await db.execute(sql.raw(query));
    console.log(`  ✓ ${label}`);
  } catch (err: any) {
    if (
      err.errno === 1060 || // Duplicate column name
      err.errno === 1061 || // Duplicate key name
      err.errno === 1091 || // Can't DROP, check that column/key exists
      err.message?.includes("Duplicate") ||
      err.message?.includes("doesn't exist") ||
      err.message?.includes("check that column/key exists")
    ) {
      console.log(`  ℹ ${label} (dilewati/sudah diproses)`);
    } else {
      console.warn(`  ⚠ ${label}: ${err.message}`);
    }
  }
}

async function prepareTableSchemas() {
  console.log("\n[1/4] Menyesuaikan skema tabel dan menghapus index lama...");

  // 1. Drop index lama pada families.family_number
  await executeSafeSql(
    "ALTER TABLE `families` DROP INDEX `families_family_number_unique`",
    "Drop index families_family_number_unique"
  );
  await executeSafeSql(
    "ALTER TABLE `families` DROP INDEX `family_number`",
    "Drop index family_number pada families"
  );
  await executeSafeSql(
    "ALTER TABLE `families` DROP INDEX `families_family_number_idx`",
    "Drop index families_family_number_idx"
  );

  // 2. Drop index lama pada family_members.nik
  await executeSafeSql(
    "ALTER TABLE `family_members` DROP INDEX `family_members_nik_unique`",
    "Drop index family_members_nik_unique"
  );
  await executeSafeSql(
    "ALTER TABLE `family_members` DROP INDEX `nik`",
    "Drop index nik pada family_members"
  );

  // 3. Tambah kolom hash jika belum ada
  await executeSafeSql(
    "ALTER TABLE `families` ADD COLUMN `family_number_hash` VARCHAR(64) NOT NULL DEFAULT ''",
    "Tambah kolom family_number_hash pada tabel families"
  );
  await executeSafeSql(
    "ALTER TABLE `family_members` ADD COLUMN `nik_hash` VARCHAR(64) NOT NULL DEFAULT ''",
    "Tambah kolom nik_hash pada tabel family_members"
  );

  // 4. Ubah tipe kolom ke TEXT
  await executeSafeSql(
    "ALTER TABLE `families` MODIFY COLUMN `family_number` TEXT NOT NULL",
    "Ubah tipe kolom family_number ke TEXT"
  );
  await executeSafeSql(
    "ALTER TABLE `family_members` MODIFY COLUMN `nik` TEXT NOT NULL",
    "Ubah tipe kolom nik ke TEXT"
  );
  await executeSafeSql(
    "ALTER TABLE `family_change_requests` MODIFY COLUMN `family_number` TEXT NULL",
    "Ubah tipe kolom family_number pada family_change_requests ke TEXT"
  );
}

async function migrateFamilyNumbers() {
  console.log("\n[2/4] Mengenkripsi Nomor KK (families.family_number)...");

  const allFamilies = await db
    .select({ id: schema.families.id, familyNumber: schema.families.familyNumber })
    .from(schema.families);

  let encryptedCount = 0;
  let skippedCount = 0;

  for (const family of allFamilies) {
    const isAlreadyEncrypted = family.familyNumber.split(":").length === 3;

    if (isAlreadyEncrypted) {
      skippedCount++;
      continue;
    }

    const plainFamilyNumber = family.familyNumber;
    await db.update(schema.families)
      .set({
        familyNumber: encryptPII(plainFamilyNumber),
        familyNumberHash: hashPII(plainFamilyNumber),
      })
      .where(eq(schema.families.id, family.id));

    encryptedCount++;
  }

  console.log(`  ✅ Selesai: ${encryptedCount} KK berhasil dienkripsi, ${skippedCount} sudah dalam format terenkripsi.`);
}

async function migrateFamilyMemberNiks() {
  console.log("\n[3/4] Mengenkripsi NIK Anggota KK (family_members.nik)...");

  const allMembers = await db
    .select({ id: schema.familyMembers.id, nik: schema.familyMembers.nik })
    .from(schema.familyMembers);

  let encryptedCount = 0;
  let skippedCount = 0;

  for (const member of allMembers) {
    const isAlreadyEncrypted = member.nik.split(":").length === 3;

    if (isAlreadyEncrypted) {
      skippedCount++;
      continue;
    }

    const plainNik = member.nik;
    await db.update(schema.familyMembers)
      .set({
        nik: encryptPII(plainNik),
        nikHash: hashPII(plainNik),
      })
      .where(eq(schema.familyMembers.id, member.id));

    encryptedCount++;
  }

  console.log(`  ✅ Selesai: ${encryptedCount} NIK berhasil dienkripsi, ${skippedCount} sudah dalam format terenkripsi.`);
}

async function finalizeIndexes() {
  console.log("\n[4/4] Memperbarui Unique Index...");

  // Buat unique index pada family_number_hash
  await executeSafeSql(
    "ALTER TABLE `families` ADD UNIQUE INDEX `families_family_number_hash_idx` (`family_number_hash`)",
    "Buat unique index families_family_number_hash_idx"
  );

  // Buat unique index pada nik_hash
  await executeSafeSql(
    "ALTER TABLE `family_members` ADD UNIQUE INDEX `family_members_nik_hash_idx` (`nik_hash`)",
    "Buat unique index family_members_nik_hash_idx"
  );
}

async function main() {
  console.log("========================================================");
  console.log("  🚀 Memulai Migrasi Enkripsi PII Basis Data Wargaku");
  console.log("========================================================");

  if (!isPIIEncryptionActive()) {
    console.error("\n❌ ERROR: PII_ENCRYPTION_KEY belum diset dengan benar di file .env");
    process.exit(1);
  }

  await prepareTableSchemas();
  await migrateFamilyNumbers();
  await migrateFamilyMemberNiks();
  await finalizeIndexes();

  console.log("\n========================================================");
  console.log("  ✨ MIGRASI PII BERHASIL DIEKSEKUSI SECARA LENGKAP!");
  console.log("========================================================\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ ERROR fatal saat migrasi:", err);
  process.exit(1);
});
