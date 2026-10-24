'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Delete, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { useApp } from './AppContext';
import { ExpenseNature, TransactionType } from '@/lib/types';
import { CategoryIcon } from './CategoryIcon';
import { formatNumberOnly, formatRupiah } from '@/lib/formatters';
import { detectExpenseNature, isDateInBudgetPeriod, isGrocerySubcategory, parseLocalDay } from '@/lib/budgetUtils';

function AddTransactionForm() {
  const {
    setIsAddTransactionOpen,
    editingTransaction,
    preselectedTransactionType,
    preselectedTransactionDate,
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

  const initialType = editingTransaction?.transaction.type || preselectedTransactionType || 'expense';
  const [type, setType] = useState<TransactionType>(() => initialType);
  const [amountStr, setAmountStr] = useState<string>(() =>
    editingTransaction ? String(editingTransaction.transaction.amount) : ''
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    if (editingTransaction?.transaction.categoryId) return editingTransaction.transaction.categoryId;
    const match = categories.find((c) => c.type === (initialType === 'income' ? 'income' : 'expense'));
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
      const d = parseLocalDay(editingTransaction.transaction.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    if (preselectedTransactionDate) return preselectedTransactionDate;
    const now = new Date();
    if (isDateInBudgetPeriod(now, budgetPeriod)) {
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    if (activeDate) return activeDate;
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
  const isSelectedDebtWallet =
    selectedWalletObj?.type === 'credit' || selectedWalletObj?.type === 'paylater';
  const effectiveWalletBalance = getWalletBalance(
    activeWalletId,
    editingTransaction?.transaction.id
  );
  const isWalletInsufficient =
    !isSelectedDebtWallet &&
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
    } else if (
      chosenCat?.expenseNature === 'non_daily' ||
      catId === 'cat-kondangan' ||
      catId === 'cat-sedekah'
    ) {
      setExpenseNature('non_daily');
      setIsManualExpenseNature(false);
    } else if (!isManualExpenseNature || expenseNature === 'savings') {
      const catMap = new Map(categories.map((c) => [c.id, c]));
      setExpenseNature(detectExpenseNature(catId, note, catMap));
      setIsManualExpenseNature(false);
    }
  };

  const handleNoteChange = (newNote: string) => {
    setNote(newNote);
    if (!isManualExpenseNature) {
      const catMap = new Map(categories.map((c) => [c.id, c]));
      const detected = detectExpenseNature(selectedCategoryId, newNote, catMap);
      setExpenseNature(detected);
      if (detected === 'non_daily' && selectedCategoryId === 'cat-makan') {
        const kondanganCat = categories.find((c) => c.id === 'cat-kondangan');
        if (kondanganCat) {
          setSelectedCategoryId(kondanganCat.id);
        }
      }
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

    if (expenseNature === 'grocery') {
      const grocerySub = subs.find((s) => isGrocerySubcategory(s));
      if (grocerySub) return grocerySub;
    }

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
      const d = parseLocalDay(tx.date);
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

    // Block payment/outflow on liquid wallets when balance is smaller than payment amount
    if (
      !isSelectedDebtWallet &&
      (type === 'expense' || type === 'transfer') &&
      currentAmount > effectiveWalletBalance
    ) {
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
    if (editingTransaction?.transaction.date) {
      const orig = new Date(editingTransaction.transaction.date);
      if (!Number.isNaN(orig.getTime())) {
        targetDate.setHours(orig.getHours(), orig.getMinutes(), orig.getSeconds(), 0);
      }
    } else {
      const now = new Date();
      targetDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
    }
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
          'Melebihi Anggaran',
          `Pos "${subcategoryBudgetStatus.subcategory.name}" lewat Rp${formatNumberOnly(subcategoryBudgetStatus.overAmount)}.`,
          'info'
        );
      }
    }

    setIsAddTransactionOpen(false);
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const timer = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmDelete]);

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

  const formatWalletBalanceChip = (w: (typeof walletsWithBalance)[number]) => {
    if (settings.hideBalance) return 'Rp ••••';
    if ((w.type === 'credit' || w.type === 'paylater') && w.balance > 0) {
      return `Tagihan Rp${formatNumberOnly(w.balance)}`;
    }
    return `Rp${formatNumberOnly(w.balance)}`;
  };

  return (
    <div className="w-full max-w-lg landscape:max-w-xl max-h-[92vh] landscape:max-h-[96vh] flex flex-col bg-white dark:bg-[#11131E] rounded-t-3xl sm:rounded-3xl landscape:rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-white/[0.08]">
        <h2 className="font-display text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
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
              className="px-2.5 py-1 text-xs font-bold rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1 hover:bg-teal-100 transition-colors cursor-pointer"
              title="Scan Struk / Bukti Transfer"
            >
              <Sparkles size={13} />
              <span>Scan Struk</span>
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
              <Delete size={15} />
              {confirmDelete && <span>Hapus?</span>}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsAddTransactionOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X size={19} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-5 space-y-4 no-scrollbar">
        {/* Segmented Type Selector */}
        <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-white/[0.06] rounded-2xl">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              type === 'expense'
                ? 'bg-white dark:bg-[#1A1D2D] text-red-600 dark:text-red-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              type === 'income'
                ? 'bg-white dark:bg-[#1A1D2D] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('transfer')}
            className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              type === 'transfer'
                ? 'bg-white dark:bg-[#1A1D2D] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Transfer
          </button>
        </div>

        {/* Nominal Input */}
        <div
          onClick={() => amountInputRef.current?.focus()}
          className="bg-slate-50 dark:bg-white/[0.03] px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 focus-within:border-teal-500 dark:focus-within:border-[#D4F826] transition-all text-center cursor-text"
        >
          <label
            htmlFor="tx-nominal-input"
            className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block cursor-text"
          >
            Nominal (Rp)
          </label>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`text-xl font-bold select-none ${accentColorClass}`}>Rp</span>
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
              className={`w-full max-w-[250px] bg-transparent text-center font-mono-num text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 ${accentColorClass}`}
            />
          </div>
        </div>

        {/* Quick Increment Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {[10000, 20000, 50000, 100000, 500000].map((quick) => (
            <button
              key={quick}
              type="button"
              onClick={() => handleQuickAdd(quick)}
              className="px-3 py-1.5 text-xs font-bold rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.12] transition-colors shrink-0 cursor-pointer"
            >
              +{formatNumberOnly(quick)}
            </button>
          ))}
          {currentAmount > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-bold rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-100 transition-colors shrink-0 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Insufficient Wallet Balance Alert Banner */}
        {isWalletInsufficient && (
          <div className="bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-700 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle size={15} className="text-red-500 shrink-0" />
              <span className="font-bold truncate">
                Saldo {selectedWalletObj?.name || 'Dompet'} ({formatRupiah(effectiveWalletBalance, settings.hideBalance)}) kurang
              </span>
            </div>
            <span className="font-mono-num font-extrabold text-red-600 dark:text-red-400 shrink-0">
              -{formatRupiah(walletShortfall, settings.hideBalance)}
            </span>
          </div>
        )}

        {/* Proactive Category Budget Alert */}
        {subcategoryBudgetStatus?.isOver && currentAmount > 0 && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle size={15} className="text-rose-500 shrink-0" />
              <span className="font-bold truncate">
                Lewat pagu {subcategoryBudgetStatus.subcategory.emoji} {subcategoryBudgetStatus.subcategory.name}
              </span>
            </div>
            <span className="font-mono-num font-extrabold text-rose-600 dark:text-rose-400 shrink-0">
              +{formatRupiah(subcategoryBudgetStatus.overAmount, settings.hideBalance)}
            </span>
          </div>
        )}

        {/* Wallet Selector */}
        {type === 'transfer' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Dari Dompet
              </label>
              <select
                value={selectedWalletId}
                onChange={(e) => {
                  const nextFrom = e.target.value;
                  setSelectedWalletId(nextFrom);
                  if (nextFrom === transferTargetWalletId) {
                    const alt = walletsWithBalance.find((w) => w.id !== nextFrom);
                    if (alt) setTransferTargetWalletId(alt.id);
                  }
                }}
                className="w-full p-2.5 text-xs font-bold bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {walletsWithBalance.map((w) => (
                  <option key={w.id} value={w.id} className="bg-white dark:bg-[#161928]">
                    {w.name} ({formatWalletBalanceChip(w)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Ke Dompet
              </label>
              <select
                value={transferTargetWalletId}
                onChange={(e) => setTransferTargetWalletId(e.target.value)}
                className="w-full p-2.5 text-xs font-bold bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {walletsWithBalance.map((w) => (
                  <option
                    key={w.id}
                    value={w.id}
                    disabled={w.id === selectedWalletId}
                    className="bg-white dark:bg-[#161928]"
                  >
                    {w.name} ({formatWalletBalanceChip(w)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Dompet
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {walletsWithBalance.map((w) => {
                const isSelected = selectedWalletId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWalletId(w.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{w.name}</span>
                    <span
                      className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {formatWalletBalanceChip(w)}
                    </span>
                    {isSelected && <Check size={13} />}
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
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Kategori
              </label>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 transition-colors cursor-pointer ${
                    activeGroup === grp
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] no-scrollbar">
              {filteredCategories.map((c) => {
                const isSelected = selectedCategoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCategory(c.id)}
                    className={`flex flex-col items-center p-2 rounded-xl text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/40 ring-2 ring-teal-600 text-teal-800 dark:text-teal-200 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300'
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

        {/* Pos Anggaran (Harian vs Pribadi vs Tagihan vs Tabungan) */}
        {type === 'expense' && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pos Anggaran
              </span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {expenseNature === 'savings'
                  ? '🏦 Tabungan'
                  : expenseNature === 'fixed'
                  ? '📅 Tagihan Tetap'
                  : expenseNature === 'grocery' || expenseNature === 'non_daily'
                  ? '🛍️ Keperluan Pribadi'
                  : '🥪 Operasional Harian'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setExpenseNature('variable');
                  setIsManualExpenseNature(true);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  expenseNature === 'variable'
                    ? 'bg-white dark:bg-[#1A1D2D] border-teal-500 ring-1 ring-teal-500 text-slate-900 dark:text-white shadow-2xs'
                    : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-base shrink-0">🥪</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">Harian</div>
                  <div className="text-[10px] text-slate-400 truncate">Potong kuota hari ini</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExpenseNature('non_daily');
                  setIsManualExpenseNature(true);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  expenseNature === 'non_daily' || expenseNature === 'grocery'
                    ? 'bg-white dark:bg-[#1A1D2D] border-amber-500 ring-1 ring-amber-500 text-slate-900 dark:text-white shadow-2xs'
                    : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-base shrink-0">🛍️</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">Pribadi</div>
                  <div className="text-[10px] text-slate-400 truncate">Non-harian / bulanan</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExpenseNature('fixed');
                  setIsManualExpenseNature(true);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  expenseNature === 'fixed'
                    ? 'bg-white dark:bg-[#1A1D2D] border-blue-500 ring-1 ring-blue-500 text-slate-900 dark:text-white shadow-2xs'
                    : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-base shrink-0">📅</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">Tagihan</div>
                  <div className="text-[10px] text-slate-400 truncate">Rutin & cicilan</div>
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
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  expenseNature === 'savings'
                    ? 'bg-white dark:bg-[#1A1D2D] border-emerald-500 ring-1 ring-emerald-500 text-slate-900 dark:text-white shadow-2xs'
                    : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-base shrink-0">🏦</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">Tabungan</div>
                  <div className="text-[10px] text-slate-400 truncate">Tabungan & investasi</div>
                </div>
              </button>
            </div>

            {/* Compact 1-line status when Harian (variable) is selected */}
            {expenseNature === 'variable' && currentAmount > 0 && dashboardSummary.dailyBudgetQuota > 0 && (() => {
              const prevVarAdjust =
                editingTransaction &&
                (!editingTransaction.transaction.expenseNature ||
                  editingTransaction.transaction.expenseNature === 'variable')
                  ? editingTransaction.transaction.amount
                  : 0;
              const projectedTodayVar = Math.max(
                0,
                dashboardSummary.todayVariableExpense - prevVarAdjust + currentAmount
              );
              const quotaToday = dashboardSummary.dailyBudgetQuota;
              const remTodayAfter = Math.max(0, quotaToday - projectedTodayVar);
              const overTodayAfter = Math.max(0, projectedTodayVar - quotaToday);
              const nextRemVarPool = Math.max(
                0,
                dashboardSummary.remainingVariableBudget + prevVarAdjust - currentAmount
              );
              const remDaysTomorrow = Math.max(
                1,
                (dashboardSummary.daysRemainingUntilPayday || 2) - 1
              );
              const projectedTomorrowQuota = Math.min(
                quotaToday,
                Math.round(nextRemVarPool / remDaysTomorrow)
              );

              return (
                <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">
                    Sisa kuota hari ini:
                  </span>
                  <span
                    className={`font-mono-num font-bold ${
                      overTodayAfter > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-teal-700 dark:text-[#D4F826]'
                    }`}
                  >
                    {overTodayAfter > 0
                      ? `Lewat +${formatRupiah(overTodayAfter, settings.hideBalance)} (Besok ~${formatRupiah(projectedTomorrowQuota, settings.hideBalance)}/hr)`
                      : formatRupiah(remTodayAfter, settings.hideBalance)}
                  </span>
                </div>
              );
            })()}

            {/* Compact status when Pribadi (non_daily / grocery) is selected */}
            {(expenseNature === 'non_daily' || expenseNature === 'grocery') && currentAmount > 0 && (() => {
              const previousPersonalAdjust =
                editingTransaction &&
                (editingTransaction.transaction.expenseNature === 'non_daily' ||
                  editingTransaction.transaction.expenseNature === 'grocery')
                  ? editingTransaction.transaction.amount
                  : 0;
              const nextVariablePool = Math.max(
                0,
                dashboardSummary.monthlyVariableBudget + previousPersonalAdjust - currentAmount
              );
              const nextRemainingPool = Math.max(
                0,
                dashboardSummary.remainingVariableBudget + previousPersonalAdjust - currentAmount
              );
              const totalDays = Math.max(1, dashboardSummary.periodTotalDays || 30);
              const remDays = Math.max(1, dashboardSummary.daysRemainingUntilPayday || totalDays);
              const priorDaysVarExp = Math.max(
                0,
                dashboardSummary.monthlyVariableExpense - dashboardSummary.todayVariableExpense
              );
              const baseDaily = Math.round(nextVariablePool / totalDays);
              const rollingDaily = Math.round(
                Math.max(0, nextVariablePool - priorDaysVarExp) / remDays
              );
              const nextDailyQuota =
                priorDaysVarExp > 0 ? Math.min(baseDaily, rollingDaily) : baseDaily;

              return (
                <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">
                    Sisa pos harian: {formatRupiah(nextRemainingPool, settings.hideBalance)}
                  </span>
                  <span className="font-mono-num font-bold text-teal-700 dark:text-[#D4F826]">
                    Kuota ~{formatRupiah(nextDailyQuota, settings.hideBalance)}/hr
                  </span>
                </div>
              );
            })()}

            {/* Sub-pos Tabungan selector when Alokasi Tabungan is selected */}
            {expenseNature === 'savings' && (budgetConfig?.subcategories || []).some((s) => s.group === 'tabungan') && (
              <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.08]">
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
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSubActive
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white dark:bg-[#1A1D2D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-emerald-400'
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
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Tanggal
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full py-2.5 px-3 text-xs font-bold bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Mis: Makan siang, bensin"
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentAmount > 0) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              maxLength={60}
              className="w-full py-2.5 px-3 text-xs font-medium bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.08] flex gap-2.5">
        <button
          type="button"
          onClick={() => setIsAddTransactionOpen(false)}
          className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-slate-200/80 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={currentAmount <= 0 || isWalletInsufficient}
          className="flex-2 py-2.5 text-xs font-extrabold rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black shadow-xs active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {editingTransaction ? 'Simpan' : 'Catat'}
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
