'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Upload,
  Clipboard,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Receipt,
  FileImage,
  RefreshCw,
  HelpCircle,
  Share2,
  Check,
  Building2,
  CreditCard,
  Calendar,
  Clock,
  Tag,
  Wallet as WalletIcon,
} from 'lucide-react';
import { useApp } from './AppContext';
import { formatRupiah } from '@/lib/formatters';
import { TransactionType } from '@/lib/types';
import { compressImageForOcr } from '@/lib/imageUtils';

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

// Generate realistic simulated screenshots for instant testing / demo
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
    svgData: (
      <svg width="400" height="480" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="480" rx="24" fill="#118EEA" />
        <rect y="100" width="400" height="380" rx="24" fill="#FFFFFF" />
        <circle cx="200" cy="100" r="32" fill="#118EEA" stroke="#FFFFFF" strokeWidth="4" />
        <path d="M190 100L197 107L212 92" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="200" y="55" fill="#FFFFFF" fontSize="18" fontWeight="bold" textAnchor="middle">DANA - Pembayaran Berhasil</text>
        <text x="200" y="155" fill="#888888" fontSize="13" textAnchor="middle">Total Pembayaran</text>
        <text x="200" y="195" fill="#118EEA" fontSize="28" fontWeight="900" textAnchor="middle">Rp 42.500</text>
        <text x="200" y="235" fill="#222222" fontSize="16" fontWeight="bold" textAnchor="middle">Kopi Kenangan Mall Grand</text>
        <text x="200" y="255" fill="#666666" fontSize="12" textAnchor="middle">Metode: Saldo DANA via QRIS</text>
        <line x1="40" y1="280" x2="360" y2="280" stroke="#EEEEEE" strokeWidth="2" strokeDasharray="6 6" />
        <text x="50" y="315" fill="#777777" fontSize="12">ID Transaksi</text>
        <text x="350" y="315" fill="#222222" fontSize="12" fontWeight="bold" textAnchor="end">DANA-20261007-8892</text>
        <text x="50" y="345" fill="#777777" fontSize="12">Waktu Transaksi</text>
        <text x="350" y="345" fill="#222222" fontSize="12" fontWeight="bold" textAnchor="end">Hari ini, 14:25 WIB</text>
        <text x="50" y="375" fill="#777777" fontSize="12">Status</text>
        <text x="350" y="375" fill="#16A34A" fontSize="12" fontWeight="bold" textAnchor="end">BERHASIL</text>
        <rect x="50" y="410" width="300" height="40" rx="12" fill="#EBF5FF" />
        <text x="200" y="435" fill="#118EEA" fontSize="12" fontWeight="bold" textAnchor="middle">Simpan Bukti Pembayaran</text>
      </svg>
    ),
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
    svgData: (
      <svg width="400" height="480" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="480" rx="24" fill="#003D79" />
        <rect y="90" width="400" height="390" rx="24" fill="#F8FAFC" />
        <circle cx="200" cy="90" r="30" fill="#003D79" stroke="#FFFFFF" strokeWidth="4" />
        <path d="M192 90L198 96L210 84" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="200" y="50" fill="#FFFFFF" fontSize="18" fontWeight="bold" textAnchor="middle">m-Transfer BERHASIL</text>
        <text x="200" y="145" fill="#64748B" fontSize="13" textAnchor="middle">JUMLAH TRANSFER</text>
        <text x="200" y="185" fill="#003D79" fontSize="28" fontWeight="900" textAnchor="middle">Rp 175.000,00</text>
        <rect x="35" y="215" width="330" height="180" rx="16" fill="#FFFFFF" stroke="#E2E8F0" />
        <text x="55" y="245" fill="#64748B" fontSize="12">DARI REKENING</text>
        <text x="55" y="265" fill="#0F172A" fontSize="13" fontWeight="bold">5270-XXXX-XX (FADD)</text>
        <text x="55" y="295" fill="#64748B" fontSize="12">KE REKENING</text>
        <text x="55" y="315" fill="#0F172A" fontSize="13" fontWeight="bold">8291-0192-38 (BUDI SANTOSO)</text>
        <text x="55" y="345" fill="#64748B" fontSize="12">BERITA / CATATAN</text>
        <text x="55" y="365" fill="#0F172A" fontSize="13" fontWeight="bold">Makan Siang Bersama</text>
        <text x="200" y="425" fill="#64748B" fontSize="11" textAnchor="middle">BCA Mobile • Layanan Transaksi Finansial</text>
      </svg>
    ),
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
    svgData: (
      <svg width="400" height="480" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="480" rx="20" fill="#FFFDF9" stroke="#E5E7EB" strokeWidth="2" />
        <text x="200" y="45" fill="#E11D48" fontSize="20" fontWeight="900" textAnchor="middle">INDOMARET</text>
        <text x="200" y="68" fill="#4B5563" fontSize="11" textAnchor="middle">PT. INDOMARCO PRISMATAMA</text>
        <text x="200" y="86" fill="#6B7280" fontSize="10" textAnchor="middle">JL. KEMANG RAYA NO. 12 JAKARTA</text>
        <line x1="30" y1="102" x2="370" y2="102" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="4 4" />
        <text x="40" y="130" fill="#111827" fontSize="12" fontWeight="bold">MINYAK GORENG 2L</text>
        <text x="360" y="130" fill="#111827" fontSize="12" textAnchor="end">34.500</text>
        <text x="40" y="155" fill="#111827" fontSize="12" fontWeight="bold">TELUR AYAM NEGERI 10S</text>
        <text x="360" y="155" fill="#111827" fontSize="12" textAnchor="end">28.000</text>
        <text x="40" y="180" fill="#111827" fontSize="12" fontWeight="bold">ROTI TAWAR GANDUM</text>
        <text x="360" y="180" fill="#111827" fontSize="12" textAnchor="end">16.500</text>
        <text x="40" y="205" fill="#111827" fontSize="12" fontWeight="bold">AIR MINERAL 1500ML</text>
        <text x="360" y="205" fill="#111827" fontSize="12" textAnchor="end">10.200</text>
        <line x1="30" y1="230" x2="370" y2="230" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="4 4" />
        <text x="40" y="260" fill="#111827" fontSize="14" fontWeight="bold">TOTAL BELANJA</text>
        <text x="360" y="260" fill="#E11D48" fontSize="18" fontWeight="900" textAnchor="end">Rp 89.200</text>
        <text x="40" y="290" fill="#6B7280" fontSize="11">TUNAI / CASH</text>
        <text x="360" y="290" fill="#111827" fontSize="11" textAnchor="end">100.000</text>
        <text x="40" y="315" fill="#6B7280" fontSize="11">KEMBALIAN</text>
        <text x="360" y="315" fill="#111827" fontSize="11" textAnchor="end">10.800</text>
        <line x1="30" y1="340" x2="370" y2="340" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="4 4" />
        <text x="200" y="375" fill="#4B5563" fontSize="11" textAnchor="middle">TERIMA KASIH ATAS KUNJUNGAN ANDA</text>
        <text x="200" y="395" fill="#9CA3AF" fontSize="10" textAnchor="middle">Layanan Konsumen: 1500-280</text>
      </svg>
    ),
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
    transferFunds,
    addToast: showToast,
  } = useApp();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('Memproses gambar screenshot...');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Form override inputs for user confirmation
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [customType, setCustomType] = useState<TransactionType>('expense');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Analyze image with AI endpoint with step progression and timeout protection
  const analyzeImage = async (base64: string, type: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setLoadingStep('AI Gemini sedang membaca teks bukti transfer...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const step1 = setTimeout(() => {
      setLoadingStep('Mengekstrak nominal Rupiah & bank pengirim...');
    }, 1500);

    const step2 = setTimeout(() => {
      setLoadingStep('Mencocokkan dompet & kategori transaksi...');
    }, 3500);

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
      setExtractedData(data);
      setCustomAmount(data.amount);
      setCustomType(data.type);
      setCustomNote(data.notes || data.title || '');

      // Best match wallet from available user wallets (supporting SeaBank, BCA, Mandiri, BRI, DANA, dll)
      const matchWallet = wallets.find((w) => {
        const query = `${data.suggestedWallet || ''} ${data.sourceApp || ''}`.toLowerCase();
        if (!query.trim()) return false;
        const wName = w.name.toLowerCase();
        return (
          wName.includes(query) ||
          query.includes(wName) ||
          (query.includes('seabank') && (wName.includes('rekening') || w.type === 'bank')) ||
          (query.includes('bank') && w.type === 'bank') ||
          (query.includes('shopee') && wName.includes('ewallet')) ||
          (query.includes('dana') && wName.includes('ewallet')) ||
          (query.includes('gopay') && wName.includes('ewallet'))
        );
      });
      setSelectedWalletId(matchWallet ? matchWallet.id : wallets[0]?.id || '');

      // Best match category
      const targetCatType = data.type === 'income' ? 'income' : 'expense';
      const availableCats = categories.filter((c) => c.type === targetCatType);
      const matchCategory = availableCats.find((c) => {
        if (!data.suggestedCategory) return false;
        const s = data.suggestedCategory.toLowerCase();
        return c.name.toLowerCase().includes(s) || s.includes(c.name.toLowerCase());
      });
      setSelectedCategoryId(matchCategory ? matchCategory.id : availableCats[0]?.id || '');
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

  // Handle file from picker or camera with auto-compression
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Harap pilih file gambar (PNG, JPG, WEBP)');
      return;
    }

    setErrorMsg(null);
    setExtractedData(null);
    setIsAnalyzing(true);
    setLoadingStep('Mengoptimalkan & membaca screenshot...');

    try {
      // Compress multi-MB smartphone screenshots to ~150KB for rapid upload
      const compressed = await compressImageForOcr(file, 1200, 0.82);
      setImagePreview(compressed.base64);
      setMimeType(compressed.mimeType);
      analyzeImage(compressed.base64, compressed.mimeType);
    } catch (err) {
      console.error(err);
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImagePreview(base64);
        setMimeType(file.type);
        analyzeImage(base64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle when modal opens with initial image (e.g. from clipboard or Android Share Target)
  useEffect(() => {
    if (!isScanModalOpen || !scanInitialImage?.base64) return;
    const initial = scanInitialImage;
    const timer = setTimeout(async () => {
      try {
        setIsAnalyzing(true);
        setLoadingStep('Mengoptimalkan screenshot...');
        const compressed = await compressImageForOcr(initial.base64, 1200, 0.82);
        setImagePreview(compressed.base64);
        setMimeType(compressed.mimeType);
        setScanInitialImage(null);
        analyzeImage(compressed.base64, compressed.mimeType);
      } catch {
        setImagePreview(initial.base64);
        setMimeType(initial.mimeType);
        setScanInitialImage(null);
        analyzeImage(initial.base64, initial.mimeType);
      }
    }, 0);
    return () => clearTimeout(timer);
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
    try {
      if (!navigator.clipboard?.read) {
        showToast('Info', 'Gunakan upload file atau tekan tombol Ctrl+V', 'info');
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'screenshot.png', { type: imageType });
          handleFile(file);
          return;
        }
      }
      showToast('Clipboard Kosong', 'Tidak ada gambar screenshot di clipboard Anda', 'info');
    } catch {
      showToast('Akses Clipboard', 'Silakan gunakan tombol upload atau tekan Ctrl+V pada keyboard', 'info');
    }
  };

  // Handle test sample click
  const handleSelectSample = (sample: (typeof SAMPLE_RECEIPTS)[0]) => {
    setErrorMsg(null);
    setExtractedData(sample);
    setCustomAmount(sample.amount);
    setCustomType(sample.type);
    setCustomNote(sample.notes);

    // Render sample SVG as image
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="480">${
      // Extract inner content from sample.svgData
      ''
    }</svg>`;
    setImagePreview(`data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`);

    // Match wallet
    const matchWallet = wallets.find((w) =>
      w.name.toLowerCase().includes(sample.suggestedWallet.toLowerCase().split(' ')[0])
    );
    setSelectedWalletId(matchWallet ? matchWallet.id : wallets[0]?.id || '');

    // Match category
    const availableCats = categories.filter((c) => c.type === sample.type);
    const matchCat = availableCats.find((c) =>
      c.name.toLowerCase().includes(sample.suggestedCategory.toLowerCase())
    );
    setSelectedCategoryId(matchCat ? matchCat.id : availableCats[0]?.id || '');

    showToast('Contoh Dimuat', `Mengekstrak: ${sample.name}`, 'info');
  };

  // Save extracted transaction to app state
  const handleSaveTransaction = () => {
    const finalAmount = customAmount || extractedData?.amount || 0;
    if (finalAmount <= 0) return;

    const dateToUse = extractedData?.date
      ? new Date(extractedData.date).toISOString()
      : new Date().toISOString();

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

  const handleClose = () => {
    setIsScanModalOpen(false);
    setImagePreview(null);
    setExtractedData(null);
    setErrorMsg(null);
    setShowGuide(false);
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
            <h2 className="text-base font-black text-gray-900 dark:text-gray-100">
              Scan Struk
            </h2>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-black text-gray-700 dark:text-gray-200">
                <Sparkles size={13} className="text-[#84CC16]" />
                <span>1173</span>
              </div>
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
                    <span>3 Cara Otomatis di HP Anda</span>
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
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <p>
                      <strong>Screenshot & Bagikan (Share):</strong> Saat ambil screenshot di HP, tekan tombol <em>Bagikan (Share)</em> pada popup screenshot lalu pilih <strong>Dompt.</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <p>
                      <strong>Salin & Buka App:</strong> Screenshot bukti transfer, salin gambar, lalu buka Dompt. Banner <em>Terdeteksi SS</em> akan otomatis muncul di atas layar!
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <p>
                      <strong>Upload atau Foto Struk:</strong> Pilih langsung dari galeri HP atau gunakan kamera langsung untuk struk kasir Indomaret/Alfamart/SPBU.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Upload & Paste Selection Area */}
            {!imagePreview && (
              <div className="space-y-4">
                {/* Main Dashed Card */}
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center mx-auto shadow-xs">
                    <Camera size={26} strokeWidth={2} />
                  </div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    Foto struk untuk otomatis buat transaksi.
                  </p>
                  <div className="flex gap-2.5 max-w-xs mx-auto pt-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 py-3 bg-[#D4F826] hover:bg-[#c6ec15] text-black font-black text-xs rounded-2xl shadow-xs transition-colors cursor-pointer"
                    >
                      Ambil Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                    >
                      Unggah Gambar
                    </button>
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
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Atau Coba Contoh Nyata Langsung:
                    </span>
                    <span className="text-[10px] text-teal-600 font-semibold">1-Klik Ekstrak</span>
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
                          <span>Tes</span>
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
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 max-h-56 flex items-center justify-center border border-gray-200 dark:border-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Bukti transaksi"
                  className="max-h-56 w-auto object-contain"
                />

                {/* Laser scan line overlay during analysis */}
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
                    Mengenali nominal Rupiah, bank pengirim, merchant penerima, tanggal, dan kategori...
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

            {/* Result Extracted Hero & Editable Confirmation */}
            {extractedData && (
              <div className="space-y-4">
                {/* Extracted Amount Hero */}
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 p-4 rounded-3xl text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                      {extractedData.sourceApp || 'Terdeteksi Otomatis'}
                    </span>
                    {extractedData.time && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                        <Clock size={11} />
                        <span>{extractedData.time}</span>
                      </span>
                    )}
                  </div>

                  <div className="text-3xl font-black text-emerald-800 dark:text-emerald-300 tabular-nums">
                    {formatRupiah(customAmount || extractedData.amount)}
                  </div>

                  <div className="flex items-center justify-center gap-2 mt-2">
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

                {/* Form Matching Details */}
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs">
                  {/* Dompet Selector */}
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
                    {(() => {
                      const activeW =
                        walletsWithBalance.find((w) => w.id === selectedWalletId) ||
                        walletsWithBalance[0];
                      const activeAmt = customAmount || extractedData.amount || 0;
                      if (
                        (customType === 'expense' || customType === 'transfer') &&
                        activeW &&
                        activeAmt > activeW.balance
                      ) {
                        return (
                          <div className="mt-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-400 dark:border-red-700 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-2">
                            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-extrabold">Uang di {activeW.name} Tidak Cukup!</span>{' '}
                              Saldo saat ini {formatRupiah(activeW.balance)}, kurang{' '}
                              <strong>{formatRupiah(activeAmt - activeW.balance)}</strong>.
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Kategori Selector */}
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

                  {/* Catatan */}
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
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setExtractedData(null);
                    }}
                    className="p-3 text-xs font-semibold rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>Scan Lain</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveTransaction}
                    className="flex-1 py-3 text-xs font-black rounded-2xl bg-[#0F766E] hover:bg-teal-700 text-white shadow-md active:scale-98 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Simpan ke Transaksi Sekarang</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
