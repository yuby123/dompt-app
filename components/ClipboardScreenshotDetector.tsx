'use client';

import { useEffect, useRef } from 'react';
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
  const { openScanModal, isScanModalOpen } = useApp();
  const lastProcessedRef = useRef<string>('');

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

  // 2. Global window paste listener (only when user explicitly pastes an image via Ctrl+V / Paste)
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
              if (base64 && base64 !== lastProcessedRef.current) {
                lastProcessedRef.current = base64;
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

  return null;
}
