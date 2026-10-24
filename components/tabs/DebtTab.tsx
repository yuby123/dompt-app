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

  // Auto-reset delete confirmation after 4 seconds
  React.useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = setTimeout(() => setConfirmDeleteId(null), 4000);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  // Check how much of a debt was paid in the active budget period
  const getDebtPaidInCurrentPeriod = React.useCallback(
    (item: Debt): number => {
      return (item.payments || []).reduce((sum, p) => {
        const pd = parseLocalMidnight(p.date);
        if (!pd) return sum;
        if (isDateInBudgetPeriod(pd, budgetPeriod)) {
          return sum + (Number(p.amount) || 0);
        }
        return sum;
      }, 0);
    },
    [budgetPeriod]
  );

  // Compute period target based on balance at the start of the active period (so partial payments don't shrink the target)
  const getDebtCycleTargetInfo = React.useCallback(
    (item: Debt) => {
      const paidAmountThisCycle = getDebtPaidInCurrentPeriod(item);
      const remNow = Math.max(0, Number(item.remainingAmount) || 0);
      const remAtPeriodStart = Math.max(0, remNow + paidAmountThisCycle);
      const targetMonthly =
        remAtPeriodStart > 0
          ? getMonthlyDebtInstallmentAmount({
              ...item,
              remainingAmount: remAtPeriodStart,
              status: 'active',
            })
          : 0;
      const isPaidOverall = item.status === 'paid' || remNow <= 0;
      const paidThisCycle =
        isPaidOverall ||
        (paidAmountThisCycle > 0 &&
          (targetMonthly > 0 ? paidAmountThisCycle >= targetMonthly : true));
      const remainingThisCycle = isPaidOverall
        ? 0
        : Math.max(0, Math.min(remNow, targetMonthly - paidAmountThisCycle));

      return {
        paidAmountThisCycle,
        targetMonthly,
        paidThisCycle,
        remainingThisCycle,
      };
    },
    [getDebtPaidInCurrentPeriod]
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

      const { paidThisCycle } = getDebtCycleTargetInfo(item);

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

        // Find the occurrence of dueDayOfMonth that falls within the active budget period
        const periodStartCand = getClampedMonthDate(
          budgetPeriod.startDate.getFullYear(),
          budgetPeriod.startDate.getMonth(),
          day
        );
        const periodEndCand = getClampedMonthDate(
          budgetPeriod.endDate.getFullYear(),
          budgetPeriod.endDate.getMonth(),
          day
        );
        const thisMonthCandidate = getClampedMonthDate(now.getFullYear(), now.getMonth(), day);

        let cycleCandidate = thisMonthCandidate;
        if (isDateInBudgetPeriod(periodStartCand, budgetPeriod)) {
          cycleCandidate = periodStartCand;
        } else if (isDateInBudgetPeriod(periodEndCand, budgetPeriod)) {
          cycleCandidate = periodEndCand;
        }

        let candidate = !paidThisCycle
          ? cycleCandidate
          : getClampedMonthDate(cycleCandidate.getFullYear(), cycleCandidate.getMonth() + 1, day);

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
    [budgetPeriod, getDebtCycleTargetInfo]
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

  // Per-debt monthly obligation for the active budget period (prevents cross-debt overpayment bleed)
  const monthlyObligationStats = useMemo(() => {
    let totalDueThisPeriod = 0;
    let totalPaidThisPeriod = 0;
    let remainingDueThisPeriod = 0;

    for (const d of debts.filter((item) => item.type === 'payable')) {
      const { paidAmountThisCycle, targetMonthly, remainingThisCycle } = getDebtCycleTargetInfo(d);
      totalPaidThisPeriod += paidAmountThisCycle;

      const isScheduled = isDebtScheduledForBudgetPeriod(d, budgetPeriod);
      if (!isScheduled) {
        totalDueThisPeriod += paidAmountThisCycle;
        continue;
      }

      totalDueThisPeriod += Math.max(targetMonthly, paidAmountThisCycle);
      remainingDueThisPeriod += remainingThisCycle;
    }

    return {
      totalDueThisPeriod,
      totalPaidThisPeriod,
      remainingDueThisPeriod,
    };
  }, [debts, budgetPeriod, getDebtCycleTargetInfo]);

  // Liquid assets from positive wallets
  const liquidAssets = useMemo(() => {
    return liquidWallets
      .filter((w) => w.balance > 0)
      .reduce((acc, w) => acc + w.balance, 0);
  }, [liquidWallets]);

  // Monthly Debt Burden vs Liquid Cash Ratio
  const monthlyBurdenPct =
    monthlyObligationStats.remainingDueThisPeriod <= 0
      ? 0
      : liquidAssets > 0
      ? Math.round((monthlyObligationStats.remainingDueThisPeriod / liquidAssets) * 100)
      : 100;

  // Closest upcoming due date across scheduled active payables that haven't been paid this cycle
  const nextDueItem = useMemo(() => {
    const listWithDue = activePayables
      .filter((d) => isDebtScheduledForBudgetPeriod(d, budgetPeriod))
      .map((d) => {
        const info = getEffectiveDueInfo(d);
        const cycleInfo = getDebtCycleTargetInfo(d);
        return {
          ...d,
          effectiveDueDate: info.effectiveDueDate,
          daysLeft: info.daysLeft,
          time: info.sortTime,
          paidThisCycle: info.paidThisCycle,
          remainingThisCycle: cycleInfo.remainingThisCycle,
        };
      })
      .filter((d) => d.effectiveDueDate && !d.paidThisCycle)
      .sort((a, b) => a.time - b.time);
    return listWithDue[0] || null;
  }, [activePayables, budgetPeriod, getEffectiveDueInfo, getDebtCycleTargetInfo]);

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
    const autoDue = computeInstallmentDueDate(today, type === 'payable' ? 6 : 1, 10);
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

    const { remainingThisCycle, targetMonthly } = getDebtCycleTargetInfo(debt);
    const defaultAmount = fullSettlement
      ? debt.remainingAmount
      : remainingThisCycle > 0
      ? remainingThisCycle
      : targetMonthly > 0
      ? Math.min(targetMonthly, debt.remainingAmount)
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
        ? `Pelunasan ${debt.name}`
        : debt.type === 'payable'
        ? debt.isInstallment || debt.tenorMonths
          ? `Cicilan ke-${nextInstallmentNum} ${debt.name}`
          : `Bayar ${debt.name}`
        : `Terima ${debt.name}`
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
            <span>Utang & Piutang</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
              {debts.length}
            </span>
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola cicilan & piutang aktif.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => handleOpenAdd('payable')}
            className={`h-10 px-4 rounded-full ${brandAccentBg} flex items-center justify-center gap-1.5 font-black text-xs shadow-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap`}
          >
            <Plus size={15} strokeWidth={2.8} className="shrink-0" />
            <span>Utang</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAdd('receivable')}
            className="h-10 px-4 rounded-full bg-white dark:bg-[#16181D] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 font-extrabold text-xs cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
          >
            <ArrowDownLeft size={15} className="shrink-0 text-emerald-500" />
            <span>Piutang</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-[28px] lg:rounded-[32px] p-5 sm:p-6 text-white shadow-xl border border-white/10 relative overflow-hidden">
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
          <div className="lg:col-span-8 flex flex-col justify-between space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-[#D4F826] uppercase tracking-widest">
                  RINGKASAN
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-200 text-[10px] font-bold">
                  {activePayables.length === 0
                    ? 'Bebas Utang'
                    : `${activePayables.length} Utang Aktif`}
                </span>
              </div>
              {totalPayableOriginal > 0 && (
                <span className="text-[11px] font-semibold text-slate-300">
                  Terbayar <strong className="text-[#D4F826]">{overallPaidPct}%</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Sisa Utang */}
              <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400">
                  <TrendingDown size={13} />
                  <span>Sisa Utang</span>
                </div>
                <div className="font-mono-num text-lg sm:text-xl font-extrabold tracking-tight text-white truncate">
                  {formatRupiah(totalPayableRemaining, hide)}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {activePayables.length > 0
                    ? `Pokok ${formatRupiah(totalPayableOriginal, hide)}`
                    : 'Bebas utang'}
                </div>
              </div>

              {/* 2. Tagihan Periode Ini */}
              <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D4F826]">
                    <CalendarDays size={13} />
                    <span>Tagihan Periode Ini</span>
                  </div>
                  {monthlyObligationStats.totalDueThisPeriod > 0 &&
                    monthlyObligationStats.remainingDueThisPeriod === 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        LUNAS
                      </span>
                    )}
                </div>
                <div className="font-mono-num text-lg sm:text-xl font-extrabold tracking-tight text-[#D4F826] truncate">
                  {formatRupiah(monthlyObligationStats.remainingDueThisPeriod, hide)}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {monthlyObligationStats.totalPaidThisPeriod > 0
                    ? `Terbayar ${formatRupiah(monthlyObligationStats.totalPaidThisPeriod, hide)}`
                    : monthlyObligationStats.totalDueThisPeriod > 0
                    ? `Target ${formatRupiah(monthlyObligationStats.totalDueThisPeriod, hide)}`
                    : 'Tidak ada tagihan'}
                </div>
              </div>

              {/* 3. Piutang */}
              <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                  <TrendingUp size={13} />
                  <span>Piutang</span>
                </div>
                <div className="font-mono-num text-lg sm:text-xl font-extrabold tracking-tight text-emerald-300 truncate">
                  {formatRupiah(totalReceivableRemaining, hide)}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {activeReceivables.length > 0
                    ? `${activeReceivables.length} piutang aktif`
                    : 'Tidak ada piutang'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Health & Next Due */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-6">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  RASIO KAS
                </span>
                <span
                  className={`font-mono-num text-lg font-black block ${
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
                  Kas {formatRupiah(liquidAssets, hide)}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  STATUS
                </span>
                <span className="text-sm sm:text-base font-extrabold text-white block mt-0.5">
                  {totalPayableRemaining === 0
                    ? 'Bebas Utang'
                    : monthlyBurdenPct <= 30
                    ? 'Aman'
                    : 'Waspada'}
                </span>
                <p className="text-[10px] text-slate-400 truncate">
                  {monthlyBurdenPct <= 30 ? 'Rasio sehat' : 'Prioritaskan bayar'}
                </p>
              </div>
            </div>

            {/* Next Due Notification Banner */}
            {nextDueItem ? (
              <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#D4F826]/15 border border-[#D4F826]/30 flex items-center justify-center shrink-0">
                    <Clock size={14} className="text-[#D4F826]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-white truncate">
                      {nextDueItem.name}
                    </p>
                    <p className="text-[11px] text-slate-300 truncate font-mono-num">
                      {nextDueItem.dueDayOfMonth
                        ? `Tgl ${nextDueItem.dueDayOfMonth}`
                        : nextDueItem.effectiveDueDate}{' '}
                      · {formatRupiah(nextDueItem.remainingThisCycle, hide)}
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
                          ? 'bg-rose-500 text-white'
                          : days <= 3
                          ? 'bg-amber-400 text-black'
                          : 'bg-white/15 text-slate-100'
                      }`}
                    >
                      {isLate
                        ? `Telat ${Math.abs(days)}h`
                        : days === 0
                        ? 'Hari ini'
                        : `${days}h lagi`}
                    </span>
                  );
                })()}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <p className="text-xs font-semibold text-emerald-200 truncate">
                  {activePayables.length === 0
                    ? 'Tidak ada tagihan aktif.'
                    : 'Cicilan periode ini lunas.'}
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTypeFilter === 'payable'
                ? `${brandAccentBg} shadow-xs font-black`
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <TrendingDown size={13} className="text-rose-500" />
            <span>Utang ({debts.filter((d) => d.type === 'payable').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeFilter('receivable')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTypeFilter === 'receivable'
                ? `${brandAccentBg} shadow-xs font-black`
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={13} className="text-emerald-500" />
            <span>Piutang ({debts.filter((d) => d.type === 'receivable').length})</span>
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
              Aktif
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

          <div className="relative min-w-[120px] sm:min-w-[170px] flex-1 sm:flex-initial">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari..."
              className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D4F826]"
            />
          </div>
        </div>
      </div>

      {/* Debts List (Sorted by Nearest Due Date) */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-[#11131E] rounded-[28px] p-6 border border-slate-200/80 dark:border-white/[0.08] space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 size={22} />
            </div>
            <p className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
              Belum ada catatan
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {activeStatusFilter === 'active'
                ? 'Semua tagihan telah lunas.'
                : 'Tidak ada data yang cocok.'}
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAdd('payable')}
                className={`px-3.5 py-2 rounded-xl ${brandAccentBg} text-xs font-black cursor-pointer shadow-xs`}
              >
                + Utang
              </button>
              <button
                type="button"
                onClick={() => handleOpenAdd('receivable')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                + Piutang
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
                className="relative overflow-hidden bg-white dark:bg-[#11131E] rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.08] hover:border-indigo-500/40 transition-all space-y-3 shadow-2xs"
              >
                {/* Top Brand / Status Strip */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: topBarColor }}
                />

                {/* Row 1: Header */}
                <div className="flex items-start justify-between gap-3 pt-0.5">
                  <div className="flex items-start gap-3 min-w-0">
                    {matchedBrand ? (
                      <WalletBrandLogo brandId={matchedBrand.id} size="md" />
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
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
                          {isPayable ? 'UTANG' : 'PIUTANG'}
                        </span>

                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500 text-black">
                            <CheckCircle2 size={10} strokeWidth={3} />
                            <span>Lunas</span>
                          </span>
                        ) : paidThisCycle ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 size={10} />
                            <span>Lunas Periode Ini</span>
                          </span>
                        ) : isDeferredNextMonth ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                            <Clock size={10} />
                            <span>Periode Depan</span>
                          </span>
                        ) : isLate ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500 text-white">
                            <AlertCircle size={10} />
                            <span>Telat {Math.abs(daysLeft)}h</span>
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
                            <span>{daysLeft === 0 ? 'Hari Ini' : `${daysLeft}h lagi`}</span>
                          </span>
                        ) : null}
                      </div>

                      <h3 className="font-display text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Building2 size={11} className="text-slate-400" />
                          {item.contactName || (isPayable ? 'Lembaga' : 'Peminjam')}
                        </span>
                        <span>·</span>
                        <span>
                          {CATEGORY_LABELS[item.category || 'cicilan'] || item.category || 'Cicilan'}
                        </span>
                        {item.note && (
                          <>
                            <span>·</span>
                            <span className="italic text-slate-400 truncate max-w-[160px] sm:max-w-[240px]">
                              {item.note}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Remaining Amount */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {isPaid ? 'STATUS' : 'SISA'}
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
                      {isPaid ? 'Lunas' : formatRupiah(item.remainingAmount, hide)}
                    </div>
                    <div className="font-mono-num text-[11px] font-medium text-slate-400">
                      Pokok {formatRupiah(item.totalAmount, hide)}
                    </div>
                  </div>
                </div>

                {/* Row 2: Unified Metrics Strip + Progress Bar */}
                <div className="rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] p-3 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">
                        Cicilan / Bln
                      </span>
                      <span className="font-mono-num font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                        {monthlyAmt > 0 ? formatRupiah(monthlyAmt, hide) : 'Sekali Bayar'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">
                        Jatuh Tempo
                      </span>
                      <span className={`font-mono-num font-extrabold ${brandAccentText} mt-0.5 block`}>
                        {item.dueDayOfMonth
                          ? `Tgl ${item.dueDayOfMonth}`
                          : item.dueDate || '-'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">
                        Tenor
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 mt-0.5 block">
                        {item.tenorMonths ? `${item.tenorMonths} bln` : 'Non-cicilan'}
                        {remainingInstallments > 0 ? ` · Sisa ${remainingInstallments}x` : ''}
                      </span>
                    </div>

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
                  <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
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
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
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
                        title="Batalkan pembayaran terakhir"
                      >
                        <RotateCcw size={12} />
                        <span>Batal</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit2 size={13} />
                      <span className="hidden sm:inline">Edit</span>
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
                    >
                      <Trash2 size={13} />
                      {confirmDeleteId === item.id && <span>Hapus?</span>}
                    </button>
                  </div>

                  {!isPaid && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenPay(item, false)}
                        className={`px-3.5 py-1.5 rounded-xl ${brandAccentBg} text-xs font-black shadow-xs cursor-pointer transition-transform active:scale-95 flex items-center gap-1`}
                      >
                        <DollarSign size={13} />
                        <span>{isPayable ? 'Bayar' : 'Terima'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPay(item, true)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
                      >
                        Lunasi
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
                    {editingDebt ? 'Edit Catatan' : 'Tambah Catatan'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sinkron otomatis ke Budget & Dompet.
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
                    <span>Utang</span>
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
                    <span>Piutang</span>
                  </button>
                </div>

                {/* 2. Name & Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Nama *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={
                        formType === 'payable'
                          ? 'Cicilan iPhone, SPayLater'
                          : 'Pinjaman Budi'
                      }
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      {formType === 'payable' ? 'Pihak / Lembaga' : 'Peminjam'}
                    </label>
                    <input
                      type="text"
                      value={formContactName}
                      onChange={(e) => setFormContactName(e.target.value)}
                      placeholder={
                        formType === 'payable'
                          ? 'BCA, Mandiri, ShopeePay'
                          : 'Ahmad, Teman'
                      }
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                </div>

                {/* 3. Total Amount & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Total Pokok (Rp) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formTotalAmount}
                      onChange={(e) => handleTotalAmountChange(e.target.value)}
                      placeholder="3.000.000"
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
                      <option value="bank">Pinjaman Bank</option>
                      <option value="personal">Personal / Teman</option>
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
                        Sisa Saat Ini (Rp)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormRemainingAmount(formTotalAmount)}
                        className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw size={11} />
                        <span>Reset</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formRemainingAmount}
                      onChange={(e) => setFormRemainingAmount(formatNominalInput(e.target.value))}
                      placeholder="1.500.000"
                      className="w-full px-3 py-2 bg-white dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono-num focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                  </div>
                )}

                {/* 4. Compact Installment Section */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={15} className={brandAccentText} />
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Cicilan Bulanan
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={formIsInstallment}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormIsInstallment(checked);
                          const dNum = parseInt(formDueDayOfMonth, 10) || 10;
                          if (checked) {
                            const tNum = parseInt(formTenorMonths, 10) || 6;
                            const tot = parseNominalInput(formTotalAmount);
                            if (tot > 0 && (!formMonthlyInstallment || formMonthlyInstallment === '0')) {
                              setFormMonthlyInstallment(formatNominalInput(String(Math.round(tot / tNum))));
                            }
                            const calcDue = computeInstallmentDueDate(formStartDate, tNum, dNum);
                            if (calcDue) setFormDueDate(calcDue);
                          } else {
                            // Reset due date to 1 month ahead so lump-sum doesn't keep multi-month tenor date
                            const singleDue = computeInstallmentDueDate(formStartDate, 1, dNum);
                            if (singleDue) setFormDueDate(singleDue);
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
                            Tenor (Bulan)
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
                            Tgl Jatuh Tempo
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
                            Cicilan / Bln (Rp)
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
                          placeholder="500.000"
                          className="w-full px-3 py-2 bg-white dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono-num focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Dates: Start & Target Lunas */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Tgl Mulai
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
                          {formTenorMonths} bln
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
                        Jadwal Tagihan Budget
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
                        <span>Periode Ini</span>
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
                        <span>Periode Depan</span>
                        {formStartBillingMode === 'next_period' && (
                          <Check size={13} className="text-amber-500" />
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {formStartBillingMode === 'next_period'
                        ? `Aktif mulai ${budgetPeriod.nextPaydayIso}.`
                        : 'Masuk Pos Tagihan periode ini.'}
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
                          ? 'Cairkan dana ke dompet'
                          : 'Potong dana dari dompet'}
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
                              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-400 dark:border-red-700 text-[11px] text-red-700 dark:text-red-300 flex items-center gap-1.5">
                                <AlertCircle size={13} className="text-red-500 shrink-0" />
                                <span className="font-bold">
                                  Saldo {selectedW.name} kurang ({formatRupiah(selectedW.balance, hide)}).
                                </span>
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
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Bunga 0%, kontrak #123"
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
                    Simpan
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
              className="bg-white dark:bg-[#11131E] rounded-[28px] p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200/80 dark:border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    {isFullSettlementMode
                      ? 'Pelunasan Penuh'
                      : payingDebt.type === 'payable'
                      ? 'Bayar Tagihan'
                      : 'Terima Piutang'}
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-[260px]">
                    {payingDebt.name} · {payingDebt.contactName}
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
                  <span>Sisa Tagihan</span>
                  <span className="font-mono-num font-extrabold text-rose-500">
                    {formatRupiah(payingDebt.remainingAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Pokok</span>
                  <span className="font-mono-num font-bold text-slate-700 dark:text-slate-300">
                    {formatRupiah(payingDebt.totalAmount)}
                  </span>
                </div>
                {(payingDebt.monthlyInstallment || payingDebt.dueDayOfMonth) && (
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-white/10">
                    <span>Cicilan</span>
                    <span className="font-mono-num font-extrabold text-lime-700 dark:text-[#D4F826]">
                      {payingDebt.monthlyInstallment
                        ? `${formatRupiah(payingDebt.monthlyInstallment)}/bln`
                        : ''}
                      {payingDebt.dueDayOfMonth ? ` (Tgl ${payingDebt.dueDayOfMonth})` : ''}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmitPay} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payAmount}
                    onChange={(e) => setPayAmount(formatNominalInput(e.target.value))}
                    placeholder="500.000"
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
                          1x ({formatRupiah(payingDebt.monthlyInstallment)})
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
                          2x ({formatRupiah(payingDebt.monthlyInstallment * 2)})
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={() =>
                        setPayAmount(formatNominalInput(String(payingDebt.remainingAmount)))
                      }
                      className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.08] px-2.5 py-1 rounded-xl hover:underline cursor-pointer"
                    >
                      Lunasi ({formatRupiah(payingDebt.remainingAmount)})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    {payingDebt.type === 'payable' ? 'Dompet Sumber' : 'Dompet Tujuan'}
                  </label>
                  <select
                    value={payWalletId}
                    onChange={(e) => setPayWalletId(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-[#181B29] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  >
                    <option value="">-- Tanpa Dompet (Catat Saja) --</option>
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
                        <div className="mt-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-400 dark:border-red-700 text-[11px] text-red-700 dark:text-red-300 flex items-center gap-2">
                          <AlertCircle size={14} className="text-red-500 shrink-0" />
                          <span>
                            Saldo <strong>{selectedW.name}</strong> kurang{' '}
                            <strong>{formatRupiah(amt - selectedW.balance, hide)}</strong>.
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Tanggal
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
                      placeholder="Cicilan ke-1"
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
              className="bg-white dark:bg-[#11131E] rounded-[28px] p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200/80 dark:border-white/10 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    Riwayat Pembayaran
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-[260px]">
                    {activeDetailDebt.name} · {activeDetailDebt.contactName}
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
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Pokok</span>
                  <span className="font-mono-num font-extrabold text-slate-900 dark:text-white">
                    {formatRupiah(activeDetailDebt.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Sisa</span>
                  <span
                    className={`font-mono-num font-black ${
                      activeDetailDebt.remainingAmount <= 0
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {activeDetailDebt.remainingAmount <= 0
                      ? 'Lunas'
                      : formatRupiah(activeDetailDebt.remainingAmount)}
                  </span>
                </div>
                {activeDetailDebt.monthlyInstallment && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Cicilan</span>
                    <span className="font-mono-num font-bold text-lime-700 dark:text-[#D4F826]">
                      {formatRupiah(activeDetailDebt.monthlyInstallment)} / bln
                    </span>
                  </div>
                )}
                {activeDetailDebt.dueDayOfMonth && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Jatuh Tempo</span>
                    <span className="font-bold text-lime-700 dark:text-[#D4F826]">
                      Tiap tgl {activeDetailDebt.dueDayOfMonth}
                    </span>
                  </div>
                )}
                {activeDetailDebt.dueDate && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Target Lunas</span>
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
                    Riwayat ({activeDetailDebt.payments?.length || 0})
                  </h4>
                </div>

                {!activeDetailDebt.payments || activeDetailDebt.payments.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 dark:bg-white/[0.03] rounded-2xl text-xs text-slate-400 space-y-2.5">
                    <p>Belum ada riwayat pembayaran.</p>
                    {(activeDetailDebt.remainingAmount < activeDetailDebt.totalAmount ||
                      activeDetailDebt.status === 'paid') && (
                      <button
                        type="button"
                        onClick={() => cancelDebtPayment(activeDetailDebt.id)}
                        className="mx-auto px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        <span>Kembalikan Sisa Tagihan</span>
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
                            >
                              <RotateCcw size={12} />
                              <span>Batal</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
                      Batal akan mengembalikan sisa tagihan & saldo dompet.
                    </p>
                  </>
                )}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setDetailDebt(null)}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.08] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
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
