'use client';

import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  X,
  Calendar,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  User,
  Building2,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  History,
  MoreVertical,
  Trash2,
  Edit2,
  Wallet as WalletIcon,
  Search,
  Filter,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { formatRupiah, formatNominalInput, parseNominalInput, formatFullDateIndo } from '@/lib/formatters';
import { Debt, DebtPayment } from '@/lib/types';

export function DebtTab() {
  const {
    debts,
    addDebt,
    updateDebt,
    deleteDebt,
    payDebtInstallment,
    settleDebt,
    walletsWithBalance,
    wallets,
    settings,
  } = useApp();

  const hide = settings.hideBalance;
  const isPink = settings.accentColor === 'pink';
  const isOrange = settings.accentColor === 'orange';
  const brandAccentBg = isOrange
    ? 'bg-[#FF6B00] text-white hover:bg-[#ea5e00]'
    : isPink
    ? 'bg-[#FFA4A4] text-black hover:bg-[#ff8e8e]'
    : 'bg-[#D4F826] text-black hover:bg-[#c6ec15]';
  const brandAccentText = isOrange
    ? 'text-[#EA580C] dark:text-[#FF8A3D]'
    : isPink
    ? 'text-[#F43F5E]'
    : 'text-lime-600 dark:text-[#D4F826]';
  const brandAccentBorder = isOrange
    ? 'border-[#FF6B00]'
    : isPink
    ? 'border-[#FFA4A4]'
    : 'border-[#D4F826]';

  // Filters & State
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'payable' | 'receivable'>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'active' | 'paid'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Installment payment modal
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payWalletId, setPayWalletId] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState('');

  // History detail modal
  const [detailDebt, setDetailDebt] = useState<Debt | null>(null);

  // Form State for Add / Edit
  const [formType, setFormType] = useState<'payable' | 'receivable'>('payable');
  const [formName, setFormName] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formTotalAmount, setFormTotalAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formStartDate, setFormStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formCategory, setFormCategory] = useState('cicilan');
  const [formNote, setFormNote] = useState('');
  const [formDisburseCashflow, setFormDisburseCashflow] = useState(false);
  const [formDisburseWalletId, setFormDisburseWalletId] = useState('');

  // Filtered debts list
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      // Type filter
      if (activeTypeFilter !== 'all' && d.type !== activeTypeFilter) return false;
      // Status filter
      if (activeStatusFilter !== 'all' && d.status !== activeStatusFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = d.name.toLowerCase().includes(q);
        const matchContact = (d.contactName || '').toLowerCase().includes(q);
        const matchNote = (d.note || '').toLowerCase().includes(q);
        if (!matchName && !matchContact && !matchNote) return false;
      }
      return true;
    });
  }, [debts, activeTypeFilter, activeStatusFilter, searchQuery]);

  // Aggregate stats
  const activePayables = useMemo(
    () => debts.filter((d) => d.type === 'payable' && d.status === 'active'),
    [debts]
  );
  const activeReceivables = useMemo(
    () => debts.filter((d) => d.type === 'receivable' && d.status === 'active'),
    [debts]
  );
  const totalPayableRemaining = useMemo(
    () => activePayables.reduce((acc, d) => acc + (d.remainingAmount ?? d.totalAmount), 0),
    [activePayables]
  );
  const totalReceivableRemaining = useMemo(
    () => activeReceivables.reduce((acc, d) => acc + (d.remainingAmount ?? d.totalAmount), 0),
    [activeReceivables]
  );

  // Liquid assets from positive wallets
  const liquidAssets = useMemo(() => {
    return walletsWithBalance
      .filter((w) => w.type !== 'credit' && w.type !== 'paylater' && w.balance > 0)
      .reduce((acc, w) => acc + w.balance, 0);
  }, [walletsWithBalance]);

  // Debt to Liquid Assets Ratio
  const debtRatioPct =
    totalPayableRemaining <= 0
      ? 0
      : liquidAssets > 0
      ? Math.round((totalPayableRemaining / liquidAssets) * 100)
      : 100;

  // Closest upcoming due date
  const nextDueItem = useMemo(() => {
    const listWithDue = activePayables
      .filter((d) => d.dueDate)
      .map((d) => {
        const time = new Date(d.dueDate).getTime();
        return { ...d, time: isNaN(time) ? Infinity : time };
      })
      .sort((a, b) => a.time - b.time);
    return listWithDue[0] || null;
  }, [activePayables]);

  const getDaysUntilDue = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const dueTime = new Date(dueDateStr).getTime();
    if (isNaN(dueTime)) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((dueTime - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Open Add Modal
  const handleOpenAdd = (type: 'payable' | 'receivable' = 'payable') => {
    setEditingDebt(null);
    setFormType(type);
    setFormName('');
    setFormContactName('');
    setFormTotalAmount('');
    setFormDueDate('');
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormCategory(type === 'payable' ? 'cicilan' : 'personal');
    setFormNote('');
    setFormDisburseCashflow(false);
    setFormDisburseWalletId(wallets[0]?.id || '');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setFormType(debt.type);
    setFormName(debt.name);
    setFormContactName(debt.contactName || '');
    setFormTotalAmount(formatNominalInput(String(debt.totalAmount)));
    setFormDueDate(debt.dueDate || '');
    setFormStartDate(debt.startDate || new Date().toISOString().slice(0, 10));
    setFormCategory(debt.category || (debt.type === 'payable' ? 'cicilan' : 'personal'));
    setFormNote(debt.note || '');
    setFormDisburseCashflow(false);
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNominalInput(formTotalAmount);
    if (!formName.trim() || val <= 0) return;

    if (editingDebt) {
      // Update
      const oldTotal = editingDebt.totalAmount;
      const oldRem = editingDebt.remainingAmount;
      const deltaTotal = val - oldTotal;
      const newRem = Math.max(0, oldRem + deltaTotal);

      updateDebt(editingDebt.id, {
        name: formName.trim(),
        type: formType,
        contactName: formContactName.trim() || (formType === 'payable' ? 'Lembaga / Pihak' : 'Peminjam'),
        totalAmount: val,
        remainingAmount: newRem,
        dueDate: formDueDate,
        startDate: formStartDate,
        category: formCategory,
        note: formNote.trim(),
      });
    } else {
      // Add
      addDebt(
        {
          name: formName.trim(),
          type: formType,
          contactName: formContactName.trim() || (formType === 'payable' ? 'Lembaga / Pihak' : 'Peminjam'),
          totalAmount: val,
          remainingAmount: val,
          dueDate: formDueDate,
          startDate: formStartDate,
          category: formCategory,
          status: 'active',
          note: formNote.trim(),
        },
        formDisburseCashflow && formDisburseWalletId
          ? { disburseWalletId: formDisburseWalletId }
          : undefined
      );
    }

    setIsAddModalOpen(false);
  };

  // Open Payment Modal
  const handleOpenPay = (debt: Debt) => {
    setPayingDebt(debt);
    setPayAmount(formatNominalInput(String(debt.remainingAmount)));
    setPayWalletId(wallets[0]?.id || '');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayNote(
      debt.type === 'payable'
        ? `Cicilan ${debt.name}`
        : `Penerimaan pelunasan ${debt.name}`
    );
  };

  // Submit Payment Modal
  const handleSubmitPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;
    const amountNum = parseNominalInput(payAmount);
    if (amountNum <= 0) return;

    payDebtInstallment(payingDebt.id, amountNum, {
      walletId: payWalletId || undefined,
      date: payDate,
      note: payNote.trim(),
    });

    setPayingDebt(null);
  };

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 lg:pt-0 px-0.5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Utang & Cicilan</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {debts.length} Catatan
            </span>
          </h1>
          <p className="text-xs lg:text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
            Pantau kewajiban cicilan & tagihan piutang, sinkron langsung dengan arus kas dompet.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => handleOpenAdd('payable')}
            className={`h-10 px-4 rounded-full ${brandAccentBg} flex items-center justify-center gap-2 font-black text-xs shadow-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap`}
          >
            <Plus size={16} strokeWidth={2.8} className="shrink-0" />
            <span>Catat Utang</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAdd('receivable')}
            className="h-10 px-4 rounded-full bg-white dark:bg-[#16181D] hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-800 text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1.5 font-extrabold text-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
            title="Catat piutang (orang yang berutang ke Anda)"
          >
            <ArrowDownLeft size={16} className="shrink-0" />
            <span>Catat Piutang</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-[28px] lg:rounded-[32px] p-5 lg:p-7 text-white shadow-xl border border-white/10 relative overflow-hidden">
        {/* Subtle decorative glow */}
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          {/* Left Column: Total Utang & Piutang */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black text-[#D4F826] uppercase tracking-widest">
                RINGKASAN KEWAJIBAN & KLAIM
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-200 text-[10px] font-bold">
                {activePayables.length === 0 ? 'Bebas Utang' : `${activePayables.length} Utang Aktif`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Utang Saya */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <TrendingDown size={14} />
                  <span>Total Utang Saya</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-white">
                  {formatRupiah(totalPayableRemaining, hide)}
                </div>
                <div className="text-[11px] text-gray-400">
                  {activePayables.length} kewajiban belum lunas
                </div>
              </div>

              {/* Total Piutang Saya */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <TrendingUp size={14} />
                  <span>Piutang (Uang di Luar)</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-emerald-300">
                  {formatRupiah(totalReceivableRemaining, hide)}
                </div>
                <div className="text-[11px] text-gray-400">
                  {activeReceivables.length} tagihan ke pihak lain
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Health & Next Due */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                RASIO TERHADAP KAS
              </span>
              <span
                className={`text-base lg:text-xl font-black tabular-nums block ${
                  debtRatioPct <= 20 ? 'text-[#D4F826]' : debtRatioPct <= 40 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {debtRatioPct}%
              </span>
              <p className="text-[10px] text-gray-400">
                {totalPayableRemaining === 0
                  ? 'Aman, bebas utang'
                  : `${formatRupiah(liquidAssets, hide)} kas siap pakai`}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                STATUS BEBAN UTANG
              </span>
              <span className="text-base lg:text-xl font-black text-white block">
                {totalPayableRemaining === 0
                  ? 'Sangat Prima 🎉'
                  : debtRatioPct <= 25
                  ? 'Terkendali 👍'
                  : 'Perlu Dicermati ⚠️'}
              </span>
              <p className="text-[10px] text-gray-400">
                {debtRatioPct <= 25 ? 'Beban kewajiban wajar' : 'Prioritaskan pelunasan'}
              </p>
            </div>

            {/* Next Due Notification Banner */}
            {nextDueItem && (
              <div className="col-span-2 mt-2 p-3 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Clock size={16} className="text-[#D4F826] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-200 truncate">
                      Jatuh Tempo: {nextDueItem.name}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {nextDueItem.dueDate} ({formatRupiah(nextDueItem.remainingAmount, hide)})
                    </p>
                  </div>
                </div>
                {(() => {
                  const days = getDaysUntilDue(nextDueItem.dueDate);
                  if (days === null) return null;
                  const isLate = days < 0;
                  return (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        isLate
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : days <= 3
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-white/10 text-gray-200'
                      }`}
                    >
                      {isLate ? `Lewat ${Math.abs(days)} hari` : `${days} hari lagi`}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#16181D] p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
        {/* Type Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTypeFilter === 'all'
                ? `${brandAccentBg} shadow-xs font-black`
                : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Semua ({debts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeFilter('payable')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTypeFilter === 'payable'
                ? `${brandAccentBg} shadow-xs font-black`
                : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <TrendingDown size={14} className="text-rose-500" />
            <span>Utang Saya</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeFilter('receivable')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTypeFilter === 'receivable'
                ? `${brandAccentBg} shadow-xs font-black`
                : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={14} className="text-emerald-500" />
            <span>Piutang Saya</span>
          </button>
        </div>

        {/* Status Filter & Search */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                activeStatusFilter === 'active'
                  ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-xs font-black'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Belum Lunas
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('paid')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                activeStatusFilter === 'paid'
                  ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-xs font-black'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Lunas
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                activeStatusFilter === 'all'
                  ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-xs font-black'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Semua
            </button>
          </div>

          <div className="relative min-w-[140px] sm:min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D4F826]"
            />
          </div>
        </div>
      </div>

      {/* Debts List */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#16181D] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 space-y-2">
            <span className="text-4xl">🎉</span>
            <p className="text-base font-extrabold text-gray-900 dark:text-white">
              Tidak ada catatan utang / piutang
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {activeStatusFilter === 'active'
                ? 'Semua kewajiban telah lunas atau belum ada catatan baru yang dimasukkan.'
                : 'Tidak ada data yang sesuai dengan filter pencarian.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleOpenAdd('payable')}
                className={`px-4 py-2 rounded-xl ${brandAccentBg} text-xs font-black cursor-pointer shadow-xs`}
              >
                + Tambah Catatan Baru
              </button>
            </div>
          </div>
        ) : (
          filteredDebts.map((item) => {
            const isPayable = item.type === 'payable';
            const isPaid = item.status === 'paid' || item.remainingAmount <= 0;
            const paidAmount = Math.max(0, item.totalAmount - item.remainingAmount);
            const progressPct =
              item.totalAmount > 0 ? Math.min(100, Math.round((paidAmount / item.totalAmount) * 100)) : 100;
            const daysLeft = getDaysUntilDue(item.dueDate);
            const isLate = !isPaid && daysLeft !== null && daysLeft < 0;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all space-y-4"
              >
                {/* Top Row: Badges, Title, Amount */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Type Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isPayable
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                        }`}
                      >
                        {isPayable ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                        <span>{isPayable ? 'Utang Saya' : 'Piutang Saya'}</span>
                      </span>

                      {/* Status Badge */}
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-black">
                          <CheckCircle2 size={11} strokeWidth={3} />
                          <span>Lunas</span>
                        </span>
                      ) : isLate ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                          <AlertCircle size={11} />
                          <span>Lewat Tempo</span>
                        </span>
                      ) : daysLeft !== null && daysLeft <= 3 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-black">
                          <Clock size={11} />
                          <span>{daysLeft === 0 ? 'Hari ini!' : `${daysLeft} hari lagi`}</span>
                        </span>
                      ) : null}

                      {/* Category Badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 capitalize">
                        {item.category || 'Cicilan'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white truncate">
                      {item.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <div className="flex items-center gap-1">
                        <User size={13} className="text-gray-400" />
                        <span>
                          {isPayable ? 'Kepada: ' : 'Peminjam: '}
                          <strong className="text-gray-700 dark:text-gray-200">
                            {item.contactName || 'Pihak Terkait'}
                          </strong>
                        </span>
                      </div>
                      {item.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-gray-400" />
                          <span>Jatuh tempo: {item.dueDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="sm:text-right shrink-0 pt-1 sm:pt-0">
                    <div className="text-xs font-bold text-gray-400">
                      {isPaid ? 'Total Transaksi' : 'Sisa Kewajiban'}
                    </div>
                    <div
                      className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${
                        isPaid
                          ? 'text-gray-400 line-through'
                          : isPayable
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatRupiah(item.remainingAmount, hide)}
                    </div>
                    <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      dari total {formatRupiah(item.totalAmount, hide)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Repayment stats */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500 dark:text-gray-400">
                      Progres Pelunasan ({progressPct}%)
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 tabular-nums">
                      Terbayar: {formatRupiah(paidAmount, hide)}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPaid
                          ? 'bg-emerald-500'
                          : isPayable
                          ? 'bg-[#D4F826]'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Note if present */}
                {item.note && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    &ldquo;{item.note}&rdquo;
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    {/* View history detail */}
                    <button
                      type="button"
                      onClick={() => setDetailDebt(item)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Lihat riwayat pembayaran"
                    >
                      <History size={14} />
                      <span>Riwayat ({item.payments?.length || 0})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Edit catatan"
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus catatan "${item.name}"?`)) {
                          deleteDebt(item.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Hapus catatan"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {!isPaid && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPay(item)}
                        className={`px-3.5 py-1.5 rounded-xl ${brandAccentBg} text-xs font-black shadow-xs cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5`}
                      >
                        <DollarSign size={14} />
                        <span>{isPayable ? 'Bayar Cicilan' : 'Terima Cicilan'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Tandai lunas penuh untuk "${item.name}" sebesar ${formatRupiah(
                                item.remainingAmount
                              )}?`
                            )
                          ) {
                            settleDebt(item.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold cursor-pointer transition-colors"
                      >
                        Lunasi Penuh
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add or Edit Debt */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                    {editingDebt ? 'Edit Catatan Kewajiban' : 'Catat Utang / Piutang Baru'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Masukkan detail pinjaman atau cicilan dengan teliti.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-3.5">
                {/* Type Selection */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">
                    Jenis Transaksi
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormType('payable')}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        formType === 'payable'
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-black'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <TrendingDown size={16} />
                      <span>Utang Saya (Hutang)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('receivable')}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        formType === 'receivable'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-black'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <TrendingUp size={16} />
                      <span>Piutang (Orang Berutang)</span>
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Nama Utang / Cicilan
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={
                      formType === 'payable'
                        ? 'Contoh: Cicilan Laptop, KPR Rumah, Pinjaman Bank'
                        : 'Contoh: Talangan Tiket Budi, Pinjaman Teman'
                    }
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                {/* Contact Name */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    {formType === 'payable' ? 'Pemberi Pinjaman / Bank / Kontak' : 'Nama Peminjam / Kontak'}
                  </label>
                  <input
                    type="text"
                    value={formContactName}
                    onChange={(e) => setFormContactName(e.target.value)}
                    placeholder="Contoh: BCA, Tokopedia Paylater, Ahmad, Bank Mandiri"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                {/* Total Amount */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Total Nominal Pokok (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formTotalAmount}
                    onChange={(e) => setFormTotalAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 5.000.000"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                {/* Dates: Start & Due */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      Tanggal Pinjam
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      Jatuh Tempo (Target)
                    </label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  >
                    <option value="cicilan">Cicilan & Paylater</option>
                    <option value="bank">Perbankan / Pinjaman Resmi</option>
                    <option value="personal">Personal / Teman & Keluarga</option>
                    <option value="modal">Modal Usaha</option>
                    <option value="kartu_kredit">Kartu Kredit</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Cashflow Sync Option (Only on new additions) */}
                {!editingDebt && (
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2.5">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formDisburseCashflow}
                        onChange={(e) => setFormDisburseCashflow(e.target.checked)}
                        className="mt-0.5 rounded text-lime-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {formType === 'payable'
                          ? 'Catat uang pinjaman masuk ke dompet saya sekarang?'
                          : 'Catat pengeluaran uang pinjaman dari dompet saya sekarang?'}
                      </span>
                    </label>

                    {formDisburseCashflow && (
                      <div className="pl-6 space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 block">
                          {formType === 'payable' ? 'Pilih Dompet Penerima:' : 'Pilih Dompet Sumber Uang:'}
                        </label>
                        <select
                          value={formDisburseWalletId}
                          onChange={(e) => setFormDisburseWalletId(e.target.value)}
                          className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                        >
                          {wallets.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({formatRupiah(w.initialBalance)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="e.g. Bunga 0% tenor 12 bulan, nomor kontrak 123456"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 rounded-2xl ${brandAccentBg} text-xs font-black shadow-xs cursor-pointer`}
                  >
                    {editingDebt ? 'Simpan Perubahan' : 'Simpan Catatan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Installment Payment */}
      <AnimatePresence>
        {payingDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    {payingDebt.type === 'payable' ? 'Bayar Cicilan / Pelunasan' : 'Terima Pembayaran Piutang'}
                  </h3>
                  <p className="text-xs text-gray-400 truncate max-w-[240px]">
                    {payingDebt.name} ({payingDebt.contactName})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPayingDebt(null)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Debt Summary Pill */}
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs space-y-1">
                <div className="flex justify-between text-gray-500">
                  <span>Sisa Kewajiban Saat Ini:</span>
                  <span className="font-extrabold text-rose-500">
                    {formatRupiah(payingDebt.remainingAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Total Pinjaman Pokok:</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {formatRupiah(payingDebt.totalAmount)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmitPay} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Nominal Pembayaran (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payAmount}
                    onChange={(e) => setPayAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 500.000"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setPayAmount(formatNominalInput(String(payingDebt.remainingAmount)))}
                      className="text-[11px] font-bold text-lime-600 dark:text-[#D4F826] hover:underline cursor-pointer"
                    >
                      Bayar Penuh Sisa ({formatRupiah(payingDebt.remainingAmount)})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    {payingDebt.type === 'payable' ? 'Bayar dari Dompet / Rekening:' : 'Masuk ke Dompet:'}
                  </label>
                  <select
                    value={payWalletId}
                    onChange={(e) => setPayWalletId(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  >
                    <option value="">-- Tanpa Potong Dompet (Catat Saja) --</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Jika memilih dompet, transaksi pengeluaran/pemasukan riil otomatis tercatat di Dompet & Riwayat.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Catatan</label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="Contoh: Cicilan ke-1 via Transfer BCA"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayingDebt(null)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 rounded-2xl ${brandAccentBg} text-xs font-black shadow-xs cursor-pointer`}
                  >
                    Konfirmasi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: History Detail */}
      <AnimatePresence>
        {detailDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    Riwayat Pembayaran
                  </h3>
                  <p className="text-xs text-gray-400 truncate max-w-[260px]">
                    {detailDebt.name} ({detailDebt.contactName})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailDebt(null)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Header */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Total Pinjaman:</span>
                  <span className="font-extrabold text-gray-900 dark:text-white">
                    {formatRupiah(detailDebt.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Sisa Belum Dibayar:</span>
                  <span
                    className={`font-black ${
                      detailDebt.remainingAmount <= 0
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {detailDebt.remainingAmount <= 0
                      ? 'Lunas 🎉'
                      : formatRupiah(detailDebt.remainingAmount)}
                  </span>
                </div>
                {detailDebt.dueDate && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Target Jatuh Tempo:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {detailDebt.dueDate}
                    </span>
                  </div>
                )}
              </div>

              {/* Payments List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Daftar Angsuran Terbayar ({detailDebt.payments?.length || 0})
                </h4>

                {!detailDebt.payments || detailDebt.payments.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/40 rounded-2xl text-xs text-gray-400">
                    Belum ada riwayat cicilan yang dicatat.
                  </div>
                ) : (
                  detailDebt.payments.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-bold text-gray-900 dark:text-white truncate">
                          {p.note || `Cicilan #${idx + 1}`}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-2">
                          <span>{p.date}</span>
                          {p.walletName && (
                            <span className="inline-flex items-center gap-1 font-semibold text-gray-500 dark:text-gray-400">
                              <WalletIcon size={11} /> {p.walletName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                        +{formatRupiah(p.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setDetailDebt(null)}
                  className="w-full py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
