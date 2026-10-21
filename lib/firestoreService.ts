import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  deleteField,
  query,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { auth, db, handleFirestoreError, isFirestoreOfflineError, OperationType } from './firebase';
import { BudgetConfig, Debt, Goal, RecurringItem, Transaction, Wallet } from './types';
import { EMPTY_BUDGET_CONFIG } from './constants';
import {
  loadStoredBudgetConfig,
  loadStoredDebts,
  loadStoredGoals,
  loadStoredTransactions,
  loadStoredWallets,
} from './storage';

export interface UserProfileData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

async function cloudRestApi(
  action: 'get' | 'list' | 'set' | 'delete',
  path: string,
  data?: Record<string, any>,
  merge = true
): Promise<any> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/cloud-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, path, data, merge }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Register an Email & Password account directly in Cloud Firestore Database
export async function registerCloudEmailAccount(
  uid: string,
  name: string,
  email: string,
  passwordHash: string
): Promise<{ ok: true; profile: UserProfileData } | { ok: false; error: string }> {
  const path = `users/${uid}`;
  const now = new Date().toISOString();
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || 'Pengguna Dompt';

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const existing = snap.data() as UserProfileData;
      if (existing.passwordHash && existing.passwordHash !== passwordHash) {
        return {
          ok: false,
          error: 'Email ini sudah terdaftar. Silakan masuk menggunakan email dan password Anda.',
        };
      }
      const updated: UserProfileData = {
        uid,
        email: cleanEmail,
        displayName: cleanName || existing.displayName || 'Pengguna Dompt',
        photoURL: existing.photoURL || '',
        passwordHash,
        createdAt: existing.createdAt || now,
        updatedAt: now,
      };
      await setDoc(userDocRef, updated, { merge: true });
      return { ok: true, profile: updated };
    }

    const initial: UserProfileData = {
      uid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: '',
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(userDocRef, initial);
    return { ok: true, profile: initial };
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const getRes = await cloudRestApi('get', path);
      if (getRes?.ok && getRes.exists && getRes.data) {
        const existing = getRes.data as UserProfileData;
        if (existing.passwordHash && existing.passwordHash !== passwordHash) {
          return {
            ok: false,
            error: 'Email ini sudah terdaftar. Silakan masuk menggunakan email dan password Anda.',
          };
        }
        const updated: UserProfileData = {
          uid,
          email: cleanEmail,
          displayName: cleanName || existing.displayName || 'Pengguna Dompt',
          photoURL: existing.photoURL || '',
          passwordHash,
          createdAt: existing.createdAt || now,
          updatedAt: now,
        };
        await cloudRestApi('set', path, updated, true);
        return { ok: true, profile: updated };
      }

      const initial: UserProfileData = {
        uid,
        email: cleanEmail,
        displayName: cleanName,
        photoURL: '',
        passwordHash,
        createdAt: now,
        updatedAt: now,
      };
      const setRes = await cloudRestApi('set', path, initial, false);
      if (setRes?.ok) {
        return { ok: true, profile: initial };
      }
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Login an Email & Password account directly from Cloud Firestore Database (works across PC, HP, Tablet)
export async function loginCloudEmailAccount(
  uid: string,
  email: string,
  passwordHash: string
): Promise<{ ok: true; profile: UserProfileData } | { ok: false; error: string; notFound?: boolean }> {
  const path = `users/${uid}`;
  const now = new Date().toISOString();
  const cleanEmail = email.trim().toLowerCase();

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      return {
        ok: false,
        notFound: true,
        error: 'Akun dengan email ini belum terdaftar di Database. Silakan klik tab "Daftar Baru" terlebih dahulu.',
      };
    }

    const data = snap.data() as UserProfileData;
    if (data.passwordHash && data.passwordHash !== passwordHash) {
      return {
        ok: false,
        error: 'Password yang Anda masukkan salah. Silakan periksa kembali.',
      };
    }

    const updated: UserProfileData = {
      uid,
      email: data.email || cleanEmail,
      displayName: data.displayName || 'Pengguna Dompt',
      photoURL: data.photoURL || '',
      passwordHash,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
    await setDoc(userDocRef, updated, { merge: true });
    return { ok: true, profile: updated };
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const getRes = await cloudRestApi('get', path);
      if (getRes?.ok) {
        if (!getRes.exists || !getRes.data) {
          return {
            ok: false,
            notFound: true,
            error: 'Akun dengan email ini belum terdaftar di Database. Silakan klik tab "Daftar Baru" terlebih dahulu.',
          };
        }
        const data = getRes.data as UserProfileData;
        if (data.passwordHash && data.passwordHash !== passwordHash) {
          return {
            ok: false,
            error: 'Password yang Anda masukkan salah. Silakan periksa kembali.',
          };
        }
        const updated: UserProfileData = {
          uid,
          email: data.email || cleanEmail,
          displayName: data.displayName || 'Pengguna Dompt',
          photoURL: data.photoURL || '',
          passwordHash,
          createdAt: data.createdAt || now,
          updatedAt: now,
        };
        await cloudRestApi('set', path, updated, true);
        return { ok: true, profile: updated };
      }
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Ensure user profile document exists
export async function syncUserProfile(user: User): Promise<UserProfileData> {
  const path = `users/${user.uid}`;
  const now = new Date().toISOString();
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data() as UserProfileData;
      const updated: UserProfileData = {
        uid: user.uid,
        email: user.email || data.email || 'user@example.com',
        displayName: user.displayName || data.displayName || 'Pengguna Dompt',
        photoURL: user.photoURL || data.photoURL || '',
        ...(data.passwordHash ? { passwordHash: data.passwordHash } : {}),
        createdAt: data.createdAt || now,
        updatedAt: now,
      };
      await setDoc(userDocRef, updated, { merge: true });
      return updated;
    } else {
      const initial: UserProfileData = {
        uid: user.uid,
        email: user.email || 'user@example.com',
        displayName: user.displayName || 'Pengguna Dompt',
        photoURL: user.photoURL || '',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userDocRef, initial);
      return initial;
    }
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const fallback: UserProfileData = {
        uid: user.uid,
        email: user.email || 'user@example.com',
        displayName: user.displayName || 'Pengguna Dompt',
        photoURL: user.photoURL || '',
        createdAt: now,
        updatedAt: now,
      };
      await cloudRestApi('set', path, fallback, true);
      return fallback;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Wallets
export async function fetchUserWallets(userId: string): Promise<Wallet[]> {
  const path = `users/${userId}/wallets`;
  const createCleanWallets = async (): Promise<Wallet[]> => {
    const initialWallets: Wallet[] = [
      {
        id: `wallet-cash-${Date.now()}`,
        name: 'Dompet Tunai',
        type: 'cash',
        initialBalance: 0,
        reservedAmount: 0,
        color: '#16A34A',
        icon: 'wallet',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `wallet-bank-${Date.now() + 1}`,
        name: 'Rekening Bank',
        type: 'bank',
        initialBalance: 0,
        reservedAmount: 0,
        color: '#005E9E',
        icon: 'landmark',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    for (const w of initialWallets) {
      await saveUserWallet(userId, w);
    }
    return initialWallets;
  };

  try {
    const colRef = collection(db, 'users', userId, 'wallets');
    const snap = await getDocs(query(colRef));

    if (snap.empty) {
      return await createCleanWallets();
    }

    const wallets = snap.docs.map(docSnap => docSnap.data() as Wallet);

    // If account was seeded with old demo template balances (e.g. BCA 19.115.000)
    if (wallets.some(w => w.id === 'wallet-bca' && w.initialBalance === 19115000)) {
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      return await createCleanWallets();
    }

    return wallets;
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const listRes = await cloudRestApi('list', path);
      if (listRes?.ok && Array.isArray(listRes.docs)) {
        if (listRes.docs.length === 0) {
          return await createCleanWallets();
        }
        return listRes.docs as Wallet[];
      }
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserWallet(userId: string, wallet: Wallet): Promise<void> {
  const path = `users/${userId}/wallets/${wallet.id}`;
  const payload = {
    id: wallet.id,
    userId,
    name: wallet.name,
    type: wallet.type,
    icon: wallet.icon || 'wallet',
    color: wallet.color || '#10b981',
    initialBalance: Number(wallet.initialBalance) || 0,
    reservedAmount: Number(wallet.reservedAmount) || 0,
    createdAt: wallet.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  try {
    const docRef = doc(db, 'users', userId, 'wallets', wallet.id);
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const setRes = await cloudRestApi('set', path, payload, true);
      if (setRes?.ok) return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserWallet(userId: string, walletId: string): Promise<void> {
  const path = `users/${userId}/wallets/${walletId}`;
  try {
    const docRef = doc(db, 'users', userId, 'wallets', walletId);
    await deleteDoc(docRef);
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const delRes = await cloudRestApi('delete', path);
      if (delRes?.ok) return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Transactions
export async function fetchUserTransactions(userId: string): Promise<Transaction[]> {
  const path = `users/${userId}/transactions`;
  const mapTxDoc = (d: any): Transaction => ({
    id: d.id,
    type: d.type,
    amount: Number(d.amount) || 0,
    categoryId:
      d.categoryId === 'other' || d.categoryId === 'uncategorized'
        ? null
        : d.categoryId,
    budgetGroup: d.budgetGroup,
    expenseNature: d.expenseNature || undefined,
    walletId: d.walletId,
    transferWalletId: d.transferWalletId || null,
    date: d.date,
    note: d.note,
    receiptImageUrl: d.imageReceiptUrl || d.receiptImageUrl,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  });

  try {
    const colRef = collection(db, 'users', userId, 'transactions');
    const snap = await getDocs(query(colRef));
    return snap.docs.map(docSnap => mapTxDoc(docSnap.data()));
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const listRes = await cloudRestApi('list', path);
      if (listRes?.ok && Array.isArray(listRes.docs)) {
        return listRes.docs.map(mapTxDoc);
      }
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserTransaction(userId: string, tx: Transaction): Promise<void> {
  const path = `users/${userId}/transactions/${tx.id}`;
  const restPayload: Record<string, any> = {
    id: tx.id,
    userId,
    walletId: tx.walletId,
    type: tx.type,
    amount: Number(tx.amount) || 0,
    categoryId: tx.categoryId || 'uncategorized',
    date: tx.date,
    createdAt: tx.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...(tx.budgetGroup ? { budgetGroup: tx.budgetGroup } : {}),
    ...(tx.expenseNature ? { expenseNature: tx.expenseNature } : {}),
    ...(tx.note ? { note: tx.note.substring(0, 500) } : {}),
    ...(tx.transferWalletId ? { transferWalletId: tx.transferWalletId } : {}),
    ...(tx.receiptImageUrl ? { imageReceiptUrl: tx.receiptImageUrl.substring(0, 500) } : {}),
  };

  try {
    const docRef = doc(db, 'users', userId, 'transactions', tx.id);
    const payload: Record<string, any> = {
      ...restPayload,
      budgetGroup: tx.budgetGroup ? tx.budgetGroup : deleteField(),
      expenseNature: tx.expenseNature ? tx.expenseNature : deleteField(),
      note: tx.note ? tx.note.substring(0, 500) : deleteField(),
      transferWalletId: tx.transferWalletId ? tx.transferWalletId : deleteField(),
      imageReceiptUrl: tx.receiptImageUrl ? tx.receiptImageUrl.substring(0, 500) : deleteField(),
    };

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const setRes = await cloudRestApi('set', path, restPayload, false);
      if (setRes?.ok) return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserTransaction(userId: string, txId: string): Promise<void> {
  const path = `users/${userId}/transactions/${txId}`;
  try {
    const docRef = doc(db, 'users', userId, 'transactions', txId);
    await deleteDoc(docRef);
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const delRes = await cloudRestApi('delete', path);
      if (delRes?.ok) return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Goals
export async function fetchUserGoals(userId: string): Promise<Goal[]> {
  const path = `users/${userId}/goals`;
  const mapGoalDoc = (d: any): Goal => ({
    id: d.id,
    name: d.title || d.name || 'Target Tabungan',
    targetAmount: Number(d.targetAmount) || 0,
    currentAmount: Number(d.currentAmount) || 0,
    targetDate: d.deadline || d.targetDate || '2026-12-31',
    emoji: d.emoji || '🎯',
    walletId: d.walletId || '',
    isEmergencyFund: Boolean(d.isEmergencyFund),
    isLocked: Boolean(d.isLocked),
    monthlyTargetSaving: Number(d.monthlyTargetSaving) || Math.round((Number(d.targetAmount) || 0) / 12),
  });

  try {
    const colRef = collection(db, 'users', userId, 'goals');
    const snap = await getDocs(query(colRef));
    return snap.docs.map(docSnap => mapGoalDoc(docSnap.data()));
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const listRes = await cloudRestApi('list', path);
      if (listRes?.ok && Array.isArray(listRes.docs)) {
        return listRes.docs.map(mapGoalDoc);
      }
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserGoal(userId: string, goal: Goal): Promise<void> {
  const path = `users/${userId}/goals/${goal.id}`;
  const payload: Record<string, any> = {
    id: goal.id,
    userId,
    title: goal.name || 'Target Tabungan',
    targetAmount: Number(goal.targetAmount) || 0,
    currentAmount: Number(goal.currentAmount) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (goal.targetDate) payload.deadline = goal.targetDate;
  if (goal.emoji) payload.emoji = goal.emoji;
  if (goal.walletId) payload.walletId = goal.walletId;
  if (goal.isEmergencyFund !== undefined) payload.isEmergencyFund = Boolean(goal.isEmergencyFund);
  if (goal.monthlyTargetSaving !== undefined) payload.monthlyTargetSaving = Number(goal.monthlyTargetSaving) || 0;
  if (goal.isLocked !== undefined) payload.isLocked = Boolean(goal.isLocked);

  try {
    const docRef = doc(db, 'users', userId, 'goals', goal.id);
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const setRes = await cloudRestApi('set', path, payload, true);
      if (setRes?.ok) return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserGoal(userId: string, goalId: string): Promise<void> {
  const path = `users/${userId}/goals/${goalId}`;
  try {
    const docRef = doc(db, 'users', userId, 'goals', goalId);
    await deleteDoc(docRef);
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const delRes = await cloudRestApi('delete', path);
      if (delRes?.ok) return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Budget Config
export async function fetchUserBudgetConfig(userId: string): Promise<BudgetConfig | null> {
  const path = `users/${userId}/budgetConfig/main`;
  const parseBudgetData = (data: Record<string, any>): BudgetConfig => {
    let parsedSubcategories = [];
    if (data.subcategoriesJson) {
      try {
        parsedSubcategories = JSON.parse(data.subcategoriesJson);
      } catch {
        parsedSubcategories = [];
      }
    }
    return {
      estimatedIncome: Number(data.estimatedIncome) || 0,
      needsPercent: Number(data.needsPercent) || 50,
      wantsPercent: Number(data.wantsPercent) || 30,
      savingsPercent: Number(data.savingsPercent) || 20,
      subcategories: Array.isArray(parsedSubcategories) ? parsedSubcategories : [],
    };
  };

  try {
    const docRef = doc(db, 'users', userId, 'budgetConfig', 'main');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await saveUserBudgetConfig(userId, EMPTY_BUDGET_CONFIG);
      return EMPTY_BUDGET_CONFIG;
    }
    const data = snap.data();
    // Only sanitize if it was the legacy schema without subcategoriesJson and had the old 5,000,000 template
    if (!('subcategoriesJson' in data) && data.estimatedIncome === 5000000) {
      await saveUserBudgetConfig(userId, EMPTY_BUDGET_CONFIG);
      return EMPTY_BUDGET_CONFIG;
    }
    return parseBudgetData(data);
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const getRes = await cloudRestApi('get', path);
      if (getRes?.ok) {
        if (!getRes.exists || !getRes.data) {
          await saveUserBudgetConfig(userId, EMPTY_BUDGET_CONFIG);
          return EMPTY_BUDGET_CONFIG;
        }
        return parseBudgetData(getRes.data);
      }
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserBudgetConfig(userId: string, config: BudgetConfig): Promise<void> {
  const path = `users/${userId}/budgetConfig/main`;
  const payload = {
    id: 'main',
    userId,
    estimatedIncome: Number(config.estimatedIncome) || 0,
    needsPercent: Number(config.needsPercent) || 50,
    wantsPercent: Number(config.wantsPercent) || 30,
    savingsPercent: Number(config.savingsPercent) || 20,
    subcategoriesJson: JSON.stringify(config.subcategories || []).substring(0, 10000),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, 'users', userId, 'budgetConfig', 'main');
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const setRes = await cloudRestApi('set', path, payload, true);
      if (setRes?.ok) return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Debts & Cicilan
export async function fetchUserDebts(userId: string): Promise<Debt[]> {
  const path = `users/${userId}/debts`;
  const mapDebtDoc = (d: any): Debt => {
    let payments = [];
    if (d.paymentsJson) {
      try {
        payments = JSON.parse(d.paymentsJson);
      } catch {}
    } else if (Array.isArray(d.payments)) {
      payments = d.payments;
    }

    return {
      id: d.id,
      name: d.name || 'Utang / Tagihan',
      type: d.type === 'receivable' ? 'receivable' : 'payable',
      contactName: d.contactName || 'Pihak Terkait',
      totalAmount: Number(d.totalAmount) || 0,
      remainingAmount: Number(d.remainingAmount) !== undefined ? Number(d.remainingAmount) : (Number(d.totalAmount) || 0),
      dueDate: d.dueDate || '',
      startDate: d.startDate || '',
      walletId: d.walletId || undefined,
      category: d.category || 'cicilan',
      interestRate: Number(d.interestRate) || 0,
      status: d.status === 'paid' || Number(d.remainingAmount) <= 0 ? 'paid' : 'active',
      note: d.note || '',
      payments,
      createdAt: d.createdAt || new Date().toISOString(),
      updatedAt: d.updatedAt || new Date().toISOString(),
    };
  };

  try {
    const colRef = collection(db, 'users', userId, 'debts');
    const snap = await getDocs(query(colRef));
    return snap.docs.map((docSnap) => mapDebtDoc(docSnap.data()));
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const listRes = await cloudRestApi('list', path);
      if (listRes?.ok && Array.isArray(listRes.docs)) {
        return listRes.docs.map(mapDebtDoc);
      }
    }
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function saveUserDebt(userId: string, debt: Debt): Promise<void> {
  const path = `users/${userId}/debts/${debt.id}`;
  const restPayload: Record<string, any> = {
    id: debt.id,
    userId,
    name: debt.name,
    type: debt.type,
    contactName: debt.contactName || 'Pihak Terkait',
    totalAmount: Number(debt.totalAmount) || 0,
    remainingAmount: Number(debt.remainingAmount) || 0,
    dueDate: debt.dueDate || '',
    status: debt.status,
    paymentsJson: JSON.stringify(debt.payments || []).substring(0, 20000),
    createdAt: debt.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...(debt.startDate ? { startDate: debt.startDate } : {}),
    ...(debt.walletId ? { walletId: debt.walletId } : {}),
    ...(debt.category ? { category: debt.category } : {}),
    ...(debt.interestRate ? { interestRate: Number(debt.interestRate) } : {}),
    ...(debt.note ? { note: debt.note.substring(0, 500) } : {}),
  };

  try {
    const docRef = doc(db, 'users', userId, 'debts', debt.id);
    await setDoc(docRef, restPayload, { merge: true });
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const setRes = await cloudRestApi('set', path, restPayload, true);
      if (setRes?.ok) return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserDebt(userId: string, debtId: string): Promise<void> {
  const path = `users/${userId}/debts/${debtId}`;
  try {
    const docRef = doc(db, 'users', userId, 'debts', debtId);
    await deleteDoc(docRef);
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const delRes = await cloudRestApi('delete', path);
      if (delRes?.ok) return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Subscriptions & Recurring Bills
export async function fetchUserSubscriptions(userId: string): Promise<RecurringItem[]> {
  const path = `users/${userId}/subscriptions`;
  const mapSubDoc = (d: any): RecurringItem => ({
    id: d.id,
    name: d.name || 'Langganan',
    emoji: d.emoji || (d.type === 'income' ? '💰' : '🔁'),
    type: d.type === 'income' ? 'income' : 'expense',
    amount: Number(d.amount) || 0,
    frequency:
      d.frequency === 'yearly' || d.frequency === 'weekly' ? d.frequency : 'monthly',
    billingDay: Number(d.billingDay) || 1,
    walletId: d.walletId || 'wallet-cash',
    categoryId: d.categoryId || (d.type === 'income' ? 'cat-gaji' : 'cat-tagihan'),
    subcategoryId: d.subcategoryId || undefined,
    budgetGroup:
      d.budgetGroup === 'kebutuhan' ||
      d.budgetGroup === 'keinginan' ||
      d.budgetGroup === 'tabungan'
        ? d.budgetGroup
        : undefined,
    isActive: d.isActive !== undefined ? Boolean(d.isActive) : true,
    lastRecordedPeriod: d.lastRecordedPeriod || undefined,
  });

  try {
    const colRef = collection(db, 'users', userId, 'subscriptions');
    const snap = await getDocs(query(colRef));
    return snap.docs.map((docSnap) => mapSubDoc(docSnap.data()));
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const listRes = await cloudRestApi('list', path);
      if (listRes?.ok && Array.isArray(listRes.docs)) {
        return listRes.docs.map(mapSubDoc);
      }
    }
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function saveUserSubscription(
  userId: string,
  item: RecurringItem
): Promise<void> {
  const path = `users/${userId}/subscriptions/${item.id}`;
  const restPayload: Record<string, any> = {
    id: item.id,
    userId,
    name: item.name,
    emoji: item.emoji || (item.type === 'income' ? '💰' : '🔁'),
    type: item.type,
    amount: Number(item.amount) || 0,
    frequency: item.frequency || 'monthly',
    billingDay: Number(item.billingDay) || 1,
    walletId: item.walletId || 'wallet-cash',
    categoryId: item.categoryId || (item.type === 'income' ? 'cat-gaji' : 'cat-tagihan'),
    isActive: Boolean(item.isActive),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...(item.subcategoryId ? { subcategoryId: item.subcategoryId } : {}),
    ...(item.budgetGroup ? { budgetGroup: item.budgetGroup } : {}),
    ...(item.lastRecordedPeriod
      ? { lastRecordedPeriod: item.lastRecordedPeriod }
      : {}),
  };

  try {
    const docRef = doc(db, 'users', userId, 'subscriptions', item.id);
    const payload: Record<string, any> = {
      ...restPayload,
      subcategoryId: item.subcategoryId ? item.subcategoryId : deleteField(),
      budgetGroup: item.budgetGroup ? item.budgetGroup : deleteField(),
      lastRecordedPeriod: item.lastRecordedPeriod
        ? item.lastRecordedPeriod
        : deleteField(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const setRes = await cloudRestApi('set', path, restPayload, false);
      if (setRes?.ok) return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserSubscription(
  userId: string,
  subscriptionId: string
): Promise<void> {
  const path = `users/${userId}/subscriptions/${subscriptionId}`;
  try {
    const docRef = doc(db, 'users', userId, 'subscriptions', subscriptionId);
    await deleteDoc(docRef);
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const delRes = await cloudRestApi('delete', path);
      if (delRes?.ok) return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Reset all user data in Firestore
export async function resetUserFirestoreData(userId: string): Promise<Wallet[]> {
  try {
    // 1. Delete all transactions
    const txCol = collection(db, 'users', userId, 'transactions');
    const txSnap = await getDocs(query(txCol));
    for (const d of txSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 2. Delete all goals
    const goalCol = collection(db, 'users', userId, 'goals');
    const goalSnap = await getDocs(query(goalCol));
    for (const d of goalSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 2.5 Delete all debts
    const debtCol = collection(db, 'users', userId, 'debts');
    const debtSnap = await getDocs(query(debtCol));
    for (const d of debtSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 2.6 Delete all subscriptions
    const subCol = collection(db, 'users', userId, 'subscriptions');
    const subSnap = await getDocs(query(subCol));
    for (const d of subSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 3. Reset wallets: delete existing and create 1 clean default wallet
    const walletCol = collection(db, 'users', userId, 'wallets');
    const walletSnap = await getDocs(query(walletCol));
    for (const d of walletSnap.docs) {
      await deleteDoc(d.ref);
    }

    const cleanWallet: Wallet = {
      id: `wallet-cash-${Date.now()}`,
      name: 'Dompet Utama',
      type: 'cash',
      initialBalance: 0,
      reservedAmount: 0,
      color: '#10b981',
      icon: 'wallet',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveUserWallet(userId, cleanWallet);

    // 4. Reset budget config
    await saveUserBudgetConfig(userId, EMPTY_BUDGET_CONFIG);

    return [cleanWallet];
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      const cleanWallet: Wallet = {
        id: `wallet-cash-${Date.now()}`,
        name: 'Dompet Utama',
        type: 'cash',
        initialBalance: 0,
        reservedAmount: 0,
        color: '#10b981',
        icon: 'wallet',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveUserWallet(userId, cleanWallet);
      await saveUserBudgetConfig(userId, EMPTY_BUDGET_CONFIG);
      return [cleanWallet];
    }
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
}
