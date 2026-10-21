export type TransactionType = 'expense' | 'income' | 'transfer';

export type WalletType = 'bank' | 'ewallet' | 'cash' | 'credit' | 'paylater' | 'investment' | 'savings' | 'other';
export type ThemeMode = 'system' | 'light' | 'dark';

export type AccentColor = 'lime' | 'pink' | 'orange';

export type BudgetStatus = 'safe' | 'warning' | 'exceeded';

export type BudgetGroup = 'kebutuhan' | 'keinginan' | 'tabungan';

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
  expenseNature?: 'variable' | 'fixed'; // 'variable' (Pengeluaran Harian) | 'fixed' (Tagihan Bulanan)
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
  walletId?: string;
  category?: string;
  interestRate?: number;
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
  expenseNature?: 'variable' | 'fixed'; // 'variable' (Pengeluaran Harian) | 'fixed' (Tagihan Bulanan)
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
  // Pos Anggaran Terpisah: Tagihan Bulanan (Fixed) vs Pengeluaran Harian (Variable)
  monthlyFixedBudget: number;
  monthlyVariableBudget: number;
  monthlyFixedExpense: number;
  monthlyVariableExpense: number;
  todayVariableExpense: number;
  todayFixedExpense: number;
  dailyOverbudget: boolean;
  dailyOverbudgetAmount: number;
}
