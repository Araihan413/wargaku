# Spec: REST API Handlers untuk Pengelolaan Kos & Kontrakan (Rentals)

## Objective
Menyediakan REST API Route Handlers di Next.js untuk pendaftaran dan pelacakan properti sewa (`rental_properties`) serta penghuni properti sewa (`rental_residents`) dengan integrasi autentikasi Better Auth, otorisasi RBAC (Role-Based Access Control), validasi skema Zod, dan perlindungan keamanan data berbasis kepemilikan.

---

## Endpoint Specification

### 1. Properti Sewa (Rental Properties) API

#### `GET /api/rentals`
- **Tujuan:** Mendapatkan daftar properti sewa terpaginasi.
- **Izin Akses (Permission):** `'manage-boarding'` (Admin/RT/Koordinator Kost).
- **Aturan Otorisasi Khusus:** 
  - Jika pengguna adalah Koordinator Kost, hasil pencarian otomatis difilter hanya menampilkan properti yang dikelolanya (`coordinatorUserId === user.id`).
- **Query Parameters:**
  - `limit` (optional, default: 10): Jumlah data per halaman.
  - `offset` (optional, default: 0): Index mulai data.
  - `query` (optional): Pencarian berdasarkan nama properti sewa.
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": 1,
        "dwellingId": 5,
        "name": "Kos Melati",
        "coordinatorUserId": 34,
        "contactPerson": "Pak Budi Kos",
        "phone": "081234567890",
        "totalRooms": 10,
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

#### `POST /api/rentals`
- **Tujuan:** Mendaftarkan properti sewa baru.
- **Izin Akses (Permission):** `'manage-boarding'` (Admin/RT/Koordinator Kost).
- **Aturan Otorisasi Khusus:**
  - Koordinator Kost dilarang mendaftarkan properti untuk koordinator lain (sistem otomatis memaksa `coordinatorUserId` bernilai ID pengguna yang sedang login).
- **Request Body (JSON):**
  ```json
  {
    "dwellingId": 5,
    "name": "Kos Melati",
    "coordinatorUserId": 34,
    "contactPerson": "Pak Budi Kos",
    "phone": "081234567890",
    "totalRooms": 10
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": 1,
    "message": "Properti sewa berhasil didaftarkan"
  }
  ```

#### `GET /api/rentals/[id]`
- **Tujuan:** Mengambil detail lengkap properti sewa beserta daftar kamar/penghuni aktif.
- **Izin Akses (Permission):** `'manage-boarding'` (Admin/RT/Koordinator Kost).
- **Aturan Otorisasi Khusus:**
  - Koordinator Kost dilarang mengakses properti sewa yang tidak dikelolanya (kembalikan `403 Forbidden`).
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "dwellingId": 5,
    "name": "Kos Melati",
    "coordinatorUserId": 34,
    "contactPerson": "Pak Budi Kos",
    "phone": "081234567890",
    "totalRooms": 10,
    "isActive": true,
    "dwelling": {
      "id": 5,
      "streetName": "Jl. Mawar",
      "blockNumber": "A",
      "houseNumber": "5",
      "type": "kos"
    },
    "activeResidentsCount": 1
  }
  ```

#### `PUT /api/rentals/[id]`
- **Tujuan:** Memperbarui informasi properti sewa.
- **Izin Akses (Permission):** `'manage-boarding'` (Admin/RT/Koordinator Kost).
- **Aturan Otorisasi Khusus:**
  - Koordinator Kost dilarang memperbarui properti sewa yang tidak dikelolanya.
- **Request Body (JSON):** Sesuai `updateRentalPropertySchema`.
- **Response (200 OK):**
  ```json
  {
    "message": "Informasi properti sewa berhasil diperbarui"
  }
  ```

#### `DELETE /api/rentals/[id]`
- **Tujuan:** Menonaktifkan properti sewa (soft delete, `isActive = false`).
- **Izin Akses (Permission):** `'manage-boarding'` (Admin/RT/Koordinator Kost).
- **Response (200 OK):**
  ```json
  {
    "message": "Properti sewa berhasil dinonaktifkan"
  }
  ```

---

### 2. Penghuni Sewa (Rental Residents) API

#### `GET /api/rentals/[id]/residents`
- **Tujuan:** Mengambil daftar histori/penghuni yang terdaftar di properti sewa tertentu.
- **Izin Akses (Permission):** `'manage-boarding'` (Admin/RT/Koordinator Kost).
- **Query Parameters:**
  - `isActive` (optional): `true` | `false`.
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "rentalPropertyId": 1,
      "tenantType": "perorangan",
      "familyId": null,
      "name": "Andi Test",
      "nik": "3276123456780001",
      "phone": "08987654321",
      "roomNumber": "Kamar 01",
      "checkInDate": "2026-07-13",
      "checkOutDate": null,
      "verificationStatus": "pending",
      "isActive": true
    }
  ]
  ```

