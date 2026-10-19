import { AppSettings, Budget, BudgetConfig, Category, Goal, Transaction, Wallet } from './types';
import {
  DEFAULT_BUDGET_CONFIG,
  DEFAULT_CATEGORIES,
  DEFAULT_GOALS,
  DEFAULT_SETTINGS,
  DEFAULT_WALLETS,
} from './constants';

const STORAGE_KEYS = {
  WALLETS: 'budggt_wallets',
  CATEGORIES: 'budggt_categories',
  TRANSACTIONS: 'budggt_transactions',
  BUDGETS: 'budggt_budgets',
  BUDGET_CONFIG: 'budggt_budget_config',
  GOALS: 'budggt_goals',
  SETTINGS: 'budggt_settings',
};

export function getInitialSampleTransactions(): Transaction[] {
  const makeDate = (day: number, hour: number, min: number) => {
    const d = new Date(2026, 2, day, hour, min, 0, 0); // Month 2 is March 2026
    return d.toISOString();
  };

  return [
    {
      id: 'tx-1',
      type: 'expense',
      amount: 25000,
      categoryId: 'cat-jajan',
      budgetGroup: 'keinginan',
      walletId: 'wallet-mandiri',
      date: makeDate(25, 10, 15),
      note: 'Kopi Tuku',
      createdAt: makeDate(25, 10, 15),
      updatedAt: makeDate(25, 10, 15),
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 365000,
      categoryId: 'cat-makan',
      budgetGroup: 'kebutuhan',
      walletId: 'wallet-bca',
      date: makeDate(24, 11, 20),
      note: 'Belanja bahan masakan',
      createdAt: makeDate(24, 11, 20),
      updatedAt: makeDate(24, 11, 20),
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 15000,
      categoryId: 'cat-jajan',
      budgetGroup: 'keinginan',
      walletId: 'wallet-cash',
      date: makeDate(23, 14, 10),
      note: 'Rujak Buah',
      createdAt: makeDate(23, 14, 10),
      updatedAt: makeDate(23, 14, 10),
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 10000,
      categoryId: 'cat-jajan',
      budgetGroup: 'keinginan',
      walletId: 'wallet-cash',
      date: makeDate(22, 16, 40),
      note: 'Beli Gorengan',
      createdAt: makeDate(22, 16, 40),
      updatedAt: makeDate(22, 16, 40),
    },
    {
      id: 'tx-5',
      type: 'expense',
      amount: 90000,
      categoryId: 'cat-hangout',
      budgetGroup: 'keinginan',
      walletId: 'wallet-mandiri',
      date: makeDate(21, 19, 30),
      note: 'Blok M',
      createdAt: makeDate(21, 19, 30),
      updatedAt: makeDate(21, 19, 30),
    },
    {
      id: 'tx-6',
      type: 'expense',
      amount: 120000,
      categoryId: 'cat-gaya-hidup',
      budgetGroup: 'keinginan',
      walletId: 'wallet-krisflyer',
      date: makeDate(20, 15, 15),
      note: 'Nail Art',
      createdAt: makeDate(20, 15, 15),
      updatedAt: makeDate(20, 15, 15),
    },
    {
      id: 'tx-7',
      type: 'expense',
      amount: 20000,
      categoryId: 'cat-jajan',
      budgetGroup: 'keinginan',
      walletId: 'wallet-gopay',
      date: makeDate(19, 9, 45),
      note: 'Kopi Calf',
      createdAt: makeDate(19, 9, 45),
      updatedAt: makeDate(19, 9, 45),
    },
    {
      id: 'tx-8',
      type: 'expense',
      amount: 342500,
      categoryId: 'cat-makan',
      budgetGroup: 'kebutuhan',
      walletId: 'wallet-bca',
      date: makeDate(17, 10, 0),
      note: 'Belanja bahan makanan',
      createdAt: makeDate(17, 10, 0),
      updatedAt: makeDate(17, 10, 0),
    },
    {
      id: 'tx-9',
      type: 'expense',
      amount: 180000,
      categoryId: 'cat-belanja',
      budgetGroup: 'keinginan',
      walletId: 'wallet-bca',
      date: makeDate(16, 20, 10),
      note: 'Skincare',
      createdAt: makeDate(16, 20, 10),
      updatedAt: makeDate(16, 20, 10),
    },
    {
      id: 'tx-10',
      type: 'expense',
      amount: 100000,
      categoryId: 'cat-hangout',
      budgetGroup: 'keinginan',
      walletId: 'wallet-mandiri',
      date: makeDate(15, 21, 0),
      note: 'Ke CP',
      createdAt: makeDate(15, 21, 0),
      updatedAt: makeDate(15, 21, 0),
    },
    {
      id: 'tx-11',
      type: 'expense',
      amount: 120000,
      categoryId: 'cat-belanja',
      budgetGroup: 'keinginan',
      walletId: 'wallet-bca',
      date: makeDate(13, 13, 30),
      note: 'Baju Tidur Rayon',
      createdAt: makeDate(13, 13, 30),
      updatedAt: makeDate(13, 13, 30),
    },
    {
      id: 'tx-12',
      type: 'expense',
      amount: 10000,
      categoryId: 'cat-makan',
      budgetGroup: 'kebutuhan',
      walletId: 'wallet-cash',
      date: makeDate(12, 15, 0),
      note: 'Jajan Adik',
      createdAt: makeDate(12, 15, 0),
      updatedAt: makeDate(12, 15, 0),
    },
    {
      id: 'tx-11b',
      type: 'expense',
      amount: 25000,
      categoryId: 'cat-jajan',
      budgetGroup: 'keinginan',
      walletId: 'wallet-mandiri',
      date: makeDate(11, 11, 0),
      note: 'Kopi Tuku',
      createdAt: makeDate(11, 11, 0),
      updatedAt: makeDate(11, 11, 0),
    },
    {
      id: 'tx-10b',
      type: 'expense',
      amount: 70000,
      categoryId: 'cat-hangout',
      budgetGroup: 'keinginan',
      walletId: 'wallet-mandiri',
      date: makeDate(10, 19, 0),
      note: 'Blok M',
      createdAt: makeDate(10, 19, 0),
      updatedAt: makeDate(10, 19, 0),
    },
    {
      id: 'tx-13',
      type: 'transfer',
      amount: 500000,
      walletId: 'wallet-mandiri',
      transferWalletId: 'wallet-rdn',
      budgetGroup: 'tabungan',
      date: makeDate(9, 14, 0),
      note: 'Tabungan RDN BCA untuk Rumah Impian',
      createdAt: makeDate(9, 14, 0),
      updatedAt: makeDate(9, 14, 0),
    },
    {
      id: 'tx-8b',
      type: 'expense',
      amount: 368000,
      categoryId: 'cat-makan',
      budgetGroup: 'kebutuhan',
      walletId: 'wallet-bca',
      date: makeDate(8, 10, 0),
      note: 'Belanja bahan makanan',
      createdAt: makeDate(8, 10, 0),
      updatedAt: makeDate(8, 10, 0),
    },
    {
      id: 'tx-7b',
      type: 'expense',
      amount: 50000,
      categoryId: 'cat-kuota',
      budgetGroup: 'kebutuhan',
      walletId: 'wallet-bca',
      date: makeDate(7, 12, 0),
      note: 'Kuota',
      createdAt: makeDate(7, 12, 0),
      updatedAt: makeDate(7, 12, 0),
    },
    {
      id: 'tx-15',
      type: 'expense',
      amount: 32000,
      categoryId: 'cat-air',
      budgetGroup: 'kebutuhan',
      walletId: 'wallet-bca',
      date: makeDate(6, 9, 0),
      note: 'Tagihan Air PAM',
      createdAt: makeDate(6, 9, 0),
      updatedAt: makeDate(6, 9, 0),
    },
    {
      id: 'tx-4b',
      type: 'expense',
      amount: 150000,
      categoryId: 'cat-transport',
      budgetGroup: 'kebutuhan',
      walletId: 'wallet-gopay',
      date: makeDate(4, 8, 0),
      note: 'Transportasi',
      createdAt: makeDate(4, 8, 0),
      updatedAt: makeDate(4, 8, 0),
    },
    {
      id: 'tx-2b',
      type: 'expense',
      amount: 375000,
      categoryId: 'cat-makan',
      budgetGroup: 'kebutuhan',
      walletId: 'wallet-bca',
      date: makeDate(2, 11, 0),
      note: 'Belanja Bulanan',
      createdAt: makeDate(2, 11, 0),
      updatedAt: makeDate(2, 11, 0),
    },
    {
      id: 'tx-14',
      type: 'expense',
      amount: 200000,
      categoryId: 'cat-listrik',
      budgetGroup: 'kebutuhan',
      walletId: 'wallet-bca',
      date: makeDate(1, 8, 30),
      note: 'Listrik Rumah',
      createdAt: makeDate(1, 8, 30),
      updatedAt: makeDate(1, 8, 30),
    },
    {
      id: 'tx-16',
      type: 'expense',
      amount: 300000,
      categoryId: 'cat-ortu',
      budgetGroup: 'kebutuhan',
      walletId: 'wallet-bca',
      date: makeDate(1, 10, 0),
      note: 'Uang Bulanan Orang Tua',
      createdAt: makeDate(1, 10, 0),
      updatedAt: makeDate(1, 10, 0),
    },
    {
      id: 'tx-18',
      type: 'expense',
      amount: 78000,
      categoryId: 'cat-bpjs',
      budgetGroup: 'kebutuhan',
      walletId: 'wallet-bca',
      date: makeDate(1, 10, 30),
      note: 'BPJS Kesehatan',
      createdAt: makeDate(1, 10, 30),
      updatedAt: makeDate(1, 10, 30),
    },
    {
      id: 'tx-19',
      type: 'expense',
      amount: 50000,
      categoryId: 'cat-sedekah',
      budgetGroup: 'kebutuhan',
      walletId: 'wallet-cash',
      date: makeDate(1, 11, 0),
      note: 'Sedekah',
      createdAt: makeDate(1, 11, 0),
      updatedAt: makeDate(1, 11, 0),
    },
    {
      id: 'tx-20',
      type: 'expense',
      amount: 38000,
      categoryId: 'cat-belanja',
      budgetGroup: 'keinginan',
      walletId: 'wallet-bca',
      date: makeDate(1, 12, 0),
      note: 'Belanja Online',
      createdAt: makeDate(1, 12, 0),
      updatedAt: makeDate(1, 12, 0),
    },
    {
      id: 'tx-17',
      type: 'income',
      amount: 10000000,
      categoryId: 'cat-gaji',
      walletId: 'wallet-bca',
      date: makeDate(1, 9, 0),
      note: 'Gaji Bulanan',
      createdAt: makeDate(1, 9, 0),
      updatedAt: makeDate(1, 9, 0),
    },
  ];
}

