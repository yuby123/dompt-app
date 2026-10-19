'use client';

import React, { useState } from 'react';
import { Plus, X, Lock, Unlock, Calendar, Wallet as WalletIcon, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { formatFullDateIndo, formatRupiah } from '@/lib/formatters';
import { Goal } from '@/lib/types';

export function GoalsTab() {
  const {
    goals,
    wallets,
    addGoal,
    toggleLockGoal,
    deleteGoal,
    settings,
  } = useApp();

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || 'wallet-bca');
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [isEmergencyFund, setIsEmergencyFund] = useState(false);
  const [initialDeposit, setInitialDeposit] = useState('');

  const hide = settings.hideBalance;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = Number(targetAmount.replace(/\D/g, ''));
    const initialVal = Number(initialDeposit.replace(/\D/g, '')) || 0;

    if (!name.trim() || targetVal <= 0) return;

    addGoal({
      name: name.trim(),
      emoji: emoji || '🎯',
      targetAmount: targetVal,
      currentAmount: initialVal,
      walletId,
      targetDate,
      isEmergencyFund,
      isLocked: isEmergencyFund,
      monthlyTargetSaving: Math.round(targetVal / 12),
    });

    setIsAddModalOpen(false);
    setName('');
    setTargetAmount('');
    setInitialDeposit('');
    setEmoji('🎯');
    setIsEmergencyFund(false);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 px-1">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Goals
          </h1>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">
            Mimpi besar, mulai dari recehan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="w-10 h-10 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center font-bold shadow-xs cursor-pointer"
          title="Tambah Goal Baru"
        >
          <Plus size={20} strokeWidth={2.6} />
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const wallet = wallets.find((w) => w.id === goal.walletId);

          return (
            <div
              key={goal.id}
              onClick={() => setSelectedGoal(goal)}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3 cursor-pointer hover:border-[#D4F826]/60 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800/80 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                    {goal.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                        {goal.name}
                      </h3>
                      {goal.isEmergencyFund && (
                        <ShieldAlert size={14} className="text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5 font-medium">
                      <Calendar size={11} />
                      <span>{formatFullDateIndo(goal.targetDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm sm:text-base font-black text-gray-900 dark:text-white tabular-nums">
                    {formatRupiah(goal.currentAmount, hide)}
                  </span>
                  <div className="flex items-center justify-end gap-1 text-[11px] font-black text-gray-400 mt-0.5">
                    <span className="text-gray-900 dark:text-white">{pct}%</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#D4F826] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Detail Goal */}
      <AnimatePresence>
        {selectedGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl border border-gray-100 dark:border-gray-800 text-center"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedGoal(null)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl shadow-xs">
                  {selectedGoal.emoji}
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mt-3">
                  {selectedGoal.name}
                </h3>
                <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <WalletIcon size={12} />
                  <span>
                    Dompet Terkait:{' '}
                    {wallets.find((w) => w.id === selectedGoal.walletId)?.name || 'BCA'}
                  </span>
                </span>
              </div>

              {/* Progress big indicator */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  PROGRES SAAT INI
                </span>
                <div className="text-4xl font-black text-gray-900 dark:text-white">
                  {Math.min(
                    100,
                    Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100)
                  )}
                  %
                </div>
                <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#D4F826]"
                    style={{
                      width: `${Math.min(
                        100,
                        (selectedGoal.currentAmount / selectedGoal.targetAmount) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 font-bold pt-1">
                  <span>{formatRupiah(selectedGoal.currentAmount, hide)}</span>
                  <span>{formatRupiah(selectedGoal.targetAmount, hide)}</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl text-xs text-gray-600 dark:text-gray-300 font-medium">
                Kamu perlu nabung{' '}
                <span className="font-extrabold text-black dark:text-white">
                  {formatRupiah(selectedGoal.monthlyTargetSaving || 500000, hide)}
                </span>{' '}
                / bulan
              </div>

              {/* Lock / Unlock Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toggleLockGoal(selectedGoal.id);
                    setSelectedGoal({ ...selectedGoal, isLocked: true });
                  }}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    selectedGoal.isLocked
                      ? 'bg-[#D4F826] text-black shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  <Lock size={15} />
                  <span>Lock</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toggleLockGoal(selectedGoal.id);
                    setSelectedGoal({ ...selectedGoal, isLocked: false });
                  }}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    !selectedGoal.isLocked
                      ? 'bg-[#D4F826] text-black shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  <Unlock size={15} />
                  <span>Unlock</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Goal Baru */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Goal Baru
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Nama Goal</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Bali Trip"
                      required
                      className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                    <input
                      type="text"
                      value={emoji}
                      onChange={(e) => setEmoji(e.target.value)}
                      maxLength={2}
                      className="w-12 p-3 text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-base focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Target (Rp)</label>
                  <input
                    type="text"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="Rp 5.000.000"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Dompet Terkait
                  </label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Target Tanggal
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="emergencyCheckbox"
                    checked={isEmergencyFund}
                    onChange={(e) => setIsEmergencyFund(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-[#D4F826]"
                  />
                  <label
                    htmlFor="emergencyCheckbox"
                    className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Dana Darurat (Tandai sebagai dana darurat)
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Setoran Awal (Opsional)
                  </label>
                  <input
                    type="text"
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(e.target.value)}
                    placeholder="Rp 0"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-[#D4F826] text-black text-xs font-black shadow-xs cursor-pointer hover:bg-[#c6ec15]"
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
