import { BudgetConfig, Category, Debt, ExpenseNature, FoodLifestyleMode, RecurringItem, Transaction } from './types';

// Category IDs that represent fixed monthly obligations
export const FIXED_CATEGORY_IDS = new Set([
  'cat-listrik',
  'cat-air',
  'cat-bpjs',
  'cat-kuota',
  'cat-tagihan',
]);

// Category IDs that represent savings / investment allocations
export const SAVINGS_CATEGORY_IDS = new Set([
  'cat-tabungan',
  'cat-investasi',
]);

// Category IDs that represent bulk grocery / home-cooking stock
export const GROCERY_CATEGORY_IDS = new Set([
  'cat-belanja-bulanan',
]);

// Keywords in transaction note or category name indicating a fixed monthly bill
export const FIXED_EXPENSE_KEYWORDS_REGEX =
  /(wifi|wi-fi|indihome|biznet|first media|myrepublic|my republic|iconnet|cbn|pln|token|token listrik|listrik|air pam|pdam|bpjs|asuransi|sewa|kost|kosan|kontrakan|kontrak rumah|netflix|spotify|youtube premium|disney|disney\+|hbo|apple tv|prime video|icloud|google one|canva|zoom|cicilan|angsuran|kpr|utang|tagihan|iuran|langganan|subscription|kartu kredit|credit card|paylater|bayar cicilan|pembayaran cicilan|otomatis rutin)/i;

// Keywords indicating bulk grocery shopping / cooking ingredients (Belanja Bulanan / Bahan Masak)
export const GROCERY_EXPENSE_KEYWORDS_REGEX =
  /(belanja bulanan|bahan masak|bahan makanan|sembako|stok dapur|belanja dapur|belanja pasar|sayur & lauk|bumbu dapur|beras & minyak|stok masak|belanja mingguan|supermarket bulanan)/i;

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
 * Computes the monthly installment obligation for a payable debt.
 * Always prioritizes the monthly installment cost (monthlyInstallment or totalAmount / tenorMonths)
 * rather than the total multi-month debt principal so Pos Tagihan Bulanan and Daily Quota stay accurate.
 */
export function getMonthlyDebtInstallmentAmount(
  debt: Debt,
  fallbackSubAllocated?: number
): number {
  const remaining = Math.max(0, Number(debt.remainingAmount ?? debt.totalAmount) || 0);
  const total = Math.max(remaining, Number(debt.totalAmount) || 0);
  if (remaining <= 0 && debt.status === 'paid') return 0;

  // 1. Explicit monthlyInstallment on the debt record
  if (debt.monthlyInstallment && debt.monthlyInstallment > 0) {
    return remaining > 0 ? Math.min(debt.monthlyInstallment, remaining) : debt.monthlyInstallment;
  }

  // 2. Calculate from tenorMonths if available
  if (debt.tenorMonths && debt.tenorMonths > 0 && total > 0) {
    const calcMonthly = Math.round(total / debt.tenorMonths);
    return remaining > 0 ? Math.min(calcMonthly, remaining) : calcMonthly;
  }

  // 3. Calculate from startDate -> dueDate month span if >= 2 months
  if (debt.startDate && debt.dueDate) {
    const start = new Date(debt.startDate);
    const due = new Date(debt.dueDate);
    if (!isNaN(start.getTime()) && !isNaN(due.getTime()) && due.getTime() > start.getTime()) {
      const monthsDiff =
        (due.getFullYear() - start.getFullYear()) * 12 + (due.getMonth() - start.getMonth());
      if (monthsDiff >= 2 && total > 0) {
        const calcMonthly = Math.round(total / monthsDiff);
        return remaining > 0 ? Math.min(calcMonthly, remaining) : calcMonthly;
      }
    }
  }

  // 4. If user set a smaller monthly allocation on the linked subcategory, respect it
  if (
    fallbackSubAllocated &&
    fallbackSubAllocated > 0 &&
    remaining > 0 &&
    fallbackSubAllocated < remaining
  ) {
    return fallbackSubAllocated;
  }

  return remaining || total;
}

/**
 * Determines whether a transaction is a Savings / Investment Allocation (Alokasi Tabungan).
 */
