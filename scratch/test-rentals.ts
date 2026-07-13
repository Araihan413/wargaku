import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { getRentalPropertyById, getRentalResidentById } from '../db/queries/rental';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function testSuite() {
  console.log('🧪 Memulai Uji Coba REST API Pengelolaan Kos & Kontrakan...');

  const timestamp = Date.now().toString().slice(-6);
  
  // Data RT
  const rtEmail = `test.rt.rental.${timestamp}@example.com`;
  const rtNik = `1111111111${timestamp}`;

  // Data Koordinator A
  const koorAEmail = `test.koora.rental.${timestamp}@example.com`;
  const koorANik = `2222222222${timestamp}`;

  // Data Koordinator B
  const koorBEmail = `test.koorb.rental.${timestamp}@example.com`;
  const koorBNik = `3333333333${timestamp}`;

  // Data Warga
  const wargaEmail = `test.warga.rental.${timestamp}@example.com`;
  const wargaNik = `4444444444${timestamp}`;

  // Data Resident NIK
  const resNik = `5555555555${timestamp}`;
  const testQrToken = `qr-rental-test-${timestamp}`;

  let createdDwellingId: number | undefined;
  let createdRtUserId: number | undefined;
  let createdKoorAUserId: number | undefined;
  let createdKoorBUserId: number | undefined;
  let createdWargaUserId: number | undefined;
  
  let createdPropertyId: number | undefined;
  let createdResidentId: number | undefined;

  let rtCookie: string | undefined;
  let koorACookie: string | undefined;
  let koorBCookie: string | undefined;
  let wargaCookie: string | undefined;

  try {
    // ----------------------------------------------------
    // PREPARATION: Buat Dwelling & Users di DB
    // ----------------------------------------------------
    console.log('\n--- 1. Menyiapkan Data Prasyarat di Database ---');
    
    const hashedPassword = await hashPassword('password123');

    // Insert Dwelling
    const [dwellingInsert] = await db.insert(schema.dwellings).values({
      streetName: 'Jl. Rental Testing',
      blockNumber: 'R1',
      houseNumber: '10',
      qrToken: testQrToken,
      type: 'kos',
      isActive: true,
    });
    createdDwellingId = dwellingInsert.insertId;
    console.log(`✅ Dwelling Dummy dibuat dengan ID: ${createdDwellingId}`);

    // Insert User RT (roleId = 2)
    const [rtUserInsert] = await db.insert(schema.users).values({
      name: 'Pak RT Rental',
      email: rtEmail,
      password: hashedPassword,
      nik: rtNik,
      phone: '0811111111',
      roleId: 2,
      status: 'active',
    });
    createdRtUserId = rtUserInsert.insertId;
    await db.insert(schema.accounts).values({
      id: `account-rt-rental-${timestamp}`,
      accountId: rtEmail,
      providerId: 'credential',
      userId: createdRtUserId,
      password: hashedPassword,
    });
    console.log(`✅ Account RT Dummy berhasil didaftarkan.`);

    // Insert User Koordinator A (roleId = 5)
    const [koorAUserInsert] = await db.insert(schema.users).values({
      name: 'Koor Kos Melati',
      email: koorAEmail,
      password: hashedPassword,
      nik: koorANik,
      phone: '0822222222',
      roleId: 5,
      status: 'active',
    });
    createdKoorAUserId = koorAUserInsert.insertId;
    await db.insert(schema.accounts).values({
      id: `account-koora-rental-${timestamp}`,
      accountId: koorAEmail,
      providerId: 'credential',
      userId: createdKoorAUserId,
      password: hashedPassword,
    });
    console.log(`✅ Account Koordinator A Dummy berhasil didaftarkan.`);

    // Insert User Koordinator B (roleId = 5)
    const [koorBUserInsert] = await db.insert(schema.users).values({
      name: 'Koor Kos Mawar',
      email: koorBEmail,
      password: hashedPassword,
      nik: koorBNik,
      phone: '0833333333',
      roleId: 5,
      status: 'active',
    });
    createdKoorBUserId = koorBUserInsert.insertId;
    await db.insert(schema.accounts).values({
      id: `account-koorb-rental-${timestamp}`,
      accountId: koorBEmail,
      providerId: 'credential',
      userId: createdKoorBUserId,
      password: hashedPassword,
    });
    console.log(`✅ Account Koordinator B Dummy berhasil didaftarkan.`);

    // Insert User Warga (roleId = 6)
    const [wargaUserInsert] = await db.insert(schema.users).values({
      name: 'Pak Warga Biasa',
      email: wargaEmail,
      password: hashedPassword,
      nik: wargaNik,
      phone: '0844444444',
      roleId: 6,
      status: 'active',
    });
    createdWargaUserId = wargaUserInsert.insertId;
    await db.insert(schema.accounts).values({
      id: `account-warga-rental-${timestamp}`,
      accountId: wargaEmail,
      providerId: 'credential',
      userId: createdWargaUserId,
      password: hashedPassword,
    });
    console.log(`✅ Account Warga Dummy berhasil didaftarkan.`);

    // Helper untuk memanggil API
    const apiFetch = async (path: string, method = 'GET', body?: any, cookie?: string) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Origin': BASE_URL,
      };
      if (cookie) {
        headers['Cookie'] = cookie;
      }
      
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const status = res.status;
      let data = null;
      try {
        data = await res.json();
      } catch (e) {}
      return { status, data };
    };

    // Helper untuk login
    const getSessionCookie = async (email: string) => {
      const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': BASE_URL,
        },
        body: JSON.stringify({
          email,
          password: 'password123',
        }),
      });
      if (!res.ok) {
        throw new Error(`Gagal login untuk ${email}`);
      }
      const cookie = res.headers.get('set-cookie');
      if (!cookie) {
        throw new Error(`Tidak mendapatkan cookie dari login ${email}`);
      }
      return cookie;
    };

    rtCookie = await getSessionCookie(rtEmail);
    koorACookie = await getSessionCookie(koorAEmail);
    koorBCookie = await getSessionCookie(koorBEmail);
    wargaCookie = await getSessionCookie(wargaEmail);
    console.log('✅ Semua cookies berhasil diperoleh.');

    // ----------------------------------------------------
    // TEST 1: POST /api/rentals (Pendaftaran Properti Sewa)
    // ----------------------------------------------------
    console.log('\n--- Test 1: POST /api/rentals (Pendaftaran Properti Sewa) ---');
    
    // Warga mencoba mendaftar properti -> Harusnya ditolak (403)
    const t1a = await apiFetch('/api/rentals', 'POST', {
      dwellingId: createdDwellingId,
      name: 'Kos Warga Gagal',
      totalRooms: 5,
    }, wargaCookie);
    console.log(`Status Warga Daftar Properti: ${t1a.status}, Error: ${t1a.data?.error}`);
    if (t1a.status !== 403) throw new Error('Warga harusnya diblokir mendaftar properti sewa');

    // Koordinator A mendaftar properti sewa baru -> Sukses
    const t1b = await apiFetch('/api/rentals', 'POST', {
      dwellingId: createdDwellingId,
      name: 'Kos Melati',
      contactPerson: 'Pak Koor A',
      phone: '081222222222',
      totalRooms: 2, // Set ke 2 untuk tes batas kapasitas nanti
    }, koorACookie);
    console.log(`Status Koordinator A Daftar: ${t1b.status}, ID: ${t1b.data?.id}`);
    if (t1b.status !== 201) throw new Error('Koordinator A harusnya berhasil mendaftar properti');
    createdPropertyId = t1b.data.id;
    console.log('✅ Lolos: Otorisasi pendaftaran properti sewa berjalan benar.');

    // ----------------------------------------------------
    // TEST 2: GET /api/rentals (Daftar Properti Sewa & Filter)
    // ----------------------------------------------------
    console.log('\n--- Test 2: GET /api/rentals (Daftar & Filter Otorisasi) ---');
    
    // Koordinator A melihat daftarnya -> Hanya melihat miliknya
    const t2a = await apiFetch('/api/rentals', 'GET', undefined, koorACookie);
    console.log(`Koordinator A melihat properti, total: ${t2a.data?.data?.length}`);
    if (t2a.status !== 200 || t2a.data?.data?.length !== 1) {
      throw new Error('Koordinator A harusnya hanya melihat 1 properti miliknya');
    }

    // Koordinator B melihat daftarnya -> Kosong (0)
    const t2b = await apiFetch('/api/rentals', 'GET', undefined, koorBCookie);
    console.log(`Koordinator B melihat properti, total: ${t2b.data?.data?.length}`);
    if (t2b.status !== 200 || t2b.data?.data?.length !== 0) {
      throw new Error('Koordinator B harusnya tidak melihat properti milik Koordinator A');
    }

    // RT melihat daftarnya -> Bisa melihat properti Koordinator A
    const t2c = await apiFetch('/api/rentals', 'GET', undefined, rtCookie);
    console.log(`RT melihat properti, total: ${t2c.data?.data?.length}`);
    if (t2c.status !== 200 || t2c.data?.data?.length < 1) {
      throw new Error('RT harusnya bisa melihat seluruh properti');
    }
    console.log('✅ Lolos: Filter kepemilikan dan hak akses list properti berhasil.');

    // ----------------------------------------------------
    // TEST 3: PUT /api/rentals/[id] (Edit Detail Properti)
    // ----------------------------------------------------
    console.log('\n--- Test 3: PUT /api/rentals/[id] (Edit Properti Sewa) ---');

    // Koordinator B mencoba mengedit Kos milik Koordinator A -> Harusnya ditolak (403)
    const t3a = await apiFetch(`/api/rentals/${createdPropertyId}`, 'PUT', {
      name: 'Kos Melati Di-Hack',
    }, koorBCookie);
    console.log(`Status Koor B edit Koor A: ${t3a.status}, Error: ${t3a.data?.error}`);
    if (t3a.status !== 403) throw new Error('Koordinator B harusnya ditolak mengedit properti A');

    // Koordinator A mengedit nama Kos -> Sukses (200)
    const t3b = await apiFetch(`/api/rentals/${createdPropertyId}`, 'PUT', {
      name: 'Kos Melati Edit',
      totalRooms: 1, // Kita kecilkan kapasitasnya menjadi 1 kamar saja untuk tes validasi kapasitas
    }, koorACookie);
    console.log(`Status Koor A edit: ${t3b.status}, Respon: ${t3b.data?.message}`);
    if (t3b.status !== 200) throw new Error('Koordinator A harusnya bisa mengedit propertinya');
    console.log('✅ Lolos: Validasi kepemilikan edit properti berhasil.');

    // ----------------------------------------------------
    // TEST 4: POST /api/rentals/[id]/residents (Check-In Penghuni)
    // ----------------------------------------------------
    console.log('\n--- Test 4: POST /api/rentals/[id]/residents (Check-In Penghuni) ---');

    // Check-In penyewa pertama (Andi) -> Sukses
    const t4a = await apiFetch(`/api/rentals/${createdPropertyId}/residents`, 'POST', {
      tenantType: 'perorangan',
      name: 'Andi Test',
      nik: resNik,
      phone: '08987654321',
      roomNumber: 'Kamar A',
      checkInDate: '2026-07-13',
    }, koorACookie);
    console.log(`Status Check-In Andi: ${t4a.status}, ID: ${t4a.data?.id}`);
    if (t4a.status !== 201) throw new Error('Check-in Andi harusnya sukses');
    createdResidentId = t4a.data.id;

    // Coba Check-In dengan NIK yang sama -> Ditolak (400)
    const t4b = await apiFetch(`/api/rentals/${createdPropertyId}/residents`, 'POST', {
      tenantType: 'perorangan',
      name: 'Andi Duplikat',
      nik: resNik, // NIK sama
      phone: '08987654322',
      roomNumber: 'Kamar B',
      checkInDate: '2026-07-13',
    }, koorACookie);
    console.log(`Status NIK Duplikat: ${t4b.status}, Error: ${t4b.data?.error}`);
    if (t4b.status !== 400) throw new Error('Harusnya gagal (400) karena NIK duplikat');

    // Coba Check-In penyewa kedua (Budi) -> Harusnya ditolak (403) karena kapasitas totalRooms di-set = 1
    const t4c = await apiFetch(`/api/rentals/${createdPropertyId}/residents`, 'POST', {
      tenantType: 'perorangan',
      name: 'Budi Test',
      nik: resNik.replace('55', '66'), // NIK baru unik
      phone: '08987654323',
      roomNumber: 'Kamar B',
      checkInDate: '2026-07-13',
    }, koorACookie);
    console.log(`Status Kamar Penuh: ${t4c.status}, Error: ${t4c.data?.error}`);
    if (t4c.status !== 403) throw new Error('Harusnya ditolak (403) karena kamar penuh');
    console.log('✅ Lolos: Batas kapasitas dan validasi unik NIK berjalan dengan benar.');

    // ----------------------------------------------------
    // TEST 5: PUT /api/rental-residents/[id] (Edit & Lock Verified)
    // ----------------------------------------------------
    console.log('\n--- Test 5: PUT /api/rental-residents/[id] (Edit & Lock Verified) ---');

    // Koordinator A mengedit data Andi (Pekerjaan) -> Sukses
    const t5a = await apiFetch(`/api/rental-residents/${createdResidentId}`, 'PUT', {
      occupation: 'Programmer',
    }, koorACookie);
    console.log(`Status Koor A edit penyewa: ${t5a.status}`);
    if (t5a.status !== 200) throw new Error('Harusnya sukses mengedit penyewa sendiri');

    // RT melakukan verifikasi berkas penyewa (status -> verified)
    const t5b = await apiFetch(`/api/rental-residents/${createdResidentId}`, 'PUT', {
      verificationStatus: 'verified',
      verificationNote: 'Berkas valid',
    }, rtCookie);
    console.log(`Status RT Verifikasi: ${t5b.status}`);
    if (t5b.status !== 200) throw new Error('RT harusnya bisa melakukan verifikasi');

    // Koordinator A mencoba mengedit kembali data Andi -> Harusnya ditolak (403) karena berstatus verified
    const t5c = await apiFetch(`/api/rental-residents/${createdResidentId}`, 'PUT', {
      occupation: 'Manager',
    }, koorACookie);
    console.log(`Status Edit saat Verified: ${t5c.status}, Error: ${t5c.data?.error}`);
    if (t5c.status !== 403) throw new Error('Harusnya diblokir (403) karena status sudah verified');
    console.log('✅ Lolos: Status verified berhasil mengunci data penyewa dari perubahan Koordinator.');

    // ----------------------------------------------------
    // TEST 6: POST /api/rental-residents/[id]/check-out
    // ----------------------------------------------------
    console.log('\n--- Test 6: POST /api/rental-residents/[id]/check-out (Check-Out) ---');
    
    const t6 = await apiFetch(`/api/rental-residents/${createdResidentId}/check-out`, 'POST', {
      checkOutDate: '2026-07-20',
      inactiveReason: 'pindah',
    }, koorACookie);
    console.log(`Status Check-Out: ${t6.status}, Respon: ${t6.data?.message}`);
    if (t6.status !== 200) throw new Error('Proses check-out harusnya sukses');

    // Cek di DB bahwa status tidak aktif
    const resAfterDb = await getRentalResidentById(createdResidentId!);
    if (resAfterDb?.isActive !== false || !resAfterDb?.checkOutDate) {
      throw new Error('Status aktif di DB gagal berubah setelah check-out');
    }
    console.log('✅ Lolos: Proses Check-Out mengubah status aktif menjadi false.');

    // ----------------------------------------------------
    // TEST 7: DELETE /api/rental-residents/[id] (Hapus Penghuni)
    // ----------------------------------------------------
    console.log('\n--- Test 7: DELETE /api/rental-residents/[id] (Hapus) ---');

    // Karena Andi sekarang berstatus tidak aktif (historis) dan diverifikasi, harusnya ditolak jika didelete
    const t7a = await apiFetch(`/api/rental-residents/${createdResidentId}`, 'DELETE', undefined, koorACookie);
    console.log(`Status Delete data Verified/Histori: ${t7a.status}, Error: ${t7a.data?.error}`);
    if (t7a.status !== 403) throw new Error('Harusnya ditolak menghapus data yang bukan pending');

    // Koordinator A menambahkan properti kapasitas ditambah
    await apiFetch(`/api/rentals/${createdPropertyId}`, 'PUT', {
      totalRooms: 5,
    }, koorACookie);

    // Check-In penyewa baru yang statusnya pending
    const t7b = await apiFetch(`/api/rentals/${createdPropertyId}/residents`, 'POST', {
      tenantType: 'perorangan',
      name: 'Penyewa Sementara',
      nik: resNik.replace('55', '77'),
      checkInDate: '2026-07-13',
    }, koorACookie);
    const tempResidentId = t7b.data.id;

    // Hapus penyewa sementara (status masih pending) -> Sukses
    const t7c = await apiFetch(`/api/rental-residents/${tempResidentId}`, 'DELETE', undefined, koorACookie);
    console.log(`Status Delete data Pending: ${t7c.status}`);
    if (t7c.status !== 200) throw new Error('Harusnya sukses menghapus data berstatus pending');
    console.log('✅ Lolos: Aturan penghapusan data pending vs verified berjalan dengan benar.');

    // ----------------------------------------------------
    // TEST 8: DELETE /api/rentals/[id] (Hapus Properti Sewa)
    // ----------------------------------------------------
    console.log('\n--- Test 8: DELETE /api/rentals/[id] (Soft Delete Properti) ---');
    
    const t8 = await apiFetch(`/api/rentals/${createdPropertyId}`, 'DELETE', undefined, koorACookie);
    console.log(`Status Delete Properti: ${t8.status}`);
    if (t8.status !== 200) throw new Error('Harusnya sukses melakukan soft delete properti');

    const propAfterDb = await getRentalPropertyById(createdPropertyId!);
    if (propAfterDb?.isActive !== false) {
      throw new Error('Properti sewa masih aktif di database!');
    }
    console.log('✅ Lolos: Properti sewa berhasil dinonaktifkan.');

    console.log('\n🎉 SEMUA PENGUJIAN API KOS & KONTRAKAN BERHASIL DAN LOLOS!');

  } catch (error) {
    console.error('\n❌ PENGUJIAN API GAGAL:', error);
  } finally {
    // ----------------------------------------------------
    // CLEANUP: Bersihkan data test dari DB
    // ----------------------------------------------------
    console.log('\n--- 9. Membersihkan Data Hasil Pengujian API ---');
    try {
      if (createdPropertyId) {
        await db.delete(schema.rentalResidents).where(eq(schema.rentalResidents.rentalPropertyId, createdPropertyId));
        await db.delete(schema.rentalProperties).where(eq(schema.rentalProperties.id, createdPropertyId));
      }
      if (createdRtUserId) {
        await db.delete(schema.accounts).where(eq(schema.accounts.userId, createdRtUserId));
        await db.delete(schema.sessions).where(eq(schema.sessions.userId, createdRtUserId));
        await db.delete(schema.users).where(eq(schema.users.id, createdRtUserId));
      }
      if (createdKoorAUserId) {
        await db.delete(schema.accounts).where(eq(schema.accounts.userId, createdKoorAUserId));
        await db.delete(schema.sessions).where(eq(schema.sessions.userId, createdKoorAUserId));
        await db.delete(schema.users).where(eq(schema.users.id, createdKoorAUserId));
      }
      if (createdKoorBUserId) {
        await db.delete(schema.accounts).where(eq(schema.accounts.userId, createdKoorBUserId));
        await db.delete(schema.sessions).where(eq(schema.sessions.userId, createdKoorBUserId));
        await db.delete(schema.users).where(eq(schema.users.id, createdKoorBUserId));
      }
      if (createdWargaUserId) {
        await db.delete(schema.accounts).where(eq(schema.accounts.userId, createdWargaUserId));
        await db.delete(schema.sessions).where(eq(schema.sessions.userId, createdWargaUserId));
        await db.delete(schema.users).where(eq(schema.users.id, createdWargaUserId));
      }
      if (createdDwellingId) {
        await db.delete(schema.dwellings).where(eq(schema.dwellings.id, createdDwellingId));
      }
      console.log('✅ Database dibersihkan kembali.');
    } catch (cleanupError) {
      console.error('⚠️ Gagal membersihkan database hasil pengujian:', cleanupError);
    }
  }
}

testSuite();
