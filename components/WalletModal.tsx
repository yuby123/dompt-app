'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Check, Sparkles } from 'lucide-react';
import { useApp } from './AppContext';
import { WalletType } from '@/lib/types';
import { formatNominalInput, parseNominalInput, formatRupiah } from '@/lib/formatters';
import {
  WALLET_BRANDS,
  WALLET_BRAND_CATEGORIES,
  WalletBrandCategory,
  WalletBrandDefinition,
  WalletBrandLogo,
  detectWalletBrand,
} from './WalletBrandLogo';

const WALLET_TYPE_OPTIONS: { type: WalletType; label: string; icon: string; defaultColor: string }[] = [
  { type: 'bank', label: 'Rekening Bank', icon: 'Landmark', defaultColor: '#005BAA' },
  { type: 'ewallet', label: 'E-Wallet', icon: 'Smartphone', defaultColor: '#00AED6' },
  { type: 'cash', label: 'Tunai', icon: 'Banknote', defaultColor: '#16A34A' },
  { type: 'savings', label: 'Tabungan', icon: 'PiggyBank', defaultColor: '#8B5CF6' },
  { type: 'investment', label: 'Investasi', icon: 'TrendingUp', defaultColor: '#EC4899' },
  { type: 'credit', label: 'Kartu Kredit', icon: 'CreditCard', defaultColor: '#DC2626' },
  { type: 'paylater', label: 'Paylater', icon: 'CalendarClock', defaultColor: '#EA580C' },
  { type: 'other', label: 'Lainnya', icon: 'Wallet', defaultColor: '#6B7280' },
];

