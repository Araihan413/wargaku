# Panduan Migrasi & Arsitektur: Penyatuan Skema Penduduk (`residents`)

Dokumen ini berisi analisis mendalam, struktur skema baru, daftar file berdampak, serta alur migrasi bertahap dari pemisahan tabel (`family_members` & `rental_residents`) menuju **tabel `residents` terpusat**.

---

## 🎯 1. Skema Tabel Terpusat (`residents`)

Semua subjek individu (warga tetap KK, penyewa kos perorangan, dan penyewa kontrakan keluarga) disatukan di tabel **`residents`**:

```typescript
export const residents = mysqlTable('residents', {
  id: int('id').autoincrement().primaryKey(),
  
  // Relasi Akun, KK, & Hunian
  userId: varchar('user_id', { length: 255 }).references(() => users.id), // Nullable jika belum punya akun
  familyId: int('family_id').references(() => families.id), // Nullable jika penyewa kos perorangan
  dwellingId: int('dwelling_id').references(() => dwellings.id), // Relasi ke hunian fisik
  rentalPropertyId: int('rental_property_id').references(() => rentalProperties.id), // Nullable (jika kos/kontrakan)
  roomNumber: varchar('room_number', { length: 10 }), // Nomor kamar kos/unit
  
  // Klasifikasi & Peran Penduduk
  residentType: mysqlEnum('resident_type', ['warga_tetap', 'sewa_perorangan', 'sewa_keluarga']).notNull(),
  relationship: mysqlEnum('relationship', [
    'Kepala_Keluarga', 'Suami', 'Istri', 'Anak', 'Orang_Tua', 'Mertua', 'Sepupu', 'Lainnya'
  ]),
  
  // Demografi Utama
  name: varchar('name', { length: 100 }).notNull(),
  nik: varchar('nik', { length: 16 }).notNull().unique(),
  gender: mysqlEnum('gender', ['L', 'P']).notNull(),
  birthPlace: varchar('birth_place', { length: 50 }),
  birthDate: date('birth_date'),
  phone: varchar('phone', { length: 15 }),
  occupation: varchar('occupation', { length: 50 }),
  educationLevel: varchar('education_level', { length: 50 }),
  religion: mysqlEnum('religion', ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya']),
  originAddress: text('origin_address'),
  
  // Dokumen & Verifikasi
  ktpFile: varchar('ktp_file', { length: 255 }),
  verificationStatus: mysqlEnum('verification_status', ['pending', 'verified', 'rejected']).notNull().default('pending'),
  verificationNote: text('verification_note'),
  
  // Masa Tinggal & Aktif
  checkInDate: date('check_in_date'),
  checkOutDate: date('check_out_date'),
  isActive: boolean('is_active').notNull().default(true),
  inactiveReason: mysqlEnum('inactive_reason', ['pindah', 'meninggal', 'check_out']),
  notes: text('notes'),
  
  createdBy: varchar('created_by', { length: 255 }).references(() => users.id),
  updatedBy: varchar('updated_by', { length: 255 }).references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

---

## 📂 2. Inventarisasi File Berdampak (Full Scope)

### A. Skema & Query Database (`db/`)
1. **`db/schema.ts`**: Menggabungkan `familyMembers` dan `rentalResidents` menjadi `residents`, serta memperbarui FK di `letters`.
2. **`db/queries/kependudukan.ts`**: Query CRUD keluarga dan anggota KK dari `residents`.
3. **`db/queries/rental.ts`**: Query Check-In, Edit, Delete, Check-Out penyewa dari `residents`.
4. **`db/queries/smart-groups.ts`**: Filter pengelompokan warga dari `residents`.

### B. Endpoint API Backend (`app/api/`)
1. **`app/api/rental-residents/route.ts`**: Handler Check-In perorangan/keluarga.
2. **`app/api/rental-residents/[id]/route.ts`**: Handler Edit, Delete, & Check-Out 1 baris record.
3. **`app/api/families/route.ts` & `[id]/route.ts`**: Handler KK & data anggota keluarga.
4. **`app/api/approvals/registration/[id]/route.ts`**: Handler persetujuan registrasi mandiri RT.
5. **`app/api/approvals/documents/route.ts` & `[id]/route.ts`**: Handler verifikasi dokumen KK dan KTP penghuni.
6. **`app/api/dashboard/stats/route.ts`**: Query statistik demografi RT dari `residents`.

### C. Komponen & Halaman Frontend (`app/dashboard/` & `components/`)
1. **`CheckInModal.tsx`**: Form Check-In Penyewa Perorangan.
2. **`CheckInFamilyModal.tsx`**: Form Check-In Penyewa Keluarga.
3. **`EditResidentModal.tsx`**: Form Edit Penghuni Kos.
4. **`DetailResidentModal.tsx`**: Modal Detail Informasi Penghuni.
5. **`ResidentsTab.tsx`**: Tabel & Manajemen Penghuni Kos.
6. **`approvals/documents/page.tsx`**: Halaman Verifikasi Dokumen RT.

---

## 🚀 3. Tahapan Migrasi Bertahap (Status: ALL PHASES 100% COMPLETED)

### ✅ Fase 1: Database Schema & Query Helper (`db/`) [SELESAI]
- Memperbarui `db/schema.ts` dengan menyatukan tabel `residents`.
- Memperbarui query helper di `db/queries/rental.ts`, `db/queries/kependudukan.ts`, dan `db/queries/smart-groups.ts`.
- Menjalankan `scratch/backfill-residents.ts` -> 39 data berhasil dipindahkan dengan 0 data loss.

### ✅ Fase 2: Backend API Routes (`app/api/`) [SELESAI]
- Memperbarui API `/api/rental-residents` (Check-In, Edit, Delete, Check-Out).
- Memperbarui API `/api/families` & `/api/approvals`.
- Memperbarui API `/api/dashboard/rt/stats`.

### ✅ Fase 3: Frontend Components (`app/dashboard/`) [SELESAI]
- Memperbarui Modal Check-In, Edit, & Detail Penghuni.
- Memperbarui `ResidentsTab.tsx` & Halaman Approval RT.

### ✅ Fase 4: Complete System Verification & Old Table Cleanup [SELESAI]
- Menjalankan `npx tsc --noEmit` -> 100% Clean Compile (Exit Code 0).
- Menghapus ekspor `familyMembers` dan `rentalResidents` dari `db/schema.ts`.
- Menjalankan script `scratch/drop-old-tables.ts` untuk melepas foreign key dan menghapus tabel lama `family_members` dan `rental_residents` dari database MySQL.
