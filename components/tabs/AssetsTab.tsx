'use client';

import React, { useMemo, useState } from 'react';
import {
  Plus,
  Landmark,
  Coins,
  Building2,
  TrendingUp,
  Lightbulb,
  X,
  Trash2,
  Pencil,
  ShieldCheck,
  ArrowUpRight,
  Wallet as WalletIcon,
  CreditCard,
  AlertTriangle,
  Scale,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { AssetItem, WalletType } from '@/lib/types';
import { formatRupiah, formatNominalInput, parseNominalInput } from '@/lib/formatters';

const LIQUID_CATEGORIES = [
  'Logam Mulia / Emas',
  'Deposito Bank',
  'Reksadana Pasar Uang',
  'Kas Valas / Mata Uang Asing',
  'Tabungan Berjangka',
  'Aset Likuid Lainnya',
];

const FIXED_CATEGORIES = [
  'Properti / Rumah / Apartemen',
  'Tanah / Kavling',
  'Kendaraan (Mobil / Motor)',
  'Perhiasan / Jam Tangan',
  'Peralatan Kerja / Elektronik',
  'Aset Tetap Lainnya',
];

const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  bank: 'Rekening Bank',
  ewallet: 'E-Wallet',
  cash: 'Uang Tunai',
  savings: 'Rekening Tabungan',
  investment: 'Rekening Investasi',
  credit: 'Kartu Kredit',
  paylater: 'PayLater',
  other: 'Dompet Lainnya',
};

interface EnrichedAsset extends AssetItem {
  assetType: 'liquid' | 'fixed';
}

