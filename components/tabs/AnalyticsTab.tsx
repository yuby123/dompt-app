'use client';

import React, { useMemo } from 'react';
import {
  Download,
  Calendar,
  Heart,
  TrendingUp,
  TrendingDown,
  Sparkles,
  PieChart,
  BarChart3,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';

export function AnalyticsTab() {
  const {
    totalBalance,
    totalIncome,
    totalExpense,
    transactions,
    categories,
    exportToCSV,
    settings,
    activeYear,
    activeMonth,
  } = useApp();
  const hide = settings.hideBalance;

  const monthLabel = useMemo(() => {
    return new Date(activeYear, activeMonth, 1).toLocaleString('id-ID', { month: 'short', year: 'numeric' });
  }, [activeYear, activeMonth]);

  const { savedAmount, savingsRate, topCategories } = useMemo(() => {
    let saved = 0;
    const catMap = new Map<string, number>();

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getFullYear() === activeYear && d.getMonth() === activeMonth) {
        if (tx.type === 'transfer' || tx.budgetGroup === 'tabungan') {
          saved += tx.amount;
        }
        if (tx.type === 'expense') {
          const key = tx.categoryId || 'cat-lainnya';
          catMap.set(key, (catMap.get(key) || 0) + tx.amount);
        }
      }
    });

    const rate = totalIncome > 0 ? ((saved / totalIncome) * 100).toFixed(1) : '0.0';

    const catInfoMap = new Map(categories.map((c) => [c.id, c]));
    const list = Array.from(catMap.entries())
      .map(([catId, amount]) => {
        const cat = catInfoMap.get(catId);
        const pct = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) + '%' : '0%';
        return {
          name: cat?.name || 'Lainnya',
          emoji: cat?.emoji || '💳',
          amount,
          pct,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    return {
      savedAmount: saved,
      savingsRate: rate,
      topCategories: list.length > 0 ? list : [
        { name: 'Makan', emoji: '🍽️', amount: 0, pct: '0%' },
      ],
    };
  }, [transactions, categories, totalIncome, totalExpense, activeYear, activeMonth]);

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 px-1">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Analisis
          </h1>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">
            Analisa kebiasaan keuanganmu.
          </p>
        </div>
        <button
          type="button"
          onClick={exportToCSV}
          className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 flex items-center justify-center cursor-pointer"
          title="Unduh Laporan"
        >
          <Download size={18} />
        </button>
      </div>

      {/* Month picker pill */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#16181D] border border-gray-100 dark:border-gray-800 w-fit text-xs font-black text-gray-700 dark:text-gray-300 shadow-xs">
        <Calendar size={13} />
        <span>{monthLabel}</span>
      </div>

      {/* 1. Skor Kesehatan Finansial */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-gray-800 text-center space-y-4">
        {/* Circular Gauge */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#E5E7EB"
              strokeWidth="10"
              className="dark:stroke-gray-800"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#2563EB"
              strokeWidth="10"
              strokeDasharray="251.2"
              strokeDashoffset="55"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">
              78
            </span>
            <span className="text-[10px] font-bold text-gray-400 mt-0.5">/ 100</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-gray-900 dark:text-white">
            <Heart size={14} className="text-red-500 fill-red-500" />
            <span>Skor Kesehatan Finansial</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs mx-auto leading-relaxed">
            Skor hitungan berdasarkan tabungan, disiplin budget, dana darurat, dan kesehatan utang.
          </p>
          <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full">
            SEHAT
          </span>
        </div>

        {/* Health Breakdown Bars */}
        <div className="space-y-3 pt-2 text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-bold">Rasio Tabungan</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">25%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: '25%' }} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-bold">Disiplin Anggaran</span>
              <span className="font-extrabold text-violet-600 dark:text-violet-400">100%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-violet-500" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-bold">Keamanan & Runway</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400">100%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400 font-bold">Kesehatan Utang</span>
            <span className="font-extrabold text-[#84CC16]">PAKET MAX</span>
          </div>
        </div>
      </div>

      {/* 2. 4 Metrics Boxes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-[#16181D] text-gray-900 dark:text-white p-4 rounded-3xl space-y-1 shadow-xs border border-gray-100 dark:border-gray-800">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            YANG DITABUNG
          </span>
          <div className="text-base font-black text-emerald-600 dark:text-[#D4F826] tabular-nums">
            {formatRupiah(savedAmount, hide)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#16181D] text-gray-900 dark:text-white p-4 rounded-3xl space-y-1 shadow-xs border border-gray-100 dark:border-gray-800">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            RASIO MENABUNG
          </span>
          <div className="text-base font-black text-emerald-600 dark:text-[#D4F826]">{savingsRate}%</div>
        </div>

        <div className="bg-white dark:bg-[#16181D] p-4 rounded-3xl space-y-1 shadow-xs border border-gray-100 dark:border-gray-800">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            ↗ PEMASUKAN
          </span>
          <div className="text-base font-black text-gray-900 dark:text-white tabular-nums">
            {formatRupiah(totalIncome, hide)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#16181D] p-4 rounded-3xl space-y-1 shadow-xs border border-gray-100 dark:border-gray-800">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            ↘ PENGELUARAN
          </span>
          <div className="text-base font-black text-gray-900 dark:text-white tabular-nums">
            {formatRupiah(totalExpense, hide)}
          </div>
        </div>
      </div>

      {/* 3. Tren Pemasukan vs Pengeluaran */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
          Tren Pemasukan vs Pengeluaran
        </h3>

        <div className="h-44 flex items-end justify-center gap-6 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          {/* Lime bar for income */}
          <div className="flex flex-col items-center gap-1.5 h-full justify-end">
            <span className="text-[9px] font-bold text-gray-400">Rp10JT</span>
            <div className="w-10 rounded-t-xl bg-[#D4F826] h-[90%]" />
            <span className="text-[10px] font-bold text-gray-400">Mar</span>
          </div>

          {/* Dot for expense */}
          <div className="flex flex-col items-center gap-1.5 h-full justify-end">
            <div className="w-3 h-3 rounded-full bg-violet-500 mb-10 shadow-xs" />
            <span className="text-[10px] font-bold text-gray-400">Pengeluaran</span>
          </div>
        </div>
      </div>

      {/* 4. Rincian Pengeluaran Donut */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
          Rincian Pengeluaran
        </h3>

        {/* Circular radial chart */}
        <div className="relative w-44 h-44 mx-auto flex items-center justify-center my-3">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="transparent"
              stroke="#581C87"
              strokeWidth="10"
              strokeDasharray="219.8"
              strokeDashoffset="101"
            />
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="transparent"
              stroke="#F97316"
              strokeWidth="10"
              strokeDasharray="219.8"
              strokeDashoffset="196"
            />
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="transparent"
              stroke="#EC4899"
              strokeWidth="10"
              strokeDasharray="219.8"
              strokeDashoffset="175"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-black text-gray-900 dark:text-white">Total</span>
            <span className="text-[11px] font-extrabold text-gray-400">Rp3.13JT</span>
          </div>
        </div>

        {/* Kategori Teratas list */}
        <div className="space-y-3 pt-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
            KATEGORI TERATAS
          </span>

          {topCategories.map((cat) => (
            <div key={cat.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{cat.emoji}</span>
                <span className="font-extrabold text-gray-900 dark:text-white">{cat.name}</span>
              </div>
              <div className="text-right">
                <span className="font-black text-gray-900 dark:text-white tabular-nums">
                  {formatRupiah(cat.amount, hide)}
                </span>
                <span className="text-[10px] text-gray-400 block">{cat.pct}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Ringkasan Cepat */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Ringkasan Cepat</h3>

        <div className="space-y-2.5 text-xs">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Rata-rata pengeluaran per hari</span>
            <span className="font-black text-gray-900 dark:text-white">Rp101.081/hari</span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Hari terboros</span>
            <span className="font-black text-red-500">02 Mar – Rp675.000</span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Total transaksi bulan ini</span>
            <span className="font-black text-gray-900 dark:text-white">24 transaksi</span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Hari tanpa pengeluaran</span>
            <span className="font-black text-[#84CC16]">9 hari hemat!</span>
          </div>
        </div>
      </div>

      {/* 6. Insight AI */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-[#84CC16]" />
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Insight AI</h3>
          </div>
          <span className="text-[10px] font-bold text-gray-400">Dibuat untuk periode ini</span>
        </div>

        {/* Ringkasan */}
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl space-y-1.5 text-xs">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
            📋 RINGKASAN
          </span>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Kondisi keuangan kamu bulan ini sangat sehat dengan savings rate mencapai 89.1%. Kenaikan income yang signifikan berhasil kamu kelola dengan baik tanpa terjebak lifestyle inflation.
          </p>
        </div>

        {/* vs Periode Sebelumnya */}
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl space-y-2 text-xs">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
            📈 VS PERIODE SEBELUMNYA
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[9px] text-gray-400 block font-bold">PEMASUKAN</span>
              <span className="text-xs font-black text-emerald-600">+92.3%</span>
            </div>
            <div>
              <span className="text-[9px] text-gray-400 block font-bold">PENGELUARAN</span>
              <span className="text-xs font-black text-red-500">-7.0%</span>
            </div>
            <div>
              <span className="text-[9px] text-gray-400 block font-bold">RASIO TABUNGAN</span>
              <span className="text-xs font-black text-blue-500">+31.1%</span>
            </div>
          </div>
        </div>

        {/* Saran */}
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl space-y-2 text-xs">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
            💡 SARAN FINANSIAL
          </span>
          <div className="space-y-1.5 text-gray-700 dark:text-gray-300">
            <p>
              • <strong className="text-gray-900 dark:text-white">Rem Belanja Online:</strong> Budget belanja online kamu tersisa Rp20.000, tahan dulu keranjang checkout-mu.
            </p>
            <p>
              • <strong className="text-gray-900 dark:text-white">Cek Biaya Jajan:</strong> Kamu bisa sisihkan Rp25.000 per hari untuk menambah investasi di akhir bulan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
