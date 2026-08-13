"use client";

import React from "react";
import { SecureDocumentLink } from "@/components/SecureDocumentLink";
import { WargaFamilyMember } from "../types";
import {
  User,
  Edit2,
  Trash2,
  FileCheck,
  FileX,
  UserCheck,
  Plus,
  Lock,
  Download,
  RotateCcw,
  UserX,
} from "lucide-react";

interface WargaMemberTableProps {
  members: WargaFamilyMember[];
  isLocked: boolean;
  isPending?: boolean;
  onAddMember: () => void;
  onEditMember: (member: WargaFamilyMember) => void;
  onDeleteMember: (member: WargaFamilyMember) => void;
  onRestoreMember: (member: WargaFamilyMember) => void;
}

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
      return "Lainnya";
  }
};

export const WargaMemberTable: React.FC<WargaMemberTableProps> = ({
  members,
  isLocked,
  isPending = false,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onRestoreMember,
}) => {
  const activeMembers = members.filter((m) => m.isActive);
  const inactiveMembers = members.filter((m) => !m.isActive);
  const orderedMembers = [...activeMembers, ...inactiveMembers];

  return (
    <div className="space-y-4">
      {/* Table Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-gray-heading-main">
            Daftar Anggota Keluarga ({activeMembers.length}
            {inactiveMembers.length > 0 && (
              <span className="text-gray-secondary-text text-sm ml-1">
                + {inactiveMembers.length} Nonaktif
              </span>
            )}
            )
          </h3>
          <p className="text-xs text-gray-secondary-text mt-0.5">
            Lengkapi data diri dan scan KTP setiap anggota keluarga yang terdaftar dalam KK.
          </p>
        </div>

        {!isLocked && (
          <button
            type="button"
            onClick={onAddMember}
            className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-900 text-white px-4 py-2.5 text-xs font-bold cursor-pointer shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Anggota Keluarga</span>
          </button>
        )}
      </div>

      {/* Desktop & Tablet Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-border bg-gray-card shadow-sm">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
              <tr>
                <th className="py-4 px-5">Nama Lengkap</th>
                <th className="py-4 px-5">NIK</th>
                <th className="py-4 px-5">Hubungan</th>
                <th className="py-4 px-5">L/P</th>
                <th className="py-4 px-5">Scan KTP</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border/60">
              {orderedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-placeholder">
                    Belum ada anggota keluarga terdaftar. Klik &quot;Tambah Anggota Keluarga&quot; untuk menambahkan.
                  </td>
                </tr>
              ) : (
                orderedMembers.map((member) => {
                  const isHead = member.relationship === "Kepala_Keluarga";
                  const isInactive = !member.isActive;

                  return (
                    <tr
                      key={member.id}
                      className={`transition-colors ${
                        isInactive
                          ? "bg-gray-sidebar-hover/30 opacity-60"
                          : "hover:bg-gray-sidebar-hover/50"
                      }`}
                    >
                      {/* Name & Role Icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold ${
                              isInactive
                                ? "bg-gray-border text-gray-placeholder border border-gray-border"
                                : isHead
                                ? "bg-primary/10 text-primary-900 border border-primary/20"
                                : "bg-gray-sidebar-hover text-gray-heading-main border border-gray-border"
                            }`}
                          >
                            {isInactive ? (
                              <UserX className="h-4 w-4" />
                            ) : isHead ? (
                              <UserCheck className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <span
                              className={`font-bold block ${
                                isInactive ? "text-gray-secondary-text line-through" : "text-gray-heading-main"
                              }`}
                            >
                              {member.name}
                            </span>
                            {isInactive ? (
                              <span className="text-[10px] text-gray-placeholder italic">
                                {member.inactiveNote || "Tidak aktif"}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-secondary-text">
                                {member.phone || "No HP: -"}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* NIK */}
                      <td
                        className={`py-3.5 px-4 font-mono font-semibold ${
                          isInactive ? "text-gray-secondary-text" : "text-gray-heading-main"
                        }`}
                      >
                        {member.nik}
                      </td>

                      {/* Relationship Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isInactive
                              ? "bg-gray-border/60 text-gray-placeholder border border-gray-border"
                              : isHead
                              ? "bg-primary/10 text-primary-900 border border-primary/20"
                              : "bg-gray-sidebar-hover text-gray-heading-main border border-gray-border"
                          }`}
                        >
                          {getRelationshipLabel(member.relationship)}
                        </span>
                      </td>

                      {/* Gender */}
                      <td
                        className={`py-3.5 px-4 font-bold ${
                          isInactive ? "text-gray-secondary-text" : "text-gray-heading-main"
                        }`}
                      >
                        {member.gender === "L" ? "Laki-laki" : "Perempuan"}
                      </td>

                      {/* KTP File Status & Download PDF */}
                      <td className="py-3.5 px-4">
                        {isInactive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-border/40 px-2.5 py-1 text-[11px] font-semibold text-gray-placeholder">
                            <FileX className="h-3.5 w-3.5" />
                            <span>Non-aktif</span>
                          </span>
                        ) : member.ktpFile ? (
                          <div className="flex items-center gap-1.5">
                            <SecureDocumentLink
                              type="ktp-member"
                              recordId={member.id}
                              mode="view"
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Lihat Berkas KTP"
                            >
                              <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span>KTP</span>
                            </SecureDocumentLink>
                            <SecureDocumentLink
                              type="ktp-member"
                              recordId={member.id}
                              mode="download"
                              downloadFilename={`Scan_KTP_${member.nik}.pdf`}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Unduh KTP sebagai PDF"
                            >
                              <Download className="h-3.5 w-3.5 text-blue-600" />
                              <span>PDF</span>
                            </SecureDocumentLink>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            <FileX className="h-3.5 w-3.5 text-amber-600" />
                            <span>Belum Upload</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isInactive ? (
                            /* Anggota tidak aktif: hanya bisa diaktifkan ulang jika tidak terkunci */
                            !isLocked ? (
                              <button
                                type="button"
                                onClick={() => onRestoreMember(member)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer transition-colors"
                                title="Aktifkan Kembali Anggota"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Aktifkan</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-gray-placeholder cursor-help" title="Data terkunci oleh RT.">
                                <Lock className="h-3 w-3" /> Terkunci
                              </span>
                            )
                          ) : isPending ? (
                            /* Situasi 4: Sedang pending menunggu verifikasi RT (Terkunci total) */
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-placeholder cursor-help" title="Data sedang dalam proses verifikasi oleh Ketua RT.">
                              <Lock className="h-3.5 w-3.5" /> Terkunci
                            </span>
                          ) : isLocked ? (
                            /* Situasi 2: Status Terverifikasi (Warga bisa perbarui nomor HP) */
                            <button
                              type="button"
                              onClick={() => onEditMember(member)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-gray-secondary-text hover:text-primary hover:bg-gray-sidebar-hover cursor-pointer transition-colors text-xs font-semibold"
                              title="Perbarui Nomor Telepon / WhatsApp"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-primary" />
                              <span>Ubah Kontak</span>
                            </button>
                          ) : (
                            /* Situasi 1 & 3: Draf Registrasi / Draf Perubahan (Full Edit & Hapus) */
                            <>
                              <button
                                type="button"
                                onClick={() => onEditMember(member)}
                                className="rounded-lg p-1.5 text-gray-secondary-text hover:text-primary hover:bg-gray-sidebar-hover cursor-pointer transition-colors"
                                title="Edit Data & Upload KTP"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>

                              {!isHead && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteMember(member)}
                                  className="rounded-lg p-1.5 text-gray-secondary-text hover:text-error hover:bg-error/10 cursor-pointer transition-colors"
                                  title="Hapus / Nonaktifkan Anggota"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
