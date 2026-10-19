'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  Play,
  Pause,
  ArrowUpRight,
  RefreshCw,
  Wallet as WalletIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';

export interface RecurringItem {
  id: string;
  name: string;
  emoji: string;
  type: 'expense' | 'income';
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  billingDay: number;
  walletId: string;
  categoryId: string;
  isActive: boolean;
  lastRecordedPeriod?: string;
}

export function SubscriptionsTab() {
  const {
    wallets,
    categories,
    settings,
    addTransaction,
    addToast,
    user,
    activeYear,
    activeMonth,
    activeDay,
    dataResetVersion,
  } = useApp();

  const hide = settings.hideBalance;
  const currentPeriodKey = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`;

  const storageKey = user?.uid
    ? `budggt_subscriptions_${user.uid}`
    : 'budggt_subscriptions';
  const scopeKey = `${storageKey}_${dataResetVersion}`;

  const [subState, setSubState] = useState<{
    scope: string;
    items: RecurringItem[];
  } | null>(null);

  const items = useMemo<RecurringItem[]>(() => {
    if (subState?.scope === scopeKey) return subState.items;
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        return JSON.parse(raw);
      }
      return [];
    } catch {
      return [];
    }
  }, [subState, scopeKey, storageKey]);

  const saveItems = (updated: RecurringItem[]) => {
    setSubState({ scope: scopeKey, items: updated });
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎬');
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'weekly'>('monthly');
  const [billingDay, setBillingDay] = useState('1');
  const [walletId, setWalletId] = useState(wallets[0]?.id || 'wallet-bca');
  const [categoryId, setCategoryId] = useState('cat-tagihan');

  const quickPresets = [
    { name: 'Netflix', emoji: '🎬', type: 'expense' as const, cat: 'cat-hiburan', day: '5' },
    { name: 'Spotify', emoji: '🎵', type: 'expense' as const, cat: 'cat-hiburan', day: '10' },
    { name: 'WiFi & Internet', emoji: '🛜', type: 'expense' as const, cat: 'cat-tagihan', day: '20' },
    { name: 'Listrik PLN', emoji: '⚡', type: 'expense' as const, cat: 'cat-tagihan', day: '15' },
    { name: 'Sewa Kost / KPR', emoji: '🏠', type: 'expense' as const, cat: 'cat-tagihan', day: '1' },
    { name: 'Gaji Bulanan', emoji: '💰', type: 'income' as const, cat: 'cat-gaji', day: '25' },
  ];

  // Calculate monthly normalized totals
  const summary = useMemo(() => {
    let monthlyExpense = 0;
    let monthlyIncome = 0;
    let dueSoonCount = 0;

    items.forEach((item) => {
      if (!item.isActive) return;
      const monthlyEquivalent =
        item.frequency === 'monthly'
          ? item.amount
          : item.frequency === 'yearly'
          ? Math.round(item.amount / 12)
          : item.amount * 4;

      if (item.type === 'expense') {
        monthlyExpense += monthlyEquivalent;
      } else {
        monthlyIncome += monthlyEquivalent;
      }

      const isRecordedThisMonth = item.lastRecordedPeriod === currentPeriodKey;
      const daysUntil = item.billingDay - activeDay;
      if (!isRecordedThisMonth && daysUntil >= -3 && daysUntil <= 7) {
        dueSoonCount += 1;
      }
    });

    return {
      monthlyExpense,
      yearlyExpense: monthlyExpense * 12,
      monthlyIncome,
      dueSoonCount,
    };
  }, [items, activeDay, currentPeriodKey]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (filterType !== 'all' && item.type !== filterType) return false;
        return true;
      })
      .sort((a, b) => a.billingDay - b.billingDay);
  }, [items, filterType]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount.replace(/\D/g, ''));
    if (!name.trim() || val <= 0) return;

    const dayNum = Math.min(31, Math.max(1, parseInt(billingDay, 10) || 1));

    const newItem: RecurringItem = {
      id: `sub-${Date.now()}`,
      name: name.trim(),
      emoji: emoji || (txType === 'expense' ? '🔁' : '💰'),
      type: txType,
      amount: val,
      frequency,
      billingDay: dayNum,
      walletId: walletId || wallets[0]?.id || 'wallet-bca',
      categoryId:
        categoryId ||
        (txType === 'expense' ? 'cat-tagihan' : 'cat-gaji'),
      isActive: true,
    };

    saveItems([...items, newItem]);
    addToast(
      'Jadwal Rutin Disimpan',
      `${newItem.name} berhasil ditambahkan ke jadwal berulang.`
    );
    setIsAddOpen(false);
    setName('');
    setAmount('');
  };

  const handleRecordNow = (item: RecurringItem) => {
    const dateStr = new Date(activeYear, activeMonth, activeDay, 9, 0, 0).toISOString();
    addTransaction({
      walletId: item.walletId || wallets[0]?.id || 'wallet-bca',
      categoryId: item.categoryId,
      type: item.type,
      amount: item.amount,
      note: `${item.name} (Otomatis Rutin)`,
      date: dateStr,
    });

    const updated = items.map((i) =>
      i.id === item.id ? { ...i, lastRecordedPeriod: currentPeriodKey } : i
    );
    saveItems(updated);
  };

  const handleToggleActive = (id: string) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, isActive: !i.isActive } : i
    );
    saveItems(updated);
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    saveItems(updated);
    addToast('Jadwal Dihapus', 'Langganan / jadwal berulang telah dihapus.', 'info');
  };

  const freqLabel = (freq: RecurringItem['frequency']) => {
    if (freq === 'monthly') return 'Bulanan';
    if (freq === 'yearly') return 'Tahunan';
    return 'Mingguan';
  };

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 lg:pt-0 px-1">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Langganan & Rutin
          </h1>
          <p className="text-xs lg:text-sm font-semibold text-gray-400 mt-0.5">
            Kelola tagihan otomatis, langganan streaming, dan jadwal gaji bulanan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="h-10 px-3.5 lg:px-4 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center gap-2 font-black text-xs shadow-xs cursor-pointer transition-transform active:scale-95"
          title="Tambah Jadwal Berulang"
        >
          <Plus size={18} strokeWidth={2.8} />
          <span className="hidden sm:inline">Tambah Jadwal</span>
        </button>
      </div>

      {/* Full-Width Black Hero Card */}
      <div className="w-full bg-[#121316] rounded-[28px] lg:rounded-[32px] p-5 lg:px-9 lg:py-7 text-white shadow-xl border border-white/5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-[#D4F826] uppercase tracking-widest flex items-center gap-1.5">
                <RefreshCw size={12} />
                <span>BEBAN LANGGANAN & TAGIHAN / BULAN</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-200 text-[10px] font-black uppercase">
                {items.filter((i) => i.isActive).length} AKTIF
              </span>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-[42px] font-black tabular-nums text-white leading-none">
              {formatRupiah(summary.monthlyExpense, hide)}
            </div>
            <p className="text-xs text-gray-400 pt-0.5">
              Estimasi per tahun:{' '}
              <span className="text-gray-200 font-bold">
                {formatRupiah(summary.yearlyExpense, hide)}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 lg:gap-10 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                PEMASUKAN RUTIN / BLN
              </span>
              <span className="text-sm lg:text-lg font-black text-[#D4F826] tabular-nums mt-0.5 block">
                +{formatRupiah(summary.monthlyIncome, hide)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                JATUH TEMPO DEKAT (H-7)
              </span>
              <span className="text-sm lg:text-lg font-black text-white mt-0.5 block">
                {summary.dueSoonCount} Jadwal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-white dark:bg-[#16181D] rounded-2xl border border-gray-100 dark:border-gray-800 text-xs font-bold lg:w-fit">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'expense', label: 'Tagihan & Langganan' },
          { id: 'income', label: 'Pemasukan Rutin' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id as 'all' | 'expense' | 'income')}
            className={`flex-1 lg:flex-initial py-2 px-4 rounded-xl transition-colors cursor-pointer ${
              filterType === tab.id
                ? 'bg-[#D4F826] text-black font-black shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List of Subscriptions & Recurring Transactions */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-[#16181D] rounded-3xl p-8 text-center border border-gray-100 dark:border-gray-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 mx-auto">
            <CalendarClock size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Belum Ada Jadwal Berulang
            </h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              Catat langganan streaming (Netflix, Spotify), tagihan bulanan (WiFi, Listrik, Kost), atau jadwal gaji agar bisa dicatat hanya dengan 1 klik setiap bulan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-black cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Tambah Jadwal Pertama</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
          {filteredItems.map((item) => {
            const isRecorded = item.lastRecordedPeriod === currentPeriodKey;
            const wallet = wallets.find((w) => w.id === item.walletId);
            const daysDiff = item.billingDay - activeDay;
            const isDueSoon = !isRecorded && item.isActive && daysDiff >= 0 && daysDiff <= 7;
            const isOverdue = !isRecorded && item.isActive && daysDiff < 0;

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-[#16181D] rounded-3xl p-4 shadow-xs border transition-all space-y-3 ${
                  !item.isActive
                    ? 'opacity-60 border-gray-100 dark:border-gray-800'
                    : isDueSoon || isOverdue
                    ? 'border-amber-400/60 dark:border-amber-500/40'
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xl shrink-0">
                      {item.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                        <span>Tgl {item.billingDay}</span>
                        <span>·</span>
                        <span>{freqLabel(item.frequency)}</span>
                        <span>·</span>
                        <span className="truncate">{wallet?.name || 'Dompet'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-black tabular-nums block ${
                        item.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {item.type === 'income' ? '+' : '-'}
                      {formatRupiah(item.amount, hide)}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {isRecorded
                        ? 'Sudah dicatat bulan ini'
                        : !item.isActive
                        ? 'Dijeda'
                        : isOverdue
                        ? `Lewat ${Math.abs(daysDiff)} hari`
                        : daysDiff === 0
                        ? 'Jatuh tempo hari ini'
                        : `${daysDiff} hari lagi`}
                    </span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-800 gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      title={item.isActive ? 'Jeda Jadwal' : 'Aktifkan Jadwal'}
                    >
                      {item.isActive ? <Pause size={12} /> : <Play size={12} />}
                      <span>{item.isActive ? 'Jeda' : 'Aktifkan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Hapus Jadwal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {isRecorded ? (
                    <div className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} />
                      <span>Tercatat Bulan Ini</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!item.isActive}
                      onClick={() => handleRecordNow(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] disabled:opacity-40 text-black text-xs font-black flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>
                        {item.type === 'expense' ? 'Bayar & Catat' : 'Terima & Catat'}
                      </span>
                      <ArrowUpRight size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Jadwal Berulang */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Tambah Jadwal Berulang
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  PILIH CEPAT (TEMPLATE):
                </span>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {quickPresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setName(preset.name);
                        setEmoji(preset.emoji);
                        setTxType(preset.type);
                        setCategoryId(preset.cat);
                        setBillingDay(preset.day);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-[#D4F826]/20 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <span>{preset.emoji}</span>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                {/* Tipe: Pengeluaran vs Pemasukan */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTxType('expense')}
                    className={`py-2 rounded-xl cursor-pointer transition-colors ${
                      txType === 'expense'
                        ? 'bg-white dark:bg-[#16181D] text-gray-900 dark:text-white font-black shadow-xs'
                        : 'text-gray-500'
                    }`}
                  >
                    Tagihan / Langganan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('income')}
                    className={`py-2 rounded-xl cursor-pointer transition-colors ${
                      txType === 'income'
                        ? 'bg-white dark:bg-[#16181D] text-emerald-600 dark:text-emerald-400 font-black shadow-xs'
                        : 'text-gray-500'
                    }`}
                  >
                    Pemasukan Rutin
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Nama Langganan / Transaksi
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Netflix, WiFi, Gaji"
                      required
                      className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                    <input
                      type="text"
                      value={emoji}
                      onChange={(e) => setEmoji(e.target.value)}
                      maxLength={2}
                      className="w-12 p-3 text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-base focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Contoh: 186000"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      Siklus Berulang
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) =>
                        setFrequency(e.target.value as 'monthly' | 'yearly' | 'weekly')
                      }
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
                    >
                      <option value="monthly">Bulanan</option>
                      <option value="yearly">Tahunan</option>
                      <option value="weekly">Mingguan</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      Tanggal (1-31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={billingDay}
                      onChange={(e) => setBillingDay(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      Dompet
                    </label>
                    <select
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      Kategori
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
                    >
                      {categories
                        .filter((c) => c.type === txType)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.emoji} {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-black cursor-pointer"
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
