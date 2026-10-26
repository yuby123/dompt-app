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
  ChevronLeft,
  ChevronRight,
  Flame,
  Receipt,
  CalendarCheck,
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
    liquidAssets: storedLiquidAssets,
    debts,
    goals,
    budgetConfig,
    dashboardSummary,
    transactions,
    categories,
    exportToCSV,
    settings,
    budgetPeriod,
    goToPrevPeriod,
    goToNextPeriod,
    goToCurrentPeriod,
    setActiveTab,
  } = useApp();

  const hide = settings.hideBalance;
  const [activeView, setActiveView] = useState<'all' | 'health' | 'expenses'>('all');

  // Helper to format currency with optional prefix/suffix without leaking symbols when hidden
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

  const periodLabel = budgetPeriod.periodShortLabel;

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

    // Debt obligations: Active payable debts + credit/paylater wallet balances (stored as positive outstanding balance)
    const creditWalletDebt = walletsWithBalance
      .filter((w) => (w.type === 'credit' || w.type === 'paylater') && Math.abs(w.balance) > 0)
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

    // Category sorting & aggregation for donut & list (prevents duplicate keys and ensures 100% total)
    const rawCategories = Array.from(catMap.entries())
      .map(([catId, amount]) => {
        const cat = catInfoMap.get(catId);
        const name =
          cat?.name || (catId === 'cat-tagihan' ? 'Cicilan & Tagihan' : 'Lainnya');
        const emoji = cat?.emoji || (catId === 'cat-tagihan' ? '🏦' : '💳');
        return {
          id: catId,
          name,
          emoji,
          amount,
        };
      })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const topFive = rawCategories.slice(0, 5);
    const remainingCats = rawCategories.slice(5);
    const remainingAmount = remainingCats.reduce((acc, c) => acc + c.amount, 0);

    const finalCategoryItems = [...topFive];
    if (remainingAmount > 0) {
      finalCategoryItems.push({
        id: 'cat-grouped-others',
        name: `Kategori Lainnya (${remainingCats.length})`,
        emoji: '📦',
        amount: remainingAmount,
      });
    }

    const list = finalCategoryItems.map((item) => {
      const pctNum = monthlyExpense > 0 ? (item.amount / monthlyExpense) * 100 : 0;
      const pct = pctNum.toFixed(1).replace('.', ',') + '%';
      return {
        ...item,
        pct,
        pctNum,
      };
    });

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
          : [
              {
                id: 'empty',
                name: 'Belum ada pengeluaran',
                emoji: '🍽️',
                amount: 0,
                pct: '0%',
                pctNum: 0,
              },
            ],
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
        step: '01',
        title: 'Rasio Menabung',
        subtitle: 'Porsi pemasukan yang benar-benar disisihkan untuk tabungan & investasi.',
        icon: PiggyBank,
        indicatorColor: 'bg-teal-500',
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
            ? fmtCurrency(metrics.idealSavingsAmount, { suffix: '/bln' })
            : 'Atur pemasukan dulu',
        advice:
          metrics.monthlyIncome === 0
            ? 'Isi estimasi pemasukan di menu Budget agar target tabungan 20% dapat dihitung.'
            : metrics.savingsBudgetPct === 0 && metrics.savedAmount === 0
            ? `Alokasi tabungan di Budget saat ini diatur 0%. Sisihkan min. ${formatRupiah(
                metrics.idealSavingsAmount,
                hide
              )} (20%) untuk meraih 30 poin.`
            : savingsShortfall > 0
            ? `Sisihkan ${formatRupiah(
                savingsShortfall,
                hide
              )} lagi periode ini untuk mencapai target 20% dan meraih 30 poin penuh.`
            : 'Target tabungan minimal 20% dari pemasukan sudah tercapai dengan sangat baik.',
        actionTab: 'budget' as TabType,
        actionLabel: 'Atur Porsi Tabungan',
      },
      {
        id: 'runway',
        step: '02',
        title: 'Ketahanan Dana Darurat',
        subtitle: 'Berapa bulan kas likuid mampu menopang biaya hidup rutin bulanan.',
        icon: ShieldCheck,
        indicatorColor: 'bg-sky-500',
        score: metrics.runwayScore,
        maxScore: 25,
        currentLabel: 'Ketahanan Kas Likuid',
        currentValue: `${metrics.runwayMonths} bln (${formatRupiah(metrics.liquidAssets, hide)})`,
        targetLabel: 'Aman (3 Bln) · Ideal (6 Bln)',
        targetValue: `${formatRupiah(metrics.minEmergencyTarget, hide)} – ${formatRupiah(
          metrics.idealEmergencyTarget,
          hide
        )}`,
        advice:
          minEmergencyShortfall > 0
            ? `Dihitung dari biaya hidup ${fmtCurrency(metrics.baselineLivingCost, {
                suffix: '/bln',
              })}. Tambah aset likuid ${formatRupiah(
                minEmergencyShortfall,
                hide
              )} untuk capai batas aman 3 bulan.`
            : idealEmergencyShortfall > 0
            ? `Batas aman 3 bulan sudah terlampaui! Tambah ${formatRupiah(
                idealEmergencyShortfall,
                hide
              )} lagi untuk mencapai target ideal 6 bulan (25 poin penuh).`
            : 'Dana likuid Anda sudah sangat kuat (mencukupi ≥ 6 bulan biaya hidup rutin).',
        actionTab: 'assets' as TabType,
        actionLabel: 'Kelola Aset Likuid',
      },
      {
        id: 'budget',
        step: '03',
        title: 'Kedisiplinan Pagu Konsumsi',
        subtitle: 'Kendali pengeluaran konsumsi dibandingkan batas pagu anggaran.',
        icon: PieChart,
        indicatorColor: 'bg-[#A594F9]',
        score: metrics.budgetScore,
        maxScore: 25,
        currentLabel: 'Pengeluaran Konsumsi',
        currentValue:
          metrics.budgetLimit > 0
            ? `${metrics.budgetUsageDisplay}% (${formatRupiah(metrics.monthlyExpense, hide)})`
            : formatRupiah(metrics.monthlyExpense, hide),
        targetLabel: 'Batas Aman Pagu (≤ 85%)',
        targetValue:
          metrics.budgetLimit > 0
            ? formatRupiah(metrics.budgetLimit, hide)
            : 'Budget belum diatur',
        advice:
          metrics.budgetLimit === 0
            ? 'Tentukan batas anggaran bulanan di menu Budget untuk memantau kedisiplinan belanja.'
            : metrics.budgetUsagePct <= 85
            ? `Sangat terkendali! Anda baru memakai ${metrics.budgetUsageDisplay}% dari pagu konsumsi (${formatRupiah(
                metrics.budgetLimit,
                hide
              )}).`
            : metrics.budgetUsagePct <= 100
            ? 'Pengeluaran mendekati batas pagu. Rem belanja non-prioritas hingga akhir periode.'
            : 'Pengeluaran sudah melewati batas pagu bulanan. Evaluasi pos subkategori yang bocor.',
        actionTab: 'budget' as TabType,
        actionLabel: 'Kelola Pos Budget',
      },
      {
        id: 'debt',
        step: '04',
        title: 'Kesehatan Beban Utang (DSR)',
        subtitle: 'Rasio tagihan kredit & cicilan utang periode ini terhadap pemasukan.',
        icon: CreditCard,
        indicatorColor: 'bg-amber-400',
        score: metrics.debtScore,
        maxScore: 20,
        currentLabel:
          metrics.monthlyDebtInstallment > 0 && metrics.monthlyDebtInstallment < metrics.creditDebt
            ? 'Beban Cicilan Periode Ini'
            : 'Total Utang & Kredit',
        currentValue:
          metrics.creditDebt === 0
            ? 'Rp 0 (0% Bebas Utang)'
            : metrics.monthlyDebtInstallment === 0
            ? `Rp 0 periode ini (Pokok ${formatRupiah(metrics.creditDebt, hide)})`
            : `${metrics.debtRatioDisplay}% (${fmtCurrency(metrics.monthlyDebtInstallment, {
                suffix: '/bln',
              })})`,
        targetLabel: 'Batas Aman DSR (≤ 30%)',
        targetValue:
          metrics.safeDebtLimit > 0
            ? fmtCurrency(metrics.safeDebtLimit, { prefix: 'Maks. ', suffix: '/bln' })
            : 'Di bawah 30% pemasukan',
        advice:
          metrics.creditDebt === 0
            ? 'Sangat sehat! Anda tidak memiliki beban tagihan kredit atau cicilan utang aktif.'
            : metrics.monthlyDebtInstallment === 0
            ? `Terdapat sisa pokok utang ${formatRupiah(
                metrics.creditDebt,
                hide
              )} yang dijadwalkan pada periode berikutnya.`
            : metrics.debtRatioPct <= 20
            ? `Rasio cicilan sangat sehat (${metrics.debtRatioDisplay}% dari pemasukan). Sisa pokok utang: ${formatRupiah(
                metrics.creditDebt,
                hide
              )}.`
            : metrics.debtRatioPct <= 30
            ? `Rasio cicilan masih dalam batas aman (≤ 30%). Sisa pokok utang: ${formatRupiah(
                metrics.creditDebt,
                hide
              )}.`
            : `Beban cicilan (${metrics.debtRatioDisplay}%) melebihi batas aman 30% pemasukan. Prioritaskan pelunasan utang (${formatRupiah(
                metrics.creditDebt,
                hide
              )}).`,
        actionTab: 'debt' as TabType,
        actionLabel: 'Pantau Cicilan Utang',
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

  const donutColors = ['#A594F9', '#EC4899', '#14B8A6', '#F59E0B', '#38BDF8', '#64748B'];
  const circumference = Number((2 * Math.PI * 36).toFixed(2)); // 226.19

  const scoreRanges = [
    {
      label: 'Perlu Perhatian',
      range: '0 – 49',
      active: !metrics.isZeroState && metrics.totalScore < 50,
    },
    {
      label: 'Cukup Sehat',
      range: '50 – 69',
      active: metrics.totalScore >= 50 && metrics.totalScore < 70,
    },
    {
      label: 'Sehat & Stabil',
      range: '70 – 84',
      active: metrics.totalScore >= 70 && metrics.totalScore < 85,
    },
    {
      label: 'Sangat Prima',
      range: '85 – 100',
      active: metrics.totalScore >= 85,
    },
  ];

  const getScoreStatusColor = (score: number, isZero: boolean) => {
    if (isZero) return 'text-slate-300';
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-[#D4F826]';
    if (score >= 50) return 'text-amber-300';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-5 pb-28 lg:pb-12">
      {/* 1. Header with Period Switcher & CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="font-display text-2xl sm:text-[28px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            Analisis & Skor Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Evaluasi menyeluruh atas kesehatan arus kas, ketahanan dana darurat, dan distribusi pengeluaran.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* Interactive Period Switcher */}
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
              className="px-2.5 py-1 flex items-center gap-1.5 cursor-pointer"
              title="Kembali ke Periode Saat Ini"
            >
              <Calendar size={13} className="text-slate-400 shrink-0" />
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                {periodLabel}
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
            onClick={exportToCSV}
            className={`h-10 px-4 rounded-2xl ${accentBtn} flex items-center justify-center gap-2 font-bold text-xs shadow-2xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap shrink-0`}
            title="Unduh Laporan CSV"
          >
            <Download size={14} strokeWidth={2.5} className="shrink-0" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* 2. View Switcher: Segmented Control */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-white/[0.06] rounded-2xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveView('all')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeView === 'all'
              ? 'bg-white dark:bg-[#16181D] text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Semua Ringkasan
        </button>
        <button
          type="button"
          onClick={() => setActiveView('health')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeView === 'health'
              ? 'bg-white dark:bg-[#16181D] text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity size={14} className="text-emerald-600 dark:text-[#D4F826]" />
          <span>Skor & 4 Pilar</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('expenses')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeView === 'expenses'
              ? 'bg-white dark:bg-[#16181D] text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 size={14} className="text-sky-500" />
          <span>Pengeluaran & Pola</span>
        </button>
      </div>

      {/* 3. HERO CARD (Score Overview + 4 Key Cashflow Metrics) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden w-full bg-gradient-to-br from-[#0F1322] via-[#13182B] to-[#0A0C14] text-white p-5 sm:p-6 lg:p-7 rounded-3xl shadow-xl border border-white/10 space-y-6"
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

        {/* Top Part: Score Overview & Level Scale (shown in 'all' and 'health') */}
        {(activeView === 'all' || activeView === 'health') && (
          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4F826] flex items-center gap-1.5">
                <Activity size={14} />
                <span>Indeks Kesehatan Finansial · {periodLabel}</span>
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-300">
                Status:{' '}
                <strong className={`font-sans font-bold ${getScoreStatusColor(metrics.totalScore, metrics.isZeroState)}`}>
                  {metrics.grade}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:items-center">
              {/* Left: Big Score + Explanation */}
              <div className="lg:col-span-7 space-y-3.5">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-5xl sm:text-6xl font-extrabold tabular-nums text-white tracking-tight leading-none">
                    {metrics.totalScore}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-mono text-sm sm:text-base font-bold text-[#D4F826] tabular-nums">
                      / 100 Poin
                    </span>
                    <span className="text-xs text-slate-400">
                      Akumulasi 4 pilar utama kesehatan keuangan
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#D4F826] via-emerald-400 to-teal-400 transition-all duration-500"
                    style={{ width: `${metrics.totalScore}%` }}
                  />
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {metrics.summaryText}
                </p>
              </div>

              {/* Right: Clear 4-Level Score Guide */}
              <div className="lg:col-span-5 bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Skala Penilaian Skor (0 – 100)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {scoreRanges.map((item) => (
                    <div
                      key={item.label}
                      className={`px-3 py-2.5 rounded-xl border text-xs transition-colors ${
                        item.active
                          ? 'bg-white/12 border-[#D4F826] text-white'
                          : 'bg-white/[0.02] border-white/5 text-slate-400'
                      }`}
                    >
                      <div className="font-mono font-bold tabular-nums text-[11px] text-[#D4F826]">
                        {item.range} Poin
                      </div>
                      <div className="font-display font-bold text-xs truncate mt-0.5">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {metrics.isZeroState && (
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('wallets')}
                  className={`flex-1 py-2.5 px-4 rounded-xl ${accentBtn} text-xs font-bold cursor-pointer`}
                >
                  1. Isi Saldo Dompet
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('budget')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold cursor-pointer"
                >
                  2. Atur Pemasukan Bulanan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Part: 4 Key Cashflow Numbers */}
        <div
          className={`relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 ${
            activeView === 'all' || activeView === 'health'
              ? 'pt-5 border-t border-white/10'
              : ''
          }`}
        >
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Kas Likuid Bersih</span>
              <WalletIcon size={13} className="text-slate-400" />
            </span>
            <div className="font-mono text-lg sm:text-xl font-extrabold text-white tabular-nums truncate">
              {formatRupiah(metrics.liquidAssets, hide)}
            </div>
            <span className="text-[11px] text-slate-400 block truncate">
              Ketahanan {metrics.runwayMonths} bulan biaya hidup
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Pemasukan Periode Ini</span>
              <TrendingUp size={13} className="text-emerald-400" />
            </span>
            <div className="font-mono text-lg sm:text-xl font-extrabold text-white tabular-nums truncate">
              {formatRupiah(metrics.monthlyIncome, hide)}
            </div>
            <span className="text-[11px] text-slate-400 block truncate font-mono tabular-nums">
              {metrics.hasActualIncome
                ? `Sisa kas: ${formatRupiah(metrics.remainingCashflow, hide)}`
                : metrics.estIncome > 0
                ? 'Dari target basis Budget'
                : 'Belum ada pemasukan'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Total Pengeluaran</span>
              <ArrowDownRight size={13} className="text-rose-400" />
            </span>
            <div className="font-mono text-lg sm:text-xl font-extrabold text-rose-400 tabular-nums truncate">
              {formatRupiah(metrics.monthlyExpense, hide)}
            </div>
            <span className="text-[11px] text-slate-400 block truncate font-mono tabular-nums">
              {metrics.budgetLimit > 0
                ? `${metrics.budgetUsageDisplay}% dari pagu ${formatRupiah(metrics.budgetLimit, hide)}`
                : `${metrics.txCountThisMonth} transaksi tercatat`}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Ditabung / Disisihkan</span>
              <PiggyBank size={13} className="text-[#D4F826]" />
            </span>
            <div className="font-mono text-lg sm:text-xl font-extrabold text-[#D4F826] tabular-nums truncate">
              {formatRupiah(metrics.savedAmount, hide)}
            </div>
            <span className="text-[11px] text-slate-400 block truncate">
              {metrics.savingsSourceLabel}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 4. 4 PILLARS BREAKDOWN WITH CLEAR RUPIAH COMPARISON (Visible in 'all' and 'health') */}
      {(activeView === 'all' || activeView === 'health') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Rincian 4 Pilar Penentu Skor
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perbandingan langsung antara realisasi keuangan Anda saat ini dengan target ideal.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
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
                  className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/75 dark:border-white/[0.08] flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-white/15 transition-colors"
                >
                  <div className="space-y-4">
                    {/* Card Header: Indicator, Icon, Title, Status & Score */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 mt-0.5">
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-400 tabular-nums">
                              {p.step}.
                            </span>
                            <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                              {p.title}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {p.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-baseline justify-end gap-1 font-mono tabular-nums">
                          <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                            {p.score}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            / {p.maxScore}
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold ${statusColorClass}`}>
                          {statusText}
                        </span>
                      </div>
                    </div>

                    {/* Semantic Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>

                    {/* Side-by-side Comparison: Kondisi Anda vs Target Ideal */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06]">
                      <div className="space-y-1 min-w-0">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                          {p.currentLabel}
                        </span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums block truncate">
                          {p.currentValue}
                        </span>
                      </div>
                      <div className="space-y-1 border-l border-slate-200 dark:border-white/10 pl-3 min-w-0">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                          {p.targetLabel}
                        </span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums block truncate">
                          {p.targetValue}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Plain-language Tip & Action Link */}
                  <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {p.advice}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab(p.actionTab)}
                      className="font-bold text-slate-900 dark:text-[#D4F826] hover:underline flex items-center gap-1 shrink-0 cursor-pointer self-start sm:self-center whitespace-nowrap"
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

      {/* 5. EXPENSE DISTRIBUTION & DAILY PATTERNS (2 Balanced 6-Col Cards on Desktop) */}
      {(activeView === 'all' || activeView === 'expenses') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left 6 Cols: Porsi Pengeluaran per Kategori */}
          <div className="lg:col-span-6 bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/75 dark:border-white/[0.08] flex flex-col justify-between space-y-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Distribusi Pengeluaran per Kategori
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Proporsi pengeluaran konsumsi berdasarkan kategori pada periode {periodLabel}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-0.5 cursor-pointer shrink-0"
              >
                <span>Rincian</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Donut Chart + Total Summary */}
            <div className="flex flex-col sm:flex-row items-center gap-6 py-1">
              <div className="relative w-38 h-38 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="11"
                    className="text-slate-100 dark:text-white/[0.08]"
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
                            key={cat.id}
                            cx="50"
                            cy="50"
                            r="36"
                            fill="transparent"
                            stroke={donutColors[idx % donutColors.length]}
                            strokeWidth="11"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            transform={`rotate(${rotation} 50 50)`}
                          />
                        );
                      });
                    })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Keluar
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {formatRupiah(metrics.monthlyExpense, hide)}
                  </span>
                </div>
              </div>

              <div className="w-full flex-1 space-y-2.5">
                {metrics.topCategories.map((cat, idx) => (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: donutColors[idx % donutColors.length] }}
                        />
                        <span className="text-sm shrink-0">{cat.emoji}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {cat.name}
                        </span>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-1.5 font-mono tabular-nums">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatRupiah(cat.amount, hide)}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          ({cat.pct})
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
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
          </div>

          {/* Right 6 Cols: Pola Pengeluaran Harian & Ringkasan Eksekutif */}
          <div className="lg:col-span-6 bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/75 dark:border-white/[0.08] flex flex-col justify-between space-y-5">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Pola & Kebiasaan Belanja Harian
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Metrik perilaku transaksi harian Anda sepanjang periode {periodLabel}.
              </p>
            </div>

            {/* 2x2 Grid of Daily Behavior Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Rata-Rata Harian</span>
                  <BarChart3 size={13} className="text-sky-500" />
                </div>
                <div className="font-mono text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tabular-nums truncate">
                  {fmtCurrency(metrics.avgDailyExpense, { suffix: '/hari' })}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Dari {budgetPeriod.currentDayOfPeriod} hari berjalan
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Puncak Pengeluaran</span>
                  <Flame size={13} className="text-rose-500" />
                </div>
                <div className="font-mono text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400 tabular-nums truncate">
                  {metrics.maxExpenseDayLabel}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Hari dengan belanja tertinggi
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Frekuensi Transaksi</span>
                  <Receipt size={13} className="text-violet-500" />
                </div>
                <div className="font-mono text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {metrics.txCountThisMonth} Transaksi
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Total pencatatan keluar periode ini
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Hari Tanpa Belanja</span>
                  <CalendarCheck size={13} className="text-emerald-500" />
                </div>
                <div className="font-mono text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {metrics.zeroExpenseDays} Hari Hemat
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Hari tanpa transaksi pengeluaran
                </span>
              </div>
            </div>

            {/* Executive Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-600 dark:text-[#D4F826]" />
                  <span>Kesimpulan Eksekutif ({periodLabel})</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Skor kesehatan finansial Anda berada di angka{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {metrics.totalScore}/100
                </strong>{' '}
                (<strong>{metrics.grade}</strong>). Dari basis dana{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {formatRupiah(metrics.monthlyIncome, hide)}
                </strong>
                , realisasi konsumsi tercatat{' '}
                <strong className="font-mono text-rose-600 dark:text-rose-400">
                  {formatRupiah(metrics.monthlyExpense, hide)}
                </strong>{' '}
                dengan dana ditabung/disisihkan sebesar{' '}
                <strong className="font-mono text-emerald-600 dark:text-[#D4F826]">
                  {formatRupiah(metrics.savedAmount, hide)} ({metrics.savingsRateDisplay}%)
                </strong>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. ACTIONABLE SCORE IMPROVEMENTS (Shown in 'all' and 'health') */}
      {(activeView === 'all' || activeView === 'health') && (
        <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/75 dark:border-white/[0.08] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 size={17} className="text-emerald-500 shrink-0" />
                <span>Rekomendasi Prioritas Penaikan Skor</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Diurutkan otomatis dari pilar yang menyimpan potensi tambahan poin terbesar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {priorityActions.map((item) => {
              const isOptimal = item.missingPoints <= 3;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(item.actionTab)}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.05] border border-slate-200/70 dark:border-white/[0.07] flex items-start justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {isOptimal ? (
                        <Check size={14} className="text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                      )}
                      <span className="font-display text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.advice}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-xs font-extrabold tabular-nums whitespace-nowrap shrink-0 ${
                      isOptimal
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
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

      {/* 7. Consult AI Advisor CTA */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/75 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500 shrink-0" />
            <span>Ingin simulasi strategi khusus untuk menaikkan skor keuangan Anda?</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Diskusikan rencana alokasi tabungan 20%, percepatan dana darurat, dan pelunasan utang bersama Dompt AI Advisor.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('ai-advisor')}
          className={`px-4 py-2.5 rounded-2xl ${accentBtn} text-xs font-bold shrink-0 cursor-pointer whitespace-nowrap self-start sm:self-center shadow-2xs`}
        >
          Tanya AI Advisor
        </button>
      </div>
    </div>
  );
}
