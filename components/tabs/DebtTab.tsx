'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  X,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ArrowDownLeft,
  History,
  Trash2,
  Edit2,
  Wallet as WalletIcon,
  Search,
  Check,
  CalendarDays,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { formatRupiah, formatNominalInput, parseNominalInput } from '@/lib/formatters';
import {
  getMonthlyDebtInstallmentAmount,
  isDebtScheduledForBudgetPeriod,
  isDateInBudgetPeriod,
} from '@/lib/budgetUtils';
import { Debt } from '@/lib/types';
import { WalletBrandLogo, detectWalletBrand } from '../WalletBrandLogo';

/**
 * Formats a Date object as local YYYY-MM-DD (avoids UTC shift from .toISOString())
 */
function formatIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Safely parses a YYYY-MM-DD or ISO date string at local midnight
 */
function parseLocalMidnight(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.slice(0, 10);
  const parts = clean.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }
  const fallback = new Date(dateStr);
  if (isNaN(fallback.getTime())) return null;
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

function getClampedMonthDate(year: number, monthIndex: number, dayOfMonth: number): Date {
  const maxDay = new Date(year, monthIndex + 1, 0).getDate();
  const actualDay = Math.max(1, Math.min(dayOfMonth, maxDay));
  return new Date(year, monthIndex, actualDay, 0, 0, 0, 0);
}

function computeInstallmentDueDate(
  startDateStr: string,
  tenorMonths: number,
  dueDayOfMonth: number
): string {
  if (!startDateStr || !tenorMonths || tenorMonths <= 0) return '';
  const d = parseLocalMidnight(startDateStr);
  if (!d) return '';

  const targetYear = d.getFullYear();
  const targetMonth = d.getMonth() + tenorMonths;
  const clampedDay = Math.max(1, Math.min(31, dueDayOfMonth || d.getDate() || 10));

  const targetDateObj = new Date(targetYear, targetMonth, 1);
  const maxDays = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth() + 1, 0).getDate();
  const actualDay = Math.min(clampedDay, maxDays);

  const finalObj = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth(), actualDay);
  return formatIsoDateLocal(finalObj);
}

const CATEGORY_LABELS: Record<string, string> = {
  cicilan: 'Cicilan & Paylater',
  bank: 'Pinjaman Bank',
  personal: 'Personal / Kerabat',
  modal: 'Modal Usaha',
  kartu_kredit: 'Kartu Kredit',
  lainnya: 'Lainnya',
};

