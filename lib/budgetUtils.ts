import { BudgetConfig, Category, Debt, RecurringItem, Transaction } from './types';

// Category IDs that represent fixed monthly obligations
export const FIXED_CATEGORY_IDS = new Set([
  'cat-listrik',
  'cat-air',
  'cat-bpjs',
  'cat-kuota',
  'cat-tagihan',
  'cat-tabungan',
  'cat-investasi',
]);

// Keywords in transaction note or category name indicating a fixed monthly bill
export const FIXED_EXPENSE_KEYWORDS_REGEX =
  /(wifi|wi-fi|indihome|biznet|first media|myrepublic|my republic|iconnet|cbn|pln|token|token listrik|listrik|air pam|pdam|bpjs|asuransi|sewa|kost|kosan|kontrakan|kontrak rumah|netflix|spotify|youtube premium|disney|disney\+|hbo|apple tv|prime video|icloud|google one|canva|zoom|cicilan|angsuran|kpr|utang|tagihan|iuran|langganan|subscription|kartu kredit|credit card|paylater|bayar cicilan|pembayaran cicilan|otomatis rutin)/i;

/**
 * Normalizes a recurring subscription amount into its monthly equivalent.
 */
export function getMonthlySubscriptionAmount(
  amount: number,
  frequency: 'monthly' | 'yearly' | 'weekly'
): number {
  const val = Number(amount) || 0;
  if (frequency === 'yearly') return Math.round(val / 12);
  if (frequency === 'weekly') return val * 4;
  return val;
}

/**
 * Determines whether a transaction is a Fixed Expense (Tagihan Bulanan / Rutin)
 * or a Variable Expense (Pengeluaran Harian / Operasional seperti makan, jajan, transportasi).
 */
export function isFixedExpense(
  tx: {
    categoryId?: string | null;
    note?: string;
    expenseNature?: 'variable' | 'fixed';
  },
  category?: Category | null
): boolean {
  // 1. Explicit user designation on transaction has highest priority
  if (tx.expenseNature === 'fixed') return true;
  if (tx.expenseNature === 'variable') return false;

  // 2. Debt / installment or automated recurring subscription payments are always fixed obligations
  if (tx.note && /bayar cicilan|cicilan utang|pelunasan utang|angsuran|\(otomatis rutin\)|\(langganan\)/i.test(tx.note)) {
    return true;
  }

  // 3. Category ID matches fixed monthly bills
  if (tx.categoryId && FIXED_CATEGORY_IDS.has(tx.categoryId)) {
    return true;
  }

  // 4. Category explicit expenseNature
  if (category?.expenseNature === 'fixed') {
    return true;
  }

  // 5. Category name or group contains fixed billing keywords
  if (category?.name && FIXED_EXPENSE_KEYWORDS_REGEX.test(category.name)) {
    return true;
  }
  if (category?.groupName && /tagihan|utilitas|langganan|cicilan|kewajiban/i.test(category.groupName)) {
    return true;
  }

  // 6. Transaction note contains billing keywords (e.g. Wi-Fi, Netflix, Listrik, PLN, BPJS, Kos)
  if (tx.note && FIXED_EXPENSE_KEYWORDS_REGEX.test(tx.note)) {
    return true;
  }

  // Otherwise, default to Variable Expense (Pengeluaran Harian Operasional: makan, jajan, bensin, dll)
  return false;
}

/**
 * Auto-detect whether an input should default to 'fixed' or 'variable'
 */
export function detectExpenseNature(
  categoryId: string | null | undefined,
  note: string | undefined,
  categoryMap?: Map<string, Category>
): 'variable' | 'fixed' {
  const cat = categoryId && categoryMap ? categoryMap.get(categoryId) : undefined;
  return isFixedExpense({ categoryId, note }, cat) ? 'fixed' : 'variable';
}

export interface BudgetBreakdownResult {
  daysInMonth: number;
  monthlySpendingLimit: number;
  monthlyFixedBudget: number;
  monthlyVariableBudget: number;
  dailyBudgetQuota: number;
  todayVariableExpense: number;
  todayFixedExpense: number;
  todayTotalExpense: number;
  dailyBudgetRemaining: number;
  dailyOverbudget: boolean;
  dailyOverbudgetAmount: number;
  monthlyFixedExpense: number;
  monthlyVariableExpense: number;
  monthlyTotalExpense: number;
}

