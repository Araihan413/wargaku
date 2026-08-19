import { describe, it, expect } from 'vitest';

interface SessionUser {
  id: string;
  familyId: number | null;
  role: 'warga' | 'rt' | 'super_admin';
}

interface FamilyMember {
  id: number;
  familyId: number;
  name: string;
  nik: string;
  relation: 'kepala_keluarga' | 'istri' | 'anak' | 'lainnya';
}

describe('WF-03: Alur Kependudukan & Kartu Keluarga (Anti-IDOR)', () => {
  const sessionUserA: SessionUser = {
    id: 'user-001',
    familyId: 101, // Keluarga A (ID: 101)
    role: 'warga',
  };

  const sessionUserB: SessionUser = {
    id: 'user-002',
    familyId: 102, // Keluarga B (ID: 102)
    role: 'warga',
  };

  const sessionAdmin: SessionUser = {
    id: 'admin-001',
    familyId: null,
    role: 'rt',
  };

  const familyMembersDatabase: FamilyMember[] = [
    { id: 1, familyId: 101, name: 'Anak Keluarga A', nik: '3201000000000001', relation: 'anak' },
    { id: 2, familyId: 102, name: 'Anak Keluarga B', nik: '3201000000000002', relation: 'anak' },
  ];

  // Fungsi helper otorisasi edit anggota keluarga (Anti-IDOR)
  const canModifyFamilyMember = (currentUser: SessionUser, targetMember: FamilyMember): boolean => {
    // 1. Pengurus RT/Admin selalu diizinkan
    if (currentUser.role === 'rt' || currentUser.role === 'super_admin') {
      return true;
    }
    // 2. Warga hanya boleh mengubah anggota dalam kartu keluarga miliknya
    return currentUser.familyId !== null && currentUser.familyId === targetMember.familyId;
  };

  describe('Alur Benar (Happy Path)', () => {
    it('WF-FAM-01 & WF-FAM-03: Kepala Keluarga A diizinkan mengubah anggota keluarga miliknya', () => {
      const memberA = familyMembersDatabase.find((m) => m.id === 1)!;
      const isAllowed = canModifyFamilyMember(sessionUserA, memberA);
      expect(isAllowed).toBe(true);
    });

    it('WF-FAM-05: Pengurus RT diizinkan mengelola anggota keluarga warga mana pun', () => {
      const memberA = familyMembersDatabase.find((m) => m.id === 1)!;
      const memberB = familyMembersDatabase.find((m) => m.id === 2)!;

      expect(canModifyFamilyMember(sessionAdmin, memberA)).toBe(true);
      expect(canModifyFamilyMember(sessionAdmin, memberB)).toBe(true);
    });
  });

  describe('Alur Salah / Percobaan Eksploitasi (Negative IDOR Path)', () => {
    it('WF-FAM-02 & WF-FAM-04: Menolak Warga A yang mencoba mengubah anggota keluarga Warga B (IDOR)', () => {
      const memberB = familyMembersDatabase.find((m) => m.id === 2)!; // Milik Keluarga B
      const isAllowed = canModifyFamilyMember(sessionUserA, memberB);

      // Wajib ditolak
      expect(isAllowed).toBe(false);
    });

    it('Menolak Warga B yang mencoba menghapus anggota keluarga Warga A (IDOR)', () => {
      const memberA = familyMembersDatabase.find((m) => m.id === 1)!; // Milik Keluarga A
      const isAllowed = canModifyFamilyMember(sessionUserB, memberA);

      // Wajib ditolak
      expect(isAllowed).toBe(false);
    });
  });
});
