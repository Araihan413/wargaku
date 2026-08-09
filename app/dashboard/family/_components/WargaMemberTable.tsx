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
} from "lucide-react";

interface WargaMemberTableProps {
  members: WargaFamilyMember[];
  isLocked: boolean;
  onAddMember: () => void;
  onEditMember: (member: WargaFamilyMember) => void;
  onDeleteMember: (member: WargaFamilyMember) => void;
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
    default:
      return "Lainnya";
  }
};

export const WargaMemberTable: React.FC<WargaMemberTableProps> = ({
  members,
  isLocked,
  onAddMember,
  onEditMember,
  onDeleteMember,
}) => {
  return (
    <div className="space-y-4">
      {/* Table Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-gray-heading-main">
            Daftar Anggota Keluarga ({members.length})
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
            <thead>
              <tr className="border-b border-gray-border bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text">
                <th className="py-4 px-5">Nama Lengkap</th>
                <th className="py-4 px-5">NIK</th>
                <th className="py-4 px-5">Hubungan</th>
                <th className="py-4 px-5">L/P</th>
                <th className="py-4 px-5">Scan KTP</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border/60">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-placeholder">
                    Belum ada anggota keluarga terdaftar. Klik &quot;Tambah Anggota Keluarga&quot; untuk menambahkan.
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const isHead = member.relationship === "Kepala_Keluarga";

                  return (
                    <tr key={member.id} className="hover:bg-gray-sidebar-hover/50 transition-colors">
                      {/* Name & Role Icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold ${
                              isHead
                                ? "bg-primary/10 text-primary-900 border border-primary/20"
                                : "bg-gray-sidebar-hover text-gray-heading-main border border-gray-border"
                            }`}
                          >
                            {isHead ? <UserCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-gray-heading-main block">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-gray-secondary-text">
                              {member.phone || "No HP: -"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* NIK */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-gray-heading-main">
                        {member.nik}
                      </td>

                      {/* Relationship Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isHead
                              ? "bg-primary/10 text-primary-900 border border-primary/20"
                              : "bg-gray-sidebar-hover text-gray-heading-main border border-gray-border"
                          }`}
                        >
                          {getRelationshipLabel(member.relationship)}
                        </span>
                      </td>

                      {/* Gender */}
                      <td className="py-3.5 px-4 font-bold text-gray-heading-main">
                        {member.gender === "L" ? "Laki-laki" : "Perempuan"}
                      </td>

                      {/* KTP File Status & Download PDF */}
                      <td className="py-3.5 px-4">
                        {member.ktpFile ? (
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
                            <span>Belum KTP</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditMember(member)}
                            className="rounded-lg p-1.5 text-gray-secondary-text hover:text-primary hover:bg-gray-sidebar-hover cursor-pointer transition-colors"
                            title={isLocked ? "Ubah Data Kontak & Pekerjaan" : "Edit Data & Upload KTP"}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {!isHead && !isLocked && (
                            <button
                              type="button"
                              onClick={() => onDeleteMember(member)}
                              className="rounded-lg p-1.5 text-gray-secondary-text hover:text-error hover:bg-error/10 cursor-pointer transition-colors"
                              title="Hapus Anggota"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}

                          {isLocked && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-placeholder cursor-help" title="Data identitas dikunci oleh RT. Hubungi RT atau ajukan perubahan data KK untuk membuka kunci penuh.">
                              <Lock className="h-3 w-3" /> Terkunci
                            </span>
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
