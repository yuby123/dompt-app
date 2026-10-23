'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ArrowRight, Camera, Image as ImageIcon, Zap, CheckCircle2 } from 'lucide-react';
import { useApp } from './AppContext';

export function ClipboardScreenshotDetector() {
  const { openScanModal, isScanModalOpen, addToast } = useApp();
  const [detectedClipboardImage, setDetectedClipboardImage] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);
  const [showRecentReturnBanner, setShowRecentReturnBanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const lastProcessedRef = useRef<string>('');
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null);
  const blurTimestampRef = useRef<number>(0);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Immediately consume any screenshot shared via PWA Web Share Target or ?scan=auto
  useEffect(() => {
    const processSharedScreenshot = () => {
      if (typeof window === 'undefined') return;

      try {
        const sharedImage =
          sessionStorage.getItem('dompt_shared_image') ||
          localStorage.getItem('dompt_pending_screenshot');
        const sharedMime =
          sessionStorage.getItem('dompt_shared_mime') ||
          localStorage.getItem('dompt_pending_mime') ||
          'image/jpeg';

        if (sharedImage) {
          // Clear flags immediately to avoid re-triggering
          sessionStorage.removeItem('dompt_shared_image');
          sessionStorage.removeItem('dompt_shared_mime');
          localStorage.removeItem('dompt_pending_screenshot');
          localStorage.removeItem('dompt_pending_mime');
          localStorage.removeItem('dompt_pending_time');

          if (window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }

          lastProcessedRef.current = sharedImage;
          openScanModal(sharedImage, sharedMime);
          return true;
        }

        // Also check URL search params for ?scan=auto or ?scan=open
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('scan') === 'auto' || urlParams.get('scan') === 'open') {
          window.history.replaceState({}, document.title, window.location.pathname);
          openScanModal();
          return true;
        }
      } catch (err) {
        console.error('Error processing shared screenshot:', err);
      }
      return false;
    };

    // Run on initial mount
    const handled = processSharedScreenshot();
    if (handled) return;

    // Also listen to pageshow and focus
    const handleWindowFocusOrShow = () => {
      processSharedScreenshot();
    };

    window.addEventListener('pageshow', handleWindowFocusOrShow);
    window.addEventListener('focus', handleWindowFocusOrShow);

    return () => {
      window.removeEventListener('pageshow', handleWindowFocusOrShow);
      window.removeEventListener('focus', handleWindowFocusOrShow);
    };
  }, [openScanModal]);

  // 2. Passive check clipboard for images (works on desktop and when permission was already granted)
  const tryPassiveClipboardRead = useCallback(async () => {
    if (isScanModalOpen || typeof navigator === 'undefined' || !navigator.clipboard?.read) return;

    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = e.target?.result as string;
            if (base64 && base64 !== lastProcessedRef.current) {
              setDetectedClipboardImage({ base64, mimeType: imageType });
            }
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    } catch {
      // Permission required or user gesture needed on mobile browsers — handled gracefully via the Return Banner
    }
  }, [isScanModalOpen]);

  // 3. Monitor app switching (e.g. user went to GoPay/BCA, took a screenshot, then returned to Dompt PWA)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        blurTimestampRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const timeAway = Date.now() - blurTimestampRef.current;
        // If user was away for > 1.5 seconds, they might have just taken a screenshot in an e-wallet
        if (blurTimestampRef.current > 0 && timeAway > 1500 && !isScanModalOpen) {
          // Attempt passive clipboard read first
          tryPassiveClipboardRead();

          // Also trigger the smart return banner on mobile
          setShowRecentReturnBanner(true);

          if (autoDismissTimerRef.current) {
            clearTimeout(autoDismissTimerRef.current);
          }
          autoDismissTimerRef.current = setTimeout(() => {
            setShowRecentReturnBanner(false);
          }, 14000);
        }
      }
    };

    const handleFocus = () => {
      tryPassiveClipboardRead();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, [isScanModalOpen]);

  // 4. Global window paste listener (Ctrl+V on desktop or paste on mobile inputs)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isScanModalOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              if (base64) {
                lastProcessedRef.current = base64;
                openScanModal(base64, blob.type);
                setDetectedClipboardImage(null);
                setShowRecentReturnBanner(false);
              }
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isScanModalOpen, openScanModal]);

  // Handle hidden file input selection
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Format Tidak Didukung', 'Pilih file gambar screenshot (PNG/JPG)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      if (base64) {
        lastProcessedRef.current = base64;
        openScanModal(base64, file.type);
        setDetectedClipboardImage(null);
        setShowRecentReturnBanner(false);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so same file can be reselected if needed
    e.target.value = '';
  };

  // 1-Tap Auto Detect Action (invoked directly from user tap/click gesture)
  const handleAutoDetectClick = async () => {
    setIsProcessing(true);

    // 1. Try reading directly from clipboard with this active user gesture
    if (typeof navigator !== 'undefined' && navigator.clipboard?.read) {
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imgType = item.types.find((t) => t.startsWith('image/'));
          if (imgType) {
            const blob = await item.getType(imgType);
            const reader = new FileReader();
            reader.onload = (ev) => {
              const base64 = ev.target?.result as string;
              if (base64) {
                lastProcessedRef.current = base64;
                openScanModal(base64, imgType);
                setDetectedClipboardImage(null);
                setShowRecentReturnBanner(false);
                setIsProcessing(false);
              }
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      } catch {
        // Clipboard read was not permitted or contained no image
      }
    }

    // 2. If no image found in clipboard, immediately open the mobile photo selector
    // On Android and iOS, this instantly opens the "Recent Screenshots" gallery
    setIsProcessing(false);
    setShowRecentReturnBanner(false);
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.click();
    }
  };

  const handleOpenGallery = () => {
    setShowRecentReturnBanner(false);
    setDetectedClipboardImage(null);
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.click();
    }
  };

  // Accept detected clipboard image
  const handleAcceptClipboard = () => {
    if (!detectedClipboardImage) return;
    lastProcessedRef.current = detectedClipboardImage.base64;
    openScanModal(detectedClipboardImage.base64, detectedClipboardImage.mimeType);
    setDetectedClipboardImage(null);
    setShowRecentReturnBanner(false);
  };

  if (isScanModalOpen) return null;

  return (
    <>
      {/* Hidden file input for mobile screenshot selection */}
      <input
        ref={hiddenFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Case A: Concrete Image detected in Clipboard */}
      <AnimatePresence>
        {detectedClipboardImage && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            className="fixed top-4 inset-x-3 max-w-md landscape:max-w-xl mx-auto z-50 pointer-events-auto"
          >
            <div className="bg-[#121316] text-white p-3.5 rounded-2xl shadow-2xl border border-[#D4F826]/40 flex items-center gap-3 backdrop-blur-xl">
              <div className="w-10 h-10 rounded-xl bg-[#D4F826]/20 border border-[#D4F826]/40 flex items-center justify-center shrink-0">
                <Camera size={20} className="text-[#D4F826] animate-pulse" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#D4F826] text-black px-1.5 py-0.5 rounded-md">
                    Screenshot Siap
                  </span>
                  <span className="text-xs font-bold text-white truncate">
                    Bukti Transaksi di Clipboard
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  Ekstrak nominal & kategori otomatis?
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleAcceptClipboard}
                  className="px-3.5 py-1.5 bg-[#D4F826] text-black text-xs font-extrabold rounded-xl shadow-xs hover:bg-[#c6ec15] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Ekstrak</span>
                  <ArrowRight size={13} strokeWidth={2.6} />
                </button>
                <button
                  type="button"
                  onClick={() => setDetectedClipboardImage(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  title="Abaikan"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Case B: User switched back from another app (GoPay/OVO/DANA/BCA) */}
      <AnimatePresence>
        {!detectedClipboardImage && showRecentReturnBanner && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            className="fixed top-3.5 inset-x-3 max-w-md landscape:max-w-xl mx-auto z-50 pointer-events-auto"
          >
            <div className="bg-[#121316]/95 dark:bg-[#16181D]/95 text-white p-3 rounded-2xl shadow-2xl border border-[#D4F826]/30 backdrop-blur-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4F826]/15 border border-[#D4F826]/30 flex items-center justify-center shrink-0">
                <Zap size={20} className="text-[#D4F826]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#D4F826]/20 text-[#D4F826] px-1.5 py-0.5 rounded-md">
                    Deteksi SS
                  </span>
                  <span className="text-xs font-bold text-white truncate">
                    Baru Screenshot E-Wallet?
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  Ketuk untuk deteksi otomatis transaksi Anda
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleAutoDetectClick}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-[#D4F826] text-black text-xs font-extrabold rounded-xl shadow-xs hover:bg-[#c6ec15] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={13} strokeWidth={2.4} />
                  <span>{isProcessing ? 'Membaca...' : 'Deteksi'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenGallery}
                  className="p-1.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
                  title="Pilih dari Galeri"
                >
                  <ImageIcon size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowRecentReturnBanner(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  title="Tutup"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
