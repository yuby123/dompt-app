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
    goals,
    settings,
    openAddWallet,
    openEditWallet,
    deleteWallet,
    verifyWalletBalance,
  } = useApp();

  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(
    () => walletsWithBalance[0]?.id || null
  );
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

  const totalAvailable = walletsWithBalance
    .filter((w) => w.type !== 'credit' && w.type !== 'paylater' && w.availableBalance > 0)
    .reduce((acc, w) => acc + w.availableBalance, 0);

  const totalReserved = walletsWithBalance.reduce((acc, w) => acc + (w.reservedAmount || 0), 0);

  const totalCreditLiability = walletsWithBalance
    .filter((w) => (w.type === 'credit' || w.type === 'paylater') && w.balance < 0)
    .reduce((acc, w) => acc + Math.abs(w.balance), 0);

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 lg:pt-0 px-1">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Dompet
          </h1>
          <p className="text-xs lg:text-sm font-semibold text-gray-400 mt-0.5">
            Atur semua sumber uang, rekening bank, e-wallet, dan kartu kreditmu.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddWallet}
          className="h-10 px-3.5 lg:px-4 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center gap-2 font-black text-xs shadow-xs cursor-pointer transition-transform active:scale-95"
          title="Tambah Dompet"
        >
          <Plus size={18} strokeWidth={2.8} />
          <span className="hidden sm:inline">Tambah Dompet</span>
        </button>
      </div>

      {/* Full-Width Black Hero Card (Consistent across pages) */}
      <div className="w-full bg-[#121316] rounded-[28px] lg:rounded-[32px] p-5 lg:px-9 lg:py-7 text-white shadow-xl border border-white/5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left: Total Saldo & Tabungan */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                TOTAL SALDO & TABUNGAN BERSIH
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#D4F826] text-black text-[10px] font-black uppercase">
                {walletsWithBalance.length} DOMPET
              </span>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight tabular-nums leading-none">
              {formatRupiah(totalBalance, hide)}
            </div>
            <p className="text-xs text-gray-400 font-semibold">
              Klik salah satu kartu dompet di bawah untuk verifikasi saldo atau melihat rincian dana cadangan.
            </p>
          </div>

          {/* Right: 3 Summary Metrics */}
          <div className="grid grid-cols-3 gap-3 lg:gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                SIAP PAKAI
              </span>
              <span className="text-sm lg:text-lg font-black text-[#D4F826] tabular-nums mt-0.5 block">
                {formatRupiah(totalAvailable, hide)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                DICADANGKAN
              </span>
              <span className="text-sm lg:text-lg font-black text-white tabular-nums mt-0.5 block">
                {formatRupiah(totalReserved, hide)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                TAGIHAN KREDIT
              </span>
              <span className="text-sm lg:text-lg font-black text-[#FB7185] tabular-nums mt-0.5 block">
                {formatRupiah(totalCreditLiability, hide)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Cards List: Single Column on Mobile (<lg), 3-Column Grid on Desktop (lg+) */}
      <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:items-start">
        {walletsWithBalance.map((w: WalletWithBalance) => {
          const Icon = getWalletIcon(w.type);
          const isExpanded = expandedWalletId === w.id;
          const isNegative = w.balance < 0;

          const breakdown = goals
            .filter((g) => g.walletId === w.id && g.currentAmount > 0)
            .map((g) => ({
              name: g.name,
              amount: g.currentAmount,
              emoji: g.emoji || '🎯',
            }));

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
