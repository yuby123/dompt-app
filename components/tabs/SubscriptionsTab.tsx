'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  Trash2,
  X,
  Play,
  Pause,
  ArrowUpRight,
  RefreshCw,
  Pencil,
  Link2,
  ShieldCheck,
  RotateCcw,
  Search,
  Clock,
  AlertCircle,
  Wallet as WalletIcon,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { EmojiPickerModal } from '../EmojiPickerModal';
import { formatRupiah, formatNominalInput, parseNominalInput } from '@/lib/formatters';
import { BudgetGroup, RecurringItem } from '@/lib/types';
import { getMonthlySubscriptionAmount, isDateInBudgetPeriod } from '@/lib/budgetUtils';
import { WalletBrandLogo, detectWalletBrand } from '../WalletBrandLogo';

export type { RecurringItem };

function parseLocalMidnight(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.slice(0, 10);
  const parts = clean.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }
  const fallback = new Date(dateStr);
  if (isNaN(fallback.getTime())) return null;
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

export function SubscriptionsTab() {
  const {
    wallets,
    walletsWithBalance,
    categories,
    transactions,
    deleteTransaction,
    budgetConfig,
    dashboardSummary,
    subscriptions: items,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionActive,
    recordSubscriptionPayment,
    syncSubscriptionsToBudget,
    updateBudgetConfig,
    updateBudgetSubcategory,
    setActiveTab,
    settings,
    addToast,
    activeYear,
    activeMonth,
    activeDay,
    budgetPeriod,
  } = useApp();

  const hide = settings.hideBalance;
  const currentPeriodKey = budgetPeriod.periodKey;
  const todayIso = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}-${String(activeDay).padStart(2, '0')}`;

  const liquidWallets = useMemo(
    () => walletsWithBalance.filter((w) => w.type !== 'credit' && w.type !== 'paylater'),
    [walletsWithBalance]
  );

  // Compute day difference to billingDay within the active budget period (handles cross-month periods)
  const getDaysUntilBilling = React.useCallback(
    (billingDay: number): number => {
      const refMidday = new Date(activeYear, activeMonth, activeDay, 12, 0, 0);
      const maxDayThisMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
      const clampedThisMonth = Math.min(billingDay, maxDayThisMonth);
      let targetDate = new Date(activeYear, activeMonth, clampedThisMonth, 12, 0, 0);

      if (
        budgetPeriod.isCustomPayday &&
        billingDay < budgetPeriod.startDay &&
        activeMonth === budgetPeriod.startMonth
      ) {
        const nextMonthMax = new Date(
          budgetPeriod.endYear,
          budgetPeriod.endMonth + 1,
          0
        ).getDate();
        targetDate = new Date(
          budgetPeriod.endYear,
          budgetPeriod.endMonth,
          Math.min(billingDay, nextMonthMax),
          12,
          0,
          0
        );
      } else if (
        budgetPeriod.isCustomPayday &&
        billingDay >= budgetPeriod.startDay &&
        activeMonth !== budgetPeriod.startMonth
      ) {
        const startMonthMax = new Date(
          budgetPeriod.startYear,
          budgetPeriod.startMonth + 1,
          0
        ).getDate();
        targetDate = new Date(
          budgetPeriod.startYear,
          budgetPeriod.startMonth,
          Math.min(billingDay, startMonthMax),
          12,
          0,
          0
        );
      }

      return Math.round((targetDate.getTime() - refMidday.getTime()) / (1000 * 60 * 60 * 24));
    },
    [activeYear, activeMonth, activeDay, budgetPeriod]
  );

  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Payment confirmation modal state
  const [payingItem, setPayingItem] = useState<RecurringItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payWalletId, setPayWalletId] = useState('');
  const [payDate, setPayDate] = useState(todayIso);
  const [payNote, setPayNote] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎬');
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'weekly'>('monthly');
  const [billingDay, setBillingDay] = useState('1');
  const [walletId, setWalletId] = useState(
    () => liquidWallets[0]?.id || wallets[0]?.id || ''
  );
  const [categoryId, setCategoryId] = useState('cat-tagihan');
  const [budgetGroup, setBudgetGroup] = useState<BudgetGroup>('kebutuhan');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [resetRecordedThisMonth, setResetRecordedThisMonth] = useState(false);

  const quickPresets = [
    {
      name: 'Netflix',
      emoji: '🎬',
      type: 'expense' as const,
      cat: 'cat-hiburan',
      group: 'keinginan' as BudgetGroup,
      day: '5',
    },
    {
      name: 'Spotify',
      emoji: '🎵',
      type: 'expense' as const,
      cat: 'cat-hiburan',
      group: 'keinginan' as BudgetGroup,
      day: '10',
    },
    {
      name: 'WiFi & Internet',
      emoji: '🛜',
      type: 'expense' as const,
      cat: 'cat-tagihan',
      group: 'kebutuhan' as BudgetGroup,
      day: '20',
    },
    {
      name: 'Listrik PLN',
      emoji: '⚡',
      type: 'expense' as const,
      cat: 'cat-listrik',
      group: 'kebutuhan' as BudgetGroup,
      day: '15',
    },
    {
      name: 'Sewa Kost / KPR',
      emoji: '🏠',
      type: 'expense' as const,
      cat: 'cat-tagihan',
      group: 'kebutuhan' as BudgetGroup,
      day: '1',
    },
    {
      name: 'BPJS Kesehatan',
      emoji: '🏥',
      type: 'expense' as const,
      cat: 'cat-bpjs',
      group: 'kebutuhan' as BudgetGroup,
      day: '10',
    },
    {
      name: 'Gaji Bulanan',
      emoji: '💰',
      type: 'income' as const,
      cat: 'cat-gaji',
      group: 'kebutuhan' as BudgetGroup,
      day: '25',
    },
  ];

  // Map each subscription to its linked BudgetSubcategory & actual transactions spent/received in the active period
  const itemBudgetStatusMap = useMemo(() => {
    const map: Record<
      string,
      {
        linkedSub?: { id: string; name: string; group: BudgetGroup; allocatedAmount: number };
        spentThisMonth: number;
        paidViaTx: boolean;
        matchedTxIds: string[];
      }
    > = {};

    const periodTxs = transactions.filter((tx) => {
      const d = parseLocalMidnight(tx.date);
      return d ? isDateInBudgetPeriod(d, budgetPeriod) : false;
    });

    items.forEach((item) => {
      const itemNameLower = item.name.toLowerCase().trim();
      const linkedSub =
        item.type === 'expense'
          ? (item.subcategoryId &&
              budgetConfig?.subcategories?.find((s) => s.id === item.subcategoryId)) ||
            budgetConfig?.subcategories?.find(
              (s) =>
                s.subscriptionId === item.id ||
                s.name.toLowerCase().trim() === itemNameLower ||
                itemNameLower.includes(s.name.toLowerCase().trim()) ||
                s.name.toLowerCase().trim().includes(itemNameLower)
            )
          : undefined;

      let totalMatchedAmount = 0;
      const matchedTxIds: string[] = [];

      periodTxs.forEach((tx) => {
        if (tx.type !== item.type) return;
        const cleanNote = (tx.note || '')
          .toLowerCase()
          .replace(/\(otomatis rutin\)|\(rutin\)|\(langganan\)|\(bulanan\)/gi, '')
          .trim();
        const rawNote = (tx.note || '').toLowerCase().trim();

        const matchesItemName =
          itemNameLower.length >= 2 &&
          (cleanNote === itemNameLower ||
            rawNote.includes(itemNameLower) ||
            (cleanNote.length >= 3 && itemNameLower.includes(cleanNote)));

        const matchesSubName =
          linkedSub &&
          linkedSub.name.trim().length >= 2 &&
          (cleanNote === linkedSub.name.toLowerCase().trim() ||
            rawNote.includes(linkedSub.name.toLowerCase().trim()));

        if (matchesItemName || matchesSubName) {
          totalMatchedAmount += tx.amount;
          matchedTxIds.push(tx.id);
        }
      });

      map[item.id] = {
        linkedSub: linkedSub
          ? {
              id: linkedSub.id,
              name: linkedSub.name,
              group: linkedSub.group,
              allocatedAmount: linkedSub.allocatedAmount,
            }
          : undefined,
        spentThisMonth: totalMatchedAmount,
        paidViaTx: totalMatchedAmount >= item.amount * 0.9 && item.amount > 0,
        matchedTxIds,
      };
    });

    return map;
  }, [items, budgetConfig.subcategories, transactions, budgetPeriod]);

  // Helper to check if an item is recorded in the current budget period
  const isItemRecordedThisPeriod = React.useCallback(
    (item: RecurringItem): boolean => {
      const status = itemBudgetStatusMap[item.id];
      return item.lastRecordedPeriod === currentPeriodKey || Boolean(status?.paidViaTx);
    },
    [itemBudgetStatusMap, currentPeriodKey]
  );

  // Cancel / Undo a recorded subscription payment in the current period
  const handleCancelRecordedPayment = (item: RecurringItem) => {
    const status = itemBudgetStatusMap[item.id];
    const txIds = status?.matchedTxIds || [];

    // Delete matched transactions from current period so wallet balance is refunded
    if (txIds.length > 0) {
      txIds.forEach((txId) => deleteTransaction(txId));
    }

    // Clear lastRecordedPeriod on the subscription
    updateSubscription(item.id, { lastRecordedPeriod: undefined });

    // Also clear lastRecordedPeriod on linked subcategory if present
    if (status?.linkedSub) {
      updateBudgetSubcategory(status.linkedSub.id, {});
    }

    addToast(
      'Pencatatan Dibatalkan',
      txIds.length > 0
        ? `Pembayaran ${item.name} dibatalkan & saldo dompet telah dikembalikan.`
        : `Status ${item.name} dikembalikan menjadi belum dicatat periode ini.`,
      'info'
    );
  };

  // Count unlinked active expense subscriptions
  const unlinkedExpenseCount = useMemo(() => {
    return items.filter(
      (i) => i.type === 'expense' && !itemBudgetStatusMap[i.id]?.linkedSub
    ).length;
  }, [items, itemBudgetStatusMap]);

  // Calculate monthly normalized totals & progress
  const summary = useMemo(() => {
    let monthlyExpense = 0;
    let paidExpenseThisPeriod = 0;
    let monthlyIncome = 0;
    let dueSoonCount = 0;
    let unpaidActiveCount = 0;

    items.forEach((item) => {
      if (!item.isActive) return;
      const monthlyEquivalent = getMonthlySubscriptionAmount(item.amount, item.frequency);
      const isRecorded = isItemRecordedThisPeriod(item);

      if (item.type === 'expense') {
        monthlyExpense += monthlyEquivalent;
        if (isRecorded) {
          paidExpenseThisPeriod += monthlyEquivalent;
        } else {
          unpaidActiveCount += 1;
        }
      } else {
        monthlyIncome += monthlyEquivalent;
      }

      const daysUntil = getDaysUntilBilling(item.billingDay);
      if (!isRecorded && daysUntil >= -5 && daysUntil <= 7) {
        dueSoonCount += 1;
      }
    });

    const remainingExpenseThisPeriod = Math.max(0, monthlyExpense - paidExpenseThisPeriod);
    const paidPct =
      monthlyExpense > 0 ? Math.min(100, Math.round((paidExpenseThisPeriod / monthlyExpense) * 100)) : 100;

    return {
      monthlyExpense,
      paidExpenseThisPeriod,
      remainingExpenseThisPeriod,
      paidPct,
      yearlyExpense: monthlyExpense * 12,
      monthlyIncome,
      dueSoonCount,
      unpaidActiveCount,
    };
  }, [items, isItemRecordedThisPeriod, getDaysUntilBilling]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (filterType === 'expense' && item.type !== 'expense') return false;
        if (filterType === 'income' && item.type !== 'income') return false;
        if (filterType === 'unpaid') {
          if (!item.isActive || isItemRecordedThisPeriod(item)) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!item.name.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Active unpaid items due soonest first, then recorded items, then paused
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        const aRec = isItemRecordedThisPeriod(a);
        const bRec = isItemRecordedThisPeriod(b);
        if (aRec !== bRec) return aRec ? 1 : -1;
        return a.billingDay - b.billingDay;
      });
  }, [items, filterType, searchQuery, isItemRecordedThisPeriod]);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setEmoji('🎬');
    setTxType('expense');
    setAmount('');
    setFrequency('monthly');
    setBillingDay('1');
    setWalletId(liquidWallets[0]?.id || wallets[0]?.id || '');
    setCategoryId('cat-tagihan');
    setBudgetGroup('kebutuhan');
    setSubcategoryId('');
    setResetRecordedThisMonth(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: RecurringItem) => {
    setEditingId(item.id);
    setName(item.name);
    setEmoji(item.emoji || (item.type === 'expense' ? '🔁' : '💰'));
    setTxType(item.type);
    setAmount(formatNominalInput(item.amount));
    setFrequency(item.frequency);
    setBillingDay(String(item.billingDay));
    const validWallet = wallets.find((w) => w.id === item.walletId);
    setWalletId(validWallet?.id || liquidWallets[0]?.id || wallets[0]?.id || '');
    setCategoryId(
      item.categoryId || (item.type === 'expense' ? 'cat-tagihan' : 'cat-gaji')
    );
    const linked = itemBudgetStatusMap[item.id]?.linkedSub;
    setBudgetGroup(
      item.budgetGroup ||
        linked?.group ||
        (item.categoryId === 'cat-hiburan' ? 'keinginan' : 'kebutuhan')
    );
    setSubcategoryId(item.subcategoryId || linked?.id || '');
    setResetRecordedThisMonth(false);
    setIsModalOpen(true);
  };

  const handleOpenPayModal = (item: RecurringItem) => {
    setPayingItem(item);
    setPayAmount(formatNominalInput(item.amount));

    // Resolve valid wallet or pick a liquid wallet with enough balance
    const configuredWallet = walletsWithBalance.find((w) => w.id === item.walletId);
    const pool = liquidWallets.length > 0 ? liquidWallets : walletsWithBalance;
    const bestWallet =
      item.type === 'expense'
        ? configuredWallet && configuredWallet.balance >= item.amount
          ? configuredWallet
          : pool.find((w) => w.balance >= item.amount) ||
            configuredWallet ||
            [...pool].sort((a, b) => b.balance - a.balance)[0]
        : configuredWallet || pool[0];

    setPayWalletId(bestWallet?.id || wallets[0]?.id || '');
    setPayDate(todayIso);
    setPayNote(`${item.name} (Otomatis Rutin)`);
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingItem) return;
    const val = parseNominalInput(payAmount);
    if (val <= 0) return;

    const ok = recordSubscriptionPayment(payingItem.id, {
      walletId: payWalletId,
      amount: val,
      date: payDate,
      note: payNote.trim(),
    });
    if (!ok) return;
    setPayingItem(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNominalInput(amount);
    if (!name.trim() || val <= 0) return;

    const dayNum = Math.min(31, Math.max(1, parseInt(billingDay, 10) || 1));
    const cleanItemName = name.trim().toLowerCase();

    const matchedSub =
      (subcategoryId && budgetConfig?.subcategories?.find((s) => s.id === subcategoryId)) ||
      budgetConfig?.subcategories?.find((s) => {
        const sName = s.name.toLowerCase().trim();
        return cleanItemName === sName;
      });

    const determinedGroup: BudgetGroup =
      txType === 'expense'
        ? budgetGroup ||
          matchedSub?.group ||
          (categoryId === 'cat-hiburan' ? 'keinginan' : 'kebutuhan')
        : 'kebutuhan';

    const resolvedWalletId =
      wallets.find((w) => w.id === walletId)?.id ||
      liquidWallets[0]?.id ||
      wallets[0]?.id ||
      '';

    if (editingId) {
      const existing = items.find((i) => i.id === editingId);
      if (resetRecordedThisMonth && existing) {
        const status = itemBudgetStatusMap[existing.id];
        if (status?.matchedTxIds?.length) {
          status.matchedTxIds.forEach((txId) => deleteTransaction(txId));
        }
      }
      updateSubscription(editingId, {
        name: name.trim(),
        emoji: emoji || (txType === 'expense' ? '🔁' : '💰'),
        type: txType,
        amount: val,
        frequency,
        billingDay: dayNum,
        walletId: resolvedWalletId,
        categoryId:
          categoryId ||
          (txType === 'expense'
            ? determinedGroup === 'keinginan'
              ? 'cat-hiburan'
              : 'cat-tagihan'
            : 'cat-gaji'),
        subcategoryId: matchedSub?.id || subcategoryId || existing?.subcategoryId,
        budgetGroup: txType === 'expense' ? determinedGroup : undefined,
        lastRecordedPeriod: resetRecordedThisMonth
          ? undefined
          : existing?.lastRecordedPeriod,
      });
    } else {
      addSubscription({
        name: name.trim(),
        emoji: emoji || (txType === 'expense' ? '🔁' : '💰'),
        type: txType,
        amount: val,
        frequency,
        billingDay: dayNum,
        walletId: resolvedWalletId,
        categoryId:
          categoryId ||
          (txType === 'expense'
            ? determinedGroup === 'keinginan'
              ? 'cat-hiburan'
              : 'cat-tagihan'
            : 'cat-gaji'),
        subcategoryId: matchedSub?.id || undefined,
        budgetGroup: txType === 'expense' ? determinedGroup : undefined,
        isActive: true,
      });
    }

    setIsModalOpen(false);
    setEditingId(null);
    setName('');
    setAmount('');
    setSubcategoryId('');
    setResetRecordedThisMonth(false);
  };

  const freqLabel = (freq: RecurringItem['frequency']) => {
    if (freq === 'monthly') return 'Bulanan';
    if (freq === 'yearly') return 'Tahunan';
    return 'Mingguan';
  };

  const editingItem = useMemo(
    () => (editingId ? items.find((i) => i.id === editingId) || null : null),
    [editingId, items]
  );

  return (
    <div className="space-y-5 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pt-1 lg:pt-0 px-0.5">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
            Langganan & Tagihan Rutin
          </h1>
          <p className="text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Otomatis terhubung ke Pos Tagihan Bulanan tanpa memotong Kuota Harian.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="h-10 px-4 rounded-full bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap shrink-0"
          title="Tambah Jadwal Berulang"
        >
          <Plus size={16} strokeWidth={2.8} />
          <span>Tambah Jadwal</span>
        </button>
      </div>

      {/* Full-Width Dark Hero Card */}
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-[28px] lg:rounded-[32px] p-5 sm:p-6 lg:px-9 lg:py-7 text-white shadow-xl border border-white/10 space-y-5">
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

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black text-[#D4F826] uppercase tracking-widest flex items-center gap-1.5">
                <RefreshCw size={12} />
                <span>TOTAL TAGIHAN & LANGGANAN / BULAN</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 text-[10px] font-bold">
                {items.filter((i) => i.isActive).length} Jadwal Aktif
              </span>
            </div>
            <div className="font-display font-mono-num text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-white leading-none">
              {formatRupiah(summary.monthlyExpense, hide)}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-0.5">
              <span>
                Sisa belum dibayar bln ini:{' '}
                <strong className="text-[#D4F826] font-mono-num">
                  {formatRupiah(summary.remainingExpenseThisPeriod, hide)}
                </strong>
              </span>
              <span>·</span>
              <span>
                Estimasi / tahun:{' '}
                <strong className="text-white font-mono-num">
                  {formatRupiah(summary.yearlyExpense, hide)}
                </strong>
              </span>
            </div>

            {/* Monthly Payment Progress Bar */}
            {summary.monthlyExpense > 0 && (
              <div className="max-w-md pt-1 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>
                    Terbayar periode ini: {formatRupiah(summary.paidExpenseThisPeriod, hide)}
                  </span>
                  <span className="font-mono-num font-bold text-[#D4F826]">
                    {summary.paidPct}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#84CC16] to-[#D4F826] transition-all duration-500"
                    style={{ width: `${summary.paidPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                PEMASUKAN RUTIN / BLN
              </span>
              <span className="font-mono-num text-sm sm:text-lg font-extrabold text-[#D4F826] mt-1 block">
                +{formatRupiah(summary.monthlyIncome, hide)}
              </span>
              {summary.monthlyIncome > 0 &&
                budgetConfig.estimatedIncome !== summary.monthlyIncome && (
                  <button
                    type="button"
                    onClick={() => {
                      updateBudgetConfig({ estimatedIncome: summary.monthlyIncome });
                      addToast(
                        'Pemasukan Budget Diperbarui',
                        `Perkiraan pemasukan di Menu Budget disamakan ke ${formatRupiah(
                          summary.monthlyIncome
                        )}.`
                      );
                    }}
                    className="mt-1 text-[10px] font-extrabold text-sky-400 hover:text-sky-300 underline cursor-pointer block text-left"
                  >
                    Jadikan patokan Budget
                  </button>
                )}
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                JATUH TEMPO DEKAT
              </span>
              <span className="font-mono-num text-sm sm:text-lg font-extrabold text-white mt-1 block">
                {summary.dueSoonCount} Jadwal
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {summary.unpaidActiveCount} belum dicatat bln ini
              </span>
            </div>
          </div>
        </div>

        {/* Relasi ke Menu Budget (Fixed vs Variable Protection) */}
        <div className="relative z-10 pt-4 border-t border-white/10 grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/[0.04] rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider block">
                POS TAGIHAN BULANAN (BUDGET)
              </span>
              <span className="font-mono-num text-sm font-black text-white mt-0.5 block">
                {formatRupiah(dashboardSummary.monthlyFixedBudget, hide)}
              </span>
              <span className="text-[10px] text-slate-400">
                Terbayar bulan ini: {formatRupiah(dashboardSummary.monthlyFixedExpense, hide)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Menu Budget</span>
              <ArrowUpRight size={12} />
            </button>
          </div>

          <div className="bg-white/[0.04] rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-[#D4F826] uppercase tracking-wider block">
                POS PENGELUARAN HARIAN
              </span>
              <span className="font-mono-num text-sm font-black text-white mt-0.5 block">
                {formatRupiah(dashboardSummary.monthlyVariableBudget, hide)}
              </span>
              <span className="text-[10px] text-slate-400">
                Kuota harian: ~{formatRupiah(dashboardSummary.dailyBudgetQuota, hide)}/hari
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#D4F826]/15 text-[#D4F826] flex items-center justify-center shrink-0">
              <ShieldCheck size={16} />
            </div>
          </div>

          <div className="bg-white/[0.04] rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Link2 size={12} />
                <span>STATUS RELASI BUDGET</span>
              </span>
              {unlinkedExpenseCount > 0 ? (
                <button
                  type="button"
                  onClick={syncSubscriptionsToBudget}
                  className="px-2 py-0.5 rounded-lg bg-[#D4F826] text-black text-[10px] font-black cursor-pointer"
                >
                  Sinkronkan ({unlinkedExpenseCount})
                </button>
              ) : (
                <span className="text-[10px] font-black text-emerald-400">TERHUBUNG 100%</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Pembayaran langganan otomatis memotong Pos Tagihan Bulanan & tidak mengurangi Sisa Budget Harian.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-[#11131E] p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `Semua (${items.length})` },
            {
              id: 'unpaid',
              label: `Belum Dibayar (${summary.unpaidActiveCount})`,
            },
            {
              id: 'expense',
              label: `Tagihan (${items.filter((i) => i.type === 'expense').length})`,
            },
            {
              id: 'income',
              label: `Pemasukan (${items.filter((i) => i.type === 'income').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setFilterType(tab.id as 'all' | 'expense' | 'income' | 'unpaid')
              }
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-[#D4F826] text-black font-black shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[150px] sm:min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari langganan / tagihan..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D4F826]"
          />
        </div>
      </div>

      {/* List of Subscriptions & Recurring Transactions */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-[#11131E] rounded-[28px] p-8 text-center border border-slate-200/80 dark:border-white/[0.08] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-500 mx-auto">
            <CalendarClock size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
              {filterType === 'unpaid'
                ? 'Semua Tagihan Bulan Ini Sudah Tercatat! 🎉'
                : 'Belum Ada Jadwal Berulang'}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {filterType === 'unpaid'
                ? 'Tidak ada sisa tagihan aktif yang belum dibayar pada periode anggaran ini.'
                : 'Catat langganan streaming (Netflix, Spotify), tagihan bulanan (WiFi, Listrik, Kost), atau jadwal gaji agar otomatis terhubung dengan alokasi Menu Budget.'}
            </p>
          </div>
          {filterType !== 'unpaid' && (
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2.5 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-black cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Tambah Jadwal Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
          {filteredItems.map((item) => {
            const status = itemBudgetStatusMap[item.id];
            const isRecorded = isItemRecordedThisPeriod(item);
            const wallet =
              walletsWithBalance.find((w) => w.id === item.walletId) ||
              liquidWallets[0] ||
              walletsWithBalance[0];
            const walletBrand = wallet ? detectWalletBrand(wallet.name, wallet.icon) : null;
            const category = categories.find((c) => c.id === item.categoryId);
            const daysDiff = getDaysUntilBilling(item.billingDay);
            const isDueSoon = !isRecorded && item.isActive && daysDiff >= 0 && daysDiff <= 7;
            const isOverdue = !isRecorded && item.isActive && daysDiff < 0;
            const monthlyEq = getMonthlySubscriptionAmount(item.amount, item.frequency);
            const determinedGroup: BudgetGroup =
              status?.linkedSub?.group ||
              item.budgetGroup ||
              (item.categoryId === 'cat-hiburan' ? 'keinginan' : 'kebutuhan');

            return (
              <div
                key={item.id}
                className={`relative overflow-hidden bg-white dark:bg-[#11131E] rounded-[26px] p-4 sm:p-5 shadow-2xs border transition-all space-y-3.5 ${
                  !item.isActive
                    ? 'opacity-65 border-slate-200/70 dark:border-white/[0.06]'
                    : isRecorded
                    ? 'border-emerald-500/30 dark:border-emerald-500/25'
                    : isOverdue
                    ? 'border-rose-400/60 dark:border-rose-500/40'
                    : isDueSoon
                    ? 'border-amber-400/60 dark:border-amber-500/40'
                    : 'border-slate-200/80 dark:border-white/[0.08] hover:border-indigo-500/40'
                }`}
              >
                {/* Top Status Accent Strip */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    !item.isActive
                      ? 'bg-slate-300 dark:bg-slate-700'
                      : isRecorded
                      ? 'bg-emerald-500'
                      : isOverdue
                      ? 'bg-rose-500'
                      : isDueSoon
                      ? 'bg-amber-400'
                      : item.type === 'income'
                      ? 'bg-emerald-400'
                      : 'bg-indigo-500'
                  }`}
                />

                <div className="flex items-start justify-between gap-3 pt-0.5">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10 flex items-center justify-center text-2xl shrink-0">
                      {item.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-display text-base font-extrabold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        {item.type === 'expense' ? (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                              determinedGroup === 'keinginan'
                                ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                                : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                            }`}
                          >
                            {determinedGroup === 'keinginan' ? 'Keinginan' : 'Kebutuhan'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Pemasukan Rutin
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Tiap Tgl {item.billingDay}
                        </span>
                        <span>·</span>
                        <span>{freqLabel(item.frequency)}</span>
                        {wallet && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                              {walletBrand ? (
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
                                  style={{ backgroundColor: walletBrand.primaryColor }}
                                />
                              ) : (
                                <WalletIcon size={11} className="text-slate-400" />
                              )}
                              {wallet.name}
                            </span>
                          </>
                        )}
                        {category && (
                          <>
                            <span>·</span>
                            <span className="truncate">{category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono-num text-base font-extrabold block ${
                        item.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {item.type === 'income' ? '+' : '-'}
                      {formatRupiah(item.amount, hide)}
                    </span>
                    {item.frequency !== 'monthly' && (
                      <span className="font-mono-num text-[10px] text-slate-400 block">
                        ~{formatRupiah(monthlyEq, hide)}/bln
                      </span>
                    )}

                    {/* Status Badge */}
                    <div className="mt-1">
                      {isRecorded ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 size={10} />
                          <span>Lunas Bulan Ini</span>
                        </span>
                      ) : !item.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500">
                          <Pause size={10} />
                          <span>Dijeda</span>
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500 text-white">
                          <AlertCircle size={10} />
                          <span>Lewat {Math.abs(daysDiff)} hr</span>
                        </span>
                      ) : daysDiff === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-black">
                          <Clock size={10} />
                          <span>Hari Ini!</span>
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isDueSoon
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <Clock size={10} />
                          <span>{daysDiff} hari lagi</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Budget Relation Strip */}
                {item.type === 'expense' && (
                  <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0 text-slate-600 dark:text-slate-300 font-semibold truncate">
                      <Link2 size={12} className="text-sky-500 shrink-0" />
                      {status?.linkedSub ? (
                        <span className="truncate">
                          Pos Budget:{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {status.linkedSub.name}
                          </strong>{' '}
                          ({formatRupiah(status.linkedSub.allocatedAmount, hide)}/bln)
                        </span>
                      ) : (
                        <span className="truncate text-amber-600 dark:text-amber-400">
                          Pos Tagihan Bulanan ({formatRupiah(monthlyEq, hide)}/bln)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 shrink-0 uppercase">
                      Fixed · Aman Harian
                    </span>
                  </div>
                )}

                {/* Action Footer */}
                <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/[0.08] gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.12] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Edit Jadwal & Budget"
                    >
                      <Pencil size={12} />
                      <span>Ubah</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSubscriptionActive(item.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title={item.isActive ? 'Jeda Jadwal' : 'Aktifkan Jadwal'}
                    >
                      {item.isActive ? <Pause size={12} /> : <Play size={12} />}
                      <span>{item.isActive ? 'Jeda' : 'Aktifkan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirmDeleteId === item.id) {
                          deleteSubscription(item.id);
                          setConfirmDeleteId(null);
                        } else {
                          setConfirmDeleteId(item.id);
                        }
                      }}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        confirmDeleteId === item.id
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                      }`}
                      title="Hapus Jadwal"
                    >
                      <Trash2 size={13} />
                      {confirmDeleteId === item.id && <span>Yakin Hapus?</span>}
                    </button>
                  </div>

                  {isRecorded ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={14} />
                        <span>Tercatat</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancelRecordedPayment(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Batalkan pencatatan bulan ini & kembalikan saldo dompet"
                      >
                        <RotateCcw size={11} />
                        <span>Batal Catat</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!item.isActive}
                      onClick={() => handleOpenPayModal(item)}
                      className="px-3.5 py-2 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] disabled:opacity-40 text-black text-xs font-black flex items-center gap-1 cursor-pointer shadow-xs transition-transform active:scale-95"
                    >
                      <span>
                        {item.type === 'expense' ? 'Bayar & Catat' : 'Terima & Catat'}
                      </span>
                      <ArrowUpRight size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Konfirmasi Pembayaran / Penerimaan Rutin */}
      <AnimatePresence>
        {payingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#11131E] rounded-[28px] p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200/80 dark:border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-xl">
                    {payingItem.emoji}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                      {payingItem.type === 'expense'
                        ? 'Catat Pembayaran Tagihan'
                        : 'Catat Penerimaan Rutin'}
                    </h3>
                    <p className="text-xs text-slate-400">{payingItem.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPayingItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmPay} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Nominal Bulan Ini (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payAmount}
                    onChange={(e) => setPayAmount(formatNominalInput(e.target.value))}
                    required
                    className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-extrabold font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Anda dapat menyesuaikan nominal jika tagihan bulan ini (misal Listrik/Air) sedikit berbeda.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    {payingItem.type === 'expense'
                      ? 'Potong dari Dompet / Rekening:'
                      : 'Masuk ke Dompet / Rekening:'}
                  </label>
                  <select
                    value={payWalletId}
                    onChange={(e) => setPayWalletId(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  >
                    {walletsWithBalance.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(w.balance, hide)})
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const selectedW = walletsWithBalance.find((w) => w.id === payWalletId);
                    const amt = parseNominalInput(payAmount);
                    if (payingItem.type === 'expense' && selectedW && amt > selectedW.balance) {
                      return (
                        <div className="mt-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-400 dark:border-red-700 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-2">
                          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold">
                              Saldo {selectedW.name} Tidak Cukup!
                            </span>{' '}
                            Tersedia {formatRupiah(selectedW.balance, hide)}, kurang{' '}
                            <strong>{formatRupiah(amt - selectedW.balance, hide)}</strong>. Silakan pilih dompet lain di atas.
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Tanggal Transaksi
                    </label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Catatan
                    </label>
                    <input
                      type="text"
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayingItem(null)}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-black cursor-pointer shadow-xs"
                  >
                    Konfirmasi & Catat
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Tambah / Edit Jadwal Berulang */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#11131E] rounded-[28px] p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200/80 dark:border-white/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Jadwal & Alokasi Budget' : 'Tambah Jadwal Berulang'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Presets (Only shown when creating new item) */}
              {!editingId && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-500" />
                    PILIH CEPAT (TEMPLATE):
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {quickPresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setName(preset.name);
                          setEmoji(preset.emoji);
                          setTxType(preset.type);
                          setCategoryId(preset.cat);
                          setBudgetGroup(preset.group);
                          setBillingDay(preset.day);

                          const pName = preset.name.toLowerCase();
                          const foundSub = budgetConfig?.subcategories?.find((s) => {
                            const sName = s.name.toLowerCase();
                            return pName.includes(sName) || sName.includes(pName);
                          });
                          if (foundSub) {
                            setSubcategoryId(foundSub.id);
                            setBudgetGroup(foundSub.group);
                            if (!amount && foundSub.allocatedAmount > 0) {
                              setAmount(formatNominalInput(foundSub.allocatedAmount));
                            }
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.05] hover:bg-[#D4F826]/20 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <span>{preset.emoji}</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-3">
                {/* Tipe: Pengeluaran vs Pemasukan */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-white/[0.06] rounded-2xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('expense');
                      if (categoryId === 'cat-gaji') setCategoryId('cat-tagihan');
                    }}
                    className={`py-2 rounded-xl cursor-pointer transition-colors ${
                      txType === 'expense'
                        ? 'bg-white dark:bg-[#1E2235] text-slate-900 dark:text-white font-black shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Tagihan / Langganan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('income');
                      setCategoryId('cat-gaji');
                    }}
                    className={`py-2 rounded-xl cursor-pointer transition-colors ${
                      txType === 'income'
                        ? 'bg-white dark:bg-[#1E2235] text-emerald-600 dark:text-emerald-400 font-black shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Pemasukan Rutin
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    Nama Langganan / Transaksi & Ikon
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="w-12 p-3 text-center bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 rounded-2xl text-lg cursor-pointer shrink-0"
                      title="Pilih Emoji"
                    >
                      {emoji || '🔁'}
                    </button>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Netflix, WiFi, Listrik, Gaji"
                      required
                      className="flex-1 p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 200.000"
                    required
                    className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Siklus Berulang
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) =>
                        setFrequency(e.target.value as 'monthly' | 'yearly' | 'weekly')
                      }
                      className="w-full p-3 bg-slate-50 dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="monthly">Bulanan</option>
                      <option value="yearly">Tahunan (Dibagi 12/bln)</option>
                      <option value="weekly">Mingguan (Dikali 4/bln)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Tanggal Jatuh Tempo (1-31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={billingDay}
                      onChange={(e) => setBillingDay(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold font-mono-num text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Dompet Pembayaran
                    </label>
                    <select
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      {walletsWithBalance.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatRupiah(w.balance, hide)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Kategori Transaksi
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        setCategoryId(cid);
                        const catObj = categories.find((c) => c.id === cid);
                        if (catObj?.budgetGroup && catObj.budgetGroup !== 'tabungan') {
                          setBudgetGroup(catObj.budgetGroup);
                        } else if (cid === 'cat-hiburan') {
                          setBudgetGroup('keinginan');
                        }
                      }}
                      className="w-full p-3 bg-slate-50 dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      {categories
                        .filter((c) => c.type === txType)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.emoji} {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Pengaturan Relasi ke Menu Budget */}
                {txType === 'expense' && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Link2 size={13} className="text-sky-500" />
                        <span>RELASI ALOKASI MENU BUDGET</span>
                      </span>
                      <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                        Pos Tagihan Bulanan
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Kelompok Pos Anggaran (50/30/20)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBudgetGroup('kebutuhan')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            budgetGroup === 'kebutuhan'
                              ? 'bg-violet-500/15 border-violet-500 text-violet-700 dark:text-violet-300 font-black'
                              : 'bg-white dark:bg-[#181B29] border-slate-200 dark:border-white/10 text-slate-500'
                          }`}
                        >
                          Kebutuhan ({budgetConfig.needsPercent}%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBudgetGroup('keinginan')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            budgetGroup === 'keinginan'
                              ? 'bg-pink-500/15 border-pink-500 text-pink-700 dark:text-pink-300 font-black'
                              : 'bg-white dark:bg-[#181B29] border-slate-200 dark:border-white/10 text-slate-500'
                          }`}
                        >
                          Keinginan ({budgetConfig.wantsPercent}%)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Subkategori di Menu Budget
                      </label>
                      <select
                        value={subcategoryId}
                        onChange={(e) => {
                          const sid = e.target.value;
                          setSubcategoryId(sid);
                          if (sid) {
                            const sub = budgetConfig.subcategories.find((s) => s.id === sid);
                            if (sub) {
                              if (!name) setName(sub.name);
                              if (sub.emoji) setEmoji(sub.emoji);
                              if (!amount && sub.allocatedAmount > 0) {
                                setAmount(formatNominalInput(sub.allocatedAmount));
                              }
                              if (sub.group !== 'tabungan') {
                                setBudgetGroup(sub.group);
                              }
                            }
                          }
                        }}
                        className="w-full p-2.5 bg-white dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                      >
                        <option value="">
                          ✨ Buat / Sinkronkan Subkategori Budget Otomatis
                        </option>
                        {budgetConfig?.subcategories && budgetConfig.subcategories.length > 0 && (
                          <>
                            <optgroup label="Kebutuhan (Needs)">
                              {budgetConfig.subcategories
                                .filter((s) => s.group === 'kebutuhan')
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.emoji} {s.name} ({formatRupiah(s.allocatedAmount)})
                                  </option>
                                ))}
                            </optgroup>
                            <optgroup label="Keinginan (Wants)">
                              {budgetConfig.subcategories
                                .filter((s) => s.group === 'keinginan')
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.emoji} {s.name} ({formatRupiah(s.allocatedAmount)})
                                  </option>
                                ))}
                            </optgroup>
                          </>
                        )}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Nominal bulanan jadwal ini akan otomatis disinkronkan ke subkategori Menu Budget & Pos Tagihan Bulanan.
                      </p>
                    </div>
                  </div>
                )}

                {/* Option to reset recorded status this month when editing */}
                {editingItem && isItemRecordedThisPeriod(editingItem) && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                      Jadwal ini tercatat sudah dibayar periode ini.
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetRecordedThisMonth(!resetRecordedThisMonth)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer ${
                        resetRecordedThisMonth
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/80 dark:bg-slate-800 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <RotateCcw size={11} />
                      <span>{resetRecordedThisMonth ? 'Akan Direset' : 'Reset & Refund'}</span>
                    </button>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingId(null);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-black cursor-pointer"
                  >
                    {editingId ? 'Simpan Perubahan' : 'Simpan Jadwal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <EmojiPickerModal
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        selectedEmoji={emoji}
        onSelect={(selected) => {
          setEmoji(selected);
          setIsEmojiPickerOpen(false);
        }}
      />
    </div>
  );
}
