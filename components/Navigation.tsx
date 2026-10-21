'use client';

import React from 'react';
import { LayoutGrid, Wallet, Plus, ArrowRightLeft, User } from 'lucide-react';
import { TabType, useApp } from './AppContext';

export function Navigation() {
  const { activeTab, setActiveTab, openAddTransaction, settings } = useApp();

  const isPink = settings.accentColor === 'pink';
  const isOrange = settings.accentColor === 'orange';
  const activeBg = isOrange
    ? 'bg-[#FF6B00] text-white shadow-xs font-bold scale-105 shadow-[#FF6B00]/30'
    : isPink
    ? 'bg-[#FFA4A4] text-black shadow-xs font-bold scale-105'
    : 'bg-[#D4F826] text-black shadow-xs font-bold scale-105';
  const centerBtnBg = isOrange
    ? 'bg-[#FF6B00] hover:bg-[#ea5e00] text-white shadow-[#FF6B00]/40'
    : isPink
    ? 'bg-[#FFA4A4] hover:bg-[#ff8e8e] text-black shadow-[#FFA4A4]/40'
    : 'bg-[#D4F826] hover:bg-[#c6ec15] text-black shadow-[#D4F826]/30';

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-4 pt-1 px-4 pointer-events-none transition-all lg:hidden">
      <div className="w-full max-w-md mx-auto pointer-events-auto">
        <div className="bg-white/95 dark:bg-[#16181D]/95 backdrop-blur-xl rounded-full p-2 shadow-2xl border border-gray-200/80 dark:border-gray-800/80 flex items-center justify-between px-3">
          {/* 1. Dashboard Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? activeBg
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
            title="Dashboard"
            aria-label="Dashboard"
          >
            <LayoutGrid size={22} strokeWidth={2.4} />
          </button>

          {/* 2. Wallets Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('wallets')}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'wallets'
                ? activeBg
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
            title="Dompet & Rekening"
            aria-label="Dompet"
          >
            <Wallet size={22} strokeWidth={2.4} />
          </button>

          {/* 3. Center Quick Add Button (+) */}
          <div className="px-1 shrink-0">
            <button
              type="button"
              onClick={() => openAddTransaction()}
              className={`w-13 h-13 rounded-full active:scale-95 text-black flex items-center justify-center shadow-lg transition-all cursor-pointer border-2 border-white dark:border-[#16181D] ${centerBtnBg}`}
              title="Catat Transaksi Baru"
              aria-label="Tambah Transaksi"
            >
              <Plus size={26} strokeWidth={3} />
            </button>
          </div>

          {/* 4. Transactions Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? activeBg
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
            title="Riwayat Transaksi"
            aria-label="Transaksi"
          >
            <ArrowRightLeft size={22} strokeWidth={2.4} />
          </button>

          {/* 5. Settings Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'settings'
                ? activeBg
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
            title="Pengaturan & Profil"
            aria-label="Pengaturan"
          >
            <User size={22} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </nav>
  );
}
