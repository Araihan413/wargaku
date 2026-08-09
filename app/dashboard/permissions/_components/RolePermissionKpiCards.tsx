import React from "react";
import { UserCheck, ShieldCheck, KeyRound, Lock } from "lucide-react";
import { RolePermissionMatrixData, MatrixState } from "../types";

interface RolePermissionKpiCardsProps {
  data: RolePermissionMatrixData;
  currentMatrix: MatrixState;
}

export const RolePermissionKpiCards: React.FC<RolePermissionKpiCardsProps> = ({
  data,
  currentMatrix,
}) => {
  const totalRoles = data.roles.length;
  const totalPermissions = data.permissions.length;
  const totalActiveMappings = Object.values(currentMatrix).reduce(
    (acc, ids) => acc + ids.length,
    0
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Role */}
      <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-blue-900 tracking-wider">
            Total Peran Sistem
          </span>
          <div className="p-2 bg-blue-600 text-white rounded-xl">
            <UserCheck className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-blue-900 tracking-tight">
            {totalRoles} Role
          </h3>
          <p className="text-[11px] text-blue-800/80 font-medium mt-1">
            Super Admin hingga Warga
          </p>
        </div>
      </div>

      {/* 2. Total Permission */}
      <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-emerald-900 tracking-wider">
            Izin Fitur (MVP)
          </span>
          <div className="p-2 bg-emerald-600 text-white rounded-xl">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-emerald-700 tracking-tight">
            {totalPermissions} Permission
          </h3>
          <p className="text-[11px] text-emerald-800/80 font-medium mt-1">
            Terbagi dalam {data.moduleGroups.length} Modul Fitur
          </p>
        </div>
      </div>

      {/* 3. Pemetaan Aktif */}
      <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-indigo-900 tracking-wider">
            Pemetaan Izin Aktif
          </span>
          <div className="p-2 bg-indigo-600 text-white rounded-xl">
            <KeyRound className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-indigo-700 tracking-tight font-mono">
            {totalActiveMappings} / {totalRoles * totalPermissions}
          </h3>
          <p className="text-[11px] text-indigo-800/80 font-medium mt-1">
            Total kombinasi centang aktif
          </p>
        </div>
      </div>

      {/* 4. Proteksi Core Admin */}
      <div className="p-5 rounded-2xl border border-amber-100 bg-amber-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-amber-900 tracking-wider">
            Proteksi Core System
          </span>
          <div className="p-2 bg-amber-600 text-white rounded-xl">
            <Lock className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-amber-700 tracking-tight">
            3 Lock System
          </h3>
          <p className="text-[11px] text-amber-800/80 font-medium mt-1">
            Izin core Super Admin dilindungi
          </p>
        </div>
      </div>
    </div>
  );
};
