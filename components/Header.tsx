'use client';

import React from 'react';
import { BookOpen, Moon, Sun, ArrowLeft, ShieldCheck, Bug } from 'lucide-react';
import { TabType, useApp } from './AppContext';
import { BrandLogo } from './BrandLogo';

const emptySubscribe = () => () => {};

const MAIN_BOTTOM_TABS: TabType[] = ['dashboard', 'wallets', 'transactions', 'settings'];

export function Header() {
  const { settings, setActiveTab, activeTab, setThemeMode, isAdmin, managedUsers } = useApp();

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
    setThemeMode(isDarkMode ? 'light' : 'dark');
  };

  const isPink = settings.accentColor === 'pink';
  const isOrange = settings.accentColor === 'orange';
  const isPlum = settings.accentColor === 'plum';
  const badgeClass = isPlum
    ? 'bg-[#71325A] text-white'
    : isOrange
    ? 'bg-[#FF6B00] text-white'
    : isPink
    ? 'bg-[#FFA4A4] text-black'
    : 'bg-[#D4F826] text-black';

  const isTutorialActive = activeTab === 'tutorial';
  const isAdminActive = activeTab === 'admin';
  const isFeedbackActive = activeTab === 'feedback';
  const showBackButton = !MAIN_BOTTOM_TABS.includes(activeTab);
  const pendingCount = managedUsers.filter((u) => u.status === 'pending').length;

  return (
    <header className="lg:hidden sticky top-0 z-30 -mx-3 sm:-mx-4 px-4 sm:px-5 h-15 mb-2 backdrop-blur-xl bg-[#F6F7FB]/95 dark:bg-[#08090F]/95 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-2">
      {/* Left: Brand Logo (and Back to Home when inside a sub-menu) */}
      <div className="flex items-center gap-2 min-w-0">
        {showBackButton && (
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="w-9 h-9 rounded-full bg-white dark:bg-[#16181D] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95 transition-all cursor-pointer shrink-0 shadow-2xs"
            title="Kembali ke Dashboard"
            aria-label="Kembali ke Dashboard"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 cursor-pointer group text-left shrink-0"
        >
          <BrandLogo
            size="sm"
            className="shadow-2xs group-hover:scale-105 transition-transform"
          />
          <span className="font-display text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none whitespace-nowrap">
            Dompt.
          </span>
        </button>
      </div>

      {/* Right: Role Action Button (Admin or Lapor Bug), Theme Toggle, Tutorial */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isAdmin ? (
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`h-9 px-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap border shadow-2xs ${
              isAdminActive
                ? `${badgeClass} border-transparent`
                : 'bg-white dark:bg-[#16181D] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:border-[#D4F826]'
            }`}
            title="Dashboard Admin"
          >
            <ShieldCheck size={14} strokeWidth={2.4} className="shrink-0" />
            <span>Admin</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-mono text-[10px] font-black tabular-nums">
                {pendingCount}
              </span>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`h-9 px-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap border shadow-2xs ${
              isFeedbackActive
                ? `${badgeClass} border-transparent`
                : 'bg-white dark:bg-[#16181D] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:border-[#D4F826]'
            }`}
            title="Masukan & Laporkan Bug"
          >
            <Bug size={14} strokeWidth={2.4} className="shrink-0" />
            <span>Lapor Bug</span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full bg-white dark:bg-[#16181D] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-[#D4F826] flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs"
          title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          aria-label="Mode Gelap / Terang"
        >
          {isDarkMode ? (
            <Sun size={15} strokeWidth={2.4} className="text-amber-400 shrink-0" />
          ) : (
            <Moon size={15} strokeWidth={2.4} className="text-slate-700 shrink-0" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tutorial')}
          className={`h-9 px-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer whitespace-nowrap border shadow-2xs ${
            isTutorialActive
              ? `${badgeClass} border-transparent`
              : 'bg-white dark:bg-[#16181D] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:border-[#D4F826]'
          }`}
          title="Panduan & Tutorial"
          aria-label="Tutorial"
        >
          <BookOpen size={14} strokeWidth={2.4} className="shrink-0" />
          <span className="hidden sm:inline">Tutorial</span>
        </button>
      </div>
    </header>
  );
}

