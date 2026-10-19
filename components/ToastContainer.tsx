'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from './AppContext';

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex flex-col items-center pointer-events-none px-4 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-3 py-3 px-4 rounded-2xl shadow-xl max-w-sm w-full border backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-red-950/90 text-white border-red-800'
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
  );
}
