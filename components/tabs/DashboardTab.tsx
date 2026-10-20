'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Camera,
  Target,
  Landmark,
  CreditCard,
  TrendingUp,
  Sparkles,
  FileText,
  Lock,
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
  Activity,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../AppContext';
import { formatCompactRupiah, formatRupiah, formatFullDateIndo } from '@/lib/formatters';

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
    budgetConfig,
    activeYear,
    activeMonth,
    activeDay,
    activeDate,
    setActiveDate,
    user,
    openLoginModal,
  } = useApp();

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

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

  const refDateObj = useMemo(() => new Date(activeDate + 'T12:00:00'), [activeDate]);
  const currentDay = activeDay;
  const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(activeYear, activeMonth, 1).getDay();
  // Monday-based offset (Mon=0..Sun=6)
  const startDayOffset = (firstDayOfWeek + 6) % 7;
  const calendarCells = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const currentMonthKey = `${activeYear}-${activeMonth}`;
  const [selectedDayState, setSelectedDayState] = useState<{ monthKey: string; day: number } | null>(null);
  const selectedCalendarDay =
    selectedDayState && selectedDayState.monthKey === currentMonthKey
      ? selectedDayState.day
      : currentDay;
  const setSelectedCalendarDay = (day: number) => {
    setSelectedDayState({ monthKey: currentMonthKey, day });
  };

  // Today's real expense & income from context metrics
  const { todayIncome, todayExpense } = dashboardSummary;

  // Dynamic daily expenses & income map from transactions this month
  const { dailyExpensesMap, dailyIncomeMap } = useMemo(() => {
    const expMap: Record<number, number> = {};
    const incMap: Record<number, number> = {};
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getFullYear() === activeYear && d.getMonth() === activeMonth) {
        const day = d.getDate();
        if (tx.type === 'expense') {
          expMap[day] = (expMap[day] || 0) + tx.amount;
        } else if (tx.type === 'income') {
          incMap[day] = (incMap[day] || 0) + tx.amount;
        }
      }
    });
    return { dailyExpensesMap: expMap, dailyIncomeMap: incMap };
  }, [transactions, activeYear, activeMonth]);

  // Transactions for the selected calendar day
  const selectedDayTransactions = useMemo(() => {
    if (!selectedCalendarDay) return [];
    return transactionDetails.filter((detail) => {
      const d = new Date(detail.transaction.date);
      return (
        d.getFullYear() === activeYear &&
        d.getMonth() === activeMonth &&
        d.getDate() === selectedCalendarDay
      );
    });
  }, [transactionDetails, activeYear, activeMonth, selectedCalendarDay]);

  const EN_MONTHS = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
  ];
  const monthLabel = `${EN_MONTHS[activeMonth] || 'JANUARY'} ${activeYear}`;

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

  // Dynamic 50/30/20 percentages
  const { needsPct, wantsPct, savingsPct } = useMemo(() => {
    const estIncome = typeof budgetConfig?.estimatedIncome === 'number' ? budgetConfig.estimatedIncome : 0;
    const needsBudget = (estIncome * (budgetConfig?.needsPercent || 50)) / 100;
    const wantsBudget = (estIncome * (budgetConfig?.wantsPercent || 30)) / 100;
    const savingsBudget = (estIncome * (budgetConfig?.savingsPercent || 20)) / 100;

    let nSpent = 0;
    let wSpent = 0;
    let sSpent = 0;

    const catMap = new Map<string, string | undefined>(
      categories.map((c) => [c.id, c.budgetGroup])
    );

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getFullYear() === activeYear && d.getMonth() === activeMonth) {
        const group = tx.budgetGroup || (tx.categoryId ? catMap.get(tx.categoryId) : undefined);
        if (tx.type === 'expense') {
          if (group === 'kebutuhan') nSpent += tx.amount;
          else if (group === 'keinginan') wSpent += tx.amount;
          else if (group === 'tabungan') sSpent += tx.amount;
          else nSpent += tx.amount;
        } else if (tx.type === 'transfer' && group === 'tabungan') {
          sSpent += tx.amount;
        }
      }
    });

    return {
      needsPct: Math.min(100, Math.round((nSpent / (needsBudget || 1)) * 100)),
      wantsPct: Math.min(100, Math.round((wSpent / (wantsBudget || 1)) * 100)),
      savingsPct: Math.min(100, Math.round((sSpent / (savingsBudget || 1)) * 100)),
    };
  }, [transactions, budgetConfig, categories, activeYear, activeMonth]);

  // Dynamic top expense categories
  const topExpenses = useMemo(() => {
    const catTotalMap = new Map<string, number>();

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const d = new Date(tx.date);
        if (d.getFullYear() === activeYear && d.getMonth() === activeMonth) {
          const key = tx.categoryId || 'cat-lainnya';
          catTotalMap.set(key, (catTotalMap.get(key) || 0) + tx.amount);
        }
      }
    });

    const catInfoMap = new Map(categories.map((c) => [c.id, c]));

    const list = Array.from(catTotalMap.entries())
      .map(([catId, amount]) => {
        const cat = catInfoMap.get(catId);
        return {
          id: catId,
          name: cat?.name || 'Lainnya',
          group: (cat?.groupName || 'KEBUTUHAN').toUpperCase(),
          emoji: cat?.emoji || '💳',
          amount,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    if (list.length === 0) {
      return [
        { id: '1', name: 'Makan', group: 'KEBUTUHAN', emoji: '🍽️', amount: 0 },
        { id: '2', name: 'Belanja Online', group: 'KEINGINAN', emoji: '🛍️', amount: 0 },
      ];
    }

    return list;
  }, [transactions, categories, activeYear, activeMonth]);

  const budgetLimit = dashboardSummary.budgetLimit ?? 0;
  const budgetSpent = dashboardSummary.budgetSpent || 0;
  const remainingBudget = Math.max(0, budgetLimit - budgetSpent);

  const menuItems = [
    { id: 'budget', label: 'Budget', icon: PieChart, action: () => setActiveTab('budget') },
    { id: 'scanner', label: 'Scanner', icon: Camera, action: () => openScanModal() },
    { id: 'goals', label: 'Goals', icon: Target, action: () => setActiveTab('goals') },
    { id: 'aset', label: 'Aset', icon: Landmark, action: () => setActiveTab('assets') },
    { id: 'subscriptions', label: 'Langganan', icon: CalendarClock, action: () => setActiveTab('subscriptions') },
    { id: 'utang', label: 'Utang', icon: CreditCard, hasLock: true, action: () => setActiveTab('debt') },
    { id: 'investasi', label: 'Investasi', icon: TrendingUp, hasLock: true, action: () => setActiveTab('invest') },
    { id: 'health-score', label: 'Skor Sehat', icon: Activity, action: () => setActiveTab('health-score') },
    { id: 'ai-advisor', label: 'AI Advisor', icon: Sparkles, action: () => setActiveTab('ai-advisor') },
    { id: 'laporan', label: 'Laporan', icon: FileText, action: () => setActiveTab('reports') },
  ];

  const SHORT_MONTHS_ID = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const activePeriodLabel = `01 ${SHORT_MONTHS_ID[activeMonth] || 'Mar'} - ${daysInMonth} ${SHORT_MONTHS_ID[activeMonth] || 'Mar'}`;

  const dailyProgressPct =
    dashboardSummary.dailyBudgetQuota > 0
      ? Math.min(
          100,
          Math.max(
            12,
            Math.round(
              (dashboardSummary.dailyBudgetRemaining / dashboardSummary.dailyBudgetQuota) * 100
            )
          )
        )
      : 28;

  const dayRingPct = Math.min(100, Math.round((currentDay / (daysInMonth || 31)) * 100));

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-12">
      {/* 1. Header Greeting + Active Period Pill */}
      <div className="pt-2 lg:pt-1 px-1 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs lg:text-sm font-semibold text-gray-400 dark:text-gray-400">
              Halo, {userName} {greetingEmoji}
            </p>
            {user && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Cloud Sync
              </span>
            )}
          </div>
        </div>

        {/* Active Period Pill Badge (matching screenshot top-right) */}
        <div className="hidden sm:flex items-center gap-2.5 bg-white dark:bg-[#16181D] border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-2 shadow-xs">
          <div className="w-6 h-6 rounded-full bg-[#D4F826]/30 flex items-center justify-center text-[#658500] dark:text-[#D4F826]">
            <CalendarClock size={13} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-gray-400 block leading-none">
              ACTIVE PERIOD
            </span>
            <span className="text-[11px] font-black text-gray-900 dark:text-white mt-0.5 block leading-none">
              {activePeriodLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Multi-user Cloud Sync Prompt Banner if in Guest mode (Mobile only or compact) */}
      {!user && (
        <div className="lg:hidden bg-gradient-to-r from-emerald-500/10 via-lime-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:via-lime-950/30 dark:to-teal-950/40 border border-emerald-500/25 dark:border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4F826] text-black flex items-center justify-center shrink-0 font-black text-base shadow-xs">
              👥
            </div>
            <div className="text-xs">
              <p className="font-black text-gray-900 dark:text-white">
                Mau dipakai lebih dari 1 orang?
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-[11px]">
                Masuk dengan Google agar tiap orang punya catatan & dompet sendiri yang terpisah.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openLoginModal}
            className="px-3 py-1.5 rounded-xl bg-[#D4F826] hover:bg-[#cbf11e] text-black font-black text-xs shrink-0 transition-transform active:scale-95 shadow-xs cursor-pointer"
          >
            Masuk
          </button>
        </div>
      )}

      {/* Responsive Grid Container: Stacked on Mobile (<lg), Full-width Black Hero + Bento on Desktop (lg+) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
        {/* 2. Sekilas Hari Ini (Full-Width Black Banner on Desktop matching screenshot) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="order-1 lg:order-1 lg:col-span-12 relative overflow-hidden rounded-[28px] lg:rounded-[32px] p-5 lg:px-9 lg:py-7 bg-[#121316] text-white shadow-xl border border-white/5 flex flex-col justify-between"
        >
          {/* Top Label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
              <span className="text-[#D4F826]">⚡</span>
              <span>SEKILAS HARI INI</span>
            </div>
            <button
              type="button"
              onClick={toggleHideBalance}
              className="lg:hidden p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title={hide ? 'Tampilkan' : 'Sembunyikan'}
            >
              {hide ? <Lock size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          {/* Main Content Row: Left Big Balance + Right Pemasukan & Pengeluaran */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 my-3 lg:my-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight tabular-nums text-white leading-none">
                  {hide ? 'Rp ••••••' : formatRupiah(dashboardSummary.dailyBudgetRemaining, false)}
                </div>
                <button
                  type="button"
                  onClick={toggleHideBalance}
                  className="hidden lg:inline-flex p-1.5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer rounded-lg"
                  title={hide ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
                >
                  {hide ? <Lock size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2.5 font-medium flex items-center gap-1.5">
                <span>👆</span>
                <span>
                  {dashboardSummary.dailyBudgetQuota > 0
                    ? 'budget harian yang tersisa'
                    : 'budget harian belum diatur'}
                </span>
              </p>
            </div>

            {/* Pemasukan vs Pengeluaran on Right Side */}
            <div className="grid grid-cols-2 lg:flex lg:items-center gap-4 lg:gap-10 pt-3.5 lg:pt-0 border-t border-white/10 lg:border-t-0">
              <div>
                <span className="text-[9px] lg:text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">
                  PEMASUKAN
                </span>
                <div className="text-sm sm:text-base lg:text-lg font-black text-[#D4F826] mt-1 tabular-nums">
                  {hide ? 'Rp ••••••' : formatRupiah(todayIncome, false)}
                </div>
              </div>

              <div>
                <span className="text-[9px] lg:text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">
                  PENGELUARAN
                </span>
                <div className="text-sm sm:text-base lg:text-lg font-black text-[#F472B6] mt-1 tabular-nums">
                  {hide ? 'Rp ••••••' : formatRupiah(todayExpense, false)}
                </div>
              </div>
            </div>
          </div>

          {/* Full-width bottom progress line matching screenshot */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-3 lg:mt-4">
            <div
              className="h-full bg-[#D4F826] rounded-full transition-all duration-500"
              style={{ width: `${dailyProgressPct}%` }}
            />
          </div>
        </motion.div>

        {/* 3. Menu Utama (Mobile Only - hidden on Desktop since Sidebar has all links) */}
        <div className="order-2 lg:hidden bg-white dark:bg-[#16181D] rounded-3xl p-4 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Menu Utama</h3>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="text-[11px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={11} />
              <span>Ubah</span>
            </button>
          </div>

          <div className="grid grid-cols-5 gap-y-4 gap-x-1.5 text-center">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 flex items-center justify-center text-gray-800 dark:text-gray-200 group-hover:scale-105 group-hover:border-[#D4F826] transition-all relative">
                    <Icon size={20} strokeWidth={2} />
                    {item.hasLock && (
                      <span className="absolute -top-1.5 -right-1.5 text-[8px] font-black bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                        <Lock size={7} strokeWidth={3} />
                        <span>Max</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate max-w-full">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('tutorial')}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 hover:bg-[#D4F826]/20 dark:hover:bg-[#D4F826]/15 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs font-extrabold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#D4F826] text-black flex items-center justify-center">
                  <BookOpen size={13} strokeWidth={2.5} />
                </div>
                <span>Panduan Lengkap Semua Fitur & Cara Pakai</span>
              </div>
              <ChevronRight size={15} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* 4. Progres Pengeluaran (Full-width horizontal bar card on Desktop matching screenshot) */}
        <div className="order-3 lg:order-2 lg:col-span-12 bg-white dark:bg-[#16181D] rounded-[28px] lg:rounded-[32px] p-5 lg:px-8 lg:py-6 shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-12">
          {/* Left: Ring + Title */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
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
                  stroke="#9CA3AF"
                  strokeWidth="5"
                  strokeDasharray="150.8"
                  strokeDashoffset={150.8 - (dayRingPct / 100) * 150.8}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[7px] font-black uppercase text-gray-400 leading-none">
                  HARI
                </span>
                <span className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                  {currentDay}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white">
                Progres Pengeluaran
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Hari {currentDay} dari {daysInMonth}
              </p>
            </div>
          </div>

          {/* Right: 3 Wide Horizontal Bars */}
          <div className="flex-1 space-y-3.5">
            {/* Kebutuhan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#8B5CF6] text-[10px] uppercase tracking-wider">
                    KEBUTUHAN
                  </span>
                  <span className="text-gray-400 text-[10px]">
                    {needsPct >= 100
                      ? 'Melebihi budget'
                      : needsPct >= 80
                      ? 'Masih aman'
                      : 'Masih aman'}
                  </span>
                </div>
                <span className="font-extrabold text-gray-700 dark:text-gray-300 text-[11px]">
                  {needsPct}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#A78BFA] transition-all duration-300"
                  style={{ width: `${needsPct}%` }}
                />
              </div>
            </div>

            {/* Keinginan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#F97316] text-[10px] uppercase tracking-wider">
                    KEINGINAN
                  </span>
                  <span className="text-gray-400 text-[10px]">
                    {wantsPct >= 100
                      ? 'Melebihi budget'
                      : wantsPct >= 80
                      ? 'Perlu hemat'
                      : 'Masih aman'}
                  </span>
                </div>
                <span className="font-extrabold text-gray-700 dark:text-gray-300 text-[11px]">
                  {wantsPct}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#FB923C] transition-all duration-300"
                  style={{ width: `${wantsPct}%` }}
                />
              </div>
            </div>

            {/* Tabungan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#38BDF8] text-[10px] uppercase tracking-wider">
                    TABUNGAN
                  </span>
                  <span className="text-gray-400 text-[10px]">
                    {savingsPct >= 100
                      ? 'Target tercapai!'
                      : savingsPct > 50
                      ? 'Sedang menabung'
                      : 'Belum nabung nih?'}
                  </span>
                </div>
                <span className="font-extrabold text-gray-700 dark:text-gray-300 text-[11px]">
                  {savingsPct}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#38BDF8] transition-all duration-300"
                  style={{ width: `${savingsPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Aktivitas Bulan Ini (Left 6 Cols on Desktop matching screenshot) */}
        <div className="order-4 lg:order-3 lg:col-span-6 bg-white dark:bg-[#16181D] rounded-[28px] lg:rounded-[32px] p-5 lg:p-7 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white">
                Aktivitas Bulan Ini
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
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
                className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Bulan Ini
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
          <div className="grid grid-cols-7 text-center text-[10px] font-extrabold text-gray-400 pt-1 pb-1">
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
                return <div key={`empty-${idx}`} className="h-11 lg:h-14" />;
              }

              const exp = dailyExpensesMap[day];
              const inc = dailyIncomeMap[day];
              const isSelected = selectedCalendarDay === day;
              const hasActivity = !!exp || !!inc;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => setSelectedCalendarDay(day)}
                  className={`h-11 lg:h-14 rounded-xl flex flex-col justify-between p-1.5 lg:p-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#ECFCCB] dark:bg-[#D4F826]/25 ring-2 ring-[#D4F826] font-bold'
                      : hasActivity
                      ? 'bg-[#F4FDE1] dark:bg-[#D4F826]/10 hover:bg-[#ECFCCB]'
                      : 'bg-gray-50/70 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="text-[10px] text-gray-700 dark:text-gray-300 font-bold self-start leading-none">
                    {day}
                  </span>
                  {inc && (!exp || inc > exp) ? (
                    <span className="text-[8px] font-black text-emerald-500 self-end tabular-nums leading-none">
                      {hide
                        ? '+•••'
                        : `+${formatCompactRupiah(inc - (exp || 0)).replace('+', '').replace('-', '')}`}
                    </span>
                  ) : exp ? (
                    <span className="text-[8px] font-bold text-[#F472B6] self-end tabular-nums leading-none">
                      {hide
                        ? '-•••'
                        : `-${formatCompactRupiah(exp).replace('+', '').replace('-', '')}`}
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
              <div className="px-1 flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D4F826]" />
                  Pengeluaran Tgl {selectedCalendarDay} {SHORT_MONTHS_ID[activeMonth]}:
                </span>
                <span className="font-extrabold text-red-500 dark:text-red-400 tabular-nums text-sm">
                  {formatRupiah(dailyExpensesMap[selectedCalendarDay] || 0, hide)}
                </span>
              </div>

              {selectedDayTransactions.length > 0 ? (
                <div className="space-y-1.5 pt-0.5">
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
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-xs flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                            {category?.emoji || (isIncome ? '💰' : '💳')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {transaction.note || category?.name || 'Transaksi'}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                              {wallet.name} •{' '}
                              {category?.name || (isIncome ? 'Pemasukan' : 'Transfer')}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-xs font-black tabular-nums ${
                              isExpense
                                ? 'text-red-500 dark:text-red-400'
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
                </div>
              ) : (
                <div className="py-2.5 px-3 text-center bg-gray-50/60 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800/80 text-xs text-gray-400 flex items-center justify-between">
                  <span>Tidak ada transaksi pada tanggal ini</span>
                  <button
                    type="button"
                    onClick={() => {
                      const dateStr = `${activeYear}-${String(activeMonth + 1).padStart(
                        2,
                        '0'
                      )}-${String(selectedCalendarDay).padStart(2, '0')}`;
                      setActiveDate(dateStr);
                      openAddTransaction('expense');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-[#D4F826] text-black font-extrabold text-[11px] hover:bg-[#c6ec15] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} strokeWidth={3} />
                    <span>Catat</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 6. Transaksi Terbaru (Right 6 Cols on Desktop matching screenshot) */}
        <div className="order-5 lg:order-4 lg:col-span-6 bg-white dark:bg-[#16181D] rounded-[28px] lg:rounded-[32px] p-5 lg:p-7 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white">
              Transaksi Terbaru
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-bold text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Semua</span>
              <ChevronRight size={14} />
            </button>
          </div>

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
                  className="py-3.5 first:pt-1 last:pb-1 hover:bg-gray-50/40 dark:hover:bg-gray-800/20 transition-all cursor-pointer rounded-xl px-1"
                  onClick={() => setSelectedTxId(isExpanded ? null : transaction.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#FFE4E8] dark:bg-[#3D1E24] text-lg flex items-center justify-center shrink-0">
                        {category?.emoji || (isTransfer ? '🔄' : isIncome ? '💰' : '☕')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs lg:text-sm font-extrabold text-gray-900 dark:text-white truncate">
                          {transaction.note || category?.name || (isTransfer ? 'Transfer Antar Dompet' : 'Transaksi')}
                        </p>
                        <p className="text-[10px] lg:text-[11px] text-gray-400 mt-0.5">
                          {formatFullDateIndo(transaction.date)}
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
                      className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs space-y-2"
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
                            {isTransfer ? 'KE DOMPET' : 'KATEGORI'}
                          </span>
                          <span className="font-extrabold text-gray-800 dark:text-gray-200">
                            {isTransfer
                              ? transferWallet?.name || 'Dompet Tujuan'
                              : `${category?.emoji || ''} ${category?.name || 'Lainnya'}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
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
                            deleteTransaction(transaction.id);
                          }}
                          className="flex-1 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} />
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

        {/* 7. Row 3 on Desktop: 3 Equal Columns (Total Pemasukan, Total Pengeluaran, Runway Dana Darurat) */}
        {/* Col 1: Total Pemasukan */}
        <div className="order-6 lg:order-6 lg:col-span-4 bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
              TOTAL PEMASUKAN
            </span>
            <div className="text-2xl lg:text-[28px] font-black text-gray-900 dark:text-white mt-1.5 tabular-nums truncate">
              {formatRupiah(dashboardSummary.monthlyIncome, hide)}
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-block text-[10px] font-extrabold text-gray-900 bg-[#EBF998] px-2.5 py-0.5 rounded-md">
              {dashboardSummary.monthlyIncome > 0 ? '+100% vs periode lalu' : 'Belum ada pemasukan'}
            </span>
          </div>
        </div>

        {/* Col 2: Total Pengeluaran */}
        <div className="order-7 lg:order-7 lg:col-span-4 bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
              TOTAL PENGELUARAN
            </span>
            <div className="text-2xl lg:text-[28px] font-black text-gray-900 dark:text-white mt-1.5 tabular-nums truncate">
              {formatRupiah(dashboardSummary.monthlyExpense, hide)}
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-block text-[10px] font-extrabold text-rose-500 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 px-2.5 py-0.5 rounded-md">
              {dashboardSummary.monthlyExpense > 0 ? '+100% vs periode lalu' : 'Belum ada pengeluaran'}
            </span>
          </div>
        </div>

        {/* Col 3: Runway Dana Darurat */}
        <div className="order-8 lg:order-8 lg:col-span-4 bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-500 uppercase tracking-wider">
              <AlertCircle size={13} />
              <span>RUNWAY DANA DARURAT</span>
            </div>
            <span className="text-gray-400 dark:text-gray-500 text-xs cursor-pointer">ⓘ</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-[28px] font-black text-gray-900 dark:text-white tabular-nums leading-none">
              {dashboardSummary.emergencyFundRunwayMonths}
            </span>
            <span className="text-xs font-extrabold text-gray-400">Bulan</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((dashboardSummary.emergencyFundRunwayMonths / 12) * 100))}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-gray-400 font-semibold">
            Termasuk {formatRupiah(dashboardSummary.liquidAssetsTotal, hide)} dana likuid
          </p>
        </div>

        {/* 8. Row 4 on Desktop: Full-Width Tagihan Mendatang (lg:col-span-12) */}
        <div className="order-9 lg:order-9 lg:col-span-12 bg-[#0E0F12] rounded-[28px] lg:rounded-[32px] p-5 lg:p-7 text-white shadow-xl border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#D4F826]" />
            <h3 className="text-sm lg:text-base font-extrabold text-white">Tagihan Mendatang</h3>
          </div>

          {upcomingBills.length === 0 ? (
            <div className="py-5 text-center bg-white/[0.04] rounded-2xl border border-dashed border-white/10 text-xs text-gray-400">
              Belum ada tagihan mendatang yang tercatat
            </div>
          ) : (
            <div className="flex flex-wrap gap-3.5">
              {upcomingBills.map((bill) => (
                <div
                  key={bill.id}
                  className="w-[calc(50%-0.45rem)] sm:w-[195px] bg-[#1A1C20] rounded-2xl p-4 border border-white/[0.06] space-y-2.5"
                >
                  <span className="text-2xl block leading-none">{bill.iconEmoji}</span>
                  <div>
                    <p className="text-xs font-extrabold text-white truncate">{bill.name}</p>
                    <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                      Jatuh tempo {bill.dueDate}
                    </span>
                  </div>
                  <div className="pt-0.5">
                    <span className="text-xs lg:text-sm font-black text-[#D4F826] tabular-nums block">
                      {formatRupiah(bill.amount, hide)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 9. Row 5 on Desktop: Pengeluaran Terbesar (lg:col-span-6) & Realisasi Anggaran (lg:col-span-6) */}
        {/* Left Half: Pengeluaran Terbesar */}
        <div className="order-10 lg:order-10 lg:col-span-6 bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
          <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white">
            Pengeluaran Terbesar
          </h3>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1.5">
            {topExpenses.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#F8F9FA] dark:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-tight">
                      {item.name}
                    </p>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mt-0.5">
                      {item.group}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-gray-900 dark:text-white tabular-nums">
                  {formatRupiah(item.amount, hide)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Half: Realisasi Anggaran (Donut Gauge) */}
        <div className="order-11 lg:order-11 lg:col-span-6 bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-between text-center min-h-[320px]">
          <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white self-start">
            Realisasi Anggaran
          </h3>

          <div className="relative w-48 h-48 flex items-center justify-center my-auto">
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
              {/* Lavender Segment (Needs / Main Budget) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#B8A9F8"
                strokeWidth="11"
                strokeDasharray="130 238.76"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              {/* Peach/Orange Segment (Wants / Secondary) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#F7B27A"
                strokeWidth="11"
                strokeDasharray="45 238.76"
                strokeDashoffset="-142"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-3">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                SISA
              </span>
              <span className="text-base lg:text-lg font-black text-gray-900 dark:text-white tabular-nums mt-0.5">
                {formatRupiah(remainingBudget, hide)}
              </span>
            </div>
          </div>

          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
