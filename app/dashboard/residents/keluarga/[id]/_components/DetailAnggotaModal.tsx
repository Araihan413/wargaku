import React from "react";
import { X, User, CreditCard, Calendar, Phone, Briefcase, GraduationCap, Landmark, FileText, Eye } from "lucide-react";
import { FamilyMemberItem } from "../../../types";

interface DetailAnggotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMemberItem | null;
}

export const DetailAnggotaModal: React.FC<DetailAnggotaModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  if (!isOpen || !member) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getRelationshipLabel = (rel: string) => {
    const labels: Record<string, string> = {
      Kepala_Keluarga: "Kepala Keluarga",
      Suami: "Suami",
      Istri: "Istri",
      Anak: "Anak",
      Orang_Tua: "Orang Tua",
      Lainnya: "Lainnya",
    };
    return labels[rel] || rel;
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-heading-main">
            Detail Informasi Anggota Keluarga
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1.5 pb-2 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3.5 bg-gray-sidebar-hover/30 border border-gray-border/70 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-secondary-text uppercase tracking-wider">
                Status Keanggotaan
              </span>
            </div>
            <div>
              {member.isActive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-3 py-1 text-xs font-bold text-success">
                  Aktif
                </span>
              ) : (
                <div className="flex flex-col items-end gap-0.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-error/10 border border-error/20 px-3 py-1 text-xs font-bold text-error">
                    Nonaktif ({member.inactiveReason || "pindah"})
                  </span>
                  {member.updatedAt && (
                    <span className="text-[10px] text-gray-secondary-text">
                      Sejak {formatDate(member.updatedAt)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Grid Informasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Lengkap */}
            <div className="flex items-start gap-3 p-3 border border-gray-border/50 rounded-xl bg-gray-card">
              <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-gray-placeholder uppercase tracking-wider block">
                  Nama Lengkap
                </span>
                <span className="text-sm font-semibold text-gray-heading-main block mt-0.5">
                  {member.name}
                </span>
              </div>
            </div>

            {/* NIK */}
            <div className="flex items-start gap-3 p-3 border border-gray-border/50 rounded-xl bg-gray-card">
              <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-gray-placeholder uppercase tracking-wider block">
                  NIK (No. Induk Kependudukan)
                </span>
                <span className="text-sm font-mono font-semibold text-gray-heading-main block mt-0.5">
                  {member.nik}
                </span>
              </div>
            </div>

            {/* Hubungan Keluarga */}
            <div className="flex items-start gap-3 p-3 border border-gray-border/50 rounded-xl bg-gray-card">
              <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-gray-placeholder uppercase tracking-wider block">
                  Hubungan Keluarga
                </span>
                <span className="text-sm font-semibold text-gray-heading-main block mt-0.5">
                  {getRelationshipLabel(member.relationship)}
                </span>
              </div>
            </div>

            {/* Jenis Kelamin */}
            <div className="flex items-start gap-3 p-3 border border-gray-border/50 rounded-xl bg-gray-card">
              <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-gray-placeholder uppercase tracking-wider block">
                  Jenis Kelamin
                </span>
                <span className="text-sm font-semibold text-gray-heading-main block mt-0.5">
                  {member.gender === "L" ? "Laki-laki" : "Perempuan"}
                </span>
              </div>
            </div>

            {/* Tempat & Tanggal Lahir */}
            <div className="flex items-start gap-3 p-3 border border-gray-border/50 rounded-xl bg-gray-card md:col-span-2">
              <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-gray-placeholder uppercase tracking-wider block">
                  Tempat & Tanggal Lahir
                </span>
                <span className="text-sm font-semibold text-gray-heading-main block mt-0.5">
                  {member.birthPlace || "-"}, {formatDate(member.birthDate)}
                </span>
              </div>
            </div>

            {/* Agama */}
            <div className="flex items-start gap-3 p-3 border border-gray-border/50 rounded-xl bg-gray-card">
              <Landmark className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-gray-placeholder uppercase tracking-wider block">
                  Agama
                </span>
                <span className="text-sm font-semibold text-gray-heading-main block mt-0.5">
                  {member.religion || "-"}
                </span>
              </div>
            </div>

            {/* Nomor HP / WhatsApp */}
            <div className="flex items-start gap-3 p-3 border border-gray-border/50 rounded-xl bg-gray-card">
              <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-gray-placeholder uppercase tracking-wider block">
                  No. HP / WhatsApp
                </span>
                <span className="text-sm font-semibold text-gray-heading-main block mt-0.5">
                  {member.phone || "-"}
                </span>
              </div>
            </div>

            {/* Pekerjaan */}
            <div className="flex items-start gap-3 p-3 border border-gray-border/50 rounded-xl bg-gray-card">
              <Briefcase className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-gray-placeholder uppercase tracking-wider block">
                  Pekerjaan
                </span>
                <span className="text-sm font-semibold text-gray-heading-main block mt-0.5">
                  {member.occupation || "-"}
                </span>
              </div>
            </div>

            {/* Pendidikan Terakhir */}
            <div className="flex items-start gap-3 p-3 border border-gray-border/50 rounded-xl bg-gray-card">
              <GraduationCap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-gray-placeholder uppercase tracking-wider block">
                  Pendidikan Terakhir
                </span>
                <span className="text-sm font-semibold text-gray-heading-main block mt-0.5">
                  {member.educationLevel || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Dokumen Scan KTP */}
          <div className="border border-gray-border rounded-xl p-4 space-y-3 bg-gray-sidebar-hover/10">
            <span className="text-xs font-bold text-gray-secondary-text uppercase tracking-wider block">
              Dokumen Scan KTP Anggota
            </span>
            {member.ktpFile ? (
              <div className="flex items-center justify-between border border-gray-border bg-gray-card rounded-xl p-3.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-gray-heading-main truncate">
                    ktp_{member.name.toLowerCase().replace(/\s+/g, "_")}.jpg
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={member.ktpFile}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-gray-border rounded-lg text-gray-secondary-text hover:bg-gray-sidebar-hover hover:text-gray-heading-main cursor-pointer transition-colors"
                    title="Lihat Berkas"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-gray-border rounded-xl">
                <span className="text-xs text-gray-placeholder font-medium">
                  Berkas scan KTP belum diunggah.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-border pt-4 mt-4 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-sidebar-hover hover:bg-gray-border/50 border border-gray-border rounded-xl text-sm font-semibold text-gray-heading-main cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
