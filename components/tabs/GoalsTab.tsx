'use client';

import React, { useState } from 'react';
import {
  Plus,
  X,
  Lock,
  Unlock,
  Calendar,
  Wallet as WalletIcon,
  ShieldAlert,
  Trash2,
  Pencil,
  Smile,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import {
  formatFullDateIndo,
  formatRupiah,
  formatNominalInput,
  parseNominalInput,
} from '@/lib/formatters';
import { Goal } from '@/lib/types';
import { EmojiPickerModal } from '../EmojiPickerModal';

export function GoalsTab() {
  const {
    goals,
    wallets,
    addGoal,
    updateGoal,
    toggleLockGoal,
    deleteGoal,
    settings,
  } = useApp();

  // Active Modals & Selection states
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [emojiTarget, setEmojiTarget] = useState<'add' | 'edit'>('add');

  // Deposit/Withdraw Delta in detail modal
  const [depositDelta, setDepositDelta] = useState('');

  // Form states for Add Goal
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || 'wallet-bca');
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [isEmergencyFund, setIsEmergencyFund] = useState(false);
  const [initialDeposit, setInitialDeposit] = useState('');

  // Form states for Edit Goal
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('🎯');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editCurrentAmount, setEditCurrentAmount] = useState('');
  const [editWalletId, setEditWalletId] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editIsEmergencyFund, setEditIsEmergencyFund] = useState(false);

  const hide = settings.hideBalance;

  const isPink = settings.accentColor === 'pink';
  const isOrange = settings.accentColor === 'orange';

  const brandAccentBtn = isOrange
    ? 'bg-[#FF6B00] hover:bg-[#ea5e00] text-white shadow-[#FF6B00]/25'
    : isPink
    ? 'bg-[#FFA4A4] hover:bg-[#ff8e8e] text-black'
    : 'bg-[#D4F826] hover:bg-[#c6ec15] text-black';

  const brandAccentBg = isOrange
    ? 'bg-[#FF6B00] text-white'
    : isPink
    ? 'bg-[#FFA4A4] text-black'
    : 'bg-[#D4F826] text-black';

  const brandAccentFocusRing = isOrange
    ? 'focus:ring-[#FF6B00]'
    : isPink
    ? 'focus:ring-[#FFA4A4]'
    : 'focus:ring-[#D4F826]';

  const brandAccentBadgeBg = isOrange
    ? 'bg-[#FF6B00]/20 text-[#FF6B00] dark:text-[#FF7A1A]'
    : isPink
    ? 'bg-[#FFA4A4]/30 text-[#F43F5E]'
    : 'bg-[#D4F826]/30 text-lime-800 dark:text-[#D4F826]';

  const brandAccentIconText = isOrange
    ? 'text-[#FF6B00]'
    : isPink
    ? 'text-[#F43F5E]'
    : 'text-[#D4F826]';

  const brandProgressBar = isOrange
    ? 'bg-gradient-to-r from-[#FF6B00] via-[#F59E0B] to-[#EC4899]'
    : isPink
    ? 'bg-gradient-to-r from-[#FFA4A4] via-[#F43F5E] to-[#E11D48]'
    : 'bg-gradient-to-r from-[#D4F826] via-[#8B5CF6] to-[#38BDF8]';


  // Open Edit Modal with prefilled values
  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setEditName(goal.name);
    setEditEmoji(goal.emoji || '🎯');
    setEditTargetAmount(formatNominalInput(goal.targetAmount));
    setEditCurrentAmount(formatNominalInput(goal.currentAmount));
    setEditWalletId(goal.walletId || wallets[0]?.id || 'wallet-bca');
    setEditTargetDate(goal.targetDate || '2026-12-31');
    setEditIsEmergencyFund(Boolean(goal.isEmergencyFund));
  };

  // Open Emoji Picker for either Add or Edit modal
  const handleOpenEmojiPicker = (target: 'add' | 'edit') => {
    setEmojiTarget(target);
    setIsEmojiPickerOpen(true);
  };

  const handleSelectEmoji = (chosenEmoji: string) => {
    if (emojiTarget === 'add') {
      setEmoji(chosenEmoji);
    } else {
      setEditEmoji(chosenEmoji);
    }
  };

  // Submit Add Goal
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseNominalInput(targetAmount);
    const initialVal = parseNominalInput(initialDeposit);

    if (!name.trim() || targetVal <= 0) return;

    addGoal({
      name: name.trim(),
      emoji: emoji || '🎯',
      targetAmount: targetVal,
      currentAmount: initialVal,
      walletId: walletId || wallets[0]?.id || 'wallet-bca',
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

  // Submit Edit Goal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    const targetVal = parseNominalInput(editTargetAmount);
    const currentVal = parseNominalInput(editCurrentAmount);

    if (!editName.trim() || targetVal <= 0) return;

    const updatedData: Partial<Goal> = {
      name: editName.trim(),
      emoji: editEmoji || '🎯',
      targetAmount: targetVal,
      currentAmount: currentVal,
      walletId: editWalletId,
      targetDate: editTargetDate,
      isEmergencyFund: editIsEmergencyFund,
      monthlyTargetSaving: Math.round(targetVal / 12),
    };

    updateGoal(editingGoal.id, updatedData);

    // If currently viewing details of this goal, update selectedGoal as well
    if (selectedGoal?.id === editingGoal.id) {
      setSelectedGoal({ ...selectedGoal, ...updatedData });
    }

    setEditingGoal(null);
  };

  // Delete Confirmation Handler
  const handleConfirmDelete = () => {
    if (!deletingGoal) return;
    deleteGoal(deletingGoal.id);
    if (selectedGoal?.id === deletingGoal.id) {
      setSelectedGoal(null);
    }
    setDeletingGoal(null);
  };

  // Deposit/Withdraw in detail modal
  const handleAdjustGoalAmount = (mode: 'add' | 'subtract') => {
    if (!selectedGoal) return;
    const val = parseNominalInput(depositDelta);
    if (!val || val <= 0) return;
    const nextAmount =
      mode === 'add'
        ? selectedGoal.currentAmount + val
        : Math.max(0, selectedGoal.currentAmount - val);

    updateGoal(selectedGoal.id, { currentAmount: nextAmount });
    setSelectedGoal({ ...selectedGoal, currentAmount: nextAmount });
    setDepositDelta('');
  };

  return (
    <div className="space-y-6 pb-28 lg:pb-12 max-w-5xl mx-auto">
      {/* Header matching the design */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
            Goals
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-stone-500 dark:text-stone-400 mt-0.5">
            Mimpi besar, mulai dari recehan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className={`h-10 px-4 rounded-xl ${brandAccentBtn} flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm shadow-xs cursor-pointer transition-transform active:scale-95 shrink-0`}
          title="Tambah Goal Baru"
        >
          <Plus size={17} strokeWidth={3} />
          <span>Goal Baru</span>
        </button>
      </div>

      {/* Goals List as wide clean horizontal cards */}
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-[#16181D] rounded-3xl p-10 text-center border border-stone-100 dark:border-stone-800 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-3xl mx-auto shadow-2xs">
            🎯
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
              Belum Ada Target Tabungan
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
              Mulai wujudkan impianmu! Klik tombol <strong>+ Goal Baru</strong> di atas untuk membuat target tabungan pertamamu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl ${brandAccentBtn} text-xs font-black shadow-xs cursor-pointer transition-all active:scale-95`}
          >
            <Plus size={16} strokeWidth={3} />
            <span>Mulai Buat Goal</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {goals.map((goal) => {
            const pct =
              goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                : 0;

            return (
              <div
                key={goal.id}
                className="group relative bg-white dark:bg-[#16181D] rounded-3xl p-4 sm:p-5 shadow-xs border border-stone-100 dark:border-stone-800/80 hover:border-stone-200 dark:hover:border-stone-700 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4"
              >
                {/* Left side: Emoji box, Title, Shield for emergency fund, and Date */}
                <div
                  onClick={() => {
                    setSelectedGoal(goal);
                    setDepositDelta('');
                  }}
                  className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-stone-100/80 dark:bg-stone-800/80 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    {goal.emoji || '🎯'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-stone-900 dark:text-white truncate">
                        {goal.name}
                      </h3>
                      {goal.isEmergencyFund && (
                        <span
                          className="inline-flex items-center justify-center text-red-500"
                          title="Dana Darurat"
                        >
                          <ShieldAlert size={14} className="stroke-[2.5]" />
                        </span>
                      )}
                      {goal.isLocked && (
                        <span
                          className="inline-flex items-center justify-center text-amber-500"
                          title="Terkunci"
                        >
                          <Lock size={12} />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500 mt-0.5 font-medium">
                      <Calendar size={13} className="shrink-0" />
                      <span>{formatFullDateIndo(goal.targetDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Amount, Percentage, Violet Progress Bar, and Action Buttons (Edit / Delete) */}
                <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800/60">
                  {/* Amount and sleek violet progress */}
                  <div
                    onClick={() => {
                      setSelectedGoal(goal);
                      setDepositDelta('');
                    }}
                    className="text-left sm:text-right cursor-pointer"
                  >
                    <div className="text-sm sm:text-base font-bold text-stone-900 dark:text-white tabular-nums">
                      {formatRupiah(goal.currentAmount, hide)}
                    </div>
                    <div className="flex items-center justify-start sm:justify-end gap-2 text-xs text-stone-400 font-medium mt-0.5">
                      <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 tabular-nums">
                        {pct}%
                      </span>
                      <div className="w-20 sm:w-28 h-1.5 sm:h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${brandProgressBar} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit and Delete buttons */}
                  <div className="flex items-center gap-1 pl-2 sm:border-l border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(goal);
                      }}
                      className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
                      title="Edit Goal"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingGoal(goal);
                      }}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                      title="Hapus Goal"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Goal Baru */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl border border-stone-100 dark:border-stone-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl ${brandAccentBadgeBg} flex items-center justify-center text-sm font-bold`}>
                    ✨
                  </div>
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                    Goal Baru
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">
                    Nama Goal & Emoticon
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dana Darurat, Bali Trip"
                      required
                      className={`flex-1 p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 ${brandAccentFocusRing}`}
                    />
                    {/* Interactive Emoji Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEmojiPicker('add')}
                      className="w-13 h-12 flex items-center justify-center bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-2xl text-2xl transition-all cursor-pointer relative group"
                      title="Pilih Emoticon Target"
                    >
                      <span>{emoji || '🎯'}</span>
                      <span className={`absolute -bottom-1 -right-1 p-0.5 bg-black ${brandAccentIconText} rounded-full shadow-2xs`}>
                        <Smile size={10} />
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">
                    Target Nominal (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 15.000.000"
                    required
                    className={`w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 ${brandAccentFocusRing}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">
                    Dompet Terkait
                  </label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className={`w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 ${brandAccentFocusRing}`}
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">
                    Target Tanggal
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className={`w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 ${brandAccentFocusRing}`}
                  />
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="emergencyCheckbox"
                    checked={isEmergencyFund}
                    onChange={(e) => setIsEmergencyFund(e.target.checked)}
                    className={`w-4 h-4 rounded-md cursor-pointer ${
                      isOrange ? 'accent-[#FF6B00]' : isPink ? 'accent-[#FFA4A4]' : 'accent-[#D4F826]'
                    }`}
                  />
                  <label
                    htmlFor="emergencyCheckbox"
                    className="text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer select-none"
                  >
                    Dana Darurat (Otomatis diamankan)
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">
                    Setoran Awal (Opsional)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 500.000"
                    className={`w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 ${brandAccentFocusRing}`}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 rounded-2xl ${brandAccentBtn} text-xs font-black shadow-xs cursor-pointer transition-transform active:scale-95`}
                  >
                    Simpan Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Edit Goal */}
      <AnimatePresence>
        {editingGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl border border-stone-100 dark:border-stone-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-sm">
                    <Pencil size={15} />
                  </div>
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                    Edit Goal
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">
                    Nama Goal & Emoticon
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nama Goal"
                      required
                      className={`flex-1 p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 ${brandAccentFocusRing}`}
                    />
                    {/* Interactive Emoji Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEmojiPicker('edit')}
                      className="w-13 h-12 flex items-center justify-center bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-2xl text-2xl transition-all cursor-pointer relative group"
                      title="Ganti Emoticon Target"
                    >
                      <span>{editEmoji || '🎯'}</span>
                      <span className={`absolute -bottom-1 -right-1 p-0.5 bg-black ${brandAccentIconText} rounded-full shadow-2xs`}>
                        <Smile size={10} />
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">
                    Target Nominal (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editTargetAmount}
                    onChange={(e) => setEditTargetAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 15.000.000"
                    required
                    className={`w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 ${brandAccentFocusRing}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">
                    Saldo Terkumpul Saat Ini (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editCurrentAmount}
                    onChange={(e) => setEditCurrentAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 14.500.000"
                    className={`w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 ${brandAccentFocusRing}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">
                    Dompet Terkait
                  </label>
                  <select
                    value={editWalletId}
                    onChange={(e) => setEditWalletId(e.target.value)}
                    className={`w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 ${brandAccentFocusRing}`}
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 block mb-1">
                    Target Tanggal
                  </label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className={`w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 ${brandAccentFocusRing}`}
                  />
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="editEmergencyCheckbox"
                    checked={editIsEmergencyFund}
                    onChange={(e) => setEditIsEmergencyFund(e.target.checked)}
                    className={`w-4 h-4 rounded-md cursor-pointer ${
                      isOrange ? 'accent-[#FF6B00]' : isPink ? 'accent-[#FFA4A4]' : 'accent-[#D4F826]'
                    }`}
                  />
                  <label
                    htmlFor="editEmergencyCheckbox"
                    className="text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer select-none"
                  >
                    Dana Darurat (Otomatis diamankan)
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingGoal(null)}
                    className="flex-1 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 rounded-2xl ${brandAccentBtn} text-xs font-black shadow-xs cursor-pointer transition-transform active:scale-95`}
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Konfirmasi Hapus Goal */}
      <AnimatePresence>
        {deletingGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-stone-100 dark:border-stone-800 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto text-2xl">
                <Trash2 size={26} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-stone-900 dark:text-white">
                  Hapus Goal?
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Apakah Anda yakin ingin menghapus target{' '}
                  <span className="font-bold text-stone-900 dark:text-white">
                    {deletingGoal.emoji} {deletingGoal.name}
                  </span>
                  ? Data yang dihapus tidak dapat dipulihkan.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingGoal(null)}
                  className="flex-1 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-black shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Detail Goal & Setor/Tarik Saldo */}
      <AnimatePresence>
        {selectedGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-stone-100 dark:border-stone-800 text-center max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const g = selectedGoal;
                      setSelectedGoal(null);
                      handleOpenEdit(g);
                    }}
                    className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    title="Edit Goal"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const g = selectedGoal;
                      setSelectedGoal(null);
                      setDeletingGoal(g);
                    }}
                    className="p-1.5 text-stone-400 hover:text-red-500 cursor-pointer rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Hapus Goal"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedGoal(null)}
                  className="p-1 text-stone-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-3xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-3xl shadow-xs">
                  {selectedGoal.emoji || '🎯'}
                </div>
                <h3 className="text-lg font-black text-stone-900 dark:text-white mt-3">
                  {selectedGoal.name}
                </h3>
                <span className="text-xs text-stone-400 flex items-center gap-1 mt-0.5 font-medium">
                  <WalletIcon size={12} />
                  <span>
                    Dompet Terkait:{' '}
                    {wallets.find((w) => w.id === selectedGoal.walletId)?.name || 'BCA'}
                  </span>
                </span>
              </div>

              {/* Progress big indicator */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">
                  PROGRES SAAT INI
                </span>
                <div className="text-4xl font-black text-stone-900 dark:text-white">
                  {selectedGoal.targetAmount > 0
                    ? Math.min(
                        100,
                        Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100)
                      )
                    : 0}
                  %
                </div>
                <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${brandProgressBar} transition-all duration-500`}
                    style={{
                      width: `${
                        selectedGoal.targetAmount > 0
                          ? Math.min(
                              100,
                              (selectedGoal.currentAmount / selectedGoal.targetAmount) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-stone-400 font-bold pt-1">
                  <span>Terkumpul: {formatRupiah(selectedGoal.currentAmount, hide)}</span>
                  <span>Target: {formatRupiah(selectedGoal.targetAmount, hide)}</span>
                </div>
              </div>

              {/* Update Tabungan Input */}
              <div className="space-y-2 pt-1 text-left">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                  Setor / Tarik Saldo (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={depositDelta}
                  onChange={(e) => setDepositDelta(formatNominalInput(e.target.value))}
                  placeholder="Contoh: 250.000"
                  disabled={selectedGoal.isLocked}
                  className={`w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 ${brandAccentFocusRing} disabled:opacity-50`}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={selectedGoal.isLocked}
                    onClick={() => handleAdjustGoalAmount('add')}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-extrabold cursor-pointer transition-colors"
                  >
                    + Tambah Saldo
                  </button>
                  <button
                    type="button"
                    disabled={selectedGoal.isLocked}
                    onClick={() => handleAdjustGoalAmount('subtract')}
                    className="flex-1 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 disabled:opacity-40 text-stone-700 dark:text-stone-300 text-xs font-extrabold cursor-pointer transition-colors"
                  >
                    - Tarik Saldo
                  </button>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-2xl text-xs text-stone-600 dark:text-stone-300 font-medium">
                Saran nabung:{' '}
                <span className="font-extrabold text-black dark:text-white">
                  {formatRupiah(
                    selectedGoal.monthlyTargetSaving ||
                      Math.round(selectedGoal.targetAmount / 12),
                    hide
                  )}
                </span>{' '}
                / bulan
              </div>

              {/* Lock / Unlock Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedGoal.isLocked) {
                      toggleLockGoal(selectedGoal.id);
                      setSelectedGoal({ ...selectedGoal, isLocked: true });
                    }
                  }}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    selectedGoal.isLocked
                      ? `${brandAccentBg} shadow-xs`
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                  }`}
                >
                  <Lock size={15} />
                  <span>Lock</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedGoal.isLocked) {
                      toggleLockGoal(selectedGoal.id);
                      setSelectedGoal({ ...selectedGoal, isLocked: false });
                    }
                  }}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    !selectedGoal.isLocked
                      ? `${brandAccentBg} shadow-xs`
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
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

      {/* Emoji Picker Modal */}
      <EmojiPickerModal
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        selectedEmoji={emojiTarget === 'add' ? emoji : editEmoji}
        onSelect={handleSelectEmoji}
        title={emojiTarget === 'add' ? 'Pilih Emoticon Goal' : 'Ubah Emoticon Goal'}
      />
    </div>
  );
}
