# Panduan Peran & Fitur: Bendahara

Bendahara bertanggung jawab penuh atas pembukuan dan pengelolaan keuangan kas RT, penagihan dan pencatatan setoran iuran warga, pelaporan arus kas secara transparan dan akuntabel, serta penerbitan laporan keuangan resmi ber-kop surat RT.

---

## 1. Navigasi & Struktur Menu (Sitemap)

Ketika Bendahara login ke sistem, menu navigasi sidebar meliputi:

*   **Dashboard:** Ringkasan metrik saldo kas RT, capaian iuran warga, perbandingan arus kas bulan ini, dan riwayat transaksi terkini (`/dashboard`).
*   **Kas RT (Cashflow):** (Menu Dropdown Accordion)
    *   **Catat Pemasukan Kas:** Pencatatan dan pengelolaan kas masuk RT di luar iuran warga (donasi, sumbangan, sewa fasilitas) (`/dashboard/cash/income`).
    *   **Catat Pengeluaran Kas:** Pencatatan dan pengelolaan kas keluar operasional RT disertai unggah bukti nota kuitansi fisik (`/dashboard/cash/expense`).
    *   **Laporan Keuangan Kas RT:** Rekapitulasi pembukuan kas bulanan, diagram kategori, dan ekspor cetak PDF laporan keuangan resmi ber-kop RT (`/dashboard/cash/reports`).
*   **Iuran Warga:** (Menu Dropdown Accordion)
    *   **Kelola & Setor Iuran:** Pengaturan aturan tarif iuran dan pencatatan setoran iuran warga per periode (`/dashboard/dues/manage`).
    *   **Laporan Tunggakan Iuran:** Rekapitulasi status pembayaran dan pemantauan daftar tunggakan iuran seluruh KK (`/dashboard/dues/arrears`).
*   **Fitur Personal (Mode Warga):** Melalui fitur *Switch Role* di Navbar, Bendahara dapat beralih ke *Mode Warga Personal* untuk mengelola data keluarga pribadi (`/dashboard/family`), melihat peta tetangga (`/dashboard/neighborhood`), histori iuran mandiri (`/dashboard/my-fees`), dan aset properti milik sendiri (`/dashboard/my-properties`).

---

## 2. Fitur & Tugas Utama

*   **BE-01: Dashboard Keuangan RT (Financial Center)**
    Merupakan panel kendali utama Bendahara untuk memantau kesehatan finansial RT secara real-time:
    *   **A. 4 KPI Cards Ringkasan Keuangan:**
        *   `Total Saldo Kas RT`: Akumulasi saldo kas riil (Total Pemasukan dikurangi Total Pengeluaran).
        *   `Pemasukan Bulan Ini`: Akumulasi uang masuk (setoran iuran warga + pemasukan non-iuran) pada bulan berjalan.
        *   `Pengeluaran Bulan Ini`: Total uang keluar yang dibelanjakan pada bulan berjalan.
        *   `Capaian Iuran Bulan Ini`: Persentase dan rasio Kepala Keluarga (KK) yang telah melunasi iuran pada periode aktif (misal: *"85% KK Lunas (34 dari 40 KK Terbayar)"*).
    *   **B. Cashflow Overview Card:**
        *   `Perbandingan Arus Kas`: Visualisasi persentase dan nominal pemasukan vs pengeluaran bulan ini.
        *   `Net Cashflow (Selisih Bersih)`: Menampilkan angka surplus/defisit kas bulan berjalan secara real-time.
        *   `Status Kepatuhan Iuran (Dues Compliance)`: Rekap perbandingan KK yang sudah lunas vs belum lunas.
    *   **C. Recent Transactions Widget:**
        *   Tabel transaksi keuangan terkini dengan badge tipe pemasukan/pengeluaran, kategori, tanggal, nominal, dan tautan pratinjau bukti nota kuitansi digital.

*   **BE-02: Pencatatan Kas Masuk (Income Management - `/dashboard/cash/income`)**
    *   Mencatat penerimaan kas RT non-iuran (donasi sukarela, dana sumbangan perayaan 17 Agustus, sewa aula/lapangan RT).
    *   Setiap input kas masuk otomatis menambah saldo kas utama secara real-time.
    *   Dilengkapi fitur filter pencarian, pengurutan, pengeditan, dan penghapusan transaksi.

