'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ArrowRight, Camera } from 'lucide-react';
import { useApp } from './AppContext';

export function ClipboardScreenshotDetector() {
  const { openScanModal, isScanModalOpen } = useApp();
  const [detectedImage, setDetectedImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const lastProcessedRef = useRef<string>('');

  // Check clipboard when window gains focus or visibility changes to visible
  const checkClipboardForImage = async () => {
    if (isScanModalOpen || isDismissed) return;
    if (!navigator.clipboard?.read) return;

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
              setDetectedImage({ base64, mimeType: imageType });
              setIsDismissed(false);
            }
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    } catch {
      // Browser permission prompt might be pending or denied - silently ignore
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      checkClipboardForImage();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkClipboardForImage();
      }
    };

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
              }
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('paste', handlePaste);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanModalOpen, isDismissed]);

  const handleAccept = () => {
    if (!detectedImage) return;
    lastProcessedRef.current = detectedImage.base64;
    openScanModal(detectedImage.base64, detectedImage.mimeType);
    setDetectedImage(null);
  };

  const handleDismiss = () => {
    if (detectedImage) {
      lastProcessedRef.current = detectedImage.base64;
    }
    setDetectedImage(null);
    setIsDismissed(true);
  };

  if (!detectedImage || isScanModalOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-4 inset-x-3 max-w-md landscape:max-w-xl mx-auto z-50 pointer-events-auto"
      >
        <div className="bg-linear-to-r from-teal-900 via-teal-800 to-emerald-900 text-white p-3.5 rounded-2xl shadow-2xl border border-teal-400/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-300/30 flex items-center justify-center shrink-0">
            <Camera size={20} className="text-teal-200 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-400/20 text-teal-200 px-1.5 py-0.5 rounded-md">
                Terdeteksi SS
              </span>
              <span className="text-xs font-bold text-white truncate">Bukti Transfer di Clipboard</span>
            </div>
            <p className="text-[11px] text-teal-100/80 truncate mt-0.5">
              Ekstrak nominal & kategori otomatis?
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleAccept}
              className="px-3 py-1.5 bg-white text-teal-900 text-xs font-bold rounded-xl shadow-xs hover:bg-teal-50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Ekstrak</span>
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-teal-200 hover:text-white rounded-lg"
              title="Abaikan"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
