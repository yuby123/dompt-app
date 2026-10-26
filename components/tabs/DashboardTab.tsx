'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart,
  Camera,
  Target,
  Landmark,
  CreditCard,
  TrendingUp,
  Sparkles,
  FileText,
  Eye,
  EyeOff,
  AlertCircle,
  Pencil,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  BookOpen,
  CalendarClock,
  ArrowUpRight,
  BarChart3,
  ShieldCheck,
  Bug,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../AppContext';
import { formatCompactRupiah, formatRupiah, formatFullDateIndo } from '@/lib/formatters';
import {
  getAdjacentPeriodDateStr,
  getBudgetPeriodInfo,
  isDateInBudgetPeriod,
  isSavingsExpense,
  parseLocalDay,
  resolveEffectivePeriodIncome,
} from '@/lib/budgetUtils';

export function DashboardTab() {
  const {
    settings,
    toggleHideBalance,
    dashboardSummary,
    setActiveTab,
    openScanModal,
    openAddTransaction,
    openEditTransaction,
    deleteTransaction,
    upcomingBills,
    transactionDetails,
    transactions,
    categories,
    debts,
    budgetConfig,
    activeYear,
    activeMonth,
    activeDay,
    setActiveDate,
    budgetPeriod,
    user,
    openLoginModal,
    isAdmin,
    managedUsers,
  } = useApp();

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmDeleteTxId) return;
    const handleOutsideClick = () => setConfirmDeleteTxId(null);
    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [confirmDeleteTxId]);

  const hide = settings.hideBalance;
  const userName = settings.userName || 'Trisna';

  // Quick greetings (hydrated on client to avoid server/client timezone mismatch)
  const greetingEmoji = React.useSyncExternalStore(
    () => () => {},
    () => {
      const currentHour = new Date().getHours();
      return currentHour >= 18 || currentHour < 5 ? '🌙' : currentHour >= 12 ? '☀️' : '🌅';
    },
    () => '☀️'
  );

  const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(activeYear, activeMonth, 1).getDay();
  // Monday-based offset (Mon=0..Sun=6)
  const startDayOffset = (firstDayOfWeek + 6) % 7;
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Default calendar selection to real today when viewing current month, otherwise activeDay
  const defaultCalendarDay = useMemo(() => {
    const now = new Date();
    if (now.getFullYear() === activeYear && now.getMonth() === activeMonth) {
      return now.getDate();
    }
    return Math.max(1, Math.min(daysInMonth, activeDay));
  }, [activeYear, activeMonth, activeDay, daysInMonth]);

  const currentMonthKey = `${activeYear}-${activeMonth}`;
  const [selectedDayState, setSelectedDayState] = useState<{ monthKey: string; day: number } | null>(
    null
  );
  const selectedCalendarDay =
    selectedDayState && selectedDayState.monthKey === currentMonthKey
      ? selectedDayState.day
      : defaultCalendarDay;
  const setSelectedCalendarDay = (day: number) => {
    setSelectedDayState({ monthKey: currentMonthKey, day });
  };

  // Today's real expense & income from context metrics
  const { todayIncome, todayExpense } = dashboardSummary;

  // Dynamic daily expenses & income map from transactions + standalone debt payments this month
  const { dailyExpensesMap, dailyIncomeMap } = useMemo(() => {
    const expMap: Record<number, number> = {};
    const incMap: Record<number, number> = {};
    const recordedTxIds = new Set<string>();
    const catMap = new Map(categories.map((c) => [c.id, c]));

    transactions.forEach((tx) => {
      recordedTxIds.add(tx.id);
      const d = parseLocalDay(tx.date);
      if (d.getFullYear() === activeYear && d.getMonth() === activeMonth) {
        const day = d.getDate();
        if (tx.type === 'expense') {
          const cat = tx.categoryId ? catMap.get(tx.categoryId) || null : null;
          if (!isSavingsExpense(tx, cat)) {
            expMap[day] = (expMap[day] || 0) + tx.amount;
          }
        } else if (tx.type === 'income') {
          const isLoan = Boolean(tx.note && /^pencairan utang:/i.test(tx.note.trim()));
          if (!isLoan) {
            incMap[day] = (incMap[day] || 0) + tx.amount;
          }
        }
      }
    });

    (debts || []).forEach((debt) => {
      if (debt.type !== 'payable') return;
      (debt.payments || []).forEach((p) => {
        if (p.transactionId && recordedTxIds.has(p.transactionId)) return;
        const pd = parseLocalDay(p.date);
        if (pd.getFullYear() === activeYear && pd.getMonth() === activeMonth) {
          const day = pd.getDate();
          expMap[day] = (expMap[day] || 0) + p.amount;
        }
      });
    });

    return { dailyExpensesMap: expMap, dailyIncomeMap: incMap };
  }, [transactions, debts, categories, activeYear, activeMonth]);

  // Transactions + standalone debt payments for the selected calendar day
  const { selectedDayTransactions, selectedDayDebtPayments } = useMemo(() => {
    if (!selectedCalendarDay) {
      return { selectedDayTransactions: [], selectedDayDebtPayments: [] };
    }
    const recordedTxIds = new Set(transactions.map((t) => t.id));
    const dayTxs = transactionDetails.filter((detail) => {
      const d = parseLocalDay(detail.transaction.date);
      return (
        d.getFullYear() === activeYear &&
        d.getMonth() === activeMonth &&
        d.getDate() === selectedCalendarDay
      );
    });

    const dayDebtPays: { id: string; debtName: string; amount: number; note?: string }[] = [];
    (debts || []).forEach((debt) => {
      if (debt.type !== 'payable') return;
      (debt.payments || []).forEach((p) => {
        if (p.transactionId && recordedTxIds.has(p.transactionId)) return;
        const pd = parseLocalDay(p.date);
        if (
          pd.getFullYear() === activeYear &&
          pd.getMonth() === activeMonth &&
          pd.getDate() === selectedCalendarDay
        ) {
          dayDebtPays.push({
            id: p.id || `${debt.id}-${p.date}`,
            debtName: debt.name,
            amount: p.amount,
            note: p.note,
          });
        }
      });
    });

    return { selectedDayTransactions: dayTxs, selectedDayDebtPayments: dayDebtPays };
  }, [transactionDetails, transactions, debts, activeYear, activeMonth, selectedCalendarDay]);

  const ID_MONTHS_UPPER = [
    'JANUARI',
    'FEBRUARI',
    'MARET',
    'APRIL',
    'MEI',
    'JUNI',
    'JULI',
    'AGUSTUS',
    'SEPTEMBER',
    'OKTOBER',
    'NOVEMBER',
    'DESEMBER',
  ];
  const monthLabel = `${ID_MONTHS_UPPER[activeMonth] || 'JANUARI'} ${activeYear}`;

  const handlePrevMonth = () => {
    const today = new Date();
    const prevMonthDate = new Date(activeYear, activeMonth - 1, 1);
    const y = prevMonthDate.getFullYear();
    const mIdx = prevMonthDate.getMonth();
    const m = String(mIdx + 1).padStart(2, '0');
    const isRealCurrentMonth = today.getFullYear() === y && today.getMonth() === mIdx;
    const dayNum = isRealCurrentMonth ? today.getDate() : 1;
    const dStr = String(dayNum).padStart(2, '0');
    setActiveDate(`${y}-${m}-${dStr}`);
    setSelectedDayState({ monthKey: `${y}-${mIdx}`, day: dayNum });
  };

  const handleNextMonth = () => {
    const today = new Date();
    const nextMonthDate = new Date(activeYear, activeMonth + 1, 1);
    const y = nextMonthDate.getFullYear();
    const mIdx = nextMonthDate.getMonth();
    const m = String(mIdx + 1).padStart(2, '0');
    const isRealCurrentMonth = today.getFullYear() === y && today.getMonth() === mIdx;
    const dayNum = isRealCurrentMonth ? today.getDate() : 1;
    const dStr = String(dayNum).padStart(2, '0');
    setActiveDate(`${y}-${m}-${dStr}`);
    setSelectedDayState({ monthKey: `${y}-${mIdx}`, day: dayNum });
  };

  const handleTodayMonth = () => {
    const today = new Date();
    const y = today.getFullYear();
    const mIdx = today.getMonth();
    const m = String(mIdx + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setActiveDate(`${y}-${m}-${d}`);
    setSelectedDayState({ monthKey: `${y}-${mIdx}`, day: today.getDate() });
  };

  // Format percentage helper so small positive values (< 1%) show 1 decimal instead of 0%
  const formatPctDisplay = (spent: number, limit: number): string => {
    if (spent <= 0) return '0%';
    if (limit <= 0) return '100%';
    const raw = (spent / limit) * 100;
    if (raw > 0 && raw < 1) {
      return `${raw.toFixed(1).replace('.', ',')}%`;
    }
    return `${Math.round(raw)}%`;
  };

  // Dynamic 50/30/20 percentages & nominal breakdown (supports 0% for any group & includes standalone debt payments)
  const {
    needsPct,
    wantsPct,
    savingsPct,
    needsCfgPct,
    wantsCfgPct,
    savingsBudgetCfgPct,
    needsBudget,
    wantsBudget,
    savingsBudget,
    nSpent,
    wSpent,
    sSpent,
  } = useMemo(() => {
    const { effectiveIncome: estIncome } = resolveEffectivePeriodIncome(
      budgetConfig,
      transactions,
      budgetPeriod
    );
    const nCfgPct = typeof budgetConfig?.needsPercent === 'number' ? budgetConfig.needsPercent : 50;
    const wCfgPct = typeof budgetConfig?.wantsPercent === 'number' ? budgetConfig.wantsPercent : 30;
    const sCfgPct =
      typeof budgetConfig?.savingsPercent === 'number' ? budgetConfig.savingsPercent : 20;

    const nLimit = Math.round((estIncome * nCfgPct) / 100);
    const wLimit = Math.round((estIncome * wCfgPct) / 100);
    const sLimit = Math.round((estIncome * sCfgPct) / 100);

    let needsTotal = 0;
    let wantsTotal = 0;
    let savingsTotal = 0;

    const catMap = new Map(categories.map((c) => [c.id, c]));
    const recordedTxIds = new Set<string>();

    transactions.forEach((tx) => {
      recordedTxIds.add(tx.id);
      const d = parseLocalDay(tx.date);
      if (isDateInBudgetPeriod(d, budgetPeriod)) {
        const cat = tx.categoryId ? catMap.get(tx.categoryId) || null : null;
        const group = isSavingsExpense(tx, cat)
          ? 'tabungan'
          : tx.budgetGroup || cat?.budgetGroup || 'kebutuhan';
        if (tx.type === 'expense') {
          if (group === 'kebutuhan') needsTotal += tx.amount;
          else if (group === 'keinginan') wantsTotal += tx.amount;
          else if (group === 'tabungan') savingsTotal += tx.amount;
          else needsTotal += tx.amount;
        } else if (tx.type === 'transfer' && group === 'tabungan') {
          savingsTotal += tx.amount;
        }
      }
    });

    (debts || []).forEach((debt) => {
      if (debt.type !== 'payable') return;
      (debt.payments || []).forEach((p) => {
        if (p.transactionId && recordedTxIds.has(p.transactionId)) return;
        const pd = parseLocalDay(p.date);
        if (isDateInBudgetPeriod(pd, budgetPeriod)) {
          needsTotal += p.amount;
        }
      });
    });

    return {
      needsPct:
        nLimit > 0
          ? Math.min(100, Math.round((needsTotal / nLimit) * 100))
          : needsTotal > 0
          ? 100
          : 0,
      wantsPct:
        wLimit > 0
          ? Math.min(100, Math.round((wantsTotal / wLimit) * 100))
          : wantsTotal > 0
          ? 100
          : 0,
      savingsPct:
        sLimit > 0
          ? Math.min(100, Math.round((savingsTotal / sLimit) * 100))
          : savingsTotal > 0
          ? 100
          : 0,
      needsCfgPct: nCfgPct,
      wantsCfgPct: wCfgPct,
      savingsBudgetCfgPct: sCfgPct,
      needsBudget: nLimit,
      wantsBudget: wLimit,
      savingsBudget: sLimit,
      nSpent: needsTotal,
      wSpent: wantsTotal,
      sSpent: savingsTotal,
    };
  }, [transactions, debts, budgetConfig, categories, budgetPeriod]);

  // Previous Period Comparison for Income & Expense Cards
  const prevPeriodComparison = useMemo(() => {
    const rawPayday = budgetConfig?.paydayDay || budgetConfig?.settings?.paydayDay || 1;
    const customPeriodCfg = {
      periodMode: budgetConfig?.periodMode || budgetConfig?.settings?.periodMode,
      customPeriodStart:
        budgetConfig?.customPeriodStart || budgetConfig?.settings?.customPeriodStart,
      customNextPayday: budgetConfig?.customNextPayday || budgetConfig?.settings?.customNextPayday,
    };
    const prevDateIso = getAdjacentPeriodDateStr(
      activeYear,
      activeMonth,
      activeDay,
      rawPayday,
      -1,
      customPeriodCfg
    );
    const prevDate = parseLocalDay(prevDateIso);
    const prevPeriod = getBudgetPeriodInfo(
      prevDate.getFullYear(),
      prevDate.getMonth(),
      prevDate.getDate(),
      rawPayday,
      customPeriodCfg
    );

    let prevIncome = 0;
    let prevExpense = 0;
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const recordedTxIds = new Set<string>();

    transactions.forEach((tx) => {
      recordedTxIds.add(tx.id);
      const d = parseLocalDay(tx.date);
      if (isDateInBudgetPeriod(d, prevPeriod)) {
        if (tx.type === 'income') {
          const isLoan = Boolean(tx.note && /^pencairan utang:/i.test(tx.note.trim()));
          if (!isLoan) prevIncome += tx.amount;
        } else if (tx.type === 'expense') {
          const cat = tx.categoryId ? catMap.get(tx.categoryId) || null : null;
          if (!isSavingsExpense(tx, cat)) {
            prevExpense += tx.amount;
          }
        }
      }
    });

    (debts || []).forEach((debt) => {
      if (debt.type !== 'payable') return;
      (debt.payments || []).forEach((p) => {
        if (p.transactionId && recordedTxIds.has(p.transactionId)) return;
        const pd = parseLocalDay(p.date);
        if (isDateInBudgetPeriod(pd, prevPeriod)) {
          prevExpense += p.amount;
        }
      });
    });

    const incDeltaPct =
      prevIncome > 0
        ? Math.round(((dashboardSummary.monthlyIncome - prevIncome) / prevIncome) * 100)
        : null;
    const expDeltaPct =
      prevExpense > 0
        ? Math.round(((dashboardSummary.monthlyExpense - prevExpense) / prevExpense) * 100)
        : null;

    return {
      prevIncome,
      prevExpense,
      incDeltaPct,
      expDeltaPct,
    };
  }, [
    transactions,
    debts,
    categories,
    budgetConfig,
    activeYear,
    activeMonth,
    activeDay,
    dashboardSummary.monthlyIncome,
    dashboardSummary.monthlyExpense,
  ]);

  // Dynamic top expense categories (including standalone debt payments, excluding savings transfers)
  const topExpenses = useMemo(() => {
    const catTotalMap = new Map<string, number>();
    const catInfoMap = new Map(categories.map((c) => [c.id, c]));
    const recordedTxIds = new Set<string>();

    transactions.forEach((tx) => {
      recordedTxIds.add(tx.id);
      if (tx.type === 'expense') {
        const d = parseLocalDay(tx.date);
        if (isDateInBudgetPeriod(d, budgetPeriod)) {
          const cat = tx.categoryId ? catInfoMap.get(tx.categoryId) || null : null;
          if (isSavingsExpense(tx, cat)) return;
          const key = tx.categoryId || 'cat-lainnya';
          catTotalMap.set(key, (catTotalMap.get(key) || 0) + tx.amount);
        }
      }
    });

    (debts || []).forEach((debt) => {
      if (debt.type !== 'payable') return;
      (debt.payments || []).forEach((p) => {
        if (p.transactionId && recordedTxIds.has(p.transactionId)) return;
        const pd = parseLocalDay(p.date);
        if (isDateInBudgetPeriod(pd, budgetPeriod)) {
          catTotalMap.set('cat-tagihan', (catTotalMap.get('cat-tagihan') || 0) + p.amount);
        }
      });
    });

    return Array.from(catTotalMap.entries())
      .map(([catId, amount]) => {
        const cat = catInfoMap.get(catId);
        return {
          id: catId,
          name: cat?.name || (catId === 'cat-tagihan' ? 'Cicilan & Tagihan' : 'Lainnya'),
          group: cat?.groupName || 'Kebutuhan',
          emoji: cat?.emoji || '💳',
          amount,
        };
      })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, debts, categories, budgetPeriod]);

  const budgetLimit = dashboardSummary.budgetLimit ?? 0;
  const budgetSpent = dashboardSummary.budgetSpent || 0;
  const remainingBudget = Math.max(0, budgetLimit - budgetSpent);
  const isOverTotalBudget = budgetLimit > 0 && budgetSpent > budgetLimit;

  // Dynamic SVG Donut Calculations for "Realisasi Budget" (circumference = 2 * PI * 38 = 238.76)
  const donutMetrics = useMemo(() => {
    const circumference = 2 * Math.PI * 38; // 238.761
    const baseTotal = Math.max(budgetLimit, nSpent + wSpent, 1);
    const needsRatio = Math.min(1, nSpent / baseTotal);
    const wantsRatio = Math.min(1 - needsRatio, wSpent / baseTotal);

    const needsArc = Number((needsRatio * circumference).toFixed(2));
    const wantsArc = Number((wantsRatio * circumference).toFixed(2));
    const wantsOffset = -needsArc;

    return {
      circumference: Number(circumference.toFixed(2)),
      needsArc,
      wantsArc,
      wantsOffset,
      usedPctStr: budgetLimit > 0 ? formatPctDisplay(budgetSpent, budgetLimit) : '0%',
    };
  }, [budgetLimit, budgetSpent, nSpent, wSpent]);

  const menuItems = [
    { id: 'scan', label: 'Scan', icon: Camera, action: () => openScanModal() },
    { id: 'budget', label: 'Budget', icon: PieChart, action: () => setActiveTab('budget') },
    { id: 'goals', label: 'Goals', icon: Target, action: () => setActiveTab('goals') },
    { id: 'aset', label: 'Aset', icon: Landmark, action: () => setActiveTab('assets') },
    {
      id: 'subscriptions',
      label: 'Tagihan',
      icon: CalendarClock,
      action: () => setActiveTab('subscriptions'),
    },
    { id: 'utang', label: 'Utang', icon: CreditCard, action: () => setActiveTab('debt') },
    { id: 'investasi', label: 'Investasi', icon: TrendingUp, action: () => setActiveTab('invest') },
    {
      id: 'analytics',
      label: 'Analisis',
      icon: BarChart3,
      action: () => setActiveTab('analytics'),
    },
    {
      id: 'ai-advisor',
      label: 'AI Advisor',
      icon: Sparkles,
      action: () => setActiveTab('ai-advisor'),
    },
    { id: 'laporan', label: 'Laporan', icon: FileText, action: () => setActiveTab('reports') },
  ];

  const SHORT_MONTHS_ID = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  const activePeriodLabel = budgetPeriod.periodShortLabel;
  const periodCurrentDay = budgetPeriod.currentDayOfPeriod;
  const periodTotalDays = budgetPeriod.totalDays;

  const dailyCapacityPct =
    dashboardSummary.dailyBudgetQuota > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (dashboardSummary.dailyBudgetRemaining / dashboardSummary.dailyBudgetQuota) * 100
            )
          )
        )
      : 0;

  const dayRingPct = Math.min(100, Math.round((periodCurrentDay / (periodTotalDays || 31)) * 100));

  const todayNonDailyTotal =
    (dashboardSummary.todayGroceryExpense || 0) +
    (dashboardSummary.todayNonDailyExpense || 0) +
    (dashboardSummary.todayFixedExpense || 0);

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-12">
      {/* 1. Header Greeting + Active Period Control */}
      <div className="pt-1 px-0.5 flex items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-[28px] font-black text-gray-900 dark:text-white tracking-tight leading-none truncate">
              Dashboard
            </h1>
            {user && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap shrink-0">
                · Cloud
              </span>
            )}
          </div>
          <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap truncate">
            Halo, {userName} {greetingEmoji}
          </p>
        </div>

        {/* Active Period Control */}
        <button
          type="button"
          onClick={() => setActiveTab('budget')}
          title="Atur Periode & Gajian"
          className="flex items-center gap-2.5 bg-white dark:bg-[#16181D] hover:border-[#D4F826] border border-gray-200/80 dark:border-gray-800 rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2 shadow-2xs transition-colors cursor-pointer text-left shrink-0"
        >
          <div className="w-7 h-7 rounded-xl bg-[#D4F826]/25 flex items-center justify-center text-[#658500] dark:text-[#D4F826] shrink-0">
            <CalendarClock size={14} strokeWidth={2.4} />
          </div>
          <div className="whitespace-nowrap">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block leading-none">
              {budgetPeriod.isCustomFlexiblePeriod
                ? `Fleksibel (${budgetPeriod.totalDays}h)`
                : budgetPeriod.paydayDay > 1
                ? `Gajian Tgl ${budgetPeriod.paydayDay}`
                : 'Periode'}
            </span>
            <span className="text-xs font-extrabold text-gray-900 dark:text-white mt-0.5 block leading-none">
              {activePeriodLabel}
            </span>
          </div>
        </button>
      </div>

      {/* Multi-user Cloud Sync Prompt Banner if in Guest mode */}
      {!user && (
        <div className="lg:hidden bg-white dark:bg-[#16181D] border border-emerald-500/25 dark:border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#D4F826] text-black flex items-center justify-center shrink-0 font-black text-sm">
              ☁️
            </div>
            <div className="text-xs min-w-0">
              <p className="font-extrabold text-gray-900 dark:text-white truncate">
                Sinkronisasi Cloud
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-[11px] truncate">
                Masuk akun agar data tersimpan aman.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openLoginModal}
            className="px-3 py-1.5 rounded-xl bg-[#D4F826] hover:bg-[#cbf11e] text-black font-extrabold text-xs shrink-0 transition-transform active:scale-95 cursor-pointer"
          >
            Masuk
          </button>
        </div>
      )}

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
        {/* 2. Kuota Harian (Full-Width Dark Hero Banner) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="order-1 lg:order-1 lg:col-span-12 relative overflow-hidden rounded-[28px] lg:rounded-[32px] p-5 sm:p-6 lg:px-8 lg:py-7 bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] text-white shadow-xl border border-white/10 flex flex-col justify-between"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-[#8B5CF6]/15 blur-3xl pointer-events-none" />
          <div
            className={`absolute -bottom-24 -left-16 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
              settings.accentColor === 'orange'
                ? 'bg-[#FF6B2B]/15'
                : settings.accentColor === 'pink'
                ? 'bg-[#FFA4A4]/15'
                : 'bg-[#D4F826]/15'
            }`}
          />

          {/* Top Row */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0 flex-wrap">
              <span className="font-extrabold text-[#D4F826] whitespace-nowrap shrink-0">
                Kuota Harian
              </span>
              <span className="text-slate-500 shrink-0">·</span>
              <span className="font-medium text-slate-300 truncate">Jatah Hari Ini</span>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                title="Ubah logika Surplus & Defisit Kuota Harian di Pengaturan"
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors cursor-pointer whitespace-nowrap"
              >
                {dashboardSummary.dailyOverbudget
                  ? dashboardSummary.dailyDeficitMode === 'strict_penalty'
                    ? 'Defisit: Strict Penalty'
                    : 'Defisit: Spread Deficit'
                  : dashboardSummary.dailySurplusMode === 'save_weekend'
                  ? 'Surplus: Save Weekend'
                  : dashboardSummary.dailySurplusMode === 'averaging'
                  ? 'Surplus: Averaging'
                  : 'Surplus: Rollover'}
              </button>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono font-semibold text-slate-300 tabular-nums whitespace-nowrap">
                Hari {periodCurrentDay}/{periodTotalDays} · {budgetPeriod.daysRemainingUntilPayday}h lagi
              </span>
              <button
                type="button"
                onClick={toggleHideBalance}
                className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={hide ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
              >
                {hide ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
          </div>

          {/* Middle Row: Big Monospace Daily Remaining + Right 3 KPI Cards */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mt-4">
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <div className="text-3xl sm:text-5xl lg:text-[48px] font-mono font-bold tracking-tight tabular-nums text-white leading-none">
                  {hide ? 'Rp ••••••' : formatRupiah(dashboardSummary.dailyBudgetRemaining, false)}
                </div>
                {dashboardSummary.dailyBudgetQuota > 0 && (
                  <span className="text-xs sm:text-sm font-medium text-slate-400 tabular-nums">
                    / {formatRupiah(dashboardSummary.dailyBudgetQuota, hide)}
                  </span>
                )}
              </div>

              {dashboardSummary.dailyOverbudget ? (
                <p className="text-xs text-rose-400 font-semibold pt-0.5 tabular-nums">
                  Lewat +{formatRupiah(dashboardSummary.dailyOverbudgetAmount, hide)} (
                  {dashboardSummary.dailyDeficitMode === 'strict_penalty'
                    ? 'Strict Penalty'
                    : 'Spread Deficit'}
                  )
                  {budgetPeriod.daysRemainingUntilPayday > 1 && (
                    <span className="text-amber-300 font-medium">
                      {' '}
                      · Kuota besok ~{formatRupiah(dashboardSummary.tomorrowDailyQuota, hide)}/hr
                    </span>
                  )}
                </p>
              ) : dashboardSummary.dailyBudgetQuota > 0 &&
                dashboardSummary.remainingVariableBudget <= 0 ? (
                <p className="text-xs text-amber-300 font-medium pt-0.5">
                  Saldo pos harian periode ini habis
                </p>
              ) : (
                <p className="text-xs text-slate-400 font-medium pt-0.5 tabular-nums">
                  Saldo pos harian:{' '}
                  <strong className="text-slate-200">
                    {formatRupiah(dashboardSummary.remainingVariableBudget, hide)}
                  </strong>
                  {budgetPeriod.daysRemainingUntilPayday > 1 &&
                    dashboardSummary.dailyBudgetQuota > 0 && (
                      <span>
                        {' '}
                        · Besok:{' '}
                        <strong className="text-[#D4F826]">
                          ~{formatRupiah(dashboardSummary.tomorrowDailyQuota, hide)}/hr
                        </strong>
                      </span>
                    )}
                  {dashboardSummary.dailySurplusMode === 'save_weekend' &&
                    dashboardSummary.weekendBudgetPool > 0 && (
                      <span>
                        {' '}
                        · Kuota Weekend:{' '}
                        <strong className="text-emerald-300">
                          {formatRupiah(dashboardSummary.weekendBudgetPool, hide)}
                        </strong>
                      </span>
                    )}
                  {todayNonDailyTotal > 0 && (
                    <span>
                      {' '}
                      · Non-kuota:{' '}
                      <strong className="text-amber-300">
                        {formatRupiah(todayNonDailyTotal, hide)}
                      </strong>
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Right: 3 Symmetrical KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
              <div
                onClick={() => setActiveTab('wallets')}
                className="col-span-2 sm:col-span-1 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 p-3.5 sm:px-4 sm:py-3 min-w-0 sm:min-w-[160px] cursor-pointer transition-colors"
                title="Kelola dompet"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    Saldo Dompet
                  </span>
                  <Wallet size={12} className="text-slate-400 shrink-0" />
                </div>
                <div className="text-base sm:text-lg font-mono font-bold text-white mt-1 tabular-nums truncate">
                  {hide ? 'Rp ••••••' : formatRupiah(dashboardSummary.totalBalance, false)}
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 sm:px-4 sm:py-3 min-w-0 sm:min-w-[150px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Masuk Hari Ini
                </span>
                <div className="text-sm sm:text-lg font-mono font-bold text-[#D4F826] mt-1 tabular-nums truncate">
                  {hide ? 'Rp ••••••' : `+${formatRupiah(todayIncome, false)}`}
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 sm:px-4 sm:py-3 min-w-0 sm:min-w-[150px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Keluar Hari Ini
                </span>
                <div className="text-sm sm:text-lg font-mono font-bold text-[#FB7185] mt-1 tabular-nums truncate">
                  {hide ? 'Rp ••••••' : `-${formatRupiah(todayExpense, false)}`}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Section: Kapasitas Kuota Harian */}
          <div className="relative z-10 mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5 tabular-nums">
              <span className="text-slate-400 font-medium">
                Terpakai {formatRupiah(dashboardSummary.todayVariableExpense, hide)}
              </span>
              <span className="text-white font-bold">Sisa {dailyCapacityPct}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  dashboardSummary.dailyOverbudget
                    ? 'bg-[#FB7185]'
                    : settings.accentColor === 'orange'
                    ? 'bg-gradient-to-r from-[#FF6B00] via-[#F59E0B] to-[#EC4899]'
                    : settings.accentColor === 'pink'
                    ? 'bg-gradient-to-r from-[#FFA4A4] via-[#F43F5E] to-[#A855F7]'
                    : 'bg-gradient-to-r from-[#D4F826] via-[#8B5CF6] to-[#38BDF8]'
                }`}
                style={{ width: `${dailyCapacityPct}%` }}
              />
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="relative z-10 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 mt-4">
            <button
              type="button"
              onClick={() => openAddTransaction('expense')}
              className="h-10 sm:h-11 px-4 sm:px-5 rounded-2xl bg-[#D4F826] hover:bg-[#c8ed1d] text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus size={15} strokeWidth={2.6} className="shrink-0" />
              <span>Catat Transaksi</span>
            </button>

            <button
              type="button"
              onClick={() => openScanModal()}
              className="h-10 sm:h-11 px-3.5 sm:px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-[#D4F826]/30 text-[#D4F826] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Scan Struk / Screenshot"
            >
              <Camera size={15} strokeWidth={2.4} className="shrink-0" />
              <span>Scan Struk</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className="col-span-2 sm:col-span-1 h-10 sm:h-11 px-4 sm:px-5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Atur Budget</span>
              <ArrowUpRight size={15} className="text-slate-400 shrink-0" />
            </button>
          </div>
        </motion.div>

        {/* 3. Menu Pintasan (Mobile Only - Symmetrical 5x2 Grid) */}
        <div className="order-2 lg:hidden bg-white dark:bg-[#16181D] rounded-[28px] p-4 sm:p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Pintasan</h3>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="text-[11px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={11} />
              <span>Pengaturan</span>
            </button>
          </div>

          <div className="grid grid-cols-5 gap-y-3.5 gap-x-2 text-center">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className="flex flex-col items-center justify-start gap-1.5 group cursor-pointer min-w-0"
                >
                  <div className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 flex items-center justify-center text-gray-800 dark:text-gray-200 group-hover:scale-105 group-hover:border-[#D4F826] transition-all shrink-0">
                    <Icon size={19} strokeWidth={2.1} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 leading-tight truncate w-full">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className="w-full py-2 px-3 rounded-xl bg-[#D4F826] hover:bg-[#c8ec1c] text-black flex items-center justify-between text-xs font-extrabold transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck size={14} strokeWidth={2.5} className="shrink-0" />
                  <span className="truncate">Panel Admin</span>
                </div>
                <span className="text-[10px] font-mono font-bold tabular-nums">
                  {managedUsers.filter((u) => u.status === 'pending').length} Pending
                </span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('feedback')}
                className="py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-[#D4F826]/20 dark:hover:bg-[#D4F826]/15 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Bug size={13} className="text-rose-500 shrink-0" />
                  <span className="truncate">Masukan</span>
                </div>
                <ChevronRight size={13} className="text-gray-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tutorial')}
                className="py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-[#D4F826]/20 dark:hover:bg-[#D4F826]/15 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <BookOpen size={13} className="text-lime-600 dark:text-[#D4F826] shrink-0" />
                  <span className="truncate">Panduan</span>
                </div>
                <ChevronRight size={13} className="text-gray-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Porsi Anggaran (Full-width horizontal card) */}
        <div className="order-3 lg:order-2 lg:col-span-12 bg-white dark:bg-[#16181D] rounded-[28px] lg:rounded-[32px] p-5 lg:px-7 lg:py-5 shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8">
          {/* Left: Ring + Title */}
          <div className="flex items-center justify-between lg:justify-start gap-4 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="relative w-13 h-13 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="transparent"
                    stroke="#E5E7EB"
                    strokeWidth="5"
                    className="dark:stroke-gray-800"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="transparent"
                    stroke="#A594F9"
                    strokeWidth="5"
                    strokeDasharray="150.8"
                    strokeDashoffset={150.8 - (dayRingPct / 100) * 150.8}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[7px] font-extrabold uppercase text-gray-400 leading-none">
                    HARI
                  </span>
                  <span className="text-xs font-black text-gray-900 dark:text-white leading-tight tabular-nums">
                    {periodCurrentDay}
                  </span>
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white">
                  Porsi Anggaran
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 tabular-nums">
                  {activePeriodLabel} · Hari {periodCurrentDay}/{periodTotalDays}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-[#D4F826] hover:text-black dark:hover:bg-[#D4F826] dark:hover:text-black text-[11px] font-bold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <BarChart3 size={13} className="shrink-0" />
              <span>Analisis</span>
            </button>
          </div>

          {/* Right: 3 Wide Horizontal Bars */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
            {/* Kebutuhan */}
            <div
              onClick={() => setActiveTab('budget')}
              className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80 hover:border-violet-400/50 transition-colors cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#8B5CF6] text-[11px] uppercase tracking-wider">
                  Kebutuhan ({needsCfgPct}%)
                </span>
                <span className="font-black text-gray-900 dark:text-white text-xs tabular-nums">
                  {formatPctDisplay(nSpent, needsBudget)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-200/80 dark:bg-gray-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    nSpent > needsBudget ? 'bg-rose-500' : 'bg-[#A78BFA]'
                  }`}
                  style={{ width: `${needsPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">
                <span className="truncate">
                  {formatRupiah(nSpent, hide)} / {formatRupiah(needsBudget, hide)}
                </span>
                <span
                  className={`shrink-0 ml-1 ${
                    nSpent > needsBudget
                      ? 'text-rose-500 font-bold'
                      : needsPct >= 85
                      ? 'text-amber-500 font-bold'
                      : 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  }`}
                >
                  {nSpent > needsBudget
                    ? 'Lewat'
                    : needsCfgPct === 0
                    ? 'Porsi 0%'
                    : needsPct >= 85
                    ? 'Hampir penuh'
                    : 'Aman'}
                </span>
              </div>
            </div>

            {/* Keinginan */}
            <div
              onClick={() => setActiveTab('budget')}
              className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80 hover:border-orange-400/50 transition-colors cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#F97316] text-[11px] uppercase tracking-wider">
                  Keinginan ({wantsCfgPct}%)
                </span>
                <span className="font-black text-gray-900 dark:text-white text-xs tabular-nums">
                  {formatPctDisplay(wSpent, wantsBudget)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-200/80 dark:bg-gray-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    wSpent > wantsBudget ? 'bg-rose-500' : 'bg-[#FB923C]'
                  }`}
                  style={{ width: `${wantsPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">
                <span className="truncate">
                  {formatRupiah(wSpent, hide)} / {formatRupiah(wantsBudget, hide)}
                </span>
                <span
                  className={`shrink-0 ml-1 ${
                    wSpent > wantsBudget
                      ? 'text-rose-500 font-bold'
                      : wantsPct >= 85
                      ? 'text-amber-500 font-bold'
                      : 'text-gray-400 font-semibold'
                  }`}
                >
                  {wSpent > wantsBudget
                    ? 'Lewat'
                    : wantsCfgPct === 0
                    ? 'Porsi 0%'
                    : wantsPct >= 85
                    ? 'Hampir penuh'
                    : 'Aman'}
                </span>
              </div>
            </div>

            {/* Tabungan */}
            <div
              onClick={() => setActiveTab('budget')}
              className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80 hover:border-sky-400/50 transition-colors cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#38BDF8] text-[11px] uppercase tracking-wider">
                  Tabungan ({savingsBudgetCfgPct}%)
                </span>
                <span className="font-black text-gray-900 dark:text-white text-xs tabular-nums">
                  {formatPctDisplay(sSpent, savingsBudget)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-200/80 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#38BDF8] transition-all duration-300"
                  style={{ width: `${savingsPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">
                <span className="truncate">
                  {formatRupiah(sSpent, hide)} / {formatRupiah(savingsBudget, hide)}
                </span>
                <span className="text-sky-500 dark:text-sky-400 font-semibold shrink-0 ml-1">
                  {savingsBudgetCfgPct === 0 && sSpent === 0
                    ? 'Porsi 0%'
                    : savingsPct >= 100
                    ? 'Tercapai'
                    : sSpent > 0
                    ? 'Berjalan'
                    : 'Belum ada'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Kalender Aktivitas (Left 6 Cols on Desktop) */}
        <div className="order-4 lg:order-3 lg:col-span-6 bg-white dark:bg-[#16181D] rounded-[28px] lg:rounded-[32px] p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white">
                Kalender Aktivitas
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">
                  {monthLabel}
                </span>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-0.5 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer rounded"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-0.5 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer rounded"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleTodayMonth}
                className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className="text-xs font-bold text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-0.5 cursor-pointer ml-1"
              >
                <span>Analisis</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 text-center text-[10px] font-extrabold text-gray-400 pt-0.5">
            <span>SN</span>
            <span>SL</span>
            <span>RB</span>
            <span>KM</span>
            <span>JM</span>
            <span>SB</span>
            <span>MG</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 lg:gap-2">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-11 lg:h-13" />;
              }

              const exp = dailyExpensesMap[day] || 0;
              const inc = dailyIncomeMap[day] || 0;
              const isSelected = selectedCalendarDay === day;
              const hasActivity = exp > 0 || inc > 0;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => setSelectedCalendarDay(day)}
                  className={`h-11 lg:h-13 rounded-xl flex flex-col justify-between p-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#ECFCCB] dark:bg-[#D4F826]/25 ring-2 ring-[#D4F826] font-bold'
                      : hasActivity
                      ? 'bg-[#F4FDE1] dark:bg-[#D4F826]/10 hover:bg-[#ECFCCB]'
                      : 'bg-gray-50/70 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[10px] text-gray-700 dark:text-gray-300 font-bold leading-none tabular-nums">
                      {day}
                    </span>
                    {inc > 0 && exp > 0 && (
                      <span className="text-[7px] font-black text-emerald-500 leading-none tabular-nums">
                        +
                      </span>
                    )}
                  </div>
                  {exp > 0 ? (
                    <span className="text-[8px] font-bold text-rose-500 dark:text-rose-400 self-end tabular-nums leading-none truncate max-w-full">
                      {hide
                        ? '-•••'
                        : `-${formatCompactRupiah(exp).replace('+', '').replace('-', '')}`}
                    </span>
                  ) : inc > 0 ? (
                    <span className="text-[8px] font-black text-emerald-500 self-end tabular-nums leading-none truncate max-w-full">
                      {hide
                        ? '+•••'
                        : `+${formatCompactRupiah(inc).replace('+', '').replace('-', '')}`}
                    </span>
                  ) : (
                    <span className="text-[8px] text-transparent select-none self-end">-</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day summary and transaction breakdown */}
          {selectedCalendarDay && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
              <div className="px-0.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-gray-600 dark:text-gray-400 font-bold">
                  {selectedCalendarDay} {SHORT_MONTHS_ID[activeMonth]}
                </span>
                <div className="flex items-center gap-2.5 tabular-nums">
                  {(dailyIncomeMap[selectedCalendarDay] || 0) > 0 && (
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      +{formatRupiah(dailyIncomeMap[selectedCalendarDay] || 0, hide)}
                    </span>
                  )}
                  <span className="font-extrabold text-rose-500 dark:text-rose-400">
                    -{formatRupiah(dailyExpensesMap[selectedCalendarDay] || 0, hide)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const dateStr = `${activeYear}-${String(activeMonth + 1).padStart(
                        2,
                        '0'
                      )}-${String(selectedCalendarDay).padStart(2, '0')}`;
                      openAddTransaction('expense', dateStr);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-[#D4F826] text-black font-extrabold text-[10px] hover:bg-[#c6ec15] transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus size={11} strokeWidth={3} />
                    <span>Catat</span>
                  </button>
                </div>
              </div>

              {selectedDayTransactions.length > 0 || selectedDayDebtPayments.length > 0 ? (
                <div className="space-y-1.5 pt-0.5 max-h-[200px] overflow-y-auto pr-1">
                  {selectedDayTransactions.map((detail) => {
                    const { transaction, wallet, category } = detail;
                    const isExpense = transaction.type === 'expense';
                    const isIncome = transaction.type === 'income';

                    return (
                      <div
                        key={transaction.id}
                        onClick={() => openEditTransaction(detail)}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer group border border-black/5 dark:border-white/5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-700 shadow-2xs flex items-center justify-center text-sm shrink-0">
                            {category?.emoji || (isIncome ? '💰' : '💳')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {transaction.note || category?.name || 'Transaksi'}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                              {wallet.name} ·{' '}
                              {category?.name || (isIncome ? 'Pemasukan' : 'Transfer')}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <span
                            className={`text-xs font-black tabular-nums ${
                              isExpense
                                ? 'text-rose-500 dark:text-rose-400'
                                : isIncome
                                ? 'text-emerald-500 dark:text-emerald-400'
                                : 'text-blue-500 dark:text-blue-400'
                            }`}
                          >
                            {isExpense ? '-' : isIncome ? '+' : ''}
                            {formatRupiah(transaction.amount, hide)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {selectedDayDebtPayments.map((dp) => (
                    <div
                      key={dp.id}
                      onClick={() => setActiveTab('debt')}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer border border-black/5 dark:border-white/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-700 shadow-2xs flex items-center justify-center text-sm shrink-0">
                          💳
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            Cicilan {dp.debtName}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                            {dp.note || 'Pembayaran Utang'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-rose-500 dark:text-rose-400 tabular-nums shrink-0 ml-2">
                        -{formatRupiah(dp.amount, hide)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 px-3 text-center bg-gray-50/60 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800/80 text-xs text-gray-400">
                  Belum ada transaksi
                </div>
              )}
            </div>
          )}
        </div>

        {/* 6. Transaksi Terbaru (Right 6 Cols on Desktop) */}
        <div className="order-5 lg:order-4 lg:col-span-6 bg-white dark:bg-[#16181D] rounded-[28px] lg:rounded-[32px] p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white">
                Transaksi Terbaru
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-bold text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
              >
                <span>Semua</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {transactionDetails.length === 0 ? (
              <div className="py-12 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 space-y-3">
                <p className="text-xs text-gray-400">Belum ada transaksi tercatat</p>
                <button
                  type="button"
                  onClick={() => openAddTransaction('expense')}
                  className="px-4 py-2 rounded-xl bg-[#D4F826] text-black text-xs font-extrabold cursor-pointer hover:bg-[#c6ec15]"
                >
                  + Catat Transaksi
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {transactionDetails.slice(0, 6).map((detail) => {
                  const { transaction, wallet, category, transferWallet } = detail;
                  const isExpanded = selectedTxId === transaction.id;
                  const isExpense = transaction.type === 'expense';
                  const isIncome = transaction.type === 'income';
                  const isTransfer = transaction.type === 'transfer';

                  return (
                    <div
                      key={transaction.id}
                      className="py-2.5 first:pt-1 last:pb-1 hover:bg-gray-50/40 dark:hover:bg-gray-800/20 transition-all cursor-pointer rounded-xl px-1.5"
                      onClick={() => {
                        setSelectedTxId(isExpanded ? null : transaction.id);
                        setConfirmDeleteTxId(null);
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-2xl text-base flex items-center justify-center shrink-0 ${
                              isIncome
                                ? 'bg-emerald-50 dark:bg-emerald-950/40'
                                : isTransfer
                                ? 'bg-sky-50 dark:bg-sky-950/40'
                                : 'bg-rose-50 dark:bg-[#2B1920]'
                            }`}
                          >
                            {category?.emoji || (isTransfer ? '🔄' : isIncome ? '💰' : '☕')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs lg:text-sm font-bold text-gray-900 dark:text-white truncate">
                              {transaction.note ||
                                category?.name ||
                                (isTransfer ? 'Transfer Dompet' : 'Transaksi')}
                            </p>
                            <p className="text-[10px] lg:text-[11px] text-gray-400 mt-0.5 truncate">
                              {wallet.name} · {formatFullDateIndo(transaction.date)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-xs lg:text-sm font-black tabular-nums ${
                              isExpense
                                ? 'text-gray-900 dark:text-white'
                                : isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {isExpense ? '-' : isIncome ? '+' : ''}
                            {hide ? 'Rp •••••••' : formatRupiah(transaction.amount, false)}
                          </span>
                        </div>
                      </div>

                      {/* Inline expansion on click */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                            <span>
                              Dompet:{' '}
                              <strong className="text-gray-800 dark:text-gray-200">
                                {wallet.name}
                              </strong>
                            </span>
                            <span>
                              {isTransfer
                                ? `Ke: ${transferWallet?.name || 'Dompet Tujuan'}`
                                : `${category?.emoji || ''} ${category?.name || 'Lainnya'}`}
                            </span>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTransaction(detail);
                              }}
                              className="flex-1 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Pencil size={12} />
                              <span>Ubah</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirmDeleteTxId === transaction.id) {
                                  deleteTransaction(transaction.id);
                                  setConfirmDeleteTxId(null);
                                  setSelectedTxId(null);
                                } else {
                                  setConfirmDeleteTxId(transaction.id);
                                }
                              }}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                                confirmDeleteTxId === transaction.id
                                  ? 'bg-red-600 text-white'
                                  : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100'
                              }`}
                            >
                              <Trash2 size={12} />
                              <span>
                                {confirmDeleteTxId === transaction.id ? 'Yakin?' : 'Hapus'}
                              </span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 7. Row 3: 3 Equal Columns (Pemasukan, Pengeluaran, Dana Darurat) */}
        {/* Col 1: Pemasukan */}
        <div className="order-6 lg:order-6 lg:col-span-4 bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Pemasukan · {activePeriodLabel}
            </span>
            <div className="text-2xl lg:text-[26px] font-black text-gray-900 dark:text-white mt-1.5 tabular-nums truncate">
              {formatRupiah(dashboardSummary.monthlyIncome, hide)}
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {prevPeriodComparison.incDeltaPct !== null ? (
              <span>
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {prevPeriodComparison.incDeltaPct >= 0 ? '+' : ''}
                  {prevPeriodComparison.incDeltaPct}%
                </strong>{' '}
                vs periode lalu
              </span>
            ) : dashboardSummary.monthlyIncome > 0 ? (
              <span>
                Kas bersih:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(Math.max(0, dashboardSummary.netCashflow), hide)}
                </strong>
              </span>
            ) : (
              <span>Belum ada pemasukan</span>
            )}
          </div>
        </div>

        {/* Col 2: Pengeluaran */}
        <div className="order-7 lg:order-7 lg:col-span-4 bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Pengeluaran · {activePeriodLabel}
            </span>
            <div className="text-2xl lg:text-[26px] font-black text-gray-900 dark:text-white mt-1.5 tabular-nums truncate">
              {formatRupiah(dashboardSummary.monthlyExpense, hide)}
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {budgetLimit > 0 ? (
              <span>
                <strong className="text-rose-500 dark:text-rose-400">
                  {formatPctDisplay(dashboardSummary.monthlyExpense, budgetLimit)}
                </strong>{' '}
                dari budget {formatRupiah(budgetLimit, hide)}
              </span>
            ) : prevPeriodComparison.expDeltaPct !== null ? (
              <span>
                <strong className="text-rose-500 dark:text-rose-400">
                  {prevPeriodComparison.expDeltaPct >= 0 ? '+' : ''}
                  {prevPeriodComparison.expDeltaPct}%
                </strong>{' '}
                vs periode lalu
              </span>
            ) : (
              <span>Belum ada pengeluaran</span>
            )}
          </div>
        </div>

        {/* Col 3: Dana Darurat */}
        <div
          onClick={() => setActiveTab('analytics')}
          className="order-8 lg:order-8 lg:col-span-4 bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 hover:border-amber-400/50 transition-colors cursor-pointer flex flex-col justify-between space-y-2"
          title="Lihat Skor Kesehatan Finansial"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <AlertCircle size={13} />
              <span>Dana Darurat</span>
            </div>
            <ArrowUpRight size={14} className="text-gray-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-[26px] font-black text-gray-900 dark:text-white tabular-nums leading-none">
              {dashboardSummary.emergencyFundRunwayMonths}
            </span>
            <span className="text-xs font-bold text-gray-400">bln bertahan</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                dashboardSummary.emergencyFundRunwayMonths >= 6
                  ? 'bg-emerald-500'
                  : dashboardSummary.emergencyFundRunwayMonths >= 3
                  ? 'bg-sky-400'
                  : 'bg-amber-400'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.round((dashboardSummary.emergencyFundRunwayMonths / 6) * 100)
                )}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium tabular-nums truncate">
            Likuid {formatRupiah(dashboardSummary.liquidAssetsTotal, hide)} · Target 6 bln
          </p>
        </div>

        {/* 8. Row 4: Tagihan Mendatang (lg:col-span-12) */}
        <div className="order-9 lg:order-9 lg:col-span-12 bg-[#0E0F12] rounded-[28px] lg:rounded-[32px] p-5 lg:p-6 text-white shadow-xl border border-white/5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={17} className="text-[#D4F826]" />
              <h3 className="text-sm lg:text-base font-extrabold text-white">Tagihan Mendatang</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('subscriptions')}
              className="text-xs font-bold text-gray-400 hover:text-[#D4F826] flex items-center gap-0.5 cursor-pointer transition-colors"
            >
              <span>Kelola</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {upcomingBills.length === 0 ? (
            <div className="py-4 px-4 bg-white/[0.04] rounded-2xl border border-dashed border-white/10 text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Semua tagihan periode ini lunas atau belum terjadwal</span>
              <button
                type="button"
                onClick={() => setActiveTab('subscriptions')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer transition-colors shrink-0"
              >
                + Tambah Tagihan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {upcomingBills.map((bill) => (
                <div
                  key={bill.id}
                  onClick={() => setActiveTab('subscriptions')}
                  className="bg-[#1A1C20] hover:bg-[#21242B] rounded-2xl p-3.5 sm:p-4 border border-white/[0.06] hover:border-[#D4F826]/40 space-y-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xl leading-none">{bill.iconEmoji}</span>
                    <span className="text-[10px] text-gray-400 font-semibold tabular-nums">
                      Tgl {bill.dueDate}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">{bill.name}</p>
                  <span className="text-xs lg:text-sm font-black text-[#D4F826] tabular-nums block truncate">
                    {formatRupiah(bill.amount, hide)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 9. Row 5: Pengeluaran Terbesar (lg:col-span-6) & Realisasi Budget (lg:col-span-6) */}
        {/* Left Half: Pengeluaran Terbesar */}
        <div className="order-10 lg:order-10 lg:col-span-6 bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white">
              Pengeluaran Terbesar
            </h3>
            <span className="text-[11px] font-bold text-gray-400">{activePeriodLabel}</span>
          </div>

          {topExpenses.length === 0 ? (
            <div className="py-12 text-center bg-gray-50/60 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 space-y-2 my-auto">
              <p className="text-xs text-gray-400">Belum ada pengeluaran periode ini</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {topExpenses.map((item) => {
                const pctOfSpent =
                  budgetSpent > 0 ? Math.min(100, Math.round((item.amount / budgetSpent) * 100)) : 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#F8F9FA] dark:bg-gray-800/50 border border-gray-100/80 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{item.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <span className="text-[10px] font-medium text-gray-400 block mt-0.5 tabular-nums">
                          {item.group} · {pctOfSpent}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white tabular-nums shrink-0 ml-2">
                      {formatRupiah(item.amount, hide)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Half: Realisasi Budget (Dynamic Donut Gauge + Legend) */}
        <div className="order-11 lg:order-11 lg:col-span-6 bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col justify-between min-h-[300px] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white">
                Realisasi Budget
              </h3>
              <p className="text-[11px] text-gray-400 tabular-nums">
                Terpakai {donutMetrics.usedPctStr} dari {formatRupiah(budgetLimit, hide)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className="text-xs font-bold text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
            >
              <span>Atur</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto py-2">
            {/* Dynamic SVG Donut */}
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#F3F4F6"
                  strokeWidth="11"
                  className="dark:stroke-gray-800"
                />
                {/* Lavender Segment (Needs Spent) */}
                {donutMetrics.needsArc > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#A78BFA"
                    strokeWidth="11"
                    strokeDasharray={`${donutMetrics.needsArc} ${donutMetrics.circumference}`}
                    strokeDashoffset="0"
                    strokeLinecap={donutMetrics.wantsArc > 0 ? 'butt' : 'round'}
                  />
                )}
                {/* Peach/Orange Segment (Wants Spent) */}
                {donutMetrics.wantsArc > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#FB923C"
                    strokeWidth="11"
                    strokeDasharray={`${donutMetrics.wantsArc} ${donutMetrics.circumference}`}
                    strokeDashoffset={String(donutMetrics.wantsOffset)}
                    strokeLinecap={donutMetrics.needsArc > 0 ? 'butt' : 'round'}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {isOverTotalBudget ? 'Lewat' : 'Sisa'}
                </span>
                <span
                  className={`text-sm lg:text-base font-black tabular-nums mt-0.5 ${
                    isOverTotalBudget
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {isOverTotalBudget
                    ? `+${formatRupiah(budgetSpent - budgetLimit, hide)}`
                    : formatRupiah(remainingBudget, hide)}
                </span>
              </div>
            </div>

            {/* Realisasi Legend Breakdown */}
            <div className="w-full sm:flex-1 space-y-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA] shrink-0" />
                  <span className="font-bold text-gray-700 dark:text-gray-300">Kebutuhan</span>
                </div>
                <span className="font-black text-gray-900 dark:text-white tabular-nums">
                  {formatRupiah(nSpent, hide)}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FB923C] shrink-0" />
                  <span className="font-bold text-gray-700 dark:text-gray-300">Keinginan</span>
                </div>
                <span className="font-black text-gray-900 dark:text-white tabular-nums">
                  {formatRupiah(wSpent, hide)}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isOverTotalBudget ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {isOverTotalBudget ? 'Lewat Budget' : 'Sisa Budget'}
                  </span>
                </div>
                <span
                  className={`font-black tabular-nums ${
                    isOverTotalBudget
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isOverTotalBudget
                    ? `+${formatRupiah(budgetSpent - budgetLimit, hide)}`
                    : formatRupiah(remainingBudget, hide)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
