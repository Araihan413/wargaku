"use client";

import React from "react";
import { Plus, Trash2, PhoneCall, AlertCircle } from "lucide-react";
import { EmergencyContactItem } from "../types";

interface EmergencyContactFormSectionProps {
  contacts: EmergencyContactItem[];
  onChange: (contacts: EmergencyContactItem[]) => void;
}

export function EmergencyContactFormSection({
  contacts = [],
  onChange,
}: EmergencyContactFormSectionProps) {
  const safeContacts = Array.isArray(contacts) ? contacts : [];

  const handleAddContact = () => {
    const newContact: EmergencyContactItem = {
      id: Date.now().toString(),
      name: "",
      phone: "",
      subtitle: "",
    };
    onChange([...safeContacts, newContact]);
  };

  const handleRemoveContact = (index: number) => {
    const updated = safeContacts.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdateContact = (
    index: number,
    field: keyof EmergencyContactItem,
    value: string
  ) => {
    const updated = [...safeContacts];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-divider pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-heading-main">
              Kontak Darurat Warga
            </h3>
          </div>
          <p className="text-xs text-gray-secondary-text mt-1">
            Kelola daftar nomor telepon darurat yang dapat dihubungi oleh warga di halaman utama portal publik.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddContact}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-900 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Kontak Darurat
        </button>
      </div>

      {safeContacts.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 text-center space-y-2">
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-amber-900">
            Belum Ada Kontak Darurat
          </h4>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Daftar kontak darurat belum diatur. Di portal publik akan muncul pemberitahuan bahwa kontak belum dikonfigurasi. Klik tombol <strong>&quot;Tambah Kontak Darurat&quot;</strong> di atas untuk menambahkan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {safeContacts.map((contact, index) => (
            <div
              key={contact.id || index}
              className="p-4 rounded-xl border border-gray-border bg-white space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Kontak #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveContact(index)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Kontak"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Nama Kontak */}
                <div>
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Nama Kontak <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => handleUpdateContact(index, "name", e.target.value)}
                    placeholder="Contoh: Pos Ronda RT 04"
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Nomor Telepon */}
                <div>
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Nomor Telepon <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={contact.phone}
                    onChange={(e) => handleUpdateContact(index, "phone", e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Subjudul / Keterangan */}
                <div>
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Keterangan / Subjudul
                  </label>
                  <input
                    type="text"
                    value={contact.subtitle || ""}
                    onChange={(e) => handleUpdateContact(index, "subtitle", e.target.value)}
                    placeholder="Contoh: Keamanan 24 Jam"
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
