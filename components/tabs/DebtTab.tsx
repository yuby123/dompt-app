'use client';

import React, { useState, useMemo } from 'react';
import { CreditCard, Plus, CheckCircle2, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';

interface DebtItem {
  id: string;
  name: string;
  type: string;
  amount: number;
  dueDate: string;
  creditor: string;
}

export function DebtTab() {
  const { settings, addToast, user, walletsWithBalance, dataResetVersion } = useApp();
  const hide = settings.hideBalance;

  const storageKey = user?.uid ? `budggt_debts_${user.uid}` : 'budggt_debts';
  const scopeKey = `${storageKey}_${dataResetVersion}`;
  const [debtState, setDebtState] = useState<{ scope: string; items: DebtItem[] } | null>(null);

  const debts = useMemo<DebtItem[]>(() => {
    if (debtState?.scope === scopeKey) return debtState.items;
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        return JSON.parse(raw);
      }
      if (!user) {
        const creditWallets = walletsWithBalance.filter(
          (w) => (w.type === 'credit' || w.type === 'paylater') && w.balance < 0
        );
        if (creditWallets.length > 0) {
          const initial = creditWallets.map((w) => ({
            id: `d-${w.id}`,
            name: w.name,
            type: 'payable',
            amount: Math.abs(w.balance),
            dueDate: w.type === 'credit' ? '10 Apr 2026' : '14 Apr 2026',
            creditor: w.name,
          }));
          localStorage.setItem(storageKey, JSON.stringify(initial));
          return initial;
        }
      }
      return [];
    } catch {
      return [];
    }
  }, [debtState, scopeKey, storageKey, user, walletsWithBalance]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const totalDebt = debts.reduce((acc, d) => acc + d.amount, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount.replace(/\D/g, ''));
    if (!name.trim() || val <= 0) return;

    const updated = [
      ...debts,
      {
        id: `d-${Date.now()}`,
        name: name.trim(),
        type: 'payable',
        amount: val,
        dueDate: dueDate || 'Akhir Bulan',
        creditor: 'Pihak Terkait',
      },
    ];
    setDebtState({ scope: scopeKey, items: updated });
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}

    addToast('Utang Ditambahkan', 'Catatan utang berhasil disimpan.');
    setIsAddOpen(false);
    setName('');
    setAmount('');
    setDueDate('');
  };

  const handlePay = (id: string) => {
    const updated = debts.filter((d) => d.id !== id);
    setDebtState({ scope: scopeKey, items: updated });
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
    addToast('Utang Lunas', 'Selamat! Catatan utang telah ditandai lunas.');
  };

  const liquidAssets = walletsWithBalance
    .filter((w) => w.type !== 'credit' && w.type !== 'paylater' && w.balance > 0)
    .reduce((acc, w) => acc + w.balance, 0);
  const debtRatioPct = liquidAssets > 0 ? Math.round((totalDebt / liquidAssets) * 100) : 0;

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 lg:pt-0 px-1">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Utang & Cicilan
          </h1>
          <p className="text-xs lg:text-sm font-semibold text-gray-400 mt-0.5">
            Pantau dan lunasi kewajiban tepat waktu agar arus kas tetap sehat.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="h-10 px-3.5 lg:px-4 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center gap-2 font-black text-xs shadow-xs cursor-pointer transition-transform active:scale-95"
        >
          <Plus size={18} strokeWidth={2.8} />
          <span className="hidden sm:inline">Catat Utang</span>
        </button>
      </div>

      {/* Full-Width Black Hero Card */}
      <div className="w-full bg-[#121316] rounded-[28px] lg:rounded-[32px] p-5 lg:px-9 lg:py-7 text-white shadow-xl border border-white/5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-[#D4F826] uppercase tracking-widest">
                TOTAL KEWAJIBAN AKTIF
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-200 text-[10px] font-black uppercase">
                {debts.length > 0 ? `${debts.length} TAGIHAN` : 'BEBAS UTANG'}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-[42px] font-black tabular-nums text-white leading-none">
              {formatRupiah(totalDebt, hide)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 lg:gap-10 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                RASIO TERHADAP KAS
              </span>
              <span
                className={`text-sm lg:text-lg font-black tabular-nums mt-0.5 block ${
                  debtRatioPct <= 20 ? 'text-[#D4F826]' : 'text-[#FB7185]'
                }`}
              >
                {debtRatioPct}% dari aset likuid
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                STATUS KESEHATAN
              </span>
              <span className="text-sm lg:text-lg font-black text-white mt-0.5 block">
                {totalDebt === 0 ? 'Sangat Prima' : debtRatioPct <= 25 ? 'Terkendali' : 'Perlu Perhatian'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Debts List */}
      <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
        {debts.length === 0 ? (
          <div className="lg:col-span-2 text-center py-12 bg-white dark:bg-[#16181D] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 space-y-1">
            <span className="text-3xl">🎉</span>
            <p className="text-sm font-extrabold text-gray-900 dark:text-white mt-2">
              Tidak ada utang – keren!
            </p>
            <p className="text-xs text-gray-400">Pertahankan kebebasan finansialmu.</p>
          </div>
        ) : (
          debts.map((d) => (
            <div
              key={d.id}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 hover:border-[#D4F826]/60 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white truncate">
                  {d.name}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                  <Clock size={12} />
                  <span>Jatuh tempo: {d.dueDate}</span>
                </div>
                <div className="text-base lg:text-lg font-black text-red-500 tabular-nums pt-0.5">
                  {formatRupiah(d.amount, hide)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePay(d.id)}
                className="px-4 py-2.5 bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-black rounded-2xl cursor-pointer shrink-0 transition-transform active:scale-95"
              >
                Bayar Lunas
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal Add */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Catat Utang Baru
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Nama Utang / Cicilan
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Pinjaman Teman, Cicilan Laptop"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border rounded-2xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Nominal (Rp)</label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Rp 500.000"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border rounded-2xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Jatuh Tempo</label>
                  <input
                    type="text"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="e.g. 25 April 2026"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border rounded-2xl text-xs font-bold"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-[#D4F826] text-black text-xs font-black"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
