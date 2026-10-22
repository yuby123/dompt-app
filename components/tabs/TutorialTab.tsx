'use client';

import React, { useState } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Lightbulb,
  ArrowUpRight,
  Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TUTORIAL_ARTICLES, TutorialArticle } from '@/lib/constants';
import { TabType, useApp } from '../AppContext';

export function TutorialTab() {
  const {
    settings,
    wallets,
    budgetConfig,
    transactions,
    goals,
    setActiveTab,
    openAddTransaction,
    openScanModal,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [activeArticle, setActiveArticle] = useState<TutorialArticle | null>(null);

  const categories = [
    'Semua',
    'Memulai',
    'Home',
    'Dompet',
    'Budget',
    'AI & Transaksi',
    'Kekayaan',
    'Akun',
  ];

  const hasWalletBalance = wallets.some((w) => w.initialBalance !== 0);
  const hasBudgetIncome = (budgetConfig?.estimatedIncome || 0) > 0;
  const hasTransaction = transactions.length > 0;
  const hasGoal = goals.length > 0;

  const quickStartSteps = [
    {
      id: 'qs-wallet',
      step: '1',
      title: 'Isi Saldo Awal Dompet',
      desc: 'Sesuaikan saldo rekening bank, e-wallet, atau uang tunai Anda.',
      done: hasWalletBalance,
      actionLabel: 'Buka Dompet',
      onClick: () => setActiveTab('wallets'),
    },
    {
      id: 'qs-budget',
      step: '2',
      title: 'Atur Estimasi Pemasukan & Siklus Gajian',
      desc: 'Tetapkan penghasilan bulanan, tanggal gajian, dan alokasi 50/30/20.',
      done: hasBudgetIncome,
      actionLabel: 'Atur Budget',
      onClick: () => setActiveTab('budget'),
    },
    {
      id: 'qs-tx',
      step: '3',
      title: 'Catat Transaksi Pertama',
      desc: 'Catat pengeluaran/pemasukan manual atau lewat Scan Struk AI.',
      done: hasTransaction,
      actionLabel: 'Catat Transaksi',
      onClick: () => openAddTransaction(),
    },
    {
      id: 'qs-goal',
      step: '4',
      title: 'Buat Target Tabungan (Goals)',
      desc: 'Sisihkan Dana Darurat atau target impian agar tercatat di Dicadangkan.',
      done: hasGoal,
      actionLabel: 'Buat Goal',
      onClick: () => setActiveTab('goals'),
    },
  ];

  const completedStepsCount = quickStartSteps.filter((s) => s.done).length;
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(completedStepsCount < 4);

  const filtered = TUTORIAL_ARTICLES.filter((item) => {
    if (selectedCategory !== 'Semua' && item.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        (item.steps && item.steps.some((s) => s.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const handleNavigateToFeature = (targetTab?: string) => {
    setActiveArticle(null);
    if (!targetTab) return;
    if (targetTab === 'scanner') {
      openScanModal();
      return;
    }
    setActiveTab(targetTab as TabType);
  };

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="pt-2 lg:pt-0 px-1 flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Panduan & Tutorial
          </h1>
          <p className="text-xs lg:text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
            Pelajari cara kerja seluruh fitur terbaru dari pengaturan awal, proteksi dompet, hingga analisis skor AI.
          </p>
        </div>
      </div>

      {/* Interactive Quick Start Checklist (Full-Width Dark Hero Card) */}
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] text-white rounded-[28px] lg:rounded-[32px] p-5 lg:px-8 lg:py-6 shadow-xl border border-white/10 space-y-4">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#8B5CF6]/20 blur-3xl pointer-events-none transition-colors duration-500" />
        <div
          className={`absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            settings.accentColor === 'orange'
              ? 'bg-[#FF6B2B]/15'
              : settings.accentColor === 'pink'
              ? 'bg-[#FFA4A4]/15'
              : 'bg-[#D4F826]/15'
          }`}
        />
        <button
          type="button"
          onClick={() => setIsChecklistExpanded((prev) => !prev)}
          className="relative z-10 w-full flex items-center justify-between gap-2 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-[#D4F826] shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-[#D4F826]">
              CHECKLIST PEMULA ({completedStepsCount}/4 SELESAI)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-[#D4F826] tabular-nums">
              {Math.round((completedStepsCount / 4) * 100)}%
            </span>
            <span className="text-[11px] font-bold text-gray-300 bg-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <span>{isChecklistExpanded ? 'Sembunyikan' : 'Lihat Langkah'}</span>
              {isChecklistExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </span>
          </div>
        </button>

        <div className="relative z-10 w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#D4F826] transition-all duration-300"
            style={{ width: `${(completedStepsCount / 4) * 100}%` }}
          />
        </div>

        <AnimatePresence initial={false}>
          {isChecklistExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="relative z-10 space-y-2.5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3 pt-1">
                {quickStartSteps.map((qs) => (
                  <div
                    key={qs.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                      qs.done
                        ? 'bg-white/[0.04] border-emerald-500/30'
                        : 'bg-white/[0.04] border-white/10 hover:border-[#D4F826]/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {qs.done ? (
                        <CheckCircle2 size={16} className="text-[#D4F826] shrink-0 mt-0.5" />
                      ) : (
                        <Circle size={16} className="text-gray-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-extrabold ${
                            qs.done ? 'text-gray-300 line-through' : 'text-white'
                          }`}
                        >
                          {qs.step}. {qs.title}
                        </p>
                        <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{qs.desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={qs.onClick}
                      className="px-3 py-1.5 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-[10px] font-black shrink-0 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
                    >
                      {qs.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative lg:flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari panduan fitur (misal: Dicadangkan, Anti-Minus, Skor, Cicilan, Budget)..."
            className="w-full pl-10 pr-9 py-3 bg-white dark:bg-[#16181D] border border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4F826] shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0 text-xs font-bold shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#D4F826] text-black font-black shadow-xs'
                  : 'bg-white dark:bg-[#16181D] text-gray-500 hover:text-black dark:hover:text-white border border-gray-100 dark:border-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="text-[11px] font-bold text-gray-400 px-1 flex items-center justify-between">
        <span>
          {selectedCategory} · {filtered.length} panduan fitur
        </span>
        <span>Klik kartu untuk membaca panduan</span>
      </div>

      {/* Article Cards */}
      <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4">
        {filtered.map((art) => (
          <div
            key={art.id}
            onClick={() => setActiveArticle(art)}
            className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-2.5 hover:border-[#D4F826] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-gray-400 tabular-nums">
                    {art.number}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">· {art.category}</span>
                </div>
                {art.badge && (
                  <span
                    className={`text-[9px] font-black px-2.5 py-0.5 rounded-lg tracking-wider uppercase ${
                      art.badge.includes('START') || art.badge.includes('BARU')
                        ? 'bg-[#D4F826] text-black'
                        : art.badge.includes('DIPERBARUI')
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : art.badge.includes('ESSENTIAL') || art.badge.includes('AI')
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {art.badge}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#D4F826] transition-colors">
                  {art.title}
                </h3>
                <ChevronRight
                  size={16}
                  className="text-gray-400 group-hover:translate-x-0.5 transition-transform shrink-0"
                />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {art.summary}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Article Reader Modal */}
      <AnimatePresence>
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[88vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-[#D4F826] text-black px-2.5 py-0.5 rounded-lg uppercase">
                    {activeArticle.badge || 'PANDUAN'}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400">
                    {activeArticle.category}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <span className="text-xs font-black text-gray-400">
                  Panduan #{activeArticle.number}
                </span>
                <h2 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                  {activeArticle.title}
                </h2>
              </div>

              {/* Step by step list if available */}
              {activeArticle.steps && activeArticle.steps.length > 0 && (
                <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    LANGKAH PENGGUNAAN:
                  </span>
                  <div className="space-y-2.5">
                    {activeArticle.steps.map((stepText, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        <span className="w-5 h-5 rounded-full bg-[#D4F826] text-black font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                          {idx + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                          {stepText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line bg-gray-50/70 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                {activeArticle.content}
              </div>

              {activeArticle.tips && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 flex items-start gap-2.5">
                  <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed font-semibold">
                    <span className="font-black">Tips: </span>
                    {activeArticle.tips}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {activeArticle.targetTab && (
                  <button
                    type="button"
                    onClick={() => handleNavigateToFeature(activeArticle.targetTab)}
                    className="flex-1 py-3 px-4 bg-[#D4F826] hover:bg-[#c6ec15] text-black font-black text-xs rounded-2xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>{activeArticle.targetLabel || 'Buka Fitur Ini'}</span>
                    <ArrowUpRight size={15} strokeWidth={2.5} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-extrabold text-xs rounded-2xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
