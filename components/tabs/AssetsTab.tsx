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
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { formatRupiah, formatNominalInput, parseNominalInput } from '@/lib/formatters';

export function AssetsTab() {
  const {
    walletsWithBalance,
    totalBalance,
    dashboardSummary,
    debts,
    investments,
    settings,
    liquidAssets,
    fixedAssets,
    addAsset,
    deleteAsset,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assetType, setAssetType] = useState<'liquid' | 'fixed'>('liquid');
  const [assetName, setAssetName] = useState('');
  const [assetAmount, setAssetAmount] = useState('');

  const hide = settings.hideBalance;

  const totalLiquid = liquidAssets.reduce((acc, a) => acc + a.amount, 0);
  const totalFixed = fixedAssets.reduce((acc, a) => acc + a.amount, 0);
  const totalInvestments = (investments || []).reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const totalPayableDebts = (debts || [])
    .filter((d) => d.type === 'payable' && d.status === 'active')
    .reduce((acc, d) => acc + Math.max(0, d.remainingAmount ?? d.totalAmount), 0);

  // Net Worth = Total Assets (Wallets + Liquid Assets + Fixed Assets + Investments) - Active Payable Debts
  const totalNetWorth = totalBalance + totalLiquid + totalFixed + totalInvestments - totalPayableDebts;

  // Dynamic Runway & Wealth Level (aligned with dashboardSummary baseline)
  const totalRunwayMonths = dashboardSummary.emergencyFundRunwayMonths || 0;

  const nextTarget =
    totalNetWorth <= 0
      ? 10000000
      : totalNetWorth < 10000000
      ? 10000000
      : totalNetWorth < 24000000
      ? 24000000
      : totalNetWorth < 100000000
      ? 100000000
      : 500000000;

  const levelLabel =
    totalNetWorth <= 0
      ? 'Mulai Mencatat'
      : totalNetWorth < 10000000
      ? 'Langkah Awal'
      : totalNetWorth < 24000000
      ? 'Mulai Bangkit'
      : totalNetWorth < 100000000
      ? 'Mapan Finansial'
      : 'Merdeka Finansial';

  const progressPct =
    totalNetWorth > 0 ? Math.min(100, Math.round((totalNetWorth / nextTarget) * 100)) : 0;

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseNominalInput(assetAmount);
    if (!assetName.trim() || amountVal <= 0) return;

    addAsset(assetType, {
      name: assetName.trim(),
      amount: amountVal,
    });

    setIsAddModalOpen(false);
    setAssetName('');
    setAssetAmount('');
  };

  const handleDeleteAsset = (type: 'liquid' | 'fixed', id: string) => {
    deleteAsset(type, id);
  };

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pt-1 lg:pt-0 px-0.5">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
            Aset & Kekayaan
          </h1>
          <p className="text-xs lg:text-sm font-semibold text-gray-400 mt-0.5 truncate">
            Tingkatkan kekayaan bersihmu secara konsisten.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="h-10 px-4 rounded-full bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap shrink-0"
          title="Tambah Aset"
        >
          <Plus size={16} strokeWidth={2.8} />
          <span>Tambah Aset</span>
        </button>
      </div>

      {/* Full-Width Dark Hero Card (matching Dashboard & Wallets theme-adaptive gradient style) */}
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-[28px] lg:rounded-[32px] p-5 lg:px-9 lg:py-7 text-white shadow-xl space-y-5 border border-white/10">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#8B5CF6]/20 blur-3xl pointer-events-none transition-colors duration-500" />
        <div
          className={`absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            settings.accentColor === 'orange'
              ? 'bg-[#FF6B2B]/15'
              : settings.accentColor === 'pink'
              ? 'bg-[#FFA4A4]/15'
              : 'bg-[#D4F826]/15'
          }`}
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="text-[10px] font-black text-[#D4F826] uppercase tracking-widest block">
              ESTIMASI KEKAYAAN
            </span>
            <div className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight tabular-nums text-white mt-1 leading-none">
              {formatRupiah(totalNetWorth, hide)}
            </div>
          </div>

          {/* Runway Pill */}
          <div className="inline-flex items-center gap-2.5 bg-[#1C2417] border border-[#2D3F1D] px-4 py-2 rounded-2xl self-start lg:self-center">
            <span className="text-lg">🌱</span>
            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                TOTAL RUNWAY
              </span>
              <span className="text-xs font-black text-[#D4F826]">{totalRunwayMonths} Bulan</span>
            </div>
          </div>
        </div>

        {/* Level Saat Ini Progress */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <div>
              <span className="text-[10px] text-gray-400 uppercase block font-medium">
                LEVEL SAAT INI
              </span>
              <span className="text-sm font-black text-white">{levelLabel}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 uppercase block font-medium">
                TARGET BERIKUTNYA
              </span>
              <span className="text-xs font-black text-[#D4F826] tabular-nums">
                {formatRupiah(nextTarget, hide)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
            <span>PROGRES KE LEVEL BERIKUTNYA</span>
            <span className="font-bold text-[#D4F826]">{progressPct}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#D4F826] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* 3 Summary Boxes */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-center">
          <div className="bg-white/5 p-3 rounded-2xl">
            <span className="text-[9px] lg:text-[10px] text-gray-400 font-bold block truncate">
              DOMPET & AKUN
            </span>
            <span className="text-xs lg:text-sm font-black text-white mt-0.5 block tabular-nums truncate">
              {formatRupiah(totalBalance, hide)}
            </span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl">
            <span className="text-[9px] lg:text-[10px] text-gray-400 font-bold block truncate">
              ASET LIKUID
            </span>
            <span className="text-xs lg:text-sm font-black text-white mt-0.5 block tabular-nums truncate">
              {formatRupiah(totalLiquid, hide)}
            </span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl">
            <span className="text-[9px] lg:text-[10px] text-gray-400 font-bold block truncate">
              ASET TETAP
            </span>
            <span className="text-xs lg:text-sm font-black text-white mt-0.5 block tabular-nums truncate">
              {formatRupiah(totalFixed, hide)}
            </span>
          </div>
        </div>
      </div>

      {/* Asset Lists Section below the Full-Width Black Card */}
      <div className="space-y-4 lg:space-y-5">
        {/* 1. Dompet & Akun Section */}
        <div className="bg-white dark:bg-[#16181D] rounded-[28px] lg:rounded-[32px] p-5 lg:p-7 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
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
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs"
              >
                <span className="font-bold text-gray-800 dark:text-gray-200">{a.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
                    {formatRupiah(a.amount, hide)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteAsset('liquid', a.id)}
                    className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                    title="Hapus Aset"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
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
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs"
              >
                <span className="font-bold text-gray-800 dark:text-gray-200">{a.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
                    {formatRupiah(a.amount, hide)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteAsset('fixed', a.id)}
                    className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                    title="Hapus Aset"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
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
                    inputMode="numeric"
                    value={assetAmount}
                    onChange={(e) => setAssetAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 15.000.000"
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
