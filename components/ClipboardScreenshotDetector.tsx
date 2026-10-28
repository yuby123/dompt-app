'use client';

import React, { useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { Wallet, Category, TransactionType, ExpenseNature } from '@/lib/types';
import { detectExpenseNature } from '@/lib/budgetUtils';

const PROCESSED_HASHES_KEY = 'dompt_processed_ss_hashes_v3';
const ANDROID_AUTOSS_ENABLED_KEY = 'dompt_android_autoss_enabled';
const LAST_LEAVE_TS_KEY = 'dompt_android_last_leave_ts';

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
  isPollingNewScreenshot?: boolean;
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
 * Resolves the best matching Wallet ID, Category ID, ExpenseNature, and formatted Note
 * from OCR extracted receipt data.
 * Prioritizes exact bank/e-wallet brand match (e.g. SeaBank -> SeaBank wallet) before generic type fallback.
 */
export function resolveWalletAndCategoryFromOcr(
  data: ExtractedScreenshotData,
  walletsWithBalance: (Wallet & { balance: number })[],
  wallets: Wallet[],
  categories: Category[]
): {
  resolvedWalletId: string;
  resolvedCategoryId: string;
  resolvedNature: ExpenseNature;
  noteStr: string;
} {
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

  // Build informative note (keterangan) combining title, notes, and sourceApp
  const rawNotes = (data.notes || '').trim();
  const rawTitle = (data.title || '').trim();
  const rawSource = (data.sourceApp || '').trim();
  let noteStr = rawNotes || rawTitle;
  if (rawTitle && rawNotes && !rawNotes.toLowerCase().includes(rawTitle.toLowerCase())) {
    noteStr = `${rawTitle} - ${rawNotes}`;
  }
  if (rawSource && noteStr && !noteStr.toLowerCase().includes(rawSource.toLowerCase())) {
    noteStr = `[${rawSource}] ${noteStr}`;
  } else if (!noteStr && rawSource) {
    noteStr = `Transaksi ${rawSource}`;
  }

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const resolvedNature: ExpenseNature =
    data.type === 'expense'
      ? detectExpenseNature(resolvedCategoryId, noteStr, catMap)
      : 'variable';

  return { resolvedWalletId, resolvedCategoryId, resolvedNature, noteStr };
}

/**
 * Generates a fast, deterministic fingerprint for a base64 image.
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
    localStorage.setItem(PROCESSED_HASHES_KEY, JSON.stringify(safeList.slice(0, 30)));
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

let activeScreenshotsDirHandle: any = null;

export function getActiveScreenshotsDirHandle(): any {
  return activeScreenshotsDirHandle;
}

export function setActiveScreenshotsDirHandle(handle: any): void {
  activeScreenshotsDirHandle = handle;
}

export async function readLatestScreenshotFromConnectedFolder(
  _allowRequestPermission = false,
  _ignoreProcessedHash = false
): Promise<{
  base64: string;
  mimeType: string;
  fileName?: string;
} | null> {
  return null;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Single in-flight Promise lock so concurrent calls never abort Chromium's ClipboardAndroid PNG encoder!
let inFlightClipboardRead: Promise<{
  base64: string;
  mimeType: string;
} | null> | null = null;

/**
 * Reads the latest screenshot image from the system clipboard.
 * Uses a single-flight mutex so Android's 500-1200ms bitmap decoding in item.getType('image/png')
 * is NEVER aborted by overlapping timers.
 */
export async function readLatestImageFromClipboard(
  ignoreProcessedHash = true
): Promise<{
  base64: string;
  mimeType: string;
} | null> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.read) {
    return null;
  }

  if (inFlightClipboardRead) {
    return inFlightClipboardRead;
  }

  inFlightClipboardRead = (async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        // 1. Try all image/* MIME types present on the ClipboardItem
        const imageTypes = item.types.filter((t) => t.startsWith('image/'));
        for (const imageType of imageTypes) {
          try {
            const blob = await item.getType(imageType);
            if (!blob || blob.size === 0) continue;
            const base64 = await blobToBase64(blob);
            if (base64) {
              const fp = computeScreenshotFingerprint(base64);
              if (!ignoreProcessedHash && hasScreenshotBeenProcessed(fp)) {
                continue;
              }
              return { base64, mimeType: blob.type || imageType || 'image/png' };
            }
          } catch {
            // Try next image type if any
          }
        }

        // 2. Fallback: check if clipboard item has text/html with embedded data:image/* or blob:
        if (item.types.includes('text/html')) {
          try {
            const htmlBlob = await item.getType('text/html');
            const htmlText = await htmlBlob.text();
            const dataMatch = htmlText.match(
              /src=["'](data:image\/([a-zA-Z0-9+.-]+);base64,[^"']+)["']/i
            );
            if (dataMatch && dataMatch[1]) {
              const fp = computeScreenshotFingerprint(dataMatch[1]);
              if (!ignoreProcessedHash && hasScreenshotBeenProcessed(fp)) {
                continue;
              }
              return {
                base64: dataMatch[1],
                mimeType: `image/${dataMatch[2] || 'png'}`,
              };
            }
          } catch {
            // Ignore HTML fallback error
          }
        }
      }
    } catch {
      // Clipboard read requires focus or user gesture on some mobile browsers
    } finally {
      inFlightClipboardRead = null;
    }
    return null;
  })();

  return inFlightClipboardRead;
}

