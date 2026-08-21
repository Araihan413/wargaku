# Rencana Implementasi Enkripsi PII (NIK & Nomor Kartu Keluarga)
*Sistem Informasi Wargaku – Dokumen Arsitektur & Panduan Rilis Produksi*

---

## 📌 1. Latar Belakang & Status Saat Ini

* **Status Saat Ini (Tahap Development):**
  * Data NIK dan Nomor KK sengaja disimpan dalam bentuk teks biasa (*plain text*) di MySQL untuk mempermudah proses inspeksi, *debugging*, penelusuran relasi tabel, dan pengujian alur bisnis oleh developer.
* **Kebutuhan Tahap Produksi (Go-Live di Lingkungan RT):**
  * Sesuai **UU Perlindungan Data Pribadi (UU PDP No. 27/2022)**, NIK dan Nomor KK merupakan data sensitif (*Personally Identifiable Information* / PII) yang wajib dilindungi dari risiko kebocoran (*data breach* / *database dump leak*).
  * Dokumen ini menyajikan cetak biru (*blueprint*) teknis untuk mengaktifkan enkripsi secara mulus ketika aplikasi siap dirilis ke server produksi RT.

---

## 🏗️ 2. Arsitektur Target: *AES-256-GCM + Blind Index (HMAC-SHA256)*

Pendekatan ini menjamin data asli terenkripsi kuat namun tetap mendukung pencarian data (*exact match search*) dan validasi duplikat tanpa mengorbankan performa.

```
[ Input NIK Warga: "3201012304900001" ]
        │
        ├───▶ [ Encryptor: AES-256-GCM + Random IV ] ───▶ Simpan di `nik` (Ciphertext)
        │
        ├───▶ [ Hash Generator: HMAC-SHA256 + Salt ]  ───▶ Simpan di `nik_hash` (Untuk Index/Search)
        │
        └───▶ [ Data Masker: 320101******0001 ]       ───▶ Simpan di `nik_masked` (Untuk Tampilan Default)
```

---

## 🗄️ 3. Perubahan Skema Database (Drizzle Schema)

Saat siap migrasi ke produksi, kolom pada tabel kependudukan disesuaikan:

### A. Tabel `family_members` (Anggota Keluarga)
```typescript
export const familyMembers = mysqlTable('family_members', {
  id: serial('id').primaryKey(),
  familyId: int('family_id').notNull().references(() => families.id),
  name: varchar('name', { length: 150 }).notNull(),
  
  // NIK Terenkripsi (Ciphertext berformat: iv:authTag:encryptedData)
  nik: text('nik').notNull(),
  
  // Blind Index untuk validasi UNIQUE & pencarian cepat (HMAC-SHA256, 64 karakter)
  nikHash: varchar('nik_hash', { length: 64 }).notNull(),
  
  // Format sensor untuk tampilan cepat tanpa dekripsi (misal: "320101******0001")
  nikMasked: varchar('nik_masked', { length: 20 }),
  
  // ... kolom lainnya
}, (table) => ({
  nikHashIdx: uniqueIndex('family_members_nik_hash_idx').on(table.nikHash),
}));
```

### B. Tabel `families` (Kartu Keluarga)
```typescript
export const families = mysqlTable('families', {
  id: serial('id').primaryKey(),
  
  // Nomor KK Terenkripsi
  familyNumber: text('family_number').notNull(),
  
  // Blind Index Nomor KK
  familyNumberHash: varchar('family_number_hash', { length: 64 }).notNull(),
  
  // Nomor KK Tersensor (misal: "320101******0005")
  familyNumberMasked: varchar('family_number_masked', { length: 20 }),
  
  // ... kolom lainnya
}, (table) => ({
  familyNumberHashIdx: uniqueIndex('families_number_hash_idx').on(table.familyNumberHash),
}));
```

---

## 🔑 4. Manajemen Kunci Rahasia (*Environment Variables*)

Variabel lingkungan baru yang wajib ditambahkan di `.env` server produksi:

```env
# Kunci Enkripsi Simetris 32-Byte (256-bit) berformat HEX
PII_ENCRYPTION_KEY=d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8

# Salt Rahasia untuk Blind Index HMAC
PII_HASH_SALT=wargaku_secret_hmac_salt_2026_rt_lingkungan
```

> [!CAUTION]
> Kunci `PII_ENCRYPTION_KEY` wajib di-*backup* dengan aman dan tidak boleh hilang. Jika kunci ini hilang, data NIK/KK asli tidak akan bisa didekripsi selamanya.

---

## 💻 5. Modul Kriptografi (*Helper Implementation: `lib/crypto-pii.ts`*)

Modul pembantu yang akan dibuat saat rilis produksi:

```typescript
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.PII_ENCRYPTION_KEY || "", "hex");
const SALT = process.env.PII_HASH_SALT || "default_salt";

/**
 * Mengenkripsi NIK / No KK menjadi format iv:authTag:ciphertext
 */
export function encryptPII(plainText: string): string {
  if (!plainText) return plainText;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Mendekripsi ciphertext NIK / No KK kembali ke plain text
 */
export function decryptPII(cipherText: string): string {
  if (!cipherText || !cipherText.includes(":")) return cipherText;
  const [ivHex, authTagHex, encrypted] = cipherText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Menghasilkan HMAC-SHA256 untuk pencarian cepat & cek unik
 */
export function hashPII(plainText: string): string {
  if (!plainText) return "";
  return crypto.createHmac("sha256", SALT).update(plainText.trim()).digest("hex");
}

/**
 * Sensor tampilan NIK: 6 digit depan + sensor + 4 digit belakang
 * Contoh: 3201012304900001 -> 320101******0001
 */
export function maskNIK(nik: string): string {
  if (!nik || nik.length < 10) return "****************";
  return `${nik.slice(0, 6)}******${nik.slice(-4)}`;
}
```

---

## 🔄 6. Prosedur Migrasi Data Lama (*Migration Script: `scripts/encrypt-existing-pii.ts`*)

Sebelum sistem dibuka untuk warga RT di server produksi, jalankan skrip migrasi sekali jalan:

1. Baca seluruh baris di `family_members` dan `families`.
2. Jika kolom masih berupa *plain text* (16 digit angka):
   * Hitung `nik_hash = hashPII(nik)`.
   * Hitung `nik_masked = maskNIK(nik)`.
   * Hitung `nik_encrypted = encryptPII(nik)`.
3. Perbarui baris tabel dengan nilai terenkripsi tersebut.

---

## ✅ 7. Checklist Kesiapan Produksi (Go-Live Checklist)

- [ ] Variabel `PII_ENCRYPTION_KEY` dan `PII_HASH_SALT` telah diset di server produksi.
- [ ] Skema database `db/schema.ts` telah menyertakan kolom hash dan masked.
- [ ] Skrip migrasi data eksisting berhasil dieksekusi di database server.
- [ ] API endpoint hanya mengembalikan `nik_masked` untuk pengguna biasa, dan hanya mendekripsi NIK jika diakses oleh role `ketua_rt` / `sekretaris`.
- [ ] Audit log mencatat setiap aksi pengurus yang membuka dekripsi NIK utuh.
