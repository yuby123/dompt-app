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
  Moon,
  Sun,
  BookOpen,
  CalendarClock,
  Activity,
  Megaphone,
  BarChart3,
} from 'lucide-react';
import { TabType, useApp } from './AppContext';
import { BrandLogo } from './BrandLogo';

const emptySubscribe = () => () => {};

export function DesktopSidebar() {
  const {
    activeTab,
    setActiveTab,
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
  const isOrange = settings.accentColor === 'orange';

  const navItems: {
    id: TabType;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutGrid },
    { id: 'wallets', label: 'Dompet', icon: Wallet },
    { id: 'transactions', label: 'Transaksi', icon: ArrowRightLeft },
    { id: 'budget', label: 'Budget', icon: PieChart },
    { id: 'analytics', label: 'Analisis & Skor', icon: BarChart3 },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'assets', label: 'Aset', icon: Landmark },
    { id: 'subscriptions', label: 'Langganan', icon: CalendarClock },
    { id: 'debt', label: 'Utang', icon: CreditCard },
    { id: 'invest', label: 'Investasi', icon: TrendingUp },
    { id: 'ai-advisor', label: 'AI Advisor', icon: Sparkles },
    { id: 'reports', label: 'Laporan', icon: FileText },
    { id: 'tutorial', label: 'Panduan', icon: BookOpen },
    { id: 'settings', label: 'Profil', icon: Settings },
  ];

  const displayName = user?.displayName || settings.userName || 'Trisna';

  return (
    <aside className="hidden lg:flex flex-col w-[264px] shrink-0 h-screen sticky top-0 bg-white dark:bg-[#0B0D14] border-r border-slate-100 dark:border-white/[0.08] px-5 py-6 select-none justify-between z-30">
      {/* Top Section: Brand + Navigation */}
      <div className="space-y-5 flex-1 flex flex-col min-h-0">
        {/* Brand Row + Theme Switcher */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group text-left"
          >
            <BrandLogo
              size="md"
              className="shadow-xs group-hover:scale-105 transition-transform"
            />
            <span className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
              Dompt.
            </span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('tutorial')}
              className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
              title="Info & Panduan"
              aria-label="Info & Panduan"
            >
              <Megaphone size={16} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
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
        </div>

        {/* Navigation Links (without + Catat Transaksi button) */}
        <nav className="flex-1 overflow-y-auto no-scrollbar space-y-1 pr-0.5 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? isOrange
                      ? 'bg-[#FF6B00] text-white font-extrabold shadow-xs shadow-[#FF6B00]/25'
                      : isPink
                      ? 'bg-[#FFA4A4] text-black font-extrabold shadow-xs'
                      : 'bg-[#D4F826] text-black font-extrabold shadow-xs'
                    : 'font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon
                  size={17}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={
                    isActive
                      ? isOrange
                        ? 'text-white shrink-0'
                        : 'text-black shrink-0'
                      : 'text-slate-400 dark:text-slate-500 shrink-0'
                  }
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer border border-slate-200/60 dark:border-white/[0.06] text-left"
        >
          <div
            className={`relative w-9 h-9 rounded-full border ${
              isOrange ? 'border-[#FF6B00]' : isPink ? 'border-[#FFA4A4]' : 'border-[#D4F826]'
            } overflow-hidden bg-slate-900 text-white font-display font-bold flex items-center justify-center shrink-0 text-xs`}
          >
            {user?.photoURL?.startsWith('http') || user?.photoURL?.startsWith('data:') || settings.avatarUrl?.startsWith('http') || settings.avatarUrl?.startsWith('data:') ? (
              <img
                src={user?.photoURL || settings.avatarUrl}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : user?.photoURL || settings.avatarUrl ? (
              <span className="text-base">{user?.photoURL || settings.avatarUrl}</span>
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
