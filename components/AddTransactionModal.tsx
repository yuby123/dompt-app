'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Delete, Check, Sparkles } from 'lucide-react';
import { useApp } from './AppContext';
import { TransactionType } from '@/lib/types';
import { CategoryIcon } from './CategoryIcon';
import { formatNumberOnly } from '@/lib/formatters';

function AddTransactionForm() {
  const {
    setIsAddTransactionOpen,
    editingTransaction,
    categories,
    wallets,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    transferFunds,
    openScanModal,
    activeDate,
    addToast,
  } = useApp();

  const amountInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<TransactionType>(() => editingTransaction?.transaction.type || 'expense');
  const [amountStr, setAmountStr] = useState<string>(() =>
    editingTransaction ? String(editingTransaction.transaction.amount) : ''
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    if (editingTransaction?.transaction.categoryId) return editingTransaction.transaction.categoryId;
    const match = categories.find((c) => c.type === (editingTransaction?.transaction.type === 'income' ? 'income' : 'expense'));
    return match ? match.id : categories[0]?.id || '';
  });
  const [selectedWalletId, setSelectedWalletId] = useState<string>(() => {
    return editingTransaction?.transaction.walletId || wallets[0]?.id || '';
  });
  const [transferTargetWalletId, setTransferTargetWalletId] = useState<string>(() => {
    return (
      editingTransaction?.transaction.transferWalletId ||
      wallets.find((w) => w.id !== (editingTransaction?.transaction.walletId || wallets[0]?.id))?.id ||
      wallets[1]?.id ||
      wallets[0]?.id ||
      ''
    );
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (editingTransaction) {
      const d = new Date(editingTransaction.transaction.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    if (activeDate) return activeDate;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [note, setNote] = useState<string>(() => editingTransaction?.transaction.note || '');
  const [activeGroup, setActiveGroup] = useState<string>('Semua');

  useEffect(() => {
    const timer = setTimeout(() => {
      amountInputRef.current?.focus();
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  // Filter categories by type
  const availableCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));

  // Get distinct groups
  const groups = ['Semua', ...Array.from(new Set(availableCategories.map((c) => c.groupName)))];

  const filteredCategories =
    activeGroup === 'Semua' ? availableCategories : availableCategories.filter((c) => c.groupName === activeGroup);

  const currentAmount = parseInt(amountStr, 10) || 0;

  // When type changes, ensure valid default category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setActiveGroup('Semua');
    if (newType !== 'transfer') {
      const match = categories.find((c) => c.type === (newType === 'income' ? 'income' : 'expense'));
      if (match) setSelectedCategoryId(match.id);
    }
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
    if (rawDigits.length <= 12) {
      setAmountStr(rawDigits);
    }
  };

  const handleQuickAdd = (addVal: number) => {
    const cur = parseInt(amountStr, 10) || 0;
    setAmountStr(String(cur + addVal));
    amountInputRef.current?.focus();
  };

  const handleClear = () => {
    setAmountStr('');
    amountInputRef.current?.focus();
  };

  const handleSave = () => {
    if (currentAmount <= 0) return;

    const [y, m, d] = selectedDate.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d, 12, 0, 0, 0);
    const now = new Date();
    targetDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
    const finalDateIso = targetDate.toISOString();

    const chosenCat = categories.find((c) => c.id === selectedCategoryId);

    if (type === 'transfer') {
      if (!selectedWalletId || !transferTargetWalletId || selectedWalletId === transferTargetWalletId) {
        addToast('Transfer Gagal', 'Pilih dompet asal dan tujuan yang berbeda.', 'error');
        return;
      }
      if (editingTransaction) {
        updateTransaction(editingTransaction.transaction.id, {
          type: 'transfer',
          amount: currentAmount,
          walletId: selectedWalletId,
          transferWalletId: transferTargetWalletId,
          categoryId: null,
          date: finalDateIso,
          note: note.trim() || undefined,
        });
      } else {
        transferFunds(
          selectedWalletId,
          transferTargetWalletId,
          currentAmount,
          note.trim() || 'Transfer antar dompet',
          finalDateIso
        );
      }
    } else {
      if (editingTransaction) {
        updateTransaction(editingTransaction.transaction.id, {
          type,
          amount: currentAmount,
          walletId: selectedWalletId || wallets[0]?.id || '',
          categoryId: selectedCategoryId || null,
          budgetGroup: chosenCat?.budgetGroup,
          transferWalletId: null,
          date: finalDateIso,
          note: note.trim() || undefined,
        });
      } else {
        addTransaction({
          type,
          amount: currentAmount,
          walletId: selectedWalletId || wallets[0]?.id || '',
          categoryId: selectedCategoryId || null,
          budgetGroup: chosenCat?.budgetGroup,
          transferWalletId: null,
          date: finalDateIso,
          note: note.trim() || undefined,
        });
      }
    }

    setIsAddTransactionOpen(false);
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (!editingTransaction) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteTransaction(editingTransaction.transaction.id);
    setIsAddTransactionOpen(false);
  };

  // Accent colors
  const accentColorClass =
    type === 'expense'
      ? 'text-red-600 dark:text-red-400'
      : type === 'income'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-blue-600 dark:text-blue-400';

  return (
    <div className="w-full max-w-lg landscape:max-w-xl max-h-[92vh] landscape:max-h-[96vh] flex flex-col bg-white dark:bg-[#111827] rounded-t-3xl sm:rounded-3xl landscape:rounded-3xl shadow-2xl overflow-hidden border border-black/5 dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {editingTransaction ? 'Edit Transaksi' : 'Catat Transaksi'}
        </h2>
        <div className="flex items-center gap-2">
          {!editingTransaction && (
            <button
              type="button"
              onClick={() => {
                setIsAddTransactionOpen(false);
                openScanModal();
              }}
              className="px-2.5 py-1 text-xs font-bold rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1 hover:bg-teal-100 transition-colors"
              title="Scan Screenshot Bukti Transfer"
            >
              <Sparkles size={13} />
              <span>Scan SS</span>
            </button>
          )}
          {editingTransaction && (
            <button
              type="button"
              onClick={handleDelete}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                confirmDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
              }`}
              title="Hapus transaksi"
            >
              <Delete size={16} />
              {confirmDelete && <span>Yakin Hapus?</span>}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsAddTransactionOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-5 space-y-4 no-scrollbar">
        {/* Segmented Type Selector */}
        <div className="grid grid-cols-3 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2 text-sm font-semibold rounded-xl transition-all ${
              type === 'expense'
                ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2 text-sm font-semibold rounded-xl transition-all ${
              type === 'income'
                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('transfer')}
            className={`py-2 text-sm font-semibold rounded-xl transition-all ${
              type === 'transfer'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Transfer
          </button>
        </div>

        {/* Direct Keyboard Nominal Input */}
        <div
          onClick={() => amountInputRef.current?.focus()}
          className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus-within:border-teal-500 dark:focus-within:border-teal-400 transition-all text-center cursor-text"
        >
          <label
            htmlFor="tx-nominal-input"
            className="text-xs uppercase tracking-wider text-gray-400 font-semibold block cursor-text"
          >
            Ketik Nominal dengan Keyboard (Rp)
          </label>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className={`text-2xl font-bold select-none ${accentColorClass}`}>Rp</span>
            <input
              ref={amountInputRef}
              id="tx-nominal-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              placeholder="0"
              value={currentAmount > 0 ? formatNumberOnly(currentAmount) : ''}
              onChange={handleAmountInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentAmount > 0) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              className={`w-full max-w-[260px] bg-transparent text-center text-4xl font-extrabold tracking-tight tabular-nums focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 ${accentColorClass}`}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {type === 'expense'
              ? 'Ketik langsung nominal pengeluaran Anda'
              : type === 'income'
              ? 'Ketik langsung nominal pemasukan Anda'
              : 'Ketik langsung nominal yang ingin ditransfer'}
          </p>
        </div>

        {/* Quick Increment Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[10000, 20000, 50000, 100000, 500000].map((quick) => (
            <button
              key={quick}
              type="button"
              onClick={() => handleQuickAdd(quick)}
              className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
            >
              +{formatNumberOnly(quick)}
            </button>
          ))}
          {currentAmount > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-semibold rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-100 transition-colors shrink-0"
            >
              Reset 0
            </button>
          )}
        </div>

        {/* Wallet Selector */}
        {type === 'transfer' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
                Dari Dompet
              </label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full p-2.5 text-sm font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
                Ke Dompet
              </label>
              <select
                value={transferTargetWalletId}
                onChange={(e) => setTransferTargetWalletId(e.target.value)}
                className="w-full p-2.5 text-sm font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
              Pilih Dompet
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {wallets.map((w) => {
                const isSelected = selectedWalletId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWalletId(w.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                      isSelected
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <span>{w.name}</span>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Selector (For Expense & Income) */}
        {type !== 'transfer' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Kategori Transaksi
              </label>
              <span className="text-[11px] text-gray-400">
                {availableCategories.find((c) => c.id === selectedCategoryId)?.name || 'Pilih'}
              </span>
            </div>

            {/* Group Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {groups.map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setActiveGroup(grp)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg shrink-0 transition-colors ${
                    activeGroup === grp
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 no-scrollbar">
              {filteredCategories.map((c) => {
                const isSelected = selectedCategoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(c.id)}
                    className={`flex flex-col items-center p-2 rounded-xl text-center transition-all ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/40 ring-2 ring-teal-600 text-teal-800 dark:text-teal-200 font-semibold'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mb-1 text-white shadow-xs"
                      style={{ backgroundColor: c.colorValue }}
                    >
                      <CategoryIcon iconKey={c.iconKey} size={15} />
                    </div>
                    <span className="text-[10px] leading-tight line-clamp-1 w-full">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Date & Note Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
              Tanggal Transaksi
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full py-2 px-3 text-xs font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Mis: Sarapan, beli bensin, dll"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentAmount > 0) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              maxLength={60}
              className="w-full py-2 px-3 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-800 flex gap-3">
        <button
          type="button"
          onClick={() => setIsAddTransactionOpen(false)}
          className="flex-1 py-3 text-sm font-semibold rounded-2xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={currentAmount <= 0}
          className="flex-2 py-3 text-sm font-black rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black shadow-md active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {editingTransaction ? 'Simpan Perubahan' : 'Catat Sekarang'}
        </button>
      </div>
    </div>
  );
}

export function AddTransactionModal() {
  const { isAddTransactionOpen, editingTransaction } = useApp();

  if (!isAddTransactionOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center landscape:items-center justify-center p-0 sm:p-4 landscape:p-3 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-lg landscape:max-w-xl"
        >
          <AddTransactionForm key={editingTransaction ? editingTransaction.transaction.id : 'new-tx'} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
