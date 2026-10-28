'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Delete,
  Check,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  FileImage,
  RefreshCw,
} from 'lucide-react';
import { useApp } from './AppContext';
import { ExpenseNature, TransactionType } from '@/lib/types';
import { CategoryIcon } from './CategoryIcon';
import { formatNumberOnly, formatRupiah } from '@/lib/formatters';
import { compressImageForOcr } from '@/lib/imageUtils';
import {
  detectExpenseNature,
  isDateInBudgetPeriod,
  isGrocerySubcategory,
  matchTransactionToSubcategory,
  normalizeBudgetMatchText,
  parseLocalDay,
} from '@/lib/budgetUtils';
import {
  ExtractedScreenshotData,
  getPendingScreenshotForModal,
  setPendingScreenshotForModal,
  resolveWalletAndCategoryFromOcr,
  readLatestImageFromClipboard,
  computeScreenshotFingerprint,
  markScreenshotProcessed,
} from './ClipboardScreenshotDetector';

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
    debts,
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

  // Automatic Screenshot Detection & Pre-fill State inside AddTransactionModal
  const [isAnalyzingScreenshot, setIsAnalyzingScreenshot] = useState<boolean>(false);
  const [isPollingScreenshot, setIsPollingScreenshot] = useState<boolean>(false);
  const [screenshotStepText, setScreenshotStepText] = useState<string>(
    'AI sedang membaca nominal & keterangan screenshot...'
  );
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotMime, setScreenshotMime] = useState<string>('image/jpeg');
  const [detectedSourceApp, setDetectedSourceApp] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [awaitingTouchUnlock, setAwaitingTouchUnlock] = useState<boolean>(false);
  const quickFileInputRef = useRef<HTMLInputElement | null>(null);
  const pasteCatcherRef = useRef<HTMLDivElement | null>(null);
  const currentScreenshotFpRef = useRef<string>('');
  const hasDetectedInModalRef = useRef<boolean>(false);

  const applyExtractedScreenshotData = (data: ExtractedScreenshotData) => {
    hasDetectedInModalRef.current = true;
    setIsPollingScreenshot(false);
    const {
      resolvedWalletId,
      resolvedCategoryId,
      resolvedNature,
      noteStr,
    } = resolveWalletAndCategoryFromOcr(data, walletsWithBalance, wallets, categories);

    const nextType: TransactionType = data.type || 'expense';
    setType(nextType);
    if (data.amount && data.amount > 0) {
      setAmountStr(String(Math.round(data.amount)));
    }
    if (resolvedWalletId) {
      setSelectedWalletId(resolvedWalletId);
      if (nextType === 'transfer') {
        const altW = walletsWithBalance.find((w) => w.id !== resolvedWalletId);
        if (altW) setTransferTargetWalletId(altW.id);
      }
    }
    if (resolvedCategoryId && nextType !== 'transfer') {
      setSelectedCategoryId(resolvedCategoryId);
    }
    if (resolvedNature && nextType === 'expense') {
      setExpenseNature(resolvedNature);
      setIsManualExpenseNature(true);
    }
    if (noteStr) {
      setNote(noteStr.slice(0, 60));
    }

    // Always set date to today (trx hari ini)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    setSelectedDate(todayStr);

    setDetectedSourceApp(
      data.sourceApp || data.suggestedWallet || data.title || 'Screenshot Transaksi'
    );
    setAwaitingTouchUnlock(false);
    setScreenshotError(null);
  };

  const analyzeScreenshotInModal = async (rawBase64: string, rawMime: string) => {
    hasDetectedInModalRef.current = true;
    setIsPollingScreenshot(false);
    setIsAnalyzingScreenshot(true);
    setScreenshotError(null);
    setAwaitingTouchUnlock(false);
    setScreenshotStepText('Mendeteksi nominal, dompet & keterangan dari screenshot...');

    const fp = computeScreenshotFingerprint(rawBase64);
    if (fp) {
      currentScreenshotFpRef.current = fp;
    }

    let finalBase64 = rawBase64;
    let finalMime = rawMime || 'image/jpeg';

    try {
      const compressed = await compressImageForOcr(rawBase64, 1200, 0.82);
      finalBase64 = compressed.base64;
      finalMime = compressed.mimeType;
    } catch {
      // Fallback to raw image
    }

    setScreenshotPreview(finalBase64);
    setScreenshotMime(finalMime);

    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          imageBase64: finalBase64,
          mimeType: finalMime,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Gagal membaca nominal dari screenshot');
      }

      const data: ExtractedScreenshotData = json.data;
      applyExtractedScreenshotData(data);
    } catch (err: any) {
      setScreenshotError(
        err?.message || 'Gagal menganalisis screenshot secara otomatis. Silakan coba lagi.'
      );
    } finally {
      setIsAnalyzingScreenshot(false);
    }
  };

  /**
   * Reads the latest screenshot from the Android Clipboard.
   * If Chrome Android blocks background/JPEG clipboard access and openPickerOnFallback is true,
   * immediately opens Android's Recent Screenshot Picker in the same tap gesture.
   */
  const tryUnlockAndReadScreenshot = async (openPickerOnFallback = false) => {
    if (isAnalyzingScreenshot) return false;

    const clipImg = await readLatestImageFromClipboard(true);
    if (clipImg?.base64) {
      setIsPollingScreenshot(false);
      await analyzeScreenshotInModal(clipImg.base64, clipImg.mimeType);
      return true;
    }

    setIsPollingScreenshot(false);
    if (!hasDetectedInModalRef.current) {
      setAwaitingTouchUnlock(true);
    }

    if (openPickerOnFallback && !hasDetectedInModalRef.current) {
      quickFileInputRef.current?.click();
    }
    return false;
  };

  const handlePasteFromElement = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    const files = e.clipboardData?.files;

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          e.preventDefault();
          const f = files[i];
          const reader = new FileReader();
          reader.onload = (ev) => {
            const b64 = ev.target?.result as string;
            if (b64) analyzeScreenshotInModal(b64, f.type || 'image/jpeg');
          };
          reader.readAsDataURL(f);
          return;
        }
      }
    }

    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (ev) => {
              const b64 = ev.target?.result as string;
              if (b64) analyzeScreenshotInModal(b64, blob.type || 'image/jpeg');
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
    }
  };

  const handleQuickFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageForOcr(file, 1200, 0.82);
      await analyzeScreenshotInModal(compressed.base64, compressed.mimeType);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string;
        if (b64) analyzeScreenshotInModal(b64, file.type || 'image/jpeg');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Fast clipboard check when AddTransactionModal opens (never blocks UI if Android sandboxes .jpg screenshots)
  useEffect(() => {
    if (editingTransaction) return;

    let cancelled = false;
    let isLoopRunning = false;

    const runSequentialClipboardLoop = async (returnedFromExternalApp: boolean) => {
      if (isLoopRunning || hasDetectedInModalRef.current) return;
      isLoopRunning = true;

      if (returnedFromExternalApp) {
        setAwaitingTouchUnlock(true);
      }

      const found = await tryUnlockAndReadScreenshot(false);
      if (found || hasDetectedInModalRef.current || cancelled) {
        setIsPollingScreenshot(false);
        isLoopRunning = false;
        return;
      }

      // Single fast retry after 250ms in case clipboard just finished encoding
      await new Promise((r) => setTimeout(r, 250));
      if (!cancelled && !hasDetectedInModalRef.current) {
        await tryUnlockAndReadScreenshot(false);
      }

      if (!cancelled && !hasDetectedInModalRef.current) {
        setIsPollingScreenshot(false);
        if (returnedFromExternalApp) {
          setAwaitingTouchUnlock(true);
        }
      }
      isLoopRunning = false;
    };

    const consumePending = async () => {
      const pending = getPendingScreenshotForModal();
      if (pending) {
        setPendingScreenshotForModal(null);
        if (pending.extractedData) {
          if (pending.base64) {
            const fp = computeScreenshotFingerprint(pending.base64);
            if (fp) currentScreenshotFpRef.current = fp;
            setScreenshotPreview(pending.base64);
            setScreenshotMime(pending.mimeType || 'image/jpeg');
          }
          applyExtractedScreenshotData(pending.extractedData);
          return;
        }
        if (pending.base64) {
          await analyzeScreenshotInModal(pending.base64, pending.mimeType || 'image/jpeg');
          return;
        }
        if (pending.isPollingNewScreenshot || pending.awaitingTouchUnlock) {
          runSequentialClipboardLoop(true);
          return;
        }
      } else if (!hasDetectedInModalRef.current) {
        runSequentialClipboardLoop(false);
      }
    };

    consumePending();

    const handlePendingEvent = () => {
      consumePending();
    };

    window.addEventListener('dompt-pending-ss-modal', handlePendingEvent);
    return () => {
      cancelled = true;
      window.removeEventListener('dompt-pending-ss-modal', handlePendingEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTransaction]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAnalyzingScreenshot && !isPollingScreenshot && !awaitingTouchUnlock) {
        amountInputRef.current?.focus();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [isAnalyzingScreenshot, isPollingScreenshot, awaitingTouchUnlock]);

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
      setIsManualExpenseNature(true);
    } else if (chosenCat?.expenseNature === 'grocery' || catId === 'cat-belanja-bulanan') {
      setExpenseNature('grocery');
      setIsManualExpenseNature(true);
    } else if (
      chosenCat?.expenseNature === 'non_daily' ||
      catId === 'cat-kondangan' ||
      catId === 'cat-sedekah'
    ) {
      setExpenseNature('non_daily');
      setIsManualExpenseNature(true);
    } else if (!isManualExpenseNature || expenseNature === 'savings') {
      const catMap = new Map(categories.map((c) => [c.id, c]));
      setExpenseNature(detectExpenseNature(catId, note, catMap));
      setIsManualExpenseNature(false);
    }
  };

  const handleNoteChange = (newNote: string) => {
    setNote(newNote);
    let nextCatId = selectedCategoryId;

    if (type === 'expense' && newNote.trim().length >= 3) {
      const normNote = normalizeBudgetMatchText(newNote);
      const expenseCats = categories.filter((c) => c.type === 'expense');
      // Check if the note matches a custom subcategory or specific expense category
      const matchedSub = matchTransactionToSubcategory(
        {
          categoryId: selectedCategoryId,
          note: newNote,
          expenseNature,
        },
        budgetConfig?.subcategories || [],
        { debts }
      );
      if (matchedSub) {
        const subCatMatch = expenseCats.find(
          (c) =>
            c.id === matchedSub.id ||
            c.id === `cat-${matchedSub.id}` ||
            normalizeBudgetMatchText(c.name) === normalizeBudgetMatchText(matchedSub.name)
        );
        if (subCatMatch) {
          nextCatId = subCatMatch.id;
          setSelectedCategoryId(subCatMatch.id);
        }
      } else {
        const directCatMatch = expenseCats.find(
          (c) => normalizeBudgetMatchText(c.name) === normNote
        );
        if (directCatMatch) {
          nextCatId = directCatMatch.id;
          setSelectedCategoryId(directCatMatch.id);
        }
      }
    }

    if (!isManualExpenseNature) {
      const catMap = new Map(categories.map((c) => [c.id, c]));
      const chosenCat = catMap.get(nextCatId);
      if (chosenCat && !chosenCat.isDefault && chosenCat.expenseNature) {
        setExpenseNature(chosenCat.expenseNature);
      } else {
        const detected = detectExpenseNature(nextCatId, newNote, catMap);
        setExpenseNature(detected);
        if (detected === 'non_daily' && nextCatId === 'cat-makan') {
          const kondanganCat = categories.find((c) => c.id === 'cat-kondangan');
          if (kondanganCat) {
            setSelectedCategoryId(kondanganCat.id);
          }
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
    const isTabungan =
      expenseNature === 'savings' ||
      chosenCat?.budgetGroup === 'tabungan' ||
      chosenCat?.groupName === 'Tabungan' ||
      selectedCategoryId === 'cat-tabungan' ||
      selectedCategoryId === 'cat-investasi';

    const subs = budgetConfig?.subcategories || [];
    const candidateSubs = isTabungan ? subs.filter((s) => s.group === 'tabungan') : subs;

    const matched = matchTransactionToSubcategory(
      {
        categoryId: selectedCategoryId,
        note,
        budgetGroup: isTabungan ? 'tabungan' : chosenCat?.budgetGroup,
        expenseNature,
      },
      candidateSubs,
      {
        catName: chosenCat?.name,
        txGroup: isTabungan ? 'tabungan' : chosenCat?.budgetGroup,
        debts,
      }
    );

    if (matched) return matched;

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
  }, [type, selectedCategoryId, note, categories, budgetConfig?.subcategories, expenseNature, debts]);

  const subcategoryBudgetStatus = useMemo(() => {
    if (!matchingSubcategory || matchingSubcategory.allocatedAmount <= 0) return null;

    const subs = budgetConfig?.subcategories || [];
    let spentSoFar = 0;
    (transactions || []).forEach((tx) => {
      if (editingTransaction && tx.id === editingTransaction.transaction.id) return;
      if (tx.type !== 'expense') return;
      const d = parseLocalDay(tx.date);
      if (!isDateInBudgetPeriod(d, budgetPeriod)) return;

      const txCat = tx.categoryId ? categories.find((c) => c.id === tx.categoryId) : undefined;
      const txGroup =
        tx.expenseNature === 'savings' || tx.budgetGroup === 'tabungan'
          ? 'tabungan'
          : tx.budgetGroup || txCat?.budgetGroup || 'kebutuhan';

      const matchedForTx = matchTransactionToSubcategory(tx, subs, {
        catName: txCat?.name,
        txGroup,
        debts,
      });

      if (matchedForTx && matchedForTx.id === matchingSubcategory.id) {
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
  }, [matchingSubcategory, transactions, budgetPeriod, currentAmount, editingTransaction, categories, budgetConfig?.subcategories, debts]);

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

    const parts = (selectedDate || '').split('-').map(Number);
    let targetDate =
      parts.length === 3 && !parts.some((n) => Number.isNaN(n))
        ? new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0)
        : new Date();
    if (Number.isNaN(targetDate.getTime())) {
      targetDate = new Date();
    }
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
          : type === 'expense' && matchingSubcategory?.group
          ? matchingSubcategory.group
          : type === 'expense' && (expenseNature === 'grocery' || expenseNature === 'non_daily')
          ? chosenCat?.budgetGroup || 'kebutuhan'
          : chosenCat?.budgetGroup;

      const effectiveNote =
        note.trim() ||
        (type === 'expense' && chosenCat && !chosenCat.isDefault ? chosenCat.name : undefined);

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
          note: effectiveNote,
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
          note: effectiveNote,
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

    // Only mark the screenshot hash as processed AFTER the user confirms & saves the transaction!
    if (currentScreenshotFpRef.current) {
      markScreenshotProcessed(currentScreenshotFpRef.current);
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
    <div
      onPaste={handlePasteFromElement}
      onClick={() => {
        if (!isAnalyzingScreenshot && !detectedSourceApp && !amountStr) {
          tryUnlockAndReadScreenshot(false);
        }
      }}
      className="w-full max-w-lg landscape:max-w-xl max-h-[92vh] landscape:max-h-[96vh] flex flex-col bg-white dark:bg-[#11131E] rounded-t-3xl sm:rounded-3xl landscape:rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-white/10"
    >
      {/* Hidden Quick Screenshot Picker & Rich ContentEditable Paste Receiver for Android */}
      <input
        ref={quickFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleQuickFileChange}
        className="hidden"
      />
      <div
        ref={pasteCatcherRef}
        contentEditable
        suppressContentEditableWarning
        onPaste={handlePasteFromElement}
        onInput={(e) => {
          const el = e.currentTarget;
          const img = el.querySelector('img');
          if (img?.src) {
            const src = img.src;
            el.innerHTML = '';
            if (src.startsWith('data:image/')) {
              analyzeScreenshotInModal(src, 'image/jpeg');
            } else if (src.startsWith('blob:')) {
              fetch(src)
                .then((r) => r.blob())
                .then((blob) => {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const b64 = ev.target?.result as string;
                    if (b64) analyzeScreenshotInModal(b64, blob.type || 'image/jpeg');
                  };
                  reader.readAsDataURL(blob);
                })
                .catch(() => {});
            }
          } else {
            el.innerHTML = '';
          }
        }}
        className="sr-only"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-white/[0.08]">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-display text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
            {editingTransaction
              ? 'Edit Transaksi'
              : detectedSourceApp
              ? 'Konfirmasi Transaksi Screenshot'
              : 'Catat Transaksi'}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!editingTransaction && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  quickFileInputRef.current?.click();
                }}
                className="px-2.5 py-1 text-xs font-bold rounded-xl bg-slate-100 dark:bg-white/[0.07] text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Pilih Screenshot dari Galeri"
              >
                <FileImage size={13} />
                <span>Pilih SS</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddTransactionOpen(false);
                  openScanModal();
                }}
                className="px-2.5 py-1 text-xs font-bold rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1 hover:bg-teal-100 transition-colors cursor-pointer"
                title="Scan Struk / Bukti Transfer"
              >
                <Sparkles size={13} />
                <span>Scan AI</span>
              </button>
            </>
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
            onClick={(e) => {
              e.stopPropagation();
              setIsAddTransactionOpen(false);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X size={19} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-5 space-y-4 no-scrollbar">
        {/* AI Screenshot Analyzing Banner */}
        {isAnalyzingScreenshot && (
          <div className="p-3.5 rounded-2xl bg-teal-950/90 text-white border border-teal-500/40 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {screenshotPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={screenshotPreview}
                  alt="Screenshot"
                  className="w-11 h-11 rounded-xl object-cover border border-white/20 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-[#D4F826] animate-spin" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-[#D4F826]">
                    Mendeteksi Nominal & Keterangan Screenshot...
                  </span>
                </div>
                <p className="text-[11px] text-teal-100/90 truncate mt-0.5">
                  {screenshotStepText}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Screenshot Pre-filled Confirmation Banner (Shows Nominal AND Keterangan clearly!) */}
        {!isAnalyzingScreenshot && detectedSourceApp && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/70 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {screenshotPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={screenshotPreview}
                  alt="Screenshot"
                  className="w-11 h-11 rounded-xl object-cover border border-emerald-400/40 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                    {detectedSourceApp}
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 truncate">
                    Otomatis Terisi
                  </span>
                </div>
                {note && (
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    📝 {note}
                  </p>
                )}
                <p className="text-[11px] text-emerald-700 dark:text-emerald-200/80 mt-0.5">
                  Nominal & keterangan sudah dicatat. Tinggal tekan <strong>Konfirmasi</strong>!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1-Tap Android Screenshot Card (When returning from SeaBank/m-Banking without Share Target) */}
        {!editingTransaction &&
          !isAnalyzingScreenshot &&
          !detectedSourceApp &&
          (awaitingTouchUnlock || isPollingScreenshot) && (
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-[#D4F826]/40 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4F826] text-slate-950">
                    Ambil Screenshot Terakhir
                  </span>
                  <p className="text-[11px] text-slate-200 mt-1 leading-snug">
                    Android membatasi PWA membaca file Galeri secara diam-diam. Pilih salah satu cara 1-ketuk ini:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    tryUnlockAndReadScreenshot(true);
                  }}
                  className="py-2.5 px-3.5 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <FileImage size={14} strokeWidth={2.5} />
                  <span>Pilih SS Terakhir</span>
                </button>
              </div>

              {/* Visible Rich ContentEditable Box so Samsung Keyboard / Gboard shows the 1-tap Screenshot chip! */}
              <div
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-label="Tempel Screenshot dari Keyboard"
                onClick={(e) => e.stopPropagation()}
                onPaste={handlePasteFromElement}
                onInput={(e) => {
                  const el = e.currentTarget;
                  const img = el.querySelector('img');
                  if (img?.src) {
                    const src = img.src;
                    el.innerHTML = '';
                    if (src.startsWith('data:image/')) {
                      analyzeScreenshotInModal(src, 'image/jpeg');
                    } else if (src.startsWith('blob:')) {
                      fetch(src)
                        .then((r) => r.blob())
                        .then((blob) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const b64 = ev.target?.result as string;
                            if (b64) analyzeScreenshotInModal(b64, blob.type || 'image/jpeg');
                          };
                          reader.readAsDataURL(blob);
                        })
                        .catch(() => {});
                    }
                  } else {
                    el.innerHTML = '';
                  }
                }}
                data-placeholder="⌨️ Atau ketuk kotak ini lalu tap gambar SS di atas Keyboard HP..."
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 focus:border-[#D4F826] text-[11px] text-slate-200 focus:outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300"
              />

              <p className="text-[10px] text-teal-300/90 leading-snug">
                💡 <strong>Ingin 100% Otomatis Tanpa Pilih Gambar?</strong> Saat selesai ambil SS di SeaBank, langsung ketuk tombol <strong>Bagikan (Share) → Dompt.</strong> pada popup screenshot Android!
              </p>
            </div>
          )}

        {/* Screenshot Error Retry Banner */}
        {screenshotError && !isAnalyzingScreenshot && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 flex items-center justify-between gap-2 text-xs text-red-700 dark:text-red-300">
            <span className="font-semibold flex-1">{screenshotError}</span>
            {screenshotPreview && (
              <button
                type="button"
                onClick={() => analyzeScreenshotInModal(screenshotPreview, screenshotMime)}
                className="px-2.5 py-1.5 rounded-xl bg-red-600 text-white font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Coba Lagi</span>
              </button>
            )}
          </div>
        )}

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

        {/* Keterangan / Catatan & Tanggal (Placed right below Dompet so user immediately sees both Nominal & Keterangan!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Keterangan / Catatan
            </label>
            <input
              type="text"
              placeholder="Mis: Transfer SeaBank, makan siang"
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentAmount > 0) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              maxLength={60}
              className="w-full py-2.5 px-3 text-xs font-bold bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
            />
          </div>

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
        </div>

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
                      {c.emoji && !c.isDefault ? (
                        <span className="text-sm leading-none">{c.emoji}</span>
                      ) : (
                        <CategoryIcon iconKey={c.iconKey} size={15} />
                      )}
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
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.08] flex gap-2.5">
        <button
          type="button"
          onClick={() => setIsAddTransactionOpen(false)}
          className="flex-1 py-3 text-xs font-bold rounded-xl bg-slate-200/80 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={currentAmount <= 0 || isWalletInsufficient || isAnalyzingScreenshot}
          className="flex-2 py-3 text-xs font-extrabold rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black shadow-xs active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Check size={15} strokeWidth={2.8} />
          <span>
            {editingTransaction
              ? 'Simpan Perubahan'
              : detectedSourceApp
              ? 'Konfirmasi & Catat Transaksi'
              : 'Konfirmasi & Catat'}
          </span>
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
