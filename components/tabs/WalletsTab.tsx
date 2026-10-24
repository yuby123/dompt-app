'use client';

import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';
import { WalletWithBalance } from '@/lib/types';
import {
  WALLET_BRANDS,
  WALLET_BRAND_CATEGORIES,
  WalletBrandDefinition,
  WalletBrandLogo,
  detectWalletBrand,
} from '../WalletBrandLogo';

export function WalletsTab() {
  const {
    walletsWithBalance,
    totalBalance,
    goals,
    debts,
    settings,
    openAddWallet,
    openEditWallet,
    addWallet,
    deleteWallet,
    toggleHideBalance,
  } = useApp();

  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(
    () => walletsWithBalance[0]?.id || null
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showBrandCatalog, setShowBrandCatalog] = useState<boolean>(false);

  const hide = settings.hideBalance;

  const getWalletTypeLabel = (type: string) => {
    switch (type) {
      case 'bank':
        return 'REKENING BANK';
      case 'ewallet':
        return 'E-WALLET';
      case 'cash':
        return 'TUNAI';
      case 'investment':
        return 'INVESTASI';
      case 'credit':
        return 'KARTU KREDIT';
      case 'paylater':
        return 'PAYLATER';
      case 'savings':
        return 'TABUNGAN';
      default:
        return 'DOMPET';
    }
  };

  const totalAvailable = walletsWithBalance
    .filter((w) => w.type !== 'credit' && w.type !== 'paylater')
    .reduce((acc, w) => acc + Math.max(0, w.availableBalance), 0);

  const totalReserved = walletsWithBalance
    .filter((w) => w.type !== 'credit' && w.type !== 'paylater')
    .reduce((acc, w) => acc + (w.reservedAmount || 0), 0);

  const creditWalletsTotal = walletsWithBalance
    .filter((w) => (w.type === 'credit' || w.type === 'paylater') && Math.abs(w.balance) > 0)
    .reduce((acc, w) => acc + Math.abs(w.balance), 0);

  const activePayableDebtsTotal = debts
    .filter((d) => d.type === 'payable' && d.status !== 'paid')
    .reduce((acc, d) => acc + Math.max(0, d.remainingAmount || 0), 0);

  const totalCreditLiability = creditWalletsTotal + activePayableDebtsTotal;

  // Quick-add or edit from the official brand showcase
  const handleSelectBrandFromCatalog = (brand: WalletBrandDefinition) => {
    const existing = walletsWithBalance.find(
      (w) => detectWalletBrand(w.name, w.icon)?.id === brand.id
    );
    if (existing) {
      openEditWallet(existing);
      return;
    }
    addWallet({
      name: brand.name,
      type: brand.walletType,
      initialBalance: 0,
      reservedAmount: 0,
      color: brand.primaryColor,
      icon: `brand:${brand.id}`,
    });
  };

  return (
    <div className="space-y-5 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pt-1 lg:pt-0 px-0.5">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
            Dompet & Rekening
          </h1>
          <p className="text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Kelola rekening bank konvensional, bank digital, dan e-wallet resmi.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowBrandCatalog((prev) => !prev)}
            className={`h-10 px-3 sm:px-3.5 rounded-full flex items-center justify-center gap-1.5 font-bold text-xs border cursor-pointer transition-all active:scale-95 ${
              showBrandCatalog
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                : 'bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10'
            }`}
            title="Lihat Katalog 17 Bank & E-Wallet Resmi"
          >
            <Sparkles size={15} className={showBrandCatalog ? 'text-[#D4F826]' : 'text-amber-500'} />
            <span className="hidden sm:inline font-semibold">Katalog Bank & E-Wallet</span>
          </button>
          <button
            type="button"
            onClick={toggleHideBalance}
            className="h-10 px-3 sm:px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 font-bold text-xs border border-slate-200/80 dark:border-white/10 cursor-pointer transition-transform active:scale-95"
            title={hide ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
            aria-label={hide ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
          >
            {hide ? (
              <Eye size={16} className="text-[#84CC16] dark:text-[#D4F826]" />
            ) : (
              <EyeOff size={16} />
            )}
            <span className="hidden md:inline font-semibold">
              {hide ? 'Buka Saldo' : 'Sembunyikan'}
            </span>
          </button>
          <button
            type="button"
            onClick={openAddWallet}
            className="h-10 px-4 rounded-full bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
            title="Tambah Dompet"
          >
            <Plus size={16} strokeWidth={2.8} />
            <span>Tambah Dompet</span>
          </button>
        </div>
      </div>

      {/* Bespoke Deep Indigo & Obsidian Hero Card */}
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-[28px] lg:rounded-[32px] p-5 sm:p-6 lg:px-9 lg:py-8 text-white border border-white/10 space-y-5">
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

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-6">
          {/* Left: Total Saldo & Tabungan */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="text-[#D4F826] font-semibold">Total Kekayaan Likuid</span>
              <span aria-hidden="true">·</span>
              <span>{walletsWithBalance.length} Dompet Aktif</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="font-display font-mono-num text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-none">
                {formatRupiah(totalBalance, hide)}
              </div>
              <button
                type="button"
                onClick={toggleHideBalance}
                className="p-1.5 sm:p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
                title={hide ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
                aria-label={hide ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
              >
                {hide ? (
                  <Eye size={18} className="text-[#D4F826]" />
                ) : (
                  <EyeOff size={18} />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-300/90 max-w-lg leading-relaxed">
              Mendukung logo resmi Bank Konvensional, Bank Syariah, Bank Digital, dan E-Wallet populer Indonesia.
            </p>
          </div>

          {/* Right: 3 Symmetrical Summary Metric Boxes */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
            <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xs border border-white/10 p-3 sm:px-4 sm:py-3.5 min-w-0 text-center sm:text-left">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 block truncate">
                Siap Pakai
              </span>
              <span className="font-mono-num text-xs sm:text-base lg:text-lg font-bold text-[#D4F826] mt-1 block truncate">
                {formatRupiah(totalAvailable, hide)}
              </span>
            </div>
            <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xs border border-white/10 p-3 sm:px-4 sm:py-3.5 min-w-0 text-center sm:text-left">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 block truncate">
                Dicadangkan
              </span>
              <span className="font-mono-num text-xs sm:text-base lg:text-lg font-bold text-white mt-1 block truncate">
                {formatRupiah(totalReserved, hide)}
              </span>
            </div>
            <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xs border border-white/10 p-3 sm:px-4 sm:py-3.5 min-w-0 text-center sm:text-left">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 block truncate">
                Tagihan Kredit
              </span>
              <span className="font-mono-num text-xs sm:text-base lg:text-lg font-bold text-[#FF6B2B] mt-1 block truncate">
                {formatRupiah(totalCreditLiability, hide)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Official 17 Indonesian Bank & E-Wallet Brand Directory */}
      <AnimatePresence>
        {showBrandCatalog && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white dark:bg-[#11131E] rounded-[28px] p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.08]">
              <div>
                <h2 className="font-display text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <span>Katalog Resmi Bank & E-Wallet Indonesia</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Klik salah satu logo di bawah untuk langsung menambahkan dompet dengan logo aslinya (atau mengedit jika sudah ada).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBrandCatalog(false)}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Tutup Katalog
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {WALLET_BRAND_CATEGORIES.map((category) => {
                const brandsInCategory = WALLET_BRANDS.filter((b) => b.category === category);
                return (
                  <div
                    key={category}
                    className="rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.06] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        {category}
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        {brandsInCategory.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {brandsInCategory.map((brand) => {
                        const existingWallet = walletsWithBalance.find(
                          (w) => detectWalletBrand(w.name, w.icon)?.id === brand.id
                        );
                        return (
                          <button
                            key={brand.id}
                            type="button"
                            onClick={() => handleSelectBrandFromCatalog(brand)}
                            className={`group flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                              existingWallet
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500'
                                : 'bg-white dark:bg-[#161928] border-slate-200/80 dark:border-white/[0.08] hover:border-indigo-500/50 hover:shadow-xs'
                            }`}
                          >
                            <WalletBrandLogo brandId={brand.id} size="sm" />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                                {brand.name}
                              </span>
                              {existingWallet ? (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                                  <CheckCircle2 size={10} />
                                  Terdaftar
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-[#D4F826] block truncate mt-0.5">
                                  + Tambah
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Cards List: Single Column on Mobile (<lg), 3-Column Grid on Desktop (lg+) */}
      <div className="space-y-3.5 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:items-start">
        {walletsWithBalance.map((w: WalletWithBalance) => {
          const detectedBrand = detectWalletBrand(w.name, w.icon);
          const isExpanded = expandedWalletId === w.id;
          const isDebtWallet = w.type === 'credit' || w.type === 'paylater';
          const isNegative = w.balance < 0 || (isDebtWallet && w.balance > 0);
          const accentBarColor = detectedBrand?.primaryColor || w.color || '#312E81';

          const walletIdSet = new Set(walletsWithBalance.map((item) => item.id));
          const fallbackLiquidId =
            walletsWithBalance.find((item) => item.type !== 'credit' && item.type !== 'paylater')?.id ||
            walletsWithBalance[0]?.id;

          const goalsBreakdown = goals
            .filter((g) => {
              if (g.currentAmount <= 0) return false;
              const resolvedGoalWalletId =
                g.walletId && walletIdSet.has(g.walletId) ? g.walletId : fallbackLiquidId;
              return resolvedGoalWalletId === w.id;
            })
            .map((g) => ({
              name: g.name,
              amount: g.currentAmount,
              emoji: g.emoji || '🎯',
            }));

          const goalsTotalForWallet = goalsBreakdown.reduce((sum, item) => sum + item.amount, 0);
          const manualReservedPart = Math.max(0, (w.reservedAmount || 0) - goalsTotalForWallet);
          const breakdown =
            manualReservedPart > 0
              ? [
                  {
                    name: 'Dana Cadangan Dompet',
                    amount: manualReservedPart,
                    emoji: '🛡️',
                  },
                  ...goalsBreakdown,
                ]
              : goalsBreakdown;

          const totalWalletReserved = Math.max(w.reservedAmount || 0, goalsTotalForWallet);

          return (
            <div
              key={w.id}
              className={`relative overflow-hidden bg-white dark:bg-[#11131E] rounded-[28px] p-5 border transition-all cursor-pointer ${
                isExpanded
                  ? 'border-[#D4F826] ring-1 ring-[#D4F826] shadow-md'
                  : 'border-slate-200/80 dark:border-white/[0.08] hover:border-indigo-500/40 shadow-2xs'
              }`}
              onClick={() => {
                setExpandedWalletId(isExpanded ? null : w.id);
                setConfirmDeleteId(null);
              }}
            >
              {/* Brand Top Accent Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: accentBarColor }}
              />

              {/* Subtle Ambient Brand Glow */}
              <div
                className="absolute -right-10 -top-10 w-28 h-28 rounded-full opacity-10 dark:opacity-15 blur-2xl pointer-events-none"
                style={{ backgroundColor: accentBarColor }}
              />

              {/* Header row */}
              <div className="relative z-10 flex items-start justify-between gap-3 pt-1">
                <div className="flex items-center gap-3.5 min-w-0">
                  <WalletBrandLogo
                    brandId={detectedBrand?.id}
                    walletName={w.name}
                    walletType={w.type}
                    walletIcon={w.icon}
                    walletColor={w.color}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: `${accentBarColor}15`,
                          borderColor: `${accentBarColor}35`,
                          color: detectedBrand?.id === 'neobank' ? '#D97706' : accentBarColor,
                        }}
                      >
                        {detectedBrand
                          ? detectedBrand.category === 'Bank Digital'
                            ? 'BANK DIGITAL'
                            : detectedBrand.category === 'E-Wallet (Dompet Digital)'
                            ? 'E-WALLET'
                            : 'BANK UMUM'
                          : getWalletTypeLabel(w.type)}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white truncate mt-1">
                      {w.name}
                    </h3>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
                      {w.accountNumber
                        ? `No. ${w.accountNumber}`
                        : detectedBrand
                        ? detectedBrand.badgeText
                        : getWalletTypeLabel(w.type)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-mono-num text-base sm:text-lg font-extrabold block ${
                      isNegative
                        ? 'text-rose-500 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {isDebtWallet && w.balance > 0
                      ? `Tagihan ${formatRupiah(w.balance, hide)}`
                      : formatRupiah(w.balance, hide)}
                  </span>
                  {w.expenseThisMonth > 0 ? (
                    <span className="font-mono-num text-[11px] font-semibold text-[#FF6B2B] block mt-0.5">
                      Keluar: -{formatRupiah(w.expenseThisMonth, hide)}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400 flex items-center justify-end gap-0.5 mt-0.5">
                      <span>{ isExpanded ? 'Tutup rincian' : 'Lihat rincian' }</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </span>
                  )}
                </div>
              </div>

              {/* Compact Footer Bar when collapsed: Available vs Reserved */}
              {!isExpanded && !isDebtWallet && (
                <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                    <span>Siap Pakai:</span>
                    <span
                      className={`font-mono-num font-bold ${
                        w.availableBalance < 0
                          ? 'text-rose-500'
                          : 'text-emerald-600 dark:text-[#D4F826]'
                      }`}
                    >
                      {formatRupiah(w.availableBalance, hide)}
                    </span>
                  </div>
                  {totalWalletReserved > 0 ? (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg">
                      <ShieldCheck size={12} />
                      <span>Cadangan {formatRupiah(totalWalletReserved, hide)}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {w.transactionCount} transaksi bln ini
                    </span>
                  )}
                </div>
              )}

              {/* Expandable Section */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="relative z-10 mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.08] text-xs space-y-3.5"
                >
                  {/* Account Number / Brand Institution Info */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-3 border border-slate-200/60 dark:border-white/[0.06]">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {w.accountNumber ? 'NOMOR REKENING / ID' : 'INSTITUSI / TIPE'}
                      </span>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {w.accountNumber || detectedBrand?.badgeText || getWalletTypeLabel(w.type)}
                      </span>
                    </div>
                    {detectedBrand && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-white/10">
                        {detectedBrand.category}
                      </span>
                    )}
                  </div>

                  {/* Dicadangkan / Reserved Breakdown */}
                  {(totalWalletReserved > 0 || breakdown.length > 0) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>DANA DICADANGKAN</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono-num">
                          {formatRupiah(totalWalletReserved, hide)}
                        </span>
                      </div>
                      {breakdown.length > 0 && (
                        <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-3 space-y-2 border border-slate-200/60 dark:border-white/[0.06]">
                          {breakdown.map((item) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                                <span>{item.emoji}</span>
                                <span>{item.name}</span>
                              </span>
                              <span className="font-mono-num font-extrabold text-slate-900 dark:text-white">
                                {formatRupiah(item.amount, hide)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rincian Saldo Awal & Mutasi Transaksi */}
                  <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-3 space-y-1.5 border border-slate-200/60 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">
                        Saldo Awal
                      </span>
                      <span className="font-mono-num font-bold text-slate-800 dark:text-slate-200">
                        {formatRupiah(w.initialBalance, hide)}
                      </span>
                    </div>
                    {w.incomeThisMonth > 0 && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">
                          Pemasukan Bulan Ini
                        </span>
                        <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatRupiah(w.incomeThisMonth, hide)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">
                        Pengeluaran Bulan Ini ({w.transactionCount} transaksi)
                      </span>
                      <span className="font-mono-num font-bold text-rose-500">
                        -{formatRupiah(w.expenseThisMonth, hide)}
                      </span>
                    </div>
                  </div>

                  {/* Tersedia */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      SALDO SIAP PAKAI
                    </span>
                    <span
                      className={`font-mono-num text-base font-black ${
                        w.availableBalance < 0
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-emerald-600 dark:text-[#D4F826]'
                      }`}
                    >
                      {formatRupiah(w.availableBalance, hide)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditWallet(w);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.14] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Pencil size={13} />
                      <span>Ubah & Pilih Logo</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirmDeleteId === w.id) {
                          deleteWallet(w.id);
                          setConfirmDeleteId(null);
                        } else {
                          setConfirmDeleteId(w.id);
                        }
                      }}
                      className={`py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        confirmDeleteId === w.id
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100'
                      }`}
                    >
                      <Trash2 size={13} />
                      <span>{confirmDeleteId === w.id ? 'Yakin Hapus?' : 'Hapus'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
