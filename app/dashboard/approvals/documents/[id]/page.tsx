"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileText,
  Check,
  Eye,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { VerifyConfirmModal } from "../_components/VerifyConfirmModal";

interface FamilyMember {
  id: number;
  name: string;
  nik: string;
  birthPlace: string | null;
  birthDate: string | null;
  gender: "L" | "P";
  relationship: "Kepala_Keluarga" | "Suami" | "Istri" | "Anak" | "Orang_Tua" | "Lainnya";
  occupation: string | null;
  educationLevel: string | null;
  religion: string | null;
  phone: string | null;
  ktpFile: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Dwelling {
  id: number;
  blockNumber: string;
  houseNumber: string;
  type: string;
}

interface FamilyDetail {
  id: number;
  familyNumber: string;
  headName: string;
  unitNumber: string | null;
  kkFile: string | null;
  verificationStatus: "draft" | "pending" | "verified" | "rejected";
  verificationNote: string | null;
  checkInDate: string;
  createdAt: string;
  updatedAt: string;
  hasVerified: boolean;
  lastVerifiedAt: string | null;
  draftOpenedAt: string | null;
  dwelling: Dwelling | null;
  members: FamilyMember[];
}

export default function DocumentVerificationWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const familyId = Number(params?.id);

  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document Viewer states
  const [activeDocUrl, setActiveDocUrl] = useState<string | null>(null);
  const [activeDocTitle, setActiveDocTitle] = useState<string>("");

  // Tab state for mobile (activeTab: "document" | "data")
  const [activeMobileTab, setActiveMobileTab] = useState<"document" | "data">("data");

  // Rejection modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);

