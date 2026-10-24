'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { useApp } from './AppContext';
import { formatNumberOnly, formatNominalInput, parseNominalInput, formatRupiah } from '@/lib/formatters';

function TransferModalForm() {
  const {
    setIsTransferOpen,
    wallets,
    walletsWithBalance,
    settings,
    transferFunds,
    addToast,
  } = useApp();

  const defaultFromId =
    walletsWithBalance.find((w) => w.type !== 'credit' && w.type !== 'paylater')?.id ||
    walletsWithBalance[0]?.id ||
    wallets[0]?.id ||
    '';

  const [fromWalletId, setFromWalletId] = useState(() => defaultFromId);
  const [toWalletId, setToWalletId] = useState(
    () =>
      walletsWithBalance.find((w) => w.id !== defaultFromId)?.id ||
      wallets[0]?.id ||
      ''
  );
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');

  const currentAmount = parseNominalInput(amountStr);
  const fromWallet = walletsWithBalance.find((w) => w.id === fromWalletId) || walletsWithBalance[0];
  const isFromDebtWallet = fromWallet?.type === 'credit' || fromWallet?.type === 'paylater';
  const fromWalletBalance = Math.max(0, fromWallet?.balance || 0);
  const isInsufficient = !isFromDebtWallet && currentAmount > 0 && currentAmount > fromWalletBalance;
  const shortfall = Math.max(0, currentAmount - fromWalletBalance);

  const handleFromWalletChange = (newFromId: string) => {
    setFromWalletId(newFromId);
    if (newFromId === toWalletId) {
      const other = walletsWithBalance.find((w) => w.id !== newFromId);
      if (other) setToWalletId(other.id);
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAmount <= 0 || isInsufficient) return;
    if (fromWalletId === toWalletId) {
      addToast('Transfer Gagal', 'Dompet asal dan tujuan harus berbeda.', 'error');
      return;
    }
    const ok = transferFunds(fromWalletId, toWalletId, currentAmount, note.trim() || undefined);
    if (ok) {
      setIsTransferOpen(false);
    }
  };

  const formatWalletOptionLabel = (w: (typeof walletsWithBalance)[number]) => {
    const isDebt = w.type === 'credit' || w.type === 'paylater';
    if (settings.hideBalance) return `${w.name} (Rp ••••)`;
    if (isDebt && w.balance > 0) return `${w.name} (Tagihan Rp${formatNumberOnly(w.balance)})`;
    return `${w.name} (Rp${formatNumberOnly(w.balance)})`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-[#11131E] rounded-[28px] p-5 sm:p-6 shadow-2xl border border-slate-200/80 dark:border-white/10"
    >
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/[0.08]">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-[#D4F826]">
          <ArrowRightLeft size={18} />
          <h2 className="font-display text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            Transfer Dompet
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsTransferOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleTransfer} className="mt-4 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Dari Dompet
            </label>
            <select
              value={fromWalletId}
              onChange={(e) => handleFromWalletChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {walletsWithBalance.map((w) => (
                <option key={w.id} value={w.id} className="bg-white dark:bg-[#161928]">
                  {formatWalletOptionLabel(w)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Ke Dompet
            </label>
            <select
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {walletsWithBalance.map((w) => (
                <option
                  key={w.id}
                  value={w.id}
                  disabled={w.id === fromWalletId}
                  className="bg-white dark:bg-[#161928]"
                >
                  {formatWalletOptionLabel(w)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Nominal (Rp)
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amountStr}
            onChange={(e) => setAmountStr(formatNominalInput(e.target.value))}
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl font-mono-num text-base font-extrabold text-indigo-600 dark:text-[#D4F826] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[50000, 100000, 250000, 500000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmountStr(formatNominalInput(v))}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                +{formatNumberOnly(v)}
              </button>
            ))}
          </div>
        </div>

        {isInsufficient && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle size={15} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Saldo {fromWallet?.name || 'Dompet'} kurang</p>
              <p className="text-[11px] mt-0.5">
                Tersedia {formatRupiah(fromWalletBalance, settings.hideBalance)} (kurang{' '}
                <strong>{formatRupiah(shortfall, settings.hideBalance)}</strong>).
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Catatan (Opsional)
          </label>
          <input
            type="text"
            placeholder="Misal: Pindah saldo, top up"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="pt-2 flex gap-2.5">
          <button
            type="button"
            onClick={() => setIsTransferOpen(false)}
            className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={currentAmount <= 0 || fromWalletId === toWalletId || isInsufficient}
            className="flex-2 py-2.5 text-xs font-extrabold rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black shadow-xs disabled:opacity-40 cursor-pointer"
          >
            Transfer
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export function TransferModal() {
  const { isTransferOpen } = useApp();

  if (!isTransferOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <TransferModalForm />
      </div>
    </AnimatePresence>
  );
}