export function getInitialBudgets(): Budget[] {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return [
    {
      id: 'budget-total-current',
      categoryId: null,
      month: currentMonth,
      limitAmount: 4000000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function loadStoredWallets(): Wallet[] {
  if (typeof window === 'undefined') return DEFAULT_WALLETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WALLETS);
    if (!raw) {
      saveStoredWallets(DEFAULT_WALLETS);
      return DEFAULT_WALLETS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load wallets from localStorage:', err);
    return DEFAULT_WALLETS;
  }
}

export function saveStoredWallets(wallets: Wallet[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  } catch (err) {
    console.error('Failed to save wallets to localStorage:', err);
  }
}

export function loadStoredCategories(): Category[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      saveStoredCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load categories:', err);
    return DEFAULT_CATEGORIES;
  }
}

export function saveStoredCategories(categories: Category[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories:', err);
  }
}

export function loadStoredTransactions(): Transaction[] {
  if (typeof window === 'undefined') return getInitialSampleTransactions();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      const initial = getInitialSampleTransactions();
      saveStoredTransactions(initial);
      return initial;
    }
    const parsed: Transaction[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 20 || !parsed.some((t) => t.id === 'tx-20')) {
      const initial = getInitialSampleTransactions();
      saveStoredTransactions(initial);
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load transactions:', err);
    return getInitialSampleTransactions();
  }
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions:', err);
  }
}

