'use client';

import React, { useState, useMemo } from 'react';
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
  Sparkles,
  Wallet,
  ArrowUpRight,
  RotateCcw,
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
  parseLocalDay,
  resolveEffectivePeriodIncome,
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

  // Simulasi Keperluan Pribadi Modal state
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
  const [showDebtSection, setShowDebtSection] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showFixedPos, setShowFixedPos] = useState(false);
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

  // Group limits (resolved accurately per active budget period)
  const { effectiveIncome: totalIncome, periodRecordedIncome } = useMemo(
    () => resolveEffectivePeriodIncome(budgetConfig, transactions, budgetPeriod),
    [budgetConfig, transactions, budgetPeriod]
  );
  const isManualIncomeOverride =
    Boolean(
      budgetConfig?.settings?.manualIncomePeriodKey &&
        budgetConfig.settings.manualIncomePeriodKey === budgetPeriod.periodKey
    ) && totalIncome !== periodRecordedIncome;

  const needsLimit = Math.round((totalIncome * budgetConfig.needsPercent) / 100);
  const wantsLimit = Math.round((totalIncome * budgetConfig.wantsPercent) / 100);
  const savingsLimit = Math.round((totalIncome * budgetConfig.savingsPercent) / 100);

  // Merge subcategories with payable debts scheduled for this budget period
  const effectiveSubcategories = useMemo<BudgetSubcategory[]>(() => {
    const base = [...(budgetConfig.subcategories || [])];
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

    const catMap = new Map<string, { name: string; group?: BudgetGroup; emoji?: string }>(
      categories.map((c) => [c.id, { name: c.name.toLowerCase(), group: c.budgetGroup, emoji: c.emoji }])
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
          const catInfo = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
          const catName = catInfo?.name || '';
          const txGroup: BudgetGroup =
            tx.expenseNature === 'savings'
              ? 'tabungan'
              : (tx.budgetGroup as BudgetGroup) || catInfo?.group || 'kebutuhan';

          const cleanTxNote = (tx.note || '')
            .toLowerCase()
            .replace(
              /\(otomatis rutin\)|\(rutin\)|\(langganan\)|\(bulanan\)|bayar cicilan utang:|cicilan utang:/gi,
              ''
            )
            .trim();
          const rawTxNote = (tx.note || '').toLowerCase().trim();

          // 1. Try matching subcategory in the same budget group first
          let matchSub = effectiveSubcategories.find((s) => {
            if (txGroup && s.group !== txGroup) return false;

            const subNameLower = s.name.toLowerCase().trim();
            const cleanSubName = subNameLower.replace(/^cicilan\s+/i, '').trim();

            // A. Direct ID match (e.g. sub-makan vs cat-makan)
            if (tx.categoryId && s.id.replace('sub-', '') === tx.categoryId.replace('cat-', '')) {
              return true;
            }

            // B. Note matches subcategory name
            if (subNameLower) {
              if (
                cleanTxNote === subNameLower ||
                (cleanSubName.length >= 3 && cleanTxNote.includes(cleanSubName)) ||
                (subNameLower.length >= 3 &&
                  (rawTxNote.includes(subNameLower) || cleanTxNote.includes(subNameLower))) ||
                (cleanTxNote.length >= 4 && subNameLower.includes(cleanTxNote))
              ) {
                return true;
              }

              // C. Keyword overlap
              const subWords = subNameLower
                .split(/[\s&/,-]+/)
                .filter((w) => w.length >= 3 && w !== 'cicilan');
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

            // E. Synonym matches for common Indonesian categories
            if (
              (tx.categoryId === 'cat-transport' || /transport|bensin|parkir|ojol|tol/i.test(catName)) &&
              /bensin|transport|parkir|ojol|bbm|kendaraan/i.test(subNameLower)
            ) {
              return true;
            }
            if (
              (tx.categoryId === 'cat-makan' || /makan|minum|kuliner/i.test(catName)) &&
              !isGrocerySubcategory(s) &&
              /makan|minum|jajan|konsumsi/i.test(subNameLower)
            ) {
              return true;
            }
            if (
              (tx.categoryId === 'cat-kuota' || /kuota|internet|wifi|pulsa/i.test(catName)) &&
              /wifi|wi-fi|internet|kuota|pulsa/i.test(subNameLower)
            ) {
              return true;
            }
            if (
              (tx.categoryId === 'cat-listrik' || /listrik|pln|token/i.test(catName)) &&
              /listrik|pln|token/i.test(subNameLower)
            ) {
              return true;
            }
            if (
              txGroup === 'tabungan' &&
              (tx.categoryId === 'cat-tabungan' ||
                tx.categoryId === 'cat-investasi' ||
                /tabung|nabung|simpan|investasi/i.test(catName)) &&
              /nabung|tabung|darurat|simpan|investasi/i.test(subNameLower)
            ) {
              return true;
            }
            if (
              (tx.expenseNature === 'grocery' ||
                tx.expenseNature === 'non_daily' ||
                tx.categoryId === 'cat-belanja-bulanan' ||
                tx.categoryId === 'cat-kondangan') &&
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
                (subNameLower.length >= 3 &&
                  (rawTxNote.includes(subNameLower) || cleanTxNote.includes(subNameLower))) ||
                (cleanTxNote.length >= 4 && subNameLower.includes(cleanTxNote))
              ) {
                return true;
              }
              const subWords = subNameLower
                .split(/[\s&/,-]+/)
                .filter((w) => w.length >= 3 && w !== 'cicilan');
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

    // Also include payable debt payments recorded in DebtTab during this period that did not create a wallet transaction
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

  // Format percentage helper so small positive values (e.g. 0.4%) don't display as 0%
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
    updateBudgetConfig({
      estimatedIncome: val,
      settings: {
        ...(budgetConfig.settings || {}),
        manualIncomePeriodKey:
          periodRecordedIncome > 0 && val === periodRecordedIncome ? '' : budgetPeriod.periodKey,
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

  // Auto-balance helper for percentage sliders
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

  // Open Simulasi & Konsep Belanja Bulanan Fleksibel modal
  const openFoodLifestyleModal = () => {
    setTempGroceryBudgetInput(formatNominalInput(1000000));
    setTempEatOutBudgetInput(formatNominalInput(500000));
    setIsFoodModalOpen(true);
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

  const openAddForGroup = (
    group: BudgetGroup,
    prefill?: { name?: string; amount?: number; emoji?: string; isGrocery?: boolean }
  ) => {
    setEditingSubId(null);
    setTargetGroup(group);
    setNewSubName(prefill?.name || '');
    setNewSubAmount(prefill?.amount ? formatNominalInput(prefill.amount) : '');
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
    setNewSubIsGrocery(Boolean(sub.isGroceryStock || isGrocerySubcategory(sub)));
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
      sectionBarColor,
      itemBarColor,
      subs,
      groupSpent,
      groupLimit,
      rawGroupLimit,
      deductedDebtAmount = 0,
      spentLabel = 'TERPAKAI',
    } = params;

    const isCollapsed = collapsedGroups[group];
    const isZeroAllocationGroup = groupPercent === 0 || (groupLimit === 0 && totalIncome > 0);
    const groupSpentPct =
      groupLimit > 0
        ? Math.min(100, Math.round((groupSpent / groupLimit) * 100))
        : groupSpent > 0
        ? 100
        : 0;
    const isNearOrOverLimit = groupLimit > 0 && groupSpentPct >= 85;
    const isGroupOver =
      (groupLimit > 0 && groupSpent > groupLimit) || (groupLimit === 0 && groupSpent > 0);
    const groupOverAmount = Math.max(0, groupSpent - groupLimit);

    const groupAllocated = subs.reduce((sum, s) => sum + (Number(s.allocatedAmount) || 0), 0);
    const allocPct = groupLimit > 0 ? Math.round((groupAllocated / groupLimit) * 100) : 0;
    const remainingUnallocated = groupLimit - groupAllocated;
    const unmappedItems = unallocatedGroupItems[group] || [];
    const unmappedSpent = unallocatedGroupSpent[group] || 0;

    return (
      <section className="rounded-[26px] bg-white dark:bg-[#12141A] border border-gray-200/80 dark:border-gray-800/80 p-4 sm:p-6 shadow-xs space-y-4 transition-all">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <span>{title}</span>
                <span className={`text-xs font-extrabold tabular-nums ${accentTextClass}`}>
                  ({groupPercent}%)
                </span>
              </h3>

              {isZeroAllocationGroup && groupSpent === 0 && (
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                  · Alokasi 0% Periode Ini
                </span>
              )}

              {isGroupOver && (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-600 dark:text-rose-400">
                  <AlertTriangle size={12} className="shrink-0 text-rose-500" />
                  <span>Melebihi +{formatRupiah(groupOverAmount, hide)}</span>
                </span>
              )}

              <span
                className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-help transition-colors"
                title={tooltip}
              >
                <HelpCircle size={14} />
              </span>
            </div>

            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
              {subtitle}
              {deductedDebtAmount > 0 && rawGroupLimit !== undefined && (
                <span className="text-gray-400 dark:text-gray-500">
                  {' '}
                  · Pagu {formatRupiah(rawGroupLimit, hide)} dikurangi Cicilan{' '}
                  {formatRupiah(deductedDebtAmount, hide)}
                </span>
              )}
            </p>
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
              className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800/90 hover:bg-gray-200 dark:hover:bg-gray-700 text-[11px] font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal size={12} />
              <span>Ubah Porsi</span>
            </button>

            <button
              type="button"
              onClick={() => openAddForGroup(group)}
              className="px-3 py-1.5 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Subkategori</span>
            </button>

            <button
              type="button"
              onClick={() => toggleGroupCollapse(group)}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors"
              title={isCollapsed ? 'Tampilkan' : 'Sembunyikan'}
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>

        {/* Section-Level Full-Width Progress Bar & Summary Metrics */}
        <div className="space-y-2 pt-1">
          <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800/90 overflow-hidden">
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

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold tabular-nums">
            <div className="flex items-center gap-2">
              <span
                className={
                  isGroupOver
                    ? 'text-rose-600 dark:text-rose-400 font-black flex items-center gap-1'
                    : 'text-gray-600 dark:text-gray-300'
                }
              >
                {isGroupOver && <AlertTriangle size={12} className="shrink-0 text-rose-500" />}
                <span>
                  {spentLabel}:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {formatRupiah(groupSpent, hide)}
                  </strong>
                </span>
              </span>
              <span className="text-gray-400">·</span>
              <span className={isGroupOver ? 'text-rose-500 font-black' : accentTextClass}>
                {groupLimit > 0
                  ? `${formatPctLabel(groupSpent, groupLimit)} dari batas`
                  : groupSpent > 0
                  ? 'Batas Rp0 (0%)'
                  : '0%'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <span>
                Batas:{' '}
                <strong className="text-gray-900 dark:text-white">
                  {formatRupiah(groupLimit, hide)}
                </strong>
              </span>
              {groupLimit > groupSpent && (
                <>
                  <span className="text-gray-300 dark:text-gray-700">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    Sisa {formatRupiah(groupLimit - groupSpent, hide)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Zero-Allocation Notice if user set 0% for this group */}
            {isZeroAllocationGroup && groupSpent === 0 ? (
              <div className="rounded-2xl bg-gray-50 dark:bg-[#171A21] border border-dashed border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-gray-700 dark:text-gray-200">
                    Pos {title} Diatur 0% pada Periode Ini
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Anda menonaktifkan alokasi {title.toLowerCase()} bulan ini (Rp0). Target subkategori di bawah tidak dibebankan ke anggaran aktif.
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
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-400 text-xs font-extrabold text-gray-800 dark:text-gray-200 cursor-pointer transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
                >
                  Aktifkan Alokasi %
                </button>
              </div>
            ) : null}

            {/* 2-Column Subcategory Cards Grid */}
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
                        ? 'border-[#D4F826] bg-gray-50/60 dark:bg-[#181B22]'
                        : isOver
                        ? 'border-rose-400/80 dark:border-rose-600/70 bg-rose-50/30 dark:bg-rose-950/20'
                        : 'border-gray-200/75 dark:border-gray-800/90 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/40 dark:bg-[#161920]'
                    }`}
                  >
                    {/* Left Emoji Icon */}
                    <div
                      onClick={() => openEditSub(sub)}
                      className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1E222B] border border-gray-200/60 dark:border-gray-800 flex items-center justify-center text-2xl shrink-0 select-none cursor-pointer hover:scale-105 transition-transform"
                      title="Klik untuk edit subkategori"
                    >
                      {sub.emoji}
                    </div>

                    {/* Center Info + Bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              onClick={() => openEditSub(sub)}
                              className={`text-[13px] font-extrabold truncate cursor-pointer hover:underline ${
                                isOver
                                  ? 'text-rose-950 dark:text-rose-100'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {sub.name}
                            </span>
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
                            {isGrocerySubcategory(sub) &&
                              !sub.dueDateDay &&
                              !sub.subscriptionId && (
                                <button
                                  type="button"
                                  onClick={openFoodLifestyleModal}
                                  className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0 cursor-pointer transition-colors"
                                  title="Pos Keperluan Pribadi (Tidak dibebankan kuota harian)"
                                >
                                  · Keperluan Pribadi
                                </button>
                              )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[13px] font-black tabular-nums ${
                              isOver
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {formatRupiah(spent, hide)}
                          </span>

                          {/* Right 3-Dots Action Button */}
                          <button
                            type="button"
                            onClick={() => setActiveMenuSubId(isMenuOpen ? null : sub.id)}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                              isMenuOpen
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                                : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800'
                            }`}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Subcategory Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-gray-200/80 dark:bg-gray-800 overflow-hidden">
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
                      <div className="flex items-center justify-between mt-2 gap-2 text-[11px] tabular-nums">
                        {isOver ? (
                          <span className="font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertTriangle size={11} className="shrink-0 text-rose-500" />
                            <span>
                              Lewat +{formatRupiah(overAmount, hide)} ({rawPct}%)
                            </span>
                          </span>
                        ) : rawPct >= 85 ? (
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            Sisa {formatRupiah(Math.max(0, sub.allocatedAmount - spent), hide)} (
                            {rawPct}%)
                          </span>
                        ) : (
                          <span className="font-medium text-gray-500 dark:text-gray-400">
                            Sisa {formatRupiah(Math.max(0, sub.allocatedAmount - spent), hide)} (
                            {formatPctLabel(spent, sub.allocatedAmount)})
                          </span>
                        )}

                        <span className="font-semibold text-gray-400 dark:text-gray-500 shrink-0">
                          Pagu {formatRupiah(sub.allocatedAmount, hide)}
                        </span>
                      </div>
                    </div>

                    {/* Subcategory Menu Dropdown */}
                    {isMenuOpen && (
                      <div className="absolute right-4 top-12 z-30 bg-white dark:bg-[#1E2026] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-1.5 min-w-[140px] text-xs font-bold space-y-1">
                        <button
                          type="button"
                          onClick={() => openEditSub(sub)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center gap-2 cursor-pointer"
                        >
                          <Pencil size={12} />
                          <span>Edit Pagu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteBudgetSubcategory(sub.id);
                            setActiveMenuSubId(null);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Transparent Card for Unmapped Expenses in this Group so Total Always Matches 100% */}
              {unmappedSpent > 0 && (
                <div className="rounded-2xl p-4 border border-dashed border-amber-400/70 dark:border-amber-500/50 bg-amber-50/40 dark:bg-amber-950/15 flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-xl shrink-0">
                    🧾
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[13px] font-extrabold text-gray-900 dark:text-white block">
                          Pengeluaran Lainnya ({title})
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block">
                          Transaksi tercatat yang belum punya subkategori khusus
                        </span>
                      </div>
                      <span className="text-[13px] font-black text-amber-600 dark:text-amber-400 tabular-nums shrink-0">
                        {formatRupiah(unmappedSpent, hide)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] text-gray-600 dark:text-gray-300">
                      {unmappedItems.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="tabular-nums">
                          {idx > 0 ? '· ' : ''}
                          {item.emoji} {item.label} ({formatRupiah(item.amount, hide)})
                        </span>
                      ))}
                    </div>

                    {unmappedItems.length > 0 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            openAddForGroup(group, {
                              name: unmappedItems[0].label,
                              amount: unmappedSpent,
                              emoji: unmappedItems[0].emoji,
                              isGrocery: unmappedItems[0].isPersonalNeed,
                            })
                          }
                          className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>Jadikan Subkategori ({unmappedItems[0].label})</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Allocation Footer Status Bar (Only shown when group has active > 0 limit) */}
            {!isZeroAllocationGroup && (
              <div
                className={`rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border ${accentBgSoftClass} ${accentBorderClass}`}
              >
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                  <span>
                    {remainingUnallocated === 0 && groupLimit > 0
                      ? `Alokasi subkategori pas 100% dari batas ${title}`
                      : remainingUnallocated < 0
                      ? `Total pagu subkategori (${formatRupiah(
                          groupAllocated,
                          hide
                        )}) melebihi batas ${title} (${allocPct}%)`
                      : `Teralokasi ${formatRupiah(
                          groupAllocated,
                          hide
                        )} (${allocPct}%) · Sisa pagu belum dialokasikan:`}
                  </span>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <span
                    className={`text-xs font-black tabular-nums ${
                      remainingUnallocated < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-gray-900 dark:text-white'
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
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-400 text-[10px] font-extrabold text-gray-800 dark:text-gray-200 cursor-pointer transition-colors whitespace-nowrap"
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
    <div className="space-y-5 lg:space-y-6 pb-28 lg:pb-10">
      {/* Top Header with Quick Actions */}
      <div className="pt-2 lg:pt-0 px-1 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Atur Budget
          </h1>
          <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Rencanakan porsi pengeluaran rutin, keperluan pribadi, dan kuota harian sampai gajian berikutnya.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={openFoodLifestyleModal}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#16181D] border border-gray-200 dark:border-gray-800 hover:border-amber-400 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <span>🛍️</span>
            <span>Simulasi Keperluan Pribadi</span>
          </button>

          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              showArchived
                ? 'bg-gray-900 text-white dark:bg-white dark:text-black border-transparent'
                : 'bg-white dark:bg-[#16181D] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
            }`}
          >
            <Eye size={13} />
            <span>{showArchived ? 'Sembunyikan Arsip' : 'Arsip Dijeda'}</span>
          </button>
        </div>
      </div>

      {/* Full-Width Dark Hero Card */}
      <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] rounded-[28px] lg:rounded-[32px] p-5 sm:p-6 lg:px-8 lg:py-7 text-white shadow-xl space-y-5 border border-white/10">
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-[#8B5CF6]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-[#D4F826]/10 blur-3xl pointer-events-none" />

        {/* Row 1: Income & Period Controls */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          {/* Left: Basis Pemasukan Periode Ini */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold text-[#D4F826] uppercase tracking-wider">
                Basis Pemasukan Periode Ini
              </span>
              <span className="text-[11px] text-gray-400">·</span>
              <span className="text-[11px] font-semibold text-gray-300">
                {isManualIncomeOverride
                  ? 'Target Manual'
                  : periodRecordedIncome > 0
                  ? 'Otomatis dari Transaksi Pemasukan'
                  : 'Estimasi Awal'}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight tabular-nums text-white leading-none">
                {formatRupiah(totalIncome, hide)}
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempIncomeInput(formatNominalInput(totalIncome));
                  setIsEditIncomeOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-gray-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Ubah Perkiraan Pemasukan"
              >
                <Pencil size={13} />
                <span>Ubah</span>
              </button>
            </div>

            {periodRecordedIncome > 0 && totalIncome !== periodRecordedIncome && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-xs text-gray-300 tabular-nums">
                  Pemasukan tercatat di transaksi:{' '}
                  <strong className="text-emerald-300">
                    {formatRupiah(periodRecordedIncome, hide)}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    updateBudgetConfig({
                      estimatedIncome: periodRecordedIncome,
                      settings: {
                        ...(budgetConfig.settings || {}),
                        manualIncomePeriodKey: '',
                      },
                    });
                  }}
                  className="bg-[#D4F826]/15 hover:bg-[#D4F826]/25 border border-[#D4F826]/30 px-2.5 py-1 rounded-lg text-[#D4F826] text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw size={11} />
                  <span>Ikuti Pemasukan Tercatat</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Active Period Navigation & Payday Config */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#D4F826]/15 border border-[#D4F826]/30 flex items-center justify-center text-[#D4F826] shrink-0">
                <Calendar size={15} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-300 font-semibold">
                  <span>{budgetPeriod.periodFullLabel}</span>
                  <span>·</span>
                  <span className="text-[#D4F826] font-extrabold">
                    {budgetPeriod.isCustomFlexiblePeriod
                      ? `Fleksibel ${budgetPeriod.totalDays} Hari`
                      : budgetPeriod.paydayDay === 1
                      ? 'Siklus Bulanan'
                      : `Gajian Tgl ${budgetPeriod.paydayDay}`}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 tabular-nums mt-0.5">
                  Hari ke-{budgetPeriod.currentDayOfPeriod} dari {budgetPeriod.totalDays} ·{' '}
                  <strong className="text-white">
                    {budgetPeriod.daysRemainingUntilPayday} hari menuju gajian
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
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
                  className="px-2.5 py-1 text-[10px] font-extrabold text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
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
                className="px-3 py-1.5 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black font-black text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <CalendarClock size={13} strokeWidth={2.5} />
                <span>Atur Tgl Gajian</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Visual 3-Group Allocation Bar & Summary Cards (Visible on Both Mobile & Desktop!) */}
        <div className="relative z-10 pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-gray-400">
              Komposisi Alokasi Anggaran ({budgetConfig.needsPercent}% / {budgetConfig.wantsPercent}% /{' '}
              {budgetConfig.savingsPercent}%)
            </span>
            <button
              type="button"
              onClick={() => {
                setNeedsPercent(budgetConfig.needsPercent);
                setWantsPercent(budgetConfig.wantsPercent);
                setSavingsPercent(budgetConfig.savingsPercent);
                setIsEditPercentagesOpen(true);
              }}
              className="text-[11px] font-extrabold text-[#D4F826] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal size={12} />
              <span>Atur Persentase</span>
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

          {/* 3-Column Allocation Cards (Responsive across Mobile & Desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Kebutuhan */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 flex items-center justify-between sm:block">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-violet-300">
                  Kebutuhan ({budgetConfig.needsPercent}%)
                </span>
                <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                  Terpakai {formatPctLabel(needsSpent + debtTotalSpent, needsLimit)}
                </span>
              </div>
              <div className="text-right sm:text-left sm:mt-1">
                <span className="text-sm sm:text-base font-black text-white tabular-nums block">
                  {formatRupiah(needsLimit, hide)}
                </span>
                <span className="text-[10px] text-gray-400 tabular-nums block">
                  Terpakai: {formatRupiah(needsSpent + debtTotalSpent, hide)}
                </span>
              </div>
            </div>

            {/* Keinginan */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 flex items-center justify-between sm:block">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-pink-300">
                  Keinginan ({budgetConfig.wantsPercent}%)
                </span>
                <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                  {budgetConfig.wantsPercent === 0
                    ? 'Nonaktif'
                    : `Terpakai ${formatPctLabel(wantsSpent, wantsLimit)}`}
                </span>
              </div>
              <div className="text-right sm:text-left sm:mt-1">
                <span className="text-sm sm:text-base font-black text-white tabular-nums block">
                  {formatRupiah(wantsLimit, hide)}
                </span>
                <span className="text-[10px] text-gray-400 tabular-nums block">
                  Terpakai: {formatRupiah(wantsSpent, hide)}
                </span>
              </div>
            </div>

            {/* Tabungan */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 flex items-center justify-between sm:block">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-teal-300">
                  Tabungan ({budgetConfig.savingsPercent}%)
                </span>
                <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                  {budgetConfig.savingsPercent === 0
                    ? '0% Bulan Ini'
                    : `Realisasi ${formatPctLabel(savingsSpent, savingsLimit)}`}
                </span>
              </div>
              <div className="text-right sm:text-left sm:mt-1">
                <span className="text-sm sm:text-base font-black text-white tabular-nums block">
                  {formatRupiah(savingsLimit, hide)}
                </span>
                <span className="text-[10px] text-gray-400 tabular-nums block">
                  Realisasi: {formatRupiah(savingsSpent, hide)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Pos Tagihan Bulanan (Fixed) vs Pos Harian & Keperluan Pribadi (Fleksibel) */}
        {totalIncome > 0 && (
          <div className="relative z-10 pt-3.5 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-2.5 text-xs items-start">
            {/* 1. Menu Pos Tagihan Bulanan (Fixed) */}
            <div className="h-full flex flex-col bg-white/[0.04] hover:bg-white/[0.06] rounded-2xl border border-white/10 transition-colors overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFixedPos((prev) => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between gap-2 cursor-pointer text-left"
              >
                <div className="min-w-0">
                  <span className="text-[11px] font-extrabold text-sky-300 block">
                    📅 Pos Tagihan Bulanan (Fixed)
                  </span>
                  <span className="text-[11px] text-gray-400 tabular-nums block mt-0.5">
                    Terbayar {formatRupiah(dashboardSummary.monthlyFixedExpense, hide)} dari{' '}
                    {formatRupiah(dashboardSummary.monthlyFixedBudget, hide)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs sm:text-sm text-white font-black tabular-nums">
                    {formatRupiah(dashboardSummary.monthlyFixedBudget, hide)}
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
                    transition={{ duration: 0.16 }}
                    className="overflow-hidden flex-1 flex flex-col"
                  >
                    <div className="px-4 pb-3.5 pt-2.5 border-t border-white/10 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between text-gray-300">
                        <span>Pos tagihan terjadwal:</span>
                        <span className="font-bold text-white tabular-nums">
                          {fixedSubcategories.length} pos aktif
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-gray-300">
                        <span>Sisa tagihan belum dibayar:</span>
                        <span className="font-extrabold text-sky-300 tabular-nums">
                          {dashboardSummary.monthlyFixedExpense >=
                            dashboardSummary.monthlyFixedBudget &&
                          dashboardSummary.monthlyFixedBudget > 0
                            ? 'Lunas Semua'
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

                      <div className="text-gray-400 pt-1 border-t border-white/5">
                        {fixedSubcategories.length > 0 ? (
                          <span className="text-gray-300 leading-relaxed block">
                            Rincian:{' '}
                            {fixedSubcategories
                              .map((s) => `${s.name} (${formatRupiah(s.allocatedAmount, hide)})`)
                              .join(' · ')}
                          </span>
                        ) : (
                          <span className="italic text-gray-500">
                            Belum ada alokasi tagihan berjadwal
                          </span>
                        )}
                      </div>

                      {deferredNextPeriodDebts.length > 0 && (
                        <div className="text-[10px] text-amber-300 pt-1">
                          ⏳ {deferredNextPeriodDebts.map((d) => d.name).join(', ')} dijadwalkan
                          mulai periode depan
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Menu Pos Pengeluaran Harian & Keperluan Pribadi (Fleksibel) */}
            <div className="h-full flex flex-col bg-white/[0.04] hover:bg-white/[0.06] rounded-2xl border border-white/10 transition-colors overflow-hidden">
              <button
                type="button"
                onClick={() => setShowVariablePos((prev) => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between gap-2 cursor-pointer text-left"
              >
                <div className="min-w-0">
                  <span className="text-[11px] font-extrabold text-[#D4F826] block">
                    🥪 Pos Harian & Keperluan Pribadi (Fleksibel)
                  </span>
                  <span className="text-[11px] text-gray-400 tabular-nums block mt-0.5">
                    Kuota aman: ~{formatRupiah(dashboardSummary.dailyBudgetQuota, hide)}/hari (
                    {budgetPeriod.daysRemainingUntilPayday} hari tersisa)
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs sm:text-sm text-[#D4F826] font-black tabular-nums">
                    Sisa {formatRupiah(dashboardSummary.remainingVariableBudget, hide)}
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
                    transition={{ duration: 0.16 }}
                    className="overflow-hidden flex-1 flex flex-col"
                  >
                    <div className="px-4 pb-3.5 pt-2.5 border-t border-white/10 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between text-gray-300">
                        <span>Pagu awal non-tagihan:</span>
                        <span className="font-bold text-white tabular-nums">
                          {formatRupiah(dashboardSummary.monthlyGroceryBudget, hide)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-gray-300">
                        <span>Dipakai Keperluan Pribadi (Non-Harian):</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-300 tabular-nums">
                            -
                            {formatRupiah(
                              (dashboardSummary.monthlyGroceryExpense || 0) +
                                (dashboardSummary.monthlyNonDailyExpense || 0),
                              hide
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={openFoodLifestyleModal}
                            className="text-[10px] font-extrabold text-[#D4F826] hover:underline cursor-pointer"
                          >
                            Simulasi
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-gray-300">
                        <span>Terpakai operasional harian:</span>
                        <span className="font-bold text-white tabular-nums">
                          -{formatRupiah(dashboardSummary.monthlyVariableExpense, hide)}
                        </span>
                      </div>

                      {dashboardSummary.dailyOverbudget &&
                      budgetPeriod.daysRemainingUntilPayday > 1 ? (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1 text-[10px] text-gray-200">
                          <div className="flex items-center justify-between font-extrabold text-rose-300">
                            <span>
                              Hari ini lewat +
                              {formatRupiah(dashboardSummary.dailyOverbudgetAmount, hide)}
                            </span>
                            <span className="text-amber-300 tabular-nums">
                              Besok: ~{formatRupiah(dashboardSummary.tomorrowDailyQuota, hide)}/hr
                            </span>
                          </div>
                          <p className="text-gray-300 leading-relaxed">
                            Kelebihan hari ini otomatis disesuaikan ke sisa{' '}
                            {budgetPeriod.daysRemainingUntilPayday - 1} hari ke depan agar saldo
                            tetap cukup sampai gajian.
                          </p>
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

      {/* Contextual Overbudget Alert Notification Banner */}
      {overbudgetCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800/70 rounded-[24px] p-4 sm:p-5 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  {overbudgetCategories.length} Subkategori Melebihi Pagu Anggaran
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Total kelebihan subkategori:{' '}
                  <strong className="text-rose-600 dark:text-rose-400 tabular-nums">
                    +{formatRupiah(totalOverbudgetAmount, hide)}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/40 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {overbudgetCategories.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openEditSub(item)}
                className="inline-flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200 hover:underline cursor-pointer tabular-nums"
                title="Klik untuk sesuaikan pagu subkategori ini"
              >
                {idx > 0 && <span className="text-rose-300 dark:text-rose-700 mr-1">·</span>}
                <span>{item.emoji}</span>
                <span>{item.name}:</span>
                <span className="text-rose-600 dark:text-rose-400 font-black">
                  +{formatRupiah(item.overAmount, hide)} ({item.overPct}%)
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Category Sections */}
      <div className="space-y-6">
        {renderGroupSection({
          group: 'kebutuhan',
          groupPercent: budgetConfig.needsPercent,
          title: 'Kebutuhan Pokok & Operasional',
          subtitle: 'Tagihan rutin, makan harian, transportasi, dan keperluan pribadi',
          tooltip: `Alokasi Kebutuhan Pokok & Operasional (${budgetConfig.needsPercent}%)`,
          accentTextClass: 'text-violet-600 dark:text-violet-400',
          accentBgSoftClass: 'bg-violet-50/50 dark:bg-violet-950/15',
          accentBorderClass: 'border-violet-200/60 dark:border-violet-800/40',
          sectionBarColor: 'bg-[#A594F9]',
          itemBarColor: 'bg-[#A594F9]',
          subs: showArchived ? needsSubs : needsSubs.filter((s) => s.isSubscriptionActive !== false),
          groupSpent: needsSpent,
          groupLimit: Math.max(0, needsLimit - debtTotalAllocated),
          rawGroupLimit: needsLimit,
          deductedDebtAmount: debtTotalAllocated,
          spentLabel: 'Terpakai',
        })}

        {/* Menu Terpisah: CICILAN & UTANG */}
        {(visibleDebtSubs.length > 0 || deferredNextPeriodDebts.length > 0) && (
          <section className="rounded-[26px] bg-white dark:bg-[#12141A] border border-gray-200/80 dark:border-gray-800/80 p-4 sm:p-6 shadow-xs space-y-4">
            <div
              onClick={() => setShowDebtSection((prev) => !prev)}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                    Cicilan & Kewajiban Utang
                  </h3>
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                    ({visibleDebtSubs.length} Cicilan Aktif)
                  </span>
                </div>
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Otomatis masuk Pos Tagihan Bulanan (Fixed) dan memotong pagu Kebutuhan periode ini
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('debt');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[11px] font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <span>Kelola Utang</span>
                  <ArrowUpRight size={12} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDebtSection((prev) => !prev);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <span>{showDebtSection ? 'Sembunyikan' : 'Tampilkan Rincian'}</span>
                  {showDebtSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Section Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
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
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 tabular-nums">
                <span>
                  Terbayar Periode Ini:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {formatRupiah(debtTotalSpent, hide)}
                  </strong>
                </span>
                <span>
                  Tagihan Cicilan:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {formatRupiah(debtTotalAllocated, hide)}
                  </strong>
                </span>
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
                      className="rounded-2xl p-4 border border-gray-200/75 dark:border-gray-800/90 bg-gray-50/40 dark:bg-[#161920] flex items-start gap-3.5 relative"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1E222B] border border-gray-200/60 dark:border-gray-800 flex items-center justify-center text-2xl shrink-0 select-none">
                        {sub.emoji || '💳'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="text-[13px] font-extrabold truncate text-gray-900 dark:text-white">
                              {sub.name}
                            </span>
                            {sub.dueDateDay && (
                              <span className="text-[10px] font-semibold text-gray-400">
                                · Tgl {sub.dueDateDay}
                              </span>
                            )}
                            {isPaidThisMonth && (
                              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                · Lunas Bulan Ini
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[13px] font-black tabular-nums text-gray-900 dark:text-white">
                              {formatRupiah(spent, hide)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveMenuSubId(isMenuOpen ? null : sub.id)}
                              className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 cursor-pointer text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-gray-200/80 dark:bg-gray-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isPaidThisMonth ? 'bg-emerald-500' : 'bg-amber-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between mt-2 gap-2 text-[11px] tabular-nums">
                          <span className="font-medium text-gray-500 dark:text-gray-400">
                            Sisa {formatRupiah(Math.max(0, sub.allocatedAmount - spent), hide)}
                          </span>
                          <span className="font-semibold text-gray-400 dark:text-gray-500 shrink-0">
                            Tagihan {formatRupiah(sub.allocatedAmount, hide)}
                          </span>
                        </div>
                      </div>

                      {isMenuOpen && (
                        <div className="absolute right-4 top-12 z-30 bg-white dark:bg-[#1E2026] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-1.5 min-w-[145px] text-xs font-bold space-y-1">
                          <button
                            type="button"
                            onClick={() => openEditSub(sub)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center gap-2 cursor-pointer"
                          >
                            <Pencil size={12} />
                            <span>Ubah Cicilan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuSubId(null);
                              setActiveTab('debt');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center gap-2 cursor-pointer"
                          >
                            <ArrowUpRight size={12} />
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
          subtitle: 'Hiburan, nongkrong, langganan streaming, hobi, dan belanja',
          tooltip: `Alokasi Gaya Hidup, Hiburan & Keinginan (${budgetConfig.wantsPercent}%)`,
          accentTextClass: 'text-pink-600 dark:text-pink-400',
          accentBgSoftClass: 'bg-pink-50/50 dark:bg-pink-950/15',
          accentBorderClass: 'border-pink-200/60 dark:border-pink-800/40',
          sectionBarColor: 'bg-pink-500',
          itemBarColor: 'bg-pink-400',
          subs: showArchived ? wantsSubs : wantsSubs.filter((s) => s.isSubscriptionActive !== false),
          groupSpent: wantsSpent,
          groupLimit: wantsLimit,
          spentLabel: 'Terpakai',
        })}

        {renderGroupSection({
          group: 'tabungan',
          groupPercent: budgetConfig.savingsPercent,
          title: 'Tabungan & Investasi',
          subtitle: 'Dana darurat, tabungan berjangka, dan investasi masa depan',
          tooltip: `Alokasi Dana Darurat, Tabungan & Investasi (${budgetConfig.savingsPercent}%)`,
          accentTextClass: 'text-teal-600 dark:text-teal-400',
          accentBgSoftClass: 'bg-teal-50/50 dark:bg-teal-950/15',
          accentBorderClass: 'border-teal-200/60 dark:border-teal-800/40',
          sectionBarColor: 'bg-teal-500',
          itemBarColor: 'bg-teal-400',
          subs: savingsSubs,
          groupSpent: savingsSpent,
          groupLimit: savingsLimit,
          spentLabel: 'Realisasi',
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
                  Atur Basis Pemasukan
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
                    Basis Pemasukan Periode Ini ({budgetPeriod.periodShortLabel})
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tempIncomeInput}
                    onChange={(e) => setTempIncomeInput(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 6.764.000"
                    className="w-full p-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-base font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826] tabular-nums"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                    Secara default, anggaran otomatis mengikuti total transaksi pemasukan yang tercatat pada periode aktif. Anda juga bisa menentukan target pemasukan manual di sini.
                  </p>
                </div>

                {periodRecordedIncome > 0 && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        Transaksi Pemasukan Periode Ini:
                      </span>
                      <span className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                        {formatRupiah(periodRecordedIncome)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTempIncomeInput(formatNominalInput(periodRecordedIncome))}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-gray-800 border border-emerald-500/30 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check size={13} strokeWidth={2.5} />
                      <span>Gunakan Nominal Transaksi ({formatRupiah(periodRecordedIncome)})</span>
                    </button>
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
                    {/* Mode Switcher */}
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
                          if (
                            !tempCustomStart ||
                            !tempCustomNext ||
                            tempCustomNext <= tempCustomStart
                          ) {
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
                        {isWeekendPayday && (
                          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 space-y-2">
                            <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                              💡{' '}
                              <strong>
                                Tgl {clampedRefPayday} {MONTHS_ID[refMonth]}
                              </strong>{' '}
                              jatuh di hari <strong>{DAYS_ID[thisMonthPaydayDow]}</strong>! Jika
                              gajian bulan ini dimajukan ke hari{' '}
                              <strong>Jumat Tgl {shiftedFridayDay}</strong> dan bulan depan tetap{' '}
                              <strong>Tgl {nextRegularPaydayDay}</strong>:
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
                              <span>
                                Atur Gajian Maju ke Jumat Tgl {shiftedFridayDay} (s/d{' '}
                                {nextRegularPaydayDay} {MONTHS_ID[nextMonthIdx].slice(0, 3)})
                              </span>
                            </button>
                          </div>
                        )}

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
                                className={`h-9 rounded-xl text-xs font-black transition-all cursor-pointer tabular-nums ${
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

                        {previewDay > 1 &&
                          autoPeriod.periodFullLabel !== thisMonthStartPeriod.periodFullLabel && (
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
                                  {tempCycleMode === 'auto' && (
                                    <Check size={16} className="text-lime-600 dark:text-[#D4F826]" />
                                  )}
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
                                      Siklus Gajian Tgl {previewDay} Bulan Ini (
                                      {thisMonthStartPeriod.periodShortLabel})
                                    </span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                      Atur budget untuk {thisMonthStartPeriod.periodFullLabel}
                                    </span>
                                  </div>
                                  {tempCycleMode === 'thisMonthStart' && (
                                    <Check size={16} className="text-lime-600 dark:text-[#D4F826]" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="space-y-3.5">
                        <div className="p-3 rounded-2xl bg-lime-500/10 dark:bg-[#D4F826]/10 border border-lime-500/30 dark:border-[#D4F826]/30 text-[11px] text-gray-700 dark:text-gray-200 leading-relaxed">
                          Cocok saat tanggal gajian bulan ini <strong>dimajukan/dimundurkan</strong>{' '}
                          (misal Tgl 25 jatuh di hari Minggu sehingga gajian maju ke{' '}
                          <strong>Jumat Tgl 23</strong>, sedangkan bulan depan tetap{' '}
                          <strong>Tgl 25</strong> → durasi <strong>33 hari</strong>).
                        </div>

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
                                setTempCustomNext(
                                  toIso(nextYear, nextMonthIdx, Math.min(25, maxDayNextMonth))
                                );
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
                                setTempCustomNext(
                                  toIso(nextYear, nextMonthIdx, Math.min(25, maxDayNextMonth))
                                );
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
                            Kuota harian akan dihitung agar uang gajian cukup sampai H-1 tanggal
                            gajian bulan depan.
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
                        <span className="font-extrabold text-white tabular-nums">
                          {selectedPreview.totalDays} Hari (cukup s/d {selectedPreview.endShortLabel}
                          )
                        </span>
                      </div>
                      {totalIncome > 0 && (
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

      {/* Modal: Ubah Kategori (0% - 100% Flexible Sliders + Auto-Balance) */}
      <AnimatePresence>
        {isEditPercentagesOpen && (
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
                    Ubah Porsi Alokasi Anggaran
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Bebas atur 0% – 100% sesuai kondisi bulan ini (Total harus 100%)
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
                  { label: '70/20/10 (Realistis)', n: 70, w: 20, s: 10 },
                  { label: '80/20/0 (Tanpa Nabung)', n: 80, w: 20, s: 0 },
                  { label: '85/15/0 (Fokus Kebutuhan)', n: 85, w: 15, s: 0 },
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
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border ${
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

              {(() => {
                const totalSubNeeds =
                  needsSubs.reduce((acc, s) => acc + s.allocatedAmount, 0) + debtTotalAllocated;
                const minNeedsPct = Math.min(
                  100,
                  Math.ceil((totalSubNeeds / (totalIncome || 1)) * 100)
                );
                const isNeedsOverflow =
                  totalIncome > 0 && (totalIncome * needsPercent) / 100 < totalSubNeeds;

                return (
                  <>
                    <div className="space-y-4 pt-1">
                      {/* Kebutuhan */}
                      <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-extrabold text-violet-600 dark:text-violet-400 block">
                              KEBUTUHAN POKOK & CICILAN
                            </span>
                            {isNeedsOverflow && (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                Disarankan min {minNeedsPct}% ({formatRupiah(totalSubNeeds)})
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
                              {needsPercent}%
                            </span>
                            <span className="text-[10px] text-gray-400 block tabular-nums">
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
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setNeedsPercent((p) => Math.max(0, p - 5))}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold cursor-pointer"
                            >
                              -5%
                            </button>
                            <button
                              type="button"
                              onClick={() => setNeedsPercent((p) => Math.min(100, p + 5))}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold cursor-pointer"
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
                              className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                            >
                              Pas {Math.max(0, 100 - wantsPercent - savingsPercent)}%
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Keinginan */}
                      <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-pink-500">KEINGINAN & HIBURAN</span>
                          <div className="text-right flex items-center gap-2">
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
                                className="px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 cursor-pointer"
                              >
                                Set 0%
                              </button>
                            )}
                            <div>
                              <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
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
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setWantsPercent((p) => Math.max(0, p - 5))}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold cursor-pointer"
                            >
                              -5%
                            </button>
                            <button
                              type="button"
                              onClick={() => setWantsPercent((p) => Math.min(100, p + 5))}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold cursor-pointer"
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
                                className="text-[10px] font-extrabold text-pink-500 hover:underline cursor-pointer"
                              >
                                Isi Sisa ({Math.max(0, 100 - needsPercent - savingsPercent)}%)
                              </button>
                            )}
                        </div>
                      </div>

                      {/* Tabungan */}
                      <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-teal-500">TABUNGAN & INVESTASI</span>
                          <div className="text-right flex items-center gap-2">
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
                                className="px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 cursor-pointer"
                              >
                                Set 0%
                              </button>
                            )}
                            <div>
                              <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
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
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSavingsPercent((p) => Math.max(0, p - 5))}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold cursor-pointer"
                            >
                              -5%
                            </button>
                            <button
                              type="button"
                              onClick={() => setSavingsPercent((p) => Math.min(100, p + 5))}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold cursor-pointer"
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
                                className="text-[10px] font-extrabold text-teal-500 hover:underline cursor-pointer"
                              >
                                Isi Sisa ({Math.max(0, 100 - needsPercent - wantsPercent)}%)
                              </button>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Total indicator & 1-click Auto-Balance */}
                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                          Total Alokasi:
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-black tabular-nums ${
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
                              className="px-2.5 py-1 rounded-lg bg-[#D4F826] text-black text-[10px] font-black cursor-pointer hover:bg-[#c6ec15]"
                            >
                              Seimbangkan 100%
                            </button>
                          )}
                        </div>
                      </div>

                      {totalPercentage !== 100 ? (
                        <p className="text-[11px] text-rose-500 font-semibold">
                          Total saat ini {totalPercentage}% (selisih{' '}
                          {Math.abs(100 - totalPercentage)}%). Klik &ldquo;Seimbangkan 100%&rdquo;
                          untuk merapikan otomatis.
                        </p>
                      ) : isNeedsOverflow ? (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                          Catatan: Total subkategori Kebutuhan & Cicilan (
                          {formatRupiah(totalSubNeeds)}) lebih besar dari batas {needsPercent}% (
                          {formatRupiah((totalIncome * needsPercent) / 100)}). Anda tetap dapat
                          menyimpan ini.
                        </p>
                      ) : null}
                    </div>

                    <div className="flex gap-2 pt-1">
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
                        Simpan Alokasi
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
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  {editingSubId ? 'Edit Subkategori' : 'Tambah Subkategori'} (
                  {targetGroup.toUpperCase()})
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
                      placeholder="Contoh: Listrik, Bensin, Belanja Bulanan"
                      required
                      className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="w-14 h-12 flex flex-col items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#D4F826] transition-all cursor-pointer group shrink-0"
                      title="Pilih Icon / Emoticon"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform leading-none">
                        {newSubEmoji || '📦'}
                      </span>
                      <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                        Icon
                      </span>
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
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                    Jumlah Alokasi Pagu (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newSubAmount}
                    onChange={(e) => setNewSubAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 500.000"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826] tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Tanggal Jatuh Tempo Rutin (Opsional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newSubDueDay}
                    onChange={(e) => setNewSubDueDay(e.target.value)}
                    placeholder="Kosongkan jika bukan tagihan tanggal tetap (1-31)"
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
                        Untuk belanja bulanan, amplop, atau kebutuhan non-harian
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    SIMULASI POS KEPERLUAN PRIBADI & KUOTA HARIAN
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">
                    Keperluan Pribadi (Tidak Dibebankan Kuota Harian)
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Semua pengeluaran yang tidak dibebankan ke jatah harian (seperti belanja bulanan, amplop nikahan, ngado, sedekah, dll) digabung dalam 1 menu{' '}
                    <strong>Keperluan Pribadi</strong> — mengurangi saldo pos harian & otomatis menyesuaikan kuota harian.
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
                const dailyQuotaAfterNextWeekShop = Math.round(
                  poolAfterNextWeekShop / nextWeekDaysLeft
                );
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
                          {formatRupiah(dashboardSummary.remainingVariableBudget, hide)} (~
                          {formatRupiah(currentDailyQuota, hide)}/hari)
                        </span>
                      </div>
                    </div>

                    {/* Simulator Interaktif */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                        Simulasi Jika Ada Pengeluaran Keperluan Pribadi:
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 space-y-1.5">
                          <label className="text-[11px] font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <span>🛍️</span>
                            <span>Misal Hari Ini Keluar:</span>
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={tempGroceryBudgetInput}
                            onChange={(e) =>
                              setTempGroceryBudgetInput(formatNominalInput(e.target.value))
                            }
                            placeholder="1.000.000"
                            className="w-full p-2.5 bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-700 rounded-xl text-sm font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 tabular-nums"
                          />
                          <div className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold space-y-0.5 pt-0.5">
                            <div className="flex justify-between">
                              <span>Sisa saldo:</span>
                              <strong className="tabular-nums">
                                {formatRupiah(poolAfterTodayShop, hide)}
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Kuota harian baru:</span>
                              <strong className="tabular-nums">
                                ~{formatRupiah(dailyQuotaAfterTodayShop, hide)}/hr
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/50 space-y-1.5">
                          <label className="text-[11px] font-black text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                            <span>🛍️</span>
                            <span>Minggu Depan Keluar Lagi:</span>
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={tempEatOutBudgetInput}
                            onChange={(e) =>
                              setTempEatOutBudgetInput(formatNominalInput(e.target.value))
                            }
                            placeholder="500.000"
                            className="w-full p-2.5 bg-white dark:bg-gray-900 border border-sky-300 dark:border-sky-700 rounded-xl text-sm font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-400 tabular-nums"
                          />
                          <div className="text-[10px] text-sky-800 dark:text-sky-300 font-semibold space-y-0.5 pt-0.5">
                            <div className="flex justify-between">
                              <span>Sisa saldo lagi:</span>
                              <strong className="tabular-nums">
                                {formatRupiah(poolAfterNextWeekShop, hide)}
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Kuota harian ikut turun:</span>
                              <strong className="tabular-nums">
                                ~{formatRupiah(dailyQuotaAfterNextWeekShop, hide)}/hr
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>
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
