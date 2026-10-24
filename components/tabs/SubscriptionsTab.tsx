'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import {
  getMonthlySubscriptionAmount,
  isDateInBudgetPeriod,
  isDebtOrInstallmentSubcategory,
  parseLocalDay,
} from '@/lib/budgetUtils';
import { detectWalletBrand } from '../WalletBrandLogo';

export type { RecurringItem };

const GENERIC_TX_WORDS = new Set([
  'bayar',
  'beli',
  'tagihan',
  'rutin',
  'bulanan',
  'langganan',
  'cicilan',
  'biaya',
  'iuran',
  'uang',
  'dana',
]);

export function SubscriptionsTab() {
  const {
    wallets,
    walletsWithBalance,
    categories,
    transactions,
    budgetConfig,
    dashboardSummary,
    subscriptions: items,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionActive,
    recordSubscriptionPayment,
    cancelSubscriptionPayment,
    syncSubscriptionsToBudget,
    updateBudgetConfig,
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

  // Effective reference date inside the active budget period (aligns with currentDayOfPeriod)
  const effectiveRefDate = useMemo(() => {
    const d = new Date(
      budgetPeriod.startYear,
      budgetPeriod.startMonth,
      budgetPeriod.startDay + Math.max(0, budgetPeriod.currentDayOfPeriod - 1),
      12,
      0,
      0
    );
    return isNaN(d.getTime()) ? new Date(activeYear, activeMonth, activeDay, 12, 0, 0) : d;
  }, [budgetPeriod, activeYear, activeMonth, activeDay]);

  const todayIso = useMemo(() => {
    const y = effectiveRefDate.getFullYear();
    const m = String(effectiveRefDate.getMonth() + 1).padStart(2, '0');
    const d = String(effectiveRefDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [effectiveRefDate]);

  const liquidWallets = useMemo(
    () => walletsWithBalance.filter((w) => w.type !== 'credit' && w.type !== 'paylater'),
    [walletsWithBalance]
  );

  // Compute day difference to billingDay within the active budget period (handles standard, cross-month, and custom flexible periods)
  const getDaysUntilBilling = React.useCallback(
    (billingDay: number): number => {
      const refTime = effectiveRefDate.getTime();
      const candidates: Date[] = [];

      // Candidate 1: billingDay in period start month
      const maxStartMonth = new Date(
        budgetPeriod.startYear,
        budgetPeriod.startMonth + 1,
        0
      ).getDate();
      candidates.push(
        new Date(
          budgetPeriod.startYear,
          budgetPeriod.startMonth,
          Math.min(billingDay, maxStartMonth),
          12,
          0,
          0
        )
      );

      // Candidate 2: billingDay in period end month (if different month)
      if (
        budgetPeriod.endYear !== budgetPeriod.startYear ||
        budgetPeriod.endMonth !== budgetPeriod.startMonth
      ) {
        const maxEndMonth = new Date(
          budgetPeriod.endYear,
          budgetPeriod.endMonth + 1,
          0
        ).getDate();
        candidates.push(
          new Date(
            budgetPeriod.endYear,
            budgetPeriod.endMonth,
            Math.min(billingDay, maxEndMonth),
            12,
            0,
            0
          )
        );
      }

      // Prefer candidate that falls inside [budgetPeriod.startDate, budgetPeriod.endDate]
      const inPeriodCandidate = candidates.find(
        (c) =>
          c.getTime() >= budgetPeriod.startDate.getTime() &&
          c.getTime() <= budgetPeriod.endDate.getTime()
      );
      const targetDate = inPeriodCandidate || candidates[0];

      return Math.round((targetDate.getTime() - refTime) / (1000 * 60 * 60 * 24));
    },
    [effectiveRefDate, budgetPeriod]
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

  // Reset delete confirmation when clicking outside
  useEffect(() => {
    if (!confirmDeleteId) return;
    const handleOutside = () => setConfirmDeleteId(null);
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, [confirmDeleteId]);

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
      const d = parseLocalDay(tx.date);
      return !isNaN(d.getTime()) && isDateInBudgetPeriod(d, budgetPeriod);
    });

    const nonDebtSubs = (budgetConfig?.subcategories || []).filter(
      (s) => !isDebtOrInstallmentSubcategory(s)
    );

    items.forEach((item) => {
      const itemNameLower = item.name.toLowerCase().trim();
      const linkedSub =
        item.type === 'expense'
          ? (item.subcategoryId && nonDebtSubs.find((s) => s.id === item.subcategoryId)) ||
            nonDebtSubs.find(
              (s) =>
                s.subscriptionId === item.id || s.name.toLowerCase().trim() === itemNameLower
            ) ||
            nonDebtSubs.find((s) => {
              const sName = s.name.toLowerCase().trim();
              if (sName.length < 4 || itemNameLower.length < 4) return false;
              return itemNameLower.includes(sName) || sName.includes(itemNameLower);
            })
          : undefined;

      let totalMatchedAmount = 0;
      const matchedTxIds: string[] = [];

      const itemWords = itemNameLower
        .split(/[\s&/,-]+/)
        .filter((w) => w.length >= 4 && !GENERIC_TX_WORDS.has(w));

      periodTxs.forEach((tx) => {
        if (tx.type !== item.type) return;
        const cleanNote = (tx.note || '')
          .toLowerCase()
          .replace(/\(otomatis rutin\)|\(rutin\)|\(langganan\)|\(bulanan\)/gi, '')
          .trim();
        const rawNote = (tx.note || '').toLowerCase().trim();
        if (!cleanNote && !rawNote) return;

        const exactMatch =
          cleanNote === itemNameLower ||
          (linkedSub && cleanNote === linkedSub.name.toLowerCase().trim());

        const phraseMatch =
          itemNameLower.length >= 4 &&
          (cleanNote.includes(itemNameLower) || rawNote.includes(`${itemNameLower} (`));

        const wordMatch =
          itemWords.length > 0 &&
          cleanNote
            .split(/[\s&/,-]+/)
            .some((nw) => nw.length >= 4 && itemWords.includes(nw));

        if (exactMatch || phraseMatch || wordMatch) {
          totalMatchedAmount += tx.amount;
          matchedTxIds.push(tx.id);
        }
      });

      const targetPeriodAmount =
        item.frequency === 'weekly'
          ? getMonthlySubscriptionAmount(item.amount, item.frequency)
          : item.amount;

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
        paidViaTx: totalMatchedAmount >= targetPeriodAmount * 0.9 && targetPeriodAmount > 0,
        matchedTxIds,
      };
    });

    return map;
  }, [items, budgetConfig.subcategories, transactions, budgetPeriod]);

  // Helper to check if an item is recorded in the current budget period
  const isItemRecordedThisPeriod = React.useCallback(
    (item: RecurringItem): boolean => {
      const status = itemBudgetStatusMap[item.id];
      return (
        Boolean(item.lastRecordedPeriod && item.lastRecordedPeriod === currentPeriodKey) ||
        Boolean(status?.paidViaTx)
      );
    },
    [itemBudgetStatusMap, currentPeriodKey]
  );

  // Cancel / Undo a recorded subscription payment atomically
  const handleCancelRecordedPayment = (item: RecurringItem) => {
    const status = itemBudgetStatusMap[item.id];
    cancelSubscriptionPayment(item.id, status?.matchedTxIds || []);
  };

  // Count unlinked active expense subscriptions
  const unlinkedExpenseCount = useMemo(() => {
    return items.filter(
      (i) => i.type === 'expense' && i.isActive && !itemBudgetStatusMap[i.id]?.linkedSub
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
      const spent = itemBudgetStatusMap[item.id]?.spentThisMonth || 0;

      if (item.type === 'expense') {
        monthlyExpense += monthlyEquivalent;
        if (isRecorded) {
          paidExpenseThisPeriod += monthlyEquivalent;
        } else {
          if (spent > 0) {
            paidExpenseThisPeriod += Math.min(monthlyEquivalent, spent);
          }
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
      monthlyExpense > 0
        ? Math.min(100, Math.round((paidExpenseThisPeriod / monthlyExpense) * 100))
        : 100;

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
  }, [items, isItemRecordedThisPeriod, itemBudgetStatusMap, getDaysUntilBilling]);

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
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        const aRec = isItemRecordedThisPeriod(a);
        const bRec = isItemRecordedThisPeriod(b);
        if (aRec !== bRec) return aRec ? 1 : -1;
        return getDaysUntilBilling(a.billingDay) - getDaysUntilBilling(b.billingDay);
      });
  }, [items, filterType, searchQuery, isItemRecordedThisPeriod, getDaysUntilBilling]);

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
        cancelSubscriptionPayment(existing.id, status?.matchedTxIds || []);
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
          ? ''
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
    <div className="space-y-5 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pt-1 lg:pt-0 px-0.5">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
            Langganan & Tagihan
          </h1>
          <p className="text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Jadwal tagihan rutin dan pemasukan berulang.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="h-9 px-3.5 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap shrink-0"
          title="Tambah Jadwal"
        >
          <Plus size={15} strokeWidth={2.8} />
          <span>Tambah</span>
        </button>
      </div>

      {/* Full-Width Dark Hero Card */}
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-[26px] lg:rounded-[30px] p-5 sm:p-6 lg:px-7 lg:py-6 text-white shadow-xl border border-white/10 space-y-4">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#8B5CF6]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[#D4F826]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="font-extrabold text-[#D4F826] uppercase tracking-wider flex items-center gap-1.5">
                <RefreshCw size={11} />
                <span>Tagihan Rutin / Bulan</span>
              </span>
              <span className="text-slate-500">·</span>
              <span className="font-mono-num text-slate-300 font-semibold tabular-nums">
                {items.filter((i) => i.isActive).length} Aktif
              </span>
            </div>

            <div className="font-mono-num text-3xl sm:text-4xl font-extrabold text-white leading-none tabular-nums">
              {formatRupiah(summary.monthlyExpense, hide)}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 font-mono-num tabular-nums">
              <span>
                Sisa tagihan:{' '}
                <strong className="text-[#D4F826]">
                  {formatRupiah(summary.remainingExpenseThisPeriod, hide)}
                </strong>
              </span>
              <span className="text-slate-600">·</span>
              <span>
                Setahun:{' '}
                <strong className="text-white">
                  {formatRupiah(summary.yearlyExpense, hide)}
                </strong>
              </span>
            </div>

            {/* Monthly Payment Progress Bar */}
            {summary.monthlyExpense > 0 && (
              <div className="max-w-md pt-0.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono-num tabular-nums">
                  <span>
                    Terbayar: {formatRupiah(summary.paidExpenseThisPeriod, hide)}
                  </span>
                  <span className="font-bold text-[#D4F826]">{summary.paidPct}%</span>
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

          <div className="grid grid-cols-2 gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10 shrink-0">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Pemasukan / Bln
              </span>
              <span className="font-mono-num text-sm sm:text-base font-extrabold text-[#D4F826] mt-0.5 block tabular-nums">
                +{formatRupiah(summary.monthlyIncome, hide)}
              </span>
              {summary.monthlyIncome > 0 &&
                budgetConfig.estimatedIncome !== summary.monthlyIncome && (
                  <button
                    type="button"
                    onClick={() => {
                      updateBudgetConfig({ estimatedIncome: summary.monthlyIncome });
                      addToast(
                        'Pemasukan Diperbarui',
                        `Basis pemasukan Budget disamakan ke ${formatRupiah(summary.monthlyIncome)}.`
                      );
                    }}
                    className="mt-1 text-[10px] font-extrabold text-sky-400 hover:text-sky-300 underline cursor-pointer block text-left"
                  >
                    Jadikan Basis Budget
                  </button>
                )}
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 font-mono-num tabular-nums">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">
                Jatuh Tempo Dekat
              </span>
              <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 block">
                {summary.dueSoonCount} Jadwal
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {summary.unpaidActiveCount} belum dicatat
              </span>
            </div>
          </div>
        </div>

        {/* Relasi ke Menu Budget (Compact 3-Col Summary) */}
        <div className="relative z-10 pt-3.5 border-t border-white/10 grid grid-cols-1 lg:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-white/[0.04] rounded-2xl px-3.5 py-2.5 border border-white/10 flex items-center justify-between gap-2">
            <div className="font-mono-num tabular-nums">
              <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider block font-sans">
                Pos Tagihan (Fixed)
              </span>
              <span className="text-sm font-extrabold text-white mt-0.5 block">
                {formatRupiah(dashboardSummary.monthlyFixedBudget, hide)}
              </span>
              <span className="text-[10px] text-slate-400">
                Terbayar {formatRupiah(dashboardSummary.monthlyFixedExpense, hide)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Budget</span>
              <ArrowUpRight size={12} />
            </button>
          </div>

          <div className="bg-white/[0.04] rounded-2xl px-3.5 py-2.5 border border-white/10 flex items-center justify-between gap-2">
            <div className="font-mono-num tabular-nums">
              <span className="text-[10px] font-extrabold text-[#D4F826] uppercase tracking-wider block font-sans">
                Pos Harian (Fleksibel)
              </span>
              <span className="text-sm font-extrabold text-white mt-0.5 block">
                {formatRupiah(dashboardSummary.monthlyVariableBudget, hide)}
              </span>
              <span className="text-[10px] text-slate-400">
                Kuota ~{formatRupiah(dashboardSummary.dailyBudgetQuota, hide)}/hari
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#D4F826]/15 text-[#D4F826] flex items-center justify-center shrink-0">
              <ShieldCheck size={15} />
            </div>
          </div>

          <div className="bg-white/[0.04] rounded-2xl px-3.5 py-2.5 border border-white/10 flex flex-col justify-center">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Link2 size={12} />
                <span>Sinkronisasi Budget</span>
              </span>
              {unlinkedExpenseCount > 0 ? (
                <button
                  type="button"
                  onClick={syncSubscriptionsToBudget}
                  className="px-2 py-0.5 rounded-lg bg-[#D4F826] text-black text-[10px] font-extrabold cursor-pointer font-mono-num tabular-nums"
                >
                  Sinkron ({unlinkedExpenseCount})
                </button>
              ) : (
                <span className="text-[10px] font-extrabold text-emerald-400">Terhubung</span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Otomatis masuk tagihan rutin tanpa memotong kuota harian.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-[#11131E] p-2.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 font-mono-num tabular-nums">
          {[
            { id: 'all', label: `Semua (${items.length})` },
            {
              id: 'unpaid',
              label: `Belum Lunas (${summary.unpaidActiveCount})`,
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
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-[#D4F826] text-black font-extrabold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[150px] sm:min-w-[190px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari jadwal..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D4F826]"
          />
        </div>
      </div>

      {/* List of Subscriptions & Recurring Transactions */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-[#11131E] rounded-[24px] p-7 text-center border border-slate-200/80 dark:border-white/[0.08] space-y-2.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-500 mx-auto">
            <CalendarClock size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
              {filterType === 'unpaid'
                ? 'Semua Tagihan Sudah Tercatat! 🎉'
                : 'Belum Ada Jadwal Rutin'}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {filterType === 'unpaid'
                ? 'Tidak ada sisa tagihan aktif yang belum dibayar periode ini.'
                : 'Tambahkan langganan bulanan, tagihan utilitas, atau gaji rutin.'}
            </p>
          </div>
          {filterType !== 'unpaid' && (
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Tambah Jadwal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3.5">
          {filteredItems.map((item) => {
            const status = itemBudgetStatusMap[item.id];
            const isRecorded = isItemRecordedThisPeriod(item);
            const wallet =
              walletsWithBalance.find((w) => w.id === item.walletId) ||
              liquidWallets[0] ||
              walletsWithBalance[0];
            const walletBrand = wallet ? detectWalletBrand(wallet.name, wallet.icon) : null;
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
                className={`relative overflow-hidden bg-white dark:bg-[#11131E] rounded-[24px] p-4 shadow-2xs border transition-all space-y-3 ${
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
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10 flex items-center justify-center text-xl shrink-0">
                      {item.emoji}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </h4>

                      {/* Unboxed Clean Metadata Row (Zero-Pill Discipline) */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap font-mono-num tabular-nums">
                        <span
                          className={`font-sans font-bold ${
                            item.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : determinedGroup === 'keinginan'
                              ? 'text-pink-600 dark:text-pink-400'
                              : 'text-violet-600 dark:text-violet-400'
                          }`}
                        >
                          {item.type === 'income'
                            ? 'Pemasukan'
                            : determinedGroup === 'keinginan'
                            ? 'Keinginan'
                            : 'Kebutuhan'}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Tgl {item.billingDay}
                        </span>
                        <span>·</span>
                        <span className="font-sans">{freqLabel(item.frequency)}</span>
                        {wallet && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 font-sans font-semibold text-slate-700 dark:text-slate-300">
                              {walletBrand ? (
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
                                  style={{ backgroundColor: walletBrand.primaryColor }}
                                />
                              ) : (
                                <WalletIcon size={10} className="text-slate-400" />
                              )}
                              {wallet.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono-num tabular-nums">
                    <span
                      className={`text-sm sm:text-base font-extrabold block ${
                        item.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {item.type === 'income' ? '+' : '-'}
                      {formatRupiah(item.amount, hide)}
                    </span>
                    {item.frequency !== 'monthly' && (
                      <span className="text-[10px] text-slate-400 block">
                        ~{formatRupiah(monthlyEq, hide)}/bln
                      </span>
                    )}

                    {/* Clean Status Text */}
                    <div className="mt-0.5 text-[11px]">
                      {isRecorded ? (
                        <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={11} />
                          <span>Lunas</span>
                        </span>
                      ) : !item.isActive ? (
                        <span className="inline-flex items-center gap-1 font-bold text-slate-400">
                          <Pause size={10} />
                          <span>Dijeda</span>
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 font-extrabold text-rose-600 dark:text-rose-400">
                          <AlertCircle size={11} />
                          <span>Lewat {Math.abs(daysDiff)} hr</span>
                        </span>
                      ) : daysDiff === 0 ? (
                        <span className="inline-flex items-center gap-1 font-extrabold text-amber-600 dark:text-amber-400">
                          <Clock size={11} />
                          <span>Hari ini</span>
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isDueSoon
                              ? 'text-amber-600 dark:text-amber-400 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          <Clock size={10} />
                          <span>{daysDiff} hr lagi</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Budget Relation Strip (Compact 1-Line) */}
                {item.type === 'expense' && (
                  <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0 text-slate-600 dark:text-slate-300 font-medium truncate font-mono-num tabular-nums">
                      <Link2 size={12} className="text-sky-500 shrink-0" />
                      {status?.linkedSub ? (
                        <span className="truncate">
                          Pos Budget:{' '}
                          <strong className="text-slate-900 dark:text-white font-sans">
                            {status.linkedSub.name}
                          </strong>{' '}
                          ({formatRupiah(status.linkedSub.allocatedAmount, hide)})
                        </span>
                      ) : (
                        <span className="truncate text-amber-600 dark:text-amber-400">
                          Tagihan Rutin ({formatRupiah(monthlyEq, hide)}/bln)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 shrink-0">
                      Tagihan Fixed
                    </span>
                  </div>
                )}

                {/* Action Footer */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.08] gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.12] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Edit Jadwal"
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
                      onClick={(e) => {
                        e.stopPropagation();
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
                      {confirmDeleteId === item.id && <span>Hapus?</span>}
                    </button>
                  </div>

                  {isRecorded ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={13} />
                        <span>Tercatat</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancelRecordedPayment(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Batalkan pencatatan periode ini & kembalikan saldo"
                      >
                        <RotateCcw size={11} />
                        <span>Batal</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!item.isActive}
                      onClick={() => handleOpenPayModal(item)}
                      className="px-3 py-1.5 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] disabled:opacity-40 text-black text-xs font-extrabold flex items-center gap-1 cursor-pointer shadow-xs transition-transform active:scale-95"
                    >
                      <span>{item.type === 'expense' ? 'Bayar' : 'Terima'}</span>
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
              className="bg-white dark:bg-[#11131E] rounded-[26px] p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200/80 dark:border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-xl">
                    {payingItem.emoji}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                      {payingItem.type === 'expense' ? 'Catat Pembayaran' : 'Catat Penerimaan'}
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
                    Nominal (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payAmount}
                    onChange={(e) => setPayAmount(formatNominalInput(e.target.value))}
                    required
                    className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-extrabold font-mono-num tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    {payingItem.type === 'expense' ? 'Potong dari Dompet' : 'Masuk ke Dompet'}
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
                        <div className="mt-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-400 dark:border-red-700 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-2 font-mono-num tabular-nums">
                          <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-sans">Saldo {selectedW.name} kurang!</strong>{' '}
                            Tersedia {formatRupiah(selectedW.balance, hide)} (kurang{' '}
                            {formatRupiah(amt - selectedW.balance, hide)}).
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Tanggal
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

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPayingItem(null)}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-extrabold cursor-pointer shadow-xs"
                  >
                    Simpan
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
              className="bg-white dark:bg-[#11131E] rounded-[26px] p-5 sm:p-6 max-w-md w-full space-y-3.5 shadow-2xl border border-slate-200/80 dark:border-white/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}
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
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-500" />
                    <span>Template Cepat</span>
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
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-white/[0.06] rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('expense');
                      if (categoryId === 'cat-gaji') setCategoryId('cat-tagihan');
                    }}
                    className={`py-2 rounded-lg cursor-pointer transition-colors ${
                      txType === 'expense'
                        ? 'bg-white dark:bg-[#1E2235] text-slate-900 dark:text-white font-extrabold shadow-2xs'
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
                    className={`py-2 rounded-lg cursor-pointer transition-colors ${
                      txType === 'income'
                        ? 'bg-white dark:bg-[#1E2235] text-emerald-600 dark:text-emerald-400 font-extrabold shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Pemasukan Rutin
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    Nama & Ikon
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
                      placeholder="Contoh: Netflix, WiFi, Listrik"
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
                    className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-extrabold font-mono-num tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Siklus
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) =>
                        setFrequency(e.target.value as 'monthly' | 'yearly' | 'weekly')
                      }
                      className="w-full p-3 bg-slate-50 dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="monthly">Bulanan</option>
                      <option value="yearly">Tahunan (÷12/bln)</option>
                      <option value="weekly">Mingguan (×4/bln)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Tgl Jatuh Tempo (1-31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={billingDay}
                      onChange={(e) => setBillingDay(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-extrabold font-mono-num tabular-nums text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Dompet
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
                      Kategori
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
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Link2 size={12} className="text-sky-500" />
                        <span>Pos Budget</span>
                      </span>
                      <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                        Tagihan Rutin
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBudgetGroup('kebutuhan')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          budgetGroup === 'kebutuhan'
                            ? 'bg-violet-500/15 border-violet-500 text-violet-700 dark:text-violet-300 font-extrabold'
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
                            ? 'bg-pink-500/15 border-pink-500 text-pink-700 dark:text-pink-300 font-extrabold'
                            : 'bg-white dark:bg-[#181B29] border-slate-200 dark:border-white/10 text-slate-500'
                        }`}
                      >
                        Keinginan ({budgetConfig.wantsPercent}%)
                      </button>
                    </div>

                    <div>
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
                        <option value="">✨ Buat / Sinkron Subkategori Otomatis</option>
                        {budgetConfig?.subcategories && budgetConfig.subcategories.length > 0 && (
                          <>
                            <optgroup label="Kebutuhan">
                              {budgetConfig.subcategories
                                .filter((s) => s.group === 'kebutuhan')
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.emoji} {s.name} ({formatRupiah(s.allocatedAmount)})
                                  </option>
                                ))}
                            </optgroup>
                            <optgroup label="Keinginan">
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
                    </div>
                  </div>
                )}

                {/* Option to reset recorded status this month when editing */}
                {editingItem && isItemRecordedThisPeriod(editingItem) && (
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                      Tercatat lunas periode ini
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetRecordedThisMonth(!resetRecordedThisMonth)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1 cursor-pointer ${
                        resetRecordedThisMonth
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/80 dark:bg-slate-800 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <RotateCcw size={11} />
                      <span>{resetRecordedThisMonth ? 'Akan Direset' : 'Reset Status'}</span>
                    </button>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
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
                    className="flex-1 py-3 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-extrabold cursor-pointer"
                  >
                    Simpan
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
