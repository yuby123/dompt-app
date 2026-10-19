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
  Eye,
  EyeOff,
  AlertCircle,
  Pencil,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../AppContext';
import { formatCompactRupiah, formatRupiah, formatFullDateIndo } from '@/lib/formatters';
import { TransactionDetail } from '@/lib/types';

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
  } = useApp();

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const hide = settings.hideBalance;
  const userName = settings.userName || 'Trisna';

  // Quick greetings
  const currentHour = new Date().getHours();
  const greetingEmoji = currentHour >= 18 || currentHour < 5 ? '🌙' : currentHour >= 12 ? '☀️' : '🌅';

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

  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(() => currentDay);

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

  const monthLabel = refDateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  const handlePrevMonth = () => {
    const prevMonthDate = new Date(activeYear, activeMonth - 1, 1);
    const y = prevMonthDate.getFullYear();
    const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
    setActiveDate(`${y}-${m}-01`);
    setSelectedCalendarDay(1);
  };

  const handleNextMonth = () => {
    const nextMonthDate = new Date(activeYear, activeMonth + 1, 1);
    const y = nextMonthDate.getFullYear();
    const m = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    setActiveDate(`${y}-${m}-01`);
    setSelectedCalendarDay(1);
  };

  const handleTodayMonth = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setActiveDate(`${y}-${m}-${d}`);
    setSelectedCalendarDay(today.getDate());
  };

  // Dynamic 50/30/20 percentages
  const { needsPct, wantsPct, savingsPct } = useMemo(() => {
    const estIncome = budgetConfig.estimatedIncome || 5000000;
    const needsBudget = (estIncome * (budgetConfig.needsPercent || 50)) / 100;
    const wantsBudget = (estIncome * (budgetConfig.wantsPercent || 30)) / 100;
    const savingsBudget = (estIncome * (budgetConfig.savingsPercent || 20)) / 100;

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

  const budgetLimit = dashboardSummary.budgetLimit || 5000000;
  const budgetSpent = dashboardSummary.budgetSpent || 0;
  const remainingBudget = Math.max(0, budgetLimit - budgetSpent);

  const menuItems = [
    { id: 'budget', label: 'Budget', icon: PieChart, action: () => setActiveTab('budget') },
    { id: 'scanner', label: 'Scanner', icon: Camera, action: () => openScanModal() },
    { id: 'goals', label: 'Goals', icon: Target, action: () => setActiveTab('goals') },
    { id: 'aset', label: 'Aset', icon: Landmark, action: () => setActiveTab('assets') },
    { id: 'utang', label: 'Utang', icon: CreditCard, hasLock: true, action: () => setActiveTab('debt') },
    { id: 'investasi', label: 'Investasi', icon: TrendingUp, hasLock: true, action: () => setActiveTab('invest') },
    { id: 'ai-advisor', label: 'AI Advisor', icon: Sparkles, action: () => setActiveTab('ai-advisor') },
    { id: 'laporan', label: 'Laporan', icon: FileText, action: () => setActiveTab('reports') },
  ];

  return (
    <div className="space-y-4 pb-28">
      {/* 1. Header Greeting */}
      <div className="pt-2 px-1">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Dashboard
        </h1>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
          Halo, {userName} {greetingEmoji}
        </p>
      </div>

      {/* 2. Sekilas Hari Ini (Dark Pill Card matching video) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-5 bg-[#14161C] text-white shadow-xl border border-white/5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#D4F826]">
            <span>⚡ SEKILAS HARI INI</span>
          </div>
          <button
            type="button"
            onClick={toggleHideBalance}
            className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title={hide ? 'Tampilkan' : 'Sembunyikan'}
          >
            {hide ? <EyeOff size={16} /> : <Lock size={16} />}
          </button>
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums text-white">
            {formatRupiah(dashboardSummary.dailyBudgetRemaining, hide)}
          </div>
          <p className="text-xs text-gray-400 mt-1 font-medium">budget harian yang tersisa</p>
        </div>

        {/* Pemasukan vs Pengeluaran Split */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              PEMASUKAN
            </span>
            <div className="text-sm sm:text-base font-extrabold text-[#D4F826] mt-0.5 tabular-nums">
              {formatRupiah(todayIncome, hide)}
            </div>
            {/* Dotted indicator */}
            <div className="flex gap-1 mt-1.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-1.5 w-2 rounded-full bg-[#D4F826]" />
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              PENGELUARAN
            </span>
            <div className="text-sm sm:text-base font-extrabold text-[#FF8596] mt-0.5 tabular-nums">
              {formatRupiah(todayExpense, hide)}
            </div>
            {/* Dotted indicator */}
            <div className="flex gap-1 mt-1.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-1.5 w-2 rounded-full bg-[#FF8596]" />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. Menu Utama (8 Grid Items) */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-4 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3.5">
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

        <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 flex items-center justify-center text-gray-800 dark:text-gray-200 group-hover:scale-105 group-hover:border-[#D4F826] transition-all relative">
                  <Icon size={22} strokeWidth={2} />
                  {item.hasLock && (
                    <span className="absolute -top-1.5 -right-1.5 text-[8px] font-black bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                      <Lock size={7} strokeWidth={3} />
                      <span>Max</span>
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Progres Pengeluaran (50/30/20) */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center shrink-0">
            <span className="text-[8px] font-black uppercase text-gray-400">HARI</span>
            <span className="text-sm font-black text-gray-900 dark:text-white leading-none">{currentDay}</span>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Progres Pengeluaran
            </h3>
            <p className="text-xs text-gray-400">Hari {currentDay} dari {daysInMonth}</p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* Kebutuhan */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-violet-600 dark:text-violet-400 text-[11px]">
                KEBUTUHAN
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[10px]">
                  {needsPct >= 100 ? 'Melebihi budget' : needsPct >= 80 ? 'Perlu hemat' : 'Masih aman'}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">{needsPct}%</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-violet-500 transition-all duration-300" style={{ width: `${needsPct}%` }} />
            </div>
          </div>

          {/* Keinginan */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-pink-500 dark:text-pink-400 text-[11px]">
                KEINGINAN
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[10px]">
                  {wantsPct >= 100 ? 'Melebihi budget' : wantsPct >= 80 ? 'Perlu hemat' : 'Masih aman'}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">{wantsPct}%</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-pink-500 transition-all duration-300" style={{ width: `${wantsPct}%` }} />
            </div>
          </div>

          {/* Tabungan */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-teal-500 dark:text-teal-400 text-[11px]">
                TABUNGAN
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[10px]">
                  {savingsPct >= 100 ? 'Target tercapai!' : savingsPct > 50 ? 'Sedang menabung' : 'Belum nabung nih?'}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">{savingsPct}%</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-teal-400 transition-all duration-300" style={{ width: `${savingsPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Aktivitas Bulan Ini (Interactive Calendar Heatmap) */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Aktivitas Bulan Ini
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 -ml-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Bulan Sebelumnya"
                aria-label="Bulan Sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 tracking-wider">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Bulan Berikutnya"
                aria-label="Bulan Berikutnya"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleTodayMonth}
              className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              title="Kembali ke Bulan/Hari Ini"
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className="text-xs font-bold text-gray-500 hover:text-black dark:hover:text-white flex items-center gap-0.5 cursor-pointer ml-1"
            >
              <span>Analisis</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center text-[10px] font-extrabold text-gray-400 pt-2 border-b border-gray-100 dark:border-gray-800 pb-2">
          <span>SN</span>
          <span>SL</span>
          <span>RB</span>
          <span>KM</span>
          <span>JM</span>
          <span>SB</span>
          <span>MG</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-10" />;
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
                className={`h-11 rounded-xl flex flex-col items-center justify-between p-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#D4F826]/35 dark:bg-[#D4F826]/25 border-2 border-[#D4F826] font-bold shadow-xs'
                    : hasActivity
                    ? 'bg-[#D4F826]/15 dark:bg-[#D4F826]/10 hover:bg-[#D4F826]/25 border border-[#D4F826]/30'
                    : 'bg-gray-50/70 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-[10px] text-gray-700 dark:text-gray-300 font-bold">{day}</span>
                {inc && (!exp || inc > exp) ? (
                  <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                    +{formatCompactRupiah(inc - (exp || 0)).replace('+', '').replace('-', '')}
                  </span>
                ) : exp ? (
                  <span className="text-[8px] font-bold text-red-500 dark:text-red-400 tabular-nums leading-none">
                    -{formatCompactRupiah(exp).replace('+', '').replace('-', '')}
                  </span>
                ) : (
                  <span className="text-[8px] text-transparent select-none">-</span>
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
                Pengeluaran Tgl {selectedCalendarDay} {refDateObj.toLocaleString('id-ID', { month: 'short' })}:
              </span>
              <span className="font-extrabold text-red-500 dark:text-red-400 tabular-nums text-sm">
                {formatRupiah(dailyExpensesMap[selectedCalendarDay] || 0, hide)}
              </span>
            </div>

            {/* List of transactions on this day */}
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
                            {wallet.name} • {category?.name || (isIncome ? 'Pemasukan' : 'Transfer')}
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
                    const dateStr = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}-${String(selectedCalendarDay).padStart(2, '0')}`;
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

      {/* 6. Transaksi Terbaru (Latest Transactions) */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
            Transaksi Terbaru
          </h3>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-bold text-gray-500 hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <span>Semua</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-2">
          {transactionDetails.slice(0, 5).map((detail) => {
            const { transaction, wallet, category } = detail;
            const isExpanded = selectedTxId === transaction.id;

            return (
              <div
                key={transaction.id}
                className="rounded-2xl border border-gray-100 dark:border-gray-800/80 p-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all cursor-pointer"
                onClick={() => setSelectedTxId(isExpanded ? null : transaction.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#FFE4E8] dark:bg-[#3D1E24] text-xl flex items-center justify-center shrink-0">
                      {category?.emoji || '☕'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                        {transaction.note || category?.name || 'Transaksi'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatFullDateIndo(transaction.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-gray-900 dark:text-white tabular-nums">
                      {transaction.type === 'expense' ? '-' : '+'}
                      {formatRupiah(transaction.amount, hide)}
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
                        <span className="text-gray-400 block text-[9px] uppercase font-bold">DARI</span>
                        <span className="font-extrabold text-gray-800 dark:text-gray-200">{wallet.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase font-bold">KATEGORI</span>
                        <span className="font-extrabold text-gray-800 dark:text-gray-200">
                          {category?.emoji} {category?.name || 'Lainnya'}
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

      {/* 7. Total Pemasukan & Pengeluaran Big Cards */}
      <div className="space-y-3">
        {/* Total Pemasukan */}
        <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
            TOTAL PEMASUKAN
          </span>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1 tabular-nums">
            {formatRupiah(dashboardSummary.monthlyIncome, hide)}
          </div>
          <span className="inline-block mt-2 text-[10px] font-black text-black bg-[#D4F826] px-2.5 py-0.5 rounded-full">
            +100% vs periode lalu
          </span>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
            TOTAL PENGELUARAN
          </span>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1 tabular-nums">
            {formatRupiah(dashboardSummary.monthlyExpense, hide)}
          </div>
          <span className="inline-block mt-2 text-[10px] font-black text-black bg-[#D4F826] px-2.5 py-0.5 rounded-full">
            +100% vs periode lalu
          </span>
        </div>
      </div>

      {/* 8. Runway Dana Darurat */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-500 uppercase tracking-wider">
            <AlertCircle size={14} />
            <span>RUNWAY DANA DARURAT</span>
          </div>
          <span className="text-gray-400 dark:text-gray-500 text-xs cursor-pointer">ⓘ</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-gray-900 dark:text-white">
            {dashboardSummary.emergencyFundRunwayMonths}
          </span>
          <span className="text-sm font-extrabold text-gray-400">Bulan</span>
        </div>
        <p className="text-xs text-gray-400">
          Termasuk {formatRupiah(dashboardSummary.liquidAssetsTotal, hide)} dana likuid
        </p>
      </div>

      {/* 9. Tagihan Mendatang (Upcoming Bills) */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 text-gray-900 dark:text-white shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-[#D4F826]" />
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Tagihan Mendatang</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {upcomingBills.map((bill) => (
            <div
              key={bill.id}
              className="bg-gray-50 dark:bg-black/40 rounded-2xl p-3 border border-gray-100 dark:border-white/5 space-y-1"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-300">
                <span>{bill.iconEmoji}</span>
                <span className="truncate">{bill.name}</span>
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Jatuh tempo {bill.dueDate}</span>
              <div className="pt-1.5">
                <span className="inline-block bg-[#D4F826] text-black text-xs font-black px-2.5 py-1 rounded-xl tabular-nums shadow-xs">
                  {formatRupiah(bill.amount, hide)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10. Pengeluaran Terbesar (Top Expenses) */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
          Pengeluaran Terbesar
        </h3>

        <div className="space-y-3">
          {topExpenses.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-tight">
                    {item.name}
                  </p>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
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

      {/* 11. Realisasi Anggaran (Donut Gauge) */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center space-y-3">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white self-start">
          Realisasi Anggaran
        </h3>

        <div className="relative w-40 h-40 flex items-center justify-center my-2">
          {/* Circular Donut Mockup */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#E5E7EB"
              strokeWidth="12"
              className="dark:stroke-gray-800"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#7C3AED"
              strokeWidth="12"
              strokeDasharray="251.2"
              strokeDashoffset={Math.max(0, 251.2 - (Math.min(1, budgetSpent / (budgetLimit || 1)) * 251.2))}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SISA</span>
            <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
              {formatRupiah(remainingBudget, hide)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('budget')}
          className="w-full py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-100 cursor-pointer"
        >
          Lihat Detail Anggaran
        </button>
      </div>
    </div>
  );
}
