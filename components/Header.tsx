'use client';

import React from 'react';
import { BookOpen, Megaphone, Moon, Sun } from 'lucide-react';
import { useApp } from './AppContext';

const emptySubscribe = () => () => {};

export function Header() {
  const { settings, setThemeMode, setActiveTab, activeTab, addToast } = useApp();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDarkMode = mounted
    ? settings.themeMode === 'dark' ||
      (settings.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    : settings.themeMode === 'dark';

  const toggleTheme = () => {
    const nextMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  const handleOpenAnnouncements = () => {
    addToast(
      'Dompt v2.0 Live',
      'Fitur Atur Budget 50/30/20, AI Advisor, dan Goals telah aktif!',
      'info'
    );
  };

  return (
    <header className="px-3 pt-4 pb-2 flex items-center justify-between">
      {/* Brand Logo */}
      <div
        onClick={() => setActiveTab('dashboard')}
        className="flex items-center gap-2 cursor-pointer select-none group"
      >
        <div className="w-8 h-8 rounded-xl bg-[#D4F826] text-black font-black flex items-center justify-center text-base shadow-xs group-hover:scale-105 transition-transform">
          D.
        </div>
        <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
          Dompt.
        </span>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-1">
        {/* Tutorial Button */}
        <button
          type="button"
          onClick={() => setActiveTab('tutorial')}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'tutorial'
              ? 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
          }`}
          title="Panduan & Tutorial"
          aria-label="Panduan & Tutorial"
        >
          <BookOpen size={20} strokeWidth={2.2} />
        </button>

        {/* Megaphone / Announcement Button */}
        <button
          type="button"
          onClick={handleOpenAnnouncements}
          className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-xl transition-colors cursor-pointer"
          title="Pengumuman & Tips"
          aria-label="Pengumuman & Tips"
        >
          <Megaphone size={20} strokeWidth={2.2} />
        </button>

        {/* Dark / Light Mode Switch */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-xl transition-colors cursor-pointer"
          title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          aria-label="Ganti Tema"
        >
          {isDarkMode ? <Sun size={20} strokeWidth={2.2} /> : <Moon size={20} strokeWidth={2.2} />}
        </button>
      </div>
    </header>
  );
}
