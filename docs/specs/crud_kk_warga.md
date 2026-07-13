# Spec: Query Database Drizzle untuk CRUD KK & Warga

## Objective
Menyediakan modul query database yang robust, aman, dan type-safe menggunakan Drizzle ORM untuk mengelola data Kartu Keluarga (`families`) dan data Warga/Anggota Keluarga (`family_members`). Modul ini akan menjadi fondasi bagi API Route Handler dan Server Components pada pengembangan di tahapan berikutnya.

### User Stories / Acceptance Criteria
- **Kartu Keluarga (KK):**
  - Pengurus RT dapat membuat data KK baru yang terhubung ke data tempat tinggal (`dwellings`) dan Kepala Keluarga (`users`).
  - Pengurus RT dan Warga dapat melihat detail data KK (termasuk alamat tempat tinggal dan daftar seluruh anggota keluarga).
  - Pengurus RT dapat memperbarui data KK (seperti nomor KK, file scan KK, status verifikasi, dan catatan verifikasi).
  - Pengurus RT dapat menonaktifkan KK (soft delete) jika keluarga pindah/keluar dari wilayah RT.
- **Warga (Family Members):**
  - Pengurus RT dan Kepala Keluarga dapat menambahkan anggota keluarga baru ke dalam KK.
  - Sistem harus mencegah pendaftaran NIK yang sama (duplicate NIK).
  - Warga dapat memperbarui data biodata diri sendiri / anggota keluarganya.
  - Pengurus RT dapat menonaktifkan warga (soft delete) dengan mencantumkan alasan (pindah atau meninggal).

---

## Tech Stack
- **Database ORM:** Drizzle ORM `^0.45.2` dengan `mysql2` driver.
- **Validation:** Zod `^4.4.3` (menggunakan skema validasi kependudukan di [kependudukan.ts](file:///d:/Belajar/Belajar%20Program/Portofolio/wargaku/lib/validations/kependudukan.ts)).
- **Language:** TypeScript `^5`.

---

## Commands
- **Typecheck & Build:** `npm run build`
- **Linting:** `npm run lint`
- **Run verification test script:** `npx tsx scratch/test-queries.ts`

---

## Project Structure
```
db/
├── index.ts               # Inisialisasi db pool
├── schema.ts              # Definisi tabel (roles, users, dwellings, families, family_members, dll.)
└── queries/
    └── kependudukan.ts    # [NEW] Fungsi query CRUD KK & Warga
scratch/
└── test-queries.ts        # [NEW] Script uji coba CRUD kependudukan
```

---

## Code Style
- Gunakan `@/db` dan `@/db/schema` untuk import.
- Penulisan fungsi query menggunakan async/await dengan penanganan error menggunakan block `try/catch`.
- Fungsi return bertipe Promise yang terdefinisi dengan jelas.
- Gunakan transaksi (`db.transaction`) untuk operasi penulisan multitable jika diperlukan.

### Contoh Gaya Kode
```typescript
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getFamilyById(id: number) {
  try {
    const family = await db.query.families.findFirst({
      where: eq(schema.families.id, id),
      with: {
        dwelling: true,
        members: true,
      },
    });
    return family || null;
  } catch (error) {
    console.error('Error fetching family:', error);
    throw new Error('Gagal mengambil data Kartu Keluarga');
  }
}
```

---

## Testing & Verification Strategy
- **Verifikasi Lokal:**
  - Membuat scratch script `scratch/test-queries.ts` untuk menguji fungsionalitas CRUD secara end-to-end (membuat draf KK, membaca, mengupdate, menambahkan warga, soft delete, dan memastikan validasi NIK unik bekerja).
  - Menjalankan script menggunakan `npx tsx scratch/test-queries.ts` terhadap database MySQL lokal.
  - Melakukan build check (`npm run build`) untuk memastikan tidak ada compiler error.

---

## Boundaries
- **Always:**
  - Melakukan soft delete menggunakan flag `is_active = false` pada KK dan Warga (jangan menghapus data fisik dari tabel).
  - Melakukan validasi input dengan skema Zod sebelum memproses query.
  - Memeriksa keunikan NIK sebelum melakukan insert data warga baru.
- **Ask First:**
  - Melakukan modifikasi pada file `db/schema.ts` jika ada kolom baru yang diperlukan.
- **Never:**
  - Melakukan hard delete (`delete()` query) pada data KK atau warga tanpa persetujuan eksplisit.
  - Menyimpan file upload secara langsung di query layer (tugas ini didelegasikan ke API/Service layer).

---

## Success Criteria
1. Berkas [kependudukan.ts](file:///d:/Belajar/Belajar%20Program/Portofolio/wargaku/db/queries/kependudukan.ts) berhasil dibuat dengan seluruh API CRUD kependudukan yang lengkap dan type-safe.
2. Script pengujian `scratch/test-queries.ts` dapat dieksekusi tanpa error dan semua asersi/uji coba lolos (Create -> Read -> Update -> Soft Delete untuk KK dan Warga).
3. Kode lolos tahap kompilasi TypeScript static check (`npm run build`) dengan 0 error.
