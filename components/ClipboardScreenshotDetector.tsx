'use client';

import React, { useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { Wallet, Category, TransactionType } from '@/lib/types';

const PROCESSED_HASHES_KEY = 'dompt_processed_ss_hashes_v1';
const ANDROID_AUTOSS_ENABLED_KEY = 'dompt_android_autoss_enabled';
const LAST_LEAVE_TS_KEY = 'dompt_android_last_leave_ts';

const IDB_NAME = 'dompt_android_autoss_idb';
const IDB_STORE = 'handles';
const IDB_DIR_KEY = 'screenshots_dir_handle';

export interface ExtractedScreenshotData {
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

export interface PendingScreenshotForModal {
  base64?: string;
  mimeType?: string;
  extractedData?: ExtractedScreenshotData;
  awaitingTouchUnlock?: boolean;
  timestamp: number;
}

let pendingScreenshotForModal: PendingScreenshotForModal | null = null;

export function getPendingScreenshotForModal(): PendingScreenshotForModal | null {
  return pendingScreenshotForModal;
}

export function setPendingScreenshotForModal(payload: PendingScreenshotForModal | null): void {
  pendingScreenshotForModal = payload;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('dompt-pending-ss-modal', {
        detail: payload,
      })
    );
  }
}

/**
 * Resolves the best matching Wallet ID and Category ID from OCR extracted receipt data.
 * Prioritizes exact bank/e-wallet brand match (e.g. SeaBank -> SeaBank wallet) before generic type fallback.
 */
export function resolveWalletAndCategoryFromOcr(
  data: ExtractedScreenshotData,
  walletsWithBalance: (Wallet & { balance: number })[],
  wallets: Wallet[],
  categories: Category[]
): { resolvedWalletId: string; resolvedCategoryId: string } {
  const query = `${data.sourceApp || ''} ${data.suggestedWallet || ''} ${data.title || ''} ${data.notes || ''}`.toLowerCase();

  const brandKeywords = [
    { keys: ['seabank', 'sea bank'], match: (n: string) => n.includes('seabank') || n.includes('sea bank') || n === 'sea' },
    { keys: ['bca', 'm-bca', 'mybca', 'klikbca'], match: (n: string) => n.includes('bca') },
    { keys: ['mandiri', 'livin'], match: (n: string) => n.includes('mandiri') || n.includes('livin') },
    { keys: ['bri', 'brimo'], match: (n: string) => n.includes('bri') },
    { keys: ['bni', 'wondr'], match: (n: string) => n.includes('bni') || n.includes('wondr') },
    { keys: ['jago'], match: (n: string) => n.includes('jago') },
    { keys: ['bsi', 'byond'], match: (n: string) => n.includes('bsi') },
    { keys: ['blu'], match: (n: string) => n.includes('blu') },
    { keys: ['cimb', 'octo'], match: (n: string) => n.includes('cimb') || n.includes('octo') },
    { keys: ['permata'], match: (n: string) => n.includes('permata') },
    { keys: ['dana'], match: (n: string) => n.includes('dana') },
    { keys: ['gopay', 'gojek'], match: (n: string) => n.includes('gopay') || n.includes('gojek') },
    { keys: ['ovo'], match: (n: string) => n.includes('ovo') },
    { keys: ['shopeepay', 'shopee'], match: (n: string) => n.includes('shopee') },
    { keys: ['linkaja'], match: (n: string) => n.includes('linkaja') },
  ];

  // Pass 1: Exact brand keyword match on wallet name
  let matchedWallet: (Wallet & { balance: number }) | undefined;
  for (const brand of brandKeywords) {
    if (brand.keys.some((k) => query.includes(k))) {
      matchedWallet = walletsWithBalance.find((w) => brand.match(w.name.toLowerCase()));
      if (matchedWallet) break;
    }
  }

  // Pass 2: Direct name substring match with suggestedWallet or sourceApp
  if (!matchedWallet) {
    const cleanSource = (data.sourceApp || '').toLowerCase().trim();
    const cleanSuggested = (data.suggestedWallet || '').toLowerCase().trim();
    matchedWallet = walletsWithBalance.find((w) => {
      const wName = w.name.toLowerCase().trim();
      if (!wName) return false;
      return (
        (cleanSource && (wName.includes(cleanSource) || cleanSource.includes(wName))) ||
        (cleanSuggested && (wName.includes(cleanSuggested) || cleanSuggested.includes(wName)))
      );
    });
  }

  // Pass 3: Type fallback (bank vs e-wallet vs cash)
  if (!matchedWallet) {
    const isBankQuery = /seabank|bca|mandiri|bri|bni|jago|bsi|blu|bank|rekening|transfer/i.test(query);
    const isEwalletQuery = /dana|gopay|ovo|shopee|linkaja|qris|ewallet|e-wallet/i.test(query);
    if (isBankQuery) {
      matchedWallet = walletsWithBalance.find(
        (w) => w.type === 'bank' || /bank|rekening|seabank|bca|mandiri|bri|bni/i.test(w.name)
      );
    } else if (isEwalletQuery) {
      matchedWallet = walletsWithBalance.find(
        (w) => w.type === 'ewallet' || /dana|gopay|ovo|shopee|ewallet/i.test(w.name)
      );
    }
  }

  const resolvedWalletId =
    matchedWallet?.id || walletsWithBalance[0]?.id || wallets[0]?.id || '';

  const targetCatType = data.type === 'income' ? 'income' : 'expense';
  const availableCats = categories.filter((c) => c.type === targetCatType);
  const matchCategory = availableCats.find((c) => {
    if (!data.suggestedCategory) return false;
    const s = data.suggestedCategory.toLowerCase();
    return c.name.toLowerCase().includes(s) || s.includes(c.name.toLowerCase());
  });
  const resolvedCategoryId = matchCategory ? matchCategory.id : availableCats[0]?.id || '';

  return { resolvedWalletId, resolvedCategoryId };
}

