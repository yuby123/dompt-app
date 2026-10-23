'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Clipboard,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Receipt,
  FileImage,
  RefreshCw,
  Share2,
  Clock,
  Tag,
  Wallet as WalletIcon,
  Trash2,
} from 'lucide-react';
import { useApp } from './AppContext';
import { formatRupiah } from '@/lib/formatters';
import { TransactionType } from '@/lib/types';
import { compressImageForOcr } from '@/lib/imageUtils';
import { detectExpenseNature } from '@/lib/budgetUtils';
import { readLatestImageFromClipboard } from './ClipboardScreenshotDetector';

interface ExtractedData {
  amount: number;
  type: TransactionType;
  title: string;
  sourceApp?: string;
  suggestedCategory?: string;
  suggestedWallet?: string;
  date?: string;
  time?: string;
  notes?: string;
}

const SAMPLE_RECEIPTS = [
  {
    name: 'QRIS DANA (Kopi Kenangan)',
    desc: 'Rp 42.500 • Kopi Kenangan Mall',
    type: 'expense' as TransactionType,
    amount: 42500,
    title: 'Kopi Kenangan Mall',
    suggestedCategory: 'Minuman',
    suggestedWallet: 'E-Wallet (DANA/GoPay)',
    sourceApp: 'DANA QRIS',
    notes: 'Pembayaran QRIS Kopi Kenangan Mall',
    date: new Date().toISOString().slice(0, 10),
    time: '14:25',
  },
  {
    name: 'm-BCA (Transfer ke Budi)',
    desc: 'Rp 175.000 • Transfer Rekening BCA',
    type: 'expense' as TransactionType,
    amount: 175000,
    title: 'Transfer ke Budi Santoso',
    suggestedCategory: 'Makanan',
    suggestedWallet: 'Rekening Bank',
    sourceApp: 'm-BCA',
    notes: 'Transfer m-BCA ke 5270192837 Budi Santoso',
    date: new Date().toISOString().slice(0, 10),
    time: '11:15',
  },
  {
    name: 'Struk Indomaret Kasir',
    desc: 'Rp 89.200 • Belanja Kebutuhan Harian',
    type: 'expense' as TransactionType,
    amount: 89200,
    title: 'Indomaret Point',
    suggestedCategory: 'Belanja Harian',
    suggestedWallet: 'Tunai',
    sourceApp: 'Struk Kasir Indomaret',
    notes: 'Struk Belanja Indomaret Point Kemang',
    date: new Date().toISOString().slice(0, 10),
    time: '19:40',
  },
];

