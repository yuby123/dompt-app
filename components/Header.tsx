'use client';

import React from 'react';
import { BookOpen, LogIn, Megaphone, Moon, Sun } from 'lucide-react';
import { useApp } from './AppContext';

const emptySubscribe = () => () => {};

export function Header() {
  const { settings, setThemeMode, setActiveTab, activeTab, addToast, user, openLoginModal } = useApp();
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

  const isPink = settings.accentColor === 'pink';
  const accentBg = isPink ? 'bg-[#FFA4A4]' : 'bg-[#D4F826]';
  const accentBtn = isPink ? 'bg-[#FFA4A4] hover:bg-[#ff8e8e]' : 'bg-[#D4F826] hover:bg-[#cbf11e]';

  return (
    <header className="px-3 pt-4 pb-2 flex items-center justify-between lg:hidden">
      {/* Brand Logo */}
      <div
        onClick={() => setActiveTab('dashboard')}
        className="flex items-center gap-2 cursor-pointer select-none group"
      >
        <div className={`w-8 h-8 rounded-xl ${accentBg} text-black font-black flex items-center justify-center text-base shadow-xs group-hover:scale-105 transition-all`}>
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

        {/* User Profile / Login Button */}
        {user ? (
          <button
            type="button"
            onClick={openLoginModal}
            className="flex items-center gap-1.5 p-1 pl-1.5 pr-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200/60 dark:border-gray-700/60 text-xs font-bold"
            title={`Akun: ${user.displayName || user.email}`}
          >
            <div className={`relative w-6 h-6 rounded-full overflow-hidden ${accentBg} text-black font-black flex items-center justify-center text-[11px] transition-colors`}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (user.displayName || user.email || 'U')[0].toUpperCase()
              )}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
            </div>
            <span className="max-w-[70px] truncate hidden sm:inline text-gray-800 dark:text-gray-200">
              {user.displayName?.split(' ')[0] || 'Saya'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={openLoginModal}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl ${accentBtn} text-black font-black text-xs transition-transform active:scale-95 shadow-xs cursor-pointer ml-1`}
            title="Masuk dengan Akun Pribadi"
          >
            <LogIn size={14} strokeWidth={2.5} />
            <span>Masuk</span>
          </button>
        )}
      </div>
    </header>
  );
}
