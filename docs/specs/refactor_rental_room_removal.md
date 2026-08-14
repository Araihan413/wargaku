# Spesifikasi Teknis: Refactoring Properti Sewa & Penghapusan Fitur Nomor Kamar (Model Ultra-Simple) — Wargaku

Dokumen ini merinci seluruh perubahan arsitektur, skema database, backend query, API endpoint, validasi, dan antarmuka (UI) untuk **menghapus kolom `room_number` serta komponen kamar kaku yang sudah usang** dan beralih ke model manajemen sewa sederhana: **Data Bangunan (Kapasitas & Kamar Terisi yang Fleksibel) + Flat List Data Penghuni**.

---

## 1. Latar Belakang & Konsep Desain

### 1.1 Masalah Saat Ini
* Di lingkungan RT/RW, bangunan kos dan kontrakan berbentuk **rumah tinggal biasa atau paviliun**, bukan bangunan komersial hotel/kostel dengan nomor kamar kaku.
* Penomoran kamar kaku (`room_number`), grid visual kamar (`VisualRoomGrid`), dan drawer per-kamar (`RoomDetailDrawer`) menambah beban input dan tidak fleksibel untuk kasus nyata di lapangan (misal: 2 orang sekamar berdua, kamar dipakai gudang, sewa 1 rumah utuh sekeluarga).

### 1.2 Konsep Baru (Ultra-Simple & Fleksibel)
1. **Pengelolaan Bangunan**:
   * Memiliki `totalRooms` (Kapasitas Total Kamar Rumah) dan `occupiedRooms` (Jumlah Kamar Terisi).
   * Kamar kosong dihitung otomatis: `vacantRooms = totalRooms - occupiedRooms`.
   * Pemilik/pengurus memiliki kendali penuh untuk **mengedit angka kamar terisi secara manual kapan saja**.
2. **Pengelolaan Penghuni (Flat List)**:
   * Menghapus kewajiban dan kolom `room_number`.
   * Form check-in murni mencatat identitas: **Nama, NIK, No HP, Foto KTP (Perorangan) atau Data KK (Keluarga), dan Tanggal Masuk**.
   * **Opsi Otomatisasi Check-In**: Disediakan checkbox **`[✓] Otomatis kurangi kamar kosong (+1 kamar terisi)`** dengan nilai **default: `true`**.
     * Jika dicentang (`true`): Angka `occupiedRooms` di properti otomatis bertambah +1.
     * Jika tidak dicentang (`false`): Digunakan untuk kasus kongsi / sekamar berdua dengan penyewa yang sudah ada (angka kamar terisi tidak bertambah).
   * **Opsi Otomatisasi Check-Out**: Disediakan checkbox **`[✓] Otomatis tambah kamar kosong (-1 kamar terisi)`** dengan nilai **default: `true`**.

---

## 2. Rincian Perubahan Skema Database (`db/schema.ts`)

### 2.1 Tabel `rental_properties` (Penambahan Kolom Keterisian)
* Menambahkan kolom `occupiedRooms`:
```diff
  export const rentalProperties = mysqlTable('rental_properties', {
    id: int('id').autoincrement().primaryKey(),
    dwellingId: int('dwelling_id').notNull().references(() => dwellings.id),
    name: varchar('name', { length: 100 }).notNull(),
    coordinatorUserId: varchar('coordinator_user_id', { length: 255 }).references(() => users.id),
    contactPerson: varchar('contact_person', { length: 100 }),
    phone: varchar('phone', { length: 15 }),
    totalRooms: int('total_rooms').notNull().default(0),
+   occupiedRooms: int('occupied_rooms').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  });
```

### 2.2 Tabel `rental_contracts` (Penghapusan Kolom Nomor Kamar)
* **[HAPUS]** Kolom `roomNumber: varchar('room_number', { length: 10 }).notNull()`.
```diff
  export const rentalContracts = mysqlTable('rental_contracts', {
    id: int('id').autoincrement().primaryKey(),
    rentalPropertyId: int('rental_property_id').notNull().references(() => rentalProperties.id),
-   roomNumber: varchar('room_number', { length: 10 }).notNull(),
    tenantType: mysqlEnum('tenant_type', ['individual', 'family']).notNull(),
    familyId: int('family_id').references(() => families.id, { onDelete: 'set null' }),
    userId: varchar('user_id', { length: 255 }).references(() => users.id, { onDelete: 'set null' }),
    // ...
  });
```

