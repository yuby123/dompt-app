'use client';

import React from 'react';
import {
  LayoutGrid,
  Wallet,
  ArrowRightLeft,
  PieChart,
  Target,
  Landmark,
  CreditCard,
  TrendingUp,
  Sparkles,
  FileText,
  Settings,
  Plus,
  Camera,
  Moon,
  Sun,
  BookOpen,
  CalendarClock,
  Activity,
} from 'lucide-react';
import { TabType, useApp } from './AppContext';

const emptySubscribe = () => () => {};

export function DesktopSidebar() {
  const {
    activeTab,
    setActiveTab,
    openAddTransaction,
    openScanModal,
    settings,
    setThemeMode,
    user,
  } = useApp();

  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDarkMode = mounted
    ? settings.themeMode === 'dark' ||
      (settings.themeMode === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    : settings.themeMode === 'dark';

  const toggleTheme = () => {
    const nextMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  const isPink = settings.accentColor === 'pink';
  const primaryBtnBg = isPink
    ? 'bg-[#FFA4A4] hover:bg-[#ff8e8e] text-black'
    : 'bg-[#D4F826] hover:bg-[#c6ec15] text-black';

  const navSections: {
    heading: string;
    items: {
      id: TabType;
      label: string;
      icon: React.ElementType;
    }[];
  }[] = [
    {
      heading: 'Arus Kas Utama',
      items: [
        { id: 'dashboard', label: 'Ikhtisar', icon: LayoutGrid },
        { id: 'wallets', label: 'Dompet & Akun', icon: Wallet },
        { id: 'transactions', label: 'Transaksi', icon: ArrowRightLeft },
        { id: 'budget', label: 'Anggaran 50/30/20', icon: PieChart },
        { id: 'subscriptions', label: 'Tagihan Rutin', icon: CalendarClock },
      ],
    },
    {
      heading: 'Portofolio & Kekayaan',
      items: [
        { id: 'goals', label: 'Target Tabungan', icon: Target },
        { id: 'assets', label: 'Aset Bersih', icon: Landmark },
        { id: 'debt', label: 'Utang & Cicilan', icon: CreditCard },
        { id: 'invest', label: 'Investasi', icon: TrendingUp },
      ],
    },
    {
      heading: 'Analitik & Sistem',
      items: [
        { id: 'health-score', label: 'Skor Finansial', icon: Activity },
        { id: 'ai-advisor', label: 'AI Advisor', icon: Sparkles },
        { id: 'reports', label: 'Laporan & CSV', icon: FileText },
        { id: 'tutorial', label: 'Panduan Sistem', icon: BookOpen },
        { id: 'settings', label: 'Pengaturan', icon: Settings },
      ],
    },
  ];

  const displayName = user?.displayName || settings.userName || 'Trisna';

  return (
    <aside className="hidden lg:flex flex-col w-[264px] shrink-0 h-screen sticky top-0 bg-white/90 dark:bg-[#0B0D14]/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/[0.08] px-4 py-5 select-none justify-between z-30">
      {/* Top Section: Brand + Primary Actions + Navigation */}
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        {/* Brand Row + Theme Switcher */}
        <div className="flex items-center justify-between px-2">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group text-left"
          >
            <div
              className={`w-8 h-8 rounded-xl ${
                isPink ? 'bg-[#FFA4A4]' : 'bg-[#D4F826]'
              } text-black font-display font-extrabold flex items-center justify-center text-base shadow-xs group-hover:scale-105 transition-transform`}
            >
              D.
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
              Dompt.
            </span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            aria-label="Ganti Tema"
          >
            {isDarkMode ? (
              <Sun size={16} strokeWidth={2.2} />
            ) : (
              <Moon size={16} strokeWidth={2.2} />
            )}
          </button>
        </div>

        {/* Action Pair: + Catat Transaksi & Scan Struk */}
        <div className="grid grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => openAddTransaction()}
            className={`col-span-4 py-2.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0 ${primaryBtnBg}`}
          >
            <Plus size={15} strokeWidth={2.8} />
            <span>Catat Transaksi</span>
          </button>
          <button
            type="button"
            onClick={() => openScanModal()}
            className="col-span-1 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title="Scan Struk Otomatis"
            aria-label="Scan Struk Otomatis"
          >
            <Camera size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="flex-1 overflow-y-auto no-scrollbar space-y-5 pr-0.5 pt-1">
          {navSections.map((section) => (
            <div key={section.heading} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-tight">
                {section.heading}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? isPink
                            ? 'bg-[#FFA4A4] text-black font-bold shadow-2xs'
                            : 'bg-[#D4F826] text-black font-bold shadow-2xs'
                          : 'font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={16}
                          strokeWidth={isActive ? 2.4 : 2}
                          className={
                            isActive
                              ? 'text-black shrink-0'
                              : 'text-slate-400 dark:text-slate-500 shrink-0'
                          }
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom User Card (Clean unboxed metadata) */}
      <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer border border-slate-200/60 dark:border-white/[0.06] text-left"
        >
          <div
            className={`relative w-9 h-9 rounded-full border ${
              isPink ? 'border-[#FFA4A4]' : 'border-[#D4F826]'
            } overflow-hidden bg-slate-900 text-white font-display font-bold flex items-center justify-center shrink-0 text-xs`}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{displayName.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Ruang Pribadi · {user ? 'Cloud Sync' : 'Lokal'}
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
}
