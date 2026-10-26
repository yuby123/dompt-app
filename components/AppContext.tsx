'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccentColor,
  AppSettings,
  AssetItem,
  Budget,
  BudgetConfig,
  BudgetGroup,
  BugReport,
  BugReportCategory,
  BugReportPriority,
  BugReportStatus,
  Category,
  DashboardSummary,
  Debt,
  DebtPayment,
  Goal,
  InvestmentItem,
  ManagedUserAccount,
  RecurringItem,
  ThemeMode,
  Transaction,
  TransactionDetail,
  TransactionType,
  UpcomingBill,
  UserAccountStatus,
  UserRole,
  Wallet,
  WalletWithBalance,
} from '@/lib/types';
import {
  cacheRegisteredAccountLocally,
  changeLocalAccountPassword,
  clearAllData,
  getCleanDefaultWallets,
  getCloudAccountUid,
  getInitialBudgets,
  getInitialSampleTransactions,
  hashAccountPassword,
  isBootstrappedAdminEmail,
  loadActiveLocalUser,
  loadRegisteredAccounts,
  loadStoredAssets,
  loadStoredBudgetConfig,
  loadStoredBudgets,
  loadStoredCategories,
  loadStoredDebts,
  loadStoredDeletedIds,
  loadStoredGoals,
  loadStoredInvestments,
  loadStoredSettings,
  loadStoredSubscriptions,
  loadStoredTransactions,
  loadStoredWallets,
  LocalAccountProfile,
  loginAccountWithPassword,
  registerAccountWithPassword,
  resetStorageToZero,
  saveActiveLocalUser,
  saveRegisteredAccounts,
  saveStoredAssets,
  saveStoredBudgetConfig,
  saveStoredBudgets,
  saveStoredCategories,
  saveStoredDebts,
  saveStoredDeletedIds,
  saveStoredGoals,
  saveStoredInvestments,
  saveStoredSettings,
  saveStoredSubscriptions,
  saveStoredTransactions,
  saveStoredWallets,
} from '@/lib/storage';
import {
  DEFAULT_UPCOMING_BILLS,
  DEFAULT_BUDGET_CONFIG,
  EMPTY_BUDGET_CONFIG,
  DEFAULT_WALLETS,
  DEFAULT_CATEGORIES,
  DEFAULT_DEBTS,
  DEFAULT_GOALS,
  DEFAULT_SETTINGS,
} from '@/lib/constants';
import { exportTransactionsToCSV, formatRupiah } from '@/lib/formatters';
import {
  BudgetPeriodInfo,
  calculateBudgetBreakdown,
  FIXED_EXPENSE_KEYWORDS_REGEX,
  getAdjacentPeriodDateStr,
  getBudgetPeriodInfo,
  getMonthlyDebtInstallmentAmount,
  getMonthlySubscriptionAmount,
  isDateInBudgetPeriod,
  isDebtScheduledForBudgetPeriod,
  isFixedExpense,
  isSavingsExpense,
  parseLocalDay,
  resolveEffectivePeriodIncome,
} from '@/lib/budgetUtils';
import {
  auth,
  googleProvider,
  testConnection,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  User,
} from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  syncUserProfile,
  updateCloudUserProfile,
  registerCloudEmailAccount,
  loginCloudEmailAccount,
  updateCloudAccountPassword,
  fetchCloudUserProfile,
  subscribeToUserProfileStatus,
  fetchAllCloudUsers,
  subscribeToAllCloudUsers,
  updateCloudUserAccountStatus,
  fetchCloudBugReports,
  subscribeToCloudBugReports,
  saveCloudBugReport,
  deleteCloudBugReport,
  fetchUserWallets,
  saveUserWallet,
  deleteUserWallet,
  fetchUserTransactions,
  saveUserTransaction,
  deleteUserTransaction,
  fetchUserGoals,
  saveUserGoal,
  deleteUserGoal,
  fetchUserBudgetConfig,
  saveUserBudgetConfig,
  saveUserExtendedSyncData,
  subscribeToUserBudgetConfig,
  fetchUserDebts,
  saveUserDebt,
  deleteUserDebt,
  fetchUserSubscriptions,
  saveUserSubscription,
  deleteUserSubscription,
  resetUserFirestoreData,
} from '@/lib/firestoreService';

export type TabType =
  | 'dashboard'
  | 'wallets'
  | 'transactions'
  | 'settings'
  | 'budget'
  | 'scanner'
  | 'goals'
  | 'assets'
  | 'debt'
  | 'invest'
  | 'ai-advisor'
  | 'reports'
  | 'tutorial'
  | 'analytics'
  | 'subscriptions'
  | 'health-score'
  | 'admin'
  | 'feedback';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'info';
}

