'use client';

import React, { useState } from 'react';
import {
  Plus,
  Landmark,
  Coins,
  Building,
  TrendingUp,
  Lightbulb,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';

export function AssetsTab() {
  const { walletsWithBalance, totalBalance, settings, addToast } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assetType, setAssetType] = useState<'liquid' | 'fixed'>('liquid');
  const [assetName, setAssetName] = useState('');
  const [assetAmount, setAssetAmount] = useState('');

  const [liquidAssets, setLiquidAssets] = useState<{ id: string; name: string; amount: number }[]>([]);
  const [fixedAssets, setFixedAssets] = useState<{ id: string; name: string; amount: number }[]>([]);

  const hide = settings.hideBalance;

  const totalLiquid = liquidAssets.reduce((acc, a) => acc + a.amount, 0);
  const totalFixed = fixedAssets.reduce((acc, a) => acc + a.amount, 0);
  const totalNetWorth = totalBalance + totalLiquid + totalFixed;

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(assetAmount.replace(/\D/g, ''));
    if (!assetName.trim() || amountVal <= 0) return;

    const newAsset = {
      id: `asset-${Date.now()}`,
      name: assetName.trim(),
      amount: amountVal,
    };

    if (assetType === 'liquid') {
      setLiquidAssets([...liquidAssets, newAsset]);
    } else {
      setFixedAssets([...fixedAssets, newAsset]);
    }

    addToast('Aset Ditambahkan', `${assetName} berhasil dicatat.`);
    setIsAddModalOpen(false);
    setAssetName('');
    setAssetAmount('');
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 px-1">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Aset
          </h1>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">
            Tingkatkan kekayaanmu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="w-10 h-10 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center font-bold shadow-xs cursor-pointer"
          title="Tambah Aset"
        >
          <Plus size={20} strokeWidth={2.6} />
        </button>
      </div>

      {/* Hero Dark Card */}
      <div className="bg-[#14161C] rounded-3xl p-5 text-white shadow-xl space-y-4 border border-white/5">
        <span className="text-[10px] font-black text-[#D4F826] uppercase tracking-wider block">
          ESTIMASI KEKAYAAN
        </span>

        <div className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums text-white">
          {formatRupiah(totalNetWorth, hide)}
        </div>

        {/* Runway Pill */}
        <div className="inline-flex items-center gap-2 bg-[#1C2417] border border-[#2D3F1D] px-3 py-1.5 rounded-2xl">
          <span className="text-lg">🌱</span>
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
              TOTAL RUNWAY
            </span>
            <span className="text-xs font-black text-[#D4F826]">5.3 Bulan</span>
          </div>
        </div>

        {/* Level Saat Ini Progress */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <div>
              <span className="text-[10px] text-gray-400 uppercase block font-medium">
                LEVEL SAAT INI
              </span>
              <span className="text-sm font-black text-white">Mulai Bangkit</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 uppercase block font-medium">
                TARGET BERIKUTNYA
              </span>
              <span className="text-xs font-black text-[#D4F826] tabular-nums">
                {formatRupiah(24000000, hide)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
            <span>PROGRES KE LEVEL BERIKUTNYA</span>
            <span className="font-bold text-[#D4F826]">88%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-[#D4F826]" style={{ width: '88%' }} />
          </div>
        </div>

        {/* 3 Summary Boxes */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
          <div className="bg-white/5 p-2.5 rounded-2xl">
            <span className="text-[9px] text-gray-400 font-bold block truncate">DOMPET & AKUN</span>
            <span className="text-xs font-black text-white mt-0.5 block tabular-nums truncate">
              {formatRupiah(totalBalance, hide)}
            </span>
          </div>

          <div className="bg-white/5 p-2.5 rounded-2xl">
            <span className="text-[9px] text-gray-400 font-bold block truncate">ASET LIKUID</span>
            <span className="text-xs font-black text-white mt-0.5 block tabular-nums truncate">
              {formatRupiah(totalLiquid, hide)}
            </span>
          </div>

          <div className="bg-white/5 p-2.5 rounded-2xl">
            <span className="text-[9px] text-gray-400 font-bold block truncate">ASET TETAP</span>
            <span className="text-xs font-black text-white mt-0.5 block tabular-nums truncate">
              {formatRupiah(totalFixed, hide)}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Dompet & Akun Section */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex items-center gap-2">
          <Landmark size={18} className="text-[#84CC16]" />
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Dompet & Akun</h3>
        </div>

        <div className="space-y-2">
          {walletsWithBalance.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/40"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: w.color || '#2563EB' }}
                >
                  <Landmark size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-gray-900 dark:text-white">{w.name}</h4>
                  <span className="text-[10px] text-gray-400 capitalize">{w.type}</span>
                </div>
              </div>
              <span
                className={`text-xs font-black tabular-nums ${
                  w.balance < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'
                }`}
              >
                {formatRupiah(w.balance, hide)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Aset Likuid Section */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-amber-500" />
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Aset Likuid</h3>
          </div>
        </div>

        {liquidAssets.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-xs text-gray-400">Belum ada aset.</p>
            <button
              type="button"
              onClick={() => {
                setAssetType('liquid');
                setIsAddModalOpen(true);
              }}
              className="text-xs font-extrabold text-[#84CC16] hover:underline cursor-pointer"
            >
              Tambah Aset
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {liquidAssets.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs"
              >
                <span className="font-bold text-gray-800 dark:text-gray-200">{a.name}</span>
                <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
                  {formatRupiah(a.amount, hide)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Aset Tetap Section */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building size={18} className="text-blue-500" />
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Aset Tetap</h3>
          </div>
        </div>

        {fixedAssets.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-xs text-gray-400">Belum ada aset.</p>
            <button
              type="button"
              onClick={() => {
                setAssetType('fixed');
                setIsAddModalOpen(true);
              }}
              className="text-xs font-extrabold text-[#84CC16] hover:underline cursor-pointer"
            >
              Tambah Aset
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {fixedAssets.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs"
              >
                <span className="font-bold text-gray-800 dark:text-gray-200">{a.name}</span>
                <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
                  {formatRupiah(a.amount, hide)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip Card */}
      <div className="bg-gray-50 dark:bg-gray-800/40 rounded-3xl p-4.5 border border-gray-100 dark:border-gray-800 flex items-start gap-3 text-xs text-gray-600 dark:text-gray-300">
        <Lightbulb size={20} className="text-[#84CC16] shrink-0 mt-0.5" />
        <div>
          <h4 className="font-extrabold text-gray-900 dark:text-white">Tip:</h4>
          <p className="mt-0.5 leading-relaxed">
            Aset Likuid adalah aset yang gampang dicairkan menjadi uang tunai (seperti reksadana pasar uang atau emas). Aset Tetap adalah aset jangka panjang (seperti tanah, rumah, atau kendaraan).
          </p>
        </div>
      </div>

      {/* Modal: Tambah Aset */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Tambah Aset
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddAsset} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Tipe Aset</label>
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value as any)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  >
                    <option value="liquid">Aset Likuid (Reksadana, Emas, Saham)</option>
                    <option value="fixed">Aset Tetap (Kendaraan, Properti, Tanah)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Nama Aset</label>
                  <input
                    type="text"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="e.g. Emas Antam 10gr, Mobil Honda"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Nilai Aset (Rp)
                  </label>
                  <input
                    type="text"
                    value={assetAmount}
                    onChange={(e) => setAssetAmount(e.target.value)}
                    placeholder="Rp 15.000.000"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-[#D4F826] text-black text-xs font-black shadow-xs cursor-pointer hover:bg-[#c6ec15]"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
