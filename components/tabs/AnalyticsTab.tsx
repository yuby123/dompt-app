'use client';

import React, { useMemo, useState } from 'react';
import {
  Download,
  Calendar,
  Heart,
  TrendingUp,
  PieChart,
  BarChart3,
  Sparkles,
  Activity,
  ShieldCheck,
  CreditCard,
  ArrowUpRight,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { TabType, useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';
import { isDateInBudgetPeriod } from '@/lib/budgetUtils';

export function AnalyticsTab() {
  const {
    wallets,
    walletsWithBalance,
    totalBalance,
    liquidAssets: storedLiquidAssets,
    debts,
    goals,
    budgetConfig,
    dashboardSummary,
    totalIncome,
    totalExpense,
    transactions,
    categories,
    exportToCSV,
    settings,
    activeYear,
    activeMonth,
    budgetPeriod,
    setActiveTab,
  } = useApp();

  const hide = settings.hideBalance;
  const [activeView, setActiveView] = useState<'all' | 'health' | 'expenses'>('all');

  const monthLabel = useMemo(() => {
    if (budgetPeriod.isCustomPayday) {
      return budgetPeriod.periodShortLabel;
    }
    return new Date(activeYear, activeMonth, 1).toLocaleString('id-ID', {
      month: 'short',
      year: 'numeric',
    });
  }, [activeYear, activeMonth, budgetPeriod]);

  // Unified Health Metrics & Analytics Calculation
  const metrics = useMemo(() => {
    let explicitSaved = 0;
    let txCount = 0;
    const catMap = new Map<string, number>();
    const dayExpenseMap = new Map<string, { label: string; amount: number }>();
    const elapsedDaysInPeriod = Math.max(1, budgetPeriod.currentDayOfPeriod);
    const walletTypeMap = new Map(wallets.map((w) => [w.id, w.type]));

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (isDateInBudgetPeriod(d, budgetPeriod)) {
        txCount += 1;
        const targetWalletType = tx.transferWalletId
          ? walletTypeMap.get(tx.transferWalletId)
          : undefined;
        const isSavingsTx =
          tx.budgetGroup === 'tabungan' ||
          tx.categoryId === 'cat-tabungan' ||
          tx.categoryId === 'cat-investasi' ||
          (tx.type === 'transfer' &&
            (targetWalletType === 'savings' || targetWalletType === 'investment'));

        if (isSavingsTx) {
          explicitSaved += tx.amount;
        }
        if (tx.type === 'expense') {
          const key = tx.categoryId || 'cat-lainnya';
          catMap.set(key, (catMap.get(key) || 0) + tx.amount);
          const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const mShort = d.toLocaleString('id-ID', { month: 'short' });
          const dLabel = `${String(d.getDate()).padStart(2, '0')} ${mShort}`;
          const prev = dayExpenseMap.get(dateKey);
          dayExpenseMap.set(dateKey, {
            label: dLabel,
            amount: (prev?.amount || 0) + tx.amount,
          });
        }
      }
    });

    const actualIncome = dashboardSummary.monthlyIncome || 0;
    const estIncome = budgetConfig?.estimatedIncome || 0;
    const monthlyIncome = actualIncome > 0 ? actualIncome : estIncome;
    const monthlyExpense = dashboardSummary.monthlyExpense || totalExpense || 0;
    const budgetLimit = dashboardSummary.budgetLimit || 0;
    const runwayMonths = dashboardSummary.emergencyFundRunwayMonths || 0;

    // Liquid balance (positive non-credit wallets + extra liquidAssets) vs Credit/Paylater + Active Payable Debts
    const walletLiquid = walletsWithBalance
      .filter((w) => w.type !== 'credit' && w.type !== 'paylater' && w.balance > 0)
      .reduce((acc, w) => acc + w.balance, 0);
    const extraLiquid = (storedLiquidAssets || []).reduce(
      (acc, a) => acc + Math.max(0, a.amount || 0),
      0
    );
    const liquidAssets = walletLiquid + extraLiquid;

    const creditWalletDebt = walletsWithBalance
      .filter((w) => (w.type === 'credit' || w.type === 'paylater') && w.balance < 0)
      .reduce((acc, w) => acc + Math.abs(w.balance), 0);

    const activePayableDebt = (debts || [])
      .filter((d) => d.type === 'payable' && d.status === 'active')
      .reduce((acc, d) => acc + Math.max(0, d.remainingAmount ?? d.totalAmount), 0);

    const creditDebt = creditWalletDebt + activePayableDebt;

    const isZeroState =
      liquidAssets === 0 &&
      creditDebt === 0 &&
      monthlyIncome === 0 &&
      monthlyExpense === 0 &&
      goals.length === 0;

    // 1. Savings Rate Pillar (Max 30 pts) — Target >= 20%
    let savingsRatePct = 0;
    let savingsScore = 0;
    const realSurplus = actualIncome > 0 ? Math.max(0, actualIncome - monthlyExpense) : 0;
    const netSavings = Math.max(explicitSaved, realSurplus);

    if (monthlyIncome > 0) {
      savingsRatePct = Math.min(100, Math.max(0, Math.round((netSavings / monthlyIncome) * 100)));
      if (savingsRatePct >= 20) {
        savingsScore = 30;
      } else if (savingsRatePct > 0) {
        savingsScore = Math.round((savingsRatePct / 20) * 30);
      } else {
        savingsScore = 0;
      }
    } else if (liquidAssets > 0 && monthlyExpense === 0) {
      savingsRatePct = 100;
      savingsScore = 25;
    }

    // 2. Emergency Fund Runway Pillar (Max 25 pts) — Target >= 6 months
    let runwayScore = 0;
    if (runwayMonths >= 6) {
      runwayScore = 25;
    } else if (runwayMonths > 0) {
      runwayScore = Math.min(25, Math.round((runwayMonths / 6) * 25));
    }
    const runwayPct = Math.min(100, Math.round((runwayMonths / 6) * 100));

    // 3. Budget Discipline Pillar (Max 25 pts) — Target <= 100% of budgetLimit
    let budgetUsagePct = 0;
    let budgetDisciplinePct = 0;
    let budgetScore = 0;
    if (budgetLimit > 0) {
      budgetUsagePct = Math.round((monthlyExpense / budgetLimit) * 100);
      budgetDisciplinePct =
        budgetUsagePct <= 100
          ? 100
          : Math.max(0, Math.round(100 - (budgetUsagePct - 100)));
      if (budgetUsagePct <= 80) {
        budgetScore = 25;
      } else if (budgetUsagePct <= 100) {
        budgetScore = 20;
      } else if (budgetUsagePct <= 120) {
        budgetScore = 10;
      } else {
        budgetScore = 0;
      }
    } else if (monthlyExpense === 0) {
      budgetScore = isZeroState ? 0 : 15;
      budgetDisciplinePct = 0;
    } else {
      budgetUsagePct = 100;
      budgetScore = 10;
      budgetDisciplinePct = 50;
    }

    // 4. Debt Ratio Pillar (Max 20 pts) — Target 0% or < 20%
    let debtRatioPct = 0;
    let debtScore = isZeroState ? 0 : 20;
    if (creditDebt > 0) {
      const denominator = Math.max(liquidAssets, monthlyIncome);
      debtRatioPct = denominator > 0 ? Math.round((creditDebt / denominator) * 100) : 100;
      if (debtRatioPct <= 15) {
        debtScore = 17;
      } else if (debtRatioPct <= 30) {
        debtScore = 12;
      } else if (debtRatioPct <= 50) {
        debtScore = 6;
      } else {
        debtScore = 0;
      }
    }

    const totalScore = isZeroState
      ? 0
      : Math.min(100, Math.max(0, savingsScore + runwayScore + budgetScore + debtScore));

    const grade = isZeroState
      ? 'Belum Dinilai'
      : totalScore >= 85
      ? 'Sangat Prima'
      : totalScore >= 70
      ? 'Sehat & Stabil'
      : totalScore >= 50
      ? 'Cukup Sehat'
      : 'Perlu Perhatian';

    const summaryText = isZeroState
      ? 'Data keuangan Anda masih Rp 0. Isi saldo dompet, estimasi pemasukan di menu Budget, atau catat transaksi untuk melihat analisis Skor Kesehatan Keuangan Anda.'
      : totalScore >= 85
      ? 'Luar biasa! Rasio tabungan, dana darurat, dan kendali anggaran Anda berada di level sangat sehat.'
      : totalScore >= 70
      ? 'Kondisi keuangan Anda sudah stabil. Pertahankan disiplin anggaran dan terus tingkatkan dana darurat hingga 6 bulan.'
      : totalScore >= 50
      ? 'Keuangan Anda cukup terkendali, namun masih ada ruang perbaikan pada porsi tabungan atau dana darurat.'
      : 'Perhatikan kembali batas pengeluaran bulanan, rasio utang konsumtif, serta mulailah menyisihkan dana darurat.';

    // Category sorting for donut & list
    const catInfoMap = new Map(categories.map((c) => [c.id, c]));
    const list = Array.from(catMap.entries())
      .map(([catId, amount]) => {
        const cat = catInfoMap.get(catId);
        const pctNum = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
        const pct = pctNum.toFixed(1) + '%';
        return {
          name: cat?.name || 'Lainnya',
          emoji: cat?.emoji || '💳',
          amount,
          pct,
          pctNum,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    const avgDaily = Math.round(totalExpense / elapsedDaysInPeriod);

    let maxDayLabel = '';
    let maxDayAmt = 0;
    dayExpenseMap.forEach((info) => {
      if (info.amount > maxDayAmt) {
        maxDayAmt = info.amount;
        maxDayLabel = info.label;
      }
    });

    const maxDayStr =
      maxDayAmt > 0
        ? `${maxDayLabel} – ${formatRupiah(maxDayAmt, hide)}`
        : 'Belum ada pengeluaran';

    const zeroDays = Math.max(0, elapsedDaysInPeriod - dayExpenseMap.size);

    return {
      isZeroState,
      totalScore,
      grade,
      summaryText,
      savingsScore,
      savingsRatePct,
      runwayScore,
      runwayMonths,
      runwayPct,
      budgetScore,
      budgetUsagePct,
      budgetDisciplinePct,
      debtScore,
      debtRatioPct,
      creditDebt,
      liquidAssets,
      savedAmount: Math.max(0, netSavings),
      savingsRateStr: savingsRatePct.toString(),
      topCategories:
        list.length > 0
          ? list
          : [{ name: 'Belum ada data', emoji: '🍽️', amount: 0, pct: '0%', pctNum: 0 }],
      avgDailyExpense: avgDaily,
      maxExpenseDayLabel: maxDayStr,
      txCountThisMonth: txCount,
      zeroExpenseDays: zeroDays,
    };
  }, [
    wallets,
    walletsWithBalance,
    storedLiquidAssets,
    transactions,
    budgetPeriod,
    dashboardSummary,
    budgetConfig,
    goals.length,
    debts,
    categories,
    totalExpense,
    hide,
  ]);

  const pillars = [
    {
      id: 'savings',
      title: 'Rasio Menabung (Savings Rate)',
      icon: TrendingUp,
      score: metrics.savingsScore,
      maxScore: 30,
      metricText: `${metrics.savingsRatePct}% dari pemasukan`,
      targetText: 'Ideal: Minimal 20% disisihkan per bulan',
      actionTab: 'budget' as TabType,
      actionLabel: 'Atur Pemasukan & Tabungan',
    },
    {
      id: 'runway',
      title: 'Ketahanan Dana Darurat',
      icon: ShieldCheck,
      score: metrics.runwayScore,
      maxScore: 25,
      metricText: `${metrics.runwayMonths} bulan biaya hidup`,
      targetText: 'Ideal: 3 - 6 bulan pengeluaran rutin',
      actionTab: 'goals' as TabType,
      actionLabel: 'Buka Dana Darurat',
    },
    {
      id: 'budget',
      title: 'Kedisiplinan Budget Bulanan',
      icon: PieChart,
      score: metrics.budgetScore,
      maxScore: 25,
      metricText:
        dashboardSummary.budgetLimit > 0
          ? `${metrics.budgetUsagePct}% kuota terpakai`
          : 'Budget belum diatur',
      targetText: 'Ideal: Pengeluaran <= 85% batas budget',
      actionTab: 'budget' as TabType,
      actionLabel: 'Kelola Pos Budget',
    },
    {
      id: 'debt',
      title: 'Kesehatan Beban Utang & Kredit',
      icon: CreditCard,
      score: metrics.debtScore,
      maxScore: 20,
      metricText:
        metrics.creditDebt === 0
          ? 'Bebas utang konsumtif (0%)'
          : `Rasio kewajiban ${metrics.debtRatioPct}%`,
      targetText: 'Ideal: Cicilan & kredit < 20% aset likuid',
      actionTab: 'debt' as TabType,
      actionLabel: 'Pantau Utang',
    },
  ];

  const donutColors = ['#7C3AED', '#F97316', '#EC4899', '#10B981', '#3B82F6', '#EAB308'];
  const circumference = 219.8; // 2 * pi * 35

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header with Title and Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 lg:pt-0 px-0.5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Analisis & Skor Keuangan</span>
          </h1>
          <p className="text-xs lg:text-sm font-semibold text-gray-400 mt-0.5">
            Diagnostik kesehatan finansial, rincian pengeluaran, dan tren arus kas bulanan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="h-10 flex items-center justify-center gap-1.5 px-3.5 rounded-full bg-white dark:bg-[#16181D] border border-gray-200/80 dark:border-gray-800 text-xs font-black text-gray-700 dark:text-gray-300 shadow-2xs whitespace-nowrap">
            <Calendar size={14} className="shrink-0" />
            <span className="truncate">{monthLabel}</span>
          </div>
          <button
            type="button"
            onClick={exportToCSV}
            className="h-10 px-4 rounded-full bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center gap-2 font-extrabold text-xs shadow-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
            title="Unduh Laporan CSV"
          >
            <Download size={15} strokeWidth={2.5} className="shrink-0" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* View Switcher: Filter between All, Skor Kesehatan, and Analisis Pengeluaran */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-200/70 dark:bg-white/[0.06] rounded-2xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveView('all')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeView === 'all'
              ? 'bg-white dark:bg-[#16181D] text-gray-950 dark:text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Semua Ringkasan
        </button>
        <button
          type="button"
          onClick={() => setActiveView('health')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeView === 'health'
              ? 'bg-white dark:bg-[#16181D] text-gray-950 dark:text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Activity size={14} className="text-[#84CC16] dark:text-[#D4F826]" />
          <span>Skor Sehat & 4 Pilar</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('expenses')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeView === 'expenses'
              ? 'bg-white dark:bg-[#16181D] text-gray-950 dark:text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 size={14} className="text-blue-500" />
          <span>Tren & Pengeluaran</span>
        </button>
      </div>

      {/* SECTION 1: FINANCIAL HEALTH SCORE HERO (Visible in 'all' and 'health') */}
      {(activeView === 'all' || activeView === 'health') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] text-white p-5 lg:px-9 lg:py-7 rounded-[28px] lg:rounded-[32px] shadow-xl border border-white/10 space-y-4"
        >
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
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-black text-[#D4F826] uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={13} />
              <span>SKOR KESEHATAN FINANSIAL</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#D4F826] text-black text-[10px] font-black uppercase">
              Status: {metrics.grade}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl lg:text-6xl font-black tabular-nums text-[#D4F826] leading-none">
                {metrics.totalScore}
              </span>
              <span className="text-lg font-extrabold text-gray-400">/ 100</span>
            </div>

            <div className="lg:text-right text-xs">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">
                KAS LIKUID BERSIH
              </span>
              <span className="text-lg lg:text-2xl font-black text-white tabular-nums">
                {formatRupiah(totalBalance, hide)}
              </span>
            </div>
          </div>

          {/* Score Progress Bar */}
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#D4F826] transition-all duration-500"
              style={{ width: `${metrics.totalScore}%` }}
            />
          </div>

          <p className="text-xs lg:text-sm text-gray-300 leading-relaxed font-medium">
            {metrics.summaryText}
          </p>

          {metrics.isZeroState && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('wallets')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-black cursor-pointer"
              >
                1. Isi Saldo Dompet
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('budget')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-extrabold cursor-pointer"
              >
                2. Atur Pemasukan
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* SECTION 2: 4 PILLARS BREAKDOWN (Visible in 'all' and 'health') */}
      {(activeView === 'all' || activeView === 'health') && (
        <div className="space-y-3">
          <div className="px-1 flex items-center justify-between">
            <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity size={16} className="text-[#84CC16] dark:text-[#D4F826]" />
              <span>Rincian 4 Pilar Finansial</span>
            </h3>
            <span className="text-[11px] font-bold text-gray-400">Total Bobot: 100 Poin</span>
          </div>

          <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
            {pillars.map((p) => {
              const Icon = p.icon;
              const pct = Math.round((p.score / p.maxScore) * 100);
              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3 hover:border-[#D4F826]/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-800 dark:text-gray-200 shrink-0">
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs lg:text-sm font-extrabold text-gray-900 dark:text-white">
                          {p.title}
                        </h4>
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                          {p.metricText}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm lg:text-base font-black text-gray-900 dark:text-white tabular-nums">
                        {p.score}
                      </span>
                      <span className="text-xs font-bold text-gray-400"> / {p.maxScore}</span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct >= 75
                          ? 'bg-emerald-500'
                          : pct >= 45
                          ? 'bg-[#D4F826]'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-gray-400 font-medium">{p.targetText}</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab(p.actionTab)}
                      className="font-extrabold text-gray-900 dark:text-[#D4F826] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{p.actionLabel}</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: CASHFLOW METRICS (Visible in 'all' and 'expenses') */}
      {(activeView === 'all' || activeView === 'expenses') && (
        <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-[28px] lg:rounded-[32px] p-5 lg:px-9 lg:py-7 text-white shadow-xl border border-white/10">
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
          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                ESTIMASI DITABUNG
              </span>
              <div className="text-lg sm:text-2xl font-black text-[#D4F826] tabular-nums truncate">
                {formatRupiah(metrics.savedAmount, hide)}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                RASIO MENABUNG
              </span>
              <div className="text-lg sm:text-2xl font-black text-[#D4F826] tabular-nums">
                {metrics.savingsRatePct}%
              </div>
            </div>

            <div className="space-y-1 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                ↗ TOTAL PEMASUKAN
              </span>
              <div className="text-lg sm:text-2xl font-black text-white tabular-nums truncate">
                {formatRupiah(totalIncome, hide)}
              </div>
            </div>

            <div className="space-y-1 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                ↘ TOTAL PENGELUARAN
              </span>
              <div className="text-lg sm:text-2xl font-black text-[#FB7185] tabular-nums truncate">
                {formatRupiah(totalExpense, hide)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: DETAILED ANALYTICS 12-COL GRID (Visible in 'all' and 'expenses') */}
      {(activeView === 'all' || activeView === 'expenses') && (
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-5 lg:items-start">
          {/* 1. Skor Kesehatan Finansial Gauge (Left 4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-[#16181D] rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-gray-800 text-center space-y-4">
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#E5E7EB"
                  strokeWidth="10"
                  className="dark:stroke-gray-800"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#2563EB"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={Math.max(0, 251.2 - (metrics.totalScore / 100) * 251.2)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-gray-900 dark:text-white leading-none tabular-nums">
                  {metrics.totalScore}
                </span>
                <span className="text-[10px] font-bold text-gray-400 mt-0.5">/ 100</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-gray-900 dark:text-white">
                <Heart size={14} className="text-red-500 fill-red-500" />
                <span>Skor Kesehatan Finansial</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs mx-auto leading-relaxed">
                Kalkulasi otomatis dari rasio tabungan, disiplin anggaran, dana darurat, dan beban utang.
              </p>
              <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-md">
                {metrics.grade}
              </span>
            </div>

            {/* Health Breakdown Bars */}
            <div className="space-y-3 pt-2 text-left">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-bold">Rasio Tabungan</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {metrics.savingsRatePct}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, metrics.savingsRatePct)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-bold">Disiplin Anggaran</span>
                  <span className="font-extrabold text-violet-600 dark:text-violet-400 tabular-nums">
                    {metrics.budgetDisciplinePct}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${metrics.budgetDisciplinePct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-bold">Keamanan & Runway</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                    {metrics.runwayPct}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${metrics.runwayPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Rincian Pengeluaran Donut (Middle 4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-[#16181D] rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Rincian Pengeluaran
            </h3>

            <div className="relative w-40 h-40 mx-auto flex items-center justify-center my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="transparent"
                  stroke="#E5E7EB"
                  strokeWidth="10"
                  className="dark:stroke-gray-800"
                />
                {totalExpense > 0 &&
                  (() => {
                    let accumulatedPct = 0;
                    return metrics.topCategories.map((cat, idx) => {
                      const segLength = (cat.pctNum / 100) * circumference;
                      const offset = circumference - segLength;
                      const rotation = (accumulatedPct / 100) * 360;
                      accumulatedPct += cat.pctNum;
                      return (
                        <circle
                          key={cat.name}
                          cx="50"
                          cy="50"
                          r="35"
                          fill="transparent"
                          stroke={donutColors[idx % donutColors.length]}
                          strokeWidth="10"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          transform={`rotate(${rotation} 50 50)`}
                        />
                      );
                    });
                  })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
                <span className="text-xs font-black text-gray-900 dark:text-white tabular-nums">
                  {formatRupiah(totalExpense, hide)}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                KATEGORI TERATAS
              </span>

              {metrics.topCategories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.emoji}</span>
                    <span className="font-extrabold text-gray-900 dark:text-white">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-gray-900 dark:text-white tabular-nums">
                      {formatRupiah(cat.amount, hide)}
                    </span>
                    <span className="text-[10px] text-gray-400 block">{cat.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Ringkasan Cepat + Insight AI (Right 4 cols) */}
          <div className="lg:col-span-4 space-y-4 lg:space-y-5">
            {/* Ringkasan Cepat */}
            <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                Ringkasan Cepat
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Rata-rata / hari</span>
                  <span className="font-black text-gray-900 dark:text-white tabular-nums">
                    {formatRupiah(metrics.avgDailyExpense, hide)}/hari
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Hari terboros</span>
                  <span className="font-black text-red-500 tabular-nums">
                    {metrics.maxExpenseDayLabel}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between gap-2">
                  <span className="text-gray-500 dark:text-gray-400">
                    Total transaksi bulan ini
                  </span>
                  <span className="font-black text-gray-900 dark:text-white tabular-nums">
                    {metrics.txCountThisMonth} transaksi
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Hari tanpa pengeluaran</span>
                  <span className="font-black text-[#84CC16] dark:text-[#D4F826]">
                    {metrics.zeroExpenseDays} hari hemat!
                  </span>
                </div>
              </div>
            </div>

            {/* Insight AI */}
            <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-[#84CC16] dark:text-[#D4F826]" />
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Insight AI</h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400">Periode {monthLabel}</span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl space-y-1.5 text-xs">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  RINGKASAN PERFORMA
                </span>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Kondisi keuangan Anda periode ini berada pada skor <strong>{metrics.totalScore}/100</strong> ({metrics.grade}) dengan rasio tabungan <strong>{metrics.savingsRatePct}%</strong>. Pertahankan pencatatan rutin dan kendalikan pengeluaran harian.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consult AI Advisor CTA */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>Ingin meningkatkan skor kesehatan keuangan Anda?</span>
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            Diskusikan strategi optimasi tabungan, alokasi budget 50/30/20, dan pelunasan utang bersama Dompt AI Advisor.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('ai-advisor')}
          className="px-3.5 py-2.5 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-black shrink-0 cursor-pointer"
        >
          Tanya AI
        </button>
      </div>
    </div>
  );
}
