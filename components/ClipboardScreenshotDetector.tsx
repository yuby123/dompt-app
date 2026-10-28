'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Smartphone, Sparkles, X, Camera, CheckCircle2, FolderOpen } from 'lucide-react';
import { useApp } from './AppContext';

const PROCESSED_HASHES_KEY = 'dompt_processed_ss_hashes_v1';
const ANDROID_AUTOSS_ENABLED_KEY = 'dompt_android_autoss_enabled';

/**
 * Generates a fast, deterministic fingerprint for a base64 image or File
 * so the same screenshot in the Android clipboard is never auto-recorded twice.
 */
export function computeScreenshotFingerprint(base64: string): string {
  if (!base64) return '';
  const clean = base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  const len = clean.length;
  if (len < 120) return `${len}:${clean}`;
  const head = clean.slice(0, 48);
  const mid = clean.slice(Math.floor(len / 2) - 24, Math.floor(len / 2) + 24);
  const tail = clean.slice(len - 48);
  return `${len}:${head}:${mid}:${tail}`;
}

export function hasScreenshotBeenProcessed(fingerprint: string): boolean {
  if (!fingerprint || typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(PROCESSED_HASHES_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return Array.isArray(list) && list.includes(fingerprint);
  } catch {
    return false;
  }
}

export function markScreenshotProcessed(fingerprint: string): void {
  if (!fingerprint || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PROCESSED_HASHES_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const safeList = Array.isArray(list) ? list.filter((x) => x !== fingerprint) : [];
    safeList.unshift(fingerprint);
    localStorage.setItem(PROCESSED_HASHES_KEY, JSON.stringify(safeList.slice(0, 40)));
  } catch {
    // Ignore storage quota errors
  }
}

export function detectIsAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const platform = (navigator as any)?.userAgentData?.platform || '';
  return /Android/i.test(ua) || /Android/i.test(platform);
}

export function isAndroidAutoSsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(ANDROID_AUTOSS_ENABLED_KEY);
  if (stored === 'false') return false;
  if (stored === 'true') return true;
  return true; // Default active on Android
}

export function setAndroidAutoSsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ANDROID_AUTOSS_ENABLED_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('dompt-android-autoss-changed', { detail: { enabled } }));
}

// Optional live reference to an Android Screenshots folder handle (File System Access API)
let activeScreenshotsDirHandle: any = null;

export function getActiveScreenshotsDirHandle(): any {
  return activeScreenshotsDirHandle;
}

export function setActiveScreenshotsDirHandle(handle: any): void {
  activeScreenshotsDirHandle = handle;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('dompt-android-folder-changed', {
        detail: { connected: Boolean(handle) },
      })
    );
  }
}

/**
 * Scans the connected Android Screenshots directory handle (if granted)
 * for any recent screenshot image created within the last 15 minutes.
 */
