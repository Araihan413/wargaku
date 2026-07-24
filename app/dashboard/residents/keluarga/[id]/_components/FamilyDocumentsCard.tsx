import React from "react";
import { FileText, Download, Eye, AlertTriangle, UserCheck, ShieldAlert } from "lucide-react";
import { FamilyDetail } from "../../../types";

interface FamilyDocumentsCardProps {
  familyDetail: FamilyDetail;
}

export const FamilyDocumentsCard: React.FC<FamilyDocumentsCardProps> = ({ familyDetail }) => {
  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
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
    <div className="border border-gray-border rounded-2xl bg-gray-card shadow-sm overflow-hidden p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-border pb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-gray-heading-main">
          Unduh & Lihat Berkas Dokumen Keluarga
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI: DOKUMEN KARTU KELUARGA (KK) */}
        <div className="lg:col-span-1 border border-gray-border rounded-2xl p-5 bg-gray-sidebar-hover/10 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[10px] text-gray-placeholder block font-bold uppercase tracking-wider">
              Dokumen Kartu Keluarga (KK)
            </span>
            {familyDetail.kkFile ? (
              <div className="flex items-start gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-heading-main block">
                    Scan Kartu Keluarga
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                    ✓ Sudah Terunggah
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-heading-main block">
                    Scan Kartu Keluarga
                  </span>
                  <span className="text-xs text-amber-600 font-semibold block mt-0.5">
                    ⚠️ Belum Terunggah
                  </span>
                </div>
              </div>
            )}
          </div>

          {familyDetail.kkFile && (
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a
                href={familyDetail.kkFile}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-xs font-bold text-gray-heading-main transition-all cursor-pointer bg-white"
              >
                <Eye className="h-4 w-4 text-gray-secondary-text" />
                Buka
              </a>
              <button
                type="button"
                onClick={() => downloadFile(familyDetail.kkFile!, `KK_${familyDetail.familyNumber}.jpg`)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Unduh KK
              </button>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: DOKUMEN KTP ANGGOTA KELUARGA */}
        <div className="lg:col-span-2 border border-gray-border rounded-2xl p-5 bg-gray-card space-y-4">
          <span className="text-[10px] text-gray-placeholder block font-bold uppercase tracking-wider">
            Dokumen KTP Anggota Keluarga ({familyDetail.members?.filter(m => m.ktpFile).length || 0} Terunggah)
          </span>

          <div className="divide-y divide-gray-border max-h-64 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            {familyDetail.members && familyDetail.members.length > 0 ? (
              familyDetail.members.map((m) => (
                <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${m.ktpFile ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-placeholder"}`}>
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-heading-main block">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-gray-secondary-text block mt-0.5">
                        NIK: {m.nik} • <span className="font-semibold text-primary">{getRelationshipLabel(m.relationship)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {m.ktpFile ? (
                      <>
                        <a
                          href={m.ktpFile}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-border rounded-lg hover:bg-gray-sidebar-hover text-[10px] font-bold text-gray-heading-main transition-all cursor-pointer bg-white"
                          title="Buka Scan KTP"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Buka
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadFile(m.ktpFile!, `KTP_${m.name.replace(/\s+/g, "_")}.jpg`)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          title="Unduh KTP"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Unduh
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-1 border border-amber-100 rounded-lg">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        KTP Belum Diunggah
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-placeholder text-center py-4">
                Belum ada anggota keluarga terdaftar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
