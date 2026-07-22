"use client";

import React from "react";
import { PhoneCall, Phone, MessageSquare, UserCheck } from "lucide-react";

export interface OfficerContact {
  id: string;
  name: string;
  phone: string;
  roleTitle: string;
}

interface WargaEmergencyContactsProps {
  contacts: OfficerContact[];
}

export function WargaEmergencyContacts({ contacts }: WargaEmergencyContactsProps) {
  const formatWaNumber = (phone: string) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    return cleaned;
  };

  return (
    <div className="rounded-3xl border border-gray-border bg-gray-card p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
          <PhoneCall className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-gray-heading-main">Kontak Pengurus RT</h3>
          <p className="text-xs text-gray-secondary-text">Hubungi saat ada keperluan & darurat</p>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-placeholder">
          Belum ada nomor kontak pengurus terdaftar.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {contacts.map((officer) => {
            const waNumber = formatWaNumber(officer.phone);
            const isPhoneValid = officer.phone && officer.phone !== "-";
            return (
              <div
                key={officer.id}
                className="flex flex-col justify-between rounded-2xl border border-gray-border/70 bg-gray-sidebar-hover p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded-md bg-primary-100 dark:bg-primary-950 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {officer.roleTitle}
                    </span>
                    <h4 className="text-sm font-bold text-gray-heading-main mt-1">
                      {officer.name}
                    </h4>
                    <p className="text-xs text-gray-secondary-text mt-0.5">
                      {officer.phone}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-border/50 text-gray-600">
                    <UserCheck className="h-4 w-4" />
                  </div>
                </div>

                {isPhoneValid ? (
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 text-xs font-bold transition-colors shadow-sm"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={`tel:${officer.phone}`}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-border bg-gray-card hover:bg-gray-100 dark:hover:bg-gray-800 p-2 text-gray-700 dark:text-gray-200 transition-colors"
                      title="Telepon Langsung"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-placeholder italic">
                    Nomor belum diset
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
