export type TransactionType = 'expense' | 'income' | 'transfer';

export type WalletType = 'bank' | 'ewallet' | 'cash' | 'credit' | 'paylater' | 'investment' | 'savings' | 'other';
export type ThemeMode = 'system' | 'light' | 'dark';

export type AccentColor = 'lime' | 'pink' | 'orange' | 'plum';

export type BudgetStatus = 'safe' | 'warning' | 'exceeded';

export type BudgetGroup = 'kebutuhan' | 'keinginan' | 'tabungan';

export type FoodLifestyleMode = 'eat_out' | 'hybrid' | 'cook_home';

export type ExpenseNature = 'variable' | 'non_daily' | 'grocery' | 'fixed' | 'savings';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  accountNumber?: string;
  color?: string;
  icon?: string;
  isVerified?: boolean;
  reservedAmount?: number;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  groupName: string;
  budgetGroup?: BudgetGroup;
  expenseNature?: ExpenseNature; // 'variable' (Harian) | 'non_daily' (Kondangan/Sosial/Insidental - Bebas Kuota Harian) | 'grocery' (Belanja Bulanan) | 'fixed' (Tagihan Bulanan) | 'savings' (Tabungan)
  iconKey: string;
  emoji?: string;
  colorValue: string;
  isDefault?: boolean;
}

export interface BudgetSubcategory {
  id: string;
  name: string;
  group: BudgetGroup;
  allocatedAmount: number;
  emoji: string;
  dueDateDay?: number;
  subscriptionId?: string;
  isSubscriptionActive?: boolean;
  walletId?: string;
  categoryId?: string;
  frequency?: 'monthly' | 'yearly' | 'weekly';
  lastRecordedPeriod?: string;
  isGroceryStock?: boolean; // Menandakan pos belanja bulanan / bahan masak (tidak dibagi harian)
  isNonDaily?: boolean; // Menandakan pos kondangan / sosial / insidental (tidak memotong kuota harian)
}

