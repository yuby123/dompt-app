'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ArrowRight, Camera, Zap } from 'lucide-react';
import { useApp } from './AppContext';

export async function readLatestImageFromClipboard(): Promise<{
  base64: string;
  mimeType: string;
} | null> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.read) {
    return null;
  }

  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      // 1. Check direct image/* MIME types first
      const imageType = item.types.find((t) => t.startsWith('image/'));
      if (imageType) {
        const blob = await item.getType(imageType);
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        if (base64) {
          return { base64, mimeType: imageType };
        }
      }

      // 2. Fallback: check if clipboard item has text/html with embedded data:image/*
      if (item.types.includes('text/html')) {
        const htmlBlob = await item.getType('text/html');
        const htmlText = await htmlBlob.text();
        const match = htmlText.match(/src=["'](data:image\/([a-zA-Z0-9+.-]+);base64,[^"']+)["']/i);
        if (match && match[1]) {
          return {
            base64: match[1],
            mimeType: `image/${match[2] || 'png'}`,
          };
        }
      }
    }
  } catch {
    // Clipboard read requires user gesture or permission on some mobile browsers
  }

  return null;
}

export function ClipboardScreenshotDetector() {
  const { openScanModal, isScanModalOpen, addToast } = useApp();
  const [detectedClipboardImage, setDetectedClipboardImage] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);
  const [showRecentReturnBanner, setShowRecentReturnBanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const lastProcessedRef = useRef<string>('');
  const blurTimestampRef = useRef<number>(0);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Immediately consume any screenshot shared via PWA Web Share Target or ?scan=auto
  useEffect(() => {
    const processSharedScreenshot = () => {
      if (typeof window === 'undefined') return false;

      try {
        const sharedImage =
          sessionStorage.getItem('dompt_shared_image') ||
          localStorage.getItem('dompt_pending_screenshot');
        const sharedMime =
          sessionStorage.getItem('dompt_shared_mime') ||
          localStorage.getItem('dompt_pending_mime') ||
          'image/jpeg';

        if (sharedImage) {
          sessionStorage.removeItem('dompt_shared_image');
          sessionStorage.removeItem('dompt_shared_mime');
          localStorage.removeItem('dompt_pending_screenshot');
          localStorage.removeItem('dompt_pending_mime');
          localStorage.removeItem('dompt_pending_time');

          if (window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }

          lastProcessedRef.current = sharedImage;
          openScanModal(sharedImage, sharedMime, true);
          return true;
        }

        // Check URL search params for ?scan=auto or ?scan=open
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('scan') === 'auto' || urlParams.get('scan') === 'open') {
          window.history.replaceState({}, document.title, window.location.pathname);
          openScanModal(undefined, undefined, true);
          return true;
        }
      } catch (err) {
        console.error('Error processing shared screenshot:', err);
      }
      return false;
    };

    const handled = processSharedScreenshot();
    if (handled) return;

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

  // 2. Passive check clipboard for images and auto-trigger scan if user just returned from taking a screenshot
  const tryPassiveClipboardRead = useCallback(
    async (autoOpenIfFound = false) => {
      if (isScanModalOpen) return false;
      const clipImg = await readLatestImageFromClipboard();
      if (clipImg && clipImg.base64 !== lastProcessedRef.current) {
        if (autoOpenIfFound) {
          lastProcessedRef.current = clipImg.base64;
          setDetectedClipboardImage(null);
          setShowRecentReturnBanner(false);
          openScanModal(clipImg.base64, clipImg.mimeType, true);
          return true;
        }
        setDetectedClipboardImage(clipImg);
        return true;
      }
      return false;
    },
    [isScanModalOpen, openScanModal]
  );

  // 3. Monitor app switching (e.g. user went to GoPay/BCA/DANA, took a screenshot, then returned to Dompt PWA)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        blurTimestampRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const timeAway = Date.now() - blurTimestampRef.current;
        if (blurTimestampRef.current > 0 && timeAway > 1200 && !isScanModalOpen) {
          // Immediately try to read clipboard and auto-record without asking to upload!
          const autoOpened = await tryPassiveClipboardRead(true);
          if (!autoOpened) {
            // If mobile browser requires a single tap gesture to unlock clipboard.read(), show 1-tap banner
            setShowRecentReturnBanner(true);
            if (autoDismissTimerRef.current) {
              clearTimeout(autoDismissTimerRef.current);
            }
            autoDismissTimerRef.current = setTimeout(() => {
              setShowRecentReturnBanner(false);
            }, 15000);
          }
        }
      }
    };

    const handleFocus = () => {
      tryPassiveClipboardRead(false);
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
  }, [isScanModalOpen, tryPassiveClipboardRead]);

  // 4. Global window paste listener (Ctrl+V on desktop or paste on mobile)
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
                openScanModal(base64, blob.type, true);
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

  // 1-Tap Auto Detect Action from Clipboard (never forces file upload dialog)
  const handleAutoDetectClick = async () => {
    setIsProcessing(true);

    // 1. If passive check already cached the clipboard image, use it immediately
    if (detectedClipboardImage?.base64) {
      lastProcessedRef.current = detectedClipboardImage.base64;
      const { base64, mimeType } = detectedClipboardImage;
      setDetectedClipboardImage(null);
      setShowRecentReturnBanner(false);
      setIsProcessing(false);
      openScanModal(base64, mimeType, true);
      return;
    }

    // 2. Read directly from clipboard using this active user tap gesture
    const clipImg = await readLatestImageFromClipboard();
    if (clipImg?.base64) {
      lastProcessedRef.current = clipImg.base64;
      setDetectedClipboardImage(null);
      setShowRecentReturnBanner(false);
      setIsProcessing(false);
      openScanModal(clipImg.base64, clipImg.mimeType, true);
      return;
    }

    // 3. If clipboard had no image or browser blocked clipboard, open ScanModal (which also listens for paste)
    setIsProcessing(false);
    setShowRecentReturnBanner(false);
    addToast(
      'Membuka Pendeteksi Clipboard',
      'Pastikan screenshot sudah tersalin di clipboard HP Anda.',
      'info'
    );
    openScanModal(undefined, undefined, true);
  };

  // Accept detected clipboard image
  const handleAcceptClipboard = () => {
    if (!detectedClipboardImage) return;
    lastProcessedRef.current = detectedClipboardImage.base64;
    openScanModal(detectedClipboardImage.base64, detectedClipboardImage.mimeType, true);
    setDetectedClipboardImage(null);
    setShowRecentReturnBanner(false);
  };

  if (isScanModalOpen) return null;

  return (
    <>
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
                  Ketuk untuk langsung catat nominal otomatis
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleAcceptClipboard}
                  className="px-3.5 py-1.5 bg-[#D4F826] text-black text-xs font-extrabold rounded-xl shadow-xs hover:bg-[#c6ec15] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Catat Otomatis</span>
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
                    Auto Clipboard
                  </span>
                  <span className="text-xs font-bold text-white truncate">
                    Baru Screenshot Transaksi?
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  Ketuk untuk baca clipboard & langsung catat nominalnya
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