export function ScanReceiptModal() {
  const {
    isScanModalOpen,
    setIsScanModalOpen,
    scanInitialImage,
    setScanInitialImage,
    wallets,
    walletsWithBalance,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    transferFunds,
    addToast: showToast,
  } = useApp();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('Membaca gambar dari clipboard...');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [autoSavedTxId, setAutoSavedTxId] = useState<string | null>(null);

  // Form override inputs for user confirmation / quick edit
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [customType, setCustomType] = useState<TransactionType>('expense');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Resolve best wallet & category from extracted receipt data
  const resolveWalletAndCategory = (data: ExtractedData) => {
    const query = `${data.suggestedWallet || ''} ${data.sourceApp || ''}`.toLowerCase();
    const matchedByName = walletsWithBalance.find((w) => {
      if (!query.trim()) return false;
      const wName = w.name.toLowerCase();
      return (
        wName.includes(query) ||
        query.includes(wName) ||
        (query.includes('seabank') && (wName.includes('rekening') || w.type === 'bank')) ||
        (query.includes('bca') && (wName.includes('bca') || w.type === 'bank')) ||
        (query.includes('mandiri') && (wName.includes('mandiri') || w.type === 'bank')) ||
        (query.includes('bri') && (wName.includes('bri') || w.type === 'bank')) ||
        (query.includes('bank') && w.type === 'bank') ||
        (query.includes('shopee') && (wName.includes('shopee') || wName.includes('ewallet') || w.type === 'ewallet')) ||
        (query.includes('dana') && (wName.includes('dana') || wName.includes('ewallet') || w.type === 'ewallet')) ||
        (query.includes('gopay') && (wName.includes('gopay') || wName.includes('ewallet') || w.type === 'ewallet')) ||
        (query.includes('ovo') && (wName.includes('ovo') || wName.includes('ewallet') || w.type === 'ewallet'))
      );
    });

    const isOutflow = data.type === 'expense' || data.type === 'transfer';
    let bestWallet = matchedByName;
    if (isOutflow && (!bestWallet || bestWallet.balance < data.amount)) {
      const fundedMatch = walletsWithBalance.find(
        (w) => w.type !== 'credit' && w.type !== 'paylater' && w.balance >= data.amount
      );
      if (fundedMatch) bestWallet = fundedMatch;
    }
    const resolvedWalletId = bestWallet?.id || walletsWithBalance[0]?.id || wallets[0]?.id || '';

    const targetCatType = data.type === 'income' ? 'income' : 'expense';
    const availableCats = categories.filter((c) => c.type === targetCatType);
    const matchCategory = availableCats.find((c) => {
      if (!data.suggestedCategory) return false;
      const s = data.suggestedCategory.toLowerCase();
      return c.name.toLowerCase().includes(s) || s.includes(c.name.toLowerCase());
    });
    const resolvedCategoryId = matchCategory ? matchCategory.id : availableCats[0]?.id || '';

    return { resolvedWalletId, resolvedCategoryId };
  };

  // Automatically save extracted transaction immediately after AI detection
  const autoSaveExtractedData = (
    data: ExtractedData,
    walletIdToUse: string,
    categoryIdToUse: string,
    noteToUse: string
  ) => {
    if (!data.amount || data.amount <= 0) return;

    const dateToUse = data.date ? new Date(data.date).toISOString() : new Date().toISOString();

    if (data.type === 'transfer') {
      const targetW = walletsWithBalance.find((w) => w.id !== walletIdToUse);
      const ok = transferFunds(
        walletIdToUse,
        targetW?.id || walletsWithBalance[1]?.id || wallets[1]?.id || '',
        data.amount,
        noteToUse.trim() || 'Transfer otomatis dari screenshot',
        dateToUse
      );
      if (ok) {
        setAutoSavedTxId('transfer-saved');
        showToast(
          'Otomatis Tercatat!',
          `${formatRupiah(data.amount)} (${data.sourceApp || 'Screenshot'}) langsung dicatat.`,
          'success'
        );
      }
      return;
    }

    const chosenCat = categories.find((c) => c.id === categoryIdToUse);
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const detectedNature =
      data.type === 'expense'
        ? detectExpenseNature(categoryIdToUse, noteToUse, catMap)
        : undefined;
    const effectiveBudgetGroup =
      data.type === 'expense'
        ? detectedNature === 'savings'
          ? 'tabungan'
          : chosenCat?.budgetGroup
        : undefined;

    const createdId = addTransaction({
      type: data.type,
      amount: data.amount,
      walletId: walletIdToUse,
      categoryId: categoryIdToUse || null,
      budgetGroup: effectiveBudgetGroup,
      expenseNature: detectedNature,
      transferWalletId: null,
      date: dateToUse,
      note: noteToUse.trim() || data.title || 'Transaksi dari screenshot',
    });

    if (createdId) {
      setAutoSavedTxId(createdId);
      showToast(
        'Nominal Otomatis Tercatat!',
        `${formatRupiah(data.amount)} • ${noteToUse.trim() || data.title || 'Screenshot'} berhasil masuk ke transaksi.`,
        'success'
      );
    }
  };

  // Analyze image with AI endpoint and immediately auto-record the transaction
  const analyzeImage = async (base64: string, type: string, shouldAutoSave = true) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAutoSavedTxId(null);
    setLoadingStep('AI sedang mendeteksi nominal & detail transaksi...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const step1 = setTimeout(() => {
      setLoadingStep('Mengekstrak nominal Rupiah & aplikasi pembayaran...');
    }, 1400);

    const step2 = setTimeout(() => {
      setLoadingStep('Mencatat otomatis ke dompet & kategori...');
    }, 3200);

    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: type,
        }),
        signal: controller.signal,
      });

      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(timeoutId);

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menganalisis gambar screenshot');
      }

      const data: ExtractedData = json.data;
      const noteStr = data.notes || data.title || '';
      const { resolvedWalletId, resolvedCategoryId } = resolveWalletAndCategory(data);

      setExtractedData(data);
      setCustomAmount(data.amount);
      setCustomType(data.type);
      setCustomNote(noteStr);
      setSelectedWalletId(resolvedWalletId);
      setSelectedCategoryId(resolvedCategoryId);

      // Automatically record the transaction right away as requested by user!
      if (shouldAutoSave && data.amount > 0) {
        autoSaveExtractedData(data, resolvedWalletId, resolvedCategoryId, noteStr);
      }
    } catch (err: any) {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(timeoutId);
      console.error(err);
      if (err.name === 'AbortError') {
        setErrorMsg('Waktu pemrosesan melebihi 20 detik (koneksi lambat). Silakan coba lagi.');
      } else {
        setErrorMsg(err?.message || 'Gagal menganalisis screenshot dengan AI');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Process a raw base64 screenshot and trigger AI + auto-save
  const processBase64Screenshot = async (rawBase64: string, rawMime: string, shouldAutoSave = true) => {
    setErrorMsg(null);
    setExtractedData(null);
    setAutoSavedTxId(null);
    setIsAnalyzing(true);
    setLoadingStep('Membaca screenshot terakhir dari clipboard...');

    try {
      const compressed = await compressImageForOcr(rawBase64, 1200, 0.82);
      setImagePreview(compressed.base64);
      setMimeType(compressed.mimeType);
      await analyzeImage(compressed.base64, compressed.mimeType, shouldAutoSave);
    } catch {
      setImagePreview(rawBase64);
      setMimeType(rawMime);
      await analyzeImage(rawBase64, rawMime, shouldAutoSave);
    }
  };

  // Handle file from picker or camera with auto-compression & auto-save
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Harap pilih file gambar (PNG, JPG, WEBP)');
      return;
    }

    setErrorMsg(null);
    setExtractedData(null);
    setAutoSavedTxId(null);
    setIsAnalyzing(true);
    setLoadingStep('Mengoptimalkan & membaca screenshot...');

    try {
      const compressed = await compressImageForOcr(file, 1200, 0.82);
      setImagePreview(compressed.base64);
      setMimeType(compressed.mimeType);
      await analyzeImage(compressed.base64, compressed.mimeType, true);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImagePreview(base64);
        setMimeType(file.type);
        analyzeImage(base64, file.type, true);
      };
      reader.readAsDataURL(file);
    }
  };

  // When modal opens:
  // 1) If scanInitialImage was passed (from ClipboardScreenshotDetector or Share Target), process it immediately.
  // 2) Otherwise, automatically read the latest image from navigator.clipboard right away without asking user to upload!
  useEffect(() => {
    if (!isScanModalOpen) return;

    let cancelled = false;
    const runInitialDetection = async () => {
      if (scanInitialImage?.base64) {
        const initial = scanInitialImage;
        setScanInitialImage(null);
        await processBase64Screenshot(initial.base64, initial.mimeType, initial.autoSave !== false);
        return;
      }

      // If no initial image was passed and no preview is active, automatically check clipboard!
      if (!imagePreview && !extractedData && !isAnalyzing) {
        const clipImg = await readLatestImageFromClipboard();
        if (!cancelled && clipImg?.base64) {
          await processBase64Screenshot(clipImg.base64, clipImg.mimeType, true);
        }
      }
    };

    runInitialDetection();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanModalOpen, scanInitialImage]);

  // Window paste listener when modal is open
  useEffect(() => {
    if (!isScanModalOpen) return;

    const handleWindowPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanModalOpen]);

  // Direct clipboard button handler
  const handleClipboardPasteButton = async () => {
    const clipImg = await readLatestImageFromClipboard();
    if (clipImg?.base64) {
      await processBase64Screenshot(clipImg.base64, clipImg.mimeType, true);
      return;
    }
    showToast(
      'Clipboard Kosong / Perlu Izin',
      'Salin screenshot terlebih dahulu atau tempel (Paste) gambar di sini.',
      'info'
    );
  };

  // Handle test sample click (also auto-records immediately)
  const handleSelectSample = (sample: (typeof SAMPLE_RECEIPTS)[0]) => {
    setErrorMsg(null);
    const { resolvedWalletId, resolvedCategoryId } = resolveWalletAndCategory(sample);
    setExtractedData(sample);
    setCustomAmount(sample.amount);
    setCustomType(sample.type);
    setCustomNote(sample.notes);
    setSelectedWalletId(resolvedWalletId);
    setSelectedCategoryId(resolvedCategoryId);
    autoSaveExtractedData(sample, resolvedWalletId, resolvedCategoryId, sample.notes);
  };

  // Save or update extracted transaction
  const handleSaveTransaction = () => {
    const finalAmount = customAmount || extractedData?.amount || 0;
    if (finalAmount <= 0) return;

    const dateToUse = extractedData?.date
      ? new Date(extractedData.date).toISOString()
      : new Date().toISOString();

    const chosenCat = categories.find((c) => c.id === selectedCategoryId);
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const detectedNature =
      customType === 'expense'
        ? detectExpenseNature(selectedCategoryId, customNote, catMap)
        : undefined;
    const effectiveBudgetGroup =
      customType === 'expense'
        ? detectedNature === 'savings'
          ? 'tabungan'
          : chosenCat?.budgetGroup
        : undefined;

    // If already auto-saved, update the existing transaction if edited, and close
    if (autoSavedTxId && autoSavedTxId !== 'transfer-saved') {
      updateTransaction(autoSavedTxId, {
        type: customType,
        amount: finalAmount,
        walletId: selectedWalletId || walletsWithBalance[0]?.id || wallets[0]?.id || '',
        categoryId: selectedCategoryId || null,
        budgetGroup: effectiveBudgetGroup,
        expenseNature: detectedNature,
        note: customNote.trim() || undefined,
      });
      handleClose();
      return;
    }

    if (autoSavedTxId === 'transfer-saved') {
      handleClose();
      return;
    }

    if (customType === 'transfer') {
      const targetW = walletsWithBalance.find((w) => w.id !== selectedWalletId);
      const ok = transferFunds(
        selectedWalletId || walletsWithBalance[0]?.id || wallets[0]?.id || '',
        targetW?.id || walletsWithBalance[1]?.id || wallets[1]?.id || '',
        finalAmount,
        customNote.trim() || 'Transfer dari screenshot',
        dateToUse
      );
      if (!ok) return;
    } else {
      const createdId = addTransaction({
        type: customType,
        amount: finalAmount,
        walletId: selectedWalletId || walletsWithBalance[0]?.id || wallets[0]?.id || '',
        categoryId: selectedCategoryId || null,
        budgetGroup: effectiveBudgetGroup,
        expenseNature: detectedNature,
        transferWalletId: null,
        date: dateToUse,
        note: customNote.trim() || undefined,
      });
      if (!createdId) return;
    }

    showToast(
      'Transaksi Berhasil Dicatat!',
      `${formatRupiah(finalAmount)} dari ${extractedData?.sourceApp || 'screenshot'} tersimpan`,
      'success'
    );
    handleClose();
  };

  const handleUndoAutoSave = () => {
    if (autoSavedTxId && autoSavedTxId !== 'transfer-saved') {
      deleteTransaction(autoSavedTxId);
    }
    setAutoSavedTxId(null);
    setImagePreview(null);
    setExtractedData(null);
    handleClose();
  };

  const handleClose = () => {
    setIsScanModalOpen(false);
    setImagePreview(null);
    setExtractedData(null);
    setErrorMsg(null);
    setShowGuide(false);
    setAutoSavedTxId(null);
  };

  if (!isScanModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center landscape:items-center justify-center p-0 sm:p-4 landscape:p-3 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-lg landscape:max-w-2xl max-h-[92vh] landscape:max-h-[96vh] flex flex-col bg-white dark:bg-[#111827] rounded-t-3xl sm:rounded-3xl landscape:rounded-3xl shadow-2xl overflow-hidden border border-black/5 dark:border-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 dark:text-gray-100">
                Auto-Deteksi Screenshot
              </h2>
              {autoSavedTxId && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  <span>Tercatat Otomatis</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-5 space-y-4 no-scrollbar">
            {/* Guide Info Banner */}
            {showGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-100 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                    <Share2 size={15} />
                    <span>Cara Kerja Auto-Deteksi & Catat Otomatis</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowGuide(false)}
                    className="text-teal-600 hover:underline font-bold"
                  >
                    Tutup
                  </button>
                </div>
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <p>
                    1. <strong>Dari Clipboard Terakhir:</strong> Begitu Anda screenshot bukti pembayaran dan kembali ke aplikasi, gambar di clipboard otomatis dibaca dan nominalnya langsung dicatat ke transaksi.
                  </p>
                  <p>
                    2. <strong>Bagikan (Share) ke Dompt:</strong> Dari popup hasil screenshot HP, pilih <strong>Bagikan ➔ Dompt.</strong> untuk langsung mencatat nominal tanpa buka galeri.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Upload & Paste Selection Area (only shown if clipboard was empty) */}
            {!imagePreview && !isAnalyzing && !extractedData && (
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 text-center space-y-4 bg-gray-50/50 dark:bg-gray-800/20">
                  <div className="w-13 h-13 rounded-2xl bg-[#D4F826]/20 border border-[#D4F826]/30 text-gray-900 dark:text-[#D4F826] flex items-center justify-center mx-auto shadow-xs">
                    <Clipboard size={26} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      Deteksi dari Clipboard Gambar Terakhir
                    </h4>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-1">
                      Ketuk tombol di bawah untuk langsung membaca screenshot terakhir dari clipboard HP Anda & mencatat nominalnya otomatis.
                    </p>
                  </div>

                  {/* Primary Action: Read Clipboard Directly */}
                  <div className="space-y-2 max-w-md mx-auto">
                    <button
                      type="button"
                      onClick={handleClipboardPasteButton}
                      className="w-full py-3.5 px-4 bg-[#D4F826] hover:bg-[#c6ec15] text-black font-black text-xs rounded-2xl shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Clipboard size={16} strokeWidth={2.5} />
                      <span>Deteksi dari Clipboard Sekarang</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2.5 px-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-2xl transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FileImage size={14} strokeWidth={2.3} />
                        <span>Dari Galeri</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="py-2.5 px-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-2xl transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Camera size={14} strokeWidth={2.3} />
                        <span>Foto Struk</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                  className="hidden"
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                  className="hidden"
                />

                {/* Instant Demo Samples */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Atau Tes Auto-Catat Langsung:
                    </span>
                    <span className="text-[10px] text-teal-600 font-semibold">Auto-Simpan</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {SAMPLE_RECEIPTS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSample(s)}
                        className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-teal-50 dark:hover:bg-teal-950/30 border border-gray-200/80 dark:border-gray-800 text-left flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center shrink-0 text-teal-600">
                            <Receipt size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-teal-600 truncate">
                              {s.name}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">{s.desc}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 shrink-0 flex items-center gap-0.5">
                          <span>Catat</span>
                          <ArrowRight size={12} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Image Preview & Scanning Laser Animation */}
            {imagePreview && (
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 max-h-48 flex items-center justify-center border border-gray-200 dark:border-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Bukti transaksi"
                  className="max-h-48 w-auto object-contain"
                />

                {isAnalyzing && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                      initial={{ top: '0%' }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-0 right-0 h-1 bg-linear-to-r from-teal-400 via-emerald-300 to-teal-400 shadow-[0_0_15px_#2dd4bf]"
                    />
                    <div className="absolute inset-0 bg-teal-500/10 backdrop-brightness-110" />
                  </div>
                )}
              </div>
            )}

            {/* Analyzing State */}
            {isAnalyzing && (
              <div className="py-6 text-center space-y-3">
                <div className="relative w-14 h-14 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 animate-ping" />
                  <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg">
                    <Sparkles size={26} className="animate-spin" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                    {loadingStep}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                    Nominal transaksi akan langsung dicatat otomatis begitu selesai dibaca.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={20} className="shrink-0" />
                <span className="flex-1 font-medium">{errorMsg}</span>
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setErrorMsg(null);
                  }}
                  className="text-xs underline font-bold"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {/* Result Extracted Hero & Auto-Saved Confirmation */}
            {extractedData && (
              <div className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 p-4 rounded-3xl text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white bg-emerald-600 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      <span>
                        {autoSavedTxId
                          ? 'Nominal Langsung Tercatat!'
                          : extractedData.sourceApp || 'Terdeteksi Otomatis'}
                      </span>
                    </span>
                    {extractedData.time && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                        <Clock size={11} />
                        <span>{extractedData.time}</span>
                      </span>
                    )}
                  </div>

                  <div className="text-3xl font-black text-emerald-800 dark:text-emerald-300 tabular-nums pt-0.5">
                    {formatRupiah(customAmount || extractedData.amount)}
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        customType === 'expense'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          : customType === 'income'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {customType === 'expense'
                        ? 'Pengeluaran'
                        : customType === 'income'
                        ? 'Pemasukan'
                        : 'Transfer'}
                    </span>
                    {extractedData.title && (
                      <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold truncate max-w-[200px]">
                        • {extractedData.title}
                      </span>
                    )}
                  </div>
                </div>

                {/* Form Matching Details (User can optionally adjust wallet/category) */}
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs">
                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1">
                      <WalletIcon size={14} className="text-teal-600" />
                      <span>Dompet / Rekening:</span>
                    </label>
                    <select
                      value={selectedWalletId}
                      onChange={(e) => setSelectedWalletId(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500"
                    >
                      {walletsWithBalance.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatRupiah(w.balance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {customType !== 'transfer' && (
                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1">
                        <Tag size={14} className="text-teal-600" />
                        <span>Kategori Transaksi:</span>
                      </label>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500"
                      >
                        {categories
                          .filter((c) => c.type === customType)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.groupName})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Keterangan / Catatan:
                    </label>
                    <input
                      type="text"
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder="Keterangan transaksi..."
                      className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex gap-2.5">
                  {autoSavedTxId ? (
                    <>
                      <button
                        type="button"
                        onClick={handleUndoAutoSave}
                        className="px-3.5 py-3 text-xs font-bold rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Batalkan catatan otomatis ini"
                      >
                        <Trash2 size={14} />
                        <span>Batalkan</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveTransaction}
                        className="flex-1 py-3 text-xs font-black rounded-2xl bg-[#0F766E] hover:bg-teal-700 text-white shadow-md active:scale-98 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 size={16} />
                        <span>Selesai (Sudah Tercatat)</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setExtractedData(null);
                        }}
                        className="p-3 text-xs font-semibold rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw size={14} />
                        <span>Ulangi</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveTransaction}
                        className="flex-1 py-3 text-xs font-black rounded-2xl bg-[#0F766E] hover:bg-teal-700 text-white shadow-md active:scale-98 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 size={16} />
                        <span>Simpan ke Transaksi Sekarang</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
