'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRightLeft } from 'lucide-react';
import { useApp } from './AppContext';
import { formatNumberOnly } from '@/lib/formatters';

function TransferModalForm() {
  const { setIsTransferOpen, wallets, transferFunds, addToast } = useApp();
  const [fromWalletId, setFromWalletId] = useState(() => wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState(
    () => wallets.find((w) => w.id !== wallets[0]?.id)?.id || wallets[0]?.id || ''
  );
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');

  const currentAmount = parseInt(amountStr, 10) || 0;

  const handleFromWalletChange = (newFromId: string) => {
    setFromWalletId(newFromId);
    if (newFromId === toWalletId) {
      const other = wallets.find((w) => w.id !== newFromId);
      if (other) setToWalletId(other.id);
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAmount <= 0) return;
    if (fromWalletId === toWalletId) {
      addToast('Transfer Gagal', 'Dompet asal dan tujuan harus berbeda.', 'error');
      return;
    }
    transferFunds(fromWalletId, toWalletId, currentAmount, note.trim() || undefined);
    setIsTransferOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-2xl border border-black/5 dark:border-white/10"
    >
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <ArrowRightLeft size={20} />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Transfer Antar Dompet</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsTransferOpen(false)}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleTransfer} className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Dari Dompet Asal</label>
          <select
            value={fromWalletId}
            onChange={(e) => handleFromWalletChange(e.target.value)}
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Ke Dompet Tujuan</label>
          <select
            value={toWalletId}
            onChange={(e) => setToWalletId(e.target.value)}
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id} disabled={w.id === fromWalletId}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Nominal Transfer (Rp)</label>
          <input
            type="number"
            placeholder="0"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            required
            min="100"
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-lg font-bold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 mt-2">
            {[50000, 100000, 250000, 500000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmountStr(String(v))}
                className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 cursor-pointer"
              >
                +{formatNumberOnly(v)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Catatan</label>
          <input
            type="text"
            placeholder="Misal: Tarik tunai, pindah tabungan"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={() => setIsTransferOpen(false)}
            className="flex-1 py-3 text-sm font-semibold rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={currentAmount <= 0 || fromWalletId === toWalletId}
            className="flex-2 py-3 text-sm font-bold rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50 cursor-pointer"
          >
            Transfer Sekarang
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