export function AssetsTab() {
  const {
    walletsWithBalance,
    totalBalance,
    dashboardSummary,
    debts,
    investments,
    settings,
    liquidAssets,
    fixedAssets,
    addAsset,
    updateAsset,
    deleteAsset,
    setActiveTab,
  } = useApp();

  const hide = settings.hideBalance;
  const accent = settings.accentColor || 'lime';

  // Theme accent helper classes
  const accentTheme = useMemo(() => {
    if (accent === 'plum') {
      return {
        btnBg: 'bg-[#71325A] hover:bg-[#5E274A] text-white shadow-[#71325A]/25',
        badgeText: 'text-[#E899CE]',
        lightText: 'text-[#71325A] dark:text-[#E899CE]',
        barBg: 'bg-[#A84E87]',
        ringFocus: 'focus:ring-[#71325A]',
        glowBg: 'bg-[#71325A]/25',
        borderActive: 'border-[#71325A] dark:border-[#E899CE]',
      };
    }
    if (accent === 'orange') {
      return {
        btnBg: 'bg-[#FF6B00] hover:bg-[#e66000] text-white shadow-[#FF6B00]/25',
        badgeText: 'text-[#FF8533]',
        lightText: 'text-[#FF6B00] dark:text-[#FF8533]',
        barBg: 'bg-[#FF6B00]',
        ringFocus: 'focus:ring-[#FF6B00]',
        glowBg: 'bg-[#FF6B00]/18',
        borderActive: 'border-[#FF6B00]',
      };
    }
    if (accent === 'pink') {
      return {
        btnBg: 'bg-[#FFA4A4] hover:bg-[#ff8f8f] text-slate-950 shadow-[#FFA4A4]/25',
        badgeText: 'text-[#FFA4A4]',
        lightText: 'text-[#E11D48] dark:text-[#FFA4A4]',
        barBg: 'bg-[#FFA4A4]',
        ringFocus: 'focus:ring-[#FFA4A4]',
        glowBg: 'bg-[#FFA4A4]/18',
        borderActive: 'border-[#FFA4A4]',
      };
    }
    return {
      btnBg: 'bg-[#D4F826] hover:bg-[#c6ec15] text-slate-950 shadow-[#D4F826]/20',
      badgeText: 'text-[#D4F826]',
      lightText: 'text-[#65A30D] dark:text-[#D4F826]',
      barBg: 'bg-[#D4F826]',
      ringFocus: 'focus:ring-[#D4F826]',
      glowBg: 'bg-[#D4F826]/15',
      borderActive: 'border-[#84CC16] dark:border-[#D4F826]',
    };
  }, [accent]);

  const fmtCurrency = (
    amount: number,
    options?: { prefix?: string; suffix?: string }
  ): string => {
    const formatted = formatRupiah(amount, hide);
    if (hide) return formatted;
    return `${options?.prefix || ''}${formatted}${options?.suffix || ''}`;
  };

  // Filter & Modal States
  const [activeFilter, setActiveFilter] = useState<'all' | 'liquid' | 'fixed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<EnrichedAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedAsset | null>(null);

  // Form States
  const [assetType, setAssetType] = useState<'liquid' | 'fixed'>('liquid');
  const [assetName, setAssetName] = useState('');
  const [assetAmount, setAssetAmount] = useState('');
  const [assetCategory, setAssetCategory] = useState(LIQUID_CATEGORIES[0]);
  const [assetNote, setAssetNote] = useState('');

  // Active Wallets (excluding archived)
  const activeWallets = useMemo(
    () => walletsWithBalance.filter((w) => !w.isArchived),
    [walletsWithBalance]
  );

  const liquidWallets = useMemo(
    () => activeWallets.filter((w) => w.type !== 'credit' && w.type !== 'paylater'),
    [activeWallets]
  );

  const creditWalletsWithDebt = useMemo(
    () =>
      activeWallets.filter(
        (w) => (w.type === 'credit' || w.type === 'paylater') && w.balance < 0
      ),
    [activeWallets]
  );

  // Total locked in Goals / Reserved inside liquid wallets
  const totalReservedInWallets = useMemo(
    () =>
      liquidWallets.reduce(
        (acc, w) => acc + Math.max(0, w.balance - w.availableBalance),
        0
      ),
    [liquidWallets]
  );

  const totalAvailableWalletCash = useMemo(
    () => liquidWallets.reduce((acc, w) => acc + Math.max(0, w.availableBalance), 0),
    [liquidWallets]
  );

  // Totals across Asset Classes
  const totalLiquidManual = useMemo(
    () => (liquidAssets || []).reduce((acc, a) => acc + Math.max(0, a.amount || 0), 0),
    [liquidAssets]
  );

  const totalFixedManual = useMemo(
    () => (fixedAssets || []).reduce((acc, a) => acc + Math.max(0, a.amount || 0), 0),
    [fixedAssets]
  );

  const totalInvestments = useMemo(
    () => (investments || []).reduce((acc, inv) => acc + Math.max(0, inv.amount || 0), 0),
    [investments]
  );

  const totalReceivableDebts = useMemo(
    () =>
      (debts || [])
        .filter((d) => d.type === 'receivable' && d.status === 'active')
        .reduce((acc, d) => acc + Math.max(0, d.remainingAmount ?? d.totalAmount), 0),
    [debts]
  );

  const totalPayableDebts = useMemo(
    () =>
      (debts || [])
        .filter((d) => d.type === 'payable' && d.status === 'active')
        .reduce((acc, d) => acc + Math.max(0, d.remainingAmount ?? d.totalAmount), 0),
    [debts]
  );

  const totalCreditWalletDebt = useMemo(
    () => creditWalletsWithDebt.reduce((acc, w) => acc + Math.abs(w.balance), 0),
    [creditWalletsWithDebt]
  );

  // Total Liabilities = Active Payable Debts + Negative Credit/PayLater Wallets
  const totalLiabilities = totalPayableDebts + totalCreditWalletDebt;

  // Gross Assets = Liquid Wallets + Manual Liquid Assets + Investments + Receivables + Fixed Assets
  const totalPortfolioAndReceivables = totalInvestments + totalReceivableDebts;
  const grossAssets =
    totalBalance + totalLiquidManual + totalPortfolioAndReceivables + totalFixedManual;

  // Net Worth = Gross Assets - Total Liabilities
  const totalNetWorth = grossAssets - totalLiabilities;

  // Total Liquid Buffer (Wallets + Manual Liquid Assets) for Emergency Runway
  const totalLiquidBuffer = totalBalance + totalLiquidManual;
  const totalRunwayMonths = dashboardSummary.emergencyFundRunwayMonths || 0;
  const monthlyExpenseBaseline = useMemo(() => {
    const limitOrExp = Math.max(
      dashboardSummary.budgetLimit || 0,
      dashboardSummary.monthlyExpense || 0
    );
    return limitOrExp > 0 ? limitOrExp : 3000000;
  }, [dashboardSummary.budgetLimit, dashboardSummary.monthlyExpense]);

  const runwayStatus = useMemo(() => {
    if (totalRunwayMonths >= 6) {
      return {
        label: 'Sangat Aman',
        desc: 'Di atas standar ideal 6 bulan',
        tone: 'text-emerald-400',
      };
    }
    if (totalRunwayMonths >= 3) {
      return {
        label: 'Cukup Aman',
        desc: 'Menuju target ideal 6 bulan',
        tone: 'text-amber-400',
      };
    }
    return {
      label: 'Perlu Diperkuat',
      desc: 'Disarankan minimal 3–6 bulan',
      tone: 'text-rose-400',
    };
  }, [totalRunwayMonths]);

  // Multi-Tier Wealth Milestones
  const wealthMilestone = useMemo(() => {
    const tiers = [
      { max: 10_000_000, label: 'Langkah Awal', nextLabel: 'Fondasi Darurat' },
      { max: 25_000_000, label: 'Fondasi Darurat', nextLabel: 'Bertumbuh Stabil' },
      { max: 100_000_000, label: 'Bertumbuh Stabil', nextLabel: 'Mapan Finansial' },
      { max: 500_000_000, label: 'Mapan Finansial', nextLabel: 'Akselerasi Aset' },
      { max: 1_000_000_000, label: 'Akselerasi Aset', nextLabel: 'Merdeka Finansial' },
      { max: 5_000_000_000, label: 'Merdeka Finansial', nextLabel: 'Kemakmuran Mandiri' },
    ];

    if (totalNetWorth <= 0) {
      return {
        currentLevel: 'Mulai Mencatat',
        nextLevel: 'Langkah Awal',
        nextTarget: 10_000_000,
        progressPct: 0,
        shortfall: 10_000_000 - Math.max(0, totalNetWorth),
      };
    }

    for (const tier of tiers) {
      if (totalNetWorth < tier.max) {
        const pct = Math.min(100, Math.max(1, Math.round((totalNetWorth / tier.max) * 100)));
        return {
          currentLevel: tier.label,
          nextLevel: tier.nextLabel,
          nextTarget: tier.max,
          progressPct: pct,
          shortfall: Math.max(0, tier.max - totalNetWorth),
        };
      }
    }

    const dynamicNext = Math.ceil((totalNetWorth + 1) / 5_000_000_000) * 5_000_000_000;
    const pct = Math.min(100, Math.round((totalNetWorth / dynamicNext) * 100));
    return {
      currentLevel: 'Merdeka Finansial',
      nextLevel: 'Kemakmuran Mandiri',
      nextTarget: dynamicNext,
      progressPct: pct,
      shortfall: Math.max(0, dynamicNext - totalNetWorth),
    };
  }, [totalNetWorth]);

  // Asset Allocation Percentages (of Gross Assets)
  const allocationShares = useMemo(() => {
    if (grossAssets <= 0) {
      return {
        walletPct: 0,
        liquidPct: 0,
        investPct: 0,
        fixedPct: 0,
        totalLiquidSharePct: 0,
      };
    }
    const walletPct = Math.round((totalBalance / grossAssets) * 100);
    const liquidPct = Math.round((totalLiquidManual / grossAssets) * 100);
    const investPct = Math.round((totalPortfolioAndReceivables / grossAssets) * 100);
    const fixedPct = Math.max(0, 100 - walletPct - liquidPct - investPct);
    const totalLiquidSharePct = Math.min(
      100,
      Math.round(
        ((totalBalance + totalLiquidManual + totalInvestments) / grossAssets) * 100
      )
    );
    return { walletPct, liquidPct, investPct, fixedPct, totalLiquidSharePct };
  }, [grossAssets, totalBalance, totalLiquidManual, totalPortfolioAndReceivables, totalInvestments]);

  // Combined Manual Assets List
  const allManualAssets = useMemo<EnrichedAsset[]>(() => {
    const liq: EnrichedAsset[] = (liquidAssets || []).map((a) => ({
      ...a,
      assetType: 'liquid',
    }));
    const fix: EnrichedAsset[] = (fixedAssets || []).map((a) => ({
      ...a,
      assetType: 'fixed',
    }));
    const combined =
      activeFilter === 'liquid'
        ? liq
        : activeFilter === 'fixed'
        ? fix
        : [...liq, ...fix];

    return combined.sort((a, b) => (b.amount || 0) - (a.amount || 0));
  }, [liquidAssets, fixedAssets, activeFilter]);

  // Handlers for Add / Edit Modal
  const openCreateModal = (defaultType: 'liquid' | 'fixed' = 'liquid') => {
    setEditingAsset(null);
    setAssetType(defaultType);
    setAssetName('');
    setAssetAmount('');
    setAssetCategory(defaultType === 'liquid' ? LIQUID_CATEGORIES[0] : FIXED_CATEGORIES[0]);
    setAssetNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (asset: EnrichedAsset) => {
    setEditingAsset(asset);
    setAssetType(asset.assetType);
    setAssetName(asset.name);
    setAssetAmount(formatNominalInput(String(asset.amount)));
    const defaultCats = asset.assetType === 'liquid' ? LIQUID_CATEGORIES : FIXED_CATEGORIES;
    setAssetCategory(asset.category || defaultCats[0]);
    setAssetNote(asset.note || '');
    setIsModalOpen(true);
  };

  const handleTypeSwitch = (nextType: 'liquid' | 'fixed') => {
    setAssetType(nextType);
    const defaultCats = nextType === 'liquid' ? LIQUID_CATEGORIES : FIXED_CATEGORIES;
    if (!defaultCats.includes(assetCategory)) {
      setAssetCategory(defaultCats[0]);
    }
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseNominalInput(assetAmount);
    if (!assetName.trim() || amountVal <= 0) return;

    const payload = {
      name: assetName.trim(),
      amount: amountVal,
      category: assetCategory.trim() || undefined,
      note: assetNote.trim() || undefined,
    };

    if (editingAsset) {
      updateAsset(editingAsset.assetType, editingAsset.id, payload, assetType);
    } else {
      addAsset(assetType, payload);
    }

    setIsModalOpen(false);
    setEditingAsset(null);
    setAssetName('');
    setAssetAmount('');
    setAssetNote('');
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteAsset(deleteTarget.assetType, deleteTarget.id);
    setDeleteTarget(null);
  };

  const categoryOptions = assetType === 'liquid' ? LIQUID_CATEGORIES : FIXED_CATEGORIES;

  return (
    <div className="space-y-5 lg:space-y-6 pb-28 lg:pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 pt-1 lg:pt-0">
        <div className="min-w-0">
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
            Aset & Kekayaan Bersih
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Neraca komposisi kas dompet, aset likuid, properti, hingga kewajiban aktif.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal('liquid')}
          className={`h-10 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${accentTheme.btnBg}`}
        >
          <Plus size={16} strokeWidth={2.6} />
          <span>Tambah Aset</span>
        </button>
      </div>

      {/* Command Center Hero: Neraca Kekayaan Bersih */}
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0B0E17] via-[#111628] to-[#090B12] rounded-3xl p-5 sm:p-6 lg:p-8 text-white shadow-xl border border-white/[0.08] space-y-6">
        <div className="absolute -top-28 -right-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div
          className={`absolute -bottom-28 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${accentTheme.glowBg}`}
        />

        {/* Top Row: Net Worth Primary Anchor + Runway Panel */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 7 Cols: Net Worth & Wealth Milestone */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className={`font-bold ${accentTheme.badgeText}`}>
                  Estimasi Kekayaan Bersih (Net Worth)
                </span>
                <span aria-hidden="true">·</span>
                <span>Level: {wealthMilestone.currentLevel}</span>
              </div>

              <div
                className={`font-mono text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight tabular-nums leading-none ${
                  totalNetWorth < 0 ? 'text-rose-400' : 'text-white'
                }`}
              >
                {formatRupiah(totalNetWorth, hide)}
              </div>

              {/* Gross Assets vs Total Liabilities Line */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 pt-1">
                <span>
                  Total Aset Bruto:{' '}
                  <strong className="font-mono tabular-nums text-white">
                    {formatRupiah(grossAssets, hide)}
                  </strong>
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span>
                  Total Kewajiban:{' '}
                  <strong
                    className={`font-mono tabular-nums ${
                      totalLiabilities > 0 ? 'text-rose-400' : 'text-slate-300'
                    }`}
                  >
                    {totalLiabilities > 0
                      ? fmtCurrency(totalLiabilities, { prefix: '-' })
                      : formatRupiah(0, hide)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Level Milestone Progress Bar */}
            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0 truncate">
                  <span className="text-slate-400">Target Level Berikutnya: </span>
                  <strong className="text-white font-semibold">
                    {wealthMilestone.nextLevel}
                  </strong>
                </div>
                <span className={`font-mono font-bold tabular-nums shrink-0 ${accentTheme.badgeText}`}>
                  {formatRupiah(wealthMilestone.nextTarget, hide)} ({wealthMilestone.progressPct}%)
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${accentTheme.barBg}`}
                  style={{ width: `${wealthMilestone.progressPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {wealthMilestone.shortfall > 0
                    ? `Butuh ${fmtCurrency(wealthMilestone.shortfall)} lagi untuk naik level`
                    : 'Target level saat ini telah terlampaui'}
                </span>
                <span className="font-mono tabular-nums">
                  Rasio Likuid: {allocationShares.totalLiquidSharePct}%
                </span>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Emergency Runway & Liquidity Panel */}
          <div className="lg:col-span-5 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
                  <span>Ketahanan Dana Likuid (Runway)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Estimasi bertahan hidup dari kas & aset likuid
                </p>
              </div>
              <span className={`text-xs font-bold shrink-0 ${runwayStatus.tone}`}>
                {runwayStatus.label}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-4 py-1">
              <div>
                <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                  {totalRunwayMonths}{' '}
                  <span className="text-sm font-semibold text-slate-300">Bulan</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{runwayStatus.desc}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Total Cadangan Likuid</span>
                <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                  {formatRupiah(totalLiquidBuffer, hide)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
              <span>Basis Pengeluaran / Bln</span>
              <span className="font-mono font-semibold text-slate-200 tabular-nums">
                {formatRupiah(monthlyExpenseBaseline, hide)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Row: 4-Column Balance Sheet Summary Strip */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-white/[0.08]">
          {/* 1. Dompet & Kas */}
          <button
            type="button"
            onClick={() => setActiveTab('wallets')}
            className="text-left bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] p-3.5 rounded-2xl transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="truncate">Kas & Dompet</span>
              <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                {allocationShares.walletPct}%
              </span>
            </div>
            <div className="font-mono text-sm sm:text-base font-bold text-white mt-1 tabular-nums truncate">
              {formatRupiah(totalBalance, hide)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span className="truncate">{liquidWallets.length} dompet aktif</span>
              <ArrowUpRight
                size={13}
                className="text-slate-500 group-hover:text-white transition-colors shrink-0"
              />
            </div>
          </button>

          {/* 2. Aset Likuid Manual */}
          <button
            type="button"
            onClick={() => setActiveFilter('liquid')}
            className="text-left bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] p-3.5 rounded-2xl transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="truncate">Aset Likuid</span>
              <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                {allocationShares.liquidPct}%
              </span>
            </div>
            <div className="font-mono text-sm sm:text-base font-bold text-white mt-1 tabular-nums truncate">
              {formatRupiah(totalLiquidManual, hide)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {liquidAssets.length} instrumen tercatat
            </div>
          </button>

          {/* 3. Aset Tetap */}
          <button
            type="button"
            onClick={() => setActiveFilter('fixed')}
            className="text-left bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] p-3.5 rounded-2xl transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="truncate">Aset Tetap</span>
              <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                {allocationShares.fixedPct}%
              </span>
            </div>
            <div className="font-mono text-sm sm:text-base font-bold text-white mt-1 tabular-nums truncate">
              {formatRupiah(totalFixedManual, hide)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {fixedAssets.length} properti / barang
            </div>
          </button>

          {/* 4. Investasi & Kewajiban Bersih */}
          <button
            type="button"
            onClick={() =>
              setActiveTab(totalLiabilities > totalPortfolioAndReceivables ? 'debt' : 'invest')
            }
            className="text-left bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] p-3.5 rounded-2xl transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="truncate">Investasi vs Utang</span>
              <ArrowUpRight
                size={13}
                className="text-slate-500 group-hover:text-white transition-colors shrink-0"
              />
            </div>
            <div className="font-mono text-sm sm:text-base font-bold text-white mt-1 tabular-nums truncate">
              {formatRupiah(totalPortfolioAndReceivables - totalLiabilities, hide)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              Inv {fmtCurrency(totalPortfolioAndReceivables)} · Utang{' '}
              {fmtCurrency(totalLiabilities)}
            </div>
          </button>
        </div>
      </div>

      {/* Asset Composition Bar Card */}
      {grossAssets > 0 && (
        <div className="bg-white dark:bg-[#12151E] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.07] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-slate-500 dark:text-slate-400" />
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Proporsi Komposisi Aset Bruto
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              Total Bruto: {formatRupiah(grossAssets, hide)}
            </span>
          </div>

          {/* Stacked Bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            {allocationShares.walletPct > 0 && (
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${allocationShares.walletPct}%` }}
                title={`Kas & Dompet: ${allocationShares.walletPct}%`}
              />
            )}
            {allocationShares.liquidPct > 0 && (
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${allocationShares.liquidPct}%` }}
                title={`Aset Likuid: ${allocationShares.liquidPct}%`}
              />
            )}
            {allocationShares.investPct > 0 && (
              <div
                className="h-full bg-violet-500 transition-all duration-300"
                style={{ width: `${allocationShares.investPct}%` }}
                title={`Investasi & Piutang: ${allocationShares.investPct}%`}
              />
            )}
            {allocationShares.fixedPct > 0 && (
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${allocationShares.fixedPct}%` }}
                title={`Aset Tetap: ${allocationShares.fixedPct}%`}
              />
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400 truncate">
                Kas Dompet ({allocationShares.walletPct}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400 truncate">
                Aset Likuid ({allocationShares.liquidPct}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-violet-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400 truncate">
                Investasi ({allocationShares.investPct}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400 truncate">
                Aset Tetap ({allocationShares.fixedPct}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (7 Cols): Daftar Aset Likuid & Aset Tetap */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#12151E] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.07] space-y-5">
            {/* Section Header + Segmented Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Daftar Aset Tersimpan
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kelola nilai emas, deposito, properti, kendaraan, dan aset lainnya.
                </p>
              </div>

              {/* Interactive Segmented Filter Control */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/[0.05] rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Semua ({liquidAssets.length + fixedAssets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('liquid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeFilter === 'liquid'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Likuid ({liquidAssets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('fixed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeFilter === 'fixed'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tetap ({fixedAssets.length})
                </button>
              </div>
            </div>

            {/* Sub-summary row for current filter */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Coins size={14} className="text-amber-500 shrink-0" />
                    <span className="truncate">Total Aset Likuid</span>
                  </div>
                  <div className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1 tabular-nums truncate">
                    {formatRupiah(totalLiquidManual, hide)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openCreateModal('liquid')}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                  title="Tambah Aset Likuid"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Building2 size={14} className="text-sky-500 shrink-0" />
                    <span className="truncate">Total Aset Tetap</span>
                  </div>
                  <div className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1 tabular-nums truncate">
                    {formatRupiah(totalFixedManual, hide)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openCreateModal('fixed')}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                  title="Tambah Aset Tetap"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Assets List or Empty State */}
            {allManualAssets.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/[0.08] space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-200/70 dark:bg-white/[0.06] flex items-center justify-center mx-auto text-slate-600 dark:text-slate-300">
                  {activeFilter === 'fixed' ? <Building2 size={20} /> : <Coins size={20} />}
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                    {activeFilter === 'liquid'
                      ? 'Belum Ada Aset Likuid'
                      : activeFilter === 'fixed'
                      ? 'Belum Ada Aset Tetap'
                      : 'Belum Ada Aset Tercatat'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Catat kepemilikan seperti emas batangan, deposito, kendaraan, atau properti untuk memantau kekayaan bersih secara utuh.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      openCreateModal(activeFilter === 'fixed' ? 'fixed' : 'liquid')
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-transform active:scale-95 ${accentTheme.btnBg}`}
                  >
                    + Catat Aset Pertama
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {allManualAssets.map((asset) => {
                  const isLiquid = asset.assetType === 'liquid';
                  const sharePct =
                    grossAssets > 0
                      ? Math.max(0.1, Number(((asset.amount / grossAssets) * 100).toFixed(1)))
                      : 0;

                  return (
                    <div
                      key={`${asset.assetType}-${asset.id}`}
                      className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isLiquid
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                          }`}
                        >
                          {isLiquid ? <Coins size={18} /> : <Building2 size={18} />}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {asset.name}
                          </h3>
                          {/* Unboxed clean metadata with middot separator */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span
                              className={
                                isLiquid
                                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                                  : 'text-sky-600 dark:text-sky-400 font-medium'
                              }
                            >
                              {isLiquid ? 'Aset Likuid' : 'Aset Tetap'}
                            </span>
                            {asset.category && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="truncate">{asset.category}</span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{sharePct}% dari aset</span>
                          </div>
                          {asset.note && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                              {asset.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums block">
                            {formatRupiah(asset.amount, hide)}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(asset)}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Edit Aset"
                            aria-label={`Edit ${asset.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(asset)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Hapus Aset"
                            aria-label={`Hapus ${asset.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panduan Klasifikasi Aset */}
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-white/[0.06] flex items-start gap-3.5 text-xs text-slate-600 dark:text-slate-300">
            <Lightbulb size={18} className={`shrink-0 mt-0.5 ${accentTheme.lightText}`} />
            <div className="space-y-1">
              <h4 className="font-display font-bold text-slate-900 dark:text-white">
                Perbedaan Aset Likuid vs Aset Tetap
              </h4>
              <p className="leading-relaxed text-slate-500 dark:text-slate-400">
                <strong>Aset Likuid</strong> (seperti emas batangan, deposito, atau reksadana pasar uang) mudah dicairkan menjadi uang tunai dalam hitungan hari dan dihitung ke dalam <em>Total Runway Dana Darurat</em>.{' '}
                <strong>Aset Tetap</strong> (seperti tanah, rumah, atau kendaraan) menjaga nilai kekayaan jangka panjang namun membutuhkan waktu lebih lama untuk dijual.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Dompet & Akun + Sinkronisasi Investasi & Kewajiban */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Dompet & Rekening Kas */}
          <div className="bg-white dark:bg-[#12151E] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.07] space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Landmark size={17} className="text-emerald-500 shrink-0" />
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Dompet & Rekening Kas
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('wallets')}
                className={`text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer ${accentTheme.lightText}`}
              >
                <span>Kelola Dompet</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            {/* Available vs Locked Breakdown */}
            {totalReservedInWallets > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Lock size={13} className="text-amber-500 shrink-0" />
                  <span>Terkunci di Goals / Cadangan</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatRupiah(totalReservedInWallets, hide)}
                </span>
              </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {liquidWallets.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Belum ada dompet kas aktif.
                </p>
              ) : (
                liquidWallets.map((w) => {
                  const lockedAmt = Math.max(0, w.balance - w.availableBalance);
                  const typeLabel = WALLET_TYPE_LABELS[w.type] || 'Dompet';

                  return (
                    <div
                      key={w.id}
                      className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: w.color || '#2563EB' }}
                        >
                          <WalletIcon size={16} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {w.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{typeLabel}</span>
                            {lockedAmt > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-600 dark:text-amber-400">
                                  Terkunci {fmtCurrency(lockedAmt)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums block">
                          {formatRupiah(w.balance, hide)}
                        </span>
                        {lockedAmt > 0 && (
                          <span className="font-mono text-[10px] text-slate-400 tabular-nums block">
                            Bebas: {formatRupiah(w.availableBalance, hide)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                Total Kas & Tabungan ({liquidWallets.length} Akun)
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {formatRupiah(totalBalance, hide)}
              </span>
            </div>
          </div>

          {/* Card 2: Rincian Portofolio Investasi & Kewajiban Terhubung */}
          <div className="bg-white dark:bg-[#12151E] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.07] space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Komponen Neraca Terhubung
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Otomatis tersinkronisasi dengan menu Investasi dan Utang.
              </p>
            </div>

            <div className="space-y-3">
              {/* Row 1: Portofolio Investasi */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                    <TrendingUp size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      Portofolio Investasi
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {investments.length} instrumen investasi aktif
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums block">
                    {fmtCurrency(totalInvestments, { prefix: '+' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('invest')}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                  >
                    Buka Investasi →
                  </button>
                </div>
              </div>

              {/* Row 2: Piutang Aktif (if any) */}
              {totalReceivableDebts > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Coins size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        Piutang Aktif (Dana Dipinjamkan)
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tagihan piutang belum lunas
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400 tabular-nums block">
                      {fmtCurrency(totalReceivableDebts, { prefix: '+' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('debt')}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                    >
                      Lihat Piutang →
                    </button>
                  </div>
                </div>
              )}

              {/* Row 3: Kewajiban & Utang Aktif */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <CreditCard size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      Kewajiban & Utang Aktif
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pengurang nilai kekayaan bersih
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`font-mono text-xs sm:text-sm font-bold tabular-nums block ${
                      totalLiabilities > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {totalLiabilities > 0
                      ? fmtCurrency(totalLiabilities, { prefix: '-' })
                      : formatRupiah(0, hide)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('debt')}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                  >
                    Kelola Utang →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Tambah / Edit Aset */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-[#161923] rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-slate-200 dark:border-white/[0.08]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {editingAsset ? 'Edit Data Aset' : 'Tambah Aset Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {editingAsset
                      ? 'Perbarui taksiran nilai pasar atau kategori aset.'
                      : 'Catat aset likuid maupun aset tetap ke neraca kekayaan.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAsset} className="space-y-4">
                {/* Segmented Type Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                    Kelompok Aset
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-white/[0.05] rounded-2xl">
                    <button
                      type="button"
                      onClick={() => handleTypeSwitch('liquid')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        assetType === 'liquid'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Coins size={14} className="text-amber-500" />
                      <span>Aset Likuid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeSwitch('fixed')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        assetType === 'fixed'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Building2 size={14} className="text-sky-500" />
                      <span>Aset Tetap</span>
                    </button>
                  </div>
                </div>

                {/* Kategori Aset */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                    Kategori Instrumen
                  </label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                    className={`w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentTheme.ringFocus}`}
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nama Aset */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                    Nama Aset
                  </label>
                  <input
                    type="text"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder={
                      assetType === 'liquid'
                        ? 'Contoh: Emas Antam 10gr, Deposito BCA'
                        : 'Contoh: Rumah Tinggal, Honda Vario 160'
                    }
                    required
                    className={`w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentTheme.ringFocus}`}
                  />
                </div>

                {/* Nilai Estimasi Aset */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                    Estimasi Nilai Saat Ini (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={assetAmount}
                    onChange={(e) => setAssetAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 15.000.000"
                    required
                    className={`w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 ${accentTheme.ringFocus}`}
                  />
                </div>

                {/* Catatan Opsional */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                    Catatan / Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={assetNote}
                    onChange={(e) => setAssetNote(e.target.value)}
                    placeholder="Contoh: Disimpan di brankas, Tahun pembelian 2024"
                    className={`w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentTheme.ringFocus}`}
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-98 cursor-pointer ${accentTheme.btnBg}`}
                  >
                    {editingAsset ? 'Simpan Perubahan' : 'Simpan Aset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Konfirmasi Hapus Aset */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-[#161923] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 dark:border-white/[0.08]"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Hapus Aset Ini?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Aset <strong>{deleteTarget.name}</strong> senilai{' '}
                    <strong className="font-mono tabular-nums">
                      {formatRupiah(deleteTarget.amount, hide)}
                    </strong>{' '}
                    akan dihapus dari perhitungan kekayaan bersihmu.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
