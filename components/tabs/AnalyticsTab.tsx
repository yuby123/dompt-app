'use client';

import React, { useMemo, useState } from 'react';
import {
  Download,
  Calendar,
  TrendingUp,
  PieChart,
  BarChart3,
  Sparkles,
  Activity,
  ShieldCheck,
  CreditCard,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Check,
  Wallet as WalletIcon,
  ArrowDownRight,
  PiggyBank,
} from 'lucide-react';
import { motion } from 'motion/react';
import { TabType, useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';
import {
  getMonthlyDebtInstallmentAmount,
  isDateInBudgetPeriod,
  isDebtScheduledForBudgetPeriod,
  isSavingsExpense,
  parseLocalDay,
  resolveEffectivePeriodIncome,
} from '@/lib/budgetUtils';

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
    let expenseTxCount = 0;
    let periodConsumptionExpense = 0;
    const catMap = new Map<string, number>();
    const dayExpenseMap = new Map<string, { label: string; amount: number }>();
    const elapsedDaysInPeriod = Math.max(1, budgetPeriod.currentDayOfPeriod);
    const walletTypeMap = new Map(wallets.map((w) => [w.id, w.type]));
    const catInfoMap = new Map(categories.map((c) => [c.id, c]));
    const recordedTxIds = new Set<string>();

    transactions.forEach((tx) => {
      recordedTxIds.add(tx.id);
      const d = parseLocalDay(tx.date);
      if (isDateInBudgetPeriod(d, budgetPeriod)) {
        const cat = tx.categoryId ? catInfoMap.get(tx.categoryId) || null : null;
        const targetWalletType = tx.transferWalletId
          ? walletTypeMap.get(tx.transferWalletId)
          : undefined;
        const isSavingsTx =
          isSavingsExpense(tx, cat) ||
          (tx.type === 'transfer' &&
            (tx.budgetGroup === 'tabungan' ||
              targetWalletType === 'savings' ||
              targetWalletType === 'investment'));

        if (isSavingsTx) {
          explicitSaved += tx.amount;
        } else if (tx.type === 'expense') {
          expenseTxCount += 1;
          periodConsumptionExpense += tx.amount;
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

    // Also include standalone payable debt payments recorded in DebtTab during this period
    (debts || []).forEach((debt) => {
      if (debt.type !== 'payable') return;
      (debt.payments || []).forEach((p) => {
        if (p.transactionId && recordedTxIds.has(p.transactionId)) return;
        const pd = parseLocalDay(p.date);
        if (isDateInBudgetPeriod(pd, budgetPeriod)) {
          expenseTxCount += 1;
          periodConsumptionExpense += p.amount;
          catMap.set('cat-tagihan', (catMap.get('cat-tagihan') || 0) + p.amount);
          const dateKey = `${pd.getFullYear()}-${pd.getMonth()}-${pd.getDate()}`;
          const mShort = pd.toLocaleString('id-ID', { month: 'short' });
          const dLabel = `${String(pd.getDate()).padStart(2, '0')} ${mShort}`;
          const prev = dayExpenseMap.get(dateKey);
          dayExpenseMap.set(dateKey, {
            label: dLabel,
            amount: (prev?.amount || 0) + p.amount,
          });
        }
      });
    });

    const {
      effectiveIncome: monthlyIncome,
      periodRecordedIncome: actualIncome,
      rawEstimatedIncome: estIncome,
    } = resolveEffectivePeriodIncome(budgetConfig, transactions, budgetPeriod);

    const hasActualIncome = actualIncome > 0;
    const monthlyExpense = periodConsumptionExpense;

    const needsPct = typeof budgetConfig?.needsPercent === 'number' ? budgetConfig.needsPercent : 50;
    const wantsPct = typeof budgetConfig?.wantsPercent === 'number' ? budgetConfig.wantsPercent : 30;
    const savingsBudgetPct =
      typeof budgetConfig?.savingsPercent === 'number' ? budgetConfig.savingsPercent : 20;

    const budgetLimit =
      monthlyIncome > 0
        ? Math.round((monthlyIncome * (needsPct + wantsPct)) / 100)
        : dashboardSummary.budgetLimit || 0;

    // Liquid balance (positive non-credit wallets + extra liquidAssets)
    const walletLiquid = walletsWithBalance
      .filter((w) => w.type !== 'credit' && w.type !== 'paylater' && w.balance > 0)
      .reduce((acc, w) => acc + w.balance, 0);
    const extraLiquid = (storedLiquidAssets || []).reduce(
      (acc, a) => acc + Math.max(0, a.amount || 0),
      0
    );
    const liquidAssets = walletLiquid + extraLiquid;

    // Baseline monthly living cost used for emergency fund target & runway
    const baselineLivingCost =
      Math.max(budgetLimit > 0 ? budgetLimit : 0, monthlyExpense) || 3000000;
    const minEmergencyTarget = baselineLivingCost * 3; // Batas aman minimal: 3 bulan biaya hidup
    const idealEmergencyTarget = baselineLivingCost * 6; // Target ideal penuh: 6 bulan biaya hidup
    const runwayMonths =
      liquidAssets > 0 ? Number((liquidAssets / baselineLivingCost).toFixed(1)) : 0;

    // Debt obligations: Active payable debts (total remaining principal vs period installment DSR)
    const creditWalletDebt = walletsWithBalance
      .filter((w) => (w.type === 'credit' || w.type === 'paylater') && w.balance < 0)
      .reduce((acc, w) => acc + Math.abs(w.balance), 0);

    const activePayableDebts = (debts || []).filter(
      (d) =>
        d.type === 'payable' &&
        d.status === 'active' &&
        Math.max(0, d.remainingAmount ?? d.totalAmount) > 0
    );

    const activePayableDebt = activePayableDebts.reduce(
      (acc, d) => acc + Math.max(0, d.remainingAmount ?? d.totalAmount),
      0
    );

    const monthlyDebtInstallment = activePayableDebts
      .filter((d) => isDebtScheduledForBudgetPeriod(d, budgetPeriod))
      .reduce((acc, d) => acc + getMonthlyDebtInstallmentAmount(d), 0);

    const creditDebt = creditWalletDebt + activePayableDebt;

    const isZeroState =
      liquidAssets === 0 &&
      creditDebt === 0 &&
      monthlyIncome === 0 &&
      monthlyExpense === 0 &&
      explicitSaved === 0 &&
      goals.length === 0;

    // 1. Savings Rate Pillar (Max 30 pts) — Target >= 20%
    // IMPORTANT: Unspent salary in the middle of the period is Sisa Kas Berjalan, NOT savings!
    // "Ditabung / Disisihkan" comes ONLY from:
    //   (a) Explicit savings/investment transactions or transfers (`explicitSaved`), OR
    //   (b) Budget savings allocation (`savingsBudgetPct > 0`), capped by remaining unspent income if overspent.
    // When the user sets `0%` for Tabungan in Budget and has `Rp 0` savings transactions, `netSavings` is `Rp 0 (0%)`.
    const remainingCashflow =
      monthlyIncome > 0 ? Math.max(0, monthlyIncome - monthlyExpense - explicitSaved) : 0;
    const rawBudgetedSavings =
      monthlyIncome > 0 && savingsBudgetPct > 0
        ? Math.round((monthlyIncome * savingsBudgetPct) / 100)
        : 0;
    const effectiveBudgetedSavings =
      savingsBudgetPct > 0
        ? Math.min(rawBudgetedSavings, Math.max(0, monthlyIncome - monthlyExpense))
        : 0;

    const netSavings = Math.max(explicitSaved, effectiveBudgetedSavings);
    const idealSavingsAmount = monthlyIncome > 0 ? Math.round(monthlyIncome * 0.2) : 0;

    const rawSavingsRatePct =
      monthlyIncome > 0 ? Math.min(100, Math.max(0, (netSavings / monthlyIncome) * 100)) : 0;
    const savingsRatePct = Math.round(rawSavingsRatePct);
    const savingsRateDisplay =
      netSavings > 0 && rawSavingsRatePct > 0 && rawSavingsRatePct < 1
        ? rawSavingsRatePct.toFixed(1).replace('.', ',')
        : String(savingsRatePct);

    let savingsScore = 0;
    if (monthlyIncome > 0 && netSavings > 0) {
      if (rawSavingsRatePct >= 20) {
        savingsScore = 30;
      } else {
        savingsScore = Math.max(1, Math.round((rawSavingsRatePct / 20) * 30));
      }
    }

    const savingsSourceLabel =
      explicitSaved > 0 && explicitSaved >= effectiveBudgetedSavings
        ? `Dari transaksi tabungan · Rasio ${savingsRateDisplay}%`
        : savingsBudgetPct > 0 && netSavings > 0
        ? `Disisihkan dari budget ${savingsBudgetPct}% (Ideal ≥ 20%)`
        : savingsBudgetPct === 0
        ? 'Budget tabungan 0% · Rasio 0% (Ideal ≥ 20%)'
        : `Rasio menabung ${savingsRateDisplay}% (Ideal ≥ 20%)`;

    // 2. Emergency Fund Runway Pillar (Max 25 pts) — Target >= 6 months (Safe min >= 3 months)
    let runwayScore = 0;
    if (runwayMonths >= 6) {
      runwayScore = 25;
    } else if (runwayMonths > 0) {
      runwayScore = Math.min(25, Math.round((runwayMonths / 6) * 25));
    }
    const runwayPct = Math.min(100, Math.round((runwayMonths / 6) * 100));

    // 3. Budget Discipline Pillar (Max 25 pts) — Target <= 85%–100% of budgetLimit
    let budgetUsagePct = 0;
    let budgetUsageDisplay = '0';
    let budgetDisciplinePct = 0;
    let budgetScore = 0;
    if (budgetLimit > 0) {
      const rawBudgetUsagePct = (monthlyExpense / budgetLimit) * 100;
      budgetUsagePct = Math.round(rawBudgetUsagePct);
      budgetUsageDisplay =
        monthlyExpense > 0 && rawBudgetUsagePct > 0 && rawBudgetUsagePct < 1
          ? rawBudgetUsagePct.toFixed(1).replace('.', ',')
          : String(budgetUsagePct);
      budgetDisciplinePct =
        rawBudgetUsagePct <= 100
          ? 100
          : Math.max(0, Math.round(100 - (rawBudgetUsagePct - 100)));
      if (rawBudgetUsagePct <= 85) {
        budgetScore = 25;
      } else if (rawBudgetUsagePct <= 100) {
        budgetScore = 20;
      } else if (rawBudgetUsagePct <= 120) {
        budgetScore = 10;
      } else {
        budgetScore = 0;
      }
    } else if (monthlyExpense === 0) {
      budgetScore = isZeroState ? 0 : 15;
      budgetDisciplinePct = 0;
    } else {
      budgetUsagePct = 100;
      budgetUsageDisplay = '100';
      budgetScore = 10;
      budgetDisciplinePct = 50;
    }

    // 4. Debt Ratio Pillar (Max 20 pts) — Evaluates Debt Service Ratio (Cicilan Bulanan terhadap Pemasukan, Ideal <= 20%, Aman <= 30%)
    let debtRatioPct = 0;
    let debtRatioDisplay = '0';
    let debtScore = isZeroState ? 0 : 20;
    const debtDenominator = monthlyIncome > 0 ? monthlyIncome : Math.max(liquidAssets, 1);
    const safeDebtLimit = Math.round(debtDenominator * 0.3);
    const periodDebtBurden =
      creditWalletDebt + (monthlyDebtInstallment > 0 ? monthlyDebtInstallment : 0);

    if (creditDebt > 0) {
      if (periodDebtBurden === 0 && activePayableDebt > 0) {
        // Active debt is scheduled to start in a future period (Rp 0 installment due this period)
        const totalVsLiquidPct =
          liquidAssets > 0 ? (activePayableDebt / liquidAssets) * 100 : 35;
        debtRatioPct = 0;
        debtRatioDisplay = '0';
        debtScore = totalVsLiquidPct <= 50 ? 18 : 14;
      } else {
        const rawDebtRatioPct =
          debtDenominator > 0 ? (periodDebtBurden / debtDenominator) * 100 : 100;
        debtRatioPct = Math.round(rawDebtRatioPct);
        debtRatioDisplay =
          periodDebtBurden > 0 && rawDebtRatioPct > 0 && rawDebtRatioPct < 1
            ? rawDebtRatioPct.toFixed(1).replace('.', ',')
            : String(debtRatioPct);
        if (rawDebtRatioPct <= 20) {
          debtScore = 18;
        } else if (rawDebtRatioPct <= 30) {
          debtScore = 14;
        } else if (rawDebtRatioPct <= 40) {
          debtScore = 8;
        } else {
          debtScore = 0;
        }
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
      ? 'Luar biasa! Rasio tabungan, dana darurat, dan kendali anggaran Anda sudah berada di level sangat sehat.'
      : totalScore >= 70
      ? 'Kondisi keuangan Anda sudah sehat dan stabil. Pertahankan disiplin budget dan terus tingkatkan dana darurat.'
      : totalScore >= 50
      ? 'Keuangan Anda cukup terkendali, namun skor masih bisa ditingkatkan dengan menambah porsi tabungan atau dana darurat.'
      : 'Skor Anda masih di bawah 50 karena porsi tabungan atau dana darurat masih di bawah target ideal. Cek rincian 4 pilar di bawah untuk melihat angka yang perlu diperbaiki.';

    // Category sorting for donut & list
    const list = Array.from(catMap.entries())
      .map(([catId, amount]) => {
        const cat = catInfoMap.get(catId);
        const pctNum = monthlyExpense > 0 ? (amount / monthlyExpense) * 100 : 0;
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

    const avgDaily = Math.round(monthlyExpense / elapsedDaysInPeriod);

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
        ? `${maxDayLabel} (${formatRupiah(maxDayAmt, hide)})`
        : 'Belum ada pengeluaran';

    const zeroDays = Math.max(0, elapsedDaysInPeriod - dayExpenseMap.size);

    return {
      isZeroState,
      totalScore,
      grade,
      summaryText,
      monthlyIncome,
      monthlyExpense,
      remainingCashflow,
      hasActualIncome,
      estIncome,
      budgetLimit,
      savingsBudgetPct,
      explicitSaved,
      savingsSourceLabel,
      savingsScore,
      savingsRatePct,
      savingsRateDisplay,
      idealSavingsAmount,
      runwayScore,
      runwayMonths,
      runwayPct,
      baselineLivingCost,
      minEmergencyTarget,
      idealEmergencyTarget,
      budgetScore,
      budgetUsagePct,
      budgetUsageDisplay,
      budgetDisciplinePct,
      debtScore,
      debtRatioPct,
      debtRatioDisplay,
      creditDebt,
      monthlyDebtInstallment: periodDebtBurden,
      safeDebtLimit,
      liquidAssets,
      savedAmount: Math.max(0, netSavings),
      savingsRateStr: savingsRateDisplay,
      topCategories:
        list.length > 0
          ? list
          : [{ name: 'Belum ada data', emoji: '🍽️', amount: 0, pct: '0%', pctNum: 0 }],
      avgDailyExpense: avgDaily,
      maxExpenseDayLabel: maxDayStr,
      txCountThisMonth: expenseTxCount,
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
    hide,
  ]);

  const pillars = useMemo(() => {
    const savingsShortfall = Math.max(0, metrics.idealSavingsAmount - metrics.savedAmount);
    const minEmergencyShortfall = Math.max(0, metrics.minEmergencyTarget - metrics.liquidAssets);
    const idealEmergencyShortfall = Math.max(0, metrics.idealEmergencyTarget - metrics.liquidAssets);

    return [
      {
        id: 'savings',
        step: '1',
        title: 'Rasio Menabung',
        subtitle: 'Porsi pemasukan yang benar-benar disisihkan untuk tabungan/investasi',
        icon: PiggyBank,
        score: metrics.savingsScore,
        maxScore: 30,
        currentLabel: 'Ditabung / Disisihkan',
        currentValue:
          metrics.monthlyIncome > 0
            ? `${metrics.savingsRateDisplay}% (${formatRupiah(metrics.savedAmount, hide)})`
            : formatRupiah(metrics.savedAmount, hide),
        targetLabel: 'Target Ideal (Min. 20%)',
        targetValue:
          metrics.idealSavingsAmount > 0
            ? `${formatRupiah(metrics.idealSavingsAmount, hide)} / bln`
            : 'Atur pemasukan dulu',
        advice:
          metrics.monthlyIncome === 0
            ? 'Isi estimasi pemasukan di menu Budget agar target tabungan 20% dapat dihitung.'
            : metrics.savingsBudgetPct === 0 && metrics.savedAmount === 0
            ? `Alokasi tabungan di Budget saat ini diatur 0% (Rp 0). Saat kondisi memungkinkan, sisihkan min. ${formatRupiah(metrics.idealSavingsAmount, hide)} (20%) untuk meraih 30 poin.`
            : savingsShortfall > 0
            ? `Sisihkan ${formatRupiah(savingsShortfall, hide)} lagi periode ini untuk mencapai target 20% dan meraih 30 poin penuh.`
            : 'Target tabungan minimal 20% dari pemasukan sudah tercapai.',
        actionTab: 'budget' as TabType,
        actionLabel: 'Atur Tabungan',
      },
      {
        id: 'runway',
        step: '2',
        title: 'Ketahanan Dana Darurat',
        subtitle: 'Berapa bulan kas likuid bisa menopang biaya hidup rutin',
        icon: ShieldCheck,
        score: metrics.runwayScore,
        maxScore: 25,
        currentLabel: 'Ketahanan Kas Saat Ini',
        currentValue: `${metrics.runwayMonths} Bulan (${formatRupiah(metrics.liquidAssets, hide)})`,
        targetLabel: 'Aman (3 Bln) · Ideal (6 Bln)',
        targetValue: `${formatRupiah(metrics.minEmergencyTarget, hide)} – ${formatRupiah(metrics.idealEmergencyTarget, hide)}`,
        advice:
          minEmergencyShortfall > 0
            ? `Dihitung dari biaya hidup ${formatRupiah(metrics.baselineLivingCost, hide)}/bln. Tambah kas/tabungan ${formatRupiah(minEmergencyShortfall, hide)} untuk capai batas aman minimal 3 bulan.`
            : idealEmergencyShortfall > 0
            ? `Batas aman 3 bulan sudah terlampaui! Tambah ${formatRupiah(idealEmergencyShortfall, hide)} lagi untuk mencapai target ideal 6 bulan (25 poin penuh).`
            : 'Dana likuid Anda sudah sangat kuat (mencukupi ≥ 6 bulan biaya hidup rutin).',
        actionTab: 'goals' as TabType,
        actionLabel: 'Buka Dana Darurat',
      },
      {
        id: 'budget',
        step: '3',
        title: 'Kedisiplinan Budget Bulanan',
        subtitle: 'Kendali pengeluaran dibandingkan batas kuota budget',
        icon: PieChart,
        score: metrics.budgetScore,
        maxScore: 25,
        currentLabel: 'Pengeluaran Saat Ini',
        currentValue:
          metrics.budgetLimit > 0
            ? `${metrics.budgetUsageDisplay}% (${formatRupiah(metrics.monthlyExpense, hide)})`
            : formatRupiah(metrics.monthlyExpense, hide),
        targetLabel: 'Batas Aman Budget (≤ 85%)',
        targetValue:
          metrics.budgetLimit > 0
            ? formatRupiah(metrics.budgetLimit, hide)
            : 'Budget belum diatur',
        advice:
          metrics.budgetLimit === 0
            ? 'Tentukan batas anggaran bulanan di menu Atur Budget untuk memantau kedisiplinan belanja.'
            : metrics.budgetUsagePct <= 85
            ? `Sangat terkendali! Anda baru memakai ${metrics.budgetUsageDisplay}% dari kuota anggaran (${formatRupiah(metrics.budgetLimit, hide)}).`
            : metrics.budgetUsagePct <= 100
            ? 'Pengeluaran mendekati batas kuota. Rem belanja non-prioritas hingga akhir periode.'
            : 'Pengeluaran sudah melewati batas budget bulanan. Evaluasi pos yang bocor.',
        actionTab: 'budget' as TabType,
        actionLabel: 'Kelola Pos Budget',
      },
      {
        id: 'debt',
        step: '4',
        title: 'Kesehatan Beban Utang',
        subtitle: 'Rasio cicilan utang periode ini terhadap pemasukan (DSR)',
        icon: CreditCard,
        score: metrics.debtScore,
        maxScore: 20,
        currentLabel:
          metrics.monthlyDebtInstallment > 0 && metrics.monthlyDebtInstallment < metrics.creditDebt
            ? 'Cicilan Periode Ini'
            : 'Total Utang & Kredit',
        currentValue:
          metrics.creditDebt === 0
            ? 'Rp 0 (0% Bebas Utang)'
            : metrics.monthlyDebtInstallment === 0
            ? `Rp 0 periode ini (Sisa pokok ${formatRupiah(metrics.creditDebt, hide)})`
            : `${metrics.debtRatioDisplay}% (${formatRupiah(metrics.monthlyDebtInstallment, hide)}/bln)`,
        targetLabel: 'Batas Aman DSR (≤ 30%)',
        targetValue:
          metrics.safeDebtLimit > 0
            ? `Maks. ${formatRupiah(metrics.safeDebtLimit, hide)}/bln`
            : 'Di bawah 30% pemasukan',
        advice:
          metrics.creditDebt === 0
            ? 'Sangat sehat! Anda tidak memiliki beban tagihan kredit atau utang konsumtif aktif.'
            : metrics.monthlyDebtInstallment === 0
            ? `Terdapat sisa utang ${formatRupiah(metrics.creditDebt, hide)} yang dijadwalkan pada periode berikutnya.`
            : metrics.debtRatioPct <= 20
            ? `Rasio cicilan sangat sehat (${metrics.debtRatioDisplay}% dari pemasukan). Total sisa pokok utang: ${formatRupiah(metrics.creditDebt, hide)}.`
            : metrics.debtRatioPct <= 30
            ? `Rasio cicilan masih dalam batas aman (≤ 30%). Total sisa pokok utang: ${formatRupiah(metrics.creditDebt, hide)}.`
            : `Beban cicilan (${metrics.debtRatioDisplay}%) melebihi batas aman 30% pemasukan. Prioritaskan pelunasan utang (${formatRupiah(metrics.creditDebt, hide)}).`,
        actionTab: 'debt' as TabType,
        actionLabel: 'Pantau Utang',
      },
    ];
  }, [metrics, hide]);

  const priorityActions = useMemo(() => {
    return [...pillars]
      .map((p) => ({
        ...p,
        missingPoints: Math.max(0, p.maxScore - p.score),
        pct: Math.round((p.score / p.maxScore) * 100),
      }))
      .sort((a, b) => b.missingPoints - a.missingPoints);
  }, [pillars]);

  const donutColors = ['#7C3AED', '#F97316', '#EC4899', '#10B981', '#3B82F6', '#EAB308'];
  const circumference = 219.8; // 2 * pi * 35

  const scoreRanges = [
    { label: 'Perlu Perhatian', range: '0 – 49', active: !metrics.isZeroState && metrics.totalScore < 50 },
    { label: 'Cukup Sehat', range: '50 – 69', active: metrics.totalScore >= 50 && metrics.totalScore < 70 },
    { label: 'Sehat & Stabil', range: '70 – 84', active: metrics.totalScore >= 70 && metrics.totalScore < 85 },
    { label: 'Sangat Prima', range: '85 – 100', active: metrics.totalScore >= 85 },
  ];

  const getScoreBadgeColor = (score: number, isZero: boolean) => {
    if (isZero) return 'bg-white/15 text-gray-200 border border-white/20';
    if (score >= 85) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    if (score >= 70) return 'bg-lime-500/20 text-lime-300 border border-lime-500/30';
    if (score >= 50) return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
  };

  return (
    <div className="space-y-5 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header with Title and Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 lg:pt-0 px-0.5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Analisis & Skor Keuangan
          </h1>
          <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Ringkasan mudah untuk melihat seberapa sehat kondisi uang, tabungan, dan pengeluaran Anda.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="h-10 flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-white dark:bg-[#16181D] border border-gray-200/80 dark:border-gray-800 text-xs font-extrabold text-gray-700 dark:text-gray-300 shadow-2xs whitespace-nowrap">
            <Calendar size={14} className="shrink-0" />
            <span className="truncate">{monthLabel}</span>
          </div>
          <button
            type="button"
            onClick={exportToCSV}
            className="h-10 px-4 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center gap-2 font-extrabold text-xs shadow-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap shrink-0"
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
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
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
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeView === 'health'
              ? 'bg-white dark:bg-[#16181D] text-gray-950 dark:text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Activity size={14} className="text-[#84CC16] dark:text-[#D4F826]" />
          <span>Skor & 4 Pilar</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('expenses')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeView === 'expenses'
              ? 'bg-white dark:bg-[#16181D] text-gray-950 dark:text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 size={14} className="text-blue-500" />
          <span>Pengeluaran & Tren</span>
        </button>
      </div>

      {/* SECTION 1: UNIFIED HERO CARD (Score + 4 Key Cashflow Metrics) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] text-white p-5 lg:p-8 rounded-[28px] lg:rounded-[32px] shadow-xl border border-white/10 space-y-6"
      >
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#8B5CF6]/15 blur-3xl pointer-events-none" />
        <div
          className={`absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
            settings.accentColor === 'orange'
              ? 'bg-[#FF6B2B]/15'
              : settings.accentColor === 'pink'
              ? 'bg-[#FFA4A4]/15'
              : 'bg-[#D4F826]/15'
          }`}
        />

        {/* Top Part: Score Overview & Level Scale (shown in 'all' and 'health') */}
        {(activeView === 'all' || activeView === 'health') && (
          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#D4F826] tracking-wide flex items-center gap-1.5">
                <Activity size={15} />
                <span>Skor Kesehatan Finansial</span>
              </span>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-extrabold ${getScoreBadgeColor(
                  metrics.totalScore,
                  metrics.isZeroState
                )}`}
              >
                Status: {metrics.grade}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:items-center">
              {/* Left: Big Score + Explanation */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-5xl lg:text-6xl font-black tabular-nums text-[#D4F826] leading-none">
                    {metrics.totalScore}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-gray-300">dari 100 Poin</span>
                    <span className="text-[11px] text-gray-400">
                      Gabungan nilai dari 4 pilar keuangan di bawah
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#D4F826] transition-all duration-500"
                    style={{ width: `${metrics.totalScore}%` }}
                  />
                </div>

                <p className="text-xs lg:text-sm text-gray-200 leading-relaxed font-medium">
                  {metrics.summaryText}
                </p>
              </div>

              {/* Right: Clear 4-Level Score Guide so user immediately understands what the number means */}
              <div className="lg:col-span-5 bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-2.5">
                <span className="text-[11px] font-bold text-gray-400 block">
                  Panduan Arti Skor (0 – 100)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {scoreRanges.map((item) => (
                    <div
                      key={item.label}
                      className={`px-3 py-2 rounded-xl border text-xs transition-colors ${
                        item.active
                          ? 'bg-white/15 border-[#D4F826] text-white'
                          : 'bg-white/[0.02] border-white/5 text-gray-400'
                      }`}
                    >
                      <div className="font-black tabular-nums text-[11px] text-[#D4F826]">
                        {item.range} Poin
                      </div>
                      <div className="font-bold text-xs truncate">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {metrics.isZeroState && (
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('wallets')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-black cursor-pointer"
                >
                  1. Isi Saldo Dompet
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('budget')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-extrabold cursor-pointer"
                >
                  2. Atur Pemasukan Bulanan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Part: 4 Key Cashflow Numbers in Plain Indonesian */}
        <div
          className={`relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 ${
            activeView === 'all' || activeView === 'health'
              ? 'pt-5 border-t border-white/10'
              : ''
          }`}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
              <WalletIcon size={12} className="text-gray-400" />
              <span>Kas Likuid Bersih</span>
            </span>
            <div className="text-lg sm:text-xl font-black text-white tabular-nums truncate">
              {formatRupiah(metrics.liquidAssets, hide)}
            </div>
            <span className="text-[11px] text-gray-400 block">
              Total saldo aktif di dompet
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-400" />
              <span>Pemasukan Periode Ini</span>
            </span>
            <div className="text-lg sm:text-xl font-black text-white tabular-nums truncate">
              {formatRupiah(metrics.monthlyIncome, hide)}
            </div>
            <span className="text-[11px] text-gray-400 block">
              {metrics.hasActualIncome
                ? `Dari transaksi · Sisa kas ${formatRupiah(metrics.remainingCashflow, hide)}`
                : metrics.estIncome > 0
                ? 'Dari estimasi menu Budget'
                : 'Belum ada pemasukan'}
            </span>
          </div>

          <div className="space-y-1 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
            <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
              <ArrowDownRight size={12} className="text-rose-400" />
              <span>Total Pengeluaran</span>
            </span>
            <div className="text-lg sm:text-xl font-black text-rose-400 tabular-nums truncate">
              {formatRupiah(metrics.monthlyExpense, hide)}
            </div>
            <span className="text-[11px] text-gray-400 block">
              {metrics.budgetLimit > 0
                ? `${metrics.budgetUsageDisplay}% dari batas budget (${formatRupiah(metrics.budgetLimit, hide)})`
                : `${metrics.txCountThisMonth} transaksi pengeluaran`}
            </span>
          </div>

          <div className="space-y-1 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
            <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
              <PiggyBank size={12} className="text-[#D4F826]" />
              <span>Ditabung / Disisihkan</span>
            </span>
            <div className="text-lg sm:text-xl font-black text-[#D4F826] tabular-nums truncate">
              {formatRupiah(metrics.savedAmount, hide)}
            </div>
            <span className="text-[11px] text-gray-400 block">
              {metrics.savingsSourceLabel}
            </span>
          </div>
        </div>
      </motion.div>

      {/* SECTION 2: 4 PILLARS BREAKDOWN WITH CLEAR RUPIAH COMPARISON (Visible in 'all' and 'health') */}
      {(activeView === 'all' || activeView === 'health') && (
        <div className="space-y-3.5">
          <div className="px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h2 className="text-base lg:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Activity size={18} className="text-[#84CC16] dark:text-[#D4F826]" />
                <span>Rincian 4 Pilar Penentu Skor</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Perbandingan langsung antara kondisi keuangan Anda saat ini dengan target idealnya.
              </p>
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              Total Bobot Maksimal: 100 Poin
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pillars.map((p) => {
              const Icon = p.icon;
              const pct = Math.round((p.score / p.maxScore) * 100);
              const isGood = pct >= 75;
              const isMedium = pct >= 40 && pct < 75;

              const statusText = isGood
                ? 'Sudah Ideal'
                : isMedium
                ? 'Cukup Baik'
                : 'Perlu Ditingkatkan';

              const statusColorClass = isGood
                ? 'text-emerald-600 dark:text-emerald-400'
                : isMedium
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400';

              const barColorClass = isGood
                ? 'bg-emerald-500'
                : isMedium
                ? 'bg-amber-500'
                : 'bg-rose-500';

              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-200/70 dark:border-gray-800 flex flex-col justify-between gap-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                >
                  <div className="space-y-3.5">
                    {/* Card Header: Icon, Title, Status & Score */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-800 dark:text-gray-200 shrink-0 mt-0.5">
                          <Icon size={19} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm lg:text-base font-black text-gray-900 dark:text-white">
                              {p.step}. {p.title}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {p.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-lg lg:text-xl font-black text-gray-900 dark:text-white tabular-nums">
                            {p.score}
                          </span>
                          <span className="text-xs font-bold text-gray-400">
                            / {p.maxScore} Poin
                          </span>
                        </div>
                        <span className={`text-[11px] font-extrabold ${statusColorClass}`}>
                          {statusText}
                        </span>
                      </div>
                    </div>

                    {/* Semantic Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>

                    {/* Side-by-side Comparison: Kondisi Anda vs Target Ideal */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
                          {p.currentLabel}
                        </span>
                        <span className="text-xs lg:text-sm font-black text-gray-900 dark:text-white tabular-nums block truncate">
                          {p.currentValue}
                        </span>
                      </div>
                      <div className="space-y-0.5 border-l border-gray-200 dark:border-gray-700 pl-3">
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
                          {p.targetLabel}
                        </span>
                        <span className="text-xs lg:text-sm font-extrabold text-gray-700 dark:text-gray-300 tabular-nums block truncate">
                          {p.targetValue}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Plain-language Tip & Action Link */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {p.advice}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab(p.actionTab)}
                      className="font-extrabold text-gray-900 dark:text-[#D4F826] hover:underline flex items-center gap-1 shrink-0 cursor-pointer self-start sm:self-center whitespace-nowrap"
                    >
                      <span>{p.actionLabel}</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: ACTIONABLE IMPROVEMENTS & EXPENSE BREAKDOWN */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-5 lg:items-start">
        {/* 1. Prioritas Perbaikan Skor (Left 4 cols - shown in 'all' and 'health') */}
        {(activeView === 'all' || activeView === 'health') && (
          <div
            className={`${
              activeView === 'health' ? 'lg:col-span-12' : 'lg:col-span-4'
            } bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-200/70 dark:border-gray-800 space-y-4`}
          >
            <div>
              <h3 className="text-sm lg:text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 size={17} className="text-emerald-500 shrink-0" />
                <span>Cara Menaikkan Skor Anda</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Urutan langkah dari potensi tambahan poin terbesar.
              </p>
            </div>

            <div
              className={
                activeView === 'health'
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
                  : 'space-y-3'
              }
            >
              {priorityActions.map((item) => {
                const isOptimal = item.missingPoints <= 3;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {isOptimal ? (
                          <Check size={14} className="text-emerald-500 shrink-0" />
                        ) : (
                          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                        )}
                        <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                        {item.advice}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-black tabular-nums whitespace-nowrap shrink-0 px-2 py-1 rounded-lg ${
                        isOptimal
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {isOptimal ? 'Optimal' : `+${item.missingPoints} Poin`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Rincian Pengeluaran per Kategori (Middle 4 cols in 'all', 6 cols in 'expenses') */}
        {(activeView === 'all' || activeView === 'expenses') && (
          <div
            className={`${
              activeView === 'expenses' ? 'lg:col-span-6' : 'lg:col-span-4'
            } bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-200/70 dark:border-gray-800 space-y-4`}
          >
            <div>
              <h3 className="text-sm lg:text-base font-black text-gray-900 dark:text-white">
                Porsi Pengeluaran per Kategori
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Kategori yang paling banyak menyerap uang Anda periode ini.
              </p>
            </div>

            <div className="relative w-36 h-36 mx-auto flex items-center justify-center my-1">
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
                {metrics.monthlyExpense > 0 &&
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
                <span className="text-[10px] font-bold text-gray-400">Total Keluar</span>
                <span className="text-xs font-black text-gray-900 dark:text-white tabular-nums">
                  {formatRupiah(metrics.monthlyExpense, hide)}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {metrics.topCategories.map((cat, idx) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{cat.emoji}</span>
                      <span className="font-extrabold text-gray-900 dark:text-white truncate">
                        {cat.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-1.5">
                      <span className="font-black text-gray-900 dark:text-white tabular-nums">
                        {formatRupiah(cat.amount, hide)}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400 tabular-nums">
                        · {cat.pct}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(cat.amount > 0 ? 4 : 0, cat.pctNum)}%`,
                        backgroundColor: donutColors[idx % donutColors.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Kebiasaan Belanja & Insight AI (Right 4 cols in 'all', 6 cols in 'expenses') */}
        {(activeView === 'all' || activeView === 'expenses') && (
          <div
            className={`${
              activeView === 'expenses' ? 'lg:col-span-6' : 'lg:col-span-4'
            } space-y-4 lg:space-y-5`}
          >
            {/* Kebiasaan Belanja Harian */}
            <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-200/70 dark:border-gray-800 space-y-3.5">
              <div>
                <h3 className="text-sm lg:text-base font-black text-gray-900 dark:text-white">
                  Pola Pengeluaran Harian
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Ringkasan kebiasaan transaksi Anda pada periode {monthLabel}.
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between gap-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Rata-rata keluar per hari
                  </span>
                  <span className="font-black text-gray-900 dark:text-white tabular-nums">
                    {formatRupiah(metrics.avgDailyExpense, hide)}/hari
                  </span>
                </div>

                <div className="p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between gap-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Hari pengeluaran terbesar
                  </span>
                  <span className="font-black text-rose-500 tabular-nums text-right">
                    {metrics.maxExpenseDayLabel}
                  </span>
                </div>

                <div className="p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between gap-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Frekuensi transaksi tercatat
                  </span>
                  <span className="font-black text-gray-900 dark:text-white tabular-nums">
                    {metrics.txCountThisMonth} kali transaksi
                  </span>
                </div>

                <div className="p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-between gap-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Hari tanpa belanja (No-Spend Day)
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {metrics.zeroExpenseDays} hari hemat
                  </span>
                </div>
              </div>
            </div>

            {/* Insight AI */}
            <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-200/70 dark:border-gray-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-[#84CC16] dark:text-[#D4F826]" />
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">
                    Kesimpulan Singkat
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-gray-400">Periode {monthLabel}</span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl space-y-2 text-xs">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Skor keuangan Anda saat ini <strong>{metrics.totalScore}/100</strong> (
                  <strong>{metrics.grade}</strong>). Dari pemasukan{' '}
                  <strong>{formatRupiah(metrics.monthlyIncome, hide)}</strong>, pengeluaran tercatat{' '}
                  <strong>{formatRupiah(metrics.monthlyExpense, hide)}</strong> (sisa kas berjalan{' '}
                  <strong>{formatRupiah(metrics.remainingCashflow, hide)}</strong>) dan dana yang ditabung/disisihkan{' '}
                  <strong>
                    {formatRupiah(metrics.savedAmount, hide)} ({metrics.savingsRateDisplay}%)
                  </strong>
                  .
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Consult AI Advisor CTA */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-200/70 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-xs lg:text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
            <Sparkles size={15} className="text-amber-500 shrink-0" />
            <span>Butuh saran strategi untuk menaikkan skor keuangan Anda?</span>
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Diskusikan cara mengatur tabungan 20%, dana darurat, dan pelunasan utang bersama Dompt AI Advisor.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('ai-advisor')}
          className="px-4 py-2.5 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-black shrink-0 cursor-pointer whitespace-nowrap self-start sm:self-center"
        >
          Tanya AI Advisor
        </button>
      </div>
    </div>
  );
}
