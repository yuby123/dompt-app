'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Delete, ShieldAlert } from 'lucide-react';
import { useApp } from './AppContext';
import { BrandLogo } from './BrandLogo';

export function AppLockModal() {
  const { isLocked, unlockApp, verifyPinCode, settings } = useApp();
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [failedCount, setFailedCount] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const targetLength = settings.pinLength || 4;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownSeconds > 0) {
      timer = setTimeout(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const handleDigit = useCallback(
    (digit: string) => {
      if (cooldownSeconds > 0) return;
      setPinInput((prev) => {
        if (prev.length >= targetLength) return prev;
        const next = prev + digit;
        setErrorMessage('');

        if (next.length === targetLength) {
          const isValid = verifyPinCode(next);
          if (isValid) {
            setFailedCount(0);
            setTimeout(() => {
              setPinInput('');
              unlockApp();
            }, 60);
          } else {
            const nextFailed = failedCount + 1;
            setFailedCount(nextFailed);
            setTimeout(() => setPinInput(''), 120);
            if (nextFailed >= 5) {
              setCooldownSeconds(30);
              setErrorMessage('Terlalu banyak percobaan. Tunggu 30 detik.');
            } else {
              setErrorMessage(`PIN salah (${5 - nextFailed} sisa percobaan)`);
            }
          }
        }
        return next;
      });
    },
    [cooldownSeconds, targetLength, verifyPinCode, unlockApp, failedCount]
  );

  const handleBackspace = useCallback(() => {
    if (cooldownSeconds > 0) return;
    setPinInput((prev) => prev.slice(0, -1));
  }, [cooldownSeconds]);

  useEffect(() => {
    if (!isLocked) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLocked, handleDigit, handleBackspace]);

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080A0D] text-white overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xs flex flex-col items-center text-center space-y-5 landscape:space-y-3 py-4 my-auto"
      >
        <BrandLogo size="xl" className="landscape:w-12 landscape:h-12 shadow-lg" />

        <div>
          <h2 className="font-display text-2xl landscape:text-xl font-extrabold tracking-tight">
            Dompt.
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Masukkan PIN 4 digit</p>
        </div>

        {/* PIN indicator dots */}
        <div className="flex gap-3.5 my-1">
          {Array.from({ length: targetLength }).map((_, idx) => {
            const isFilled = idx < pinInput.length;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-[#D4F826] scale-110 shadow-sm shadow-[#D4F826]/40'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {errorMessage && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
            <ShieldAlert size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {cooldownSeconds > 0 && (
          <p className="text-xs font-mono tabular-nums font-semibold text-amber-400">
            Coba lagi dalam {cooldownSeconds}d
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={cooldownSeconds > 0}
              onClick={() => handleDigit(digit)}
              className="h-14 landscape:h-11 font-mono text-xl font-bold rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-white active:scale-95 transition-all disabled:opacity-30 cursor-pointer tabular-nums"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            disabled={cooldownSeconds > 0}
            onClick={() => handleDigit('0')}
            className="h-14 landscape:h-11 font-mono text-xl font-bold rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-white active:scale-95 transition-all disabled:opacity-30 cursor-pointer tabular-nums"
          >
            0
          </button>
          <button
            type="button"
            disabled={cooldownSeconds > 0}
            onClick={handleBackspace}
            aria-label="Hapus digit"
            className="h-14 landscape:h-11 flex items-center justify-center rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
          >
            <Delete size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
