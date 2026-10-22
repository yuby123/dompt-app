'use client';

import React from 'react';
import {
  Plus,
  Camera,
  PieChart,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Wallet,
  FileText,
  BookOpen,
} from 'lucide-react';
import { useApp, TabType } from './AppContext';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  const {
    setActiveTab,
    openAddTransaction,
    openScanModal,
    settings,
  } = useApp();

  const isPink = settings.accentColor === 'pink';
  const primaryAccentBg = isPink
    ? 'bg-[#FFA4A4] hover:bg-[#ff8e8e] text-black'
    : 'bg-[#D4F826] hover:bg-[#c6ec15] text-black';

  const navGroups: {
    title: string;
    links: { label: string; tab: TabType }[];
  }[] = [
    {
      title: 'Arus Kas & Operasional',
      links: [
        { label: 'Ikhtisar Harian', tab: 'dashboard' },
        { label: 'Multi-Dompet & Rekening', tab: 'wallets' },
        { label: 'Buku Besar Transaksi', tab: 'transactions' },
        { label: 'Anggaran 50/30/20', tab: 'budget' },
        { label: 'Tagihan & Langganan', tab: 'subscriptions' },
      ],
    },
    {
      title: 'Kekayaan & Perencanaan',
      links: [
        { label: 'Target Tabungan (Goals)', tab: 'goals' },
        { label: 'Portofolio Investasi', tab: 'invest' },
        { label: 'Manajemen Aset Bersih', tab: 'assets' },
        { label: 'Utang & Cicilan Aktif', tab: 'debt' },
        { label: 'Anggaran & Estimasi', tab: 'budget' },
      ],
    },
    {
      title: 'Analitik & Sistem',
      links: [
        { label: 'Analisis & Skor Finansial', tab: 'analytics' },
        { label: 'AI Financial Advisor', tab: 'ai-advisor' },
        { label: 'Laporan & Ekspor CSV', tab: 'reports' },
        { label: 'Panduan & Metodologi', tab: 'tutorial' },
        { label: 'Profil & Keamanan', tab: 'settings' },
      ],
    },
  ];

  return (
    <footer className="mt-12 lg:mt-16 pb-28 lg:pb-8 border-t border-slate-200/80 dark:border-white/[0.08] pt-10 lg:pt-14 text-slate-600 dark:text-slate-400">
      <div className="max-w-[1200px] mx-auto">
        {/* Top Asymmetric Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 pb-10 border-b border-slate-200/70 dark:border-white/[0.07]">
          {/* Left Column (5 cols): Brand Architecture & Quick Actions */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2.5 group"
              >
                <BrandLogo
                  size="sm"
                  className="shadow-2xs group-hover:scale-105 transition-transform"
                />
                <span>Dompt.</span>
              </button>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                Arsitektur keuangan pribadi generasi baru dengan isolasi multi-akun,
                alokasi otomatis 50/30/20, dan rekonsiliasi saldo real-time.
              </p>
            </div>

            {/* Interactive Action Strip */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => openAddTransaction()}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${primaryAccentBg}`}
              >
                <Plus size={14} strokeWidth={2.8} />
                <span>Catat Transaksi</span>
              </button>
              <button
                type="button"
                onClick={openScanModal}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-white dark:bg-[#131520] text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-white/10 hover:border-indigo-500/40 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Camera size={14} />
                <span>Scan Struk AI</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('budget')}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-white dark:bg-[#131520] text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-white/10 hover:border-indigo-500/40 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <PieChart size={14} />
                <span>Atur 50/30/20</span>
              </button>
            </div>
          </div>

          {/* Right Columns (7 cols): 3 Navigation Groups */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-3">
                <h4 className="font-display text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                  {group.title}
                </h4>
                <ul className="space-y-2">
                  {group.links.map((item) => (
                    <li key={item.tab}>
                      <button
                        type="button"
                        onClick={() => setActiveTab(item.tab)}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors inline-flex items-center gap-1 group cursor-pointer whitespace-nowrap"
                      >
                        <span>{item.label}</span>
                        <ArrowUpRight
                          size={11}
                          className="opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 transition-all"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Legal & Encryption Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-indigo-500 dark:text-[#D4F826] shrink-0" />
            <span>
              Ruang finansial terenkripsi · Penyimpanan Cloud & Offline-First mandiri per akun
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('tutorial')}
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              Dokumentasi Sistem
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              Audit & Ekspor Data
            </button>
            <span aria-hidden="true">·</span>
            <span className="whitespace-nowrap">© {new Date().getFullYear()} Dompt.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
