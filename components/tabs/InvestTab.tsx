'use client';

import React from 'react';
import { TrendingUp, Plus, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';

export function InvestTab() {
  const { settings, addToast } = useApp();
  const hide = settings.hideBalance;

  const investments = [
    { name: 'RDN BCA (IHSG Index)', type: 'Saham', amount: 500000, profit: '+12.4%' },
    { name: 'Emas Antam (Tabungan Emas)', type: 'Komoditas', amount: 2000000, profit: '+8.2%' },
    { name: 'Bibit Reksadana Obligasi', type: 'Reksadana', amount: 1500000, profit: '+6.1%' },
  ];

  const totalInvested = investments.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 px-1">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Investasi
          </h1>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">
            Biarkan uang bekerja untuk masa depanmu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => addToast('Tambah Portofolio', 'Portofolio baru siap dicatat.')}
          className="w-10 h-10 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center font-bold shadow-xs cursor-pointer"
        >
          <Plus size={20} strokeWidth={2.6} />
        </button>
      </div>

      {/* Hero Card */}
      <div className="bg-[#14161C] text-white p-5 rounded-3xl shadow-xl space-y-2 border border-white/5">
        <span className="text-[10px] font-black text-[#D4F826] uppercase tracking-wider block">
          TOTAL PORTOFOLIO
        </span>
        <div className="text-3xl font-black tabular-nums text-white">
          {formatRupiah(totalInvested, hide)}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold pt-1">
          <ArrowUpRight size={15} />
          <span>Rata-rata return: +8.9% (Aman)</span>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {investments.map((inv) => (
          <div
            key={inv.name}
            className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 flex items-center justify-between"
          >
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{inv.name}</h3>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mt-0.5">
                {inv.type}
              </span>
              <div className="text-sm font-black text-gray-900 dark:text-white mt-1 tabular-nums">
                {formatRupiah(inv.amount, hide)}
              </div>
            </div>

            <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full">
              {inv.profit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
