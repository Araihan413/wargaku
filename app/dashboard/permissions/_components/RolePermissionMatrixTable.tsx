import React from "react";
import { Lock, ShieldCheck, Check, Info } from "lucide-react";
import { RolePermissionMatrixData, MatrixState, PermissionModuleGroup } from "../types";

interface RolePermissionMatrixTableProps {
  data: RolePermissionMatrixData;
  matrix: MatrixState;
  onTogglePermission: (roleId: number, permissionId: number) => void;
  filteredModuleGroups: PermissionModuleGroup[];
}

export const RolePermissionMatrixTable: React.FC<RolePermissionMatrixTableProps> = ({
  data,
  matrix,
  onTogglePermission,
  filteredModuleGroups,
}) => {
  // System Admin permissions list
  const SYSTEM_ADMIN_PERMISSIONS = [
    "manage-users",
    "manage-roles",
    "view-audit-logs",
    "view-complaints-report",
    "manage-system-config",
  ];

  // Core permissions locked
  const isRoleLocked = (roleId: number, permissionSlug: string) => {
    // 1. System Admin permissions dikunci untuk seluruh role
    if (SYSTEM_ADMIN_PERMISSIONS.includes(permissionSlug)) {
      return true;
    }
    // 2. Role Non-Pengurus (Role 5: Koordinator Kost, Role 6: Warga) dikunci (Permission paten bawaan sistem)
    if (roleId === 5 || roleId === 6) {
      return true;
    }
    return false;
  };

  const getLockTooltip = (roleId: number, _permissionSlug: string) => {
    if (roleId === 5 || roleId === 6) {
      return `Permission untuk ${roleId === 5 ? "Koordinator Kost" : "Warga"} dikelola oleh sistem dan bersifat paten`;
    }
    if (roleId === 1) {
      return "Izin core Super Admin dilindungi dari penonaktifan";
    }
    return "Hak Akses Otoritas Keamanan Sistem dikunci (Khusus Super Admin)";
  };



  const getRoleBadgeStyle = (roleId: number) => {
    switch (roleId) {
      case 1:
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case 2:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 3:
        return "bg-sky-100 text-sky-800 border-sky-200";
      case 4:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case 5:
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  return (
    <div className="bg-gray-card border border-gray-border rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-gray-border bg-gray-sidebar-hover/40 text-gray-heading-main">
              <th className="py-4 px-4 font-extrabold text-sm min-w-70">
                Izin Fitur / Modul ({data.permissions.length} Permission)
              </th>
              {data.roles.map((role) => (
                <th
                  key={role.id}
                  className="py-4 px-3 text-center min-w-30 font-bold"
                >
                  <div
                    className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg border text-[11px] font-extrabold ${getRoleBadgeStyle(
                      role.id
                    )}`}
                  >
                    {role.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body grouped by Module */}
          <tbody className="divide-y divide-gray-border/60">
            {filteredModuleGroups.length === 0 ? (
              <tr>
                <td
                  colSpan={data.roles.length + 1}
                  className="py-12 text-center text-gray-secondary-text font-medium"
                >
                  Tidak ada permission yang sesuai dengan kata kunci pencarian/filter.
                </td>
              </tr>
            ) : (
              filteredModuleGroups.map((group) => (
                <React.Fragment key={group.module}>
                  {/* Module Header Bar */}
                  <tr className="bg-gray-100/70 border-y border-gray-border">
                    <td
                      colSpan={data.roles.length + 1}
                      className="py-2.5 px-4 font-black uppercase tracking-wider text-[11px] text-gray-heading-main bg-gray-100/90"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span>Modul: {group.module}</span>
                        <span className="text-[10px] font-semibold text-gray-secondary-text lowercase">
                          ({group.permissions.length} izin)
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Permissions rows */}
                  {group.permissions.map((perm) => (
                    <tr
                      key={perm.id}
                      className="hover:bg-gray-sidebar-hover/20 transition-colors"
                    >
                      {/* Permission Label & Description */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-heading-main text-sm">
                          {perm.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-[10px] font-mono bg-gray-100 text-gray-secondary-text px-1.5 py-0.5 rounded border border-gray-border/50">
                            {perm.slug}
                          </code>
                          <span className="text-xs text-gray-secondary-text truncate max-w-xs">
                            {perm.description}
                          </span>
                        </div>
                      </td>

                      {/* Checkbox per Role */}
                      {data.roles.map((role) => {
                        const isChecked = (matrix[role.id] || []).includes(
                          perm.id
                        );
                        const isLocked = isRoleLocked(role.id, perm.slug);
                        const lockTooltip = getLockTooltip(role.id, perm.slug);

                        return (
                          <td key={role.id} className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center">
                              {isLocked ? (
                                <div
                                  title={lockTooltip}
                                  className={`p-1.5 border rounded-lg cursor-not-allowed flex items-center justify-center ${
                                    isChecked
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                      : "bg-gray-100/80 border-gray-border text-gray-400 opacity-60"
                                  }`}
                                >
                                  {isChecked ? (
                                    <Check className="w-4 h-4 text-emerald-600 stroke-3" />
                                  ) : (
                                    <Lock className="w-4 h-4" />
                                  )}
                                </div>
                              ) : (
                                <label className="relative inline-flex items-center cursor-pointer group">

                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() =>
                                      onTogglePermission(role.id, perm.id)
                                    }
                                    className="sr-only peer"
                                  />
                                  <div className="w-5 h-5 bg-gray-card border-2 border-gray-border rounded-md peer-checked:bg-primary peer-checked:border-primary peer-focus:ring-2 peer-focus:ring-primary/20 transition-all flex items-center justify-center">
                                    {isChecked && (
                                      <Check className="w-3.5 h-3.5 text-white stroke-3" />
                                    )}
                                  </div>
                                </label>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 bg-gray-50/70 border-t border-gray-border flex items-center gap-2 text-xs text-gray-secondary-text">
        <Info className="w-4 h-4 text-primary shrink-0" />
        <span>
          Centang checkbox dan tekan tombol <strong>Simpan</strong> untuk menyimpan perubahan.
        </span>
      </div>
    </div>
  );
};