---

## 3. Pembersihan File & Komponen Usang (*Dead Code Removal*)

Berikut adalah file dan folder yang akan **DIHAPUS TOTAL** dari repository:

| Tipe | Lokasi File / Folder | Alasan Penghapusan |
| :--- | :--- | :--- |
| **Component** | `app/dashboard/rentals/_components/VisualRoomGrid.tsx` | Grid kamar visual kaku tidak lagi digunakan. |
| **Component** | `app/dashboard/rentals/_components/RoomDetailDrawer.tsx` | Drawer per-nomor-kamar dihapus. |
| **Component** | `app/dashboard/rentals/_components/RoomHistoryTimelineTab.tsx` | Timeline per-nomor-kamar dihapus. |
| **API Route** | `app/api/rentals/[id]/rooms/` *(seluruh folder)* | Endpoint per-kamar (`[roomNumber]/history/route.ts`) tidak lagi dibutuhkan. |

---

## 4. Rincian Perubahan Backend Query & Validasi

### 4.1 `db/queries/property/tenant.queries.ts`
* **Hapus** kolom `roomNumber` dari `CreateTenantInput`, `UpdateTenantInput`, dan query `select/insert/update`.
* **Hapus** fungsi usang `getRoomContractHistory`.
* **Update `createTenantContract` & `createFamilyTenantWithUser`**:
  * Tambahkan parameter opsional `autoDeductVacantRoom?: boolean` (default: `true`).
  * Jika `true`, lakukan update atomik `occupiedRooms = LEAST(totalRooms, occupiedRooms + 1)` pada properti terkait di dalam database transaction.
* **Update `checkoutTenantContract`**:
  * Tambahkan parameter opsional `autoFreeVacantRoom?: boolean` (default: `true`).
  * Jika `true`, lakukan update atomik `occupiedRooms = GREATEST(0, occupiedRooms - 1)`.

### 4.2 `db/queries/property/rental-property.queries.ts`
* **Hapus** fungsi usang: `getMaxActiveRoomNumber`, `getRentalPropertyRooms`, `getRoomOccupancyTimeline`.
* **Update fungsi update properti**: Izinkan pengubahan manual nilai `totalRooms` dan `occupiedRooms`.
* **Update kalkulasi summary**:
  * `totalRooms`: nilai dari database.
  * `occupiedRooms`: nilai dari database (atau fallback).
  * `vacantRooms`: `Math.max(0, totalRooms - occupiedRooms)`.
  * `activeTenantsCount`: jumlah fisik data penghuni aktif di tabel `rental_contracts`.

### 4.3 `lib/validations/rental.ts`
* **Hapus** validasi `roomNumber` pada `createTenantSchema` dan `updateTenantSchema`.
* Tambahkan boolean `autoDeductVacantRoom: z.boolean().default(true)`.

### 4.4 `lib/mail.ts`
* **Hapus** parameter `roomNumber` dari fungsi pengiriman email `sendTenantAccountCredentialsEmail`.

---

## 5. Rincian Perubahan Antarmuka (UI & Frontend)

### 5.1 Halaman Manajemen Properti (`/dashboard/rentals` & `/dashboard/my-properties`)
* **Kartu Ringkasan Properti & Quick Edit Keterisian**:
  * Menampilkan:
    * `Total Kapasitas`: misal 5 Kamar
    * `Kamar Terisi`: 3 Kamar
    * `Kamar Kosong`: 2 Kamar (Badge Hijau "Tersedia")
    * `Total Warga Terdaftar`: 4 Jiwa Penghuni Aktif
  * Tombol / Input Cepat: **"Edit Keterisian"** (memungkinkan pemilik langsung mengubah angka `occupiedRooms` / `totalRooms`).
* **Tab Daftar Penghuni Aktif (`ActiveTenantsTab.tsx`)**:
  * Tabel bersih seluruh penghuni rumah sewa dengan aksi: Lihat Detail, Edit Data, dan Check-Out.

### 5.2 Modal Check-In Penghuni Baru (`CheckInTenantModal.tsx` & `CheckInModal.tsx`)
Perubahan form check-in berlaku seragam untuk **Pengurus RT** (di `/dashboard/residents` dan `/dashboard/rentals`) maupun **Pemilik/Koordinator Properti** (di `/dashboard/my-properties/[id]`):

