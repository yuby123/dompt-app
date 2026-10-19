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
  clearAllData,
  loadStoredBudgetConfig,
  loadStoredBudgets,
  loadStoredCategories,
  loadStoredGoals,
  loadStoredSettings,
  loadStoredTransactions,
  loadStoredWallets,
  resetStorageToZero,
  saveStoredBudgetConfig,
  saveStoredBudgets,
  saveStoredCategories,
  saveStoredGoals,
  saveStoredSettings,
  saveStoredTransactions,
  saveStoredWallets,
} from '@/lib/storage';
import { DEFAULT_UPCOMING_BILLS } from '@/lib/constants';
import { exportTransactionsToCSV } from '@/lib/formatters';

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
  | 'analytics';

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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTabState] = useState<TabType>('dashboard');
  const [previousTab, setPreviousTab] = useState<TabType>('dashboard');

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

  // Core Data States
  const [wallets, setWallets] = useState<Wallet[]>(() => loadStoredWallets());
  const [categories, setCategories] = useState<Category[]>(() => loadStoredCategories());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadStoredTransactions());
  const [budgets, setBudgets] = useState<Budget[]>(() => loadStoredBudgets());
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>(() => loadStoredBudgetConfig());
  const [goals, setGoals] = useState<Goal[]>(() => loadStoredGoals());
  const [upcomingBills] = useState<UpcomingBill[]>(DEFAULT_UPCOMING_BILLS);
  const [settings, setSettings] = useState<AppSettings>(() => loadStoredSettings());

  // Active Date & Reference Period (Defaults to '2026-03-25' matching demo app reference)
  const [activeDate, setActiveDate] = useState<string>('2026-03-25');
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

  // Security / App Lock
  const [isLocked, setIsLocked] = useState(() => loadStoredSettings().pinEnabled);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

  // Dashboard summary metrics
  const dashboardSummary = useMemo<DashboardSummary>(() => {
    const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();

    const estIncome = budgetConfig.estimatedIncome || 5000000;
    // Spending budget limit: Kebutuhan (50%) + Keinginan (30%) = 80% of income = 4,000,000
    const monthlySpendingLimit = Math.round(
      (estIncome * ((budgetConfig.needsPercent || 50) + (budgetConfig.wantsPercent || 30))) / 100
    );

    // Daily budget allowance for each day in the month: 4,000,000 / 31 = 129,032
    const dailyBudgetQuota = Math.round(monthlySpendingLimit / daysInMonth);

    // Remaining daily budget for today = Daily Quota - Today's Expenses
    // On Day 25 with Kopi Tuku (Rp 25.000): 129,032 - 25,000 = exactly Rp 104.032!
    // When user adds another expense today, it decreases 1:1 directly!
    const dailyBudgetRemaining = Math.max(0, dailyBudgetQuota - todayExpense);

    // Liquid assets: Bank + E-wallet + Cash
    const liquidTotal = walletsWithBalance
      .filter((w) => w.type === 'bank' || w.type === 'ewallet' || w.type === 'cash')
      .reduce((acc, w) => acc + Math.max(0, w.balance), 0);

    const avgMonthlyExpense = Math.max(1, totalExpense || 4000000);
    const runwayMonths = Number((liquidTotal / avgMonthlyExpense).toFixed(1));

    return {
      totalBalance,
      monthlyIncome: totalIncome,
      monthlyExpense: totalExpense,
      netCashflow: totalIncome - totalExpense,
      walletCount: wallets.length,
      budgetLimit: monthlySpendingLimit,
      budgetSpent: totalExpense,
      recentTransactions: transactionDetails.slice(0, 5),
      hasMonthlyBudget: true,
      budgetCount: budgetConfig.subcategories.length,
      dailyBudgetQuota,
      dailyBudgetRemaining,
      todayIncome,
      todayExpense,
      emergencyFundRunwayMonths: Math.max(1, runwayMonths),
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
      saveStoredTransactions(updated);
      return updated;
    });
    addToast('Transaksi Ditambahkan', `${data.note || 'Transaksi baru'} berhasil dicatat.`);
  };

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    setTransactions((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      );
      saveStoredTransactions(updated);
      return updated;
    });
    addToast('Transaksi Diperbarui', 'Perubahan transaksi berhasil disimpan.');
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveStoredTransactions(updated);
      return updated;
    });
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
    saveStoredWallets(updated);
    addToast('Dompet Ditambahkan', `Dompet ${data.name} berhasil dibuat.`);
  };

  const updateWallet = (id: string, data: Partial<Wallet>) => {
    const updated = wallets.map((w) =>
      w.id === id ? { ...w, ...data, updatedAt: new Date().toISOString() } : w
    );
    setWallets(updated);
    saveStoredWallets(updated);
    addToast('Dompet Diperbarui', 'Informasi dompet berhasil diubah.');
  };

  const deleteWallet = (id: string): boolean => {
    if (wallets.length <= 1) {
      addToast('Gagal Menghapus', 'Minimal harus ada 1 dompet aktif.', 'error');
      return false;
    }
    const updated = wallets.filter((w) => w.id !== id);
    setWallets(updated);
    saveStoredWallets(updated);
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
    saveStoredGoals(updated);
    addToast('Target Goal Dibuat', `Target ${data.name} berhasil ditambahkan.`);
  };

  const updateGoal = (id: string, data: Partial<Goal>) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, ...data } : g));
    setGoals(updated);
    saveStoredGoals(updated);
    addToast('Goal Diperbarui', 'Perubahan target berhasil disimpan.');
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    saveStoredGoals(updated);
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
    saveStoredBudgetConfig(updated);
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
    saveStoredBudgetConfig(updated);
    addToast('Subkategori Ditambahkan', `${item.name} berhasil ditambahkan ke ${item.group}.`);
  };

  const updateBudgetSubcategory = (id: string, data: { name?: string; allocatedAmount?: number; emoji?: string; dueDateDay?: number }) => {
    const updatedSub = budgetConfig.subcategories.map((s) => (s.id === id ? { ...s, ...data } : s));
    const updated = { ...budgetConfig, subcategories: updatedSub };
    setBudgetConfig(updated);
    saveStoredBudgetConfig(updated);
    addToast('Subkategori Diperbarui', 'Alokasi subkategori berhasil disimpan.');
  };

  const deleteBudgetSubcategory = (id: string) => {
    const updatedSub = budgetConfig.subcategories.filter((s) => s.id !== id);
    const updated = { ...budgetConfig, subcategories: updatedSub };
    setBudgetConfig(updated);
    saveStoredBudgetConfig(updated);
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
      saveStoredTransactions(updated);
      return updated;
    });
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

  const deductAiCredit = (amount = 1): boolean => {
    if (settings.aiCredits < amount) {
      addToast('AI Credits Habis', 'Saldo kredit AI tidak mencukupi.', 'error');
      return false;
    }
    const updated = Math.max(0, settings.aiCredits - amount);
    updateSettings({ aiCredits: updated });
    return true;
  };

  const addAiCredits = (amount: number) => {
    const updated = settings.aiCredits + amount;
    updateSettings({ aiCredits: updated });
    addToast('Top Up Berhasil', `${amount} AI Credits telah ditambahkan.`);
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

  const resetAllAppData = () => {
    clearAllData();
    resetStorageToZero();
    setWallets(loadStoredWallets());
    setCategories(loadStoredCategories());
    setTransactions(loadStoredTransactions());
    setBudgets(loadStoredBudgets());
    setBudgetConfig(loadStoredBudgetConfig());
    setGoals(loadStoredGoals());
    setSettings(loadStoredSettings());
    setIsLocked(false);
    addToast('Data Direset', 'Semua data telah dikembalikan ke kondisi awal Dompt.');
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
