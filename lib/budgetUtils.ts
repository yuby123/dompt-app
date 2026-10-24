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

// Category IDs that represent non-daily social / incidental expenses (Kondangan, Amplop, Kado, Sedekah)
export const NON_DAILY_CATEGORY_IDS = new Set([
  'cat-kondangan',
  'cat-sedekah',
]);

// Keywords in transaction note or category name indicating a fixed monthly bill
export const FIXED_EXPENSE_KEYWORDS_REGEX =
  /(wifi|wi-fi|indihome|biznet|first media|myrepublic|my republic|iconnet|cbn|pln|token|token listrik|listrik|air pam|pdam|bpjs|asuransi|sewa|kost|kosan|kontrakan|kontrak rumah|netflix|spotify|youtube premium|disney|disney\+|hbo|apple tv|prime video|icloud|google one|canva|zoom|cicilan|angsuran|kpr|utang|tagihan|iuran|langganan|subscription|kartu kredit|credit card|paylater|bayar cicilan|pembayaran cicilan|otomatis rutin)/i;

// Keywords indicating bulk grocery shopping / cooking ingredients (Belanja Bulanan / Bahan Masak)
export const GROCERY_EXPENSE_KEYWORDS_REGEX =
  /(belanja bulanan|bahan masak|bahan makanan|sembako|stok dapur|belanja dapur|belanja pasar|sayur & lauk|bumbu dapur|beras & minyak|stok masak|belanja mingguan|supermarket bulanan)/i;

// Keywords indicating non-daily social / incidental expenses (Amplop Nikahan, Kondangan, Ngado, Kado, Sedekah, Donasi, Takziah)
export const NON_DAILY_EXPENSE_KEYWORDS_REGEX =
  /(kondangan|amplop|nikahan|pernikahan|kawinan|resepsi|ngado|kado|hadiah|bingkisan|parsel|parcel|nyumbang|bowo|buwuh|becek|mantenan|hajatan|wisuda|ultah|ulang tahun|sumbangan|santunan|takziah|melayat|duka|tahlilan|aqiqah|khitanan|sunatan|syukuran|arisan|angpao|thr|sedekah|donasi|zakat|infak|infaq|amal|baksos)/i;

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
 * Determines whether a budget subcategory is a Debt / Installment item (Cicilan / Utang).
 */
export function isDebtOrInstallmentSubcategory(
  sub: { id: string; name: string; subscriptionId?: string },
  debts?: Debt[]
): boolean {
  if (sub.id.startsWith('sub-debt-')) return true;
  const sLower = sub.name.toLowerCase().trim();
  if (/^(cicilan|utang|hutang|angsuran|pinjaman|kpr|paylater)\b/i.test(sLower)) return true;
  if (debts && debts.length > 0) {
    return debts.some((d) => {
      if (d.type !== 'payable') return false;
      const dLower = d.name.toLowerCase().trim();
      return (
        sub.subscriptionId === d.id ||
        sLower === dLower ||
        sLower === `cicilan ${dLower}`
      );
    });
  }
  return false;
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
  if (
    tx.expenseNature === 'variable' ||
    tx.expenseNature === 'non_daily' ||
    tx.expenseNature === 'grocery' ||
    tx.expenseNature === 'fixed'
  ) {
    return false;
  }
  if (tx.budgetGroup === 'tabungan') return true;
  if (tx.categoryId && SAVINGS_CATEGORY_IDS.has(tx.categoryId)) return true;
  if (
    category?.budgetGroup === 'tabungan' ||
    category?.groupName === 'Tabungan' ||
    category?.expenseNature === 'savings'
  ) {
    return true;
  }
  return false;
}

/**
 * Determines whether a transaction is a Non-Daily Social / Incidental Expense
 * (Amplop Nikahan / Kondangan, Kado, Sedekah, Donasi, Acara Sosial — TIDAK memotong kuota jatah harian).
 */