export function isSavingsExpense(
  tx: {
    categoryId?: string | null;
    note?: string;
    budgetGroup?: string;
    expenseNature?: ExpenseNature;
  },
  category?: Category | null
): boolean {
  if (tx.expenseNature === 'savings') return true;
  if (tx.expenseNature === 'variable' || tx.expenseNature === 'grocery' || tx.expenseNature === 'fixed') return false;
  if (tx.budgetGroup === 'tabungan') return true;
  if (tx.categoryId && SAVINGS_CATEGORY_IDS.has(tx.categoryId)) return true;
  if (category?.budgetGroup === 'tabungan' || category?.groupName === 'Tabungan' || category?.expenseNature === 'savings') {
    return true;
  }
  return false;
}

/**
 * Determines whether a transaction is a Bulk Grocery / Home-Cooking Stock Expense
 * (Belanja Bulanan / Bahan Masak di Rumah — tidak dibagi/memotong kuota jajan harian).
 */
export function isGroceryExpense(
  tx: {
    categoryId?: string | null;
    note?: string;
    budgetGroup?: string;
    expenseNature?: ExpenseNature;
  },
  category?: Category | null
): boolean {
  if (tx.expenseNature === 'grocery') return true;
  if (tx.expenseNature === 'variable' || tx.expenseNature === 'fixed' || tx.expenseNature === 'savings') {
    return false;
  }
  if (isSavingsExpense(tx, category)) return false;
  if (tx.categoryId && GROCERY_CATEGORY_IDS.has(tx.categoryId)) return true;
  if (category?.expenseNature === 'grocery') return true;
  if (category?.name && GROCERY_EXPENSE_KEYWORDS_REGEX.test(category.name)) return true;
  if (tx.note && GROCERY_EXPENSE_KEYWORDS_REGEX.test(tx.note)) return true;
  return false;
}

/**
 * Determines whether a budget subcategory represents bulk grocery / cooking stock.
 */
export function isGrocerySubcategory(sub: {
  id: string;
  name: string;
  group?: string;
  isGroceryStock?: boolean;
  dueDateDay?: number;
  subscriptionId?: string;
}): boolean {
  if (sub.group === 'tabungan') return false;
  if (sub.isGroceryStock === true) return true;
  if (sub.dueDateDay || sub.subscriptionId || sub.id.startsWith('sub-debt-')) return false;
  if (sub.id === 'sub-belanja-bulanan' || sub.id === 'sub-bahan-masak' || sub.id === 'sub-masak') {
    return true;
  }
  return GROCERY_EXPENSE_KEYWORDS_REGEX.test(sub.name);
}

/**
 * Determines whether a transaction is a Fixed Expense (Tagihan Bulanan / Rutin)
 * or a Variable Expense (Pengeluaran Harian / Operasional seperti makan, jajan, transportasi).
 */
