import React, { useState } from "react";
import { FileText, AlertTriangle, UserCheck, ShieldAlert, Upload } from "lucide-react";
import { FamilyDetail } from "../../../types";
import { toast } from "sonner";
import { uploadFileToCloudinary } from "@/lib/upload-helper";
import { FileUploadModal } from "@/components/FileUploadModal";
import { SecureDocumentLink } from "@/components/SecureDocumentLink";

interface FamilyDocumentsCardProps {
  familyDetail: FamilyDetail;
  onRefresh?: () => void;
  isReadOnly?: boolean;
}

export const FamilyDocumentsCard: React.FC<FamilyDocumentsCardProps> = ({
  familyDetail,
  onRefresh,
  isReadOnly = false,
}) => {
  const [showKkUploadForm, setShowKkUploadForm] = useState(false);
  const [isUploadingKK, setIsUploadingKK] = useState(false);
  const [showKtpUploadForm, setShowKtpUploadForm] = useState(false);
  const [isUploadingKtp, setIsUploadingKtp] = useState(false);
  const [selectedMemberForKtp, setSelectedMemberForKtp] = useState<any>(null);

  const saveKKFileToDB = async (url: string) => {
    setIsUploadingKK(true);
    try {
      const res = await fetch(`/api/families/${familyDetail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kkFile: url }),
      });

      if (res.ok) {
        toast.success("Berkas Scan KK berhasil disimpan!");
        setShowKkUploadForm(false);
        onRefresh?.();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menyimpan berkas Scan KK");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsUploadingKK(false);
    }
  };

  const handleSelectLocalKK = async (file: File) => {
    setIsUploadingKK(true);
    try {
      const res = await uploadFileToCloudinary(file, "kk");
      await saveKKFileToDB(res.url);
    } catch {
      // Notifikasi toast sudah ditangani oleh validator uploadFileToCloudinary
    } finally {
      setIsUploadingKK(false);
    }
  };

  const saveKtpFileToDB = async (memberId: number, url: string) => {
    setIsUploadingKtp(true);
    try {
      const res = await fetch(`/api/family-members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ktpFile: url }),
      });

      if (res.ok) {
        toast.success("Berkas Scan KTP berhasil disimpan!");
        setShowKtpUploadForm(false);
        onRefresh?.();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menyimpan berkas Scan KTP");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsUploadingKtp(false);
    }
  };

  const handleSelectLocalKtp = async (file: File) => {
    if (!selectedMemberForKtp) return;
    setIsUploadingKtp(true);
    try {
      const res = await uploadFileToCloudinary(file, "ktp");
      await saveKtpFileToDB(selectedMemberForKtp.id, res.url);
    } catch {
      // Notifikasi toast sudah ditangani oleh validator uploadFileToCloudinary
    } finally {
      setIsUploadingKtp(false);
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

          <div className="flex flex-col gap-2 pt-2">
            {familyDetail.kkFile ? (
              <>
                <div className="flex gap-2">
                  <SecureDocumentLink
                    type="kk"
                    recordId={familyDetail.id}
                    mode="view"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-xs font-bold text-gray-heading-main transition-all cursor-pointer bg-white"
                  >
                    <FileText className="h-4 w-4 text-gray-secondary-text" />
                    Buka
                  </SecureDocumentLink>
                  <SecureDocumentLink
                    type="kk"
                    recordId={familyDetail.id}
                    mode="download"
                    downloadFilename={`KK_${familyDetail.familyNumber}.pdf`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    Unduh KK
                  </SecureDocumentLink>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setShowKkUploadForm(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    Ganti Berkas KK
                  </button>
                )}
              </>
            ) : (
              !isReadOnly && (
                <button
                  type="button"
                  onClick={() => setShowKkUploadForm(true)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  Unggah Scan KK
                </button>
              )
            )}
          </div>
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
                        <SecureDocumentLink
                          type="ktp-member"
                          recordId={m.id}
                          mode="view"
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-border rounded-lg hover:bg-gray-sidebar-hover text-[10px] font-bold text-gray-heading-main transition-all cursor-pointer bg-white"
                          title="Buka Scan KTP"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Buka
                        </SecureDocumentLink>
                        <SecureDocumentLink
                          type="ktp-member"
                          recordId={m.id}
                          mode="download"
                          downloadFilename={`KTP_${m.name.replace(/\s+/g, "_")}.pdf`}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          title="Unduh KTP"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Unduh
                        </SecureDocumentLink>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMemberForKtp(m);
                              setShowKtpUploadForm(true);
                            }}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-border rounded-lg hover:bg-gray-sidebar-hover text-[10px] font-bold text-gray-heading-main transition-all cursor-pointer bg-white"
                            title="Ganti Berkas KTP"
                          >
                            <Upload className="h-3.5 w-3.5 text-gray-secondary-text" />
                            Ganti
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-1 border border-amber-100 rounded-lg">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          KTP Belum Diunggah
                        </span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMemberForKtp(m);
                              setShowKtpUploadForm(true);
                            }}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-[10px] font-bold text-primary rounded-lg transition-all cursor-pointer"
                            title="Unggah Berkas KTP"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Unggah KTP
                          </button>
                        )}
                      </>
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

      {/* File Upload Modal untuk KK */}
      <FileUploadModal
        isOpen={showKkUploadForm}
        onClose={() => setShowKkUploadForm(false)}
        title="Unggah Berkas Scan KK"
        description="Pilih berkas scan Kartu Keluarga (KK) dari perangkat lokal atau gunakan Google Drive."
        onSelectLocalFile={handleSelectLocalKK}
        isLoading={isUploadingKK}
      />
 
      {/* File Upload Modal untuk KTP Anggota */}
      <FileUploadModal
        isOpen={showKtpUploadForm}
        onClose={() => {
          setShowKtpUploadForm(false);
          setSelectedMemberForKtp(null);
        }}
        title={`Unggah Scan KTP - ${selectedMemberForKtp?.name || ""}`}
        description="Pilih berkas scan KTP dari perangkat lokal atau gunakan Google Drive."
        onSelectLocalFile={handleSelectLocalKtp}
        isLoading={isUploadingKtp}
      />
    </div>
  );
};
