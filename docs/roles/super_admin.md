# Panduan Peran & Fitur: Super Admin

Super Admin adalah pemilik sistem (developer/administrator teknis) yang memiliki hak akses mutlak untuk mengonfigurasi sistem, memantau aktivitas, dan mengelola akun-akun tingkat pengurus RT.

---

## 1. Navigasi & Struktur Menu (Sitemap)

Ketika Super Admin login, menu sidebar utama meliputi:
*   **Dashboard Utama:** Ringkasan statistik sistem global (jumlah RT aktif, total pengguna, audit status).
*   **Keamanan & Otoritas:** (Menu Utama)
    *   **Manajemen Pengguna:** (Sub-menu) Daftar seluruh akun pengguna (CRUD, reset password, mutasi peran).
    *   **Role & Permission (RBAC):** (Sub-menu) Pengaturan hak akses dinamis bagi masing-masing role.
    *   **Log Aktivitas (Audit Trail):** (Sub-menu) Riwayat pencatatan aksi/mutasi krusial pengguna untuk keamanan.
*   **Pemantauan Wilayah (Read-Only):** (Menu Utama)
    *   **Data Kependudukan:** (Sub-menu) Melihat seluruh data KK & warga di tingkat RT.
    *   **Laporan Keuangan Kas:** (Sub-menu) Memantau rekaman kas masuk/keluar Bendahara.
    *   **Postingan & Pengaduan:** (Sub-menu) Memantau seluruh pengumuman aktif & laporan aduan warga.
*   **Konfigurasi Sistem:** (Menu Utama - Direct Link) Setelan nama desa, kelurahan, logo aplikasi kop surat, dan informasi kontak official.

---

## 2. Fitur & Tugas Utama

*   **SA-01: Dashboard Ringkasan Utama (Global Overview Dashboard)**
    Menyajikan metrik performa operasional dan kesehatan finansial RT secara menyeluruh dalam satu layar:
    *   `Total Warga Terdaftar`: Jumlah kumulatif warga tetap dan penyewa aktif.
    *   `Keluarga Aktif`: Total Kepala Keluarga (KK) yang status datanya `Verified`.
    *   `Saldo Kas RT Terkini`: Jumlah nominal saldo kas riil (sinkronisasi dari dashboard Bendahara).
    *   `Antrean Dokumen Pending`: Jumlah KK baru yang mengunggah scan berkas dan butuh verifikasi.
    *   `Antrean Surat Pengantar`: Jumlah permohonan surat masuk warga yang berstatus `Menunggu Review`.
    *   `Aduan Warga Aktif`: Laporan keluhan warga yang berstatus `Menunggu` atau `Proses`.
*   **SA-02: Manajemen Pengguna (User Account Management - CRUD)**
    Pengelolaan siklus hidup akun pengguna sistem Wargaku:
    *   **Tambah Pengguna Manual:** Pengisian form (Nama, Email, NIK unik, Pilihan Role) untuk registrasi cepat.
    *   **Suspend / Aktivasi Akun:** Tombol toggle untuk menangguhkan akun secara sementara (misal warga yang melanggar aturan atau pindah wilayah) sehingga tidak bisa login, dan mengaktifkannya kembali.
    *   **Reset Password:** Mengirimkan tautan reset password otomatis ke email warga atau me-reset password menjadi default sistem secara manual.
    *   **Mutasi Peran (Role Mutation):** Mengubah wewenang/hak akses pengguna secara langsung (misal mempromosikan warga biasa menjadi Sekretaris atau Bendahara). Perubahan ini **hanya memperbarui kolom `role` di tabel `users`** untuk hak akses dashboard, **tanpa mengganggu atau mengubah data kependudukan** mereka di tabel `families` (sebagai Kepala Keluarga) maupun `family_members`. Pengurus RT yang dimutasi tetap dapat mengakses fitur warga pribadinya secara normal.
*   **SA-03: Manajemen Role & Permission (Dynamic RBAC Matrix)**
    Mengatur pembagian hak akses fitur secara modular dan dinamis:
    *   **Matriks Hak Akses:** Tabel visual dengan baris berisi 6 role (Super Admin, Ketua RT, Sekretaris, Bendahara, Koordinator Properti Sewa, Warga) dan kolom berisi izin modul (`read_kependudukan`, `write_kependudukan`, `read_kas`, `write_kas`, `approve_kas`, `manage_surat`, `manage_properti`, `manage_complaint`, dll.).
    *   **Pembaruan Instan:** Men-centang atau menghapus centang langsung memperbarui aturan otorisasi di backend (API middleware) dan frontend (visibilitas menu sidebar) secara real-time.
*   **SA-04: Lihat Kependudukan (Read-Only)**
    Melihat seluruh data warga, KK, properti sewa, dan data anak kos dari tingkat RT secara read-only guna mengawasi keakuratan data kependudukan secara teknis tanpa berwenang mengubahnya.
*   **SA-05: Lihat Keuangan (Read-Only)**
    Melihat seluruh mutasi arus kas masuk, kas keluar, dan iuran bulanan yang diinput Bendahara secara read-only untuk memantau integritas data kas RT.
