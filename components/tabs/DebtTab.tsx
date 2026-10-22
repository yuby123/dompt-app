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
  CalendarDays,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { formatRupiah, formatNominalInput, parseNominalInput, formatFullDateIndo } from '@/lib/formatters';
import { Debt, DebtPayment } from '@/lib/types';

function computeInstallmentDueDate(startDateStr: string, tenorMonths: number, dueDayOfMonth: number): string {
  if (!startDateStr || !tenorMonths || tenorMonths <= 0) return '';
  const d = new Date(startDateStr);
  if (isNaN(d.getTime())) return '';

  const targetYear = d.getFullYear();
  const targetMonth = d.getMonth() + tenorMonths;
  const clampedDay = Math.max(1, Math.min(31, dueDayOfMonth || d.getDate() || 10));

  const targetDateObj = new Date(targetYear, targetMonth, 1);
  const maxDays = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth() + 1, 0).getDate();
  const actualDay = Math.min(clampedDay, maxDays);

  const finalObj = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth(), actualDay);
  return finalObj.toISOString().slice(0, 10);
}

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
  const [formIsInstallment, setFormIsInstallment] = useState(true);
  const [formTenorMonths, setFormTenorMonths] = useState('6');
  const [formMonthlyInstallment, setFormMonthlyInstallment] = useState('');
  const [formDueDayOfMonth, setFormDueDayOfMonth] = useState('10');
  const [formNote, setFormNote] = useState('');
  const [formDisburseCashflow, setFormDisburseCashflow] = useState(false);
  const [formDisburseWalletId, setFormDisburseWalletId] = useState('');

  // Auto-calculation handlers for Installment
  const handleTenorChange = (tenorStr: string) => {
    setFormTenorMonths(tenorStr);
    const tNum = parseInt(tenorStr, 10);
    const totalVal = parseNominalInput(formTotalAmount);
    const dayNum = parseInt(formDueDayOfMonth, 10) || 10;
    if (tNum > 0) {
      if (totalVal > 0) {
        setFormMonthlyInstallment(formatNominalInput(String(Math.round(totalVal / tNum))));
      }
      const calcDue = computeInstallmentDueDate(formStartDate, tNum, dayNum);
      if (calcDue) setFormDueDate(calcDue);
    }
  };

  const handleDueDayChange = (dayStr: string) => {
    setFormDueDayOfMonth(dayStr);
    const dNum = parseInt(dayStr, 10);
    const tNum = parseInt(formTenorMonths, 10) || 6;
    if (tNum > 0 && dNum > 0) {
      const calcDue = computeInstallmentDueDate(formStartDate, tNum, dNum);
      if (calcDue) setFormDueDate(calcDue);
    }
  };

  const handleTotalAmountChange = (valStr: string) => {
    const formatted = formatNominalInput(valStr);
    setFormTotalAmount(formatted);
    const totalVal = parseNominalInput(formatted);
    const tNum = parseInt(formTenorMonths, 10) || 6;
    if (formIsInstallment && tNum > 0 && totalVal > 0) {
      setFormMonthlyInstallment(formatNominalInput(String(Math.round(totalVal / tNum))));
    }
  };

  const handleStartDateChange = (dateStr: string) => {
    setFormStartDate(dateStr);
    const tNum = parseInt(formTenorMonths, 10) || 6;
    const dNum = parseInt(formDueDayOfMonth, 10) || 10;
    if (formIsInstallment && tNum > 0) {
      const calcDue = computeInstallmentDueDate(dateStr, tNum, dNum);
      if (calcDue) setFormDueDate(calcDue);
    }
  };

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
    const today = new Date().toISOString().slice(0, 10);
    setEditingDebt(null);
    setFormType(type);
    setFormName('');
    setFormContactName('');
    setFormTotalAmount('');
    setFormStartDate(today);
    setFormCategory(type === 'payable' ? 'cicilan' : 'personal');
    setFormIsInstallment(type === 'payable');
    setFormTenorMonths('6');
    setFormMonthlyInstallment('');
    setFormDueDayOfMonth('10');
    const autoDue = computeInstallmentDueDate(today, 6, 10);
    setFormDueDate(autoDue);
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
    const sDate = debt.startDate || new Date().toISOString().slice(0, 10);
    setFormStartDate(sDate);
    setFormCategory(debt.category || (debt.type === 'payable' ? 'cicilan' : 'personal'));
    const isInst = debt.isInstallment ?? (debt.category === 'cicilan' || Boolean(debt.tenorMonths));
    setFormIsInstallment(isInst);
    setFormTenorMonths(debt.tenorMonths ? String(debt.tenorMonths) : '6');
    setFormMonthlyInstallment(debt.monthlyInstallment ? formatNominalInput(String(debt.monthlyInstallment)) : '');
    const defaultDay = debt.dueDayOfMonth
      ? String(debt.dueDayOfMonth)
      : debt.dueDate
      ? String(new Date(debt.dueDate).getDate())
      : '10';
    setFormDueDayOfMonth(defaultDay);
    setFormNote(debt.note || '');
    setFormDisburseCashflow(false);
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNominalInput(formTotalAmount);
    if (!formName.trim() || val <= 0) return;

    const tenorNum = formIsInstallment && formTenorMonths ? parseInt(formTenorMonths, 10) : undefined;
    const dueDayNum = formIsInstallment && formDueDayOfMonth ? Math.max(1, Math.min(31, parseInt(formDueDayOfMonth, 10))) : undefined;
    const rawMonthly = parseNominalInput(formMonthlyInstallment);
    const monthlyNum = formIsInstallment
      ? (rawMonthly > 0 ? rawMonthly : (tenorNum && tenorNum > 0 ? Math.round(val / tenorNum) : undefined))
      : undefined;

    let finalDueDate = formDueDate;
    if (!finalDueDate && formIsInstallment && tenorNum && dueDayNum) {
      finalDueDate = computeInstallmentDueDate(formStartDate, tenorNum, dueDayNum);
    }

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
        dueDate: finalDueDate,
        startDate: formStartDate,
        category: formCategory,
        isInstallment: formIsInstallment,
        tenorMonths: tenorNum,
        monthlyInstallment: monthlyNum,
        dueDayOfMonth: dueDayNum,
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
          dueDate: finalDueDate,
          startDate: formStartDate,
          category: formCategory,
          isInstallment: formIsInstallment,
          tenorMonths: tenorNum,
          monthlyInstallment: monthlyNum,
          dueDayOfMonth: dueDayNum,
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
    const defaultAmount = (debt.monthlyInstallment && debt.monthlyInstallment > 0)
      ? Math.min(debt.monthlyInstallment, debt.remainingAmount)
      : debt.remainingAmount;
    setPayAmount(formatNominalInput(String(defaultAmount)));
    setPayWalletId(wallets[0]?.id || '');
    setPayDate(new Date().toISOString().slice(0, 10));
    const nextInstallmentNum = (debt.payments?.length || 0) + 1;
    setPayNote(
      debt.type === 'payable'
        ? (debt.isInstallment || debt.tenorMonths
            ? `Cicilan ke-${nextInstallmentNum} ${debt.name}`
            : `Cicilan ${debt.name}`)
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
                      {item.dueDayOfMonth ? (
                        <div className="flex items-center gap-1 font-semibold text-lime-700 dark:text-[#D4F826]">
                          <CalendarDays size={13} className="shrink-0" />
                          <span>Bayar tiap tgl: <strong>{item.dueDayOfMonth}</strong></span>
                        </div>
                      ) : null}
                      {item.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-gray-400 shrink-0" />
                          <span>{item.dueDayOfMonth ? `Target lunas: ${item.dueDate}` : `Jatuh tempo: ${item.dueDate}`}</span>
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

                {/* Installment Scheme Highlights */}
                {(item.isInstallment || item.monthlyInstallment || item.tenorMonths || item.dueDayOfMonth) && (
                  <div className="p-3 rounded-2xl bg-gray-50/90 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      {(item.monthlyInstallment || (item.tenorMonths && item.tenorMonths > 0)) && (
                        <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
                          <CreditCard size={14} className="text-lime-600 dark:text-[#D4F826] shrink-0" />
                          <span>
                            Cicilan: <strong className="text-gray-950 dark:text-white">{formatRupiah(item.monthlyInstallment || Math.round(item.totalAmount / (item.tenorMonths || 1)), hide)}</strong>/bln
                          </span>
                        </div>
                      )}
                      {item.tenorMonths && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                          <Clock size={13} className="text-gray-400 shrink-0" />
                          <span>Tenor: <strong className="text-gray-700 dark:text-gray-300">{item.tenorMonths} Bulan</strong></span>
                        </div>
                      )}
                      {item.dueDayOfMonth && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                          <CalendarDays size={13} className="text-lime-600 dark:text-[#D4F826] shrink-0" />
                          <span>Jatuh tempo: <strong className="text-lime-700 dark:text-[#D4F826]">Tiap tgl {item.dueDayOfMonth}</strong></span>
                        </div>
                      )}
                    </div>

                    {!isPaid && (item.monthlyInstallment || (item.tenorMonths && item.tenorMonths > 0)) && (
                      <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                        Estimasi sisa: <strong className="text-gray-800 dark:text-gray-200">~{Math.max(1, Math.ceil(item.remainingAmount / (item.monthlyInstallment || Math.round(item.totalAmount / (item.tenorMonths || 1)))))}x cicilan</strong>
                      </div>
                    )}
                  </div>
                )}

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
                    Total Nominal Pokok Pinjaman (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formTotalAmount}
                    onChange={(e) => handleTotalAmountChange(e.target.value)}
                    placeholder="Contoh: 6.000.000"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormCategory(val);
                      if (val === 'cicilan') {
                        setFormIsInstallment(true);
                        const tot = parseNominalInput(formTotalAmount);
                        const t = parseInt(formTenorMonths, 10) || 6;
                        if (tot > 0 && (!formMonthlyInstallment || formMonthlyInstallment === '0')) {
                          setFormMonthlyInstallment(formatNominalInput(String(Math.round(tot / t))));
                        }
                      }
                    }}
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

                {/* Skema Cicilan Bulanan & Tanggal Bayar */}
                <div className="p-4 rounded-3xl bg-lime-500/5 dark:bg-[#D4F826]/5 border-2 border-lime-500/30 dark:border-[#D4F826]/30 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-lime-500/20 dark:bg-[#D4F826]/20 flex items-center justify-center text-lime-700 dark:text-[#D4F826] shrink-0">
                        <CalendarDays size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span>Skema Cicilan & Tempo Bulanan</span>
                          {formIsInstallment && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-lime-500 text-black font-extrabold rounded-md leading-none">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Atur tempo bulan, cicilan per bulan, dan tanggal pembayaran
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={formIsInstallment}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormIsInstallment(checked);
                          if (checked) {
                            const tNum = parseInt(formTenorMonths, 10) || 6;
                            const tot = parseNominalInput(formTotalAmount);
                            if (tot > 0 && (!formMonthlyInstallment || formMonthlyInstallment === '0')) {
                              setFormMonthlyInstallment(formatNominalInput(String(Math.round(tot / tNum))));
                            }
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-lime-500 dark:peer-checked:bg-[#D4F826]"></div>
                    </label>
                  </div>

                  {formIsInstallment && (
                    <div className="space-y-3.5 pt-1 border-t border-lime-500/15 dark:border-[#D4F826]/15">
                      {/* 1. Tenor / Durasi Bulan */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            Tempo / Durasi Cicilan (Bulan)
                          </label>
                          <span className="text-[11px] font-black text-lime-700 dark:text-[#D4F826]">
                            {formTenorMonths || '0'} Bulan
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={formTenorMonths}
                            onChange={(e) => handleTenorChange(e.target.value)}
                            placeholder="Contoh: 6"
                            className="w-full p-3 pr-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                            Bulan
                          </span>
                        </div>
                        {/* Quick Tenor Chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {['3', '6', '12', '24', '36'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleTenorChange(t)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-black cursor-pointer transition-all ${
                                formTenorMonths === t
                                  ? 'bg-lime-500 text-black shadow-xs scale-102'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-lime-500'
                              }`}
                            >
                              {t} bln
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Nominal Cicilan Tiap Bulan */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            Besaran Cicilan Tiap Bulan (Rp)
                          </label>
                          {parseNominalInput(formTotalAmount) > 0 && parseInt(formTenorMonths, 10) > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const tot = parseNominalInput(formTotalAmount);
                                const t = parseInt(formTenorMonths, 10);
                                setFormMonthlyInstallment(formatNominalInput(String(Math.round(tot / t))));
                              }}
                              className="text-[11px] font-bold text-lime-700 dark:text-[#D4F826] hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Sparkles size={11} />
                              <span>Hitung Rata ({formatRupiah(Math.round(parseNominalInput(formTotalAmount) / parseInt(formTenorMonths, 10)))})</span>
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formMonthlyInstallment}
                          onChange={(e) => setFormMonthlyInstallment(formatNominalInput(e.target.value))}
                          placeholder="Contoh: 1.000.000"
                          className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                        />
                        {/* Summary calculation */}
                        {parseNominalInput(formMonthlyInstallment) > 0 && parseInt(formTenorMonths, 10) > 0 && (
                          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-1 px-1">
                            <span>
                              Estimasi total: {formatRupiah(parseNominalInput(formMonthlyInstallment))} × {formTenorMonths} bln
                            </span>
                            <span className="font-extrabold text-gray-800 dark:text-gray-200">
                              = {formatRupiah(parseNominalInput(formMonthlyInstallment) * parseInt(formTenorMonths, 10))}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 3. Tanggal Jatuh Tempo Tiap Bulan */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            Tanggal Pembayaran Tiap Bulan (Jatuh Tempo)
                          </label>
                          <span className="text-[11px] font-black text-lime-700 dark:text-[#D4F826]">
                            Tiap Tanggal {formDueDayOfMonth || '10'}
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={formDueDayOfMonth}
                            onChange={(e) => handleDueDayChange(e.target.value)}
                            placeholder="Contoh: 10"
                            className="w-full p-3 pr-28 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                            Tiap Bulan
                          </span>
                        </div>
                        {/* Quick Date Chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {['1', '5', '10', '15', '20', '25', '28'].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => handleDueDayChange(d)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-black cursor-pointer transition-all ${
                                formDueDayOfMonth === d
                                  ? 'bg-lime-500 text-black shadow-xs scale-102'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-lime-500'
                              }`}
                            >
                              Tgl {d}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 px-0.5">
                          Pengingat pembayaran cicilan akan berulang setiap tanggal ini setiap bulannya.
                        </p>
                      </div>
                    </div>
                  )}
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
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-500">
                        Jatuh Tempo (Target)
                      </label>
                      {formIsInstallment && formTenorMonths && (
                        <span className="text-[10px] text-lime-600 dark:text-[#D4F826] font-semibold">
                          Auto {formTenorMonths} bln
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
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

                {/* Auto-sync info banner for Utang Saya */}
                {formType === 'payable' && (
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-lime-500/10 dark:bg-[#D4F826]/10 border border-lime-500/20 dark:border-[#D4F826]/30 text-gray-800 dark:text-gray-200 text-xs">
                    <span className="text-base shrink-0 leading-none mt-0.5">⚡</span>
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-lime-700 dark:text-[#D4F826]">
                        Sinkronisasi Otomatis ke Budget
                      </div>
                      <div className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                        {formIsInstallment && (parseNominalInput(formMonthlyInstallment) > 0 || (parseNominalInput(formTotalAmount) > 0 && parseInt(formTenorMonths, 10) > 0)) ? (
                          <>
                            Cicilan sebesar <strong>{formatRupiah(parseNominalInput(formMonthlyInstallment) || Math.round(parseNominalInput(formTotalAmount) / (parseInt(formTenorMonths, 10) || 1)))}/bulan</strong> otomatis tercatat di <strong>Menu Budget (Kebutuhan &gt; Pos Tagihan Bulanan / Fixed)</strong> setiap <strong>tanggal {formDueDayOfMonth || '10'}</strong>.
                          </>
                        ) : (
                          <>
                            Utang ini otomatis tercatat di <strong>Menu Budget (Kebutuhan)</strong> dan dihitung di <strong>Pos Tagihan Bulanan (Fixed)</strong> dengan target jatuh tempo.
                          </>
                        )}
                      </div>
                    </div>
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
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs space-y-1.5">
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
                {(payingDebt.monthlyInstallment || payingDebt.dueDayOfMonth) && (
                  <div className="flex justify-between text-gray-500 pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span>Cicilan Rutin:</span>
                    <span className="font-extrabold text-lime-700 dark:text-[#D4F826]">
                      {payingDebt.monthlyInstallment ? `${formatRupiah(payingDebt.monthlyInstallment)}/bln` : ''}
                      {payingDebt.dueDayOfMonth ? ` (Tiap tgl ${payingDebt.dueDayOfMonth})` : ''}
                    </span>
                  </div>
                )}
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
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {payingDebt.monthlyInstallment && payingDebt.monthlyInstallment > 0 && payingDebt.remainingAmount > payingDebt.monthlyInstallment && (
                      <button
                        type="button"
                        onClick={() => setPayAmount(formatNominalInput(String(payingDebt.monthlyInstallment)))}
                        className="text-[11px] font-bold text-lime-700 dark:text-[#D4F826] bg-lime-500/10 dark:bg-[#D4F826]/10 px-2.5 py-1 rounded-xl hover:underline cursor-pointer"
                      >
                        1x Cicilan ({formatRupiah(payingDebt.monthlyInstallment)})
                      </button>
                    )}
                    {payingDebt.monthlyInstallment && payingDebt.monthlyInstallment > 0 && payingDebt.remainingAmount >= payingDebt.monthlyInstallment * 2 && (
                      <button
                        type="button"
                        onClick={() => setPayAmount(formatNominalInput(String(payingDebt.monthlyInstallment! * 2)))}
                        className="text-[11px] font-bold text-lime-700 dark:text-[#D4F826] bg-lime-500/10 dark:bg-[#D4F826]/10 px-2.5 py-1 rounded-xl hover:underline cursor-pointer"
                      >
                        2x Cicilan ({formatRupiah(payingDebt.monthlyInstallment * 2)})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPayAmount(formatNominalInput(String(payingDebt.remainingAmount)))}
                      className="text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-xl hover:underline cursor-pointer"
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
                {detailDebt.monthlyInstallment && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Cicilan Bulanan:</span>
                    <span className="font-bold text-lime-700 dark:text-[#D4F826]">
                      {formatRupiah(detailDebt.monthlyInstallment)} / bulan
                    </span>
                  </div>
                )}
                {detailDebt.tenorMonths && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Tempo / Tenor:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {detailDebt.tenorMonths} Bulan
                    </span>
                  </div>
                )}
                {detailDebt.dueDayOfMonth && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Jatuh Tempo Bulanan:</span>
                    <span className="font-bold text-lime-700 dark:text-[#D4F826]">
                      Setiap tanggal {detailDebt.dueDayOfMonth}
                    </span>
                  </div>
                )}
                {detailDebt.dueDate && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Target Pelunasan Akhir:</span>
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
