'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { TabType, useApp } from './AppContext';

export function Header() {
  const { settings, setActiveTab, activeTab, openAddTransaction } = useApp();

  const isPink = settings.accentColor === 'pink';
  const isOrange = settings.accentColor === 'orange';
  const primaryBtnClass = isOrange
    ? 'bg-[#FF6B00] hover:bg-[#ea5e00] text-white shadow-[#FF6B00]/25'
    : isPink
    ? 'bg-[#FFA4A4] hover:bg-[#ff8e8e] text-black'
    : 'bg-[#D4F826] hover:bg-[#cbf11e] text-black';

  const topNavLinks: { id: TabType; label: string }[] = [
    { id: 'dashboard', label: 'Ikhtisar' },
    { id: 'wallets', label: 'Dompet' },
    { id: 'transactions', label: 'Transaksi' },
    { id: 'budget', label: 'Anggaran' },
    { id: 'reports', label: 'Laporan' },
  ];

  return (
    <header className="lg:hidden sticky top-0 z-30 backdrop-blur-xl bg-[#F6F7FB]/85 dark:bg-[#08090F]/85 border-b border-slate-200/80 dark:border-white/[0.08] px-3 sm:px-6 py-3.5 mb-4 flex items-center justify-between gap-8">
      {/* Zone 1: Single text element wordmark */}
      <button
        type="button"
        onClick={() => setActiveTab('dashboard')}
        className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
      >
        Dompt.
      </button>

      {/* Zone 2: 5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {topNavLinks.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              type="button"
              onClick={() => setActiveTab(link.id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                isActive
                  ? 'text-slate-900 dark:text-white border-indigo-600 dark:border-[#D4F826] font-bold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={() => openAddTransaction()}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer whitespace-nowrap shrink-0 ${primaryBtnClass}`}
        >
          <Plus size={14} strokeWidth={2.8} />
          <span>Catat Transaksi</span>
        </button>
      </div>
    </header>
  );
}