function WalletModalForm() {
  const {
    setIsWalletModalOpen,
    editingWallet,
    walletsWithBalance,
    addWallet,
    updateWallet,
    deleteWallet,
  } = useApp();

  const initialDetectedBrand = detectWalletBrand(editingWallet?.name, editingWallet?.icon);
  const currentWalletWithBalance = editingWallet
    ? walletsWithBalance.find((w) => w.id === editingWallet.id)
    : undefined;
  const netTxDelta = currentWalletWithBalance && editingWallet
    ? currentWalletWithBalance.balance - Math.max(0, Number(editingWallet.initialBalance) || 0)
    : 0;

  const [name, setName] = useState(() => editingWallet?.name || '');
  const [type, setType] = useState<WalletType>(() => editingWallet?.type || 'bank');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(
    () => initialDetectedBrand?.id || null
  );
  const [manualLogoCleared, setManualLogoCleared] = useState(false);
  const [activeBrandTab, setActiveBrandTab] = useState<WalletBrandCategory>(
    () => initialDetectedBrand?.category || 'Bank Konvensional & Syariah'
  );
  const [accountNumber, setAccountNumber] = useState(() => editingWallet?.accountNumber || '');
  const [balanceEditMode, setBalanceEditMode] = useState<'current' | 'initial'>(() =>
    editingWallet && netTxDelta !== 0 ? 'current' : 'initial'
  );
  const [initialBalance, setInitialBalance] = useState<string>(() =>
    editingWallet ? formatNominalInput(Math.abs(editingWallet.initialBalance)) : '0'
  );
  const [currentBalanceInput, setCurrentBalanceInput] = useState<string>(() =>
    currentWalletWithBalance
      ? formatNominalInput(Math.abs(currentWalletWithBalance.balance))
      : editingWallet
      ? formatNominalInput(Math.abs(editingWallet.initialBalance))
      : '0'
  );
  const [reservedAmount, setReservedAmount] = useState<string>(() =>
    editingWallet && editingWallet.reservedAmount
      ? formatNominalInput(Math.max(0, editingWallet.reservedAmount))
      : '0'
  );
  const [color, setColor] = useState(
    () => editingWallet?.color || initialDetectedBrand?.primaryColor || '#005BAA'
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDebtType = type === 'credit' || type === 'paylater';

  const currentBrand = selectedBrandId
    ? WALLET_BRANDS.find((b) => b.id === selectedBrandId) || null
    : null;

  const handleSelectBrand = (brand: WalletBrandDefinition) => {
    setManualLogoCleared(false);
    setSelectedBrandId(brand.id);
    setType(brand.walletType);
    setColor(brand.primaryColor);

    const trimmed = name.trim();
    const isPreviousBrandName = WALLET_BRANDS.some(
      (b) =>
        b.name.toLowerCase() === trimmed.toLowerCase() ||
        b.shortName.toLowerCase() === trimmed.toLowerCase()
    );
    if (!trimmed || isPreviousBrandName) {
      setName(brand.name);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!manualLogoCleared) {
      const autoBrand = detectWalletBrand(val);
      if (autoBrand) {
        setSelectedBrandId(autoBrand.id);
        setType(autoBrand.walletType);
        setColor(autoBrand.primaryColor);
        setActiveBrandTab(autoBrand.category);
      }
    }
  };

  const resolvedInitialBalanceNum =
    editingWallet && balanceEditMode === 'current'
      ? Math.max(0, parseNominalInput(currentBalanceInput) - netTxDelta)
      : Math.max(0, parseNominalInput(initialBalance));

  const previewBalance =
    editingWallet && balanceEditMode === 'current'
      ? Math.max(0, parseNominalInput(currentBalanceInput))
      : Math.max(0, resolvedInitialBalanceNum + netTxDelta);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const balanceNum = resolvedInitialBalanceNum;
    const reservedNum = isDebtType ? 0 : Math.max(0, parseNominalInput(reservedAmount));
    const selectedOption = WALLET_TYPE_OPTIONS.find((o) => o.type === type);

    const resolvedBrand = selectedBrandId
      ? WALLET_BRANDS.find((b) => b.id === selectedBrandId) || null
      : null;

    const resolvedIcon =
      resolvedBrand && (type === 'bank' || type === 'ewallet' || type === 'savings')
        ? `brand:${resolvedBrand.id}`
        : selectedOption?.icon || 'Wallet';

    const payload = {
      name: name.trim(),
      type,
      accountNumber: accountNumber.trim() || undefined,
      initialBalance: balanceNum,
      reservedAmount: reservedNum,
      color,
      icon: resolvedIcon,
    };

    if (editingWallet) {
      updateWallet(editingWallet.id, payload);
    } else {
      addWallet(payload);
    }

    setIsWalletModalOpen(false);
  };

  const handleDelete = () => {
    if (!editingWallet) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const deleted = deleteWallet(editingWallet.id);
    if (deleted) {
      setIsWalletModalOpen(false);
    }
  };

  return (
    <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-[#11131E] rounded-[30px] p-5 sm:p-6 shadow-2xl border border-slate-200/80 dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/[0.08]">
        <div>
          <h2 className="font-display text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            {editingWallet ? 'Edit Dompet' : 'Tambah Dompet'}
          </h2>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Pilih logo resmi bank atau e-wallet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editingWallet && (
            <button
              type="button"
              onClick={handleDelete}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                confirmDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
              }`}
              title="Hapus dompet"
            >
              <Trash2 size={14} />
              {confirmDelete && <span>Hapus?</span>}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsWalletModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
        {/* Live Card Preview */}
        <div
          className={`relative overflow-hidden rounded-2xl p-4 text-white border border-white/15 shadow-md transition-all bg-gradient-to-br ${
            currentBrand ? currentBrand.cardGradient : 'from-[#1E293B] via-[#0F172A] to-[#090D16]'
          }`}
          style={!currentBrand ? { backgroundColor: color } : undefined}
        >
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <WalletBrandLogo
                brandId={currentBrand?.id}
                walletName={name || currentBrand?.name}
                walletType={type}
                walletIcon={currentBrand ? `brand:${currentBrand.id}` : undefined}
                walletColor={color}
                size="md"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/15 text-white/95">
                    {currentBrand ? currentBrand.category.split(' ')[0] : type.toUpperCase()}
                  </span>
                  {currentBrand && (
                    <span className="text-[10px] font-medium text-white/80 truncate">
                      {currentBrand.badgeText}
                    </span>
                  )}
                </div>
                <p className="font-display text-base font-extrabold text-white truncate mt-1">
                  {name.trim() || currentBrand?.name || 'Nama Dompet'}
                </p>
                {accountNumber.trim() && (
                  <p className="font-mono-num text-[11px] text-white/80 tracking-wider truncate">
                    {accountNumber.trim()}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-semibold text-white/75 block">
                {isDebtType ? 'Tagihan' : editingWallet ? 'Saldo' : 'Saldo Awal'}
              </span>
              <span className="font-mono-num text-sm sm:text-base font-extrabold text-white block">
                {formatRupiah(previewBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Official Bank & E-Wallet Logo Selector */}
        <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              Pilih Logo Resmi
            </span>
            {selectedBrandId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBrandId(null);
                  setManualLogoCleared(true);
                }}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                Reset Logo
              </button>
            )}
          </div>

          {/* 3 Category Tabs */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 dark:bg-white/[0.05] p-1 rounded-xl">
            {WALLET_BRAND_CATEGORIES.map((cat) => {
              const shortTab =
                cat === 'Bank Konvensional & Syariah'
                  ? 'Bank Umum'
                  : cat === 'Bank Digital'
                  ? 'Bank Digital'
                  : 'E-Wallet';
              const active = activeBrandTab === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveBrandTab(cat)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate ${
                    active
                      ? 'bg-white dark:bg-[#1E2235] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {shortTab}
                </button>
              );
            })}
          </div>

          {/* Brand Grid */}
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-0.5">
            {WALLET_BRANDS.filter((b) => b.category === activeBrandTab).map((brand) => {
              const isSelected = currentBrand?.id === brand.id;
              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => handleSelectBrand(brand)}
                  className={`relative flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-600 dark:border-[#D4F826] bg-teal-50/70 dark:bg-[#D4F826]/10 ring-1 ring-teal-600 dark:ring-[#D4F826]'
                      : 'border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#161928] hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <WalletBrandLogo brandId={brand.id} size="sm" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate leading-tight">
                      {brand.shortName}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 block truncate">
                      {brand.walletType === 'ewallet' ? 'E-Wallet' : 'Bank'}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-teal-600 dark:bg-[#D4F826] text-white dark:text-black flex items-center justify-center shrink-0">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nama Dompet & Nomor Rekening */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
              Nama Dompet *
            </label>
            <input
              type="text"
              placeholder="BCA, GoPay, SeaBank"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
              No. Rekening / HP <span className="font-normal text-slate-400">(Opsional)</span>
            </label>
            <input
              type="text"
              placeholder="1234567890"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>

        {/* Tipe Dompet */}
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
            Kategori
          </label>
          <div className="grid grid-cols-4 gap-2">
            {WALLET_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  setType(opt.type);
                  if (!currentBrand) {
                    setColor(opt.defaultColor);
                  }
                  if (
                    opt.type === 'cash' ||
                    opt.type === 'investment' ||
                    opt.type === 'credit' ||
                    opt.type === 'paylater'
                  ) {
                    setSelectedBrandId(null);
                  }
                }}
                className={`p-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  type === opt.type
                    ? 'border-teal-600 dark:border-[#D4F826] bg-teal-50 dark:bg-[#D4F826]/15 text-teal-800 dark:text-[#D4F826] ring-1 ring-teal-600 dark:ring-[#D4F826]'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Saldo & Dana Dicadangkan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={isDebtType ? 'sm:col-span-2' : ''}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isDebtType
                  ? 'Tagihan (Rp)'
                  : editingWallet && balanceEditMode === 'current'
                  ? 'Saldo Saat Ini (Rp)'
                  : 'Saldo Awal (Rp)'}
              </label>
              {editingWallet && netTxDelta !== 0 && !isDebtType && (
                <button
                  type="button"
                  onClick={() => {
                    if (balanceEditMode === 'current') {
                      setInitialBalance(formatNominalInput(resolvedInitialBalanceNum));
                      setBalanceEditMode('initial');
                    } else {
                      setCurrentBalanceInput(formatNominalInput(previewBalance));
                      setBalanceEditMode('current');
                    }
                  }}
                  className="text-[10px] font-bold text-teal-600 dark:text-[#D4F826] hover:underline cursor-pointer"
                >
                  {balanceEditMode === 'current' ? 'Ubah Saldo Awal' : 'Ubah Saldo Saat Ini'}
                </button>
              )}
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={editingWallet && balanceEditMode === 'current' ? currentBalanceInput : initialBalance}
              onChange={(e) => {
                const formatted = formatNominalInput(e.target.value);
                if (editingWallet && balanceEditMode === 'current') {
                  setCurrentBalanceInput(formatted);
                } else {
                  setInitialBalance(formatted);
                }
              }}
              className="w-full p-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-extrabold font-mono-num text-teal-700 dark:text-[#D4F826] focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {!isDebtType && (
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Dicadangkan (Rp) <span className="font-normal text-slate-400">(Opsional)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={reservedAmount}
                onChange={(e) => setReservedAmount(formatNominalInput(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold font-mono-num text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Pilihan Warna Aksen */}
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
            Warna Aksen
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              '#005BAA',
              '#00529C',
              '#003D79',
              '#00A39D',
              '#FF5722',
              '#00AED6',
              '#4C3494',
              '#118EEA',
              '#EE4D2D',
              '#16A34A',
              '#EC4899',
              '#6B7280',
            ].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform cursor-pointer border border-black/10 dark:border-white/20 ${
                  color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="pt-2 flex gap-2.5">
          <button
            type="button"
            onClick={() => setIsWalletModalOpen(false)}
            className="flex-1 py-2.5 text-xs font-bold rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-white/[0.1]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="flex-2 py-2.5 px-6 text-xs font-black rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black shadow-md cursor-pointer transition-transform active:scale-98"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}

export function WalletModal() {
  const { isWalletModalOpen, editingWallet } = useApp();

  if (!isWalletModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg"
        >
          <WalletModalForm key={editingWallet ? editingWallet.id : 'new-wallet'} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
