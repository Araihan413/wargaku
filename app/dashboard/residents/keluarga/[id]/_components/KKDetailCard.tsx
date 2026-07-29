import React from "react";
import { CreditCard, MapPin, Calendar, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { FamilyDetail } from "../../../types";

interface KKDetailCardProps {
  familyDetail: FamilyDetail;
  onChangeHead?: () => void;
  isReadOnly?: boolean;
}

export const KKDetailCard: React.FC<KKDetailCardProps> = ({
  familyDetail,
  onChangeHead,
  isReadOnly = false,
}) => {
  // Format Address
  const d = familyDetail.dwelling;
  const addressParts = [
    d?.blockNumber ? `Blok ${d.blockNumber}` : "",
    d?.houseNumber ? `No. ${d.houseNumber}` : "",
  ].filter(Boolean);
  const addressStr = addressParts.join(" ") || "-";

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="border border-gray-border rounded-2xl bg-gray-card shadow-sm overflow-hidden p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-border pb-4">
        <div>
          <span className="text-xs font-bold text-gray-secondary-text uppercase tracking-wider block">
            Nomor Kartu Keluarga
          </span>
          <h2 className="text-2xl font-black text-gray-heading-main font-mono mt-1">
            {familyDetail.familyNumber}
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Active Status Badge */}
          {familyDetail.isActive ? (
            <span className="inline-flex rounded-full bg-success/15 border border-success/20 px-3 py-1 text-xs font-bold text-success">
              Keluarga Aktif
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-bold text-gray-500">
              Keluarga Nonaktif
            </span>
          )}

          {/* Verification Status Badge */}
          {familyDetail.verificationStatus === "verified" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 border border-success/20 px-3 py-1 text-xs font-bold text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Terverifikasi
            </span>
          )}
          {familyDetail.verificationStatus === "pending" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-20 border border-warning/20 px-3 py-1 text-xs font-bold text-pending">
              <AlertTriangle className="h-3.5 w-3.5" />
              Menunggu Verifikasi
            </span>
          )}
          {familyDetail.verificationStatus === "rejected" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-error/15 border border-error/20 px-3 py-1 text-xs font-bold text-error">
              <XCircle className="h-3.5 w-3.5" />
              Ditolak
            </span>
          )}
        </div>
      </div>

      {/* Grid Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kepala Keluarga */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-primary-100/50 border border-primary/10 rounded-xl text-primary shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-secondary-text uppercase tracking-wider block">
              Kepala Keluarga
            </span>
            <span className="text-sm font-extrabold text-gray-heading-main block mt-1">
              {familyDetail.headName}
            </span>
            <span className="text-xs text-gray-placeholder block mt-0.5">
              ID User: {familyDetail.headUserId}
            </span>
            {!isReadOnly && onChangeHead && familyDetail.isActive && (
              <button
                type="button"
                onClick={onChangeHead}
                className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer block text-left"
              >
                Ganti Kepala Keluarga
              </button>
            )}
          </div>
        </div>

        {/* Alamat Hunian */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-secondary-text uppercase tracking-wider block">
              Alamat Tinggal / Unit
            </span>
            <span className="text-sm font-extrabold text-gray-heading-main block mt-1">
              {addressStr}
            </span>
            {familyDetail.unitNumber ? (
              <span className="text-xs text-gray-secondary-text block mt-0.5">
                Nomor Unit: {familyDetail.unitNumber}
              </span>
            ) : (
              <span className="text-xs text-gray-placeholder block mt-0.5">
                Tipe: {familyDetail.dwelling?.type || "permanen"}
              </span>
            )}
          </div>
        </div>

        {/* Tanggal Masuk */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-orange-50 border border-orange-100 rounded-xl text-orange-600 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-secondary-text uppercase tracking-wider block">
              Riwayat Tinggal
            </span>
            <span className="text-sm font-extrabold text-gray-heading-main block mt-1">
              Masuk: {formatDate(familyDetail.checkInDate)}
            </span>
            {familyDetail.checkOutDate && (
              <span className="text-xs text-error font-semibold block mt-0.5">
                Keluar: {formatDate(familyDetail.checkOutDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Verification Note (if any) */}
      {familyDetail.verificationNote && (
        <div className="rounded-xl bg-gray-sidebar-hover border border-gray-border p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-gray-secondary-text shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-gray-secondary-text uppercase tracking-wider block">
              Catatan Verifikasi
            </span>
            <p className="text-sm text-gray-heading-main mt-1 leading-relaxed">
              {familyDetail.verificationNote}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