/**
 * Calculates structured monthly budget allocation and daily budget remaining.
 *
 * Rules:
 * 1. Monthly Spending Limit = Estimated Income * (Needs% + Wants%) [typically 80%].
 * 2. Monthly Fixed Budget = Sum of effective fixed subcategories (max of allocated vs realized)
 *    + any unallocated fixed expenses / debt installment payments made this month.
 *    -> Paying a debt (e.g. Rp1.000.000) this month automatically increases Monthly Fixed Budget
 *       and cuts the available Monthly Variable Budget & Daily Budget Quota!
 * 3. Monthly Variable Budget = Math.max(0, Monthly Spending Limit - Monthly Fixed Budget).
 * 4. Daily Budget Quota = Math.round(Monthly Variable Budget / DaysInMonth).
 * 5. Daily Budget Remaining = Math.max(0, Effective Daily Quota - Today's Variable Expenses).
 */
export function calculateBudgetBreakdown({
  budgetConfig,
  transactions,
  categoryMap,
  activeYear,
  activeMonth,
  activeDay,
  subscriptions = [],
  debts = [],
}: {
  budgetConfig: BudgetConfig;
  transactions: Transaction[];
  categoryMap: Map<string, Category>;
  activeYear: number;
  activeMonth: number;
  activeDay: number;
  subscriptions?: RecurringItem[];
  debts?: Debt[];
}): BudgetBreakdownResult {
  const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
  const estIncome = typeof budgetConfig?.estimatedIncome === 'number' ? budgetConfig.estimatedIncome : 0;

  // 1. Total spending limit: Needs (50%) + Wants (30%)
  const monthlySpendingLimit = Math.round(
    (estIncome * ((budgetConfig?.needsPercent || 50) + (budgetConfig?.wantsPercent || 30))) / 100
  );

  // Build lookup of expense subscriptions
  const expenseSubscriptions = subscriptions.filter((s) => s.type === 'expense');

  // 2. Identify active fixed subcategories from Needs & Wants in budgetConfig (exclude 'tabungan' which has its own 20% bucket)
  const activeFixedSubs: { id: string; name: string; allocatedAmount: number }[] = [];
  if (budgetConfig?.subcategories && budgetConfig.subcategories.length > 0) {
    budgetConfig.subcategories.forEach((sub) => {
      if (sub.group === 'tabungan') return;

      const subNameLower = sub.name.toLowerCase().trim();
      const linkedSub = expenseSubscriptions.find(
        (rec) =>
          rec.id === sub.subscriptionId ||
          rec.subcategoryId === sub.id ||
          rec.name.toLowerCase().trim() === subNameLower
      );

      if (linkedSub) {
        if (!linkedSub.isActive) return;
      } else if (sub.isSubscriptionActive === false) {
        return;
      }

      const isSubFixed =
        Boolean(sub.dueDateDay) ||
        Boolean(sub.subscriptionId) ||
        Boolean(linkedSub) ||
        sub.id.startsWith('sub-debt-') ||
        FIXED_CATEGORY_IDS.has(sub.id.replace('sub-', 'cat-')) ||
        FIXED_EXPENSE_KEYWORDS_REGEX.test(sub.name);
      if (isSubFixed) {
        activeFixedSubs.push({
          id: sub.id,
          name: sub.name,
          allocatedAmount: Number(sub.allocatedAmount) || 0,
        });
      }
    });
  }

  // Helper to match a fixed expense note/category to one of activeFixedSubs
  const fixedSubSpentMap: Record<string, number> = {};
  let unallocatedFixedExp = 0;

  const matchFixedSubcategory = (noteStr: string, catNameStr: string, categoryId?: string | null) => {
    const cleanNote = noteStr
      .toLowerCase()
      .replace(/\(otomatis rutin\)|\(rutin\)|\(langganan\)|\(bulanan\)|bayar cicilan utang:|cicilan utang:/gi, '')
      .trim();
    const rawNote = noteStr.toLowerCase().trim();

    return activeFixedSubs.find((s) => {
      const subNameLower = s.name.toLowerCase().trim();
      const cleanSubName = subNameLower.replace(/^cicilan\s+/i, '').trim();
      if (categoryId && s.id.replace('sub-', '') === categoryId.replace('cat-', '')) {
        return true;
      }
      if (
        cleanNote === subNameLower ||
        (cleanSubName && cleanNote.includes(cleanSubName)) ||
        rawNote.includes(subNameLower) ||
        cleanNote.includes(subNameLower) ||
        (cleanNote && subNameLower.includes(cleanNote))
      ) {
        return true;
      }
      const subWords = subNameLower.split(/[\s&/,-]+/).filter((w) => w.length >= 3 && w !== 'cicilan');
      const noteWords = cleanNote.split(/[\s&/,-]+/).filter((w) => w.length >= 3);
      if (subWords.length > 0 && noteWords.length > 0) {
        if (subWords.some((sw) => noteWords.some((nw) => nw === sw || nw.includes(sw) || sw.includes(nw)))) {
          return true;
        }
      }
      if (catNameStr && subNameLower && (catNameStr.includes(subNameLower) || subNameLower.includes(catNameStr))) {
        return true;
      }
      return false;
    });
  };

  // 3. Partition transactions into Variable vs Fixed
  let monthlyVarExp = 0;
  let monthlyFixExp = 0;
  let todayVarExp = 0;
  let todayFixExp = 0;
  const recordedTxIds = new Set<string>();

  transactions.forEach((tx) => {
    recordedTxIds.add(tx.id);
    if (tx.type !== 'expense') return;
    const d = new Date(tx.date);
    if (d.getFullYear() === activeYear && d.getMonth() === activeMonth) {
      const cat = tx.categoryId ? categoryMap.get(tx.categoryId) || null : null;
      const fixed = isFixedExpense(tx, cat);

      if (fixed) {
        monthlyFixExp += tx.amount;
        const matchedSub = matchFixedSubcategory(tx.note || '', (cat?.name || '').toLowerCase(), tx.categoryId);
        if (matchedSub) {
          fixedSubSpentMap[matchedSub.id] = (fixedSubSpentMap[matchedSub.id] || 0) + tx.amount;
        } else {
          unallocatedFixedExp += tx.amount;
        }
      } else {
        monthlyVarExp += tx.amount;
      }

      if (d.getDate() === activeDay) {
        if (fixed) {
          todayFixExp += tx.amount;
        } else {
          todayVarExp += tx.amount;
        }
      }
    }
  });

  // 3b. Also include any payable debt payments recorded in DebtTab this month that did not create a wallet transaction
  debts.forEach((debt) => {
    if (debt.type !== 'payable') return;
    (debt.payments || []).forEach((p) => {
      if (p.transactionId && recordedTxIds.has(p.transactionId)) return;
      const pd = new Date(p.date);
      if (pd.getFullYear() === activeYear && pd.getMonth() === activeMonth) {
        monthlyFixExp += p.amount;
        if (pd.getDate() === activeDay) {
          todayFixExp += p.amount;
        }
        const matchedSub = matchFixedSubcategory(`${debt.name} ${p.note || ''}`, 'tagihan');
        if (matchedSub) {
          fixedSubSpentMap[matchedSub.id] = (fixedSubSpentMap[matchedSub.id] || 0) + p.amount;
        } else {
          unallocatedFixedExp += p.amount;
        }
      }
    });
  });

  // 4. Monthly Fixed Budget:
  // Each fixed subcategory reserves at least its allocatedAmount (or actual spent if higher),
  // PLUS any unallocated fixed expenses / debt payments made this month!
  const effectiveSubsFixedTotal = activeFixedSubs.reduce((sum, sub) => {
    const spentOnSub = fixedSubSpentMap[sub.id] || 0;
    return sum + Math.max(sub.allocatedAmount, spentOnSub);
  }, 0);

  const monthlyFixedBudget = effectiveSubsFixedTotal + unallocatedFixedExp;

  // 5. Monthly Variable Budget (untuk operasional harian, otomatis terpotong oleh tagihan & pembayaran utang bulan ini)
  const monthlyVariableBudget = Math.max(0, monthlySpendingLimit - monthlyFixedBudget);

  // 6. Daily Budget Quota (per hari)
  const dailyBudgetQuota =
    estIncome > 0 && daysInMonth > 0 ? Math.round(monthlyVariableBudget / daysInMonth) : 0;

  // 7. Sisa Budget Harian = Effective Daily Quota - Today's Variable Expenses ONLY!
  // Dibatasi juga oleh sisa kuota variabel bulanan agar tidak positif semu saat kuota bulanan sudah habis.
  const priorDaysVarExp = Math.max(0, monthlyVarExp - todayVarExp);
  const remainingMonthlyVarBeforeToday = Math.max(0, monthlyVariableBudget - priorDaysVarExp);
  const effectiveDailyQuota =
    monthlyVariableBudget > 0
      ? Math.min(dailyBudgetQuota, remainingMonthlyVarBeforeToday)
      : dailyBudgetQuota;

  const dailyBudgetRemaining = Math.max(0, effectiveDailyQuota - todayVarExp);
  const dailyOverbudget = todayVarExp > effectiveDailyQuota && dailyBudgetQuota > 0;
  const dailyOverbudgetAmount = Math.max(0, todayVarExp - effectiveDailyQuota);

  return {
    daysInMonth,
    monthlySpendingLimit,
    monthlyFixedBudget,
    monthlyVariableBudget,
    dailyBudgetQuota,
    todayVariableExpense: todayVarExp,
    todayFixedExpense: todayFixExp,
    todayTotalExpense: todayVarExp + todayFixExp,
    dailyBudgetRemaining,
    dailyOverbudget,
    dailyOverbudgetAmount,
    monthlyFixedExpense: monthlyFixExp,
    monthlyVariableExpense: monthlyVarExp,
    monthlyTotalExpense: monthlyVarExp + monthlyFixExp,
  };
}
