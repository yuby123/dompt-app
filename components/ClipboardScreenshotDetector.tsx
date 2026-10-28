'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Smartphone,
  Sparkles,
  X,
  FolderOpen,
  Clipboard,
  CheckCircle2,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import { useApp } from './AppContext';

const PROCESSED_HASHES_KEY = 'dompt_processed_ss_hashes_v1';
const PROCESSED_FILES_KEY = 'dompt_processed_ss_files_v1';
const ANDROID_AUTOSS_ENABLED_KEY = 'dompt_android_autoss_enabled';
const IDB_NAME = 'dompt_android_autoss_db';
const IDB_STORE = 'handles';
const IDB_DIR_KEY = 'screenshots_dir_handle';

/**
 * Generates a fast, deterministic fingerprint for a base64 image
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
    localStorage.setItem(PROCESSED_HASHES_KEY, JSON.stringify(safeList.slice(0, 50)));
  } catch {
    // Ignore storage quota errors
  }
}

function getFileSignature(file: { name: string; size: number; lastModified: number }): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function hasFileSignatureBeenProcessed(sig: string): boolean {
  if (!sig || typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(PROCESSED_FILES_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return Array.isArray(list) && list.includes(sig);
  } catch {
    return false;
  }
}

function markFileSignatureProcessed(sig: string): void {
  if (!sig || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PROCESSED_FILES_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const safeList = Array.isArray(list) ? list.filter((x) => x !== sig) : [];
    safeList.unshift(sig);
    localStorage.setItem(PROCESSED_FILES_KEY, JSON.stringify(safeList.slice(0, 50)));
  } catch {
    // Ignore
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
  return true; // Default active
}

export function setAndroidAutoSsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ANDROID_AUTOSS_ENABLED_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('dompt-android-autoss-changed', { detail: { enabled } }));
}

// ============================================================================
// IndexedDB Persistence for Android Screenshots Directory Handle
// ============================================================================
let activeScreenshotsDirHandle: any = null;

function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDirHandleToIdb(handle: any): Promise<void> {
  activeScreenshotsDirHandle = handle;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('dompt-android-folder-changed', {
        detail: { connected: Boolean(handle) },
      })
    );
  }
  try {
    const db = await openHandleDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      if (handle) {
        store.put(handle, IDB_DIR_KEY);
      } else {
        store.delete(IDB_DIR_KEY);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore IDB errors
  }
}

export async function loadDirHandleFromIdb(): Promise<any> {
  if (activeScreenshotsDirHandle) return activeScreenshotsDirHandle;
  try {
    const db = await openHandleDb();
    const handle = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_DIR_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (handle) {
      activeScreenshotsDirHandle = handle;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dompt-android-folder-changed', {
            detail: { connected: true },
          })
        );
      }
    }
    return handle;
  } catch {
    return null;
  }
}

export function getActiveScreenshotsDirHandle(): any {
  return activeScreenshotsDirHandle;
}

export function setActiveScreenshotsDirHandle(handle: any): void {
  saveDirHandleToIdb(handle);
}

/**
 * Scans the connected Android Screenshots directory handle (if granted)
 * for any recent screenshot image created within the last 30 minutes.
 * If requestPermIfPrompt is true (called inside a user click gesture), it will also
 * re-verify permission if the browser restarted.
 */
