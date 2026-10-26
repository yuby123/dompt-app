'use client';

import React, { useMemo, useState } from 'react';
import {
  Plus,
  X,
  Lock,
  Unlock,
  Calendar,
  Wallet as WalletIcon,
  ShieldAlert,
  Trash2,
  Pencil,
  Smile,
  Target,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import {
  formatFullDateIndo,
  formatRupiah,
  formatNominalInput,
  parseNominalInput,
} from '@/lib/formatters';
import { Goal } from '@/lib/types';
import { EmojiPickerModal } from '../EmojiPickerModal';

function getMonthsRemainingUntil(targetDateStr?: string): number {
  if (!targetDateStr) return 12;
  const now = new Date();
  const target = new Date(targetDateStr);
  if (Number.isNaN(target.getTime())) return 12;
  const diffMonths =
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(1, diffMonths);
}

function calculateSmartMonthlySaving(
  targetAmount: number,
  currentAmount: number,
  targetDateStr?: string
): number {
  const shortfall = Math.max(0, targetAmount - currentAmount);
  if (shortfall <= 0) return 0;
  const monthsLeft = getMonthsRemainingUntil(targetDateStr);
  return Math.round(shortfall / monthsLeft);
}

export function GoalsTab() {
  const {
    goals,
    wallets,
    walletsWithBalance,
    addGoal,
    updateGoal,
    toggleLockGoal,
    deleteGoal,
    settings,
    triggerInsufficientBalanceAlert,
    isAddGoalModalOpen,
    setIsAddGoalModalOpen,
  } = useApp();

  // Active Modals & Selection states
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [localAddModalOpen, setLocalAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [emojiTarget, setEmojiTarget] = useState<'add' | 'edit'>('add');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'achieved'>('all');

  const isAddModalOpen = localAddModalOpen || isAddGoalModalOpen;
  const setIsAddModalOpen = (open: boolean) => {
    setLocalAddModalOpen(open);
    setIsAddGoalModalOpen(open);
  };

  // Resolve selectedGoal live from `goals` array so it is never stale
  const selectedGoal = useMemo(
    () => (selectedGoalId ? goals.find((g) => g.id === selectedGoalId) || null : null),
    [goals, selectedGoalId]
  );

  // Liquid wallets eligible to hold savings goals (excludes credit card & paylater debt wallets)
  const liquidWallets = useMemo(() => {
    const filtered = walletsWithBalance.filter(
      (w) => w.type !== 'credit' && w.type !== 'paylater'
    );
    return filtered.length > 0 ? filtered : walletsWithBalance;
  }, [walletsWithBalance]);

  const fallbackLiquidWalletId = liquidWallets[0]?.id || wallets[0]?.id || 'wallet-bca';

  // Deposit/Withdraw Delta in detail modal
  const [depositDelta, setDepositDelta] = useState('');

  // Form states for Add Goal
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [walletId, setWalletId] = useState(fallbackLiquidWalletId);
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [isEmergencyFund, setIsEmergencyFund] = useState(false);
  const [initialDeposit, setInitialDeposit] = useState('');

  // Form states for Edit Goal
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('🎯');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editCurrentAmount, setEditCurrentAmount] = useState('');
  const [editWalletId, setEditWalletId] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editIsEmergencyFund, setEditIsEmergencyFund] = useState(false);

  const hide = settings.hideBalance;

  // Helper to format currency cleanly with optional prefix/suffix without leaking symbols when hidden
  const fmtCurrency = (
    amount: number,
    options?: { prefix?: string; suffix?: string }
  ): string => {
    if (hide) return 'Rp •••••••';
    const prefix = options?.prefix || '';
    const suffix = options?.suffix || '';
    return `${prefix}${formatRupiah(amount, false)}${suffix}`;
  };

  // Dynamic accent color classes based on user's selected theme
  const accentColor = settings.accentColor || 'lime';
  const accentBtn =
    accentColor === 'pink'
      ? 'bg-[#FF9A9E] hover:bg-[#ff858a] text-slate-950'
      : accentColor === 'orange'
      ? 'bg-[#FF6B2B] hover:bg-[#f05c1c] text-white'
      : accentColor === 'plum'
      ? 'bg-[#A594F9] hover:bg-[#937ff7] text-slate-950'
      : 'bg-[#D4F826] hover:bg-[#c6ec19] text-slate-950';

  const accentFocusRing =
    accentColor === 'pink'
      ? 'focus:ring-[#FF9A9E]'
      : accentColor === 'orange'
      ? 'focus:ring-[#FF6B2B]'
      : accentColor === 'plum'
      ? 'focus:ring-[#A594F9]'
      : 'focus:ring-[#D4F826]';

  const accentProgressBar =
    accentColor === 'orange'
      ? 'bg-gradient-to-r from-[#FF6B2B] via-[#F59E0B] to-[#EC4899]'
      : accentColor === 'pink'
      ? 'bg-gradient-to-r from-[#FFA4A4] via-[#F43F5E] to-[#A855F7]'
      : accentColor === 'plum'
      ? 'bg-gradient-to-r from-[#A594F9] via-[#EC4899] to-[#38BDF8]'
      : 'bg-gradient-to-r from-[#D4F826] via-emerald-400 to-teal-400';

  // Aggregate Summary Metrics across all Goals
  const summaryMetrics = useMemo(() => {
    const totalTarget = goals.reduce((acc, g) => acc + Math.max(0, g.targetAmount || 0), 0);
    const totalSaved = goals.reduce((acc, g) => acc + Math.max(0, g.currentAmount || 0), 0);
    const totalShortfall = Math.max(0, totalTarget - totalSaved);
    const overallPct =
      totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

    const achievedCount = goals.filter(
      (g) => g.targetAmount > 0 && g.currentAmount >= g.targetAmount
    ).length;
    const emergencyCount = goals.filter((g) => g.isEmergencyFund).length;
    const lockedTotal = goals
      .filter((g) => g.isLocked)
      .reduce((acc, g) => acc + Math.max(0, g.currentAmount || 0), 0);

    const totalMonthlyRecommendation = goals.reduce(
      (acc, g) =>
        acc + calculateSmartMonthlySaving(g.targetAmount, g.currentAmount, g.targetDate),
      0
    );

    const totalUnallocatedLiquid = liquidWallets.reduce(
      (acc, w) => acc + Math.max(0, w.availableBalance || 0),
      0
    );

    return {
      totalTarget,
      totalSaved,
      totalShortfall,
      overallPct,
      achievedCount,
      activeCount: Math.max(0, goals.length - achievedCount),
      emergencyCount,
      lockedTotal,
      totalMonthlyRecommendation,
      totalUnallocatedLiquid,
    };
  }, [goals, liquidWallets]);

  const filteredGoals = useMemo(() => {
    if (filterMode === 'achieved') {
      return goals.filter((g) => g.targetAmount > 0 && g.currentAmount >= g.targetAmount);
    }
    if (filterMode === 'active') {
      return goals.filter((g) => g.targetAmount <= 0 || g.currentAmount < g.targetAmount);
    }
    return goals;
  }, [goals, filterMode]);

  // Open Create Goal Modal with valid liquid wallet default
  const handleOpenCreateModal = () => {
    setWalletId(fallbackLiquidWalletId);
    setName('');
    setTargetAmount('');
    setInitialDeposit('');
    setEmoji('🎯');
    setIsEmergencyFund(false);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal with prefilled values
  const handleOpenEdit = (goal: Goal) => {
    const validWalletId =
      goal.walletId && liquidWallets.some((w) => w.id === goal.walletId)
        ? goal.walletId
        : fallbackLiquidWalletId;
    setEditingGoal(goal);
    setEditName(goal.name);
    setEditEmoji(goal.emoji || '🎯');
    setEditTargetAmount(formatNominalInput(goal.targetAmount));
    setEditCurrentAmount(formatNominalInput(goal.currentAmount));
    setEditWalletId(validWalletId);
    setEditTargetDate(goal.targetDate || '2026-12-31');
    setEditIsEmergencyFund(Boolean(goal.isEmergencyFund));
  };

  // Open Emoji Picker for either Add or Edit modal
  const handleOpenEmojiPicker = (target: 'add' | 'edit') => {
    setEmojiTarget(target);
    setIsEmojiPickerOpen(true);
  };

  const handleSelectEmoji = (chosenEmoji: string) => {
    if (emojiTarget === 'add') {
      setEmoji(chosenEmoji);
    } else {
      setEditEmoji(chosenEmoji);
    }
  };

  // Submit Add Goal
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseNominalInput(targetAmount);
    const initialVal = parseNominalInput(initialDeposit);

    if (!name.trim() || targetVal <= 0) return;

    const targetWId = walletId || fallbackLiquidWalletId;
    const targetW =
      liquidWallets.find((w) => w.id === targetWId) ||
      walletsWithBalance.find((w) => w.id === targetWId) ||
      liquidWallets[0];

    if (initialVal > 0 && targetW && initialVal > targetW.availableBalance) {
      triggerInsufficientBalanceAlert(
        targetW.id,
        initialVal,
        `Setoran Awal Goal: ${name.trim()}`,
        targetW.availableBalance
      );
      return;
    }

    addGoal({
      name: name.trim(),
      emoji: emoji || '🎯',
      targetAmount: targetVal,
      currentAmount: initialVal,
      walletId: targetWId,
      targetDate,
      isEmergencyFund,
      isLocked: isEmergencyFund,
      monthlyTargetSaving: calculateSmartMonthlySaving(targetVal, initialVal, targetDate),
    });

    setIsAddModalOpen(false);
    setName('');
    setTargetAmount('');
    setInitialDeposit('');
    setEmoji('🎯');
    setIsEmergencyFund(false);
  };

  // Submit Edit Goal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    const targetVal = parseNominalInput(editTargetAmount);
    const currentVal = parseNominalInput(editCurrentAmount);

    if (!editName.trim() || targetVal <= 0) return;

    const targetW =
      liquidWallets.find((w) => w.id === editWalletId) ||
      walletsWithBalance.find((w) => w.id === editWalletId) ||
      liquidWallets[0];

    if (targetW) {
      const walletIdSet = new Set(wallets.map((w) => w.id));
      const resolvedPrevGoalWalletId =
        editingGoal.walletId && walletIdSet.has(editingGoal.walletId)
          ? editingGoal.walletId
          : fallbackLiquidWalletId;

      const maxAllowedForThisGoal =
        resolvedPrevGoalWalletId === targetW.id
          ? targetW.availableBalance + Math.max(0, editingGoal.currentAmount || 0)
          : targetW.availableBalance;

      if (currentVal > maxAllowedForThisGoal) {
        triggerInsufficientBalanceAlert(
          targetW.id,
          currentVal,
          `Alokasi Goal: ${editName.trim()}`,
          maxAllowedForThisGoal
        );
        return;
      }
    }

    const updatedData: Partial<Goal> = {
      name: editName.trim(),
      emoji: editEmoji || '🎯',
      targetAmount: targetVal,
      currentAmount: currentVal,
      walletId: editWalletId,
      targetDate: editTargetDate,
      isEmergencyFund: editIsEmergencyFund,
      monthlyTargetSaving: calculateSmartMonthlySaving(targetVal, currentVal, editTargetDate),
    };

    updateGoal(editingGoal.id, updatedData);
    setEditingGoal(null);
  };

  // Delete Confirmation Handler
  const handleConfirmDelete = () => {
    if (!deletingGoal) return;
    deleteGoal(deletingGoal.id);
    if (selectedGoalId === deletingGoal.id) {
      setSelectedGoalId(null);
    }
    setDeletingGoal(null);
  };

  // Deposit/Withdraw in detail modal
  const handleAdjustGoalAmount = (mode: 'add' | 'subtract') => {
    if (!selectedGoal) return;
    const val = parseNominalInput(depositDelta);
    if (!val || val <= 0) return;

    const walletIdSet = new Set(wallets.map((w) => w.id));
    const resolvedGoalWalletId =
      selectedGoal.walletId && walletIdSet.has(selectedGoal.walletId)
        ? selectedGoal.walletId
        : fallbackLiquidWalletId;

    const targetW =
      walletsWithBalance.find((w) => w.id === resolvedGoalWalletId) || liquidWallets[0];

    if (mode === 'add') {
      if (targetW && val > targetW.availableBalance) {
        triggerInsufficientBalanceAlert(
          targetW.id,
          val,
          `Tambah Tabungan Goal: ${selectedGoal.name}`,
          targetW.availableBalance
        );
        return;
      }
    }

    const nextAmount =
      mode === 'add'
        ? selectedGoal.currentAmount + val
        : Math.max(0, selectedGoal.currentAmount - val);

    updateGoal(selectedGoal.id, {
      currentAmount: nextAmount,
      monthlyTargetSaving: calculateSmartMonthlySaving(
        selectedGoal.targetAmount,
        nextAmount,
        selectedGoal.targetDate
      ),
    });
    setDepositDelta('');
  };

  return (
    <div className="space-y-5 pb-28 lg:pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="font-display text-2xl sm:text-[28px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            Target & Tabungan Impian
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Alokasikan dan kunci saldo dompet untuk mewujudkan rencana besar Anda tepat waktu.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className={`h-10 px-4 rounded-2xl ${accentBtn} flex items-center justify-center gap-1.5 font-bold text-xs shadow-2xs cursor-pointer transition-transform active:scale-95 self-start sm:self-auto shrink-0`}
          title="Tambah Goal Baru"
        >
          <Plus size={16} strokeWidth={2.6} />
          <span>Buat Goal Baru</span>
        </button>
      </div>

      {/* 2. Hero Summary Command Center */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F1322] via-[#13182B] to-[#0A0C14] text-white p-5 sm:p-6 lg:p-7 shadow-xl border border-white/10 space-y-5"
      >
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#8B5CF6]/15 blur-3xl pointer-events-none" />
        <div
          className={`absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
            accentColor === 'orange'
              ? 'bg-[#FF6B2B]/15'
              : accentColor === 'pink'
              ? 'bg-[#FFA4A4]/15'
              : accentColor === 'plum'
              ? 'bg-[#A594F9]/15'
              : 'bg-[#D4F826]/15'
          }`}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:items-center">
          {/* Left: Total Saved vs Total Target */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4F826] flex items-center gap-1.5">
                <Target size={14} />
                <span>Total Dana Terkumpul di Goals</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-xs text-slate-300 tabular-nums">
                {goals.length} Target ({summaryMetrics.achievedCount} Tercapai)
              </span>
            </div>

            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="font-mono text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight tabular-nums leading-none">
                {formatRupiah(summaryMetrics.totalSaved, hide)}
              </span>
              {summaryMetrics.totalTarget > 0 && (
                <span className="font-mono text-xs sm:text-sm font-medium text-slate-400 tabular-nums">
                  / {formatRupiah(summaryMetrics.totalTarget, hide)} ({summaryMetrics.overallPct}%)
                </span>
              )}
            </div>

            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full ${accentProgressBar} transition-all duration-500`}
                style={{ width: `${summaryMetrics.overallPct}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 font-mono tabular-nums leading-relaxed">
              <span className="font-sans">Sisa kekurangan target:</span>{' '}
              <strong className="text-slate-200">
                {formatRupiah(summaryMetrics.totalShortfall, hide)}
              </strong>
              {summaryMetrics.lockedTotal > 0 && (
                <span>
                  {' '}
                  · <span className="font-sans">Terkunci aman:</span>{' '}
                  <strong className="text-amber-300">
                    {formatRupiah(summaryMetrics.lockedTotal, hide)}
                  </strong>
                </span>
              )}
            </p>
          </div>

          {/* Right: 2 Key Context Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>Saldo Bebas Dompet</span>
                <WalletIcon size={13} className="text-emerald-400 shrink-0" />
              </div>
              <div className="font-mono text-base sm:text-lg font-extrabold text-emerald-400 tabular-nums truncate">
                {formatRupiah(summaryMetrics.totalUnallocatedLiquid, hide)}
              </div>
              <span className="text-[11px] text-slate-400 block leading-snug">
                Siap dialokasikan ke dalam Goals
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>Saran Setoran</span>
                <Sparkles size={13} className="text-[#D4F826] shrink-0" />
              </div>
              <div className="font-mono text-base sm:text-lg font-extrabold text-[#D4F826] tabular-nums truncate">
                {fmtCurrency(summaryMetrics.totalMonthlyRecommendation, { suffix: '/bln' })}
              </div>
              <span className="text-[11px] text-slate-400 block leading-snug">
                Agar seluruh target tercapai tepat waktu
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. Filter Bar (shown when there is at least 1 goal) */}
      {goals.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-white/[0.06] rounded-2xl">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-[#16181D] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua ({goals.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('active')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'active'
                  ? 'bg-white dark:bg-[#16181D] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Berjalan ({summaryMetrics.activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('achieved')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'achieved'
                  ? 'bg-white dark:bg-[#16181D] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tercapai ({summaryMetrics.achievedCount})
            </button>
          </div>
        </div>
      )}

      {/* 4. Goals Grid */}
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-[#16181D] rounded-3xl p-10 text-center border border-slate-200/75 dark:border-white/[0.08] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-3xl mx-auto">
            🎯
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Belum Ada Target Tabungan
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Pisahkan dana darurat, tabungan liburan, atau pembelian impian Anda dari saldo belanja harian agar tidak terpakai tanpa sengaja.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl ${accentBtn} text-xs font-bold shadow-2xs cursor-pointer transition-all active:scale-95`}
          >
            <Plus size={15} strokeWidth={2.6} />
            <span>Mulai Buat Goal Pertama</span>
          </button>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="bg-white dark:bg-[#16181D] rounded-3xl p-8 text-center border border-dashed border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
          Tidak ada target tabungan pada kategori filter ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const rawPct =
              goal.targetAmount > 0
                ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                : 0;
            const pct = Math.min(100, rawPct);
            const isAchieved = goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;
            const shortfall = Math.max(0, goal.targetAmount - goal.currentAmount);
            const monthlySuggested = calculateSmartMonthlySaving(
              goal.targetAmount,
              goal.currentAmount,
              goal.targetDate
            );
            const linkedWallet =
              wallets.find((w) => w.id === goal.walletId) || liquidWallets[0] || wallets[0];

            return (
              <div
                key={goal.id}
                onClick={() => {
                  setSelectedGoalId(goal.id);
                  setDepositDelta('');
                }}
                className="group bg-white dark:bg-[#16181D] rounded-3xl p-5 border border-slate-200/75 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between gap-4"
              >
                {/* Top: Icon, Title, Inline Metadata & Action Icons */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#1E222B] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                      {goal.emoji || '🎯'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                          {goal.name}
                        </h3>
                        {goal.isEmergencyFund && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400"
                            title="Dana Darurat"
                          >
                            <span>·</span>
                            <ShieldAlert size={12} />
                            <span>Darurat</span>
                          </span>
                        )}
                        {goal.isLocked && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400"
                            title="Saldo Terkunci"
                          >
                            <span>·</span>
                            <Lock size={11} />
                            <span>Terkunci</span>
                          </span>
                        )}
                        {isAchieved && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span>·</span>
                            <CheckCircle2 size={12} />
                            <span>Tercapai</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        <WalletIcon size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">{linkedWallet?.name || 'Dompet Utama'}</span>
                        <span>·</span>
                        <Calendar size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">{formatFullDateIndo(goal.targetDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Edit / Delete Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(goal);
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                      title="Ubah Goal"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingGoal(goal);
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Hapus Goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Middle: Current vs Target + Full-Width Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2 font-mono tabular-nums">
                    <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
                      <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate">
                        {formatRupiah(goal.currentAmount, hide)}
                      </span>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">
                        / {formatRupiah(goal.targetAmount, hide)}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-extrabold shrink-0 ${
                        isAchieved
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {rawPct}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAchieved ? 'bg-emerald-500' : accentProgressBar
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Footer: Remaining Shortfall & Monthly Saving Suggestion + Quick Setor CTA */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
                  {isAchieved ? (
                    <span className="font-sans font-semibold text-emerald-600 dark:text-emerald-400">
                      Target tabungan telah terpenuhi 100%
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                      <span className="font-sans">Kurang</span>{' '}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {formatRupiah(shortfall, hide)}
                      </strong>
                      {monthlySuggested > 0 && (
                        <span>
                          {' '}
                          · {fmtCurrency(monthlySuggested, { prefix: '~', suffix: '/bln' })}
                        </span>
                      )}
                    </span>
                  )}

                  <span className="font-sans text-xs font-bold text-slate-700 dark:text-[#D4F826] group-hover:underline flex items-center gap-1 shrink-0">
                    <span>{goal.isLocked ? 'Rincian' : 'Setor / Tarik'}</span>
                    <ArrowUpRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Goal Baru */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 dark:border-white/[0.08] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    Buat Target Goal Baru
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Dana yang dialokasikan akan diamankan dari saldo bebas dompet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                    Nama Goal & Ikon
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Dana Darurat, Liburan Jepang"
                      required
                      className={`flex-1 p-3 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenEmojiPicker('add')}
                      className="w-12 h-11 flex items-center justify-center bg-slate-50 dark:bg-[#11131A] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 rounded-2xl text-2xl transition-all cursor-pointer relative shrink-0"
                      title="Pilih Ikon Goal"
                    >
                      <span>{emoji || '🎯'}</span>
                      <span className="absolute -bottom-1 -right-1 p-0.5 bg-slate-900 text-[#D4F826] rounded-full">
                        <Smile size={10} />
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                    Target Nominal (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 15.000.000"
                    required
                    className={`w-full p-3 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-extrabold font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                      Dompet Penyimpanan
                    </label>
                    <select
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      className={`w-full p-3 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                    >
                      {liquidWallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatRupiah(w.availableBalance, hide)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                      Target Tanggal Tercapai
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className={`w-full p-3 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                    Setoran Awal dari Saldo Bebas Dompet (Opsional)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 500.000"
                    className={`w-full p-3 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                  />
                </div>

                <label
                  htmlFor="emergencyCheckbox"
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    id="emergencyCheckbox"
                    checked={isEmergencyFund}
                    onChange={(e) => setIsEmergencyFund(e.target.checked)}
                    className="w-4 h-4 rounded-md cursor-pointer accent-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Tandai sebagai Dana Darurat
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Otomatis mengunci saldo goal agar tidak terpakai tanpa sengaja.
                    </span>
                  </div>
                </label>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 rounded-2xl ${accentBtn} text-xs font-bold shadow-2xs cursor-pointer transition-transform active:scale-95`}
                  >
                    Simpan Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Edit Goal */}
      <AnimatePresence>
        {editingGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 dark:border-white/[0.08] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    Ubah Target Goal
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Perbarui rincian target, dompet terkait, atau nominal saldo terkumpul.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                    Nama Goal & Ikon
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nama Goal"
                      required
                      className={`flex-1 p-3 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenEmojiPicker('edit')}
                      className="w-12 h-11 flex items-center justify-center bg-slate-50 dark:bg-[#11131A] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 rounded-2xl text-2xl transition-all cursor-pointer relative shrink-0"
                      title="Ganti Ikon Goal"
                    >
                      <span>{editEmoji || '🎯'}</span>
                      <span className="absolute -bottom-1 -right-1 p-0.5 bg-slate-900 text-[#D4F826] rounded-full">
                        <Smile size={10} />
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                      Target Nominal (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editTargetAmount}
                      onChange={(e) => setEditTargetAmount(formatNominalInput(e.target.value))}
                      placeholder="15.000.000"
                      required
                      className={`w-full p-3 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                      Saldo Terkumpul (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editCurrentAmount}
                      onChange={(e) => setEditCurrentAmount(formatNominalInput(e.target.value))}
                      placeholder="5.000.000"
                      className={`w-full p-3 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                      Dompet Penyimpanan
                    </label>
                    <select
                      value={editWalletId}
                      onChange={(e) => setEditWalletId(e.target.value)}
                      className={`w-full p-3 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                    >
                      {liquidWallets.map((w) => {
                        const isCurrentGoalWallet = w.id === editingGoal.walletId;
                        const maxAvailable = isCurrentGoalWallet
                          ? w.availableBalance + Math.max(0, editingGoal.currentAmount || 0)
                          : w.availableBalance;
                        return (
                          <option key={w.id} value={w.id}>
                            {w.name} (Maks: {formatRupiah(maxAvailable, hide)})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                      Target Tanggal Tercapai
                    </label>
                    <input
                      type="date"
                      value={editTargetDate}
                      onChange={(e) => setEditTargetDate(e.target.value)}
                      className={`w-full p-3 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                    />
                  </div>
                </div>

                <label
                  htmlFor="editEmergencyCheckbox"
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    id="editEmergencyCheckbox"
                    checked={editIsEmergencyFund}
                    onChange={(e) => setEditIsEmergencyFund(e.target.checked)}
                    className="w-4 h-4 rounded-md cursor-pointer accent-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tandai sebagai Dana Darurat
                  </span>
                </label>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingGoal(null)}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 rounded-2xl ${accentBtn} text-xs font-bold shadow-2xs cursor-pointer transition-transform active:scale-95`}
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Konfirmasi Hapus Goal */}
      <AnimatePresence>
        {deletingGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 dark:border-white/[0.08] text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                  Hapus Target Goal?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Apakah Anda yakin ingin menghapus{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {deletingGoal.emoji} {deletingGoal.name}
                  </strong>
                  ? Dana yang sebelumnya dialokasikan akan kembali menjadi saldo bebas di dompet Anda.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingGoal(null)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition-transform active:scale-95 cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Detail Goal & Setor/Tarik Saldo */}
      <AnimatePresence>
        {selectedGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 dark:border-white/[0.08] max-h-[90vh] overflow-y-auto"
            >
              {(() => {
                const rawPct =
                  selectedGoal.targetAmount > 0
                    ? Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100)
                    : 0;
                const pct = Math.min(100, rawPct);
                const shortfall = Math.max(
                  0,
                  selectedGoal.targetAmount - selectedGoal.currentAmount
                );
                const smartMonthly = calculateSmartMonthlySaving(
                  selectedGoal.targetAmount,
                  selectedGoal.currentAmount,
                  selectedGoal.targetDate
                );
                const linkedWallet =
                  walletsWithBalance.find((w) => w.id === selectedGoal.walletId) ||
                  liquidWallets[0];

                return (
                  <>
                    {/* Header Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const g = selectedGoal;
                            setSelectedGoalId(null);
                            handleOpenEdit(g);
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5"
                          title="Ubah Goal"
                        >
                          <Pencil size={13} />
                          <span>Ubah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const g = selectedGoal;
                            setSelectedGoalId(null);
                            setDeletingGoal(g);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Hapus Goal"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedGoalId(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Goal Identity */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#1E222B] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-center text-3xl shrink-0">
                        {selectedGoal.emoji || '🎯'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white truncate">
                          {selectedGoal.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <WalletIcon size={12} className="shrink-0" />
                          <span>{linkedWallet?.name || 'Dompet Utama'}</span>
                          <span>·</span>
                          <span>Target {formatFullDateIndo(selectedGoal.targetDate)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Progress & Metrics Box */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] space-y-3 font-mono tabular-nums">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Saldo Terkumpul
                          </span>
                          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                            {formatRupiah(selectedGoal.currentAmount, hide)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Progres
                          </span>
                          <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-[#D4F826]">
                            {rawPct}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 100 ? 'bg-emerald-500' : accentProgressBar
                          } transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span className="font-sans">Target Nominal:</span>
                          <strong className="text-slate-900 dark:text-white">
                            {formatRupiah(selectedGoal.targetAmount, hide)}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span className="font-sans">Sisa Kekurangan:</span>
                          <strong className="text-slate-900 dark:text-white">
                            {formatRupiah(shortfall, hide)}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span className="font-sans">Saran Setoran Rutin:</span>
                          <strong className="text-emerald-600 dark:text-[#D4F826]">
                            {smartMonthly > 0
                              ? fmtCurrency(smartMonthly, { suffix: '/bulan' })
                              : 'Target Tercapai!'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Deposit / Withdraw Section */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Setor / Tarik Alokasi (Rp)
                        </label>
                        {linkedWallet && (
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                            Tersedia di {linkedWallet.name}:{' '}
                            <strong className="text-slate-800 dark:text-slate-200">
                              {formatRupiah(linkedWallet.availableBalance, hide)}
                            </strong>
                          </span>
                        )}
                      </div>

                      {/* Quick Preset Chips */}
                      {!selectedGoal.isLocked && (
                        <div className="flex items-center gap-1.5 flex-wrap font-mono tabular-nums">
                          {[100000, 250000, 500000, 1000000].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setDepositDelta(formatNominalInput(val))}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              +{val / 1000}rb
                            </button>
                          ))}
                        </div>
                      )}

                      <input
                        type="text"
                        inputMode="numeric"
                        value={depositDelta}
                        onChange={(e) => setDepositDelta(formatNominalInput(e.target.value))}
                        placeholder={
                          selectedGoal.isLocked
                            ? 'Buka kunci goal di bawah untuk mengubah saldo'
                            : 'Masukkan nominal, contoh: 250.000'
                        }
                        disabled={selectedGoal.isLocked}
                        className={`w-full p-3 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing} disabled:opacity-50`}
                      />

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          disabled={selectedGoal.isLocked}
                          onClick={() => handleAdjustGoalAmount('add')}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ArrowDownLeft size={14} />
                          <span>+ Setor Saldo</span>
                        </button>
                        <button
                          type="button"
                          disabled={selectedGoal.isLocked || selectedGoal.currentAmount <= 0}
                          onClick={() => handleAdjustGoalAmount('subtract')}
                          className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ArrowUpRight size={14} />
                          <span>- Tarik ke Dompet</span>
                        </button>
                      </div>
                    </div>

                    {/* Lock / Unlock Security Toggle */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3">
                      <div className="text-xs min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {selectedGoal.isLocked ? 'Saldo Goal Terkunci' : 'Kunci Keamanan Goal'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          {selectedGoal.isLocked
                            ? 'Buka kunci jika ingin menarik atau menambah saldo.'
                            : 'Kunci agar saldo tidak bisa ditarik tanpa sengaja.'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleLockGoal(selectedGoal.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                          selectedGoal.isLocked
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                            : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                        }`}
                      >
                        {selectedGoal.isLocked ? (
                          <>
                            <Unlock size={14} />
                            <span>Buka Kunci</span>
                          </>
                        ) : (
                          <>
                            <Lock size={14} />
                            <span>Kunci Saldo</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Emoji Picker Modal */}
      <EmojiPickerModal
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        selectedEmoji={emojiTarget === 'add' ? emoji : editEmoji}
        onSelect={handleSelectEmoji}
        title={emojiTarget === 'add' ? 'Pilih Ikon Goal' : 'Ubah Ikon Goal'}
      />
    </div>
  );
}
