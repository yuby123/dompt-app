'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Wallet, Info, X } from 'lucide-react';
import { useApp } from './AppContext';
import { formatRupiah } from '@/lib/formatters';

export function ToastContainer() {
  const {
    toasts,
    removeToast,
    insufficientBalanceAlert,
    setInsufficientBalanceAlert,
  } = useApp();

  return (
    <>
      <div className="fixed top-4 inset-x-0 z-[120] flex flex-col items-center pointer-events-none px-4 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`pointer-events-auto flex items-center gap-3 py-3 px-4 rounded-2xl shadow-xl max-w-sm w-full border backdrop-blur-md ${
                toast.type === 'error'
                  ? 'bg-red-950/95 text-white border-red-700'
                  : toast.type === 'info'
                  ? 'bg-blue-950/90 text-white border-blue-800'
                  : 'bg-[#111827]/95 text-white border-teal-500/30'
              }`}
            >
              <div className="shrink-0">
                {toast.type === 'error' ? (
                  <AlertCircle size={18} className="text-red-400" />
                ) : toast.type === 'info' ? (
                  <Info size={18} className="text-blue-400" />
                ) : (
                  <CheckCircle2 size={18} className="text-teal-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight truncate">{toast.title}</p>
                {toast.message && (
                  <p className="text-[11px] text-gray-300 leading-tight mt-0.5 line-clamp-2">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Global Insufficient Wallet Balance Alert Modal */}
      <AnimatePresence>
        {insufficientBalanceAlert && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInsufficientBalanceAlert(null)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              className="relative w-full max-w-sm bg-[#111827] border-2 border-red-500/40 rounded-3xl p-6 shadow-2xl z-10 overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <button
                  type="button"
                  onClick={() => setInsufficientBalanceAlert(null)}
                  className="p-1.5 rounded-xl bg-gray-800/80 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <h3 className="text-base font-extrabold text-white mb-1">
                Uang di Dompet Tidak Cukup!
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed mb-4">
                Transaksi tidak dapat diproses karena saldo dompet tidak boleh minus. Nominal pembayaran melebihi saldo yang tersedia di{' '}
                <span className="font-bold text-white">{insufficientBalanceAlert.walletName}</span>.
              </p>

              <div className="bg-[#0B0F19] border border-gray-800 rounded-2xl p-3.5 space-y-2.5 mb-5">
                {insufficientBalanceAlert.transactionLabel && (
                  <div className="flex items-center justify-between text-[11px] pb-2 border-b border-gray-800/80">
                    <span className="text-gray-400">Transaksi</span>
                    <span className="font-bold text-gray-200 truncate max-w-[180px]">
                      {insufficientBalanceAlert.transactionLabel}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Wallet size={13} className="text-teal-400" />
                    Saldo {insufficientBalanceAlert.walletName}
                  </span>
                  <span className="font-bold text-teal-400">
                    {formatRupiah(insufficientBalanceAlert.walletBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Nominal Pembayaran</span>
                  <span className="font-bold text-white">
                    {formatRupiah(insufficientBalanceAlert.paymentAmount)}
                  </span>
                </div>
                <div className="pt-2 border-t border-red-500/20 flex items-center justify-between text-xs">
                  <span className="font-bold text-red-400">Kekurangan Saldo</span>
                  <span className="font-extrabold text-red-400">
                    -{formatRupiah(insufficientBalanceAlert.shortfall)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInsufficientBalanceAlert(null)}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/25 transition-all"
              >
                Mengerti, Sesuaikan Nominal / Dompet
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