* **Hapus** dropdown/input *"Pilih Nomor Kamar"*.
* **Hapus** dependency `roomList` dan `initialRoom`.
* **Tambahkan Checkbox Otomatisasi Keterisian**:
  ```tsx
  <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl">
    <input
      type="checkbox"
      id="autoDeduct"
      checked={autoDeductVacantRoom}
      onChange={(e) => setAutoDeductVacantRoom(e.target.checked)}
      className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
    <label htmlFor="autoDeduct" className="text-xs text-blue-900 cursor-pointer">
      <span className="font-semibold block">Otomatis kurangi 1 kamar kosong (Tambah kamar terisi)</span>
      <span className="text-blue-700/80 text-[11px] block mt-0.5">
        Hapus centang jika penghuni ini kongsi / sekamar dengan penghuni yang sudah ada.
      </span>
    </label>
  </div>
  ```
  *(Default nilai state: `true`)*.

### 5.3 Modal Check-Out Penghuni (`CheckOutTenantModal.tsx`)
* Tambahkan checkbox: **`[✓] Otomatis tambah 1 kamar kosong (Kurangi kamar terisi)`** *(Default: `true`)*.
* Berlaku seragam saat Pengurus RT atau Pemilik melakukan check-out penghuni.

### 5.4 Modal Edit Penghuni (`EditTenantModal.tsx` & `EditResidentModal.tsx`)
Perubahan form edit penghuni berlaku seragam di kedua sisi:
* **`EditTenantModal.tsx`** *(Sisi Pengurus RT di `/dashboard/residents`)*:
  * Hapus field input/dropdown nomor kamar (`roomNumber`).
  * Hapus validasi dan state terkait nomor kamar.
* **`EditResidentModal.tsx`** *(Sisi Koordinator/Pemilik di `/dashboard/my-properties/[id]`)*:
  * Hapus field input/dropdown nomor kamar (`roomNumber`).
  * Hapus prop `roomList` dan logic filter kamar.

### 5.5 Modal Detail Penghuni (`TenantDetailModal.tsx` & `DetailResidentModal.tsx`)
Perubahan popup detail penghuni berlaku seragam di kedua sisi:
* **`TenantDetailModal.tsx`** *(Sisi Pengurus RT di `/dashboard/residents`)*:
  * Hapus baris tampilan nomor kamar (`resident.roomNumber`).
  * Ganti dengan informasi nama properti sewa & alamat hunian.
* **`DetailResidentModal.tsx`** *(Sisi Koordinator/Pemilik di `/dashboard/my-properties/[id]`)*:
  * Hapus kotak informasi "Nomor Kamar" di header modal.
  * Tampilkan tipe penyewa (Perorangan / Keluarga) dan status aktif.

### 5.6 Tabel & Seluruh Tab di Menu "Data Warga & Hunian" (`/dashboard/residents`)
Pembersihan total residu nomor kamar pada seluruh tabel dan tab:
* **Tabel Penyewa (`RentalTable.tsx`)**:
  * Hapus kolom/teks nomor kamar (`- Kamar ${r.roomNumber}`).
  * Hanya menampilkan Nama Rumah Sewa & Alamat Hunian.
* **Modal Verifikasi Pendaftaran Penyewa (`VerifyTenantModal.tsx`)**:
  * Hapus teks `(Kamar ${resident.roomNumber})` dari header verifikasi.
* **Modal Detail Hunian (`DwellingDetailModal.tsx`)**:
  * Untuk hunian tipe kos/kontrakan, pastikan statistik menampilkan format bersih: `Kapasitas: X Kamar`, `Terisi: Y Kamar`, `Kosong: Z Kamar`.
* **Antrean Verifikasi Koordinator (`PendingVerificationQueue.tsx`)**:
  * Hapus teks badge `Kamar / Unit ${r.roomNumber}`.
* **Peta Lingkungan & GIS (`MapComponent.tsx` & `/dashboard/neighborhood/page.tsx`)**:
  * Hapus teks `(Kamar ${r.roomNumber})` dari popup marker peta.

---

## 6. Matriks File yang Terdampak (*Impact Matrix*)

