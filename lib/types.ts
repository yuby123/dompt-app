export type TransactionType = 'expense' | 'income' | 'transfer';

export type WalletType = 'bank' | 'ewallet' | 'cash' | 'credit' | 'paylater' | 'investment' | 'savings' | 'other';

export type ThemeMode = 'system' | 'light' | 'dark';

export type AccentColor = 'lime' | 'pink';

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
}

export interface BudgetConfig {
  estimatedIncome: number;
  needsPercent: number; // 50%
  wantsPercent: number; // 30%
  savingsPercent: number; // 20%
  subcategories: BudgetSubcategory[];
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
}

export interface Asset {
  id: string;
  name: string;
  type: 'account' | 'liquid' | 'fixed';
  amount: number;
  note?: string;
  institution?: string;
}

export interface Debt {
  id: string;
  name: string;
  type: 'payable' | 'receivable'; // Utang / Piutang
  totalAmount: number;
  remainingAmount: number;
  dueDate: string;
  note?: string;
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
}