export function isFixedExpense(
  tx: {
    categoryId?: string | null;
    note?: string;
    budgetGroup?: string;
    expenseNature?: ExpenseNature;
  },
  category?: Category | null
): boolean {
  // 1. Explicit user designation on transaction has highest priority
  if (tx.expenseNature === 'fixed') return true;
  if (tx.expenseNature === 'variable' || tx.expenseNature === 'grocery' || tx.expenseNature === 'savings') return false;

  // Savings allocations & Grocery stock belong to their own buckets, not fixed bills
  if (isSavingsExpense(tx, category)) return false;
  if (isGroceryExpense(tx, category)) return false;

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
 * Auto-detect whether an input should default to 'savings', 'fixed', 'grocery', or 'variable'
 */
export function detectExpenseNature(
  categoryId: string | null | undefined,
  note: string | undefined,
  categoryMap?: Map<string, Category>
): ExpenseNature {
  const cat = categoryId && categoryMap ? categoryMap.get(categoryId) : undefined;
  if (isSavingsExpense({ categoryId, note }, cat)) return 'savings';
  if (isGroceryExpense({ categoryId, note }, cat)) return 'grocery';
  return isFixedExpense({ categoryId, note }, cat) ? 'fixed' : 'variable';
}

export interface BudgetPeriodInfo {
  paydayDay: number; // 1..31
  isCustomPayday: boolean; // paydayDay > 1
  startDate: Date;
  endDate: Date;
  nextPaydayDate: Date;
  startYear: number;
  startMonth: number;
  startDay: number;
  endYear: number;
  endMonth: number;
  endDay: number;
  startDateIso: string;
  endDateIso: string;
  nextPaydayIso: string;
  periodKey: string;
  totalDays: number;
  currentDayOfPeriod: number;
  daysRemainingUntilPayday: number;
  startShortLabel: string;
  endShortLabel: string;
  periodShortLabel: string;
  periodFullLabel: string;
}

const SHORT_MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

function clampDayInMonth(year: number, monthIndex: number, day: number): number {
  const maxDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.max(1, Math.min(day, maxDay));
}

function toIsoDateStr(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Safely parses either a Date object, full ISO string, or YYYY-MM-DD string into a local Date
 * without UTC midnight timezone shifting.
 */
export function parseLocalDay(dateOrStr: Date | string): Date {
  if (dateOrStr instanceof Date) return dateOrStr;
  if (typeof dateOrStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrStr.trim())) {
    const [y, m, d] = dateOrStr.trim().split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }
  return new Date(dateOrStr);
}

/**
 * Computes the active budget period based on the user's payday (Tanggal Gajian 1-31).
 * For example, if paydayDay = 25:
 * - On 25 Oct (or 26 Oct), the active period is 25 Oct -> 24 Nov 23:59:59 (until 25 Nov payday).
 * - On 21 Oct (before the 25th), the active period is 25 Sep -> 24 Oct 23:59:59 (until 25 Oct payday).
 */
export function getBudgetPeriodInfo(
  activeYear: number,
  activeMonth: number,
  activeDay: number,
  rawPaydayDay?: number
): BudgetPeriodInfo {
  const paydayDay = Math.max(1, Math.min(31, Math.round(Number(rawPaydayDay) || 1)));
  const isCustomPayday = paydayDay > 1;
  const now = new Date();
  const realTodayMidday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const refMidday = new Date(activeYear, activeMonth, activeDay, 12, 0, 0);

  if (!isCustomPayday) {
    const totalDays = new Date(activeYear, activeMonth + 1, 0).getDate();
    const startDate = new Date(activeYear, activeMonth, 1, 0, 0, 0, 0);
    const endDate = new Date(activeYear, activeMonth, totalDays, 23, 59, 59, 999);
    const nextMonthObj = new Date(activeYear, activeMonth + 1, 1, 0, 0, 0, 0);

    // Determine effective day within period: if viewing a past period, all days have elapsed;
    // if viewing current real period, use realTodayMidday; if viewing via specific activeDay, use refMidday.
    const effectiveMidday =
      realTodayMidday.getTime() >= startDate.getTime() && realTodayMidday.getTime() <= endDate.getTime()
        ? realTodayMidday
        : refMidday;

    const isPastPeriod = realTodayMidday.getTime() > endDate.getTime() && refMidday.getDate() === 1;
    const currentDayOfPeriod = isPastPeriod
      ? totalDays
      : Math.max(1, Math.min(totalDays, effectiveMidday.getDate()));
    const daysRemainingUntilPayday = Math.max(1, totalDays - currentDayOfPeriod + 1);
    const mShort = SHORT_MONTHS_ID[activeMonth] || 'Jan';
    const startShortLabel = `01 ${mShort}`;
    const endShortLabel = `${String(totalDays).padStart(2, '0')} ${mShort}`;

    return {
      paydayDay: 1,
      isCustomPayday: false,
      startDate,
      endDate,
      nextPaydayDate: nextMonthObj,
      startYear: activeYear,
      startMonth: activeMonth,
      startDay: 1,
      endYear: activeYear,
      endMonth: activeMonth,
      endDay: totalDays,
      startDateIso: toIsoDateStr(activeYear, activeMonth, 1),
      endDateIso: toIsoDateStr(activeYear, activeMonth, totalDays),
      nextPaydayIso: toIsoDateStr(nextMonthObj.getFullYear(), nextMonthObj.getMonth(), 1),
      periodKey: `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`,
      totalDays,
      currentDayOfPeriod,
      daysRemainingUntilPayday,
      startShortLabel,
      endShortLabel,
      periodShortLabel: `${startShortLabel} - ${endShortLabel}`,
      periodFullLabel: `${startShortLabel} ${activeYear} - ${endShortLabel} ${activeYear}`,
    };
  }

  // Custom Payday Cycle (e.g. Tanggal 25 -> Tanggal 25 bulan selanjutnya)
  const thisMonthPayday = clampDayInMonth(activeYear, activeMonth, paydayDay);
  let startYear = activeYear;
  let startMonth = activeMonth;
  let startDay = thisMonthPayday;

  if (activeDay < thisMonthPayday) {
    const prevMonthObj = new Date(activeYear, activeMonth - 1, 1);
    startYear = prevMonthObj.getFullYear();
    startMonth = prevMonthObj.getMonth();
    startDay = clampDayInMonth(startYear, startMonth, paydayDay);
  }

  const nextMonthFromStart = new Date(startYear, startMonth + 1, 1);
  const nextPaydayYear = nextMonthFromStart.getFullYear();
  const nextPaydayMonth = nextMonthFromStart.getMonth();
  const nextPaydayDay = clampDayInMonth(nextPaydayYear, nextPaydayMonth, paydayDay);

  const startDate = new Date(startYear, startMonth, startDay, 0, 0, 0, 0);
  const nextPaydayDate = new Date(nextPaydayYear, nextPaydayMonth, nextPaydayDay, 0, 0, 0, 0);
  // Inclusive end is the day right before nextPaydayDate at 23:59:59.999
  const endDate = new Date(nextPaydayDate.getTime() - 1);

  const msPerDay = 1000 * 60 * 60 * 24;
  const startMidday = new Date(startYear, startMonth, startDay, 12, 0, 0);
  const nextPaydayMidday = new Date(nextPaydayYear, nextPaydayMonth, nextPaydayDay, 12, 0, 0);

  const totalDays = Math.max(
    1,
    Math.round((nextPaydayMidday.getTime() - startMidday.getTime()) / msPerDay)
  );

  const isRealTodayInPeriod =
    realTodayMidday.getTime() >= startDate.getTime() && realTodayMidday.getTime() <= endDate.getTime();
  const isPastCustomPeriod =
    !isRealTodayInPeriod && realTodayMidday.getTime() > endDate.getTime() && activeDay === startDay;

  const effectiveRefMidday = isRealTodayInPeriod ? realTodayMidday : refMidday;
  const elapsedDays = Math.floor((effectiveRefMidday.getTime() - startMidday.getTime()) / msPerDay);
  const currentDayOfPeriod = isPastCustomPeriod
    ? totalDays
    : Math.max(1, Math.min(totalDays, elapsedDays + 1));
  const daysRemainingUntilPayday = Math.max(1, totalDays - currentDayOfPeriod + 1);

  const startMShort = SHORT_MONTHS_ID[startMonth] || 'Jan';
  const endMShort = SHORT_MONTHS_ID[nextPaydayMonth] || 'Feb';
  const startShortLabel = `${String(startDay).padStart(2, '0')} ${startMShort}`;
  const endShortLabel = `${String(nextPaydayDay).padStart(2, '0')} ${endMShort}`;

  const periodShortLabel = `${startShortLabel} - ${endShortLabel}`;
  const periodFullLabel =
    startYear === nextPaydayYear
      ? `${startShortLabel} - ${endShortLabel} ${nextPaydayYear}`
      : `${startShortLabel} ${startYear} - ${endShortLabel} ${nextPaydayYear}`;

  return {
    paydayDay,
    isCustomPayday: true,
    startDate,
    endDate,
    nextPaydayDate,
    startYear,
    startMonth,
    startDay,
    endYear: endDate.getFullYear(),
    endMonth: endDate.getMonth(),
    endDay: endDate.getDate(),
    startDateIso: toIsoDateStr(startYear, startMonth, startDay),
    endDateIso: toIsoDateStr(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()),
    nextPaydayIso: toIsoDateStr(nextPaydayYear, nextPaydayMonth, nextPaydayDay),
    periodKey: `${startYear}-${String(startMonth + 1).padStart(2, '0')}-p${paydayDay}`,
    totalDays,
    currentDayOfPeriod,
    daysRemainingUntilPayday,
    startShortLabel,
    endShortLabel,
    periodShortLabel,
    periodFullLabel,
  };
}

/**
 * Checks whether a Date or ISO date string falls within the given BudgetPeriodInfo.
 */
export function isDateInBudgetPeriod(
  dateOrStr: Date | string,
  periodInfo: BudgetPeriodInfo
): boolean {
  const d = parseLocalDay(dateOrStr);
  if (Number.isNaN(d.getTime())) return false;
  const checkTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime();
  return checkTime >= periodInfo.startDate.getTime() && checkTime <= periodInfo.endDate.getTime();
}

/**
 * Returns the target activeDate (YYYY-MM-DD) when navigating to the previous (-1) or next (+1) budget period.
 */
export function getAdjacentPeriodDateStr(
  activeYear: number,
  activeMonth: number,
  activeDay: number,
  rawPaydayDay: number | undefined,
  direction: -1 | 1
): string {
  const currentPeriod = getBudgetPeriodInfo(activeYear, activeMonth, activeDay, rawPaydayDay);
  const targetStartMonthObj = new Date(
    currentPeriod.startYear,
    currentPeriod.startMonth + direction,
    1
  );
  const targetYear = targetStartMonthObj.getFullYear();
  const targetMonth = targetStartMonthObj.getMonth();
  const targetStartDay = clampDayInMonth(targetYear, targetMonth, currentPeriod.paydayDay);

  // Check if real today falls inside this target period
  const today = new Date();
  const targetPeriod = getBudgetPeriodInfo(
    targetYear,
    targetMonth,
    targetStartDay,
    currentPeriod.paydayDay
  );
  if (isDateInBudgetPeriod(today, targetPeriod)) {
    return toIsoDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  }

  return toIsoDateStr(targetYear, targetMonth, targetStartDay);
}

export interface BudgetBreakdownResult {
  daysInMonth: number;
  monthlySpendingLimit: number;
  foodLifestyleMode: FoodLifestyleMode;
  mealsOutPerDay: number;
  monthlyFixedBudget: number;
  monthlyGroceryBudget: number;
  monthlyVariableBudget: number;
  dailyBudgetQuota: number;
  todayVariableExpense: number;
  todayGroceryExpense: number;
  todayFixedExpense: number;
  todayTotalExpense: number;
  dailyBudgetRemaining: number;
  remainingGroceryBudget: number;
  dailyOverbudget: boolean;
  dailyOverbudgetAmount: number;
  monthlyFixedExpense: number;
  monthlyGroceryExpense: number;
  monthlyVariableExpense: number;
  monthlyTotalExpense: number;
  // Siklus Periode Gajian (Payday Cycle)
  paydayDay: number;
  periodTotalDays: number;
  currentPeriodDay: number;
  daysRemainingUntilPayday: number;
  safeDailyBudgetUntilPayday: number;
  remainingVariableBudget: number;
  periodShortLabel: string;
  periodFullLabel: string;
  endShortLabel: string;
}

/**
 * Calculates structured period budget allocation and daily budget remaining.
 * Supports custom payday cycles (e.g. Tanggal 25 -> Tanggal 25 bulan selanjutnya)
 * and 3 Food/Grocery Lifestyle Modes:
 * - 'eat_out': Tiap hari makan di luar (semua anggaran makan dibagi harian)
 * - 'hybrid': Pagi/siang masak, malam beli makan di luar (sebagian di Pos Belanja Bulanan/Masak, sebagian dibagi harian)
 * - 'cook_home': Tiap hari masak sendiri dengan belanja bulanan/mingguan (anggaran makan masuk ke Pos Belanja Bulanan/Masak)
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
  const rawPayday = budgetConfig?.paydayDay || budgetConfig?.settings?.paydayDay || 1;
  const periodInfo = getBudgetPeriodInfo(activeYear, activeMonth, activeDay, rawPayday);
  const daysInMonth = periodInfo.totalDays;
  const estIncome = typeof budgetConfig?.estimatedIncome === 'number' ? budgetConfig.estimatedIncome : 0;

  // 1. Total spending limit: Needs + Wants (supports 0% for any group)
  const needsPct = typeof budgetConfig?.needsPercent === 'number' ? budgetConfig.needsPercent : 50;
  const wantsPct = typeof budgetConfig?.wantsPercent === 'number' ? budgetConfig.wantsPercent : 30;
  const monthlySpendingLimit = Math.round((estIncome * (needsPct + wantsPct)) / 100);

  // Build lookup of expense subscriptions & payable debts
  const expenseSubscriptions = subscriptions.filter((s) => s.type === 'expense');
  const payableDebts = (debts || []).filter((d) => d.type === 'payable');

  // 2. Identify active fixed subcategories and grocery/cooking stock subcategories from Needs & Wants
  const activeFixedSubs: { id: string; name: string; allocatedAmount: number }[] = [];
  const activeGrocerySubs: { id: string; name: string; allocatedAmount: number }[] = [];

  if (budgetConfig?.subcategories && budgetConfig.subcategories.length > 0) {
    budgetConfig.subcategories.forEach((sub) => {
      if (sub.group === 'tabungan') return;

      const subNameLower = sub.name.toLowerCase().trim();
      const matchedDebt = payableDebts.find((d) => {
        const debtSubId = `sub-debt-${d.id}`;
        const cleanDebtName = d.name.toLowerCase().trim();
        const subDisplayName = d.name.toLowerCase().startsWith('cicilan')
          ? cleanDebtName
          : `cicilan ${cleanDebtName}`;
        return (
          sub.id === debtSubId ||
          sub.subscriptionId === d.id ||
          subNameLower === subDisplayName ||
          subNameLower === cleanDebtName
        );
      });

      if (matchedDebt) {
        const isPaid = matchedDebt.status === 'paid' && (matchedDebt.remainingAmount ?? 0) <= 0;
        if (isPaid) return;
      }

      const linkedSub = expenseSubscriptions.find(
        (rec) =>
          rec.id === sub.subscriptionId ||
          rec.subcategoryId === sub.id ||
          rec.name.toLowerCase().trim() === subNameLower
      );

      if (linkedSub) {
        if (!linkedSub.isActive) return;
      } else if (sub.isSubscriptionActive === false && !matchedDebt) {
        return;
      }

      const isSubFixed =
        Boolean(matchedDebt) ||
        Boolean(sub.dueDateDay) ||
        Boolean(sub.subscriptionId) ||
        Boolean(linkedSub) ||
        sub.id.startsWith('sub-debt-') ||
        FIXED_CATEGORY_IDS.has(sub.id.replace('sub-', 'cat-')) ||
        FIXED_EXPENSE_KEYWORDS_REGEX.test(sub.name);

      if (isSubFixed) {
        const resolvedAllocated = matchedDebt
          ? getMonthlyDebtInstallmentAmount(matchedDebt, Number(sub.allocatedAmount) || 0)
          : Number(sub.allocatedAmount) || 0;

        activeFixedSubs.push({
          id: sub.id,
          name: sub.name,
          allocatedAmount: resolvedAllocated,
        });
      } else if (isGrocerySubcategory(sub)) {
        activeGrocerySubs.push({
          id: sub.id,
          name: sub.name,
          allocatedAmount: Number(sub.allocatedAmount) || 0,
        });
      }
    });
  }

  // Determine Food Lifestyle Mode (default dynamic flexible pool)
  const foodLifestyleMode: FoodLifestyleMode =
    budgetConfig?.foodLifestyleMode || 'hybrid';

  const mealsOutPerDay =
    typeof budgetConfig?.mealsOutPerDay === 'number'
      ? budgetConfig.mealsOutPerDay
      : 1;

  // 2b. Auto-include active payable debts (cicilan utang) into fixed obligations using monthly installment cost
  payableDebts.forEach((debt) => {
    if (debt.status !== 'active') return;
    const debtSubId = `sub-debt-${debt.id}`;
    const cleanDebtName = debt.name.toLowerCase().trim();
    const alreadyIncluded = activeFixedSubs.some((s) => {
      const sLower = s.name.toLowerCase().trim();
      return (
        s.id === debtSubId ||
        sLower === `cicilan ${cleanDebtName}` ||
        sLower === cleanDebtName
      );
    });
    if (!alreadyIncluded) {
      activeFixedSubs.push({
        id: debtSubId,
        name: debt.name.toLowerCase().startsWith('cicilan') ? debt.name : `Cicilan ${debt.name}`,
        allocatedAmount: getMonthlyDebtInstallmentAmount(debt),
      });
    }
  });

  // Helper to match a fixed expense note/category to one of activeFixedSubs
  const fixedSubSpentMap: Record<string, number> = {};
  let unallocatedFixedExp = 0;

  const matchSubcategoryList = (
    list: { id: string; name: string; allocatedAmount: number }[],
    noteStr: string,
    catNameStr: string,
    categoryId?: string | null
  ) => {
    const cleanNote = noteStr
      .toLowerCase()
      .replace(/\(otomatis rutin\)|\(rutin\)|\(langganan\)|\(bulanan\)|bayar cicilan utang:|cicilan utang:/gi, '')
      .trim();
    const rawNote = noteStr.toLowerCase().trim();

    return list.find((s) => {
      const subNameLower = s.name.toLowerCase().trim();
      const cleanSubName = subNameLower.replace(/^cicilan\s+/i, '').trim();
      if (categoryId && s.id.replace('sub-', '') === categoryId.replace('cat-', '')) {
        return true;
      }
      if (
        cleanNote === subNameLower ||
        (cleanSubName.length >= 3 && cleanNote.includes(cleanSubName)) ||
        (subNameLower.length >= 3 && (rawNote.includes(subNameLower) || cleanNote.includes(subNameLower))) ||
        (cleanNote.length >= 4 && subNameLower.includes(cleanNote))
      ) {
        return true;
      }
      const subWords = subNameLower.split(/[\s&/,-]+/).filter((w) => w.length >= 3 && w !== 'cicilan');
      const noteWords = cleanNote.split(/[\s&/,-]+/).filter((w) => w.length >= 3);
      if (subWords.length > 0 && noteWords.length > 0) {
        if (
          subWords.some((sw) =>
            noteWords.some(
              (nw) =>
                nw === sw ||
                (sw.length >= 4 && nw.length >= 4 && (nw.includes(sw) || sw.includes(nw)))
            )
          )
        ) {
          return true;
        }
      }
      if (
        catNameStr.length >= 4 &&
        subNameLower.length >= 4 &&
        (catNameStr.includes(subNameLower) || subNameLower.includes(catNameStr))
      ) {
        return true;
      }
      return false;
    });
  };

  // 3. Partition transactions in the active budget period into Variable (Harian) vs Grocery (Belanja Bulanan) vs Fixed (Tagihan)
  let monthlyVarExp = 0;
  let monthlyGrocExp = 0;
  let monthlyFixExp = 0;
  let todayVarExp = 0;
  let todayGrocExp = 0;
  let todayFixExp = 0;
  const recordedTxIds = new Set<string>();

  transactions.forEach((tx) => {
    recordedTxIds.add(tx.id);
    if (tx.type !== 'expense') return;
    const d = parseLocalDay(tx.date);
    if (isDateInBudgetPeriod(d, periodInfo)) {
      const cat = tx.categoryId ? categoryMap.get(tx.categoryId) || null : null;
      // Savings allocations belong to the 20% Tabungan bucket, not Needs/Wants daily or fixed obligations
      if (isSavingsExpense(tx, cat)) return;

      const grocery = isGroceryExpense(tx, cat);
      const fixed = !grocery && isFixedExpense(tx, cat);

      if (fixed) {
        monthlyFixExp += tx.amount;
        const matchedSub = matchSubcategoryList(
          activeFixedSubs,
          tx.note || '',
          (cat?.name || '').toLowerCase(),
          tx.categoryId
        );
        if (matchedSub) {
          fixedSubSpentMap[matchedSub.id] = (fixedSubSpentMap[matchedSub.id] || 0) + tx.amount;
        } else {
          unallocatedFixedExp += tx.amount;
        }
      } else if (grocery) {
        monthlyGrocExp += tx.amount;
      } else {
        monthlyVarExp += tx.amount;
      }

      if (
        d.getFullYear() === activeYear &&
        d.getMonth() === activeMonth &&
        d.getDate() === activeDay
      ) {
        if (fixed) {
          todayFixExp += tx.amount;
        } else if (grocery) {
          todayGrocExp += tx.amount;
        } else {
          todayVarExp += tx.amount;
        }
      }
    }
  });

  // 3b. Also include any payable debt payments recorded in DebtTab during this period that did not create a wallet transaction
  debts.forEach((debt) => {
    if (debt.type !== 'payable') return;
    (debt.payments || []).forEach((p) => {
      if (p.transactionId && recordedTxIds.has(p.transactionId)) return;
      const pd = parseLocalDay(p.date);
      if (isDateInBudgetPeriod(pd, periodInfo)) {
        monthlyFixExp += p.amount;
        if (
          pd.getFullYear() === activeYear &&
          pd.getMonth() === activeMonth &&
          pd.getDate() === activeDay
        ) {
          todayFixExp += p.amount;
        }
        const matchedSub = matchSubcategoryList(
          activeFixedSubs,
          `${debt.name} ${p.note || ''}`,
          'tagihan'
        );
        if (matchedSub) {
          fixedSubSpentMap[matchedSub.id] = (fixedSubSpentMap[matchedSub.id] || 0) + p.amount;
        } else {
          unallocatedFixedExp += p.amount;
        }
      }
    });
  });

  // 4. Monthly Fixed Budget (Tagihan Bulanan Rutin):
  const effectiveSubsFixedTotal = activeFixedSubs.reduce((sum, sub) => {
    const spentOnSub = fixedSubSpentMap[sub.id] || 0;
    return sum + Math.max(sub.allocatedAmount, spentOnSub);
  }, 0);

  const monthlyFixedBudget = effectiveSubsFixedTotal + unallocatedFixedExp;

  // 5. Dynamic Operational & Grocery Pool (Konsep Fleksibel: Kuota Harian Mengikuti Sisa Uang Setelah Belanja Bulanan):
  // - initialOperationalPool = Total Pagu Operasional & Makan/Belanja (di luar Tagihan Bulanan & Tabungan).
  // - Setiap kali user mencatat Belanja Bulanan (misal hari ini Rp 1 juta, minggu depan Rp 2 juta),
  //   uang Belanja Bulanan (monthlyGrocExp) langsung memotong Pagu Operasional tanpa membuat hari ini Overbudget Harian,
  //   dan Kuota Harian otomatis dihitung ulang mengikuti sisa uangnya!
  const initialOperationalPool = Math.max(0, monthlySpendingLimit - monthlyFixedBudget);
  const monthlyGroceryBudget = initialOperationalPool;
  const monthlyVariableBudget = Math.max(0, initialOperationalPool - monthlyGrocExp);

  // 6. Sisa Uang Operasional & Kuota Harian Dinamis (mengikuti sisa uang setelah Belanja Bulanan)
  const priorDaysVarExp = Math.max(0, monthlyVarExp - todayVarExp);
  const remainingMonthlyVarBeforeToday = Math.max(0, monthlyVariableBudget - priorDaysVarExp);
  const remainingVariableBudget = Math.max(0, monthlyVariableBudget - monthlyVarExp);
  const remainingGroceryBudget = remainingVariableBudget;

  const baseDailyAfterGrocery =
    estIncome > 0 && daysInMonth > 0 ? Math.round(monthlyVariableBudget / daysInMonth) : 0;

  const rollingDailyBeforeToday =
    estIncome > 0 && periodInfo.daysRemainingUntilPayday > 0
      ? Math.round(remainingMonthlyVarBeforeToday / periodInfo.daysRemainingUntilPayday)
      : 0;

  // Kuota Harian mengikuti sisa pagu setelah dipotong Belanja Bulanan (dan menyesuaikan jika sisa uang riil lebih kecil)
  const dailyBudgetQuota =
    priorDaysVarExp > 0
      ? Math.min(baseDailyAfterGrocery, rollingDailyBeforeToday)
      : baseDailyAfterGrocery;

  // Safe daily budget so that actual remaining money lasts until the next payday:
  const remainingDaysForSafeQuota =
    todayVarExp > 0 && periodInfo.daysRemainingUntilPayday > 1
      ? periodInfo.daysRemainingUntilPayday - 1
      : Math.max(1, periodInfo.daysRemainingUntilPayday);

  const safeDailyBudgetUntilPayday =
    estIncome > 0 && remainingDaysForSafeQuota > 0
      ? Math.round(remainingVariableBudget / remainingDaysForSafeQuota)
      : 0;

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
    foodLifestyleMode,
    mealsOutPerDay,
    monthlyFixedBudget,
    monthlyGroceryBudget,
    monthlyVariableBudget,
    dailyBudgetQuota,
    todayVariableExpense: todayVarExp,
    todayGroceryExpense: todayGrocExp,
    todayFixedExpense: todayFixExp,
    todayTotalExpense: todayVarExp + todayGrocExp + todayFixExp,
    dailyBudgetRemaining,
    remainingGroceryBudget,
    dailyOverbudget,
    dailyOverbudgetAmount,
    monthlyFixedExpense: monthlyFixExp,
    monthlyGroceryExpense: monthlyGrocExp,
    monthlyVariableExpense: monthlyVarExp,
    monthlyTotalExpense: monthlyVarExp + monthlyGrocExp + monthlyFixExp,
    paydayDay: periodInfo.paydayDay,
    periodTotalDays: periodInfo.totalDays,
    currentPeriodDay: periodInfo.currentDayOfPeriod,
    daysRemainingUntilPayday: periodInfo.daysRemainingUntilPayday,
    safeDailyBudgetUntilPayday,
    remainingVariableBudget,
    periodShortLabel: periodInfo.periodShortLabel,
    periodFullLabel: periodInfo.periodFullLabel,
    endShortLabel: periodInfo.endShortLabel,
  };
}