interface AppContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  previousTab: TabType;
  goBack: () => void;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  budgetConfig: BudgetConfig;
  goals: Goal[];
  debts: Debt[];
  subscriptions: RecurringItem[];
  liquidAssets: AssetItem[];
  fixedAssets: AssetItem[];
  investments: InvestmentItem[];
  upcomingBills: UpcomingBill[];
  settings: AppSettings;
  walletsWithBalance: WalletWithBalance[];
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  todayIncome: number;
  todayExpense: number;
  activeDate: string;
  setActiveDate: (date: string) => void;
  activeYear: number;
  activeMonth: number;
  activeDay: number;
  budgetPeriod: BudgetPeriodInfo;
  goToPrevPeriod: () => void;
  goToNextPeriod: () => void;
  goToCurrentPeriod: () => void;
  transactionDetails: TransactionDetail[];
  dashboardSummary: DashboardSummary;
  
  // Modals & Sheets
  isAddTransactionOpen: boolean;
  setIsAddTransactionOpen: (open: boolean) => void;
  editingTransaction: TransactionDetail | null;
  setEditingTransaction: (tx: TransactionDetail | null) => void;
  preselectedTransactionType: TransactionType;
  preselectedTransactionDate: string | null;
  openAddTransaction: (preselectedType?: TransactionType, initialDate?: string) => void;
  openEditTransaction: (tx: TransactionDetail) => void;

  isScanModalOpen: boolean;
  setIsScanModalOpen: (open: boolean) => void;
  scanInitialImage: { base64: string; mimeType: string; autoSave?: boolean } | null;
  setScanInitialImage: (img: { base64: string; mimeType: string; autoSave?: boolean } | null) => void;
  openScanModal: (initialImageBase64?: string | React.MouseEvent<HTMLElement>, mimeType?: string, autoSave?: boolean) => void;
  
  isTransferOpen: boolean;
  setIsTransferOpen: (open: boolean) => void;
  openTransferModal: (fromWalletId?: string) => void;

  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (open: boolean) => void;
  editingWallet: Wallet | null;
  openAddWallet: () => void;
  openEditWallet: (wallet: Wallet) => void;

  isAddGoalModalOpen: boolean;
  setIsAddGoalModalOpen: (open: boolean) => void;
  selectedGoalDetail: Goal | null;
  setSelectedGoalDetail: (goal: Goal | null) => void;
  openAddGoal: () => void;
  openGoalDetail: (goal: Goal) => void;

  isEditBudgetCategoryModalOpen: boolean;
  setIsEditBudgetCategoryModalOpen: (open: boolean) => void;
  isAddSubcategoryModalOpen: boolean;
  setIsAddSubcategoryModalOpen: (open: boolean) => void;
  editingSubcategoryGroup: BudgetGroup;
  setEditingSubcategoryGroup: (group: BudgetGroup) => void;

  // Security / PIN
  isLocked: boolean;
  unlockApp: () => void;
  lockApp: () => void;
  setAppPin: (pin: string) => void;
  disableAppPin: () => void;
  verifyPinCode: (pin: string) => boolean;

  // CRUD Operations
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => string;
  updateTransaction: (id: string, data: Partial<Transaction>) => boolean;
  deleteTransaction: (id: string) => void;

  addWallet: (data: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWallet: (id: string, data: Partial<Wallet>) => void;
  deleteWallet: (id: string) => boolean;
  verifyWalletBalance: (id: string) => void;

  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleLockGoal: (id: string) => void;

  addDebt: (data: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>, options?: { disburseWalletId?: string }) => boolean;
  updateDebt: (id: string, data: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  payDebtInstallment: (debtId: string, amount: number, options?: { walletId?: string; date?: string; note?: string }) => boolean;
  settleDebt: (debtId: string, options?: { walletId?: string; date?: string; note?: string }) => boolean;
  cancelDebtPayment: (debtId: string, paymentId?: string) => boolean;

  updateBudgetConfig: (config: Partial<BudgetConfig>) => void;
  addBudgetSubcategory: (item: { name: string; group: BudgetGroup; allocatedAmount: number; emoji: string; dueDateDay?: number; isGroceryStock?: boolean }) => void;
  updateBudgetSubcategory: (id: string, data: { name?: string; group?: BudgetGroup; allocatedAmount?: number; emoji?: string; dueDateDay?: number; isGroceryStock?: boolean }) => void;
  deleteBudgetSubcategory: (id: string) => void;

  addSubscription: (item: Omit<RecurringItem, 'id'>) => void;
  updateSubscription: (id: string, data: Partial<RecurringItem>) => void;
  deleteSubscription: (id: string) => void;
  toggleSubscriptionActive: (id: string) => void;
  recordSubscriptionPayment: (
    id: string,
    options?: { walletId?: string; amount?: number; date?: string; note?: string }
  ) => boolean;
  cancelSubscriptionPayment: (id: string, txIdsToRemove?: string[]) => boolean;
  syncSubscriptionsToBudget: () => void;

  addAsset: (type: 'liquid' | 'fixed', item: Omit<AssetItem, 'id'>) => void;
  deleteAsset: (type: 'liquid' | 'fixed', id: string) => void;

  addInvestment: (item: Omit<InvestmentItem, 'id'>) => void;
  deleteInvestment: (id: string) => void;

  transferFunds: (fromWalletId: string, toWalletId: string, amount: number, note?: string, date?: string) => boolean;
  updateSettings: (data: Partial<AppSettings>, silent?: boolean) => void;
  toggleHideBalance: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (accent: AccentColor) => void;
  deductAiCredit: (amount?: number) => boolean;
  addAiCredits: (amount: number) => void;

  // Insufficient Balance Alert & Helpers
  insufficientBalanceAlert: InsufficientBalanceAlertInfo | null;
  setInsufficientBalanceAlert: (alert: InsufficientBalanceAlertInfo | null) => void;
  triggerInsufficientBalanceAlert: (
    walletId: string,
    paymentAmount: number,
    transactionLabel?: string,
    customWalletBalance?: number
  ) => void;
  getWalletBalance: (walletId?: string, excludeTxId?: string) => number;

  // Utilities
  toasts: ToastMessage[];
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  exportToCSV: () => void;
  resetAllAppData: () => void;

  // Auth & Multi-User Support
  user: (User & { isLocalAccount?: boolean; role?: UserRole; status?: UserAccountStatus }) | LocalAccountProfile | null;
  authLoading: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  openLoginModal: () => void;
  signInWithGoogle: () => Promise<void>;
  registerWithEmailPassword: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  loginWithEmailPassword: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signOutUser: () => Promise<void>;
  dataResetVersion: number;

  // Super App Role, Account Approval & Bug Report System
  userRole: UserRole;
  userAccountStatus: UserAccountStatus;
  isAdmin: boolean;
  managedUsers: ManagedUserAccount[];
  bugReports: BugReport[];
  approveUserAccount: (uid: string, email: string, displayName: string) => Promise<void>;
  deactivateUserAccount: (uid: string, email: string, displayName: string) => Promise<void>;
  setPendingUserAccount: (uid: string, email: string, displayName: string) => Promise<void>;
  updateUserAccountRole: (uid: string, email: string, displayName: string, role: UserRole) => Promise<void>;
  refreshUserAccountStatus: () => Promise<void>;
  refreshAdminData: () => Promise<void>;
  submitBugReport: (input: {
    type: BugReportCategory;
    priority: BugReportPriority;
    title: string;
    description: string;
    pageContext?: string;
  }) => Promise<boolean>;
  updateBugReportByAdmin: (
    reportId: string,
    status: BugReportStatus,
    adminReply?: string
  ) => Promise<boolean>;
  deleteBugReportById: (reportId: string) => Promise<boolean>;
  changeAccountPassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  adminResetUserPassword: (
    targetEmail: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
}

export interface InsufficientBalanceAlertInfo {
  walletName: string;
  walletBalance: number;
  paymentAmount: number;
  shortfall: number;
  transactionLabel?: string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTabState] = useState<TabType>('dashboard');
  const [previousTab, setPreviousTab] = useState<TabType>('dashboard');
  const [dataResetVersion, setDataResetVersion] = useState<number>(0);
  const [insufficientBalanceAlert, setInsufficientBalanceAlert] =
    useState<InsufficientBalanceAlertInfo | null>(null);

  const setActiveTab = (tab: TabType) => {
    const targetTab = tab === 'health-score' ? 'analytics' : tab;
    setPreviousTab(activeTab);
    setActiveTabState(targetTab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    setActiveTabState(previousTab || 'dashboard');
  };

  // Core Data States (Start completely empty; populated exclusively by direct Firestore GET on load)
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [baseCategories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>(EMPTY_BUDGET_CONFIG);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<RecurringItem[]>([]);
  const [liquidAssets, setLiquidAssets] = useState<AssetItem[]>([]);
  const [fixedAssets, setFixedAssets] = useState<AssetItem[]>([]);
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Merge default/stored categories with user's budget subcategories so custom budget items
  // (e.g. "Service Motor", "Parkir", etc.) appear directly in the Category picker of AddTransactionModal
  const categories = useMemo<Category[]>(() => {
    const list: Category[] = [...baseCategories];
    const subs = budgetConfig?.subcategories || [];
    if (subs.length === 0) return list;

    const existingIds = new Set(list.map((c) => c.id));
    const existingNames = new Set(list.map((c) => c.name.toLowerCase().trim()));

    const inferIconAndColor = (name: string, group: BudgetGroup): { iconKey: string; colorValue: string } => {
      const lower = name.toLowerCase();
      if (/motor|mobil|service|servis|bensin|parkir|ojol|transport|tol|bengkel/i.test(lower)) {
        return { iconKey: 'Car', colorValue: '#3B82F6' };
      }
      if (/makan|minum|jajan|kopi|kuliner|masak|sembako/i.test(lower)) {
        return { iconKey: 'Utensils', colorValue: '#F97316' };
      }
      if (/listrik|pln|token/i.test(lower)) {
        return { iconKey: 'Zap', colorValue: '#EAB308' };
      }
      if (/wifi|wi-fi|internet|kuota|pulsa/i.test(lower)) {
        return { iconKey: 'Smartphone', colorValue: '#06B6D4' };
      }
      if (/cicilan|utang|hutang|angsuran|tagihan|kpr|paylater/i.test(lower)) {
        return { iconKey: 'Receipt', colorValue: '#EF4444' };
      }
      if (group === 'tabungan') {
        return { iconKey: 'PiggyBank', colorValue: '#10B981' };
      }
      if (group === 'keinginan') {
        return { iconKey: 'ShoppingBag', colorValue: '#EC4899' };
      }
      return { iconKey: 'Home', colorValue: '#0D9488' };
    };

    for (const sub of subs) {
      const subName = (sub.name || '').trim();
      if (!subName) continue;
      const subNameLower = subName.toLowerCase();

      // If this subcategory already has a matching category by name, enrich its emoji/group if needed
      if (existingNames.has(subNameLower)) {
        continue;
      }

      const groupName =
        sub.group === 'tabungan'
          ? 'Tabungan'
          : sub.group === 'keinginan'
          ? 'Keinginan'
          : 'Kebutuhan';

      const isDebtSub =
        sub.id.startsWith('sub-debt-') ||
        /^(cicilan|utang|hutang|angsuran|kpr|paylater)\b/i.test(subNameLower);
      const isFixedSub =
        isDebtSub ||
        Boolean(sub.dueDateDay) ||
        Boolean(sub.subscriptionId) ||
        FIXED_EXPENSE_KEYWORDS_REGEX.test(subNameLower);

      const expenseNature =
        sub.group === 'tabungan'
          ? 'savings'
          : isFixedSub
          ? 'fixed'
          : sub.isNonDaily
          ? 'non_daily'
          : sub.isGroceryStock
          ? 'non_daily'
          : 'variable';

      const { iconKey, colorValue } = inferIconAndColor(subName, sub.group);
      const catId = existingIds.has(sub.id) ? `cat-${sub.id}` : sub.id;

      list.push({
        id: catId,
        name: subName,
        type: 'expense',
        groupName,
        budgetGroup: sub.group,
        expenseNature,
        iconKey,
        emoji: sub.emoji,
        colorValue,
        isDefault: false,
      });
      existingIds.add(catId);
      existingNames.add(subNameLower);
    }

    return list;
  }, [baseCategories, budgetConfig?.subcategories]);

  // Active Date & Reference Period (Defaults to current real date & month)
  const getTodayDateStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [activeDate, setActiveDate] = useState<string>(() => getTodayDateStr());
  const activeDateObj = useMemo(() => new Date(activeDate + 'T12:00:00'), [activeDate]);
  const activeYear = activeDateObj.getFullYear();
  const activeMonth = activeDateObj.getMonth();
  const activeDay = activeDateObj.getDate();

  const rawPayday = budgetConfig?.paydayDay || settings?.paydayDay || budgetConfig?.settings?.paydayDay || 1;
  const effectivePaydayDay = Math.max(1, Math.min(31, Math.round(Number(rawPayday) || 1)));

  const effectivePeriodMode =
    budgetConfig?.periodMode || settings?.periodMode || budgetConfig?.settings?.periodMode;
  const effectiveCustomStart =
    budgetConfig?.customPeriodStart || settings?.customPeriodStart || budgetConfig?.settings?.customPeriodStart;
  const effectiveCustomNext =
    budgetConfig?.customNextPayday || settings?.customNextPayday || budgetConfig?.settings?.customNextPayday;

  const customPeriodConfig = useMemo(
    () => ({
      periodMode: effectivePeriodMode,
      customPeriodStart: effectiveCustomStart,
      customNextPayday: effectiveCustomNext,
    }),
    [effectivePeriodMode, effectiveCustomStart, effectiveCustomNext]
  );

  const budgetPeriod = useMemo<BudgetPeriodInfo>(() => {
    return getBudgetPeriodInfo(
      activeYear,
      activeMonth,
      activeDay,
      effectivePaydayDay,
      customPeriodConfig
    );
  }, [activeYear, activeMonth, activeDay, effectivePaydayDay, customPeriodConfig]);

  const goToPrevPeriod = () => {
    const prevDateStr = getAdjacentPeriodDateStr(
      activeYear,
      activeMonth,
      activeDay,
      effectivePaydayDay,
      -1,
      customPeriodConfig
    );
    setActiveDate(prevDateStr);
  };

  const goToNextPeriod = () => {
    const nextDateStr = getAdjacentPeriodDateStr(
      activeYear,
      activeMonth,
      activeDay,
      effectivePaydayDay,
      1,
      customPeriodConfig
    );
    setActiveDate(nextDateStr);
  };

  const goToCurrentPeriod = () => {
    const todayStr = getTodayDateStr();
    if (effectivePeriodMode === 'custom' && effectiveCustomStart && effectiveCustomNext) {
      const todayD = parseLocalDay(todayStr);
      const startD = parseLocalDay(effectiveCustomStart);
      const nextD = parseLocalDay(effectiveCustomNext);
      if (
        !Number.isNaN(startD.getTime()) &&
        !Number.isNaN(nextD.getTime()) &&
        (todayD.getTime() < startD.getTime() || todayD.getTime() >= nextD.getTime())
      ) {
        setActiveDate(effectiveCustomStart);
        return;
      }
    }
    setActiveDate(todayStr);
  };

  // Modals & dialog states
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionDetail | null>(null);
  const [preselectedTransactionType, setPreselectedTransactionType] = useState<TransactionType>('expense');
  const [preselectedTransactionDate, setPreselectedTransactionDate] = useState<string | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanInitialImage, setScanInitialImage] = useState<{ base64: string; mimeType: string; autoSave?: boolean } | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [selectedGoalDetail, setSelectedGoalDetail] = useState<Goal | null>(null);
  const [isEditBudgetCategoryModalOpen, setIsEditBudgetCategoryModalOpen] = useState(false);
  const [isAddSubcategoryModalOpen, setIsAddSubcategoryModalOpen] = useState(false);
  const [editingSubcategoryGroup, setEditingSubcategoryGroup] = useState<BudgetGroup>('kebutuhan');

  // Auth & Multi-User State
  const [user, setUser] = useState<
    (User & { isLocalAccount?: boolean; role?: UserRole; status?: UserAccountStatus }) | LocalAccountProfile | null
  >(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Super App Role, Approval Status, Managed Users & Bug Reports
  const [userRoleState, setUserRoleState] = useState<UserRole>('user');
  const [userAccountStatusState, setUserAccountStatusState] = useState<UserAccountStatus>('active');
  const [cloudManagedUsers, setCloudManagedUsers] = useState<ManagedUserAccount[]>([]);
  const [localManagedUsers, setLocalManagedUsers] = useState<ManagedUserAccount[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);

  const userRole: UserRole = useMemo(() => {
    if (!user) return 'user';
    if (isBootstrappedAdminEmail(user.email)) return 'admin';
    if ((user as LocalAccountProfile).role === 'admin') return 'admin';
    return userRoleState;
  }, [user, userRoleState]);

  const userAccountStatus: UserAccountStatus = useMemo(() => {
    if (!user) return 'active';
    if (isBootstrappedAdminEmail(user.email) || userRole === 'admin') return 'active';
    const profileStatus = (user as LocalAccountProfile).status;
    return userAccountStatusState || profileStatus || 'active';
  }, [user, userRole, userAccountStatusState]);

  const isAdmin = userRole === 'admin';

  // Merge cloud users and locally registered accounts so Admin sees all registered accounts
  const managedUsers = useMemo<ManagedUserAccount[]>(() => {
    const map = new Map<string, ManagedUserAccount>();
    for (const loc of localManagedUsers) {
      if (!loc?.email) continue;
      const key = loc.email.toLowerCase();
      map.set(key, loc);
    }
    for (const cld of cloudManagedUsers) {
      if (!cld?.email) continue;
      const key = cld.email.toLowerCase();
      const existing = map.get(key);
      if (!existing || (cld.updatedAt || '') >= (existing.updatedAt || '')) {
        map.set(key, {
          ...existing,
          ...cld,
          role: isBootstrappedAdminEmail(cld.email) ? 'admin' : cld.role || existing?.role || 'user',
          status: isBootstrappedAdminEmail(cld.email)
            ? 'active'
            : cld.status || existing?.status || 'active',
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [cloudManagedUsers, localManagedUsers]);

  const openLoginModal = () => setIsLoginModalOpen(true);

  const isCloudUser = Boolean(user?.uid);
  const localScopeUid = user?.uid || undefined;

  // Security / App Lock & Toasts
  const [isLocked, setIsLocked] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const lastToastTimeRef = useRef<{ [key: string]: number }>({});

  const addToast = (
    title: string,
    message?: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    const now = Date.now();
    const key = `${title}_${type}`;
    // Debounce duplicate toast notifications within 700ms
    if (lastToastTimeRef.current[key] && now - lastToastTimeRef.current[key] < 700) {
      return;
    }
    lastToastTimeRef.current[key] = now;

    const id = `toast-${now}-${Math.random().toString(36).substring(2, 6)}`;

    setToasts((prev) => {
      // Remove any existing toast with the same title to avoid duplicate stacking
      const filtered = prev.filter((t) => t.title !== title);
      // Limit to at most 2 concurrent toasts on screen
      const trimmed = filtered.length >= 2 ? filtered.slice(-1) : filtered;
      return [...trimmed, { id, title, message, type }];
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const isCloudSyncingRef = useRef(false);
  const lastLocalMutationRef = useRef<number>(0);
  const lastSeenCloudUpdatedAtRef = useRef<string>('');

  const markLocalMutation = () => {
    lastLocalMutationRef.current = Date.now();
  };

  const getMirrorUid = (primaryUid?: string, email?: string | null): string | undefined => {
    if (!email) return undefined;
    const acctUid = getCloudAccountUid(email);
    return acctUid && acctUid !== primaryUid ? acctUid : undefined;
  };

  // Helper to persist full budgetConfig + extended state (subscriptions, assets, investments, settings, deletedIds) to Cloud
  const persistExtendedBudgetToCloud = (
    uid: string,
    mirrorUid: string | undefined,
    overrides?: {
      budgetConfig?: BudgetConfig;
      subscriptions?: RecurringItem[];
      liquidAssets?: AssetItem[];
      fixedAssets?: AssetItem[];
      investments?: InvestmentItem[];
      categoryBudgets?: Budget[];
      settings?: AppSettings;
      deletedIds?: string[];
    }
  ) => {
    const now = new Date().toISOString();
    lastLocalMutationRef.current = Date.now();
    lastSeenCloudUpdatedAtRef.current = now;
    const baseCfg = overrides?.budgetConfig ?? budgetConfig;
    const fullCfg: BudgetConfig = {
      ...baseCfg,
      subscriptions: overrides?.subscriptions ?? subscriptions,
      liquidAssets: overrides?.liquidAssets ?? liquidAssets,
      fixedAssets: overrides?.fixedAssets ?? fixedAssets,
      investments: overrides?.investments ?? investments,
      categoryBudgets: overrides?.categoryBudgets ?? budgets,
      settings: overrides?.settings ?? settings,
      deletedIds: overrides?.deletedIds ?? deletedIds,
      updatedAt: now,
    };
    setBudgetConfig(fullCfg);
    saveUserBudgetConfig(uid, fullCfg).catch((err) =>
      console.warn('Error saving extended budget config to Firestore:', err)
    );
    if (mirrorUid) {
      saveUserBudgetConfig(mirrorUid, fullCfg).catch(() => {});
    }
  };

  const recordDeletedId = (ids: string | (string | undefined)[], currentDeleted = deletedIds): string[] => {
    const idList = (Array.isArray(ids) ? ids : [ids]).filter((x): x is string => Boolean(x));
    const next = Array.from(new Set([...currentDeleted, ...idList])).slice(-400);
    setDeletedIds(next);
    return next;
  };

  // Pure in-memory reconcile for subscriptions directly from cloud state (NO writes to database during sync!)
  const reconcileCloudSubscriptions = (
    cloudSubs: RecurringItem[],
    budget: BudgetConfig,
    activeWallets: Wallet[],
    deletedSet: Set<string>
  ): RecurringItem[] => {
    const embeddedSubs = Array.isArray(budget.subscriptions) ? budget.subscriptions : [];
    const mergedMap = new Map<string, RecurringItem>();

    const addOrUpdateRec = (item: RecurringItem) => {
      if (!item?.id || deletedSet.has(item.id)) return;
      if (item.subcategoryId && deletedSet.has(item.subcategoryId)) return;
      const lowerName = item.name.toLowerCase().trim();
      const existingById = mergedMap.get(item.id);
      if (existingById) {
        const existingTime = existingById.updatedAt ? new Date(existingById.updatedAt).getTime() : 0;
        const itemTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
        if (itemTime >= existingTime) {
          mergedMap.set(item.id, item);
        }
        return;
      }
      const existingByName = Array.from(mergedMap.values()).find(
        (c) => c.type === item.type && c.name.toLowerCase().trim() === lowerName
      );
      if (!existingByName) {
        mergedMap.set(item.id, item);
      } else {
        const existingTime = existingByName.updatedAt ? new Date(existingByName.updatedAt).getTime() : 0;
        const itemTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
        if (itemTime > existingTime) {
          mergedMap.delete(existingByName.id);
          mergedMap.set(item.id, item);
        }
      }
    };

    for (const item of embeddedSubs) addOrUpdateRec(item);
    for (const item of cloudSubs) addOrUpdateRec(item);

    const subcats = (budget.subcategories || []).filter(
      (s) => !deletedSet.has(s.id) && !(s.subscriptionId && deletedSet.has(s.subscriptionId))
    );

    const validSubs: RecurringItem[] = [];
    for (const rec of mergedMap.values()) {
      if (rec.type !== 'expense') {
        validSubs.push(rec);
        continue;
      }
      if (subcats.length === 0) {
        if (!rec.subcategoryId) {
          validSubs.push(rec);
        }
        continue;
      }
      const rName = rec.name.toLowerCase().trim();
      const matchedSub = subcats.find(
        (s) =>
          s.id === rec.subcategoryId ||
          s.subscriptionId === rec.id ||
          s.name.toLowerCase().trim() === rName
      );
      if (matchedSub) {
        validSubs.push({
          ...rec,
          subcategoryId: matchedSub.id,
          name: matchedSub.name || rec.name,
          emoji: matchedSub.emoji || rec.emoji,
          budgetGroup: matchedSub.group || rec.budgetGroup,
          billingDay: matchedSub.dueDateDay ?? rec.billingDay,
          amount:
            rec.frequency === 'monthly' && matchedSub.allocatedAmount > 0
              ? matchedSub.allocatedAmount
              : rec.amount,
          isActive:
            matchedSub.isSubscriptionActive !== undefined
              ? matchedSub.isSubscriptionActive
              : rec.isActive,
          walletId: matchedSub.walletId || rec.walletId,
          categoryId: matchedSub.categoryId || rec.categoryId,
          lastRecordedPeriod:
            rec.lastRecordedPeriod !== undefined
              ? rec.lastRecordedPeriod
              : matchedSub.lastRecordedPeriod,
        });
      }
    }

    // Reconstruct expense subscriptions from subcategories in memory
    const preferredWallet =
      activeWallets.find((w) => w.name.toLowerCase().includes('dana')) ||
      activeWallets.find(
        (w) => w.initialBalance > 0 && w.type !== 'credit' && w.type !== 'paylater'
      ) ||
      activeWallets[0];

    for (const sub of subcats) {
      const subNameLower = sub.name.toLowerCase().trim();
      if (sub.id.startsWith('sub-debt-') || subNameLower.startsWith('cicilan ')) {
        continue;
      }
      const isSubscriptionSub = Boolean(
        sub.subscriptionId || sub.dueDateDay !== undefined || sub.isSubscriptionActive !== undefined
      );
      if (!isSubscriptionSub) continue;

      const targetSubId = sub.subscriptionId || `sub-rec-${sub.id}`;
      if (deletedSet.has(targetSubId) || deletedSet.has(sub.id)) continue;

      const existsInValid = validSubs.some(
        (rec) =>
          rec.type === 'expense' &&
          (rec.id === sub.subscriptionId ||
            rec.subcategoryId === sub.id ||
            rec.name.toLowerCase().trim() === subNameLower)
      );

      if (!existsInValid) {
        const inferredCatId =
          sub.categoryId ||
          (sub.group === 'keinginan'
            ? 'cat-hiburan'
            : subNameLower.includes('listrik')
            ? 'cat-listrik'
            : subNameLower.includes('bpjs')
            ? 'cat-bpjs'
            : subNameLower.includes('air')
            ? 'cat-air'
            : 'cat-tagihan');

        validSubs.push({
          id: targetSubId,
          name: sub.name,
          emoji: sub.emoji || (sub.group === 'keinginan' ? '🎬' : '🛜'),
          type: 'expense',
          amount: sub.allocatedAmount,
          frequency: sub.frequency || 'monthly',
          billingDay: sub.dueDateDay || 1,
          walletId: sub.walletId || preferredWallet?.id || 'wallet-cash-main',
          categoryId: inferredCatId,
          subcategoryId: sub.id,
          budgetGroup: sub.group,
          isActive: sub.isSubscriptionActive !== false,
          lastRecordedPeriod: sub.lastRecordedPeriod,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return validSubs;
  };

  // Pure 100% Database Read Sync (ZERO writes during sync to prevent stale overwrites)
  const syncAllAccountDataWithCloud = async (
    primaryUid: string,
    email: string,
    displayName: string,
    _isNewRegistration = false,
    mirrorUid?: string,
    _isBackgroundSync = false
  ) => {
    const syncStartTime = Date.now();

    // Fetch primary UID collections directly from Firestore
    const [
      loadedWallets,
      loadedTx,
      loadedGoals,
      loadedBudget,
      loadedDebts,
      loadedSubs,
    ] = await Promise.all([
      fetchUserWallets(primaryUid).catch(() => [] as Wallet[]),
      fetchUserTransactions(primaryUid).catch(() => [] as Transaction[]),
      fetchUserGoals(primaryUid).catch(() => [] as Goal[]),
      fetchUserBudgetConfig(primaryUid).catch(() => null),
      fetchUserDebts(primaryUid).catch(() => [] as Debt[]),
      fetchUserSubscriptions(primaryUid).catch(() => [] as RecurringItem[]),
    ]);

    let mirrorWallets: Wallet[] = [];
    let mirrorTx: Transaction[] = [];
    let mirrorGoals: Goal[] = [];
    let mirrorBudget: BudgetConfig | null = null;
    let mirrorDebts: Debt[] = [];
    let mirrorSubs: RecurringItem[] = [];

    if (mirrorUid && mirrorUid !== primaryUid) {
      [
        mirrorWallets,
        mirrorTx,
        mirrorGoals,
        mirrorBudget,
        mirrorDebts,
        mirrorSubs,
      ] = await Promise.all([
        fetchUserWallets(mirrorUid).catch(() => [] as Wallet[]),
        fetchUserTransactions(mirrorUid).catch(() => [] as Transaction[]),
        fetchUserGoals(mirrorUid).catch(() => [] as Goal[]),
        fetchUserBudgetConfig(mirrorUid).catch(() => null),
        fetchUserDebts(mirrorUid).catch(() => [] as Debt[]),
        fetchUserSubscriptions(mirrorUid).catch(() => [] as RecurringItem[]),
      ]);
    }

    // Abort if user made an intentional local mutation on THIS tab while network fetch was in flight
    if (lastLocalMutationRef.current >= syncStartTime) {
      return;
    }

    const effectiveCloudBudget = (() => {
      if (loadedBudget && mirrorBudget) {
        return (loadedBudget.updatedAt || '') >= (mirrorBudget.updatedAt || '')
          ? loadedBudget
          : mirrorBudget;
      }
      return loadedBudget || mirrorBudget || null;
    })();

    const cloudUpdatedAt = effectiveCloudBudget?.updatedAt || '';
    if (cloudUpdatedAt) {
      lastSeenCloudUpdatedAtRef.current = cloudUpdatedAt;
    }

    const cloudDeleted = [
      ...(loadedBudget?.deletedIds || []),
      ...(mirrorBudget?.deletedIds || []),
    ];
    const deletedSet = new Set<string>(cloudDeleted);
    setDeletedIds(cloudDeleted);

    // 1. Transactions directly from Firestore (preserving any newer local edits in-flight)
    const cloudTxMap = new Map<string, Transaction>();
    for (const t of [...(mirrorTx || []), ...(loadedTx || [])]) {
      if (!t?.id || deletedSet.has(t.id)) continue;
      const existing = cloudTxMap.get(t.id);
      if (!existing || (t.updatedAt || '') >= (existing.updatedAt || '')) {
        cloudTxMap.set(t.id, t);
      }
    }
    const localStoredTx = loadStoredTransactions(primaryUid);
    for (const localTx of localStoredTx) {
      if (!localTx?.id || deletedSet.has(localTx.id)) continue;
      const cloudExisting = cloudTxMap.get(localTx.id);
      if (cloudExisting && (localTx.updatedAt || '') > (cloudExisting.updatedAt || '')) {
        cloudTxMap.set(localTx.id, localTx);
        saveUserTransaction(primaryUid, localTx).catch(() => {});
        if (mirrorUid && mirrorUid !== primaryUid) {
          saveUserTransaction(mirrorUid, localTx).catch(() => {});
        }
      }
    }
    const finalTx = Array.from(cloudTxMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setTransactions(finalTx);

    // 2. Wallets directly from Firestore
    const cloudWalletMap = new Map<string, Wallet>();
    for (const w of [...(mirrorWallets || []), ...(loadedWallets || [])]) {
      if (!w?.id || deletedSet.has(w.id)) continue;
      const existing = cloudWalletMap.get(w.id);
      if (!existing || (w.updatedAt || '') >= (existing.updatedAt || '')) {
        cloudWalletMap.set(w.id, w);
      }
    }
    const finalWallets = Array.from(cloudWalletMap.values());
    setWallets(finalWallets);

    // 3. Goals directly from Firestore
    const cloudGoalMap = new Map<string, Goal>();
    for (const g of [...(mirrorGoals || []), ...(loadedGoals || [])]) {
      if (!g?.id || deletedSet.has(g.id)) continue;
      const existing = cloudGoalMap.get(g.id);
      if (!existing || (g.updatedAt || '') >= (existing.updatedAt || '')) {
        cloudGoalMap.set(g.id, g);
      }
    }
    setGoals(Array.from(cloudGoalMap.values()));

    // 4. Debts directly from Firestore
    const cloudDebtMap = new Map<string, Debt>();
    for (const d of [...(mirrorDebts || []), ...(loadedDebts || [])]) {
      if (!d?.id || deletedSet.has(d.id)) continue;
      const existing = cloudDebtMap.get(d.id);
      if (!existing || (d.updatedAt || '') >= (existing.updatedAt || '')) {
        cloudDebtMap.set(d.id, d);
      }
    }
    setDebts(Array.from(cloudDebtMap.values()));

    // 5. Budget Config & Subcategories directly from Firestore
    const authoritativeBudgetSource = effectiveCloudBudget || EMPTY_BUDGET_CONFIG;
    const subcatMap = new Map<string, BudgetConfig['subcategories'][number]>();
    const sourceSubcats = authoritativeBudgetSource.subcategories || [];
    for (const s of sourceSubcats) {
      if (!s?.id || deletedSet.has(s.id)) continue;
      if (s.subscriptionId && deletedSet.has(s.subscriptionId)) continue;
      subcatMap.set(s.id, s);
    }

    // Auto-reconcile all active payable debts into subcategories using their MONTHLY installment cost
    for (const d of cloudDebtMap.values()) {
      if (d.type !== 'payable' || d.status !== 'active') continue;
      const debtSubId = `sub-debt-${d.id}`;
      const cleanDebtName = d.name.toLowerCase().trim();
      const subDisplayName = d.name.toLowerCase().startsWith('cicilan')
        ? d.name
        : `Cicilan ${d.name}`;
      const existing = Array.from(subcatMap.values()).find((s) => {
        const sLower = s.name.toLowerCase().trim();
        return (
          s.id === debtSubId ||
          s.subscriptionId === d.id ||
          sLower === subDisplayName.toLowerCase() ||
          sLower === cleanDebtName
        );
      });
      let dueDay: number | undefined = d.dueDayOfMonth;
      if (dueDay === undefined && d.dueDate) {
        const pd = new Date(d.dueDate);
        if (!isNaN(pd.getTime())) dueDay = pd.getDate();
      }
      const debtEmoji = /kpr|rumah|kost|kontrak/i.test(d.name)
        ? '🏠'
        : /motor/i.test(d.name)
        ? '🛵'
        : /mobil/i.test(d.name)
        ? '🚗'
        : '💳';
      const allocated = getMonthlyDebtInstallmentAmount(d, existing?.allocatedAmount);
      if (existing) {
        subcatMap.set(existing.id, {
          ...existing,
          dueDateDay: dueDay ?? existing.dueDateDay,
          allocatedAmount: allocated,
          isSubscriptionActive: true,
        });
      } else {
        subcatMap.set(debtSubId, {
          id: debtSubId,
          name: subDisplayName,
          group: 'kebutuhan',
          allocatedAmount: allocated,
          emoji: debtEmoji,
          dueDateDay: dueDay,
          subscriptionId: d.id,
          isSubscriptionActive: true,
        });
      }
    }

    // 6. Liquid Assets, Fixed Assets, Investments, Category Budgets directly from Firestore
    const finalLiquidAssets = (effectiveCloudBudget?.liquidAssets || []).filter(
      (a) => a?.id && !deletedSet.has(a.id)
    );
    const finalFixedAssets = (effectiveCloudBudget?.fixedAssets || []).filter(
      (a) => a?.id && !deletedSet.has(a.id)
    );
    const finalInvestments = (effectiveCloudBudget?.investments || []).filter(
      (i) => i?.id && !deletedSet.has(i.id)
    );
    const finalCategoryBudgets = (effectiveCloudBudget?.categoryBudgets || []).filter(
      (b) => b?.id && !deletedSet.has(b.id)
    );

    setLiquidAssets(finalLiquidAssets);
    setFixedAssets(finalFixedAssets);
    setInvestments(finalInvestments);
    setBudgets(finalCategoryBudgets);

    // 7. Settings
    const cloudSettings = effectiveCloudBudget?.settings || mirrorBudget?.settings;
    if (cloudSettings) {
      setSettings((prev) => ({
        ...prev,
        ...cloudSettings,
        userName: cloudSettings.userName || displayName || prev.userName,
        userEmail: email || cloudSettings.userEmail || prev.userEmail,
      }));
    }

    const resolvedPaydayDay =
      authoritativeBudgetSource.paydayDay ||
      cloudSettings?.paydayDay ||
      1;

    const finalBudget: BudgetConfig = {
      estimatedIncome: authoritativeBudgetSource.estimatedIncome || 0,
      needsPercent: authoritativeBudgetSource.needsPercent ?? 50,
      wantsPercent: authoritativeBudgetSource.wantsPercent ?? 30,
      savingsPercent: authoritativeBudgetSource.savingsPercent ?? 20,
      paydayDay: resolvedPaydayDay,
      periodMode: authoritativeBudgetSource.periodMode || cloudSettings?.periodMode || 'standard',
      customPeriodStart: authoritativeBudgetSource.customPeriodStart || cloudSettings?.customPeriodStart,
      customNextPayday: authoritativeBudgetSource.customNextPayday || cloudSettings?.customNextPayday,
      foodLifestyleMode: authoritativeBudgetSource.foodLifestyleMode,
      mealsOutPerDay: authoritativeBudgetSource.mealsOutPerDay,
      subcategories: Array.from(subcatMap.values()),
    };

    // 8. Reconcile subscriptions in memory
    const combinedCloudSubs = [...(mirrorSubs || []), ...(loadedSubs || [])];
    const reconciledSubs = reconcileCloudSubscriptions(
      combinedCloudSubs,
      {
        ...finalBudget,
        subscriptions: effectiveCloudBudget?.subscriptions,
      },
      finalWallets,
      deletedSet
    );
    setSubscriptions(reconciledSubs);

    const completeBudget: BudgetConfig = {
      ...finalBudget,
      subscriptions: reconciledSubs,
      liquidAssets: finalLiquidAssets,
      fixedAssets: finalFixedAssets,
      investments: finalInvestments,
      categoryBudgets: finalCategoryBudgets,
      settings: cloudSettings,
      deletedIds: cloudDeleted,
      updatedAt: cloudUpdatedAt || new Date().toISOString(),
    };
    setBudgetConfig(completeBudget);
  };

  const syncLocalManagedUsersList = () => {
    const registered = loadRegisteredAccounts();
    const mapped: ManagedUserAccount[] = registered.map((r) => {
      const adminFlag = isBootstrappedAdminEmail(r.email) || r.role === 'admin';
      return {
        uid: r.uid || getCloudAccountUid(r.email),
        email: r.email.toLowerCase(),
        displayName: r.displayName || 'Pengguna Dompt',
        photoURL: r.photoURL || null,
        role: adminFlag ? 'admin' : 'user',
        status: adminFlag ? 'active' : (r.status || 'active'),
        approvedAt: r.approvedAt,
        approvedBy: r.approvedBy,
        deactivatedAt: r.deactivatedAt,
        createdAt: r.createdAt || new Date().toISOString(),
        updatedAt: r.updatedAt || r.createdAt || new Date().toISOString(),
      };
    });
    setLocalManagedUsers(mapped);
  };

  // Load and sync an Email/Password account session with Cloud Firestore Database
  const loadAndSyncCloudAccountSession = async (
    profile: LocalAccountProfile,
    isNewRegistration = false,
    silentToast = false,
    isBackgroundSync = false
  ) => {
    const cloudUid = getCloudAccountUid(profile.email);
    const adminFlag = isBootstrappedAdminEmail(profile.email) || profile.role === 'admin';
    const resolvedRole: UserRole = adminFlag ? 'admin' : 'user';
    const resolvedStatus: UserAccountStatus = adminFlag
      ? 'active'
      : profile.status || (isNewRegistration ? 'pending' : 'active');

    const normalizedProfile: LocalAccountProfile = {
      ...profile,
      uid: cloudUid,
      isLocalAccount: false,
      role: resolvedRole,
      status: resolvedStatus,
    };

    isCloudSyncingRef.current = true;
    if (!isBackgroundSync) {
      saveActiveLocalUser(normalizedProfile);
      setUser(normalizedProfile);
      setUserRoleState(resolvedRole);
      setUserAccountStatusState(resolvedStatus);
      setActiveDate(getTodayDateStr());
      syncLocalManagedUsersList();
    }

    try {
      const cloudProfile = await fetchCloudUserProfile(cloudUid);
      if (cloudProfile) {
        const cloudRole: UserRole =
          isBootstrappedAdminEmail(cloudProfile.email) || cloudProfile.role === 'admin'
            ? 'admin'
            : 'user';
        const cloudStatus: UserAccountStatus =
          cloudRole === 'admin' ? 'active' : cloudProfile.status || resolvedStatus;
        setUserRoleState(cloudRole);
        setUserAccountStatusState(cloudStatus);
        const updatedLocalProfile: LocalAccountProfile = {
          ...normalizedProfile,
          displayName: cloudProfile.displayName || normalizedProfile.displayName,
          role: cloudRole,
          status: cloudStatus,
          approvedAt: cloudProfile.approvedAt,
          approvedBy: cloudProfile.approvedBy,
          deactivatedAt: cloudProfile.deactivatedAt,
        };
        saveActiveLocalUser(updatedLocalProfile);
        setUser(updatedLocalProfile);
      }

      await syncAllAccountDataWithCloud(
        cloudUid,
        normalizedProfile.email,
        normalizedProfile.displayName,
        isNewRegistration,
        undefined,
        isBackgroundSync
      );
    } catch (err) {
      if (!isBackgroundSync) {
        console.warn('Error loading account data from Firestore:', err);
      }
    } finally {
      isCloudSyncingRef.current = false;
    }

    if (!silentToast) {
      setDataResetVersion((v) => v + 1);
      if (isNewRegistration && resolvedStatus === 'pending') {
        addToast(
          'Pendaftaran Berhasil (Menunggu ACC Admin)',
          `Akun ${normalizedProfile.displayName} berhasil didaftarkan dan menunggu persetujuan Admin.`,
          'info'
        );
      } else {
        addToast(
          isNewRegistration ? 'Pendaftaran Berhasil' : 'Login Berhasil',
          `Selamat datang, ${normalizedProfile.displayName}!`,
          'success'
        );
      }
    }
  };

  // Register new account with Email & Password (saved in Cloud Firestore DB so it works on PC & HP)
  const registerWithEmailPassword = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      return { ok: false, error: 'Nama panggilan wajib diisi.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: 'Masukkan alamat email yang valid.' };
    }
    if (!password || password.length < 6) {
      return { ok: false, error: 'Password minimal harus terdiri dari 6 karakter.' };
    }

    const cloudUid = getCloudAccountUid(cleanEmail);
    const passwordHash = hashAccountPassword(cleanEmail, password);
    const isAdminEmail = isBootstrappedAdminEmail(cleanEmail);

    // 1. Save account credentials directly to Cloud Firestore Database
    try {
      const cloudRes = await registerCloudEmailAccount(
        cloudUid,
        cleanName,
        cleanEmail,
        passwordHash,
        { isNewSignup: true }
      );
      if (!cloudRes.ok) {
        return { ok: false, error: cloudRes.error };
      }

      const now = new Date().toISOString();
      const role: UserRole = isAdminEmail ? 'admin' : (cloudRes.profile.role || 'user');
      const status: UserAccountStatus = isAdminEmail
        ? 'active'
        : (cloudRes.profile.status || 'pending');

      const record = {
        uid: cloudUid,
        displayName: cleanName,
        email: cleanEmail,
        passwordHash,
        photoURL: null,
        isLocalAccount: false,
        role,
        status,
        createdAt: cloudRes.profile.createdAt || now,
        updatedAt: now,
      };
      cacheRegisteredAccountLocally(record);
      syncLocalManagedUsersList();
      resetStorageToZero(cloudUid);

      await loadAndSyncCloudAccountSession(
        {
          uid: cloudUid,
          displayName: cleanName,
          email: cleanEmail,
          photoURL: null,
          isLocalAccount: false,
          role,
          status,
          createdAt: record.createdAt,
          updatedAt: now,
        },
        true
      );
      return { ok: true };
    } catch (err) {
      console.warn('Cloud registration fallback:', err);
    }

    // 2. Fallback to local registration if offline
    const localRes = registerAccountWithPassword(cleanName, cleanEmail, password);
    if (!localRes.ok) {
      return { ok: false, error: localRes.error };
    }
    syncLocalManagedUsersList();
    await loadAndSyncCloudAccountSession(localRes.profile, true);
    return { ok: true };
  };

  // Login with Email & Password (queries Cloud Firestore DB first so accounts registered on PC can login on HP)
  const loginWithEmailPassword = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: 'Masukkan alamat email yang valid.' };
    }
    if (!password) {
      return { ok: false, error: 'Password wajib diisi.' };
    }

    const cloudUid = getCloudAccountUid(cleanEmail);
    const passwordHash = hashAccountPassword(cleanEmail, password);

    // 1. Check Cloud Firestore Database first (enables login on HP for accounts registered on PC)
    try {
      const cloudRes = await loginCloudEmailAccount(cloudUid, cleanEmail, passwordHash);
      if (cloudRes.ok) {
        const role: UserRole =
          isBootstrappedAdminEmail(cleanEmail) || cloudRes.profile.role === 'admin'
            ? 'admin'
            : 'user';
        const status: UserAccountStatus =
          role === 'admin' ? 'active' : cloudRes.profile.status || 'active';

        const profile: LocalAccountProfile = {
          uid: cloudUid,
          displayName: cloudRes.profile.displayName || 'Pengguna Dompt',
          email: cloudRes.profile.email || cleanEmail,
          photoURL: cloudRes.profile.photoURL || null,
          isLocalAccount: false,
          role,
          status,
          approvedAt: cloudRes.profile.approvedAt,
          approvedBy: cloudRes.profile.approvedBy,
          deactivatedAt: cloudRes.profile.deactivatedAt,
          createdAt: cloudRes.profile.createdAt || new Date().toISOString(),
          updatedAt: cloudRes.profile.updatedAt || new Date().toISOString(),
        };
        cacheRegisteredAccountLocally({
          ...profile,
          passwordHash,
        });
        syncLocalManagedUsersList();
        await loadAndSyncCloudAccountSession(profile, false);
        if (role === 'admin') {
          setActiveTabState('admin');
        }
        return { ok: true };
      }

      if (!cloudRes.notFound) {
        return { ok: false, error: cloudRes.error };
      }
    } catch (err) {
      console.warn('Cloud login check error, checking local storage:', err);
    }

    // 2. Check local browser storage (in case account was registered on this PC before Cloud DB sync) and upload it to Cloud DB
    const localRes = loginAccountWithPassword(cleanEmail, password);
    if (localRes.ok) {
      try {
        await registerCloudEmailAccount(
          cloudUid,
          localRes.profile.displayName,
          cleanEmail,
          passwordHash,
          { isNewSignup: false }
        );
      } catch (e) {
        console.warn('Failed to upload local account to Cloud DB:', e);
      }
      syncLocalManagedUsersList();
      await loadAndSyncCloudAccountSession(localRes.profile, false);
      if (localRes.profile.role === 'admin') {
        setActiveTabState('admin');
      }
      return { ok: true };
    }

    // 3. Also check Firebase Auth Email/Password in case enabled
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      if (cred.user) {
        saveActiveLocalUser(null);
        addToast(
          'Login Berhasil',
          `Selamat datang kembali, ${cred.user.displayName || cred.user.email}!`,
          'success'
        );
        return { ok: true };
      }
    } catch {
      // Ignore Firebase Auth error and return clear message
    }

    return { ok: false, error: localRes.error };
  };

  // Change current logged-in user's or Admin's password
  const changeAccountPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const email = (user?.email || settings.userEmail || '').trim().toLowerCase();
    if (!email) {
      return { ok: false, error: 'Anda belum masuk ke akun mana pun.' };
    }
    if (!currentPassword) {
      return { ok: false, error: 'Mohon masukkan password lama Anda.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: 'Password baru minimal harus terdiri dari 6 karakter.' };
    }

    const uid = getCloudAccountUid(email);
    const currentHash = hashAccountPassword(email, currentPassword);
    const newHash = hashAccountPassword(email, newPassword);

    // Update Cloud Firestore first
    const cloudRes = await updateCloudAccountPassword(uid, email, currentHash, newHash, false);
    if (!cloudRes.ok && cloudRes.error) {
      return { ok: false, error: cloudRes.error };
    }

    // Also update local registry
    const localRes = changeLocalAccountPassword(email, currentPassword, newPassword, cloudRes.ok);
    if (!localRes.ok && !cloudRes.ok) {
      return { ok: false, error: localRes.error };
    }

    addToast(
      'Password Berhasil Diubah',
      `Password untuk akun ${email} telah berhasil diperbarui.`,
      'success'
    );
    return { ok: true };
  };

  // Admin action: Reset or change any user's or admin's password directly from Admin Dashboard
  const adminResetUserPassword = async (
    targetEmail: string,
    newPassword: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: 'Alamat email tidak valid.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: 'Password baru minimal harus terdiri dari 6 karakter.' };
    }

    const uid = getCloudAccountUid(cleanEmail);
    const newHash = hashAccountPassword(cleanEmail, newPassword);

    await updateCloudAccountPassword(uid, cleanEmail, null, newHash, true);
    changeLocalAccountPassword(cleanEmail, null, newPassword, true);

    addToast(
      'Password Diperbarui oleh Admin',
      `Password untuk akun ${cleanEmail} berhasil diatur ulang.`,
      'success'
    );
    return { ok: true };
  };

  // Admin & BugReport Actions
  const updateLocalRegisteredAccountStatus = (
    uid: string,
    email: string,
    status: UserAccountStatus,
    adminIdentifier?: string,
    role?: UserRole
  ) => {
    const now = new Date().toISOString();
    const list = loadRegisteredAccounts();
    const cleanEmail = email.trim().toLowerCase();
    const updated = list.map((acc) => {
      if (acc.uid === uid || acc.email.toLowerCase() === cleanEmail) {
        return {
          ...acc,
          status,
          ...(role ? { role } : {}),
          ...(status === 'active'
            ? { approvedAt: now, approvedBy: adminIdentifier || 'Admin' }
            : {}),
          ...(status === 'deactivated' ? { deactivatedAt: now } : {}),
          updatedAt: now,
        };
      }
      return acc;
    });
    saveRegisteredAccounts(updated);
    syncLocalManagedUsersList();
  };

  const approveUserAccount = async (uid: string, email: string, displayName: string) => {
    const adminId = user?.email || 'admin@dompt.com';
    const now = new Date().toISOString();
    updateLocalRegisteredAccountStatus(uid, email, 'active', adminId);
    setCloudManagedUsers((prev) =>
      prev.map((u) =>
        u.uid === uid || u.email.toLowerCase() === email.toLowerCase()
          ? { ...u, status: 'active', approvedAt: now, approvedBy: adminId, updatedAt: now }
          : u
      )
    );
    await updateCloudUserAccountStatus(uid, email, displayName, 'active', adminId);
    addToast(
      'Akun User Di-ACC',
      `Akun ${displayName} (${email}) telah disetujui dan kini aktif.`,
      'success'
    );
  };

  const deactivateUserAccount = async (uid: string, email: string, displayName: string) => {
    if (isBootstrappedAdminEmail(email)) {
      addToast('Tidak Dapat Dinonaktifkan', 'Akun Admin Utama tidak dapat dinonaktifkan.', 'error');
      return;
    }
    const adminId = user?.email || 'admin@dompt.com';
    const now = new Date().toISOString();
    updateLocalRegisteredAccountStatus(uid, email, 'deactivated', adminId);
    setCloudManagedUsers((prev) =>
      prev.map((u) =>
        u.uid === uid || u.email.toLowerCase() === email.toLowerCase()
          ? { ...u, status: 'deactivated', deactivatedAt: now, updatedAt: now }
          : u
      )
    );
    await updateCloudUserAccountStatus(uid, email, displayName, 'deactivated', adminId);
    addToast(
      'Akun User Dinonaktifkan',
      `Akun ${displayName} (${email}) telah dinonaktifkan oleh Admin.`,
      'info'
    );
  };

  const setPendingUserAccount = async (uid: string, email: string, displayName: string) => {
    const adminId = user?.email || 'admin@dompt.com';
    const now = new Date().toISOString();
    updateLocalRegisteredAccountStatus(uid, email, 'pending', adminId);
    setCloudManagedUsers((prev) =>
      prev.map((u) =>
        u.uid === uid || u.email.toLowerCase() === email.toLowerCase()
          ? { ...u, status: 'pending', updatedAt: now }
          : u
      )
    );
    await updateCloudUserAccountStatus(uid, email, displayName, 'pending', adminId);
    addToast(
      'Status Diubah ke Pending',
      `Akun ${displayName} kembali menunggu ACC Admin.`,
      'info'
    );
  };

  const updateUserAccountRole = async (
    uid: string,
    email: string,
    displayName: string,
    role: UserRole
  ) => {
    if (isBootstrappedAdminEmail(email) && role !== 'admin') {
      addToast('Akses Dilindungi', 'Email Admin Utama tidak dapat diubah menjadi User biasa.', 'error');
      return;
    }
    const adminId = user?.email || 'admin@dompt.com';
    const now = new Date().toISOString();
    updateLocalRegisteredAccountStatus(uid, email, 'active', adminId, role);
    setCloudManagedUsers((prev) =>
      prev.map((u) =>
        u.uid === uid || u.email.toLowerCase() === email.toLowerCase()
          ? { ...u, role, status: 'active', updatedAt: now }
          : u
      )
    );
    await updateCloudUserAccountStatus(uid, email, displayName, 'active', adminId, role);
    addToast(
      'Peran Akun Diperbarui',
      `${displayName} kini berstatus sebagai ${role === 'admin' ? 'Admin' : 'User'}.`,
      'success'
    );
  };

  const refreshUserAccountStatus = async () => {
    if (!user?.uid) return;
    const cloudProfile = await fetchCloudUserProfile(user.uid);
    if (cloudProfile) {
      const nextRole: UserRole =
        isBootstrappedAdminEmail(cloudProfile.email) || cloudProfile.role === 'admin'
          ? 'admin'
          : 'user';
      const nextStatus: UserAccountStatus =
        nextRole === 'admin' ? 'active' : cloudProfile.status || 'active';
      setUserRoleState(nextRole);
      setUserAccountStatusState(nextStatus);
      const activeLocal = loadActiveLocalUser();
      if (activeLocal) {
        const updated = { ...activeLocal, role: nextRole, status: nextStatus };
        saveActiveLocalUser(updated);
        setUser(updated);
      }
      if (nextStatus === 'active') {
        addToast('Akun Telah Aktif!', 'Selamat, akun Anda telah di-ACC oleh Admin.', 'success');
      } else if (nextStatus === 'pending') {
        addToast('Masih Menunggu ACC', 'Akun Anda masih dalam antrean persetujuan Admin.', 'info');
      } else {
        addToast('Akun Nonaktif', 'Akun Anda saat ini berstatus dinonaktifkan oleh Admin.', 'error');
      }
      return;
    }
    // Check local registry fallback
    const localList = loadRegisteredAccounts();
    const matched = localList.find(
      (a) => a.uid === user.uid || a.email.toLowerCase() === (user.email || '').toLowerCase()
    );
    if (matched) {
      const nextRole: UserRole =
        isBootstrappedAdminEmail(matched.email) || matched.role === 'admin' ? 'admin' : 'user';
      const nextStatus: UserAccountStatus =
        nextRole === 'admin' ? 'active' : matched.status || 'active';
      setUserRoleState(nextRole);
      setUserAccountStatusState(nextStatus);
    }
  };

  const refreshAdminData = async () => {
    syncLocalManagedUsersList();
    const [usersFromCloud, reportsFromCloud] = await Promise.all([
      fetchAllCloudUsers().catch(() => [] as ManagedUserAccount[]),
      fetchCloudBugReports().catch(() => [] as BugReport[]),
    ]);
    if (usersFromCloud.length > 0) {
      setCloudManagedUsers(usersFromCloud);
    }
    setBugReports(reportsFromCloud);
  };

  const submitBugReport = async (input: {
    type: BugReportCategory;
    priority: BugReportPriority;
    title: string;
    description: string;
    pageContext?: string;
  }): Promise<boolean> => {
    if (!user) return false;
    const now = new Date().toISOString();
    const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newReport: BugReport = {
      id,
      userId: user.uid,
      userEmail: user.email || settings.userEmail || 'user@dompt.com',
      userName: user.displayName || settings.userName || 'Pengguna Dompt',
      type: input.type,
      priority: input.priority,
      title: input.title.trim(),
      description: input.description.trim(),
      pageContext: input.pageContext || activeTab,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    setBugReports((prev) => [newReport, ...prev]);
    const ok = await saveCloudBugReport(newReport);
    addToast(
      'Laporan Terkirim ke Admin',
      'Terima kasih! Masukan / laporan bug Anda telah diterima oleh Admin.',
      'success'
    );
    return ok;
  };

  const updateBugReportByAdmin = async (
    reportId: string,
    status: BugReportStatus,
    adminReply?: string
  ): Promise<boolean> => {
    const target = bugReports.find((r) => r.id === reportId);
    if (!target) return false;
    const now = new Date().toISOString();
    const adminName = user?.displayName || user?.email || 'Admin SuperApp';
    const updatedReport: BugReport = {
      ...target,
      status,
      ...(adminReply !== undefined ? { adminReply: adminReply.trim() } : {}),
      ...(adminReply && adminReply.trim()
        ? { repliedAt: now, repliedBy: adminName }
        : {}),
      updatedAt: now,
    };
    setBugReports((prev) => prev.map((r) => (r.id === reportId ? updatedReport : r)));
    const ok = await saveCloudBugReport(updatedReport);
    addToast('Laporan Diperbarui', 'Status dan tanggapan Admin berhasil disimpan.', 'success');
    return ok;
  };

  const deleteBugReportById = async (reportId: string): Promise<boolean> => {
    setBugReports((prev) => prev.filter((r) => r.id !== reportId));
    const ok = await deleteCloudBugReport(reportId);
    addToast('Laporan Dihapus', 'Data laporan berhasil dihapus.', 'info');
    return ok;
  };

  // Sign In with Google
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        saveActiveLocalUser(null);
        addToast(
          'Login Berhasil',
          `Selamat datang, ${result.user.displayName || 'Pengguna'}!`,
          'success'
        );
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      const code = err?.code || '';
      if (code === 'auth/popup-blocked') {
        addToast('Membuka Halaman Login...', 'Popup diblokir browser, mengalihkan ke halaman login Google...', 'info');
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
    }
  };

  // Sign Out
  const signOutUser = async () => {
    try {
      saveActiveLocalUser(null);
      if (auth.currentUser) {
        await signOut(auth);
      }
      setUser(null);
      setUserRoleState('user');
      setUserAccountStatusState('active');
      setActiveTabState('dashboard');
      setDataResetVersion((v) => v + 1);
      addToast('Berhasil Keluar', 'Anda telah keluar dari akun.', 'info');
    } catch (err: any) {
      console.error('Sign out error:', err);
      addToast('Gagal Keluar', 'Terjadi kesalahan saat logout.', 'error');
      throw err;
    }
  };

  // Check active session on client mount and fetch fresh data directly from Cloud Firestore
  useEffect(() => {
    queueMicrotask(async () => {
      syncLocalManagedUsersList();
      const activeLocal = loadActiveLocalUser();
      const scope = activeLocal ? getCloudAccountUid(activeLocal.email) : undefined;
      const storedSettings = loadStoredSettings(scope);
      if (activeLocal) {
        isCloudSyncingRef.current = true;
        const adminFlag = isBootstrappedAdminEmail(activeLocal.email) || activeLocal.role === 'admin';
        const role: UserRole = adminFlag ? 'admin' : 'user';
        const status: UserAccountStatus = adminFlag ? 'active' : (activeLocal.status || 'active');
        const normalizedLocal: LocalAccountProfile = {
          ...activeLocal,
          uid: scope || activeLocal.uid,
          isLocalAccount: false,
          role,
          status,
        };
        setUser(normalizedLocal);
        setUserRoleState(role);
        setUserAccountStatusState(status);
      }
      setCategories(loadStoredCategories());
      setSettings(
        activeLocal
          ? {
              ...storedSettings,
              userName: activeLocal.displayName || storedSettings.userName,
              userEmail: activeLocal.email || storedSettings.userEmail,
            }
          : storedSettings
      );
      setIsLocked(Boolean(storedSettings.pinEnabled));
      setActiveDate(getTodayDateStr());

      // No PUT/POST/PATCH requests on initial load - pure GET to fetch fresh cloud state
      if (activeLocal?.email) {
        await loadAndSyncCloudAccountSession(activeLocal, false, true);
      }
    });
  }, []);

  // Real-time listeners for User Profile Status (Pending/Active/Deactivated), All Users (Admin), and Bug Reports
  useEffect(() => {
    if (!user?.uid) return;
    const unsubProfile = subscribeToUserProfileStatus(user.uid, (profile) => {
      const nextRole: UserRole =
        isBootstrappedAdminEmail(profile.email) || profile.role === 'admin'
          ? 'admin'
          : 'user';
      const nextStatus: UserAccountStatus =
        nextRole === 'admin' ? 'active' : profile.status || 'active';
      setUserRoleState(nextRole);
      setUserAccountStatusState(nextStatus);
      updateLocalRegisteredAccountStatus(
        user.uid,
        profile.email || user.email || '',
        nextStatus,
        profile.approvedBy,
        nextRole
      );
    });

    const unsubReports = subscribeToCloudBugReports((reports) => {
      setBugReports(reports);
    });

    const unsubUsers = subscribeToAllCloudUsers((usersList) => {
      setCloudManagedUsers(usersList);
    });

    // Initial fetch for users & reports
    fetchAllCloudUsers()
      .then((list) => {
        if (list.length > 0) setCloudManagedUsers(list);
      })
      .catch(() => {});
    fetchCloudBugReports()
      .then((list) => setBugReports(list))
      .catch(() => {});

    return () => {
      unsubProfile();
      unsubReports();
      unsubUsers();
    };
  }, [user?.uid]);

  // Firebase auth & data synchronization
  useEffect(() => {
    testConnection().catch((err) => console.warn('Firebase test connection:', err));
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          saveActiveLocalUser(null);
          addToast(
            'Login Berhasil',
            `Selamat datang, ${res.user.displayName || 'Pengguna'}!`,
            'success'
          );
        }
      })
      .catch((err) => console.warn('Redirect sign-in check:', err));

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        isCloudSyncingRef.current = true;
        saveActiveLocalUser(null);
        setUser(currentUser);
        setAuthLoading(true);
        try {
          const profileData = await syncUserProfile(currentUser);
          const nextRole: UserRole =
            isBootstrappedAdminEmail(currentUser.email) || profileData.role === 'admin'
              ? 'admin'
              : 'user';
          const nextStatus: UserAccountStatus =
            nextRole === 'admin' ? 'active' : profileData.status || 'active';
          setUserRoleState(nextRole);
          setUserAccountStatusState(nextStatus);
          const acctUid = currentUser.email ? getCloudAccountUid(currentUser.email) : undefined;
          await syncAllAccountDataWithCloud(
            currentUser.uid,
            currentUser.email || profileData.email || '',
            profileData.displayName || currentUser.displayName || 'Pengguna Dompt',
            false,
            acctUid
          );
          setActiveDate(getTodayDateStr());
          setDataResetVersion((v) => v + 1);
        } catch (err) {
          console.warn('Error loading user data from Firestore:', err);
        } finally {
          isCloudSyncingRef.current = false;
          setAuthLoading(false);
        }
      } else {
        const activeLocal = loadActiveLocalUser();
        if (activeLocal) {
          const adminFlag = isBootstrappedAdminEmail(activeLocal.email) || activeLocal.role === 'admin';
          const role: UserRole = adminFlag ? 'admin' : 'user';
          const status: UserAccountStatus = adminFlag ? 'active' : (activeLocal.status || 'active');
          setUser({
            ...activeLocal,
            uid: getCloudAccountUid(activeLocal.email),
            isLocalAccount: false,
            role,
            status,
          });
          setUserRoleState(role);
          setUserAccountStatusState(status);
        } else {
          setUser(null);
        }
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time & background sync when another device (e.g. HP vs Laptop) updates or deletes data
  useEffect(() => {
    const triggerBackgroundCloudSync = (forceEvenIfHidden = false) => {
      if (
        !forceEvenIfHidden &&
        typeof document !== 'undefined' &&
        document.visibilityState !== 'visible'
      ) {
        return;
      }
      if (isCloudSyncingRef.current) return;
      // Do not interrupt if user performed a local write on THIS tab within the last 3.5 seconds
      if (Date.now() - lastLocalMutationRef.current < 3500) return;

      const activeLocal = loadActiveLocalUser();
      if (activeLocal?.email) {
        loadAndSyncCloudAccountSession(activeLocal, false, true, true).catch(() => {});
      } else if (auth.currentUser) {
        const currentUser = auth.currentUser;
        const acctUid = currentUser.email ? getCloudAccountUid(currentUser.email) : undefined;
        isCloudSyncingRef.current = true;
        syncAllAccountDataWithCloud(
          currentUser.uid,
          currentUser.email || '',
          currentUser.displayName || 'Pengguna Dompt',
          false,
          acctUid,
          true
        )
          .catch(() => {})
          .finally(() => {
            isCloudSyncingRef.current = false;
          });
      }
    };

    const handleFocusOrShow = () => triggerBackgroundCloudSync(true);
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        triggerBackgroundCloudSync(true);
      }
    };

    window.addEventListener('focus', handleFocusOrShow);
    window.addEventListener('pageshow', handleFocusOrShow);
    window.addEventListener('online', handleFocusOrShow);
    document.addEventListener('visibilitychange', handleVisibility);
    const intervalId = setInterval(() => triggerBackgroundCloudSync(false), 6000);

    let unsubPrimary: (() => void) | undefined;
    let unsubMirror: (() => void) | undefined;

    if (user?.uid) {
      const handleRemoteChange = (remoteUpdatedAt?: string, remoteDeletedIds?: string[]) => {
        if (Date.now() - lastLocalMutationRef.current < 3000) return;
        if (remoteDeletedIds && remoteDeletedIds.length > 0) {
          setDeletedIds((prev) => {
            const combined = Array.from(new Set([...prev, ...remoteDeletedIds])).slice(-400);
            if (combined.length !== prev.length) {
              saveStoredDeletedIds(combined, user.uid);
              return combined;
            }
            return prev;
          });
        }
        if (remoteUpdatedAt && remoteUpdatedAt !== lastSeenCloudUpdatedAtRef.current) {
          lastSeenCloudUpdatedAtRef.current = remoteUpdatedAt;
          triggerBackgroundCloudSync(true);
        }
      };

      unsubPrimary = subscribeToUserBudgetConfig(user.uid, handleRemoteChange);
      const mirrorId = getMirrorUid(user.uid, user.email);
      if (mirrorId) {
        unsubMirror = subscribeToUserBudgetConfig(mirrorId, handleRemoteChange);
      }
    }

    return () => {
      window.removeEventListener('focus', handleFocusOrShow);
      window.removeEventListener('pageshow', handleFocusOrShow);
      window.removeEventListener('online', handleFocusOrShow);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
      if (unsubPrimary) unsubPrimary();
      if (unsubMirror) unsubMirror();
    };
  }, [user?.uid, user?.email]);

  const applyThemeToDOM = (mode: ThemeMode, accent?: AccentColor) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    const systemDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = mode === 'dark' || (mode === 'system' && systemDark);
    if (shouldBeDark) {
      root.classList.add('dark');
      if (body) body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      if (body) body.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    if (accent) {
      root.setAttribute('data-accent', accent);
    }
  };

  // Sync theme mode and accent color to documentElement
  useEffect(() => {
    applyThemeToDOM(settings.themeMode, settings.accentColor);
  }, [settings.themeMode, settings.accentColor]);

  // Helper to resolve which wallet a transaction should affect (handles deleted/orphaned wallets
  // or expenses accidentally recorded on an untouched Rp0 default wallet when another wallet is funded)
  const resolvedWalletIdMap = useMemo(() => {
    const map = new Map<string, string>();
    if (wallets.length === 0) return map;

    const walletSet = new Set(wallets.map((w) => w.id));

    // Calculate total inflows (initialBalance + income + transfer-in) per wallet
    const inflowByWallet = new Map<string, number>();
    wallets.forEach((w) => {
      inflowByWallet.set(w.id, w.initialBalance > 0 ? w.initialBalance : 0);
    });
    transactions.forEach((tx) => {
      if (tx.type === 'income' && walletSet.has(tx.walletId)) {
        inflowByWallet.set(tx.walletId, (inflowByWallet.get(tx.walletId) || 0) + tx.amount);
      } else if (tx.type === 'transfer' && tx.transferWalletId && walletSet.has(tx.transferWalletId)) {
        inflowByWallet.set(
          tx.transferWalletId,
          (inflowByWallet.get(tx.transferWalletId) || 0) + tx.amount
        );
      }
    });

    // Find primary funded non-credit wallet (or fallback to first wallet)
    const fundedWallets = wallets
      .filter((w) => w.type !== 'credit' && w.type !== 'paylater' && (inflowByWallet.get(w.id) || 0) > 0)
      .sort((a, b) => (inflowByWallet.get(b.id) || 0) - (inflowByWallet.get(a.id) || 0));

    const primaryWalletId = fundedWallets[0]?.id || wallets[0].id;

    transactions.forEach((tx) => {
      // Only fallback to primaryWalletId if walletId is missing or points to a deleted wallet
      if (!tx.walletId || !walletSet.has(tx.walletId)) {
        map.set(tx.id, primaryWalletId);
        return;
      }

      map.set(tx.id, tx.walletId);
    });

    return map;
  }, [wallets, transactions]);

  // Calculate wallet balances (guaranteed non-negative: wallets can never go below Rp0)
  const walletsWithBalance = useMemo<WalletWithBalance[]>(() => {
    const sortedChronologicalTxs = [...transactions].sort((a, b) => {
      const timeA = new Date(a.date || a.createdAt || 0).getTime();
      const timeB = new Date(b.date || b.createdAt || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });

    const walletIdSet = new Set(wallets.map((w) => w.id));
    const fallbackLiquidWalletId =
      wallets.find((w) => w.type !== 'credit' && w.type !== 'paylater')?.id || wallets[0]?.id;

    return wallets.map((wallet) => {
      const isDebtWallet = wallet.type === 'credit' || wallet.type === 'paylater';
      let balance = Math.max(0, Number(wallet.initialBalance) || 0);
      let expenseThisMonth = 0;
      let incomeThisMonth = 0;
      let txCount = 0;

      sortedChronologicalTxs.forEach((tx) => {
        const effectiveWalletId = resolvedWalletIdMap.get(tx.id) || tx.walletId;
        const txDate = parseLocalDay(tx.date);
        const isThisMonth = isDateInBudgetPeriod(txDate, budgetPeriod);

        if (effectiveWalletId === wallet.id) {
          if (isThisMonth) txCount++;
          if (tx.type === 'expense') {
            balance = isDebtWallet ? balance + tx.amount : Math.max(0, balance - tx.amount);
            if (isThisMonth) expenseThisMonth += tx.amount;
          } else if (tx.type === 'income') {
            balance = isDebtWallet ? Math.max(0, balance - tx.amount) : balance + tx.amount;
            if (isThisMonth) incomeThisMonth += tx.amount;
          } else if (tx.type === 'transfer') {
            balance = isDebtWallet ? balance + tx.amount : Math.max(0, balance - tx.amount);
          }
        }

        if (tx.type === 'transfer' && tx.transferWalletId === wallet.id) {
          if (isThisMonth) txCount++;
          // Paying a credit card / paylater bill via transfer reduces its outstanding bill
          balance = isDebtWallet ? Math.max(0, balance - tx.amount) : balance + tx.amount;
        }
      });

      const finalBalance = Math.max(0, balance);
      const goalsReserved = goals
        .filter((g) => {
          if (g.currentAmount <= 0) return false;
          const resolvedGoalWalletId =
            g.walletId && walletIdSet.has(g.walletId) ? g.walletId : fallbackLiquidWalletId;
          return resolvedGoalWalletId === wallet.id;
        })
        .reduce((acc, g) => acc + g.currentAmount, 0);
      const manualReserved = Math.max(0, Number(wallet.reservedAmount) || 0);
      const rawReserved = goalsReserved + manualReserved;
      const reserved = isDebtWallet ? 0 : Math.min(finalBalance, Math.max(0, rawReserved));
      const available = isDebtWallet ? 0 : Math.max(0, finalBalance - reserved);

      return {
        ...wallet,
        initialBalance: Math.max(0, Number(wallet.initialBalance) || 0),
        reservedAmount: reserved,
        balance: finalBalance,
        expenseThisMonth,
        incomeThisMonth,
        transactionCount: txCount,
        availableBalance: available,
      };
    });
  }, [wallets, transactions, goals, budgetPeriod, resolvedWalletIdMap]);

  // Total liquid balance (guaranteed non-negative, excludes credit/paylater liabilities)
  const totalBalance = useMemo(() => {
    return Math.max(
      0,
      walletsWithBalance
        .filter((w) => w.type !== 'credit' && w.type !== 'paylater')
        .reduce((acc, w) => acc + Math.max(0, w.balance), 0)
    );
  }, [walletsWithBalance]);

  // Helper to get a wallet's current balance (optionally excluding a specific transaction when editing)
  const getWalletBalance = (walletId?: string, excludeTxId?: string): number => {
    const targetWallet =
      (walletId ? walletsWithBalance.find((w) => w.id === walletId) : undefined) ||
      walletsWithBalance[0];
    if (!targetWallet) return 0;

    if (!excludeTxId) {
      return Math.max(0, targetWallet.balance);
    }

    const oldTx = transactions.find((t) => t.id === excludeTxId);
    if (!oldTx) {
      return Math.max(0, targetWallet.balance);
    }

    const oldEffectiveWalletId = resolvedWalletIdMap.get(oldTx.id) || oldTx.walletId;
    const isTargetDebt = targetWallet.type === 'credit' || targetWallet.type === 'paylater';
    let adjustedBalance = targetWallet.balance;

    if (!isTargetDebt) {
      if (oldEffectiveWalletId === targetWallet.id) {
        if (oldTx.type === 'expense' || oldTx.type === 'transfer') {
          adjustedBalance += oldTx.amount;
        } else if (oldTx.type === 'income') {
          adjustedBalance -= oldTx.amount;
        }
      } else if (oldTx.type === 'transfer' && oldTx.transferWalletId === targetWallet.id) {
        adjustedBalance -= oldTx.amount;
      }
    }

    return Math.max(0, adjustedBalance);
  };

  const triggerInsufficientBalanceAlert = (
    walletId: string,
    paymentAmount: number,
    transactionLabel?: string,
    customWalletBalance?: number
  ) => {
    const targetWallet =
      (walletId ? walletsWithBalance.find((w) => w.id === walletId) : undefined) ||
      (walletId ? wallets.find((w) => w.id === walletId) : undefined) ||
      walletsWithBalance[0] ||
      wallets[0];
    const walletName = targetWallet?.name || 'Dompet';
    const walletBalance =
      customWalletBalance !== undefined
        ? Math.max(0, customWalletBalance)
        : getWalletBalance(targetWallet?.id || walletId);
    const shortfall = Math.max(0, paymentAmount - walletBalance);

    setInsufficientBalanceAlert({
      walletName,
      walletBalance,
      paymentAmount,
      shortfall,
      transactionLabel,
    });

    addToast(
      'Saldo Dompet Tidak Cukup!',
      `Saldo ${walletName} (${formatRupiah(walletBalance)}) tidak mencukupi untuk pembayaran sebesar ${formatRupiah(paymentAmount)}.`,
      'error'
    );
  };

  // Enriched transaction details
  const transactionDetails = useMemo<TransactionDetail[]>(() => {
    const walletMap = new Map<string, Wallet>(wallets.map((w) => [w.id, w]));
    const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

    return transactions
      .map((tx) => {
        const effectiveWalletId = resolvedWalletIdMap.get(tx.id) || tx.walletId;
        return {
          transaction: { ...tx, walletId: effectiveWalletId },
          wallet: walletMap.get(effectiveWalletId) || wallets[0] || {
            id: effectiveWalletId,
            name: 'Dompet Utama',
            type: 'other' as const,
            initialBalance: 0,
            createdAt: '',
            updatedAt: '',
          },
          category: tx.categoryId ? categoryMap.get(tx.categoryId) || null : null,
          transferWallet: tx.transferWalletId ? walletMap.get(tx.transferWalletId) || null : null,
        };
      })
      .sort((a, b) => new Date(b.transaction.date).getTime() - new Date(a.transaction.date).getTime());
  }, [transactions, wallets, categories, resolvedWalletIdMap]);

  // Active period and today income and expense (including any payable debt payments recorded in this period)
  const { totalIncome, totalExpense, todayIncome, todayExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let todayInc = 0;
    let todayExp = 0;
    const txIdSet = new Set<string>();
    const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

    const effectiveTodayDate = new Date(
      budgetPeriod.startDate.getFullYear(),
      budgetPeriod.startDate.getMonth(),
      budgetPeriod.startDate.getDate() + Math.max(0, budgetPeriod.currentDayOfPeriod - 1),
      12,
      0,
      0
    );
    const effTodayYear = effectiveTodayDate.getFullYear();
    const effTodayMonth = effectiveTodayDate.getMonth();
    const effTodayDay = effectiveTodayDate.getDate();

    transactions.forEach((tx) => {
      txIdSet.add(tx.id);
      const txDate = parseLocalDay(tx.date);
      const isLoanDisbursement = Boolean(tx.note && /^pencairan utang:/i.test(tx.note.trim()));
      const cat = tx.categoryId ? catMap.get(tx.categoryId) || null : null;
      const isSavings = tx.type === 'expense' && isSavingsExpense(tx, cat);

      if (isDateInBudgetPeriod(txDate, budgetPeriod)) {
        if (tx.type === 'income' && !isLoanDisbursement) inc += tx.amount;
        if (tx.type === 'expense' && !isSavings) exp += tx.amount;
      }
      if (
        txDate.getFullYear() === effTodayYear &&
        txDate.getMonth() === effTodayMonth &&
        txDate.getDate() === effTodayDay
      ) {
        if (tx.type === 'income' && !isLoanDisbursement) todayInc += tx.amount;
        if (tx.type === 'expense' && !isSavings) todayExp += tx.amount;
      }
    });

    debts.forEach((d) => {
      if (d.type !== 'payable') return;
      (d.payments || []).forEach((p) => {
        if (p.transactionId && txIdSet.has(p.transactionId)) return;
        const pd = parseLocalDay(p.date);
        if (isDateInBudgetPeriod(pd, budgetPeriod)) {
          exp += p.amount;
        }
        if (
          pd.getFullYear() === effTodayYear &&
          pd.getMonth() === effTodayMonth &&
          pd.getDate() === effTodayDay
        ) {
          todayExp += p.amount;
        }
      });
    });

    return { totalIncome: inc, totalExpense: exp, todayIncome: todayInc, todayExpense: todayExp };
  }, [transactions, debts, categories, budgetPeriod]);

  // Dynamic upcoming bills derived from negative credit/paylater wallets, active subscriptions, and scheduled budget subcategories
  const upcomingBills = useMemo<UpcomingBill[]>(() => {
    const billsWithOrder: { bill: UpcomingBill; daysUntil: number }[] = [];
    const seenNames = new Set<string>();
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentCalendarKey = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`;
    const activePeriodKey = budgetPeriod.periodKey;

    const effectiveToday = new Date(
      budgetPeriod.startDate.getFullYear(),
      budgetPeriod.startDate.getMonth(),
      budgetPeriod.startDate.getDate() + Math.max(0, budgetPeriod.currentDayOfPeriod - 1),
      12,
      0,
      0
    );
    const effYear = effectiveToday.getFullYear();
    const effMonth = effectiveToday.getMonth();
    const effDay = effectiveToday.getDate();
    const msPerDay = 1000 * 60 * 60 * 24;

    const resolveDueDateAndDays = (rawDay: number): { dueDate: string; daysUntil: number } => {
      const safeDay = Math.max(1, Math.min(31, Math.round(rawDay) || 1));
      const maxCur = new Date(effYear, effMonth + 1, 0).getDate();
      const curCandidate = new Date(effYear, effMonth, Math.min(safeDay, maxCur), 12, 0, 0);
      const nextMonthObj = new Date(effYear, effMonth + 1, 1);
      const ny = nextMonthObj.getFullYear();
      const nm = nextMonthObj.getMonth();
      const maxNext = new Date(ny, nm + 1, 0).getDate();
      const nextCandidate = new Date(ny, nm, Math.min(safeDay, maxNext), 12, 0, 0);

      const targetDate = effDay > Math.min(safeDay, maxCur) ? nextCandidate : curCandidate;
      const daysUntil = Math.round((targetDate.getTime() - effectiveToday.getTime()) / msPerDay);
      const mLabel = shortMonths[targetDate.getMonth()] || 'Jan';
      return {
        dueDate: `${String(targetDate.getDate()).padStart(2, '0')} ${mLabel}`,
        daysUntil,
      };
    };

    const periodExpenses = transactions.filter(
      (tx) => tx.type === 'expense' && isDateInBudgetPeriod(tx.date, budgetPeriod)
    );

    const hasMatchingExpenseInPeriod = (targetNameLower: string, minAmount?: number): boolean => {
      const isCicilanTarget = /^(cicilan|angsuran|utang|hutang)\b/i.test(targetNameLower);
      const cleanTarget = targetNameLower.replace(/^cicilan\s+/i, '').trim();
      if (!cleanTarget) return false;
      let matchedSum = 0;
      for (const tx of periodExpenses) {
        const rawNote = (tx.note || '').toLowerCase().trim();
        const cleanNote = rawNote
          .replace(/\(otomatis rutin\)|\(rutin\)|\(langganan\)|\(bulanan\)|bayar cicilan utang:|cicilan utang:/gi, '')
          .trim();
        const txHasDebtIntent =
          /\b(cicilan|angsuran|utang|hutang|kpr|paylater)\b/i.test(rawNote) ||
          tx.categoryId === 'cat-tagihan';

        if (isCicilanTarget && !txHasDebtIntent && cleanNote !== targetNameLower) {
          continue;
        }

        const isMatch =
          cleanNote === targetNameLower ||
          cleanNote === cleanTarget ||
          (cleanTarget.length >= 4 && cleanNote.includes(cleanTarget)) ||
          (targetNameLower.length >= 4 && rawNote.includes(targetNameLower));
        if (isMatch) {
          matchedSum += tx.amount;
        }
      }
      if (minAmount && minAmount > 0) {
        return matchedSum >= minAmount * 0.9;
      }
      return matchedSum > 0;
    };

    walletsWithBalance.forEach((w) => {
      if ((w.type === 'credit' || w.type === 'paylater') && Math.abs(w.balance) > 0) {
        const dueDay = w.type === 'credit' ? 10 : 14;
        const { dueDate, daysUntil } = resolveDueDateAndDays(dueDay);
        seenNames.add(w.name.toLowerCase().trim());
        billsWithOrder.push({
          daysUntil,
          bill: {
            id: `bill-wallet-${w.id}`,
            name: w.name,
            dueDate,
            amount: Math.abs(w.balance),
            iconEmoji: w.type === 'credit' ? '💳' : '⏰',
            category: w.type === 'credit' ? 'Kartu Kredit' : 'Paylater',
          },
        });
      }
    });

    subscriptions.forEach((item) => {
      if (!item.isActive || item.type !== 'expense') return;
      const cleanName = item.name.toLowerCase().trim();
      const targetPeriodAmt =
        item.frequency === 'weekly'
          ? getMonthlySubscriptionAmount(item.amount, item.frequency)
          : item.amount;
      const alreadyPaidInPeriod =
        item.lastRecordedPeriod === activePeriodKey ||
        item.lastRecordedPeriod === currentCalendarKey ||
        hasMatchingExpenseInPeriod(cleanName, targetPeriodAmt);
      if (alreadyPaidInPeriod) {
        seenNames.add(cleanName);
        return;
      }
      const { dueDate, daysUntil } = resolveDueDateAndDays(item.billingDay);
      seenNames.add(cleanName);
      billsWithOrder.push({
        daysUntil,
        bill: {
          id: `bill-rec-${item.id}`,
          name: item.name,
          dueDate,
          amount: item.amount,
          iconEmoji: item.emoji || '🔁',
          category: (item.budgetGroup || 'KEBUTUHAN').toUpperCase(),
        },
      });
    });

    if (budgetConfig?.subcategories) {
      budgetConfig.subcategories.forEach((sub) => {
        if (sub.dueDateDay && sub.allocatedAmount > 0 && sub.isSubscriptionActive !== false) {
          const cleanName = sub.name.toLowerCase().trim();
          const matchedDebt = debts.find((d) => {
            if (d.type !== 'payable') return false;
            const debtSubId = `sub-debt-${d.id}`;
            const dClean = d.name.toLowerCase().trim();
            const dDisplay = d.name.toLowerCase().startsWith('cicilan') ? dClean : `cicilan ${dClean}`;
            return (
              sub.id === debtSubId ||
              sub.subscriptionId === d.id ||
              cleanName === dDisplay ||
              cleanName === dClean
            );
          });
          if (matchedDebt) {
            if (!isDebtScheduledForBudgetPeriod(matchedDebt, budgetPeriod)) return;
            const paidInDebtTab = (matchedDebt.payments || []).some((p) =>
              isDateInBudgetPeriod(p.date, budgetPeriod)
            );
            if (paidInDebtTab || matchedDebt.status === 'paid') {
              seenNames.add(cleanName);
              return;
            }
          }
          if (seenNames.has(cleanName)) return;
          const alreadyPaidSub =
            sub.lastRecordedPeriod === activePeriodKey ||
            sub.lastRecordedPeriod === currentCalendarKey ||
            hasMatchingExpenseInPeriod(cleanName, sub.allocatedAmount);
          if (alreadyPaidSub) {
            seenNames.add(cleanName);
            return;
          }
          seenNames.add(cleanName);
          const { dueDate, daysUntil } = resolveDueDateAndDays(sub.dueDateDay);
          billsWithOrder.push({
            daysUntil,
            bill: {
              id: `bill-sub-${sub.id}`,
              name: sub.name,
              dueDate,
              amount: sub.allocatedAmount,
              iconEmoji: sub.emoji || '📅',
              category: sub.group.toUpperCase(),
            },
          });
        }
      });
    }

    // Also include any active payable debts scheduled for this period not yet captured above
    debts.forEach((debt) => {
      if (debt.type !== 'payable' || debt.status !== 'active') return;
      if ((debt.remainingAmount ?? debt.totalAmount) <= 0) return;
      if (!isDebtScheduledForBudgetPeriod(debt, budgetPeriod)) return;

      const cleanDebtName = debt.name.toLowerCase().trim();
      const subDisplayName = debt.name.toLowerCase().startsWith('cicilan')
        ? debt.name
        : `Cicilan ${debt.name}`;

      if (seenNames.has(cleanDebtName) || seenNames.has(subDisplayName.toLowerCase())) return;

      const paidInDebtTab = (debt.payments || []).some((p) =>
        isDateInBudgetPeriod(p.date, budgetPeriod)
      );
      const installmentAmt = getMonthlyDebtInstallmentAmount(debt);
      const alreadyPaidInPeriod =
        paidInDebtTab ||
        hasMatchingExpenseInPeriod(cleanDebtName, installmentAmt) ||
        hasMatchingExpenseInPeriod(subDisplayName.toLowerCase(), installmentAmt);
      if (alreadyPaidInPeriod) {
        seenNames.add(cleanDebtName);
        seenNames.add(subDisplayName.toLowerCase());
        return;
      }

      let dueDay = debt.dueDayOfMonth || 15;
      if (!debt.dueDayOfMonth && debt.dueDate) {
        const pd = parseLocalDay(debt.dueDate);
        if (!isNaN(pd.getTime())) dueDay = pd.getDate();
      }

      seenNames.add(cleanDebtName);
      seenNames.add(subDisplayName.toLowerCase());
      const { dueDate, daysUntil } = resolveDueDateAndDays(dueDay);
      billsWithOrder.push({
        daysUntil,
        bill: {
          id: `bill-debt-${debt.id}`,
          name: subDisplayName,
          dueDate,
          amount: installmentAmt,
          iconEmoji: /kpr|rumah|kost|kontrak/i.test(debt.name)
            ? '🏠'
            : /motor/i.test(debt.name)
            ? '🛵'
            : /mobil/i.test(debt.name)
            ? '🚗'
            : '💳',
          category: 'KEBUTUHAN (CICILAN)',
        },
      });
    });

    return billsWithOrder
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .map((entry) => entry.bill);
  }, [walletsWithBalance, subscriptions, budgetConfig, debts, transactions, budgetPeriod, activeYear, activeMonth]);

  // Dashboard summary metrics
  const dashboardSummary = useMemo<DashboardSummary>(() => {
    const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
    const breakdown = calculateBudgetBreakdown({
      budgetConfig,
      transactions,
      categoryMap,
      activeYear,
      activeMonth,
      activeDay,
      subscriptions,
      debts,
      settings,
    });

    // Liquid assets: All positive non-credit/non-paylater wallets + extra liquidAssets from AssetsTab
    const walletLiquidTotal = walletsWithBalance
      .filter((w) => w.type !== 'credit' && w.type !== 'paylater')
      .reduce((acc, w) => acc + Math.max(0, w.balance), 0);
    const extraLiquidAssetsTotal = (liquidAssets || []).reduce((acc, a) => acc + Math.max(0, a.amount || 0), 0);
    const liquidTotal = walletLiquidTotal + extraLiquidAssetsTotal;

    // Monthly expense baseline for emergency runway calculation:
    // Uses actual spending budget limit or actual monthly expenses if > 0; only falls back to Rp 3.000.000 if neither is set.
    const actualOrBudgetedExpense = Math.max(
      breakdown.monthlySpendingLimit > 0 ? breakdown.monthlySpendingLimit : 0,
      totalExpense
    );
    const baselineMonthlyExpense = actualOrBudgetedExpense > 0 ? actualOrBudgetedExpense : 3000000;
    const runwayMonths = liquidTotal > 0 ? Number((liquidTotal / baselineMonthlyExpense).toFixed(1)) : 0;
    const { effectiveIncome: estIncome } = resolveEffectivePeriodIncome(
      budgetConfig,
      transactions,
      budgetPeriod
    );

    return {
      totalBalance,
      monthlyIncome: totalIncome,
      monthlyExpense: totalExpense,
      netCashflow: totalIncome - totalExpense,
      walletCount: wallets.length,
      budgetLimit: breakdown.monthlySpendingLimit,
      budgetSpent: totalExpense,
      recentTransactions: transactionDetails.slice(0, 5),
      hasMonthlyBudget: estIncome > 0,
      budgetCount: budgetConfig.subcategories.length,
      dailyBudgetQuota: breakdown.dailyBudgetQuota,
      baseDailyQuota: breakdown.baseDailyQuota,
      dailySurplusMode: breakdown.dailySurplusMode,
      dailyDeficitMode: breakdown.dailyDeficitMode,
      todaySurplusAmount: breakdown.todaySurplusAmount,
      weekendBudgetPool: breakdown.weekendBudgetPool,
      dailyBudgetRemaining: breakdown.dailyBudgetRemaining,
      todayIncome,
      todayExpense,
      emergencyFundRunwayMonths: runwayMonths,
      liquidAssetsTotal: liquidTotal,
      // Pos Anggaran Terpisah: Tagihan Bulanan (Fixed) vs Belanja Bulanan/Masak (Grocery) vs Pengeluaran Harian (Variable)
      foodLifestyleMode: breakdown.foodLifestyleMode,
      mealsOutPerDay: breakdown.mealsOutPerDay,
      monthlyFixedBudget: breakdown.monthlyFixedBudget,
      monthlyGroceryBudget: breakdown.monthlyGroceryBudget,
      monthlyVariableBudget: breakdown.monthlyVariableBudget,
      monthlyFixedExpense: breakdown.monthlyFixedExpense,
      monthlyGroceryExpense: breakdown.monthlyGroceryExpense,
      monthlyNonDailyExpense: breakdown.monthlyNonDailyExpense,
      monthlyVariableExpense: breakdown.monthlyVariableExpense,
      todayVariableExpense: breakdown.todayVariableExpense,
      todayNonDailyExpense: breakdown.todayNonDailyExpense,
      todayGroceryExpense: breakdown.todayGroceryExpense,
      todayFixedExpense: breakdown.todayFixedExpense,
      remainingGroceryBudget: breakdown.remainingGroceryBudget,
      dailyOverbudget: breakdown.dailyOverbudget,
      dailyOverbudgetAmount: breakdown.dailyOverbudgetAmount,
      tomorrowDailyQuota: breakdown.tomorrowDailyQuota,
      tomorrowQuotaDiff: breakdown.tomorrowQuotaDiff,
      paydayDay: breakdown.paydayDay,
      isCustomFlexiblePeriod: breakdown.isCustomFlexiblePeriod,
      periodTotalDays: breakdown.periodTotalDays,
      currentPeriodDay: breakdown.currentPeriodDay,
      daysRemainingUntilPayday: breakdown.daysRemainingUntilPayday,
      safeDailyBudgetUntilPayday: breakdown.safeDailyBudgetUntilPayday,
      remainingVariableBudget: breakdown.remainingVariableBudget,
      periodShortLabel: breakdown.periodShortLabel,
      periodFullLabel: breakdown.periodFullLabel,
      endShortLabel: breakdown.endShortLabel,
    };
  }, [
    budgetConfig,
    transactions,
    categories,
    activeYear,
    activeMonth,
    activeDay,
    subscriptions,
    debts,
    settings,
    walletsWithBalance,
    liquidAssets,
    totalBalance,
    totalIncome,
    totalExpense,
    todayIncome,
    todayExpense,
    wallets.length,
    transactionDetails,
    budgetPeriod,
  ]);

  // CRUD: Transaction
  const addTransaction = (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): string => {
    const resolvedTargetWallet =
      walletsWithBalance.find((w) => w.id === data.walletId) ||
      walletsWithBalance.find((w) => w.type !== 'credit' && w.type !== 'paylater') ||
      walletsWithBalance[0];
    const effectiveWalletId = resolvedTargetWallet?.id || data.walletId;

    // Prevent negative wallet balance on any expense or transfer payment from liquid wallets
    const isTargetDebtWallet =
      resolvedTargetWallet?.type === 'credit' || resolvedTargetWallet?.type === 'paylater';
    if ((data.type === 'expense' || data.type === 'transfer') && !isTargetDebtWallet) {
      const currentWalletBalance = resolvedTargetWallet ? Math.max(0, resolvedTargetWallet.balance) : 0;
      if (!resolvedTargetWallet || data.amount > currentWalletBalance) {
        triggerInsufficientBalanceAlert(
          effectiveWalletId,
          data.amount,
          data.note || (data.type === 'transfer' ? 'Transfer Saldo' : 'Transaksi Pembayaran'),
          currentWalletBalance
        );
        return '';
      }
    }

    markLocalMutation();
    const now = new Date().toISOString();
    const generatedId = data.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTx: Transaction = {
      ...data,
      walletId: effectiveWalletId,
      id: generatedId,
      createdAt: now,
      updatedAt: now,
    };
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    setTransactions((prev) => {
      const updated = [newTx, ...prev];
      saveStoredTransactions(updated, localScopeUid);
      if (mirrorUid) saveStoredTransactions(updated, mirrorUid);
      return updated;
    });

    let nextBudgetConfig = budgetConfig;
    let budgetChanged = false;
    const isLoanDisbursement = Boolean(data.note && /^pencairan utang:/i.test(data.note.trim()));
    const isAutoSyncIncome = Boolean(budgetConfig?.settings?.autoSyncIncome);
    if (data.type === 'income' && data.amount > 0 && !isLoanDisbursement && isAutoSyncIncome) {
      const { periodRecordedIncome } = resolveEffectivePeriodIncome(
        budgetConfig,
        [newTx, ...transactions],
        budgetPeriod
      );
      const nextEst =
        periodRecordedIncome > 0
          ? periodRecordedIncome
          : Math.max(0, Number(budgetConfig.estimatedIncome) || 0) + data.amount;
      nextBudgetConfig = {
        ...budgetConfig,
        estimatedIncome: nextEst,
        updatedAt: now,
      };
      budgetChanged = true;
      setBudgetConfig(nextBudgetConfig);
      saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
      if (mirrorUid) saveStoredBudgetConfig(nextBudgetConfig, mirrorUid);
    }

    if (isCloudUser && user?.uid) {
      saveUserTransaction(user.uid, newTx).catch((err) =>
        console.warn('Error saving transaction to Firestore:', err)
      );
      if (mirrorUid) {
        saveUserTransaction(mirrorUid, newTx).catch(() => {});
      }
      if (budgetChanged) {
        persistExtendedBudgetToCloud(user.uid, mirrorUid, {
          budgetConfig: nextBudgetConfig,
        });
      }
    }

    if (data.type === 'income' && data.amount > 0 && !isLoanDisbursement) {
      addToast(
        'Pemasukan Dicatat',
        `${data.note || 'Pemasukan baru'} (+${formatRupiah(data.amount)}) berhasil masuk ke dompet.`
      );
    } else {
      addToast('Transaksi Ditambahkan', `${data.note || 'Transaksi baru'} berhasil dicatat.`);
    }
    return generatedId;
  };

  const updateTransaction = (id: string, data: Partial<Transaction>): boolean => {
    const existingTx = transactions.find((t) => t.id === id);
    const nextType = data.type ?? existingTx?.type;
    const nextAmount = data.amount ?? existingTx?.amount ?? 0;
    const nextWalletId = data.walletId ?? existingTx?.walletId;

    const nextTargetWallet = nextWalletId
      ? walletsWithBalance.find((w) => w.id === nextWalletId)
      : walletsWithBalance[0];
    const isNextDebtWallet =
      nextTargetWallet?.type === 'credit' || nextTargetWallet?.type === 'paylater';

    if ((nextType === 'expense' || nextType === 'transfer') && !isNextDebtWallet) {
      const availableForUpdate = getWalletBalance(nextWalletId, id);
      if (nextAmount > availableForUpdate) {
        triggerInsufficientBalanceAlert(
          nextWalletId || '',
          nextAmount,
          data.note ?? existingTx?.note ?? 'Perubahan Transaksi Pembayaran',
          availableForUpdate
        );
        return false;
      }
    }

    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    let targetTx: Transaction | undefined;
    const updatedTxList = transactions.map((t) => {
      if (t.id === id) {
        targetTx = { ...t, ...data, updatedAt: now };
        return targetTx;
      }
      return t;
    });

    if (!targetTx && existingTx) {
      targetTx = { ...existingTx, ...data, updatedAt: now };
    }

    setTransactions(updatedTxList);
    saveStoredTransactions(updatedTxList, localScopeUid);
    if (mirrorUid) saveStoredTransactions(updatedTxList, mirrorUid);

    const oldIncAmt = existingTx?.type === 'income' ? Number(existingTx.amount) || 0 : 0;
    const newIncAmt = nextType === 'income' ? Number(nextAmount) || 0 : 0;
    const incDelta = newIncAmt - oldIncAmt;
    let nextBudgetConfig: BudgetConfig = {
      ...budgetConfig,
      updatedAt: now,
    };
    if (incDelta !== 0 && Boolean(budgetConfig?.settings?.autoSyncIncome)) {
      const { periodRecordedIncome } = resolveEffectivePeriodIncome(
        budgetConfig,
        updatedTxList,
        budgetPeriod
      );
      nextBudgetConfig = {
        ...budgetConfig,
        estimatedIncome: periodRecordedIncome,
        updatedAt: now,
      };
    }
    setBudgetConfig(nextBudgetConfig);
    saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
    if (mirrorUid) saveStoredBudgetConfig(nextBudgetConfig, mirrorUid);

    if (isCloudUser && user?.uid && targetTx) {
      saveUserTransaction(user.uid, targetTx).catch((err) =>
        console.warn('Error updating transaction in Firestore:', err)
      );
      if (mirrorUid) {
        saveUserTransaction(mirrorUid, targetTx).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: nextBudgetConfig,
      });
    }

    setEditingTransaction(null);
    addToast('Transaksi Diperbarui', 'Perubahan transaksi berhasil disimpan.');
    return true;
  };

  const deleteTransaction = (id: string) => {
    markLocalMutation();
    const deletedTx = transactions.find((t) => t.id === id);
    const nextDeleted = recordDeletedId(id);
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    if (mirrorUid) {
      saveStoredDeletedIds(nextDeleted, mirrorUid);
    }
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveStoredTransactions(updated, localScopeUid);
      if (mirrorUid) saveStoredTransactions(updated, mirrorUid);
      return updated;
    });

    // If this transaction was linked to a debt installment payment, revert the payment from the debt
    let affectedDebt: Debt | undefined;
    const updatedDebts = debts.map((d) => {
      const linkedPayment = (d.payments || []).find((p) => p.transactionId === id);
      if (!linkedPayment) return d;
      const nextPayments = (d.payments || []).filter((p) => p.transactionId !== id);
      const restoredRem = Math.min(d.totalAmount, (d.remainingAmount || 0) + linkedPayment.amount);
      const nextStatus: Debt['status'] = restoredRem > 0 ? 'active' : 'paid';
      affectedDebt = {
        ...d,
        remainingAmount: restoredRem,
        status: nextStatus,
        payments: nextPayments,
        updatedAt: new Date().toISOString(),
      };
      return affectedDebt;
    });

    let nextBudgetConfig = budgetConfig;
    let budgetChanged = false;

    if (
      deletedTx &&
      deletedTx.type === 'income' &&
      deletedTx.amount > 0 &&
      Boolean(budgetConfig?.settings?.autoSyncIncome)
    ) {
      const remainingTxList = transactions.filter((t) => t.id !== id);
      const { periodRecordedIncome } = resolveEffectivePeriodIncome(
        nextBudgetConfig,
        remainingTxList,
        budgetPeriod
      );
      nextBudgetConfig = {
        ...nextBudgetConfig,
        estimatedIncome: periodRecordedIncome,
        deletedIds: nextDeleted,
        updatedAt: new Date().toISOString(),
      };
      budgetChanged = true;
    }

    if (affectedDebt) {
      setDebts(updatedDebts);
      saveStoredDebts(updatedDebts, localScopeUid);
      if (mirrorUid) saveStoredDebts(updatedDebts, mirrorUid);
      if (isCloudUser && user?.uid) {
        saveUserDebt(user.uid, affectedDebt).catch(() => {});
        if (mirrorUid) saveUserDebt(mirrorUid, affectedDebt).catch(() => {});
      }

      if (affectedDebt.type === 'payable') {
        const debtSubId = `sub-debt-${affectedDebt.id}`;
        const subDisplayName = `Cicilan ${affectedDebt.name}`;
        const cleanDebtName = affectedDebt.name.toLowerCase().trim();
        const monthlyTarget = getMonthlyDebtInstallmentAmount(affectedDebt);
        const updatedSubs = (nextBudgetConfig.subcategories || []).map((s) => {
          const sLower = s.name.toLowerCase().trim();
          if (
            s.id === debtSubId ||
            sLower === subDisplayName.toLowerCase() ||
            sLower === cleanDebtName
          ) {
            return {
              ...s,
              allocatedAmount: monthlyTarget,
              isSubscriptionActive: affectedDebt!.remainingAmount > 0,
            };
          }
          return s;
        });
        nextBudgetConfig = {
          ...nextBudgetConfig,
          subcategories: updatedSubs,
          deletedIds: nextDeleted,
          updatedAt: new Date().toISOString(),
        };
        budgetChanged = true;
      }
    }

    // If this deleted transaction was a recorded subscription payment, revert its lastRecordedPeriod
    let nextSubs = subscriptions;
    if (deletedTx && deletedTx.note) {
      const cleanNote = deletedTx.note
        .toLowerCase()
        .replace(/\(otomatis rutin\)|\(rutin\)|\(langganan\)|\(bulanan\)/gi, '')
        .trim();
      const matchedRec = subscriptions.find(
        (rec) => rec.type === deletedTx.type && rec.name.toLowerCase().trim() === cleanNote
      );
      if (matchedRec && matchedRec.lastRecordedPeriod) {
        const nowStr = new Date().toISOString();
        const updatedRec: RecurringItem = {
          ...matchedRec,
          lastRecordedPeriod: '',
          updatedAt: nowStr,
        };
        nextSubs = subscriptions.map((r) => (r.id === matchedRec.id ? updatedRec : r));
        setSubscriptions(nextSubs);
        saveStoredSubscriptions(nextSubs, localScopeUid);
        if (mirrorUid) saveStoredSubscriptions(nextSubs, mirrorUid);
        if (isCloudUser && user?.uid) {
          saveUserSubscription(user.uid, updatedRec).catch(() => {});
          if (mirrorUid) saveUserSubscription(mirrorUid, updatedRec).catch(() => {});
        }
        const updatedSubs = (nextBudgetConfig.subcategories || []).map((s) =>
          s.id === matchedRec.subcategoryId ||
          s.subscriptionId === matchedRec.id ||
          s.name.toLowerCase().trim() === cleanNote
            ? { ...s, lastRecordedPeriod: '' }
            : s
        );
        nextBudgetConfig = {
          ...nextBudgetConfig,
          subcategories: updatedSubs,
          subscriptions: nextSubs,
          deletedIds: nextDeleted,
          updatedAt: nowStr,
        };
        budgetChanged = true;
      }
    }

    if (budgetChanged) {
      setBudgetConfig(nextBudgetConfig);
      saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
      if (mirrorUid) saveStoredBudgetConfig(nextBudgetConfig, mirrorUid);
    }

    if (isCloudUser && user?.uid) {
      deleteUserTransaction(user.uid, id).catch((err) =>
        console.warn('Error deleting transaction from Firestore:', err)
      );
      if (mirrorUid) {
        deleteUserTransaction(mirrorUid, id).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: nextBudgetConfig,
        subscriptions: nextSubs,
        deletedIds: nextDeleted,
      });
    }

    addToast('Transaksi Dihapus', 'Data transaksi telah dihapus.', 'info');
  };

  // CRUD: Wallet
  const addWallet = (data: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>) => {
    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const newW: Wallet = {
      ...data,
      initialBalance: Math.max(0, Number(data.initialBalance) || 0),
      id: `wallet-${Date.now()}`,
      isVerified: true,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...wallets, newW];
    setWallets(updated);
    saveStoredWallets(updated, localScopeUid);
    if (mirrorUid) saveStoredWallets(updated, mirrorUid);
    if (isCloudUser && user?.uid) {
      saveUserWallet(user.uid, newW).catch((err) =>
        console.warn('Error saving wallet to Firestore:', err)
      );
      if (mirrorUid) {
        saveUserWallet(mirrorUid, newW).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid);
    }
    addToast('Dompet Ditambahkan', `Dompet ${data.name} berhasil dibuat.`);
  };

  const updateWallet = (id: string, data: Partial<Wallet>) => {
    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const safeData: Partial<Wallet> = {
      ...data,
      ...(data.initialBalance !== undefined
        ? { initialBalance: Math.max(0, Number(data.initialBalance) || 0) }
        : {}),
    };
    let targetW: Wallet | undefined;
    const updated = wallets.map((w) => {
      if (w.id === id) {
        targetW = { ...w, ...safeData, updatedAt: now };
        return targetW;
      }
      return w;
    });
    setWallets(updated);
    saveStoredWallets(updated, localScopeUid);
    if (mirrorUid) saveStoredWallets(updated, mirrorUid);
    if (isCloudUser && user?.uid && targetW) {
      saveUserWallet(user.uid, targetW).catch((err) =>
        console.warn('Error updating wallet in Firestore:', err)
      );
      if (mirrorUid) {
        saveUserWallet(mirrorUid, targetW).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid);
    }
    addToast('Dompet Diperbarui', 'Informasi dompet berhasil diubah.');
  };

  const deleteWallet = (id: string): boolean => {
    if (wallets.length <= 1) {
      addToast('Gagal Menghapus', 'Minimal harus ada 1 dompet aktif.', 'error');
      return false;
    }
    markLocalMutation();
    const nextDeleted = recordDeletedId(id);
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    if (mirrorUid) {
      saveStoredDeletedIds(nextDeleted, mirrorUid);
    }
    const updated = wallets.filter((w) => w.id !== id);
    setWallets(updated);
    saveStoredWallets(updated, localScopeUid);
    if (mirrorUid) saveStoredWallets(updated, mirrorUid);
    if (isCloudUser && user?.uid) {
      deleteUserWallet(user.uid, id).catch((err) =>
        console.warn('Error deleting wallet from Firestore:', err)
      );
      if (mirrorUid) {
        deleteUserWallet(mirrorUid, id).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, { deletedIds: nextDeleted });
    }
    addToast('Dompet Dihapus', 'Dompet berhasil dihapus.', 'info');
    return true;
  };

  const verifyWalletBalance = (id: string) => {
    updateWallet(id, { isVerified: true, updatedAt: new Date().toISOString() });
    addToast('Terverifikasi', 'Saldo dompet telah diverifikasi akurat.');
  };

  // CRUD: Goals
  const addGoal = (data: Omit<Goal, 'id'>) => {
    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const newG: Goal = {
      ...data,
      id: `goal-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...goals, newG];
    setGoals(updated);
    saveStoredGoals(updated, localScopeUid);
    if (mirrorUid) saveStoredGoals(updated, mirrorUid);
    if (isCloudUser && user?.uid) {
      saveUserGoal(user.uid, newG).catch((err) =>
        console.warn('Error saving goal to Firestore:', err)
      );
      if (mirrorUid) {
        saveUserGoal(mirrorUid, newG).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid);
    }
    addToast('Target Goal Dibuat', `Target ${data.name} berhasil ditambahkan.`);
  };

  const updateGoal = (id: string, data: Partial<Goal>) => {
    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    let targetG: Goal | undefined;
    const updated = goals.map((g) => {
      if (g.id === id) {
        targetG = { ...g, ...data, updatedAt: now };
        return targetG;
      }
      return g;
    });
    setGoals(updated);
    saveStoredGoals(updated, localScopeUid);
    if (mirrorUid) saveStoredGoals(updated, mirrorUid);
    if (isCloudUser && user?.uid && targetG) {
      saveUserGoal(user.uid, targetG).catch((err) =>
        console.warn('Error updating goal in Firestore:', err)
      );
      if (mirrorUid) {
        saveUserGoal(mirrorUid, targetG).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid);
    }
    addToast('Goal Diperbarui', 'Perubahan target berhasil disimpan.');
  };

  const deleteGoal = (id: string) => {
    markLocalMutation();
    const nextDeleted = recordDeletedId(id);
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    if (mirrorUid) {
      saveStoredDeletedIds(nextDeleted, mirrorUid);
    }
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    saveStoredGoals(updated, localScopeUid);
    if (mirrorUid) saveStoredGoals(updated, mirrorUid);
    if (isCloudUser && user?.uid) {
      deleteUserGoal(user.uid, id).catch((err) =>
        console.warn('Error deleting goal from Firestore:', err)
      );
      if (mirrorUid) {
        deleteUserGoal(mirrorUid, id).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, { deletedIds: nextDeleted });
    }
    addToast('Goal Dihapus', 'Target goal telah dihapus.', 'info');
  };

  const toggleLockGoal = (id: string) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    const isLocked = !goal.isLocked;
    updateGoal(id, { isLocked });
    addToast(isLocked ? 'Goal Dikunci' : 'Kunci Goal Dibuka', isLocked ? 'Saldo target diamankan dari pengeluaran.' : 'Saldo target dapat diakses kembali.');
  };

  // CRUD: Debts & Cicilan
  const addDebt = (
    debtData: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>,
    options?: { disburseWalletId?: string }
  ): boolean => {
    // Validate wallet balance first if lending money (receivable) from a wallet
    if (options?.disburseWalletId && debtData.type === 'receivable') {
      const selectedWallet = walletsWithBalance.find((w) => w.id === options.disburseWalletId);
      const currentBalance = selectedWallet ? Math.max(0, selectedWallet.balance) : 0;
      if (!selectedWallet || debtData.totalAmount > currentBalance) {
        triggerInsufficientBalanceAlert(
          options.disburseWalletId,
          debtData.totalAmount,
          `Pinjaman Keluar / Piutang: ${debtData.name}`,
          currentBalance
        );
        return false;
      }
    }

    markLocalMutation();
    const id = `debt-${Date.now()}`;
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const initialRem = debtData.remainingAmount !== undefined ? debtData.remainingAmount : debtData.totalAmount;
    const newDebt: Debt = {
      ...debtData,
      id,
      remainingAmount: initialRem,
      status: initialRem <= 0 ? 'paid' : (debtData.status || 'active'),
      payments: debtData.payments || [],
      createdAt: now,
      updatedAt: now,
    };

    const nextDebts = [newDebt, ...debts];
    setDebts(nextDebts);
    saveStoredDebts(nextDebts, localScopeUid);
    if (mirrorUid) saveStoredDebts(nextDebts, mirrorUid);

    // Auto-sync payable debt directly into Budget Subcategories (KEBUTUHAN & POS TAGIHAN BULANAN)
    let nextBudgetConfig = budgetConfig;
    if (newDebt.type === 'payable') {
      const debtSubId = `sub-debt-${id}`;
      const subDisplayName = newDebt.name.toLowerCase().startsWith('cicilan')
        ? newDebt.name
        : `Cicilan ${newDebt.name}`;
      const cleanDebtName = newDebt.name.toLowerCase().trim();

      let dueDay: number | undefined = newDebt.dueDayOfMonth;
      if (dueDay === undefined && newDebt.dueDate) {
        const pd = new Date(newDebt.dueDate);
        if (!isNaN(pd.getTime())) dueDay = pd.getDate();
      }

      const debtEmoji = /kpr|rumah|kost|kontrak/i.test(newDebt.name)
        ? '🏠'
        : /motor/i.test(newDebt.name)
        ? '🛵'
        : /mobil/i.test(newDebt.name)
        ? '🚗'
        : '💳';

      const allocated = getMonthlyDebtInstallmentAmount(newDebt);
      const isScheduledNow = isDebtScheduledForBudgetPeriod(newDebt, budgetPeriod);

      let updatedSubs = [...(budgetConfig.subcategories || [])];
      const existingIdx = updatedSubs.findIndex((s) => {
        const sLower = s.name.toLowerCase().trim();
        return (
          s.id === debtSubId ||
          sLower === subDisplayName.toLowerCase() ||
          sLower === cleanDebtName
        );
      });

      if (existingIdx >= 0) {
        updatedSubs[existingIdx] = {
          ...updatedSubs[existingIdx],
          name: subDisplayName,
          allocatedAmount: allocated,
          dueDateDay: dueDay !== undefined ? dueDay : updatedSubs[existingIdx].dueDateDay,
          isSubscriptionActive: newDebt.status === 'active' && isScheduledNow,
          subscriptionId: id,
        };
      } else {
        updatedSubs.push({
          id: debtSubId,
          name: subDisplayName,
          group: 'kebutuhan',
          allocatedAmount: allocated,
          emoji: debtEmoji,
          dueDateDay: dueDay,
          subscriptionId: id,
          isSubscriptionActive: newDebt.status === 'active' && isScheduledNow,
        });
      }

      nextBudgetConfig = {
        ...budgetConfig,
        subcategories: updatedSubs,
        updatedAt: now,
      };
      setBudgetConfig(nextBudgetConfig);
      saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
      if (mirrorUid) saveStoredBudgetConfig(nextBudgetConfig, mirrorUid);
    }

    if (isCloudUser && user?.uid) {
      saveUserDebt(user.uid, newDebt).catch((err) =>
        console.warn('Error saving debt to Firestore:', err)
      );
      if (mirrorUid) {
        saveUserDebt(mirrorUid, newDebt).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: nextBudgetConfig,
      });
    }

    // Cashflow integration: if user chose to disburse or release money from/to a wallet
    if (options?.disburseWalletId) {
      const selectedWallet = wallets.find((w) => w.id === options.disburseWalletId);
      if (selectedWallet) {
        if (newDebt.type === 'payable') {
          // User borrows money -> money received into wallet (income)
          addTransaction({
            type: 'income',
            amount: newDebt.totalAmount,
            walletId: selectedWallet.id,
            date: newDebt.startDate || new Date().toISOString().slice(0, 10),
            note: `Pencairan Utang: ${newDebt.name} (${newDebt.contactName})`,
            categoryId: 'cat-gaji',
          });
        } else {
          // User lends money to someone -> money leaves wallet (expense)
          addTransaction({
            type: 'expense',
            amount: newDebt.totalAmount,
            walletId: selectedWallet.id,
            date: newDebt.startDate || new Date().toISOString().slice(0, 10),
            note: `Pinjaman Keluar / Piutang: ${newDebt.name} (${newDebt.contactName})`,
            budgetGroup: 'kebutuhan',
            categoryId: 'cat-tagihan',
          });
        }
      }
    }

    const isScheduledThisPeriod =
      newDebt.type === 'payable' ? isDebtScheduledForBudgetPeriod(newDebt, budgetPeriod) : false;

    const toastSubText = newDebt.type === 'payable'
      ? !isScheduledThisPeriod
        ? `${newDebt.name} dijadwalkan untuk periode/bulan depan (tidak masuk Pos Tagihan Fixed bulan ini).`
        : (newDebt.monthlyInstallment && newDebt.monthlyInstallment > 0)
          ? `${newDebt.name} (${formatRupiah(newDebt.monthlyInstallment)}/bln) otomatis dicatat di Pos Tagihan Bulanan (Fixed).`
          : `${newDebt.name} (${formatRupiah(newDebt.totalAmount)}) otomatis dicatat di Pos Tagihan Bulanan (Fixed).`
      : `${newDebt.name} sebesar ${formatRupiah(newDebt.totalAmount)} telah disimpan.`;

    addToast(
      newDebt.type === 'payable'
        ? isScheduledThisPeriod
          ? 'Utang Dicatat & Masuk ke Budget'
          : 'Utang Dicatat (Mulai Bulan Depan)'
        : 'Piutang Berhasil Dicatat',
      toastSubText
    );
    return true;
  };

  const updateDebt = (id: string, data: Partial<Debt>) => {
    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const nextDebts = debts.map((d) => {
      if (d.id !== id) return d;
      const updatedItem: Debt = {
        ...d,
        ...data,
        updatedAt: now,
      };
      if (updatedItem.remainingAmount <= 0) {
        updatedItem.status = 'paid';
        updatedItem.remainingAmount = 0;
      }
      return updatedItem;
    });
    setDebts(nextDebts);
    saveStoredDebts(nextDebts, localScopeUid);
    if (mirrorUid) saveStoredDebts(nextDebts, mirrorUid);
    const itemToSync = nextDebts.find((d) => d.id === id);

    let nextBudgetConfig = budgetConfig;
    if (itemToSync) {
      const debtSubId = `sub-debt-${id}`;
      const cleanDebtName = itemToSync.name.toLowerCase().trim();
      const subDisplayName = itemToSync.name.toLowerCase().startsWith('cicilan')
        ? itemToSync.name
        : `Cicilan ${itemToSync.name}`;

      if (itemToSync.type === 'payable') {
        let dueDay: number | undefined = itemToSync.dueDayOfMonth;
        if (dueDay === undefined && itemToSync.dueDate) {
          const pd = parseLocalDay(itemToSync.dueDate);
          if (!isNaN(pd.getTime())) dueDay = pd.getDate();
        }

        const allocated = getMonthlyDebtInstallmentAmount(itemToSync);
        const isStillActive =
          itemToSync.status === 'active' &&
          itemToSync.remainingAmount > 0 &&
          isDebtScheduledForBudgetPeriod(itemToSync, budgetPeriod);

        let foundExistingSub = false;
        const updatedSubs = (budgetConfig.subcategories || []).map((s) => {
          const sLower = s.name.toLowerCase().trim();
          if (
            s.id === debtSubId ||
            s.subscriptionId === id ||
            sLower === subDisplayName.toLowerCase() ||
            sLower === cleanDebtName
          ) {
            foundExistingSub = true;
            return {
              ...s,
              name: subDisplayName,
              allocatedAmount: allocated,
              dueDateDay: dueDay,
              isSubscriptionActive: isStillActive,
            };
          }
          return s;
        });

        if (!foundExistingSub) {
          updatedSubs.push({
            id: debtSubId,
            name: subDisplayName,
            group: 'kebutuhan',
            allocatedAmount: allocated,
            emoji: '💳',
            dueDateDay: dueDay,
            isSubscriptionActive: isStillActive,
          });
        }

        nextBudgetConfig = {
          ...budgetConfig,
          subcategories: updatedSubs,
          updatedAt: now,
        };
        setBudgetConfig(nextBudgetConfig);
        saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
        if (mirrorUid) saveStoredBudgetConfig(nextBudgetConfig, mirrorUid);
      } else {
        // Switched to receivable: remove any leftover payable subcategory
        const filteredSubs = (budgetConfig.subcategories || []).filter(
          (s) => s.id !== debtSubId && s.subscriptionId !== id
        );
        if (filteredSubs.length !== (budgetConfig.subcategories || []).length) {
          nextBudgetConfig = {
            ...budgetConfig,
            subcategories: filteredSubs,
            updatedAt: now,
          };
          setBudgetConfig(nextBudgetConfig);
          saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
          if (mirrorUid) saveStoredBudgetConfig(nextBudgetConfig, mirrorUid);
        }
      }
    }

    if (isCloudUser && user?.uid && itemToSync) {
      saveUserDebt(user.uid, itemToSync).catch((err) =>
        console.warn('Error updating debt in Firestore:', err)
      );
      if (mirrorUid) {
        saveUserDebt(mirrorUid, itemToSync).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: nextBudgetConfig,
      });
    }
    addToast('Perubahan Disimpan', 'Data utang/piutang & sinkronisasi budget berhasil diperbarui.');
  };

  const deleteDebt = (id: string) => {
    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const targetDebt = debts.find((d) => d.id === id);
    const nextDebts = debts.filter((d) => d.id !== id);
    setDebts(nextDebts);
    saveStoredDebts(nextDebts, localScopeUid);
    if (mirrorUid) saveStoredDebts(nextDebts, mirrorUid);

    const debtSubId = `sub-debt-${id}`;
    const debtSubNameLower = targetDebt ? `cicilan ${targetDebt.name}`.toLowerCase().trim() : '';
    const removedSubIds: string[] = [debtSubId];
    const updatedSubs = budgetConfig.subcategories.filter((s) => {
      if (s.id === debtSubId || (debtSubNameLower && s.name.toLowerCase().trim() === debtSubNameLower)) {
        removedSubIds.push(s.id);
        return false;
      }
      return true;
    });

    const nextDeleted = recordDeletedId([id, ...removedSubIds]);
    if (mirrorUid) saveStoredDeletedIds(nextDeleted, mirrorUid);

    const nextBudget: BudgetConfig = {
      ...budgetConfig,
      subcategories: updatedSubs,
      deletedIds: nextDeleted,
      updatedAt: new Date().toISOString(),
    };
    setBudgetConfig(nextBudget);
    saveStoredBudgetConfig(nextBudget, localScopeUid);

    if (isCloudUser && user?.uid) {
      deleteUserDebt(user.uid, id).catch((err) =>
        console.warn('Error deleting debt from Firestore:', err)
      );
      if (mirrorUid) {
        deleteUserDebt(mirrorUid, id).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: nextBudget,
        deletedIds: nextDeleted,
      });
    }

    addToast('Catatan Dihapus', 'Data utang/piutang & alokasi cicilan terkait telah dihapus.', 'info');
  };

  const payDebtInstallment = (
    debtId: string,
    amount: number,
    options?: { walletId?: string; date?: string; note?: string }
  ): boolean => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt || amount <= 0) return false;

    const paymentDate = options?.date || new Date().toISOString().slice(0, 10);
    const selectedWallet =
      options?.walletId === ''
        ? undefined
        : options?.walletId
        ? walletsWithBalance.find((w) => w.id === options.walletId)
        : walletsWithBalance[0];

    // Prevent negative wallet balance when paying payable debt
    if (debt.type === 'payable' && selectedWallet) {
      const currentWalletBalance = Math.max(0, selectedWallet.balance);
      if (amount > currentWalletBalance) {
        triggerInsufficientBalanceAlert(
          selectedWallet.id,
          amount,
          `Bayar Cicilan Utang: ${debt.name}`,
          currentWalletBalance
        );
        return false;
      }
    }

    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);

    let createdTxId: string | undefined = undefined;

    // Create real cashflow transaction so wallet & monthly budget are updated
    if (selectedWallet) {
      const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      if (debt.type === 'payable') {
        // Paying off our debt -> Fixed Expense in Kebutuhan (automatically cuts monthly & daily budget!)
        createdTxId = addTransaction({
          id: txId,
          type: 'expense',
          amount: amount,
          walletId: selectedWallet.id,
          date: paymentDate,
          note: `Bayar Cicilan Utang: ${debt.name} (${options?.note || debt.contactName})`,
          budgetGroup: 'kebutuhan',
          expenseNature: 'fixed',
          categoryId: 'cat-tagihan',
        });
        if (!createdTxId) return false;
      } else {
        // Someone paying back our receivable -> Income to selected wallet
        createdTxId = addTransaction({
          id: txId,
          type: 'income',
          amount: amount,
          walletId: selectedWallet.id,
          date: paymentDate,
          note: `Pelunasan/Cicilan Piutang: ${debt.name} (${debt.contactName})`,
          categoryId: 'cat-gaji',
        });
      }
    }

    const newPayment: DebtPayment = {
      id: `pay-${Date.now()}`,
      debtId,
      amount,
      date: paymentDate,
      walletId: selectedWallet?.id,
      walletName: selectedWallet?.name,
      note: options?.note || (debt.type === 'payable' ? 'Pembayaran Cicilan' : 'Penerimaan Cicilan'),
      transactionId: createdTxId,
    };

    const newRemaining = Math.max(0, debt.remainingAmount - amount);
    const newStatus = newRemaining <= 0 ? 'paid' : debt.status;
    const allPayments = [...(debt.payments || []), newPayment];

    const nextDebts = debts.map((d) => {
      if (d.id !== debtId) return d;
      return {
        ...d,
        remainingAmount: newRemaining,
        status: newStatus,
        payments: allPayments,
        updatedAt: new Date().toISOString(),
      };
    });

    setDebts(nextDebts);
    saveStoredDebts(nextDebts, localScopeUid);
    if (mirrorUid) saveStoredDebts(nextDebts, mirrorUid);
    const updatedDebt = nextDebts.find((d) => d.id === debtId);
    if (isCloudUser && user?.uid && updatedDebt) {
      saveUserDebt(user.uid, updatedDebt).catch((err) =>
        console.warn('Error saving debt payment to Firestore:', err)
      );
      if (mirrorUid) {
        saveUserDebt(mirrorUid, updatedDebt).catch(() => {});
      }
    }

    // Sync payable debt installment directly into BudgetConfig (KEBUTUHAN & POS TAGIHAN BULANAN)
    if (debt.type === 'payable') {
      const payD = parseLocalDay(paymentDate);
      const payPeriod = getBudgetPeriodInfo(
        payD.getFullYear(),
        payD.getMonth(),
        payD.getDate(),
        effectivePaydayDay,
        {
          periodMode: budgetConfig.periodMode,
          customPeriodStart: budgetConfig.customPeriodStart,
          customNextPayday: budgetConfig.customNextPayday,
        }
      );
      const totalPaidInMonth = allPayments.reduce((sum, p) => {
        const d = parseLocalDay(p.date);
        if (isDateInBudgetPeriod(d, payPeriod)) {
          return sum + p.amount;
        }
        return sum;
      }, 0);

      const debtSubId = `sub-debt-${debt.id}`;
      const subDisplayName = debt.name.toLowerCase().startsWith('cicilan')
        ? debt.name
        : `Cicilan ${debt.name}`;
      const cleanDebtName = debt.name.toLowerCase().trim();

      let updatedSubcategories = [...(budgetConfig.subcategories || [])];
      const existingSub = updatedSubcategories.find((s) => {
        const sLower = s.name.toLowerCase().trim();
        return (
          s.id === debtSubId ||
          s.subscriptionId === debt.id ||
          sLower === subDisplayName.toLowerCase() ||
          sLower === cleanDebtName
        );
      });

      const remAtPeriodStart = Math.max(0, newRemaining + totalPaidInMonth);
      const monthlyTarget =
        remAtPeriodStart > 0
          ? getMonthlyDebtInstallmentAmount({
              ...debt,
              remainingAmount: remAtPeriodStart,
              status: 'active',
            })
          : 0;
      const targetSubAllocation = Math.max(monthlyTarget, totalPaidInMonth);

      if (existingSub) {
        updatedSubcategories = updatedSubcategories.map((s) =>
          s.id === existingSub.id
            ? {
                ...s,
                allocatedAmount: targetSubAllocation,
                isSubscriptionActive: newRemaining > 0,
              }
            : s
        );
      } else {
        updatedSubcategories.push({
          id: debtSubId,
          name: subDisplayName,
          group: 'kebutuhan',
          allocatedAmount: targetSubAllocation,
          emoji: '💳',
          isSubscriptionActive: newRemaining > 0,
        });
      }

      const nextBudgetConfig: BudgetConfig = {
        ...budgetConfig,
        subcategories: updatedSubcategories,
        updatedAt: new Date().toISOString(),
      };
      setBudgetConfig(nextBudgetConfig);
      saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
      if (isCloudUser && user?.uid) {
        persistExtendedBudgetToCloud(user.uid, mirrorUid, { budgetConfig: nextBudgetConfig });
      }
    } else if (isCloudUser && user?.uid) {
      persistExtendedBudgetToCloud(user.uid, mirrorUid);
    }

    if (newRemaining <= 0) {
      addToast(
        '🎉 Lunas Sempurna!',
        `Selamat! ${debt.name} telah lunas & memotong budget bulan ini sebesar ${formatRupiah(amount)}.`
      );
    } else {
      addToast(
        'Pembayaran Utang & Budget Tersinkron',
        `Cicilan ${formatRupiah(amount)} tercatat di Pos Tagihan & memotong budget tersedia bulan ini.`
      );
    }
    return true;
  };

  const settleDebt = (
    debtId: string,
    options?: { walletId?: string; date?: string; note?: string }
  ): boolean => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return false;
    return payDebtInstallment(debtId, debt.remainingAmount, {
      walletId: options?.walletId,
      date: options?.date,
      note: options?.note || 'Pelunasan Penuh',
    });
  };

  const cancelDebtPayment = (debtId: string, paymentId?: string): boolean => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return false;

    const existingPayments = debt.payments || [];
    const targetPayment = paymentId
      ? existingPayments.find((p) => p.id === paymentId)
      : existingPayments.length > 0
      ? existingPayments[existingPayments.length - 1]
      : undefined;

    // Fallback when there are no items in `payments` array but debt was partially/fully paid
    if (!targetPayment && debt.remainingAmount >= debt.totalAmount && debt.status !== 'paid') {
      return false;
    }

    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);

    let refundedAmount = 0;
    let nextPayments = existingPayments;
    let txToRemove: Transaction | undefined;

    if (targetPayment) {
      refundedAmount = targetPayment.amount;
      nextPayments = existingPayments.filter((p) => p.id !== targetPayment.id);

      // Find linked cashflow transaction by ID or by matching note/date/amount
      if (targetPayment.transactionId) {
        txToRemove = transactions.find((t) => t.id === targetPayment.transactionId);
      }
      if (!txToRemove) {
        const debtNameLower = debt.name.toLowerCase().trim();
        txToRemove = transactions.find(
          (t) =>
            t.date === targetPayment.date &&
            t.amount === targetPayment.amount &&
            (t.note || '').toLowerCase().includes(debtNameLower)
        );
      }
    } else {
      // No payment object stored, restore full remaining amount to totalAmount
      refundedAmount = Math.max(0, debt.totalAmount - debt.remainingAmount);
      nextPayments = [];
      const debtNameLower = debt.name.toLowerCase().trim();
      txToRemove = transactions.find(
        (t) =>
          (t.note || '').toLowerCase().includes(debtNameLower) &&
          ((t.note || '').toLowerCase().includes('cicilan') ||
            (t.note || '').toLowerCase().includes('pelunasan'))
      );
    }

    const restoredRemaining = Math.min(
      debt.totalAmount,
      (debt.remainingAmount || 0) + (refundedAmount > 0 ? refundedAmount : debt.totalAmount)
    );
    const nextStatus: Debt['status'] = restoredRemaining > 0 ? 'active' : 'paid';

    const updatedDebt: Debt = {
      ...debt,
      remainingAmount: restoredRemaining,
      status: nextStatus,
      payments: nextPayments,
      updatedAt: now,
    };

    const nextDebts = debts.map((d) => (d.id === debtId ? updatedDebt : d));
    setDebts(nextDebts);
    saveStoredDebts(nextDebts, localScopeUid);
    if (mirrorUid) saveStoredDebts(nextDebts, mirrorUid);

    let nextDeleted = deletedIds;
    if (txToRemove) {
      nextDeleted = recordDeletedId(txToRemove.id);
      if (mirrorUid) saveStoredDeletedIds(nextDeleted, mirrorUid);

      setTransactions((prev) => {
        const updatedTx = prev.filter((t) => t.id !== txToRemove!.id);
        saveStoredTransactions(updatedTx, localScopeUid);
        if (mirrorUid) saveStoredTransactions(updatedTx, mirrorUid);
        return updatedTx;
      });

      if (isCloudUser && user?.uid) {
        deleteUserTransaction(user.uid, txToRemove.id).catch((err) =>
          console.warn('Error deleting reverted debt transaction from Firestore:', err)
        );
        if (mirrorUid) {
          deleteUserTransaction(mirrorUid, txToRemove.id).catch(() => {});
        }
      }
    }

    let nextBudgetConfig = budgetConfig;
    if (debt.type === 'payable') {
      const paymentDate = targetPayment?.date || getTodayDateStr();
      const payD = parseLocalDay(paymentDate);
      const payPeriod = getBudgetPeriodInfo(
        payD.getFullYear(),
        payD.getMonth(),
        payD.getDate(),
        effectivePaydayDay,
        {
          periodMode: budgetConfig.periodMode,
          customPeriodStart: budgetConfig.customPeriodStart,
          customNextPayday: budgetConfig.customNextPayday,
        }
      );
      const totalPaidInMonth = nextPayments.reduce((sum, p) => {
        const d = parseLocalDay(p.date);
        if (isDateInBudgetPeriod(d, payPeriod)) {
          return sum + p.amount;
        }
        return sum;
      }, 0);

      const debtSubId = `sub-debt-${debt.id}`;
      const subDisplayName = debt.name.toLowerCase().startsWith('cicilan')
        ? debt.name
        : `Cicilan ${debt.name}`;
      const cleanDebtName = debt.name.toLowerCase().trim();

      const remAtPeriodStart = Math.max(0, restoredRemaining + totalPaidInMonth);
      const monthlyTarget =
        remAtPeriodStart > 0
          ? getMonthlyDebtInstallmentAmount({
              ...updatedDebt,
              remainingAmount: remAtPeriodStart,
              status: 'active',
            })
          : 0;
      const targetSubAllocation = Math.max(monthlyTarget, totalPaidInMonth);

      const updatedSubcategories = (budgetConfig.subcategories || []).map((s) => {
        const sLower = s.name.toLowerCase().trim();
        if (
          s.id === debtSubId ||
          s.subscriptionId === debt.id ||
          sLower === subDisplayName.toLowerCase() ||
          sLower === cleanDebtName
        ) {
          return {
            ...s,
            allocatedAmount: targetSubAllocation,
            isSubscriptionActive: restoredRemaining > 0,
          };
        }
        return s;
      });

      nextBudgetConfig = {
        ...budgetConfig,
        subcategories: updatedSubcategories,
        deletedIds: nextDeleted,
        updatedAt: now,
      };
      setBudgetConfig(nextBudgetConfig);
      saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
      if (mirrorUid) saveStoredBudgetConfig(nextBudgetConfig, mirrorUid);
    }

    if (isCloudUser && user?.uid) {
      saveUserDebt(user.uid, updatedDebt).catch((err) =>
        console.warn('Error saving reverted debt to Firestore:', err)
      );
      if (mirrorUid) {
        saveUserDebt(mirrorUid, updatedDebt).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: nextBudgetConfig,
        deletedIds: nextDeleted,
      });
    }

    const walletRefundMsg =
      txToRemove && targetPayment?.walletName
        ? ` & saldo ${targetPayment.walletName} telah dikembalikan`
        : txToRemove
        ? ' & transaksi dompet terkait telah dihapus'
        : '';

    addToast(
      'Pembayaran Dibatalkan',
      `Pencatatan pembayaran ${formatRupiah(refundedAmount)} untuk ${debt.name} dibatalkan${walletRefundMsg}.`,
      'info'
    );
    return true;
  };

  // CRUD: BudgetConfig
  const updateBudgetConfig = (data: Partial<BudgetConfig>) => {
    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const nextPayday =
      data.paydayDay !== undefined
        ? Math.max(1, Math.min(31, Math.round(Number(data.paydayDay) || 1)))
        : budgetConfig.paydayDay || settings.paydayDay || 1;
    const nextPeriodMode =
      data.periodMode !== undefined
        ? data.periodMode
        : budgetConfig.periodMode || settings.periodMode || 'standard';
    const nextCustomStart =
      data.customPeriodStart !== undefined
        ? data.customPeriodStart
        : budgetConfig.customPeriodStart || settings.customPeriodStart;
    const nextCustomNext =
      data.customNextPayday !== undefined
        ? data.customNextPayday
        : budgetConfig.customNextPayday || settings.customNextPayday;

    const hasPeriodUpdate =
      data.paydayDay !== undefined ||
      data.periodMode !== undefined ||
      data.customPeriodStart !== undefined ||
      data.customNextPayday !== undefined;

    const hasSettingsOrPeriodUpdate =
      hasPeriodUpdate || Boolean(data.settings);

    const nextSettings: AppSettings = hasSettingsOrPeriodUpdate
      ? {
          ...settings,
          ...(budgetConfig.settings || {}),
          ...(data.settings || {}),
          paydayDay: nextPayday,
          periodMode: nextPeriodMode,
          customPeriodStart: nextCustomStart,
          customNextPayday: nextCustomNext,
        }
      : {
          ...settings,
          ...(budgetConfig.settings || {}),
        };

    if (hasSettingsOrPeriodUpdate) {
      setSettings(nextSettings);
      saveStoredSettings(nextSettings, localScopeUid);
      if (mirrorUid) saveStoredSettings(nextSettings, mirrorUid);
    }
    const updated: BudgetConfig = {
      ...budgetConfig,
      ...data,
      paydayDay: nextPayday,
      periodMode: nextPeriodMode,
      customPeriodStart: nextCustomStart,
      customNextPayday: nextCustomNext,
      settings: nextSettings,
      updatedAt: new Date().toISOString(),
    };
    setBudgetConfig(updated);
    saveStoredBudgetConfig(updated, localScopeUid);
    if (isCloudUser && user?.uid) {
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: updated,
        settings: nextSettings,
      });
    }
    if (hasPeriodUpdate && !data.subcategories && data.estimatedIncome === undefined && data.needsPercent === undefined) {
      if (nextPeriodMode === 'custom' && nextCustomStart && nextCustomNext) {
        const sD = parseLocalDay(nextCustomStart);
        const eD = parseLocalDay(nextCustomNext);
        const diffDays = Math.max(1, Math.round((eD.getTime() - sD.getTime()) / (1000 * 60 * 60 * 24)));
        addToast(
          'Periode Gajian Fleksibel Aktif',
          `Periode diatur manual (${diffDays} hari): ${nextCustomStart} s/d ${nextCustomNext}.`
        );
      } else {
        addToast(
          'Periode Gajian Diperbarui',
          nextPayday === 1
            ? 'Periode budget diatur ke siklus kalender bulanan (Tgl 1 s/d akhir bulan).'
            : `Periode budget diatur mulai Tanggal ${nextPayday} hingga Tanggal ${nextPayday} bulan berikutnya.`
        );
      }
    } else {
      addToast('Alokasi Disimpan', 'Pengaturan anggaran berhasil diperbarui.');
    }
  };

  const addBudgetSubcategory = (item: { name: string; group: BudgetGroup; allocatedAmount: number; emoji: string; dueDateDay?: number; isGroceryStock?: boolean }) => {
    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const newSub = {
      id: `sub-${Date.now()}`,
      ...item,
    };
    const updated: BudgetConfig = {
      ...budgetConfig,
      subcategories: [...budgetConfig.subcategories, newSub],
      updatedAt: new Date().toISOString(),
    };
    setBudgetConfig(updated);
    saveStoredBudgetConfig(updated, localScopeUid);
    if (isCloudUser && user?.uid) {
      persistExtendedBudgetToCloud(user.uid, mirrorUid, { budgetConfig: updated });
    }
    addToast('Subkategori Ditambahkan', `${item.name} berhasil ditambahkan ke ${item.group}.`);
  };

  const updateBudgetSubcategory = (
    id: string,
    data: { name?: string; group?: BudgetGroup; allocatedAmount?: number; emoji?: string; dueDateDay?: number; isGroceryStock?: boolean }
  ) => {
    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    let targetSubName = '';
    const existsInConfig = budgetConfig.subcategories.some((s) => s.id === id);
    const updatedSub = existsInConfig
      ? budgetConfig.subcategories.map((s) => {
          if (s.id === id) {
            targetSubName = s.name.toLowerCase().trim();
            return { ...s, ...data };
          }
          return s;
        })
      : [
          ...budgetConfig.subcategories,
          {
            id,
            name: data.name || 'Subkategori',
            group: data.group || 'kebutuhan',
            allocatedAmount: data.allocatedAmount ?? 0,
            emoji: data.emoji || '💳',
            dueDateDay: data.dueDateDay,
            isGroceryStock: data.isGroceryStock,
          },
        ];
    const updated: BudgetConfig = {
      ...budgetConfig,
      subcategories: updatedSub,
      updatedAt: now,
    };

    // Two-way sync with payable debts if this is a debt subcategory (e.g. sub-debt-*)
    if (id.startsWith('sub-debt-') && data.allocatedAmount !== undefined) {
      const linkedDebtId = id.replace(/^sub-debt-/, '');
      const hasLinkedDebt = debts.some((d) => d.id === linkedDebtId);
      if (hasLinkedDebt) {
        const nextDebts = debts.map((d) => {
          if (d.id !== linkedDebtId) return d;
          const updatedDebt: Debt = {
            ...d,
            monthlyInstallment: data.allocatedAmount,
            dueDayOfMonth: data.dueDateDay !== undefined ? data.dueDateDay : d.dueDayOfMonth,
            updatedAt: now,
          };
          if (isCloudUser && user?.uid) {
            saveUserDebt(user.uid, updatedDebt).catch(() => {});
            if (mirrorUid) saveUserDebt(mirrorUid, updatedDebt).catch(() => {});
          }
          return updatedDebt;
        });
        setDebts(nextDebts);
        saveStoredDebts(nextDebts, localScopeUid);
        if (mirrorUid) saveStoredDebts(nextDebts, mirrorUid);
      }
    }

    // Two-way sync: if a subscription is linked to this subcategory, keep its details in sync
    let nextSubs = subscriptions;
    const hasLinkedSub = subscriptions.some(
      (rec) =>
        rec.subcategoryId === id ||
        (targetSubName && rec.name.toLowerCase().trim() === targetSubName)
    );
    if (hasLinkedSub) {
      nextSubs = subscriptions.map((rec) => {
        if (
          rec.subcategoryId === id ||
          (targetSubName && rec.name.toLowerCase().trim() === targetSubName)
        ) {
          const updatedRec: RecurringItem = {
            ...rec,
            subcategoryId: id,
            name: data.name !== undefined ? data.name : rec.name,
            emoji: data.emoji !== undefined ? data.emoji : rec.emoji,
            budgetGroup: data.group !== undefined ? data.group : rec.budgetGroup,
            billingDay: data.dueDateDay !== undefined ? data.dueDateDay : rec.billingDay,
            amount:
              data.allocatedAmount !== undefined && rec.frequency === 'monthly'
                ? data.allocatedAmount
                : rec.amount,
            updatedAt: now,
          };
          if (isCloudUser && user?.uid) {
            saveUserSubscription(user.uid, updatedRec).catch((err) =>
              console.warn('Error updating subscription in Firestore:', err)
            );
            if (mirrorUid) {
              saveUserSubscription(mirrorUid, updatedRec).catch(() => {});
            }
          }
          return updatedRec;
        }
        return rec;
      });
      setSubscriptions(nextSubs);
      saveStoredSubscriptions(nextSubs, localScopeUid);
      if (mirrorUid) saveStoredSubscriptions(nextSubs, mirrorUid);
    }

    setBudgetConfig(updated);
    saveStoredBudgetConfig(updated, localScopeUid);
    if (isCloudUser && user?.uid) {
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: updated,
        subscriptions: nextSubs,
      });
    }

    addToast('Subkategori Diperbarui', 'Alokasi subkategori berhasil disimpan.');
  };

  const deleteBudgetSubcategory = (id: string) => {
    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const targetSub = budgetConfig.subcategories.find((s) => s.id === id);
    const targetNameLower = targetSub ? targetSub.name.toLowerCase().trim() : '';

    const updatedSub = budgetConfig.subcategories.filter((s) => s.id !== id);

    // Also delete any subscription linked to this deleted subcategory so it never stays as a ghost bill
    const removedSubs: RecurringItem[] = [];
    const nextSubs = subscriptions.filter((rec) => {
      if (rec.subcategoryId === id) {
        removedSubs.push(rec);
        return false;
      }
      if (targetSub?.subscriptionId && rec.id === targetSub.subscriptionId) {
        removedSubs.push(rec);
        return false;
      }
      if (targetNameLower && rec.type === 'expense' && rec.name.toLowerCase().trim() === targetNameLower) {
        removedSubs.push(rec);
        return false;
      }
      return true;
    });

    const nextDeleted = recordDeletedId([
      id,
      targetSub?.subscriptionId,
      ...removedSubs.map((r) => r.id),
    ]);
    if (mirrorUid) saveStoredDeletedIds(nextDeleted, mirrorUid);

    if (nextSubs.length !== subscriptions.length) {
      setSubscriptions(nextSubs);
      saveStoredSubscriptions(nextSubs, localScopeUid);
      if (mirrorUid) saveStoredSubscriptions(nextSubs, mirrorUid);
      if (isCloudUser && user?.uid) {
        for (const rem of removedSubs) {
          deleteUserSubscription(user.uid, rem.id).catch((err) =>
            console.warn('Error deleting subscription from Firestore:', err)
          );
          if (mirrorUid) {
            deleteUserSubscription(mirrorUid, rem.id).catch(() => {});
          }
        }
      }
    }

    const updated: BudgetConfig = {
      ...budgetConfig,
      subcategories: updatedSub,
      subscriptions: nextSubs,
      deletedIds: nextDeleted,
      updatedAt: new Date().toISOString(),
    };
    setBudgetConfig(updated);
    saveStoredBudgetConfig(updated, localScopeUid);
    if (isCloudUser && user?.uid) {
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: updated,
        subscriptions: nextSubs,
        deletedIds: nextDeleted,
      });
    }

    addToast('Subkategori Dihapus', 'Subkategori & jadwal tagihan terkait telah dihapus.', 'info');
  };

  // CRUD: Subscriptions & Recurring Transactions (Two-way integrated with BudgetConfig & Cloud Firestore)
  const addSubscription = (itemData: Omit<RecurringItem, 'id'>) => {
    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const newId = `sub-rec-${Date.now()}`;
    const cleanName = itemData.name.trim();
    const cleanNameLower = cleanName.toLowerCase();

    let updatedSubcategories = [...(budgetConfig.subcategories || [])];
    let linkedSubcategoryId = itemData.subcategoryId;
    const determinedGroup: BudgetGroup =
      itemData.budgetGroup ||
      (itemData.categoryId === 'cat-hiburan' ? 'keinginan' : 'kebutuhan');

    let nextBudgetConfig: BudgetConfig = { ...budgetConfig, updatedAt: now };

    if (itemData.type === 'expense') {
      const monthlyAmt = getMonthlySubscriptionAmount(itemData.amount, itemData.frequency);
      const existingSub =
        (linkedSubcategoryId && updatedSubcategories.find((s) => s.id === linkedSubcategoryId)) ||
        updatedSubcategories.find((s) => {
          const sName = s.name.toLowerCase().trim();
          return sName === cleanNameLower || s.subscriptionId === newId;
        });

      if (existingSub) {
        linkedSubcategoryId = existingSub.id;
        updatedSubcategories = updatedSubcategories.map((s) =>
          s.id === existingSub.id
            ? {
                ...s,
                name: cleanName,
                emoji: itemData.emoji || s.emoji,
                group: determinedGroup,
                allocatedAmount: monthlyAmt,
                dueDateDay: itemData.billingDay,
                subscriptionId: newId,
                isSubscriptionActive: itemData.isActive,
                walletId: itemData.walletId,
                categoryId: itemData.categoryId,
                frequency: itemData.frequency,
                lastRecordedPeriod: itemData.lastRecordedPeriod,
              }
            : s
        );
      } else {
        const newSubId = `sub-${Date.now()}`;
        linkedSubcategoryId = newSubId;
        updatedSubcategories.push({
          id: newSubId,
          name: cleanName,
          group: determinedGroup,
          allocatedAmount: monthlyAmt,
          emoji: itemData.emoji || '🔁',
          dueDateDay: itemData.billingDay,
          subscriptionId: newId,
          isSubscriptionActive: itemData.isActive,
          walletId: itemData.walletId,
          categoryId: itemData.categoryId,
          frequency: itemData.frequency,
          lastRecordedPeriod: itemData.lastRecordedPeriod,
        });
      }

      nextBudgetConfig = {
        ...budgetConfig,
        subcategories: updatedSubcategories,
        updatedAt: now,
      };
    } else if (itemData.type === 'income' && budgetConfig.estimatedIncome === 0) {
      const monthlyInc = getMonthlySubscriptionAmount(itemData.amount, itemData.frequency);
      nextBudgetConfig = {
        ...budgetConfig,
        estimatedIncome: monthlyInc,
        updatedAt: now,
      };
    }

    const newItem: RecurringItem = {
      ...itemData,
      id: newId,
      name: cleanName,
      subcategoryId: linkedSubcategoryId,
      budgetGroup: itemData.type === 'expense' ? determinedGroup : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const nextSubs = [...subscriptions, newItem];
    setSubscriptions(nextSubs);
    saveStoredSubscriptions(nextSubs, localScopeUid);
    if (mirrorUid) saveStoredSubscriptions(nextSubs, mirrorUid);

    setBudgetConfig({ ...nextBudgetConfig, subscriptions: nextSubs });
    saveStoredBudgetConfig({ ...nextBudgetConfig, subscriptions: nextSubs }, localScopeUid);

    if (isCloudUser && user?.uid) {
      saveUserSubscription(user.uid, newItem).catch((err) =>
        console.warn('Error saving subscription to Firestore:', err)
      );
      if (mirrorUid) {
        saveUserSubscription(mirrorUid, newItem).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: nextBudgetConfig,
        subscriptions: nextSubs,
      });
    }
    addToast(
      'Jadwal & Budget Disimpan',
      itemData.type === 'expense'
        ? `${newItem.name} ditambahkan & otomatis terhubung ke Pos Tagihan Bulanan (${determinedGroup.toUpperCase()}).`
        : `${newItem.name} berhasil ditambahkan ke jadwal pemasukan rutin.`
    );
  };

  const updateSubscription = (id: string, data: Partial<RecurringItem>) => {
    const existingItem = subscriptions.find((i) => i.id === id);
    if (!existingItem) return;

    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);

    const merged: RecurringItem = {
      ...existingItem,
      ...data,
      name: (data.name !== undefined ? data.name : existingItem.name).trim(),
      updatedAt: now,
    };

    const determinedGroup: BudgetGroup =
      merged.budgetGroup ||
      (merged.categoryId === 'cat-hiburan' ? 'keinginan' : 'kebutuhan');

    let updatedSubcategories = [...(budgetConfig.subcategories || [])];
    let linkedSubcategoryId = merged.subcategoryId;
    let nextBudgetConfig: BudgetConfig = { ...budgetConfig, updatedAt: now };

    if (merged.type === 'expense') {
      const monthlyAmt = getMonthlySubscriptionAmount(merged.amount, merged.frequency);
      const prevNameLower = existingItem.name.toLowerCase().trim();
      const newNameLower = merged.name.toLowerCase().trim();

      const matchedSub =
        (linkedSubcategoryId && updatedSubcategories.find((s) => s.id === linkedSubcategoryId)) ||
        updatedSubcategories.find(
          (s) =>
            s.subscriptionId === id ||
            s.name.toLowerCase().trim() === prevNameLower ||
            s.name.toLowerCase().trim() === newNameLower
        );

      if (matchedSub) {
        linkedSubcategoryId = matchedSub.id;
        updatedSubcategories = updatedSubcategories.map((s) =>
          s.id === matchedSub.id
            ? {
                ...s,
                name: merged.name,
                emoji: merged.emoji || s.emoji,
                group: determinedGroup,
                allocatedAmount: monthlyAmt,
                dueDateDay: merged.billingDay,
                subscriptionId: id,
                isSubscriptionActive: merged.isActive,
                walletId: merged.walletId,
                categoryId: merged.categoryId,
                frequency: merged.frequency,
                lastRecordedPeriod: merged.lastRecordedPeriod,
              }
            : s
        );
      } else {
        const newSubId = `sub-${Date.now()}`;
        linkedSubcategoryId = newSubId;
        updatedSubcategories.push({
          id: newSubId,
          name: merged.name,
          group: determinedGroup,
          allocatedAmount: monthlyAmt,
          emoji: merged.emoji || '🔁',
          dueDateDay: merged.billingDay,
          subscriptionId: id,
          isSubscriptionActive: merged.isActive,
          walletId: merged.walletId,
          categoryId: merged.categoryId,
          frequency: merged.frequency,
          lastRecordedPeriod: merged.lastRecordedPeriod,
        });
      }

      nextBudgetConfig = {
        ...budgetConfig,
        subcategories: updatedSubcategories,
        updatedAt: now,
      };
    } else if (existingItem.type === 'expense' && merged.type === 'income') {
      // Switched from expense to income -> remove old expense subcategory if linked
      updatedSubcategories = updatedSubcategories.filter(
        (s) => s.id !== existingItem.subcategoryId && s.subscriptionId !== id
      );
      linkedSubcategoryId = undefined;
      nextBudgetConfig = {
        ...budgetConfig,
        subcategories: updatedSubcategories,
        updatedAt: now,
      };
    }

    const finalUpdatedItem: RecurringItem = {
      ...merged,
      subcategoryId: linkedSubcategoryId,
      budgetGroup: merged.type === 'expense' ? determinedGroup : undefined,
      updatedAt: now,
    };

    const nextSubs = subscriptions.map((i) => (i.id === id ? finalUpdatedItem : i));
    setSubscriptions(nextSubs);
    saveStoredSubscriptions(nextSubs, localScopeUid);
    if (mirrorUid) saveStoredSubscriptions(nextSubs, mirrorUid);

    setBudgetConfig({ ...nextBudgetConfig, subscriptions: nextSubs });
    saveStoredBudgetConfig({ ...nextBudgetConfig, subscriptions: nextSubs }, localScopeUid);

    if (isCloudUser && user?.uid) {
      saveUserSubscription(user.uid, finalUpdatedItem).catch((err) =>
        console.warn('Error updating subscription in Firestore:', err)
      );
      if (mirrorUid) {
        saveUserSubscription(mirrorUid, finalUpdatedItem).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: nextBudgetConfig,
        subscriptions: nextSubs,
      });
    }
    addToast(
      'Jadwal Diperbarui',
      `${finalUpdatedItem.name} & alokasi budget terkait berhasil diperbarui.`
    );
  };

  const toggleSubscriptionActive = (id: string) => {
    const target = subscriptions.find((i) => i.id === id);
    if (!target) return;
    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const nextActive = !target.isActive;
    const updatedItem: RecurringItem = { ...target, isActive: nextActive, updatedAt: now };
    const nextSubs = subscriptions.map((i) => (i.id === id ? updatedItem : i));
    setSubscriptions(nextSubs);
    saveStoredSubscriptions(nextSubs, localScopeUid);
    if (mirrorUid) saveStoredSubscriptions(nextSubs, mirrorUid);

    let nextBudgetConfig: BudgetConfig = { ...budgetConfig, updatedAt: now };
    if (target.type === 'expense') {
      const targetNameLower = target.name.toLowerCase().trim();
      const updatedSubcategories = budgetConfig.subcategories.map((s) => {
        if (
          s.id === target.subcategoryId ||
          s.subscriptionId === id ||
          s.name.toLowerCase().trim() === targetNameLower
        ) {
          return { ...s, isSubscriptionActive: nextActive };
        }
        return s;
      });
      nextBudgetConfig = {
        ...budgetConfig,
        subcategories: updatedSubcategories,
        updatedAt: now,
      };
    }

    setBudgetConfig({ ...nextBudgetConfig, subscriptions: nextSubs });
    saveStoredBudgetConfig({ ...nextBudgetConfig, subscriptions: nextSubs }, localScopeUid);

    if (isCloudUser && user?.uid) {
      saveUserSubscription(user.uid, updatedItem).catch((err) =>
        console.warn('Error toggling subscription in Firestore:', err)
      );
      if (mirrorUid) {
        saveUserSubscription(mirrorUid, updatedItem).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: nextBudgetConfig,
        subscriptions: nextSubs,
      });
    }

    addToast(
      nextActive ? 'Jadwal Diaktifkan' : 'Jadwal Dijeda',
      nextActive
        ? `${target.name} aktif & kembali dihitung dalam Pos Tagihan Bulanan.`
        : `${target.name} dijeda & dikeluarkan sementara dari beban tagihan bulanan.`,
      'info'
    );
  };

  const deleteSubscription = (id: string) => {
    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const target = subscriptions.find((i) => i.id === id);
    const nextSubs = subscriptions.filter((i) => i.id !== id);
    setSubscriptions(nextSubs);
    saveStoredSubscriptions(nextSubs, localScopeUid);
    if (mirrorUid) saveStoredSubscriptions(nextSubs, mirrorUid);

    const removedSubcatIds: string[] = [];
    let updatedSubcategories = budgetConfig.subcategories;

    if (target && target.type === 'expense') {
      const targetNameLower = target.name.toLowerCase().trim();
      updatedSubcategories = budgetConfig.subcategories.filter((s) => {
        if (
          s.id === target.subcategoryId ||
          s.subscriptionId === id ||
          s.name.toLowerCase().trim() === targetNameLower
        ) {
          removedSubcatIds.push(s.id);
          return false;
        }
        return true;
      });
    }

    const nextDeleted = recordDeletedId([id, target?.subcategoryId, ...removedSubcatIds]);
    if (mirrorUid) saveStoredDeletedIds(nextDeleted, mirrorUid);

    const nextBudgetConfig: BudgetConfig = {
      ...budgetConfig,
      subcategories: updatedSubcategories,
      subscriptions: nextSubs,
      deletedIds: nextDeleted,
      updatedAt: new Date().toISOString(),
    };
    setBudgetConfig(nextBudgetConfig);
    saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);

    if (isCloudUser && user?.uid) {
      deleteUserSubscription(user.uid, id).catch((err) =>
        console.warn('Error deleting subscription from Firestore:', err)
      );
      if (mirrorUid) {
        deleteUserSubscription(mirrorUid, id).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: nextBudgetConfig,
        subscriptions: nextSubs,
        deletedIds: nextDeleted,
      });
    }

    addToast('Jadwal Dihapus', 'Langganan & alokasi subkategori budget terkait telah dihapus.', 'info');
  };

  const recordSubscriptionPayment = (
    id: string,
    options?: { walletId?: string; amount?: number; date?: string; note?: string }
  ): boolean => {
    const item = subscriptions.find((i) => i.id === id);
    if (!item) return false;

    const paymentAmount =
      options?.amount !== undefined && options.amount > 0 ? options.amount : item.amount;

    const requestedWalletId = options?.walletId || item.walletId;
    const validRequestedWallet = requestedWalletId
      ? walletsWithBalance.find((w) => w.id === requestedWalletId)
      : undefined;

    const liquidFallback =
      walletsWithBalance.find(
        (w) => w.type !== 'credit' && w.type !== 'paylater' && w.balance >= paymentAmount
      ) ||
      walletsWithBalance.find((w) => w.type !== 'credit' && w.type !== 'paylater') ||
      walletsWithBalance[0];

    const resolvedWallet = validRequestedWallet || liquidFallback;
    const targetWalletId = resolvedWallet?.id || wallets[0]?.id || 'wallet-bca';

    if (item.type === 'expense') {
      const currentWalletBalance = getWalletBalance(targetWalletId);
      if (paymentAmount > currentWalletBalance) {
        triggerInsufficientBalanceAlert(
          targetWalletId,
          paymentAmount,
          `Tagihan Rutin: ${item.name}`,
          currentWalletBalance
        );
        return false;
      }
    }

    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const currentPeriodKey = budgetPeriod.periodKey;
    const dateStr =
      options?.date ||
      `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}-${String(activeDay).padStart(2, '0')}`;

    const cleanItemName = item.name.toLowerCase().trim();
    const matchedSub =
      (item.subcategoryId && budgetConfig?.subcategories?.find((s) => s.id === item.subcategoryId)) ||
      budgetConfig?.subcategories?.find((s) => {
        const sName = s.name.toLowerCase().trim();
        return (
          s.subscriptionId === item.id ||
          cleanItemName === sName ||
          cleanItemName.includes(sName) ||
          sName.includes(cleanItemName)
        );
      });

    const determinedBudgetGroup: BudgetGroup =
      matchedSub?.group ||
      item.budgetGroup ||
      (item.categoryId === 'cat-hiburan' ? 'keinginan' : 'kebutuhan');

    const txNote = options?.note?.trim() || `${item.name} (Otomatis Rutin)`;
    const createdId = addTransaction({
      walletId: targetWalletId,
      categoryId: item.categoryId || (matchedSub ? matchedSub.id.replace('sub-', 'cat-') : 'cat-tagihan'),
      budgetGroup: item.type === 'expense' ? determinedBudgetGroup : undefined,
      expenseNature: item.type === 'expense' ? 'fixed' : undefined,
      type: item.type,
      amount: paymentAmount,
      note: txNote,
      date: dateStr,
    });
    if (!createdId) return false;

    const updatedItem: RecurringItem = {
      ...item,
      walletId: targetWalletId,
      lastRecordedPeriod: currentPeriodKey,
      updatedAt: now,
    };
    const nextSubs = subscriptions.map((i) => (i.id === item.id ? updatedItem : i));
    setSubscriptions(nextSubs);
    saveStoredSubscriptions(nextSubs, localScopeUid);
    if (mirrorUid) saveStoredSubscriptions(nextSubs, mirrorUid);

    const updatedSubcategories = (budgetConfig.subcategories || []).map((s) =>
      matchedSub && s.id === matchedSub.id
        ? { ...s, walletId: targetWalletId, lastRecordedPeriod: currentPeriodKey }
        : s
    );

    let nextEstimatedIncome = budgetConfig.estimatedIncome;
    if (item.type === 'income' && Boolean(budgetConfig?.settings?.autoSyncIncome)) {
      const syntheticTx: Transaction = {
        id: createdId,
        type: 'income',
        amount: paymentAmount,
        walletId: targetWalletId,
        date: dateStr,
        note: txNote,
        createdAt: now,
        updatedAt: now,
      };
      const { periodRecordedIncome } = resolveEffectivePeriodIncome(
        budgetConfig,
        [syntheticTx, ...transactions],
        budgetPeriod
      );
      if (periodRecordedIncome > 0) {
        nextEstimatedIncome = periodRecordedIncome;
      }
    }

    const nextBudgetConfig: BudgetConfig = {
      ...budgetConfig,
      estimatedIncome: nextEstimatedIncome,
      subcategories: updatedSubcategories,
      subscriptions: nextSubs,
      updatedAt: now,
    };
    setBudgetConfig(nextBudgetConfig);
    saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);

    if (isCloudUser && user?.uid) {
      saveUserSubscription(user.uid, updatedItem).catch((err) =>
        console.warn('Error updating recorded subscription in Firestore:', err)
      );
      if (mirrorUid) {
        saveUserSubscription(mirrorUid, updatedItem).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: nextBudgetConfig,
        subscriptions: nextSubs,
      });
    }

    addToast(
      'Pembayaran Dicatat',
      item.type === 'expense'
        ? `${item.name} masuk ke Pos Tagihan Bulanan (${determinedBudgetGroup.toUpperCase()}) tanpa memotong Budget Harian.`
        : `${item.name} berhasil dicatat sebagai pemasukan rutin.`,
      'success'
    );
    return true;
  };

  const cancelSubscriptionPayment = (id: string, txIdsToRemove?: string[]): boolean => {
    const item = subscriptions.find((i) => i.id === id);
    if (!item) return false;

    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);

    const txIds = txIdsToRemove && txIdsToRemove.length > 0 ? txIdsToRemove : [];
    const txIdSet = new Set(txIds);

    let nextDeleted = deletedIds;
    let remainingTxs = transactions;

    if (txIdSet.size > 0) {
      nextDeleted = recordDeletedId(txIds);
      if (mirrorUid) saveStoredDeletedIds(nextDeleted, mirrorUid);

      remainingTxs = transactions.filter((t) => !txIdSet.has(t.id));
      setTransactions(remainingTxs);
      saveStoredTransactions(remainingTxs, localScopeUid);
      if (mirrorUid) saveStoredTransactions(remainingTxs, mirrorUid);

      if (isCloudUser && user?.uid) {
        txIds.forEach((txId) => {
          deleteUserTransaction(user.uid, txId).catch(() => {});
          if (mirrorUid) deleteUserTransaction(mirrorUid, txId).catch(() => {});
        });
      }
    }

    const updatedItem: RecurringItem = {
      ...item,
      lastRecordedPeriod: '',
      updatedAt: now,
    };
    const nextSubs = subscriptions.map((i) => (i.id === id ? updatedItem : i));
    setSubscriptions(nextSubs);
    saveStoredSubscriptions(nextSubs, localScopeUid);
    if (mirrorUid) saveStoredSubscriptions(nextSubs, mirrorUid);

    const cleanItemName = item.name.toLowerCase().trim();
    const updatedSubcategories = (budgetConfig.subcategories || []).map((s) => {
      const sName = s.name.toLowerCase().trim();
      if (
        s.id === item.subcategoryId ||
        s.subscriptionId === item.id ||
        sName === cleanItemName
      ) {
        return { ...s, lastRecordedPeriod: '' };
      }
      return s;
    });

    let nextEstimatedIncome = budgetConfig.estimatedIncome;
    if (item.type === 'income' && txIdSet.size > 0 && Boolean(budgetConfig?.settings?.autoSyncIncome)) {
      const { periodRecordedIncome } = resolveEffectivePeriodIncome(
        budgetConfig,
        remainingTxs,
        budgetPeriod
      );
      nextEstimatedIncome = periodRecordedIncome;
    }

    const nextBudgetConfig: BudgetConfig = {
      ...budgetConfig,
      estimatedIncome: nextEstimatedIncome,
      subcategories: updatedSubcategories,
      subscriptions: nextSubs,
      deletedIds: nextDeleted,
      updatedAt: now,
    };
    setBudgetConfig(nextBudgetConfig);
    saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
    if (mirrorUid) saveStoredBudgetConfig(nextBudgetConfig, mirrorUid);

    if (isCloudUser && user?.uid) {
      saveUserSubscription(user.uid, updatedItem).catch(() => {});
      if (mirrorUid) saveUserSubscription(mirrorUid, updatedItem).catch(() => {});
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        budgetConfig: nextBudgetConfig,
        subscriptions: nextSubs,
        deletedIds: nextDeleted,
      });
    }

    addToast(
      'Pencatatan Dibatalkan',
      txIdSet.size > 0
        ? `Pembayaran ${item.name} dibatalkan & saldo dompet dikembalikan.`
        : `Status ${item.name} dikembalikan ke belum dicatat.`,
      'info'
    );
    return true;
  };

  const syncSubscriptionsToBudget = () => {
    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    let updatedSubcategories = [...(budgetConfig.subcategories || [])];
    let changed = false;

    const nextSubs = subscriptions.map((item) => {
      if (item.type !== 'expense') return item;
      const monthlyAmt = getMonthlySubscriptionAmount(item.amount, item.frequency);
      const itemNameLower = item.name.toLowerCase().trim();
      const determinedGroup: BudgetGroup =
        item.budgetGroup ||
        (item.categoryId === 'cat-hiburan' ? 'keinginan' : 'kebutuhan');

      const matchedSub =
        (item.subcategoryId && updatedSubcategories.find((s) => s.id === item.subcategoryId)) ||
        updatedSubcategories.find(
          (s) => s.subscriptionId === item.id || s.name.toLowerCase().trim() === itemNameLower
        );

      if (matchedSub) {
        changed = true;
        updatedSubcategories = updatedSubcategories.map((s) =>
          s.id === matchedSub.id
            ? {
                ...s,
                allocatedAmount: monthlyAmt,
                dueDateDay: item.billingDay,
                emoji: item.emoji || s.emoji,
                group: determinedGroup,
                subscriptionId: item.id,
                isSubscriptionActive: item.isActive,
                walletId: item.walletId,
                categoryId: item.categoryId,
                frequency: item.frequency,
                lastRecordedPeriod: item.lastRecordedPeriod,
              }
            : s
        );
        return { ...item, subcategoryId: matchedSub.id, budgetGroup: determinedGroup, updatedAt: now };
      } else {
        changed = true;
        const newSubId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        updatedSubcategories.push({
          id: newSubId,
          name: item.name,
          group: determinedGroup,
          allocatedAmount: monthlyAmt,
          emoji: item.emoji || '🔁',
          dueDateDay: item.billingDay,
          subscriptionId: item.id,
          isSubscriptionActive: item.isActive,
          walletId: item.walletId,
          categoryId: item.categoryId,
          frequency: item.frequency,
          lastRecordedPeriod: item.lastRecordedPeriod,
        });
        return { ...item, subcategoryId: newSubId, budgetGroup: determinedGroup, updatedAt: now };
      }
    });

    if (changed) {
      setSubscriptions(nextSubs);
      saveStoredSubscriptions(nextSubs, localScopeUid);
      if (mirrorUid) saveStoredSubscriptions(nextSubs, mirrorUid);
      const nextBudgetConfig: BudgetConfig = {
        ...budgetConfig,
        subcategories: updatedSubcategories,
        subscriptions: nextSubs,
        updatedAt: now,
      };
      setBudgetConfig(nextBudgetConfig);
      saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
      if (isCloudUser && user?.uid) {
        persistExtendedBudgetToCloud(user.uid, mirrorUid, {
          budgetConfig: nextBudgetConfig,
          subscriptions: nextSubs,
        });
        for (const subItem of nextSubs) {
          saveUserSubscription(user.uid, subItem).catch(() => {});
          if (mirrorUid) saveUserSubscription(mirrorUid, subItem).catch(() => {});
        }
      }
      addToast('Sinkronisasi Berhasil', 'Semua jadwal langganan kini terhubung ke Pos Alokasi Budget & Cloud.');
    }
  };

  // Assets & Investments CRUD (Cloud-Synced)
  const addAsset = (type: 'liquid' | 'fixed', item: Omit<AssetItem, 'id'>) => {
    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const newAsset: AssetItem = {
      ...item,
      id: `asset-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    if (type === 'liquid') {
      const updated = [...liquidAssets, newAsset];
      setLiquidAssets(updated);
      saveStoredAssets('liquid', updated, localScopeUid);
      if (mirrorUid) saveStoredAssets('liquid', updated, mirrorUid);
      if (isCloudUser && user?.uid) {
        persistExtendedBudgetToCloud(user.uid, mirrorUid, { liquidAssets: updated });
      }
    } else {
      const updated = [...fixedAssets, newAsset];
      setFixedAssets(updated);
      saveStoredAssets('fixed', updated, localScopeUid);
      if (mirrorUid) saveStoredAssets('fixed', updated, mirrorUid);
      if (isCloudUser && user?.uid) {
        persistExtendedBudgetToCloud(user.uid, mirrorUid, { fixedAssets: updated });
      }
    }
    addToast('Aset Ditambahkan', `${item.name} berhasil dicatat dan disinkronkan.`);
  };

  const deleteAsset = (type: 'liquid' | 'fixed', id: string) => {
    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const nextDeleted = recordDeletedId(id);
    if (mirrorUid) saveStoredDeletedIds(nextDeleted, mirrorUid);
    if (type === 'liquid') {
      const updated = liquidAssets.filter((a) => a.id !== id);
      setLiquidAssets(updated);
      saveStoredAssets('liquid', updated, localScopeUid);
      if (mirrorUid) saveStoredAssets('liquid', updated, mirrorUid);
      if (isCloudUser && user?.uid) {
        persistExtendedBudgetToCloud(user.uid, mirrorUid, {
          liquidAssets: updated,
          deletedIds: nextDeleted,
        });
      }
    } else {
      const updated = fixedAssets.filter((a) => a.id !== id);
      setFixedAssets(updated);
      saveStoredAssets('fixed', updated, localScopeUid);
      if (mirrorUid) saveStoredAssets('fixed', updated, mirrorUid);
      if (isCloudUser && user?.uid) {
        persistExtendedBudgetToCloud(user.uid, mirrorUid, {
          fixedAssets: updated,
          deletedIds: nextDeleted,
        });
      }
    }
    addToast('Aset Dihapus', 'Catatan aset telah dihapus.', 'info');
  };

  const addInvestment = (item: Omit<InvestmentItem, 'id'>) => {
    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const newInv: InvestmentItem = {
      ...item,
      id: `inv-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    const updated = [...investments, newInv];
    setInvestments(updated);
    saveStoredInvestments(updated, localScopeUid);
    if (mirrorUid) saveStoredInvestments(updated, mirrorUid);
    if (isCloudUser && user?.uid) {
      persistExtendedBudgetToCloud(user.uid, mirrorUid, { investments: updated });
    }
    addToast('Portofolio Ditambahkan', `${item.name} berhasil dicatat dan disinkronkan.`);
  };

  const deleteInvestment = (id: string) => {
    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const nextDeleted = recordDeletedId(id);
    if (mirrorUid) saveStoredDeletedIds(nextDeleted, mirrorUid);
    const updated = investments.filter((i) => i.id !== id);
    setInvestments(updated);
    saveStoredInvestments(updated, localScopeUid);
    if (mirrorUid) saveStoredInvestments(updated, mirrorUid);
    if (isCloudUser && user?.uid) {
      persistExtendedBudgetToCloud(user.uid, mirrorUid, {
        investments: updated,
        deletedIds: nextDeleted,
      });
    }
    addToast('Portofolio Dihapus', 'Catatan investasi telah dihapus.', 'info');
  };

  // Transfer funds
  const transferFunds = (
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    note?: string,
    date?: string
  ): boolean => {
    if (!amount || amount <= 0 || fromWalletId === toWalletId) {
      return false;
    }
    const fromW = walletsWithBalance.find((w) => w.id === fromWalletId);
    const toW = wallets.find((w) => w.id === toWalletId);
    const isFromDebtWallet = fromW?.type === 'credit' || fromW?.type === 'paylater';
    const currentFromBalance = fromW ? Math.max(0, fromW.balance) : 0;

    if (!fromW || (!isFromDebtWallet && amount > currentFromBalance)) {
      triggerInsufficientBalanceAlert(
        fromWalletId,
        amount,
        note || `Transfer ke ${toW?.name || 'Dompet'}`,
        currentFromBalance
      );
      return false;
    }

    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);

    const tx: Transaction = {
      id: `tx-transfer-${Date.now()}`,
      type: 'transfer',
      amount,
      walletId: fromWalletId,
      transferWalletId: toWalletId,
      date: date || now,
      note: note || `Transfer dari ${fromW?.name || 'Dompet'} ke ${toW?.name || 'Dompet'}`,
      createdAt: now,
      updatedAt: now,
    };

    setTransactions((prev) => {
      const updated = [tx, ...prev];
      saveStoredTransactions(updated, localScopeUid);
      if (mirrorUid) saveStoredTransactions(updated, mirrorUid);
      return updated;
    });

    if (isCloudUser && user?.uid) {
      saveUserTransaction(user.uid, tx).catch((err) =>
        console.warn('Error saving transfer transaction to Firestore:', err)
      );
      if (mirrorUid) {
        saveUserTransaction(mirrorUid, tx).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid);
    }

    addToast('Transfer Berhasil', `Rp ${amount.toLocaleString('id-ID')} dipindahkan.`);
    return true;
  };

  // Settings
  const updateSettings = (data: Partial<AppSettings>, silent = false) => {
    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const updated = { ...settings, ...data };
    setSettings(updated);
    saveStoredSettings(updated, localScopeUid);
    if (mirrorUid) saveStoredSettings(updated, mirrorUid);

    setBudgetConfig((prev) => {
      const nextCfg = {
        ...prev,
        ...(data.dailySurplusMode !== undefined ? { dailySurplusMode: data.dailySurplusMode } : {}),
        ...(data.dailyDeficitMode !== undefined ? { dailyDeficitMode: data.dailyDeficitMode } : {}),
        settings: { ...(prev.settings || {}), ...updated },
      };
      saveStoredBudgetConfig(nextCfg, localScopeUid);
      if (mirrorUid) saveStoredBudgetConfig(nextCfg, mirrorUid);
      return nextCfg;
    });

    if (data.userName && data.userName.trim()) {
      const cleanName = data.userName.trim();
      setUser((prev) => (prev ? { ...prev, displayName: cleanName } : prev));
      const activeLocal = loadActiveLocalUser();
      if (activeLocal) {
        saveActiveLocalUser({ ...activeLocal, displayName: cleanName });
      }
      const regList = loadRegisteredAccounts();
      const targetEmail = (user?.email || updated.userEmail || '').trim().toLowerCase();
      if (targetEmail && regList.some((r) => r.email.toLowerCase() === targetEmail)) {
        saveRegisteredAccounts(
          regList.map((r) =>
            r.email.toLowerCase() === targetEmail ? { ...r, displayName: cleanName } : r
          )
        );
        syncLocalManagedUsersList();
      }
    }

    if (data.avatarUrl !== undefined) {
      const newPhotoURL = data.avatarUrl || null;
      setUser((prev) => (prev ? { ...prev, photoURL: newPhotoURL } : prev));
      const activeLocal = loadActiveLocalUser();
      if (activeLocal) {
        saveActiveLocalUser({ ...activeLocal, photoURL: newPhotoURL });
      }
      const regList = loadRegisteredAccounts();
      const targetEmail = (user?.email || updated.userEmail || '').trim().toLowerCase();
      if (targetEmail && regList.some((r) => r.email.toLowerCase() === targetEmail)) {
        saveRegisteredAccounts(
          regList.map((r) =>
            r.email.toLowerCase() === targetEmail ? { ...r, photoURL: newPhotoURL } : r
          )
        );
        syncLocalManagedUsersList();
      }
    }

    if (isCloudUser && user?.uid) {
      persistExtendedBudgetToCloud(user.uid, mirrorUid, { settings: updated });
      if (data.userName !== undefined || data.avatarUrl !== undefined) {
        const cleanName =
          (data.userName && data.userName.trim()) ||
          user.displayName ||
          updated.userName ||
          'Pengguna';
        updateCloudUserProfile(user.uid, user.email || '', cleanName, updated).catch(() => {});
        if (mirrorUid) {
          updateCloudUserProfile(mirrorUid, user.email || '', cleanName, updated).catch(() => {});
        }
      }
    }

    if (!silent) {
      addToast('Pengaturan Disimpan', 'Preferensi berhasil diperbarui.');
    }
  };

  const toggleHideBalance = () => {
    const nextVal = !settings.hideBalance;
    updateSettings({ hideBalance: nextVal }, true);
    addToast(
      nextVal ? 'Saldo Disembunyikan' : 'Saldo Ditampilkan',
      nextVal ? 'Nominal saldo disamarkan.' : 'Nominal saldo kini terlihat.',
      'info'
    );
  };

  const setThemeMode = (mode: ThemeMode) => {
    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    applyThemeToDOM(mode, settings.accentColor);
    const updated = { ...settings, themeMode: mode };
    setSettings(updated);
    saveStoredSettings(updated, localScopeUid);
    if (mirrorUid) saveStoredSettings(updated, mirrorUid);
    if (isCloudUser && user?.uid) {
      persistExtendedBudgetToCloud(user.uid, mirrorUid, { settings: updated });
    }
    addToast(
      mode === 'light' ? 'Mode Terang' : 'Mode Gelap',
      mode === 'light' ? 'Tampilan beralih ke mode terang.' : 'Tampilan beralih ke mode gelap.',
      'info'
    );
  };

  const setAccentColor = (accent: AccentColor) => {
    updateSettings({ accentColor: accent }, true);
  };

  const deductAiCredit = (_amount = 1): boolean => {
    return true;
  };

  const addAiCredits = (_amount: number) => {
    // No-op: AI credits feature disabled
  };

  // App Lock
  const lockApp = () => {
    if (settings.pinEnabled) {
      setIsLocked(true);
    }
  };

  const unlockApp = () => {
    setIsLocked(false);
  };

  const setAppPin = (pin: string) => {
    const simpleHash = btoa(`pin-${pin}`);
    updateSettings(
      {
        pinEnabled: true,
        pinHash: simpleHash,
        pinLength: pin.length,
      },
      true
    );
    addToast('PIN Diaktifkan', 'Aplikasi kini dilindungi PIN 4 digit.');
  };

  const disableAppPin = () => {
    updateSettings(
      {
        pinEnabled: false,
        pinHash: undefined,
      },
      true
    );
    setIsLocked(false);
    addToast('PIN Dinonaktifkan', 'Kunci PIN aplikasi dimatikan.', 'info');
  };

  const verifyPinCode = (pin: string): boolean => {
    if (!settings.pinHash) return true;
    const targetHash = btoa(`pin-${pin}`);
    return targetHash === settings.pinHash;
  };

  // Open modals
  const openAddTransaction = (preselectedType: TransactionType = 'expense', initialDate?: string) => {
    setEditingTransaction(null);
    setPreselectedTransactionType(preselectedType);
    setPreselectedTransactionDate(initialDate || null);
    setIsAddTransactionOpen(true);
  };

  const openEditTransaction = (tx: TransactionDetail) => {
    setEditingTransaction(tx);
    setPreselectedTransactionDate(null);
    setIsAddTransactionOpen(true);
  };

  const openScanModal = (
    initialImageBase64?: string | React.MouseEvent<HTMLElement>,
    mimeType?: string,
    autoSave = true
  ) => {
    if (typeof initialImageBase64 === 'string' && initialImageBase64) {
      setScanInitialImage({ base64: initialImageBase64, mimeType: mimeType || 'image/jpeg', autoSave });
    } else {
      setScanInitialImage(null);
    }
    setIsScanModalOpen(true);
  };

  const openTransferModal = (fromWalletId?: string) => {
    setIsTransferOpen(true);
  };

  const openAddWallet = () => {
    setEditingWallet(null);
    setIsWalletModalOpen(true);
  };

  const openEditWallet = (wallet: Wallet) => {
    const rawWallet = wallets.find((w) => w.id === wallet.id) || wallet;
    setEditingWallet(rawWallet);
    setIsWalletModalOpen(true);
  };

  const openAddGoal = () => {
    setIsAddGoalModalOpen(true);
  };

  const openGoalDetail = (goal: Goal) => {
    setSelectedGoalDetail(goal);
  };

  const exportToCSV = () => {
    const csv = exportTransactionsToCSV(transactionDetails);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dompt_transaksi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Ekspor Berhasil', 'File CSV berhasil diunduh.');
  };

  const resetAllAppData = async () => {
    try {
      clearAllData(localScopeUid);
      resetStorageToZero(localScopeUid);

      if (isCloudUser && user?.uid) {
        addToast('Mereset Data...', 'Sedang membersihkan catatan di cloud Firestore...', 'info');
        const cleanWallets = await resetUserFirestoreData(user.uid);
        setWallets(cleanWallets && cleanWallets.length > 0 ? cleanWallets : getCleanDefaultWallets());
        setTransactions([]);
        setGoals([]);
        setDebts([]);
        setSubscriptions([]);
        setLiquidAssets([]);
        setFixedAssets([]);
        setInvestments([]);
        setBudgets([]);
        setDeletedIds([]);
        setBudgetConfig(EMPTY_BUDGET_CONFIG);
        setSettings((prev) => ({ ...prev, hideBalance: false }));
        setDataResetVersion((v) => v + 1);
        addToast('Data Cloud Direset', 'Semua catatan di akun cloud Anda berhasil dikosongkan ke 0.', 'success');
      } else {
        setWallets(getCleanDefaultWallets());
        setCategories(loadStoredCategories());
        setTransactions([]);
        setBudgets([]);
        setBudgetConfig(EMPTY_BUDGET_CONFIG);
        setGoals([]);
        setDebts([]);
        setSubscriptions([]);
        setLiquidAssets([]);
        setFixedAssets([]);
        setInvestments([]);
        setDeletedIds([]);
        if (!localScopeUid) {
          setSettings(loadStoredSettings());
        } else {
          setSettings((prev) => ({ ...prev, hideBalance: false }));
        }
        setIsLocked(false);
        setDataResetVersion((v) => v + 1);
        addToast('Data Direset', 'Semua data akun telah dikosongkan menjadi 0.');
      }
    } catch (err: any) {
      console.error('Error resetting app data:', err);
      addToast('Gagal Reset', 'Terjadi kendala saat mereset data.', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        previousTab,
        goBack,
        wallets,
        categories,
        transactions,
        budgets,
        budgetConfig,
        goals,
        debts,
        subscriptions,
        liquidAssets,
        fixedAssets,
        investments,
        upcomingBills,
        settings,
        walletsWithBalance,
        totalBalance,
        totalIncome,
        totalExpense,
        todayIncome,
        todayExpense,
        activeDate,
        setActiveDate,
        activeYear,
        activeMonth,
        activeDay,
        budgetPeriod,
        goToPrevPeriod,
        goToNextPeriod,
        goToCurrentPeriod,
        transactionDetails,
        dashboardSummary,
        isAddTransactionOpen,
        setIsAddTransactionOpen,
        editingTransaction,
        setEditingTransaction,
        preselectedTransactionType,
        preselectedTransactionDate,
        openAddTransaction,
        openEditTransaction,
        isScanModalOpen,
        setIsScanModalOpen,
        scanInitialImage,
        setScanInitialImage,
        openScanModal,
        isTransferOpen,
        setIsTransferOpen,
        openTransferModal,
        isWalletModalOpen,
        setIsWalletModalOpen,
        editingWallet,
        openAddWallet,
        openEditWallet,
        isAddGoalModalOpen,
        setIsAddGoalModalOpen,
        selectedGoalDetail,
        setSelectedGoalDetail,
        openAddGoal,
        openGoalDetail,
        isEditBudgetCategoryModalOpen,
        setIsEditBudgetCategoryModalOpen,
        isAddSubcategoryModalOpen,
        setIsAddSubcategoryModalOpen,
        editingSubcategoryGroup,
        setEditingSubcategoryGroup,
        isLocked,
        unlockApp,
        lockApp,
        setAppPin,
        disableAppPin,
        verifyPinCode,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addWallet,
        updateWallet,
        deleteWallet,
        verifyWalletBalance,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleLockGoal,
        addDebt,
        updateDebt,
        deleteDebt,
        payDebtInstallment,
        settleDebt,
        cancelDebtPayment,
        updateBudgetConfig,
        addBudgetSubcategory,
        updateBudgetSubcategory,
        deleteBudgetSubcategory,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        toggleSubscriptionActive,
        recordSubscriptionPayment,
        cancelSubscriptionPayment,
        syncSubscriptionsToBudget,
        addAsset,
        deleteAsset,
        addInvestment,
        deleteInvestment,
        transferFunds,
        updateSettings,
        toggleHideBalance,
        setThemeMode,
        setAccentColor,
        deductAiCredit,
        addAiCredits,
        insufficientBalanceAlert,
        setInsufficientBalanceAlert,
        triggerInsufficientBalanceAlert,
        getWalletBalance,
        toasts,
        addToast,
        removeToast,
        exportToCSV,
        resetAllAppData,
        user,
        authLoading,
        isLoginModalOpen,
        setIsLoginModalOpen,
        openLoginModal,
        signInWithGoogle,
        registerWithEmailPassword,
        loginWithEmailPassword,
        signOutUser,
        dataResetVersion,
        userRole,
        userAccountStatus,
        isAdmin,
        managedUsers,
        bugReports,
        approveUserAccount,
        deactivateUserAccount,
        setPendingUserAccount,
        updateUserAccountRole,
        refreshUserAccountStatus,
        refreshAdminData,
        submitBugReport,
        updateBugReportByAdmin,
        deleteBugReportById,
        changeAccountPassword,
        adminResetUserPassword,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