  const fetchFamilyDetail = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/families/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFamily(data);
        // Default active doc is KK
        if (data.kkFile) {
          setActiveDocUrl(data.kkFile);
          setActiveDocTitle("Berkas Kartu Keluarga");
        } else {
          // Find first member with KTP
          const memberWithKtp = data.members.find((m: FamilyMember) => m.ktpFile);
          if (memberWithKtp) {
            setActiveDocUrl(memberWithKtp.ktpFile);
            setActiveDocTitle(`KTP - ${memberWithKtp.name}`);
          }
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal memuat rincian Kartu Keluarga");
        router.push("/dashboard/approvals/documents");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat mengambil data");
      router.push("/dashboard/approvals/documents");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    if (familyId) {
      Promise.resolve().then(() => {
        if (active) {
          fetchFamilyDetail(familyId);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [familyId, fetchFamilyDetail]);

  const handleActionConfirm = async (reason?: string) => {
    if (!familyId || !family || !confirmAction) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/approvals/documents/${familyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "family",
          action: confirmAction,
          rejectReason: confirmAction === "reject" ? reason : undefined,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || "Keputusan berhasil disimpan");
        router.push("/dashboard/approvals/documents");
      } else {
        toast.error(result.error || "Gagal memperbarui status verifikasi");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat menyimpan keputusan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRelationshipLabel = (rel: string) => {
    switch (rel) {
      case "Kepala_Keluarga":
        return "Kepala Keluarga";
      case "Suami":
        return "Suami";
      case "Istri":
        return "Istri";
      case "Anak":
        return "Anak";
      case "Orang_Tua":
        return "Orang Tua";
      default:
        return "Lainnya";
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to detect if member is newly added (added after the last RT approval)
  const isNewMember = (member: FamilyMember) => {
    if (!family) return false;
    if (family.lastVerifiedAt) {
      const memberTime = new Date(member.createdAt).getTime();
      const lastVerifiedTime = new Date(family.lastVerifiedAt).getTime();
      return memberTime > lastVerifiedTime - 2000;
    }
    // Fallback to original logic if no lastVerifiedAt exists
    const memberTime = new Date(member.createdAt).getTime();
    const familyTime = new Date(family.createdAt).getTime();
    return memberTime - familyTime > 5 * 60 * 1000;
  };

  // Helper to detect if member details were updated (updated after the last RT approval)
  const isEditedMember = (member: FamilyMember) => {
    if (!family) return false;
    const createdTime = new Date(member.createdAt).getTime();
    const updatedTime = new Date(member.updatedAt).getTime();
    
    if (family.lastVerifiedAt) {
      const lastVerifiedTime = new Date(family.lastVerifiedAt).getTime();
      // Telah diupdate setelah persetujuan RT terakhir dan bukan baru dibuat
      return updatedTime > lastVerifiedTime + 2000 && createdTime < lastVerifiedTime - 2000;
    }
    
    return updatedTime - createdTime > 10 * 1000;
  };

  // Helper to detect if this is an update vs new registration
  const isUpdateSubmission = () => {
    if (!family) return false;
    return family.hasVerified;
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium text-gray-placeholder">Memuat Workspace Verifikasi...</span>
      </div>
    );
  }

  if (!family) return null;

  const isPdf = activeDocUrl?.toLowerCase().endsWith(".pdf") || activeDocUrl?.includes("/raw/upload/");
  const isPending = family.verificationStatus === "pending";
  const isUpdate = isUpdateSubmission();

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-6.5rem)] overflow-hidden">
      
      {/* 1. Header Workspace */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-gray-card border-b border-gray-border shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/approvals/documents"
            className="p-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-gray-secondary-text transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm md:text-base font-bold text-gray-heading-main tracking-tight flex items-center gap-2">
              Workspace Kependudukan: {family.headName}
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border tracking-wider text-center ${
                isUpdate
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                {isUpdate ? "Pembaruan Data" : "Pendaftaran Baru"}
              </span>
            </h1>
            <p className="text-[10px] text-gray-secondary-text">
              No. KK: <span className="font-mono font-semibold text-gray-heading-main">{family.familyNumber}</span>
            </p>
          </div>
        </div>

        {/* Status indicator on desktop */}
        <div className="hidden lg:block">
          <span className={`text-[10px] font-bold px-3 py-1 rounded-xl uppercase tracking-wider ${
            family.verificationStatus === "pending"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : family.verificationStatus === "verified"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}>
            {family.verificationStatus === "pending" ? "Menunggu Verifikasi" : family.verificationStatus === "verified" ? "Terverifikasi" : "Ditolak"}
          </span>
        </div>
      </div>

      {/* 2. Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-gray-card border-b border-gray-border p-1 shrink-0">
        <button
          onClick={() => setActiveMobileTab("data")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeMobileTab === "data"
              ? "bg-primary text-white shadow-sm"
              : "text-gray-secondary-text hover:bg-gray-sidebar-hover"
          }`}
        >
          Data Warga
        </button>
        <button
          onClick={() => setActiveMobileTab("document")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeMobileTab === "document"
              ? "bg-primary text-white shadow-sm"
              : "text-gray-secondary-text hover:bg-gray-sidebar-hover"
          }`}
        >
          Berkas ({family.members.filter(m => m.ktpFile).length + (family.kkFile ? 1 : 0)})
        </button>
      </div>

      {/* 3. Main Workspace Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* KOLOM KIRI: Document Viewer (60% on desktop) */}
        <div className={`w-full lg:w-[60%] flex flex-col border-r border-gray-border bg-gray-card/40 ${
          activeMobileTab === "document" ? "flex" : "hidden lg:flex"
        }`}>
          {/* Document switcher tabs */}
          <div className="flex items-center gap-1.5 p-3 overflow-x-auto border-b border-gray-border bg-gray-card shrink-0 select-none">
            {family.kkFile && (
              <button
                onClick={() => {
                  setActiveDocUrl(family.kkFile);
                  setActiveDocTitle("Berkas Kartu Keluarga");
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                  activeDocUrl === family.kkFile
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-sidebar-hover/40 text-gray-secondary-text hover:bg-gray-sidebar-hover"
                }`}
              >
                Kartu Keluarga
              </button>
            )}
            {family.members.map((member) => member.ktpFile && (
              <button
                key={member.id}
                onClick={() => {
                  setActiveDocUrl(member.ktpFile);
                  setActiveDocTitle(`KTP - ${member.name}`);
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                  activeDocUrl === member.ktpFile
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-sidebar-hover/40 text-gray-secondary-text hover:bg-gray-sidebar-hover"
                }`}
              >
                KTP: {member.name.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Document Viewer Frame */}
          <div className="flex-1 p-4 flex items-center justify-center bg-gray-950/5 overflow-auto relative">
            {activeDocUrl ? (
              isPdf ? (
                <iframe
                  src={activeDocUrl}
                  title={activeDocTitle}
                  className="w-full h-full border-0 rounded-2xl bg-white shadow-md"
                />
              ) : (
                <div className="max-w-full max-h-full flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeDocUrl}
                    alt={activeDocTitle}
                    className="max-w-full max-h-[70vh] lg:max-h-[75vh] object-contain rounded-2xl shadow-md border border-gray-border"
                  />
                  <div className="absolute top-2 right-2 bg-gray-950/60 backdrop-blur-xs text-[10px] text-white px-3 py-1.5 rounded-xl font-medium">
                    {activeDocTitle}
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-20 text-xs text-gray-placeholder flex flex-col items-center gap-2">
                <FileText className="h-10 w-10 text-gray-border animate-pulse" />
                Belum ada dokumen scan KK / KTP yang diunggah
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: Data Checklist & Actions (40% on desktop) */}
        <div className={`w-full lg:w-[40%] flex flex-col bg-gray-card ${
          activeMobileTab === "data" ? "flex" : "hidden lg:flex"
        }`}>
          {/* Scrollable details panel */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            
            {/* Status Rejection Note if rejected */}
            {family.verificationStatus === "rejected" && family.verificationNote && (
              <div className="p-4 border border-rose-200 bg-rose-50/50 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-rose-800">Berkas Ditolak Sebelumnya</h5>
                  <p className="text-[10px] text-rose-700 mt-1 leading-relaxed font-semibold">
                    Alasan: &quot;{family.verificationNote}&quot;
                  </p>
                </div>
              </div>
            )}

            {/* Address & Dwelling Info */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-gray-secondary-text uppercase tracking-wider">
                Lokasi Tempat Tinggal
              </h3>
              <div className="p-4 border border-gray-border rounded-2xl space-y-3 bg-gray-card/50">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    {family.dwelling ? (
                      <h4 className="text-xs font-bold text-gray-heading-main">
                        Blok {family.dwelling.blockNumber} No. {family.dwelling.houseNumber}
                        {family.unitNumber ? ` (Unit ${family.unitNumber})` : ""}
                      </h4>
                    ) : (
                      <span className="text-xs font-bold text-gray-placeholder">
                        Alamat belum teralokasi
                      </span>
                    )}
                    <p className="text-[10px] text-gray-secondary-text mt-1 leading-normal">
                      Tanggal Mulai Tinggal: <span className="font-semibold text-gray-heading-main">{formatDate(family.checkInDate)}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simple Diff Viewer (Only shown for update submissions) */}
            {isUpdate && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-secondary-text uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                  Sorotan Perubahan Data
                </h3>
                <div className="p-4 border border-blue-100 bg-blue-50/20 rounded-2xl text-[10px] text-gray-secondary-text space-y-2">
                  <p className="leading-relaxed">
                    Sistem mendeteksi adanya data baru/anggota keluarga baru yang diunggah sejak verifikasi KK terakhir. 
                    Periksa nama anggota yang berlabel <span className="text-blue-700 font-bold bg-blue-100 px-1.5 py-0.5 rounded-md text-[8px] uppercase">BARU</span> di bawah ini.
                  </p>
                </div>
              </div>
            )}

            {/* Family Members Check List */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-gray-secondary-text uppercase tracking-wider">
                Daftar Anggota Keluarga ({family.members.length} Jiwa)
              </h3>
              
              <div className="space-y-3">
                {family.members.map((member) => {
                  const isNew = !isUpdate || isNewMember(member);
                  const isEdited = isUpdate && isEditedMember(member) && !isNewMember(member);
                  return (
                    <div
                      key={member.id}
                      className={`p-4 border rounded-2xl transition-all ${
                        isNew
                          ? "border-blue-200 bg-blue-50/10"
                          : isEdited
                          ? "border-amber-200 bg-amber-50/10"
                          : "border-gray-border bg-gray-card/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-gray-heading-main">{member.name}</h4>
                            {isNew && (
                              <span className="text-[8px] font-bold bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                Baru
                              </span>
                            )}
                            {isEdited && (
                              <span className="text-[8px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                Diubah
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-mono text-gray-secondary-text mt-0.5 block">{member.nik}</span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-sidebar-hover text-gray-secondary-text rounded-full shrink-0">
                          {getRelationshipLabel(member.relationship)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 text-[9px] text-gray-secondary-text mt-3 pt-3 border-t border-gray-border/40">
                        <div>
                          <span className="font-bold text-gray-secondary-text block">Gender</span>
                          <span className="text-gray-heading-main mt-0.5 block">
                            {member.gender === "L" ? "Laki-laki" : "Perempuan"}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-secondary-text block">Tempat Lahir</span>
                          <span className="text-gray-heading-main mt-0.5 block">{member.birthPlace || "-"}</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-secondary-text block">Tanggal Lahir</span>
                          <span className="text-gray-heading-main mt-0.5 block">{formatDate(member.birthDate)}</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-secondary-text block">Agama</span>
                          <span className="text-gray-heading-main mt-0.5 block">{member.religion || "-"}</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-secondary-text block">Pendidikan</span>
                          <span className="text-gray-heading-main mt-0.5 block">{member.educationLevel || "-"}</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-secondary-text block">Pekerjaan</span>
                          <span className="text-gray-heading-main mt-0.5 block">{member.occupation || "-"}</span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="font-bold text-gray-secondary-text block">No. Telepon / HP</span>
                          <span className="text-gray-heading-main mt-0.5 block">{member.phone || "-"}</span>
                        </div>
                        
                        {/* KTP link that updates Left Document Viewer */}
                        <div className="col-span-2 sm:col-span-3 mt-1.5 pt-1.5 border-t border-gray-border/20">
                          {member.ktpFile ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDocUrl(member.ktpFile);
                                setActiveDocTitle(`KTP - ${member.name}`);
                                // Auto switch to document tab on mobile
                                if (window.innerWidth < 1024) {
                                  setActiveMobileTab("document");
                                }
                              }}
                              className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                                activeDocUrl === member.ktpFile
                                  ? "bg-primary text-white border-primary"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                              }`}
                            >
                              <Eye className="h-3 w-3" />
                              Tampilkan KTP di Viewer
                            </button>
                          ) : (
                            <span className="italic text-gray-placeholder text-[9px]">
                              KTP: {member.birthDate && new Date().getFullYear() - new Date(member.birthDate).getFullYear() < 17 
                                ? "Di bawah 17 th (Tidak wajib KTP)" 
                                : "Belum diunggah"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 4. Footer Actions (Only shown for pending KKs) */}
          {isPending && (
            <div className="px-4 md:px-6 py-4 bg-gray-sidebar-hover/10 border-t border-gray-border shrink-0">
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmAction("reject");
                    setIsConfirmOpen(true);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 border border-rose-200 text-xs text-rose-700 bg-rose-50/50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50 font-bold text-center"
                >
                  Tolak Berkas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmAction("approve");
                    setIsConfirmOpen(true);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Setujui & Kunci
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Verify Confirm/Reject Modal Popup */}
      <VerifyConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setConfirmAction(null);
        }}
        action={confirmAction}
        title={`KK ${family.headName}`}
        onConfirm={handleActionConfirm}
      />

    </div>
  );
}
