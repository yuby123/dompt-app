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
import { db, handleFirestoreError, OperationType } from './firebase';
import { BudgetConfig, Goal, Transaction, Wallet } from './types';
import { DEFAULT_BUDGET_CONFIG, DEFAULT_WALLETS, EMPTY_BUDGET_CONFIG } from './constants';

export interface UserProfileData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

// Register an Email & Password account directly in Cloud Firestore Database
export async function registerCloudEmailAccount(
  uid: string,
  name: string,
  email: string,
  passwordHash: string
): Promise<{ ok: true; profile: UserProfileData } | { ok: false; error: string }> {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    const now = new Date().toISOString();

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
        email: email.trim().toLowerCase(),
        displayName: name.trim() || existing.displayName || 'Pengguna Dompt',
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
      email: email.trim().toLowerCase(),
      displayName: name.trim() || 'Pengguna Dompt',
      photoURL: '',
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(userDocRef, initial);
    return { ok: true, profile: initial };
  } catch (error) {
    console.error('Error registering account in Firestore:', error);
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

    const now = new Date().toISOString();
    const updated: UserProfileData = {
      uid,
      email: data.email || email.trim().toLowerCase(),
      displayName: data.displayName || 'Pengguna Dompt',
      photoURL: data.photoURL || '',
      passwordHash,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
    await setDoc(userDocRef, updated, { merge: true });
    return { ok: true, profile: updated };
  } catch (error) {
    console.error('Error logging in account from Firestore:', error);
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Ensure user profile document exists
export async function syncUserProfile(user: User): Promise<UserProfileData> {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);
    const now = new Date().toISOString();

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
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Wallets
export async function fetchUserWallets(userId: string): Promise<Wallet[]> {
  const path = `users/${userId}/wallets`;
  try {
    const colRef = collection(db, 'users', userId, 'wallets');
    const snap = await getDocs(query(colRef));

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
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserWallet(userId: string, wallet: Wallet): Promise<void> {
  const path = `users/${userId}/wallets/${wallet.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'wallets', wallet.id);
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
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserWallet(userId: string, walletId: string): Promise<void> {
  const path = `users/${userId}/wallets/${walletId}`;
  try {
    const docRef = doc(db, 'users', userId, 'wallets', walletId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Transactions
export async function fetchUserTransactions(userId: string): Promise<Transaction[]> {
  const path = `users/${userId}/transactions`;
  try {
    const colRef = collection(db, 'users', userId, 'transactions');
    const snap = await getDocs(query(colRef));
    return snap.docs.map(docSnap => {
      const d = docSnap.data();
      return {
        id: d.id,
        type: d.type,
        amount: Number(d.amount) || 0,
        categoryId:
          d.categoryId === 'other' || d.categoryId === 'uncategorized'
            ? null
            : d.categoryId,
        budgetGroup: d.budgetGroup,
        walletId: d.walletId,
        transferWalletId: d.transferWalletId || null,
        date: d.date,
        note: d.note,
        receiptImageUrl: d.imageReceiptUrl || d.receiptImageUrl,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      } as Transaction;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserTransaction(userId: string, tx: Transaction): Promise<void> {
  const path = `users/${userId}/transactions/${tx.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'transactions', tx.id);
    const payload: Record<string, any> = {
      id: tx.id,
      userId,
      walletId: tx.walletId,
      type: tx.type,
      amount: Number(tx.amount) || 0,
      categoryId: tx.categoryId || 'uncategorized',
      date: tx.date,
      createdAt: tx.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      budgetGroup: tx.budgetGroup ? tx.budgetGroup : deleteField(),
      note: tx.note ? tx.note.substring(0, 500) : deleteField(),
      transferWalletId: tx.transferWalletId ? tx.transferWalletId : deleteField(),
      imageReceiptUrl: tx.receiptImageUrl ? tx.receiptImageUrl.substring(0, 500) : deleteField(),
    };

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserTransaction(userId: string, txId: string): Promise<void> {
  const path = `users/${userId}/transactions/${txId}`;
  try {
    const docRef = doc(db, 'users', userId, 'transactions', txId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Goals
export async function fetchUserGoals(userId: string): Promise<Goal[]> {
  const path = `users/${userId}/goals`;
  try {
    const colRef = collection(db, 'users', userId, 'goals');
    const snap = await getDocs(query(colRef));
    return snap.docs.map(docSnap => {
      const d = docSnap.data();
      return {
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
      } as Goal;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserGoal(userId: string, goal: Goal): Promise<void> {
  const path = `users/${userId}/goals/${goal.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'goals', goal.id);
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

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserGoal(userId: string, goalId: string): Promise<void> {
  const path = `users/${userId}/goals/${goalId}`;
  try {
    const docRef = doc(db, 'users', userId, 'goals', goalId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Budget Config
export async function fetchUserBudgetConfig(userId: string): Promise<BudgetConfig | null> {
  const path = `users/${userId}/budgetConfig/main`;
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
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserBudgetConfig(userId: string, config: BudgetConfig): Promise<void> {
  const path = `users/${userId}/budgetConfig/main`;
  try {
    const docRef = doc(db, 'users', userId, 'budgetConfig', 'main');
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
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
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
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
}
