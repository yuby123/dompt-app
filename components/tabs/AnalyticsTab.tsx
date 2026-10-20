'use client';

import React, { useMemo } from 'react';
import {
  Download,
  Calendar,
  Heart,
  TrendingUp,
  TrendingDown,
  Sparkles,
  PieChart,
  BarChart3,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';

export function AnalyticsTab() {
  const {
    wallets,
    walletsWithBalance,
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
  } = useApp();
  const hide = settings.hideBalance;

  const monthLabel = useMemo(() => {
    return new Date(activeYear, activeMonth, 1).toLocaleString('id-ID', { month: 'short', year: 'numeric' });
  }, [activeYear, activeMonth]);

  const {
    savedAmount,
    savingsRate,
    budgetDisciplinePct,
    runwayPct,
    topCategories,
    avgDailyExpense,
    maxExpenseDayLabel,
    txCountThisMonth,
    zeroExpenseDays,
    dynamicScore,
  } = useMemo(() => {
    let explicitSaved = 0;
    let txCount = 0;
    const catMap = new Map<string, number>();
    const dayExpenseMap = new Map<number, number>();
    const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
    const walletTypeMap = new Map(wallets.map((w) => [w.id, w.type]));

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getFullYear() === activeYear && d.getMonth() === activeMonth) {
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
          const dayNum = d.getDate();
          dayExpenseMap.set(dayNum, (dayExpenseMap.get(dayNum) || 0) + tx.amount);
        }
      }
    });

    const effectiveIncome =
      totalIncome > 0 ? totalIncome : budgetConfig?.estimatedIncome || 0;
    const cashflowSurplus = totalIncome > 0 ? Math.max(0, totalIncome - totalExpense) : 0;
    const netSaved = Math.max(explicitSaved, cashflowSurplus);
    const rateNum =
      effectiveIncome > 0 ? Math.min(100, Math.max(0, (netSaved / effectiveIncome) * 100)) : 0;
    const rate = rateNum.toFixed(1);

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

    const avgDaily = Math.round(totalExpense / Math.max(1, daysInMonth));

    let maxDay = 0;
    let maxDayAmt = 0;
    dayExpenseMap.forEach((amt, day) => {
      if (amt > maxDayAmt) {
        maxDayAmt = amt;
        maxDay = day;
      }
    });

    const shortMonth = new Date(activeYear, activeMonth, 1).toLocaleString('id-ID', {
      month: 'short',
    });
    const maxDayStr =
      maxDay > 0
        ? `${String(maxDay).padStart(2, '0')} ${shortMonth} – ${formatRupiah(maxDayAmt, hide)}`
        : 'Belum ada pengeluaran';

    const zeroDays = Math.max(0, daysInMonth - dayExpenseMap.size);

    // Unified 4-Pillar Financial Health Score (matching HealthScoreTab)
    const liquidAssets = walletsWithBalance
      .filter((w) => w.type !== 'credit' && w.type !== 'paylater' && w.balance > 0)
      .reduce((acc, w) => acc + w.balance, 0);
    const creditWalletDebt = walletsWithBalance
      .filter((w) => (w.type === 'credit' || w.type === 'paylater') && w.balance < 0)
      .reduce((acc, w) => acc + Math.abs(w.balance), 0);
    const activePayableDebt = (debts || [])
      .filter((d) => d.type === 'payable' && d.status === 'active')
      .reduce((acc, d) => acc + Math.max(0, d.remainingAmount ?? d.totalAmount), 0);
    const totalDebt = creditWalletDebt + activePayableDebt;

    const isZeroState =
      liquidAssets === 0 &&
      totalDebt === 0 &&
      effectiveIncome === 0 &&
      totalExpense === 0 &&
      goals.length === 0;

    let savingsScore = 0;
    if (effectiveIncome > 0) {
      const sPct = Math.round(((effectiveIncome - totalExpense) / effectiveIncome) * 100);
      savingsScore = sPct >= 20 ? 30 : sPct > 0 ? Math.round((sPct / 20) * 30) : 0;
    } else if (liquidAssets > 0 && totalExpense === 0) {
      savingsScore = 25;
    }

    const runwayMonths = dashboardSummary.emergencyFundRunwayMonths || 0;
    const runwayScore =
      runwayMonths >= 6 ? 25 : runwayMonths > 0 ? Math.min(25, Math.round((runwayMonths / 6) * 25)) : 0;
    const computedRunwayPct = Math.min(100, Math.round((runwayMonths / 6) * 100));

    const budgetLimit = dashboardSummary.budgetLimit || 0;
    let budgetScore = 0;
    let computedBudgetDisciplinePct = 0;
    if (budgetLimit > 0) {
      const usagePct = Math.round((totalExpense / budgetLimit) * 100);
      computedBudgetDisciplinePct =
        usagePct <= 100
          ? 100
          : Math.max(0, Math.round(100 - (usagePct - 100)));
      budgetScore =
        usagePct <= 80 ? 25 : usagePct <= 100 ? 20 : usagePct <= 120 ? 10 : 0;
    } else if (totalExpense === 0) {
      budgetScore = isZeroState ? 0 : 15;
      computedBudgetDisciplinePct = 0;
    } else {
      budgetScore = 10;
      computedBudgetDisciplinePct = 50;
    }

    let debtScore = isZeroState ? 0 : 20;
    if (totalDebt > 0) {
      const denom = Math.max(liquidAssets, effectiveIncome);
      const dRatio = denom > 0 ? Math.round((totalDebt / denom) * 100) : 100;
      debtScore = dRatio <= 15 ? 17 : dRatio <= 30 ? 12 : dRatio <= 50 ? 6 : 0;
    }

    const calcScore = isZeroState
      ? 0
      : Math.min(100, Math.max(0, savingsScore + runwayScore + budgetScore + debtScore));

    return {
      savedAmount: Math.max(0, netSaved),
      savingsRate: rate,
      budgetDisciplinePct: computedBudgetDisciplinePct,
      runwayPct: computedRunwayPct,
      topCategories:
        list.length > 0 ? list : [{ name: 'Belum ada data', emoji: '🍽️', amount: 0, pct: '0%', pctNum: 0 }],
      avgDailyExpense: avgDaily,
      maxExpenseDayLabel: maxDayStr,
      txCountThisMonth: txCount,
      zeroExpenseDays: zeroDays,
      dynamicScore: calcScore,
    };
  }, [
    transactions,
    categories,
    wallets,
    walletsWithBalance,
    debts,
    goals.length,
    budgetConfig,
    dashboardSummary,
    totalIncome,
    totalExpense,
    activeYear,
    activeMonth,
    hide,
  ]);

  const donutColors = ['#7C3AED', '#F97316', '#EC4899', '#10B981', '#3B82F6', '#EAB308'];
  const circumference = 219.8; // 2 * pi * 35

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 lg:pt-0 px-1">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Analisis
          </h1>
          <p className="text-xs lg:text-sm font-semibold text-gray-400 mt-0.5">
            Analisa kebiasaan dan tren keuangan bulananmu secara mendalam.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#16181D] border border-gray-100 dark:border-gray-800 text-xs font-black text-gray-700 dark:text-gray-300 shadow-xs">
            <Calendar size={14} />
            <span>{monthLabel}</span>
          </div>
          <button
            type="button"
            onClick={exportToCSV}
            className="h-10 px-3.5 lg:px-4 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center gap-2 font-black text-xs shadow-xs cursor-pointer transition-transform active:scale-95"
            title="Unduh Laporan CSV"
          >
            <Download size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* Full-Width 4 Metrics Hero Card */}
      <div className="w-full bg-[#121316] rounded-[28px] lg:rounded-[32px] p-5 lg:px-9 lg:py-7 text-white shadow-xl border border-white/5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              ESTIMASI DITABUNG
            </span>
            <div className="text-lg sm:text-2xl font-black text-[#D4F826] tabular-nums truncate">
              {formatRupiah(savedAmount, hide)}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              RASIO MENABUNG
            </span>
            <div className="text-lg sm:text-2xl font-black text-[#D4F826] tabular-nums">
              {savingsRate}%
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

      {/* Responsive 12-Col Grid */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-5 lg:items-start">
        {/* 1. Skor Kesehatan Finansial (Left 4 cols) */}
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
                strokeDashoffset={Math.max(0, 251.2 - (dynamicScore / 100) * 251.2)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900 dark:text-white leading-none tabular-nums">
                {dynamicScore}
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
              Skor hitungan berdasarkan tabungan, disiplin budget, dana darurat, dan kesehatan utang.
            </p>
            <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-md">
              {dynamicScore >= 85
                ? 'SANGAT PRIMA'
                : dynamicScore >= 70
                ? 'SEHAT & STABIL'
                : dynamicScore >= 50
                ? 'CUKUP SEHAT'
                : dynamicScore > 0
                ? 'PERLU PERHATIAN'
                : 'BELUM DINILAI'}
            </span>
          </div>

          {/* Health Breakdown Bars */}
          <div className="space-y-3 pt-2 text-left">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-bold">Rasio Tabungan</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {savingsRate}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, Number(savingsRate))}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-bold">Disiplin Anggaran</span>
                <span className="font-extrabold text-violet-600 dark:text-violet-400 tabular-nums">
                  {budgetDisciplinePct}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${budgetDisciplinePct}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-bold">Keamanan & Runway</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                  {runwayPct}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${runwayPct}%` }}
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
                  return topCategories.map((cat, idx) => {
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

            {topCategories.map((cat) => (
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
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Ringkasan Cepat</h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between gap-2">
                <span className="text-gray-500 dark:text-gray-400">Rata-rata / hari</span>
                <span className="font-black text-gray-900 dark:text-white tabular-nums">
                  {formatRupiah(avgDailyExpense, hide)}/hari
                </span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between gap-2">
                <span className="text-gray-500 dark:text-gray-400">Hari terboros</span>
                <span className="font-black text-red-500 tabular-nums">{maxExpenseDayLabel}</span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between gap-2">
                <span className="text-gray-500 dark:text-gray-400">Total transaksi bulan ini</span>
                <span className="font-black text-gray-900 dark:text-white tabular-nums">
                  {txCountThisMonth} transaksi
                </span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between gap-2">
                <span className="text-gray-500 dark:text-gray-400">Hari tanpa pengeluaran</span>
                <span className="font-black text-[#84CC16] dark:text-[#D4F826]">
                  {zeroExpenseDays} hari hemat!
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
                Kondisi keuangan kamu bulan ini berada di skor <strong>{dynamicScore}/100</strong> dengan rasio menabung <strong>{savingsRate}%</strong>. Pertahankan ritme pencatatan harian agar kuota budget tetap terkendali.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
