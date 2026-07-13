# Spec: REST API Handlers untuk CRUD KK & Warga

## Objective
Menyediakan REST API Route Handlers di Next.js untuk mengelola data Kartu Keluarga (`families`) dan Warga (`family_members`) secara aman dengan integrasi autentikasi Better Auth, otorisasi RBAC (Role-Based Access Control), validasi skema Zod, dan dokumentasi Swagger UI.

---

## Endpoint Specification

### 1. Kartu Keluarga (Families) API

#### `GET /api/families`
- **Tujuan:** Mendapatkan daftar KK terpaginasi dengan pencarian dan filter.
- **Izin Akses (Permission):** `'view-residents'` (Admin/RT/Sekretaris).
- **Query Parameters:**
  - `limit` (optional, default: 10): Jumlah data per halaman.
  - `offset` (optional, default: 0): Index mulai data.
  - `query` (optional): Pencarian berdasarkan nomor KK atau nama kepala keluarga.
  - `verificationStatus` (optional): `pending` | `verified` | `rejected`.
  - `isActive` (optional): `true` | `false`.
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": 1,
        "dwellingId": 5,
        "familyNumber": "3276123456789012",
        "headUserId": 2,
        "headName": "Ahmad Raihan",
        "unitNumber": "A1",
        "kkFile": "/uploads/kk/1.pdf",
        "verificationStatus": "verified",
        "verificationNote": null,
        "checkInDate": "2026-07-13",
        "checkOutDate": null,
        "isActive": true,
        "createdAt": "2026-07-13T08:00:00.000Z",
        "updatedAt": "2026-07-13T08:00:00.000Z"
      }
    ],
    "metadata": {
      "total": 1,
      "limit": 10,
      "offset": 0
    }
  }
  ```

#### `POST /api/families`
- **Tujuan:** Membuat draf Kartu Keluarga baru.
- **Izin Akses (Permission):** `'manage-residents'` (Admin/RT).
- **Request Body (JSON):** Sesuai `createFamilySchema` Zod.
- **Response (201 Created):**
  ```json
  {
    "id": 1,
    "message": "Kartu Keluarga berhasil dibuat"
  }
  ```

#### `GET /api/families/[id]`
- **Tujuan:** Mengambil detail lengkap KK beserta data tempat tinggal (`dwelling`) dan seluruh anggota keluarga (`members`).
- **Izin Akses (Permission):**
  - Pengurus yang memiliki permission `'view-residents'`.
  - **ATAU** Warga yang memiliki permission `'manage-own-family'` DAN `headUserId` KK tersebut sama dengan ID User yang sedang login.
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "dwellingId": 5,
    "familyNumber": "3276123456789012",
    "headUserId": 2,
    "headName": "Ahmad Raihan",
    "unitNumber": "A1",
    "kkFile": "/uploads/kk/1.pdf",
    "verificationStatus": "verified",
    "verificationNote": null,
    "checkInDate": "2026-07-13",
    "checkOutDate": null,
    "isActive": true,
    "dwelling": {
      "id": 5,
      "streetName": "Jl. Mawar",
      "blockNumber": "A",
      "houseNumber": "5",
      "type": "permanen"
    },
    "members": [
      {
        "id": 1,
        "name": "Ahmad Raihan",
        "nik": "3276111122223333",
        "relationship": "Kepala_Keluarga",
        "gender": "L",
        "isActive": true
      }
    ]
  }
  ```

#### `PUT /api/families/[id]`
- **Tujuan:** Mengupdate informasi Kartu Keluarga.
- **Izin Akses (Permission) & Aturan Bisnis:**
  - Pengurus dengan permission `'manage-residents'` (Bebas mengubah semua field termasuk status verifikasi).
  - Warga dengan permission `'manage-own-family'` DAN `headUserId === session.user.id`.
    - **Aturan Lock:** Warga hanya bisa mengubah jika status verifikasi adalah `pending` atau `rejected`. Jika status `verified`, kembalikan error `403 Forbidden` (Warga harus mengajukan perubahan data terlebih dahulu).
    - **Aturan Field:** Warga tidak diizinkan mengubah `verificationStatus`, `verificationNote`, `headUserId`, atau `headName`. Field ini akan di-strip jika diikutsertakan dalam request body oleh warga.
