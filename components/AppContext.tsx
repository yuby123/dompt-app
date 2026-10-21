'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccentColor,
  AppSettings,
  AssetItem,
  Budget,
  BudgetConfig,
  BudgetGroup,
  Category,
  DashboardSummary,
  Debt,
  DebtPayment,
  Goal,
  InvestmentItem,
  RecurringItem,
  ThemeMode,
  Transaction,
  TransactionDetail,
  TransactionType,
  UpcomingBill,
  Wallet,
  WalletWithBalance,
} from '@/lib/types';
import {
  cacheRegisteredAccountLocally,
  clearAllData,
  getCloudAccountUid,
  getInitialBudgets,
  getInitialSampleTransactions,
  hashAccountPassword,
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
  getAdjacentPeriodDateStr,
  getBudgetPeriodInfo,
  getMonthlySubscriptionAmount,
  isDateInBudgetPeriod,
  isFixedExpense,
  parseLocalDay,
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
  | 'health-score';

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
  openAddTransaction: (preselectedType?: TransactionType) => void;
  openEditTransaction: (tx: TransactionDetail) => void;

  isScanModalOpen: boolean;
  setIsScanModalOpen: (open: boolean) => void;
  scanInitialImage: { base64: string; mimeType: string } | null;
  setScanInitialImage: (img: { base64: string; mimeType: string } | null) => void;
  openScanModal: (initialImageBase64?: string | React.MouseEvent<HTMLElement>, mimeType?: string) => void;
  
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
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addWallet: (data: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWallet: (id: string, data: Partial<Wallet>) => void;
  deleteWallet: (id: string) => boolean;
  verifyWalletBalance: (id: string) => void;

  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleLockGoal: (id: string) => void;

  addDebt: (data: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>, options?: { disburseWalletId?: string }) => void;
  updateDebt: (id: string, data: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  payDebtInstallment: (debtId: string, amount: number, options?: { walletId?: string; date?: string; note?: string }) => void;
  settleDebt: (debtId: string, options?: { walletId?: string; date?: string; note?: string }) => void;

  updateBudgetConfig: (config: Partial<BudgetConfig>) => void;
  addBudgetSubcategory: (item: { name: string; group: BudgetGroup; allocatedAmount: number; emoji: string; dueDateDay?: number }) => void;
  updateBudgetSubcategory: (id: string, data: { name?: string; group?: BudgetGroup; allocatedAmount?: number; emoji?: string; dueDateDay?: number }) => void;
  deleteBudgetSubcategory: (id: string) => void;

  addSubscription: (item: Omit<RecurringItem, 'id'>) => void;
  updateSubscription: (id: string, data: Partial<RecurringItem>) => void;
  deleteSubscription: (id: string) => void;
  toggleSubscriptionActive: (id: string) => void;
  recordSubscriptionPayment: (id: string) => void;
  syncSubscriptionsToBudget: () => void;

  addAsset: (type: 'liquid' | 'fixed', item: Omit<AssetItem, 'id'>) => void;
  deleteAsset: (type: 'liquid' | 'fixed', id: string) => void;

  addInvestment: (item: Omit<InvestmentItem, 'id'>) => void;
  deleteInvestment: (id: string) => void;

  transferFunds: (fromWalletId: string, toWalletId: string, amount: number, note?: string, date?: string) => void;
  updateSettings: (data: Partial<AppSettings>) => void;
  toggleHideBalance: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (accent: AccentColor) => void;
  deductAiCredit: (amount?: number) => boolean;
  addAiCredits: (amount: number) => void;

  // Utilities
  toasts: ToastMessage[];
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  exportToCSV: () => void;
  resetAllAppData: () => void;

  // Auth & Multi-User Support
  user: (User & { isLocalAccount?: boolean }) | LocalAccountProfile | null;
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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTabState] = useState<TabType>('dashboard');
  const [previousTab, setPreviousTab] = useState<TabType>('dashboard');
  const [dataResetVersion, setDataResetVersion] = useState<number>(0);

  const setActiveTab = (tab: TabType) => {
    setPreviousTab(activeTab);
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    setActiveTabState(previousTab || 'dashboard');
  };

  // Core Data States (initialized with deterministic defaults for SSR parity, hydrated in useEffect)
  const [wallets, setWallets] = useState<Wallet[]>(DEFAULT_WALLETS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>(() => getInitialSampleTransactions());
  const [budgets, setBudgets] = useState<Budget[]>(() => getInitialBudgets());
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>(DEFAULT_BUDGET_CONFIG);
  const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);
  const [debts, setDebts] = useState<Debt[]>(DEFAULT_DEBTS);
  const [subscriptions, setSubscriptions] = useState<RecurringItem[]>([]);
  const [liquidAssets, setLiquidAssets] = useState<AssetItem[]>([]);
  const [fixedAssets, setFixedAssets] = useState<AssetItem[]>([]);
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

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

  const effectivePaydayDay = useMemo(() => {
    const raw = budgetConfig?.paydayDay || settings?.paydayDay || budgetConfig?.settings?.paydayDay || 1;
    return Math.max(1, Math.min(31, Math.round(Number(raw) || 1)));
  }, [budgetConfig?.paydayDay, settings?.paydayDay, budgetConfig?.settings?.paydayDay]);

  const budgetPeriod = useMemo<BudgetPeriodInfo>(() => {
    return getBudgetPeriodInfo(activeYear, activeMonth, activeDay, effectivePaydayDay);
  }, [activeYear, activeMonth, activeDay, effectivePaydayDay]);

  const goToPrevPeriod = () => {
    const prevDateStr = getAdjacentPeriodDateStr(
      activeYear,
      activeMonth,
      activeDay,
      effectivePaydayDay,
      -1
    );
    setActiveDate(prevDateStr);
  };

  const goToNextPeriod = () => {
    const nextDateStr = getAdjacentPeriodDateStr(
      activeYear,
      activeMonth,
      activeDay,
      effectivePaydayDay,
      1
    );
    setActiveDate(nextDateStr);
  };

  const goToCurrentPeriod = () => {
    setActiveDate(getTodayDateStr());
  };

  // Modals & dialog states
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionDetail | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanInitialImage, setScanInitialImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [selectedGoalDetail, setSelectedGoalDetail] = useState<Goal | null>(null);
  const [isEditBudgetCategoryModalOpen, setIsEditBudgetCategoryModalOpen] = useState(false);
  const [isAddSubcategoryModalOpen, setIsAddSubcategoryModalOpen] = useState(false);
  const [editingSubcategoryGroup, setEditingSubcategoryGroup] = useState<BudgetGroup>('kebutuhan');

  // Auth & Multi-User State
  const [user, setUser] = useState<(User & { isLocalAccount?: boolean }) | LocalAccountProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const openLoginModal = () => setIsLoginModalOpen(true);

  const isCloudUser = Boolean(user?.uid);
  const localScopeUid = user?.uid || undefined;

  // Security / App Lock & Toasts
  const [isLocked, setIsLocked] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
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
    saveStoredBudgetConfig(fullCfg, uid);
    saveUserBudgetConfig(uid, fullCfg).catch((err) =>
      console.warn('Error saving extended budget config to Firestore:', err)
    );
    if (mirrorUid) {
      saveStoredBudgetConfig(fullCfg, mirrorUid);
      saveUserBudgetConfig(mirrorUid, fullCfg).catch(() => {});
    }
  };

  const recordDeletedId = (ids: string | (string | undefined)[], currentDeleted = deletedIds): string[] => {
    const idList = (Array.isArray(ids) ? ids : [ids]).filter((x): x is string => Boolean(x));
    const next = Array.from(new Set([...currentDeleted, ...idList])).slice(-400);
    setDeletedIds(next);
    if (localScopeUid) {
      saveStoredDeletedIds(next, localScopeUid);
    }
    return next;
  };

  // Reconcile subscriptions across Cloud Firestore (/subscriptions), budgetConfig.subscriptions, localStorage, and budgetConfig.subcategories
  const reconcileAndSyncSubscriptions = async (
    uid: string,
    cloudSubs: RecurringItem[],
    localSubs: RecurringItem[],
    budget: BudgetConfig,
    activeWallets: Wallet[],
    deletedSet: Set<string>,
    mirrorUid?: string,
    isBackgroundSync = false
  ): Promise<RecurringItem[]> => {
    const cloudIds = new Set(cloudSubs.map((s) => s.id));
    const embeddedSubs = Array.isArray(budget.subscriptions) ? budget.subscriptions : [];

    // 1. Merge cloudSubs + embeddedSubs + localSubs (excluding deletedSet, preferring newer updatedAt)
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
    for (const localItem of localSubs) addOrUpdateRec(localItem);

    const subcats = (budget.subcategories || []).filter(
      (s) => !deletedSet.has(s.id) && !(s.subscriptionId && deletedSet.has(s.subscriptionId))
    );

    // 2. Filter out orphaned expense subscriptions whose subcategory was deleted from budgetConfig
    const validSubs: RecurringItem[] = [];
    for (const rec of mergedMap.values()) {
      if (rec.type !== 'expense') {
        validSubs.push(rec);
        continue;
      }
      if (subcats.length === 0) {
        if (!rec.subcategoryId) {
          validSubs.push(rec);
        } else if (cloudIds.has(rec.id)) {
          deleteUserSubscription(uid, rec.id).catch(() => {});
          if (mirrorUid) deleteUserSubscription(mirrorUid, rec.id).catch(() => {});
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
          lastRecordedPeriod: matchedSub.lastRecordedPeriod || rec.lastRecordedPeriod,
        });
      } else if (cloudIds.has(rec.id)) {
        deleteUserSubscription(uid, rec.id).catch(() => {});
        if (mirrorUid) deleteUserSubscription(mirrorUid, rec.id).catch(() => {});
      }
    }

    // 3. Reconstruct any missing expense subscription from budgetConfig.subcategories
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

        const reconstructed: RecurringItem = {
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
        };
        validSubs.push(reconstructed);
      }
    }

    // 4. Persist reconciled subscriptions to localStorage (and to Cloud only when not in a passive background pull)
    saveStoredSubscriptions(validSubs, uid);
    if (mirrorUid) {
      saveStoredSubscriptions(validSubs, mirrorUid);
    }
    if (!isBackgroundSync) {
      for (const item of validSubs) {
        if (!cloudIds.has(item.id)) {
          saveUserSubscription(uid, item).catch(() => {});
        }
        if (mirrorUid) {
          saveUserSubscription(mirrorUid, item).catch(() => {});
        }
      }
    }

    return validSubs;
  };

  // Unified Cloud + Local Bi-Directional Sync Engine (works across HP, Laptop, Tablet, and different Chrome browsers)
  const syncAllAccountDataWithCloud = async (
    primaryUid: string,
    email: string,
    displayName: string,
    isNewRegistration = false,
    mirrorUid?: string,
    isBackgroundSync = false
  ) => {
    const syncStartTime = Date.now();
    const legacyUid = email ? `user_${email.replace(/[^a-z0-9]/g, '_')}` : undefined;

    // Fetch primary UID collections independently so a single network hiccup never fails the others
    const [
      loadedWallets,
      loadedTx,
      loadedGoals,
      loadedBudget,
      loadedDebts,
      loadedSubs,
    ] = await Promise.all([
      fetchUserWallets(primaryUid, false).catch(() => [] as Wallet[]),
      fetchUserTransactions(primaryUid).catch(() => [] as Transaction[]),
      fetchUserGoals(primaryUid).catch(() => [] as Goal[]),
      fetchUserBudgetConfig(primaryUid, false).catch(() => null),
      fetchUserDebts(primaryUid).catch(() => [] as Debt[]),
      fetchUserSubscriptions(primaryUid).catch(() => [] as RecurringItem[]),
    ]);

    // Also fetch secondary/mirror UID if user ever logged in via a different method (e.g. Google vs Email)
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
        fetchUserWallets(mirrorUid, false).catch(() => [] as Wallet[]),
        fetchUserTransactions(mirrorUid).catch(() => [] as Transaction[]),
        fetchUserGoals(mirrorUid).catch(() => [] as Goal[]),
        fetchUserBudgetConfig(mirrorUid, false).catch(() => null),
        fetchUserDebts(mirrorUid).catch(() => [] as Debt[]),
        fetchUserSubscriptions(mirrorUid).catch(() => [] as RecurringItem[]),
      ]);
    }

    // Abort applying fetched state if the user performed a local write while this network fetch was in flight
    if (lastLocalMutationRef.current >= syncStartTime) {
      return;
    }

    // Pick the newest Cloud BudgetConfig snapshot between primaryUid and mirrorUid
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

    const localBudget = isNewRegistration ? EMPTY_BUDGET_CONFIG : loadStoredBudgetConfig(primaryUid);
    const localUpdatedAt = localBudget?.updatedAt || '';

    // Check if THIS browser tab performed a local write very recently (< 8 seconds ago)
    const hasRecentLocalWrite =
      !isNewRegistration &&
      !isBackgroundSync &&
      lastLocalMutationRef.current > 0 &&
      Date.now() - lastLocalMutationRef.current < 8000;

    // Cloud is authoritative whenever the user has an existing Cloud snapshot and this tab hasn't just mutated data
    const cloudHasSnapshot = Boolean(
      effectiveCloudBudget ||
        loadedTx.length > 0 ||
        loadedWallets.length > 0 ||
        loadedGoals.length > 0 ||
        loadedDebts.length > 0 ||
        loadedSubs.length > 0
    );
    const preferCloudAuthority = Boolean(
      isBackgroundSync ||
        (cloudHasSnapshot &&
          (!hasRecentLocalWrite ||
            !localUpdatedAt ||
            (cloudUpdatedAt && cloudUpdatedAt >= localUpdatedAt)))
    );

    // Helper: only allow a local-only item (missing from Cloud) to survive & upload if it was literally just created on THIS device (< 8s ago)
    // Otherwise, if Cloud already has a snapshot and an item is missing from Cloud, it was deleted on another device (e.g. HP) and must NOT resurrect.
    const canKeepLocalOnlyItem = (itemUpdatedAt?: string, itemCreatedAt?: string): boolean => {
      if (!cloudHasSnapshot) return true;
      if (isBackgroundSync || !hasRecentLocalWrite) return false;
      const itemTs = itemUpdatedAt || itemCreatedAt || '';
      if (!itemTs) return false;
      const ageMs = Date.now() - new Date(itemTs).getTime();
      return ageMs >= 0 && ageMs < 8000;
    };

    // 1. Deleted IDs reconciliation
    const localDeleted = loadStoredDeletedIds(primaryUid);
    const mirrorDeleted = mirrorUid ? loadStoredDeletedIds(mirrorUid) : [];
    const cloudDeleted = [
      ...(loadedBudget?.deletedIds || []),
      ...(mirrorBudget?.deletedIds || []),
    ];
    const combinedDeleted = isNewRegistration
      ? []
      : Array.from(new Set([...localDeleted, ...mirrorDeleted, ...cloudDeleted])).slice(-400);
    const deletedSet = new Set<string>(combinedDeleted);
    setDeletedIds(combinedDeleted);
    saveStoredDeletedIds(combinedDeleted, primaryUid);
    if (mirrorUid) saveStoredDeletedIds(combinedDeleted, mirrorUid);

    // 2. Transactions sync (strictly respecting Cloud deletions & Cloud authority on open tabs)
    const cloudTxMap = new Map<string, Transaction>();
    for (const t of [...(mirrorTx || []), ...(loadedTx || [])]) {
      if (!t?.id || deletedSet.has(t.id)) continue;
      const existing = cloudTxMap.get(t.id);
      if (!existing || (t.updatedAt || '') >= (existing.updatedAt || '')) {
        cloudTxMap.set(t.id, t);
      }
    }

    const localTx = isNewRegistration ? [] : loadStoredTransactions(primaryUid);
    const legacyTx = !isNewRegistration && legacyUid ? loadStoredTransactions(legacyUid) : [];
    const allLocalTx = [...legacyTx, ...localTx].filter((t) => t?.id && !deletedSet.has(t.id));

    const finalTxMap = new Map<string, Transaction>(cloudTxMap);
    const txToUpload: Transaction[] = [];

    for (const lTx of allLocalTx) {
      // Never upload initial guest sample transactions (tx-1..tx-20) to a cloud user account
      if (/^tx-\d+[a-z]?$/.test(lTx.id)) continue;
      const cTx = finalTxMap.get(lTx.id);
      if (!cTx) {
        if (canKeepLocalOnlyItem(lTx.updatedAt, lTx.createdAt)) {
          finalTxMap.set(lTx.id, lTx);
          txToUpload.push(lTx);
        }
      } else if (hasRecentLocalWrite && (lTx.updatedAt || '') > (cTx.updatedAt || '')) {
        finalTxMap.set(lTx.id, lTx);
        txToUpload.push(lTx);
      }
    }

    const finalTx = Array.from(finalTxMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setTransactions(finalTx);
    saveStoredTransactions(finalTx, primaryUid);
    if (mirrorUid) saveStoredTransactions(finalTx, mirrorUid);
    if (!isBackgroundSync) {
      for (const t of txToUpload) {
        saveUserTransaction(primaryUid, t).catch(() => {});
        if (mirrorUid) saveUserTransaction(mirrorUid, t).catch(() => {});
      }
    }

    // 3. Wallets sync & deduplication of untouched Rp 0 defaults
    const demoWalletIds = new Set([
      'wallet-bca',
      'wallet-mandiri',
      'wallet-gopay',
      'wallet-cash',
      'wallet-rdn',
      'wallet-cc',
      'wallet-paylater',
    ]);
    const cloudWalletMap = new Map<string, Wallet>();
    for (const w of [...(mirrorWallets || []), ...(loadedWallets || [])]) {
      if (!w?.id || deletedSet.has(w.id)) continue;
      const existing = cloudWalletMap.get(w.id);
      if (
        !existing ||
        (w.updatedAt || '') > (existing.updatedAt || '') ||
        ((w.updatedAt || '') === (existing.updatedAt || '') &&
          w.initialBalance !== 0 &&
          existing.initialBalance === 0)
      ) {
        cloudWalletMap.set(w.id, w);
      }
    }

    const localWallets = isNewRegistration ? [] : loadStoredWallets(primaryUid);
    const finalWalletMap = new Map<string, Wallet>(cloudWalletMap);
    const walletsToUpload: Wallet[] = [];

    for (const lW of localWallets) {
      if (!lW?.id || deletedSet.has(lW.id)) continue;
      if (demoWalletIds.has(lW.id)) continue;
      const cW = finalWalletMap.get(lW.id);
      if (!cW) {
        if ((cloudWalletMap.size > 0 || cloudHasSnapshot) && !canKeepLocalOnlyItem(lW.updatedAt, lW.createdAt)) {
          continue;
        }
        const isUntouchedDefault =
          lW.initialBalance === 0 &&
          (lW.name === 'Dompet Tunai' || lW.name === 'Rekening Bank' || lW.name === 'Dompet Utama');
        const cloudAlreadyHasSameName = Array.from(finalWalletMap.values()).some(
          (w) => w.name.toLowerCase().trim() === lW.name.toLowerCase().trim()
        );
        if (isUntouchedDefault && cloudAlreadyHasSameName) {
          continue;
        }
        finalWalletMap.set(lW.id, lW);
        walletsToUpload.push(lW);
      } else if (hasRecentLocalWrite && (lW.updatedAt || '') > (cW.updatedAt || '')) {
        finalWalletMap.set(lW.id, lW);
        walletsToUpload.push(lW);
      }
    }

    let finalWallets = Array.from(finalWalletMap.values());
    if (finalWallets.length === 0) {
      finalWallets = await fetchUserWallets(primaryUid, true).catch(() => loadStoredWallets(primaryUid));
    } else {
      // Deduplicate extra untouched Rp0 default wallets if another wallet with the same name exists
      const txWalletIds = new Set(finalTx.map((t) => t.walletId));
      const duplicateIdsToDelete: string[] = [];
      const deduplicated: Wallet[] = [];
      for (const w of finalWallets) {
        const isUntouchedDefault =
          w.initialBalance === 0 &&
          !txWalletIds.has(w.id) &&
          (w.name === 'Dompet Tunai' || w.name === 'Rekening Bank' || w.name === 'Dompet Utama');
        const hasOtherWithSameName = finalWallets.some(
          (other) =>
            other.id !== w.id &&
            other.name.toLowerCase().trim() === w.name.toLowerCase().trim() &&
            (other.initialBalance !== 0 ||
              txWalletIds.has(other.id) ||
              other.id === 'wallet-cash-main' ||
              other.id === 'wallet-bank-main')
        );
        if (
          isUntouchedDefault &&
          hasOtherWithSameName &&
          w.id !== 'wallet-cash-main' &&
          w.id !== 'wallet-bank-main'
        ) {
          duplicateIdsToDelete.push(w.id);
        } else {
          deduplicated.push(w);
        }
      }
      if (deduplicated.length > 0) {
        finalWallets = deduplicated;
      }
      if (!isBackgroundSync) {
        for (const dupId of duplicateIdsToDelete) {
          deleteUserWallet(primaryUid, dupId).catch(() => {});
        }
      }
    }

    setWallets(finalWallets);
    saveStoredWallets(finalWallets, primaryUid);
    if (mirrorUid) saveStoredWallets(finalWallets, mirrorUid);
    if (!isBackgroundSync) {
      for (const w of walletsToUpload) {
        saveUserWallet(primaryUid, w).catch(() => {});
        if (mirrorUid) saveUserWallet(mirrorUid, w).catch(() => {});
      }
    }

    // 4. Goals sync
    const cloudGoalMap = new Map<string, Goal>();
    for (const g of [...(mirrorGoals || []), ...(loadedGoals || [])]) {
      if (!g?.id || deletedSet.has(g.id)) continue;
      const existing = cloudGoalMap.get(g.id);
      if (!existing || (g.updatedAt || '') >= (existing.updatedAt || '')) {
        cloudGoalMap.set(g.id, g);
      }
    }
    const localGoals = isNewRegistration ? [] : loadStoredGoals(primaryUid);
    const goalsToUpload: Goal[] = [];
    for (const lG of localGoals) {
      if (!lG?.id || deletedSet.has(lG.id) || /^goal-[123]$/.test(lG.id)) continue;
      const cG = cloudGoalMap.get(lG.id);
      if (!cG) {
        if (canKeepLocalOnlyItem(lG.updatedAt, lG.createdAt)) {
          cloudGoalMap.set(lG.id, lG);
          goalsToUpload.push(lG);
        }
      } else if (hasRecentLocalWrite && (lG.updatedAt || '') > (cG.updatedAt || '')) {
        cloudGoalMap.set(lG.id, lG);
        goalsToUpload.push(lG);
      }
    }
    const finalGoals = Array.from(cloudGoalMap.values());
    setGoals(finalGoals);
    saveStoredGoals(finalGoals, primaryUid);
    if (mirrorUid) saveStoredGoals(finalGoals, mirrorUid);
    if (!isBackgroundSync) {
      for (const g of goalsToUpload) {
        saveUserGoal(primaryUid, g).catch(() => {});
        if (mirrorUid) saveUserGoal(mirrorUid, g).catch(() => {});
      }
    }

    // 5. Debts sync
    const cloudDebtMap = new Map<string, Debt>();
    for (const d of [...(mirrorDebts || []), ...(loadedDebts || [])]) {
      if (!d?.id || deletedSet.has(d.id)) continue;
      const existing = cloudDebtMap.get(d.id);
      if (!existing || (d.updatedAt || '') >= (existing.updatedAt || '')) {
        cloudDebtMap.set(d.id, d);
      }
    }
    const localDebts = isNewRegistration ? [] : loadStoredDebts(primaryUid);
    const debtsToUpload: Debt[] = [];
    for (const lD of localDebts) {
      if (!lD?.id || deletedSet.has(lD.id)) continue;
      const cD = cloudDebtMap.get(lD.id);
      if (!cD) {
        if (canKeepLocalOnlyItem(lD.updatedAt, lD.createdAt)) {
          cloudDebtMap.set(lD.id, lD);
          debtsToUpload.push(lD);
        }
      } else if (
        hasRecentLocalWrite &&
        ((lD.updatedAt || '') > (cD.updatedAt || '') ||
          (lD.payments?.length || 0) > (cD.payments?.length || 0))
      ) {
        cloudDebtMap.set(lD.id, lD);
        debtsToUpload.push(lD);
      }
    }
    const finalDebts = Array.from(cloudDebtMap.values());
    setDebts(finalDebts);
    saveStoredDebts(finalDebts, primaryUid);
    if (mirrorUid) saveStoredDebts(finalDebts, mirrorUid);
    if (!isBackgroundSync) {
      for (const d of debtsToUpload) {
        saveUserDebt(primaryUid, d).catch(() => {});
        if (mirrorUid) saveUserDebt(mirrorUid, d).catch(() => {});
      }
    }

    // 6. BudgetConfig & Subcategories sync (Cloud-authoritative when Cloud has snapshot and no recent local write)
    const localIsNewer =
      !isNewRegistration &&
      !isBackgroundSync &&
      hasRecentLocalWrite &&
      Boolean(localUpdatedAt && (!cloudUpdatedAt || localUpdatedAt > cloudUpdatedAt));

    const authoritativeBudgetSource =
      !localIsNewer && effectiveCloudBudget
        ? effectiveCloudBudget
        : localBudget.estimatedIncome > 0 || (localBudget.subcategories?.length || 0) > 0
        ? localBudget
        : effectiveCloudBudget || EMPTY_BUDGET_CONFIG;

    // Filter subcategories strictly from the authoritative source so deleted subcategories never resurrect from a stale device
    const subcatMap = new Map<string, BudgetConfig['subcategories'][number]>();
    const sourceSubcats = authoritativeBudgetSource.subcategories || [];
    for (const s of sourceSubcats) {
      if (!s?.id || deletedSet.has(s.id)) continue;
      if (s.subscriptionId && deletedSet.has(s.subscriptionId)) continue;
      if (/^sub-\d+$/.test(s.id) && Number(s.id.replace('sub-', '')) <= 20) continue;
      subcatMap.set(s.id, s);
    }

    // 7. Liquid Assets, Fixed Assets, Investments, Category Budgets, and Settings sync
    const pickAuthoritativeArray = <T extends { id: string }>(
      cloudArr?: T[],
      localArr?: T[]
    ): T[] => {
      // If Cloud has explicitly stored this array and Cloud is authoritative, use Cloud's exact array (no stale union!)
      if (!localIsNewer && cloudArr !== undefined) {
        return cloudArr.filter((item) => item?.id && !deletedSet.has(item.id));
      }
      const map = new Map<string, T>();
      for (const item of [...(cloudArr || []), ...(localArr || [])]) {
        if (!item?.id || deletedSet.has(item.id)) continue;
        map.set(item.id, item);
      }
      return Array.from(map.values());
    };

    const finalLiquidAssets = pickAuthoritativeArray<AssetItem>(
      effectiveCloudBudget?.liquidAssets ?? mirrorBudget?.liquidAssets,
      isNewRegistration ? [] : loadStoredAssets('liquid', primaryUid)
    );
    const finalFixedAssets = pickAuthoritativeArray<AssetItem>(
      effectiveCloudBudget?.fixedAssets ?? mirrorBudget?.fixedAssets,
      isNewRegistration ? [] : loadStoredAssets('fixed', primaryUid)
    );
    const finalInvestments = pickAuthoritativeArray<InvestmentItem>(
      effectiveCloudBudget?.investments ?? mirrorBudget?.investments,
      isNewRegistration
        ? []
        : loadStoredInvestments(primaryUid).filter((inv) => !/^inv-[123]$/.test(inv.id))
    );
    const finalCategoryBudgets = pickAuthoritativeArray<Budget>(
      effectiveCloudBudget?.categoryBudgets ?? mirrorBudget?.categoryBudgets,
      isNewRegistration
        ? []
        : loadStoredBudgets(primaryUid).filter((b) => b.id !== 'budget-total-current')
    );

    setLiquidAssets(finalLiquidAssets);
    saveStoredAssets('liquid', finalLiquidAssets, primaryUid);
    if (mirrorUid) saveStoredAssets('liquid', finalLiquidAssets, mirrorUid);

    setFixedAssets(finalFixedAssets);
    saveStoredAssets('fixed', finalFixedAssets, primaryUid);
    if (mirrorUid) saveStoredAssets('fixed', finalFixedAssets, mirrorUid);

    setInvestments(finalInvestments);
    saveStoredInvestments(finalInvestments, primaryUid);
    if (mirrorUid) saveStoredInvestments(finalInvestments, mirrorUid);

    setBudgets(finalCategoryBudgets);
    saveStoredBudgets(finalCategoryBudgets, primaryUid);
    if (mirrorUid) saveStoredBudgets(finalCategoryBudgets, mirrorUid);

    // Settings merge
    const cloudSettings = effectiveCloudBudget?.settings || mirrorBudget?.settings;
    const localSettings = loadStoredSettings(primaryUid);
    const mergedSettings: AppSettings = localIsNewer
      ? {
          ...(cloudSettings || {}),
          ...localSettings,
          userName: localSettings.userName || cloudSettings?.userName || displayName || '',
          userEmail: email || localSettings.userEmail || cloudSettings?.userEmail || '',
        }
      : {
          ...localSettings,
          ...(cloudSettings || {}),
          userName: cloudSettings?.userName || displayName || localSettings.userName || '',
          userEmail: email || cloudSettings?.userEmail || localSettings.userEmail || '',
        };
    const resolvedPaydayDay =
      authoritativeBudgetSource.paydayDay ||
      mergedSettings.paydayDay ||
      effectiveCloudBudget?.paydayDay ||
      localBudget?.paydayDay ||
      1;
    mergedSettings.paydayDay = resolvedPaydayDay;

    setSettings(mergedSettings);
    saveStoredSettings(mergedSettings, primaryUid);
    if (mirrorUid) saveStoredSettings(mergedSettings, mirrorUid);

    const finalBudget: BudgetConfig = {
      estimatedIncome: authoritativeBudgetSource.estimatedIncome,
      needsPercent: authoritativeBudgetSource.needsPercent,
      wantsPercent: authoritativeBudgetSource.wantsPercent,
      savingsPercent: authoritativeBudgetSource.savingsPercent,
      paydayDay: resolvedPaydayDay,
      subcategories: Array.from(subcatMap.values()),
    };

    // 8. Reconcile Subscriptions (only include local subscriptions if Cloud has no snapshot yet or local has recent write)
    const combinedCloudSubs = [...(mirrorSubs || []), ...(loadedSubs || [])];
    const cloudEmbeddedSubs = effectiveCloudBudget?.subscriptions ?? mirrorBudget?.subscriptions;

    const localRawSubs =
      isNewRegistration || preferCloudAuthority
        ? []
        : loadStoredSubscriptions(primaryUid);
    const legacyRawSubs =
      isNewRegistration || preferCloudAuthority || !legacyUid
        ? []
        : loadStoredSubscriptions(legacyUid);
    const mirrorLocalSubs =
      isNewRegistration || preferCloudAuthority || !mirrorUid
        ? []
        : loadStoredSubscriptions(mirrorUid);
    const combinedLocalSubs = [...legacyRawSubs, ...mirrorLocalSubs, ...localRawSubs];

    const reconciledSubs = await reconcileAndSyncSubscriptions(
      primaryUid,
      combinedCloudSubs,
      combinedLocalSubs,
      {
        ...finalBudget,
        subscriptions: cloudEmbeddedSubs,
      },
      finalWallets,
      deletedSet,
      mirrorUid,
      isBackgroundSync || preferCloudAuthority
    );
    setSubscriptions(reconciledSubs);

    const completeBudgetToSave: BudgetConfig = {
      ...finalBudget,
      subscriptions: reconciledSubs,
      liquidAssets: finalLiquidAssets,
      fixedAssets: finalFixedAssets,
      investments: finalInvestments,
      categoryBudgets: finalCategoryBudgets,
      settings: mergedSettings,
      deletedIds: combinedDeleted,
      updatedAt: cloudUpdatedAt || new Date().toISOString(),
    };
    setBudgetConfig(completeBudgetToSave);
    saveStoredBudgetConfig(completeBudgetToSave, primaryUid);
    if (mirrorUid) saveStoredBudgetConfig(completeBudgetToSave, mirrorUid);

    // Only write back to Cloud on initial login/migration, NEVER during passive background/focus pulls!
    if (!isBackgroundSync && (!cloudHasSnapshot || localIsNewer)) {
      saveUserBudgetConfig(primaryUid, completeBudgetToSave).catch(() => {});
      if (mirrorUid) {
        saveUserBudgetConfig(mirrorUid, completeBudgetToSave).catch(() => {});
      }
    }
  };

  // Load and sync an Email/Password account session with Cloud Firestore Database
  const loadAndSyncCloudAccountSession = async (
    profile: LocalAccountProfile,
    isNewRegistration = false,
    silentToast = false,
    isBackgroundSync = false
  ) => {
    const cloudUid = getCloudAccountUid(profile.email);
    const normalizedProfile: LocalAccountProfile = {
      ...profile,
      uid: cloudUid,
      isLocalAccount: false,
    };

    isCloudSyncingRef.current = true;
    if (!isBackgroundSync) {
      saveActiveLocalUser(normalizedProfile);
      setUser(normalizedProfile);
      setActiveDate(getTodayDateStr());
    }

    try {
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
        console.warn('Fallback to cached account data while syncing Firestore:', err);
        const fallbackWallets = loadStoredWallets(cloudUid);
        setWallets(fallbackWallets);
        setTransactions(loadStoredTransactions(cloudUid));
        setGoals(loadStoredGoals(cloudUid));
        setDebts(loadStoredDebts(cloudUid));
        setLiquidAssets(loadStoredAssets('liquid', cloudUid));
        setFixedAssets(loadStoredAssets('fixed', cloudUid));
        setInvestments(loadStoredInvestments(cloudUid));
        const localBudget = loadStoredBudgetConfig(cloudUid);
        setBudgetConfig(localBudget);
        const rawSubs = loadStoredSubscriptions(cloudUid);
        const deletedSet = new Set(loadStoredDeletedIds(cloudUid));
        const reconciledSubs = await reconcileAndSyncSubscriptions(
          cloudUid,
          [],
          rawSubs,
          localBudget,
          fallbackWallets,
          deletedSet,
          undefined,
          true
        );
        setSubscriptions(reconciledSubs);
      }
    } finally {
      isCloudSyncingRef.current = false;
    }

    if (!silentToast) {
      setDataResetVersion((v) => v + 1);
      addToast(
        isNewRegistration ? 'Pendaftaran Berhasil' : 'Login Berhasil',
        `Selamat datang, ${normalizedProfile.displayName}! Semua data Anda tersinkronisasi di Cloud DB.`,
        'success'
      );
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

    // 1. Save account credentials directly to Cloud Firestore Database
    try {
      const cloudRes = await registerCloudEmailAccount(cloudUid, cleanName, cleanEmail, passwordHash);
      if (!cloudRes.ok) {
        return { ok: false, error: cloudRes.error };
      }

      const now = new Date().toISOString();
      const record = {
        uid: cloudUid,
        displayName: cleanName,
        email: cleanEmail,
        passwordHash,
        photoURL: null,
        isLocalAccount: false,
        createdAt: cloudRes.profile.createdAt || now,
      };
      cacheRegisteredAccountLocally(record);
      resetStorageToZero(cloudUid);

      await loadAndSyncCloudAccountSession(
        {
          uid: cloudUid,
          displayName: cleanName,
          email: cleanEmail,
          photoURL: null,
          isLocalAccount: false,
          createdAt: record.createdAt,
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
        const profile: LocalAccountProfile = {
          uid: cloudUid,
          displayName: cloudRes.profile.displayName || 'Pengguna Dompt',
          email: cloudRes.profile.email || cleanEmail,
          photoURL: cloudRes.profile.photoURL || null,
          isLocalAccount: false,
          createdAt: cloudRes.profile.createdAt || new Date().toISOString(),
        };
        cacheRegisteredAccountLocally({
          ...profile,
          passwordHash,
        });
        await loadAndSyncCloudAccountSession(profile, false);
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
          passwordHash
        );
      } catch (e) {
        console.warn('Failed to upload local account to Cloud DB:', e);
      }
      await loadAndSyncCloudAccountSession(localRes.profile, false);
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

  // Sign In with Google
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        saveActiveLocalUser(null);
        addToast(
          'Login Berhasil',
          `Selamat datang, ${result.user.displayName || 'Pengguna'}! Akun Anda aktif.`,
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
      setActiveTabState('dashboard');
      setDataResetVersion((v) => v + 1);
      addToast('Berhasil Keluar', 'Anda telah keluar dari akun.', 'info');
    } catch (err: any) {
      console.error('Sign out error:', err);
      addToast('Gagal Keluar', 'Terjadi kesalahan saat logout.', 'error');
      throw err;
    }
  };

  // Hydrate local storage data on client mount & migrate any local PC accounts to Cloud Firestore
  useEffect(() => {
    queueMicrotask(async () => {
      const activeLocal = loadActiveLocalUser();
      const scope = activeLocal ? getCloudAccountUid(activeLocal.email) : undefined;
      const storedSettings = loadStoredSettings(scope);
      if (activeLocal) {
        isCloudSyncingRef.current = true;
        const normalizedLocal: LocalAccountProfile = {
          ...activeLocal,
          uid: scope || activeLocal.uid,
          isLocalAccount: false,
        };
        setUser(normalizedLocal);
      }
      setWallets(loadStoredWallets(scope));
      setCategories(loadStoredCategories());
      setTransactions(loadStoredTransactions(scope));
      setBudgets(loadStoredBudgets(scope));
      const initialBudget = loadStoredBudgetConfig(scope);
      setBudgetConfig(initialBudget);
      setGoals(loadStoredGoals(scope));
      setDebts(loadStoredDebts(scope));
      setLiquidAssets(loadStoredAssets('liquid', scope));
      setFixedAssets(loadStoredAssets('fixed', scope));
      setInvestments(loadStoredInvestments(scope));
      setDeletedIds(loadStoredDeletedIds(scope));
      const initialRawSubs = loadStoredSubscriptions(scope);
      setSubscriptions(initialRawSubs);
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

      // Automatically sync any previously registered local accounts on this PC to Cloud Firestore DB
      const registeredList = loadRegisteredAccounts();
      for (const acc of registeredList) {
        if (acc.email && acc.passwordHash) {
          const cUid = getCloudAccountUid(acc.email);
          registerCloudEmailAccount(cUid, acc.displayName, acc.email, acc.passwordHash).catch(
            () => {}
          );
        }
      }

      if (activeLocal?.email) {
        await loadAndSyncCloudAccountSession(activeLocal, false, true);
      }
    });
  }, []);

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
          setUser({
            ...activeLocal,
            uid: getCloudAccountUid(activeLocal.email),
            isLocalAccount: false,
          });
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

  // Calculate wallet balances
  const walletsWithBalance = useMemo<WalletWithBalance[]>(() => {
    return wallets.map((wallet) => {
      let balance = wallet.initialBalance;
      let expenseThisMonth = 0;
      let incomeThisMonth = 0;
      let txCount = 0;

      transactions.forEach((tx) => {
        const effectiveWalletId = resolvedWalletIdMap.get(tx.id) || tx.walletId;
        const txDate = parseLocalDay(tx.date);
        const isThisMonth = isDateInBudgetPeriod(txDate, budgetPeriod);

        if (effectiveWalletId === wallet.id) {
          txCount++;
          if (tx.type === 'expense') {
            balance -= tx.amount;
            if (isThisMonth) expenseThisMonth += tx.amount;
          } else if (tx.type === 'income') {
            balance += tx.amount;
            if (isThisMonth) incomeThisMonth += tx.amount;
          } else if (tx.type === 'transfer') {
            balance -= tx.amount;
          }
        }

        if (tx.type === 'transfer' && tx.transferWalletId === wallet.id) {
          txCount++;
          balance += tx.amount;
        }
      });

      const goalsReserved = goals
        .filter((g) => g.walletId === wallet.id && g.currentAmount > 0)
        .reduce((acc, g) => acc + g.currentAmount, 0);
      const reserved = goalsReserved > 0 ? goalsReserved : wallet.reservedAmount || 0;
      const available = balance - reserved;

      return {
        ...wallet,
        reservedAmount: reserved,
        balance,
        expenseThisMonth,
        incomeThisMonth,
        transactionCount: txCount,
        availableBalance: available,
      };
    });
  }, [wallets, transactions, goals, budgetPeriod, resolvedWalletIdMap]);

  // Total balance
  const totalBalance = useMemo(() => {
    return walletsWithBalance.reduce((acc, w) => acc + w.balance, 0);
  }, [walletsWithBalance]);

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

    transactions.forEach((tx) => {
      txIdSet.add(tx.id);
      const txDate = parseLocalDay(tx.date);
      if (isDateInBudgetPeriod(txDate, budgetPeriod)) {
        if (tx.type === 'income') inc += tx.amount;
        if (tx.type === 'expense') exp += tx.amount;
      }
      if (
        txDate.getFullYear() === activeYear &&
        txDate.getMonth() === activeMonth &&
        txDate.getDate() === activeDay
      ) {
        if (tx.type === 'income') todayInc += tx.amount;
        if (tx.type === 'expense') todayExp += tx.amount;
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
          pd.getFullYear() === activeYear &&
          pd.getMonth() === activeMonth &&
          pd.getDate() === activeDay
        ) {
          todayExp += p.amount;
        }
      });
    });

    return { totalIncome: inc, totalExpense: exp, todayIncome: todayInc, todayExpense: todayExp };
  }, [transactions, debts, budgetPeriod, activeYear, activeMonth, activeDay]);

  // Dynamic upcoming bills derived from negative credit/paylater wallets, active subscriptions, and scheduled budget subcategories
  const upcomingBills = useMemo<UpcomingBill[]>(() => {
    const bills: UpcomingBill[] = [];
    const seenNames = new Set<string>();
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const curMonthShort = shortMonths[activeMonth] || 'Jan';
    const nextMonthShort = shortMonths[(activeMonth + 1) % 12] || 'Feb';
    const currentCalendarKey = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`;
    const activePeriodKey = budgetPeriod.periodKey;

    const periodExpenseNotes = transactions
      .filter((tx) => tx.type === 'expense' && isDateInBudgetPeriod(tx.date, budgetPeriod))
      .map((tx) => (tx.note || '').toLowerCase().trim());

    walletsWithBalance.forEach((w) => {
      if ((w.type === 'credit' || w.type === 'paylater') && w.balance < 0) {
        const dueDay = w.type === 'credit' ? 10 : 14;
        const mLabel = activeDay > dueDay ? nextMonthShort : curMonthShort;
        seenNames.add(w.name.toLowerCase().trim());
        bills.push({
          id: `bill-wallet-${w.id}`,
          name: w.name,
          dueDate: `${dueDay} ${mLabel}`,
          amount: Math.abs(w.balance),
          iconEmoji: w.type === 'credit' ? '💳' : '⏰',
          category: w.type === 'credit' ? 'Kartu Kredit' : 'Paylater',
        });
      }
    });

    subscriptions.forEach((item) => {
      if (!item.isActive || item.type !== 'expense') return;
      const cleanName = item.name.toLowerCase().trim();
      const alreadyPaidInPeriod =
        item.lastRecordedPeriod === activePeriodKey ||
        item.lastRecordedPeriod === currentCalendarKey ||
        (cleanName.length >= 2 && periodExpenseNotes.some((n) => n.includes(cleanName)));
      if (alreadyPaidInPeriod) {
        seenNames.add(cleanName);
        return;
      }
      const mLabel = activeDay > item.billingDay ? nextMonthShort : curMonthShort;
      seenNames.add(cleanName);
      bills.push({
        id: `bill-rec-${item.id}`,
        name: item.name,
        dueDate: `${String(item.billingDay).padStart(2, '0')} ${mLabel}`,
        amount: item.amount,
        iconEmoji: item.emoji || '🔁',
        category: (item.budgetGroup || 'KEBUTUHAN').toUpperCase(),
      });
    });

    if (budgetConfig?.subcategories) {
      budgetConfig.subcategories.forEach((sub) => {
        if (sub.dueDateDay && sub.allocatedAmount > 0 && sub.isSubscriptionActive !== false) {
          const cleanName = sub.name.toLowerCase().trim();
          if (seenNames.has(cleanName)) return;
          const alreadyPaidSub =
            sub.lastRecordedPeriod === activePeriodKey ||
            sub.lastRecordedPeriod === currentCalendarKey ||
            (cleanName.length >= 2 && periodExpenseNotes.some((n) => n.includes(cleanName)));
          if (alreadyPaidSub) return;
          seenNames.add(cleanName);
          const mLabel = activeDay > sub.dueDateDay ? nextMonthShort : curMonthShort;
          bills.push({
            id: `bill-sub-${sub.id}`,
            name: sub.name,
            dueDate: `${String(sub.dueDateDay).padStart(2, '0')} ${mLabel}`,
            amount: sub.allocatedAmount,
            iconEmoji: sub.emoji || '📅',
            category: sub.group.toUpperCase(),
          });
        }
      });
    }
    return bills;
  }, [walletsWithBalance, subscriptions, budgetConfig, transactions, budgetPeriod, activeYear, activeMonth, activeDay]);

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
    });

    // Liquid assets: Bank + E-wallet + Cash + Savings wallets + extra liquidAssets from AssetsTab
    const walletLiquidTotal = walletsWithBalance
      .filter((w) => w.type === 'bank' || w.type === 'ewallet' || w.type === 'cash' || w.type === 'savings')
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
    const estIncome = typeof budgetConfig?.estimatedIncome === 'number' ? budgetConfig.estimatedIncome : 0;

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
      dailyBudgetRemaining: breakdown.dailyBudgetRemaining,
      todayIncome,
      todayExpense,
      emergencyFundRunwayMonths: runwayMonths,
      liquidAssetsTotal: liquidTotal,
      // Pos Anggaran Terpisah: Tagihan Bulanan (Fixed) vs Pengeluaran Harian (Variable)
      monthlyFixedBudget: breakdown.monthlyFixedBudget,
      monthlyVariableBudget: breakdown.monthlyVariableBudget,
      monthlyFixedExpense: breakdown.monthlyFixedExpense,
      monthlyVariableExpense: breakdown.monthlyVariableExpense,
      todayVariableExpense: breakdown.todayVariableExpense,
      todayFixedExpense: breakdown.todayFixedExpense,
      dailyOverbudget: breakdown.dailyOverbudget,
      dailyOverbudgetAmount: breakdown.dailyOverbudgetAmount,
      paydayDay: breakdown.paydayDay,
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
    walletsWithBalance,
    liquidAssets,
    totalBalance,
    totalIncome,
    totalExpense,
    todayIncome,
    todayExpense,
    wallets.length,
    transactionDetails,
  ]);

  // CRUD: Transaction
  const addTransaction = (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): string => {
    markLocalMutation();
    const now = new Date().toISOString();
    const generatedId = data.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTx: Transaction = {
      ...data,
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

    if (isCloudUser && user?.uid) {
      saveUserTransaction(user.uid, newTx).catch((err) =>
        console.warn('Error saving transaction to Firestore:', err)
      );
      if (mirrorUid) {
        saveUserTransaction(mirrorUid, newTx).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid);
    }

    addToast('Transaksi Ditambahkan', `${data.note || 'Transaksi baru'} berhasil dicatat.`);
    return generatedId;
  };

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    let targetTx: Transaction | undefined;
    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          targetTx = { ...t, ...data, updatedAt: now };
          return targetTx;
        }
        return t;
      });
      saveStoredTransactions(updated, localScopeUid);
      if (mirrorUid) saveStoredTransactions(updated, mirrorUid);
      return updated;
    });

    if (isCloudUser && user?.uid && targetTx) {
      saveUserTransaction(user.uid, targetTx).catch((err) =>
        console.warn('Error updating transaction in Firestore:', err)
      );
      if (mirrorUid) {
        saveUserTransaction(mirrorUid, targetTx).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid);
    }

    addToast('Transaksi Diperbarui', 'Perubahan transaksi berhasil disimpan.');
  };

  const deleteTransaction = (id: string) => {
    markLocalMutation();
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

    if (affectedDebt) {
      setDebts(updatedDebts);
      saveStoredDebts(updatedDebts, localScopeUid);
      if (mirrorUid) saveStoredDebts(updatedDebts, mirrorUid);
      if (isCloudUser && user?.uid) {
        saveUserDebt(user.uid, affectedDebt).catch(() => {});
        if (mirrorUid) saveUserDebt(mirrorUid, affectedDebt).catch(() => {});
      }
    }

    if (isCloudUser && user?.uid) {
      deleteUserTransaction(user.uid, id).catch((err) =>
        console.warn('Error deleting transaction from Firestore:', err)
      );
      if (mirrorUid) {
        deleteUserTransaction(mirrorUid, id).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid, { deletedIds: nextDeleted });
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
    let targetW: Wallet | undefined;
    const updated = wallets.map((w) => {
      if (w.id === id) {
        targetW = { ...w, ...data, updatedAt: now };
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
  ) => {
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
    if (isCloudUser && user?.uid) {
      saveUserDebt(user.uid, newDebt).catch((err) =>
        console.warn('Error saving debt to Firestore:', err)
      );
      if (mirrorUid) {
        saveUserDebt(mirrorUid, newDebt).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid);
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

    addToast(
      newDebt.type === 'payable' ? 'Utang Berhasil Dicatat' : 'Piutang Berhasil Dicatat',
      `${newDebt.name} sebesar ${formatRupiah(newDebt.totalAmount)} telah disimpan.`
    );
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
    if (isCloudUser && user?.uid && itemToSync) {
      saveUserDebt(user.uid, itemToSync).catch((err) =>
        console.warn('Error updating debt in Firestore:', err)
      );
      if (mirrorUid) {
        saveUserDebt(mirrorUid, itemToSync).catch(() => {});
      }
      persistExtendedBudgetToCloud(user.uid, mirrorUid);
    }
    addToast('Perubahan Disimpan', 'Data utang/piutang berhasil diperbarui.');
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
  ) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt || amount <= 0) return;

    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const paymentDate = options?.date || new Date().toISOString().slice(0, 10);
    const selectedWallet =
      (options?.walletId ? wallets.find((w) => w.id === options.walletId) : undefined) ||
      wallets[0];

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
        effectivePaydayDay
      );
      const totalPaidInMonth = allPayments.reduce((sum, p) => {
        const d = parseLocalDay(p.date);
        if (isDateInBudgetPeriod(d, payPeriod)) {
          return sum + p.amount;
        }
        return sum;
      }, 0);

      const debtSubId = `sub-debt-${debt.id}`;
      const subDisplayName = `Cicilan ${debt.name}`;
      const cleanDebtName = debt.name.toLowerCase().trim();

      let updatedSubcategories = [...(budgetConfig.subcategories || [])];
      const existingSub = updatedSubcategories.find((s) => {
        const sLower = s.name.toLowerCase().trim();
        return (
          s.id === debtSubId ||
          sLower === subDisplayName.toLowerCase() ||
          sLower === cleanDebtName
        );
      });

      if (existingSub) {
        updatedSubcategories = updatedSubcategories.map((s) =>
          s.id === existingSub.id
            ? {
                ...s,
                allocatedAmount: Math.max(s.allocatedAmount, totalPaidInMonth),
              }
            : s
        );
      } else {
        updatedSubcategories.push({
          id: debtSubId,
          name: subDisplayName,
          group: 'kebutuhan',
          allocatedAmount: totalPaidInMonth,
          emoji: '💳',
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
  };

  const settleDebt = (
    debtId: string,
    options?: { walletId?: string; date?: string; note?: string }
  ) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;
    payDebtInstallment(debtId, debt.remainingAmount, {
      walletId: options?.walletId,
      date: options?.date,
      note: options?.note || 'Pelunasan Penuh',
    });
  };

  // CRUD: BudgetConfig
  const updateBudgetConfig = (data: Partial<BudgetConfig>) => {
    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const nextPayday =
      data.paydayDay !== undefined
        ? Math.max(1, Math.min(31, Math.round(Number(data.paydayDay) || 1)))
        : budgetConfig.paydayDay || settings.paydayDay || 1;
    const nextSettings: AppSettings =
      data.paydayDay !== undefined
        ? { ...settings, paydayDay: nextPayday }
        : settings;
    if (data.paydayDay !== undefined) {
      setSettings(nextSettings);
      saveStoredSettings(nextSettings, localScopeUid);
      if (mirrorUid) saveStoredSettings(nextSettings, mirrorUid);
    }
    const updated: BudgetConfig = {
      ...budgetConfig,
      ...data,
      paydayDay: nextPayday,
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
    if (data.paydayDay !== undefined && Object.keys(data).length === 1) {
      addToast(
        'Periode Gajian Diperbarui',
        nextPayday === 1
          ? 'Periode budget diatur ke siklus kalender bulanan (Tgl 1 s/d akhir bulan).'
          : `Periode budget diatur mulai Tanggal ${nextPayday} hingga Tanggal ${nextPayday} bulan berikutnya.`
      );
    } else {
      addToast('Alokasi Disimpan', 'Pengaturan anggaran berhasil diperbarui.');
    }
  };

  const addBudgetSubcategory = (item: { name: string; group: BudgetGroup; allocatedAmount: number; emoji: string; dueDateDay?: number }) => {
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
    data: { name?: string; group?: BudgetGroup; allocatedAmount?: number; emoji?: string; dueDateDay?: number }
  ) => {
    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    let targetSubName = '';
    const updatedSub = budgetConfig.subcategories.map((s) => {
      if (s.id === id) {
        targetSubName = s.name.toLowerCase().trim();
        return { ...s, ...data };
      }
      return s;
    });
    const updated: BudgetConfig = {
      ...budgetConfig,
      subcategories: updatedSub,
      updatedAt: now,
    };

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

  const recordSubscriptionPayment = (id: string) => {
    const item = subscriptions.find((i) => i.id === id);
    if (!item) return;

    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const currentPeriodKey = budgetPeriod.periodKey;
    const dateStr = new Date(activeYear, activeMonth, activeDay, 9, 0, 0).toISOString();

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

    const updatedItem: RecurringItem = {
      ...item,
      lastRecordedPeriod: currentPeriodKey,
      updatedAt: now,
    };
    const nextSubs = subscriptions.map((i) => (i.id === item.id ? updatedItem : i));
    setSubscriptions(nextSubs);
    saveStoredSubscriptions(nextSubs, localScopeUid);
    if (mirrorUid) saveStoredSubscriptions(nextSubs, mirrorUid);

    const updatedSubcategories = (budgetConfig.subcategories || []).map((s) =>
      matchedSub && s.id === matchedSub.id
        ? { ...s, lastRecordedPeriod: currentPeriodKey }
        : s
    );
    const nextBudgetConfig: BudgetConfig = {
      ...budgetConfig,
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

    addTransaction({
      walletId: item.walletId || wallets[0]?.id || 'wallet-bca',
      categoryId: item.categoryId || (matchedSub ? matchedSub.id.replace('sub-', 'cat-') : 'cat-tagihan'),
      budgetGroup: item.type === 'expense' ? determinedBudgetGroup : undefined,
      expenseNature: item.type === 'expense' ? 'fixed' : undefined,
      type: item.type,
      amount: item.amount,
      note: `${item.name} (Otomatis Rutin)`,
      date: dateStr,
    });

    addToast(
      'Pembayaran Dicatat',
      item.type === 'expense'
        ? `${item.name} masuk ke Pos Tagihan Bulanan (${determinedBudgetGroup.toUpperCase()}) tanpa memotong Budget Harian.`
        : `${item.name} berhasil dicatat sebagai pemasukan rutin.`,
      'success'
    );
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
  ) => {
    markLocalMutation();
    const now = new Date().toISOString();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const fromW = wallets.find((w) => w.id === fromWalletId);
    const toW = wallets.find((w) => w.id === toWalletId);

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
  };

  // Settings
  const updateSettings = (data: Partial<AppSettings>, silent = false) => {
    markLocalMutation();
    const mirrorUid = getMirrorUid(user?.uid, user?.email);
    const updated = { ...settings, ...data };
    setSettings(updated);
    saveStoredSettings(updated, localScopeUid);
    if (mirrorUid) saveStoredSettings(updated, mirrorUid);
    if (isCloudUser && user?.uid) {
      persistExtendedBudgetToCloud(user.uid, mirrorUid, { settings: updated });
      if (data.userName && data.userName.trim()) {
        const cleanName = data.userName.trim();
        setUser((prev) => (prev ? { ...prev, displayName: cleanName } : prev));
        updateCloudUserProfile(user.uid, user.email || '', cleanName, updated).catch(() => {});
        if (mirrorUid) {
          updateCloudUserProfile(mirrorUid, user.email || '', cleanName, updated).catch(() => {});
        }
        const activeLocal = loadActiveLocalUser();
        if (activeLocal) {
          saveActiveLocalUser({ ...activeLocal, displayName: cleanName });
        }
      }
    }
    if (!silent) {
      addToast('Pengaturan Disimpan', 'Preferensi akun berhasil diperbarui.');
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
      mode === 'light' ? 'Mode Terang Aktif' : 'Mode Gelap Aktif',
      mode === 'light' ? 'Tampilan aplikasi beralih ke mode terang.' : 'Tampilan aplikasi beralih ke mode gelap.',
      'info'
    );
  };

  const setAccentColor = (accent: AccentColor) => {
    updateSettings({ accentColor: accent });
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
    updateSettings({
      pinEnabled: true,
      pinHash: simpleHash,
      pinLength: pin.length,
    });
    addToast('Kunci PIN Aktif', 'Aplikasi sekarang terlindungi dengan PIN.');
  };

  const disableAppPin = () => {
    updateSettings({
      pinEnabled: false,
      pinHash: undefined,
    });
    setIsLocked(false);
    addToast('Kunci PIN Dinonaktifkan', 'Proteksi PIN telah dimatikan.', 'info');
  };

  const verifyPinCode = (pin: string): boolean => {
    if (!settings.pinHash) return true;
    const targetHash = btoa(`pin-${pin}`);
    return targetHash === settings.pinHash;
  };

  // Open modals
  const openAddTransaction = (preselectedType: TransactionType = 'expense') => {
    setEditingTransaction(null);
    setIsAddTransactionOpen(true);
  };

  const openEditTransaction = (tx: TransactionDetail) => {
    setEditingTransaction(tx);
    setIsAddTransactionOpen(true);
  };

  const openScanModal = (initialImageBase64?: string | React.MouseEvent<HTMLElement>, mimeType?: string) => {
    if (typeof initialImageBase64 === 'string' && initialImageBase64) {
      setScanInitialImage({ base64: initialImageBase64, mimeType: mimeType || 'image/jpeg' });
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
    setEditingWallet(wallet);
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
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('budggt_assets_liquid', JSON.stringify([]));
          localStorage.setItem('budggt_assets_fixed', JSON.stringify([]));
          localStorage.setItem('budggt_debts', JSON.stringify([]));
          localStorage.setItem('budggt_investments', JSON.stringify([]));
          localStorage.setItem('budggt_subscriptions', JSON.stringify([]));
          if (user?.uid) {
            localStorage.setItem(`budggt_assets_liquid_${user.uid}`, JSON.stringify([]));
            localStorage.setItem(`budggt_assets_fixed_${user.uid}`, JSON.stringify([]));
            localStorage.setItem(`budggt_debts_${user.uid}`, JSON.stringify([]));
            localStorage.setItem(`budggt_investments_${user.uid}`, JSON.stringify([]));
            localStorage.setItem(`budggt_subscriptions_${user.uid}`, JSON.stringify([]));
          }
        } catch {
          // ignore
        }
      }
      if (isCloudUser && user?.uid) {
        addToast('Mereset Data...', 'Sedang membersihkan catatan di cloud Firestore...', 'info');
        clearAllData(localScopeUid);
        resetStorageToZero(localScopeUid);
        const cleanWallets = await resetUserFirestoreData(user.uid);
        if (cleanWallets && cleanWallets.length > 0) {
          setWallets(cleanWallets);
          saveStoredWallets(cleanWallets, localScopeUid);
        }
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
        clearAllData(localScopeUid);
        resetStorageToZero(localScopeUid);
        const cleanW = loadStoredWallets(localScopeUid);
        setWallets(cleanW);
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
        updateBudgetConfig,
        addBudgetSubcategory,
        updateBudgetSubcategory,
        deleteBudgetSubcategory,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        toggleSubscriptionActive,
        recordSubscriptionPayment,
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
