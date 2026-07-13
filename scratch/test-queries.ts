/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  createFamily,
  getFamilyById,
  getFamilyByNumber,
  getFamilyByHeadUserId,
  listFamilies,
  updateFamily,
  deleteFamily,
  createFamilyMember,
  getFamilyMemberById,
  getFamilyMemberByNik,
  getFamilyMembersByFamilyId,
  listFamilyMembers,
  updateFamilyMember,
  deleteFamilyMember,
} from '../db/queries/kependudukan';

async function testSuite() {
  console.log('🧪 Memulai Uji Coba Query Kependudukan...');

  const timestamp = Date.now().toString().slice(-6);
  const testEmail = `test.warga.${timestamp}@example.com`;
  const testNikHead = `1234567890${timestamp}`;
  const testNikMember = `9876543210${timestamp}`;
  const testFamilyNo = `3276123456${timestamp}`;
  const testQrToken = `qr-test-${timestamp}`;

  let createdDwellingId: number | undefined;
  let createdUserId: number | undefined;
  let createdFamilyId: number | undefined;
  let createdMemberId: number | undefined;

  try {
    // ----------------------------------------------------
    // PREPARATION: Buat Dwelling & User Dummy
    // ----------------------------------------------------
    console.log('\n--- 1. Menyiapkan Data Prasyarat ---');
    
    // Insert Dwelling
    const [dwellingInsert] = await db.insert(schema.dwellings).values({
      streetName: 'Jl. Testing Raya',
      blockNumber: 'B4',
      houseNumber: '12',
      qrToken: testQrToken,
      type: 'permanen',
      isActive: true,
    });
    createdDwellingId = dwellingInsert.insertId;
    console.log(`✅ Dwelling Dummy dibuat dengan ID: ${createdDwellingId}`);

    // Insert User (Kepala Keluarga)
    // Pastikan roleId 6 (Warga) ada di DB
    const [userInsert] = await db.insert(schema.users).values({
      name: 'Budi Test Kepala',
      email: testEmail,
      nik: testNikHead,
      phone: '08129999999',
      roleId: 6, // Warga
      status: 'active',
    });
    createdUserId = userInsert.insertId;
    console.log(`✅ User Dummy dibuat dengan ID: ${createdUserId}`);

    // ----------------------------------------------------
    // TEST KK: Create Family
    // ----------------------------------------------------
    console.log('\n--- 2. Menguji Create Kartu Keluarga ---');
    createdFamilyId = await createFamily({
      dwellingId: createdDwellingId,
      familyNumber: testFamilyNo,
      headUserId: createdUserId,
      headName: 'Budi Test Kepala',
      unitNumber: 'A',
      kkFile: '/uploads/kk/test.pdf',
      checkInDate: new Date(),
    });
    console.log(`✅ KK Berhasil dibuat dengan ID: ${createdFamilyId}`);

    // ----------------------------------------------------
    // TEST KK: Read Family
    // ----------------------------------------------------
    console.log('\n--- 3. Menguji Read Kartu Keluarga ---');
    
    // getFamilyById
    const familyById = await getFamilyById(createdFamilyId);
    if (!familyById) throw new Error('getFamilyById mengembalikan null');
    console.log('✅ getFamilyById berhasil.');
    console.log(`   Nomor KK: ${familyById.familyNumber}`);
    console.log(`   Nama Kepala (Denormalized): ${familyById.headName}`);
    console.log(`   Jumlah Anggota (Otomatis Kepala Keluarga): ${familyById.members.length}`);
    if (familyById.members.length !== 1 || familyById.members[0].relationship !== 'Kepala_Keluarga') {
      throw new Error('Otomatisasi pembuatan anggota Kepala Keluarga gagal!');
    }
    console.log('   ✅ Otomatisasi Kepala Keluarga berhasil masuk ke family_members.');

    // getFamilyByNumber
    const familyByNo = await getFamilyByNumber(testFamilyNo);
    if (!familyByNo || familyByNo.id !== createdFamilyId) {
      throw new Error('getFamilyByNumber gagal!');
    }
    console.log('✅ getFamilyByNumber berhasil.');

    // getFamilyByHeadUserId
    const familyByHead = await getFamilyByHeadUserId(createdUserId);
    if (!familyByHead || familyByHead.id !== createdFamilyId) {
      throw new Error('getFamilyByHeadUserId gagal!');
    }
    console.log('✅ getFamilyByHeadUserId berhasil.');

    // listFamilies
    const familiesList = await listFamilies({ query: 'Budi Test', isActive: true });
    if (familiesList.metadata.total === 0) {
      throw new Error('listFamilies tidak menemukan data!');
    }
    console.log(`✅ listFamilies berhasil, total ditemukan: ${familiesList.metadata.total}`);

    // ----------------------------------------------------
    // TEST KK: Update Family
    // ----------------------------------------------------
    console.log('\n--- 4. Menguji Update Kartu Keluarga ---');
    await updateFamily(createdFamilyId, {
      unitNumber: 'B-Updated',
      verificationStatus: 'verified',
      verificationNote: 'Dokumen lengkap',
    });
    const updatedFamily = await getFamilyById(createdFamilyId);
    if (updatedFamily?.unitNumber !== 'B-Updated' || updatedFamily?.verificationStatus !== 'verified') {
      throw new Error('Update KK gagal!');
    }
    console.log('✅ Update KK berhasil.');

    // ----------------------------------------------------
    // TEST WARGA: Create Family Member
    // ----------------------------------------------------
    console.log('\n--- 5. Menguji Create Anggota Keluarga ---');
    createdMemberId = await createFamilyMember({
      familyId: createdFamilyId,
      name: 'Ani Test Istri',
      nik: testNikMember,
      gender: 'P',
      relationship: 'Istri',
      occupation: 'Ibu Rumah Tangga',
      educationLevel: 'S1',
      phone: '081288888888',
      birthPlace: 'Jakarta',
      birthDate: new Date('1992-05-20'),
    });
    console.log(`✅ Anggota keluarga baru dibuat dengan ID: ${createdMemberId}`);

    // Uji validasi NIK unik
    try {
      console.log('   Mencoba menginsert NIK duplikat...');
      await createFamilyMember({
        familyId: createdFamilyId,
        name: 'Duplikat NIK',
        nik: testNikMember, // NIK sama
        gender: 'L',
        relationship: 'Anak',
      });
      throw new Error('ERROR: Validasi NIK unik gagal dilalui!');
    } catch (e: any) {
      console.log(`   ✅ Validasi NIK unik berhasil mendeteksi duplikat: ${e.message}`);
    }

    // ----------------------------------------------------
    // TEST WARGA: Read Anggota Keluarga ---
    // ----------------------------------------------------
    console.log('\n--- 6. Menguji Read Anggota Keluarga ---');
    
    // getFamilyMemberById
    const memberById = await getFamilyMemberById(createdMemberId);
    if (!memberById || memberById.name !== 'Ani Test Istri') {
      throw new Error('getFamilyMemberById gagal!');
    }
    console.log('✅ getFamilyMemberById berhasil.');

    // getFamilyMemberByNik
    const memberByNik = await getFamilyMemberByNik(testNikMember);
    if (!memberByNik || memberByNik.id !== createdMemberId) {
      throw new Error('getFamilyMemberByNik gagal!');
    }
    console.log('✅ getFamilyMemberByNik berhasil.');

    // getFamilyMembersByFamilyId
    const membersList = await getFamilyMembersByFamilyId(createdFamilyId);
    if (membersList.length !== 2) {
      throw new Error(`getFamilyMembersByFamilyId mendapati ${membersList.length} anggota, seharusnya 2!`);
    }
    console.log(`✅ getFamilyMembersByFamilyId berhasil, total anggota: ${membersList.length}`);

    // listFamilyMembers
    const membersSearch = await listFamilyMembers({ query: 'Ani Test' });
    if (membersSearch.metadata.total === 0) {
      throw new Error('listFamilyMembers gagal!');
    }
    console.log(`✅ listFamilyMembers berhasil, ditemukan: ${membersSearch.metadata.total}`);

    // ----------------------------------------------------
    // TEST WARGA: Update Anggota Keluarga ---
    // ----------------------------------------------------
    console.log('\n--- 7. Menguji Update Anggota Keluarga ---');
    await updateFamilyMember(createdMemberId, {
      occupation: 'PNS',
    });
    const updatedMember = await getFamilyMemberById(createdMemberId);
    if (updatedMember?.occupation !== 'PNS') {
      throw new Error('Update anggota keluarga gagal!');
    }
    console.log('✅ Update anggota keluarga berhasil.');

    // ----------------------------------------------------
    // TEST WARGA & KK: Soft Delete
    // ----------------------------------------------------
    console.log('\n--- 8. Menguji Soft Delete (Nonaktifkan Warga & KK) ---');
    
    // Soft Delete Warga (Istri)
    await deleteFamilyMember(createdMemberId, 'pindah');
    const deletedMember = await getFamilyMemberById(createdMemberId);
    if (deletedMember?.isActive !== false || deletedMember?.inactiveReason !== 'pindah') {
      throw new Error('Soft delete anggota keluarga gagal!');
    }
    console.log('✅ Soft delete warga berhasil.');

    // Soft Delete KK (Seluruh Keluarga)
    await deleteFamily(createdFamilyId);
    const deletedFamily = await getFamilyById(createdFamilyId);
    if (deletedFamily?.isActive !== false || !deletedFamily?.checkOutDate) {
      throw new Error('Soft delete KK gagal!');
    }
    console.log('✅ Soft delete KK berhasil (checkOutDate terisi otomatis).');
    
    // Verifikasi bahwa seluruh anggota KK ikut dinonaktifkan
    const familyMembersAfterDelete = await getFamilyMembersByFamilyId(createdFamilyId);
    const activeMembersCount = familyMembersAfterDelete.filter(m => m.isActive).length;
    if (activeMembersCount > 0) {
      throw new Error('Anggota keluarga tidak ikut dinonaktifkan saat KK didelete!');
    }
    console.log('✅ Semua anggota keluarga di dalam KK berhasil dinonaktifkan otomatis.');

    console.log('\n🎉 SEMUA UJI COBA SUKSES!');

  } catch (error) {
    console.error('\n❌ UJI COBA GAGAL:', error);
  } finally {
    // ----------------------------------------------------
    // CLEANUP: Bersihkan data test dari DB
    // ----------------------------------------------------
    console.log('\n--- 9. Membersihkan Data Uji Coba ---');
    try {
      if (createdFamilyId) {
        // Hapus fisik anggota keluarga dummy
        await db.delete(schema.familyMembers).where(eq(schema.familyMembers.familyId, createdFamilyId));
        // Hapus fisik keluarga dummy
        await db.delete(schema.families).where(eq(schema.families.id, createdFamilyId));
      }
      if (createdUserId) {
        await db.delete(schema.users).where(eq(schema.users.id, createdUserId));
      }
      if (createdDwellingId) {
        await db.delete(schema.dwellings).where(eq(schema.dwellings.id, createdDwellingId));
      }
      console.log('✅ Database dibersihkan kembali.');
    } catch (cleanupError) {
      console.error('⚠️ Gagal membersihkan data uji coba:', cleanupError);
    }
  }
}

testSuite();
