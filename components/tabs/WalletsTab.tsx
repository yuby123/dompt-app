'use client';

import React, { useState } from 'react';
import {
  Plus,
  Landmark,
  Smartphone,
  Banknote,
  TrendingUp,
  CreditCard,
  Clock,
  CheckCircle2,
  Pencil,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';
import { WalletWithBalance } from '@/lib/types';

export function WalletsTab() {
  const {
    walletsWithBalance,
    totalBalance,
    settings,
    openAddWallet,
    openEditWallet,
    deleteWallet,
    verifyWalletBalance,
  } = useApp();

  const [expandedWalletId, setExpandedWalletId] = useState<string | null>('wallet-bca');
  const hide = settings.hideBalance;

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return Landmark;
      case 'ewallet':
        return Smartphone;
      case 'cash':
        return Banknote;
      case 'investment':
        return TrendingUp;
      case 'credit':
        return CreditCard;
      case 'paylater':
        return Clock;
      default:
        return Landmark;
    }
  };

  const getWalletTypeLabel = (type: string) => {
    switch (type) {
      case 'bank':
        return 'BANK';
      case 'ewallet':
        return 'E-WALLET';
      case 'cash':
        return 'TUNAI';
      case 'investment':
        return 'INVESTASI';
      case 'credit':
        return 'KARTU KREDIT';
      case 'paylater':
        return 'PAYLATER';
      default:
        return 'LAINNYA';
    }
  };

  // Earmarked goals for BCA and Mandiri
  const reservedBreakdownBCA = [
    { name: 'Dana Darurat', amount: 14500000, emoji: '🚨' },
  ];

  const reservedBreakdownMandiri = [
    { name: 'Jalan ke Jogja', amount: 150000, emoji: '🌲' },
    { name: 'Kado Mama', amount: 300000, emoji: '👱' },
    { name: 'Sepeda Adik', amount: 50000, emoji: '🚲' },
    { name: 'Emas 5gr', amount: 2000000, emoji: '🥇' },
  ];

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 px-1">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Dompet
          </h1>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">
            Atur semua sumber uangmu.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddWallet}
          className="w-10 h-10 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center font-bold shadow-xs cursor-pointer"
          title="Tambah Dompet"
        >
          <Plus size={20} strokeWidth={2.6} />
        </button>
      </div>

      {/* Saldo & Tabungan Total Banner */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#D4F826]/30 text-black dark:text-[#D4F826] flex items-center justify-center font-bold">
            ⚡
          </div>
          <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
            SALDO & TABUNGAN
          </span>
        </div>
        <span className="text-base sm:text-lg font-black text-[#84CC16] dark:text-[#D4F826] tabular-nums">
          {formatRupiah(totalBalance, hide)}
        </span>
      </div>

      {/* Wallet Cards List */}
      <div className="space-y-3">
        {walletsWithBalance.map((w: WalletWithBalance) => {
          const Icon = getWalletIcon(w.type);
          const isExpanded = expandedWalletId === w.id;
          const isNegative = w.balance < 0;

          const breakdown =
            w.id === 'wallet-bca'
              ? reservedBreakdownBCA
              : w.id === 'wallet-mandiri'
              ? reservedBreakdownMandiri
              : [];

          return (
            <div
              key={w.id}
              className={`bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border transition-all cursor-pointer ${
                isExpanded
                  ? 'border-[#D4F826] ring-1 ring-[#D4F826]'
                  : 'border-gray-100 dark:border-gray-800'
              }`}
              onClick={() => setExpandedWalletId(isExpanded ? null : w.id)}
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: w.color || '#2563EB' }}
                  >
                    <Icon size={20} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                      {w.name}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400">
                      {getWalletTypeLabel(w.type)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-base font-black tabular-nums ${
                      isNegative
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {formatRupiah(w.balance, hide)}
                  </span>
                </div>
              </div>

              {/* Expandable Section */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs space-y-3.5"
                >
                  {/* Verification Banner */}
                  <div className="bg-[#D4F826]/15 dark:bg-[#D4F826]/10 border border-[#D4F826]/40 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-[#65A30D] dark:text-[#D4F826] uppercase tracking-wider block">
                        VERIFIKASI HARI INI
                      </span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Saldo terverifikasi & akurat
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        verifyWalletBalance(w.id);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-[#D4F826] text-black rounded-xl hover:bg-[#c6ec15] flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 size={12} />
                      <span>Verifikasi</span>
                    </button>
                  </div>

                  {/* Account Number */}
                  {w.accountNumber && (
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        NOMOR REKENING
                      </span>
                      <span className="text-sm font-extrabold text-gray-800 dark:text-gray-200 mt-0.5 block">
                        {w.accountNumber}
                      </span>
                    </div>
                  )}

                  {/* Dicadangkan / Reserved Breakdown */}
                  {breakdown.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                        <span>DICADANGKAN</span>
                        <span className="text-gray-700 dark:text-gray-300 tabular-nums">
                          {formatRupiah(w.reservedAmount || 0, hide)}
                        </span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-3 space-y-2">
                        {breakdown.map((item) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5 font-medium">
                              <span>{item.emoji}</span>
                              <span>{item.name}</span>
                            </span>
                            <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
                              {formatRupiah(item.amount, hide)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tersedia */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                      TERSEDIA
                    </span>
                    <span className="text-base font-black text-[#84CC16] dark:text-[#D4F826] tabular-nums">
                      {formatRupiah(w.availableBalance, hide)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditWallet(w);
                      }}
                      className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Pencil size={13} />
                      <span>Ubah</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWallet(w.id);
                      }}
                      className="flex-1 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