*   **BE-03: Pencatatan Kas Keluar (Expense Management - `/dashboard/cash/expense`)**
    *   Mencatat pengeluaran kas operasional RT (biaya kebersihan, penerangan jalan, perbaikan fasilitas umum, konsumsi rapat warga).
    *   **Opsional mengunggah bukti nota / scan kuitansi fisik** sebagai bukti pertanggungjawaban digital.
    *   Tersedia pratinjau dokumen nota melalui modal penampil berkas aman (*SecureDocumentLink*).
    *   Setiap pengeluaran kas yang tersimpan otomatis memotong saldo kas utama secara real-time.

*   **BE-04: Laporan Keuangan Resmi & Cetak PDF (`/dashboard/cash/reports`)**
    *   Pemilihan periode laporan bulanan dan tahunan secara fleksibel.
    *   Visualisasi diagram tren arus kas dan diagram alokasi pengeluaran per kategori.
    *   **Cetak Dokumen PDF Resmi:** Menghasilkan dokumen laporan pertanggungjawaban keuangan resmi ber-kop surat RT lengkap dengan kolom tanda tangan digital Bendahara dan Ketua RT.

*   **BE-05: Pengelolaan Iuran Warga & Tunggakan (`/dashboard/dues`)**
    *   **Konfigurasi Aturan Iuran (`fee_rules`):** Menetapkan nama iuran dan nominal tarif bulanan per KK (misal: Rp 50.000/bulan). Seluruh aturan iuran bersifat **100% Wajib** secara default. Bendahara dapat mengubah status aturan menjadi **Aktif** atau **Non-Aktif** (aturan non-aktif menghentikan pembuatan tagihan baru, menonaktifkan tombol generate, dan diposisikan di urutan paling bawah).
    *   **Generate Tagihan Iuran & Auto-Billing:** 
        *   *Auto-Billing Pasif (JIT):* Sistem secara otomatis men-generate tagihan bulan berjalan saat pengurus atau warga membuka menu iuran.
        *   *Saat Pembuatan Aturan:* Saat aturan aktif baru dibuat, sistem langsung meng-generate tagihan bulan berjalan untuk seluruh KK aktif.
        *   *Tombol Generate Manual:* Tersedia pada kartu aturan aktif untuk sinkronisasi tagihan KK yang baru terdaftar.
    *   **Pencatatan Pembayaran Multi-Periode & Advance Payment (`/dashboard/dues/manage`):**
        *   *Waterfall Settlement:* Sistem secara cerdas mengalokasikan setoran warga secara berurutan: melunasi tunggakan terlama $\rightarrow$ melunasi tagihan bulan berjalan $\rightarrow$ mencatat pembayaran di muka (*Advance Payment*) untuk bulan-bulan mendatang.
        *   *Presisi Filter 'Semua Periode':* Batas kewajiban riil dihitung sampai bulan berjalan ($\le \text{currentPeriod}$), sehingga pembayaran di muka tidak membuat warga keliru berstatus "Kurang Bayar".
        *   *Simulasi Alokasi Modal:* Modal pembayaran menampilkan pratinjau kartu alokasi periode dan sisa nominal parsial secara real-time.
        *   *Sinkronisasi Kas Otomatis:* Setiap pembayaran langsung dicatat sebagai transaksi kas masuk (`income` / `Iuran Warga`) pada kas utama RT.
        *   *Tanda Terima Digital:* Pembayaran otomatis terbit di akun warga sebagai riwayat transaksi resmi (`/dashboard/my-fees`).
    *   **Laporan Tunggakan Iuran (`/dashboard/dues/arrears`):** Rekapitulasi daftar KK yang menunggak pembayaran iuran lampau dan bulan berjalan beserta total akumulasi nominal untuk monitoring penagihan.

*   **BE-06: Fitur Dual Role (Mode Warga Personal)**
    *   Bendahara RT dapat berganti peran secara instan ke *Mode Warga Personal* untuk mengelola data anggota keluarganya sendiri, memantau iuran pribadi, dan melihat aset sewa pribadi tanpa perlu keluar dari akun.

---

## 3. Alur Kerja Utama (Flowchart)

```mermaid
flowchart TD
    A[Bendahara Login] --> B[Masuk Dashboard Keuangan RT]
    B --> C{Pilih Menu Tindakan}
    
    C -->|Kas Masuk| D[Catat Pemasukan Kas Non-Iuran -> Saldo Kas Bertambah]
    C -->|Kas Keluar| E[Catat Pengeluaran Kas & Unggah Bukti Nota -> Saldo Kas Berkurang]
    C -->|Laporan Keuangan| F[Tinjau Arus Kas Bulanan & Cetak PDF Resmi Ber-Kop RT]
    C -->|Kelola Iuran| G[Input Pembayaran Iuran KK & Pantau Laporan Tunggakan]
    C -->|Kebutuhan Pribadi| H[Beralih ke Mode Warga Personal]
    
    D --> I[Selesai]
    E --> I
    F --> I
    G --> I
    H --> I
```