- **Request Body (JSON):** Sesuai `updateFamilySchema`.
- **Response (200 OK):**
  ```json
  {
    "message": "Data Kartu Keluarga berhasil diperbarui"
  }
  ```

#### `DELETE /api/families/[id]`
- **Tujuan:** Soft delete KK dan seluruh anggotanya.
- **Izin Akses (Permission):** `'manage-residents'` (Admin/RT).
- **Response (200 OK):**
  ```json
  {
    "message": "Kartu Keluarga berhasil dinonaktifkan"
  }
  ```

---

### 2. Warga (Family Members) API

#### `GET /api/warga`
- **Tujuan:** Mendapatkan daftar warga terpaginasi dengan filter.
- **Izin Akses (Permission):** `'view-residents'` (Admin/RT/Sekretaris).
- **Query Parameters:** `limit`, `offset`, `query`, `gender`, `relationship`, `isActive`.
- **Response (200 OK):** Daftar warga terpaginasi.

#### `POST /api/warga`
- **Tujuan:** Menambahkan anggota keluarga baru.
- **Izin Akses (Permission) & Aturan Bisnis:**
  - Pengurus dengan permission `'manage-residents'`.
  - Warga dengan permission `'manage-own-family'` DAN `familyId` yang dituju merupakan KK miliknya (`headUserId === session.user.id`).
    - **Aturan Lock:** Warga tidak boleh menambah anggota jika status KK-nya sudah `verified`.
- **Request Body (JSON):** Sesuai `createWargaSchema`.
- **Response (201 Created):** `{ "id": 3, "message": "Anggota keluarga berhasil ditambahkan" }`

#### `GET /api/warga/[id]`
- **Tujuan:** Mengambil detail satu warga.
- **Izin Akses (Permission):** `'view-residents'` ATAU (`'manage-own-family'` milik KK yang bersangkutan).

#### `PUT /api/warga/[id]`
- **Tujuan:** Memperbarui biodata warga.
- **Izin Akses (Permission) & Aturan Bisnis:**
  - Pengurus dengan permission `'manage-residents'`.
  - Warga dengan permission `'manage-own-family'` milik KK yang bersangkutan.
    - **Aturan Lock:** Warga tidak boleh mengupdate jika status KK-nya `verified`.
- **Response (200 OK):** `{ "message": "Data warga berhasil diperbarui" }`

#### `DELETE /api/warga/[id]`
- **Tujuan:** Soft delete satu warga dengan alasan tidak aktif.
- **Izin Akses (Permission) & Aturan Bisnis:**
  - Pengurus dengan permission `'manage-residents'`.
  - Warga dengan permission `'manage-own-family'` milik KK yang bersangkutan (hanya jika status KK `pending` atau `rejected`).
- **Query Parameters / Request Body:** `inactiveReason` (`pindah` | `meninggal`).
- **Response (200 OK):** `{ "message": "Warga berhasil dinonaktifkan" }`

---

## Swagger Integration (JSDoc)
Setiap endpoint handler akan dilengkapi anotasi JSDoc menggunakan format OpenAPI 3.0 swagger-jsdoc.
Contoh anotasi:
```typescript
/**
 * @openapi
 * /api/families:
 *   get:
 *     summary: Mendapatkan daftar Kartu Keluarga
 *     tags: [Kependudukan]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 */
```

Halaman Swagger UI akan dirender di `app/api-docs/page.tsx`.

---

## Error Response Standard
Semua kegagalan API akan mengembalikan format JSON standar:
```json
{
  "error": "Pesan kesalahan atau validasi gagal",
  "issues": [] // Detail error validasi Zod jika ada
}
```
Status Codes:
- `400 Bad Request`: Validasi skema gagal atau parameter salah.
- `401 Unauthorized`: Sesi Better Auth tidak valid atau kedaluwarsa.
- `403 Forbidden`: Tidak memiliki izin modul (RBAC) atau terblokir aturan lock.
- `404 Not Found`: Data tidak ditemukan.
- `500 Internal Server Error`: Kesalahan server internal atau query database gagal.