export function isNonDailyExpense(
  tx: {
    categoryId?: string | null;
    note?: string;
    budgetGroup?: string;
    expenseNature?: ExpenseNature;
  },
  category?: Category | null
): boolean {
  if (tx.expenseNature === 'non_daily') return true;
  if (
    tx.expenseNature === 'grocery' ||
    tx.expenseNature === 'fixed' ||
    tx.expenseNature === 'savings'
  ) {
    return false;
  }
  if (isSavingsExpense(tx, category)) return false;
  if (tx.categoryId && NON_DAILY_CATEGORY_IDS.has(tx.categoryId)) return true;
  if (category?.expenseNature === 'non_daily') return true;
  if (category?.name && NON_DAILY_EXPENSE_KEYWORDS_REGEX.test(category.name)) return true;
  if (tx.note && NON_DAILY_EXPENSE_KEYWORDS_REGEX.test(tx.note)) return true;
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
  if (
    tx.expenseNature === 'variable' ||
    tx.expenseNature === 'non_daily' ||
    tx.expenseNature === 'fixed' ||
    tx.expenseNature === 'savings'
  ) {
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
  if (
    tx.expenseNature === 'variable' ||
    tx.expenseNature === 'non_daily' ||
    tx.expenseNature === 'grocery' ||
    tx.expenseNature === 'savings'
  ) {
    return false;
  }

  // Savings allocations, Non-daily social expenses, & Grocery stock belong to their own buckets
  if (isSavingsExpense(tx, category)) return false;
  if (isNonDailyExpense(tx, category)) return false;
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
 * Auto-detect whether an input should default to 'savings', 'non_daily', 'fixed', 'grocery', or 'variable'
 */
export function detectExpenseNature(
  categoryId: string | null | undefined,
  note: string | undefined,
  categoryMap?: Map<string, Category>
): ExpenseNature {
  const cat = categoryId && categoryMap ? categoryMap.get(categoryId) : undefined;
  if (isSavingsExpense({ categoryId, note }, cat)) return 'savings';
  if (isNonDailyExpense({ categoryId, note }, cat)) return 'non_daily';
  if (isGroceryExpense({ categoryId, note }, cat)) return 'grocery';
  return isFixedExpense({ categoryId, note }, cat) ? 'fixed' : 'variable';
}

export interface BudgetPeriodInfo {
  paydayDay: number; // 1..31
  isCustomPayday: boolean; // paydayDay > 1 or manual custom period
  isCustomFlexiblePeriod?: boolean; // true when manual customPeriodStart & customNextPayday are active
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

export interface CustomBudgetPeriodInput {
  periodMode?: 'standard' | 'custom';
  customPeriodStart?: string;
  customNextPayday?: string;
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
 * Computes the active budget period based on the user's payday (Tanggal Gajian 1-31)
 * OR a manual flexible period (customPeriodStart -> customNextPayday, e.g. 23 Okt -> 25 Nov = 33 Hari).
 */
export function getBudgetPeriodInfo(
  activeYear: number,
  activeMonth: number,
  activeDay: number,
  rawPaydayDay?: number,
  customPeriod?: CustomBudgetPeriodInput
): BudgetPeriodInfo {
  const paydayDay = Math.max(1, Math.min(31, Math.round(Number(rawPaydayDay) || 1)));
  const isCustomPayday = paydayDay > 1;
  const now = new Date();
  const realTodayMidday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const refMidday = new Date(activeYear, activeMonth, activeDay, 12, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;

  // 1. Check if a manual flexible period is configured and active for this viewed date
  if (
    customPeriod &&
    (customPeriod.periodMode === 'custom' || (customPeriod.customPeriodStart && customPeriod.customNextPayday)) &&
    customPeriod.customPeriodStart &&
    customPeriod.customNextPayday
  ) {
    const cStart = parseLocalDay(customPeriod.customPeriodStart);
    const cNext = parseLocalDay(customPeriod.customNextPayday);
    if (!Number.isNaN(cStart.getTime()) && !Number.isNaN(cNext.getTime())) {
      const cStartDate = new Date(cStart.getFullYear(), cStart.getMonth(), cStart.getDate(), 0, 0, 0, 0);
      const cNextDate = new Date(cNext.getFullYear(), cNext.getMonth(), cNext.getDate(), 0, 0, 0, 0);
      const cEndDate = new Date(cNextDate.getTime() - 1);

      if (cNextDate.getTime() > cStartDate.getTime()) {
        // Check if refMidday falls inside the custom period (or within 10 days prior when setting up upcoming Friday payday)
        const tenDaysBeforeStart = cStartDate.getTime() - 10 * msPerDay;
        const isViewingCustomPeriod =
          (refMidday.getTime() >= cStartDate.getTime() && refMidday.getTime() <= cEndDate.getTime()) ||
          (refMidday.getTime() >= tenDaysBeforeStart &&
            refMidday.getTime() < cStartDate.getTime() &&
            activeMonth === cStart.getMonth());

        if (isViewingCustomPeriod) {
          const startYear = cStartDate.getFullYear();
          const startMonth = cStartDate.getMonth();
          const startDay = cStartDate.getDate();
          const nextPaydayYear = cNextDate.getFullYear();
          const nextPaydayMonth = cNextDate.getMonth();
          const nextPaydayDay = cNextDate.getDate();

          const startMidday = new Date(startYear, startMonth, startDay, 12, 0, 0);
          const nextPaydayMidday = new Date(nextPaydayYear, nextPaydayMonth, nextPaydayDay, 12, 0, 0);
          const totalDays = Math.max(
            1,
            Math.round((nextPaydayMidday.getTime() - startMidday.getTime()) / msPerDay)
          );

          const isRealTodayInPeriod =
            realTodayMidday.getTime() >= cStartDate.getTime() &&
            realTodayMidday.getTime() <= cEndDate.getTime();
          const isPastCustomPeriod =
            !isRealTodayInPeriod && realTodayMidday.getTime() > cEndDate.getTime();

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
            isCustomFlexiblePeriod: true,
            startDate: cStartDate,
            endDate: cEndDate,
            nextPaydayDate: cNextDate,
            startYear,
            startMonth,
            startDay,
            endYear: cEndDate.getFullYear(),
            endMonth: cEndDate.getMonth(),
            endDay: cEndDate.getDate(),
            startDateIso: toIsoDateStr(startYear, startMonth, startDay),
            endDateIso: toIsoDateStr(cEndDate.getFullYear(), cEndDate.getMonth(), cEndDate.getDate()),
            nextPaydayIso: toIsoDateStr(nextPaydayYear, nextPaydayMonth, nextPaydayDay),
            periodKey: `${startYear}-${String(startMonth + 1).padStart(2, '0')}-flex-${startDay}`,
            totalDays,
            currentDayOfPeriod,
            daysRemainingUntilPayday,
            startShortLabel,
            endShortLabel,
            periodShortLabel,
            periodFullLabel,
          };
        }
      }
    }
  }

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
      isCustomFlexiblePeriod: false,
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
  let nextPaydayYear = nextMonthFromStart.getFullYear();
  let nextPaydayMonth = nextMonthFromStart.getMonth();
  let nextPaydayDay = clampDayInMonth(nextPaydayYear, nextPaydayMonth, paydayDay);

  // If the next period is a configured custom flexible period, align our nextPaydayDate to its start so there's no overlap!
  if (
    customPeriod?.periodMode === 'custom' &&
    customPeriod.customPeriodStart
  ) {
    const cStart = parseLocalDay(customPeriod.customPeriodStart);
    if (
      !Number.isNaN(cStart.getTime()) &&
      cStart.getFullYear() === nextPaydayYear &&
      cStart.getMonth() === nextPaydayMonth
    ) {
      nextPaydayDay = cStart.getDate();
    }
  }

  const startDate = new Date(startYear, startMonth, startDay, 0, 0, 0, 0);
  const nextPaydayDate = new Date(nextPaydayYear, nextPaydayMonth, nextPaydayDay, 0, 0, 0, 0);
  // Inclusive end is the day right before nextPaydayDate at 23:59:59.999
  const endDate = new Date(nextPaydayDate.getTime() - 1);

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
    isCustomFlexiblePeriod: false,
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
 * Checks whether a payable debt is scheduled to be paid in the given budget period.
 * Returns false if the debt is scheduled to start or fall due in a future budget period (e.g. next month)
 * and has no payment recorded in this period, so it will NOT enter Pos Tagihan Bulanan (Fixed)
 * or reduce the daily budget quota in the current period.
 */
export function isDebtScheduledForBudgetPeriod(
  debt: Debt,
  periodInfo: BudgetPeriodInfo
): boolean {
  const hasPaymentInPeriod = (debt.payments || []).some((p) =>
    isDateInBudgetPeriod(p.date, periodInfo)
  );
  if (hasPaymentInPeriod) return true;

  const isPaid = debt.status === 'paid' && (debt.remainingAmount ?? 0) <= 0;
  if (isPaid) return false;

  // 1. Explicit firstPaymentDate scheduled in a future period (after periodInfo.endDate)
  if (debt.firstPaymentDate) {
    const firstPayDay = parseLocalDay(debt.firstPaymentDate);
    if (!Number.isNaN(firstPayDay.getTime())) {
      const firstPayTime = new Date(
        firstPayDay.getFullYear(),
        firstPayDay.getMonth(),
        firstPayDay.getDate(),
        12,
        0,
        0
      ).getTime();
      if (firstPayTime > periodInfo.endDate.getTime()) {
        return false;
      }
    }
  }

  // 2. startDate scheduled in a future period (after periodInfo.endDate)
  if (debt.startDate) {
    const startDay = parseLocalDay(debt.startDate);
    if (!Number.isNaN(startDay.getTime())) {
      const startTime = new Date(
        startDay.getFullYear(),
        startDay.getMonth(),
        startDay.getDate(),
        12,
        0,
        0
      ).getTime();
      if (startTime > periodInfo.endDate.getTime()) {
        return false;
      }
    }
  }

  // 3. One-time (non-installment) debt whose dueDate is in a future period (after periodInfo.endDate)
  const isOneTimeDebt =
    !debt.isInstallment &&
    (!debt.tenorMonths || debt.tenorMonths <= 1) &&
    (!debt.monthlyInstallment || debt.monthlyInstallment <= 0);
  if (isOneTimeDebt && debt.dueDate) {
    const dueDay = parseLocalDay(debt.dueDate);
    if (!Number.isNaN(dueDay.getTime())) {
      const dueTime = new Date(
        dueDay.getFullYear(),
        dueDay.getMonth(),
        dueDay.getDate(),
        12,
        0,
        0
      ).getTime();
      if (dueTime > periodInfo.endDate.getTime()) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Returns the target activeDate (YYYY-MM-DD) when navigating to the previous (-1) or next (+1) budget period.
 */
export function getAdjacentPeriodDateStr(
  activeYear: number,
  activeMonth: number,
  activeDay: number,
  rawPaydayDay: number | undefined,
  direction: -1 | 1,
  customPeriod?: CustomBudgetPeriodInput
): string {
  const currentPeriod = getBudgetPeriodInfo(
    activeYear,
    activeMonth,
    activeDay,
    rawPaydayDay,
    customPeriod
  );

  if (direction === 1 && currentPeriod.isCustomFlexiblePeriod) {
    return currentPeriod.nextPaydayIso;
  }

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
    currentPeriod.paydayDay,
    customPeriod
  );
  if (isDateInBudgetPeriod(today, targetPeriod)) {
    return toIsoDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  }

  return targetPeriod.startDateIso;
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
  todayNonDailyExpense: number;
  todayGroceryExpense: number;
  todayFixedExpense: number;
  todayTotalExpense: number;
  dailyBudgetRemaining: number;
  remainingGroceryBudget: number;
  dailyOverbudget: boolean;
  dailyOverbudgetAmount: number;
  tomorrowDailyQuota: number;
  tomorrowQuotaDiff: number;
  monthlyFixedExpense: number;
  monthlyNonDailyExpense: number;
  monthlyGroceryExpense: number;
  monthlyVariableExpense: number;
  monthlyTotalExpense: number;
  // Siklus Periode Gajian (Payday Cycle)
  paydayDay: number;
  isCustomFlexiblePeriod: boolean;
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
 * and manual flexible periods (e.g. 23 Okt -> 25 Nov = 33 Hari).
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
  const customPeriod: CustomBudgetPeriodInput = {
    periodMode: budgetConfig?.periodMode || budgetConfig?.settings?.periodMode,
    customPeriodStart: budgetConfig?.customPeriodStart || budgetConfig?.settings?.customPeriodStart,
    customNextPayday: budgetConfig?.customNextPayday || budgetConfig?.settings?.customNextPayday,
  };
  const periodInfo = getBudgetPeriodInfo(activeYear, activeMonth, activeDay, rawPayday, customPeriod);
  const daysInMonth = periodInfo.totalDays;

  let periodRecordedIncome = 0;
  transactions.forEach((tx) => {
    if (tx.type === 'income') {
      const isLoanDisbursement = Boolean(tx.note && /^pencairan utang:/i.test(tx.note.trim()));
      if (!isLoanDisbursement) {
        const d = parseLocalDay(tx.date);
        if (isDateInBudgetPeriod(d, periodInfo)) {
          periodRecordedIncome += tx.amount;
        }
      }
    }
  });

  const rawEstIncome = typeof budgetConfig?.estimatedIncome === 'number' ? budgetConfig.estimatedIncome : 0;
  const estIncome = Math.max(rawEstIncome, periodRecordedIncome);

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
        if (!isDebtScheduledForBudgetPeriod(matchedDebt, periodInfo)) return;
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

  // 2b. Auto-include active payable debts (cicilan utang) scheduled in this period into fixed obligations
  payableDebts.forEach((debt) => {
    if (debt.status !== 'active') return;
    if (!isDebtScheduledForBudgetPeriod(debt, periodInfo)) return;
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

  // 3. Partition transactions in the active budget period into Variable (Harian), Non-Daily (Kondangan/Sosial), Grocery (Belanja Bulanan), and Fixed (Tagihan)
  let monthlyVarExp = 0;
  let monthlyNonDailyExp = 0;
  let monthlyGrocExp = 0;
  let monthlyFixExp = 0;
  let todayVarExp = 0;
  let todayNonDailyExp = 0;
  let todayGrocExp = 0;
  let todayFixExp = 0;
  const recordedTxIds = new Set<string>();

  transactions.forEach((tx) => {
    recordedTxIds.add(tx.id);
    if (tx.type !== 'expense') return;
    const d = parseLocalDay(tx.date);
    if (isDateInBudgetPeriod(d, periodInfo)) {
      const cat = tx.categoryId ? categoryMap.get(tx.categoryId) || null : null;
      // Savings allocations belong to the Tabungan bucket
      if (isSavingsExpense(tx, cat)) return;

      const nonDaily = isNonDailyExpense(tx, cat);
      const grocery = !nonDaily && isGroceryExpense(tx, cat);
      const fixed = !nonDaily && !grocery && isFixedExpense(tx, cat);

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
      } else if (nonDaily) {
        monthlyNonDailyExp += tx.amount;
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
        } else if (nonDaily) {
          todayNonDailyExp += tx.amount;
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

  // 5. Dynamic Operational, Grocery & Non-Daily Social Pool:
  // - Both Belanja Bulanan (monthlyGrocExp) and Kondangan/Amplop/Ngado/Sosial (monthlyNonDailyExp)
  //   reduce Saldo Pos Harian (monthlyVariableBudget), so Kuota Harian automatically recalculates/updates
  //   following the remaining balance in Pos Harian.
  // - Neither is counted in todayVarExp, so giving an amplop/ngado today does NOT wipe out today's
  //   single-day eating/transport allowance all at once.
  const initialOperationalPool = Math.max(0, monthlySpendingLimit - monthlyFixedBudget);
  const monthlyGroceryBudget = initialOperationalPool;
  const monthlyVariableBudget = Math.max(
    0,
    initialOperationalPool - monthlyGrocExp - monthlyNonDailyExp
  );

  // 6. Sisa Uang Operasional & Kuota Harian Dinamis
  const priorDaysVarExp = Math.max(0, monthlyVarExp - todayVarExp);
  const remainingMonthlyVarBeforeToday = Math.max(
    0,
    monthlyVariableBudget - priorDaysVarExp
  );
  const remainingVariableBudget = Math.max(
    0,
    monthlyVariableBudget - monthlyVarExp
  );
  const remainingGroceryBudget = remainingVariableBudget;

  const baseDailyAfterGrocery =
    estIncome > 0 && daysInMonth > 0 ? Math.round(monthlyVariableBudget / daysInMonth) : 0;

  const rollingDailyBeforeToday =
    estIncome > 0 && periodInfo.daysRemainingUntilPayday > 0
      ? Math.round(remainingMonthlyVarBeforeToday / periodInfo.daysRemainingUntilPayday)
      : 0;

  // Kuota Harian otomatis mengikuti sisa Saldo Pos Harian setelah dipotong Belanja Bulanan & Kondangan/Amplop/Ngado
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

  // Tomorrow's daily quota after today's variable spending (rolls over excess today across remaining days until payday)
  const tomorrowRemainingDays =
    periodInfo.daysRemainingUntilPayday > 1 ? periodInfo.daysRemainingUntilPayday - 1 : 1;
  const rollingTomorrowQuota =
    estIncome > 0 && tomorrowRemainingDays > 0
      ? Math.round(remainingVariableBudget / tomorrowRemainingDays)
      : 0;
  const tomorrowDailyQuota =
    periodInfo.daysRemainingUntilPayday > 1
      ? Math.min(baseDailyAfterGrocery, rollingTomorrowQuota)
      : baseDailyAfterGrocery;
  const tomorrowQuotaDiff = Math.max(0, effectiveDailyQuota - tomorrowDailyQuota);

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
    todayNonDailyExpense: todayNonDailyExp,
    todayGroceryExpense: todayGrocExp,
    todayFixedExpense: todayFixExp,
    todayTotalExpense: todayVarExp + todayNonDailyExp + todayGrocExp + todayFixExp,
    dailyBudgetRemaining,
    remainingGroceryBudget,
    dailyOverbudget,
    dailyOverbudgetAmount,
    tomorrowDailyQuota,
    tomorrowQuotaDiff,
    monthlyFixedExpense: monthlyFixExp,
    monthlyNonDailyExpense: monthlyNonDailyExp,
    monthlyGroceryExpense: monthlyGrocExp,
    monthlyVariableExpense: monthlyVarExp,
    monthlyTotalExpense: monthlyVarExp + monthlyNonDailyExp + monthlyGrocExp + monthlyFixExp,
    paydayDay: periodInfo.paydayDay,
    isCustomFlexiblePeriod: Boolean(periodInfo.isCustomFlexiblePeriod),
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
