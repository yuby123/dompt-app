'use client';

import React, { useMemo } from 'react';
import {
  Activity,
  ShieldCheck,
  TrendingUp,
  PieChart,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { motion } from 'motion/react';
import { TabType, useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';

export function HealthScoreTab() {
  const {
    wallets,
    walletsWithBalance,
    totalBalance,
    liquidAssets: storedLiquidAssets,
    transactions,
    budgetPeriod,
    dashboardSummary,
    budgetConfig,
    goals,
    debts,
    settings,
    setActiveTab,
  } = useApp();

  const hide = settings.hideBalance;

  const healthMetrics = useMemo(() => {
    const actualIncome = dashboardSummary.monthlyIncome || 0;
    const estIncome = budgetConfig?.estimatedIncome || 0;
    const monthlyIncome = actualIncome > 0 ? actualIncome : estIncome;
    const monthlyExpense = dashboardSummary.monthlyExpense || 0;
    const budgetLimit = dashboardSummary.budgetLimit || 0;
    const runwayMonths = dashboardSummary.emergencyFundRunwayMonths || 0;

    // Liquid balance (positive non-credit wallets + extra liquidAssets) vs Credit/Paylater + Active Payable Debts
    const walletLiquid = walletsWithBalance
      .filter((w) => w.type !== 'credit' && w.type !== 'paylater' && w.balance > 0)
      .reduce((acc, w) => acc + w.balance, 0);
    const extraLiquid = (storedLiquidAssets || []).reduce((acc, a) => acc + Math.max(0, a.amount || 0), 0);
    const liquidAssets = walletLiquid + extraLiquid;

    const creditWalletDebt = walletsWithBalance
      .filter((w) => (w.type === 'credit' || w.type === 'paylater') && w.balance < 0)
      .reduce((acc, w) => acc + Math.abs(w.balance), 0);

    const activePayableDebt = (debts || [])
      .filter((d) => d.type === 'payable' && d.status === 'active')
      .reduce((acc, d) => acc + Math.max(0, d.remainingAmount ?? d.totalAmount), 0);

    const creditDebt = creditWalletDebt + activePayableDebt;

    // Calculate explicit savings transactions in active period
    const walletTypeMap = new Map(wallets.map((w) => [w.id, w.type]));
    let explicitSaved = 0;
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getTime() >= budgetPeriod.startDate.getTime() && d.getTime() <= budgetPeriod.endDate.getTime()) {
        const targetType = tx.transferWalletId ? walletTypeMap.get(tx.transferWalletId) : undefined;
        if (
          tx.budgetGroup === 'tabungan' ||
          tx.categoryId === 'cat-tabungan' ||
          tx.categoryId === 'cat-investasi' ||
          (tx.type === 'transfer' && (targetType === 'savings' || targetType === 'investment'))
        ) {
          explicitSaved += tx.amount;
        }
      }
    });

    const isZeroState =
      liquidAssets === 0 &&
      creditDebt === 0 &&
      monthlyIncome === 0 &&
      monthlyExpense === 0 &&
      goals.length === 0;

    if (isZeroState) {
      return {
        isZeroState: true,
        totalScore: 0,
        grade: 'Belum Dinilai',
        summaryText:
          'Data keuangan Anda masih Rp 0. Isi saldo dompet, estimasi pemasukan di menu Budget, atau catat transaksi untuk melihat analisis Skor Kesehatan Keuangan Anda.',
        savingsScore: 0,
        savingsRatePct: 0,
        runwayScore: 0,
        runwayMonths: 0,
        budgetScore: 0,
        budgetUsagePct: 0,
        debtScore: 0,
        debtRatioPct: 0,
        liquidAssets: 0,
        creditDebt: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
      };
    }

    // 1. Savings Rate Pillar (Max 30 pts) — Target >= 20% savings rate
    // Only count real cashflow surplus when actualIncome > 0; otherwise use explicit savings recorded
    let savingsRatePct = 0;
    let savingsScore = 0;
    if (monthlyIncome > 0) {
      const realSurplus = actualIncome > 0 ? Math.max(0, actualIncome - monthlyExpense) : 0;
      const netSavings = Math.max(explicitSaved, realSurplus);
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

    // 3. Budget Discipline Pillar (Max 25 pts) — Target <= 100% of budgetLimit
    let budgetUsagePct = 0;
    let budgetScore = 0;
    if (budgetLimit > 0) {
      budgetUsagePct = Math.round((monthlyExpense / budgetLimit) * 100);
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
      budgetScore = 15;
    } else {
      budgetUsagePct = 100;
      budgetScore = 10;
    }

    // 4. Debt Ratio Pillar (Max 20 pts) — Target 0% or < 20% of liquid assets
    let debtRatioPct = 0;
    let debtScore = 20;
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

    const totalScore = Math.min(
      100,
      Math.max(0, savingsScore + runwayScore + budgetScore + debtScore)
    );

    const grade =
      totalScore >= 85
        ? 'Sangat Prima'
        : totalScore >= 70
        ? 'Sehat & Stabil'
        : totalScore >= 50
        ? 'Cukup Sehat'
        : 'Perlu Perhatian';

    const summaryText =
      totalScore >= 85
        ? 'Luar biasa! Rasio tabungan, dana darurat, dan kendali anggaran Anda berada di level sangat sehat.'
        : totalScore >= 70
        ? 'Kondisi keuangan Anda sudah stabil. Pertahankan disiplin anggaran dan terus tingkatkan dana darurat hingga 6 bulan.'
        : totalScore >= 50
        ? 'Keuangan Anda cukup terkendali, namun masih ada ruang perbaikan pada porsi tabungan atau dana darurat.'
        : 'Perhatikan kembali batas pengeluaran bulanan, rasio utang konsumtif, serta mulailah menyisihkan dana darurat.';

    return {
      isZeroState: false,
      totalScore,
      grade,
      summaryText,
      savingsScore,
      savingsRatePct,
      runwayScore,
      runwayMonths,
      budgetScore,
      budgetUsagePct,
      debtScore,
      debtRatioPct,
      liquidAssets,
      creditDebt,
      monthlyIncome,
      monthlyExpense,
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
  ]);

  const pillars = [
    {
      id: 'savings',
      title: 'Rasio Menabung (Savings Rate)',
      icon: TrendingUp,
      score: healthMetrics.savingsScore,
      maxScore: 30,
      metricText: `${healthMetrics.savingsRatePct}% dari pemasukan`,
      targetText: 'Ideal: Minimal 20% disisihkan per bulan',
      actionTab: 'budget' as TabType,
      actionLabel: 'Atur Pemasukan & Tabungan',
    },
    {
      id: 'runway',
      title: 'Ketahanan Dana Darurat',
      icon: ShieldCheck,
      score: healthMetrics.runwayScore,
      maxScore: 25,
      metricText: `${healthMetrics.runwayMonths} bulan biaya hidup`,
      targetText: 'Ideal: 3 - 6 bulan pengeluaran rutin',
      actionTab: 'goals' as TabType,
      actionLabel: 'Buka Dana Darurat',
    },
    {
      id: 'budget',
      title: 'Kedisiplinan Budget Bulanan',
      icon: PieChart,
      score: healthMetrics.budgetScore,
      maxScore: 25,
      metricText:
        dashboardSummary.budgetLimit > 0
          ? `${healthMetrics.budgetUsagePct}% kuota terpakai`
          : 'Budget belum diatur',
      targetText: 'Ideal: Pengeluaran <= 85% batas budget',
      actionTab: 'budget' as TabType,
      actionLabel: 'Kelola Pos Budget',
    },
    {
      id: 'debt',
      title: 'Kesehatan Beban Utang & Kredit',
      icon: CreditCard,
      score: healthMetrics.debtScore,
      maxScore: 20,
      metricText:
        healthMetrics.creditDebt === 0
          ? 'Bebas utang konsumtif (0%)'
          : `Rasio kewajiban ${healthMetrics.debtRatioPct}%`,
      targetText: 'Ideal: Cicilan & kredit < 20% aset likuid',
      actionTab: 'debt' as TabType,
      actionLabel: 'Pantau Utang',
    },
  ];

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="pt-2 lg:pt-0 px-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Skor Kesehatan Keuangan
          </h1>
          <p className="text-xs lg:text-sm font-semibold text-gray-400 mt-0.5">
            Evaluasi otomatis dari 4 pilar kesehatan finansial Anda.
          </p>
        </div>
      </div>

      {/* Full-Width Dark Score Hero Card */}
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
            <span>FINANCIAL HEALTH SCORE</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#D4F826] text-black text-[10px] font-black uppercase">
            Status: {healthMetrics.grade}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl lg:text-6xl font-black tabular-nums text-[#D4F826] leading-none">
              {healthMetrics.totalScore}
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
            style={{ width: `${healthMetrics.totalScore}%` }}
          />
        </div>

        <p className="text-xs lg:text-sm text-gray-300 leading-relaxed font-medium">
          {healthMetrics.summaryText}
        </p>

        {healthMetrics.isZeroState && (
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

      {/* 4 Pillars Breakdown */}
      <div className="space-y-3">
        <div className="px-1 flex items-center justify-between">
          <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white">
            Rincian 4 Pilar Finansial
          </h3>
          <span className="text-[11px] font-bold text-gray-400">Total 100 Poin</span>
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

      {/* Consult AI Advisor CTA */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>Ingin menaikkan skor keuangan Anda?</span>
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            Diskusikan strategi pelunasan utang dan optimasi tabungan bersama AI Advisor.
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