```
wargaku/
├── db/
│   ├── schema.ts                                           [MODIFY: Tambah occupiedRooms, Hapus roomNumber]
│   └── queries/
│       ├── property/
│       │   ├── tenant.queries.ts                           [MODIFY: Hapus roomNumber & sinkronisasi keterisian]
│       │   └── rental-property.queries.ts                  [MODIFY: Hapus room grid usang, dukung edit manual occupiedRooms]
│       ├── population/
│       │   └── dwelling.queries.ts                         [MODIFY: Hapus roomNumber dari mapping]
│       └── dashboard/
│           ├── internal-dashboard.queries.ts               [MODIFY: Sederhanakan statistik keterisian]
│           └── public-portal.queries.ts                    [MODIFY: Baca langsung occupiedRooms untuk info kos warga]
├── lib/
│   ├── validations/
│   │   └── rental.ts                                       [MODIFY: Hapus validasi roomNumber, tambah autoDeductVacantRoom]
│   └── mail.ts                                             [MODIFY: Hapus roomNumber dari email]
├── app/
│   ├── api/
│   │   └── rentals/
│   │       ├── [id]/
│   │       │   ├── rooms/                                  [DELETE FOLDER]
│   │       │   └── route.ts                                [MODIFY: Dukung update occupiedRooms]
│   │       └── route.ts                                    [MODIFY: Clean up]
│   └── dashboard/
│       ├── rentals/
│       │   ├── page.tsx                                    [MODIFY: Tampilan ringkasan hunian & edit cepat]
│       │   └── _components/
│       │       ├── VisualRoomGrid.tsx                      [DELETE]
│       │       ├── RoomDetailDrawer.tsx                    [DELETE]
│       │       ├── RoomHistoryTimelineTab.tsx              [DELETE]
│       │       └── ActiveTenantsTab.tsx                    [MODIFY: Tabel penghuni flat list]
│       ├── my-properties/
│       │   └── [id]/
│       │       ├── page.tsx                                [MODIFY: Sederhanakan kalkulasi keterisian]
│       │       └── _components/
│       │           ├── CheckInModal.tsx                    [MODIFY: Hapus nomor kamar, tambah autoDeduct toggle]
│       │           ├── EditResidentModal.tsx               [MODIFY: Hapus input nomor kamar]
│       │           ├── DetailResidentModal.tsx             [MODIFY: Hapus kotak nomor kamar]
│       │           ├── ResidentsTab.tsx                    [MODIFY: Hapus kolom nomor kamar]
│       │           └── HistoryTab.tsx                      [MODIFY: Hapus kolom nomor kamar]
│       └── residents/
│           └── _components/
│               ├── CheckInTenantModal.tsx                  [MODIFY: Hapus nomor kamar, tambah autoDeduct toggle]
│               ├── CheckOutTenantModal.tsx                 [MODIFY: Tambah autoFree toggle]
│               ├── EditTenantModal.tsx                     [MODIFY: Hapus input nomor kamar]
│               ├── TenantDetailModal.tsx                   [MODIFY: Hapus tampilan nomor kamar]
│               ├── RentalTable.tsx                         [MODIFY: Hapus kolom nomor kamar]
│               └── VerifyTenantModal.tsx                   [MODIFY: Hapus teks nomor kamar]
```

---

## 7. Rencana Langkah Eksekusi & Validasi

1. **Tahap 1 — Database Schema & Backend Queries**:
   * Perbarui `db/schema.ts` (tambah `occupiedRooms`, hapus `roomNumber`).
   * Perbarui query di `tenant.queries.ts`, `rental-property.queries.ts`, `internal-dashboard.queries.ts`, dan `public-portal.queries.ts`.
2. **Tahap 2 — Cleanup API Routes & Validations**:
   * Hapus folder API `app/api/rentals/[id]/rooms/`.
   * Perbarui `lib/validations/rental.ts` dan `lib/mail.ts`.
3. **Tahap 3 — UI Refactor & Dead Code Deletion**:
   * Hapus `VisualRoomGrid.tsx`, `RoomDetailDrawer.tsx`, `RoomHistoryTimelineTab.tsx`.
   * Perbarui modal check-in (`CheckInTenantModal.tsx`) dengan toggle `autoDeductVacantRoom` (default `true`).
   * Perbarui modal check-out (`CheckOutTenantModal.tsx`) dengan toggle `autoFreeVacantRoom` (default `true`).
   * Perbarui modal edit, detail, dan tabel penyewa.
   * Perbarui halaman `/dashboard/rentals/page.tsx` dengan kartu ringkasan keterisian + quick edit manual.
4. **Tahap 4 — Quality & Type Check**:
   * Jalankan `npm run lint` untuk memastikan 0 error TypeScript / ESLint.