/**
 * Generates a fast, deterministic fingerprint for a base64 image
 * so the same screenshot in the Android clipboard is never auto-opened twice.
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
  return true;
}

export function setAndroidAutoSsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ANDROID_AUTOSS_ENABLED_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('dompt-android-autoss-changed', { detail: { enabled } }));
}

// IndexedDB helpers to persist FileSystemDirectoryHandle across Android tab reloads
function openHandlesDb(): Promise<IDBDatabase> {
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

async function saveDirHandleToIdb(handle: any): Promise<void> {
  try {
    const db = await openHandlesDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(handle, IDB_DIR_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore IDB errors
  }
}

export async function loadDirHandleFromIdb(): Promise<any | null> {
  try {
    const db = await openHandlesDb();
    return await new Promise<any | null>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_DIR_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

let activeScreenshotsDirHandle: any = null;

export function getActiveScreenshotsDirHandle(): any {
  return activeScreenshotsDirHandle;
}

export function setActiveScreenshotsDirHandle(handle: any): void {
  activeScreenshotsDirHandle = handle;
  if (handle) {
    saveDirHandleToIdb(handle);
  }
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
 * for any recent screenshot image created within the last 20 minutes.
 */
export async function readLatestScreenshotFromConnectedFolder(
  allowRequestPermission = false,
  ignoreProcessedHash = false
): Promise<{
  base64: string;
  mimeType: string;
  fileName?: string;
} | null> {
  if (!activeScreenshotsDirHandle) {
    activeScreenshotsDirHandle = await loadDirHandleFromIdb();
  }
  if (!activeScreenshotsDirHandle) return null;

  try {
    if (typeof activeScreenshotsDirHandle.queryPermission === 'function') {
      let perm = await activeScreenshotsDirHandle.queryPermission({ mode: 'read' });
      if (perm !== 'granted' && allowRequestPermission && typeof activeScreenshotsDirHandle.requestPermission === 'function') {
        perm = await activeScreenshotsDirHandle.requestPermission({ mode: 'read' });
      }
      if (perm !== 'granted') return null;
    }

    let newestFile: File | null = null;
    let newestTime = 0;
    const now = Date.now();
    const maxAgeMs = 20 * 60 * 1000; // 20 minutes

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
    if (!ignoreProcessedHash && hasScreenshotBeenProcessed(fp)) return null;

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
    // Clipboard read requires focus or user gesture on some mobile browsers
  }

  return null;
}

