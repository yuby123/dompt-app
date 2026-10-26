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
  ArrowDownLeft,
  ArrowUpRight as ArrowOut,
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
    goToPrevPeriod,
    goToNextPeriod,
    goToCurrentPeriod,
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
  const userName =
    (settings.userName && settings.userName.trim()) ||
    (user?.displayName && user.displayName.trim()) ||
    'Trisna';

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

  const accentHoverBorder =
    accentColor === 'pink'
      ? 'hover:border-[#FF9A9E]'
      : accentColor === 'orange'
      ? 'hover:border-[#FF6B2B]'
      : accentColor === 'plum'
      ? 'hover:border-[#A594F9]'
      : 'hover:border-[#D4F826]';

  // Quick greetings (hydrated on client using primitive string snapshot to avoid server/client mismatch and object identity loops)
  const greetingSnapshot = React.useSyncExternalStore(
    () => () => {},
    () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 18 || currentHour < 4) return 'Selamat malam|🌙';
      if (currentHour >= 15) return 'Selamat sore|🌤️';
      if (currentHour >= 11) return 'Selamat siang|☀️';
      return 'Selamat pagi|🌅';
    },
    () => 'Halo|☀️'
  );
  const [greetingText, greetingEmoji] = greetingSnapshot.split('|');

  const realTodayInfo = React.useSyncExternalStore(
    () => () => {},
    () => {
      const now = new Date();
      return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    },
    () => ''
  );

  const [realTodayYear, realTodayMonth, realTodayDay] = useMemo(() => {
    if (!realTodayInfo) return [-1, -1, -1];
    return realTodayInfo.split('-').map(Number);
  }, [realTodayInfo]);

  const isViewingCurrentPeriod = useMemo(() => {
    if (realTodayYear < 0) return true;
    const todayDate = new Date(realTodayYear, realTodayMonth, realTodayDay, 12, 0, 0);
    return isDateInBudgetPeriod(todayDate, budgetPeriod);
  }, [realTodayYear, realTodayMonth, realTodayDay, budgetPeriod]);

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

  // Dynamic daily expenses, income & activity count map from transactions + standalone debt payments this month
  const { dailyExpensesMap, dailyIncomeMap, dailyActivityMap } = useMemo(() => {
    const expMap: Record<number, number> = {};
    const incMap: Record<number, number> = {};
    const actMap: Record<number, number> = {};
    const recordedTxIds = new Set<string>();
    const catMap = new Map(categories.map((c) => [c.id, c]));

    transactions.forEach((tx) => {
      recordedTxIds.add(tx.id);
      const d = parseLocalDay(tx.date);
      if (d.getFullYear() === activeYear && d.getMonth() === activeMonth) {
        const day = d.getDate();
        actMap[day] = (actMap[day] || 0) + 1;
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
          actMap[day] = (actMap[day] || 0) + 1;
          expMap[day] = (expMap[day] || 0) + p.amount;
        }
      });
    });

    return { dailyExpensesMap: expMap, dailyIncomeMap: incMap, dailyActivityMap: actMap };
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

  const ID_MONTHS_TITLE = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const monthLabel = `${ID_MONTHS_TITLE[activeMonth] || 'Januari'} ${activeYear}`;

  // Calendar navigation that respects paydayDay so it doesn't skip custom payday periods
  const handlePrevMonth = () => {
    const today = new Date();
    const prevMonthDate = new Date(activeYear, activeMonth - 1, 1);
    const y = prevMonthDate.getFullYear();
    const mIdx = prevMonthDate.getMonth();
    const maxDay = new Date(y, mIdx + 1, 0).getDate();
    const m = String(mIdx + 1).padStart(2, '0');
    const isRealCurrentMonth = today.getFullYear() === y && today.getMonth() === mIdx;
    const anchorDay = isRealCurrentMonth
      ? today.getDate()
      : Math.min(maxDay, Math.max(1, budgetPeriod.paydayDay || 1));
    const dStr = String(anchorDay).padStart(2, '0');
    setActiveDate(`${y}-${m}-${dStr}`);
    setSelectedDayState({ monthKey: `${y}-${mIdx}`, day: isRealCurrentMonth ? today.getDate() : 1 });
  };

  const handleNextMonth = () => {
    const today = new Date();
    const nextMonthDate = new Date(activeYear, activeMonth + 1, 1);
    const y = nextMonthDate.getFullYear();
    const mIdx = nextMonthDate.getMonth();
    const maxDay = new Date(y, mIdx + 1, 0).getDate();
    const m = String(mIdx + 1).padStart(2, '0');
    const isRealCurrentMonth = today.getFullYear() === y && today.getMonth() === mIdx;
    const anchorDay = isRealCurrentMonth
      ? today.getDate()
      : Math.min(maxDay, Math.max(1, budgetPeriod.paydayDay || 1));
    const dStr = String(anchorDay).padStart(2, '0');
    setActiveDate(`${y}-${m}-${dStr}`);
    setSelectedDayState({ monthKey: `${y}-${mIdx}`, day: isRealCurrentMonth ? today.getDate() : 1 });
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

  // Route bill click to its exact owning tab
  const handleBillClick = (billId: string) => {
    if (billId.startsWith('bill-debt-')) {
      setActiveTab('debt');
    } else if (billId.startsWith('bill-wallet-')) {
      setActiveTab('wallets');
    } else if (billId.startsWith('bill-sub-')) {
      setActiveTab('budget');
    } else {
      setActiveTab('subscriptions');
    }
  };

  return (
    <div className="space-y-5 pb-28 lg:pb-12">
      {/* 1. Header Greeting + Active Period Navigation */}
      <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-[28px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none truncate">
              Ringkasan Utama
            </h1>
            {user && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap shrink-0">
                · Cloud Aktif
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">
            {greetingText},{' '}
            <strong className="font-semibold text-slate-700 dark:text-slate-200">{userName}</strong>{' '}
            {greetingEmoji}
          </p>
        </div>

        {/* Period Switcher + Budget Cycle Shortcut */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="flex items-center bg-white dark:bg-[#16181D] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={goToPrevPeriod}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Periode Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={goToCurrentPeriod}
              className="px-2.5 py-1 text-left cursor-pointer group"
              title={
                isViewingCurrentPeriod
                  ? 'Periode Saat Ini'
                  : 'Klik untuk kembali ke Periode Hari Ini'
              }
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-none">
                {budgetPeriod.isCustomFlexiblePeriod
                  ? `Fleksibel · ${budgetPeriod.totalDays} Hari`
                  : budgetPeriod.paydayDay > 1
                  ? `Siklus Gajian Tgl ${budgetPeriod.paydayDay}`
                  : 'Siklus Bulanan'}
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-0.5 block leading-none tabular-nums">
                {activePeriodLabel}
              </span>
            </button>
            <button
              type="button"
              onClick={goToNextPeriod}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Periode Berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            title="Atur Budget & Tanggal Gajian"
            className={`h-10 px-3.5 rounded-2xl bg-white dark:bg-[#16181D] border border-slate-200/80 dark:border-white/[0.08] ${accentHoverBorder} text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0`}
          >
            <CalendarClock size={15} className="text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Atur Siklus</span>
          </button>
        </div>
      </div>

      {/* Multi-user Cloud Sync Prompt Banner if in Guest mode */}
      {!user && (
        <div className="lg:hidden bg-white dark:bg-[#16181D] border border-emerald-500/25 dark:border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl ${accentBtn} flex items-center justify-center shrink-0 font-bold text-sm`}
            >
              ☁️
            </div>
            <div className="text-xs min-w-0">
              <p className="font-display font-bold text-slate-900 dark:text-white truncate">
                Sinkronisasi Cloud
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                Masuk akun agar catatan keuangan tersimpan aman.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openLoginModal}
            className={`px-3.5 py-2 rounded-xl ${accentBtn} font-bold text-xs shrink-0 transition-transform active:scale-95 cursor-pointer`}
          >
            Masuk
          </button>
        </div>
      )}

      {/* Main Responsive 12-Col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* 2. Kuota Harian (Full-Width Dark Hero Command Center) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="order-1 lg:order-1 lg:col-span-12 relative overflow-hidden rounded-3xl p-5 sm:p-6 lg:p-7 bg-gradient-to-br from-[#0F1322] via-[#13182B] to-[#0A0C14] text-white shadow-xl border border-white/10 flex flex-col justify-between gap-5"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-[#8B5CF6]/15 blur-3xl pointer-events-none" />
          <div
            className={`absolute -bottom-24 -left-16 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
              accentColor === 'orange'
                ? 'bg-[#FF6B2B]/15'
                : accentColor === 'pink'
                ? 'bg-[#FFA4A4]/15'
                : accentColor === 'plum'
                ? 'bg-[#A594F9]/15'
                : 'bg-[#D4F826]/15'
            }`}
          />

          {/* Top Bar: Label, Mode Info & Eye Toggle */}
          <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs min-w-0 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4F826] whitespace-nowrap">
                Kuota Harian · Jatah Hari Ini
              </span>
              <span className="text-slate-600">·</span>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                title="Ubah logika Surplus & Defisit Kuota Harian di Pengaturan"
                className="text-xs font-medium text-slate-300 hover:text-white underline decoration-white/25 hover:decoration-white transition-colors cursor-pointer whitespace-nowrap"
              >
                {dashboardSummary.dailyOverbudget
                  ? dashboardSummary.dailyDeficitMode === 'strict_penalty'
                    ? 'Mode Defisit: Strict Penalty'
                    : 'Mode Defisit: Spread Deficit'
                  : dashboardSummary.dailySurplusMode === 'save_weekend'
                  ? 'Mode Surplus: Save Weekend'
                  : dashboardSummary.dailySurplusMode === 'averaging'
                  ? 'Mode Surplus: Averaging'
                  : 'Mode Surplus: Rollover'}
              </button>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs font-mono font-medium text-slate-300 tabular-nums whitespace-nowrap">
                Hari {periodCurrentDay}/{periodTotalDays} · {budgetPeriod.daysRemainingUntilPayday}{' '}
                hari tersisa
              </span>
              <button
                type="button"
                onClick={toggleHideBalance}
                className="w-8 h-8 rounded-xl bg-white/[0.06] text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title={hide ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
              >
                {hide ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
          </div>

          {/* Center Content: Left Primary Figure + Right 3 KPI Cards */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:items-center">
            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <div className="text-3xl sm:text-4xl lg:text-[44px] font-mono font-extrabold tracking-tight tabular-nums text-white leading-none">
                  {formatRupiah(dashboardSummary.dailyBudgetRemaining, hide)}
                </div>
                {dashboardSummary.dailyBudgetQuota > 0 && (
                  <span className="font-mono text-xs sm:text-sm font-medium text-slate-400 tabular-nums">
                    / {formatRupiah(dashboardSummary.dailyBudgetQuota, hide)}
                  </span>
                )}
              </div>

              {dashboardSummary.dailyOverbudget ? (
                <p className="text-xs text-rose-300 font-medium font-mono tabular-nums leading-relaxed">
                  Melebihi kuota hari ini{' '}
                  <strong className="text-rose-400 font-bold">
                    {fmtCurrency(dashboardSummary.dailyOverbudgetAmount, { prefix: '+' })}
                  </strong>
                  {budgetPeriod.daysRemainingUntilPayday > 1 && (
                    <span className="text-amber-300">
                      {' '}
                      · Proyeksi kuota besok{' '}
                      <strong>
                        {fmtCurrency(dashboardSummary.tomorrowDailyQuota, {
                          prefix: '~',
                          suffix: '/hari',
                        })}
                      </strong>
                    </span>
                  )}
                </p>
              ) : dashboardSummary.dailyBudgetQuota > 0 &&
                dashboardSummary.remainingVariableBudget <= 0 ? (
                <p className="text-xs text-amber-300 font-medium">
                  Saldo pos fleksibel periode ini telah habis terpakai.
                </p>
              ) : (
                <p className="text-xs text-slate-400 font-mono tabular-nums leading-relaxed">
                  <span className="font-sans">Sisa pos harian:</span>{' '}
                  <strong className="text-slate-200 font-bold">
                    {formatRupiah(dashboardSummary.remainingVariableBudget, hide)}
                  </strong>
                  {budgetPeriod.daysRemainingUntilPayday > 1 &&
                    dashboardSummary.dailyBudgetQuota > 0 && (
                      <span>
                        {' '}
                        · <span className="font-sans">Besok:</span>{' '}
                        <strong className="text-[#D4F826] font-bold">
                          {fmtCurrency(dashboardSummary.tomorrowDailyQuota, {
                            prefix: '~',
                            suffix: '/hari',
                          })}
                        </strong>
                      </span>
                    )}
                  {dashboardSummary.dailySurplusMode === 'save_weekend' &&
                    dashboardSummary.weekendBudgetPool > 0 && (
                      <span>
                        {' '}
                        · <span className="font-sans">Tabungan Weekend:</span>{' '}
                        <strong className="text-emerald-300 font-bold">
                          {fmtCurrency(dashboardSummary.weekendBudgetPool, { prefix: '+' })}
                        </strong>
                      </span>
                    )}
                  {todayNonDailyTotal > 0 && (
                    <span>
                      {' '}
                      · <span className="font-sans">Non-kuota hari ini:</span>{' '}
                      <strong className="text-amber-300 font-bold">
                        {formatRupiah(todayNonDailyTotal, hide)}
                      </strong>
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Right: 3 Symmetrical KPI Cards */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div
                onClick={() => setActiveTab('wallets')}
                className="rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 p-3.5 cursor-pointer transition-colors flex flex-col justify-between"
                title="Kelola Saldo Dompet"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    Saldo Dompet
                  </span>
                  <Wallet size={13} className="text-slate-400 shrink-0" />
                </div>
                <div className="text-base sm:text-lg font-mono font-bold text-white mt-1.5 tabular-nums truncate">
                  {formatRupiah(dashboardSummary.totalBalance, hide)}
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    Masuk Hari Ini
                  </span>
                  <ArrowDownLeft size={13} className="text-emerald-400 shrink-0" />
                </div>
                <div className="text-base sm:text-lg font-mono font-bold text-emerald-400 mt-1.5 tabular-nums truncate">
                  {fmtCurrency(todayIncome, { prefix: '+' })}
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    Keluar Hari Ini
                  </span>
                  <ArrowOut size={13} className="text-rose-400 shrink-0" />
                </div>
                <div className="text-base sm:text-lg font-mono font-bold text-rose-400 mt-1.5 tabular-nums truncate">
                  {fmtCurrency(todayExpense, { prefix: '-' })}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar + Action Buttons Footer */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-slate-300">
                  <span className="font-sans text-slate-400">Terpakai kuota hari ini:</span>{' '}
                  <strong className="text-white">
                    {formatRupiah(dashboardSummary.todayVariableExpense, hide)}
                  </strong>
                </span>
                <span className="text-white font-bold">Sisa {dailyCapacityPct}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    dashboardSummary.dailyOverbudget
                      ? 'bg-rose-500'
                      : accentColor === 'orange'
                      ? 'bg-gradient-to-r from-[#FF6B2B] via-[#F59E0B] to-[#EC4899]'
                      : accentColor === 'pink'
                      ? 'bg-gradient-to-r from-[#FFA4A4] via-[#F43F5E] to-[#A855F7]'
                      : 'bg-gradient-to-r from-[#D4F826] via-[#8B5CF6] to-[#38BDF8]'
                  }`}
                  style={{ width: `${dailyCapacityPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => openAddTransaction('expense')}
                className={`h-10 px-4 rounded-xl ${accentBtn} font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer whitespace-nowrap`}
              >
                <Plus size={15} strokeWidth={2.5} className="shrink-0" />
                <span>Catat Transaksi</span>
              </button>

              <button
                type="button"
                onClick={() => openScanModal()}
                className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                title="Scan Struk / Screenshot"
              >
                <Camera size={14} strokeWidth={2.3} className="text-[#D4F826] shrink-0" />
                <span>Scan Struk</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('budget')}
                className="col-span-2 sm:col-span-1 h-10 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Detail Budget</span>
                <ArrowUpRight size={14} className="text-slate-400 shrink-0" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* 3. Menu Pintasan (Mobile Only - Symmetrical 5x2 Grid) */}
        <div className="order-2 lg:hidden bg-white dark:bg-[#16181D] rounded-3xl p-4 sm:p-5 border border-slate-200/75 dark:border-white/[0.08] space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Pintasan Menu
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={12} />
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
                  <div
                    className={`w-11 h-11 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:scale-105 ${accentHoverBorder} transition-all shrink-0`}
                  >
                    <Icon size={19} strokeWidth={2.1} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight truncate w-full">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`w-full py-2.5 px-3.5 rounded-xl ${accentBtn} flex items-center justify-between text-xs font-bold transition-colors cursor-pointer`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck size={14} strokeWidth={2.5} className="shrink-0" />
                  <span className="truncate">Panel Admin</span>
                </div>
                <span className="text-[11px] font-mono font-bold tabular-nums">
                  {managedUsers.filter((u) => u.status === 'pending').length} Pending
                </span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('feedback')}
                className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Bug size={13} className="text-rose-500 shrink-0" />
                  <span className="truncate">Masukan</span>
                </div>
                <ChevronRight size={13} className="text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tutorial')}
                className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <BookOpen size={13} className="text-emerald-600 dark:text-[#D4F826] shrink-0" />
                  <span className="truncate">Panduan</span>
                </div>
                <ChevronRight size={13} className="text-slate-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Tier KPI Periode: 3 Equal Columns (Pemasukan, Pengeluaran, Dana Darurat) */}
        {/* Col 1: Pemasukan */}
        <div
          onClick={() => setActiveTab('transactions')}
          className="order-3 lg:order-2 lg:col-span-4 bg-white dark:bg-[#16181D] rounded-3xl p-5 border border-slate-200/75 dark:border-white/[0.08] hover:border-emerald-500/40 transition-colors cursor-pointer flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Pemasukan · {activePeriodLabel}
            </span>
            <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowDownLeft size={14} />
            </span>
          </div>

          <div className="font-mono text-2xl sm:text-[26px] font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight truncate">
            {formatRupiah(dashboardSummary.monthlyIncome, hide)}
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {prevPeriodComparison.incDeltaPct !== null ? (
              <span>
                <strong
                  className={
                    prevPeriodComparison.incDeltaPct >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-500 dark:text-rose-400'
                  }
                >
                  {prevPeriodComparison.incDeltaPct >= 0 ? '+' : ''}
                  {prevPeriodComparison.incDeltaPct}%
                </strong>{' '}
                <span className="font-sans">vs periode lalu</span>
              </span>
            ) : (
              <span className="font-sans">Periode berjalan</span>
            )}
            <span>
              <span className="font-sans">Bersih:</span>{' '}
              <strong
                className={
                  dashboardSummary.netCashflow >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-500 dark:text-rose-400'
                }
              >
                {fmtCurrency(Math.abs(dashboardSummary.netCashflow), {
                  prefix: dashboardSummary.netCashflow < 0 ? '-' : '+',
                })}
              </strong>
            </span>
          </div>
        </div>

        {/* Col 2: Pengeluaran */}
        <div
          onClick={() => setActiveTab('transactions')}
          className="order-4 lg:order-3 lg:col-span-4 bg-white dark:bg-[#16181D] rounded-3xl p-5 border border-slate-200/75 dark:border-white/[0.08] hover:border-rose-500/40 transition-colors cursor-pointer flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Pengeluaran · {activePeriodLabel}
            </span>
            <span className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ArrowOut size={14} />
            </span>
          </div>

          <div className="font-mono text-2xl sm:text-[26px] font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight truncate">
            {formatRupiah(dashboardSummary.monthlyExpense, hide)}
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {budgetLimit > 0 ? (
              <span className="truncate">
                <strong className="text-rose-600 dark:text-rose-400">
                  {formatPctDisplay(dashboardSummary.monthlyExpense, budgetLimit)}
                </strong>{' '}
                <span className="font-sans">dari pagu</span> {formatRupiah(budgetLimit, hide)}
              </span>
            ) : prevPeriodComparison.expDeltaPct !== null ? (
              <span>
                <strong className="text-rose-600 dark:text-rose-400">
                  {prevPeriodComparison.expDeltaPct >= 0 ? '+' : ''}
                  {prevPeriodComparison.expDeltaPct}%
                </strong>{' '}
                <span className="font-sans">vs periode lalu</span>
              </span>
            ) : (
              <span className="font-sans">Belum ada pagu anggaran</span>
            )}
          </div>
        </div>

        {/* Col 3: Dana Darurat & Likuiditas */}
        <div
          onClick={() => setActiveTab('assets')}
          className="order-5 lg:order-4 lg:col-span-4 bg-white dark:bg-[#16181D] rounded-3xl p-5 border border-slate-200/75 dark:border-white/[0.08] hover:border-amber-500/40 transition-colors cursor-pointer flex flex-col justify-between gap-3"
          title="Kelola Aset Likuid & Dana Darurat"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <AlertCircle size={13} />
              <span>Ketahanan Dana Darurat</span>
            </div>
            <ArrowUpRight size={14} className="text-slate-400" />
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-[26px] font-extrabold text-slate-900 dark:text-white tabular-nums leading-none">
                {dashboardSummary.emergencyFundRunwayMonths}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                bulan bertahan
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-400 tabular-nums">
              Target 6 bln
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
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
            <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              <span className="font-sans">Total Aset Likuid:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {formatRupiah(dashboardSummary.liquidAssetsTotal, hide)}
              </strong>
            </div>
          </div>
        </div>

        {/* 5. Porsi Anggaran (Full-width horizontal card) */}
        <div className="order-6 lg:order-5 lg:col-span-12 bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/75 dark:border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-7">
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
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-slate-100 dark:text-white/[0.08]"
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
                  <span className="text-[7px] font-bold uppercase text-slate-400 leading-none">
                    HARI
                  </span>
                  <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white leading-tight tabular-nums">
                    {periodCurrentDay}
                  </span>
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Porsi Alokasi Anggaran
                </h3>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {activePeriodLabel} · Hari {periodCurrentDay}/{periodTotalDays}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <PieChart size={13} className="shrink-0" />
              <span>Kelola Pos</span>
            </button>
          </div>

          {/* Right: 3 Wide Horizontal Bars */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Kebutuhan */}
            <div
              onClick={() => setActiveTab('budget')}
              className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] hover:border-violet-400/60 transition-colors cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-violet-600 dark:text-[#A594F9] text-xs">
                  Kebutuhan ({needsCfgPct}%)
                </span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white text-xs tabular-nums">
                  {formatPctDisplay(nSpent, needsBudget)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    nSpent > needsBudget ? 'bg-rose-500' : 'bg-[#A594F9]'
                  }`}
                  style={{ width: `${needsPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                <span className="truncate">
                  {formatRupiah(nSpent, hide)} / {formatRupiah(needsBudget, hide)}
                </span>
                <span
                  className={`font-sans shrink-0 ml-1 ${
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
              className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] hover:border-pink-400/60 transition-colors cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-pink-600 dark:text-pink-400 text-xs">
                  Keinginan ({wantsCfgPct}%)
                </span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white text-xs tabular-nums">
                  {formatPctDisplay(wSpent, wantsBudget)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    wSpent > wantsBudget ? 'bg-rose-500' : 'bg-pink-500'
                  }`}
                  style={{ width: `${wantsPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                <span className="truncate">
                  {formatRupiah(wSpent, hide)} / {formatRupiah(wantsBudget, hide)}
                </span>
                <span
                  className={`font-sans shrink-0 ml-1 ${
                    wSpent > wantsBudget
                      ? 'text-rose-500 font-bold'
                      : wantsPct >= 85
                      ? 'text-amber-500 font-bold'
                      : 'text-emerald-600 dark:text-emerald-400 font-semibold'
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
              className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] hover:border-teal-400/60 transition-colors cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-teal-600 dark:text-teal-400 text-xs">
                  Tabungan ({savingsBudgetCfgPct}%)
                </span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white text-xs tabular-nums">
                  {formatPctDisplay(sSpent, savingsBudget)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${savingsPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                <span className="truncate">
                  {formatRupiah(sSpent, hide)} / {formatRupiah(savingsBudget, hide)}
                </span>
                <span className="font-sans text-teal-600 dark:text-teal-400 font-semibold shrink-0 ml-1">
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

        {/* 6. Kalender Aktivitas (Left 6 Cols on Desktop) */}
        <div className="order-7 lg:order-6 lg:col-span-6 bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/75 dark:border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Kalender Aktivitas
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {monthLabel}
                </span>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTodayMonth}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
              >
                <span>Analisis</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 pt-0.5">
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
            <span>Min</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-12 sm:h-13" />;
              }

              const exp = dailyExpensesMap[day] || 0;
              const inc = dailyIncomeMap[day] || 0;
              const actCount = dailyActivityMap[day] || 0;
              const isSelected = selectedCalendarDay === day;
              const isRealToday =
                realTodayYear === activeYear &&
                realTodayMonth === activeMonth &&
                realTodayDay === day;
              const hasActivity = exp > 0 || inc > 0 || actCount > 0;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => setSelectedCalendarDay(day)}
                  className={`h-12 sm:h-13 rounded-xl flex flex-col justify-between p-1.5 transition-all cursor-pointer relative border ${
                    isSelected
                      ? 'bg-slate-200/75 dark:bg-white/[0.11] border-slate-400 dark:border-white/30 font-bold'
                      : isRealToday
                      ? 'bg-slate-100/90 dark:bg-white/[0.06] border-slate-300 dark:border-white/15'
                      : hasActivity
                      ? 'bg-slate-100/70 dark:bg-white/[0.045] border-transparent hover:bg-slate-200/60 dark:hover:bg-white/[0.08]'
                      : 'bg-slate-50/70 dark:bg-white/[0.02] border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`font-mono text-[11px] leading-none tabular-nums ${
                        isSelected || isRealToday
                          ? 'font-extrabold text-slate-900 dark:text-white'
                          : 'font-bold text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                    {isRealToday ? (
                      <span
                        className="text-[8px] font-bold text-slate-400 dark:text-slate-400 leading-none"
                        title="Hari Ini"
                      >
                        •
                      </span>
                    ) : inc > 0 && exp > 0 ? (
                      <span className="w-1 h-1 rounded-full bg-emerald-500/80 shrink-0" />
                    ) : null}
                  </div>
                  {exp > 0 ? (
                    <span className="font-mono text-[9px] font-bold text-rose-600 dark:text-rose-400 self-end tabular-nums leading-none truncate max-w-full">
                      {hide
                        ? '•••'
                        : `-${formatCompactRupiah(exp).replace('+', '').replace('-', '')}`}
                    </span>
                  ) : inc > 0 ? (
                    <span className="font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400 self-end tabular-nums leading-none truncate max-w-full">
                      {hide
                        ? '•••'
                        : `+${formatCompactRupiah(inc).replace('+', '').replace('-', '')}`}
                    </span>
                  ) : actCount > 0 ? (
                    <span className="font-mono text-[9px] font-semibold text-sky-500 self-end tabular-nums leading-none">
                      {actCount} tx
                    </span>
                  ) : (
                    <span className="text-[9px] text-transparent select-none self-end">-</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day summary and transaction breakdown */}
          {selectedCalendarDay && (
            <div className="pt-3.5 border-t border-slate-100 dark:border-white/[0.07] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-display font-bold text-slate-800 dark:text-slate-200">
                  Aktivitas {selectedCalendarDay} {SHORT_MONTHS_ID[activeMonth]} {activeYear}
                </span>
                <div className="flex items-center gap-2.5 font-mono tabular-nums">
                  {(dailyIncomeMap[selectedCalendarDay] || 0) > 0 && (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {fmtCurrency(dailyIncomeMap[selectedCalendarDay] || 0, { prefix: '+' })}
                    </span>
                  )}
                  {(dailyExpensesMap[selectedCalendarDay] || 0) > 0 && (
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {fmtCurrency(dailyExpensesMap[selectedCalendarDay] || 0, { prefix: '-' })}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const dateStr = `${activeYear}-${String(activeMonth + 1).padStart(
                        2,
                        '0'
                      )}-${String(selectedCalendarDay).padStart(2, '0')}`;
                      openAddTransaction('expense', dateStr);
                    }}
                    className={`font-sans px-2.5 py-1 rounded-lg ${accentBtn} font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer`}
                  >
                    <Plus size={12} strokeWidth={2.8} />
                    <span>Catat</span>
                  </button>
                </div>
              </div>

              {selectedDayTransactions.length > 0 || selectedDayDebtPayments.length > 0 ? (
                <div className="space-y-1.5 pt-0.5 max-h-[210px] overflow-y-auto pr-1">
                  {selectedDayTransactions.map((detail) => {
                    const { transaction, wallet, category, transferWallet } = detail;
                    const isExpense = transaction.type === 'expense';
                    const isIncome = transaction.type === 'income';

                    return (
                      <div
                        key={transaction.id}
                        onClick={() => openEditTransaction(detail)}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer border border-slate-200/60 dark:border-white/[0.06]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#1E222B] border border-slate-200/60 dark:border-white/[0.08] flex items-center justify-center text-sm shrink-0">
                            {category?.emoji || (isIncome ? '💰' : '🔄')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {transaction.note || category?.name || 'Transaksi'}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {wallet.name} ·{' '}
                              {category?.name ||
                                (isIncome
                                  ? 'Pemasukan'
                                  : transferWallet
                                  ? `Ke ${transferWallet.name}`
                                  : 'Transfer')}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <span
                            className={`font-mono text-xs font-bold tabular-nums ${
                              isExpense
                                ? 'text-rose-600 dark:text-rose-400'
                                : isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-sky-600 dark:text-sky-400'
                            }`}
                          >
                            {fmtCurrency(transaction.amount, {
                              prefix: isExpense ? '-' : isIncome ? '+' : '',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {selectedDayDebtPayments.map((dp) => (
                    <div
                      key={dp.id}
                      onClick={() => setActiveTab('debt')}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer border border-slate-200/60 dark:border-white/[0.06]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#1E222B] border border-slate-200/60 dark:border-white/[0.08] flex items-center justify-center text-sm shrink-0">
                          💳
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            Cicilan {dp.debtName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {dp.note || 'Pembayaran Cicilan Utang'}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums shrink-0 ml-2">
                        {fmtCurrency(dp.amount, { prefix: '-' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3.5 px-3 text-center bg-slate-50/70 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] text-xs text-slate-400">
                  Belum ada catatan transaksi pada tanggal ini.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 7. Transaksi Terbaru (Right 6 Cols on Desktop) */}
        <div className="order-8 lg:order-7 lg:col-span-6 bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/75 dark:border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Transaksi Terbaru
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Klik baris transaksi untuk mengubah atau menghapus cepat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-0.5 cursor-pointer shrink-0"
              >
                <span>Lihat Semua</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {transactionDetails.length === 0 ? (
              <div className="py-12 text-center bg-slate-50/60 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] space-y-3">
                <p className="text-xs text-slate-400">Belum ada transaksi tercatat</p>
                <button
                  type="button"
                  onClick={() => openAddTransaction('expense')}
                  className={`px-4 py-2 rounded-xl ${accentBtn} text-xs font-bold cursor-pointer`}
                >
                  + Catat Transaksi Pertama
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {transactionDetails.slice(0, 6).map((detail) => {
                  const { transaction, wallet, category, transferWallet } = detail;
                  const isExpanded = selectedTxId === transaction.id;
                  const isExpense = transaction.type === 'expense';
                  const isIncome = transaction.type === 'income';
                  const isTransfer = transaction.type === 'transfer';

                  return (
                    <div
                      key={transaction.id}
                      className="py-2.5 first:pt-1 last:pb-1 hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-all cursor-pointer rounded-xl px-2 -mx-2"
                      onClick={() => {
                        setSelectedTxId(isExpanded ? null : transaction.id);
                        setConfirmDeleteTxId(null);
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl text-base flex items-center justify-center shrink-0 border ${
                              isIncome
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40'
                                : isTransfer
                                ? 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-800/40'
                                : 'bg-slate-50 dark:bg-[#1E222B] border-slate-200/70 dark:border-white/[0.08]'
                            }`}
                          >
                            {category?.emoji || (isTransfer ? '🔄' : isIncome ? '💰' : '☕')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {transaction.note ||
                                category?.name ||
                                (isTransfer ? 'Transfer Antar Dompet' : 'Transaksi')}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {wallet.name} · {formatFullDateIndo(transaction.date)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-mono text-xs sm:text-sm font-bold tabular-nums ${
                              isExpense
                                ? 'text-slate-900 dark:text-white'
                                : isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-sky-600 dark:text-sky-400'
                            }`}
                          >
                            {fmtCurrency(transaction.amount, {
                              prefix: isExpense ? '-' : isIncome ? '+' : '',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Inline expansion on click */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.08] text-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>
                              Dompet:{' '}
                              <strong className="text-slate-800 dark:text-slate-200">
                                {wallet.name}
                              </strong>
                            </span>
                            <span>
                              {isTransfer
                                ? `Tujuan: ${transferWallet?.name || 'Dompet Tujuan'}`
                                : `${category?.emoji || ''} ${category?.name || 'Lainnya'}`}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTransaction(detail);
                              }}
                              className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.1] flex items-center justify-center gap-1.5 cursor-pointer"
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
                              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                                confirmDeleteTxId === transaction.id
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                              }`}
                            >
                              <Trash2 size={12} />
                              <span>
                                {confirmDeleteTxId === transaction.id ? 'Konfirmasi Hapus' : 'Hapus'}
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

        {/* 8. Row: Pengeluaran Terbesar (lg:col-span-6) & Realisasi Budget (lg:col-span-6) */}
        {/* Left Half: Pengeluaran Terbesar */}
        <div className="order-9 lg:order-8 lg:col-span-6 bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/75 dark:border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Pengeluaran Terbesar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kategori dengan porsi pengeluaran tertinggi ({activePeriodLabel}).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              <span>Detail</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {topExpenses.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/60 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] space-y-2 my-auto">
              <p className="text-xs text-slate-400">Belum ada pengeluaran pada periode ini</p>
            </div>
          ) : (
            <div className="space-y-2.5 my-auto">
              {topExpenses.map((item) => {
                const pctOfSpent =
                  budgetSpent > 0 ? Math.min(100, Math.round((item.amount / budgetSpent) * 100)) : 0;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">{item.emoji}</span>
                        <div className="min-w-0 flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                            · {item.group}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                        <span className="text-xs font-semibold text-slate-400">{pctOfSpent}%</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {formatRupiah(item.amount, hide)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200/70 dark:bg-white/[0.07] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500 dark:bg-[#A594F9] transition-all duration-300"
                        style={{ width: `${pctOfSpent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Half: Realisasi Budget (Dynamic Donut Gauge + Legend) */}
        <div className="order-10 lg:order-9 lg:col-span-6 bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/75 dark:border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Realisasi Pagu Konsumsi
              </h3>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                Terpakai {donutMetrics.usedPctStr} dari pagu {formatRupiah(budgetLimit, hide)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              <span>Atur Budget</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto py-2">
            {/* Dynamic SVG Donut */}
            <div className="relative w-38 h-38 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="11"
                  className="text-slate-100 dark:text-white/[0.08]"
                />
                {/* Violet Segment (Needs Spent) */}
                {donutMetrics.needsArc > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#A594F9"
                    strokeWidth="11"
                    strokeDasharray={`${donutMetrics.needsArc} ${donutMetrics.circumference}`}
                    strokeDashoffset="0"
                    strokeLinecap={donutMetrics.wantsArc > 0 ? 'butt' : 'round'}
                  />
                )}
                {/* Pink Segment (Wants Spent) */}
                {donutMetrics.wantsArc > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#EC4899"
                    strokeWidth="11"
                    strokeDasharray={`${donutMetrics.wantsArc} ${donutMetrics.circumference}`}
                    strokeDashoffset={String(donutMetrics.wantsOffset)}
                    strokeLinecap={donutMetrics.needsArc > 0 ? 'butt' : 'round'}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isOverTotalBudget ? 'Lewat Pagu' : 'Sisa Pagu'}
                </span>
                <span
                  className={`font-mono text-xs sm:text-sm font-extrabold tabular-nums mt-0.5 ${
                    isOverTotalBudget
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {isOverTotalBudget
                    ? fmtCurrency(budgetSpent - budgetLimit, { prefix: '+' })
                    : formatRupiah(remainingBudget, hide)}
                </span>
              </div>
            </div>

            {/* Realisasi Legend Breakdown */}
            <div className="w-full sm:flex-1 space-y-2 text-xs font-mono tabular-nums">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-sans">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A594F9] shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Kebutuhan Pokok
                  </span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatRupiah(nSpent, hide)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-sans">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Keinginan & Gaya Hidup
                  </span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatRupiah(wSpent, hide)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-sans">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Tabungan & Investasi
                  </span>
                </div>
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  {formatRupiah(sSpent, hide)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.05] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-sans">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isOverTotalBudget ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {isOverTotalBudget ? 'Kelebihan Konsumsi' : 'Sisa Pagu Konsumsi'}
                  </span>
                </div>
                <span
                  className={`font-extrabold ${
                    isOverTotalBudget
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isOverTotalBudget
                    ? fmtCurrency(budgetSpent - budgetLimit, { prefix: '+' })
                    : formatRupiah(remainingBudget, hide)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 9. Row: Tagihan & Kewajiban Mendatang (lg:col-span-12) */}
        <div className="order-11 lg:order-10 lg:col-span-12 bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/75 dark:border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-700 dark:text--[#D4F826] shrink-0">
                <Calendar size={17} className="text-slate-700 dark:text-[#D4F826]" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Tagihan & Cicilan Mendatang
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tagihan langganan, cicilan utang, dan kewajiban rutin yang belum dibayar periode ini.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('subscriptions')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-0.5 cursor-pointer transition-colors shrink-0"
            >
              <span>Kelola Tagihan</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {upcomingBills.length === 0 ? (
            <div className="py-5 px-4 bg-slate-50/70 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>Semua tagihan & cicilan periode ini sudah lunas atau belum ada jadwal aktif.</span>
              <button
                type="button"
                onClick={() => setActiveTab('subscriptions')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white/10 dark:hover:bg-white/15 font-bold text-xs cursor-pointer transition-colors shrink-0"
              >
                + Tambah Tagihan Rutin
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {upcomingBills.map((bill) => (
                <div
                  key={bill.id}
                  onClick={() => handleBillClick(bill.id)}
                  className={`bg-slate-50/70 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] rounded-2xl p-4 border border-slate-200/75 dark:border-white/[0.07] ${accentHoverBorder} space-y-2.5 cursor-pointer transition-all flex flex-col justify-between`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E222B] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-center text-lg shrink-0">
                      {bill.iconEmoji}
                    </div>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold tabular-nums">
                      Jatuh tempo {bill.dueDate}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {bill.name}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {bill.category}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
                    <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-[#D4F826] tabular-nums truncate">
                      {formatRupiah(bill.amount, hide)}
                    </span>
                    <ArrowUpRight size={14} className="text-slate-400 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
