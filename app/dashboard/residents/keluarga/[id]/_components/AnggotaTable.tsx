import React from "react";
import { Pencil, Trash2, ShieldAlert, RotateCcw, ArrowRightLeft } from "lucide-react";
import { FamilyMemberItem } from "../../../types";

interface AnggotaTableProps {
  members: FamilyMemberItem[];
  onEdit: (member: FamilyMemberItem) => void;
  onDisable: (member: FamilyMemberItem) => void;
  onReactivate: (member: FamilyMemberItem) => void;
  onTransfer: (member: FamilyMemberItem) => void;
}

export const AnggotaTable: React.FC<AnggotaTableProps> = ({
  members,
  onEdit,
  onDisable,
  onReactivate,
  onTransfer,
}) => {
  const calculateAge = (birthDateString: string | null | undefined) => {
    if (!birthDateString) return "-";
    try {
      const birth = new Date(birthDateString);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const monthDiff = now.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 ? `${age} tahun` : "-";
    } catch {
      return "-";
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
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
    <div className="border border-gray-border rounded-2xl bg-gray-card shadow-sm overflow-hidden mt-6">
      <div className="flex items-center justify-between border-b border-gray-border bg-gray-card px-5 py-4 shrink-0">
        <h3 className="text-base font-bold text-gray-heading-main">
          Daftar Anggota Keluarga
        </h3>
        <span className="text-xs font-bold text-gray-secondary-text bg-gray-sidebar-hover border border-gray-border px-2.5 py-1 rounded-lg">
          Total: {members.filter(m => m.isActive).length} aktif
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-border bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text uppercase tracking-wider">
              <th className="py-4 px-5">Nama Lengkap</th>
              <th className="py-4 px-5">NIK</th>
              <th className="py-4 px-5">Hubungan</th>
              <th className="py-4 px-5">Gender</th>
              <th className="py-4 px-5">Usia</th>
              <th className="py-4 px-5">Pekerjaan</th>
              <th className="py-4 px-5">Status</th>
              <th className="py-4 px-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
            {members.length > 0 ? (
              members.map((m) => {
                const isHead = m.relationship === "Kepala_Keluarga";

                return (
                  <tr
                    key={m.id}
                    className={`hover:bg-gray-sidebar-hover/40 transition-colors ${
                      !m.isActive ? "opacity-60 bg-gray-50/20" : ""
                    }`}
                  >
                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-heading-main">
                          {m.name}
                        </span>
                        {m.phone && (
                          <span className="text-xs text-gray-secondary-text">
                            {m.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-gray-body-text-btn">
                      {m.nik}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          isHead
                            ? "bg-primary-900-20 border border-primary/20 text-primary-900"
                            : "bg-gray-100 border border-gray-200 text-gray-heading-main"
                        }`}
                      >
                        {getRelationshipLabel(m.relationship)}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-gray-body-text-btn">
                      {m.gender === "L" ? "Laki-laki" : "Perempuan"}
                    </td>
                    <td className="py-4 px-5 text-gray-body-text-btn">
                      {calculateAge(m.birthDate)}
                    </td>
                    <td className="py-4 px-5 text-gray-body-text-btn">
                      {m.occupation || "-"}
                    </td>
                    <td className="py-4 px-5">
                      {m.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2.5 py-0.5 text-xs font-bold text-success">
                          Aktif
                        </span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-error/10 border border-error/20 px-2.5 py-0.5 text-xs font-bold text-error self-start"
                            title={`Alasan: ${m.inactiveReason || "pindah"}`}
                          >
                            Nonaktif ({m.inactiveReason || "pindah"})
                          </span>
                          {m.updatedAt && (
                            <span className="text-[10px] text-gray-secondary-text">
                              Sejak {formatDate(m.updatedAt)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        {/* Edit Anggota */}
                        {m.isActive && (
                          <button
                            onClick={() => onEdit(m)}
                            title="Edit Anggota"
                            className="p-1.5 text-gray-secondary-text hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-colors"
                          >
                            <Pencil className="h-4.5 w-4.5" />
                          </button>
                        )}

                        {/* Pindah KK */}
                        {m.isActive && (
                          <button
                            onClick={() => onTransfer(m)}
                            title="Pindah KK"
                            className="p-1.5 text-gray-secondary-text hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-colors"
                          >
                            <ArrowRightLeft className="h-4.5 w-4.5" />
                          </button>
                        )}

                        {/* Nonaktifkan Anggota */}
                        {m.isActive && !isHead && (
                          <button
                            onClick={() => onDisable(m)}
                            title="Nonaktifkan Anggota"
                            className="p-1.5 text-gray-secondary-text hover:text-error hover:bg-error/10 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                        
                        {/* Head of Family warning */}
                        {m.isActive && isHead && (
                          <span
                            title="Kepala Keluarga tidak dapat dinonaktifkan di sini. Nonaktifkan melalui Kartu Keluarga."
                            className="p-1.5 text-gray-placeholder cursor-not-allowed"
                          >
                            <ShieldAlert className="h-4.5 w-4.5 text-gray-placeholder/60" />
                          </span>
                        )}

                        {/* Aktifkan Kembali Anggota */}
                        {!m.isActive && (
                          <button
                            onClick={() => onReactivate(m)}
                            title="Aktifkan Kembali Anggota"
                            className="p-1.5 text-gray-secondary-text hover:text-success hover:bg-success/10 rounded-lg cursor-pointer transition-colors"
                          >
                            <RotateCcw className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-placeholder">
                  Belum ada anggota keluarga terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
