"use client";

import React from "react";

export interface GroupedCategoryItem {
  category: string;
  items: { description: string; amount: number }[];
  total: number;
}

export interface OfficialReportData {
  rtName: string;
  rwName: string;
  subdistrictName: string;
  monthName: string;
  previousMonthName: string;
  year: number;
  openingBalance: number;
  groupedIncome: GroupedCategoryItem[];
  groupedExpense: GroupedCategoryItem[];
  totalIncome: number;
  totalExpense: number;
  endingBalance: number;
  ketuaRtName: string;
  bendaharaName: string;
}

interface OfficialFinancialReportPrintProps {
  data: OfficialReportData;
}

const formatRupiah = (val: number) => {
  if (val === 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(val)
    .replace("Rp", "Rp ");
};

export const OfficialFinancialReportPrint: React.FC<OfficialFinancialReportPrintProps> = ({
  data,
}) => {
  return (
    <div className="hidden print:block font-serif text-black leading-relaxed p-0 m-0 w-full">
      {/* Printable Paper Content (A4 standard) */}
      <div className="space-y-6 font-serif text-black leading-relaxed">
        {/* Header Judul Resmi */}
        <div className="text-center font-bold uppercase tracking-wider space-y-1">
          <h1 className="text-xl font-black">LAPORAN KAS</h1>
          <h2 className="text-base font-bold">
            {data.rtName} {data.rwName} KEL. {data.subdistrictName}
          </h2>
          <h3 className="text-sm font-semibold tracking-widest pt-1">
            BULAN : {data.monthName.toUpperCase()} {data.year}
          </h3>
        </div>

        {/* Tabel Akuntansi Kas Utama (5 Kolom Resmi) */}
        <div className="w-full">
          <table className="w-full border-2 border-black text-xs font-serif border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-center font-bold uppercase">
                <th className="border-r border-black py-2.5 px-2 w-10">NO</th>
                <th className="border-r border-black py-2.5 px-3 text-left">URAIAN</th>
                <th className="border-r border-black py-2.5 px-3 w-36 text-right">PEMASUKAN</th>
                <th className="border-r border-black py-2.5 px-3 w-36 text-right">PENGELUARAN</th>
                <th className="py-2.5 px-3 w-36 text-right">SALDO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {/* I. SALDO BULAN LALU */}
              <tr>
                <td className="border-r border-black py-2 px-2 text-center font-bold">I.</td>
                <td className="border-r border-black py-2 px-3 font-bold italic underline">
                  SALDO BULAN : {data.previousMonthName.toUpperCase()} {data.year}
                </td>
                <td className="border-r border-black py-2 px-3"></td>
                <td className="border-r border-black py-2 px-3"></td>
                <td className="py-2 px-3 text-right font-bold">
                  {formatRupiah(data.openingBalance)}
                </td>
              </tr>

              {/* II. PEMASUKAN */}
              <tr>
                <td className="border-r border-black py-2 px-2 text-center font-bold">II.</td>
                <td className="border-r border-black py-2 px-3 font-bold italic underline">
                  PEMASUKAN
                </td>
                <td className="border-r border-black py-2 px-3"></td>
                <td className="border-r border-black py-2 px-3"></td>
                <td className="py-2 px-3"></td>
              </tr>

              {/* Grouped Income Categories */}
              {(Array.isArray(data?.groupedIncome) ? data.groupedIncome : []).length > 0 ? (
                (data?.groupedIncome || []).map((group, groupIdx) => (
                  <React.Fragment key={`inc-group-${groupIdx}`}>
                    {/* Header Kelompok Kategori Pemasukan */}
                    <tr>
                      <td className="border-r border-black py-1.5 px-2"></td>
                      <td className="border-r border-black py-1.5 px-3 pl-6 font-bold">
                        {groupIdx + 1}. Kategori: {group.category}
                      </td>
                      <td className="border-r border-black py-1.5 px-3"></td>
                      <td className="border-r border-black py-1.5 px-3"></td>
                      <td className="py-1.5 px-3"></td>
                    </tr>
                    {/* List Transaksi per Kategori */}
                    {(Array.isArray(group?.items) ? group.items : []).map((item, itemIdx) => (
                      <tr key={`inc-item-${groupIdx}-${itemIdx}`}>
                        <td className="border-r border-black py-1 px-2"></td>
                        <td className="border-r border-black py-1 px-3 pl-10">
                          - {item.description}
                        </td>
                        <td className="border-r border-black py-1 px-3 text-right">
                          {formatRupiah(item.amount)}
                        </td>
                        <td className="border-r border-black py-1 px-3"></td>
                        <td className="py-1 px-3"></td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                /* Default Nilai Kosong Pemasukan */
                <tr>
                  <td className="border-r border-black py-1.5 px-2"></td>
                  <td className="border-r border-black py-1.5 px-3 pl-6 text-slate-400 italic">
                    (Tidak ada transaksi pemasukan pada periode ini)
                  </td>
                  <td className="border-r border-black py-1.5 px-3 text-right">Rp 0</td>
                  <td className="border-r border-black py-1.5 px-3"></td>
                  <td className="py-1.5 px-3"></td>
                </tr>
              )}

              {/* Subtotal Pemasukan */}
              <tr className="border-t border-b border-black font-bold bg-slate-50">
                <td className="border-r border-black py-2 px-2 text-center">B</td>
                <td className="border-r border-black py-2 px-3">TOTAL PENERIMAAN / PEMASUKAN</td>
                <td className="border-r border-black py-2 px-3"></td>
                <td className="border-r border-black py-2 px-3 text-right">
                  {formatRupiah(data.totalIncome)}
                </td>
                <td className="py-2 px-3"></td>
              </tr>

              {/* Separator Section Pengeluaran */}
              <tr className="border-b border-black font-bold">
                <td className="border-r border-black py-2 px-2 text-center">III</td>
                <td className="border-r border-black py-2 px-3 uppercase">PENGELUARAN</td>
                <td className="border-r border-black py-2 px-3"></td>
                <td className="border-r border-black py-2 px-3"></td>
                <td className="py-2 px-3"></td>
              </tr>

              {/* Grouped Expense Categories */}
              {(Array.isArray(data?.groupedExpense) ? data.groupedExpense : []).length > 0 ? (
                (data?.groupedExpense || []).map((group, groupIdx) => (
                  <React.Fragment key={`exp-group-${groupIdx}`}>
                    {/* Header Kelompok Kategori Pengeluaran */}
                    <tr>
                      <td className="border-r border-black py-1.5 px-2"></td>
                      <td className="border-r border-black py-1.5 px-3 pl-6 font-bold">
                        {groupIdx + 1}. Kategori: {group.category}
                      </td>
                      <td className="border-r border-black py-1.5 px-3"></td>
                      <td className="border-r border-black py-1.5 px-3"></td>
                      <td className="py-1.5 px-3"></td>
                    </tr>
                    {/* List Transaksi per Kategori */}
                    {(Array.isArray(group?.items) ? group.items : []).map((item, itemIdx) => (
                      <tr key={`exp-item-${groupIdx}-${itemIdx}`}>
                        <td className="border-r border-black py-1 px-2"></td>
                        <td className="border-r border-black py-1 px-3 pl-10">
                          - {item.description}
                        </td>
                        <td className="border-r border-black py-1 px-3"></td>
                        <td className="border-r border-black py-1 px-3 text-right">
                          {formatRupiah(item.amount)}
                        </td>
                        <td className="py-1 px-3"></td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                /* Default Nilai Kosong Pengeluaran */
                <tr>
                  <td className="border-r border-black py-2 px-2"></td>
                  <td className="border-r border-black py-2 px-3 pl-6 italic text-gray-600">
                    - Tidak ada transaksi pengeluaran pada periode ini
                  </td>
                  <td className="border-r border-black py-2 px-3"></td>
                  <td className="border-r border-black py-2 px-3 text-right">Rp 0</td>
                  <td className="py-2 px-3"></td>
                </tr>
              )}

              {/* Jumlah Pengeluaran */}
              <tr className="font-bold italic">
                <td className="border-r border-black py-2 px-2"></td>
                <td className="border-r border-black py-2 px-3 pl-6">
                  Jumlah Pengeluaran
                </td>
                <td className="border-r border-black py-2 px-3"></td>
                <td className="border-r border-black py-2 px-3"></td>
                <td className="py-2 px-3 text-right font-bold border-t border-black">
                  {formatRupiah(data.totalExpense)}
                </td>
              </tr>

              {/* JUMLAH KAS (SALDO AKHIR) */}
              <tr className="font-bold border-t-2 border-black">
                <td className="border-r border-black py-2.5 px-2"></td>
                <td className="border-r border-black py-2.5 px-3 uppercase">
                  JUMLAH KAS (SALDO AKHIR)
                </td>
                <td className="border-r border-black py-2.5 px-3"></td>
                <td className="border-r border-black py-2.5 px-3"></td>
                <td className="py-2.5 px-3 text-right font-extrabold text-sm">
                  {formatRupiah(data.endingBalance)}
                </td>
              </tr>

              {/* SALDO AKHIR + BANK */}
              <tr className="font-bold border-t border-black">
                <td className="border-r border-black py-2.5 px-2"></td>
                <td className="border-r border-black py-2.5 px-3 uppercase">
                  SALDO AKHIR + BANK
                </td>
                <td className="border-r border-black py-2.5 px-3"></td>
                <td className="border-r border-black py-2.5 px-3"></td>
                <td className="py-2.5 px-3 text-right font-extrabold text-sm">
                  {formatRupiah(data.endingBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Lembar Pengesahan Tanda Tangan */}
        <div className="pt-8 grid grid-cols-2 text-center text-xs font-serif leading-relaxed">
          {/* Sisi Kiri: Ketua RT */}
          <div className="space-y-16">
            <div>
              <p className="font-semibold">Mengetahui</p>
              <p className="font-bold uppercase mt-1">
                {data.rtName} {data.rwName}
              </p>
              <p className="font-bold uppercase">KETUA</p>
            </div>
            <div>
              <p className="font-bold underline uppercase tracking-wider">
                {data.ketuaRtName || "____________________"}
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Bendahara */}
          <div className="space-y-16">
            <div>
              <p className="font-semibold">&nbsp;</p>
              <p className="font-bold uppercase mt-1">&nbsp;</p>
              <p className="font-bold uppercase">BENDAHARA</p>
            </div>
            <div>
              <p className="font-bold underline uppercase tracking-wider">
                {data.bendaharaName || "____________________"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
