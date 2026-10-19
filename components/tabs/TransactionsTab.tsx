'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Pencil,
  Trash2,
  Calendar,
  Wallet,
  ArrowRightLeft,
  X,
  Plus,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../AppContext';
import { formatFullDateIndo, formatRelativeDate, formatRupiah, formatTimeOnly } from '@/lib/formatters';
import { TransactionDetail } from '@/lib/types';

export function TransactionsTab() {
  const {
    transactionDetails,
    wallets,
    categories,
    goals,
    settings,
    openAddTransaction,
    openEditTransaction,
    deleteTransaction,
    activeDate,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('tx-1');

  const hide = settings.hideBalance;

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactionDetails.filter((detail) => {
      const { transaction, wallet, category } = detail;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noteMatch = (transaction.note || '').toLowerCase().includes(q);
        const catMatch = (category?.name || '').toLowerCase().includes(q);
        const walletMatch = wallet.name.toLowerCase().includes(q);
        if (!noteMatch && !catMatch && !walletMatch) return false;
      }

      if (selectedWalletId !== 'all' && transaction.walletId !== selectedWalletId) {
        return false;
      }

      if (selectedType !== 'all' && transaction.type !== selectedType) {
        return false;
      }

      if (selectedCategory !== 'all' && transaction.categoryId !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [transactionDetails, searchQuery, selectedWalletId, selectedType, selectedCategory]);

  // Filtered summary totals
  const filteredSummary = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach(({ transaction }) => {
      if (transaction.type === 'income') inc += transaction.amount;
      else if (transaction.type === 'expense') exp += transaction.amount;
    });
    return { income: inc, expense: exp, net: inc - exp };
  }, [filteredTransactions]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { dateKey: string; displayDate: string; items: TransactionDetail[] }[] = [];
    const map = new Map<string, TransactionDetail[]>();

    filteredTransactions.forEach((item) => {
      const d = new Date(item.transaction.date);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(item);
    });

    map.forEach((items, dateKey) => {
      const displayDate = formatRelativeDate(items[0].transaction.date, activeDate);
      groups.push({ dateKey, displayDate, items });
    });

    return groups;
  }, [filteredTransactions, activeDate]);

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 lg:pt-0 px-1">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Transaksi
          </h1>
          <p className="text-xs lg:text-sm font-semibold text-gray-400 mt-0.5">
            Uangmu lari ke mana aja? Pantau dan filter semua riwayatmu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAddTransaction()}
          className="h-10 px-3.5 lg:px-4 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center gap-2 font-black text-xs shadow-xs cursor-pointer transition-transform active:scale-95"
        >
          <Plus size={18} strokeWidth={2.8} />
          <span className="hidden sm:inline">Catat Transaksi</span>
        </button>
      </div>

      {/* Full-Width Black Summary Card */}
      <div className="w-full bg-[#121316] rounded-[28px] lg:rounded-[32px] p-5 lg:px-9 lg:py-6 text-white shadow-xl border border-white/5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                RINGKASAN RIWAYAT TERFILTER
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#D4F826] text-black text-[10px] font-black uppercase">
                {filteredTransactions.length} TRANSAKSI
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums mt-1">
              {filteredSummary.net >= 0 ? '+' : '-'}
              {formatRupiah(Math.abs(filteredSummary.net), hide)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 lg:gap-10 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                TOTAL PEMASUKAN
              </span>
              <span className="text-sm lg:text-lg font-black text-[#D4F826] tabular-nums mt-0.5 block">
                +{formatRupiah(filteredSummary.income, hide)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                TOTAL PENGELUARAN
              </span>
              <span className="text-sm lg:text-lg font-black text-[#FB7185] tabular-nums mt-0.5 block">
                -{formatRupiah(filteredSummary.expense, hide)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter Bar (Stacked on Mobile, Single Horizontal Row on Desktop) */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search Input */}
        <div className="relative lg:flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari catatan..."
            className="w-full pl-10 pr-10 py-3 bg-white dark:bg-[#16181D] border border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4F826] shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Chips Bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0 text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">
          {/* Wallet filter */}
          <select
            value={selectedWalletId}
            onChange={(e) => setSelectedWalletId(e.target.value)}
            className="bg-white dark:bg-[#16181D] border border-gray-100 dark:border-gray-800 rounded-2xl px-3.5 py-3 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-xs focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-white dark:bg-[#16181D] border border-gray-100 dark:border-gray-800 rounded-2xl px-3.5 py-3 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-xs focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Tipe</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="transfer">Transfer</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white dark:bg-[#16181D] border border-gray-100 dark:border-gray-800 rounded-2xl px-3.5 py-3 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-xs focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Subkategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji || ''} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List Grouped by Date */}
      {groupedByDate.length === 0 ? (
        <div className="py-16 text-center space-y-2 bg-white dark:bg-[#16181D] rounded-3xl p-6 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400">Tidak ada transaksi yang cocok</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              {/* Date Header */}
              {(() => {
                const groupExpenseTotal = group.items.reduce((acc, it) => {
                  if (it.transaction.type === 'expense') return acc + it.transaction.amount;
                  return acc;
                }, 0);
                const groupIncomeTotal = group.items.reduce((acc, it) => {
                  if (it.transaction.type === 'income') return acc + it.transaction.amount;
                  return acc;
                }, 0);
                const groupTransferTotal = group.items.reduce((acc, it) => {
                  if (it.transaction.type === 'transfer') return acc + it.transaction.amount;
                  return acc;
                }, 0);

                let totalDisplay = '';
                if (groupExpenseTotal > 0) {
                  totalDisplay = `- ${formatRupiah(groupExpenseTotal, hide)}`;
                } else if (groupIncomeTotal > 0) {
                  totalDisplay = `+ ${formatRupiah(groupIncomeTotal, hide)}`;
                } else if (groupTransferTotal > 0) {
                  totalDisplay = formatRupiah(groupTransferTotal, hide);
                }

                return (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                      {group.displayDate.toUpperCase()}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400 tabular-nums">
                      {totalDisplay}
                    </span>
                  </div>
                );
              })()}

              {/* Transactions in Date Group */}
              <div className="bg-white dark:bg-[#16181D] rounded-3xl p-3 shadow-xs border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                {group.items.map((item) => {
                  const { transaction, wallet, category, transferWallet } = item;
                  const isExpanded = expandedId === transaction.id;
                  const isExpense = transaction.type === 'expense';
                  const isIncome = transaction.type === 'income';
                  const isTransfer = transaction.type === 'transfer';

                  return (
                    <div
                      key={transaction.id}
                      className="py-2.5 px-2 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-2xl cursor-pointer transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : transaction.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Cute Emoji Avatar in soft pink pill background */}
                          <div className="w-10 h-10 rounded-full bg-[#FFE4E8] dark:bg-[#3D1E24] text-xl flex items-center justify-center shrink-0">
                            {category?.emoji || (isTransfer ? '🔄' : '☕')}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                              {transaction.note || category?.name || (isTransfer ? 'Transfer' : 'Transaksi')}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                              <span>🏷️ {category?.name || (isTransfer ? 'Transfer' : 'Lainnya')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-xs font-black tabular-nums ${
                              isExpense
                                ? 'text-gray-900 dark:text-white'
                                : isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {isExpense ? '-' : isIncome ? '+' : ''}
                            {formatRupiah(transaction.amount, hide)}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs space-y-2.5"
                        >
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                            <div>
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">
                                DARI
                              </span>
                              <span className="font-extrabold text-gray-800 dark:text-gray-200">
                                {wallet.name}
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">
                                {isTransfer ? 'KE' : 'KATEGORI'}
                              </span>
                              <span className="font-extrabold text-gray-800 dark:text-gray-200">
                                {isTransfer
                                  ? transferWallet?.name || 'Tujuan'
                                  : `${category?.emoji || ''} ${category?.name || 'Lainnya'}`}
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">
                                WAKTU
                              </span>
                              <span className="font-extrabold text-gray-800 dark:text-gray-200">
                                {formatTimeOnly(transaction.date)}
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">
                                CATATAN
                              </span>
                              <span className="font-extrabold text-gray-800 dark:text-gray-200">
                                {transaction.note || '-'}
                              </span>
                            </div>

                            {isTransfer && (() => {
                              const linkedGoal = goals.find(
                                (g) => g.walletId === transaction.transferWalletId
                              );
                              if (!linkedGoal) return null;
                              return (
                                <div className="col-span-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                                  <span className="text-gray-400 block text-[9px] uppercase font-bold">
                                    TERTAUT KE GOAL
                                  </span>
                                  <span className="font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5">
                                    <span>{linkedGoal.emoji}</span>
                                    <span>{linkedGoal.name}</span>
                                  </span>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTransaction(item);
                              }}
                              className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 hover:bg-gray-200 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Pencil size={12} />
                              <span>UBAH</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTransaction(transaction.id);
                              }}
                              className="flex-1 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-100 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 size={12} />
                              <span>HAPUS</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
