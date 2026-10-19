'use client';

import React, { useState } from 'react';
import { CreditCard, Plus, CheckCircle2, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';

export function DebtTab() {
  const { settings, addToast } = useApp();
  const hide = settings.hideBalance;

  const [debts, setDebts] = useState([
    {
      id: 'd-1',
      name: 'BCA KrisFlyer Cicilan',
      type: 'payable',
      amount: 2030500,
      dueDate: '10 Apr 2026',
      creditor: 'Bank BCA',
    },
    {
      id: 'd-2',
      name: 'ShopeePayLater',
      type: 'payable',
      amount: 120000,
      dueDate: '14 Apr 2026',
      creditor: 'Shopee',
    },
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const totalDebt = debts.reduce((acc, d) => acc + d.amount, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount.replace(/\D/g, ''));
    if (!name.trim() || val <= 0) return;

    setDebts([
      ...debts,
      {
        id: `d-${Date.now()}`,
        name: name.trim(),
        type: 'payable',
        amount: val,
        dueDate: dueDate || 'Akhir Bulan',
        creditor: 'Pihak Terkait',
      },
    ]);

    addToast('Utang Ditambahkan', 'Catatan utang berhasil disimpan.');
    setIsAddOpen(false);
    setName('');
    setAmount('');
    setDueDate('');
  };

  const handlePay = (id: string) => {
    setDebts(debts.filter((d) => d.id !== id));
    addToast('Utang Lunas', 'Selamat! Catatan utang telah ditandai lunas.');
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 px-1">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Utang & Cicilan
          </h1>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">
            Pantau dan lunasi utang tepat waktu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="w-10 h-10 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center font-bold shadow-xs cursor-pointer"
        >
          <Plus size={20} strokeWidth={2.6} />
        </button>
      </div>

      {/* Summary Box */}
      <div className="bg-[#14161C] text-white p-5 rounded-3xl shadow-xl space-y-2 border border-white/5">
        <span className="text-[10px] font-black text-[#D4F826] uppercase tracking-wider block">
          TOTAL KEWAJIBAN
        </span>
        <div className="text-3xl font-black tabular-nums text-white">
          {formatRupiah(totalDebt, hide)}
        </div>
        <span className="text-xs text-gray-400 block">
          {debts.length > 0 ? `${debts.length} tagihan aktif` : 'Bebas utang!'}
        </span>
      </div>

      {/* Debts List */}
      <div className="space-y-3">
        {debts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#16181D] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 space-y-1">
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
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 flex items-center justify-between"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{d.name}</h3>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                  <Clock size={11} />
                  <span>Jatuh tempo: {d.dueDate}</span>
                </div>
                <div className="text-base font-black text-red-500 tabular-nums">
                  {formatRupiah(d.amount, hide)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePay(d.id)}
                className="px-3.5 py-2 bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-black rounded-xl cursor-pointer"
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
