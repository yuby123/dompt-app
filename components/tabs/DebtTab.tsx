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
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { formatRupiah, formatNominalInput, parseNominalInput, formatFullDateIndo } from '@/lib/formatters';
import { getMonthlyDebtInstallmentAmount, isDebtScheduledForBudgetPeriod } from '@/lib/budgetUtils';
import { Debt, DebtPayment } from '@/lib/types';

function formatIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getClampedMonthDate(year: number, monthIndex: number, dayOfMonth: number): Date {
  const maxDay = new Date(year, monthIndex + 1, 0).getDate();
  const actualDay = Math.max(1, Math.min(dayOfMonth, maxDay));
  return new Date(year, monthIndex, actualDay, 0, 0, 0, 0);
}

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
  return formatIsoDateLocal(finalObj);
}

export function DebtTab() {
  const {
    debts,
    addDebt,
    updateDebt,
    deleteDebt,
    payDebtInstallment,
    settleDebt,
    cancelDebtPayment,
    walletsWithBalance,
    wallets,
    settings,
    budgetPeriod,
  } = useApp();

  const hide = settings.hideBalance;
  const isPink = settings.accentColor === 'pink';
  const isOrange = settings.accentColor === 'orange';
  const isPlum = settings.accentColor === 'plum';
  const brandAccentBg = isPlum
    ? 'bg-[#71325A] text-white hover:bg-[#5e284a]'
    : isOrange
    ? 'bg-[#FF6B00] text-white hover:bg-[#ea5e00]'
    : isPink
    ? 'bg-[#FFA4A4] text-black hover:bg-[#ff8e8e]'
    : 'bg-[#D4F826] text-black hover:bg-[#c6ec15]';
  const brandAccentText = isPlum
    ? 'text-[#71325A] dark:text-[#e89ec9]'
    : isOrange
    ? 'text-[#EA580C] dark:text-[#FF8A3D]'
    : isPink
    ? 'text-[#F43F5E]'
    : 'text-lime-600 dark:text-[#D4F826]';
  const brandAccentBorder = isPlum
    ? 'border-[#71325A]'
    : isOrange
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
  const activeDetailDebt = useMemo(
    () => (detailDebt ? debts.find((d) => d.id === detailDebt.id) || detailDebt : null),
    [debts, detailDebt]
  );

  // Form State for Add / Edit
  const [formType, setFormType] = useState<'payable' | 'receivable'>('payable');
  const [formName, setFormName] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formTotalAmount, setFormTotalAmount] = useState('');
  const [formRemainingAmount, setFormRemainingAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formStartDate, setFormStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formCategory, setFormCategory] = useState('cicilan');
  const [formIsInstallment, setFormIsInstallment] = useState(true);
  const [formTenorMonths, setFormTenorMonths] = useState('6');
  const [formMonthlyInstallment, setFormMonthlyInstallment] = useState('');
  const [formDueDayOfMonth, setFormDueDayOfMonth] = useState('10');
  const [formStartBillingMode, setFormStartBillingMode] = useState<'current_period' | 'next_period'>('current_period');
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

  // Compute effective next payment due date & days remaining (handles both monthly installments and one-off due dates)
  const getEffectiveDueInfo = React.useCallback(
    (item: Debt) => {
      const isPaid = item.status === 'paid' || item.remainingAmount <= 0;
      if (isPaid) {
        return {
          effectiveDueDate: item.dueDate || '',
          daysLeft: null as number | null,
          sortTime: Number.MAX_SAFE_INTEGER,
        };
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const isDeferred =
        item.type === 'payable' && !isDebtScheduledForBudgetPeriod(item, budgetPeriod);

      if (item.dueDayOfMonth && item.dueDayOfMonth > 0) {
        const day = Math.max(1, Math.min(31, item.dueDayOfMonth));

        if (isDeferred) {
          const baseDate = item.firstPaymentDate
            ? new Date(`${item.firstPaymentDate}T00:00:00`)
            : new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const safeBase = isNaN(baseDate.getTime())
            ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
            : baseDate;
          let candidate = getClampedMonthDate(safeBase.getFullYear(), safeBase.getMonth(), day);
          if (candidate.getTime() < safeBase.getTime()) {
            candidate = getClampedMonthDate(safeBase.getFullYear(), safeBase.getMonth() + 1, day);
          }
          const diff = Math.round((candidate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            effectiveDueDate: formatIsoDateLocal(candidate),
            daysLeft: diff,
            sortTime: candidate.getTime(),
          };
        }

        const paidThisMonth = (item.payments || []).some((p) => {
          const pd = new Date(p.date);
          return pd.getFullYear() === now.getFullYear() && pd.getMonth() === now.getMonth();
        });

        const thisMonthCandidate = getClampedMonthDate(now.getFullYear(), now.getMonth(), day);
        const nextMonthCandidate = getClampedMonthDate(now.getFullYear(), now.getMonth() + 1, day);

        let candidate =
          !paidThisMonth && thisMonthCandidate.getTime() >= now.getTime()
            ? thisMonthCandidate
            : nextMonthCandidate;

        if (item.dueDate) {
          const finalDue = new Date(`${item.dueDate}T00:00:00`);
          if (!isNaN(finalDue.getTime())) {
            if (
              (finalDue.getTime() < candidate.getTime() && finalDue.getTime() >= now.getTime()) ||
              finalDue.getTime() < now.getTime()
            ) {
              candidate = finalDue;
            }
          }
        }

        const diff = Math.round((candidate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          effectiveDueDate: formatIsoDateLocal(candidate),
          daysLeft: diff,
          sortTime: candidate.getTime(),
        };
      }

      if (item.dueDate) {
        const dueObj = new Date(`${item.dueDate}T00:00:00`);
        if (!isNaN(dueObj.getTime())) {
          const diff = Math.round((dueObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            effectiveDueDate: item.dueDate,
            daysLeft: diff,
            sortTime: dueObj.getTime(),
          };
        }
      }

      return {
        effectiveDueDate: '',
        daysLeft: null as number | null,
        sortTime: Number.MAX_SAFE_INTEGER - 1,
      };
    },
    [budgetPeriod]
  );

  // Filtered & sorted debts list (sorted by nearest due date first)
  const filteredDebts = useMemo(() => {
    const filtered = debts.filter((d) => {
      if (activeTypeFilter !== 'all' && d.type !== activeTypeFilter) return false;
      if (activeStatusFilter !== 'all' && d.status !== activeStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = d.name.toLowerCase().includes(q);
        const matchContact = (d.contactName || '').toLowerCase().includes(q);
        const matchNote = (d.note || '').toLowerCase().includes(q);
        if (!matchName && !matchContact && !matchNote) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const aPaid = a.status === 'paid' || a.remainingAmount <= 0;
      const bPaid = b.status === 'paid' || b.remainingAmount <= 0;
      if (aPaid !== bPaid) return aPaid ? 1 : -1;

      const aInfo = getEffectiveDueInfo(a);
      const bInfo = getEffectiveDueInfo(b);
      if (aInfo.sortTime !== bInfo.sortTime) {
        return aInfo.sortTime - bInfo.sortTime;
      }

      const aFinal = a.dueDate ? new Date(`${a.dueDate}T00:00:00`).getTime() : Infinity;
      const bFinal = b.dueDate ? new Date(`${b.dueDate}T00:00:00`).getTime() : Infinity;
      if (aFinal !== bFinal) return aFinal - bFinal;

      return (b.remainingAmount || 0) - (a.remainingAmount || 0);
    });
  }, [debts, activeTypeFilter, activeStatusFilter, searchQuery, getEffectiveDueInfo]);

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

  // Closest upcoming due date across active payables
  const nextDueItem = useMemo(() => {
    const listWithDue = activePayables
      .map((d) => {
        const info = getEffectiveDueInfo(d);
        return { ...d, effectiveDueDate: info.effectiveDueDate, daysLeft: info.daysLeft, time: info.sortTime };
      })
      .filter((d) => d.effectiveDueDate)
      .sort((a, b) => a.time - b.time);
    return listWithDue[0] || null;
  }, [activePayables, getEffectiveDueInfo]);

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
    setFormStartBillingMode('current_period');
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
    setFormRemainingAmount(formatNominalInput(String(debt.remainingAmount)));
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
    const isDeferredNextPeriod =
      debt.type === 'payable' && !isDebtScheduledForBudgetPeriod(debt, budgetPeriod);
    setFormStartBillingMode(isDeferredNextPeriod ? 'next_period' : 'current_period');
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

    // Determine firstPaymentDate when user schedules payment starting next month/period
    let finalFirstPaymentDate: string | undefined = undefined;
    if (formType === 'payable' && formStartBillingMode === 'next_period') {
      finalFirstPaymentDate = budgetPeriod.nextPaydayIso;
      // If it's a one-time debt (not installment) and finalDueDate is still in the current period,
      // automatically move finalDueDate to next period so it aligns with next month
      if (!formIsInstallment) {
        const curDueTime = finalDueDate ? new Date(finalDueDate).getTime() : 0;
        if (!curDueTime || curDueTime <= budgetPeriod.endDate.getTime()) {
          finalDueDate = computeInstallmentDueDate(
            formStartDate || new Date().toISOString().slice(0, 10),
            1,
            parseInt(formDueDayOfMonth, 10) || 10
          );
        }
      }
    }

    if (editingDebt) {
      // Update
      const parsedRem = formRemainingAmount.trim() !== '' ? parseNominalInput(formRemainingAmount) : undefined;
      const oldTotal = editingDebt.totalAmount;
      const oldRem = editingDebt.remainingAmount;
      const deltaTotal = val - oldTotal;
      const newRem =
        parsedRem !== undefined
          ? Math.max(0, Math.min(val, parsedRem))
          : Math.max(0, oldRem + deltaTotal);

      updateDebt(editingDebt.id, {
        name: formName.trim(),
        type: formType,
        contactName: formContactName.trim() || (formType === 'payable' ? 'Lembaga / Pihak' : 'Peminjam'),
        totalAmount: val,
        remainingAmount: newRem,
        status: newRem > 0 ? 'active' : 'paid',
        dueDate: finalDueDate,
        startDate: formStartDate,
        firstPaymentDate: finalFirstPaymentDate,
        category: formCategory,
        isInstallment: formIsInstallment,
        tenorMonths: tenorNum,
        monthlyInstallment: monthlyNum,
        dueDayOfMonth: dueDayNum,
        note: formNote.trim(),
      });
    } else {
      // Add
      const ok = addDebt(
        {
          name: formName.trim(),
          type: formType,
          contactName: formContactName.trim() || (formType === 'payable' ? 'Lembaga / Pihak' : 'Peminjam'),
          totalAmount: val,
          remainingAmount: val,
          dueDate: finalDueDate,
          startDate: formStartDate,
          firstPaymentDate: finalFirstPaymentDate,
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
      if (!ok) return;
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
    setPayWalletId(walletsWithBalance[0]?.id || wallets[0]?.id || '');
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

    const ok = payDebtInstallment(payingDebt.id, amountNum, {
      walletId: payWalletId,
      date: payDate,
      note: payNote.trim(),
    });
    if (!ok) return;

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
            settings.accentColor === 'plum'
              ? 'bg-[#71325A]/25'
              : settings.accentColor === 'orange'
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
                      Terdekat: {nextDueItem.name}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {nextDueItem.dueDayOfMonth
                        ? `Tgl ${nextDueItem.dueDayOfMonth} (${nextDueItem.effectiveDueDate})`
                        : nextDueItem.effectiveDueDate}{' '}
                      · {formatRupiah(getMonthlyDebtInstallmentAmount(nextDueItem), hide)}/bln
                    </p>
                  </div>
                </div>
                {(() => {
                  const days = nextDueItem.daysLeft;
                  if (days === null || days === undefined) return null;
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
                      {isLate
                        ? `Lewat ${Math.abs(days)} hari`
                        : days === 0
                        ? 'Hari ini!'
                        : `${days} hari lagi`}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-[#16181D] p-2.5 sm:p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
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

          <div className="relative min-w-[130px] sm:min-w-[170px]">
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

      {/* Debts List (Sorted by Nearest Due Date) */}
      <div className="space-y-2.5">
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
            const dueInfo = getEffectiveDueInfo(item);
            const daysLeft = dueInfo.daysLeft;
            const isLate = !isPaid && daysLeft !== null && daysLeft < 0;
            const isDeferredNextMonth =
              isPayable && !isPaid && !isDebtScheduledForBudgetPeriod(item, budgetPeriod);
            const monthlyAmt =
              item.monthlyInstallment ||
              (item.tenorMonths && item.tenorMonths > 0
                ? Math.round(item.totalAmount / item.tenorMonths)
                : 0);
            const remainingInstallments =
              !isPaid && monthlyAmt > 0 ? Math.max(1, Math.ceil(item.remainingAmount / monthlyAmt)) : 0;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#16181D] rounded-2xl p-4 sm:p-4.5 border border-gray-200/80 dark:border-gray-800/90 hover:border-gray-300 dark:hover:border-gray-700 transition-all space-y-3"
              >
                {/* Row 1: Compact Header (Icon + Title + Subtitle on Left, Remaining Amount on Right) */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isPaid
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : isPayable
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                      }`}
                    >
                      {isPaid ? (
                        <CheckCircle2 size={18} />
                      ) : isPayable ? (
                        <TrendingDown size={18} />
                      ) : (
                        <TrendingUp size={18} />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h3>

                        {/* Due Countdown / Status Tag */}
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500 text-black">
                            <CheckCircle2 size={10} strokeWidth={3} />
                            <span>Lunas</span>
                          </span>
                        ) : isDeferredNextMonth ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                            <Clock size={10} />
                            <span>Mulai Bulan Depan</span>
                          </span>
                        ) : isLate ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500 text-white">
                            <AlertCircle size={10} />
                            <span>Lewat {Math.abs(daysLeft)} hr</span>
                          </span>
                        ) : daysLeft !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              daysLeft <= 3
                                ? 'bg-amber-500 text-black font-black'
                                : daysLeft <= 7
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            <Clock size={10} />
                            <span>{daysLeft === 0 ? 'Hari ini!' : `${daysLeft} hari lagi`}</span>
                          </span>
                        ) : null}
                      </div>

                      {/* Single Clean Metadata Line */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {item.contactName || (isPayable ? 'Pemberi Pinjaman' : 'Peminjam')}
                        </span>
                        <span>·</span>
                        <span className="capitalize">{item.category || 'Cicilan'}</span>
                        {item.note && (
                          <>
                            <span>·</span>
                            <span className="italic text-gray-400 truncate max-w-[180px] sm:max-w-[260px]">
                              &ldquo;{item.note}&rdquo;
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Remaining Amount */}
                  <div className="text-right shrink-0">
                    <div
                      className={`text-base sm:text-xl font-black tabular-nums tracking-tight ${
                        isPaid
                          ? 'text-gray-400 line-through'
                          : isPayable
                          ? 'text-rose-500 dark:text-rose-400'
                          : 'text-emerald-500 dark:text-emerald-400'
                      }`}
                    >
                      {formatRupiah(item.remainingAmount, hide)}
                    </div>
                    <div className="text-[11px] font-medium text-gray-400 tabular-nums">
                      dari {formatRupiah(item.totalAmount, hide)}
                    </div>
                  </div>
                </div>

                {/* Row 2: Unified Compact Metrics Strip + Thin Progress Bar */}
                <div className="rounded-xl bg-gray-50/90 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80 p-3 space-y-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    {/* Col 1: Cicilan Bulanan */}
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 block">
                        {isPayable ? 'Cicilan / Bulan' : 'Angsuran / Bulan'}
                      </span>
                      <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
                        {monthlyAmt > 0 ? `${formatRupiah(monthlyAmt, hide)}` : 'Sekali Bayar'}
                      </span>
                    </div>

                    {/* Col 2: Jatuh Tempo */}
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 block">
                        Jatuh Tempo
                      </span>
                      <span className={`font-extrabold ${brandAccentText} tabular-nums`}>
                        {item.dueDayOfMonth
                          ? `Tiap Tgl ${item.dueDayOfMonth}`
                          : item.dueDate || '-'}
                      </span>
                    </div>

                    {/* Col 3: Tenor & Sisa Angsuran */}
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 block">
                        Tenor & Target
                      </span>
                      <span className="font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                        {item.tenorMonths ? `${item.tenorMonths} bln` : 'Non-cicilan'}
                        {remainingInstallments > 0 ? ` (sisa ~${remainingInstallments}x)` : ''}
                        {item.dueDayOfMonth && item.dueDate ? ` · ${item.dueDate}` : ''}
                      </span>
                    </div>

                    {/* Col 4: Terbayar & Progres */}
                    <div className="sm:text-right">
                      <span className="text-[10px] font-semibold text-gray-400 block">
                        Progres ({progressPct}%)
                      </span>
                      <span className="font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                        {formatRupiah(paidAmount, hide)}
                      </span>
                    </div>
                  </div>

                  {/* Thin Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-gray-200/80 dark:bg-gray-700/70 overflow-hidden">
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

                {/* Row 3: Compact Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDetailDebt(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Lihat & kelola riwayat pembayaran"
                    >
                      <History size={13} />
                      <span>Riwayat ({item.payments?.length || 0})</span>
                    </button>

                    {((item.payments && item.payments.length > 0) ||
                      item.remainingAmount < item.totalAmount ||
                      isPaid) && (
                      <button
                        type="button"
                        onClick={() => cancelDebtPayment(item.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Batalkan pencatatan pembayaran cicilan terakhir & kembalikan saldo"
                      >
                        <RotateCcw size={12} />
                        <span>{isPaid ? 'Batal Lunas' : 'Batal Bayar'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Edit catatan"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteDebt(item.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Hapus catatan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {!isPaid && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenPay(item)}
                        className={`px-3 py-1.5 rounded-xl ${brandAccentBg} text-xs font-black shadow-xs cursor-pointer transition-transform active:scale-95 flex items-center gap-1`}
                      >
                        <DollarSign size={13} />
                        <span>{isPayable ? 'Bayar Cicilan' : 'Terima Cicilan'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => settleDebt(item.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold cursor-pointer transition-colors"
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

      {/* Modal: Add or Edit Debt (Compact, Clean, Easy to Scan) */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-gray-800/80">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                    {editingDebt ? 'Edit Catatan Utang / Piutang' : 'Catat Utang / Piutang Baru'}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Isi rincian kewajiban atau piutang secara ringkas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-3.5">
                {/* 1. Segmented Type Switcher */}
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800/90">
                  <button
                    type="button"
                    onClick={() => setFormType('payable')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      formType === 'payable'
                        ? 'bg-white dark:bg-[#16181D] text-rose-600 dark:text-rose-400 shadow-xs font-black'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendingDown size={14} />
                    <span>Utang Saya</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('receivable')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      formType === 'receivable'
                        ? 'bg-white dark:bg-[#16181D] text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendingUp size={14} />
                    <span>Piutang Saya</span>
                  </button>
                </div>

                {/* 2. Name & Contact (2 Columns on sm+) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">
                      Nama Utang / Cicilan *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={
                        formType === 'payable'
                          ? 'Misal: Cicilan AC, Shopee'
                          : 'Misal: Pinjaman Budi'
                      }
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">
                      {formType === 'payable' ? 'Pemberi Pinjaman / Bank' : 'Nama Peminjam'}
                    </label>
                    <input
                      type="text"
                      value={formContactName}
                      onChange={(e) => setFormContactName(e.target.value)}
                      placeholder={
                        formType === 'payable'
                          ? 'Misal: Kredivo, BCA, SeaBank'
                          : 'Misal: Ahmad, Teman Kantor'
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                </div>

                {/* 3. Total Amount & Category (2 Columns on sm+) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">
                      Total Pinjaman Pokok (Rp) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formTotalAmount}
                      onChange={(e) => handleTotalAmountChange(e.target.value)}
                      placeholder="Contoh: 3.000.000"
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">
                      Kategori
                    </label>
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
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    >
                      <option value="cicilan">Cicilan & Paylater</option>
                      <option value="bank">Perbankan / Pinjaman Resmi</option>
                      <option value="personal">Personal / Teman & Keluarga</option>
                      <option value="modal">Modal Usaha</option>
                      <option value="kartu_kredit">Kartu Kredit</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* Remaining Amount (Visible when editing) */}
                {editingDebt && (
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-500">
                        Sisa Kewajiban Saat Ini (Rp)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormRemainingAmount(formTotalAmount)}
                        className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw size={11} />
                        <span>Reset ke Total</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formRemainingAmount}
                      onChange={(e) => setFormRemainingAmount(formatNominalInput(e.target.value))}
                      placeholder="Contoh: 3.343.330"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                )}

                {/* 4. Compact Installment Section */}
                <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/90 dark:border-gray-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className={brandAccentText} />
                      <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                        Skema Cicilan Bulanan
                      </span>
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
                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-lime-500 dark:peer-checked:bg-[#D4F826]"></div>
                    </label>
                  </div>

                  {formIsInstallment && (
                    <div className="space-y-3 pt-2 border-t border-gray-200/70 dark:border-gray-700/60">
                      {/* Tenor & Due Day side-by-side */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Tenor */}
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1">
                            Tenor / Durasi (Bulan)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="120"
                              value={formTenorMonths}
                              onChange={(e) => handleTenorChange(e.target.value)}
                              placeholder="6"
                              className="w-full px-3 py-2 pr-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400">
                              Bln
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {['3', '6', '12', '24', '36'].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => handleTenorChange(t)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                                  formTenorMonths === t
                                    ? `${brandAccentBg}`
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                {t}x
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tanggal Jatuh Tempo Bulanan */}
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1">
                            Jatuh Tempo Tiap Tanggal
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={formDueDayOfMonth}
                              onChange={(e) => handleDueDayChange(e.target.value)}
                              placeholder="10"
                              className="w-full px-3 py-2 pr-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400">
                               / bln
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {['1', '5', '10', '15', '25'].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => handleDueDayChange(d)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                                  formDueDayOfMonth === d
                                    ? `${brandAccentBg}`
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                Tgl {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Nominal Cicilan per Bulan */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                            Cicilan per Bulan (Rp)
                          </label>
                          {parseNominalInput(formTotalAmount) > 0 && parseInt(formTenorMonths, 10) > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const tot = parseNominalInput(formTotalAmount);
                                const t = parseInt(formTenorMonths, 10);
                                setFormMonthlyInstallment(formatNominalInput(String(Math.round(tot / t))));
                              }}
                              className={`text-[10px] font-bold ${brandAccentText} hover:underline cursor-pointer flex items-center gap-1`}
                            >
                              <Sparkles size={10} />
                              <span>
                                Bagi Rata ({formatRupiah(Math.round(parseNominalInput(formTotalAmount) / parseInt(formTenorMonths, 10)))})
                              </span>
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formMonthlyInstallment}
                          onChange={(e) => setFormMonthlyInstallment(formatNominalInput(e.target.value))}
                          placeholder="Contoh: 500.000"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                        />
                        {parseNominalInput(formMonthlyInstallment) > 0 && parseInt(formTenorMonths, 10) > 0 && (
                          <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1 px-0.5 tabular-nums">
                            <span>
                              {formatRupiah(parseNominalInput(formMonthlyInstallment))} × {formTenorMonths} bln
                            </span>
                            <span className="font-bold text-gray-700 dark:text-gray-300">
                              Total: {formatRupiah(parseNominalInput(formMonthlyInstallment) * parseInt(formTenorMonths, 10))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Dates: Start & Target Lunas */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">
                      Tanggal Pinjam
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-500">
                        {formIsInstallment ? 'Target Lunas' : 'Jatuh Tempo'}
                      </label>
                      {formIsInstallment && formTenorMonths && (
                        <span className={`text-[10px] ${brandAccentText} font-bold`}>
                          Auto {formTenorMonths} bln
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                </div>

                {/* 6. Jadwal Mulai Pembayaran di Budget (Compact Segmented Toggle + 1-line status) */}
                {formType === 'payable' && (
                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-200">
                        Jadwal Tagihan di Menu Budget
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400">
                        Pos Tagihan Fixed
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormStartBillingMode('current_period')}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          formStartBillingMode === 'current_period'
                            ? 'border-lime-500 dark:border-[#D4F826] bg-lime-500/10 dark:bg-[#D4F826]/10 text-gray-900 dark:text-white font-black'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        <span>Bulan Ini</span>
                        {formStartBillingMode === 'current_period' && (
                          <Check size={13} className="text-lime-600 dark:text-[#D4F826]" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormStartBillingMode('next_period');
                          if (!formIsInstallment) {
                            const nextDue = computeInstallmentDueDate(
                              formStartDate || new Date().toISOString().slice(0, 10),
                              1,
                              parseInt(formDueDayOfMonth, 10) || 10
                            );
                            if (nextDue) setFormDueDate(nextDue);
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          formStartBillingMode === 'next_period'
                            ? 'border-amber-500 bg-amber-500/10 text-gray-900 dark:text-white font-black'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        <span>Mulai Bulan Depan</span>
                        {formStartBillingMode === 'next_period' && (
                          <Check size={13} className="text-amber-500" />
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                      {formStartBillingMode === 'next_period'
                        ? `⏳ Tidak memotong kuota & Pos Tagihan Fixed bulan ini (aktif mulai ${budgetPeriod.nextPaydayIso}).`
                        : '⚡ Langsung masuk Pos Tagihan Bulanan (Fixed) pada periode budget saat ini.'}
                    </p>
                  </div>
                )}

                {/* 7. Cashflow Sync Option (Only on new additions) & Notes */}
                {!editingDebt && (
                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formDisburseCashflow}
                        onChange={(e) => setFormDisburseCashflow(e.target.checked)}
                        className="rounded text-lime-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {formType === 'payable'
                          ? 'Catat dana pinjaman masuk ke saldo dompet?'
                          : 'Potong dana pinjaman dari saldo dompet sekarang?'}
                      </span>
                    </label>

                    {formDisburseCashflow && (
                      <div className="pl-5 space-y-1.5">
                        <select
                          value={formDisburseWalletId}
                          onChange={(e) => setFormDisburseWalletId(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                        >
                          {walletsWithBalance.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({formatRupiah(w.balance, hide)})
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const selectedW = walletsWithBalance.find((w) => w.id === formDisburseWalletId);
                          const totalVal = parseNominalInput(formTotalAmount);
                          if (formType === 'receivable' && selectedW && totalVal > selectedW.balance) {
                            return (
                              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-400 dark:border-red-700 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-1.5">
                                <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold">Saldo {selectedW.name} kurang!</span>{' '}
                                  Tersedia {formatRupiah(selectedW.balance, hide)}.
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Contoh: Bunga 0%, kontrak #12345"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 rounded-xl ${brandAccentBg} text-xs font-black shadow-xs cursor-pointer`}
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
                    {walletsWithBalance.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(w.balance, hide)})
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const selectedW = payWalletId
                      ? walletsWithBalance.find((w) => w.id === payWalletId)
                      : undefined;
                    const amt = parseNominalInput(payAmount);
                    if (payingDebt.type === 'payable' && selectedW && amt > selectedW.balance) {
                      return (
                        <div className="mt-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-400 dark:border-red-700 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-2">
                          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold">Uang di {selectedW.name} Tidak Cukup!</span>{' '}
                            Saldo tersedia {formatRupiah(selectedW.balance, hide)}, kurang{' '}
                            <strong>{formatRupiah(amt - selectedW.balance, hide)}</strong>. Dompet tidak boleh minus.
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
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
        {activeDetailDebt && (
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
                    {activeDetailDebt.name} ({activeDetailDebt.contactName})
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
                    {formatRupiah(activeDetailDebt.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Sisa Belum Dibayar:</span>
                  <span
                    className={`font-black ${
                      activeDetailDebt.remainingAmount <= 0
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {activeDetailDebt.remainingAmount <= 0
                      ? 'Lunas 🎉'
                      : formatRupiah(activeDetailDebt.remainingAmount)}
                  </span>
                </div>
                {activeDetailDebt.monthlyInstallment && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Cicilan Bulanan:</span>
                    <span className="font-bold text-lime-700 dark:text-[#D4F826]">
                      {formatRupiah(activeDetailDebt.monthlyInstallment)} / bulan
                    </span>
                  </div>
                )}
                {activeDetailDebt.tenorMonths && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Tempo / Tenor:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {activeDetailDebt.tenorMonths} Bulan
                    </span>
                  </div>
                )}
                {activeDetailDebt.dueDayOfMonth && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Jatuh Tempo Bulanan:</span>
                    <span className="font-bold text-lime-700 dark:text-[#D4F826]">
                      Setiap tanggal {activeDetailDebt.dueDayOfMonth}
                    </span>
                  </div>
                )}
                {activeDetailDebt.dueDate && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Target Pelunasan Akhir:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {activeDetailDebt.dueDate}
                    </span>
                  </div>
                )}
              </div>

              {/* Payments List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Daftar Angsuran Terbayar ({activeDetailDebt.payments?.length || 0})
                  </h4>
                  {activeDetailDebt.payments && activeDetailDebt.payments.length > 0 && (
                    <span className="text-[10px] font-semibold text-gray-400">
                      Klik Batal untuk membatalkan
                    </span>
                  )}
                </div>

                {!activeDetailDebt.payments || activeDetailDebt.payments.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/40 rounded-2xl text-xs text-gray-400 space-y-2.5">
                    <p>Belum ada riwayat cicilan yang dicatat.</p>
                    {(activeDetailDebt.remainingAmount < activeDetailDebt.totalAmount ||
                      activeDetailDebt.status === 'paid') && (
                      <button
                        type="button"
                        onClick={() => cancelDebtPayment(activeDetailDebt.id)}
                        className="mx-auto px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        <span>Batalkan Pembayaran & Kembalikan Sisa Utang</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                      {activeDetailDebt.payments.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-gray-900 dark:text-white truncate">
                              {p.note || `Cicilan #${idx + 1}`}
                            </div>
                            <div className="text-[11px] text-gray-400 flex flex-wrap items-center gap-2">
                              <span>{p.date}</span>
                              {p.walletName && (
                                <span className="inline-flex items-center gap-1 font-semibold text-gray-500 dark:text-gray-400">
                                  <WalletIcon size={11} /> {p.walletName}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                              +{formatRupiah(p.amount)}
                            </div>
                            <button
                              type="button"
                              onClick={() => cancelDebtPayment(activeDetailDebt.id, p.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Batalkan pencatatan pembayaran cicilan ini"
                            >
                              <RotateCcw size={12} />
                              <span>Batal</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed pt-1">
                      💡 Membatalkan pembayaran akan otomatis mengembalikan sisa kewajiban utang dan mengembalikan saldo dompet yang terpotong.
                    </p>
                  </>
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
