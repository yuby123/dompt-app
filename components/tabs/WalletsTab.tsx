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
    .filter((w) => w.type !== 'credit' && w.type !== 'paylater')
    .reduce((acc, w) => acc + w.availableBalance, 0);

  const totalReserved = walletsWithBalance.reduce((acc, w) => acc + (w.reservedAmount || 0), 0);

  const totalCreditLiability = walletsWithBalance
    .filter((w) => (w.type === 'credit' || w.type === 'paylater') && w.balance < 0)
    .reduce((acc, w) => acc + Math.abs(w.balance), 0);

  return (
    <div className="space-y-5 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 lg:pt-0 px-1">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Arsitektur Multi-Dompet
          </h1>
          <p className="text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola seluruh sumber likuiditas, rekening bank, e-wallet, dan dana cadangan.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddWallet}
          className="h-10 px-4 rounded-full bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center gap-2 font-bold text-xs shadow-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap shrink-0"
          title="Tambah Dompet"
        >
          <Plus size={16} strokeWidth={2.8} />
          <span>Tambah Dompet</span>
        </button>
      </div>

      {/* Bespoke Deep Indigo & Obsidian Hero Card */}
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-[28px] lg:rounded-[32px] p-6 lg:px-9 lg:py-8 text-white border border-white/10 space-y-5">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#8B5CF6]/20 blur-3xl pointer-events-none transition-colors duration-500" />
        <div
          className={`absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            settings.accentColor === 'orange'
              ? 'bg-[#FF6B2B]/15'
              : settings.accentColor === 'pink'
              ? 'bg-[#FFA4A4]/15'
              : 'bg-[#D4F826]/15'
          }`}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Total Saldo & Tabungan */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="text-[#D4F826] font-semibold">Total Kekayaan Likuid</span>
              <span aria-hidden="true">·</span>
              <span>{walletsWithBalance.length} Dompet Aktif</span>
            </div>
            <div className="font-display font-mono-num text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-none">
              {formatRupiah(totalBalance, hide)}
            </div>
            <p className="text-xs text-slate-300/90 max-w-lg">
              Klik kartu dompet di bawah untuk memverifikasi saldo aktual atau melihat rincian mutasi.
            </p>
          </div>

          {/* Right: 3 Summary Metrics */}
          <div className="grid grid-cols-3 gap-4 lg:gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">
                Siap Pakai
              </span>
              <span className="font-mono-num text-sm lg:text-lg font-bold text-[#D4F826] mt-1 block">
                {formatRupiah(totalAvailable, hide)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">
                Dicadangkan
              </span>
              <span className="font-mono-num text-sm lg:text-lg font-bold text-white mt-1 block">
                {formatRupiah(totalReserved, hide)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">
                Tagihan Kredit
              </span>
              <span className="font-mono-num text-sm lg:text-lg font-bold text-[#FF6B2B] mt-1 block">
                {formatRupiah(totalCreditLiability, hide)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Cards List: Single Column on Mobile (<lg), 3-Column Grid on Desktop (lg+) */}
      <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:items-start">
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
              className={`bg-white dark:bg-[#11131E] rounded-[28px] p-5 border transition-all cursor-pointer ${
                isExpanded
                  ? 'border-[#D4F826] ring-1 ring-[#D4F826]'
                  : 'border-slate-200/80 dark:border-white/[0.08] hover:border-indigo-500/40'
              }`}
              onClick={() => setExpandedWalletId(isExpanded ? null : w.id)}
            >
              {/* Header row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                    style={{ backgroundColor: w.color || '#312E81' }}
                  >
                    <Icon size={20} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                      {w.name}
                    </h3>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {getWalletTypeLabel(w.type)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-mono-num text-base font-bold block ${
                      isNegative
                        ? 'text-rose-500 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {formatRupiah(w.balance, hide)}
                  </span>
                  {w.expenseThisMonth > 0 && (
                    <span className="font-mono-num text-[11px] font-semibold text-[#FF6B2B] block mt-0.5">
                      Keluar: -{formatRupiah(w.expenseThisMonth, hide)}
                    </span>
                  )}
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

                  {/* Rincian Saldo Awal & Mutasi Transaksi */}
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">Saldo Awal</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums">
                        {formatRupiah(w.initialBalance, hide)}
                      </span>
                    </div>
                    {w.incomeThisMonth > 0 && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500 dark:text-gray-400 font-semibold">Pemasukan Bulan Ini</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatRupiah(w.incomeThisMonth, hide)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">
                        Pengeluaran Bulan Ini ({w.transactionCount} transaksi)
                      </span>
                      <span className="font-bold text-rose-500 tabular-nums">
                        -{formatRupiah(w.expenseThisMonth, hide)}
                      </span>
                    </div>
                  </div>

                  {/* Tersedia */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                      TERSEDIA
                    </span>
                    <span
                      className={`text-base font-black tabular-nums ${
                        w.availableBalance < 0
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-[#84CC16] dark:text-[#D4F826]'
                      }`}
                    >
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