---

## 4. Alur Kerja Detail (User Flow)

### 4.1 Flow Pencatatan Kas Masuk & Kas Keluar

```mermaid
flowchart TD
    A[Mulai] --> B[Bendahara Buka Menu 'Kas RT']
    B --> C{Pilih Jenis Transaksi}
    
    %% Kas Masuk
    C -->|Pemasukan| D[Buka 'Catat Pemasukan Kas' -> Klik 'Catat Pemasukan Baru']
    D --> E[Input Kategori, Nominal, Tanggal & Keterangan Sumber Dana]
    E --> F[Simpan Pemasukan -> Saldo Kas RT Otomatis Bertambah]
    
    %% Kas Keluar
    C -->|Pengeluaran| G[Buka 'Catat Pengeluaran Kas' -> Klik 'Catat Pengeluaran Baru']
    G --> H[Input Kategori, Nominal, Tanggal & Keterangan Belanja]
    H --> I[Unggah Foto / Scan Nota Kuitansi Fisik]
    I --> J[Simpan Pengeluaran -> Saldo Kas RT Otomatis Berkurang]
    
    F --> K[Transaksi Masuk ke Riwayat Keuangan & Widget Dashboard]
    J --> K
    K --> L[Selesai]
```

### 4.2 Flow Pengelolaan Iuran Warga & Penanganan Tunggakan

```mermaid
flowchart TD
    A[Mulai] --> B[Bendahara Buka Menu 'Iuran Warga']
    B --> C{Pilih Aksi Operasional}
    
    %% Aturan Iuran
    C -->|Atur Tarif Iuran| D[Buka Tab Aturan Iuran -> Klik 'Tambah Aturan Iuran' / Edit Aturan]
    D --> E[Input Nama Iuran, Nominal per KK & Status: Aktif / Non-Aktif -> Simpan]
    E --> F[Sistem Auto-Generate Tagihan untuk Seluruh KK Aktif jika Aturan Aktif]
    
    %% Setor Iuran
    C -->|Catat Setoran Warga| G[Cari Nama KK di Tab 'Kelola & Setor Iuran' -> Klik 'Bayar Iuran' / '+ Bayar Dimuka']
    G --> H[Input Nominal Uang Diterima, Pilihan Cepat 1/3/6/12 Bln, & Metode: Cash / Transfer]
    H --> I[Sistem Tampilkan Preview Alokasi Waterfall: Tunggakan -> Bulan Ini -> Advance]
    I --> J[Simpan Pembayaran -> Sistem Eksekusi Batch Multi-Bulan ke Database]
    
    J --> K[Sistem Otomatis Tambah Uang Masuk ke Buku Kas Utama RT]
    K --> L[Sistem Terbitkan Tanda Terima Digital Resmi di Dashboard Warga]
    
    %% Laporan Tunggakan
    C -->|Pantau Tunggakan| M[Buka Tab 'Laporan Tunggakan Iuran']
    M --> N[Tinjau Daftar KK Penunggak & Akumulasi Periode Belum Terbayar]
    
    F --> O[Selesai]
    L --> O
    N --> O
```

### 4.3 Flow Penyusunan & Pencetakan Laporan Keuangan Bulanan

```mermaid
flowchart TD
    A[Mulai] --> B[Bendahara Buka Menu 'Laporan Keuangan Kas RT']
    B --> C[Pilih Periode Bulan dan Tahun Pembukuan]
    C --> D[Sistem Menampilkan Grafik Arus Kas, Diagram Pengeluaran & Ringkasan Saldo]
    D --> E[Bendahara Meninjau Keseluruhan Rincian Pemasukan dan Pengeluaran]
    E --> F[Klik Tombol 'Cetak Laporan PDF']
    F --> G[Sistem Generate Dokumen PDF Resmi Ber-Kop RT dengan Tanda Tangan Digital Pengurus]
    G --> H[Bendahara Mengunduh / Mencetak Dokumen untuk Pertanggungjawaban Rapat Warga]
    H --> I[Selesai]
```