export function ClipboardScreenshotDetector() {
  const { openAddTransaction, isAddTransactionOpen, isScanModalOpen, goToCurrentPeriod } = useApp();
  const lastProcessedRef = useRef<string>('');
  const pendingGestureCheckRef = useRef<boolean>(true);

  /**
   * Opens the Menu Pencatatan Transaksi (AddTransactionModal) directly with the detected screenshot
   * so that all fields are filled automatically and the user only needs to press Confirm.
   */
  const openTransactionMenuWithScreenshot = (
    base64?: string,
    mimeType?: string,
    awaitingTouchUnlock = false
  ) => {
    if (base64) {
      const fp = computeScreenshotFingerprint(base64);
      lastProcessedRef.current = fp;
      markScreenshotProcessed(fp);
    }
    goToCurrentPeriod();
    setPendingScreenshotForModal({
      base64,
      mimeType: mimeType || 'image/jpeg',
      awaitingTouchUnlock,
      timestamp: Date.now(),
    });
    openAddTransaction('expense');
  };

  /**
   * Checks both connected Android Screenshots folder (IndexedDB) and system clipboard
   * for a NEW, unprocessed screenshot image.
   */
  const checkAndOpenIfNewScreenshot = async (allowRequestPerm = false): Promise<boolean> => {
    if (!isAndroidAutoSsEnabled()) return false;

    // 1. Check connected Android Screenshots folder first
    const folderImg = await readLatestScreenshotFromConnectedFolder(allowRequestPerm, false);
    if (folderImg?.base64) {
      const fp = computeScreenshotFingerprint(folderImg.base64);
      if (fp && fp !== lastProcessedRef.current && !hasScreenshotBeenProcessed(fp)) {
        openTransactionMenuWithScreenshot(folderImg.base64, folderImg.mimeType, false);
        return true;
      }
    }

    // 2. Check system clipboard for a new screenshot image
    const clipImg = await readLatestImageFromClipboard();
    if (clipImg?.base64) {
      const fp = computeScreenshotFingerprint(clipImg.base64);
      if (fp && fp !== lastProcessedRef.current && !hasScreenshotBeenProcessed(fp)) {
        openTransactionMenuWithScreenshot(clipImg.base64, clipImg.mimeType, false);
        return true;
      }
    }

    return false;
  };

  useEffect(() => {
    // Hydrate saved directory handle from IndexedDB on mount
    loadDirHandleFromIdb().then((handle) => {
      if (handle) {
        activeScreenshotsDirHandle = handle;
        window.dispatchEvent(
          new CustomEvent('dompt-android-folder-changed', {
            detail: { connected: true },
          })
        );
      }
    });

    const processSharedScreenshot = (): boolean => {
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

          openTransactionMenuWithScreenshot(sharedImage, sharedMime, false);
          return true;
        }

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('scan') === 'auto' || urlParams.get('scan') === 'open') {
          window.history.replaceState({}, document.title, window.location.pathname);
          openTransactionMenuWithScreenshot(undefined, undefined, true);
          return true;
        }
      } catch (err) {
        console.error('Error processing shared screenshot:', err);
      }
      return false;
    };

    if (processSharedScreenshot()) return;

    // Multi-step retry schedule so we catch clipboard/folder after Android finishes window focus transition
    const runRetrySchedule = (wasReturningFromExternalApp: boolean) => {
      const delays = [60, 280, 650, 1200];
      let resolved = false;

      delays.forEach((delay, idx) => {
        setTimeout(async () => {
          if (resolved) return;
          const found = await checkAndOpenIfNewScreenshot(false);
          if (found) {
            resolved = true;
            return;
          }
          // If the user on Android just switched back from another app (e.g. SeaBank after taking SS)
          // and after 300ms silent clipboard/folder read was blocked by Android browser waiting for a touch,
          // open the Menu Pencatatan Transaksi (AddTransactionModal) immediately so 1 touch loads the SS & confirms!
          if (
            idx === 1 &&
            wasReturningFromExternalApp &&
            detectIsAndroidDevice() &&
            isAndroidAutoSsEnabled() &&
            !isAddTransactionOpen &&
            !isScanModalOpen
          ) {
            resolved = true;
            openTransactionMenuWithScreenshot(undefined, undefined, true);
          }
        }, delay);
      });
    };

    // Check if Android reloaded the tab right after returning from an external app (like SeaBank)
    const lastLeaveStr = localStorage.getItem(LAST_LEAVE_TS_KEY);
    const lastLeaveTs = lastLeaveStr ? Number(lastLeaveTsStr(lastLeaveStr)) : 0;
    const msSinceLeave = lastLeaveTs > 0 ? Date.now() - lastLeaveTs : 0;
    const isColdReturnFromApp = msSinceLeave >= 1500 && msSinceLeave <= 10 * 60 * 1000;
    if (lastLeaveTs > 0) {
      localStorage.removeItem(LAST_LEAVE_TS_KEY);
    }

    if (detectIsAndroidDevice() && isAndroidAutoSsEnabled()) {
      runRetrySchedule(isColdReturnFromApp);
    }

    const recordAppLeave = () => {
      try {
        localStorage.setItem(LAST_LEAVE_TS_KEY, String(Date.now()));
      } catch {}
      pendingGestureCheckRef.current = true;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordAppLeave();
      } else if (document.visibilityState === 'visible') {
        if (processSharedScreenshot()) return;
        const storedLeave = Number(localStorage.getItem(LAST_LEAVE_TS_KEY) || '0');
        const awayMs = storedLeave > 0 ? Date.now() - storedLeave : 0;
        localStorage.removeItem(LAST_LEAVE_TS_KEY);
        pendingGestureCheckRef.current = true;

        if (detectIsAndroidDevice() && isAndroidAutoSsEnabled()) {
          runRetrySchedule(awayMs >= 1500);
        }
      }
    };

    const handleWindowFocusOrShow = () => {
      if (processSharedScreenshot()) return;
      pendingGestureCheckRef.current = true;
      if (detectIsAndroidDevice() && isAndroidAutoSsEnabled()) {
        runRetrySchedule(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', recordAppLeave);
    window.addEventListener('blur', recordAppLeave);
    window.addEventListener('pageshow', handleWindowFocusOrShow);
    window.addEventListener('focus', handleWindowFocusOrShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', recordAppLeave);
      window.removeEventListener('blur', recordAppLeave);
      window.removeEventListener('pageshow', handleWindowFocusOrShow);
      window.removeEventListener('focus', handleWindowFocusOrShow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Capture user gesture (pointerdown / click) on Android to unlock clipboard / directory handle if needed
  useEffect(() => {
    const handleGesture = async () => {
      if (!pendingGestureCheckRef.current) return;
      if (!detectIsAndroidDevice() || !isAndroidAutoSsEnabled()) return;
      pendingGestureCheckRef.current = false;
      await checkAndOpenIfNewScreenshot(true);
    };

    window.addEventListener('pointerdown', handleGesture, { capture: true, passive: true });
    window.addEventListener('click', handleGesture, { capture: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleGesture, { capture: true });
      window.removeEventListener('click', handleGesture, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddTransactionOpen, isScanModalOpen]);

  // Global window paste listener (when user pastes an image via Android keyboard clipboard or Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
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
                openTransactionMenuWithScreenshot(base64, blob.type, false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function lastLeaveTsStr(val: string): string {
  return val.replace(/\D/g, '');
}
