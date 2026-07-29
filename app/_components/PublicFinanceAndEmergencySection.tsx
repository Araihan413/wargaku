import React from "react";
import { MessageSquare, PhoneCall } from "lucide-react";
import { PublicFinanceSummary, EmergencyContactItem } from "@/db/queries/public-portal";

interface PublicFinanceAndEmergencySectionProps {
  finance: PublicFinanceSummary;
  emergencyContacts: EmergencyContactItem[];
}

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const PublicFinanceAndEmergencySection: React.FC<PublicFinanceAndEmergencySectionProps> = ({
  finance,
  emergencyContacts,
}) => {
  return (
    <section id="transparansi-kas" className="py-12 px-4 sm:px-6 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Transparansi Kas */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Transparansi Kas
            </h2>
            <a
              href="#transparansi-kas"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Lihat Semua
            </a>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ringkasan Kas
            </h3>

            <div className="space-y-3 text-xs font-medium border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between text-slate-600">
                <span>Saldo Awal</span>
                <span className="font-semibold text-slate-900">
                  {formatRupiah(finance.saldoAwal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Pemasukan</span>
                <span className="font-bold text-emerald-600">
                  {formatRupiah(finance.pemasukan)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Pengeluaran</span>
                <span className="font-bold text-rose-600">
                  {formatRupiah(finance.pengeluaran)}
                </span>
              </div>
            </div>

            {/* Saldo Akhir Highlight Box */}
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">Saldo Akhir</span>
              <span className="text-sm font-extrabold text-blue-600 font-mono">
                {formatRupiah(finance.saldoAkhir)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Kontak Darurat (4 Cards Grid) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Kontak Darurat
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {emergencyContacts.map((contact, idx) => {
              const cleanPhone = contact.phone.replace(/[^0-9+]/g, "");
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold text-slate-900 truncate">
                      {contact.name}
                    </h3>
                    <p className="text-xs text-slate-600 font-mono font-medium truncate">
                      {contact.phone}
                    </p>
                  </div>

                  {/* Action Buttons: Chat & Call */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      title="Kirim Pesan WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>

                    <a
                      href={`tel:${cleanPhone}`}
                      className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      title="Panggil Telepon"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
