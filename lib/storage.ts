import { AppSettings, Budget, BudgetConfig, Category, Goal, Transaction, Wallet } from './types';
import {
  DEFAULT_BUDGET_CONFIG,
  DEFAULT_CATEGORIES,
  DEFAULT_GOALS,
  DEFAULT_SETTINGS,
  DEFAULT_WALLETS,
  EMPTY_BUDGET_CONFIG,
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
    const dd = String(day).padStart(2, '0');
    const hh = String(hour).padStart(2, '0');
    const mm = String(min).padStart(2, '0');
    return `2026-03-${dd}T${hh}:${mm}:00`;
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
  return [
    {
      id: 'budget-total-current',
      categoryId: null,
      month: '2026-03',
      limitAmount: 4000000,
      createdAt: '2026-03-01T00:00:00',
      updatedAt: '2026-03-01T00:00:00',
    },
  ];
}

export interface LocalAccountProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  isLocalAccount: true;
  createdAt: string;
}

export interface RegisteredAccountRecord extends LocalAccountProfile {
  passwordHash: string;
}

const ACTIVE_LOCAL_USER_KEY = 'budggt_active_local_user';
const LOCAL_ACCOUNTS_LIST_KEY = 'budggt_local_accounts_list';
const REGISTERED_ACCOUNTS_KEY = 'budggt_registered_accounts_v1';

function hashPassword(email: string, password: string): string {
  const normalized = `dompt_v1_${email.trim().toLowerCase()}::${password}`;
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(encodeURIComponent(normalized));
  }
  return normalized;
}

export function loadRegisteredAccounts(): RegisteredAccountRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRegisteredAccounts(records: RegisteredAccountRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save registered accounts:', err);
  }
}

export function registerAccountWithPassword(
  name: string,
  email: string,
  password: string
): { ok: true; profile: LocalAccountProfile } | { ok: false; error: string } {
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

  const accounts = loadRegisteredAccounts();
  const existing = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);
  if (existing) {
    return {
      ok: false,
      error: 'Email ini sudah terdaftar. Silakan masuk menggunakan email dan password Anda.',
    };
  }

  const safeId = cleanEmail.replace(/[^a-z0-9]/g, '_');
  const uid = `user_${safeId}`;
  const now = new Date().toISOString();
  const newRecord: RegisteredAccountRecord = {
    uid,
    displayName: cleanName,
    email: cleanEmail,
    passwordHash: hashPassword(cleanEmail, password),
    photoURL: null,
    isLocalAccount: true,
    createdAt: now,
  };

  saveRegisteredAccounts([newRecord, ...accounts]);
  // Initialize clean Rp 0 data for the newly registered account
  resetStorageToZero(uid);

  const profile: LocalAccountProfile = {
    uid: newRecord.uid,
    displayName: newRecord.displayName,
    email: newRecord.email,
    photoURL: null,
    isLocalAccount: true,
    createdAt: newRecord.createdAt,
  };
  saveActiveLocalUser(profile);
  return { ok: true, profile };
}

export function loginAccountWithPassword(
  email: string,
  password: string
): { ok: true; profile: LocalAccountProfile } | { ok: false; error: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, error: 'Masukkan alamat email yang valid.' };
  }
  if (!password) {
    return { ok: false, error: 'Password wajib diisi.' };
  }

  const accounts = loadRegisteredAccounts();
  const matched = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);
  if (!matched) {
    return {
      ok: false,
      error: 'Akun dengan email ini belum terdaftar. Silakan klik tab "Daftar Baru" terlebih dahulu.',
    };
  }

  const expectedHash = hashPassword(cleanEmail, password);
  if (matched.passwordHash !== expectedHash) {
    return {
      ok: false,
      error: 'Password yang Anda masukkan salah. Silakan periksa kembali.',
    };
  }

  const profile: LocalAccountProfile = {
    uid: matched.uid,
    displayName: matched.displayName,
    email: matched.email,
    photoURL: matched.photoURL,
    isLocalAccount: true,
    createdAt: matched.createdAt,
  };
  saveActiveLocalUser(profile);
  return { ok: true, profile };
}

function getScopedKey(baseKey: string, scopeUid?: string): string {
  return scopeUid ? `${baseKey}_${scopeUid}` : baseKey;
}

export function getCleanDefaultWallets(): Wallet[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'wallet-cash-main',
      name: 'Dompet Tunai',
      type: 'cash',
      initialBalance: 0,
      reservedAmount: 0,
      color: '#16A34A',
      icon: 'Banknote',
      isVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'wallet-bank-main',
      name: 'Rekening Bank',
      type: 'bank',
      initialBalance: 0,
      reservedAmount: 0,
      color: '#005E9E',
      icon: 'Landmark',
      isVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function loadActiveLocalUser(): LocalAccountProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_LOCAL_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveActiveLocalUser(profile: LocalAccountProfile | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!profile) {
      localStorage.removeItem(ACTIVE_LOCAL_USER_KEY);
      return;
    }
    localStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(profile));
    const listRaw = localStorage.getItem(LOCAL_ACCOUNTS_LIST_KEY);
    const list: LocalAccountProfile[] = listRaw ? JSON.parse(listRaw) : [];
    const filtered = list.filter((item) => item.uid !== profile.uid);
    localStorage.setItem(LOCAL_ACCOUNTS_LIST_KEY, JSON.stringify([profile, ...filtered]));
  } catch (err) {
    console.error('Failed to save active local user:', err);
  }
}

