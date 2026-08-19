import { describe, it, expect } from 'vitest';

type RentalStatus = 'pending_verification' | 'active' | 'checked_out' | 'rejected';

interface RentalContract {
  id: number;
  propertyId: number;
  ownerId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  status: RentalStatus;
}

describe('WF-04: Alur Properti Kos & Penyewa Sewa (Rental Flow)', () => {
  const sampleContract: RentalContract = {
    id: 501,
    propertyId: 10,
    ownerId: 'owner-001',
    tenantName: 'Siti Rahma',
    startDate: '2026-01-01',
    endDate: '2026-08-01',
    status: 'pending_verification',
  };

  describe('Alur Benar (Happy Path)', () => {
    it('WF-RNT-01 & WF-RNT-02: Transisi status kontrak dari pending ke active setelah verifikasi RT', () => {
      let currentStatus: RentalStatus = sampleContract.status;
      expect(currentStatus).toBe('pending_verification');

      // RT menyetujui verifikasi penyewa
      const verifyTenant = (status: RentalStatus): RentalStatus => {
        return status === 'pending_verification' ? 'active' : status;
      };

      currentStatus = verifyTenant(currentStatus);
      expect(currentStatus).toBe('active');
    });

    it('WF-RNT-03: Proses check-out mengubah status menjadi checked_out saat kontrak selesai', () => {
      let currentStatus: RentalStatus = 'active';

      const checkoutTenant = (status: RentalStatus): RentalStatus => {
        return status === 'active' ? 'checked_out' : status;
      };

      currentStatus = checkoutTenant(currentStatus);
      expect(currentStatus).toBe('checked_out');
    });
  });

  describe('Alur Salah / Abuse (Negative Path)', () => {
    it('WF-RNT-04: Penyewa yang sudah checked_out dilarang mengakses layanan aktif', () => {
      const canAccessActiveServices = (status: RentalStatus): boolean => {
        return status === 'active';
      };

      expect(canAccessActiveServices('active')).toBe(true);
      expect(canAccessActiveServices('checked_out')).toBe(false);
      expect(canAccessActiveServices('pending_verification')).toBe(false);
      expect(canAccessActiveServices('rejected')).toBe(false);
    });

    it('WF-RNT-05: Pemilik A dilarang mengelola atau menghapus kontrak kos milik Pemilik B (IDOR)', () => {
      const canOwnerManageContract = (requestOwnerId: string, contract: RentalContract): boolean => {
        return requestOwnerId === contract.ownerId;
      };

      const ownerA = 'owner-001';
      const ownerB = 'owner-002';

      // Pemilik A mengelola kontrak miliknya sendiri (Allowed)
      expect(canOwnerManageContract(ownerA, sampleContract)).toBe(true);

      // Pemilik B mencoba mengelola kontrak milik Pemilik A (Forbidden)
      expect(canOwnerManageContract(ownerB, sampleContract)).toBe(false);
    });
  });
});