export interface RecurringItem {
  id: string;
  name: string;
  emoji: string;
  type: 'expense' | 'income';
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  billingDay: number;
  walletId: string;
  categoryId: string;
  subcategoryId?: string;
  budgetGroup?: BudgetGroup;
  isActive: boolean;
  lastRecordedPeriod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetItem {
  id: string;
  name: string;
  amount: number;
  updatedAt?: string;
}

export interface InvestmentItem {
  id: string;
  name: string;
  type: string;
  amount: number;
  profit: string;
  updatedAt?: string;
}

export interface BudgetConfig {
  estimatedIncome: number;
  needsPercent: number; // 50%
  wantsPercent: number; // 30%
  savingsPercent: number; // 20%
  paydayDay?: number; // Tanggal gajian / mulai siklus budget (1-31, default 1)
  periodMode?: 'standard' | 'custom'; // 'standard' (siklus tgl tetap) | 'custom' (periode fleksibel manual misal gajian maju ke Jumat)
  customPeriodStart?: string; // YYYY-MM-DD (Tanggal mulai / gajian periode ini, misal '2026-10-23')
  customNextPayday?: string; // YYYY-MM-DD (Tanggal gajian berikutnya, misal '2026-11-25' -> bisa >31 hari)
  foodLifestyleMode?: FoodLifestyleMode; // 'eat_out' (Makan Luar) | 'hybrid' (Masak + Beli Luar) | 'cook_home' (Full Masak/Belanja Bulanan)
  mealsOutPerDay?: number; // Jumlah makan beli di luar per hari (misal 3, 1, atau 0)
  subcategories: BudgetSubcategory[];
  subscriptions?: RecurringItem[];
  liquidAssets?: AssetItem[];
  fixedAssets?: AssetItem[];
  investments?: InvestmentItem[];
  categoryBudgets?: Budget[];
  settings?: Partial<AppSettings>;
  deletedIds?: string[];
  updatedAt?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  emoji: string;
  walletId: string;
  isEmergencyFund?: boolean;
  isLocked?: boolean;
  monthlyTargetSaving?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'account' | 'liquid' | 'fixed';
  amount: number;
  note?: string;
  institution?: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  walletId?: string;
  walletName?: string;
  note?: string;
  transactionId?: string;
}

export interface Debt {
  id: string;
  name: string;
  type: 'payable' | 'receivable'; // 'payable' (Utang Saya) | 'receivable' (Piutang / Dipinjam Orang)
  contactName: string; // Pihak terkait (e.g. BCA, Budi, Kredivo)
  totalAmount: number;
  remainingAmount: number;
  dueDate: string; // YYYY-MM-DD
  startDate?: string;
  firstPaymentDate?: string; // YYYY-MM-DD: Tanggal/periode mulai masuk tagihan budget (misal bulan depan)
  walletId?: string;
  category?: string;
  interestRate?: number;
  isInstallment?: boolean; // Apakah skema cicilan bulanan
  tenorMonths?: number; // Durasi tempo cicilan dalam bulan (contoh: 3, 6, 12, 24)
  monthlyInstallment?: number; // Besaran nominal cicilan per bulan (contoh: 1.000.000)
  dueDayOfMonth?: number; // Tanggal jatuh tempo pembayaran tiap bulannya (1-31, contoh: 10)
  status: 'active' | 'paid';
  note?: string;
  payments?: DebtPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface UpcomingBill {
  id: string;
  name: string;
  dueDate: string;
  amount: number;
  iconEmoji: string;
  category: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId?: string | null;
  budgetGroup?: BudgetGroup;
  expenseNature?: ExpenseNature; // 'variable' (Pengeluaran Harian) | 'grocery' (Belanja Bulanan/Masak) | 'fixed' (Tagihan Bulanan) | 'savings' (Alokasi Tabungan)
  walletId: string;
  transferWalletId?: string | null;
  date: string; // ISO date string
  note?: string;
  createdAt: string;
  updatedAt: string;
  receiptImageUrl?: string;
}

export interface Budget {
  id: string;
  categoryId?: string | null;
  month: string;
  limitAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  userName: string;
  userEmail: string;
  currency: string;
  language: string;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  showDecimals: boolean;
  hideBalance: boolean;
  onboardingCompleted: boolean;
  aiCredits: number;
  pinEnabled: boolean;
  pinHash?: string;
  pinLength?: number;
  autoLockMinutes?: number;
  avatarUrl?: string;
  paydayDay?: number; // Tanggal gajian / mulai siklus budget (1-31)
  periodMode?: 'standard' | 'custom';
  customPeriodStart?: string;
  customNextPayday?: string;
  manualIncomePeriodKey?: string;
  autoSyncIncome?: boolean;
  periodBudgets?: Record<string, number>;
}

export interface WalletWithBalance extends Wallet {
  balance: number;
  expenseThisMonth: number;
  incomeThisMonth: number;
  transactionCount: number;
  availableBalance: number;
}

export interface TransactionDetail {
  transaction: Transaction;
  wallet: Wallet;
  category?: Category | null;
  transferWallet?: Wallet | null;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netCashflow: number;
  walletCount: number;
  budgetLimit: number;
  budgetSpent: number;
  recentTransactions: TransactionDetail[];
  topExpenseCategory?: string | null;
  hasMonthlyBudget: boolean;
  budgetCount: number;
  dailyBudgetRemaining: number;
  dailyBudgetQuota: number;
  todayIncome: number;
  todayExpense: number;
  emergencyFundRunwayMonths: number;
  liquidAssetsTotal: number;
  // Pos Anggaran Terpisah: Tagihan Bulanan (Fixed) vs Belanja Bulanan/Masak (Grocery) vs Pengeluaran Harian (Variable)
  foodLifestyleMode: FoodLifestyleMode;
  mealsOutPerDay: number;
  monthlyFixedBudget: number;
  monthlyGroceryBudget: number;
  monthlyVariableBudget: number;
  monthlyFixedExpense: number;
  monthlyGroceryExpense: number;
  monthlyNonDailyExpense: number;
  monthlyVariableExpense: number;
  todayVariableExpense: number;
  todayNonDailyExpense: number;
  todayGroceryExpense: number;
  todayFixedExpense: number;
  remainingGroceryBudget: number;
  dailyOverbudget: boolean;
  dailyOverbudgetAmount: number;
  tomorrowDailyQuota: number;
  tomorrowQuotaDiff: number;
  // Siklus Periode Gajian (Payday Cycle)
  paydayDay: number;
  isCustomFlexiblePeriod?: boolean;
  periodTotalDays: number;
  currentPeriodDay: number;
  daysRemainingUntilPayday: number;
  safeDailyBudgetUntilPayday: number;
  remainingVariableBudget: number;
  periodShortLabel: string;
  periodFullLabel: string;
  endShortLabel: string;
}

export type UserRole = 'admin' | 'user';
export type UserAccountStatus = 'pending' | 'active' | 'deactivated';

export type BugReportCategory = 'bug' | 'feedback' | 'feature' | 'other';
export type BugReportPriority = 'low' | 'medium' | 'high';
export type BugReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface BugReport {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: BugReportCategory;
  priority: BugReportPriority;
  title: string;
  description: string;
  pageContext?: string;
  status: BugReportStatus;
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedUserAccount {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  status: UserAccountStatus;
  approvedAt?: string;
  approvedBy?: string;
  deactivatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