*   **SA-06: Lihat Pengumuman & Laporan (Read-Only)**
    Melihat seluruh daftar postingan pengumuman, agenda kegiatan, serta laporan aduan warga yang masuk di tingkat RT secara read-only.
*   **SA-07: Pengaturan Sistem (Identitas Wilayah)**
    Mengatur kustomisasi branding dan metadata wilayah:
    *   `Nama RT/RW` (misal: RT 03 / RW 08).
    *   `Kelurahan / Desa` (misal: Kelurahan Mulyorejo).
    *   `Kecamatan & Kota/Kabupaten` (misal: Kec. Sukolilo, Kota Surabaya).
    *   `Logo RT / Korp`: Upload berkas gambar (.png/.jpg) untuk ditampilkan di kop surat pengantar dan header aplikasi.
    *   `Alamat Sekretariat RT`, `Email Resmi RT`, & `Kontak Pengurus` (Nomor HP/WA Official Ketua RT, Sekretaris, & Bendahara).
*   **SA-08: Log Aktivitas (Audit Trail & Security Log)**
    Catatan riwayat transaksi data yang tidak dapat dimanipulasi oleh pengguna lain untuk melacak kebocoran data atau kecurangan keuangan:
    *   **Deteksi Aksi:** Log merekam aksi login, tambah data, edit data, hapus data, serta perubahan status verifikasi dokumen/kas.
    *   **Metadata Log:** Setiap log mencantumkan `Timestamp` (waktu), `Pelaku` (Nama & NIK), `Modul terkait` (Kependudukan, Keuangan, Surat), `Deskripsi Detail` (contoh: *"Mengubah saldo kas keluar Rp 500.000 menjadi Approved"*), serta `IP Address & User Agent` pelaku.

---

## 3. Alur Kerja Utama (Flowchart)

```mermaid
flowchart TD
    A[Super Admin Login] --> B[Masuk Dashboard Admin]
    B --> C{Pilih Menu}
    
    C -->|Kelola User| D[Tambah/Edit/Reset Password Pengguna]
    C -->|Kelola Akses| E[Centang/Hapus Permission per Role]
    C -->|Konfigurasi| F[Ubah Nama Wilayah/RT & Logo]
    C -->|Audit Sistem| G[Lihat Riwayat Log Aktivitas Audit]
    
    D --> H[Selesai]
    E --> H
    F --> H
    G --> H
```

---

## 4. Alur Kerja Detail (User Flow)

### 4.1 Flow Role & Permission (Super Admin)

```mermaid
flowchart TD
    A[Mulai] --> B[Super Admin buka menu Manajemen Role & Permission]
    B --> C[Tampil tabel: Row = Role, Column = Permission]
    C --> D[Super Admin centang/hapus centang permission per role]
    D --> E[Klik Simpan]
    E --> F[Sistem update tabel role_permissions di database]
    F --> G[Sistem otomatis memperbarui hak akses pengguna secara dinamis]
    G --> H[Semua user dengan role tersebut langsung terpengaruh]
    H --> I[Selesai]
```

### 4.2 Flow Manajemen Pengguna & Mutasi Peran (Super Admin)

```mermaid
flowchart TD
    A[Mulai] --> B[Super Admin Buka Menu Manajemen Pengguna]
    B --> C{Pilih Tindakan}
    
    %% Opsi 1: Tambah User
    C -->|Tambah User| D[Klik 'Tambah Pengguna Baru']
    D --> E[Isi form: Nama, Email, NIK & Pilih Peran/Role]
    E --> F[Klik Simpan -> Sistem buat akun & kirim email aktivasi]
    
    %% Opsi 2: Mutasi Peran
    C -->|Mutasi Peran| G[Cari nama user -> Klik 'Edit Peran']
    G --> H[Pilih Peran baru dari dropdown]
    H --> I[Klik Simpan -> Perubahan langsung mereset otorisasi user secara instan]
    
    %% Opsi 3: Suspend Akun
    C -->|Suspend Akun| J[Cari nama user -> Klik toggle 'Suspend']
    J --> K[Akun terkunci -> User ditolak login di halaman Sign In]
    
    F --> L[Selesai]
    I --> L
    K --> L
```

### 4.3 Flow Audit Trail Keamanan (Super Admin)

```mermaid
flowchart TD
    A[Mulai] --> B[Super Admin buka menu Log Aktivitas]
    B --> C[Tampil tabel riwayat log audit terurut dari teraktual]
    C --> D{Apakah terindikasi kecurigaan fraud / kebocoran data?}
    D -->|Ya| E[Gunakan filter pencarian berdasarkan modul atau pelaku/NIK]
    E --> F[Sistem menyajikan detail IP, aksi, dan detail record data yang diubah]
    F --> G[Unduh laporan log ke Excel/CSV untuk barang bukti investigasi]
    D -->|Tidak| H[Sistem terus merekam aktivitas secara pasif]
    G --> I[Selesai]
    H --> I
```