#### `POST /api/rentals/[id]/residents`
- **Tujuan:** Melakukan pendaftaran/Check-In penghuni sewa baru (tipe perorangan).
- **Izin Akses (Permission):** `'manage-boarding'` (Admin/RT/Koordinator Kost).
- **Aturan Bisnis & Otorisasi:**
  - Koordinator Kost dilarang mendaftarkan penghuni untuk properti sewa yang bukan miliknya.
  - Jumlah penghuni aktif (`is_active = true`) di properti tersebut tidak boleh melebihi kapasitas `totalRooms`.
  - NIK penghuni harus unik secara global di database (belum digunakan oleh warga atau penghuni aktif lain).
- **Request Body (JSON):** Sesuai `createRentalResidentSchema`.
  ```json
  {
    "tenantType": "perorangan",
    "name": "Andi Test",
    "nik": "3276123456780001",
    "phone": "08987654321",
    "originAddress": "Jl. Bandung No. 5",
    "occupation": "Mahasiswa",
    "educationLevel": "S1",
    "roomNumber": "Kamar 01",
    "checkInDate": "2026-07-13",
    "ktpFile": "/uploads/ktp/resident_1.jpg"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": 1,
    "message": "Penyewa berhasil melakukan check-in"
  }
  ```

#### `PUT /api/rental-residents/[id]`
- **Tujuan:** Memperbarui data penghuni sewa, atau melakukan verifikasi (RT).
- **Izin Akses (Permission):**
  - **RT/Admin (dengan permission `verify-documents`):** Berhak memperbarui `verificationStatus` dan `verificationNote`.
  - **Koordinator Kost (dengan permission `manage-boarding`):** Berhak memperbarui biodata penghuni *hanya jika* status verifikasi belum `verified` (jika sudah `verified`, data dikunci dan mengembalikan `403 Forbidden`).
- **Response (200 OK):**
  ```json
  {
    "message": "Data penghuni berhasil diperbarui"
  }
  ```

#### `DELETE /api/rental-residents/[id]`
- **Tujuan:** Menghapus permanen data penghuni (hanya diperbolehkan jika status masih `pending` untuk menghindari manipulasi riwayat tinggal).
- **Izin Akses (Permission):** `'manage-boarding'` (Admin/RT/Koordinator Kost).
- **Response (200 OK):**
  ```json
  {
    "message": "Data penghuni berhasil dihapus"
  }
  ```

#### `POST /api/rental-residents/[id]/check-out`
- **Tujuan:** Memproses Check-Out penghuni (mengubah `isActive = false`, mengisi `checkOutDate` dan `inactiveReason = 'pindah'`).
- **Izin Akses (Permission):** `'manage-boarding'` (Admin/RT/Koordinator Kost).
- **Request Body (JSON):**
  ```json
  {
    "checkOutDate": "2026-07-20",
    "inactiveReason": "pindah"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Penyewa berhasil check-out"
  }
  ```