export async function readLatestScreenshotFromConnectedFolder(
  requestPermIfPrompt = false
): Promise<{
  base64: string;
  mimeType: string;
  fileName?: string;
} | null> {
  const dirHandle = await loadDirHandleFromIdb();
  if (!dirHandle) return null;

  try {
    if (typeof dirHandle.queryPermission === 'function') {
      let perm = await dirHandle.queryPermission({ mode: 'read' });
      if (perm !== 'granted') {
        if (requestPermIfPrompt && typeof dirHandle.requestPermission === 'function') {
          perm = await dirHandle.requestPermission({ mode: 'read' });
        }
        if (perm !== 'granted') return null;
      }
    }

    let newestFile: File | null = null;
    let newestTime = 0;
    const now = Date.now();
    const maxAgeMs = 30 * 60 * 1000; // 30 minutes window

    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && /\.(png|jpe?g|webp)$/i.test(entry.name)) {
        const file: File = await entry.getFile();
        const sig = getFileSignature(file);
        if (
          file.size > 0 &&
          now - file.lastModified <= maxAgeMs &&
          file.lastModified > newestTime &&
          !hasFileSignatureBeenProcessed(sig)
        ) {
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
    const sig = getFileSignature(newestFile);
    if (hasScreenshotBeenProcessed(fp)) {
      markFileSignatureProcessed(sig);
      return null;
    }

    markFileSignatureProcessed(sig);
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
  const pasteInputRef = useRef<HTMLInputElement | null>(null);

  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [autoSsEnabled, setAutoSsEnabled] = useState<boolean>(true);
  const [showAndroidReturnBanner, setShowAndroidReturnBanner] = useState<boolean>(false);
  const [folderConnected, setFolderConnected] = useState<boolean>(false);
  const [supportsDirPicker, setSupportsDirPicker] = useState<boolean>(false);

  useEffect(() => {
    const androidDetected = detectIsAndroidDevice();
    setIsAndroid(androidDetected);
    setAutoSsEnabled(isAndroidAutoSsEnabled());
    setSupportsDirPicker(typeof window !== 'undefined' && 'showDirectoryPicker' in window);

    loadDirHandleFromIdb().then((handle) => {
      if (handle) setFolderConnected(true);
    });

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
   * Checks both connected Android Screenshots folder (persisted in IndexedDB)
   * and system clipboard for a NEW, unprocessed screenshot image.
   * If found, automatically opens ScanReceiptModal with autoSave=true to
   * immediately record to today's transactions (trx hari ini).
   */
  const checkAndProcessNewAndroidScreenshot = useCallback(
    async (source: 'resume' | 'gesture' | 'button' | 'poll'): Promise<boolean> => {
      if (isCheckingRef.current || isScanModalOpen) return false;
      if (source !== 'button' && !isAndroidAutoSsEnabled()) return false;

      isCheckingRef.current = true;
      try {
        const isUserGesture = source === 'gesture' || source === 'button';

        // 1. Check connected Android Screenshots folder first (persisted in IndexedDB)
        const folderImg = await readLatestScreenshotFromConnectedFolder(isUserGesture);
        if (folderImg?.base64) {
          const fp = computeScreenshotFingerprint(folderImg.base64);
          if (fp && fp !== lastProcessedRef.current && !hasScreenshotBeenProcessed(fp)) {
            lastProcessedRef.current = fp;
            markScreenshotProcessed(fp);
            setShowAndroidReturnBanner(false);
            addToast(
              'Screenshot Baru Terdeteksi Otomatis!',
              `Membaca ${folderImg.fileName || 'screenshot'} & mencatat ke Transaksi Hari Ini...`,
              'info'
            );
            openScanModal(folderImg.base64, folderImg.mimeType, true);
            return true;
          }
        }

        // 2. Check Android system clipboard for a new screenshot image
        if (source !== 'poll') {
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
              lastProcessedRef.current = fp;
              markScreenshotProcessed(fp);
              setShowAndroidReturnBanner(false);
              openScanModal(clipImg.base64, clipImg.mimeType, true);
              return true;
            }
          }
        }
      } finally {
        isCheckingRef.current = false;
      }
      return false;
    },
    [isScanModalOpen, openScanModal, addToast]
  );

  // 1. Consume any screenshot explicitly shared via PWA Web Share Target or ?scan=auto,
  // and run automatic detection on mount, app switch (visibilitychange), and window focus!
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

    // Initial mount check when user opens the app (e.g. right after screenshotting SeaBank)
    const runMountCheck = async () => {
      if (!isAndroidAutoSsEnabled()) return;
      const found = await checkAndProcessNewAndroidScreenshot('resume');
      // If on Android and silent check was blocked by browser until a tap, show the instant detector bar
      if (!found && detectIsAndroidDevice()) {
        const shownInSession = sessionStorage.getItem('dompt_android_mount_prompt_shown');
        if (!shownInSession) {
          sessionStorage.setItem('dompt_android_mount_prompt_shown', '1');
          setShowAndroidReturnBanner(true);
        }
      }
    };
    runMountCheck();

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimestampRef.current = Date.now();
        pendingGestureCheckRef.current = true;
      } else if (document.visibilityState === 'visible') {
        if (processSharedScreenshot()) return;

        pendingGestureCheckRef.current = true;

        if (isAndroidAutoSsEnabled()) {
          const foundSilently = await checkAndProcessNewAndroidScreenshot('resume');
          // Whenever returning to the app on Android (e.g. from SeaBank, BCA, DANA, GoPay)
          // if silent read didn't grab a file yet, immediately surface the 1-tap detector card!
          if (!foundSilently && detectIsAndroidDevice() && !isScanModalOpen) {
            setShowAndroidReturnBanner(true);
          }
        }
      }
    };

    const handleWindowFocusOrShow = async () => {
      if (processSharedScreenshot()) return;
      pendingGestureCheckRef.current = true;
      if (isAndroidAutoSsEnabled()) {
        const foundSilently = await checkAndProcessNewAndroidScreenshot('resume');
        if (
          !foundSilently &&
          detectIsAndroidDevice() &&
          hiddenTimestampRef.current > 0 &&
          !isScanModalOpen
        ) {
          setShowAndroidReturnBanner(true);
        }
      }
    };

    const handleWindowBlur = () => {
      hiddenTimestampRef.current = Date.now();
      pendingGestureCheckRef.current = true;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handleWindowFocusOrShow);
    window.addEventListener('focus', handleWindowFocusOrShow);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handleWindowFocusOrShow);
      window.removeEventListener('focus', handleWindowFocusOrShow);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [openScanModal, checkAndProcessNewAndroidScreenshot, isScanModalOpen]);

  // 2. Background Folder Polling while app is visible (if Android Screenshots folder is connected)
  useEffect(() => {
    if (!autoSsEnabled || !folderConnected || isScanModalOpen) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkAndProcessNewAndroidScreenshot('poll');
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [autoSsEnabled, folderConnected, isScanModalOpen, checkAndProcessNewAndroidScreenshot]);

  // 3. Capture-phase `click` User Activation Listener:
  // On Android Chrome, `click` provides transient user activation required for
  // `navigator.clipboard.read()` and `dirHandle.requestPermission({ mode: 'read' })`.
  useEffect(() => {
    if (!autoSsEnabled) return;

    const handleUserClickActivation = async () => {
      if (!pendingGestureCheckRef.current || isScanModalOpen) return;
      pendingGestureCheckRef.current = false;
      await checkAndProcessNewAndroidScreenshot('gesture');
    };

    window.addEventListener('click', handleUserClickActivation, { capture: true });
    return () => {
      window.removeEventListener('click', handleUserClickActivation, { capture: true });
    };
  }, [autoSsEnabled, isScanModalOpen, checkAndProcessNewAndroidScreenshot]);

  // 4. Global window paste listener (when user pastes an image via Android keyboard clipboard or Ctrl+V)
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
                lastProcessedRef.current = fp;
                markScreenshotProcessed(fp);
                setShowAndroidReturnBanner(false);
                openScanModal(base64, blob.type, true);
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
    if (found) return;

    // If no image in clipboard (because Android OEM like Xiaomi/Samsung/Vivo saved the SeaBank screenshot
    // to Pictures/Screenshots or DCIM/Screenshots instead of clipboard):
    // Open the native Android recent/screenshots file picker where the newest SeaBank screenshot is #1!
    quickFileInputRef.current?.click();
    setShowAndroidReturnBanner(false);
  };

  const handleQuickFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    markFileSignatureProcessed(getFileSignature(file));
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
          await saveDirHandleToIdb(dirHandle);
          setFolderConnected(true);
          addToast(
            'Folder Screenshots Terhubung Otomatis!',
            'Mulai sekarang setiap habis SS di SeaBank/m-Banking, saat masuk aplikasi akan langsung terdeteksi otomatis.',
            'success'
          );
          const found = await checkAndProcessNewAndroidScreenshot('button');
          if (!found) {
            setShowAndroidReturnBanner(false);
          }
        }
      } catch {
        // User cancelled directory picker
      }
    } else {
      quickFileInputRef.current?.click();
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

      {autoSsEnabled && showAndroidReturnBanner && !isScanModalOpen && (
        <div className="fixed top-3 left-3 right-3 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="rounded-3xl bg-[#111524]/98 backdrop-blur-xl border-2 border-[#D4F826]/60 shadow-[0_20px_50px_rgba(0,0,0,0.75)] p-3.5 text-white space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-[#D4F826] text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                  <Zap size={18} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#D4F826]">
                      Auto-Deteksi Screenshot Android
                    </span>
                    {folderConnected && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-0.5">
                        <CheckCircle2 size={10} />
                        <span>Folder Aktif</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-extrabold text-white leading-snug">
                    Baru saja SS bukti transaksi (SeaBank / Bank / QRIS)?
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAndroidReturnBanner(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white cursor-pointer shrink-0"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            {/* Primary 1-Tap Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickAndroidDetectClick}
                className="col-span-2 py-2.5 px-3 rounded-2xl bg-[#D4F826] hover:bg-[#c5ea1b] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-transform cursor-pointer"
              >
                <Sparkles size={15} strokeWidth={2.5} />
                <span>Deteksi SS Terakhir & Catat ke Trx Hari Ini</span>
              </button>

              {supportsDirPicker && !folderConnected && (
                <button
                  type="button"
                  onClick={handleConnectAndroidScreenshotsFolder}
                  className="col-span-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-[#D4F826] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FolderOpen size={13} />
                  <span>Izinkan Folder Screenshots (Otomatis 100% Tanpa Klik)</span>
                </button>
              )}

              {/* Gboard / Android Keyboard Clipboard Quick Paste Input */}
              <div className="col-span-2 relative">
                <input
                  ref={pasteInputRef}
                  type="text"
                  readOnly={false}
                  value=""
                  onChange={() => {}}
                  placeholder="📋 Atau ketuk di sini lalu pilih SS di atas keyboard HP Anda..."
                  className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#D4F826]/60"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
