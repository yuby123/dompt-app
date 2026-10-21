'use client';

import React, { useState } from 'react';
import { TrendingUp, Plus, ArrowUpRight, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { formatRupiah, formatNominalInput, parseNominalInput } from '@/lib/formatters';

export function InvestTab() {
  const { settings, investments, addInvestment, deleteInvestment } = useApp();
  const hide = settings.hideBalance;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [invType, setInvType] = useState('Reksadana');
  const [amount, setAmount] = useState('');
  const [profit, setProfit] = useState('+5.0%');

  const totalInvested = investments.reduce((acc, i) => acc + i.amount, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNominalInput(amount);
    if (!name.trim() || val <= 0) return;

    addInvestment({
      name: name.trim(),
      type: invType,
      amount: val,
      profit: profit.trim() || '+0%',
    });

    setIsAddOpen(false);
    setName('');
    setAmount('');
    setProfit('+5.0%');
  };

  const handleDelete = (id: string) => {
    deleteInvestment(id);
  };

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pt-1 lg:pt-0 px-0.5">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
            Investasi
          </h1>
          <p className="text-xs lg:text-sm font-semibold text-gray-400 mt-0.5 truncate">
            Biarkan uang bekerja untuk masa depanmu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="h-10 px-4 rounded-full bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap shrink-0"
          title="Tambah Investasi"
        >
          <Plus size={16} strokeWidth={2.8} />
          <span>Tambah Portofolio</span>
        </button>
      </div>

      {/* Full-Width Dark Hero Card with Theme-Adaptive Glow */}
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-[28px] lg:rounded-[32px] p-5 lg:px-9 lg:py-7 text-white shadow-xl border border-white/10">
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
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-[#D4F826] uppercase tracking-widest">
                TOTAL PORTOFOLIO INVESTASI
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#D4F826] text-black text-[10px] font-black uppercase">
                {investments.length} INSTRUMEN
              </span>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-[42px] font-black tabular-nums text-white leading-none">
              {formatRupiah(totalInvested, hide)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 lg:gap-10 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                STATUS PERTUMBUHAN
              </span>
              <span className="text-sm lg:text-lg font-black text-[#D4F826] flex items-center gap-1 mt-0.5">
                <ArrowUpRight size={16} />
                <span>{investments.length > 0 ? 'Produktif & Bertumbuh' : 'Belum Ada Instrumen'}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                DIVERSIFIKASI
              </span>
              <span className="text-sm lg:text-lg font-black text-white mt-0.5 block">
                {new Set(investments.map((i) => i.type)).size} Kelas Aset
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4">
        {investments.length === 0 ? (
          <div className="lg:col-span-3 text-center py-12 bg-white dark:bg-[#16181D] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 space-y-2">
            <span className="text-3xl">📈</span>
            <p className="text-sm font-extrabold text-gray-900 dark:text-white mt-2">
              Portofolio masih kosong
            </p>
            <p className="text-xs text-gray-400">
              Mulai catat investasi saham, reksadana, atau emasmu di sini.
            </p>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-[#D4F826] text-black text-xs font-black cursor-pointer hover:bg-[#c6ec15]"
            >
              + Tambah Investasi
            </button>
          </div>
        ) : (
          investments.map((inv) => (
            <div
              key={inv.id}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 hover:border-[#D4F826]/60 transition-colors"
            >
              <div className="min-w-0">
                <h3 className="text-sm lg:text-base font-extrabold text-gray-900 dark:text-white truncate">
                  {inv.name}
                </h3>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mt-0.5">
                  {inv.type}
                </span>
                <div className="text-sm lg:text-base font-black text-gray-900 dark:text-white mt-1.5 tabular-nums">
                  {formatRupiah(inv.amount, hide)}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-black text-emerald-600 dark:text-[#D4F826] bg-emerald-50 dark:bg-[#D4F826]/15 px-3 py-1.5 rounded-xl">
                  {inv.profit}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(inv.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add Investment */}
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
                  Tambah Portofolio
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
                    Nama Instrumen
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Bibit Pasar Uang, Emas Antam"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Jenis</label>
                  <select
                    value={invType}
                    onChange={(e) => setInvType(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  >
                    <option value="Reksadana">Reksadana</option>
                    <option value="Saham">Saham</option>
                    <option value="Komoditas / Emas">Komoditas / Emas</option>
                    <option value="Obligasi / SBN">Obligasi / SBN</option>
                    <option value="Deposito">Deposito</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Nilai Portofolio (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 1.000.000"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Estimasi Return (%)
                  </label>
                  <input
                    type="text"
                    value={profit}
                    onChange={(e) => setProfit(e.target.value)}
                    placeholder="+6.5%"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-[#D4F826] text-black text-xs font-black cursor-pointer hover:bg-[#c6ec15]"
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
