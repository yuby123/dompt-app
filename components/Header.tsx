'use client';

import React from 'react';
import { BookOpen, Moon, Sun, ArrowLeft } from 'lucide-react';
import { TabType, useApp } from './AppContext';
import { BrandLogo } from './BrandLogo';

const emptySubscribe = () => () => {};

const MAIN_BOTTOM_TABS: TabType[] = ['dashboard', 'wallets', 'transactions', 'settings'];

export function Header() {
  const { settings, setActiveTab, activeTab, setThemeMode } = useApp();

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
  const badgeClass = isOrange
    ? 'bg-[#FF6B00] text-white'
    : isPink
    ? 'bg-[#FFA4A4] text-black'
    : 'bg-[#D4F826] text-black';

  const isTutorialActive = activeTab === 'tutorial';
  const showBackButton = !MAIN_BOTTOM_TABS.includes(activeTab);

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
          className="flex items-center gap-2.5 cursor-pointer group text-left shrink-0"
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

      {/* Right: Dark/Light Mode Toggle & Tutorial Button (No Add Transaction button) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={toggleTheme}
          className="h-9 px-3 rounded-full bg-white dark:bg-[#16181D] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-[#D4F826] flex items-center justify-center gap-1.5 text-xs font-extrabold transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs"
          title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          aria-label="Mode Gelap / Terang"
        >
          {isDarkMode ? (
            <>
              <Sun size={14} strokeWidth={2.4} className="text-amber-400 shrink-0" />
              <span>Terang</span>
            </>
          ) : (
            <>
              <Moon size={14} strokeWidth={2.4} className="text-slate-700 shrink-0" />
              <span>Gelap</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tutorial')}
          className={`h-9 px-3.5 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap border shadow-2xs ${
            isTutorialActive
              ? `${badgeClass} border-transparent`
              : 'bg-white dark:bg-[#16181D] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:border-[#D4F826]'
          }`}
          title="Panduan & Tutorial"
          aria-label="Tutorial"
        >
          <BookOpen size={14} strokeWidth={2.4} className="shrink-0" />
          <span>Tutorial</span>
        </button>
      </div>
    </header>
  );
}

