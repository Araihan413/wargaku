import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { getFamilyById, getFamilyMemberById } from '../db/queries/kependudukan';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function testSuite() {
  console.log('🧪 Memulai Uji Coba REST API Kependudukan...');

  const timestamp = Date.now().toString().slice(-6);
  
  // Data RT
  const rtEmail = `test.rt.${timestamp}@example.com`;
  const rtNik = `1111111111${timestamp}`;

  // Data Warga
  const wargaEmail = `test.warga.${timestamp}@example.com`;
  const wargaNik = `2222222222${timestamp}`;

  const testFamilyNo = `3276888888${timestamp}`;
  const testQrToken = `qr-api-${timestamp}`;

  let createdDwellingId: number | undefined;
  let createdRtUserId: number | undefined;
  let createdWargaUserId: number | undefined;
  let createdFamilyId: number | undefined;
  let createdMemberId: number | undefined;

  let rtCookie: string | undefined;
  let wargaCookie: string | undefined;

  try {
    // ----------------------------------------------------
    // PREPARATION: Buat Dwelling & User RT/Warga di DB
    // ----------------------------------------------------
    console.log('\n--- 1. Menyiapkan Data Prasyarat di Database ---');
    
    // Hash password 'password123'
    const hashedPassword = await hashPassword('password123');

    // Insert Dwelling
    const [dwellingInsert] = await db.insert(schema.dwellings).values({
      streetName: 'Jl. API Testing',
      blockNumber: 'C2',
      houseNumber: '5',
      qrToken: testQrToken,
      type: 'permanen',
      isActive: true,
    });
    createdDwellingId = dwellingInsert.insertId;
    console.log(`✅ Dwelling Dummy dibuat dengan ID: ${createdDwellingId}`);

    // Insert User RT (roleId = 2)
    const [rtUserInsert] = await db.insert(schema.users).values({
      name: 'Pak RT Test',
      email: rtEmail,
      password: hashedPassword,
      nik: rtNik,
      phone: '0811111111',
      roleId: 2, // Ketua RT
      status: 'active',
    });
    createdRtUserId = rtUserInsert.insertId;
    console.log(`✅ User RT Dummy dibuat dengan ID: ${createdRtUserId}`);

    // Insert Account untuk User RT (Kredensial Better Auth)
    await db.insert(schema.accounts).values({
      id: `account-rt-${timestamp}`,
      accountId: rtEmail,
      providerId: 'credential',
      userId: createdRtUserId,
      password: hashedPassword,
    });
    console.log(`✅ Account RT Dummy berhasil didaftarkan.`);

    // Insert User Warga (roleId = 6)
    const [wargaUserInsert] = await db.insert(schema.users).values({
      name: 'Pak Warga Test',
      email: wargaEmail,
      password: hashedPassword,
      nik: wargaNik,
      phone: '0822222222',
      roleId: 6, // Warga
      status: 'active',
    });
    createdWargaUserId = wargaUserInsert.insertId;
    console.log(`✅ User Warga Dummy dibuat dengan ID: ${createdWargaUserId}`);

    // Insert Account untuk User Warga (Kredensial Better Auth)
    await db.insert(schema.accounts).values({
      id: `account-warga-${timestamp}`,
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

    // Helper untuk login dan mendapatkan Cookie
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
        let errBody = '';
        try {
          errBody = JSON.stringify(await res.json());
        } catch (e) {}
        throw new Error(`Gagal login untuk ${email}: ${res.statusText}. Respon: ${errBody}`);
      }
      const cookie = res.headers.get('set-cookie');
      if (!cookie) {
        throw new Error(`Tidak mendapatkan set-cookie dari login ${email}`);
      }
      return cookie;
    };

    // Lakukan login untuk mendapatkan cookie
    console.log('   Melakukan sign-in melalui API untuk mendapatkan cookies resmi...');
    rtCookie = await getSessionCookie(rtEmail);
    wargaCookie = await getSessionCookie(wargaEmail);
    console.log('✅ Cookies resmi berhasil diperoleh.');

    // ----------------------------------------------------
    // TEST 1: GET /api/families (Belum login)
    // ----------------------------------------------------
    console.log('\n--- Test 1: GET /api/families (Tanpa Login) ---');
    const t1 = await apiFetch('/api/families', 'GET');
    console.log(`Status: ${t1.status}, Error: ${t1.data?.error}`);
    if (t1.status !== 401) throw new Error('Harusnya mengembalikan 401 Unauthorized');
    console.log('✅ Lolos: Akses diblokir jika belum login.');

    // ----------------------------------------------------
    // TEST 2: GET /api/families (Login sebagai Warga)
    // ----------------------------------------------------
    console.log('\n--- Test 2: GET /api/families (Login Warga, Tidak berhak) ---');
    const t2 = await apiFetch('/api/families', 'GET', undefined, wargaCookie);
    console.log(`Status: ${t2.status}, Error: ${t2.data?.error}`);
    if (t2.status !== 403) throw new Error('Harusnya mengembalikan 403 Forbidden');
    console.log('✅ Lolos: Akses diblokir untuk peran Warga biasa.');

    // ----------------------------------------------------
    // TEST 3: GET /api/families (Login sebagai RT)
    // ----------------------------------------------------
    console.log('\n--- Test 3: GET /api/families (Login RT, Punya Izin) ---');
    const t3 = await apiFetch('/api/families', 'GET', undefined, rtCookie);
    console.log(`Status: ${t3.status}, Total Data: ${t3.data?.metadata?.total}`);
    if (t3.status !== 200) throw new Error('Harusnya mengembalikan 200 OK');
    console.log('✅ Lolos: RT berhasil mengambil daftar KK.');

    // ----------------------------------------------------
    // TEST 4: POST /api/families (Create KK sebagai RT)
    // ----------------------------------------------------
    console.log('\n--- Test 4: POST /api/families (RT membuat KK) ---');
    const t4 = await apiFetch('/api/families', 'POST', {
      dwellingId: createdDwellingId,
      familyNumber: testFamilyNo,
      headUserId: createdWargaUserId, // Kepalanya adalah user warga dummy kita
      headName: 'Pak Warga Test',
      checkInDate: new Date().toISOString().split('T')[0],
      unitNumber: '1',
    }, rtCookie);
    console.log(`Status: ${t4.status}, ID Terbuat: ${t4.data?.id}`);
    if (t4.status !== 201) throw new Error(`Harusnya mengembalikan 201 Created. Respon: ${JSON.stringify(t4.data)}`);
    createdFamilyId = t4.data.id;
    console.log('✅ Lolos: RT berhasil membuat KK baru.');

    // ----------------------------------------------------
    // TEST 5: GET /api/families/[id] (Warga melihat KK orang lain)
    // ----------------------------------------------------
    console.log('\n--- Test 5: GET /api/families/[id] (Warga melihat KK orang lain) ---');
    // Kita buat KK lain dulu sebagai RT agar ada "KK orang lain"
    const otherFamilyNo = `3276999999${timestamp}`;
    const otherFamilyRes = await apiFetch('/api/families', 'POST', {
      dwellingId: createdDwellingId,
      familyNumber: otherFamilyNo,
      headUserId: createdRtUserId, // Kepala keluarga adalah RT
      headName: 'Pak RT Test',
      checkInDate: new Date().toISOString().split('T')[0],
    }, rtCookie);
    const otherFamilyId = otherFamilyRes.data?.id;

    const t5 = await apiFetch(`/api/families/${otherFamilyId}`, 'GET', undefined, wargaCookie);
    console.log(`Status: ${t5.status}, Error: ${t5.data?.error}`);
    if (t5.status !== 403) throw new Error('Harusnya mengembalikan 403 Forbidden');
    console.log('✅ Lolos: Warga diblokir melihat KK orang lain.');

    // Bersihkan KK pembantu tadi
    if (otherFamilyId) {
      await db.delete(schema.familyMembers).where(eq(schema.familyMembers.familyId, otherFamilyId));
      await db.delete(schema.families).where(eq(schema.families.id, otherFamilyId));
    }

    // ----------------------------------------------------
    // TEST 6: GET /api/families/[id] (Warga melihat KK-nya sendiri)
    // ----------------------------------------------------
    console.log('\n--- Test 6: GET /api/families/[id] (Warga melihat KK-nya sendiri) ---');
    const t6 = await apiFetch(`/api/families/${createdFamilyId}`, 'GET', undefined, wargaCookie);
    console.log(`Status: ${t6.status}, No KK: ${t6.data?.familyNumber}, Jumlah Anggota: ${t6.data?.members?.length}`);
    if (t6.status !== 200) throw new Error('Harusnya mengembalikan 200 OK');
    console.log('✅ Lolos: Warga berhasil mengakses detail KK miliknya sendiri.');

    // ----------------------------------------------------
    // TEST 7: PUT /api/families/[id] (Warga mengupdate KK berstatus verified)
    // ----------------------------------------------------
    console.log('\n--- Test 7: PUT /api/families/[id] (Aturan Verified Lock Warga) ---');
    
    // Status KK default adalah 'pending', harusnya warga boleh edit
    const t7a = await apiFetch(`/api/families/${createdFamilyId}`, 'PUT', {
      unitNumber: '1-Edit',
    }, wargaCookie);
    console.log(`Status Edit (Saat Pending): ${t7a.status}, Data: ${JSON.stringify(t7a.data)}`);
    if (t7a.status !== 200) throw new Error('Harusnya berhasil diedit saat status pending');

    // RT menyetujui / memverifikasi KK ini
    await apiFetch(`/api/families/${createdFamilyId}`, 'PUT', {
      verificationStatus: 'verified',
    }, rtCookie);
    console.log('   Keluarga diverifikasi oleh RT (status: verified).');

    // Warga mencoba mengedit lagi
    const t7b = await apiFetch(`/api/families/${createdFamilyId}`, 'PUT', {
      unitNumber: '1-Edit2',
    }, wargaCookie);
    console.log(`Status Edit (Saat Verified): ${t7b.status}, Error: ${t7b.data?.error}`);
    if (t7b.status !== 403) throw new Error('Harusnya gagal mengedit (403) saat status verified');
    console.log('✅ Lolos: Warga diblokir mengedit KK yang berstatus verified.');

    // ----------------------------------------------------
    // TEST 8: POST /api/warga (Warga menambah anggota ke KK verified vs pending)
    // ----------------------------------------------------
    console.log('\n--- Test 8: POST /api/warga (Tambah anggota ke KK verified vs pending) ---');
    
    // Coba tambah anggota saat KK verified -> Harusnya ditolak (403)
    const t8a = await apiFetch('/api/warga', 'POST', {
      familyId: createdFamilyId,
      name: 'Istri Test',
      nik: wargaNik.replace('22', '33'), // NIK unik baru
      gender: 'P',
      relationship: 'Istri',
    }, wargaCookie);
    console.log(`Status Tambah Anggota (Saat Verified): ${t8a.status}, Error: ${t8a.data?.error}`);
    if (t8a.status !== 403) throw new Error('Harusnya diblokir menambah anggota jika KK verified');

    // RT mengubah status kembali menjadi pending (seperti alur "Ajukan Perubahan Data")
    await apiFetch(`/api/families/${createdFamilyId}`, 'PUT', {
      verificationStatus: 'pending',
    }, rtCookie);
    console.log('   RT mengubah status KK kembali ke pending.');

    // Coba tambah anggota saat KK pending -> Harusnya sukses (201)
    const t8b = await apiFetch('/api/warga', 'POST', {
      familyId: createdFamilyId,
      name: 'Istri Test',
      nik: wargaNik.replace('22', '33'), // NIK unik baru
      gender: 'P',
      relationship: 'Istri',
    }, wargaCookie);
    console.log(`Status Tambah Anggota (Saat Pending): ${t8b.status}, ID Anggota: ${t8b.data?.id}`);
    if (t8b.status !== 201) throw new Error('Harusnya sukses menambahkan anggota saat KK pending');
    createdMemberId = t8b.data.id;
    console.log('✅ Lolos: Aturan lock verified dan penambahan anggota berjalan dengan benar.');

    // ----------------------------------------------------
    // TEST 9: POST /api/warga (Validasi NIK unik)
    // ----------------------------------------------------
    console.log('\n--- Test 9: POST /api/warga (Validasi NIK Unik) ---');
    const t9 = await apiFetch('/api/warga', 'POST', {
      familyId: createdFamilyId,
      name: 'Orang Lain NIK Sama',
      nik: wargaNik.replace('22', '33'), // NIK sama dengan Istri
      gender: 'L',
      relationship: 'Anak',
    }, rtCookie);
    console.log(`Status: ${t9.status}, Error: ${t9.data?.error}`);
    if (t9.status !== 400) throw new Error('Harusnya mengembalikan 400 Bad Request');
    console.log('✅ Lolos: Duplikasi NIK berhasil ditolak.');

    // ----------------------------------------------------
    // TEST 10: DELETE /api/warga/[id] (Soft Delete Anggota)
    // ----------------------------------------------------
    console.log('\n--- Test 10: DELETE /api/warga/[id] (Soft Delete) ---');
    const t10 = await apiFetch(`/api/warga/${createdMemberId}`, 'DELETE', {
      inactiveReason: 'pindah',
    }, wargaCookie);
    console.log(`Status Soft Delete Warga: ${t10.status}, Respon: ${t10.data?.message}`);
    if (t10.status !== 200) throw new Error('Harusnya mengembalikan 200 OK');

    // Cek di DB apakah is_active warga = false
    const memberAfterDelete = await getFamilyMemberById(createdMemberId!);
    if (memberAfterDelete?.isActive !== false || memberAfterDelete?.inactiveReason !== 'pindah') {
      throw new Error('Penonaktifan warga di database gagal!');
    }
    console.log('✅ Lolos: Warga berhasil dinonaktifkan dengan status non-aktif dan alasan.');

    // ----------------------------------------------------
    // TEST 11: DELETE /api/families/[id] (Soft Delete KK)
    // ----------------------------------------------------
    console.log('\n--- Test 11: DELETE /api/families/[id] (Soft Delete KK) ---');
    const t11 = await apiFetch(`/api/families/${createdFamilyId}`, 'DELETE', undefined, rtCookie);
    console.log(`Status Soft Delete KK: ${t11.status}, Respon: ${t11.data?.message}`);
    if (t11.status !== 200) throw new Error('Harusnya mengembalikan 200 OK');

    const familyAfterDelete = await getFamilyById(createdFamilyId!);
    if (familyAfterDelete?.isActive !== false || !familyAfterDelete?.checkOutDate) {
      throw new Error('Penonaktifan KK di database gagal!');
    }
    console.log('✅ Lolos: KK berhasil dinonaktifkan beserta cascade anggota keluarga.');

    console.log('\n🎉 SEMUA PENGUJIAN REST API BERHASIL DAN LOLOS!');

  } catch (error) {
    console.error('\n❌ PENGUJIAN API GAGAL:', error);
  } finally {
    // ----------------------------------------------------
    // CLEANUP: Bersihkan data test dari DB
    // ----------------------------------------------------
    console.log('\n--- 12. Membersihkan Data Hasil Pengujian API ---');
    try {
      if (createdFamilyId) {
        await db.delete(schema.familyMembers).where(eq(schema.familyMembers.familyId, createdFamilyId));
        await db.delete(schema.families).where(eq(schema.families.id, createdFamilyId));
      }
      if (createdRtUserId) {
        await db.delete(schema.accounts).where(eq(schema.accounts.userId, createdRtUserId));
        await db.delete(schema.sessions).where(eq(schema.sessions.userId, createdRtUserId));
        await db.delete(schema.users).where(eq(schema.users.id, createdRtUserId));
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