export async function readLatestScreenshotFromConnectedFolder(): Promise<{
  base64: string;
  mimeType: string;
  fileName?: string;
} | null> {
  if (!activeScreenshotsDirHandle) return null;
  try {
    let newestFile: File | null = null;
    let newestTime = 0;
    const now = Date.now();
    const maxAgeMs = 15 * 60 * 1000; // 15 minutes

    for await (const entry of activeScreenshotsDirHandle.values()) {
      if (entry.kind === 'file' && /\.(png|jpe?g|webp)$/i.test(entry.name)) {
        const file: File = await entry.getFile();
        if (file.size > 0 && now - file.lastModified <= maxAgeMs && file.lastModified > newestTime) {
          newestTime = file.lastModified;
          newestFile = file;
        }
      }
    }

    if (!newestFile) return null;

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(newestFile!);
    });

    if (!base64) return null;
    const fp = computeScreenshotFingerprint(base64);
    if (hasScreenshotBeenProcessed(fp)) return null;

    return {
      base64,
      mimeType: newestFile.type || 'image/jpeg',
      fileName: newestFile.name,
    };
  } catch {
    return null;
  }
}

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
  const lastProcessedRef = useRef<string>('');
  const isCheckingRef = useRef<boolean>(false);
  const hiddenTimestampRef = useRef<number>(0);
  const pendingGestureCheckRef = useRef<boolean>(true);
  const quickFileInputRef = useRef<HTMLInputElement | null>(null);

  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [autoSsEnabled, setAutoSsEnabled] = useState<boolean>(true);
  const [showAndroidReturnBanner, setShowAndroidReturnBanner] = useState<boolean>(false);
  const [folderConnected, setFolderConnected] = useState<boolean>(false);

  useEffect(() => {
    setIsAndroid(detectIsAndroidDevice());
    setAutoSsEnabled(isAndroidAutoSsEnabled());

    const handleToggleChange = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      setAutoSsEnabled(Boolean(custom.detail?.enabled));
    };
    const handleFolderChange = (e: Event) => {
      const custom = e as CustomEvent<{ connected: boolean }>;
      setFolderConnected(Boolean(custom.detail?.connected));
    };

    window.addEventListener('dompt-android-autoss-changed', handleToggleChange);
    window.addEventListener('dompt-android-folder-changed', handleFolderChange);
    return () => {
      window.removeEventListener('dompt-android-autoss-changed', handleToggleChange);
      window.removeEventListener('dompt-android-folder-changed', handleFolderChange);
    };
  }, []);

  /**
   * Checks both connected Android Screenshots folder and system clipboard for a NEW,
   * unprocessed screenshot image. If found, automatically opens ScanReceiptModal
   * with autoSave=true to immediately record to today's transactions (trx hari ini).
   */
  const checkAndProcessNewAndroidScreenshot = useCallback(
    async (source: 'resume' | 'gesture' | 'button'): Promise<boolean> => {
      if (isCheckingRef.current || isScanModalOpen) return false;
      if (source !== 'button' && !isAndroidAutoSsEnabled()) return false;

      isCheckingRef.current = true;
      try {
        // 1. Check connected Android Screenshots folder first (if user linked it)
        const folderImg = await readLatestScreenshotFromConnectedFolder();
        if (folderImg?.base64) {
          const fp = computeScreenshotFingerprint(folderImg.base64);
          if (fp && fp !== lastProcessedRef.current && !hasScreenshotBeenProcessed(fp)) {
            lastProcessedRef.current = fp;
            markScreenshotProcessed(fp);
            setShowAndroidReturnBanner(false);
            addToast(
              'Screenshot Android Terdeteksi!',
              'Mengekstrak nominal & mencatat otomatis ke Transaksi Hari Ini...',
              'info'
            );
            openScanModal(folderImg.base64, folderImg.mimeType, true);
            return true;
          }
        }

        // 2. Check Android system clipboard for a new screenshot image
        const clipImg = await readLatestImageFromClipboard();
        if (clipImg?.base64) {
          const fp = computeScreenshotFingerprint(clipImg.base64);
          if (fp && fp !== lastProcessedRef.current && !hasScreenshotBeenProcessed(fp)) {
            lastProcessedRef.current = fp;
            markScreenshotProcessed(fp);
            setShowAndroidReturnBanner(false);
            addToast(
              'Screenshot Clipboard Terdeteksi!',
              'Membaca bukti transaksi & mencatat otomatis ke Transaksi Hari Ini...',
              'info'
            );
            openScanModal(clipImg.base64, clipImg.mimeType, true);
            return true;
          } else if (source === 'button') {
            // If user explicitly tapped the button, allow re-scanning even if previously processed
            lastProcessedRef.current = fp;
            markScreenshotProcessed(fp);
            setShowAndroidReturnBanner(false);
            openScanModal(clipImg.base64, clipImg.mimeType, true);
            return true;
          }
        }
      } finally {
        isCheckingRef.current = false;
      }
      return false;
    },
    [isScanModalOpen, openScanModal, addToast]
  );

  // 1. Consume any screenshot explicitly shared via PWA Web Share Target or ?scan=auto
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

          const fp = computeScreenshotFingerprint(sharedImage);
          lastProcessedRef.current = fp;
          markScreenshotProcessed(fp);
          setShowAndroidReturnBanner(false);
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

    // On initial mount on Android, also attempt an immediate check
    if (detectIsAndroidDevice() && isAndroidAutoSsEnabled()) {
      checkAndProcessNewAndroidScreenshot('resume');
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimestampRef.current = Date.now();
        pendingGestureCheckRef.current = true;
      } else if (document.visibilityState === 'visible') {
        if (processSharedScreenshot()) return;

        const awayDuration =
          hiddenTimestampRef.current > 0 ? Date.now() - hiddenTimestampRef.current : 0;
        pendingGestureCheckRef.current = true;

        if (detectIsAndroidDevice() && isAndroidAutoSsEnabled()) {
          const foundSilently = await checkAndProcessNewAndroidScreenshot('resume');
          // If the user switched to another Android app (e.g. m-BCA, DANA, GoPay, QRIS) for >= 1.5s
          // and silent clipboard read was blocked by Android browser until a touch gesture,
          // show the non-intrusive Android Auto-SS quick bar!
          if (!foundSilently && awayDuration >= 1500 && !isScanModalOpen) {
            setShowAndroidReturnBanner(true);
          }
        }
      }
    };

    const handleWindowFocusOrShow = async () => {
      if (processSharedScreenshot()) return;
      pendingGestureCheckRef.current = true;
      if (detectIsAndroidDevice() && isAndroidAutoSsEnabled()) {
        await checkAndProcessNewAndroidScreenshot('resume');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handleWindowFocusOrShow);
    window.addEventListener('focus', handleWindowFocusOrShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handleWindowFocusOrShow);
      window.removeEventListener('focus', handleWindowFocusOrShow);
    };
  }, [openScanModal, checkAndProcessNewAndroidScreenshot, isScanModalOpen]);

  // Auto-hide the Android Return Banner after 9 seconds
  useEffect(() => {
    if (!showAndroidReturnBanner) return;
    const timer = setTimeout(() => {
      setShowAndroidReturnBanner(false);
    }, 9000);
    return () => clearTimeout(timer);
  }, [showAndroidReturnBanner]);

  // 2. Android First-Touch Gesture Auto-Detector:
  // On Android Chrome, navigator.clipboard.read() often succeeds on the first user tap after returning
  // from taking a screenshot. We hook into pointerup/click when pendingGestureCheckRef is armed.
  useEffect(() => {
    if (!isAndroid || !autoSsEnabled) return;

    const handleUserGestureOnAndroid = async () => {
      if (!pendingGestureCheckRef.current || isScanModalOpen) return;
      pendingGestureCheckRef.current = false;
      await checkAndProcessNewAndroidScreenshot('gesture');
    };

    window.addEventListener('pointerup', handleUserGestureOnAndroid, { passive: true });
    window.addEventListener('touchend', handleUserGestureOnAndroid, { passive: true });

    return () => {
      window.removeEventListener('pointerup', handleUserGestureOnAndroid);
      window.removeEventListener('touchend', handleUserGestureOnAndroid);
    };
  }, [isAndroid, autoSsEnabled, isScanModalOpen, checkAndProcessNewAndroidScreenshot]);

  // 3. Global window paste listener (when user pastes an image via Android keyboard clipboard or Ctrl+V)
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
                const fp = computeScreenshotFingerprint(base64);
                if (fp !== lastProcessedRef.current) {
                  lastProcessedRef.current = fp;
                  markScreenshotProcessed(fp);
                  setShowAndroidReturnBanner(false);
                  openScanModal(base64, blob.type, true);
                }
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

  const handleQuickAndroidDetectClick = async () => {
    const found = await checkAndProcessNewAndroidScreenshot('button');
    if (!found) {
      // Fallback: open Android native recent/screenshots picker directly so 1 tap selects the screenshot
      quickFileInputRef.current?.click();
      setShowAndroidReturnBanner(false);
    }
  };

  const handleQuickFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      if (base64) {
        const fp = computeScreenshotFingerprint(base64);
        lastProcessedRef.current = fp;
        markScreenshotProcessed(fp);
        openScanModal(base64, file.type || 'image/jpeg', true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConnectAndroidScreenshotsFolder = async () => {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'read',
        });
        if (dirHandle) {
          setActiveScreenshotsDirHandle(dirHandle);
          addToast(
            'Folder Screenshot Terhubung!',
            'Setiap screenshot baru akan langsung terdeteksi & dicatat ke Transaksi Hari Ini.',
            'success'
          );
          await checkAndProcessNewAndroidScreenshot('button');
        }
      } catch {
        // User cancelled directory picker
      }
    }
  };

  return (
    <>
      <input
        ref={quickFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleQuickFileSelect}
        className="hidden"
      />

      {isAndroid && autoSsEnabled && showAndroidReturnBanner && !isScanModalOpen && (
        <div className="fixed top-3 left-3 right-3 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="rounded-2xl bg-[#111524]/95 backdrop-blur-md border border-[#D4F826]/40 shadow-2xl p-3 text-white flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#D4F826]/20 border border-[#D4F826]/40 text-[#D4F826] flex items-center justify-center shrink-0">
                <Smartphone size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D4F826]">
                    Auto-Deteksi Android
                  </span>
                  {folderConnected && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      Folder Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-white truncate">
                  Baru saja screenshot bukti transaksi?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleQuickAndroidDetectClick}
                className="px-3 py-2 rounded-xl bg-[#D4F826] hover:bg-[#c5ea1b] text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
              >
                <Sparkles size={13} />
                <span>Catat SS</span>
              </button>
              {typeof window !== 'undefined' &&
                'showDirectoryPicker' in window &&
                !folderConnected && (
                  <button
                    type="button"
                    onClick={handleConnectAndroidScreenshotsFolder}
                    title="Pantau Otomatis Folder Screenshots Android"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 cursor-pointer"
                  >
                    <FolderOpen size={14} />
                  </button>
                )}
              <button
                type="button"
                onClick={() => setShowAndroidReturnBanner(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
