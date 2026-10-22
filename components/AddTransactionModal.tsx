'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Delete, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { useApp } from './AppContext';
import { ExpenseNature, TransactionType } from '@/lib/types';
import { CategoryIcon } from './CategoryIcon';
import { formatNumberOnly, formatRupiah } from '@/lib/formatters';
import { detectExpenseNature, isDateInBudgetPeriod, isGrocerySubcategory } from '@/lib/budgetUtils';

function AddTransactionForm() {
  const {
    setIsAddTransactionOpen,
    editingTransaction,
    categories,
    wallets,
    walletsWithBalance,
    settings,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    transferFunds,
    openScanModal,
    activeDate,
    addToast,
    budgetConfig,
    budgetPeriod,
    dashboardSummary,
    transactions,
    getWalletBalance,
    triggerInsufficientBalanceAlert,
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
    if (editingTransaction?.transaction.walletId) return editingTransaction.transaction.walletId;
    const funded = walletsWithBalance.find(
      (w) => w.type !== 'credit' && w.type !== 'paylater' && w.balance > 0
    );
    return funded?.id || wallets[0]?.id || '';
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

  const [expenseNature, setExpenseNature] = useState<ExpenseNature>(() => {
    if (editingTransaction?.transaction.expenseNature) {
      return editingTransaction.transaction.expenseNature;
    }
    const catId = editingTransaction?.transaction.categoryId || undefined;
    const catMap = new Map(categories.map((c) => [c.id, c]));
    return detectExpenseNature(catId, editingTransaction?.transaction.note, catMap);
  });
  const [isManualExpenseNature, setIsManualExpenseNature] = useState<boolean>(
    Boolean(editingTransaction?.transaction.expenseNature)
  );

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
  const activeWalletId = selectedWalletId || walletsWithBalance[0]?.id || wallets[0]?.id || '';
  const selectedWalletObj =
    walletsWithBalance.find((w) => w.id === activeWalletId) || walletsWithBalance[0];
  const effectiveWalletBalance = getWalletBalance(
    activeWalletId,
    editingTransaction?.transaction.id
  );
  const isWalletInsufficient =
    (type === 'expense' || type === 'transfer') &&
    currentAmount > 0 &&
    currentAmount > effectiveWalletBalance;
  const walletShortfall = Math.max(0, currentAmount - effectiveWalletBalance);

  // When type changes, ensure valid default category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setActiveGroup('Semua');
    if (newType !== 'transfer') {
      const match = categories.find((c) => c.type === (newType === 'income' ? 'income' : 'expense'));
      if (match) {
        setSelectedCategoryId(match.id);
        if (!isManualExpenseNature) {
          const catMap = new Map(categories.map((c) => [c.id, c]));
          setExpenseNature(detectExpenseNature(match.id, note, catMap));
        }
      }
    }
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    const chosenCat = categories.find((c) => c.id === catId);
    const isTabunganCat =
      chosenCat?.budgetGroup === 'tabungan' ||
      chosenCat?.groupName === 'Tabungan' ||
      chosenCat?.expenseNature === 'savings' ||
      catId === 'cat-tabungan' ||
      catId === 'cat-investasi';

    if (isTabunganCat) {
      setExpenseNature('savings');
      setIsManualExpenseNature(false);
    } else if (chosenCat?.expenseNature === 'grocery' || catId === 'cat-belanja-bulanan') {
      setExpenseNature('grocery');
      setIsManualExpenseNature(false);
    } else if (!isManualExpenseNature || expenseNature === 'savings' || expenseNature === 'grocery') {
      const catMap = new Map(categories.map((c) => [c.id, c]));
      setExpenseNature(detectExpenseNature(catId, note, catMap));
      setIsManualExpenseNature(false);
    }
  };

  const handleNoteChange = (newNote: string) => {
    setNote(newNote);
    if (!isManualExpenseNature) {
      const catMap = new Map(categories.map((c) => [c.id, c]));
      setExpenseNature(detectExpenseNature(selectedCategoryId, newNote, catMap));
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

  // Proactive budget calculation for selected expense category
  const matchingSubcategory = useMemo(() => {
    if (type !== 'expense' || !selectedCategoryId) return null;
    const chosenCat = categories.find((c) => c.id === selectedCategoryId);
    const catNameLower = (chosenCat?.name || '').toLowerCase().trim();
    const noteLower = (note || '').toLowerCase().trim();
    const isTabungan =
      expenseNature === 'savings' ||
      chosenCat?.budgetGroup === 'tabungan' ||
      chosenCat?.groupName === 'Tabungan' ||
      selectedCategoryId === 'cat-tabungan' ||
      selectedCategoryId === 'cat-investasi';

    const subs = budgetConfig?.subcategories || [];

    // Direct or name/note match first
    const directMatch = subs.find((s) => {
      if (isTabungan && s.group !== 'tabungan') return false;
      const sNameLower = s.name.toLowerCase().trim();
      if (s.id.replace('sub-', '') === selectedCategoryId.replace('cat-', '')) return true;
      if (noteLower && sNameLower && (noteLower.includes(sNameLower) || sNameLower.includes(noteLower))) {
        return true;
      }
      if (sNameLower && (catNameLower === sNameLower || catNameLower.includes(sNameLower) || sNameLower.includes(catNameLower))) {
        return true;
      }
      return false;
    });

    if (directMatch) return directMatch;

    // Fallback for Grocery / Belanja Bulanan
    if (expenseNature === 'grocery') {
      const grocerySub = subs.find((s) => isGrocerySubcategory(s));
      if (grocerySub) return grocerySub;
    }

    // Fallback for Tabungan category (e.g. 'cat-tabungan' matching 'Nabung Dana Darurat' / 'sub-darurat')
    if (isTabungan) {
      const savingsSubs = subs.filter((s) => s.group === 'tabungan');
      if (selectedCategoryId === 'cat-investasi') {
        return savingsSubs.find((s) => /invest|saham|reksa|emas|crypto/i.test(s.name)) || savingsSubs[0] || null;
      }
      return (
        savingsSubs.find((s) => /nabung|tabung|darurat|simpan/i.test(s.name)) ||
        savingsSubs[0] ||
        null
      );
    }

    return null;
  }, [type, selectedCategoryId, note, categories, budgetConfig?.subcategories, expenseNature]);

  const subcategoryBudgetStatus = useMemo(() => {
    if (!matchingSubcategory || matchingSubcategory.allocatedAmount <= 0) return null;

    let spentSoFar = 0;
    (transactions || []).forEach((tx) => {
      if (editingTransaction && tx.id === editingTransaction.transaction.id) return;
      if (tx.type !== 'expense') return;
      const d = new Date(tx.date);
      if (!isDateInBudgetPeriod(d, budgetPeriod)) return;

      const txCat = tx.categoryId ? categories.find((c) => c.id === tx.categoryId) : undefined;
      const txCatName = (txCat?.name || '').toLowerCase().trim();
      const txNote = (tx.note || '').toLowerCase().trim();
      const sName = matchingSubcategory.name.toLowerCase().trim();

      const isDirectMatch =
        (tx.categoryId && matchingSubcategory.id.replace('sub-', '') === tx.categoryId.replace('cat-', '')) ||
        (sName && (txCatName.includes(sName) || sName.includes(txCatName))) ||
        (txNote && sName && (txNote.includes(sName) || sName.includes(txNote))) ||
        (matchingSubcategory.group === 'tabungan' &&
          tx.categoryId === 'cat-tabungan' &&
          /nabung|tabung|darurat|simpan/i.test(sName));

      if (isDirectMatch) {
        spentSoFar += tx.amount;
      }
    });

    const willTotalSpend = spentSoFar + currentAmount;
    const isOver = willTotalSpend > matchingSubcategory.allocatedAmount;
    const isAlreadyOver = spentSoFar > matchingSubcategory.allocatedAmount;
    const overAmount = willTotalSpend - matchingSubcategory.allocatedAmount;
    const remainingBefore = Math.max(0, matchingSubcategory.allocatedAmount - spentSoFar);

    return {
      subcategory: matchingSubcategory,
      allocated: matchingSubcategory.allocatedAmount,
      spentSoFar,
      willTotalSpend,
      isOver,
      isAlreadyOver,
      overAmount,
      remainingBefore,
    };
  }, [matchingSubcategory, transactions, budgetPeriod, currentAmount, editingTransaction, categories]);

  const handleSave = () => {
    if (currentAmount <= 0) return;

    const chosenCat = categories.find((c) => c.id === selectedCategoryId);

    // Block any payment/outflow when selected wallet balance is smaller than payment amount
    if ((type === 'expense' || type === 'transfer') && currentAmount > effectiveWalletBalance) {
      triggerInsufficientBalanceAlert(
        activeWalletId,
        currentAmount,
        note.trim() ||
          (type === 'transfer'
            ? 'Transfer Antar Dompet'
            : chosenCat?.name || 'Transaksi Pembayaran'),
        effectiveWalletBalance
      );
      return;
    }

    const [y, m, d] = selectedDate.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d, 12, 0, 0, 0);
    const now = new Date();
    targetDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
    const finalDateIso = targetDate.toISOString();

    if (type === 'transfer') {
      if (!selectedWalletId || !transferTargetWalletId || selectedWalletId === transferTargetWalletId) {
        addToast('Transfer Gagal', 'Pilih dompet asal dan tujuan yang berbeda.', 'error');
        return;
      }
      if (editingTransaction) {
        const ok = updateTransaction(editingTransaction.transaction.id, {
          type: 'transfer',
          amount: currentAmount,
          walletId: selectedWalletId,
          transferWalletId: transferTargetWalletId,
          categoryId: null,
          date: finalDateIso,
          note: note.trim() || undefined,
        });
        if (!ok) return;
      } else {
        const ok = transferFunds(
          selectedWalletId,
          transferTargetWalletId,
          currentAmount,
          note.trim() || 'Transfer antar dompet',
          finalDateIso
        );
        if (!ok) return;
      }
    } else {
      const effectiveBudgetGroup =
        type === 'expense' && expenseNature === 'savings'
          ? 'tabungan'
          : type === 'expense' && expenseNature === 'grocery'
          ? 'kebutuhan'
          : chosenCat?.budgetGroup;

      if (editingTransaction) {
        const ok = updateTransaction(editingTransaction.transaction.id, {
          type,
          amount: currentAmount,
          walletId: activeWalletId,
          categoryId: selectedCategoryId || null,
          budgetGroup: effectiveBudgetGroup,
          expenseNature: type === 'expense' ? expenseNature : undefined,
          transferWalletId: null,
          date: finalDateIso,
          note: note.trim() || undefined,
        });
        if (!ok) return;
      } else {
        const createdId = addTransaction({
          type,
          amount: currentAmount,
          walletId: activeWalletId,
          categoryId: selectedCategoryId || null,
          budgetGroup: effectiveBudgetGroup,
          expenseNature: type === 'expense' ? expenseNature : undefined,
          transferWalletId: null,
          date: finalDateIso,
          note: note.trim() || undefined,
        });
        if (!createdId) return;
      }

      if (subcategoryBudgetStatus?.isOver && currentAmount > 0) {
        addToast(
          'Peringatan: Melebihi Anggaran',
          `Pengeluaran "${subcategoryBudgetStatus.subcategory.name}" melebihi anggaran sebesar Rp${formatNumberOnly(subcategoryBudgetStatus.overAmount)}.`,
          'info'
        );
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

        {/* Insufficient Wallet Balance Alert Banner */}
        {isWalletInsufficient && (
          <div className="bg-red-50 dark:bg-red-950/60 border-2 border-red-400 dark:border-red-600 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-red-700 dark:text-red-300 shadow-xs">
            <div className="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle size={15} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-red-800 dark:text-red-200 flex items-center justify-between gap-1">
                <span>⛔ Uang di Dompet Tidak Cukup!</span>
                <span className="font-black tabular-nums text-red-600 dark:text-red-400">
                  Kurang {formatRupiah(walletShortfall, settings.hideBalance)}
                </span>
              </div>
              <p className="text-[11px] text-red-600/95 dark:text-red-300/95 mt-0.5 leading-snug">
                Saldo <strong>{selectedWalletObj?.name || 'Dompet'}</strong> saat ini{' '}
                <strong>{formatRupiah(effectiveWalletBalance, settings.hideBalance)}</strong>, lebih kecil dari nominal pembayaran{' '}
                <strong>{formatRupiah(currentAmount, settings.hideBalance)}</strong>. Dompet tidak boleh minus.
              </p>
            </div>
          </div>
        )}

        {/* Proactive Category Budget Alert */}
        {subcategoryBudgetStatus?.isOver && currentAmount > 0 && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300 shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle size={15} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-rose-800 dark:text-rose-200 flex items-center justify-between gap-1">
                <span>⚠️ Peringatan Melebihi Anggaran!</span>
                <span className="font-black tabular-nums text-rose-600 dark:text-rose-400">
                  +{formatRupiah(subcategoryBudgetStatus.overAmount, settings.hideBalance)}
                </span>
              </div>
              <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90 mt-0.5 leading-snug">
                Pagu <strong>{subcategoryBudgetStatus.subcategory.emoji} {subcategoryBudgetStatus.subcategory.name}</strong> sebesar {formatRupiah(subcategoryBudgetStatus.allocated, settings.hideBalance)} (terpakai {formatRupiah(subcategoryBudgetStatus.spentSoFar, settings.hideBalance)}). Transaksi ini akan melampaui batas anggaran.
              </p>
            </div>
          </div>
        )}

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
                {walletsWithBalance.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({settings.hideBalance ? 'Rp ••••' : `Rp${formatNumberOnly(w.balance)}`})
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
                {walletsWithBalance.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({settings.hideBalance ? 'Rp ••••' : `Rp${formatNumberOnly(w.balance)}`})
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
              {walletsWithBalance.map((w) => {
                const isSelected = selectedWalletId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWalletId(w.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <span>{w.name}</span>
                    <span
                      className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      { settings.hideBalance ? 'Rp ••••' : `Rp${formatNumberOnly(w.balance)}` }
                    </span>
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
                  onClick={() => {
                    setActiveGroup(grp);
                    if (grp === 'Tabungan') {
                      const currentCat = availableCategories.find((c) => c.id === selectedCategoryId);
                      if (currentCat?.groupName !== 'Tabungan' && currentCat?.budgetGroup !== 'tabungan') {
                        const firstTabunganCat = availableCategories.find(
                          (c) => c.groupName === 'Tabungan' || c.budgetGroup === 'tabungan'
                        );
                        if (firstTabunganCat) {
                          handleSelectCategory(firstTabunganCat.id);
                        } else {
                          setExpenseNature('savings');
                        }
                      } else {
                        setExpenseNature('savings');
                      }
                    }
                  }}
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
                    onClick={() => handleSelectCategory(c.id)}
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

        {/* Pos Beban Anggaran (Pengeluaran Harian vs Belanja Bulanan/Masak vs Tagihan Bulanan vs Alokasi Tabungan) */}
        {type === 'expense' && (
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Alokasi Pos Anggaran
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  expenseNature === 'savings'
                    ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : expenseNature === 'fixed'
                    ? 'bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : expenseNature === 'grocery'
                    ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : 'bg-teal-100/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                }`}
              >
                {expenseNature === 'savings'
                  ? '🏦 Pos Alokasi Tabungan'
                  : expenseNature === 'fixed'
                  ? '📅 Pos Tagihan Tetap'
                  : expenseNature === 'grocery'
                  ? '🛒 Pos Belanja Bulanan / Masak'
                  : '🥪 Pos Operasional Harian'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setExpenseNature('variable');
                  setIsManualExpenseNature(true);
                }}
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  expenseNature === 'variable'
                    ? 'bg-white dark:bg-gray-800 border-teal-500 ring-2 ring-teal-500/20 text-gray-900 dark:text-white shadow-xs'
                    : 'bg-transparent border-gray-200 dark:border-gray-700/60 text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <span className="text-base shrink-0">🥪</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight">Makan Luar / Harian</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    Beli makan luar, jajan, bensin (potong jatah harian)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExpenseNature('grocery');
                  setIsManualExpenseNature(true);
                  const groceryCat = availableCategories.find((c) => c.id === 'cat-belanja-bulanan');
                  const currentCat = availableCategories.find((c) => c.id === selectedCategoryId);
                  if (
                    groceryCat &&
                    currentCat?.id !== 'cat-makan' &&
                    currentCat?.id !== 'cat-belanja-bulanan'
                  ) {
                    setSelectedCategoryId(groceryCat.id);
                  }
                }}
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  expenseNature === 'grocery'
                    ? 'bg-white dark:bg-gray-800 border-amber-500 ring-2 ring-amber-500/20 text-gray-900 dark:text-white shadow-xs'
                    : 'bg-transparent border-gray-200 dark:border-gray-700/60 text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <span className="text-base shrink-0">🛒</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight">Belanja Bulanan / Masak</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    Kuota harian otomatis menyesuaikan sisa uang setelah belanja ini
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExpenseNature('fixed');
                  setIsManualExpenseNature(true);
                }}
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  expenseNature === 'fixed'
                    ? 'bg-white dark:bg-gray-800 border-blue-500 ring-2 ring-blue-500/20 text-gray-900 dark:text-white shadow-xs'
                    : 'bg-transparent border-gray-200 dark:border-gray-700/60 text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <span className="text-base shrink-0">📅</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight">Tagihan Bulanan</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    Wi-Fi, listrik, cicilan (TIDAK potong harian)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExpenseNature('savings');
                  setIsManualExpenseNature(true);
                  const currentCat = availableCategories.find((c) => c.id === selectedCategoryId);
                  if (currentCat?.groupName !== 'Tabungan' && currentCat?.budgetGroup !== 'tabungan') {
                    const tabunganCat = availableCategories.find(
                      (c) => c.id === 'cat-tabungan' || c.budgetGroup === 'tabungan' || c.groupName === 'Tabungan'
                    );
                    if (tabunganCat) {
                      setSelectedCategoryId(tabunganCat.id);
                    }
                  }
                }}
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  expenseNature === 'savings'
                    ? 'bg-white dark:bg-gray-800 border-emerald-500 ring-2 ring-emerald-500/20 text-gray-900 dark:text-white shadow-xs'
                    : 'bg-transparent border-gray-200 dark:border-gray-700/60 text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <span className="text-base shrink-0">🏦</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight">Alokasi Tabungan</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    Dana darurat & investasi (Pos Tabungan 20%)
                  </div>
                </div>
              </button>
            </div>

            {/* Info banner when Belanja Bulanan / Masak is selected */}
            {expenseNature === 'grocery' && (() => {
              const previousGroceryAdjust =
                editingTransaction && editingTransaction.transaction.expenseNature === 'grocery'
                  ? editingTransaction.transaction.amount
                  : 0;
              const nextVariablePool = Math.max(
                0,
                dashboardSummary.monthlyVariableBudget + previousGroceryAdjust - currentAmount
              );
              const nextRemainingPool = Math.max(
                0,
                dashboardSummary.remainingVariableBudget + previousGroceryAdjust - currentAmount
              );
              const totalDays = Math.max(1, dashboardSummary.periodTotalDays || 30);
              const nextDailyQuota = Math.round(nextVariablePool / totalDays);

              return (
                <div className="pt-2 border-t border-gray-200/70 dark:border-gray-700/50 space-y-1 text-[11px]">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-amber-700 dark:text-amber-400 font-bold">
                      🛒 Sisa uang setelah belanja ini:
                    </span>
                    <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
                      {formatRupiah(nextRemainingPool, settings.hideBalance)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-gray-500 dark:text-gray-400">
                      Kuota harian baru (mengikuti sisa uang):
                    </span>
                    <span className="font-black text-teal-700 dark:text-[#D4F826] tabular-nums">
                      ~{formatRupiah(nextDailyQuota, settings.hideBalance)} / hari
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Sub-pos Tabungan selector when Alokasi Tabungan is selected */}
            {expenseNature === 'savings' && (budgetConfig?.subcategories || []).some((s) => s.group === 'tabungan') && (
              <div className="pt-1.5 border-t border-gray-200/70 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    Target Pos Tabungan & Investasi:
                  </span>
                  {matchingSubcategory && matchingSubcategory.group === 'tabungan' && (
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                      Target: Rp{formatNumberOnly(matchingSubcategory.allocatedAmount)}/bln
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(budgetConfig?.subcategories || [])
                    .filter((s) => s.group === 'tabungan')
                    .map((sub) => {
                      const isSubActive = matchingSubcategory?.id === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            const isInvestSub = /invest|saham|reksa|emas|crypto/i.test(sub.name);
                            const targetCatId = isInvestSub ? 'cat-investasi' : 'cat-tabungan';
                            if (availableCategories.some((c) => c.id === targetCatId)) {
                              setSelectedCategoryId(targetCatId);
                            }
                            setNote(sub.name);
                            setExpenseNature('savings');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSubActive
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-400'
                          }`}
                        >
                          <span>{sub.emoji || '🏦'}</span>
                          <span>{sub.name}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
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
              onChange={(e) => handleNoteChange(e.target.value)}
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
