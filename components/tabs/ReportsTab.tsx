'use client';

import React from 'react';
import { FileText, Download, Calendar, CheckCircle2 } from 'lucide-react';
import { useApp } from '../AppContext';

export function ReportsTab() {
  const { exportToCSV, addToast } = useApp();

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="pt-2 px-1">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Laporan Keuangan
        </h1>
        <p className="text-xs font-semibold text-gray-400 mt-0.5">
          Ekspor catatan dan evaluasi keuangan berkala.
        </p>
      </div>

      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D4F826]/30 text-black flex items-center justify-center font-bold">
            <FileText size={22} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              Laporan Bulanan (Maret 2026)
            </h3>
            <p className="text-xs text-gray-400">Termasuk 24 transaksi, rincian dompet & anggaran.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={exportToCSV}
          className="w-full py-3.5 bg-[#D4F826] hover:bg-[#c6ec15] text-black font-black text-xs rounded-2xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download size={16} />
          <span>Unduh File CSV (Excel)</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Jadwal Ekspor Otomatis</h3>
        <p className="text-xs text-gray-400">
          Data tersimpan secara privat di perangkat Anda dan bisa dibackup kapan saja secara offline.
        </p>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 pt-1">
          <CheckCircle2 size={16} />
          <span>Status Backup: Siap & Terverifikasi</span>
        </div>
      </div>
    </div>
  );
}
