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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { EmojiPickerModal } from '../EmojiPickerModal';
import { formatRupiah, formatNominalInput, parseNominalInput } from '@/lib/formatters';
import { BudgetGroup, RecurringItem } from '@/lib/types';
import { getMonthlySubscriptionAmount, isDateInBudgetPeriod } from '@/lib/budgetUtils';

export type { RecurringItem };

export function SubscriptionsTab() {
  const {
    wallets,
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
  const currentCalendarKey = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`;
  const currentPeriodKey = budgetPeriod.periodKey;

  // Compute day difference to billingDay within the active budget period (handles cross-month periods)
  const getDaysUntilBilling = (billingDay: number): number => {
    const refMidday = new Date(activeYear, activeMonth, activeDay, 12, 0, 0);
    const maxDayThisMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
    const clampedThisMonth = Math.min(billingDay, maxDayThisMonth);
    let targetDate = new Date(activeYear, activeMonth, clampedThisMonth, 12, 0, 0);

    // If custom payday period spans two months and billingDay is before startDay, its occurrence in this period is in next month
    if (budgetPeriod.isCustomPayday && billingDay < budgetPeriod.startDay && activeMonth === budgetPeriod.startMonth) {
      const nextMonthMax = new Date(budgetPeriod.endYear, budgetPeriod.endMonth + 1, 0).getDate();
      targetDate = new Date(
        budgetPeriod.endYear,
        budgetPeriod.endMonth,
        Math.min(billingDay, nextMonthMax),
        12,
        0,
        0
      );
    } else if (budgetPeriod.isCustomPayday && billingDay >= budgetPeriod.startDay && activeMonth !== budgetPeriod.startMonth) {
      const startMonthMax = new Date(budgetPeriod.startYear, budgetPeriod.startMonth + 1, 0).getDate();
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
  };

  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎬');
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'weekly'>('monthly');
  const [billingDay, setBillingDay] = useState('1');
  const [walletId, setWalletId] = useState(wallets[0]?.id || 'wallet-bca');
  const [categoryId, setCategoryId] = useState('cat-tagihan');
  const [budgetGroup, setBudgetGroup] = useState<BudgetGroup>('kebutuhan');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [resetRecordedThisMonth, setResetRecordedThisMonth] = useState(false);

  const quickPresets = [
    { name: 'Netflix', emoji: '🎬', type: 'expense' as const, cat: 'cat-hiburan', group: 'keinginan' as BudgetGroup, day: '5' },
    { name: 'Spotify', emoji: '🎵', type: 'expense' as const, cat: 'cat-hiburan', group: 'keinginan' as BudgetGroup, day: '10' },
    { name: 'WiFi & Internet', emoji: '🛜', type: 'expense' as const, cat: 'cat-tagihan', group: 'kebutuhan' as BudgetGroup, day: '20' },
    { name: 'Listrik PLN', emoji: '⚡', type: 'expense' as const, cat: 'cat-listrik', group: 'kebutuhan' as BudgetGroup, day: '15' },
    { name: 'Sewa Kost / KPR', emoji: '🏠', type: 'expense' as const, cat: 'cat-tagihan', group: 'kebutuhan' as BudgetGroup, day: '1' },
    { name: 'BPJS Kesehatan', emoji: '🏥', type: 'expense' as const, cat: 'cat-bpjs', group: 'kebutuhan' as BudgetGroup, day: '10' },
    { name: 'Gaji Bulanan', emoji: '💰', type: 'income' as const, cat: 'cat-gaji', group: 'kebutuhan' as BudgetGroup, day: '25' },
  ];

  // Map each subscription to its linked BudgetSubcategory & actual transactions spent in the active period
  const itemBudgetStatusMap = useMemo(() => {
    const map: Record<
      string,
      {
        linkedSub?: { id: string; name: string; group: BudgetGroup; allocatedAmount: number };
        spentThisMonth: number;
        paidViaTx: boolean;
      }
    > = {};

    const monthlyExpenseTxs = transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;
      const d = new Date(tx.date);
      return isDateInBudgetPeriod(d, budgetPeriod);
    });

    items.forEach((item) => {
      if (item.type !== 'expense') {
        map[item.id] = { spentThisMonth: 0, paidViaTx: false };
        return;
      }

      const itemNameLower = item.name.toLowerCase().trim();
      const linkedSub =
        (item.subcategoryId && budgetConfig?.subcategories?.find((s) => s.id === item.subcategoryId)) ||
        budgetConfig?.subcategories?.find(
          (s) =>
            s.subscriptionId === item.id ||
            s.name.toLowerCase().trim() === itemNameLower ||
            itemNameLower.includes(s.name.toLowerCase().trim()) ||
            s.name.toLowerCase().trim().includes(itemNameLower)
        );

      // Calculate actual spending matching this subscription in the active period
      let spent = 0;
      monthlyExpenseTxs.forEach((tx) => {
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
          spent += tx.amount;
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
        spentThisMonth: spent,
        paidViaTx: spent >= item.amount && item.amount > 0,
      };
    });

    return map;
  }, [items, budgetConfig.subcategories, transactions, budgetPeriod]);

  // Count unlinked active expense subscriptions
  const unlinkedExpenseCount = useMemo(() => {
    return items.filter(
      (i) => i.type === 'expense' && !itemBudgetStatusMap[i.id]?.linkedSub
    ).length;
  }, [items, itemBudgetStatusMap]);

  // Calculate monthly normalized totals
  const summary = useMemo(() => {
    let monthlyExpense = 0;
    let monthlyIncome = 0;
    let dueSoonCount = 0;

    items.forEach((item) => {
      if (!item.isActive) return;
      const monthlyEquivalent = getMonthlySubscriptionAmount(item.amount, item.frequency);

      if (item.type === 'expense') {
        monthlyExpense += monthlyEquivalent;
      } else {
        monthlyIncome += monthlyEquivalent;
      }

      const status = itemBudgetStatusMap[item.id];
      const isRecordedThisMonth =
        item.lastRecordedPeriod === currentPeriodKey ||
        item.lastRecordedPeriod === currentCalendarKey ||
        Boolean(status?.paidViaTx);
      const daysUntil = getDaysUntilBilling(item.billingDay);
      if (!isRecordedThisMonth && daysUntil >= -3 && daysUntil <= 7) {
        dueSoonCount += 1;
      }
    });

    return {
      monthlyExpense,
      yearlyExpense: monthlyExpense * 12,
      monthlyIncome,
      dueSoonCount,
    };
  }, [items, activeYear, activeMonth, activeDay, budgetPeriod, currentPeriodKey, currentCalendarKey, itemBudgetStatusMap]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (filterType !== 'all' && item.type !== filterType) return false;
        return true;
      })
      .sort((a, b) => a.billingDay - b.billingDay);
  }, [items, filterType]);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setEmoji('🎬');
    setTxType('expense');
    setAmount('');
    setFrequency('monthly');
    setBillingDay('1');
    setWalletId(wallets[0]?.id || 'wallet-bca');
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
    setWalletId(item.walletId || wallets[0]?.id || 'wallet-bca');
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNominalInput(amount);
    if (!name.trim() || val <= 0) return;

    const dayNum = Math.min(31, Math.max(1, parseInt(billingDay, 10) || 1));
    const cleanItemName = name.trim().toLowerCase();

    // Match or link to budget subcategory
    const matchedSub =
      (subcategoryId && budgetConfig?.subcategories?.find((s) => s.id === subcategoryId)) ||
      budgetConfig?.subcategories?.find((s) => {
        const sName = s.name.toLowerCase().trim();
        return cleanItemName === sName;
      });

    const determinedGroup: BudgetGroup =
      txType === 'expense'
        ? budgetGroup || matchedSub?.group || (categoryId === 'cat-hiburan' ? 'keinginan' : 'kebutuhan')
        : 'kebutuhan';

    if (editingId) {
      const existing = items.find((i) => i.id === editingId);
      updateSubscription(editingId, {
        name: name.trim(),
        emoji: emoji || (txType === 'expense' ? '🔁' : '💰'),
        type: txType,
        amount: val,
        frequency,
        billingDay: dayNum,
        walletId: walletId || wallets[0]?.id || 'wallet-bca',
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
        walletId: walletId || wallets[0]?.id || 'wallet-bca',
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
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pt-1 lg:pt-0 px-0.5">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
            Langganan & Rutin
          </h1>
          <p className="text-xs lg:text-sm font-semibold text-gray-400 mt-0.5 truncate">
            Terintegrasi otomatis dengan Pos Tagihan Bulanan.
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

      {/* Full-Width Dark Hero Card with Theme-Adaptive Glow */}
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-[28px] lg:rounded-[32px] p-5 lg:px-9 lg:py-7 text-white shadow-xl border border-white/10 space-y-5">
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
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black text-[#D4F826] uppercase tracking-widest flex items-center gap-1.5">
                <RefreshCw size={12} />
                <span>BEBAN LANGGANAN & TAGIHAN / BULAN</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-200 text-[10px] font-black uppercase">
                {items.filter((i) => i.isActive).length} AKTIF
              </span>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-[42px] font-black tabular-nums text-white leading-none">
              {formatRupiah(summary.monthlyExpense, hide)}
            </div>
            <p className="text-xs text-gray-400 pt-0.5">
              Estimasi per tahun:{' '}
              <span className="text-gray-200 font-bold">
                {formatRupiah(summary.yearlyExpense, hide)}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 lg:gap-10 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                PEMASUKAN RUTIN / BLN
              </span>
              <span className="text-sm lg:text-lg font-black text-[#D4F826] tabular-nums mt-0.5 block">
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
                        `Perkiraan pemasukan di Menu Budget disamakan ke ${formatRupiah(summary.monthlyIncome)}.`
                      );
                    }}
                    className="mt-1 text-[10px] font-extrabold text-sky-400 hover:text-sky-300 underline cursor-pointer block text-left"
                  >
                    Jadikan patokan Menu Budget
                  </button>
                )}
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                JATUH TEMPO DEKAT (H-7)
              </span>
              <span className="text-sm lg:text-lg font-black text-white mt-0.5 block">
                {summary.dueSoonCount} Jadwal
              </span>
            </div>
          </div>
        </div>

        {/* Relasi ke Menu Budget (Fixed vs Variable Protection) */}
        <div className="pt-4 border-t border-white/10 grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider block">
                POS TAGIHAN BULANAN (BUDGET)
              </span>
              <span className="text-sm font-black text-white tabular-nums mt-0.5 block">
                {formatRupiah(dashboardSummary.monthlyFixedBudget, hide)}
              </span>
              <span className="text-[10px] text-gray-400">
                Terbayar bulan ini: {formatRupiah(dashboardSummary.monthlyFixedExpense, hide)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] font-bold text-gray-200 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Menu Budget</span>
              <ArrowUpRight size={12} />
            </button>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-[#D4F826] uppercase tracking-wider block">
                POS PENGELUARAN HARIAN
              </span>
              <span className="text-sm font-black text-white tabular-nums mt-0.5 block">
                {formatRupiah(dashboardSummary.monthlyVariableBudget, hide)}
              </span>
              <span className="text-[10px] text-gray-400">
                Kuota harian: ~{formatRupiah(dashboardSummary.dailyBudgetQuota, hide)}/hari
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#D4F826]/15 text-[#D4F826] flex items-center justify-center shrink-0">
              <ShieldCheck size={16} />
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between">
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
                <span className="text-[10px] font-black text-emerald-400">TERHUBUNG</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 leading-snug">
              Pembayaran langganan otomatis memotong Pos Tagihan Bulanan & tidak mengurangi Sisa Budget Harian.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-white dark:bg-[#16181D] rounded-2xl border border-gray-100 dark:border-gray-800 text-xs font-bold lg:w-fit">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'expense', label: 'Tagihan & Langganan' },
          { id: 'income', label: 'Pemasukan Rutin' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id as 'all' | 'expense' | 'income')}
            className={`flex-1 lg:flex-initial py-2 px-4 rounded-xl transition-colors cursor-pointer ${
              filterType === tab.id
                ? 'bg-[#D4F826] text-black font-black shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List of Subscriptions & Recurring Transactions */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-[#16181D] rounded-3xl p-8 text-center border border-gray-100 dark:border-gray-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 mx-auto">
            <CalendarClock size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Belum Ada Jadwal Berulang
            </h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              Catat langganan streaming (Netflix, Spotify), tagihan bulanan (WiFi, Listrik, Kost), atau jadwal gaji agar otomatis terhubung dengan alokasi Menu Budget.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-black cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Tambah Jadwal Pertama</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
          {filteredItems.map((item) => {
            const status = itemBudgetStatusMap[item.id];
            const isRecorded =
              item.lastRecordedPeriod === currentPeriodKey ||
              item.lastRecordedPeriod === currentCalendarKey ||
              Boolean(status?.paidViaTx);
            const wallet = wallets.find((w) => w.id === item.walletId);
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
                className={`bg-white dark:bg-[#16181D] rounded-3xl p-4 shadow-xs border transition-all space-y-3 ${
                  !item.isActive
                    ? 'opacity-60 border-gray-100 dark:border-gray-800'
                    : isDueSoon || isOverdue
                    ? 'border-amber-400/60 dark:border-amber-500/40'
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xl shrink-0">
                      {item.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        {item.type === 'expense' ? (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                              determinedGroup === 'keinginan'
                                ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
                                : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                            }`}
                          >
                            {determinedGroup === 'keinginan' ? 'Keinginan' : 'Kebutuhan'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Pemasukan Rutin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5 flex-wrap">
                        <span>Tgl {item.billingDay}</span>
                        <span>·</span>
                        <span>{freqLabel(item.frequency)}</span>
                        <span>·</span>
                        <span className="truncate">{wallet?.name || 'Dompet'}</span>
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
                      className={`text-sm font-black tabular-nums block ${
                        item.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {item.type === 'income' ? '+' : '-'}
                      {formatRupiah(item.amount, hide)}
                    </span>
                    {item.frequency !== 'monthly' && (
                      <span className="text-[10px] text-gray-400 block tabular-nums">
                        ~{formatRupiah(monthlyEq, hide)}/bln
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-gray-400">
                      {isRecorded
                        ? 'Sudah dicatat bulan ini'
                        : !item.isActive
                        ? 'Dijeda'
                        : isOverdue
                        ? `Lewat ${Math.abs(daysDiff)} hari`
                        : daysDiff === 0
                        ? 'Jatuh tempo hari ini'
                        : `${daysDiff} hari lagi`}
                    </span>
                  </div>
                </div>

                {/* Budget Relation Strip */}
                {item.type === 'expense' && (
                  <div className="px-3 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0 text-gray-600 dark:text-gray-300 font-semibold truncate">
                      <Link2 size={12} className="text-sky-500 shrink-0" />
                      {status?.linkedSub ? (
                        <span className="truncate">
                          Pos Budget: <strong className="text-gray-900 dark:text-white">{status.linkedSub.name}</strong> ({formatRupiah(status.linkedSub.allocatedAmount, hide)}/bln)
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
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-800 gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Edit Jadwal & Budget"
                    >
                      <Pencil size={12} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSubscriptionActive(item.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title={item.isActive ? 'Jeda Jadwal' : 'Aktifkan Jadwal'}
                    >
                      {item.isActive ? <Pause size={12} /> : <Play size={12} />}
                      <span>{item.isActive ? 'Jeda' : 'Aktifkan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteSubscription(item.id)}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Hapus Jadwal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {isRecorded ? (
                    <div className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} />
                      <span>Tercatat Bulan Ini</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!item.isActive}
                      onClick={() => recordSubscriptionPayment(item.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] disabled:opacity-40 text-black text-xs font-black flex items-center gap-1 cursor-pointer shadow-xs"
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

      {/* Modal Tambah / Edit Jadwal Berulang */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  {editingId ? 'Edit Jadwal & Alokasi Budget' : 'Tambah Jadwal Berulang'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Presets (Only shown when creating new item) */}
              {!editingId && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
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
                        className="px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-[#D4F826]/20 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 shrink-0 cursor-pointer flex items-center gap-1"
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
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('expense');
                      if (categoryId === 'cat-gaji') setCategoryId('cat-tagihan');
                    }}
                    className={`py-2 rounded-xl cursor-pointer transition-colors ${
                      txType === 'expense'
                        ? 'bg-white dark:bg-[#16181D] text-gray-900 dark:text-white font-black shadow-xs'
                        : 'text-gray-500'
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
                        ? 'bg-white dark:bg-[#16181D] text-emerald-600 dark:text-emerald-400 font-black shadow-xs'
                        : 'text-gray-500'
                    }`}
                  >
                    Pemasukan Rutin
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Nama Langganan / Transaksi & Ikon
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="w-12 p-3 text-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-2xl text-lg cursor-pointer shrink-0"
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
                      className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 200.000"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      Siklus Berulang
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) =>
                        setFrequency(e.target.value as 'monthly' | 'yearly' | 'weekly')
                      }
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
                    >
                      <option value="monthly">Bulanan</option>
                      <option value="yearly">Tahunan (Dibagi 12/bln)</option>
                      <option value="weekly">Mingguan (Dikali 4/bln)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      Tanggal Jatuh Tempo (1-31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={billingDay}
                      onChange={(e) => setBillingDay(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      Dompet Pembayaran
                    </label>
                    <select
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
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
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
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
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200/80 dark:border-gray-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        <Link2 size={13} className="text-sky-500" />
                        <span>RELASI ALOKASI MENU BUDGET</span>
                      </span>
                      <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                        Pos Tagihan Bulanan
                      </span>
                    </div>

                    {/* Pilih Kelompok Budget: Kebutuhan vs Keinginan */}
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 block mb-1">
                        Kelompok Pos Anggaran (50/30/20)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBudgetGroup('kebutuhan')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            budgetGroup === 'kebutuhan'
                              ? 'bg-violet-500/15 border-violet-500 text-violet-700 dark:text-violet-300 font-black'
                              : 'bg-white dark:bg-[#16181D] border-gray-200 dark:border-gray-700 text-gray-500'
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
                              : 'bg-white dark:bg-[#16181D] border-gray-200 dark:border-gray-700 text-gray-500'
                          }`}
                        >
                          Keinginan ({budgetConfig.wantsPercent}%)
                        </button>
                      </div>
                    </div>

                    {/* Pilih Subkategori Budget */}
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 block mb-1">
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
                        className="w-full p-2.5 bg-white dark:bg-[#16181D] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
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
                      <p className="text-[10px] text-gray-400 mt-1">
                        Nominal bulanan jadwal ini akan otomatis disinkronkan ke subkategori Menu Budget & Pos Tagihan Bulanan.
                      </p>
                    </div>
                  </div>
                )}

                {/* Option to reset recorded status this month when editing */}
                {editingItem &&
                  (editingItem.lastRecordedPeriod === currentPeriodKey ||
                    editingItem.lastRecordedPeriod === currentCalendarKey) && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                      Jadwal ini ditandai sudah dicatat bulan ini.
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetRecordedThisMonth(!resetRecordedThisMonth)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer ${
                        resetRecordedThisMonth
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/80 dark:bg-gray-800 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <RotateCcw size={11} />
                      <span>{resetRecordedThisMonth ? 'Akan Direset' : 'Reset Status'}</span>
                    </button>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingId(null);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
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