export function loadSavedLocalAccounts(): LocalAccountProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function loadStoredWallets(scopeUid?: string): Wallet[] {
  if (typeof window === 'undefined') return scopeUid ? getCleanDefaultWallets() : DEFAULT_WALLETS;
  try {
    const key = getScopedKey(STORAGE_KEYS.WALLETS, scopeUid);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = scopeUid ? getCleanDefaultWallets() : DEFAULT_WALLETS;
      saveStoredWallets(initial, scopeUid);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load wallets from localStorage:', err);
    return scopeUid ? getCleanDefaultWallets() : DEFAULT_WALLETS;
  }
}

export function saveStoredWallets(wallets: Wallet[], scopeUid?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getScopedKey(STORAGE_KEYS.WALLETS, scopeUid);
    localStorage.setItem(key, JSON.stringify(wallets));
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

export function loadStoredTransactions(scopeUid?: string): Transaction[] {
  if (typeof window === 'undefined') return scopeUid ? [] : getInitialSampleTransactions();
  try {
    const key = getScopedKey(STORAGE_KEYS.TRANSACTIONS, scopeUid);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = scopeUid ? [] : getInitialSampleTransactions();
      saveStoredTransactions(initial, scopeUid);
      return initial;
    }
    const parsed: Transaction[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      const initial = scopeUid ? [] : getInitialSampleTransactions();
      saveStoredTransactions(initial, scopeUid);
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load transactions:', err);
    return scopeUid ? [] : getInitialSampleTransactions();
  }
}

export function saveStoredTransactions(transactions: Transaction[], scopeUid?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getScopedKey(STORAGE_KEYS.TRANSACTIONS, scopeUid);
    localStorage.setItem(key, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions:', err);
  }
}

export function loadStoredBudgets(scopeUid?: string): Budget[] {
  if (typeof window === 'undefined') return scopeUid ? [] : getInitialBudgets();
  try {
    const key = getScopedKey(STORAGE_KEYS.BUDGETS, scopeUid);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = scopeUid ? [] : getInitialBudgets();
      saveStoredBudgets(initial, scopeUid);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load budgets:', err);
    return scopeUid ? [] : getInitialBudgets();
  }
}

export function saveStoredBudgets(budgets: Budget[], scopeUid?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getScopedKey(STORAGE_KEYS.BUDGETS, scopeUid);
    localStorage.setItem(key, JSON.stringify(budgets));
  } catch (err) {
    console.error('Failed to save budgets:', err);
  }
}

export function loadStoredBudgetConfig(scopeUid?: string): BudgetConfig {
  if (typeof window === 'undefined') return scopeUid ? EMPTY_BUDGET_CONFIG : DEFAULT_BUDGET_CONFIG;
  try {
    const key = getScopedKey(STORAGE_KEYS.BUDGET_CONFIG, scopeUid);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = scopeUid ? EMPTY_BUDGET_CONFIG : DEFAULT_BUDGET_CONFIG;
      saveStoredBudgetConfig(initial, scopeUid);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load budget config:', err);
    return scopeUid ? EMPTY_BUDGET_CONFIG : DEFAULT_BUDGET_CONFIG;
  }
}

export function saveStoredBudgetConfig(config: BudgetConfig, scopeUid?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getScopedKey(STORAGE_KEYS.BUDGET_CONFIG, scopeUid);
    localStorage.setItem(key, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save budget config:', err);
  }
}

export function loadStoredGoals(scopeUid?: string): Goal[] {
  if (typeof window === 'undefined') return scopeUid ? [] : DEFAULT_GOALS;
  try {
    const key = getScopedKey(STORAGE_KEYS.GOALS, scopeUid);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = scopeUid ? [] : DEFAULT_GOALS;
      saveStoredGoals(initial, scopeUid);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load goals:', err);
    return scopeUid ? [] : DEFAULT_GOALS;
  }
}

export function saveStoredGoals(goals: Goal[], scopeUid?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getScopedKey(STORAGE_KEYS.GOALS, scopeUid);
    localStorage.setItem(key, JSON.stringify(goals));
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

export function clearAllData(scopeUid?: string): void {
  if (typeof window === 'undefined') return;
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(getScopedKey(k, scopeUid)));
    const suffix = scopeUid ? `_${scopeUid}` : '';
    localStorage.removeItem(`budggt_assets_liquid${suffix}`);
    localStorage.removeItem(`budggt_assets_fixed${suffix}`);
    localStorage.removeItem(`budggt_debts${suffix}`);
    localStorage.removeItem(`budggt_investments${suffix}`);
    localStorage.removeItem(`budggt_subscriptions${suffix}`);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}

export function resetStorageToZero(scopeUid?: string): void {
  const cleanWallets = getCleanDefaultWallets();
  saveStoredWallets(cleanWallets, scopeUid);
  saveStoredCategories(DEFAULT_CATEGORIES);
  saveStoredTransactions([], scopeUid);
  saveStoredBudgets([], scopeUid);
  saveStoredBudgetConfig(EMPTY_BUDGET_CONFIG, scopeUid);
  saveStoredGoals([], scopeUid);
  if (!scopeUid) {
    saveStoredSettings({ ...DEFAULT_SETTINGS, hideBalance: false });
  }
  if (typeof window !== 'undefined') {
    try {
      const suffix = scopeUid ? `_${scopeUid}` : '';
      localStorage.setItem(`budggt_assets_liquid${suffix}`, JSON.stringify([]));
      localStorage.setItem(`budggt_assets_fixed${suffix}`, JSON.stringify([]));
      localStorage.setItem(`budggt_debts${suffix}`, JSON.stringify([]));
      localStorage.setItem(`budggt_investments${suffix}`, JSON.stringify([]));
      localStorage.setItem(`budggt_subscriptions${suffix}`, JSON.stringify([]));
    } catch {
      // ignore
    }
  }
}

