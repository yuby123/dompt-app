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
  Goal,
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
  loadStoredGoals,
  loadStoredSettings,
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
  saveStoredGoals,
  saveStoredSettings,
  saveStoredTransactions,
  saveStoredWallets,
} from '@/lib/storage';
import {
  DEFAULT_UPCOMING_BILLS,
  DEFAULT_BUDGET_CONFIG,
  EMPTY_BUDGET_CONFIG,
  DEFAULT_WALLETS,
  DEFAULT_CATEGORIES,
  DEFAULT_GOALS,
  DEFAULT_SETTINGS,
} from '@/lib/constants';
import { exportTransactionsToCSV } from '@/lib/formatters';
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

  updateBudgetConfig: (config: Partial<BudgetConfig>) => void;
  addBudgetSubcategory: (item: { name: string; group: BudgetGroup; allocatedAmount: number; emoji: string; dueDateDay?: number }) => void;
  updateBudgetSubcategory: (id: string, data: { name?: string; allocatedAmount?: number; emoji?: string; dueDateDay?: number }) => void;
  deleteBudgetSubcategory: (id: string) => void;

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
      const [loadedWallets, loadedTx, loadedGoals, loadedBudget] = await Promise.all([
        fetchUserWallets(cloudUid),
        fetchUserTransactions(cloudUid),
        fetchUserGoals(cloudUid),
        fetchUserBudgetConfig(cloudUid),
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

      const finalBudget = loadedBudget || EMPTY_BUDGET_CONFIG;
      setBudgetConfig(finalBudget);
      saveStoredBudgetConfig(finalBudget, cloudUid);
    } catch (err) {
      console.warn('Fallback to cached account data while syncing Firestore:', err);
      setWallets(loadStoredWallets(cloudUid));
      setTransactions(loadStoredTransactions(cloudUid));
      setGoals(loadStoredGoals(cloudUid));
      setBudgetConfig(loadStoredBudgetConfig(cloudUid));
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
          const [loadedWallets, loadedTx, loadedGoals, loadedBudget] = await Promise.all([
            fetchUserWallets(currentUser.uid),
            fetchUserTransactions(currentUser.uid),
            fetchUserGoals(currentUser.uid),
            fetchUserBudgetConfig(currentUser.uid),
          ]);
          if (loadedWallets && loadedWallets.length > 0) {
            setWallets(loadedWallets);
          }
          setTransactions(loadedTx || []);
          setGoals(loadedGoals || []);
          setBudgetConfig(loadedBudget || EMPTY_BUDGET_CONFIG);
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

  // Dynamic upcoming bills derived from negative credit/paylater wallets and scheduled budget subcategories
  const upcomingBills = useMemo<UpcomingBill[]>(() => {
    const bills: UpcomingBill[] = [];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const curMonthShort = shortMonths[activeMonth] || 'Jan';
    const nextMonthShort = shortMonths[(activeMonth + 1) % 12] || 'Feb';

    walletsWithBalance.forEach((w) => {
      if ((w.type === 'credit' || w.type === 'paylater') && w.balance < 0) {
        const dueDay = w.type === 'credit' ? 10 : 14;
        const mLabel = activeDay > dueDay ? nextMonthShort : curMonthShort;
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
    if (bills.length === 0 && budgetConfig?.subcategories) {
      budgetConfig.subcategories.forEach((sub) => {
        if (sub.dueDateDay && sub.allocatedAmount > 0) {
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
  }, [walletsWithBalance, budgetConfig, activeMonth, activeDay]);

  // Dashboard summary metrics
  const dashboardSummary = useMemo<DashboardSummary>(() => {
    const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();

    const estIncome = typeof budgetConfig?.estimatedIncome === 'number' ? budgetConfig.estimatedIncome : 0;
    // Spending budget limit: Kebutuhan (50%) + Keinginan (30%) = 80% of income
    const monthlySpendingLimit = Math.round(
      (estIncome * ((budgetConfig?.needsPercent || 50) + (budgetConfig?.wantsPercent || 30))) / 100
    );

    // Daily budget allowance for each day in the month
    const dailyBudgetQuota = estIncome > 0 ? Math.round(monthlySpendingLimit / daysInMonth) : 0;

    // Remaining daily budget for today = Daily Quota - Today's Expenses
    const dailyBudgetRemaining = Math.max(0, dailyBudgetQuota - todayExpense);

    // Liquid assets: Bank + E-wallet + Cash
    const liquidTotal = walletsWithBalance
      .filter((w) => w.type === 'bank' || w.type === 'ewallet' || w.type === 'cash')
      .reduce((acc, w) => acc + Math.max(0, w.balance), 0);

    // Standard monthly expense baseline for emergency runway calculation:
    // Uses monthly spending budget limit if set, or the greater of actual expenses or standard baseline (Rp 3.000.000)
    const baselineMonthlyExpense = Math.max(
      monthlySpendingLimit > 0 ? monthlySpendingLimit : 0,
      totalExpense,
      3000000
    );
    const runwayMonths = liquidTotal > 0 ? Number((liquidTotal / baselineMonthlyExpense).toFixed(1)) : 0;

    return {
      totalBalance,
      monthlyIncome: totalIncome,
      monthlyExpense: totalExpense,
      netCashflow: totalIncome - totalExpense,
      walletCount: wallets.length,
      budgetLimit: monthlySpendingLimit,
      budgetSpent: totalExpense,
      recentTransactions: transactionDetails.slice(0, 5),
      hasMonthlyBudget: estIncome > 0,
      budgetCount: budgetConfig.subcategories.length,
      dailyBudgetQuota,
      dailyBudgetRemaining,
      todayIncome,
      todayExpense,
      emergencyFundRunwayMonths: runwayMonths,
      liquidAssetsTotal: liquidTotal,
    };
  }, [
    walletsWithBalance,
    totalBalance,
    totalIncome,
    totalExpense,
    todayIncome,
    todayExpense,
    wallets.length,
    budgetConfig,
    transactionDetails,
    activeYear,
    activeMonth,
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

  const updateBudgetSubcategory = (id: string, data: { name?: string; allocatedAmount?: number; emoji?: string; dueDateDay?: number }) => {
    const updatedSub = budgetConfig.subcategories.map((s) => (s.id === id ? { ...s, ...data } : s));
    const updated = { ...budgetConfig, subcategories: updatedSub };
    setBudgetConfig(updated);
    saveStoredBudgetConfig(updated, localScopeUid);
    if (isCloudUser && user?.uid) {
      saveUserBudgetConfig(user.uid, updated).catch((err) =>
        console.warn('Error saving budget config to Firestore:', err)
      );
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
    addToast('Subkategori Dihapus', 'Subkategori telah dihapus.', 'info');
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
        updateBudgetConfig,
        addBudgetSubcategory,
        updateBudgetSubcategory,
        deleteBudgetSubcategory,
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
