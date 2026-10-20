'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AccentColor,
  AppSettings,
  Budget,
  BudgetConfig,
  BudgetGroup,
  Category,
  DashboardSummary,
  Debt,
  DebtPayment,
  Goal,
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
  loadStoredBudgetConfig,
  loadStoredBudgets,
  loadStoredCategories,
  loadStoredDebts,
  loadStoredGoals,
  loadStoredSettings,
  loadStoredSubscriptions,
  loadStoredTransactions,
  loadStoredWallets,
  LocalAccountProfile,
  loginAccountWithPassword,
  registerAccountWithPassword,
  resetStorageToZero,
  saveActiveLocalUser,
  saveStoredBudgetConfig,
  saveStoredBudgets,
  saveStoredCategories,
  saveStoredDebts,
  saveStoredGoals,
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
import { calculateBudgetBreakdown, getMonthlySubscriptionAmount, isFixedExpense } from '@/lib/budgetUtils';
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
  fetchUserDebts,
  saveUserDebt,
  deleteUserDebt,
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
  openScanModal: (initialImageBase64?: string, mimeType?: string) => void;
  
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
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
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

  // Load and sync an Email/Password account session with Cloud Firestore Database
  const loadAndSyncCloudAccountSession = async (
    profile: LocalAccountProfile,
    isNewRegistration = false,
    silentToast = false
  ) => {
    const cloudUid = getCloudAccountUid(profile.email);
    const normalizedProfile: LocalAccountProfile = {
      ...profile,
      uid: cloudUid,
      isLocalAccount: false,
    };

    saveActiveLocalUser(normalizedProfile);
    setUser(normalizedProfile);
    setSettings((prev) => {
      const next = {
        ...prev,
        userName: normalizedProfile.displayName,
        userEmail: normalizedProfile.email,
        hideBalance: false,
      };
      saveStoredSettings(next);
      return next;
    });
    setActiveDate(getTodayDateStr());

    try {
      const [loadedWallets, loadedTx, loadedGoals, loadedBudget, loadedDebts] = await Promise.all([
        fetchUserWallets(cloudUid),
        fetchUserTransactions(cloudUid),
        fetchUserGoals(cloudUid),
        fetchUserBudgetConfig(cloudUid),
        fetchUserDebts(cloudUid),
      ]);

      // Check if user had local data under legacy uid (e.g. user_...) that needs one-time upload to Firestore
      const legacyUid = `user_${normalizedProfile.email.replace(/[^a-z0-9]/g, '_')}`;
      const localTx = loadStoredTransactions(cloudUid);
      const legacyTx = loadStoredTransactions(legacyUid);
      const txToMigrate = localTx.length > 0 ? localTx : legacyTx;

      if ((!loadedTx || loadedTx.length === 0) && txToMigrate.length > 0 && !isNewRegistration) {
        for (const tx of txToMigrate) {
          await saveUserTransaction(cloudUid, tx);
        }
        setTransactions(txToMigrate);
        saveStoredTransactions(txToMigrate, cloudUid);
      } else {
        const finalTx = loadedTx || [];
        setTransactions(finalTx);
        saveStoredTransactions(finalTx, cloudUid);
      }

      if (loadedWallets && loadedWallets.length > 0) {
        setWallets(loadedWallets);
        saveStoredWallets(loadedWallets, cloudUid);
      } else {
        const fallbackWallets = loadStoredWallets(cloudUid);
        setWallets(fallbackWallets);
      }

      const finalGoals = loadedGoals || [];
      setGoals(finalGoals);
      saveStoredGoals(finalGoals, cloudUid);

      const finalDebts = loadedDebts || [];
      setDebts(finalDebts);
      saveStoredDebts(finalDebts, cloudUid);

      const finalBudget = loadedBudget || EMPTY_BUDGET_CONFIG;
      setBudgetConfig(finalBudget);
      saveStoredBudgetConfig(finalBudget, cloudUid);
      setSubscriptions(loadStoredSubscriptions(cloudUid));
    } catch (err) {
      console.warn('Fallback to cached account data while syncing Firestore:', err);
      setWallets(loadStoredWallets(cloudUid));
      setTransactions(loadStoredTransactions(cloudUid));
      setGoals(loadStoredGoals(cloudUid));
      setDebts(loadStoredDebts(cloudUid));
      setBudgetConfig(loadStoredBudgetConfig(cloudUid));
      setSubscriptions(loadStoredSubscriptions(cloudUid));
    }

    setDataResetVersion((v) => v + 1);
    if (!silentToast) {
      addToast(
        isNewRegistration ? 'Pendaftaran Berhasil' : 'Login Berhasil',
        `Selamat datang, ${normalizedProfile.displayName}! Akun Anda tersinkronisasi di Cloud DB.`,
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
        // Account exists in Cloud DB, but password was wrong
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
      const storedSettings = loadStoredSettings();
      const activeLocal = loadActiveLocalUser();
      const scope = activeLocal ? getCloudAccountUid(activeLocal.email) : undefined;
      if (activeLocal) {
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
      setBudgetConfig(loadStoredBudgetConfig(scope));
      setGoals(loadStoredGoals(scope));
      setDebts(loadStoredDebts(scope));
      setSubscriptions(loadStoredSubscriptions(scope));
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
        saveActiveLocalUser(null);
        setUser(currentUser);
        setAuthLoading(true);
        try {
          await syncUserProfile(currentUser);
          const [loadedWallets, loadedTx, loadedGoals, loadedBudget, loadedDebts] = await Promise.all([
            fetchUserWallets(currentUser.uid),
            fetchUserTransactions(currentUser.uid),
            fetchUserGoals(currentUser.uid),
            fetchUserBudgetConfig(currentUser.uid),
            fetchUserDebts(currentUser.uid),
          ]);
          if (loadedWallets && loadedWallets.length > 0) {
            setWallets(loadedWallets);
          }
          setTransactions(loadedTx || []);
          setGoals(loadedGoals || []);
          const finalDebts = loadedDebts || [];
          setDebts(finalDebts);
          saveStoredDebts(finalDebts, currentUser.uid);
          setBudgetConfig(loadedBudget || EMPTY_BUDGET_CONFIG);
          setSubscriptions(loadStoredSubscriptions(currentUser.uid));
          setSettings((prev) => ({
            ...prev,
            userName: currentUser.displayName || prev.userName,
            userEmail: currentUser.email || prev.userEmail,
            hideBalance: false,
          }));
          setActiveDate(getTodayDateStr());
          setDataResetVersion((v) => v + 1);
        } catch (err) {
          console.warn('Error loading user data from Firestore:', err);
        } finally {
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

  // Calculate wallet balances
  const walletsWithBalance = useMemo<WalletWithBalance[]>(() => {
    return wallets.map((wallet) => {
      let balance = wallet.initialBalance;
      let expenseThisMonth = 0;
      let incomeThisMonth = 0;
      let txCount = 0;

      transactions.forEach((tx) => {
        const txDate = new Date(tx.date);
        const isThisMonth = txDate.getFullYear() === activeYear && txDate.getMonth() === activeMonth;

        if (tx.walletId === wallet.id) {
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

      const reserved = wallet.reservedAmount || 0;
      const available = Math.max(0, balance - reserved);

      return {
        ...wallet,
        balance,
        expenseThisMonth,
        incomeThisMonth,
        transactionCount: txCount,
        availableBalance: available,
      };
    });
  }, [wallets, transactions, activeYear, activeMonth]);

  // Total balance
  const totalBalance = useMemo(() => {
    return walletsWithBalance.reduce((acc, w) => acc + w.balance, 0);
  }, [walletsWithBalance]);

  // Enriched transaction details
  const transactionDetails = useMemo<TransactionDetail[]>(() => {
    const walletMap = new Map<string, Wallet>(wallets.map((w) => [w.id, w]));
    const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

    return transactions
      .map((tx) => ({
        transaction: tx,
        wallet: walletMap.get(tx.walletId) || {
          id: tx.walletId,
          name: 'Dompet Tidak Diketahui',
          type: 'other' as const,
          initialBalance: 0,
          createdAt: '',
          updatedAt: '',
        },
        category: tx.categoryId ? categoryMap.get(tx.categoryId) || null : null,
        transferWallet: tx.transferWalletId ? walletMap.get(tx.transferWalletId) || null : null,
      }))
      .sort((a, b) => new Date(b.transaction.date).getTime() - new Date(a.transaction.date).getTime());
  }, [transactions, wallets, categories]);

  // Monthly and today income and expense
  const { totalIncome, totalExpense, todayIncome, todayExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let todayInc = 0;
    let todayExp = 0;

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === activeYear && txDate.getMonth() === activeMonth) {
        if (tx.type === 'income') inc += tx.amount;
        if (tx.type === 'expense') exp += tx.amount;

        if (txDate.getDate() === activeDay) {
          if (tx.type === 'income') todayInc += tx.amount;
          if (tx.type === 'expense') todayExp += tx.amount;
        }
      }
    });

    return { totalIncome: inc, totalExpense: exp, todayIncome: todayInc, todayExpense: todayExp };
  }, [transactions, activeYear, activeMonth, activeDay]);

  // Dynamic upcoming bills derived from negative credit/paylater wallets, active subscriptions, and scheduled budget subcategories
  const upcomingBills = useMemo<UpcomingBill[]>(() => {
    const bills: UpcomingBill[] = [];
    const seenNames = new Set<string>();
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const curMonthShort = shortMonths[activeMonth] || 'Jan';
    const nextMonthShort = shortMonths[(activeMonth + 1) % 12] || 'Feb';
    const currentPeriodKey = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`;

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
      if (item.lastRecordedPeriod === currentPeriodKey) return;
      const mLabel = activeDay > item.billingDay ? nextMonthShort : curMonthShort;
      seenNames.add(item.name.toLowerCase().trim());
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
  }, [walletsWithBalance, subscriptions, budgetConfig, activeYear, activeMonth, activeDay]);

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
    });

    // Liquid assets: Bank + E-wallet + Cash
    const liquidTotal = walletsWithBalance
      .filter((w) => w.type === 'bank' || w.type === 'ewallet' || w.type === 'cash')
      .reduce((acc, w) => acc + Math.max(0, w.balance), 0);

    // Standard monthly expense baseline for emergency runway calculation:
    // Uses monthly spending budget limit if set, or the greater of actual expenses or standard baseline (Rp 3.000.000)
    const baselineMonthlyExpense = Math.max(
      breakdown.monthlySpendingLimit > 0 ? breakdown.monthlySpendingLimit : 0,
      totalExpense,
      3000000
    );
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
    };
  }, [
    budgetConfig,
    transactions,
    categories,
    activeYear,
    activeMonth,
    activeDay,
    subscriptions,
    walletsWithBalance,
    totalBalance,
    totalIncome,
    totalExpense,
    todayIncome,
    todayExpense,
    wallets.length,
    transactionDetails,
  ]);

  // CRUD: Transaction
  const addTransaction = (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTransactions((prev) => {
      const updated = [newTx, ...prev];
      saveStoredTransactions(updated, localScopeUid);
      return updated;
    });

    if (isCloudUser && user?.uid) {
      saveUserTransaction(user.uid, newTx).catch((err) =>
        console.warn('Error saving transaction to Firestore:', err)
      );
    }

    addToast('Transaksi Ditambahkan', `${data.note || 'Transaksi baru'} berhasil dicatat.`);
  };

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    let targetTx: Transaction | undefined;
    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          targetTx = { ...t, ...data, updatedAt: new Date().toISOString() };
          return targetTx;
        }
        return t;
      });
      saveStoredTransactions(updated, localScopeUid);
      return updated;
    });

    if (isCloudUser && user?.uid && targetTx) {
      saveUserTransaction(user.uid, targetTx).catch((err) =>
        console.warn('Error updating transaction in Firestore:', err)
      );
    }

    addToast('Transaksi Diperbarui', 'Perubahan transaksi berhasil disimpan.');
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveStoredTransactions(updated, localScopeUid);
      return updated;
    });

    if (isCloudUser && user?.uid) {
      deleteUserTransaction(user.uid, id).catch((err) =>
        console.warn('Error deleting transaction from Firestore:', err)
      );
    }

    addToast('Transaksi Dihapus', 'Data transaksi telah dihapus.', 'info');
  };

  // CRUD: Wallet
  const addWallet = (data: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newW: Wallet = {
      ...data,
      id: `wallet-${Date.now()}`,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...wallets, newW];
    setWallets(updated);
    saveStoredWallets(updated, localScopeUid);
    if (isCloudUser && user?.uid) {
      saveUserWallet(user.uid, newW).catch((err) =>
        console.warn('Error saving wallet to Firestore:', err)
      );
    }
    addToast('Dompet Ditambahkan', `Dompet ${data.name} berhasil dibuat.`);
  };

  const updateWallet = (id: string, data: Partial<Wallet>) => {
    let targetW: Wallet | undefined;
    const updated = wallets.map((w) => {
      if (w.id === id) {
        targetW = { ...w, ...data, updatedAt: new Date().toISOString() };
        return targetW;
      }
      return w;
    });
    setWallets(updated);
    saveStoredWallets(updated, localScopeUid);
    if (isCloudUser && user?.uid && targetW) {
      saveUserWallet(user.uid, targetW).catch((err) =>
        console.warn('Error updating wallet in Firestore:', err)
      );
    }
    addToast('Dompet Diperbarui', 'Informasi dompet berhasil diubah.');
  };

  const deleteWallet = (id: string): boolean => {
    if (wallets.length <= 1) {
      addToast('Gagal Menghapus', 'Minimal harus ada 1 dompet aktif.', 'error');
      return false;
    }
    const updated = wallets.filter((w) => w.id !== id);
    setWallets(updated);
    saveStoredWallets(updated, localScopeUid);
    if (isCloudUser && user?.uid) {
      deleteUserWallet(user.uid, id).catch((err) =>
        console.warn('Error deleting wallet from Firestore:', err)
      );
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
    const newG: Goal = {
      ...data,
      id: `goal-${Date.now()}`,
    };
    const updated = [...goals, newG];
    setGoals(updated);
    saveStoredGoals(updated, localScopeUid);
    if (isCloudUser && user?.uid) {
      saveUserGoal(user.uid, newG).catch((err) =>
        console.warn('Error saving goal to Firestore:', err)
      );
    }
    addToast('Target Goal Dibuat', `Target ${data.name} berhasil ditambahkan.`);
  };

  const updateGoal = (id: string, data: Partial<Goal>) => {
    let targetG: Goal | undefined;
    const updated = goals.map((g) => {
      if (g.id === id) {
        targetG = { ...g, ...data };
        return targetG;
      }
      return g;
    });
    setGoals(updated);
    saveStoredGoals(updated, localScopeUid);
    if (isCloudUser && user?.uid && targetG) {
      saveUserGoal(user.uid, targetG).catch((err) =>
        console.warn('Error updating goal in Firestore:', err)
      );
    }
    addToast('Goal Diperbarui', 'Perubahan target berhasil disimpan.');
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    saveStoredGoals(updated, localScopeUid);
    if (isCloudUser && user?.uid) {
      deleteUserGoal(user.uid, id).catch((err) =>
        console.warn('Error deleting goal from Firestore:', err)
      );
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
    const id = `debt-${Date.now()}`;
    const now = new Date().toISOString();
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
    if (isCloudUser && user?.uid) {
      saveUserDebt(user.uid, newDebt).catch((err) =>
        console.warn('Error saving debt to Firestore:', err)
      );
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
    const nextDebts = debts.map((d) => {
      if (d.id !== id) return d;
      const updatedItem: Debt = {
        ...d,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      if (updatedItem.remainingAmount <= 0) {
        updatedItem.status = 'paid';
        updatedItem.remainingAmount = 0;
      }
      return updatedItem;
    });
    setDebts(nextDebts);
    saveStoredDebts(nextDebts, localScopeUid);
    const itemToSync = nextDebts.find((d) => d.id === id);
    if (isCloudUser && user?.uid && itemToSync) {
      saveUserDebt(user.uid, itemToSync).catch((err) =>
        console.warn('Error updating debt in Firestore:', err)
      );
    }
    addToast('Perubahan Disimpan', 'Data utang/piutang berhasil diperbarui.');
  };

  const deleteDebt = (id: string) => {
    const nextDebts = debts.filter((d) => d.id !== id);
    setDebts(nextDebts);
    saveStoredDebts(nextDebts, localScopeUid);
    if (isCloudUser && user?.uid) {
      deleteUserDebt(user.uid, id).catch((err) =>
        console.warn('Error deleting debt from Firestore:', err)
      );
    }
    addToast('Catatan Dihapus', 'Data utang/piutang telah dihapus.', 'info');
  };

  const payDebtInstallment = (
    debtId: string,
    amount: number,
    options?: { walletId?: string; date?: string; note?: string }
  ) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt || amount <= 0) return;

    const paymentDate = options?.date || new Date().toISOString().slice(0, 10);
    const selectedWallet = options?.walletId ? wallets.find((w) => w.id === options.walletId) : undefined;

    let createdTxId: string | undefined = undefined;

    // Create real cashflow transaction
    if (selectedWallet) {
      const txId = `tx-${Date.now()}`;
      createdTxId = txId;
      if (debt.type === 'payable') {
        // Paying off our debt -> Expense from selected wallet
        addTransaction({
          type: 'expense',
          amount: amount,
          walletId: selectedWallet.id,
          date: paymentDate,
          note: `Bayar Cicilan Utang: ${debt.name} (${options?.note || debt.contactName})`,
          budgetGroup: 'kebutuhan',
          categoryId: 'cat-tagihan',
        });
      } else {
        // Someone paying back our receivable -> Income to selected wallet
        addTransaction({
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

    const nextDebts = debts.map((d) => {
      if (d.id !== debtId) return d;
      return {
        ...d,
        remainingAmount: newRemaining,
        status: newStatus,
        payments: [...(d.payments || []), newPayment],
        updatedAt: new Date().toISOString(),
      };
    });

    setDebts(nextDebts);
    saveStoredDebts(nextDebts, localScopeUid);
    const updatedDebt = nextDebts.find((d) => d.id === debtId);
    if (isCloudUser && user?.uid && updatedDebt) {
      saveUserDebt(user.uid, updatedDebt).catch((err) =>
        console.warn('Error saving debt payment to Firestore:', err)
      );
    }

    if (newRemaining <= 0) {
      addToast('🎉 Lunas Sempurna!', `Selamat! ${debt.name} telah lunas seluruhnya.`);
    } else {
      addToast(
        'Pembayaran Dicatat',
        `Berhasil mencatat pembayaran sebesar ${formatRupiah(amount)}. Sisa: ${formatRupiah(newRemaining)}.`
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
    const updated = { ...budgetConfig, ...data };
    setBudgetConfig(updated);
    saveStoredBudgetConfig(updated, localScopeUid);
    if (isCloudUser && user?.uid) {
      saveUserBudgetConfig(user.uid, updated).catch((err) =>
        console.warn('Error saving budget config to Firestore:', err)
      );
    }
    addToast('Alokasi Disimpan', 'Alokasi anggaran 50/30/20 berhasil diperbarui.');
  };

  const addBudgetSubcategory = (item: { name: string; group: BudgetGroup; allocatedAmount: number; emoji: string; dueDateDay?: number }) => {
    const newSub = {
      id: `sub-${Date.now()}`,
      ...item,
    };
    const updated = {
      ...budgetConfig,
      subcategories: [...budgetConfig.subcategories, newSub],
    };
    setBudgetConfig(updated);
    saveStoredBudgetConfig(updated, localScopeUid);
    if (isCloudUser && user?.uid) {
      saveUserBudgetConfig(user.uid, updated).catch((err) =>
        console.warn('Error saving budget config to Firestore:', err)
      );
    }
    addToast('Subkategori Ditambahkan', `${item.name} berhasil ditambahkan ke ${item.group}.`);
  };

  const updateBudgetSubcategory = (
    id: string,
    data: { name?: string; group?: BudgetGroup; allocatedAmount?: number; emoji?: string; dueDateDay?: number }
  ) => {
    let targetSubName = '';
    const updatedSub = budgetConfig.subcategories.map((s) => {
      if (s.id === id) {
        targetSubName = s.name.toLowerCase().trim();
        return { ...s, ...data };
      }
      return s;
    });
    const updated = { ...budgetConfig, subcategories: updatedSub };
    setBudgetConfig(updated);
    saveStoredBudgetConfig(updated, localScopeUid);
    if (isCloudUser && user?.uid) {
      saveUserBudgetConfig(user.uid, updated).catch((err) =>
        console.warn('Error saving budget config to Firestore:', err)
      );
    }

    // Two-way sync: if a subscription is linked to this subcategory, keep its details in sync
    const hasLinkedSub = subscriptions.some(
      (rec) =>
        rec.subcategoryId === id ||
        (targetSubName && rec.name.toLowerCase().trim() === targetSubName)
    );
    if (hasLinkedSub) {
      const nextSubs = subscriptions.map((rec) => {
        if (
          rec.subcategoryId === id ||
          (targetSubName && rec.name.toLowerCase().trim() === targetSubName)
        ) {
          return {
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
          };
        }
        return rec;
      });
      setSubscriptions(nextSubs);
      saveStoredSubscriptions(nextSubs, localScopeUid);
    }

    addToast('Subkategori Diperbarui', 'Alokasi subkategori berhasil disimpan.');
  };

  const deleteBudgetSubcategory = (id: string) => {
    const updatedSub = budgetConfig.subcategories.filter((s) => s.id !== id);
    const updated = { ...budgetConfig, subcategories: updatedSub };
    setBudgetConfig(updated);
    saveStoredBudgetConfig(updated, localScopeUid);
    if (isCloudUser && user?.uid) {
      saveUserBudgetConfig(user.uid, updated).catch((err) =>
        console.warn('Error saving budget config to Firestore:', err)
      );
    }
    // Unlink any subscription referencing this deleted subcategory
    const nextSubs = subscriptions.map((rec) =>
      rec.subcategoryId === id ? { ...rec, subcategoryId: undefined } : rec
    );
    setSubscriptions(nextSubs);
    saveStoredSubscriptions(nextSubs, localScopeUid);

    addToast('Subkategori Dihapus', 'Subkategori telah dihapus.', 'info');
  };

  // CRUD: Subscriptions & Recurring Transactions (Two-way integrated with BudgetConfig)
  const addSubscription = (itemData: Omit<RecurringItem, 'id'>) => {
    const newId = `sub-rec-${Date.now()}`;
    const cleanName = itemData.name.trim();
    const cleanNameLower = cleanName.toLowerCase();

    let updatedSubcategories = [...(budgetConfig.subcategories || [])];
    let linkedSubcategoryId = itemData.subcategoryId;
    const determinedGroup: BudgetGroup =
      itemData.budgetGroup ||
      (itemData.categoryId === 'cat-hiburan' ? 'keinginan' : 'kebutuhan');

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
        });
      }

      const nextBudgetConfig: BudgetConfig = {
        ...budgetConfig,
        subcategories: updatedSubcategories,
      };
      setBudgetConfig(nextBudgetConfig);
      saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
      if (isCloudUser && user?.uid) {
        saveUserBudgetConfig(user.uid, nextBudgetConfig).catch((err) =>
          console.warn('Error saving budget config to Firestore:', err)
        );
      }
    } else if (itemData.type === 'income' && budgetConfig.estimatedIncome === 0) {
      const monthlyInc = getMonthlySubscriptionAmount(itemData.amount, itemData.frequency);
      const nextBudgetConfig: BudgetConfig = {
        ...budgetConfig,
        estimatedIncome: monthlyInc,
      };
      setBudgetConfig(nextBudgetConfig);
      saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
      if (isCloudUser && user?.uid) {
        saveUserBudgetConfig(user.uid, nextBudgetConfig).catch((err) =>
          console.warn('Error saving budget config to Firestore:', err)
        );
      }
    }

    const newItem: RecurringItem = {
      ...itemData,
      id: newId,
      name: cleanName,
      subcategoryId: linkedSubcategoryId,
      budgetGroup: itemData.type === 'expense' ? determinedGroup : undefined,
    };

    const nextSubs = [...subscriptions, newItem];
    setSubscriptions(nextSubs);
    saveStoredSubscriptions(nextSubs, localScopeUid);
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

    const merged: RecurringItem = {
      ...existingItem,
      ...data,
      name: (data.name !== undefined ? data.name : existingItem.name).trim(),
    };

    const determinedGroup: BudgetGroup =
      merged.budgetGroup ||
      (merged.categoryId === 'cat-hiburan' ? 'keinginan' : 'kebutuhan');

    let updatedSubcategories = [...(budgetConfig.subcategories || [])];
    let linkedSubcategoryId = merged.subcategoryId;

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
        });
      }

      const nextBudgetConfig: BudgetConfig = {
        ...budgetConfig,
        subcategories: updatedSubcategories,
      };
      setBudgetConfig(nextBudgetConfig);
      saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
      if (isCloudUser && user?.uid) {
        saveUserBudgetConfig(user.uid, nextBudgetConfig).catch((err) =>
          console.warn('Error saving budget config to Firestore:', err)
        );
      }
    } else if (existingItem.type === 'expense' && merged.type === 'income') {
      // Switched from expense to income -> remove old expense subcategory if linked
      updatedSubcategories = updatedSubcategories.filter(
        (s) => s.id !== existingItem.subcategoryId && s.subscriptionId !== id
      );
      linkedSubcategoryId = undefined;
      const nextBudgetConfig: BudgetConfig = {
        ...budgetConfig,
        subcategories: updatedSubcategories,
      };
      setBudgetConfig(nextBudgetConfig);
      saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
      if (isCloudUser && user?.uid) {
        saveUserBudgetConfig(user.uid, nextBudgetConfig).catch((err) =>
          console.warn('Error saving budget config to Firestore:', err)
        );
      }
    }

    const finalUpdatedItem: RecurringItem = {
      ...merged,
      subcategoryId: linkedSubcategoryId,
      budgetGroup: merged.type === 'expense' ? determinedGroup : undefined,
    };

    const nextSubs = subscriptions.map((i) => (i.id === id ? finalUpdatedItem : i));
    setSubscriptions(nextSubs);
    saveStoredSubscriptions(nextSubs, localScopeUid);
    addToast(
      'Jadwal Diperbarui',
      `${finalUpdatedItem.name} & alokasi budget terkait berhasil diperbarui.`
    );
  };

  const toggleSubscriptionActive = (id: string) => {
    const target = subscriptions.find((i) => i.id === id);
    if (!target) return;
    const nextActive = !target.isActive;
    const nextSubs = subscriptions.map((i) =>
      i.id === id ? { ...i, isActive: nextActive } : i
    );
    setSubscriptions(nextSubs);
    saveStoredSubscriptions(nextSubs, localScopeUid);

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
      const nextBudgetConfig: BudgetConfig = {
        ...budgetConfig,
        subcategories: updatedSubcategories,
      };
      setBudgetConfig(nextBudgetConfig);
      saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
      if (isCloudUser && user?.uid) {
        saveUserBudgetConfig(user.uid, nextBudgetConfig).catch((err) =>
          console.warn('Error saving budget config to Firestore:', err)
        );
      }
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
    const target = subscriptions.find((i) => i.id === id);
    const nextSubs = subscriptions.filter((i) => i.id !== id);
    setSubscriptions(nextSubs);
    saveStoredSubscriptions(nextSubs, localScopeUid);

    if (target && target.type === 'expense') {
      const targetNameLower = target.name.toLowerCase().trim();
      const updatedSubcategories = budgetConfig.subcategories.filter(
        (s) =>
          s.id !== target.subcategoryId &&
          s.subscriptionId !== id &&
          s.name.toLowerCase().trim() !== targetNameLower
      );
      if (updatedSubcategories.length !== budgetConfig.subcategories.length) {
        const nextBudgetConfig: BudgetConfig = {
          ...budgetConfig,
          subcategories: updatedSubcategories,
        };
        setBudgetConfig(nextBudgetConfig);
        saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
        if (isCloudUser && user?.uid) {
          saveUserBudgetConfig(user.uid, nextBudgetConfig).catch((err) =>
            console.warn('Error saving budget config to Firestore:', err)
          );
        }
      }
    }

    addToast('Jadwal Dihapus', 'Langganan & alokasi subkategori budget terkait telah dihapus.', 'info');
  };

  const recordSubscriptionPayment = (id: string) => {
    const item = subscriptions.find((i) => i.id === id);
    if (!item) return;

    const currentPeriodKey = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`;
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

    const nextSubs = subscriptions.map((i) =>
      i.id === item.id ? { ...i, lastRecordedPeriod: currentPeriodKey } : i
    );
    setSubscriptions(nextSubs);
    saveStoredSubscriptions(nextSubs, localScopeUid);
    addToast(
      'Pembayaran Dicatat',
      item.type === 'expense'
        ? `${item.name} masuk ke Pos Tagihan Bulanan (${determinedBudgetGroup.toUpperCase()}) tanpa memotong Budget Harian.`
        : `${item.name} berhasil dicatat sebagai pemasukan rutin.`,
      'success'
    );
  };

  const syncSubscriptionsToBudget = () => {
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
              }
            : s
        );
        return { ...item, subcategoryId: matchedSub.id, budgetGroup: determinedGroup };
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
        });
        return { ...item, subcategoryId: newSubId, budgetGroup: determinedGroup };
      }
    });

    if (changed) {
      setSubscriptions(nextSubs);
      saveStoredSubscriptions(nextSubs, localScopeUid);
      const nextBudgetConfig: BudgetConfig = {
        ...budgetConfig,
        subcategories: updatedSubcategories,
      };
      setBudgetConfig(nextBudgetConfig);
      saveStoredBudgetConfig(nextBudgetConfig, localScopeUid);
      if (isCloudUser && user?.uid) {
        saveUserBudgetConfig(user.uid, nextBudgetConfig).catch((err) =>
          console.warn('Error saving budget config to Firestore:', err)
        );
      }
      addToast('Sinkronisasi Berhasil', 'Semua jadwal langganan kini terhubung ke Pos Alokasi Budget.');
    }
  };

  // Transfer funds
  const transferFunds = (
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    note?: string,
    date?: string
  ) => {
    const fromW = wallets.find((w) => w.id === fromWalletId);
    const toW = wallets.find((w) => w.id === toWalletId);

    const tx: Transaction = {
      id: `tx-transfer-${Date.now()}`,
      type: 'transfer',
      amount,
      walletId: fromWalletId,
      transferWalletId: toWalletId,
      date: date || new Date().toISOString(),
      note: note || `Transfer dari ${fromW?.name || 'Dompet'} ke ${toW?.name || 'Dompet'}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTransactions((prev) => {
      const updated = [tx, ...prev];
      saveStoredTransactions(updated, localScopeUid);
      return updated;
    });

    if (isCloudUser && user?.uid) {
      saveUserTransaction(user.uid, tx).catch((err) =>
        console.warn('Error saving transfer transaction to Firestore:', err)
      );
    }

    addToast('Transfer Berhasil', `Rp ${amount.toLocaleString('id-ID')} dipindahkan.`);
  };

  // Settings
  const updateSettings = (data: Partial<AppSettings>, silent = false) => {
    const updated = { ...settings, ...data };
    setSettings(updated);
    saveStoredSettings(updated);
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
    applyThemeToDOM(mode, settings.accentColor);
    const updated = { ...settings, themeMode: mode };
    setSettings(updated);
    saveStoredSettings(updated);
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

  const openScanModal = (initialImageBase64?: string, mimeType?: string) => {
    if (initialImageBase64) {
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
