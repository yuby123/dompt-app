'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Delete, ShieldAlert } from 'lucide-react';
import { useApp } from './AppContext';

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

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (cooldownSeconds > 0) return;
    if (pinInput.length < targetLength) {
      const next = pinInput + digit;
      setPinInput(next);
      setErrorMessage('');

      if (next.length === targetLength) {
        // verify
        const isValid = verifyPinCode(next);
        if (isValid) {
          setFailedCount(0);
          setPinInput('');
          unlockApp();
        } else {
          const nextFailed = failedCount + 1;
          setFailedCount(nextFailed);
          setPinInput('');
          if (nextFailed >= 5) {
            setCooldownSeconds(30);
            setErrorMessage('Terlalu banyak percobaan. Tunggu 30 detik.');
          } else {
            setErrorMessage(`PIN salah (${5 - nextFailed} percobaan tersisa)`);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    if (cooldownSeconds > 0) return;
    setPinInput((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080A0D] text-white overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm flex flex-col items-center text-center space-y-5 landscape:space-y-3 py-4 my-auto"
      >
        <div className="w-14 h-14 landscape:w-12 landscape:h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
          <Lock size={28} />
        </div>

        <div>
          <h2 className="text-2xl landscape:text-xl font-black tracking-tight">FadDompet</h2>
          <p className="text-xs text-gray-400 mt-0.5">Masukkan PIN untuk membuka dompet</p>
        </div>

        {/* PIN indicator dots */}
        <div className="flex gap-4 my-1">
          {Array.from({ length: targetLength }).map((_, idx) => {
            const isFilled = idx < pinInput.length;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-teal-400 scale-110 shadow-lg shadow-teal-500/50'
                    : 'bg-gray-800 border border-gray-700'
                }`}
              />
            );
          })}
        </div>

        {errorMessage && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/40 px-3 py-1.5 rounded-full border border-red-800/50">
            <ShieldAlert size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        {cooldownSeconds > 0 && (
          <p className="text-sm font-semibold text-amber-400">
            Coba lagi dalam {cooldownSeconds} detik
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={cooldownSeconds > 0}
              onClick={() => handleDigit(digit)}
              className="h-14 landscape:h-11 text-xl font-bold rounded-2xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 text-white active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            disabled={cooldownSeconds > 0}
            onClick={() => handleDigit('0')}
            className="h-14 landscape:h-11 text-xl font-bold rounded-2xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 text-white active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            disabled={cooldownSeconds > 0}
            onClick={handleBackspace}
            className="h-14 landscape:h-11 flex items-center justify-center rounded-2xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 text-gray-400 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
          >
            <Delete size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
