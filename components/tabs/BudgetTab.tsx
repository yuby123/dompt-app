'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Pencil,
  Plus,
  MoreVertical,
  X,
  SlidersHorizontal,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  AlertTriangle,
  Calendar,
  CalendarClock,
  Trash2,
  Smile,
  ArrowUpRight,
  Calculator,
  Clock,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { EmojiPickerModal } from '../EmojiPickerModal';
import { formatRupiah, formatNominalInput, parseNominalInput } from '@/lib/formatters';
import {
  BudgetGroup,
  BudgetSubcategory,
  Category,
  DailyDeficitMode,
  DailySurplusMode,
} from '@/lib/types';
import {
  FIXED_CATEGORY_IDS,
  FIXED_EXPENSE_KEYWORDS_REGEX,
  getBudgetPeriodInfo,
  getMonthlyDebtInstallmentAmount,
  isDateInBudgetPeriod,
  isDebtOrInstallmentSubcategory,
  isDebtScheduledForBudgetPeriod,
  isGrocerySubcategory,
  isSavingsExpense,
  matchTransactionToSubcategory,
  parseLocalDay,
  resolveEffectivePeriodIncome,
} from '@/lib/budgetUtils';

export function BudgetTab() {
  const {
    budgetConfig,
    dashboardSummary,
    subscriptions,
    debts,
    updateDebt,
    setActiveTab,
    updateBudgetConfig,
    addBudgetSubcategory,
    deleteBudgetSubcategory,
    updateBudgetSubcategory,
    settings,
    updateSettings,
    addToast,
    transactions,
    categories,
    activeYear,
    activeMonth,
    setActiveDate,
    budgetPeriod,
    goToPrevPeriod,
    goToNextPeriod,
    goToCurrentPeriod,
    openAddTransaction,
  } = useApp();

  const hide = settings.hideBalance;

  // Dynamic Accent Color Classes (respects user theme preference: lime, pink, orange, plum)
  const accentChoice = settings.accentColor || 'lime';
  const isPink = accentChoice === 'pink';
  const isOrange = accentChoice === 'orange';
  const isPlum = accentChoice === 'plum';

  const accentBtn = isPlum
    ? 'bg-[#71325A] hover:bg-[#5E274A] text-white'
    : isOrange
    ? 'bg-[#FF6B00] hover:bg-[#ea5e00] text-white'
    : isPink
    ? 'bg-[#FFA4A4] hover:bg-[#ff8e8e] text-black'
    : 'bg-[#D4F826] hover:bg-[#c6ec15] text-black';

  const accentBg = isPlum
    ? 'bg-[#71325A] text-white'
    : isOrange
    ? 'bg-[#FF6B00] text-white'
    : isPink
    ? 'bg-[#FFA4A4] text-black'
    : 'bg-[#D4F826] text-black';

  const accentBorder = isPlum
    ? 'border-[#71325A]'
    : isOrange
    ? 'border-[#FF6B00]'
    : isPink
    ? 'border-[#FFA4A4]'
    : 'border-[#D4F826]';

  const accentFocusRing = isPlum
    ? 'focus:ring-[#71325A]'
    : isOrange
    ? 'focus:ring-[#FF6B00]'
    : isPink
    ? 'focus:ring-[#FFA4A4]'
    : 'focus:ring-[#D4F826]';

  // Helper for clean hidden balance formatting with prefixes/suffixes
  const fmtCurrency = (
    amount: number,
    options?: { prefix?: string; suffix?: string }
  ): string => {
    if (hide) return 'Rp •••••••';
    return `${options?.prefix || ''}${formatRupiah(amount, false)}${options?.suffix || ''}`;
  };

  // Modals state
  const [isEditIncomeOpen, setIsEditIncomeOpen] = useState(false);
  const [tempIncomeInput, setTempIncomeInput] = useState(String(budgetConfig.estimatedIncome));
  const [tempAutoSyncIncome, setTempAutoSyncIncome] = useState(
    Boolean(budgetConfig?.settings?.autoSyncIncome)
  );

  const [isEditPeriodOpen, setIsEditPeriodOpen] = useState(false);
  const [tempPaydayDay, setTempPaydayDay] = useState<number>(budgetPeriod.paydayDay || 1);
  const [tempCycleMode, setTempCycleMode] = useState<'auto' | 'thisMonthStart'>('auto');
  const [tempPeriodMode, setTempPeriodMode] = useState<'standard' | 'custom'>(
    budgetConfig.periodMode === 'custom' ? 'custom' : 'standard'
  );
  const [tempCustomStart, setTempCustomStart] = useState<string>(
    budgetConfig.customPeriodStart || budgetPeriod.startDateIso
  );
  const [tempCustomNext, setTempCustomNext] = useState<string>(
    budgetConfig.customNextPayday || budgetPeriod.nextPaydayIso
  );

  const [isEditPercentagesOpen, setIsEditPercentagesOpen] = useState(false);
  const [needsPercent, setNeedsPercent] = useState(budgetConfig.needsPercent);
  const [wantsPercent, setWantsPercent] = useState(budgetConfig.wantsPercent);
  const [savingsPercent, setSavingsPercent] = useState(budgetConfig.savingsPercent);

  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [targetGroup, setTargetGroup] = useState<BudgetGroup>('kebutuhan');
  const [newSubName, setNewSubName] = useState('');
  const [newSubAmount, setNewSubAmount] = useState('');
  const [newSubEmoji, setNewSubEmoji] = useState('📦');
  const [newSubDueDay, setNewSubDueDay] = useState('');
  const [newSubIsGrocery, setNewSubIsGrocery] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Simulasi Keperluan Pribadi Modal state
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [tempGroceryBudgetInput, setTempGroceryBudgetInput] = useState('0');
  const [tempEatOutBudgetInput, setTempEatOutBudgetInput] = useState('0');

  const [activeMenuSubId, setActiveMenuSubId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<BudgetGroup, boolean>>({
    kebutuhan: false,
    keinginan: false,
    tabungan: false,
  });
  const [showDebtSection, setShowDebtSection] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showFixedPos, setShowFixedPos] = useState(false);
  const [showVariablePos, setShowVariablePos] = useState(false);

  // Close 3-dots subcategory menu when clicking anywhere outside
  useEffect(() => {
    if (!activeMenuSubId) return;
    const handleOutsideClick = () => setActiveMenuSubId(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [activeMenuSubId]);

  const toggleGroupCollapse = (group: BudgetGroup) => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const quickEmojiSuggestions = useMemo(() => {
    if (targetGroup === 'kebutuhan') {
      return ['⚡', '📶', '🛒', '🍔', '🚗', '🛵', '⛽', '🏠', '💧', '💊', '🏥', '🧴', '🍞', '📦'];
    }
    if (targetGroup === 'keinginan') {
      return ['🎬', '🍿', '☕', '🎮', '🛍️', '👗', '👟', '🍕', '🎧', '📱', '💻', '✈️', '💄', '🍔'];
    }
    return ['💰', '🪙', '🏦', '📈', '🏅', '🎯', '💵', '🔒', '💎', '🏡', '🥇', '📊', '🧾', '🏧'];
  }, [targetGroup]);

  // Group limits (resolved accurately per active budget period)
  const { effectiveIncome: totalIncome, periodRecordedIncome } = useMemo(
    () => resolveEffectivePeriodIncome(budgetConfig, transactions, budgetPeriod),
    [budgetConfig, transactions, budgetPeriod]
  );
  const isAutoSyncIncome = Boolean(budgetConfig?.settings?.autoSyncIncome);
  const liquidWalletBalance = Math.max(0, dashboardSummary?.totalBalance || 0);

  const needsLimit = Math.round((totalIncome * budgetConfig.needsPercent) / 100);
  const wantsLimit = Math.round((totalIncome * budgetConfig.wantsPercent) / 100);
  const savingsLimit = Math.round((totalIncome * budgetConfig.savingsPercent) / 100);

  // Merge subcategories with payable debts & subscriptions scheduled for this budget period
  const effectiveSubcategories = useMemo<BudgetSubcategory[]>(() => {
    const payableDebtIds = new Set(
      (debts || []).filter((d) => d.type === 'payable').map((d) => d.id)
    );
    const expenseSubs = (subscriptions || []).filter((s) => s.type === 'expense');

    const base = (budgetConfig.subcategories || [])
      .filter((s) => {
        if (s.id.startsWith('sub-debt-')) {
          const rawDebtId = s.id.replace(/^sub-debt-/, '');
          return payableDebtIds.has(rawDebtId);
        }
        return true;
      })
      .map((s) => {
        const sLower = s.name.toLowerCase().trim();
        const linkedSub = expenseSubs.find(
          (rec) =>
            rec.id === s.subscriptionId ||
            rec.subcategoryId === s.id ||
            rec.name.toLowerCase().trim() === sLower
        );
        if (linkedSub) {
          return {
            ...s,
            subscriptionId: linkedSub.id,
            isSubscriptionActive: linkedSub.isActive,
          };
        }
        return s;
      });

    (debts || []).forEach((debt) => {
      if (debt.type !== 'payable') return;
      const isPaid = debt.status === 'paid' && (debt.remainingAmount ?? 0) <= 0;
      const paidThisMonth = (debt.payments || []).reduce((sum, p) => {
        const pd = parseLocalDay(p.date);
        if (isDateInBudgetPeriod(pd, budgetPeriod)) {
          return sum + p.amount;
        }
        return sum;
      }, 0);

      const debtSubId = `sub-debt-${debt.id}`;
      const cleanDebtName = debt.name.toLowerCase().trim();
      const subDisplayName = debt.name.toLowerCase().startsWith('cicilan')
        ? debt.name
        : `Cicilan ${debt.name}`;

      const existsIdx = base.findIndex((s) => {
        const sLower = s.name.toLowerCase().trim();
        return (
          s.id === debtSubId ||
          s.subscriptionId === debt.id ||
          sLower === subDisplayName.toLowerCase() ||
          sLower === cleanDebtName
        );
      });

      const isScheduledInThisPeriod = isDebtScheduledForBudgetPeriod(debt, budgetPeriod);

      if ((isPaid && paidThisMonth <= 0) || !isScheduledInThisPeriod) {
        if (existsIdx >= 0) {
          base.splice(existsIdx, 1);
        }
        return;
      }

      let dueDay: number | undefined = debt.dueDayOfMonth;
      if (dueDay === undefined && debt.dueDate) {
        const pd = parseLocalDay(debt.dueDate);
        if (!isNaN(pd.getTime())) dueDay = pd.getDate();
      }

      const debtEmoji = /kpr|rumah|kost|kontrak/i.test(debt.name)
        ? '🏠'
        : /motor/i.test(debt.name)
        ? '🛵'
        : /mobil/i.test(debt.name)
        ? '🚗'
        : '💳';

      const monthlyTarget = getMonthlyDebtInstallmentAmount(
        debt,
        existsIdx >= 0 ? base[existsIdx].allocatedAmount : undefined
      );
      const allocated = Math.max(monthlyTarget, paidThisMonth);
      const isActiveInCurrentPeriod = !isPaid || paidThisMonth > 0;

      if (existsIdx >= 0) {
        base[existsIdx] = {
          ...base[existsIdx],
          dueDateDay: dueDay !== undefined ? dueDay : base[existsIdx].dueDateDay,
          allocatedAmount: allocated,
          subscriptionId: debt.id,
          isSubscriptionActive: isActiveInCurrentPeriod,
        };
      } else {
        base.push({
          id: debtSubId,
          name: subDisplayName,
          group: 'kebutuhan',
          allocatedAmount: allocated,
          emoji: debtEmoji,
          dueDateDay: dueDay,
          subscriptionId: debt.id,
          isSubscriptionActive: isActiveInCurrentPeriod,
        });
      }
    });
    return base;
  }, [budgetConfig.subcategories, debts, subscriptions, budgetPeriod]);

  // Payable debts that are active but scheduled for a future period
  const deferredNextPeriodDebts = useMemo(() => {
    return (debts || []).filter(
      (d) =>
        d.type === 'payable' &&
        d.status === 'active' &&
        (d.remainingAmount ?? d.totalAmount) > 0 &&
        !isDebtScheduledForBudgetPeriod(d, budgetPeriod)
    );
  }, [debts, budgetPeriod]);

  // Filter subcategories: separate Cicilan & Utang into its own dedicated menu
  const debtSubs = useMemo(
    () => effectiveSubcategories.filter((s) => isDebtOrInstallmentSubcategory(s, debts)),
    [effectiveSubcategories, debts]
  );
  const needsSubs = useMemo(
    () =>
      effectiveSubcategories.filter(
        (s) => s.group === 'kebutuhan' && !isDebtOrInstallmentSubcategory(s, debts)
      ),
    [effectiveSubcategories, debts]
  );
  const wantsSubs = useMemo(
    () =>
      effectiveSubcategories.filter(
        (s) => s.group === 'keinginan' && !isDebtOrInstallmentSubcategory(s, debts)
      ),
    [effectiveSubcategories, debts]
  );
  const savingsSubs = useMemo(
    () =>
      effectiveSubcategories.filter(
        (s) => s.group === 'tabungan' && !isDebtOrInstallmentSubcategory(s, debts)
      ),
    [effectiveSubcategories, debts]
  );

  // Dynamic subcategory spent amounts calculated from transactions & debt payments in the active period
  const { subSpentMap, unallocatedGroupSpent, unallocatedGroupItems } = useMemo(() => {
    const map: Record<string, number> = {};
    const unallocatedMap: Record<BudgetGroup, number> = {
      kebutuhan: 0,
      keinginan: 0,
      tabungan: 0,
    };
    const unallocatedItemsMap: Record<
      BudgetGroup,
      { label: string; amount: number; emoji: string; isPersonalNeed?: boolean }[]
    > = {
      kebutuhan: [],
      keinginan: [],
      tabungan: [],
    };

    const fullCatMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
    const catMap = new Map<string, { name: string; group?: BudgetGroup; emoji?: string }>(
      categories.map((c) => [
        c.id,
        { name: c.name.toLowerCase(), group: c.budgetGroup, emoji: c.emoji },
      ])
    );
    const recordedTxIds = new Set<string>();

    const addUnallocatedItem = (
      group: BudgetGroup,
      label: string,
      amount: number,
      emoji: string,
      isPersonalNeed?: boolean
    ) => {
      unallocatedMap[group] = (unallocatedMap[group] || 0) + amount;
      const cleanLabel = label.trim() || 'Pengeluaran Lainnya';
      const existing = unallocatedItemsMap[group].find(
        (item) => item.label.toLowerCase() === cleanLabel.toLowerCase()
      );
      if (existing) {
        existing.amount += amount;
      } else {
        unallocatedItemsMap[group].push({
          label: cleanLabel,
          amount,
          emoji: emoji || '📌',
          isPersonalNeed,
        });
      }
    };

    transactions.forEach((tx) => {
      recordedTxIds.add(tx.id);
      const d = parseLocalDay(tx.date);
      if (isDateInBudgetPeriod(d, budgetPeriod)) {
        if (tx.type === 'expense') {
          const catObj = tx.categoryId ? fullCatMap.get(tx.categoryId) : undefined;
          const catInfo = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
          const catName = catInfo?.name || '';
          const txGroup: BudgetGroup = isSavingsExpense(tx, catObj)
            ? 'tabungan'
            : (tx.budgetGroup as BudgetGroup) || catInfo?.group || 'kebutuhan';

          const matchSub = matchTransactionToSubcategory(tx, effectiveSubcategories, {
            catName,
            txGroup,
            debts,
          });

          if (matchSub) {
            map[matchSub.id] = (map[matchSub.id] || 0) + tx.amount;
          } else {
            const isPersonalNeed =
              tx.expenseNature === 'grocery' || tx.expenseNature === 'non_daily';
            const fallbackLabel =
              tx.note?.trim() ||
              categories.find((c) => c.id === tx.categoryId)?.name ||
              (isPersonalNeed ? 'Keperluan Pribadi' : 'Pengeluaran Lainnya');
            const fallbackEmoji = isPersonalNeed ? '🛍️' : '🧾';
            addUnallocatedItem(txGroup, fallbackLabel, tx.amount, fallbackEmoji, isPersonalNeed);
          }
        } else if (tx.type === 'transfer' && tx.budgetGroup === 'tabungan') {
          const rawNote = (tx.note || '').toLowerCase().trim();
          const savingsList = effectiveSubcategories.filter((s) => s.group === 'tabungan');
          const matchSub =
            savingsList.find((s) => {
              const sName = s.name.toLowerCase().trim();
              return sName && (rawNote.includes(sName) || sName.includes(rawNote));
            }) || savingsList[0];
          if (matchSub) {
            map[matchSub.id] = (map[matchSub.id] || 0) + tx.amount;
          } else {
            addUnallocatedItem('tabungan', tx.note || 'Transfer Tabungan', tx.amount, '💰');
          }
        }
      }
    });

    (debts || []).forEach((debt) => {
      if (debt.type !== 'payable') return;
      (debt.payments || []).forEach((p) => {
        if (p.transactionId && recordedTxIds.has(p.transactionId)) return;
        const pd = parseLocalDay(p.date);
        if (isDateInBudgetPeriod(pd, budgetPeriod)) {
          const debtSubId = `sub-debt-${debt.id}`;
          const cleanDebtName = debt.name.toLowerCase().trim();
          const matchSub = effectiveSubcategories.find((s) => {
            const sLower = s.name.toLowerCase().trim();
            return (
              s.id === debtSubId ||
              s.subscriptionId === debt.id ||
              sLower === `cicilan ${cleanDebtName}` ||
              sLower === cleanDebtName
            );
          });
          if (matchSub) {
            map[matchSub.id] = (map[matchSub.id] || 0) + p.amount;
          } else {
            addUnallocatedItem('kebutuhan', `Cicilan ${debt.name}`, p.amount, '💳');
          }
        }
      });
    });

    return {
      subSpentMap: map,
      unallocatedGroupSpent: unallocatedMap,
      unallocatedGroupItems: unallocatedItemsMap,
    };
  }, [transactions, categories, effectiveSubcategories, debts, budgetPeriod]);

  // Subcategories recognized as fixed monthly obligations
  const fixedSubcategories = useMemo(() => {
    const expenseSubs = (subscriptions || []).filter((s) => s.type === 'expense');
    const list: { id: string; name: string; allocatedAmount: number }[] = [];

    effectiveSubcategories.forEach((sub) => {
      if (sub.group === 'tabungan') return;

      const subNameLower = sub.name.toLowerCase().trim();
      const linkedRec = expenseSubs.find(
        (rec) =>
          rec.id === sub.subscriptionId ||
          rec.subcategoryId === sub.id ||
          rec.name.toLowerCase().trim() === subNameLower
      );
      if (linkedRec) {
        if (!linkedRec.isActive) return;
      } else if (sub.isSubscriptionActive === false && (subSpentMap[sub.id] || 0) <= 0) {
        return;
      }

      const isFixed =
        Boolean(sub.dueDateDay) ||
        Boolean(sub.subscriptionId) ||
        Boolean(linkedRec) ||
        sub.id.startsWith('sub-debt-') ||
        FIXED_CATEGORY_IDS.has(sub.id.replace('sub-', 'cat-')) ||
        FIXED_EXPENSE_KEYWORDS_REGEX.test(sub.name);

      if (isFixed) {
        const spent = subSpentMap[sub.id] || 0;
        list.push({
          id: sub.id,
          name: sub.name,
          allocatedAmount: Math.max(sub.allocatedAmount, spent),
        });
      }
    });

    return list;
  }, [effectiveSubcategories, subscriptions, subSpentMap]);

  const calculateGroupSpent = (group: BudgetGroup) => {
    const subTotal = effectiveSubcategories
      .filter((s) => s.group === group && !isDebtOrInstallmentSubcategory(s, debts))
      .reduce((acc, s) => acc + (subSpentMap[s.id] || 0), 0);
    return subTotal + (unallocatedGroupSpent[group] || 0);
  };

  const needsSpent = calculateGroupSpent('kebutuhan');
  const wantsSpent = calculateGroupSpent('keinginan');
  const savingsSpent = calculateGroupSpent('tabungan');

  const visibleDebtSubs = useMemo(
    () =>
      showArchived
        ? debtSubs
        : debtSubs.filter((s) => s.isSubscriptionActive !== false || (subSpentMap[s.id] || 0) > 0),
    [debtSubs, showArchived, subSpentMap]
  );
  const debtTotalAllocated = useMemo(
    () =>
      visibleDebtSubs.reduce(
        (sum, s) =>
          sum +
          (s.isSubscriptionActive === false
            ? subSpentMap[s.id] || 0
            : Number(s.allocatedAmount) || 0),
        0
      ),
    [visibleDebtSubs, subSpentMap]
  );
  const debtTotalSpent = useMemo(
    () => visibleDebtSubs.reduce((sum, s) => sum + (subSpentMap[s.id] || 0), 0),
    [visibleDebtSubs, subSpentMap]
  );

  // Subcategories that have exceeded their allocated budget limit
  const overbudgetCategories = useMemo(() => {
    return effectiveSubcategories
      .filter((s) => {
        if (s.group === 'kebutuhan' && budgetConfig.needsPercent === 0) return false;
        if (s.group === 'keinginan' && budgetConfig.wantsPercent === 0) return false;
        if (s.group === 'tabungan' && budgetConfig.savingsPercent === 0) return false;
        if (s.isSubscriptionActive === false && (subSpentMap[s.id] || 0) <= 0) return false;
        const spent = subSpentMap[s.id] || 0;
        return s.allocatedAmount > 0 && spent > s.allocatedAmount;
      })
      .map((s) => {
        const spent = subSpentMap[s.id] || 0;
        return {
          ...s,
          spent,
          overAmount: spent - s.allocatedAmount,
          overPct: Math.round((spent / s.allocatedAmount) * 100),
        };
      })
      .sort((a, b) => b.overAmount - a.overAmount);
  }, [
    effectiveSubcategories,
    subSpentMap,
    budgetConfig.needsPercent,
    budgetConfig.wantsPercent,
    budgetConfig.savingsPercent,
  ]);

  const totalOverbudgetAmount = useMemo(() => {
    return overbudgetCategories.reduce((sum, item) => sum + item.overAmount, 0);
  }, [overbudgetCategories]);

  const totalPercentage = needsPercent + wantsPercent + savingsPercent;

  const formatPctLabel = (spent: number, limit: number): string => {
    if (spent <= 0 || limit <= 0) return '0%';
    const raw = (spent / limit) * 100;
    if (raw > 0 && raw < 1) {
      return `${raw.toFixed(1).replace('.', ',')}%`;
    }
    return `${Math.round(raw)}%`;
  };

  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNominalInput(tempIncomeInput);
    const nextPeriodBudgets = {
      ...(budgetConfig.settings?.periodBudgets || {}),
      [budgetPeriod.periodKey]: val,
    };
    updateBudgetConfig({
      estimatedIncome: val,
      settings: {
        ...(budgetConfig.settings || {}),
        manualIncomePeriodKey: budgetPeriod.periodKey,
        autoSyncIncome: tempAutoSyncIncome,
        periodBudgets: nextPeriodBudgets,
      },
    });
    setIsEditIncomeOpen(false);
  };

  const openPeriodModal = () => {
    const pDay = budgetPeriod.paydayDay || 1;
    setTempPaydayDay(pDay);
    setTempCycleMode('auto');
    const isCurrentlyCustom =
      budgetConfig.periodMode === 'custom' &&
      Boolean(budgetConfig.customPeriodStart) &&
      Boolean(budgetConfig.customNextPayday);
    setTempPeriodMode(isCurrentlyCustom ? 'custom' : 'standard');
    setTempCustomStart(budgetConfig.customPeriodStart || budgetPeriod.startDateIso);
    setTempCustomNext(budgetConfig.customNextPayday || budgetPeriod.nextPaydayIso);
    setIsEditPeriodOpen(true);
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDay = Math.max(1, Math.min(31, Math.round(Number(tempPaydayDay) || 1)));

    if (
      tempPeriodMode === 'custom' &&
      tempCustomStart &&
      tempCustomNext &&
      tempCustomNext > tempCustomStart
    ) {
      const startParts = tempCustomStart.split('-').map(Number);
      const inferredPayday = Number(tempPaydayDay) > 1 ? cleanDay : startParts[2] || cleanDay;
      updateBudgetConfig({
        paydayDay: inferredPayday,
        periodMode: 'custom',
        customPeriodStart: tempCustomStart,
        customNextPayday: tempCustomNext,
      });

      const today = new Date();
      const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(today.getDate()).padStart(2, '0')}`;
      if (todayIso >= tempCustomStart && todayIso < tempCustomNext) {
        setActiveDate(todayIso);
      } else {
        setActiveDate(tempCustomStart);
      }
      setIsEditPeriodOpen(false);
      return;
    }

    updateBudgetConfig({
      paydayDay: cleanDay,
      periodMode: 'standard',
      customPeriodStart: '',
      customNextPayday: '',
    });

    if (cleanDay > 1 && tempCycleMode === 'thisMonthStart') {
      const today = new Date();
      const maxD = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const clampedD = Math.min(cleanDay, maxD);
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(clampedD).padStart(2, '0');
      setActiveDate(`${y}-${m}-${d}`);
    } else if (tempCycleMode === 'auto') {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      setActiveDate(`${y}-${m}-${d}`);
    }

    setIsEditPeriodOpen(false);
  };

  const handleAutoBalancePercentages = () => {
    const diff = 100 - (needsPercent + wantsPercent + savingsPercent);
    if (diff === 0) return;
    if (diff > 0) {
      setNeedsPercent((prev) => Math.min(100, prev + diff));
    } else {
      let toReduce = Math.abs(diff);
      let nextSavings = savingsPercent;
      let nextWants = wantsPercent;
      let nextNeeds = needsPercent;

      const saveCut = Math.min(nextSavings, toReduce);
      nextSavings -= saveCut;
      toReduce -= saveCut;

      const wantCut = Math.min(nextWants, toReduce);
      nextWants -= wantCut;
      toReduce -= wantCut;

      nextNeeds = Math.max(0, nextNeeds - toReduce);

      setSavingsPercent(nextSavings);
      setWantsPercent(nextWants);
      setNeedsPercent(nextNeeds);
    }
  };

  const handleSavePercentages = () => {
    if (totalPercentage === 100) {
      updateBudgetConfig({
        needsPercent,
        wantsPercent,
        savingsPercent,
      });
      setIsEditPercentagesOpen(false);
    }
  };

  const openFoodLifestyleModal = () => {
    setTempGroceryBudgetInput(formatNominalInput(250000));
    setTempEatOutBudgetInput(formatNominalInput(0));
    setIsFoodModalOpen(true);
  };

  const handleCreateSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const rawAmount = parseNominalInput(newSubAmount);
    const amountVal = newSubAmount.trim() !== '' ? Math.max(0, rawAmount) : 0;
    const parsedDue = newSubDueDay ? Math.max(1, Math.min(31, Number(newSubDueDay))) : undefined;
    const resolvedIsGrocery =
      targetGroup === 'kebutuhan' && !parsedDue ? Boolean(newSubIsGrocery) : false;

    if (editingSubId) {
      const existsInStored = (budgetConfig.subcategories || []).some((s) => s.id === editingSubId);

      // Check if this subcategory is a synthetic or linked payable debt
      const matchedDebt = (debts || []).find(
        (d) =>
          d.type === 'payable' &&
          (`sub-debt-${d.id}` === editingSubId ||
            d.name.toLowerCase().trim() ===
              newSubName.toLowerCase().replace(/^cicilan\s+/i, '').trim())
      );

      if (existsInStored) {
        // updateBudgetSubcategory already syncs two-way with debts & subscriptions in AppContext
        updateBudgetSubcategory(editingSubId, {
          name: newSubName.trim(),
          group: targetGroup,
          allocatedAmount: amountVal,
          emoji: newSubEmoji || '📦',
          dueDateDay: parsedDue,
          isGroceryStock: resolvedIsGrocery,
        });
      } else if (matchedDebt && editingSubId.startsWith('sub-debt-')) {
        // Synthetic debt subcategory: update the underlying payable debt directly without creating a duplicate subcategory
        updateDebt(matchedDebt.id, {
          monthlyInstallment: amountVal > 0 ? amountVal : matchedDebt.monthlyInstallment,
          dueDayOfMonth: parsedDue !== undefined ? parsedDue : matchedDebt.dueDayOfMonth,
        });
      } else {
        addBudgetSubcategory({
          name: newSubName.trim(),
          group: targetGroup,
          allocatedAmount: amountVal,
          emoji: newSubEmoji || '📦',
          dueDateDay: parsedDue,
          isGroceryStock: resolvedIsGrocery,
        });
      }
    } else {
      addBudgetSubcategory({
        name: newSubName.trim(),
        group: targetGroup,
        allocatedAmount: amountVal,
        emoji: newSubEmoji || '📦',
        dueDateDay: parsedDue,
        isGroceryStock: resolvedIsGrocery,
      });
    }

    setIsAddSubOpen(false);
    setEditingSubId(null);
    setNewSubName('');
    setNewSubAmount('');
    setNewSubEmoji('📦');
    setNewSubDueDay('');
    setNewSubIsGrocery(false);
  };

  const openAddForGroup = (
    group: BudgetGroup,
    prefill?: { name?: string; amount?: number; emoji?: string; isGrocery?: boolean }
  ) => {
    setEditingSubId(null);
    setTargetGroup(group);
    setNewSubName(prefill?.name || '');
    setNewSubAmount(
      prefill?.amount !== undefined ? formatNominalInput(prefill.amount) : ''
    );
    setNewSubEmoji(
      prefill?.emoji || (group === 'kebutuhan' ? '⚡' : group === 'keinginan' ? '🎬' : '💰')
    );
    setNewSubDueDay('');
    setNewSubIsGrocery(Boolean(prefill?.isGrocery));
    setIsAddSubOpen(true);
  };

  const openEditSub = (sub: BudgetSubcategory) => {
    setEditingSubId(sub.id);
    setTargetGroup(sub.group);
    setNewSubName(sub.name);
    setNewSubAmount(formatNominalInput(sub.allocatedAmount));
    setNewSubEmoji(sub.emoji || '📦');
    setNewSubDueDay(sub.dueDateDay ? String(sub.dueDateDay) : '');
    setNewSubIsGrocery(
      !sub.dueDateDay && Boolean(sub.isGroceryStock || isGrocerySubcategory(sub))
    );
    setActiveMenuSubId(null);
    setIsAddSubOpen(true);
  };

  const renderGroupSection = (params: {
    group: BudgetGroup;
    groupPercent: number;
    title: string;
    subtitle: string;
    tooltip: string;
    accentTextClass: string;
    accentBgSoftClass: string;
    accentBorderClass: string;
    indicatorColor: string;
    sectionBarColor: string;
    itemBarColor: string;
    subs: BudgetSubcategory[];
    groupSpent: number;
    groupLimit: number;
    rawGroupLimit?: number;
    deductedDebtAmount?: number;
    spentLabel?: string;
  }) => {
    const {
      group,
      groupPercent,
      title,
      subtitle,
      tooltip,
      accentTextClass,
      accentBgSoftClass,
      accentBorderClass,
      indicatorColor,
      sectionBarColor,
      itemBarColor,
      subs,
      groupSpent,
      groupLimit,
      rawGroupLimit,
      deductedDebtAmount = 0,
      spentLabel = 'Terpakai',
    } = params;

    const isCollapsed = collapsedGroups[group];
    const effectiveRawLimit = rawGroupLimit !== undefined ? rawGroupLimit : groupLimit;
    const isZeroAllocationGroup =
      groupPercent === 0 || (effectiveRawLimit <= 0 && totalIncome > 0);
    const groupSpentPct =
      groupLimit > 0
        ? Math.min(100, Math.round((groupSpent / groupLimit) * 100))
        : groupSpent > 0
        ? 100
        : 0;
    const isNearOrOverLimit = groupLimit > 0 && groupSpentPct >= 85;
    const isGroupOver =
      (groupLimit > 0 && groupSpent > groupLimit) ||
      (!isZeroAllocationGroup && groupLimit === 0 && groupSpent > 0);
    const groupOverAmount = Math.max(0, groupSpent - groupLimit);

    const groupAllocated = subs.reduce(
      (sum, s) =>
        sum +
        (s.isSubscriptionActive === false
          ? subSpentMap[s.id] || 0
          : Number(s.allocatedAmount) || 0),
      0
    );
    const allocPct =
      groupLimit > 0
        ? Math.round((groupAllocated / groupLimit) * 100)
        : groupAllocated > 0
        ? 100
        : 0;
    const remainingUnallocated = groupLimit - groupAllocated;
    const unmappedItems = unallocatedGroupItems[group] || [];
    const unmappedSpent = unallocatedGroupSpent[group] || 0;

    return (
      <section className="rounded-3xl bg-white dark:bg-[#16181D] border border-slate-200/75 dark:border-white/[0.08] p-5 sm:p-6 space-y-4 transition-all">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-1.5 h-10 rounded-full shrink-0 mt-0.5 ${indicatorColor}`} />
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {title}
                </h3>
                <span className={`font-mono text-xs sm:text-sm font-bold tabular-nums ${accentTextClass}`}>
                  {groupPercent}%
                </span>

                {isZeroAllocationGroup && groupSpent === 0 && (
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    · Nonaktif (0%)
                  </span>
                )}

                {isGroupOver && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                    <AlertTriangle size={13} className="shrink-0 text-rose-500" />
                    <span>Lewat {fmtCurrency(groupOverAmount, { prefix: '+' })}</span>
                  </span>
                )}

                <span
                  className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-help transition-colors"
                  title={tooltip}
                >
                  <HelpCircle size={13} />
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {subtitle}
                {deductedDebtAmount > 0 && rawGroupLimit !== undefined && (
                  <span className="text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                    {' '}
                    · Pagu kotor {formatRupiah(rawGroupLimit, hide)} (dikurangi cicilan{' '}
                    {formatRupiah(deductedDebtAmount, hide)})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setNeedsPercent(budgetConfig.needsPercent);
                setWantsPercent(budgetConfig.wantsPercent);
                setSavingsPercent(budgetConfig.savingsPercent);
                setIsEditPercentagesOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal size={13} />
              <span>Porsi</span>
            </button>

            <button
              type="button"
              onClick={() => openAddForGroup(group)}
              className={`px-3 py-2 rounded-xl ${accentBtn} text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0`}
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Subkategori</span>
            </button>

            <button
              type="button"
              onClick={() => toggleGroupCollapse(group)}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl cursor-pointer transition-colors"
              title={isCollapsed ? 'Tampilkan' : 'Sembunyikan'}
              aria-label={isCollapsed ? 'Tampilkan' : 'Sembunyikan'}
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>

        {/* Section-Level Progress Bar & Summary Metrics */}
        <div className="space-y-2 pt-0.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
            <div className="flex items-center gap-2">
              <span
                className={
                  isGroupOver
                    ? 'text-rose-600 dark:text-rose-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 font-medium'
                }
              >
                {spentLabel}:{' '}
                <strong className="font-bold text-slate-900 dark:text-white">
                  {formatRupiah(groupSpent, hide)}
                </strong>
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className={`font-bold ${isGroupOver ? 'text-rose-500' : accentTextClass}`}>
                {groupLimit > 0
                  ? formatPctLabel(groupSpent, groupLimit)
                  : groupSpent > 0
                  ? 'Melebihi Pagu'
                  : '0%'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              {groupLimit > groupSpent && (
                <>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Sisa {formatRupiah(groupLimit - groupSpent, hide)}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                </>
              )}
              <span>
                Pagu:{' '}
                <strong className="font-bold text-slate-900 dark:text-white">
                  {formatRupiah(groupLimit, hide)}
                </strong>
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isGroupOver
                  ? 'bg-rose-500'
                  : isNearOrOverLimit
                  ? 'bg-amber-500'
                  : sectionBarColor
              }`}
              style={{ width: `${groupSpentPct}%` }}
            />
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Zero-Allocation Notice if user set 0% for this group */}
            {isZeroAllocationGroup && groupSpent === 0 ? (
              <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Alokasi {title} Diatur 0% Periode Ini
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Subkategori pada pos ini dinonaktifkan sementara (Rp0).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNeedsPercent(budgetConfig.needsPercent);
                    setWantsPercent(budgetConfig.wantsPercent);
                    setSavingsPercent(budgetConfig.savingsPercent);
                    setIsEditPercentagesOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 hover:border-slate-300 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
                >
                  Sesuaikan Porsi %
                </button>
              </div>
            ) : subs.length === 0 && unmappedSpent === 0 ? (
              /* Clean Empty State when group has 0 subcategories */
              <div className="rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Belum ada rincian subkategori di {title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tambahkan subkategori untuk memantau batas pengeluaran spesifik pada pos ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openAddForGroup(group, {
                      amount: groupLimit > 0 ? groupLimit : undefined,
                    })
                  }
                  className={`px-3.5 py-2 rounded-xl ${accentBtn} text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto`}
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Buat Subkategori</span>
                </button>
              </div>
            ) : (
              /* 2-Column Subcategory Cards Grid */
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 ${
                  isZeroAllocationGroup && groupSpent === 0 ? 'opacity-60' : ''
                }`}
              >
                {subs.map((sub) => {
                  const spent = subSpentMap[sub.id] || 0;
                  const rawPct =
                    sub.allocatedAmount > 0 ? Math.round((spent / sub.allocatedAmount) * 100) : 0;
                  const pct = Math.min(100, rawPct);
                  const isMenuOpen = activeMenuSubId === sub.id;
                  const isOver =
                    !isZeroAllocationGroup &&
                    sub.allocatedAmount > 0 &&
                    spent > sub.allocatedAmount;
                  const overAmount = Math.max(0, spent - sub.allocatedAmount);

                  return (
                    <div
                      key={sub.id}
                      className={`rounded-2xl p-4 border transition-all flex items-start gap-3.5 relative group ${
                        isMenuOpen
                          ? `${accentBorder} bg-slate-50/80 dark:bg-white/[0.05]`
                          : isOver
                          ? 'border-rose-400/80 dark:border-rose-500/60 bg-rose-50/30 dark:bg-rose-950/20'
                          : 'border-slate-200/75 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/15 bg-slate-50/50 dark:bg-white/[0.025]'
                      }`}
                    >
                      {/* Left Emoji Icon */}
                      <button
                        type="button"
                        onClick={() => openEditSub(sub)}
                        className="w-11 h-11 rounded-xl bg-white dark:bg-[#1E222B] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-center text-xl shrink-0 select-none cursor-pointer hover:scale-105 transition-transform"
                        title="Edit subkategori"
                      >
                        {sub.emoji}
                      </button>

                      {/* Center Info + Bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => openEditSub(sub)}
                                className={`text-sm font-bold truncate cursor-pointer hover:underline text-left ${
                                  isOver
                                    ? 'text-rose-950 dark:text-rose-100'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {sub.name}
                              </button>
                              {(sub.subscriptionId || sub.dueDateDay) && (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('subscriptions')}
                                  className="text-[11px] font-medium text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 shrink-0 cursor-pointer transition-colors"
                                  title="Jadwal Tagihan Rutin"
                                >
                                  {sub.isSubscriptionActive === false
                                    ? '· Dijeda'
                                    : sub.dueDateDay
                                    ? `· Tgl ${sub.dueDateDay}`
                                    : '· Rutin'}
                                </button>
                              )}
                              {isGrocerySubcategory(sub) &&
                                !sub.dueDateDay &&
                                !sub.subscriptionId && (
                                  <button
                                    type="button"
                                    onClick={openFoodLifestyleModal}
                                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0 cursor-pointer transition-colors"
                                    title="Pos Non-Harian (Tidak memotong jatah harian langsung)"
                                  >
                                    · Non-Harian
                                  </button>
                                )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`font-mono text-sm font-bold tabular-nums ${
                                isOver
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {formatRupiah(spent, hide)}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuSubId(isMenuOpen ? null : sub.id);
                              }}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                isMenuOpen
                                  ? 'bg-slate-200 dark:bg-white/15 text-slate-900 dark:text-white'
                                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.08]'
                              }`}
                              aria-label="Menu subkategori"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Subcategory Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOver
                                ? 'bg-rose-500'
                                : rawPct >= 85
                                ? 'bg-amber-500'
                                : itemBarColor
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Bottom Details Row */}
                        <div className="flex items-center justify-between mt-2 gap-2 text-xs font-mono tabular-nums">
                          {isOver ? (
                            <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <AlertTriangle size={12} className="shrink-0 text-rose-500" />
                              <span>
                                Lewat {fmtCurrency(overAmount, { prefix: '+' })} ({rawPct}%)
                              </span>
                            </span>
                          ) : rawPct >= 85 ? (
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              Sisa {formatRupiah(Math.max(0, sub.allocatedAmount - spent), hide)} (
                              {rawPct}%)
                            </span>
                          ) : (
                            <span className="font-medium text-slate-500 dark:text-slate-400">
                              Sisa {formatRupiah(Math.max(0, sub.allocatedAmount - spent), hide)} (
                              {formatPctLabel(spent, sub.allocatedAmount)})
                            </span>
                          )}

                          <span className="font-medium text-slate-400 dark:text-slate-500 shrink-0">
                            Pagu {formatRupiah(sub.allocatedAmount, hide)}
                          </span>
                        </div>
                      </div>

                      {/* Subcategory Menu Dropdown */}
                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-3 top-12 z-30 bg-white dark:bg-[#1E2026] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl p-1.5 min-w-[140px] text-xs font-semibold space-y-0.5"
                        >
                          <button
                            type="button"
                            onClick={() => openEditSub(sub)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                          >
                            <Pencil size={13} />
                            <span>Edit Pagu</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteBudgetSubcategory(sub.id);
                              setActiveMenuSubId(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Transparent Card for Unmapped Expenses in this Group */}
                {unmappedSpent > 0 && (
                  <div className="rounded-2xl p-4 border border-dashed border-amber-400/70 dark:border-amber-500/50 bg-amber-50/40 dark:bg-amber-950/15 flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-lg shrink-0">
                      🧾
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white block">
                            Lainnya ({title})
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">
                            Pengeluaran tanpa subkategori khusus
                          </span>
                        </div>
                        <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums shrink-0">
                          {formatRupiah(unmappedSpent, hide)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                        {unmappedItems.slice(0, 3).map((item, idx) => (
                          <span key={idx}>
                            {idx > 0 ? '· ' : ''}
                            {item.emoji} {item.label} ({formatRupiah(item.amount, hide)})
                          </span>
                        ))}
                      </div>

                      {unmappedItems.length > 0 && (
                        <div className="pt-0.5 flex flex-wrap gap-2.5">
                          {unmappedItems.slice(0, 3).map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                openAddForGroup(group, {
                                  name: item.label,
                                  amount: item.amount,
                                  emoji: item.emoji,
                                  isGrocery: item.isPersonalNeed,
                                })
                              }
                              className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Jadikan Subkategori ({item.label})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Allocation Footer Status Bar */}
            {!isZeroAllocationGroup && (subs.length > 0 || remainingUnallocated !== 0) && (
              <div
                className={`rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border ${accentBgSoftClass} ${accentBorderClass}`}
              >
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                  {remainingUnallocated === 0 && groupLimit > 0
                    ? `Alokasi pagu subkategori sudah pas 100%`
                    : remainingUnallocated < 0
                    ? groupLimit > 0
                      ? `Total pagu subkategori (${formatRupiah(groupAllocated, hide)}) melebihi pagu pos (${allocPct}%)`
                      : `Pagu pos terserap cicilan · Total subkategori: ${formatRupiah(
                          groupAllocated,
                          hide
                        )}`
                    : `Terbagi ke subkategori: ${formatRupiah(groupAllocated, hide)} (${allocPct}%) · Sisa pagu bebas:`}
                </span>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <span
                    className={`font-mono text-xs font-bold tabular-nums ${
                      remainingUnallocated < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {remainingUnallocated < 0
                      ? `Over ${formatRupiah(Math.abs(remainingUnallocated), hide)}`
                      : formatRupiah(remainingUnallocated, hide)}
                  </span>

                  {remainingUnallocated > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        openAddForGroup(group, {
                          amount: remainingUnallocated,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E222B] border border-slate-200 dark:border-white/10 hover:border-slate-400 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      + Alokasikan Sisa
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-5 lg:space-y-6 pb-28 lg:pb-12">
      {/* Top Header with Quick Actions */}
      <div className="pt-2 lg:pt-0 px-1 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Anggaran & Alokasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola basis anggaran periode, proporsi pos utama, tagihan rutin, dan kuota harian.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={openFoodLifestyleModal}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16181D] border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <Calculator size={14} className="text-amber-500" />
            <span>Simulator Kuota Harian</span>
          </button>

          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              showArchived
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                : 'bg-white dark:bg-[#16181D] border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <Eye size={14} />
            <span>{showArchived ? 'Sembunyikan Dijeda' : 'Tampilkan Dijeda'}</span>
          </button>
        </div>
      </div>

      {/* Full-Width Dark Command Center Hero Card */}
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-3xl p-5 sm:p-6 lg:p-7 text-white shadow-xl space-y-5 border border-white/10">
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-[#8B5CF6]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-[#D4F826]/10 blur-3xl pointer-events-none" />

        {/* Row 1: Basis Anggaran & Siklus Gajian */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          {/* Left: Basis Anggaran */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[#D4F826] uppercase tracking-wider">
                Basis Anggaran Periode
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs font-medium text-slate-300">
                {isAutoSyncIncome ? 'Otomatis Ikuti Pemasukan' : 'Dikunci Manual'}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-white leading-none">
                {formatRupiah(totalIncome, hide)}
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempIncomeInput(formatNominalInput(totalIncome));
                  setTempAutoSyncIncome(Boolean(budgetConfig?.settings?.autoSyncIncome));
                  setIsEditIncomeOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Ubah Basis Anggaran"
              >
                <Pencil size={12} />
                <span>Ubah Basis</span>
              </button>
            </div>

            {(periodRecordedIncome > 0 || liquidWalletBalance > 0) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-xs text-slate-400 font-mono tabular-nums">
                {liquidWalletBalance > 0 && (
                  <span>
                    Saldo dompet:{' '}
                    <strong className="text-slate-200 font-bold">
                      {formatRupiah(liquidWalletBalance, hide)}
                    </strong>
                  </span>
                )}
                {periodRecordedIncome > 0 && (
                  <span>
                    Pemasukan tercatat:{' '}
                    <strong className="text-emerald-300 font-bold">
                      {formatRupiah(periodRecordedIncome, hide)}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Active Period Navigation & Payday Config */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-[#D4F826] shrink-0">
                <Calendar size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-200 font-semibold">
                  <span>{budgetPeriod.periodFullLabel}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-[#D4F826] font-bold">
                    {budgetPeriod.isCustomFlexiblePeriod
                      ? `Fleksibel ${budgetPeriod.totalDays} Hr`
                      : budgetPeriod.paydayDay === 1
                      ? 'Siklus Bulanan'
                      : `Gajian Tgl ${budgetPeriod.paydayDay}`}
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-400 tabular-nums mt-0.5">
                  Hari ke-{budgetPeriod.currentDayOfPeriod} dari {budgetPeriod.totalDays} ·{' '}
                  <strong className="text-white font-bold">
                    {budgetPeriod.daysRemainingUntilPayday} hari lagi
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={goToPrevPeriod}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Periode Sebelumnya"
                  aria-label="Periode Sebelumnya"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={goToCurrentPeriod}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Periode Ini
                </button>
                <button
                  type="button"
                  onClick={goToNextPeriod}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Periode Berikutnya"
                  aria-label="Periode Berikutnya"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={openPeriodModal}
                className={`px-3 py-1.5 rounded-xl ${accentBtn} font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0`}
              >
                <CalendarClock size={13} strokeWidth={2.5} />
                <span>Siklus Gajian</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Proporsi 3 Pos Utama & Ringkasan Pagu */}
        <div className="relative z-10 pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300 font-mono tabular-nums">
              Distribusi Porsi ({budgetConfig.needsPercent}% Kebutuhan · {budgetConfig.wantsPercent}%
              Keinginan · {budgetConfig.savingsPercent}% Tabungan)
            </span>
            <button
              type="button"
              onClick={() => {
                setNeedsPercent(budgetConfig.needsPercent);
                setWantsPercent(budgetConfig.wantsPercent);
                setSavingsPercent(budgetConfig.savingsPercent);
                setIsEditPercentagesOpen(true);
              }}
              className="text-xs font-bold text-[#D4F826] hover:underline flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal size={13} />
              <span>Atur Porsi %</span>
            </button>
          </div>

          {/* Stacked Proportional Bar */}
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden flex gap-0.5 p-0.5">
            {budgetConfig.needsPercent > 0 && (
              <div
                className="h-full rounded-l-full first:rounded-l-full last:rounded-r-full bg-[#A594F9] transition-all duration-500"
                style={{ width: `${budgetConfig.needsPercent}%` }}
                title={`Kebutuhan: ${budgetConfig.needsPercent}%`}
              />
            )}
            {budgetConfig.wantsPercent > 0 && (
              <div
                className="h-full first:rounded-l-full last:rounded-r-full bg-pink-500 transition-all duration-500"
                style={{ width: `${budgetConfig.wantsPercent}%` }}
                title={`Keinginan: ${budgetConfig.wantsPercent}%`}
              />
            )}
            {budgetConfig.savingsPercent > 0 && (
              <div
                className="h-full first:rounded-l-full rounded-r-full bg-teal-400 transition-all duration-500"
                style={{ width: `${budgetConfig.savingsPercent}%` }}
                title={`Tabungan: ${budgetConfig.savingsPercent}%`}
              />
            )}
          </div>

          {/* 3-Column Allocation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Kebutuhan */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex items-center justify-between sm:block">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-violet-300">
                  Kebutuhan ({budgetConfig.needsPercent}%)
                </span>
                <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                  {formatPctLabel(needsSpent + debtTotalSpent, needsLimit)}
                </span>
              </div>
              <div className="text-right sm:text-left sm:mt-1.5 font-mono tabular-nums">
                <span className="text-base sm:text-lg font-extrabold text-white block">
                  {formatRupiah(needsLimit, hide)}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Terpakai {formatRupiah(needsSpent + debtTotalSpent, hide)}
                </span>
              </div>
            </div>

            {/* Keinginan */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex items-center justify-between sm:block">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-pink-300">
                  Keinginan ({budgetConfig.wantsPercent}%)
                </span>
                <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                  {budgetConfig.wantsPercent === 0
                    ? '0%'
                    : formatPctLabel(wantsSpent, wantsLimit)}
                </span>
              </div>
              <div className="text-right sm:text-left sm:mt-1.5 font-mono tabular-nums">
                <span className="text-base sm:text-lg font-extrabold text-white block">
                  {formatRupiah(wantsLimit, hide)}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Terpakai {formatRupiah(wantsSpent, hide)}
                </span>
              </div>
            </div>

            {/* Tabungan */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex items-center justify-between sm:block">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-teal-300">
                  Tabungan ({budgetConfig.savingsPercent}%)
                </span>
                <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                  {budgetConfig.savingsPercent === 0
                    ? '0%'
                    : formatPctLabel(savingsSpent, savingsLimit)}
                </span>
              </div>
              <div className="text-right sm:text-left sm:mt-1.5 font-mono tabular-nums">
                <span className="text-base sm:text-lg font-extrabold text-white block">
                  {formatRupiah(savingsLimit, hide)}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Realisasi {formatRupiah(savingsSpent, hide)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Pos Tagihan Tetap vs Pos Harian Fleksibel */}
        {totalIncome > 0 && (
          <div className="relative z-10 pt-4 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs items-start">
            {/* 1. Pos Tagihan Rutin (Fixed) */}
            <div className="h-full flex flex-col bg-white/[0.04] hover:bg-white/[0.06] rounded-2xl border border-white/10 transition-colors overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFixedPos((prev) => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 cursor-pointer text-left"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-sky-300 block">
                    Pos Tagihan Rutin (Fixed)
                  </span>
                  <span className="font-mono text-xs text-slate-400 tabular-nums block mt-0.5">
                    Terbayar {formatRupiah(dashboardSummary.monthlyFixedExpense, hide)} dari{' '}
                    {formatRupiah(dashboardSummary.monthlyFixedBudget, hide)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-mono text-sm text-white font-bold tabular-nums">
                    {formatRupiah(dashboardSummary.monthlyFixedBudget, hide)}
                  </span>
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-slate-300">
                    {showFixedPos ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {showFixedPos && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="overflow-hidden flex-1 flex flex-col"
                  >
                    <div className="px-4 pb-3.5 pt-2.5 border-t border-white/10 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Jumlah pos tagihan terjadwal:</span>
                        <span className="font-mono font-bold text-white tabular-nums">
                          {fixedSubcategories.length} pos
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span>Sisa tagihan belum dibayar:</span>
                        <span className="font-mono font-bold text-sky-300 tabular-nums">
                          {dashboardSummary.monthlyFixedExpense >=
                            dashboardSummary.monthlyFixedBudget &&
                          dashboardSummary.monthlyFixedBudget > 0
                            ? 'Lunas'
                            : formatRupiah(
                                Math.max(
                                  0,
                                  dashboardSummary.monthlyFixedBudget -
                                    dashboardSummary.monthlyFixedExpense
                                ),
                                hide
                              )}
                        </span>
                      </div>

                      {fixedSubcategories.length > 0 && (
                        <div className="text-slate-400 pt-1.5 border-t border-white/5 font-mono tabular-nums text-[11px]">
                          <span className="text-slate-300 leading-relaxed block">
                            {fixedSubcategories
                              .map((s) => `${s.name} (${formatRupiah(s.allocatedAmount, hide)})`)
                              .join(' · ')}
                          </span>
                        </div>
                      )}

                      {deferredNextPeriodDebts.length > 0 && (
                        <div className="text-[11px] text-amber-300 pt-0.5 flex items-center gap-1.5">
                          <Clock size={12} className="shrink-0" />
                          <span>
                            {deferredNextPeriodDebts.map((d) => d.name).join(', ')} dijadwalkan mulai
                            periode depan
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Pos Harian & Non-Harian (Fleksibel) */}
            <div className="h-full flex flex-col bg-white/[0.04] hover:bg-white/[0.06] rounded-2xl border border-white/10 transition-colors overflow-hidden">
              <button
                type="button"
                onClick={() => setShowVariablePos((prev) => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 cursor-pointer text-left"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#D4F826] block">
                    Pos Harian & Fleksibel
                  </span>
                  <span className="font-mono text-xs text-slate-400 tabular-nums block mt-0.5">
                    Jatah {fmtCurrency(dashboardSummary.dailyBudgetQuota, { suffix: '/hari' })} ·{' '}
                    {budgetPeriod.daysRemainingUntilPayday} hari tersisa
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-mono text-sm text-[#D4F826] font-bold tabular-nums">
                    Sisa {formatRupiah(dashboardSummary.remainingVariableBudget, hide)}
                  </span>
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-slate-300">
                    {showVariablePos ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {showVariablePos && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="overflow-hidden flex-1 flex flex-col"
                  >
                    <div className="px-4 pb-3.5 pt-2.5 border-t border-white/10 space-y-2 text-xs font-mono tabular-nums">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-sans">Pagu non-tagihan:</span>
                        <span className="font-bold text-white">
                          {formatRupiah(dashboardSummary.monthlyGroceryBudget, hide)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-sans">Keperluan pribadi (Non-Harian):</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-300">
                            {fmtCurrency(
                              (dashboardSummary.monthlyGroceryExpense || 0) +
                                (dashboardSummary.monthlyNonDailyExpense || 0),
                              { prefix: '-' }
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={openFoodLifestyleModal}
                            className="font-sans text-[11px] font-bold text-[#D4F826] hover:underline cursor-pointer"
                          >
                            Simulasi
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-sans">Terpakai harian:</span>
                        <span className="font-bold text-white">
                          {fmtCurrency(dashboardSummary.monthlyVariableExpense, { prefix: '-' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300 pt-1.5 border-t border-white/10">
                        <span className="font-sans">Mode Surplus / Defisit:</span>
                        <button
                          type="button"
                          onClick={openFoodLifestyleModal}
                          className="font-sans text-[11px] font-bold text-[#D4F826] hover:underline cursor-pointer"
                        >
                          {dashboardSummary.dailySurplusMode === 'save_weekend'
                            ? 'Save Weekend'
                            : dashboardSummary.dailySurplusMode === 'averaging'
                            ? 'Averaging'
                            : 'Rollover'}{' '}
                          ·{' '}
                          {dashboardSummary.dailyDeficitMode === 'strict_penalty'
                            ? 'Strict Penalty'
                            : 'Spread Deficit'}
                        </button>
                      </div>

                      {dashboardSummary.dailySurplusMode === 'save_weekend' &&
                        dashboardSummary.weekendBudgetPool > 0 && (
                          <div className="flex items-center justify-between text-emerald-300">
                            <span className="font-sans">Tabungan Kuota Weekend:</span>
                            <span className="font-bold">
                              {fmtCurrency(dashboardSummary.weekendBudgetPool, { prefix: '+' })}
                            </span>
                          </div>
                        )}

                      {dashboardSummary.dailyOverbudget &&
                      budgetPeriod.daysRemainingUntilPayday > 1 ? (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-[11px]">
                          <span className="font-sans font-semibold text-rose-300">
                            Hari ini lewat{' '}
                            {fmtCurrency(dashboardSummary.dailyOverbudgetAmount, { prefix: '+' })}
                          </span>
                          <span className="font-bold text-amber-300">
                            Besok{' '}
                            {fmtCurrency(dashboardSummary.tomorrowDailyQuota, {
                              prefix: '~',
                              suffix: '/hr',
                            })}
                          </span>
                        </div>
                      ) : budgetPeriod.daysRemainingUntilPayday > 1 &&
                        dashboardSummary.dailyBudgetQuota > 0 ? (
                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-[11px]">
                          <span className="font-sans text-slate-300 font-medium">
                            Sisa hari ini:{' '}
                            <strong className="font-mono text-white">
                              {formatRupiah(dashboardSummary.dailyBudgetRemaining, hide)}
                            </strong>
                          </span>
                          <span className="font-bold text-[#D4F826]">
                            Besok{' '}
                            {fmtCurrency(dashboardSummary.tomorrowDailyQuota, {
                              prefix: '~',
                              suffix: '/hr',
                            })}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Contextual Overbudget Alert Banner */}
      {overbudgetCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50/80 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-800/60 rounded-3xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  {overbudgetCategories.length} Subkategori Melebihi Pagu
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums mt-0.5">
                  Total kelebihan alokasi:{' '}
                  <strong className="text-rose-600 dark:text-rose-400 font-bold">
                    {fmtCurrency(totalOverbudgetAmount, { prefix: '+' })}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-rose-200/60 dark:border-rose-800/40 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-mono tabular-nums">
            {overbudgetCategories.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openEditSub(item)}
                className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 hover:underline cursor-pointer"
                title="Klik untuk sesuaikan pagu"
              >
                {idx > 0 && <span className="text-rose-300 dark:text-rose-700 mr-1">·</span>}
                <span>{item.emoji}</span>
                <span className="font-sans font-semibold">{item.name}:</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  {fmtCurrency(item.overAmount, { prefix: '+' })}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Category Sections */}
      <div className="space-y-5">
        {renderGroupSection({
          group: 'kebutuhan',
          groupPercent: budgetConfig.needsPercent,
          title: 'Kebutuhan Pokok',
          subtitle: 'Tagihan rutin, makan harian, transportasi, dan keperluan rumah tangga.',
          tooltip: `Alokasi Kebutuhan Pokok (${budgetConfig.needsPercent}%)`,
          accentTextClass: 'text-violet-600 dark:text-violet-400',
          accentBgSoftClass: 'bg-violet-50/50 dark:bg-violet-950/15',
          accentBorderClass: 'border-violet-200/60 dark:border-violet-800/40',
          indicatorColor: 'bg-[#A594F9]',
          sectionBarColor: 'bg-[#A594F9]',
          itemBarColor: 'bg-[#A594F9]',
          subs: showArchived
            ? needsSubs
            : needsSubs.filter(
                (s) => s.isSubscriptionActive !== false || (subSpentMap[s.id] || 0) > 0
              ),
          groupSpent: needsSpent,
          groupLimit: Math.max(0, needsLimit - debtTotalAllocated),
          rawGroupLimit: needsLimit,
          deductedDebtAmount: debtTotalAllocated,
          spentLabel: 'Terpakai',
        })}

        {/* Dedicated Section: CICILAN & UTANG */}
        {(visibleDebtSubs.length > 0 || deferredNextPeriodDebts.length > 0) && (
          <section className="rounded-3xl bg-white dark:bg-[#16181D] border border-slate-200/75 dark:border-white/[0.08] p-5 sm:p-6 space-y-4">
            <div
              onClick={() => setShowDebtSection((prev) => !prev)}
              className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 cursor-pointer select-none"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-1.5 h-10 rounded-full shrink-0 mt-0.5 bg-amber-400" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      Cicilan & Kewajiban Utang
                    </h3>
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      · {visibleDebtSubs.length} Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Otomatis terjadwal di pos tagihan tetap dan memotong pagu Kebutuhan Pokok.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('debt');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <span>Kelola Utang</span>
                  <ArrowUpRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDebtSection((prev) => !prev);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <span>{showDebtSection ? 'Sembunyikan' : 'Lihat Rincian'}</span>
                  {showDebtSection ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>
            </div>

            {/* Section Progress Bar */}
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                <span>
                  Terbayar periode ini:{' '}
                  <strong className="font-bold text-slate-900 dark:text-white">
                    {formatRupiah(debtTotalSpent, hide)}
                  </strong>
                </span>
                <span>
                  Total tagihan cicilan:{' '}
                  <strong className="font-bold text-slate-900 dark:text-white">
                    {formatRupiah(debtTotalAllocated, hide)}
                  </strong>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{
                    width: `${
                      debtTotalAllocated > 0
                        ? Math.min(100, Math.round((debtTotalSpent / debtTotalAllocated) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {showDebtSection && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {visibleDebtSubs.map((sub) => {
                  const spent = subSpentMap[sub.id] || 0;
                  const rawPct =
                    sub.allocatedAmount > 0 ? Math.round((spent / sub.allocatedAmount) * 100) : 0;
                  const pct = Math.min(100, rawPct);
                  const isMenuOpen = activeMenuSubId === sub.id;
                  const isPaidThisMonth = sub.allocatedAmount > 0 && spent >= sub.allocatedAmount;

                  return (
                    <div
                      key={sub.id}
                      className="rounded-2xl p-4 border border-slate-200/75 dark:border-white/[0.07] bg-slate-50/50 dark:bg-white/[0.025] flex items-start gap-3.5 relative"
                    >
                      <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#1E222B] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-center text-xl shrink-0 select-none">
                        {sub.emoji || '💳'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="text-sm font-bold truncate text-slate-900 dark:text-white">
                              {sub.name}
                            </span>
                            {sub.dueDateDay && (
                              <span className="text-[11px] font-medium text-slate-400">
                                · Tgl {sub.dueDateDay}
                              </span>
                            )}
                            {isPaidThisMonth && (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                · Lunas
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                              {formatRupiah(spent, hide)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuSubId(isMenuOpen ? null : sub.id);
                              }}
                              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.08]"
                              aria-label="Opsi cicilan"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isPaidThisMonth ? 'bg-emerald-500' : 'bg-amber-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between mt-2 gap-2 text-xs font-mono tabular-nums">
                          <span className="font-medium text-slate-500 dark:text-slate-400">
                            Sisa {formatRupiah(Math.max(0, sub.allocatedAmount - spent), hide)}
                          </span>
                          <span className="font-medium text-slate-400 dark:text-slate-500 shrink-0">
                            Tagihan {formatRupiah(sub.allocatedAmount, hide)}
                          </span>
                        </div>
                      </div>

                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-3 top-12 z-30 bg-white dark:bg-[#1E2026] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl p-1.5 min-w-[145px] text-xs font-semibold space-y-0.5"
                        >
                          <button
                            type="button"
                            onClick={() => openEditSub(sub)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                          >
                            <Pencil size={13} />
                            <span>Ubah Cicilan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuSubId(null);
                              setActiveTab('debt');
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                          >
                            <ArrowUpRight size={13} />
                            <span>Buka Menu Utang</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {renderGroupSection({
          group: 'keinginan',
          groupPercent: budgetConfig.wantsPercent,
          title: 'Keinginan & Gaya Hidup',
          subtitle: 'Hiburan, makan di luar, langganan hiburan, dan belanja gaya hidup.',
          tooltip: `Alokasi Keinginan & Gaya Hidup (${budgetConfig.wantsPercent}%)`,
          accentTextClass: 'text-pink-600 dark:text-pink-400',
          accentBgSoftClass: 'bg-pink-50/50 dark:bg-pink-950/15',
          accentBorderClass: 'border-pink-200/60 dark:border-pink-800/40',
          indicatorColor: 'bg-pink-500',
          sectionBarColor: 'bg-pink-500',
          itemBarColor: 'bg-pink-400',
          subs: showArchived
            ? wantsSubs
            : wantsSubs.filter(
                (s) => s.isSubscriptionActive !== false || (subSpentMap[s.id] || 0) > 0
              ),
          groupSpent: wantsSpent,
          groupLimit: wantsLimit,
          spentLabel: 'Terpakai',
        })}

        {renderGroupSection({
          group: 'tabungan',
          groupPercent: budgetConfig.savingsPercent,
          title: 'Tabungan & Investasi',
          subtitle: 'Dana darurat, tabungan berjangka, serta instrumen investasi masa depan.',
          tooltip: `Alokasi Tabungan & Investasi (${budgetConfig.savingsPercent}%)`,
          accentTextClass: 'text-teal-600 dark:text-teal-400',
          accentBgSoftClass: 'bg-teal-50/50 dark:bg-teal-950/15',
          accentBorderClass: 'border-teal-200/60 dark:border-teal-800/40',
          indicatorColor: 'bg-teal-500',
          sectionBarColor: 'bg-teal-500',
          itemBarColor: 'bg-teal-400',
          subs: savingsSubs,
          groupSpent: savingsSpent,
          groupLimit: savingsLimit,
          spentLabel: 'Realisasi',
        })}
      </div>

      {/* Modal: Atur Basis Budget */}
      <AnimatePresence>
        {isEditIncomeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 dark:border-white/[0.08]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    Basis Anggaran ({budgetPeriod.periodShortLabel})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tentukan patokan dana untuk pembagian porsi anggaran periode ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditIncomeOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveIncome} className="space-y-4">
                {/* Mode Toggle: Manual vs Auto Sync */}
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.05]">
                  <button
                    type="button"
                    onClick={() => setTempAutoSyncIncome(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      !tempAutoSyncIncome
                        ? 'bg-white dark:bg-[#1E222B] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Manual (Tetap)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempAutoSyncIncome(true);
                      if (periodRecordedIncome > 0) {
                        setTempIncomeInput(formatNominalInput(periodRecordedIncome));
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tempAutoSyncIncome
                        ? 'bg-white dark:bg-[#1E222B] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Ikuti Pemasukan
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                    Target Basis Anggaran (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tempIncomeInput}
                    onChange={(e) => {
                      setTempIncomeInput(formatNominalInput(e.target.value));
                      setTempAutoSyncIncome(false);
                    }}
                    placeholder="Contoh: 5.500.000"
                    className={`w-full p-3.5 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-2xl text-base font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing} font-mono tabular-nums`}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {!tempAutoSyncIncome
                      ? 'Nominal dikunci manual dan tidak berubah saat ada transaksi pemasukan baru.'
                      : 'Otomatis menyesuaikan total transaksi pemasukan yang tercatat pada periode ini.'}
                  </p>
                </div>

                {(liquidWalletBalance > 0 || periodRecordedIncome > 0) && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Isi Cepat Dari Data Tercatat
                    </span>
                    <div className="space-y-1.5">
                      {liquidWalletBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTempIncomeInput(formatNominalInput(liquidWalletBalance));
                            setTempAutoSyncIncome(false);
                          }}
                          className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center justify-between font-mono tabular-nums"
                        >
                          <span className="font-sans font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Wallet size={13} />
                            <span>Saldo Dompet Saat Ini</span>
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatRupiah(liquidWalletBalance, hide)}
                          </span>
                        </button>
                      )}
                      {periodRecordedIncome > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTempIncomeInput(formatNominalInput(periodRecordedIncome));
                            setTempAutoSyncIncome(false);
                          }}
                          className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer flex items-center justify-between font-mono tabular-nums"
                        >
                          <span className="font-sans font-semibold">
                            Pemasukan Periode Ini
                          </span>
                          <span className="font-bold">
                            {formatRupiah(periodRecordedIncome, hide)}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditIncomeOpen(false)}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 rounded-2xl ${accentBtn} text-xs font-bold shadow-xs cursor-pointer`}
                  >
                    Simpan Basis
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Atur Periode & Tanggal Gajian */}
      <AnimatePresence>
        {isEditPeriodOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 dark:border-white/[0.08] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    Siklus & Tanggal Gajian
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Kuota harian dihitung proporsional hingga tanggal gajian berikutnya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditPeriodOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {(() => {
                const today = new Date();
                const previewDay = Math.max(1, Math.min(31, Number(tempPaydayDay) || 1));
                const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const MONTHS_ID = [
                  'Januari',
                  'Februari',
                  'Maret',
                  'April',
                  'Mei',
                  'Juni',
                  'Juli',
                  'Agustus',
                  'September',
                  'Oktober',
                  'November',
                  'Desember',
                ];
                const toIso = (y: number, mIdx: number, d: number) =>
                  `${y}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const formatDateWithDayName = (iso: string) => {
                  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '-';
                  const [y, m, d] = iso.split('-').map(Number);
                  const dt = new Date(y, m - 1, d, 12, 0, 0);
                  if (Number.isNaN(dt.getTime())) return iso;
                  return `${DAYS_ID[dt.getDay()]}, ${d} ${MONTHS_ID[m - 1]} ${y}`;
                };

                const refYear = activeYear;
                const refMonth = activeMonth;
                const maxDayRefMonth = new Date(refYear, refMonth + 1, 0).getDate();
                const clampedRefPayday = Math.min(previewDay, maxDayRefMonth);
                const thisMonthPaydayDate = new Date(refYear, refMonth, clampedRefPayday, 12, 0, 0);
                const thisMonthPaydayDow = thisMonthPaydayDate.getDay();
                const isWeekendPayday =
                  previewDay > 1 && (thisMonthPaydayDow === 0 || thisMonthPaydayDow === 6);
                const fridayShiftOffset =
                  thisMonthPaydayDow === 0 ? 2 : thisMonthPaydayDow === 6 ? 1 : 0;
                const shiftedFridayDay = Math.max(1, clampedRefPayday - fridayShiftOffset);
                const shiftedFridayIso = toIso(refYear, refMonth, shiftedFridayDay);

                const nextMonthObj = new Date(refYear, refMonth + 1, 1);
                const nextYear = nextMonthObj.getFullYear();
                const nextMonthIdx = nextMonthObj.getMonth();
                const maxDayNextMonth = new Date(nextYear, nextMonthIdx + 1, 0).getDate();
                const nextRegularPaydayDay = Math.min(
                  previewDay > 1 ? previewDay : 25,
                  maxDayNextMonth
                );
                const nextRegularPaydayIso = toIso(nextYear, nextMonthIdx, nextRegularPaydayDay);

                const regularTargetDay = previewDay > 1 ? previewDay : 25;
                const clampedTargetThisMonth = Math.min(regularTargetDay, maxDayRefMonth);
                const targetThisMonthDate = new Date(
                  refYear,
                  refMonth,
                  clampedTargetThisMonth,
                  12,
                  0,
                  0
                );
                const targetDow = targetThisMonthDate.getDay();
                const offsetToFriday =
                  targetDow === 0 ? 2 : targetDow === 6 ? 1 : targetDow === 5 ? 0 : 2;
                const suggestedStartFridayDay = Math.max(
                  1,
                  clampedTargetThisMonth - offsetToFriday
                );
                const suggestedStartFridayIso = toIso(refYear, refMonth, suggestedStartFridayDay);
                const suggestedNext25Iso = toIso(
                  nextYear,
                  nextMonthIdx,
                  Math.min(regularTargetDay, maxDayNextMonth)
                );

                const autoPeriod = getBudgetPeriodInfo(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate(),
                  previewDay
                );
                const maxDayThisMonth = new Date(
                  today.getFullYear(),
                  today.getMonth() + 1,
                  0
                ).getDate();
                const thisMonthStartPeriod = getBudgetPeriodInfo(
                  today.getFullYear(),
                  today.getMonth(),
                  Math.min(previewDay, maxDayThisMonth),
                  previewDay
                );

                let customPreview = autoPeriod;
                if (tempCustomStart && tempCustomNext && tempCustomNext > tempCustomStart) {
                  const [csY, csM, csD] = tempCustomStart.split('-').map(Number);
                  customPreview = getBudgetPeriodInfo(csY, csM - 1, csD, previewDay, {
                    periodMode: 'custom',
                    customPeriodStart: tempCustomStart,
                    customNextPayday: tempCustomNext,
                  });
                }

                const selectedPreview =
                  tempPeriodMode === 'custom'
                    ? customPreview
                    : previewDay > 1 && tempCycleMode === 'thisMonthStart'
                    ? thisMonthStartPeriod
                    : autoPeriod;

                const previewDailyQuota =
                  selectedPreview.totalDays > 0
                    ? Math.round(
                        dashboardSummary.monthlyVariableBudget / selectedPreview.totalDays
                      )
                    : 0;

                const presets = [
                  { day: 1, label: 'Tgl 1' },
                  { day: 5, label: 'Tgl 5' },
                  { day: 10, label: 'Tgl 10' },
                  { day: 15, label: 'Tgl 15' },
                  { day: 20, label: 'Tgl 20' },
                  { day: 25, label: 'Tgl 25' },
                  { day: 28, label: 'Tgl 28' },
                ];

                return (
                  <form onSubmit={handleSavePeriod} className="space-y-4">
                    {/* Mode Switcher */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.05]">
                      <button
                        type="button"
                        onClick={() => setTempPeriodMode('standard')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          tempPeriodMode === 'standard'
                            ? `${accentBg} shadow-2xs`
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Calendar size={13} />
                        <span>Tanggal Tetap</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempPeriodMode('custom');
                          if (
                            !tempCustomStart ||
                            !tempCustomNext ||
                            tempCustomNext <= tempCustomStart
                          ) {
                            setTempCustomStart(suggestedStartFridayIso);
                            setTempCustomNext(suggestedNext25Iso);
                          }
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          tempPeriodMode === 'custom'
                            ? `${accentBg} shadow-2xs`
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Sparkles size={13} />
                        <span>Rentang Manual</span>
                      </button>
                    </div>

                    {tempPeriodMode === 'standard' ? (
                      <>
                        {isWeekendPayday && (
                          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/35 border border-amber-300 dark:border-amber-700/60 space-y-2">
                            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                              <strong>
                                Tgl {clampedRefPayday} {MONTHS_ID[refMonth]}
                              </strong>{' '}
                              jatuh pada hari <strong>{DAYS_ID[thisMonthPaydayDow]}</strong>. Jika
                              gajian dimajukan ke <strong>Jumat Tgl {shiftedFridayDay}</strong>:
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setTempPeriodMode('custom');
                                setTempCustomStart(shiftedFridayIso);
                                setTempCustomNext(nextRegularPaydayIso);
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>
                                Majukan ke Jumat {shiftedFridayDay} (s/d {nextRegularPaydayDay}{' '}
                                {MONTHS_ID[nextMonthIdx].slice(0, 3)})
                              </span>
                            </button>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Pilihan Cepat Tanggal Gajian
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {presets.map((p) => (
                              <button
                                key={p.day}
                                type="button"
                                onClick={() => setTempPaydayDay(p.day)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border font-mono tabular-nums ${
                                  previewDay === p.day
                                    ? `${accentBg} ${accentBorder}`
                                    : 'bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Pilih Tanggal (1 – 31)
                          </label>
                          <div className="grid grid-cols-7 gap-1.5 bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-2xl border border-slate-200/70 dark:border-white/[0.08]">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => (
                              <button
                                key={dayNum}
                                type="button"
                                onClick={() => setTempPaydayDay(dayNum)}
                                className={`h-8 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono tabular-nums ${
                                  previewDay === dayNum
                                    ? `${accentBg} shadow-xs scale-105`
                                    : 'bg-white dark:bg-[#1E222B] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                                }`}
                              >
                                {dayNum}
                              </button>
                            ))}
                          </div>
                        </div>

                        {previewDay > 1 &&
                          autoPeriod.periodFullLabel !== thisMonthStartPeriod.periodFullLabel && (
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                Siklus Aktif Saat Ini
                              </label>
                              <div className="grid grid-cols-1 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setTempCycleMode('auto')}
                                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                    tempCycleMode === 'auto'
                                      ? `${accentBorder} bg-slate-50 dark:bg-white/[0.06] text-slate-900 dark:text-white`
                                      : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <div>
                                    <span className="text-xs font-bold block">
                                      Siklus Berjalan ({autoPeriod.periodShortLabel})
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {autoPeriod.periodFullLabel}
                                    </span>
                                  </div>
                                  {tempCycleMode === 'auto' && <Check size={15} />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setTempCycleMode('thisMonthStart')}
                                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                    tempCycleMode === 'thisMonthStart'
                                      ? `${accentBorder} bg-slate-50 dark:bg-white/[0.06] text-slate-900 dark:text-white`
                                      : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <div>
                                    <span className="text-xs font-bold block">
                                      Mulai Tgl {previewDay} Bulan Ini (
                                      {thisMonthStartPeriod.periodShortLabel})
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {thisMonthStartPeriod.periodFullLabel}
                                    </span>
                                  </div>
                                  {tempCycleMode === 'thisMonthStart' && <Check size={15} />}
                                </button>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          Gunakan rentang manual saat tanggal gajian bulan ini maju atau mundur karena
                          akhir pekan maupun hari libur.
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              1. Tanggal Mulai Periode Ini
                            </label>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-[#D4F826]">
                              {formatDateWithDayName(tempCustomStart)}
                            </span>
                          </div>
                          <input
                            type="date"
                            value={tempCustomStart}
                            onChange={(e) => setTempCustomStart(e.target.value)}
                            required
                            className={`w-full p-2.5 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              2. Tanggal Gajian Berikutnya
                            </label>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-[#D4F826]">
                              {formatDateWithDayName(tempCustomNext)}
                            </span>
                          </div>
                          <input
                            type="date"
                            value={tempCustomNext}
                            min={tempCustomStart || undefined}
                            onChange={(e) => setTempCustomNext(e.target.value)}
                            required
                            className={`w-full p-2.5 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Live Preview Box */}
                    <div className="p-4 rounded-2xl bg-[#121316] text-white space-y-2 border border-white/10 font-mono tabular-nums">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-sans text-slate-400">Rentang Periode:</span>
                        <span className="font-bold text-[#D4F826]">
                          {selectedPreview.periodFullLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-sans text-slate-400">Durasi Siklus:</span>
                        <span className="font-bold text-white">
                          {selectedPreview.totalDays} Hari
                        </span>
                      </div>
                      {totalIncome > 0 && (
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                          <span className="font-sans text-slate-400">Estimasi Kuota Harian:</span>
                          <span className="font-bold text-[#D4F826]">
                            {fmtCurrency(previewDailyQuota, { prefix: '~', suffix: '/hari' })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditPeriodOpen(false)}
                        className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className={`flex-1 py-2.5 rounded-2xl ${accentBtn} text-xs font-bold shadow-xs cursor-pointer`}
                      >
                        Simpan Siklus
                      </button>
                    </div>
                  </form>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Ubah Porsi Kategori (0% - 100% Flexible Sliders + Auto-Balance) */}
      <AnimatePresence>
        {isEditPercentagesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 dark:border-white/[0.08] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    Proporsi Alokasi Anggaran
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sesuaikan persentase 3 pos utama (total wajib 100%).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditPercentagesOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '50 / 30 / 20', n: 50, w: 30, s: 20 },
                  { label: '70 / 20 / 10', n: 70, w: 20, s: 10 },
                  { label: '80 / 20 / 0', n: 80, w: 20, s: 0 },
                  { label: '100 / 0 / 0', n: 100, w: 0, s: 0 },
                ].map((preset) => {
                  const isActivePreset =
                    needsPercent === preset.n &&
                    wantsPercent === preset.w &&
                    savingsPercent === preset.s;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setNeedsPercent(preset.n);
                        setWantsPercent(preset.w);
                        setSavingsPercent(preset.s);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border font-mono tabular-nums ${
                        isActivePreset
                          ? `${accentBg} ${accentBorder}`
                          : 'bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {(() => {
                const activeNeedsAllocated = needsSubs.reduce(
                  (acc, s) =>
                    acc +
                    (s.isSubscriptionActive === false
                      ? subSpentMap[s.id] || 0
                      : Number(s.allocatedAmount) || 0),
                  0
                );
                const totalSubNeeds = activeNeedsAllocated + debtTotalAllocated;
                const minNeedsPct = Math.min(
                  100,
                  Math.ceil((totalSubNeeds / (totalIncome || 1)) * 100)
                );
                const isNeedsOverflow =
                  totalIncome > 0 && (totalIncome * needsPercent) / 100 < totalSubNeeds;

                return (
                  <>
                    <div className="space-y-3">
                      {/* Kebutuhan */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-violet-600 dark:text-violet-400 block">
                              KEBUTUHAN POKOK & CICILAN
                            </span>
                            {isNeedsOverflow && (
                              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                                Total subkategori: {formatRupiah(totalSubNeeds, hide)} (~{minNeedsPct}%)
                              </span>
                            )}
                          </div>
                          <div className="text-right font-mono tabular-nums">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {needsPercent}%
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {formatRupiah((totalIncome * needsPercent) / 100, hide)}
                            </span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={needsPercent}
                          onChange={(e) => setNeedsPercent(Number(e.target.value))}
                          className="w-full accent-violet-600 cursor-pointer"
                        />
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 font-mono tabular-nums">
                            <button
                              type="button"
                              onClick={() => setNeedsPercent((p) => Math.max(0, p - 5))}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E222B] border border-slate-200 dark:border-white/10 text-xs font-bold cursor-pointer"
                            >
                              -5%
                            </button>
                            <button
                              type="button"
                              onClick={() => setNeedsPercent((p) => Math.min(100, p + 5))}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E222B] border border-slate-200 dark:border-white/10 text-xs font-bold cursor-pointer"
                            >
                              +5%
                            </button>
                          </div>
                          {needsPercent !== 100 - wantsPercent - savingsPercent && (
                            <button
                              type="button"
                              onClick={() =>
                                setNeedsPercent(Math.max(0, 100 - wantsPercent - savingsPercent))
                              }
                              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer font-mono tabular-nums"
                            >
                              Isi Sisa ({Math.max(0, 100 - wantsPercent - savingsPercent)}%)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Keinginan */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-pink-500">KEINGINAN & GAYA HIDUP</span>
                          <div className="text-right flex items-center gap-2 font-mono tabular-nums">
                            {wantsPercent > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const freed = wantsPercent;
                                  setWantsPercent(0);
                                  setNeedsPercent((prev) =>
                                    Math.min(100 - savingsPercent, prev + freed)
                                  );
                                }}
                                className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#1E222B] border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer"
                              >
                                Set 0%
                              </button>
                            )}
                            <div>
                              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {wantsPercent}%
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                {formatRupiah((totalIncome * wantsPercent) / 100, hide)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={wantsPercent}
                          onChange={(e) => setWantsPercent(Number(e.target.value))}
                          className="w-full accent-pink-500 cursor-pointer"
                        />
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 font-mono tabular-nums">
                            <button
                              type="button"
                              onClick={() => setWantsPercent((p) => Math.max(0, p - 5))}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E222B] border border-slate-200 dark:border-white/10 text-xs font-bold cursor-pointer"
                            >
                              -5%
                            </button>
                            <button
                              type="button"
                              onClick={() => setWantsPercent((p) => Math.min(100, p + 5))}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E222B] border border-slate-200 dark:border-white/10 text-xs font-bold cursor-pointer"
                            >
                              +5%
                            </button>
                          </div>
                          {wantsPercent !== 100 - needsPercent - savingsPercent &&
                            100 - needsPercent - savingsPercent >= 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setWantsPercent(Math.max(0, 100 - needsPercent - savingsPercent))
                                }
                                className="text-xs font-bold text-pink-500 hover:underline cursor-pointer font-mono tabular-nums"
                              >
                                Isi Sisa ({Math.max(0, 100 - needsPercent - savingsPercent)}%)
                              </button>
                            )}
                        </div>
                      </div>

                      {/* Tabungan */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-teal-600 dark:text-teal-400">
                            TABUNGAN & INVESTASI
                          </span>
                          <div className="text-right flex items-center gap-2 font-mono tabular-nums">
                            {savingsPercent > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const freed = savingsPercent;
                                  setSavingsPercent(0);
                                  setNeedsPercent((prev) =>
                                    Math.min(100 - wantsPercent, prev + freed)
                                  );
                                }}
                                className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#1E222B] border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer"
                              >
                                Set 0%
                              </button>
                            )}
                            <div>
                              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {savingsPercent}%
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                {formatRupiah((totalIncome * savingsPercent) / 100, hide)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={savingsPercent}
                          onChange={(e) => setSavingsPercent(Number(e.target.value))}
                          className="w-full accent-teal-500 cursor-pointer"
                        />
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 font-mono tabular-nums">
                            <button
                              type="button"
                              onClick={() => setSavingsPercent((p) => Math.max(0, p - 5))}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E222B] border border-slate-200 dark:border-white/10 text-xs font-bold cursor-pointer"
                            >
                              -5%
                            </button>
                            <button
                              type="button"
                              onClick={() => setSavingsPercent((p) => Math.min(100, p + 5))}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E222B] border border-slate-200 dark:border-white/10 text-xs font-bold cursor-pointer"
                            >
                              +5%
                            </button>
                          </div>
                          {savingsPercent !== 100 - needsPercent - wantsPercent &&
                            100 - needsPercent - wantsPercent >= 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSavingsPercent(Math.max(0, 100 - needsPercent - wantsPercent))
                                }
                                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer font-mono tabular-nums"
                              >
                                Isi Sisa ({Math.max(0, 100 - needsPercent - wantsPercent)}%)
                              </button>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Total indicator & 1-click Auto-Balance */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Total Proporsi:
                      </span>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`font-mono text-xs font-extrabold tabular-nums ${
                            totalPercentage === 100
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {totalPercentage}% / 100%
                        </span>
                        {totalPercentage !== 100 && (
                          <button
                            type="button"
                            onClick={handleAutoBalancePercentages}
                            className={`px-3 py-1 rounded-xl ${accentBtn} text-xs font-bold cursor-pointer`}
                          >
                            Seimbangkan 100%
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsEditPercentagesOpen(false)}
                        className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={totalPercentage !== 100}
                        onClick={handleSavePercentages}
                        className={`flex-1 py-2.5 rounded-2xl ${accentBtn} disabled:opacity-50 text-xs font-bold shadow-xs cursor-pointer`}
                      >
                        Simpan Proporsi
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Tambah / Edit Subkategori */}
      <AnimatePresence>
        {isAddSubOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 dark:border-white/[0.08]"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  {editingSubId ? 'Edit Subkategori' : 'Tambah Subkategori'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddSubOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubcategory} className="space-y-3.5">
                {/* Group Switcher */}
                <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.05]">
                  {(
                    [
                      { id: 'kebutuhan', label: 'Kebutuhan' },
                      { id: 'keinginan', label: 'Keinginan' },
                      { id: 'tabungan', label: 'Tabungan' },
                    ] as { id: BudgetGroup; label: string }[]
                  ).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setTargetGroup(g.id)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        targetGroup === g.id
                          ? 'bg-white dark:bg-[#1E222B] text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                    Nama & Ikon Subkategori
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="Contoh: Listrik, Bensin, Belanja"
                      required
                      className={`flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                    />
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-[#11131A] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 text-xl cursor-pointer shrink-0"
                      title="Pilih Ikon"
                    >
                      {newSubEmoji || '📦'}
                    </button>
                  </div>
                </div>

                {/* Quick Icon Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    <span className="uppercase tracking-wider">Ikon Cepat</span>
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Smile size={12} />
                      <span>Semua Ikon</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickEmojiSuggestions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewSubEmoji(emoji)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all cursor-pointer ${
                          newSubEmoji === emoji
                            ? `${accentBg} shadow-xs scale-105`
                            : 'bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/10'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                      Alokasi Pagu (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newSubAmount}
                      onChange={(e) => setNewSubAmount(formatNominalInput(e.target.value))}
                      placeholder="500.000"
                      required
                      className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing} font-mono tabular-nums`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                      Tgl Tagihan (Opsional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={newSubDueDay}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewSubDueDay(val);
                        if (val) setNewSubIsGrocery(false);
                      }}
                      placeholder="Tgl 1-31"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing} font-mono tabular-nums`}
                    />
                  </div>
                </div>

                {targetGroup === 'kebutuhan' && !newSubDueDay && (
                  <button
                    type="button"
                    onClick={() => setNewSubIsGrocery((v) => !v)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      newSubIsGrocery
                        ? 'bg-amber-50 dark:bg-amber-950/35 border-amber-400 text-amber-950 dark:text-amber-100'
                        : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block text-slate-900 dark:text-white">
                        Pos Non-Harian (Keperluan Pribadi)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Belanja bulanan atau amplop — tidak langsung memotong kuota hari ini.
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                        newSubIsGrocery
                          ? 'bg-amber-400 border-amber-500 text-black'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {newSubIsGrocery && <Check size={13} strokeWidth={3} />}
                    </div>
                  </button>
                )}

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddSubOpen(false)}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 rounded-2xl ${accentBtn} text-xs font-bold shadow-xs cursor-pointer`}
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Simulator Pos Non-Harian & Kuota Harian */}
      <AnimatePresence>
        {isFoodModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-100 dark:border-white/[0.08] max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Simulator Kuota Harian
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                    Keperluan Pribadi & Proyeksi Kuota
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Simulasikan dampak belanja bulanan atau pengeluaran non-harian terhadap kuota harian
                    Anda hingga gajian berikutnya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFoodModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {(() => {
                const totalPeriodDays = Math.max(1, budgetPeriod.totalDays);
                const daysLeft = Math.max(1, budgetPeriod.daysRemainingUntilPayday);
                const nextWeekDaysLeft = Math.max(1, daysLeft - 7);

                const priorDaysVarExp = Math.max(
                  0,
                  dashboardSummary.monthlyVariableExpense - dashboardSummary.todayVariableExpense
                );
                const basePoolBeforeToday = Math.max(
                  0,
                  dashboardSummary.monthlyVariableBudget - priorDaysVarExp
                );

                const shopToday = Math.max(0, parseNominalInput(tempGroceryBudgetInput));
                const shopNextWeek = Math.max(0, parseNominalInput(tempEatOutBudgetInput));

                const currentDailyQuota = dashboardSummary.dailyBudgetQuota;

                // Remaining pool after simulated non-daily shopping today
                const remainingAfterTodayShop = Math.max(
                  0,
                  dashboardSummary.remainingVariableBudget - shopToday
                );
                const varBudgetAfterToday = Math.max(
                  0,
                  dashboardSummary.monthlyVariableBudget - shopToday
                );
                const poolBeforeTodayAfterShop = Math.max(0, basePoolBeforeToday - shopToday);
                const baseDailyAfterToday = Math.round(varBudgetAfterToday / totalPeriodDays);
                const rollingDailyAfterToday = Math.round(poolBeforeTodayAfterShop / daysLeft);
                const dailyQuotaAfterTodayShop =
                  shopToday === 0
                    ? currentDailyQuota
                    : priorDaysVarExp > 0
                    ? Math.min(baseDailyAfterToday, rollingDailyAfterToday)
                    : baseDailyAfterToday;

                const remainingAfterNextWeekShop = Math.max(
                  0,
                  remainingAfterTodayShop - shopNextWeek
                );
                const varBudgetAfterNextWeek = Math.max(0, varBudgetAfterToday - shopNextWeek);
                const poolAfterNextWeekShop = Math.max(0, poolBeforeTodayAfterShop - shopNextWeek);
                const baseDailyAfterNextWeek = Math.round(varBudgetAfterNextWeek / totalPeriodDays);
                const rollingDailyAfterNextWeek = Math.round(
                  poolAfterNextWeekShop / nextWeekDaysLeft
                );
                const dailyQuotaAfterNextWeekShop =
                  shopNextWeek === 0 && shopToday === 0
                    ? currentDailyQuota
                    : priorDaysVarExp > 0 || shopNextWeek > 0
                    ? Math.min(baseDailyAfterNextWeek, rollingDailyAfterNextWeek)
                    : baseDailyAfterNextWeek;

                const totalPersonalSpent =
                  (dashboardSummary.monthlyGroceryExpense || 0) +
                  (dashboardSummary.monthlyNonDailyExpense || 0);

                return (
                  <div className="space-y-4">
                    {/* Status Riil Saat Ini */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-2 font-mono tabular-nums">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-sans text-slate-500 dark:text-slate-400">
                          Pagu Non-Tagihan:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatRupiah(dashboardSummary.monthlyGroceryBudget, hide)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-sans text-slate-500 dark:text-slate-400">
                          Terpakai Non-Harian:
                        </span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {fmtCurrency(totalPersonalSpent, { prefix: '-' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-sans text-slate-500 dark:text-slate-400">
                          Terpakai Harian:
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {fmtCurrency(dashboardSummary.monthlyVariableExpense, { prefix: '-' })}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                        <span className="font-sans font-bold text-slate-900 dark:text-white">
                          Sisa Saldo Fleksibel ({daysLeft} hr):
                        </span>
                        <span className="font-extrabold text-emerald-600 dark:text-[#D4F826] text-sm">
                          {formatRupiah(dashboardSummary.remainingVariableBudget, hide)} (
                          {fmtCurrency(currentDailyQuota, { prefix: '~', suffix: '/hr' })})
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="font-sans text-slate-500 dark:text-slate-400">
                          Proyeksi Kuota Besok (Normal):
                        </span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">
                          {fmtCurrency(dashboardSummary.tomorrowDailyQuota, {
                            prefix: '~',
                            suffix: '/hr',
                          })}
                          {dashboardSummary.dailySurplusMode === 'save_weekend' &&
                            dashboardSummary.weekendBudgetPool > 0 &&
                            !hide &&
                            ` (Weekend +${formatRupiah(dashboardSummary.weekendBudgetPool, false)})`}
                        </span>
                      </div>
                      {!dashboardSummary.dailyOverbudget &&
                        dashboardSummary.dailyBudgetRemaining > 0 &&
                        daysLeft > 1 && (
                          <div className="flex items-center justify-between text-xs pt-0.5">
                            <span className="font-sans text-slate-500 dark:text-slate-400">
                              Jika Sisa Hari Ini Disimpan:
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {dashboardSummary.dailySurplusMode === 'rollover'
                                ? fmtCurrency(
                                    Math.min(
                                      dashboardSummary.remainingVariableBudget,
                                      dashboardSummary.tomorrowDailyQuota +
                                        dashboardSummary.dailyBudgetRemaining
                                    ),
                                    { prefix: '~', suffix: '/hr' }
                                  )
                                : dashboardSummary.dailySurplusMode === 'averaging'
                                ? fmtCurrency(
                                    Math.min(
                                      dashboardSummary.remainingVariableBudget,
                                      Math.round(
                                        dashboardSummary.tomorrowDailyQuota +
                                          dashboardSummary.dailyBudgetRemaining /
                                            Math.max(1, daysLeft - 1)
                                      )
                                    ),
                                    { prefix: '~', suffix: '/hr' }
                                  )
                                : `Tabungan Weekend +${formatRupiah(
                                    dashboardSummary.dailyBudgetRemaining,
                                    hide
                                  )}`}
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Pengaturan Cepat Mode Surplus & Defisit */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-3">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                          1. Mode Surplus (Sisa Budget Hari Ini)
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(
                            [
                              {
                                id: 'rollover' as DailySurplusMode,
                                label: 'Rollover',
                                sub: '100% ke Besok',
                              },
                              {
                                id: 'averaging' as DailySurplusMode,
                                label: 'Averaging',
                                sub: 'Bagi Rata Sisa Hari',
                              },
                              {
                                id: 'save_weekend' as DailySurplusMode,
                                label: 'Save Weekend',
                                sub: 'Tabung Weekend',
                              },
                            ] as const
                          ).map((m) => {
                            const active = dashboardSummary.dailySurplusMode === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  updateSettings({ dailySurplusMode: m.id }, true);
                                  addToast(
                                    'Mode Surplus Diperbarui',
                                    `Diatur ke ${m.label} (${m.sub}).`
                                  );
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  active
                                    ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white'
                                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E222B] text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                <span className="text-xs font-bold block leading-tight">
                                  {m.label}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-tight">
                                  {m.sub}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2.5 border-t border-slate-200/70 dark:border-white/10">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                          2. Mode Defisit (Lewat Limit Hari Ini)
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(
                            [
                              {
                                id: 'spread_deficit' as DailyDeficitMode,
                                label: 'Spread Deficit',
                                sub: 'Bagi Rata Sisa Hari',
                              },
                              {
                                id: 'strict_penalty' as DailyDeficitMode,
                                label: 'Strict Penalty',
                                sub: 'Potong Penuh Besok',
                              },
                            ] as const
                          ).map((m) => {
                            const active = dashboardSummary.dailyDeficitMode === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  updateSettings({ dailyDeficitMode: m.id }, true);
                                  addToast(
                                    'Mode Defisit Diperbarui',
                                    `Diatur ke ${m.label} (${m.sub}).`
                                  );
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  active
                                    ? 'border-rose-500 bg-rose-500/10 text-slate-900 dark:text-white'
                                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E222B] text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                <span className="text-xs font-bold block leading-tight">
                                  {m.label}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-tight">
                                  {m.sub}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Simulator Interaktif */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Uji Simulasi Belanja Non-Harian
                        </label>
                        <div className="flex items-center gap-1 font-mono tabular-nums">
                          {[0, 250000, 500000, 1000000].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setTempGroceryBudgetInput(formatNominalInput(val))}
                              className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              {val === 0 ? 'Rp0' : `${val / 1000}rb`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 space-y-2">
                          <label className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                            Belanja Non-Harian Hari Ini
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={tempGroceryBudgetInput}
                            onChange={(e) =>
                              setTempGroceryBudgetInput(formatNominalInput(e.target.value))
                            }
                            placeholder="250.000"
                            className="w-full p-2.5 bg-white dark:bg-[#11131A] border border-amber-300 dark:border-amber-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono tabular-nums"
                          />
                          <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5 pt-0.5 font-mono tabular-nums">
                            <div className="flex justify-between">
                              <span className="font-sans">Sisa fleksibel:</span>
                              <strong>{formatRupiah(remainingAfterTodayShop, hide)}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-sans">Kuota baru:</span>
                              <strong>
                                {fmtCurrency(dailyQuotaAfterTodayShop, {
                                  prefix: '~',
                                  suffix: '/hr',
                                })}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/50 space-y-2">
                          <label className="text-xs font-bold text-sky-800 dark:text-sky-300 block">
                            Rencana Minggu Depan
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={tempEatOutBudgetInput}
                            onChange={(e) =>
                              setTempEatOutBudgetInput(formatNominalInput(e.target.value))
                            }
                            placeholder="0"
                            className="w-full p-2.5 bg-white dark:bg-[#11131A] border border-sky-300 dark:border-sky-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-mono tabular-nums"
                          />
                          <div className="text-xs text-sky-900 dark:text-sky-200 space-y-0.5 pt-0.5 font-mono tabular-nums">
                            <div className="flex justify-between">
                              <span className="font-sans">Sisa fleksibel:</span>
                              <strong>{formatRupiah(remainingAfterNextWeekShop, hide)}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-sans">Kuota baru:</span>
                              <strong>
                                {fmtCurrency(dailyQuotaAfterNextWeekShop, {
                                  prefix: '~',
                                  suffix: '/hr',
                                })}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsFoodModalOpen(false)}
                        className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Tutup
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFoodModalOpen(false);
                          openAddTransaction('expense');
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-2xl ${accentBtn} text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5`}
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Catat Transaksi</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Emoji Picker Modal with Categories & Search */}
      <EmojiPickerModal
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        selectedEmoji={newSubEmoji}
        onSelect={(emoji) => setNewSubEmoji(emoji)}
        title="Pilih Ikon Subkategori"
      />
    </div>
  );
}