export function ClipboardScreenshotDetector() {
  const { openAddTransaction, isAddTransactionOpen, isScanModalOpen, goToCurrentPeriod } = useApp();
  const lastInSessionFpRef = useRef<string>('');

  /**
   * Opens the Menu Pencatatan Transaksi (AddTransactionModal) directly with the detected screenshot
   * (or in active clipboard-reading mode when returning from SeaBank/m-Banking).
   */
  const openTransactionMenuWithScreenshot = (
    base64?: string,
    mimeType?: string,
    awaitingTouchUnlock = false,
    isPollingNewScreenshot = false
  ) => {
    if (base64) {
      const fp = computeScreenshotFingerprint(base64);
      lastInSessionFpRef.current = fp;
    }
    goToCurrentPeriod();
    setPendingScreenshotForModal({
      base64,
      mimeType: mimeType || 'image/jpeg',
      awaitingTouchUnlock,
      isPollingNewScreenshot,
      timestamp: Date.now(),
    });
    openAddTransaction('expense');
  };

  useEffect(() => {
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

          openTransactionMenuWithScreenshot(sharedImage, sharedMime, false, false);
          return true;
        }

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('scan') === 'auto' || urlParams.get('scan') === 'open') {
          window.history.replaceState({}, document.title, window.location.pathname);
          openTransactionMenuWithScreenshot(undefined, undefined, true, true);
          return true;
        }
      } catch (err) {
        console.error('Error processing shared screenshot:', err);
      }
      return false;
    };

    if (processSharedScreenshot()) return;

    /**
     * When the user enters or returns to the app on Android:
     * 1. If returning from an external app (like SeaBank after taking SS), immediately open
     *    AddTransactionModal (Catat Transaksi) and let AddTransactionModal run its sequential
     *    clipboard reader without any competing timers!
     * 2. Otherwise on initial fresh app open, do a sequential check for a new clipboard image.
     */
    const handleAppEnterOrReturn = async (wasReturningFromExternalApp: boolean) => {
      if (!detectIsAndroidDevice() || !isAndroidAutoSsEnabled()) return;

      if (wasReturningFromExternalApp) {
        lastInSessionFpRef.current = '';
        if (!isAddTransactionOpen && !isScanModalOpen) {
          openTransactionMenuWithScreenshot(undefined, undefined, false, true);
        } else {
          // Modal is already open — notify it to re-poll the latest clipboard image!
          setPendingScreenshotForModal({
            isPollingNewScreenshot: true,
            timestamp: Date.now(),
          });
        }
        return;
      }

      // Fresh app launch: check sequentially (wait for each read to finish before next attempt)
      for (let attempt = 0; attempt < 4; attempt++) {
        const clipImg = await readLatestImageFromClipboard(false);
        if (clipImg?.base64) {
          const fp = computeScreenshotFingerprint(clipImg.base64);
          if (fp && fp !== lastInSessionFpRef.current && !hasScreenshotBeenProcessed(fp)) {
            openTransactionMenuWithScreenshot(clipImg.base64, clipImg.mimeType, false, false);
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 400));
      }
    };

    // Check if Android reloaded the tab right after returning from an external app (like SeaBank)
    const lastLeaveStr = localStorage.getItem(LAST_LEAVE_TS_KEY);
    const lastLeaveTs = lastLeaveStr ? Number(lastLeaveStr.replace(/\D/g, '')) : 0;
    const msSinceLeave = lastLeaveTs > 0 ? Date.now() - lastLeaveTs : 0;
    const isColdReturnFromApp = msSinceLeave >= 1000 && msSinceLeave <= 15 * 60 * 1000;
    if (lastLeaveTs > 0) {
      localStorage.removeItem(LAST_LEAVE_TS_KEY);
    }

    handleAppEnterOrReturn(isColdReturnFromApp);

    const recordAppLeave = () => {
      try {
        localStorage.setItem(LAST_LEAVE_TS_KEY, String(Date.now()));
      } catch {}
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordAppLeave();
      } else if (document.visibilityState === 'visible') {
        if (processSharedScreenshot()) return;
        const storedLeave = Number((localStorage.getItem(LAST_LEAVE_TS_KEY) || '0').replace(/\D/g, ''));
        const awayMs = storedLeave > 0 ? Date.now() - storedLeave : 0;
        localStorage.removeItem(LAST_LEAVE_TS_KEY);

        handleAppEnterOrReturn(awayMs >= 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', recordAppLeave);
    window.addEventListener('blur', recordAppLeave);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', recordAppLeave);
      window.removeEventListener('blur', recordAppLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                openTransactionMenuWithScreenshot(base64, blob.type, false, false);
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
