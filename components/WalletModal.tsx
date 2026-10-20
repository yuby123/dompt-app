'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2 } from 'lucide-react';
import { useApp } from './AppContext';
import { WalletType } from '@/lib/types';
import { formatNominalInput, parseNominalInput } from '@/lib/formatters';

const WALLET_TYPE_OPTIONS: { type: WalletType; label: string; icon: string; defaultColor: string }[] = [
  { type: 'cash', label: 'Tunai', icon: 'Banknote', defaultColor: '#16A34A' },
  { type: 'ewallet', label: 'E-Wallet', icon: 'Smartphone', defaultColor: '#0F766E' },
  { type: 'bank', label: 'Rekening Bank', icon: 'Landmark', defaultColor: '#2563EB' },
  { type: 'savings', label: 'Tabungan', icon: 'PiggyBank', defaultColor: '#8B5CF6' },
  { type: 'investment', label: 'Investasi', icon: 'TrendingUp', defaultColor: '#EC4899' },
  { type: 'credit', label: 'Kartu Kredit', icon: 'CreditCard', defaultColor: '#DC2626' },
  { type: 'paylater', label: 'Paylater', icon: 'CalendarClock', defaultColor: '#EA580C' },
  { type: 'other', label: 'Lainnya', icon: 'Wallet', defaultColor: '#6B7280' },
];

function WalletModalForm() {
  const { setIsWalletModalOpen, editingWallet, addWallet, updateWallet, deleteWallet } = useApp();

  const [name, setName] = useState(() => editingWallet?.name || '');
  const [type, setType] = useState<WalletType>(() => editingWallet?.type || 'ewallet');
  const [initialBalance, setInitialBalance] = useState<string>(() =>
    editingWallet ? formatNominalInput(Math.abs(editingWallet.initialBalance)) : '0'
  );
  const [color, setColor] = useState(() => editingWallet?.color || '#0F766E');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDebtType = type === 'credit' || type === 'paylater';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const rawNum = parseNominalInput(initialBalance);
    const balanceNum = isDebtType && rawNum > 0 ? -Math.abs(rawNum) : rawNum;
    const selectedOption = WALLET_TYPE_OPTIONS.find((o) => o.type === type);

    if (editingWallet) {
      updateWallet(editingWallet.id, {
        name: name.trim(),
        type,
        initialBalance: balanceNum,
        color,
        icon: selectedOption?.icon || editingWallet.icon || 'Wallet',
      });
    } else {
      addWallet({
        name: name.trim(),
        type,
        initialBalance: balanceNum,
        color,
        icon: selectedOption?.icon || 'Wallet',
      });
    }

    setIsWalletModalOpen(false);
  };

  const handleDelete = () => {
    if (!editingWallet) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const deleted = deleteWallet(editingWallet.id);
    if (deleted) {
      setIsWalletModalOpen(false);
    }
  };

  return (
    <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-2xl border border-black/5 dark:border-white/10">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {editingWallet ? 'Edit Dompet' : 'Tambah Dompet Baru'}
        </h2>
        <div className="flex items-center gap-2">
          {editingWallet && (
            <button
              type="button"
              onClick={handleDelete}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                confirmDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
              }`}
              title="Hapus dompet"
            >
              <Trash2 size={16} />
              {confirmDelete && <span>Yakin Hapus?</span>}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsWalletModalOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Nama Dompet</label>
          <input
            type="text"
            placeholder="Misal: DANA Pribadi, BCA, ShopeePay"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">Tipe Dompet</label>
          <div className="grid grid-cols-4 gap-2">
            {WALLET_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  setType(opt.type);
                  setColor(opt.defaultColor);
                }}
                className={`p-2.5 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  type === opt.type
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 ring-1 ring-teal-600'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">
            {isDebtType ? 'Tagihan Berjalan / Saldo Awal (Rp)' : 'Saldo Awal (Rp)'}
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={initialBalance}
            onChange={(e) => setInitialBalance(formatNominalInput(e.target.value))}
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-base font-bold text-teal-700 dark:text-teal-400 focus:ring-2 focus:ring-teal-500"
          />
          {isDebtType && (
            <p className="text-[11px] text-gray-400 mt-1">
              Otomatis dicatat sebagai kewajiban / tagihan mendatang.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">Pilihan Warna Label</label>
          <div className="flex gap-2">
            {['#0F766E', '#16A34A', '#2563EB', '#8B5CF6', '#EC4899', '#F97316', '#DC2626', '#6B7280'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                  color === c ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={() => setIsWalletModalOpen(false)}
            className="flex-1 py-3 text-sm font-semibold rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="flex-2 py-3 text-sm font-black rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black shadow-md cursor-pointer"
          >
            {editingWallet ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function WalletModal() {
  const { isWalletModalOpen, editingWallet } = useApp();

  if (!isWalletModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md"
        >
          <WalletModalForm key={editingWallet ? editingWallet.id : 'new-wallet'} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
