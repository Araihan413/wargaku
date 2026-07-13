# Panduan Peran & Fitur: Sekretaris

Sekretaris adalah pelaksana administrasi utama RT yang bertugas menyusun pengumuman, agenda kegiatan, draf surat pengantar, pengaduan warga, serta membantu Ketua RT dalam verifikasi kependudukan.

---

## 1. Navigasi & Struktur Menu (Sitemap)

Ketika Sekretaris login, menu sidebar utama meliputi:
*   **Dashboard Utama:** Ringkasan surat keluar hari ini, aduan baru, dan kegiatan mendatang.
*   **Kelola Surat:** (Menu Utama - Direct Link) CRUD draf surat pengantar (tombol salin data per kolom, isi nomor manual) -> Kirim ke Ketua RT.
*   **Portal Informasi:** (Menu Utama)
    *   **Kelola Pengumuman:** (Sub-menu) CRUD penuh pengumuman warga.
    *   **Kelola Kegiatan:** (Sub-menu) CRUD penuh jadwal kegiatan RT.
*   **Kelola Pengaduan:** (Menu Utama) Memperbarui status aduan warga (Proses/Selesai).
*   **Kependudukan & Approval:** (Menu Utama)
    *   **Data Warga (Read-Only):** (Sub-menu) Akses data KK & warga untuk verifikasi / pengisian data surat.
    *   **Persetujuan Registrasi:** (Sub-menu) Membantu menyetujui akun pendaftaran warga mandiri.
    *   **Cetak QR Code:** (Sub-menu) Mengunduh & mencetak QR Code hunian.

---

## 2. Fitur & Tugas Utama

*   **SE-01: Dashboard Utama**
    Menampilkan ringkasan surat keluar hari ini, aduan baru yang masuk, dan daftar kegiatan RT terdekat.
*   **SE-02: Lihat Kependudukan**
    Mengakses daftar data warga tetap & Kartu Keluarga secara *read-only* (hanya membaca data kependudukan untuk membantu memvalidasi identitas saat pembuatan surat, tidak memiliki akses untuk menambah/mengedit/menghapus warga).
*   **SE-03: Kelola Pengumuman**
    Membuat, mengedit, atau menghapus informasi/pengumuman penting warga dengan kategori tertentu (umum, penting, mendesak).
*   **SE-04: Kelola Kegiatan**
    Membuat, mengedit, atau menghapus jadwal kegiatan sosial RT (rapat warga, kerja bakti, posyandu) lengkap dengan info tanggal, waktu, dan lokasi.
*   **SE-05: Administrasi Pengajuan Surat Pengantar (Hybrid)**
    *   **Meninjau Pengajuan Masuk:** Memantau antrean permohonan surat online yang diajukan oleh warga (status awal: `Menunggu Review`).
    *   **Memproses Surat Fisik (Offline dengan Bantuan Salin Data):** 
        *   **Penarikan Data Otomatis:** Meskipun warga hanya menginput Nama Pemohon, Jenis Surat, dan Keperluan, sistem otomatis menampilkan seluruh biodata lengkap warga terkait (Nama Lengkap, NIK, Tempat/Tanggal Lahir, Jenis Kelamin, Agama, Pekerjaan, Status Perkawinan, Alamat Lengkap, dan No KK) yang ditarik dari database kependudukan.
        *   **Pengecekan Otorisasi & Kelayakan:** Pengurus memverifikasi dua hal langsung pada layar detail sebelum membuat surat:
            1. *Status Verifikasi Warga:* Memastikan status data keluarga pemohon sudah `Verified` (berkas scan KK & KTP asli sudah disetujui pengurus sebelumnya).
            2. *Status Keuangan:* Memastikan keluarga pemohon tidak memiliki tunggakan iuran kas wajib (sistem menampilkan status keuangan KK secara real-time).
        *   **Penyalinan Data Presisi:** Pengurus menggunakan tombol salin (`copy icon`) di samping kolom data kependudukan secara individu (menyalin NIK saja, Nama saja, atau Alamat saja) atau tombol salin gabungan untuk ditempel (*paste*) ke template Word dinas offline di laptop.
        *   Mengubah status pengajuan di sistem menjadi **`Sedang Diproses`**.
    *   **Penyelesaian & Notifikasi Pengambilan:** 
        *   Setelah surat fisik selesai dicetak, ditandatangani & distempel basah secara manual oleh Ketua RT, pengurus menginput nomor surat tersebut di sistem untuk pengarsipan digital, lalu mengubah status menjadi **`Siap Diambil`**.
        *   Aplikasi secara otomatis mengirimkan email notifikasi pengambilan ke warga pemohon.
        *   Setelah warga datang mengambil surat fisik tersebut, pengurus mengubah status surat menjadi **`Selesai`** (Diserahkan) di sistem.
*   **SE-06: Kelola Pengaduan Warga**
    Memantau tabel laporan masuk dari halaman publik. Berwenang memperbarui status laporan menjadi `Proses` atau `Selesai` setelah berdiskusi dengan Ketua RT.
*   **SE-08: Verifikasi Registrasi Warga**
    Membantu Ketua RT dalam menyetujui pendaftaran akun warga mandiri (mengubah status dari `Pending` menjadi `Active`) untuk mempercepat proses aktivasi warga.
*   **SE-09: Cetak QR Code Rumah**
    Melihat, mengunduh secara individual, atau mengunduh massal QR Code alamat fisik rumah tinggal untuk dipasang di dinding luar rumah warga.

---

## 3. Alur Kerja Utama (Flowchart)

```mermaid
flowchart TD
    A[Sekretaris Login] --> B[Masuk Dashboard Pengurus]
    B --> C{Pilih Tindakan}
    
    C -->|Buat Surat| D[Pilih Template -> Isi Data -> Kirim ke Ketua RT]
    C -->|Kelola Konten| E[Buat Pengumuman & Jadwalkan Kegiatan]
    C -->|Kelola Aduan| F[Lihat Aduan -> Update Status Proses/Selesai]
    C -->|Bantu RT| G[Setujui Registrasi Akun Warga Baru]
    
    D --> H[Selesai]
    E --> H
    F --> H
    G --> H
```

---

## 4. Alur Kerja Detail (User Flow)

### 4.1 Flow Pengajuan & Pemrosesan Surat Pengantar (Hybrid)

```mermaid
flowchart TD
    A[Warga Mengajukan Surat Pengantar Online] --> B[Sistem catat pengajuan: Menunggu Review]
    B --> C[Sekretaris / Ketua RT buka menu Surat]
    C --> D[Ubah status menjadi: Sedang Diproses & Salin data warga per kolom / gabungan]
    D --> E[Pengurus paste ke template Word offline & print secara manual]
    E --> F[Ketua RT tanda tangan & stempel basah pada surat fisik]
    F --> G[Pengurus isi nomor surat & klik 'Tandai Siap Diambil']
    G --> H[Sistem ubah status: Siap Diambil & kirim Email Notifikasi]
    H --> I[Warga datang mengambil surat fisik di rumah pengurus]
    I --> J[Pengurus klik 'Tandai Diserahkan' di sistem]
    J --> K[Sistem ubah status: Selesai]
    K --> L[Selesai]
    
    %% Alur Penolakan
    C -->|Kriteria Tidak Sesuai| M[Pengurus klik Tolak & beri alasan]
    M --> N[Sistem ubah status: Ditolak & kirim Email ke Warga]
    N --> L
```
