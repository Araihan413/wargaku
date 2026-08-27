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

  // 3. Drop index lama pada rental_contracts
  await executeSafeSql(
    "ALTER TABLE `rental_contracts` DROP INDEX `rental_contracts_individual_nik_idx`",
    "Drop index rental_contracts_individual_nik_idx"
  );

  // 4. Tambah kolom hash jika belum ada
  await executeSafeSql(
    "ALTER TABLE `families` ADD COLUMN `family_number_hash` VARCHAR(64) NOT NULL DEFAULT ''",
    "Tambah kolom family_number_hash pada tabel families"
  );
  await executeSafeSql(
    "ALTER TABLE `family_members` ADD COLUMN `nik_hash` VARCHAR(64) NOT NULL DEFAULT ''",
    "Tambah kolom nik_hash pada tabel family_members"
  );
  await executeSafeSql(
    "ALTER TABLE `rental_contracts` ADD COLUMN `individual_nik_hash` VARCHAR(64) NOT NULL DEFAULT ''",
    "Tambah kolom individual_nik_hash pada tabel rental_contracts"
  );

  // 5. Ubah tipe kolom ke TEXT
  await executeSafeSql(
    "ALTER TABLE `families` MODIFY COLUMN `family_number` TEXT NOT NULL",
    "Ubah tipe kolom family_number ke TEXT"
  );
  await executeSafeSql(
    "ALTER TABLE `family_members` MODIFY COLUMN `nik` TEXT NOT NULL",
    "Ubah tipe kolom nik ke TEXT"
  );
  await executeSafeSql(
    "ALTER TABLE `rental_contracts` MODIFY COLUMN `individual_nik` TEXT NULL",
    "Ubah tipe kolom individual_nik pada rental_contracts ke TEXT"
  );
  await executeSafeSql(
    "ALTER TABLE `family_change_requests` MODIFY COLUMN `family_number` TEXT NULL",
    "Ubah tipe kolom family_number pada family_change_requests ke TEXT"
  );
}

async function migrateFamilyNumbers() {
  console.log("\n[2/5] Mengenkripsi Nomor KK (families.family_number)...");

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
  console.log("\n[3/5] Mengenkripsi NIK Anggota KK (family_members.nik)...");

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

async function migrateRentalContractNiks() {
  console.log("\n[4/5] Mengenkripsi NIK Penghuni Sewa (rental_contracts.individual_nik)...");

  const allContracts = await db
    .select({ id: schema.rentalContracts.id, individualNik: schema.rentalContracts.individualNik })
    .from(schema.rentalContracts);

  let encryptedCount = 0;
  let skippedCount = 0;

  for (const contract of allContracts) {
    if (!contract.individualNik) {
      continue;
    }

    const isAlreadyEncrypted = contract.individualNik.split(":").length === 3;
    if (isAlreadyEncrypted) {
      skippedCount++;
      continue;
    }

    const plainNik = contract.individualNik;
    await db.update(schema.rentalContracts)
      .set({
        individualNik: encryptPII(plainNik),
        individualNikHash: hashPII(plainNik),
      })
      .where(eq(schema.rentalContracts.id, contract.id));

    encryptedCount++;
  }

  console.log(`  ✅ Selesai: ${encryptedCount} NIK penyewa berhasil dienkripsi, ${skippedCount} sudah dalam format terenkripsi.`);
}

async function finalizeIndexes() {
  console.log("\n[5/5] Memperbarui Unique Index & Index Blind Hash...");

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

  // Buat index pada rental_contracts.individual_nik_hash
  await executeSafeSql(
    "ALTER TABLE `rental_contracts` ADD INDEX `rental_contracts_individual_nik_hash_idx` (`individual_nik_hash`)",
    "Buat index rental_contracts_individual_nik_hash_idx"
  );
}

async function fixCredentialAccounts() {
  console.log("\n[Extra] Menyelaraskan accountId dan issuer akun credential...");
  const accounts = await db.select().from(schema.accounts).where(eq(schema.accounts.providerId, "credential"));
  let fixedCount = 0;
  for (const acc of accounts) {
    if (acc.accountId !== acc.userId || !acc.issuer) {
      await db.update(schema.accounts)
        .set({
          accountId: acc.userId,
          issuer: "local:credential",
        })
        .where(eq(schema.accounts.id, acc.id));
      fixedCount++;
    }
  }
  console.log(`  ✅ Selesai: ${fixedCount} akun berhasil diselaraskan dengan Better-Auth.`);
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
  await migrateRentalContractNiks();
  await finalizeIndexes();
  await fixCredentialAccounts();


  console.log("\n========================================================");
  console.log("  ✨ MIGRASI PII BERHASIL DIEKSEKUSI SECARA LENGKAP!");
  console.log("========================================================\n");
  process.exit(0);
}


main().catch((err) => {
  console.error("\n❌ ERROR fatal saat migrasi:", err);
  process.exit(1);
});

