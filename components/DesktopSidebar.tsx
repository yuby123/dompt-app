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
  Megaphone,
  Moon,
  Sun,
  Lock,
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
    settings,
    setThemeMode,
    addToast,
    user,
    openLoginModal,
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

  const handleOpenAnnouncements = () => {
    addToast(
      'Dompt v2.0 Live',
      'Fitur Atur Budget 50/30/20, AI Advisor, dan Laporan Keuangan telah aktif!',
      'info'
    );
  };

  const isPink = settings.accentColor === 'pink';
  const primaryBtnBg = isPink
    ? 'bg-[#FFA4A4] hover:bg-[#ff8e8e] shadow-[#FFA4A4]/25'
    : 'bg-[#D4F826] hover:bg-[#c6ec15] shadow-[#D4F826]/25';

  const activeNavBg = isPink
    ? 'bg-[#FFA4A4] text-black font-extrabold shadow-xs'
    : 'bg-[#D4F826] text-black font-extrabold shadow-xs';

  const navItems: {
    id: TabType;
    label: string;
    icon: React.ElementType;
    hasLock?: boolean;
    onClick: () => void;
  }[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutGrid,
      onClick: () => setActiveTab('dashboard'),
    },
    {
      id: 'wallets',
      label: 'Dompet',
      icon: Wallet,
      onClick: () => setActiveTab('wallets'),
    },
    {
      id: 'transactions',
      label: 'Transaksi',
      icon: ArrowRightLeft,
      onClick: () => setActiveTab('transactions'),
    },
    {
      id: 'budget',
      label: 'Budget',
      icon: PieChart,
      onClick: () => setActiveTab('budget'),
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: Target,
      onClick: () => setActiveTab('goals'),
    },
    {
      id: 'assets',
      label: 'Aset',
      icon: Landmark,
      onClick: () => setActiveTab('assets'),
    },
    {
      id: 'subscriptions',
      label: 'Langganan',
      icon: CalendarClock,
      onClick: () => setActiveTab('subscriptions'),
    },
    {
      id: 'health-score',
      label: 'Skor Sehat',
      icon: Activity,
      onClick: () => setActiveTab('health-score'),
    },
    {
      id: 'debt',
      label: 'Utang',
      icon: CreditCard,
      hasLock: true,
      onClick: () => setActiveTab('debt'),
    },
    {
      id: 'invest',
      label: 'Investasi',
      icon: TrendingUp,
      hasLock: true,
      onClick: () => setActiveTab('invest'),
    },
    {
      id: 'ai-advisor',
      label: 'AI Advisor',
      icon: Sparkles,
      onClick: () => setActiveTab('ai-advisor'),
    },
    {
      id: 'reports',
      label: 'Laporan',
      icon: FileText,
      onClick: () => setActiveTab('reports'),
    },
    {
      id: 'tutorial',
      label: 'Panduan',
      icon: BookOpen,
      onClick: () => setActiveTab('tutorial'),
    },
    {
      id: 'settings',
      label: 'Profil',
      icon: Settings,
      onClick: () => setActiveTab('settings'),
    },
  ];

  const displayName = user?.displayName || settings.userName || 'Trisna';

  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 bg-white dark:bg-[#16181D] border-r border-gray-200/70 dark:border-gray-800/80 px-4 py-5 select-none justify-between z-30">
      {/* Top Section: Brand + Quick Actions + CTA */}
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        {/* Brand Row */}
        <div className="flex items-center justify-between px-1.5">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className={`w-8 h-8 rounded-xl ${isPink ? 'bg-[#FFA4A4]' : 'bg-[#D4F826]'} text-black font-black flex items-center justify-center text-base shadow-xs group-hover:scale-105 transition-all`}>
              D.
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
              Dompt.
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleOpenAnnouncements}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              title="Pengumuman"
            >
              <Megaphone size={16} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDarkMode ? (
                <Sun size={16} strokeWidth={2.2} />
              ) : (
                <Moon size={16} strokeWidth={2.2} />
              )}
            </button>
          </div>
        </div>

        {/* + Catat Transaksi Primary Button */}
        <button
          type="button"
          onClick={() => openAddTransaction()}
          className={`w-full py-3 px-4 rounded-2xl text-black font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer ${primaryBtnBg}`}
        >
          <Plus size={16} strokeWidth={3} />
          <span>Catat Transaksi</span>
        </button>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto no-scrollbar space-y-1 pr-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? activeNavBg
                    : 'font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={
                      isActive
                        ? 'text-black'
                        : 'text-gray-400 dark:text-gray-500'
                    }
                  />
                  <span>{item.label}</span>
                </div>

                {item.hasLock && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black bg-[#14161C] text-white dark:bg-white/10 dark:text-gray-200 px-2 py-0.5 rounded-full">
                    <Lock size={8} strokeWidth={3} />
                    <span>Max</span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80">
        <div
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-gray-50/90 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer border border-gray-100 dark:border-gray-700/50"
        >
          <div className={`relative w-10 h-10 rounded-full border-2 ${isPink ? 'border-[#FFA4A4]' : 'border-[#D4F826]'} overflow-hidden bg-white dark:bg-gray-700 flex items-center justify-center shrink-0 text-lg transition-colors`}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>👩‍💼</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-gray-900 dark:text-white truncate">
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block text-[9px] font-black ${isPink ? 'bg-[#FFA4A4]' : 'bg-[#D4F826]'} text-black px-1.5 py-0.2 rounded-md uppercase transition-colors`}>
                PRO
              </span>
              {user && (
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  • Cloud
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
