import React, { useState, useEffect } from "react";
import { X, Loader2, Home, MapPin, ClipboardList, Info, Users, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface DwellingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dwellingId: number | null;
}

interface FamilyDetailInfo {
  id: number;
  familyNumber: string;
  headName: string;
  unitNumber?: string | null;
  checkInDate: string;
  memberCount: number;
  verificationStatus: "pending" | "verified" | "rejected";
}

interface DwellingDetailData {
  id: number;
  blockNumber: string;
  houseNumber: string;
  type: "permanen" | "kos" | "homestay";
  qrToken: string;
  isActive: boolean;
  notes?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  ownerUserId?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  families?: FamilyDetailInfo[];
  property?: {
    id: number;
    name: string;
    contactPerson?: string | null;
    phone?: string | null;
    totalRooms: number;
    activeTenants: number;
    vacantRooms: number;
    coordinator?: {
      id: string;
      name: string;
      phone?: string | null;
      email: string;
    } | null;
  } | null;
}

export const DwellingDetailModal: React.FC<DwellingDetailModalProps> = ({
  isOpen,
  onClose,
  dwellingId,
}) => {
  const [data, setData] = useState<DwellingDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && dwellingId) {
      Promise.resolve().then(() => {
        setIsLoading(true);
      });
      fetch(`/api/dwellings/${dwellingId}/detail`)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal mengambil detail hunian");
          return res.json();
        })
        .then((detail) => {
          setData(detail);
        })
        .catch((err) => {
          console.error(err);
          toast.error(err.message || "Terjadi kesalahan koneksi");
          onClose();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      Promise.resolve().then(() => {
        setData(null);
      });
    }
  }, [isOpen, dwellingId, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm cursor-default" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-gray-card border border-gray-border rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border px-6 py-4 shrink-0">
          <h3 className="text-sm font-bold text-gray-heading-main flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            <span>Detail Hunian & Properti</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-gray-placeholder font-medium">Memuat rincian hunian...</span>
            </div>
          ) : data ? (
            <>
              {/* Alamat & Tipe Badge */}
              <div className="flex flex-col gap-2 pb-3 border-b border-gray-border/50">
                <span className="text-xl font-bold text-gray-heading-main tracking-tight">
                  Blok {data.blockNumber} No. {data.houseNumber}
                </span>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                    data.type === 'permanen' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : data.type === 'kos' 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {data.type}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    data.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-red-50 text-red-700 border border-red-100"
                  }`}>
                    {data.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {data.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>

              {/* Detail Pemilik Aset */}
              <div className="space-y-3 bg-gray-sidebar-hover/10 rounded-2xl p-4 border border-gray-border/50">
                <h4 className="text-xs font-bold text-gray-placeholder uppercase tracking-wider">Pemilik Hunian/Aset</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-secondary-text block">Nama Pemilik</span>
                    <span className="font-semibold text-gray-heading-main block mt-0.5">
                      {data.ownerName || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-secondary-text block">No. HP Pemilik</span>
                    <span className="font-semibold text-gray-heading-main block mt-0.5">
                      {data.ownerPhone || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Koordinat & QR */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-gray-border/50 pb-4">
                <div>
                  <span className="text-gray-secondary-text flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-placeholder" /> Koordinat GPS
                  </span>
                  <span className="font-semibold text-gray-heading-main block mt-0.5">
                    {data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-secondary-text flex items-center gap-1">
                    <CreditCard className="h-3 w-3 text-gray-placeholder" /> QR Token
                  </span>
                  <span className="font-mono text-gray-heading-main block mt-0.5">
                    {data.qrToken}
                  </span>
                </div>
              </div>

              {/* Catatan Hunian */}
              <div className="space-y-1 text-xs">
                <span className="text-gray-secondary-text font-semibold flex items-center gap-1">
                  <ClipboardList className="h-3.5 w-3.5 text-gray-placeholder" /> Catatan Hunian
                </span>
                <p className="text-gray-heading-main bg-gray-sidebar-hover/20 p-3 rounded-xl border border-gray-border/30 leading-relaxed">
                  {data.notes || "-"}
                </p>
              </div>

              {/* Conditional Section: KOS / HOMESTAY */}
              {(data.type === 'kos' || data.type === 'homestay') && (
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 border-t border-gray-border/50 pt-4">
                    <Info className="h-4 w-4" /> Informasi Properti Sewa
                  </h4>
                  
                  {data.property ? (
                    <div className="space-y-4">
                      {/* Nama Properti */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-gray-secondary-text block">Nama Rumah Sewa</span>
                          <span className="font-bold text-gray-heading-main block mt-0.5 text-sm">
                            {data.property.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-secondary-text block">Penanggung Jawab/CP</span>
                          <span className="font-semibold text-gray-heading-main block mt-0.5">
                            {data.property.contactPerson || "-"} {data.property.phone ? `(${data.property.phone})` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Koordinator Akun */}
                      {data.type !== 'homestay' && (
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-primary font-bold">Koordinator Pengelola</span>
                          </div>
                          {data.property.coordinator ? (
                          <div className="grid grid-cols-2 gap-3 text-gray-heading-main">
                            <div>
                              <span className="text-gray-placeholder block text-[10px]">Nama Akun</span>
                              <span className="font-semibold">{data.property.coordinator.name}</span>
                            </div>
                            <div>
                              <span className="text-gray-placeholder block text-[10px]">Kontak WhatsApp</span>
                              <span className="font-semibold">{data.property.coordinator.phone || "-"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-secondary-text font-medium leading-relaxed">
                            Dikelola oleh Pemilik Hunian ({data.ownerName || "-"})
                          </div>
                        )}
                        </div>
                      )}

                      {/* STATISTIK OKUPANSI KAMAR (Sesuai Request User) */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                          <span className="text-[10px] text-emerald-800 font-semibold block uppercase">Orang Ngekos</span>
                          <span className="text-xl font-bold text-emerald-900 mt-1 block">
                            {data.property.activeTenants || 0}
                          </span>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                          <span className="text-[10px] text-amber-800 font-semibold block uppercase">Kamar Kosong</span>
                          <span className="text-xl font-bold text-amber-900 mt-1 block">
                            {data.property.vacantRooms || 0}
                          </span>
                        </div>
                        <div className="bg-gray-sidebar-hover/30 border border-gray-border rounded-2xl p-4 text-center">
                          <span className="text-[10px] text-gray-placeholder font-semibold block uppercase">Total Kamar</span>
                          <span className="text-xl font-bold text-gray-heading-main mt-1 block">
                            {data.property.totalRooms || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-sidebar-hover/20 border border-gray-border rounded-2xl text-xs text-gray-secondary-text text-center font-medium">
                      Belum didaftarkan/ditautkan ke properti sewa aktif oleh Koordinator.
                    </div>
                  )}
                </div>
              )}

              {/* Conditional Section: PERMANEN */}
              {data.type === 'permanen' && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 border-t border-gray-border/50 pt-4">
                    <Users className="h-4 w-4" /> Keluarga Terdaftar di Hunian
                  </h4>

                  {data.families && data.families.length > 0 ? (
                    <div className="space-y-3">
                      {data.families.map((fam) => (
                        <div 
                          key={fam.id} 
                          className="border border-gray-border rounded-2xl p-4 bg-gray-sidebar-hover/10 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs text-gray-heading-main">
                              No. KK: {fam.familyNumber}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                              fam.verificationStatus === 'verified'
                                ? 'bg-emerald-50 text-emerald-700'
                                : fam.verificationStatus === 'pending'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                            }`}>
                              {fam.verificationStatus}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="col-span-2">
                              <span className="text-gray-secondary-text block">Kepala Keluarga</span>
                              <span className="font-semibold text-gray-heading-main block mt-0.5">{fam.headName}</span>
                            </div>
                            <div>
                              <span className="text-gray-secondary-text block">Jumlah Anggota</span>
                              <span className="font-semibold text-gray-heading-main block mt-0.5">{fam.memberCount} Orang</span>
                            </div>
                          </div>
                            <div className="text-xs border-t border-gray-border/30 pt-2 flex items-center justify-between">
                              <span className="text-gray-secondary-text">No. Unit/Pintu:</span>
                              <span className="font-semibold text-gray-heading-main">{fam.unitNumber || "-"}</span>
                            </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-sidebar-hover/20 border border-gray-border rounded-2xl text-xs text-gray-secondary-text text-center font-medium">
                      Belum ada Kartu Keluarga aktif yang terdaftar di hunian ini.
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-gray-placeholder text-center py-8">
              Gagal memuat rincian hunian.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
