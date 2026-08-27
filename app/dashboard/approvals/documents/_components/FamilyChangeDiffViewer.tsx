"use client";

import React from "react";
import {
  UserPlus,
  UserCheck,
  UserX,
  Eye,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface DraftMember {
  id?: number;
  tempId?: string;
  name: string;
  nik: string;
  gender: "L" | "P";
  relationship: string;
  birthPlace?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  occupation?: string | null;
  educationLevel?: string | null;
  religion?: string | null;
  ktpFile?: string | null;
  inactiveNote?: string | null;
  isActive: boolean;
  _action?: "keep" | "create" | "update" | "delete";
}

interface LiveMember {
  id: number;
  name: string;
  nik: string;
  gender: "L" | "P";
  relationship: string;
  birthPlace?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  occupation?: string | null;
  educationLevel?: string | null;
  religion?: string | null;
  ktpFile?: string | null;
  inactiveNote?: string | null;
  isActive?: boolean;
}

interface FamilyChangeDiffViewerProps {
  liveFamilyNumber: string;
  liveMembers: LiveMember[];
  draftFamilyNumber?: string | null;
  draftMembers: DraftMember[];
  onSelectDoc?: (doc: { type: "kk" | "ktp-member"; recordId: number; title: string }) => void;
}

export const FamilyChangeDiffViewer: React.FC<FamilyChangeDiffViewerProps> = ({
  liveFamilyNumber,
  liveMembers,
  draftFamilyNumber,
  draftMembers,
  onSelectDoc,
}) => {
  const [isUnchangedCollapsed, setIsUnchangedCollapsed] = React.useState(true);
  const createdMembers = draftMembers.filter((m) => m._action === "create");
  const updatedMembers = draftMembers.filter((m) => m._action === "update");
  const deletedMembers = draftMembers.filter((m) => m._action === "delete" || (!m.isActive && m._action !== "keep"));
  const unchangedMembers = draftMembers.filter((m) => m._action === "keep" && m.isActive);

  const isFamilyNumberChanged = draftFamilyNumber && draftFamilyNumber !== liveFamilyNumber;

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
      case "Mertua":
        return "Mertua";
      case "Sepupu":
        return "Sepupu";
      default:
        return rel || "Lainnya";
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner Ringkasan Perubahan */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-primary font-bold text-sm mb-3">
          <Sparkles className="h-4 w-4" />
          <span>Ringkasan Usulan Perubahan Data</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-border bg-gray-card p-3 text-center">
            <span className="text-xs text-gray-secondary-text block">Anggota Baru</span>
            <span className="text-lg font-black text-emerald-600">{createdMembers.length}</span>
          </div>
          <div className="rounded-xl border border-gray-border bg-gray-card p-3 text-center">
            <span className="text-xs text-gray-secondary-text block">Biodata Diubah</span>
            <span className="text-lg font-black text-amber-600">{updatedMembers.length}</span>
          </div>
          <div className="rounded-xl border border-gray-border bg-gray-card p-3 text-center">
            <span className="text-xs text-gray-secondary-text block">Dinonaktifkan</span>
            <span className="text-lg font-black text-red-600">{deletedMembers.length}</span>
          </div>
          <div className="rounded-xl border border-gray-border bg-gray-card p-3 text-center">
            <span className="text-xs text-gray-secondary-text block">Tetap</span>
            <span className="text-lg font-black text-gray-heading-main">{unchangedMembers.length}</span>
          </div>
        </div>

        {/* Perubahan No KK */}
        {isFamilyNumberChanged && (
          <div className="mt-3.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2 flex-wrap">
            <span className="font-bold">Nomor KK Diubah:</span>
            <span className="line-through text-gray-secondary-text">{liveFamilyNumber}</span>
            <ArrowRight className="h-3 w-3 text-amber-700" />
            <span className="font-black text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-md">{draftFamilyNumber}</span>
          </div>
        )}
      </div>

      {/* 1. ANGGOTA BARU (CREATED) */}
      {createdMembers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
              +{createdMembers.length}
            </span>
            <h4 className="text-sm font-bold text-emerald-900">
              Anggota Baru yang Ditambahkan
            </h4>
          </div>

          <div className="grid gap-3">
            {createdMembers.map((m, idx) => (
              <div
                key={m.tempId || idx}
                className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-4 sm:p-5 relative space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-emerald-200/70">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <UserPlus className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-heading-main">{m.name}</span>
                      <span className="text-xs text-gray-secondary-text font-mono">NIK: {m.nik}</span>
                    </div>
                  </div>
                  <span className="inline-flex self-start sm:self-auto rounded-full bg-emerald-100 border border-emerald-200/80 px-3 py-1 text-xs font-bold text-emerald-800">
                    {getRelationshipLabel(m.relationship)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3.5 gap-y-2.5 p-3 rounded-xl bg-white/80 border border-emerald-200/60 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-medium text-gray-secondary-text block leading-tight">Jenis Kelamin</span>
                    <span className="font-semibold text-gray-heading-main text-[11px] block mt-0.5">{m.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-gray-secondary-text block leading-tight">Agama</span>
                    <span className="font-semibold text-gray-heading-main text-[11px] block mt-0.5">{m.religion || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-gray-secondary-text block leading-tight">Pekerjaan</span>
                    <span className="font-semibold text-gray-heading-main text-[11px] block mt-0.5">{m.occupation || "-"}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-[10px] font-medium text-gray-secondary-text block leading-tight">Pendidikan Terakhir</span>
                    <span className="font-semibold text-gray-heading-main text-[11px] block mt-0.5">{m.educationLevel || "-"}</span>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-[10px] font-medium text-gray-secondary-text block leading-tight">Tempat, Tgl Lahir</span>
                    <span className="font-semibold text-gray-heading-main text-[11px] block mt-0.5">
                      {m.birthPlace ? `${m.birthPlace}, ` : ""}{formatDate(m.birthDate)}
                    </span>
                  </div>
                  {m.phone && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-medium text-gray-secondary-text block leading-tight">No. Telepon</span>
                      <span className="font-semibold text-gray-heading-main text-[11px] block mt-0.5">{m.phone}</span>
                    </div>
                  )}
                </div>


                {m.ktpFile && onSelectDoc && m.id && (
                  <button
                    type="button"
                    onClick={() => onSelectDoc({ type: "ktp-member", recordId: m.id!, title: `KTP - ${m.name}` })}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Lihat Berkas KTP Anggota Baru</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      {/* 2. ANGGOTA DIUBAH / DIEDIT (UPDATED) */}
      {updatedMembers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
              ~{updatedMembers.length}
            </span>
            <h4 className="text-sm font-bold text-amber-900">
              Biodata Anggota yang Diedit
            </h4>
          </div>

          <div className="grid gap-3">
            {updatedMembers.map((m) => {
              const live = liveMembers.find((lm) => lm.id === m.id);

              return (
                <div
                  key={m.id}
                  className="rounded-2xl border border-amber-300 bg-amber-50/40 p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/60">
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="h-4 w-4 text-amber-600 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-heading-main">{m.name}</span>
                        {live && live.name !== m.name && (
                          <span className="text-xs line-through text-gray-secondary-text ml-2">
                            ({live.name})
                          </span>
                        )}
                        <span className="text-[10px] text-gray-secondary-text">NIK: {m.nik}</span>
                      </div>
                    </div>
                    <span className="inline-flex self-start sm:self-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                      {getRelationshipLabel(m.relationship)}
                    </span>
                  </div>

                  {/* Diff Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                    {live && live.relationship !== m.relationship && (
                      <div className="p-2 rounded-lg bg-amber-100/60 border border-amber-200">
                        <span className="text-gray-secondary-text block">Hubungan Keluarga</span>
                        <span className="line-through text-gray-secondary-text mr-1.5">{getRelationshipLabel(live.relationship)}</span>
                        <ArrowRight className="inline h-3 w-3 text-amber-700 mr-1.5" />
                        <span className="font-bold text-amber-950">{getRelationshipLabel(m.relationship)}</span>
                      </div>
                    )}

                    {live && live.occupation !== m.occupation && (
                      <div className="p-2 rounded-lg bg-amber-100/60 border border-amber-200">
                        <span className="text-gray-secondary-text block">Pekerjaan</span>
                        <span className="line-through text-gray-secondary-text mr-1.5">{live.occupation || "-"}</span>
                        <ArrowRight className="inline h-3 w-3 text-amber-700 mr-1.5" />
                        <span className="font-bold text-amber-950">{m.occupation || "-"}</span>
                      </div>
                    )}

                    {live && live.educationLevel !== m.educationLevel && (
                      <div className="p-2 rounded-lg bg-amber-100/60 border border-amber-200">
                        <span className="text-gray-secondary-text block">Pendidikan Terakhir</span>
                        <span className="line-through text-gray-secondary-text mr-1.5">{live.educationLevel || "-"}</span>
                        <ArrowRight className="inline h-3 w-3 text-amber-700 mr-1.5" />
                        <span className="font-bold text-amber-950">{m.educationLevel || "-"}</span>
                      </div>
                    )}

                    {live && live.phone !== m.phone && (
                      <div className="p-2 rounded-lg bg-amber-100/60 border border-amber-200">
                        <span className="text-gray-secondary-text block">No. Telepon / WhatsApp</span>
                        <span className="line-through text-gray-secondary-text mr-1.5">{live.phone || "-"}</span>
                        <ArrowRight className="inline h-3 w-3 text-amber-700 mr-1.5" />
                        <span className="font-bold text-amber-950">{m.phone || "-"}</span>
                      </div>
                    )}

                    {live && live.religion !== m.religion && (
                      <div className="p-2 rounded-lg bg-amber-100/60 border border-amber-200">
                        <span className="text-gray-secondary-text block">Agama</span>
                        <span className="line-through text-gray-secondary-text mr-1.5">{live.religion || "-"}</span>
                        <ArrowRight className="inline h-3 w-3 text-amber-700 mr-1.5" />
                        <span className="font-bold text-amber-950">{m.religion || "-"}</span>
                      </div>
                    )}

                    {live && live.gender !== m.gender && (
                      <div className="p-2 rounded-lg bg-amber-100/60 border border-amber-200">
                        <span className="text-gray-secondary-text block">Jenis Kelamin</span>
                        <span className="line-through text-gray-secondary-text mr-1.5">{live.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
                        <ArrowRight className="inline h-3 w-3 text-amber-700 mr-1.5" />
                        <span className="font-bold text-amber-950">{m.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
                      </div>
                    )}

                    {live && live.birthPlace !== m.birthPlace && (
                      <div className="p-2 rounded-lg bg-amber-100/60 border border-amber-200">
                        <span className="text-gray-secondary-text block">Tempat Lahir</span>
                        <span className="line-through text-gray-secondary-text mr-1.5">{live.birthPlace || "-"}</span>
                        <ArrowRight className="inline h-3 w-3 text-amber-700 mr-1.5" />
                        <span className="font-bold text-amber-950">{m.birthPlace || "-"}</span>
                      </div>
                    )}

                    {live && (live.birthDate || m.birthDate) && formatDate(live.birthDate) !== formatDate(m.birthDate) && (
                      <div className="p-2 rounded-lg bg-amber-100/60 border border-amber-200">
                        <span className="text-gray-secondary-text block">Tanggal Lahir</span>
                        <span className="line-through text-gray-secondary-text mr-1.5">{formatDate(live.birthDate)}</span>
                        <ArrowRight className="inline h-3 w-3 text-amber-700 mr-1.5" />
                        <span className="font-bold text-amber-950">{formatDate(m.birthDate)}</span>
                      </div>
                    )}

                    {live && live.ktpFile !== m.ktpFile && m.ktpFile && onSelectDoc && (
                      <div className="p-2 rounded-lg bg-amber-100/60 border border-amber-200">
                        <span className="text-gray-secondary-text block">Scan KTP Diperbarui</span>
                        <button
                          type="button"
                          onClick={() => onSelectDoc({ type: "ktp-member", recordId: m.id!, title: `KTP - ${m.name}` })}
                          className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Lihat Berkas KTP Baru</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ANGGOTA DINONAKTIFKAN / DIHAPUS (DELETED) */}
      {deletedMembers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-100 text-red-700 text-xs font-bold">
              -{deletedMembers.length}
            </span>
            <h4 className="text-sm font-bold text-red-900">
              Anggota yang Dinonaktifkan
            </h4>
          </div>

          <div className="grid gap-3">
            {deletedMembers.map((m) => (
              <div
                key={m.id || m.tempId}
                className="rounded-2xl border border-red-200 bg-red-50/40 p-4 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <UserX className="h-4 w-4 text-red-600 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-heading-main line-through">{m.name}</span>
                      <span className="text-[10px] text-gray-secondary-text ">NIK: {m.nik}</span>
                    </div>
                  </div>
                  <span className="inline-flex self-start sm:self-auto rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-800">
                    {getRelationshipLabel(m.relationship)} (Dicabut)
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-red-100/60 border border-red-200 text-xs text-red-900">
                  <span className="font-bold">Alasan Penonaktifan:</span>{" "}
                  <span>{m.inactiveNote || "Dinonaktifkan oleh Kepala Keluarga"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ANGGOTA TIDAK BERUBAH (UNCHANGED) */}
      {unchangedMembers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-border/50 pb-2 gap-2">
            <h4 className="text-[10px] font-bold text-gray-secondary-text uppercase tracking-wider">
              Anggota Tidak Berubah ({unchangedMembers.length})
            </h4>
            <button
              type="button"
              onClick={() => setIsUnchangedCollapsed(!isUnchangedCollapsed)}
              className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors px-2.5 py-1 rounded-lg bg-primary/10 cursor-pointer outline-none shrink-0"
            >
              {isUnchangedCollapsed ? "Tampilkan" : "Sembunyikan"}
            </button>
          </div>

          {!isUnchangedCollapsed && (
            <div className="divide-y divide-gray-border/60 rounded-2xl border border-gray-border/60 bg-gray-card/30 overflow-hidden animate-fadeIn">
              {unchangedMembers.map((m) => (
                <div
                  key={m.id || m.tempId}
                  className="flex items-center justify-between p-3.5 hover:bg-gray-card/60 transition-colors"
                >
                  <div className="flex flex-col min-w-0 pr-3">
                    <span className="text-xs font-bold text-gray-heading-main truncate">{m.name}</span>
                    <span className="text-[10px] text-gray-secondary-text mt-0.5">NIK: {m.nik}</span>
                  </div>
                  <span className="inline-flex shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-600">
                    {getRelationshipLabel(m.relationship)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
