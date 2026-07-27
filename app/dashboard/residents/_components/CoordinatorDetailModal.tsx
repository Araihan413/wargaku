"use client";

import React from "react";
import { X, User, Phone, Mail, CreditCard, Home } from "lucide-react";
import { CoordinatorItem } from "./CoordinatorTable";

interface CoordinatorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinator: CoordinatorItem | null;
}

export const CoordinatorDetailModal: React.FC<CoordinatorDetailModalProps> = ({
  isOpen,
  onClose,
  coordinator,
}) => {
  if (!isOpen || !coordinator) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-gray-card border border-gray-border rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden z-10 mx-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-heading-main">Profil & Detail Koordinator</h3>
              <p className="text-[10px] text-gray-secondary-text">Rincian informasi akun koordinator kos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Status Banner */}
          <div className="flex items-center justify-between border border-gray-border bg-gray-sidebar-hover/10 rounded-xl p-4">
            <div className="space-y-1">
              <div className="text-[10px] text-gray-placeholder font-bold uppercase tracking-wider">Status Akun</div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                coordinator.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : coordinator.status === "pending"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {coordinator.status === "active" ? "Aktif" : coordinator.status === "pending" ? "Pending" : "Nonaktif"}
              </span>
            </div>

            <div className="space-y-1 text-right">
              <div className="text-[10px] text-gray-placeholder font-bold uppercase tracking-wider">Total Kelola</div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-sidebar-hover text-xs font-semibold text-gray-heading-main">
                <Home className="h-3 w-3 text-gray-placeholder" />
                {coordinator.propertiesCount} Properti Kos
              </span>
            </div>
          </div>

          {/* Detail Fields */}
          <div className="bg-gray-sidebar-hover/5 border border-gray-border rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-gray-heading-main uppercase tracking-wider border-b border-gray-border/50 pb-2">
              Informasi Pribadi
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div className="flex items-start gap-2.5">
                <User className="h-4 w-4 text-gray-placeholder mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-placeholder font-medium block">Nama Lengkap</span>
                  <span className="text-xs font-bold text-gray-heading-main">{coordinator.name}</span>
                </div>
              </div>

              {/* NIK */}
              <div className="flex items-start gap-2.5">
                <CreditCard className="h-4 w-4 text-gray-placeholder mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-placeholder font-medium block">NIK (Nomor Induk Kependudukan)</span>
                  <span className="text-xs font-semibold text-gray-heading-main font-mono">{coordinator.nik || "-"}</span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-gray-placeholder mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-placeholder font-medium block">Alamat Email</span>
                  <span className="text-xs font-semibold text-gray-heading-main break-all">{coordinator.email}</span>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-gray-placeholder mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-placeholder font-medium block">Nomor HP / WhatsApp</span>
                  <span className="text-xs font-semibold text-gray-heading-main">{coordinator.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