export function loadStoredBudgets(): Budget[] {
  if (typeof window === 'undefined') return getInitialBudgets();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!raw) {
      const initial = getInitialBudgets();
      saveStoredBudgets(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load budgets:', err);
    return getInitialBudgets();
  }
}

export function saveStoredBudgets(budgets: Budget[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  } catch (err) {
    console.error('Failed to save budgets:', err);
  }
}

export function loadStoredBudgetConfig(): BudgetConfig {
  if (typeof window === 'undefined') return DEFAULT_BUDGET_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGET_CONFIG);
    if (!raw) {
      saveStoredBudgetConfig(DEFAULT_BUDGET_CONFIG);
      return DEFAULT_BUDGET_CONFIG;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load budget config:', err);
    return DEFAULT_BUDGET_CONFIG;
  }
}

export function saveStoredBudgetConfig(config: BudgetConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGET_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save budget config:', err);
  }
}

export function loadStoredGoals(): Goal[] {
  if (typeof window === 'undefined') return DEFAULT_GOALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!raw) {
      saveStoredGoals(DEFAULT_GOALS);
      return DEFAULT_GOALS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load goals:', err);
    return DEFAULT_GOALS;
  }
}

export function saveStoredGoals(goals: Goal[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  } catch (err) {
    console.error('Failed to save goals:', err);
  }
}

export function loadStoredSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveStoredSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}

export function resetStorageToZero(): void {
  saveStoredWallets(DEFAULT_WALLETS);
  saveStoredCategories(DEFAULT_CATEGORIES);
  saveStoredTransactions(getInitialSampleTransactions());
  saveStoredBudgets(getInitialBudgets());
  saveStoredBudgetConfig(DEFAULT_BUDGET_CONFIG);
  saveStoredGoals(DEFAULT_GOALS);
  saveStoredSettings(DEFAULT_SETTINGS);
}
