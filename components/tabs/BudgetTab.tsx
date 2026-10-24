'use client';

import React, { useState, useMemo } from 'react';
import {
  Pencil,
  Plus,
  MoreVertical,
  X,
  Sliders,
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { EmojiPickerModal } from '../EmojiPickerModal';
import { formatRupiah, formatNominalInput, parseNominalInput } from '@/lib/formatters';
import { BudgetGroup, BudgetSubcategory, FoodLifestyleMode } from '@/lib/types';
import {
  FIXED_CATEGORY_IDS,
  FIXED_EXPENSE_KEYWORDS_REGEX,
  getBudgetPeriodInfo,
  getMonthlyDebtInstallmentAmount,
  isDateInBudgetPeriod,
  isDebtOrInstallmentSubcategory,
  isDebtScheduledForBudgetPeriod,
  isGrocerySubcategory,
} from '@/lib/budgetUtils';

export function BudgetTab() {
  const {
    budgetConfig,
    dashboardSummary,
    subscriptions,
    debts,
    setActiveTab,
    updateBudgetConfig,
    addBudgetSubcategory,
    deleteBudgetSubcategory,
    updateBudgetSubcategory,
    settings,
    transactions,
    categories,
    activeYear,
    activeMonth,
    activeDay,
    setActiveDate,
    budgetPeriod,
    goToPrevPeriod,
    goToNextPeriod,
    goToCurrentPeriod,
    openAddTransaction,
  } = useApp();

  const hide = settings.hideBalance;

  // Modals state
  const [isEditIncomeOpen, setIsEditIncomeOpen] = useState(false);
  const [tempIncomeInput, setTempIncomeInput] = useState(String(budgetConfig.estimatedIncome));

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

  // Pola Makan & Belanja Modal state
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [tempFoodMode, setTempFoodMode] = useState<FoodLifestyleMode>(
    budgetConfig.foodLifestyleMode || 'eat_out'
  );
  const [tempMealsOutPerDay, setTempMealsOutPerDay] = useState<number>(
    budgetConfig.mealsOutPerDay ?? 3
  );
  const [tempGroceryBudgetInput, setTempGroceryBudgetInput] = useState('0');
  const [tempEatOutBudgetInput, setTempEatOutBudgetInput] = useState('0');

  const [activeMenuSubId, setActiveMenuSubId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<BudgetGroup, boolean>>({
    kebutuhan: false,
    keinginan: false,
    tabungan: false,
  });
  // Cicilan & Utang dipisahkan dari Kebutuhan dan disembunyikan secara default (baru tampil saat diklik)
  const [showDebtSection, setShowDebtSection] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showFixedPos, setShowFixedPos] = useState(false);
  const [showGroceryPos, setShowGroceryPos] = useState(false);
  const [showVariablePos, setShowVariablePos] = useState(false);

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

  // Group limits (automatically includes recorded income if higher than manual estimate)
  const rawEstimatedIncome = budgetConfig.estimatedIncome ?? 0;
  const recordedPeriodIncome = dashboardSummary.monthlyIncome ?? 0;
  const totalIncome = Math.max(rawEstimatedIncome, recordedPeriodIncome);
  const needsLimit = Math.round((totalIncome * budgetConfig.needsPercent) / 100);
  const wantsLimit = Math.round((totalIncome * budgetConfig.wantsPercent) / 100);
  const savingsLimit = Math.round((totalIncome * budgetConfig.savingsPercent) / 100);

  const curMonthDate = new Date(activeYear, activeMonth, 1);
  const daysInCurMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
  const curMonthShort = curMonthDate.toLocaleString('id-ID', { month: 'short' });

  // Merge subcategories with payable debts scheduled for this budget period
  const effectiveSubcategories = useMemo<BudgetSubcategory[]>(() => {
    const base = [...(budgetConfig.subcategories || [])];
    (debts || []).forEach((debt) => {
      if (debt.type !== 'payable') return;
      const isPaid = debt.status === 'paid' && (debt.remainingAmount ?? 0) <= 0;
      const paidThisMonth = (debt.payments || []).reduce((sum, p) => {
        const pd = new Date(p.date);
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

      // If debt is paid off (with 0 payments this month) or scheduled to start in a future period (next month),
      // remove it from this period's active subcategories so it doesn't enter Pos Tagihan Bulanan (Fixed)
      if ((isPaid && paidThisMonth <= 0) || !isScheduledInThisPeriod) {
        if (existsIdx >= 0) {
          base.splice(existsIdx, 1);
        }
        return;
      }

      let dueDay: number | undefined = debt.dueDayOfMonth;
      if (dueDay === undefined && debt.dueDate) {
        const pd = new Date(debt.dueDate);
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

      if (existsIdx >= 0) {
        base[existsIdx] = {
          ...base[existsIdx],
          dueDateDay: dueDay !== undefined ? dueDay : base[existsIdx].dueDateDay,
          allocatedAmount: allocated,
          isSubscriptionActive: !isPaid,
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
          isSubscriptionActive: !isPaid,
        });
      }
    });
    return base;
  }, [budgetConfig.subcategories, debts, budgetPeriod]);

  // Payable debts that are active but scheduled for a future period (e.g. next month)
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
  const { subSpentMap, unallocatedGroupSpent } = useMemo(() => {
    const map: Record<string, number> = {};
    const unallocatedMap: Record<BudgetGroup, number> = {
      kebutuhan: 0,
      keinginan: 0,
      tabungan: 0,
    };

    const catMap = new Map<string, { name: string; group?: BudgetGroup }>(
      categories.map((c) => [c.id, { name: c.name.toLowerCase(), group: c.budgetGroup }])
    );
    const recordedTxIds = new Set<string>();

    transactions.forEach((tx) => {
      recordedTxIds.add(tx.id);
      const d = new Date(tx.date);
      if (isDateInBudgetPeriod(d, budgetPeriod)) {
        if (tx.type === 'expense') {
          const catInfo = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
          const catName = catInfo?.name || '';
          const txGroup = tx.expenseNature === 'savings' ? 'tabungan' : (tx.budgetGroup || catInfo?.group);

          const cleanTxNote = (tx.note || '')
            .toLowerCase()
            .replace(/\(otomatis rutin\)|\(rutin\)|\(langganan\)|\(bulanan\)|bayar cicilan utang:|cicilan utang:/gi, '')
            .trim();
          const rawTxNote = (tx.note || '').toLowerCase().trim();

          // 1. Try matching subcategory in the same budget group first (if txGroup is known)
          let matchSub = effectiveSubcategories.find((s) => {
            if (txGroup && s.group !== txGroup) return false;

            const subNameLower = s.name.toLowerCase().trim();
            const cleanSubName = subNameLower.replace(/^cicilan\s+/i, '').trim();

            // A. Direct ID match (e.g. sub-makan vs cat-makan)
            if (tx.categoryId && s.id.replace('sub-', '') === tx.categoryId.replace('cat-', '')) {
              return true;
            }

            // B. Note matches subcategory name (with minimum length guard to avoid false positives)
            if (subNameLower) {
              if (
                cleanTxNote === subNameLower ||
                (cleanSubName.length >= 3 && cleanTxNote.includes(cleanSubName)) ||
                (subNameLower.length >= 3 && (rawTxNote.includes(subNameLower) || cleanTxNote.includes(subNameLower))) ||
                (cleanTxNote.length >= 4 && subNameLower.includes(cleanTxNote))
              ) {
                return true;
              }

              // C. Keyword overlap (e.g. "wifi" in "wifi & internet")
              const subWords = subNameLower.split(/[\s&/,-]+/).filter((w) => w.length >= 3 && w !== 'cicilan');
              const noteWords = cleanTxNote.split(/[\s&/,-]+/).filter((w) => w.length >= 3);
              if (subWords.length > 0 && noteWords.length > 0) {
                const hasCommon = subWords.some((sw) =>
                  noteWords.some(
                    (nw) =>
                      nw === sw ||
                      (sw.length >= 4 && nw.length >= 4 && (nw.includes(sw) || sw.includes(nw)))
                  )
                );
                if (hasCommon) return true;
              }
            }

            // D. Category Name matches subcategory name
            if (catName.length >= 4 && subNameLower.length >= 4) {
              if (catName.includes(subNameLower) || subNameLower.includes(catName)) {
                return true;
              }
            }

            // E. Synonym match for Tabungan category ('cat-tabungan' -> 'Nabung Dana Darurat' / 'Tabungan')
            if (
              txGroup === 'tabungan' &&
              (tx.categoryId === 'cat-tabungan' || /tabung|nabung|simpan/i.test(catName)) &&
              /nabung|tabung|darurat|simpan/i.test(subNameLower)
            ) {
              return true;
            }

            // F. Synonym match for Belanja Bulanan & Bahan Masak ('grocery')
            if (
              (tx.expenseNature === 'grocery' || tx.categoryId === 'cat-belanja-bulanan') &&
              isGrocerySubcategory(s)
            ) {
              return true;
            }

            return false;
          });

          // 2. If no match within group, search all subcategories by note / keywords
          if (!matchSub && (cleanTxNote || rawTxNote)) {
            matchSub = effectiveSubcategories.find((s) => {
              const subNameLower = s.name.toLowerCase().trim();
              const cleanSubName = subNameLower.replace(/^cicilan\s+/i, '').trim();
              if (!subNameLower) return false;
              if (
                cleanTxNote === subNameLower ||
                (cleanSubName.length >= 3 && cleanTxNote.includes(cleanSubName)) ||
                (subNameLower.length >= 3 && (rawTxNote.includes(subNameLower) || cleanTxNote.includes(subNameLower))) ||
                (cleanTxNote.length >= 4 && subNameLower.includes(cleanTxNote))
              ) {
                return true;
              }
              const subWords = subNameLower.split(/[\s&/,-]+/).filter((w) => w.length >= 3 && w !== 'cicilan');
              const noteWords = cleanTxNote.split(/[\s&/,-]+/).filter((w) => w.length >= 3);
              return subWords.some((sw) =>
                noteWords.some(
                  (nw) =>
                    nw === sw ||
                    (sw.length >= 4 && nw.length >= 4 && (nw.includes(sw) || sw.includes(nw)))
                )
              );
            });
          }

          if (matchSub) {
            map[matchSub.id] = (map[matchSub.id] || 0) + tx.amount;
          } else if (txGroup) {
            unallocatedMap[txGroup] = (unallocatedMap[txGroup] || 0) + tx.amount;
          } else {
            unallocatedMap['kebutuhan'] = (unallocatedMap['kebutuhan'] || 0) + tx.amount;
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
            unallocatedMap['tabungan'] = (unallocatedMap['tabungan'] || 0) + tx.amount;
          }
        }
      }
    });

    // Also include payable debt payments recorded in DebtTab during this period that did not create a wallet transaction
    (debts || []).forEach((debt) => {
      if (debt.type !== 'payable') return;
      (debt.payments || []).forEach((p) => {
        if (p.transactionId && recordedTxIds.has(p.transactionId)) return;
        const pd = new Date(p.date);
        if (isDateInBudgetPeriod(pd, budgetPeriod)) {
          const debtSubId = `sub-debt-${debt.id}`;
          const cleanDebtName = debt.name.toLowerCase().trim();
          const matchSub = effectiveSubcategories.find((s) => {
            const sLower = s.name.toLowerCase().trim();
            return (
              s.id === debtSubId ||
              sLower === `cicilan ${cleanDebtName}` ||
              sLower === cleanDebtName
            );
          });
          if (matchSub) {
            map[matchSub.id] = (map[matchSub.id] || 0) + p.amount;
          } else {
            unallocatedMap['kebutuhan'] = (unallocatedMap['kebutuhan'] || 0) + p.amount;
          }
        }
      });
    });

    return { subSpentMap: map, unallocatedGroupSpent: unallocatedMap };
  }, [transactions, categories, effectiveSubcategories, debts, budgetPeriod]);

  // Subcategories recognized as fixed monthly obligations (Wi-Fi, Netflix, Listrik, Cicilan Utang, etc.)
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
      } else if (sub.isSubscriptionActive === false) {
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

  // Subcategories recognized as grocery/cooking stock (Belanja Bulanan, Bahan Masak, Sembako, dll.)
  const grocerySubcategories = useMemo(() => {
    const list: { id: string; name: string; allocatedAmount: number }[] = [];
    effectiveSubcategories.forEach((sub) => {
      if (sub.group === 'tabungan') return;
      if (sub.isSubscriptionActive === false) return;
      if (isGrocerySubcategory(sub)) {
        const spent = subSpentMap[sub.id] || 0;
        list.push({
          id: sub.id,
          name: sub.name,
          allocatedAmount: Math.max(sub.allocatedAmount, spent),
        });
      }
    });
    return list;
  }, [effectiveSubcategories, subSpentMap]);

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
    () => (showArchived ? debtSubs : debtSubs.filter((s) => s.isSubscriptionActive !== false)),
    [debtSubs, showArchived]
  );
  const debtTotalAllocated = useMemo(
    () => visibleDebtSubs.reduce((sum, s) => sum + (Number(s.allocatedAmount) || 0), 0),
    [visibleDebtSubs]
  );
  const debtTotalSpent = useMemo(
    () => visibleDebtSubs.reduce((sum, s) => sum + (subSpentMap[s.id] || 0), 0),
    [visibleDebtSubs, subSpentMap]
  );

  // Subcategories that have exceeded their allocated budget limit
  const overbudgetCategories = useMemo(() => {
    return effectiveSubcategories
      .filter((s) => {
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
  }, [effectiveSubcategories, subSpentMap]);

  const totalOverbudgetAmount = useMemo(() => {
    return overbudgetCategories.reduce((sum, item) => sum + item.overAmount, 0);
  }, [overbudgetCategories]);

  const totalPercentage = needsPercent + wantsPercent + savingsPercent;

  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNominalInput(tempIncomeInput);
    updateBudgetConfig({ estimatedIncome: val });
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

    if (tempPeriodMode === 'custom' && tempCustomStart && tempCustomNext && tempCustomNext > tempCustomStart) {
      const startParts = tempCustomStart.split('-').map(Number);
      const inferredPayday = Number(tempPaydayDay) > 1 ? cleanDay : (startParts[2] || cleanDay);
      updateBudgetConfig({
        paydayDay: inferredPayday,
        periodMode: 'custom',
        customPeriodStart: tempCustomStart,
        customNextPayday: tempCustomNext,
      });

      const today = new Date();
      const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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

  // Open Simulasi & Konsep Belanja Bulanan Fleksibel modal
  const openFoodLifestyleModal = () => {
    setTempGroceryBudgetInput(formatNominalInput(1000000));
    setTempEatOutBudgetInput(formatNominalInput(2000000));
    setIsFoodModalOpen(true);
  };

  const handleSelectFoodModePreset = (mode: FoodLifestyleMode, mealsOut = 1) => {
    setTempFoodMode(mode);
    const curGrocery = parseNominalInput(tempGroceryBudgetInput);
    const curEatOut = parseNominalInput(tempEatOutBudgetInput);
    const pool = curGrocery + curEatOut > 0 ? curGrocery + curEatOut : Math.max(600000, Math.round(needsLimit * 0.45));

    if (mode === 'eat_out') {
      setTempMealsOutPerDay(3);
      setTempGroceryBudgetInput('0');
      setTempEatOutBudgetInput(formatNominalInput(pool));
    } else if (mode === 'hybrid') {
      setTempMealsOutPerDay(mealsOut);
      // 1x makan di luar (misal malam beli di luar, pagi/siang masak) -> ~55% stok belanja masak, 45% makan luar
      // 2x makan di luar (misal pagi masak, siang & malam beli) -> ~40% stok belanja masak, 60% makan luar
      const groceryRatio = mealsOut === 1 ? 0.55 : 0.4;
      const gAmount = Math.round((pool * groceryRatio) / 10000) * 10000;
      const eAmount = Math.max(0, pool - gAmount);
      setTempGroceryBudgetInput(formatNominalInput(gAmount));
      setTempEatOutBudgetInput(formatNominalInput(eAmount));
    } else if (mode === 'cook_home') {
      setTempMealsOutPerDay(0);
      // Full masak sendiri dengan belanja bulanan -> ~85% stok belanja bulanan/pasar, ~15% camilan/darurat luar
      const gAmount = Math.round((pool * 0.85) / 10000) * 10000;
      const eAmount = Math.max(0, pool - gAmount);
      setTempGroceryBudgetInput(formatNominalInput(gAmount));
      setTempEatOutBudgetInput(formatNominalInput(eAmount));
    }
  };

  const handleSaveFoodLifestyle = (e: React.FormEvent) => {
    e.preventDefault();
    const groceryVal = Math.max(0, parseNominalInput(tempGroceryBudgetInput));
    const eatOutVal = Math.max(0, parseNominalInput(tempEatOutBudgetInput));

    const nextSubs = [...(budgetConfig.subcategories || [])];

    // 1. Update or add Makan di Luar subcategory ('sub-makan')
    const eatOutIdx = nextSubs.findIndex(
      (s) =>
        s.id === 'sub-makan' ||
        (!isGrocerySubcategory(s) && /makan\s*&\s*minum|makan\s*di\s*luar/i.test(s.name))
    );
    const eatOutLabel =
      tempFoodMode === 'hybrid'
        ? 'Makan di Luar (Malam/Jajan)'
        : tempFoodMode === 'cook_home'
        ? 'Jajan & Camilan Harian'
        : 'Makan & Minum';

    if (eatOutIdx >= 0) {
      nextSubs[eatOutIdx] = {
        ...nextSubs[eatOutIdx],
        name: eatOutLabel,
        allocatedAmount: eatOutVal,
        isGroceryStock: false,
      };
    } else if (eatOutVal > 0) {
      nextSubs.unshift({
        id: 'sub-makan',
        name: eatOutLabel,
        group: 'kebutuhan',
        allocatedAmount: eatOutVal,
        emoji: '🍔',
        isGroceryStock: false,
      });
    }

    // 2. Update, add, or remove Belanja Bulanan & Bahan Masak subcategory ('sub-belanja-bulanan')
    const groceryIdx = nextSubs.findIndex(
      (s) => s.id === 'sub-belanja-bulanan' || isGrocerySubcategory(s)
    );

    if (groceryVal > 0 || tempFoodMode !== 'eat_out') {
      if (groceryIdx >= 0) {
        nextSubs[groceryIdx] = {
          ...nextSubs[groceryIdx],
          name: nextSubs[groceryIdx].name || 'Belanja Bulanan & Masak',
          allocatedAmount: groceryVal,
          emoji: nextSubs[groceryIdx].emoji || '🛒',
          isGroceryStock: true,
        };
      } else {
        // Insert right after eatOutSub or at start of kebutuhan
        nextSubs.splice(Math.max(0, eatOutIdx + 1), 0, {
          id: 'sub-belanja-bulanan',
          name: 'Belanja Bulanan & Masak',
          group: 'kebutuhan',
          allocatedAmount: groceryVal,
          emoji: '🛒',
          isGroceryStock: true,
        });
      }
    } else if (groceryIdx >= 0 && groceryVal === 0 && tempFoodMode === 'eat_out') {
      // Remove or zero out grocery sub when switching back to full eat_out with Rp 0
      nextSubs.splice(groceryIdx, 1);
    }

    updateBudgetConfig({
      foodLifestyleMode: tempFoodMode,
      mealsOutPerDay: tempFoodMode === 'eat_out' ? 3 : tempFoodMode === 'hybrid' ? tempMealsOutPerDay : 0,
      subcategories: nextSubs,
    });

    if (groceryVal > 0 || tempFoodMode !== 'eat_out') {
      setShowGroceryPos(true);
    }
    setIsFoodModalOpen(false);
  };

  const handleCreateSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseNominalInput(newSubAmount);
    if (!newSubName.trim()) return;

    if (editingSubId) {
      updateBudgetSubcategory(editingSubId, {
        name: newSubName.trim(),
        allocatedAmount: amountVal || 0,
        emoji: newSubEmoji || '📦',
        dueDateDay: newSubDueDay ? Number(newSubDueDay) : undefined,
        isGroceryStock: targetGroup === 'kebutuhan' ? newSubIsGrocery : false,
      });
    } else {
      addBudgetSubcategory({
        name: newSubName.trim(),
        group: targetGroup,
        allocatedAmount: amountVal || 100000,
        emoji: newSubEmoji || '📦',
        dueDateDay: newSubDueDay ? Number(newSubDueDay) : undefined,
        isGroceryStock: targetGroup === 'kebutuhan' ? newSubIsGrocery : false,
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

  const openAddForGroup = (group: BudgetGroup) => {
    setEditingSubId(null);
    setTargetGroup(group);
    setNewSubName('');
    setNewSubAmount('');
    setNewSubEmoji(group === 'kebutuhan' ? '⚡' : group === 'keinginan' ? '🎬' : '💰');
    setNewSubDueDay('');
    setNewSubIsGrocery(false);
    setIsAddSubOpen(true);
  };

  const openEditSub = (sub: BudgetSubcategory) => {
    setEditingSubId(sub.id);
    setTargetGroup(sub.group);
    setNewSubName(sub.name);
    setNewSubAmount(formatNominalInput(sub.allocatedAmount));
    setNewSubEmoji(sub.emoji || '📦');
    setNewSubDueDay(sub.dueDateDay ? String(sub.dueDateDay) : '');
    setNewSubIsGrocery(Boolean(sub.isGroceryStock || isGrocerySubcategory(sub)));
    setActiveMenuSubId(null);
    setIsAddSubOpen(true);
  };

  const renderGroupSection = (params: {
    group: BudgetGroup;
    title: string;
    tooltip: string;
    dotColor: string;
    sectionBarColor: string;
    itemBarColor: string;
    subs: BudgetSubcategory[];
    groupSpent: number;
    groupLimit: number;
    spentLabel?: string;
  }) => {
    const {
      group,
      title,
      tooltip,
      dotColor,
      sectionBarColor,
      itemBarColor,
      subs,
      groupSpent,
      groupLimit,
      spentLabel = 'TERPAKAI',
    } = params;

    const isCollapsed = collapsedGroups[group];
    const groupSpentPct = groupLimit > 0 ? Math.min(100, Math.round((groupSpent / groupLimit) * 100)) : 0;
    const isNearOrOverLimit = groupSpentPct >= 85;
    const isGroupOver = groupLimit > 0 && groupSpent > groupLimit;
    const groupOverAmount = groupSpent - groupLimit;

    const groupAllocated = subs.reduce((sum, s) => sum + (Number(s.allocatedAmount) || 0), 0);
    const allocPct = groupLimit > 0 ? Math.round((groupAllocated / groupLimit) * 100) : 0;
    const remainingUnallocated = groupLimit - groupAllocated;

    return (
      <div className="space-y-3.5 pt-2">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
            <h3 className="text-xs font-extrabold tracking-[0.22em] text-gray-900 dark:text-white uppercase">
              {title}
            </h3>
            {isGroupOver && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-[10px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1 shadow-2xs">
                <AlertTriangle size={10} className="shrink-0 text-rose-500" />
                <span>Over +{formatRupiah(groupOverAmount, hide)}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setNeedsPercent(budgetConfig.needsPercent);
                setWantsPercent(budgetConfig.wantsPercent);
                setSavingsPercent(budgetConfig.savingsPercent);
                setIsEditPercentagesOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <SlidersHorizontal size={11} />
              <span>Ubah</span>
            </button>
            <span
              className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-help transition-colors"
              title={tooltip}
            >
              <HelpCircle size={14} />
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleGroupCollapse(group)}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg cursor-pointer transition-colors"
            title={isCollapsed ? 'Tampilkan' : 'Sembunyikan'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {/* Section-Level Full-Width Progress Bar & Labels */}
        <div className="space-y-1.5 px-1">
          <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isGroupOver ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : isNearOrOverLimit ? 'bg-[#EF4444]' : sectionBarColor
              }`}
              style={{ width: `${groupSpentPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-extrabold tracking-wider uppercase tabular-nums">
            <span className={isGroupOver ? 'text-rose-600 dark:text-rose-400 flex items-center gap-1 font-black' : 'text-gray-400'}>
              {isGroupOver && <AlertTriangle size={11} className="shrink-0 text-rose-500" />}
              <span>
                {spentLabel}: {formatRupiah(groupSpent, hide)} {isGroupOver ? `(+${formatRupiah(groupOverAmount, hide)})` : ''}
              </span>
            </span>
            <span className="text-gray-400">BATAS: {formatRupiah(groupLimit, hide)}</span>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* 2-Column Subcategory Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {subs.map((sub) => {
                const spent = subSpentMap[sub.id] || 0;
                const rawPct = sub.allocatedAmount > 0 ? Math.round((spent / sub.allocatedAmount) * 100) : 0;
                const pct = Math.min(100, rawPct);
                const isMenuOpen = activeMenuSubId === sub.id;
                const isOver = sub.allocatedAmount > 0 && spent > sub.allocatedAmount;
                const overAmount = spent - sub.allocatedAmount;

                return (
                  <div
                    key={sub.id}
                    className={`rounded-[22px] px-5 py-4 border transition-all flex items-center gap-4 relative group ${
                      isMenuOpen
                        ? 'border-[#D4F826] shadow-[0_4px_20px_rgba(212,248,38,0.15)] bg-white dark:bg-[#16181D]'
                        : isOver
                        ? 'border-rose-400 dark:border-rose-600/70 bg-gradient-to-br from-white via-rose-50/25 to-rose-50/50 dark:from-[#16181D] dark:via-rose-950/20 dark:to-rose-950/30 shadow-[0_4px_18px_rgba(244,63,94,0.12)] ring-1 ring-rose-400/40 dark:ring-rose-500/30'
                        : 'border-gray-100 dark:border-gray-800/80 hover:border-[#D4F826] dark:hover:border-[#D4F826]/70 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white dark:bg-[#16181D]'
                    }`}
                  >
                    {/* Left Emoji Icon with badge if over budget */}
                    <div className="relative shrink-0">
                      <div className="text-[28px] leading-none w-9 text-center select-none">
                        {sub.emoji}
                      </div>
                      {isOver && (
                        <div
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] font-black shadow-xs ring-1 ring-white dark:ring-black animate-pulse"
                          title={`Over Budget +${formatRupiah(overAmount, hide)}`}
                        >
                          !
                        </div>
                      )}
                    </div>

                    {/* Center Info + Bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <span className={`text-[13px] font-extrabold truncate ${
                            isOver ? 'text-rose-950 dark:text-rose-100' : 'text-gray-900 dark:text-white'
                          }`}>
                            {sub.name}
                          </span>
                          {isOver && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-100/90 dark:bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60 shrink-0">
                              <AlertTriangle size={10} className="shrink-0 text-rose-500 dark:text-rose-400" />
                              <span>Over Budget</span>
                            </span>
                          )}
                          {(sub.subscriptionId || sub.dueDateDay) && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('subscriptions')}
                              className="text-[10px] font-semibold text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 shrink-0 cursor-pointer transition-colors"
                              title="Terhubung dengan Jadwal Langganan & Tagihan Bulanan"
                            >
                              {sub.isSubscriptionActive === false
                                ? '· Dijeda'
                                : sub.dueDateDay
                                ? `· Tgl ${sub.dueDateDay}`
                                : '· Rutin'}
                            </button>
                          )}
                          {isGrocerySubcategory(sub) && !sub.dueDateDay && !sub.subscriptionId && (
                            <button
                              type="button"
                              onClick={openFoodLifestyleModal}
                              className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded-md border border-amber-500/25 shrink-0 cursor-pointer transition-colors"
                              title="Pos Keperluan Pribadi (Tidak dibebankan kuota harian)"
                            >
                              🛍️ Keperluan Pribadi
                            </button>
                          )}
                        </div>

                        <span className={`text-[13px] font-black tabular-nums shrink-0 ${
                          isOver ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {formatRupiah(spent, hide)}
                        </span>
                      </div>

                      {/* Subcategory Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : itemBarColor
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Bottom Details Row */}
                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        {isOver ? (
                          <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1 tabular-nums">
                            <AlertTriangle size={11} className="shrink-0 text-rose-500" />
                            <span>Melebihi +{formatRupiah(overAmount, hide)} ({rawPct}%)</span>
                          </span>
                        ) : rawPct >= 85 ? (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 tabular-nums">
                            <span>Sisa {formatRupiah(Math.max(0, sub.allocatedAmount - spent), hide)} ({rawPct}%)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tabular-nums">
                            Sisa {formatRupiah(Math.max(0, sub.allocatedAmount - spent), hide)}
                          </span>
                        )}

                        <span className="text-[11px] font-semibold text-gray-400 tabular-nums shrink-0">
                          dari {formatRupiah(sub.allocatedAmount, hide)}
                        </span>
                      </div>
                    </div>

                    {/* Right 3-Dots Action Button */}
                    <button
                      type="button"
                      onClick={() => setActiveMenuSubId(isMenuOpen ? null : sub.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                        isMenuOpen
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <MoreVertical size={15} />
                    </button>

                    {/* Subcategory Menu Dropdown */}
                    {isMenuOpen && (
                      <div className="absolute right-4 top-14 z-30 bg-white dark:bg-[#1E2026] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-1.5 min-w-[130px] text-xs font-bold space-y-1">
                        <button
                          type="button"
                          onClick={() => openEditSub(sub)}
                          className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center gap-2 cursor-pointer"
                        >
                          <Pencil size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteBudgetSubcategory(sub.id);
                            setActiveMenuSubId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Full-Width Dashed + TAMBAH SUBKATEGORI Button */}
            <button
              type="button"
              onClick={() => openAddForGroup(group)}
              className="w-full py-3.5 rounded-[20px] border border-dashed border-gray-200 dark:border-gray-800 text-[11px] font-extrabold tracking-[0.15em] text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-600 flex items-center justify-center gap-2 cursor-pointer transition-all uppercase bg-white/50 dark:bg-transparent"
            >
              <Plus size={14} />
              <span>TAMBAH SUBKATEGORI</span>
            </button>

            {/* Allocation Footer Status Bar */}
            <div className="bg-gray-50/90 dark:bg-[#16181D]/90 rounded-2xl px-4 py-3 flex items-center justify-between border border-gray-100/80 dark:border-gray-800/70">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    remainingUnallocated < 0
                      ? 'bg-red-500'
                      : allocPct === 100
                      ? 'bg-[#D4F826]'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="text-[10px] font-extrabold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
                  {remainingUnallocated === 0 && groupLimit > 0
                    ? 'ALOKASI PENUH 100%'
                    : remainingUnallocated < 0
                    ? `MELEBIHI BATAS ALOKASI (${allocPct}%)`
                    : `TERALOKASI ${allocPct}% · SISA ALOKASI`}
                </span>
              </div>
              <span
                className={`text-xs font-black tabular-nums ${
                  remainingUnallocated < 0
                    ? 'text-red-500'
                    : 'text-[#84CC16] dark:text-[#D4F826]'
                }`}
              >
                {formatRupiah(remainingUnallocated, hide)}
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="pt-2 lg:pt-0 px-1">
        <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Atur Budget
        </h1>
        <p className="text-xs lg:text-sm font-semibold text-gray-400 mt-0.5">
          Kasih tugas buat setiap Rupiahmu.
        </p>
      </div>

      {/* Full-Width Dark Hero Card (matching Dashboard & Wallets theme-adaptive gradient style) */}
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-[28px] lg:rounded-[32px] p-5 lg:px-9 lg:py-7 text-white shadow-xl space-y-5 border border-white/10">
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-[#8B5CF6]/20 blur-3xl pointer-events-none transition-colors duration-500" />
        <div
          className={`absolute -bottom-24 -left-16 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            settings.accentColor === 'plum'
              ? 'bg-[#71325A]/25'
              : settings.accentColor === 'orange'
              ? 'bg-[#FF6B2B]/15'
              : settings.accentColor === 'pink'
              ? 'bg-[#FFA4A4]/15'
              : 'bg-[#D4F826]/15'
          }`}
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left: Perkiraan Pemasukan + Nominal + Badges */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-[#D4F826] uppercase tracking-widest">
                PERKIRAAN PEMASUKAN
              </span>
              <button
                type="button"
                onClick={() => {
                  setTempIncomeInput(formatNominalInput(totalIncome));
                  setIsEditIncomeOpen(true);
                }}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Ubah Pemasukan"
              >
                <Pencil size={15} />
              </button>
            </div>

            <div className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight tabular-nums text-white leading-none">
              {formatRupiah(totalIncome, hide)}
            </div>

            {recordedPeriodIncome > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-1 rounded-xl text-emerald-300 text-[10px] font-bold flex items-center gap-1.5 tabular-nums">
                  <span>💰 Pemasukan Tercatat Periode Ini: {formatRupiah(recordedPeriodIncome, hide)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const merged = rawEstimatedIncome + recordedPeriodIncome;
                    updateBudgetConfig({ estimatedIncome: merged });
                  }}
                  className="bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-1 rounded-xl text-[#D4F826] text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Tambahkan pemasukan tercatat yang belum masuk ke angka Perkiraan Pemasukan"
                >
                  <Plus size={11} strokeWidth={2.8} />
                  <span>Gabungkan (+{formatRupiah(recordedPeriodIncome, hide)})</span>
                </button>
              </div>
            )}

            {((dashboardSummary.monthlyGroceryExpense || 0) + (dashboardSummary.monthlyNonDailyExpense || 0)) > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={openFoodLifestyleModal}
                  className="bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 px-3 py-1 rounded-xl text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer text-[10px] font-bold tabular-nums"
                  title="Tidak dibebankan langsung ke kuota harian — mengurangi saldo pos harian & menyesuaikan kuota harian"
                >
                  <span>
                    🛍️ Keperluan Pribadi: -{formatRupiah((dashboardSummary.monthlyGroceryExpense || 0) + (dashboardSummary.monthlyNonDailyExpense || 0), hide)}
                  </span>
                  <HelpCircle size={11} />
                </button>
              </div>
            )}
          </div>

          {/* Right on Desktop: Quick Allocation Summary */}
          <div className="hidden lg:flex items-center gap-8">
            <div>
              <span className="text-[10px] font-extrabold text-violet-400 uppercase tracking-wider block">
                KEBUTUHAN ({budgetConfig.needsPercent}%)
              </span>
              <span className="text-base font-black text-white mt-1 block tabular-nums">
                {formatRupiah(needsLimit, hide)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-pink-400 uppercase tracking-wider block">
                KEINGINAN ({budgetConfig.wantsPercent}%)
              </span>
              <span className="text-base font-black text-white mt-1 block tabular-nums">
                {formatRupiah(wantsLimit, hide)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider block">
                TABUNGAN ({budgetConfig.savingsPercent}%)
              </span>
              <span className="text-base font-black text-white mt-1 block tabular-nums">
                {formatRupiah(savingsLimit, hide)}
              </span>
            </div>
          </div>
        </div>

        {/* Pos Anggaran: Tagihan Bulanan (Fixed) vs Harian & Belanja Bulanan (Fleksibel) — Collapsed by default, expand on click */}
        {totalIncome > 0 && (
          <div className="pt-3.5 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-2.5 text-xs items-start">
            {/* 1. Menu Pos Tagihan Bulanan (Fixed) */}
            <div className="h-full flex flex-col bg-white/[0.04] hover:bg-white/[0.07] rounded-2xl border border-white/10 transition-colors overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFixedPos((prev) => !prev)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer text-left"
                title={showFixedPos ? 'Sembunyikan rincian Pos Tagihan Bulanan' : 'Klik untuk melihat rincian Pos Tagihan Bulanan'}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">📅</span>
                  <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider truncate">
                    POS TAGIHAN BULANAN (FIXED)
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs sm:text-sm text-gray-100 font-black tabular-nums">
                    Pagu: {formatRupiah(dashboardSummary.monthlyFixedBudget, hide)}
                  </span>
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-gray-300">
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
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden flex-1 flex flex-col"
                  >
                    <div className="px-3.5 pb-3.5 pt-2 border-t border-white/10 space-y-2 flex-1 flex flex-col justify-between">
                      {/* Baris 1: Jumlah pos terjadwal */}
                      <div className="text-[10px] text-gray-400 font-medium flex items-center justify-between">
                        <span>Pos tagihan terjadwal:</span>
                        <span className="text-gray-200 font-bold tabular-nums">
                          {fixedSubcategories.length} pos aktif
                        </span>
                      </div>

                      {/* Baris 2: Terbayar & Sisa Tagihan */}
                      <div className="text-[11px] flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-gray-400">
                          Terbayar periode ini:{' '}
                          <strong className="text-white">
                            {formatRupiah(dashboardSummary.monthlyFixedExpense, hide)}
                          </strong>
                        </span>
                        <span className="text-[11px] font-extrabold">
                          {dashboardSummary.monthlyFixedExpense >= dashboardSummary.monthlyFixedBudget &&
                          dashboardSummary.monthlyFixedBudget > 0 ? (
                            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                              Lunas Semua
                            </span>
                          ) : (
                            <span className="text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/25">
                              Sisa: {formatRupiah(
                                Math.max(0, dashboardSummary.monthlyFixedBudget - dashboardSummary.monthlyFixedExpense),
                                hide
                              )}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Baris 3: Alokasi */}
                      <div className="text-[11px] text-gray-400 font-medium flex items-center justify-between gap-2 min-h-[24px]">
                        <span className="shrink-0">Alokasi:</span>
                        {fixedSubcategories.length > 0 ? (
                          <span className="text-sky-300 font-bold truncate bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20 max-w-full">
                            {fixedSubcategories
                              .map((s) => `${s.name} (${formatRupiah(s.allocatedAmount, hide)})`)
                              .join(' + ')}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Belum ada alokasi tagihan berjadwal</span>
                        )}
                      </div>

                      {deferredNextPeriodDebts.length > 0 && (
                        <div className="text-[10px] text-amber-300/95 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
                          <span className="truncate">
                            ⏳ {deferredNextPeriodDebts.map((d) => d.name).join(', ')}
                          </span>
                          <span className="font-extrabold shrink-0">Mulai periode depan</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Menu Pos Pengeluaran Harian & Keperluan Pribadi (Fleksibel Mengikuti Sisa Uang) */}
            <div className="h-full flex flex-col bg-white/[0.04] hover:bg-white/[0.07] rounded-2xl border border-white/10 transition-colors overflow-hidden">
              <button
                type="button"
                onClick={() => setShowVariablePos((prev) => !prev)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer text-left"
                title={showVariablePos ? 'Sembunyikan rincian Pos Harian & Keperluan Pribadi' : 'Klik untuk melihat rincian Pos Harian & Keperluan Pribadi'}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">🥪</span>
                  <span className="text-[10px] font-black text-[#D4F826] uppercase tracking-wider truncate">
                    POS HARIAN & KEPERLUAN PRIBADI (FLEKSIBEL)
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs sm:text-sm text-gray-100 font-black tabular-nums">
                    Sisa Uang: {formatRupiah(dashboardSummary.remainingVariableBudget, hide)}
                  </span>
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-gray-300">
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
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden flex-1 flex flex-col"
                  >
                    <div className="px-3.5 pb-3.5 pt-2 border-t border-white/10 space-y-2 flex-1 flex flex-col justify-between">
                      {/* Baris 1: Pagu Awal vs Potongan Keperluan Pribadi (Non-Harian) */}
                      <div className="text-[10px] text-gray-300 font-medium flex flex-wrap items-center justify-between gap-2">
                        <span>
                          Pagu awal non-tagihan:{' '}
                          <strong className="text-white tabular-nums">
                            {formatRupiah(dashboardSummary.monthlyGroceryBudget, hide)}
                          </strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-300 font-bold tabular-nums bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-400/30">
                            🛍️ Keperluan Pribadi: -{formatRupiah((dashboardSummary.monthlyGroceryExpense || 0) + (dashboardSummary.monthlyNonDailyExpense || 0), hide)}
                          </span>
                          <button
                            type="button"
                            onClick={openFoodLifestyleModal}
                            className="text-[10px] font-black text-amber-200 hover:text-white bg-white/10 px-1.5 py-0.5 rounded-md cursor-pointer"
                            title="Lihat simulasi kuota harian mengikuti sisa keperluan pribadi"
                          >
                            Simulasi
                          </button>
                        </div>
                      </div>

                      {/* Baris 2: Terpakai Harian & Sisa Uang Riil */}
                      <div className="text-[11px] flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-gray-400">
                          Terpakai harian (makan luar/bensin):{' '}
                          <strong className="text-white tabular-nums">
                            {formatRupiah(dashboardSummary.monthlyVariableExpense, hide)}
                          </strong>
                        </span>
                        <span className="text-[11px] font-extrabold">
                          {dashboardSummary.remainingVariableBudget <= 0 ? (
                            <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/30">
                              Sisa Uang: Rp0 (Habis)
                            </span>
                          ) : (
                            <span className="text-[#D4F826] bg-[#D4F826]/10 px-2 py-0.5 rounded-md border border-[#D4F826]/20 tabular-nums">
                              Sisa Uang: {formatRupiah(dashboardSummary.remainingVariableBudget, hide)}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Baris 3: Kuota Harian Mengikuti Sisa Uang */}
                      <div className="text-[11px] text-gray-400 font-medium flex flex-wrap items-center justify-between gap-2 min-h-[24px]">
                        <span>
                          Kuota hari ini (mengikuti sisa s/d <strong className="text-white">{budgetPeriod.endShortLabel}</strong> •{' '}
                          {budgetPeriod.daysRemainingUntilPayday} hari):
                        </span>
                        {dashboardSummary.remainingVariableBudget <= 0 ? (
                          <span className="text-rose-300 font-extrabold tabular-nums bg-rose-500/15 px-2 py-0.5 rounded-lg border border-rose-500/30">
                            Maks Rp0/hari (Rem Belanja)
                          </span>
                        ) : (
                          <span className="text-[#D4F826] font-extrabold tabular-nums bg-[#D4F826]/10 px-2 py-0.5 rounded-lg border border-[#D4F826]/25">
                            ~{formatRupiah(dashboardSummary.dailyBudgetQuota, hide)}/hari
                          </span>
                        )}
                      </div>

                      {/* Baris 4: Dampak jika hari ini melebihi kuota harian (Overbudget Rollover ke Esok Hari) */}
                      {dashboardSummary.dailyOverbudget && budgetPeriod.daysRemainingUntilPayday > 1 ? (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 text-[10px]">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="text-rose-300 font-extrabold">
                              ⚠️ Hari ini lewat +{formatRupiah(dashboardSummary.dailyOverbudgetAmount, hide)} dari kuota:
                            </span>
                            <span className="text-amber-300 font-black tabular-nums">
                              Kuota mulai besok: ~{formatRupiah(dashboardSummary.tomorrowDailyQuota, hide)}/hari
                            </span>
                          </div>
                          <p className="text-gray-300 leading-relaxed">
                            Kelebihan hari ini otomatis memotong sisa saldo pos harian, sehingga kuota harian selama sisa{' '}
                            <strong className="text-white">{budgetPeriod.daysRemainingUntilPayday - 1} hari</strong> ke depan berkurang{' '}
                            <strong className="text-rose-300">-{formatRupiah(dashboardSummary.tomorrowQuotaDiff, hide)}/hari</strong> agar uang tetap cukup sampai gajian.
                            {dashboardSummary.dailyBudgetQuota > dashboardSummary.dailyOverbudgetAmount && (
                              <>
                                {' '}Atau jika ingin lusa kembali normal (<strong className="text-[#D4F826]">{formatRupiah(dashboardSummary.dailyBudgetQuota, hide)}/hari</strong>), cukup rem belanja besok maksimal{' '}
                                <strong className="text-amber-300">
                                  {formatRupiah(Math.max(0, dashboardSummary.dailyBudgetQuota - dashboardSummary.dailyOverbudgetAmount), hide)}
                                </strong>.
                              </>
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-400/90 bg-white/[0.03] border border-white/5 rounded-xl px-2.5 py-1.5 leading-relaxed">
                          💡 <strong className="text-gray-200">Jika hari ini lewat kuota:</strong> Kelebihannya otomatis mengurangi jatah hari-hari berikutnya (kuota mulai besok menyesuaikan dibagi sisa hari) agar uang tetap cukup sampai gajian.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Bottom Bar: Periode Aktif & Pengaturan Tanggal Gajian */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#D4F826]/15 border border-[#D4F826]/30 flex items-center justify-center text-[#D4F826] shrink-0">
              <Calendar size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  PERIODE AKTIF
                </span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/10 text-[#D4F826] uppercase tracking-wider">
                  {budgetPeriod.isCustomFlexiblePeriod
                    ? `Fleksibel (${budgetPeriod.totalDays} Hari)`
                    : budgetPeriod.paydayDay === 1
                    ? 'Tgl 1 - Akhir Bulan'
                    : `Gajian Tgl ${budgetPeriod.paydayDay}`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="font-extrabold text-white text-sm">
                  {budgetPeriod.periodFullLabel}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  • Hari ke-{budgetPeriod.currentDayOfPeriod} dari {budgetPeriod.totalDays} ({budgetPeriod.daysRemainingUntilPayday} hari menuju gajian)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
              <button
                type="button"
                onClick={goToPrevPeriod}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Periode Sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={goToCurrentPeriod}
                className="px-2.5 py-1 text-[10px] font-extrabold text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Kembali ke Periode Saat Ini"
              >
                Periode Ini
              </button>
              <button
                type="button"
                onClick={goToNextPeriod}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Periode Berikutnya"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={openPeriodModal}
              className="px-3.5 py-2 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black font-black text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <CalendarClock size={13} strokeWidth={2.5} />
              <span>Atur Tgl Gajian</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contextual Overbudget Alert Notification Banner */}
      {overbudgetCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-amber-500/10 dark:from-rose-950/60 dark:via-rose-900/40 dark:to-amber-950/20 border-2 border-rose-500/40 dark:border-rose-600/60 rounded-[26px] p-4 sm:p-5 shadow-lg relative overflow-hidden space-y-3.5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertTriangle size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/20">
                    PERINGATAN BUDGET
                  </span>
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    {budgetPeriod.periodShortLabel}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white mt-0.5">
                  {overbudgetCategories.length} Kategori Melebihi Anggaran!
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto bg-white/90 dark:bg-black/40 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Total Kelebihan:</span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400 tabular-nums">
                +{formatRupiah(totalOverbudgetAmount, hide)}
              </span>
            </div>
          </div>

          {/* Overbudget Categories Pills List */}
          <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/40 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Kategori Terlampaui:
            </span>
            {overbudgetCategories.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900/90 border border-rose-200 dark:border-rose-800 text-xs font-extrabold text-gray-800 dark:text-gray-200 shadow-2xs"
              >
                <span>{item.emoji}</span>
                <span>{item.name}</span>
                <span className="text-rose-600 dark:text-rose-400 font-black tabular-nums">
                  +{formatRupiah(item.overAmount, hide)}
                </span>
                <span className="text-[10px] font-semibold text-rose-500 dark:text-rose-400">
                  ({item.overPct}%)
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top Right "Tampilkan Arsip" Pill Control (matching reference screenshot) */}
      <div className="flex justify-end px-1 -mb-2">
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="px-3.5 py-1.5 rounded-full bg-gray-100/90 dark:bg-gray-800/70 hover:bg-gray-200/80 dark:hover:bg-gray-800 text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Eye size={13} />
          <span>{showArchived ? 'Sembunyikan Arsip' : 'Tampilkan Arsip'}</span>
        </button>
      </div>

      {/* Category Sections (Matching Reference 2-Column Card Grid UI) */}
      <div className="space-y-8">
        {renderGroupSection({
          group: 'kebutuhan',
          title: 'KEBUTUHAN',
          tooltip: `Alokasi Kebutuhan Pokok & Operasional (${budgetConfig.needsPercent}%) — Cicilan & Utang dipisahkan di menu bawah`,
          dotColor: 'bg-[#A594F9]',
          sectionBarColor: 'bg-[#A594F9]',
          itemBarColor: 'bg-[#A594F9]',
          subs: showArchived ? needsSubs : needsSubs.filter((s) => s.isSubscriptionActive !== false),
          groupSpent: needsSpent,
          groupLimit: Math.max(0, needsLimit - debtTotalAllocated),
          spentLabel: 'TERPAKAI',
        })}

        {/* Menu Terpisah: CICILAN & UTANG (Disembunyikan secara default, tampil saat diklik) */}
        {(visibleDebtSubs.length > 0 || deferredNextPeriodDebts.length > 0) && (
          <div className="space-y-3.5 pt-2">
            {/* Clickable Section Header */}
            <div
              onClick={() => setShowDebtSection((prev) => !prev)}
              className="flex items-center justify-between px-1 cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <h3 className="text-xs font-extrabold tracking-[0.22em] text-gray-900 dark:text-white uppercase">
                  CICILAN & UTANG
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  {visibleDebtSubs.length} Cicilan
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('debt');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Kelola Utang</span>
                </button>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDebtSection((prev) => !prev);
                }}
                className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                title={showDebtSection ? 'Sembunyikan daftar cicilan & utang' : 'Klik untuk menampilkan daftar cicilan & utang'}
              >
                <span>{showDebtSection ? 'Sembunyikan' : 'Klik untuk Tampilkan'}</span>
                {showDebtSection ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>

            {/* Section-Level Progress Bar & Labels */}
            <div
              onClick={() => setShowDebtSection((prev) => !prev)}
              className="space-y-1.5 px-1 cursor-pointer"
            >
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
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
              <div className="flex items-center justify-between text-[10px] font-extrabold tracking-wider uppercase tabular-nums">
                <span className="text-gray-400">
                  TERBAYAR PERIODE INI: {formatRupiah(debtTotalSpent, hide)}
                </span>
                <span className="text-gray-400">
                  TAGIHAN CICILAN: {formatRupiah(debtTotalAllocated, hide)}
                </span>
              </div>
            </div>

            {!showDebtSection ? (
              <button
                type="button"
                onClick={() => setShowDebtSection(true)}
                className="w-full py-3 px-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#16181D]/60 hover:border-amber-400/60 dark:hover:border-amber-400/50 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-between gap-2 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span>💳</span>
                  <span className="truncate">
                    {visibleDebtSubs.length > 0
                      ? `${visibleDebtSubs.length} daftar cicilan & utang disembunyikan (${visibleDebtSubs.map((s) => s.name).join(', ')})`
                      : `${deferredNextPeriodDebts.length} utang dijadwalkan mulai bulan depan`}
                  </span>
                </div>
                <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 shrink-0 flex items-center gap-1">
                  <span>Tampilkan</span>
                  <ChevronDown size={14} />
                </span>
              </button>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {visibleDebtSubs.map((sub) => {
                    const spent = subSpentMap[sub.id] || 0;
                    const rawPct = sub.allocatedAmount > 0 ? Math.round((spent / sub.allocatedAmount) * 100) : 0;
                    const pct = Math.min(100, rawPct);
                    const isMenuOpen = activeMenuSubId === sub.id;
                    const isPaidThisMonth = sub.allocatedAmount > 0 && spent >= sub.allocatedAmount;

                    return (
                      <div
                        key={sub.id}
                        className={`rounded-[22px] px-5 py-4 border transition-all flex items-center gap-4 relative group ${
                          isMenuOpen
                            ? 'border-[#D4F826] shadow-[0_4px_20px_rgba(212,248,38,0.15)] bg-white dark:bg-[#16181D]'
                            : 'border-gray-100 dark:border-gray-800/80 hover:border-amber-400/70 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white dark:bg-[#16181D]'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className="text-[28px] leading-none w-9 text-center select-none">
                            {sub.emoji || '💳'}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                              <span className="text-[13px] font-extrabold truncate text-gray-900 dark:text-white">
                                {sub.name}
                              </span>
                              {sub.dueDateDay && (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('debt')}
                                  className="text-[10px] font-semibold text-gray-400 hover:text-amber-500 shrink-0 cursor-pointer transition-colors"
                                >
                                  · Tgl {sub.dueDateDay}
                                </button>
                              )}
                              {isPaidThisMonth && (
                                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                                  Lunas Bulan Ini
                                </span>
                              )}
                            </div>

                            <span className="text-[13px] font-black tabular-nums shrink-0 text-gray-900 dark:text-white">
                              {formatRupiah(spent, hide)}
                            </span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isPaidThisMonth ? 'bg-emerald-500' : 'bg-amber-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between mt-1.5 gap-2">
                            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tabular-nums">
                              Sisa {formatRupiah(Math.max(0, sub.allocatedAmount - spent), hide)}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-400 tabular-nums shrink-0">
                              dari {formatRupiah(sub.allocatedAmount, hide)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveMenuSubId(isMenuOpen ? null : sub.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-4 top-14 z-30 bg-white dark:bg-[#1E2026] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-1.5 min-w-[140px] text-xs font-bold space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuSubId(null);
                                setActiveTab('debt');
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center gap-2 cursor-pointer"
                            >
                              <Pencil size={12} />
                              <span>Kelola di Utang</span>
                            </button>
                            {!sub.id.startsWith('sub-debt-') && (
                              <button
                                type="button"
                                onClick={() => {
                                  deleteBudgetSubcategory(sub.id);
                                  setActiveMenuSubId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={12} />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {renderGroupSection({
          group: 'keinginan',
          title: 'KEINGINAN',
          tooltip: `Alokasi Gaya Hidup, Hiburan & Keinginan (${budgetConfig.wantsPercent}%)`,
          dotColor: 'bg-pink-400',
          sectionBarColor: 'bg-pink-500',
          itemBarColor: 'bg-pink-400',
          subs: showArchived ? wantsSubs : wantsSubs.filter((s) => s.isSubscriptionActive !== false),
          groupSpent: wantsSpent,
          groupLimit: wantsLimit,
          spentLabel: 'TERPAKAI',
        })}

        {renderGroupSection({
          group: 'tabungan',
          title: 'TABUNGAN',
          tooltip: `Alokasi Dana Darurat, Tabungan & Investasi (${budgetConfig.savingsPercent}%)`,
          dotColor: 'bg-teal-400',
          sectionBarColor: 'bg-teal-500',
          itemBarColor: 'bg-teal-400',
          subs: savingsSubs,
          groupSpent: savingsSpent,
          groupLimit: savingsLimit,
          spentLabel: 'REALISASI',
        })}
      </div>

      {/* Modal: Ubah Pemasukan */}
      <AnimatePresence>
        {isEditIncomeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Ubah Pemasukan
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditIncomeOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveIncome} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">
                    Perkiraan Pemasukan Bulanan
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tempIncomeInput}
                    onChange={(e) => setTempIncomeInput(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 5.000.000"
                    className="w-full p-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-base font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Setiap kali Anda mencatat transaksi Pemasukan baru, nominalnya otomatis ditambahkan ke Perkiraan Pemasukan ini.
                  </p>
                </div>

                {recordedPeriodIncome > 0 && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        Total Pemasukan Tercatat:
                      </span>
                      <span className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                        {formatRupiah(recordedPeriodIncome)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTempIncomeInput(formatNominalInput(recordedPeriodIncome))}
                        className="py-1.5 px-2 rounded-xl bg-white dark:bg-gray-800 border border-emerald-500/30 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        Samakan Nominal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseNominalInput(tempIncomeInput);
                          setTempIncomeInput(formatNominalInput(cur + recordedPeriodIncome));
                        }}
                        className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[10px] font-extrabold text-white transition-colors cursor-pointer"
                      >
                        + Tambahkan
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditIncomeOpen(false)}
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

      {/* Modal: Atur Periode & Tanggal Gajian */}
      <AnimatePresence>
        {isEditPeriodOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    Atur Periode & Tanggal Gajian
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Sesuaikan siklus budget agar cukup sampai tanggal gajian berikutnya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditPeriodOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {(() => {
                const today = new Date();
                const previewDay = Math.max(1, Math.min(31, Number(tempPaydayDay) || 1));
                const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const MONTHS_ID = [
                  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
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

                // Detect if regular paydayDay this month falls on Saturday (6) or Sunday (0)
                const refYear = activeYear;
                const refMonth = activeMonth;
                const maxDayRefMonth = new Date(refYear, refMonth + 1, 0).getDate();
                const clampedRefPayday = Math.min(previewDay, maxDayRefMonth);
                const thisMonthPaydayDate = new Date(refYear, refMonth, clampedRefPayday, 12, 0, 0);
                const thisMonthPaydayDow = thisMonthPaydayDate.getDay(); // 0 = Minggu, 6 = Sabtu
                const isWeekendPayday = previewDay > 1 && (thisMonthPaydayDow === 0 || thisMonthPaydayDow === 6);
                const fridayShiftOffset = thisMonthPaydayDow === 0 ? 2 : thisMonthPaydayDow === 6 ? 1 : 0;
                const shiftedFridayDay = Math.max(1, clampedRefPayday - fridayShiftOffset);
                const shiftedFridayIso = toIso(refYear, refMonth, shiftedFridayDay);

                // Next month regular payday (e.g. tetap tgl 25 bulan depan)
                const nextMonthObj = new Date(refYear, refMonth + 1, 1);
                const nextYear = nextMonthObj.getFullYear();
                const nextMonthIdx = nextMonthObj.getMonth();
                const maxDayNextMonth = new Date(nextYear, nextMonthIdx + 1, 0).getDate();
                const nextRegularPaydayDay = Math.min(previewDay > 1 ? previewDay : 25, maxDayNextMonth);
                const nextRegularPaydayIso = toIso(nextYear, nextMonthIdx, nextRegularPaydayDay);

                // Also compute Friday before regular payday for ANY month (even if not weekend, for manual shortcut)
                const regularTargetDay = previewDay > 1 ? previewDay : 25;
                const clampedTargetThisMonth = Math.min(regularTargetDay, maxDayRefMonth);
                const targetThisMonthDate = new Date(refYear, refMonth, clampedTargetThisMonth, 12, 0, 0);
                const targetDow = targetThisMonthDate.getDay();
                const offsetToFriday =
                  targetDow === 0 ? 2 : targetDow === 6 ? 1 : targetDow === 5 ? 0 : 2;
                const suggestedStartFridayDay = Math.max(1, clampedTargetThisMonth - offsetToFriday);
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

                // Custom flexible period preview
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
                    ? Math.round(dashboardSummary.monthlyVariableBudget / selectedPreview.totalDays)
                    : 0;

                const presets = [
                  { day: 1, label: 'Tgl 1 (Awal Bulan)' },
                  { day: 5, label: 'Tgl 5' },
                  { day: 10, label: 'Tgl 10' },
                  { day: 15, label: 'Tgl 15' },
                  { day: 20, label: 'Tgl 20' },
                  { day: 25, label: 'Tgl 25 (Umum)' },
                  { day: 28, label: 'Tgl 28 (Akhir Bulan)' },
                ];

                return (
                  <form onSubmit={handleSavePeriod} className="space-y-4">
                    {/* Mode Switcher: Tanggal Tetap vs Periode Fleksibel Manual */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700/70">
                      <button
                        type="button"
                        onClick={() => setTempPeriodMode('standard')}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          tempPeriodMode === 'standard'
                            ? 'bg-[#D4F826] text-black shadow-2xs'
                            : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        📅 Tanggal Tetap
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempPeriodMode('custom');
                          if (!tempCustomStart || !tempCustomNext || tempCustomNext <= tempCustomStart) {
                            setTempCustomStart(suggestedStartFridayIso);
                            setTempCustomNext(suggestedNext25Iso);
                          }
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          tempPeriodMode === 'custom'
                            ? 'bg-[#D4F826] text-black shadow-2xs'
                            : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        ✨ Fleksibel / Manual
                      </button>
                    </div>

                    {tempPeriodMode === 'standard' ? (
                      <>
                        {/* Smart Weekend Alert when payday falls on Saturday/Sunday */}
                        {isWeekendPayday && (
                          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 space-y-2">
                            <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                              💡 <strong>Tgl {clampedRefPayday} {MONTHS_ID[refMonth]}</strong> jatuh di hari{' '}
                              <strong>{DAYS_ID[thisMonthPaydayDow]}</strong>! Jika gajian bulan ini dimajukan ke hari{' '}
                              <strong>Jumat Tgl {shiftedFridayDay}</strong> dan bulan depan tetap <strong>Tgl {nextRegularPaydayDay}</strong>:
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setTempPeriodMode('custom');
                                setTempCustomStart(shiftedFridayIso);
                                setTempCustomNext(nextRegularPaydayIso);
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                              <span>Atur Gajian Maju ke Jumat Tgl {shiftedFridayDay} (s/d {nextRegularPaydayDay} {MONTHS_ID[nextMonthIdx].slice(0, 3)})</span>
                            </button>
                          </div>
                        )}

                        {/* Quick Presets */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                            Pilihan Cepat Tanggal Gajian
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {presets.map((p) => (
                              <button
                                key={p.day}
                                type="button"
                                onClick={() => setTempPaydayDay(p.day)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                                  previewDay === p.day
                                    ? 'bg-[#D4F826] text-black border-[#D4F826] shadow-xs'
                                    : 'bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 1-31 Calendar Date Selector Grid */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                            Atau Pilih Tanggal Gajian (1 - 31)
                          </label>
                          <div className="grid grid-cols-7 gap-1.5 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => (
                              <button
                                key={dayNum}
                                type="button"
                                onClick={() => setTempPaydayDay(dayNum)}
                                className={`h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                  previewDay === dayNum
                                    ? 'bg-[#D4F826] text-black shadow-xs scale-105 ring-2 ring-black/10 dark:ring-white/20'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                {dayNum}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Option to choose active cycle if today is before paydayDay */}
                        {previewDay > 1 && autoPeriod.periodFullLabel !== thisMonthStartPeriod.periodFullLabel && (
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                              Tampilkan Siklus Periode
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                              <button
                                type="button"
                                onClick={() => setTempCycleMode('auto')}
                                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                  tempCycleMode === 'auto'
                                    ? 'bg-[#D4F826]/15 border-[#D4F826] text-gray-900 dark:text-white'
                                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                <div>
                                  <span className="text-xs font-black block">
                                    Siklus Berjalan Saat Ini ({autoPeriod.periodShortLabel})
                                  </span>
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    Hari ini masuk di siklus {autoPeriod.periodFullLabel}
                                  </span>
                                </div>
                                {tempCycleMode === 'auto' && <Check size={16} className="text-lime-600 dark:text-[#D4F826]" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => setTempCycleMode('thisMonthStart')}
                                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                  tempCycleMode === 'thisMonthStart'
                                    ? 'bg-[#D4F826]/15 border-[#D4F826] text-gray-900 dark:text-white'
                                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                <div>
                                  <span className="text-xs font-black block">
                                    Siklus Gajian Tgl {previewDay} Bulan Ini ({thisMonthStartPeriod.periodShortLabel})
                                  </span>
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    Atur budget untuk {thisMonthStartPeriod.periodFullLabel}
                                  </span>
                                </div>
                                {tempCycleMode === 'thisMonthStart' && <Check size={16} className="text-lime-600 dark:text-[#D4F826]" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* MODE PERIODE FLEKSIBEL / MANUAL (Misal Gajian Maju ke Jumat Tgl 23 -> Bulan Depan Tetap Tgl 25 = >31 Hari) */
                      <div className="space-y-3.5">
                        <div className="p-3 rounded-2xl bg-lime-500/10 dark:bg-[#D4F826]/10 border border-lime-500/30 dark:border-[#D4F826]/30 text-[11px] text-gray-700 dark:text-gray-200 leading-relaxed">
                          Cocok saat tanggal gajian bulan ini <strong>dimajukan/dimundurkan</strong> (misal Tgl 25 jatuh di hari Minggu sehingga gajian maju ke <strong>Jumat Tgl 23</strong>, sedangkan bulan depan tetap <strong>Tgl 25</strong> → durasi <strong>33 hari</strong>).
                        </div>

                        {/* Quick Scenario Presets */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                            Skenario Cepat Gajian Maju (Weekend)
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setTempPaydayDay(25);
                                setTempCustomStart(toIso(refYear, refMonth, 23));
                                setTempCustomNext(toIso(nextYear, nextMonthIdx, Math.min(25, maxDayNextMonth)));
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border ${
                                tempCustomStart.endsWith('-23') && tempCustomNext.endsWith('-25')
                                  ? 'bg-[#D4F826] text-black border-[#D4F826]'
                                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              Tgl 23 Ini → Tgl 25 Depan (Maju 2 Hari)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTempPaydayDay(25);
                                setTempCustomStart(toIso(refYear, refMonth, 24));
                                setTempCustomNext(toIso(nextYear, nextMonthIdx, Math.min(25, maxDayNextMonth)));
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border ${
                                tempCustomStart.endsWith('-24') && tempCustomNext.endsWith('-25')
                                  ? 'bg-[#D4F826] text-black border-[#D4F826]'
                                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              Tgl 24 Ini → Tgl 25 Depan (Maju 1 Hari)
                            </button>
                          </div>
                        </div>

                        {/* Input 1: Tanggal Gajian / Mulai Periode Ini */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-extrabold text-gray-700 dark:text-gray-200">
                              1. Tanggal Gajian / Mulai Periode Ini
                            </label>
                            <span className="text-[10px] font-bold text-lime-600 dark:text-[#D4F826]">
                              {formatDateWithDayName(tempCustomStart)}
                            </span>
                          </div>
                          <input
                            type="date"
                            value={tempCustomStart}
                            onChange={(e) => setTempCustomStart(e.target.value)}
                            required
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                          />
                        </div>

                        {/* Input 2: Tanggal Gajian Bulan Depan */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-extrabold text-gray-700 dark:text-gray-200">
                              2. Tanggal Gajian Bulan Depan
                            </label>
                            <span className="text-[10px] font-bold text-lime-600 dark:text-[#D4F826]">
                              {formatDateWithDayName(tempCustomNext)}
                            </span>
                          </div>
                          <input
                            type="date"
                            value={tempCustomNext}
                            min={tempCustomStart || undefined}
                            onChange={(e) => setTempCustomNext(e.target.value)}
                            required
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                          />
                          <p className="text-[10px] text-gray-400">
                            Kuota harian akan dihitung agar uang gajian cukup sampai H-1 tanggal gajian bulan depan.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Live Preview Box */}
                    <div className="p-4 rounded-2xl bg-[#121316] text-white space-y-2.5 border border-white/10">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-bold">Simulasi Periode:</span>
                        <span className="font-black text-[#D4F826]">
                          {selectedPreview.periodFullLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-bold">Durasi Siklus:</span>
                        <span className="font-extrabold text-white">
                          {selectedPreview.totalDays} Hari (cukup s/d {selectedPreview.endShortLabel})
                        </span>
                      </div>
                      {budgetConfig.estimatedIncome > 0 && (
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                          <span className="text-gray-400 font-bold">Jatah Harian Operasional:</span>
                          <span className="font-black text-[#D4F826] tabular-nums">
                            ~{formatRupiah(previewDailyQuota, hide)} / hari
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditPeriodOpen(false)}
                        className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 rounded-2xl bg-[#D4F826] text-black text-xs font-black shadow-xs cursor-pointer hover:bg-[#c6ec15]"
                      >
                        Simpan Periode
                      </button>
                    </div>
                  </form>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Ubah Kategori (0% - 100% Flexible Sliders) */}
      <AnimatePresence>
        {isEditPercentagesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    Ubah Alokasi Anggaran
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Bebas atur 0% – 100% sesuai prioritas (Total harus 100%)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditPercentagesOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  { label: '50/30/20 (Standar)', n: 50, w: 30, s: 20 },
                  { label: '80/20/0 (Fokus Utang)', n: 80, w: 20, s: 0 },
                  { label: '85/15/0 (Tanpa Nabung)', n: 85, w: 15, s: 0 },
                  { label: '100/0/0 (Full Kebutuhan)', n: 100, w: 0, s: 0 },
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
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border ${
                        isActivePreset
                          ? 'bg-[#D4F826] text-black border-[#D4F826] shadow-2xs'
                          : 'bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Sliders */}
              {(() => {
                const totalSubNeeds = needsSubs.reduce((acc, s) => acc + s.allocatedAmount, 0);
                const minNeedsPct = Math.min(100, Math.ceil((totalSubNeeds / (totalIncome || 1)) * 100));
                const isNeedsOverflow = totalIncome > 0 && (totalIncome * needsPercent) / 100 < totalSubNeeds;

                return (
                  <>
                    <div className="space-y-4 pt-1">
                      {/* Kebutuhan */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-extrabold text-violet-600 block">KEBUTUHAN</span>
                            {isNeedsOverflow && (
                              <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400">
                                Disarankan min {minNeedsPct}% ({formatRupiah(totalSubNeeds)})
                              </span>
                            )}
                          </div>
                          <div className="text-right flex items-center gap-2">
                            {needsPercent > 0 && (
                              <button
                                type="button"
                                onClick={() => setNeedsPercent(0)}
                                className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 cursor-pointer"
                              >
                                Set 0%
                              </button>
                            )}
                            <div>
                              <span className="font-black text-gray-900 dark:text-white">
                                {needsPercent}%
                              </span>
                              <span className="text-[10px] text-gray-400 block tabular-nums">
                                {formatRupiah((totalIncome * needsPercent) / 100, hide)}
                              </span>
                            </div>
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
                      </div>

                      {/* Keinginan */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-pink-500">KEINGINAN</span>
                          <div className="text-right flex items-center gap-2">
                            {wantsPercent > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const freed = wantsPercent;
                                  setWantsPercent(0);
                                  setNeedsPercent((prev) => Math.min(100 - savingsPercent, prev + freed));
                                }}
                                className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 cursor-pointer"
                                title="Jadikan 0% dan pindahkan ke Kebutuhan"
                              >
                                Set 0%
                              </button>
                            )}
                            <div>
                              <span className="font-black text-gray-900 dark:text-white">
                                {wantsPercent}%
                              </span>
                              <span className="text-[10px] text-gray-400 block tabular-nums">
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
                      </div>

                      {/* Tabungan */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-teal-500">TABUNGAN</span>
                          <div className="text-right flex items-center gap-2">
                            {savingsPercent > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const freed = savingsPercent;
                                  setSavingsPercent(0);
                                  setNeedsPercent((prev) => Math.min(100 - wantsPercent, prev + freed));
                                }}
                                className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 cursor-pointer"
                                title="Jadikan 0% dan pindahkan ke Kebutuhan"
                              >
                                Set 0%
                              </button>
                            )}
                            <div>
                              <span className="font-black text-gray-900 dark:text-white">
                                {savingsPercent}%
                              </span>
                              <span className="text-[10px] text-gray-400 block tabular-nums">
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
                      </div>
                    </div>

                    {/* Total indicator */}
                    <div className="text-center pt-2">
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full ${
                          totalPercentage === 100
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        TOTAL: {totalPercentage}% / 100%
                      </span>
                      {totalPercentage !== 100 ? (
                        <p className="text-[11px] text-red-500 mt-1 font-semibold">
                          Pastikan total 100% (kurang/lebih {Math.abs(100 - totalPercentage)}%)
                        </p>
                      ) : isNeedsOverflow ? (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40 text-left">
                          Catatan: Total sub-kategori Kebutuhan ({formatRupiah(totalSubNeeds)}) lebih besar dari batas alokasi ({formatRupiah((totalIncome * needsPercent) / 100)}). Anda tetap bisa menyimpan alokasi ini.
                        </p>
                      ) : null}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditPercentagesOpen(false)}
                        className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={totalPercentage !== 100}
                        onClick={handleSavePercentages}
                        className="flex-1 py-3 rounded-2xl bg-[#D4F826] disabled:opacity-50 text-black text-xs font-black shadow-xs cursor-pointer hover:bg-[#c6ec15]"
                      >
                        Simpan
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Tambah Subkategori */}
      <AnimatePresence>
        {isAddSubOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  {editingSubId ? 'Edit Subkategori' : 'Tambah Subkategori'} ({targetGroup.toUpperCase()})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddSubOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubcategory} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">
                    Nama Subkategori
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="e.g. Netflix, Wifi, Bensin"
                      required
                      className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="w-14 h-12 flex flex-col items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#D4F826] transition-all cursor-pointer group shrink-0 active:scale-95"
                      title="Pilih Icon / Emoticon"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform leading-none">{newSubEmoji || '📦'}</span>
                      <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 leading-none mt-0.5">Icon</span>
                    </button>
                  </div>
                </div>

                {/* Quick Icon Selector */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    <span>Pilihan Icon:</span>
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="text-[11px] font-black text-lime-600 dark:text-[#D4F826] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Smile size={13} />
                      <span>Banyak Pilihan</span>
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
                            ? 'bg-[#D4F826] text-black shadow-xs scale-110 ring-2 ring-black dark:ring-white font-black'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
                        }`}
                        title={`Pilih ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Jumlah Alokasi (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newSubAmount}
                    onChange={(e) => setNewSubAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 200.000"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Jatuh Tempo (Opsional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newSubDueDay}
                    onChange={(e) => setNewSubDueDay(e.target.value)}
                    placeholder="Hari (1-31)"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                {targetGroup === 'kebutuhan' && !newSubDueDay && (
                  <button
                    type="button"
                    onClick={() => setNewSubIsGrocery((v) => !v)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      newSubIsGrocery
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-extrabold block">
                        🛍️ Pos Keperluan Pribadi (Tidak Dibebankan Kuota Harian)
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        Anggaran tidak dibagi harian (untuk belanja bulanan, amplop, keperluan pribadi)
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                        newSubIsGrocery
                          ? 'bg-amber-400 border-amber-500 text-black'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {newSubIsGrocery && <Check size={13} strokeWidth={3} />}
                    </div>
                  </button>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSubOpen(false)}
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

      {/* Modal: Simulasi & Konsep Kuota Harian Mengikuti Sisa Keperluan Pribadi */}
      <AnimatePresence>
        {isFoodModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full">
                    KONSEP FLEKSIBEL: MENGIKUTI SISA SALDO POS HARIAN
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white mt-1">
                    Keperluan Pribadi (Tidak Dibebankan Kuota Harian)
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Semua pengeluaran yang tidak dibebankan ke jatah harian (seperti belanja bulanan, amplop nikahan, ngado, sedekah, dll) digabung dalam 1 menu <strong>Keperluan Pribadi</strong> — <strong>mengurangi saldo pos harian & otomatis menyesuaikan kuota harian!</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFoodModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {(() => {
                const basePool = Math.max(
                  0,
                  dashboardSummary.remainingVariableBudget + dashboardSummary.todayVariableExpense
                );
                const daysLeft = Math.max(1, budgetPeriod.daysRemainingUntilPayday);
                const nextWeekDaysLeft = Math.max(1, daysLeft - 7);

                const shopToday = Math.max(0, parseNominalInput(tempGroceryBudgetInput));
                const shopNextWeek = Math.max(0, parseNominalInput(tempEatOutBudgetInput));

                const currentDailyQuota = dashboardSummary.dailyBudgetQuota;
                const poolAfterTodayShop = Math.max(0, basePool - shopToday);
                const dailyQuotaAfterTodayShop = Math.round(poolAfterTodayShop / daysLeft);

                const poolAfterNextWeekShop = Math.max(0, poolAfterTodayShop - shopNextWeek);
                const dailyQuotaAfterNextWeekShop = Math.round(poolAfterNextWeekShop / nextWeekDaysLeft);
                const totalPersonalSpent =
                  (dashboardSummary.monthlyGroceryExpense || 0) +
                  (dashboardSummary.monthlyNonDailyExpense || 0);

                return (
                  <div className="space-y-4">
                    {/* Status Riil Saat Ini */}
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400 font-bold">
                          Pagu Operasional (Di Luar Tagihan Rutin):
                        </span>
                        <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
                          {formatRupiah(dashboardSummary.monthlyGroceryBudget, hide)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400 font-bold">
                          Sudah Dipakai Keperluan Pribadi (🛍️):
                        </span>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                          -{formatRupiah(totalPersonalSpent, hide)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400 font-bold">
                          Sudah Dipakai Harian (🥪 Makan Luar/Bensin):
                        </span>
                        <span className="font-extrabold text-gray-800 dark:text-gray-200 tabular-nums">
                          -{formatRupiah(dashboardSummary.monthlyVariableExpense, hide)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                        <span className="font-black text-gray-900 dark:text-white">
                          Sisa Saldo Pos Harian ({daysLeft} hari s/d gajian):
                        </span>
                        <span className="font-black text-emerald-600 dark:text-[#D4F826] text-sm tabular-nums">
                          {formatRupiah(dashboardSummary.remainingVariableBudget, hide)} (~{formatRupiah(currentDailyQuota, hide)}/hari)
                        </span>
                      </div>
                    </div>

                    {/* Simulator Interaktif */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                        Simulasi Jika Ada Pengeluaran Keperluan Pribadi:
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Tahap 1: Hari Ini */}
                        <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 space-y-1.5">
                          <label className="text-[11px] font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <span>🛍️</span>
                            <span>Misal Hari Ini Keluar:</span>
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={tempGroceryBudgetInput}
                            onChange={(e) => setTempGroceryBudgetInput(formatNominalInput(e.target.value))}
                            placeholder="1.000.000"
                            className="w-full p-2.5 bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-700 rounded-xl text-sm font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 tabular-nums"
                          />
                          <div className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold space-y-0.5 pt-0.5">
                            <div className="flex justify-between">
                              <span>Sisa saldo:</span>
                              <strong className="tabular-nums">{formatRupiah(poolAfterTodayShop, hide)}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Kuota harian baru:</span>
                              <strong className="tabular-nums">~{formatRupiah(dailyQuotaAfterTodayShop, hide)}/hr</strong>
                            </div>
                          </div>
                        </div>

                        {/* Tahap 2: Minggu Depan */}
                        <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/50 space-y-1.5">
                          <label className="text-[11px] font-black text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                            <span>🛍️</span>
                            <span>Minggu Depan Keluar Lagi:</span>
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={tempEatOutBudgetInput}
                            onChange={(e) => setTempEatOutBudgetInput(formatNominalInput(e.target.value))}
                            placeholder="500.000"
                            className="w-full p-2.5 bg-white dark:bg-gray-900 border border-sky-300 dark:border-sky-700 rounded-xl text-sm font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-400 tabular-nums"
                          />
                          <div className="text-[10px] text-sky-800 dark:text-sky-300 font-semibold space-y-0.5 pt-0.5">
                            <div className="flex justify-between">
                              <span>Sisa saldo lagi:</span>
                              <strong className="tabular-nums">{formatRupiah(poolAfterNextWeekShop, hide)}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Kuota harian ikut turun:</span>
                              <strong className="tabular-nums">~{formatRupiah(dailyQuotaAfterNextWeekShop, hide)}/hr</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cara Kerja di Aplikasi */}
                    <div className="p-3.5 rounded-2xl bg-[#121316] text-white space-y-2 border border-white/10 text-[11px] leading-relaxed">
                      <div className="font-black text-[#D4F826] flex items-center gap-1.5">
                        <span>💡</span>
                        <span>Bagaimana Cara Mencatatnya?</span>
                      </div>
                      <ul className="space-y-1.5 text-gray-300 list-disc pl-4">
                        <li>
                          Saat ada pengeluaran yang tidak dibebankan ke kuota harian (misal belanja bulanan, amplop nikahan, ngado, dll), klik <strong>+ Catat</strong> lalu pilih <strong>🛍️ Keperluan Pribadi</strong>.
                        </li>
                        <li>
                          Pengeluaran tersebut <strong>tidak bikin kuota makan/harian hari ini merah/jebol</strong>, melainkan mengurangi <strong>Sisa Saldo Pos Harian</strong> sehingga <strong>Kuota Harian otomatis menyesuaikan sisa saldo</strong>.
                        </li>
                        <li>
                          Untuk pengeluaran operasional harian (beli makan luar, jajan, bensin), pilih <strong>🥪 Makan Luar / Harian</strong> — otomatis memotong kuota harian hari ini.
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsFoodModalOpen(false)}
                        className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        Tutup
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFoodModalOpen(false);
                          openAddTransaction('expense');
                        }}
                        className="flex-1 py-3 px-4 rounded-2xl bg-[#D4F826] text-black text-xs font-black shadow-xs cursor-pointer hover:bg-[#c6ec15] flex items-center justify-center gap-1.5"
                      >
                        <span>🛍️</span>
                        <span>+ Catat Keperluan Pribadi</span>
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
        title="Pilih Icon Subkategori"
      />
    </div>
  );
}