export function DebtTab() {
  const {
    debts,
    addDebt,
    updateDebt,
    deleteDebt,
    payDebtInstallment,
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

  // Filters & State
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'payable' | 'receivable'>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'active' | 'paid'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Installment payment modal
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [isFullSettlementMode, setIsFullSettlementMode] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payWalletId, setPayWalletId] = useState('');
  const [payDate, setPayDate] = useState(() => formatIsoDateLocal(new Date()));
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
  const [formStartDate, setFormStartDate] = useState(() => formatIsoDateLocal(new Date()));
  const [formCategory, setFormCategory] = useState('cicilan');
  const [formIsInstallment, setFormIsInstallment] = useState(true);
  const [formTenorMonths, setFormTenorMonths] = useState('6');
  const [formMonthlyInstallment, setFormMonthlyInstallment] = useState('');
  const [formDueDayOfMonth, setFormDueDayOfMonth] = useState('10');
  const [formStartBillingMode, setFormStartBillingMode] = useState<'current_period' | 'next_period'>('current_period');
  const [formNote, setFormNote] = useState('');
  const [formDisburseCashflow, setFormDisburseCashflow] = useState(false);
  const [formDisburseWalletId, setFormDisburseWalletId] = useState('');

  // Liquid wallets sorted by highest balance first for smart defaults
  const liquidWallets = useMemo(
    () => walletsWithBalance.filter((w) => w.type !== 'credit' && w.type !== 'paylater'),
    [walletsWithBalance]
  );

  // Check how much of a debt was paid in the current budget period / current calendar month
  const getDebtPaidInCurrentPeriod = React.useCallback(
    (item: Debt): number => {
      const now = new Date();
      return (item.payments || []).reduce((sum, p) => {
        const pd = parseLocalMidnight(p.date);
        if (!pd) return sum;
        const inPeriod = isDateInBudgetPeriod(pd, budgetPeriod);
        const inSameCalendarMonth =
          pd.getFullYear() === now.getFullYear() && pd.getMonth() === now.getMonth();
        if (inPeriod || inSameCalendarMonth) {
          return sum + (Number(p.amount) || 0);
        }
        return sum;
      }, 0);
    },
    [budgetPeriod]
  );

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
    const prevTotal = parseNominalInput(formTotalAmount);
    const prevRem = parseNominalInput(formRemainingAmount);
    const formatted = formatNominalInput(valStr);
    setFormTotalAmount(formatted);

    const totalVal = parseNominalInput(formatted);
    const tNum = parseInt(formTenorMonths, 10) || 6;
    if (formIsInstallment && tNum > 0 && totalVal > 0) {
      setFormMonthlyInstallment(formatNominalInput(String(Math.round(totalVal / tNum))));
    }

    // If editing a debt that had no prior payments (remaining == total), keep remaining in sync
    if (
      editingDebt &&
      (editingDebt.payments?.length || 0) === 0 &&
      (prevRem === prevTotal || !formRemainingAmount)
    ) {
      setFormRemainingAmount(formatted);
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

  // Compute effective next payment due date & days remaining
  const getEffectiveDueInfo = React.useCallback(
    (item: Debt) => {
      const isPaid = item.status === 'paid' || item.remainingAmount <= 0;
      if (isPaid) {
        return {
          effectiveDueDate: item.dueDate || '',
          daysLeft: null as number | null,
          sortTime: Number.MAX_SAFE_INTEGER,
          paidThisCycle: true,
        };
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const isDeferred =
        item.type === 'payable' && !isDebtScheduledForBudgetPeriod(item, budgetPeriod);

      const paidAmountThisCycle = getDebtPaidInCurrentPeriod(item);
      const targetMonthly = getMonthlyDebtInstallmentAmount(item);
      const paidThisCycle =
        paidAmountThisCycle > 0 &&
        (targetMonthly > 0 ? paidAmountThisCycle >= targetMonthly * 0.9 : true);

      if (item.dueDayOfMonth && item.dueDayOfMonth > 0) {
        const day = Math.max(1, Math.min(31, item.dueDayOfMonth));

        if (isDeferred) {
          const baseDate =
            parseLocalMidnight(item.firstPaymentDate) ||
            new Date(now.getFullYear(), now.getMonth() + 1, 1);
          let candidate = getClampedMonthDate(baseDate.getFullYear(), baseDate.getMonth(), day);
          if (candidate.getTime() < baseDate.getTime()) {
            candidate = getClampedMonthDate(baseDate.getFullYear(), baseDate.getMonth() + 1, day);
          }
          const diff = Math.round((candidate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            effectiveDueDate: formatIsoDateLocal(candidate),
            daysLeft: diff,
            sortTime: candidate.getTime(),
            paidThisCycle: false,
          };
        }

        const thisMonthCandidate = getClampedMonthDate(now.getFullYear(), now.getMonth(), day);
        const nextMonthCandidate = getClampedMonthDate(now.getFullYear(), now.getMonth() + 1, day);

        let candidate = !paidThisCycle ? thisMonthCandidate : nextMonthCandidate;

        if (item.dueDate) {
          const finalDue = parseLocalMidnight(item.dueDate);
          if (finalDue) {
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
          paidThisCycle,
        };
      }

      if (item.dueDate) {
        const dueObj = parseLocalMidnight(item.dueDate);
        if (dueObj) {
          const diff = Math.round((dueObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            effectiveDueDate: item.dueDate,
            daysLeft: diff,
            sortTime: dueObj.getTime(),
            paidThisCycle,
          };
        }
      }

      return {
        effectiveDueDate: '',
        daysLeft: null as number | null,
        sortTime: Number.MAX_SAFE_INTEGER - 1,
        paidThisCycle,
      };
    },
    [budgetPeriod, getDebtPaidInCurrentPeriod]
  );

  // Filtered & sorted debts list (sorted by nearest due date first)
  const filteredDebts = useMemo(() => {
    const filtered = debts.filter((d) => {
      if (activeTypeFilter !== 'all' && d.type !== activeTypeFilter) return false;
      if (activeStatusFilter !== 'all') {
        const isPaid = d.status === 'paid' || d.remainingAmount <= 0;
        if (activeStatusFilter === 'paid' && !isPaid) return false;
        if (activeStatusFilter === 'active' && isPaid) return false;
      }
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

      const aFinal = parseLocalMidnight(a.dueDate)?.getTime() ?? Infinity;
      const bFinal = parseLocalMidnight(b.dueDate)?.getTime() ?? Infinity;
      if (aFinal !== bFinal) return aFinal - bFinal;

      return (b.remainingAmount || 0) - (a.remainingAmount || 0);
    });
  }, [debts, activeTypeFilter, activeStatusFilter, searchQuery, getEffectiveDueInfo]);

  // Aggregate stats
  const activePayables = useMemo(
    () => debts.filter((d) => d.type === 'payable' && d.status === 'active' && d.remainingAmount > 0),
    [debts]
  );
  const activeReceivables = useMemo(
    () => debts.filter((d) => d.type === 'receivable' && d.status === 'active' && d.remainingAmount > 0),
    [debts]
  );
  const totalPayableRemaining = useMemo(
    () => activePayables.reduce((acc, d) => acc + (d.remainingAmount ?? d.totalAmount), 0),
    [activePayables]
  );
  const totalPayableOriginal = useMemo(
    () => activePayables.reduce((acc, d) => acc + (d.totalAmount || 0), 0),
    [activePayables]
  );
  const totalReceivableRemaining = useMemo(
    () => activeReceivables.reduce((acc, d) => acc + (d.remainingAmount ?? d.totalAmount), 0),
    [activeReceivables]
  );

  // Monthly obligation for the current budget period
  const monthlyObligationStats = useMemo(() => {
    let totalDueThisPeriod = 0;
    let totalPaidThisPeriod = 0;

    for (const d of debts.filter((item) => item.type === 'payable')) {
      const paidThisCycle = getDebtPaidInCurrentPeriod(d);
      totalPaidThisPeriod += paidThisCycle;

      const isScheduled = isDebtScheduledForBudgetPeriod(d, budgetPeriod);
      if (!isScheduled) continue;

      if (d.status === 'active' && d.remainingAmount > 0) {
        const monthlyAmt = getMonthlyDebtInstallmentAmount(d);
        totalDueThisPeriod += Math.max(monthlyAmt, paidThisCycle);
      } else if (paidThisCycle > 0) {
        totalDueThisPeriod += paidThisCycle;
      }
    }

    const remainingDueThisPeriod = Math.max(0, totalDueThisPeriod - totalPaidThisPeriod);
    return {
      totalDueThisPeriod,
      totalPaidThisPeriod,
      remainingDueThisPeriod,
    };
  }, [debts, budgetPeriod, getDebtPaidInCurrentPeriod]);

  // Liquid assets from positive wallets
  const liquidAssets = useMemo(() => {
    return liquidWallets
      .filter((w) => w.balance > 0)
      .reduce((acc, w) => acc + w.balance, 0);
  }, [liquidWallets]);

  // Monthly Debt Burden vs Liquid Cash Ratio (more realistic for installments!)
  const monthlyBurdenPct =
    monthlyObligationStats.remainingDueThisPeriod <= 0
      ? 0
      : liquidAssets > 0
      ? Math.round((monthlyObligationStats.remainingDueThisPeriod / liquidAssets) * 100)
      : 100;

  // Closest upcoming due date across active payables that haven't been paid this cycle
  const nextDueItem = useMemo(() => {
    const listWithDue = activePayables
      .map((d) => {
        const info = getEffectiveDueInfo(d);
        return {
          ...d,
          effectiveDueDate: info.effectiveDueDate,
          daysLeft: info.daysLeft,
          time: info.sortTime,
          paidThisCycle: info.paidThisCycle,
        };
      })
      .filter((d) => d.effectiveDueDate && !d.paidThisCycle)
      .sort((a, b) => a.time - b.time);
    return listWithDue[0] || null;
  }, [activePayables, getEffectiveDueInfo]);

  // Open Add Modal
  const handleOpenAdd = (type: 'payable' | 'receivable' = 'payable') => {
    const today = formatIsoDateLocal(new Date());
    setEditingDebt(null);
    setFormType(type);
    setFormName('');
    setFormContactName('');
    setFormTotalAmount('');
    setFormRemainingAmount('');
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
    setFormDisburseWalletId(liquidWallets[0]?.id || wallets[0]?.id || '');
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
    const sDate = debt.startDate || formatIsoDateLocal(new Date());
    setFormStartDate(sDate);
    setFormCategory(debt.category || (debt.type === 'payable' ? 'cicilan' : 'personal'));
    const isInst = debt.isInstallment ?? (debt.category === 'cicilan' || Boolean(debt.tenorMonths));
    setFormIsInstallment(isInst);
    setFormTenorMonths(debt.tenorMonths ? String(debt.tenorMonths) : '6');
    setFormMonthlyInstallment(
      debt.monthlyInstallment ? formatNominalInput(String(debt.monthlyInstallment)) : ''
    );
    const parsedDue = parseLocalMidnight(debt.dueDate);
    const defaultDay = debt.dueDayOfMonth
      ? String(debt.dueDayOfMonth)
      : parsedDue
      ? String(parsedDue.getDate())
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

    const tenorNum =
      formIsInstallment && formTenorMonths ? parseInt(formTenorMonths, 10) : undefined;
    const dueDayNum =
      formIsInstallment && formDueDayOfMonth
        ? Math.max(1, Math.min(31, parseInt(formDueDayOfMonth, 10)))
        : undefined;
    const rawMonthly = parseNominalInput(formMonthlyInstallment);
    const monthlyNum = formIsInstallment
      ? rawMonthly > 0
        ? rawMonthly
        : tenorNum && tenorNum > 0
        ? Math.round(val / tenorNum)
        : undefined
      : undefined;

    let finalDueDate = formDueDate;
    if (!finalDueDate && formIsInstallment && tenorNum && dueDayNum) {
      finalDueDate = computeInstallmentDueDate(formStartDate, tenorNum, dueDayNum);
    }

    // Determine firstPaymentDate when user schedules payment starting next month/period
    let finalFirstPaymentDate: string | undefined = undefined;
    if (formType === 'payable' && formStartBillingMode === 'next_period') {
      finalFirstPaymentDate = budgetPeriod.nextPaydayIso;
      if (!formIsInstallment) {
        const curDueTime = parseLocalMidnight(finalDueDate)?.getTime() || 0;
        if (!curDueTime || curDueTime <= budgetPeriod.endDate.getTime()) {
          finalDueDate = computeInstallmentDueDate(
            formStartDate || formatIsoDateLocal(new Date()),
            1,
            parseInt(formDueDayOfMonth, 10) || 10
          );
        }
      }
    }

    if (editingDebt) {
      const parsedRem =
        formRemainingAmount.trim() !== '' ? parseNominalInput(formRemainingAmount) : undefined;
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
        contactName:
          formContactName.trim() || (formType === 'payable' ? 'Lembaga / Pihak' : 'Peminjam'),
        totalAmount: val,
        remainingAmount: newRem,
        status: newRem > 0 ? 'active' : 'paid',
        dueDate: finalDueDate,
        startDate: formStartDate,
        firstPaymentDate: finalFirstPaymentDate,
        category: formCategory,
        isInstallment: formIsInstallment,
        tenorMonths: formIsInstallment ? tenorNum : undefined,
        monthlyInstallment: formIsInstallment ? monthlyNum : undefined,
        dueDayOfMonth: formIsInstallment ? dueDayNum : undefined,
        note: formNote.trim(),
      });
    } else {
      const ok = addDebt(
        {
          name: formName.trim(),
          type: formType,
          contactName:
            formContactName.trim() || (formType === 'payable' ? 'Lembaga / Pihak' : 'Peminjam'),
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

  // Open Payment Modal (supports both regular installment and full settlement)
  const handleOpenPay = (debt: Debt, fullSettlement = false) => {
    setPayingDebt(debt);
    setIsFullSettlementMode(fullSettlement);

    const defaultAmount = fullSettlement
      ? debt.remainingAmount
      : debt.monthlyInstallment && debt.monthlyInstallment > 0
      ? Math.min(debt.monthlyInstallment, debt.remainingAmount)
      : debt.remainingAmount;

    setPayAmount(formatNominalInput(String(defaultAmount)));

    // Smartly pick a liquid wallet that has enough balance for payable debt
    const candidatePool = liquidWallets.length > 0 ? liquidWallets : walletsWithBalance;
    const sufficientWallet =
      debt.type === 'payable'
        ? candidatePool.find((w) => w.balance >= defaultAmount) ||
          [...candidatePool].sort((a, b) => b.balance - a.balance)[0]
        : candidatePool[0];

    setPayWalletId(sufficientWallet?.id || wallets[0]?.id || '');
    setPayDate(formatIsoDateLocal(new Date()));

    const nextInstallmentNum = (debt.payments?.length || 0) + 1;
    setPayNote(
      fullSettlement
        ? `Pelunasan Penuh ${debt.name}`
        : debt.type === 'payable'
        ? debt.isInstallment || debt.tenorMonths
          ? `Cicilan ke-${nextInstallmentNum} ${debt.name}`
          : `Pembayaran ${debt.name}`
        : `Penerimaan cicilan/pelunasan ${debt.name}`
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
    setIsFullSettlementMode(false);
  };

  const overallPaidPct =
    totalPayableOriginal > 0
      ? Math.min(
          100,
          Math.round(
            (Math.max(0, totalPayableOriginal - totalPayableRemaining) / totalPayableOriginal) * 100
          )
        )
      : 100;

  return (
    <div className="space-y-5 lg:space-y-6 pb-28 lg:pb-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 lg:pt-0 px-0.5">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Utang, Cicilan & Piutang</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
              {debts.length} Catatan
            </span>
          </h1>
          <p className="text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Pantau kewajiban cicilan bulanan & piutang aktif, tersinkronisasi langsung dengan Dompet & Budget.
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
            className="h-10 px-4 rounded-full bg-white dark:bg-[#16181D] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 font-extrabold text-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
            title="Catat piutang (orang yang berutang ke Anda)"
          >
            <ArrowDownLeft size={16} className="shrink-0 text-emerald-500" />
            <span>Catat Piutang</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-[28px] lg:rounded-[32px] p-5 sm:p-6 lg:p-7 text-white shadow-xl border border-white/10 relative overflow-hidden">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch relative z-10">
          {/* Left Column: 3 Key Metric Cards */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-[#D4F826] uppercase tracking-widest">
                  RINGKASAN KEWAJIBAN & PIUTANG
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 text-[10px] font-bold">
                  {activePayables.length === 0
                    ? 'Bebas Utang 🎉'
                    : `${activePayables.length} Utang Aktif`}
                </span>
              </div>
              {totalPayableOriginal > 0 && (
                <span className="text-[11px] font-semibold text-slate-300">
                  Progres Pelunasan Pokok: <strong className="text-[#D4F826]">{overallPaidPct}%</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* 1. Total Sisa Utang Pokok */}
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <TrendingDown size={14} />
                    <span>Total Sisa Utang</span>
                  </div>
                </div>
                <div className="font-mono-num text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
                  {formatRupiah(totalPayableRemaining, hide)}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {activePayables.length > 0
                    ? `Dari pokok ${formatRupiah(totalPayableOriginal, hide)}`
                    : 'Tidak ada kewajiban aktif'}
                </div>
              </div>

              {/* 2. Tagihan Cicilan Bulan Ini */}
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4F826]">
                    <CalendarDays size={14} />
                    <span>Cicilan Bulan Ini</span>
                  </div>
                  {monthlyObligationStats.totalDueThisPeriod > 0 &&
                    monthlyObligationStats.remainingDueThisPeriod === 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        LUNAS BLN INI
                      </span>
                    )}
                </div>
                <div className="font-mono-num text-xl sm:text-2xl font-extrabold tracking-tight text-[#D4F826] truncate">
                  {formatRupiah(monthlyObligationStats.remainingDueThisPeriod, hide)}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {monthlyObligationStats.totalPaidThisPeriod > 0
                    ? `Terbayar bln ini: ${formatRupiah(monthlyObligationStats.totalPaidThisPeriod, hide)}`
                    : monthlyObligationStats.totalDueThisPeriod > 0
                    ? 'Belum dibayar periode ini'
                    : 'Tidak ada tagihan bulan ini'}
                </div>
              </div>

              {/* 3. Total Piutang Saya */}
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <TrendingUp size={14} />
                  <span>Piutang (Di Luar)</span>
                </div>
                <div className="font-mono-num text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-300 truncate">
                  {formatRupiah(totalReceivableRemaining, hide)}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {activeReceivables.length} catatan belum ditagih
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Health & Next Due */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  BEBAN CICILAN / KAS
                </span>
                <span
                  className={`font-mono-num text-lg lg:text-xl font-black block ${
                    monthlyBurdenPct <= 25
                      ? 'text-[#D4F826]'
                      : monthlyBurdenPct <= 45
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {monthlyBurdenPct}%
                </span>
                <p className="text-[10px] text-slate-400 truncate">
                  Kas: {formatRupiah(liquidAssets, hide)}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  STATUS KESEHATAN
                </span>
                <span className="text-sm lg:text-base font-extrabold text-white block mt-0.5">
                  {totalPayableRemaining === 0
                    ? 'Bebas Utang 🎉'
                    : monthlyBurdenPct <= 30
                    ? 'Terkendali 👍'
                    : 'Waspada ⚠️'}
                </span>
                <p className="text-[10px] text-slate-400 truncate">
                  {monthlyBurdenPct <= 30 ? 'Rasio cicilan sehat' : 'Prioritaskan cicilan'}
                </p>
              </div>
            </div>

            {/* Next Due Notification Banner */}
            {nextDueItem ? (
              <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#D4F826]/15 border border-[#D4F826]/30 flex items-center justify-center shrink-0">
                    <Clock size={15} className="text-[#D4F826]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-white truncate">
                      Terdekat: {nextDueItem.name}
                    </p>
                    <p className="text-[11px] text-slate-300 truncate">
                      {nextDueItem.dueDayOfMonth
                        ? `Tgl ${nextDueItem.dueDayOfMonth} (${nextDueItem.effectiveDueDate})`
                        : nextDueItem.effectiveDueDate}{' '}
                      · {formatRupiah(getMonthlyDebtInstallmentAmount(nextDueItem), hide)}
                    </p>
                  </div>
                </div>
                {(() => {
                  const days = nextDueItem.daysLeft;
                  if (days === null || days === undefined) return null;
                  const isLate = days < 0;
                  return (
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${
                        isLate
                          ? 'bg-rose-500 text-white'
                          : days <= 3
                          ? 'bg-amber-400 text-black'
                          : 'bg-white/15 text-slate-100'
                      }`}
                    >
                      {isLate
                        ? `Lewat ${Math.abs(days)} hr`
                        : days === 0
                        ? 'Hari ini!'
                        : `${days} hr lagi`}
                    </span>
                  );
                })()}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                <p className="text-xs font-semibold text-emerald-200 leading-snug">
                  {activePayables.length === 0
                    ? 'Tidak ada jadwal tagihan utang aktif.'
                    : 'Semua jadwal cicilan bulan ini sudah terbayar tepat waktu!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-[#11131E] p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
        {/* Type Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTypeFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTypeFilter === 'all'
                ? `${brandAccentBg} shadow-xs font-black`
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Semua ({debts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeFilter('payable')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTypeFilter === 'payable'
                ? `${brandAccentBg} shadow-xs font-black`
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <TrendingDown size={14} className="text-rose-500" />
            <span>Utang Saya ({debts.filter((d) => d.type === 'payable').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeFilter('receivable')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTypeFilter === 'receivable'
                ? `${brandAccentBg} shadow-xs font-black`
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={14} className="text-emerald-500" />
            <span>Piutang Saya ({debts.filter((d) => d.type === 'receivable').length})</span>
          </button>
        </div>

        {/* Status Filter & Search */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.06] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                activeStatusFilter === 'active'
                  ? 'bg-white dark:bg-[#1E2235] text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Belum Lunas
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('paid')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                activeStatusFilter === 'paid'
                  ? 'bg-white dark:bg-[#1E2235] text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Lunas
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                activeStatusFilter === 'all'
                  ? 'bg-white dark:bg-[#1E2235] text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua
            </button>
          </div>

          <div className="relative min-w-[130px] sm:min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / pihak..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D4F826]"
            />
          </div>
        </div>
      </div>

      {/* Debts List (Sorted by Nearest Due Date) */}
      <div className="space-y-3.5">
        {filteredDebts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#11131E] rounded-[28px] p-6 border border-slate-200/80 dark:border-white/[0.08] space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <p className="font-display text-base font-extrabold text-slate-900 dark:text-white">
              Tidak ada catatan utang / piutang
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeStatusFilter === 'active'
                ? 'Semua kewajiban telah lunas atau belum ada catatan baru yang dimasukkan.'
                : 'Tidak ada data yang sesuai dengan filter pencarian.'}
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAdd('payable')}
                className={`px-4 py-2.5 rounded-xl ${brandAccentBg} text-xs font-black cursor-pointer shadow-xs`}
              >
                + Catat Utang Baru
              </button>
              <button
                type="button"
                onClick={() => handleOpenAdd('receivable')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                + Catat Piutang
              </button>
            </div>
          </div>
        ) : (
          filteredDebts.map((item) => {
            const isPayable = item.type === 'payable';
            const isPaid = item.status === 'paid' || item.remainingAmount <= 0;
            const paidAmount = Math.max(0, item.totalAmount - item.remainingAmount);
            const progressPct =
              item.totalAmount > 0
                ? Math.min(100, Math.round((paidAmount / item.totalAmount) * 100))
                : 100;

            const dueInfo = getEffectiveDueInfo(item);
            const daysLeft = dueInfo.daysLeft;
            const paidThisCycle = dueInfo.paidThisCycle;
            const isLate = !isPaid && !paidThisCycle && daysLeft !== null && daysLeft < 0;
            const isDeferredNextMonth =
              isPayable && !isPaid && !isDebtScheduledForBudgetPeriod(item, budgetPeriod);

            const monthlyAmt =
              item.monthlyInstallment ||
              (item.tenorMonths && item.tenorMonths > 0
                ? Math.round(item.totalAmount / item.tenorMonths)
                : 0);

            const remainingInstallments =
              !isPaid && monthlyAmt > 0
                ? Math.max(1, Math.ceil(item.remainingAmount / monthlyAmt))
                : 0;

            // Detect if contactName or name matches one of the 17 official bank / e-wallet brands
            const matchedBrand =
              detectWalletBrand(item.contactName) || detectWalletBrand(item.name);

            const topBarColor = isPaid
              ? '#10B981'
              : matchedBrand
              ? matchedBrand.primaryColor
              : isPayable
              ? '#F43F5E'
              : '#10B981';

            return (
              <div
                key={item.id}
                className="relative overflow-hidden bg-white dark:bg-[#11131E] rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.08] hover:border-indigo-500/40 transition-all space-y-3.5 shadow-2xs"
              >
                {/* Top Brand / Status Strip */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: topBarColor }}
                />

                {/* Row 1: Header (Logo/Icon + Title + Status Badges on Left, Remaining Amount on Right) */}
                <div className="flex items-start justify-between gap-3 pt-0.5">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {matchedBrand ? (
                      <WalletBrandLogo brandId={matchedBrand.id} size="md" />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isPaid
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : isPayable
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        }`}
                      >
                        {isPaid ? (
                          <CheckCircle2 size={20} />
                        ) : isPayable ? (
                          <TrendingDown size={20} />
                        ) : (
                          <TrendingUp size={20} />
                        )}
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isPayable
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isPayable ? 'UTANG SAYA' : 'PIUTANG'}
                        </span>

                        {/* Due Countdown / Paid This Month Status Tag */}
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500 text-black">
                            <CheckCircle2 size={10} strokeWidth={3} />
                            <span>Lunas Penuh</span>
                          </span>
                        ) : paidThisCycle ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 size={10} />
                            <span>Sudah Dibayar Bulan Ini</span>
                          </span>
                        ) : isDeferredNextMonth ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                            <Clock size={10} />
                            <span>Mulai Bulan Depan</span>
                          </span>
                        ) : isLate ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500 text-white">
                            <AlertCircle size={10} />
                            <span>Terlambat {Math.abs(daysLeft)} hari</span>
                          </span>
                        ) : daysLeft !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              daysLeft <= 3
                                ? 'bg-amber-400 text-black font-black'
                                : daysLeft <= 7
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                : 'bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Clock size={10} />
                            <span>
                              {daysLeft === 0 ? 'Jatuh Tempo Hari Ini!' : `${daysLeft} hari lagi`}
                            </span>
                          </span>
                        ) : null}
                      </div>

                      <h3 className="font-display text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </h3>

                      {/* Metadata Line */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Building2 size={12} className="text-slate-400" />
                          {item.contactName || (isPayable ? 'Lembaga / Pihak' : 'Peminjam')}
                        </span>
                        <span>·</span>
                        <span>
                          {CATEGORY_LABELS[item.category || 'cicilan'] || item.category || 'Cicilan'}
                        </span>
                        {item.note && (
                          <>
                            <span>·</span>
                            <span className="italic text-slate-400 truncate max-w-[180px] sm:max-w-[260px]">
                              &ldquo;{item.note}&rdquo;
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Remaining Amount */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {isPaid ? 'STATUS' : 'SISA POKOK'}
                    </span>
                    <div
                      className={`font-mono-num text-base sm:text-xl font-extrabold tracking-tight ${
                        isPaid
                          ? 'text-emerald-500 dark:text-emerald-400'
                          : isPayable
                          ? 'text-rose-500 dark:text-rose-400'
                          : 'text-emerald-500 dark:text-emerald-400'
                      }`}
                    >
                      {isPaid ? 'Rp 0 (Lunas)' : formatRupiah(item.remainingAmount, hide)}
                    </div>
                    <div className="font-mono-num text-[11px] font-medium text-slate-400">
                      Total: {formatRupiah(item.totalAmount, hide)}
                    </div>
                  </div>
                </div>

                {/* Row 2: Unified Metrics Strip + Progress Bar */}
                <div className="rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] p-3.5 space-y-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {/* Col 1: Cicilan Bulanan */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">
                        {isPayable ? 'Cicilan / Bulan' : 'Angsuran / Bulan'}
                      </span>
                      <span className="font-mono-num font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                        {monthlyAmt > 0 ? `${formatRupiah(monthlyAmt, hide)}` : 'Sekali Bayar'}
                      </span>
                    </div>

                    {/* Col 2: Jatuh Tempo */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">
                        Jadwal Jatuh Tempo
                      </span>
                      <span className={`font-mono-num font-extrabold ${brandAccentText} mt-0.5 block`}>
                        {item.dueDayOfMonth
                          ? `Tiap Tgl ${item.dueDayOfMonth}`
                          : item.dueDate || '-'}
                      </span>
                    </div>

                    {/* Col 3: Tenor & Sisa Angsuran */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">
                        Tenor & Sisa Kali
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 mt-0.5 block">
                        {item.tenorMonths ? `${item.tenorMonths} bln` : 'Non-cicilan'}
                        {remainingInstallments > 0 ? ` · Sisa ${remainingInstallments}x` : ''}
                      </span>
                    </div>

                    {/* Col 4: Terbayar & Progres */}
                    <div className="sm:text-right">
                      <span className="text-[10px] font-semibold text-slate-400 block">
                        Terbayar ({progressPct}%)
                      </span>
                      <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                        {formatRupiah(paidAmount, hide)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPaid
                          ? 'bg-emerald-500'
                          : isPayable
                          ? 'bg-gradient-to-r from-[#84CC16] to-[#D4F826]'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Row 3: Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDetailDebt(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
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
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit catatan"
                    >
                      <Edit2 size={13} />
                      <span className="hidden sm:inline">Ubah</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirmDeleteId === item.id) {
                          deleteDebt(item.id);
                          setConfirmDeleteId(null);
                        } else {
                          setConfirmDeleteId(item.id);
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        confirmDeleteId === item.id
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                      }`}
                      title="Hapus catatan"
                    >
                      <Trash2 size={13} />
                      {confirmDeleteId === item.id && <span>Yakin Hapus?</span>}
                    </button>
                  </div>

                  {!isPaid && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenPay(item, false)}
                        className={`px-3.5 py-2 rounded-xl ${brandAccentBg} text-xs font-black shadow-xs cursor-pointer transition-transform active:scale-95 flex items-center gap-1`}
                      >
                        <DollarSign size={13} />
                        <span>{isPayable ? 'Bayar Cicilan' : 'Terima Cicilan'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPay(item, true)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
                        title="Lunasi seluruh sisa kewajiban dengan memilih dompet"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white dark:bg-[#11131E] rounded-[28px] p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200/80 dark:border-white/10 max-h-[92vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.08]">
                <div>
                  <h3 className="font-display text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    {editingDebt ? 'Edit Catatan Utang / Piutang' : 'Catat Utang / Piutang Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Isi rincian kewajiban atau piutang agar tersinkron ke Budget & Dompet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-3.5">
                {/* 1. Segmented Type Switcher */}
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setFormType('payable')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      formType === 'payable'
                        ? 'bg-white dark:bg-[#1E2235] text-rose-600 dark:text-rose-400 shadow-xs font-black'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                        ? 'bg-white dark:bg-[#1E2235] text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendingUp size={14} />
                    <span>Piutang Saya</span>
                  </button>
                </div>

                {/* 2. Name & Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Nama Utang / Cicilan *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={
                        formType === 'payable'
                          ? 'Misal: Cicilan iPhone, SPayLater'
                          : 'Misal: Pinjaman Budi'
                      }
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      {formType === 'payable' ? 'Bank / Lembaga / Pihak' : 'Nama Peminjam'}
                    </label>
                    <input
                      type="text"
                      value={formContactName}
                      onChange={(e) => setFormContactName(e.target.value)}
                      placeholder={
                        formType === 'payable'
                          ? 'Misal: BCA, Mandiri, SeaBank, ShopeePay'
                          : 'Misal: Ahmad, Teman Kantor'
                      }
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                </div>

                {/* 3. Total Amount & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Total Pinjaman Pokok (Rp) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formTotalAmount}
                      onChange={(e) => handleTotalAmountChange(e.target.value)}
                      placeholder="Contoh: 3.000.000"
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono-num focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
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
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
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
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
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
                      placeholder="Contoh: 1.500.000"
                      className="w-full px-3 py-2 bg-white dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono-num focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                )}

                {/* 4. Compact Installment Section */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className={brandAccentText} />
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
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
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-lime-500 dark:peer-checked:bg-[#D4F826]"></div>
                    </label>
                  </div>

                  {formIsInstallment && (
                    <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-white/10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Tenor */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            Tenor / Durasi (Bulan)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="240"
                              value={formTenorMonths}
                              onChange={(e) => handleTenorChange(e.target.value)}
                              placeholder="6"
                              className="w-full px-3 py-2 pr-12 bg-white dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono-num focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
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
                                    : 'bg-white dark:bg-[#181B29] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                                }`}
                              >
                                {t}x
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tanggal Jatuh Tempo Bulanan */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
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
                              className="w-full px-3 py-2 pr-16 bg-white dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono-num focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
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
                                    : 'bg-white dark:bg-[#181B29] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
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
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            Cicilan per Bulan (Rp)
                          </label>
                          {parseNominalInput(formTotalAmount) > 0 &&
                            parseInt(formTenorMonths, 10) > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const tot = parseNominalInput(formTotalAmount);
                                  const t = parseInt(formTenorMonths, 10);
                                  setFormMonthlyInstallment(
                                    formatNominalInput(String(Math.round(tot / t)))
                                  );
                                }}
                                className={`text-[10px] font-bold ${brandAccentText} hover:underline cursor-pointer flex items-center gap-1`}
                              >
                                <Sparkles size={10} />
                                <span>
                                  Bagi Rata (
                                  {formatRupiah(
                                    Math.round(
                                      parseNominalInput(formTotalAmount) /
                                        parseInt(formTenorMonths, 10)
                                    )
                                  )}
                                  )
                                </span>
                              </button>
                            )}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formMonthlyInstallment}
                          onChange={(e) =>
                            setFormMonthlyInstallment(formatNominalInput(e.target.value))
                          }
                          placeholder="Contoh: 500.000"
                          className="w-full px-3 py-2 bg-white dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono-num focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                        />
                        {parseNominalInput(formMonthlyInstallment) > 0 &&
                          parseInt(formTenorMonths, 10) > 0 && (
                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 px-0.5 font-mono-num">
                              <span>
                                {formatRupiah(parseNominalInput(formMonthlyInstallment))} ×{' '}
                                {formTenorMonths} bln
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                Total:{' '}
                                {formatRupiah(
                                  parseNominalInput(formMonthlyInstallment) *
                                    parseInt(formTenorMonths, 10)
                                )}
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
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Tanggal Mulai / Pinjam
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
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
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                </div>

                {/* 6. Jadwal Mulai Pembayaran di Budget */}
                {formType === 'payable' && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                        Jadwal Tagihan di Menu Budget
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Pos Tagihan Fixed
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormStartBillingMode('current_period')}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          formStartBillingMode === 'current_period'
                            ? 'border-lime-500 dark:border-[#D4F826] bg-lime-500/10 dark:bg-[#D4F826]/10 text-slate-900 dark:text-white font-black'
                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#181B29] text-slate-500 dark:text-slate-400'
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
                              formStartDate || formatIsoDateLocal(new Date()),
                              1,
                              parseInt(formDueDayOfMonth, 10) || 10
                            );
                            if (nextDue) setFormDueDate(nextDue);
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          formStartBillingMode === 'next_period'
                            ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-black'
                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#181B29] text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <span>Mulai Bulan Depan</span>
                        {formStartBillingMode === 'next_period' && (
                          <Check size={13} className="text-amber-500" />
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                      {formStartBillingMode === 'next_period'
                        ? `⏳ Tidak memotong Pos Tagihan Fixed bulan ini (aktif mulai ${budgetPeriod.nextPaydayIso}).`
                        : '⚡ Langsung masuk Pos Tagihan Bulanan (Fixed) pada periode budget saat ini.'}
                    </p>
                  </div>
                )}

                {/* 7. Cashflow Sync Option (Only on new additions) */}
                {!editingDebt && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formDisburseCashflow}
                        onChange={(e) => setFormDisburseCashflow(e.target.checked)}
                        className="rounded text-lime-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formType === 'payable'
                          ? 'Catat pencairan dana pinjaman masuk ke saldo dompet?'
                          : 'Potong dana pinjaman keluar dari saldo dompet sekarang?'}
                      </span>
                    </label>

                    {formDisburseCashflow && (
                      <div className="pl-5 space-y-1.5">
                        <select
                          value={formDisburseWalletId}
                          onChange={(e) => setFormDisburseWalletId(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        >
                          {(liquidWallets.length > 0 ? liquidWallets : walletsWithBalance).map(
                            (w) => (
                              <option key={w.id} value={w.id}>
                                {w.name} ({formatRupiah(w.balance, hide)})
                              </option>
                            )
                          )}
                        </select>
                        {(() => {
                          const selectedW = walletsWithBalance.find(
                            (w) => w.id === formDisburseWalletId
                          );
                          const totalVal = parseNominalInput(formTotalAmount);
                          if (
                            formType === 'receivable' &&
                            selectedW &&
                            totalVal > selectedW.balance
                          ) {
                            return (
                              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-400 dark:border-red-700 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-1.5">
                                <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold">
                                    Saldo {selectedW.name} kurang!
                                  </span>{' '}
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
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Contoh: Bunga 0%, kontrak #12345"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
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

      {/* Modal: Installment Payment / Full Settlement */}
      <AnimatePresence>
        {payingDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#11131E] rounded-[28px] p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200/80 dark:border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    {isFullSettlementMode
                      ? 'Konfirmasi Pelunasan Penuh'
                      : payingDebt.type === 'payable'
                      ? 'Bayar Cicilan / Utang'
                      : 'Terima Pembayaran Piutang'}
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-[260px]">
                    {payingDebt.name} ({payingDebt.contactName})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPayingDebt(null);
                    setIsFullSettlementMode(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Debt Summary Pill */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Sisa Kewajiban Saat Ini:</span>
                  <span className="font-mono-num font-extrabold text-rose-500">
                    {formatRupiah(payingDebt.remainingAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Total Pinjaman Pokok:</span>
                  <span className="font-mono-num font-bold text-slate-700 dark:text-slate-300">
                    {formatRupiah(payingDebt.totalAmount)}
                  </span>
                </div>
                {(payingDebt.monthlyInstallment || payingDebt.dueDayOfMonth) && (
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-white/10">
                    <span>Cicilan Rutin:</span>
                    <span className="font-mono-num font-extrabold text-lime-700 dark:text-[#D4F826]">
                      {payingDebt.monthlyInstallment
                        ? `${formatRupiah(payingDebt.monthlyInstallment)}/bln`
                        : ''}
                      {payingDebt.dueDayOfMonth ? ` (Tiap tgl ${payingDebt.dueDayOfMonth})` : ''}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmitPay} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Nominal Pembayaran (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payAmount}
                    onChange={(e) => setPayAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 500.000"
                    required
                    className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-extrabold font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {payingDebt.monthlyInstallment &&
                      payingDebt.monthlyInstallment > 0 &&
                      payingDebt.remainingAmount > payingDebt.monthlyInstallment && (
                        <button
                          type="button"
                          onClick={() =>
                            setPayAmount(formatNominalInput(String(payingDebt.monthlyInstallment)))
                          }
                          className="text-[11px] font-bold text-lime-700 dark:text-[#D4F826] bg-lime-500/10 dark:bg-[#D4F826]/10 px-2.5 py-1 rounded-xl hover:underline cursor-pointer"
                        >
                          1x Cicilan ({formatRupiah(payingDebt.monthlyInstallment)})
                        </button>
                      )}
                    {payingDebt.monthlyInstallment &&
                      payingDebt.monthlyInstallment > 0 &&
                      payingDebt.remainingAmount >= payingDebt.monthlyInstallment * 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setPayAmount(
                              formatNominalInput(String(payingDebt.monthlyInstallment! * 2))
                            )
                          }
                          className="text-[11px] font-bold text-lime-700 dark:text-[#D4F826] bg-lime-500/10 dark:bg-[#D4F826]/10 px-2.5 py-1 rounded-xl hover:underline cursor-pointer"
                        >
                          2x Cicilan ({formatRupiah(payingDebt.monthlyInstallment * 2)})
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={() =>
                        setPayAmount(formatNominalInput(String(payingDebt.remainingAmount)))
                      }
                      className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.08] px-2.5 py-1 rounded-xl hover:underline cursor-pointer"
                    >
                      Lunasi Sisa ({formatRupiah(payingDebt.remainingAmount)})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    {payingDebt.type === 'payable'
                      ? 'Bayar dari Dompet / Rekening:'
                      : 'Terima ke Dompet / Rekening:'}
                  </label>
                  <select
                    value={payWalletId}
                    onChange={(e) => setPayWalletId(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
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
                            <span className="font-extrabold">
                              Saldo {selectedW.name} Tidak Cukup!
                            </span>{' '}
                            Tersedia {formatRupiah(selectedW.balance, hide)}, kurang{' '}
                            <strong>{formatRupiah(amt - selectedW.balance, hide)}</strong>. Pilih dompet lain atau pilih &ldquo;Tanpa Potong Dompet&rdquo;.
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Tanggal Bayar
                    </label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Catatan
                    </label>
                    <input
                      type="text"
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                      placeholder="Contoh: Cicilan ke-1"
                      className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPayingDebt(null);
                      setIsFullSettlementMode(false);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 rounded-2xl ${brandAccentBg} text-xs font-black shadow-xs cursor-pointer`}
                  >
                    Konfirmasi Pembayaran
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
              className="bg-white dark:bg-[#11131E] rounded-[28px] p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200/80 dark:border-white/10 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    Riwayat Pembayaran
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-[260px]">
                    {activeDetailDebt.name} ({activeDetailDebt.contactName})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailDebt(null)}
                  className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Header */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Total Pinjaman Pokok:</span>
                  <span className="font-mono-num font-extrabold text-slate-900 dark:text-white">
                    {formatRupiah(activeDetailDebt.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Sisa Belum Dibayar:</span>
                  <span
                    className={`font-mono-num font-black ${
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
                    <span className="text-slate-500">Cicilan Bulanan:</span>
                    <span className="font-mono-num font-bold text-lime-700 dark:text-[#D4F826]">
                      {formatRupiah(activeDetailDebt.monthlyInstallment)} / bulan
                    </span>
                  </div>
                )}
                {activeDetailDebt.tenorMonths && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Tempo / Tenor:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {activeDetailDebt.tenorMonths} Bulan
                    </span>
                  </div>
                )}
                {activeDetailDebt.dueDayOfMonth && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Jatuh Tempo Bulanan:</span>
                    <span className="font-bold text-lime-700 dark:text-[#D4F826]">
                      Setiap tanggal {activeDetailDebt.dueDayOfMonth}
                    </span>
                  </div>
                )}
                {activeDetailDebt.dueDate && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Target Pelunasan Akhir:</span>
                    <span className="font-mono-num font-bold text-slate-700 dark:text-slate-300">
                      {activeDetailDebt.dueDate}
                    </span>
                  </div>
                )}
              </div>

              {/* Payments List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Daftar Angsuran Terbayar ({activeDetailDebt.payments?.length || 0})
                  </h4>
                  {activeDetailDebt.payments && activeDetailDebt.payments.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      Klik Batal untuk membatalkan
                    </span>
                  )}
                </div>

                {!activeDetailDebt.payments || activeDetailDebt.payments.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 dark:bg-white/[0.03] rounded-2xl text-xs text-slate-400 space-y-2.5">
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
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {p.note || `Cicilan #${idx + 1}`}
                            </div>
                            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                              <span>{p.date}</span>
                              {p.walletName && (
                                <span className="inline-flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
                                  <WalletIcon size={11} /> {p.walletName}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="font-mono-num text-sm font-black text-emerald-600 dark:text-emerald-400">
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
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed pt-1">
                      💡 Membatalkan pembayaran akan otomatis mengembalikan sisa kewajiban utang dan mengembalikan saldo dompet yang terpotong.
                    </p>
                  </>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setDetailDebt(null)}
                  className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-white/[0.08] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
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
