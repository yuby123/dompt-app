'use client';

import React, { useState, useMemo } from 'react';
import {
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  X,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';

export function ReportsTab() {
  const {
    transactions,
    categories,
    wallets,
    budgetConfig,
    dashboardSummary,
    activeYear,
    activeMonth,
    setActiveDate,
    settings,
    exportToCSV,
    addToast,
  } = useApp();

  const hide = settings.hideBalance;

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const m = String(activeMonth + 1).padStart(2, '0');
    return `${activeYear}-${m}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const lastDay = new Date(activeYear, activeMonth + 1, 0).getDate();
    const m = String(activeMonth + 1).padStart(2, '0');
    return `${activeYear}-${m}-${String(lastDay).padStart(2, '0')}`;
  });
  const [exportWalletId, setExportWalletId] = useState('all');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  const monthObj = new Date(activeYear, activeMonth, 1);
  const monthLabel = monthObj
    .toLocaleString('id-ID', { month: 'long', year: 'numeric' })
    .toUpperCase();

  const handlePrevMonth = () => {
    const d = new Date(activeYear, activeMonth - 1, 1);
    setActiveDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    );
  };

  const handleNextMonth = () => {
    const d = new Date(activeYear, activeMonth + 1, 1);
    setActiveDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    );
  };

  // Monthly metrics calculation
  const {
    monthIncome,
    monthExpense,
    netSavings,
    savingsRatio,
    needsActual,
    wantsActual,
    savingsActual,
    needsTarget,
    wantsTarget,
    savingsTarget,
    topCategories,
    healthScore,
  } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let nSpent = 0;
    let wSpent = 0;
    let sSpent = 0;

    const catGroupMap = new Map(categories.map((c) => [c.id, c.budgetGroup]));
    const catInfoMap = new Map(categories.map((c) => [c.id, c]));
    const catTotals = new Map<string, number>();

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getFullYear() === activeYear && d.getMonth() === activeMonth) {
        if (tx.type === 'income') {
          inc += tx.amount;
        } else if (tx.type === 'expense') {
          exp += tx.amount;
          const grp =
            tx.budgetGroup ||
            (tx.categoryId ? catGroupMap.get(tx.categoryId) : 'kebutuhan');
          if (grp === 'keinginan') wSpent += tx.amount;
          else if (grp === 'tabungan') sSpent += tx.amount;
          else nSpent += tx.amount;

          const cKey = tx.categoryId || 'cat-lainnya';
          catTotals.set(cKey, (catTotals.get(cKey) || 0) + tx.amount);
        } else if (tx.type === 'transfer' && tx.budgetGroup === 'tabungan') {
          sSpent += tx.amount;
        }
      }
    });

    const baseIncome = Math.max(inc, budgetConfig.estimatedIncome || 0);
    const nTarget = Math.round((baseIncome * (budgetConfig.needsPercent || 50)) / 100);
    const wTarget = Math.round((baseIncome * (budgetConfig.wantsPercent || 30)) / 100);
    const sTarget = Math.round((baseIncome * (budgetConfig.savingsPercent || 20)) / 100);

    const net = inc - exp;
    const ratio = inc > 0 ? Math.max(0, Math.round((net / inc) * 100)) : 0;

    const sortedCats = Array.from(catTotals.entries())
      .map(([catId, amount]) => {
        const cat = catInfoMap.get(catId);
        return {
          id: catId,
          name: cat?.name || 'Lainnya',
          emoji: cat?.emoji || '💳',
          amount,
          pct: exp > 0 ? Math.round((amount / exp) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Calculate financial health score (0-100)
    const savingsPts = ratio >= 20 ? 35 : Math.round((ratio / 20) * 35);
    const budgetOk =
      (nTarget === 0 || nSpent <= nTarget) && (wTarget === 0 || wSpent <= wTarget);
    const budgetPts = budgetOk ? 35 : 20;
    const runwayPts = Math.min(
      30,
      Math.round((dashboardSummary.emergencyFundRunwayMonths / 6) * 30)
    );
    const score = Math.min(100, Math.max(45, savingsPts + budgetPts + runwayPts));

    return {
      monthIncome: inc,
      monthExpense: exp,
      netSavings: net,
      savingsRatio: ratio,
      needsActual: nSpent,
      wantsActual: wSpent,
      savingsActual: sSpent,
      needsTarget: nTarget,
      wantsTarget: wTarget,
      savingsTarget: sTarget,
      topCategories: sortedCats,
      healthScore: score,
    };
  }, [
    transactions,
    categories,
    budgetConfig,
    activeYear,
    activeMonth,
    dashboardSummary.emergencyFundRunwayMonths,
  ]);

  const handleDownloadExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (exportFormat === 'csv') {
      exportToCSV();
    } else {
      window.print();
      addToast('Laporan PDF Siap', 'Silakan simpan sebagai PDF melalui dialog cetak.');
    }
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 lg:pt-0 px-1">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Laporan Keuangan
          </h1>
          <p className="text-xs lg:text-sm font-semibold text-gray-400 mt-0.5">
            Evaluasi performa keuangan bulananmu.
          </p>
        </div>

        {/* Month Selector + Export Button (matching desktop demo video at 1:17) */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-[#16181D] border border-gray-100 dark:border-gray-800 rounded-2xl px-3 py-2 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs font-black text-gray-800 dark:text-gray-200 tracking-wider min-w-[110px] text-center">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#14161C] hover:bg-black text-white dark:bg-white dark:text-black font-black text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-transform active:scale-95"
          >
            <Download size={15} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 1. Skor Kesehatan Finansial Card */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Score Circle */}
          <div className="relative w-32 h-32 mx-auto lg:mx-0 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke="#F3F4F6"
                strokeWidth="10"
                className="dark:stroke-gray-800"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke="#84CC16"
                strokeWidth="10"
                strokeDasharray="263.8"
                strokeDashoffset={263.8 - (healthScore / 100) * 263.8}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">
                {healthScore}
              </span>
              <span className="text-[10px] font-bold text-gray-400 mt-1">/ 100</span>
            </div>
          </div>

          {/* Score Details & 3 Sub-cards */}
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                SKOR KESEHATAN FINANSIAL
              </span>
              <h2 className="text-xl font-black text-[#65A30D] dark:text-[#D4F826] mt-0.5 flex items-center gap-1.5">
                <span>{healthScore >= 70 ? 'Sehat 🌟' : 'Cukup Baik 👍'}</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Keuanganmu terkendali dengan baik. Pertahankan konsistensi menabungmu.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50/90 dark:bg-gray-800/50 rounded-2xl p-3.5 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                  <span>Rasio Tabungan</span>
                  <span className="text-[#65A30D] dark:text-[#D4F826] font-black">
                    {savingsRatio >= 20 ? 'Optimal' : 'Perlu Ditingkatkan'}
                  </span>
                </div>
                <div className="text-base font-black text-gray-900 dark:text-white mt-1">
                  {savingsRatio}%
                </div>
                <span className="text-[10px] text-gray-400">Target: minimal 20%</span>
              </div>

              <div className="bg-gray-50/90 dark:bg-gray-800/50 rounded-2xl p-3.5 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                  <span>Kepatuhan Budget</span>
                  <span className="text-[#65A30D] dark:text-[#D4F826] font-black">Aman</span>
                </div>
                <div className="text-base font-black text-gray-900 dark:text-white mt-1">
                  Terkendali
                </div>
                <span className="text-[10px] text-gray-400">Sesuai alokasi 50/30/20</span>
              </div>

              <div className="bg-gray-50/90 dark:bg-gray-800/50 rounded-2xl p-3.5 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                  <span>Dana Darurat</span>
                  <span className="text-amber-500 font-black">Perlu Ditambah</span>
                </div>
                <div className="text-base font-black text-gray-900 dark:text-white mt-1">
                  {dashboardSummary.emergencyFundRunwayMonths} Bulan
                </div>
                <span className="text-[10px] text-gray-400">Ideal: 3 - 6 bulan pengeluaran</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pemasukan & Pengeluaran 2-Column Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">
            <span className="w-6 h-6 rounded-lg bg-[#D4F826]/30 text-[#65A30D] dark:text-[#D4F826] flex items-center justify-center">
              <TrendingUp size={13} />
            </span>
            <span>PEMASUKAN</span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
            {formatRupiah(monthIncome, hide)}
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-[#EEF9B4] text-[#4D7C0F] px-2.5 py-0.5 rounded-lg">
            ↗ 100% vs bulan lalu
          </span>
        </div>

        <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">
            <span className="w-6 h-6 rounded-lg bg-pink-100 dark:bg-pink-950/50 text-pink-500 flex items-center justify-center">
              <TrendingDown size={13} />
            </span>
            <span>PENGELUARAN</span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
            {formatRupiah(monthExpense, hide)}
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 px-2.5 py-0.5 rounded-lg">
            ↘ 100% vs bulan lalu
          </span>
        </div>
      </div>

      {/* 3. Tabungan Bersih (Net Savings) */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
              TABUNGAN BERSIH (NET SAVINGS)
            </span>
            <div className="text-2xl font-black text-[#65A30D] dark:text-[#D4F826] mt-0.5 tabular-nums">
              {formatRupiah(netSavings, hide)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
              RASIO TABUNGAN
            </span>
            <span className="text-lg font-black text-gray-900 dark:text-white">
              {savingsRatio}%
            </span>
          </div>
        </div>
        <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#D4F826] transition-all duration-300"
            style={{ width: `${Math.min(100, savingsRatio)}%` }}
          />
        </div>
      </div>

      {/* 4. Bottom 2-Column Row: Rincian 50/30/20 + Top Pengeluaran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rincian 50/30/20 */}
        <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
            Rincian 50/30/20
          </h3>

          <div className="space-y-4">
            {/* Kebutuhan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500" />
                  Kebutuhan ({budgetConfig.needsPercent}%)
                </span>
                <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
                  {formatRupiah(needsActual, hide)}{' '}
                  <span className="text-gray-400 font-normal">
                    / {formatRupiah(needsTarget, hide)}
                  </span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{
                    width: `${Math.min(100, (needsActual / (needsTarget || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Keinginan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  Keinginan ({budgetConfig.wantsPercent}%)
                </span>
                <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
                  {formatRupiah(wantsActual, hide)}{' '}
                  <span className="text-gray-400 font-normal">
                    / {formatRupiah(wantsTarget, hide)}
                  </span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-pink-500"
                  style={{
                    width: `${Math.min(100, (wantsActual / (wantsTarget || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Tabungan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  Tabungan ({budgetConfig.savingsPercent}%)
                </span>
                <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
                  {formatRupiah(savingsActual, hide)}{' '}
                  <span className="text-gray-400 font-normal">
                    / {formatRupiah(savingsTarget, hide)}
                  </span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-400"
                  style={{
                    width: `${Math.min(100, (savingsActual / (savingsTarget || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Pengeluaran */}
        <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
            Top Pengeluaran
          </h3>

          {topCategories.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">
              Belum ada pengeluaran tercatat di bulan ini.
            </p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((cat, idx) => (
                <div key={cat.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-black text-gray-500 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xl">{cat.emoji}</span>
                    <div>
                      <p className="text-xs font-extrabold text-gray-900 dark:text-white">
                        {cat.name}
                      </p>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {cat.pct}% dari total
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-gray-900 dark:text-white tabular-nums">
                    {formatRupiah(cat.amount, hide)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Export Data (matching video at 1:25) */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Export Data
                </h3>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleDownloadExport} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                      TANGGAL MULAI
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                      TANGGAL SELESAI
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                    DOMPET
                  </label>
                  <select
                    value={exportWalletId}
                    onChange={(e) => setExportWalletId(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white"
                  >
                    <option value="all">Semua Dompet</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                    FORMAT FILE
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setExportFormat('csv')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                        exportFormat === 'csv'
                          ? 'border-[#84CC16] bg-[#EEF9B4]/30 dark:bg-[#D4F826]/10'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-black text-xs text-gray-900 dark:text-white">
                        <FileSpreadsheet size={16} className="text-[#65A30D]" />
                        <span>CSV</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-snug">
                        Cocok untuk Excel / Google Sheets
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportFormat('pdf')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                        exportFormat === 'pdf'
                          ? 'border-[#84CC16] bg-[#EEF9B4]/30 dark:bg-[#D4F826]/10'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-black text-xs text-gray-900 dark:text-white">
                        <FileText size={16} className="text-gray-600 dark:text-gray-300" />
                        <span>PDF</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-snug">
                        Cocok untuk laporan cetak / dibagikan
                      </p>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black font-black text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Download size={15} />
                  <span>Download Laporan</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
