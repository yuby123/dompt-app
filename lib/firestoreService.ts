import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  deleteField,
  query,
  onSnapshot,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  AppSettings,
  AssetItem,
  Budget,
  BudgetConfig,
  BudgetSubcategory,
  BugReport,
  Debt,
  Goal,
  InvestmentItem,
  ManagedUserAccount,
  RecurringItem,
  Transaction,
  UserAccountStatus,
  UserRole,
  Wallet,
} from './types';
import { EMPTY_BUDGET_CONFIG } from './constants';
import {
  DEFAULT_ADMIN_PASSWORD,
  hashAccountPassword,
  isBootstrappedAdminEmail,
} from './storage';

export interface UserProfileData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  passwordHash?: string;
  settingsJson?: string;
  role?: UserRole;
  status?: UserAccountStatus;
  approvedAt?: string;
  approvedBy?: string;
  deactivatedAt?: string;
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
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      cache: 'no-store',
      body: JSON.stringify({ action, path, data, merge }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function safeJsonParse<T>(jsonStr: unknown, fallback: T): T {
  if (typeof jsonStr !== 'string' || !jsonStr) return fallback;
  try {
    const parsed = JSON.parse(jsonStr);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

// Register an Email & Password account directly in Cloud Firestore Database
export async function registerCloudEmailAccount(
  uid: string,
  name: string,
  email: string,
  passwordHash: string,
  options?: { isNewSignup?: boolean }
): Promise<{ ok: true; profile: UserProfileData } | { ok: false; error: string }> {
  const path = `users/${uid}`;
  const now = new Date().toISOString();
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || 'Pengguna Dompt';
  const isAdminEmail = isBootstrappedAdminEmail(cleanEmail);

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const existing = snap.data() as UserProfileData;
      if (existing.passwordHash && existing.passwordHash !== passwordHash && options?.isNewSignup) {
        return {
          ok: false,
          error: 'Email ini sudah terdaftar. Silakan masuk menggunakan email dan password Anda.',
        };
      }
      const role: UserRole = isAdminEmail ? 'admin' : (existing.role || 'user');
      const status: UserAccountStatus = isAdminEmail
        ? 'active'
        : (existing.status || 'active');
      const updated: UserProfileData = {
        uid,
        email: cleanEmail,
        displayName: cleanName || existing.displayName || 'Pengguna Dompt',
        photoURL: existing.photoURL || '',
        passwordHash,
        role,
        status,
        ...(existing.approvedAt ? { approvedAt: existing.approvedAt } : {}),
        ...(existing.approvedBy ? { approvedBy: existing.approvedBy } : {}),
        ...(existing.deactivatedAt ? { deactivatedAt: existing.deactivatedAt } : {}),
        ...(existing.settingsJson ? { settingsJson: existing.settingsJson } : {}),
        createdAt: existing.createdAt || now,
        updatedAt: now,
      };
      await setDoc(userDocRef, updated, { merge: true });
      return { ok: true, profile: updated };
    }

    const initialRole: UserRole = isAdminEmail ? 'admin' : 'user';
    // Every new user registration starts as 'pending' (requires Admin ACC) unless it's an Admin email
    const initialStatus: UserAccountStatus = isAdminEmail
      ? 'active'
      : options?.isNewSignup === false
      ? 'active'
      : 'pending';

    const initial: UserProfileData = {
      uid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: '',
      passwordHash,
      role: initialRole,
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(userDocRef, initial);
    return { ok: true, profile: initial };
  } catch (error) {
    const getRes = await cloudRestApi('get', path);
    if (getRes?.ok && getRes.exists && getRes.data) {
      const existing = getRes.data as UserProfileData;
      if (existing.passwordHash && existing.passwordHash !== passwordHash && options?.isNewSignup) {
        return {
          ok: false,
          error: 'Email ini sudah terdaftar. Silakan masuk menggunakan email dan password Anda.',
        };
      }
      const role: UserRole = isAdminEmail ? 'admin' : (existing.role || 'user');
      const status: UserAccountStatus = isAdminEmail
        ? 'active'
        : (existing.status || 'active');
      const updated: UserProfileData = {
        uid,
        email: cleanEmail,
        displayName: cleanName || existing.displayName || 'Pengguna Dompt',
        photoURL: existing.photoURL || '',
        passwordHash,
        role,
        status,
        ...(existing.approvedAt ? { approvedAt: existing.approvedAt } : {}),
        ...(existing.approvedBy ? { approvedBy: existing.approvedBy } : {}),
        ...(existing.deactivatedAt ? { deactivatedAt: existing.deactivatedAt } : {}),
        ...(existing.settingsJson ? { settingsJson: existing.settingsJson } : {}),
        createdAt: existing.createdAt || now,
        updatedAt: now,
      };
      await cloudRestApi('set', path, updated, true);
      return { ok: true, profile: updated };
    }

    const initialRole: UserRole = isAdminEmail ? 'admin' : 'user';
    const initialStatus: UserAccountStatus = isAdminEmail
      ? 'active'
      : options?.isNewSignup === false
      ? 'active'
      : 'pending';

    const initial: UserProfileData = {
      uid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: '',
      passwordHash,
      role: initialRole,
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
    };
    const setRes = await cloudRestApi('set', path, initial, false);
    if (setRes?.ok) {
      return { ok: true, profile: initial };
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
  const isAdminEmail = isBootstrappedAdminEmail(cleanEmail);
  const legacyAdmin123Hash = hashAccountPassword(cleanEmail, 'admin123');
  const defaultAnton123Hash = hashAccountPassword(cleanEmail, DEFAULT_ADMIN_PASSWORD);

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      // If it's a bootstrapped admin logging in with Anton123 for the first time, provision in Firestore
      if (isAdminEmail && passwordHash === defaultAnton123Hash) {
        const initialAdmin: UserProfileData = {
          uid,
          email: cleanEmail,
          displayName: cleanEmail === 'admin@dompt.com' ? 'Admin SuperApp' : 'Admin Utama',
          photoURL: '🛡️',
          passwordHash: defaultAnton123Hash,
          role: 'admin',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(userDocRef, initialAdmin, { merge: true });
        return { ok: true, profile: initialAdmin };
      }
      return {
        ok: false,
        notFound: true,
        error: 'Akun dengan email ini belum terdaftar di Database. Silakan klik tab "Daftar Baru" terlebih dahulu.',
      };
    }

    const data = snap.data() as UserProfileData;
    const storedHash =
      isAdminEmail && (!data.passwordHash || data.passwordHash === legacyAdmin123Hash)
        ? defaultAnton123Hash
        : data.passwordHash;

    if (storedHash && storedHash !== passwordHash) {
      return {
        ok: false,
        error: 'Password yang Anda masukkan salah. Silakan periksa kembali.',
      };
    }

    // If admin had legacy admin123 hash in Firestore, persist the migrated Anton123 hash
    if (isAdminEmail && data.passwordHash !== passwordHash) {
      await setDoc(
        userDocRef,
        { passwordHash, role: 'admin', status: 'active', updatedAt: now },
        { merge: true }
      ).catch(() => {});
    }

    const role: UserRole = isAdminEmail ? 'admin' : (data.role || 'user');
    const status: UserAccountStatus = isAdminEmail ? 'active' : (data.status || 'active');

    const profile: UserProfileData = {
      uid,
      email: data.email || cleanEmail,
      displayName: data.displayName || 'Pengguna Dompt',
      photoURL: data.photoURL || '',
      passwordHash,
      role,
      status,
      ...(data.approvedAt ? { approvedAt: data.approvedAt } : {}),
      ...(data.approvedBy ? { approvedBy: data.approvedBy } : {}),
      ...(data.deactivatedAt ? { deactivatedAt: data.deactivatedAt } : {}),
      ...(data.settingsJson ? { settingsJson: data.settingsJson } : {}),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    return { ok: true, profile };
  } catch (error) {
    const getRes = await cloudRestApi('get', path);
    if (getRes?.ok) {
      if (!getRes.exists || !getRes.data) {
        if (isAdminEmail && passwordHash === defaultAnton123Hash) {
          const initialAdmin: UserProfileData = {
            uid,
            email: cleanEmail,
            displayName: cleanEmail === 'admin@dompt.com' ? 'Admin SuperApp' : 'Admin Utama',
            photoURL: '🛡️',
            passwordHash: defaultAnton123Hash,
            role: 'admin',
            status: 'active',
            createdAt: now,
            updatedAt: now,
          };
          await cloudRestApi('set', path, initialAdmin, true);
          return { ok: true, profile: initialAdmin };
        }
        return {
          ok: false,
          notFound: true,
          error: 'Akun dengan email ini belum terdaftar di Database. Silakan klik tab "Daftar Baru" terlebih dahulu.',
        };
      }
      const data = getRes.data as UserProfileData;
      const storedHash =
        isAdminEmail && (!data.passwordHash || data.passwordHash === legacyAdmin123Hash)
          ? defaultAnton123Hash
          : data.passwordHash;

      if (storedHash && storedHash !== passwordHash) {
        return {
          ok: false,
          error: 'Password yang Anda masukkan salah. Silakan periksa kembali.',
        };
      }
      if (isAdminEmail && data.passwordHash !== passwordHash) {
        await cloudRestApi(
          'set',
          path,
          { passwordHash, role: 'admin', status: 'active', updatedAt: now },
          true
        );
      }
      const role: UserRole = isAdminEmail ? 'admin' : (data.role || 'user');
      const status: UserAccountStatus = isAdminEmail ? 'active' : (data.status || 'active');
      const profile: UserProfileData = {
        uid,
        email: data.email || cleanEmail,
        displayName: data.displayName || 'Pengguna Dompt',
        photoURL: data.photoURL || '',
        passwordHash,
        role,
        status,
        ...(data.approvedAt ? { approvedAt: data.approvedAt } : {}),
        ...(data.approvedBy ? { approvedBy: data.approvedBy } : {}),
        ...(data.deactivatedAt ? { deactivatedAt: data.deactivatedAt } : {}),
        ...(data.settingsJson ? { settingsJson: data.settingsJson } : {}),
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now,
      };
      return { ok: true, profile };
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateCloudAccountPassword(
  uid: string,
  email: string,
  currentPasswordHash: string | null,
  newPasswordHash: string,
  skipCurrentCheck = false
): Promise<{ ok: boolean; error?: string }> {
  const path = `users/${uid}`;
  const now = new Date().toISOString();
  const cleanEmail = email.trim().toLowerCase();
  const isAdminEmail = isBootstrappedAdminEmail(cleanEmail);
  const legacyAdmin123Hash = hashAccountPassword(cleanEmail, 'admin123');
  const defaultAnton123Hash = hashAccountPassword(cleanEmail, DEFAULT_ADMIN_PASSWORD);

  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfileData;
      const effectiveStoredHash =
        isAdminEmail && (!data.passwordHash || data.passwordHash === legacyAdmin123Hash)
          ? defaultAnton123Hash
          : data.passwordHash;
      if (!skipCurrentCheck && currentPasswordHash && effectiveStoredHash && effectiveStoredHash !== currentPasswordHash) {
        return { ok: false, error: 'Password lama yang Anda masukkan salah.' };
      }
      await setDoc(
        docRef,
        {
          uid,
          email: cleanEmail,
          passwordHash: newPasswordHash,
          updatedAt: now,
        },
        { merge: true }
      );
      return { ok: true };
    } else {
      await setDoc(
        docRef,
        {
          uid,
          email: cleanEmail,
          displayName: isAdminEmail ? 'Admin SuperApp' : 'Pengguna Dompt',
          passwordHash: newPasswordHash,
          role: isAdminEmail ? 'admin' : 'user',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
      return { ok: true };
    }
  } catch {
    const getRes = await cloudRestApi('get', path);
    if (getRes?.ok && getRes.exists && getRes.data) {
      const data = getRes.data as UserProfileData;
      const effectiveStoredHash =
        isAdminEmail && (!data.passwordHash || data.passwordHash === legacyAdmin123Hash)
          ? defaultAnton123Hash
          : data.passwordHash;
      if (!skipCurrentCheck && currentPasswordHash && effectiveStoredHash && effectiveStoredHash !== currentPasswordHash) {
        return { ok: false, error: 'Password lama yang Anda masukkan salah.' };
      }
    }
    const setRes = await cloudRestApi(
      'set',
      path,
      {
        uid,
        email: cleanEmail,
        passwordHash: newPasswordHash,
        updatedAt: now,
      },
      true
    );
    return { ok: Boolean(setRes?.ok) };
  }
}

// Update user profile metadata & settings in Cloud Firestore
export async function updateCloudUserProfile(
  uid: string,
  email: string,
  displayName: string,
  settings?: Partial<AppSettings>
): Promise<void> {
  const path = `users/${uid}`;
  const now = new Date().toISOString();
  const payload: Record<string, any> = {
    uid,
    email: email.trim().toLowerCase() || 'user@example.com',
    displayName: displayName.trim().substring(0, 120) || 'Pengguna Dompt',
    updatedAt: now,
  };
  if (settings) {
    payload.settingsJson = JSON.stringify(settings).substring(0, 9500);
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      payload.createdAt = now;
    }
    await setDoc(userDocRef, payload, { merge: true });
  } catch (error) {
    const setRes = await cloudRestApi('set', path, payload, true);
    if (setRes?.ok) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Ensure user profile document exists
export async function syncUserProfile(user: User): Promise<UserProfileData> {
  const path = `users/${user.uid}`;
  const now = new Date().toISOString();
  const cleanEmail = (user.email || 'user@example.com').trim().toLowerCase();
  const isAdminEmail = isBootstrappedAdminEmail(cleanEmail);

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data() as UserProfileData;
      const role: UserRole = isAdminEmail ? 'admin' : (data.role || 'user');
      const status: UserAccountStatus = isAdminEmail ? 'active' : (data.status || 'active');
      const updated: UserProfileData = {
        uid: user.uid,
        email: cleanEmail || data.email || 'user@example.com',
        displayName: data.displayName || user.displayName || 'Pengguna Dompt',
        photoURL: user.photoURL || data.photoURL || '',
        role,
        status,
        ...(data.approvedAt ? { approvedAt: data.approvedAt } : {}),
        ...(data.approvedBy ? { approvedBy: data.approvedBy } : {}),
        ...(data.deactivatedAt ? { deactivatedAt: data.deactivatedAt } : {}),
        ...(data.passwordHash ? { passwordHash: data.passwordHash } : {}),
        ...(data.settingsJson ? { settingsJson: data.settingsJson } : {}),
        createdAt: data.createdAt || now,
        updatedAt: now,
      };
      await setDoc(userDocRef, updated, { merge: true });
      return updated;
    } else {
      const initial: UserProfileData = {
        uid: user.uid,
        email: cleanEmail,
        displayName: user.displayName || 'Pengguna Dompt',
        photoURL: user.photoURL || '',
        role: isAdminEmail ? 'admin' : 'user',
        status: isAdminEmail ? 'active' : 'pending',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userDocRef, initial);
      return initial;
    }
  } catch (error) {
    const fallback: UserProfileData = {
      uid: user.uid,
      email: cleanEmail,
      displayName: user.displayName || 'Pengguna Dompt',
      photoURL: user.photoURL || '',
      role: isAdminEmail ? 'admin' : 'user',
      status: isAdminEmail ? 'active' : 'active',
      createdAt: now,
      updatedAt: now,
    };
    const setRes = await cloudRestApi('set', path, fallback, true);
    if (setRes?.ok) return fallback;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch single user profile from Cloud Firestore
export async function fetchCloudUserProfile(uid: string): Promise<UserProfileData | null> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfileData;
  } catch {
    const getRes = await cloudRestApi('get', path);
    if (getRes?.ok && getRes.exists && getRes.data) {
      return getRes.data as UserProfileData;
    }
    return null;
  }
}

// Real-time subscription to a user's own profile (for live ACC / deactivation status updates)
export function subscribeToUserProfileStatus(
  uid: string,
  onUpdate: (profile: UserProfileData) => void
): () => void {
  if (!uid || typeof window === 'undefined') return () => {};
  try {
    const docRef = doc(db, 'users', uid);
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) return;
        onUpdate(snap.data() as UserProfileData);
      },
      () => {
        // Ignore snapshot error; fallback polling handles it
      }
    );
  } catch {
    return () => {};
  }
}

function mapDocToManagedUser(d: any): ManagedUserAccount {
  const email = (d.email || '').trim().toLowerCase();
  const isAdmin = isBootstrappedAdminEmail(email) || d.role === 'admin';
  const role: UserRole = isAdmin ? 'admin' : 'user';
  const status: UserAccountStatus = isAdmin ? 'active' : (d.status || 'active');
  return {
    uid: d.uid || '',
    email: email || 'user@dompt.com',
    displayName: d.displayName || 'Pengguna Dompt',
    photoURL: d.photoURL || null,
    role,
    status,
    approvedAt: d.approvedAt || undefined,
    approvedBy: d.approvedBy || undefined,
    deactivatedAt: d.deactivatedAt || undefined,
    createdAt: d.createdAt || new Date().toISOString(),
    updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
  };
}

// Fetch all registered user accounts from Cloud Firestore (for Admin Dashboard)
export async function fetchAllCloudUsers(): Promise<ManagedUserAccount[]> {
  try {
    const colRef = collection(db, 'users');
    const snap = await getDocs(query(colRef));
    return snap.docs
      .map((docSnap) => mapDocToManagedUser({ uid: docSnap.id, ...docSnap.data() }))
      .filter((u) => Boolean(u.uid && u.email));
  } catch {
    const listRes = await cloudRestApi('list', 'users');
    if (listRes?.ok && Array.isArray(listRes.docs)) {
      return listRes.docs
        .map((d: any) => mapDocToManagedUser(d))
        .filter((u: ManagedUserAccount) => Boolean(u.uid && u.email));
    }
    return [];
  }
}

// Subscribe to all registered users in real-time (for Admin Dashboard)
export function subscribeToAllCloudUsers(
  onUpdate: (users: ManagedUserAccount[]) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  try {
    const colRef = collection(db, 'users');
    return onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs
          .map((docSnap) => mapDocToManagedUser({ uid: docSnap.id, ...docSnap.data() }))
          .filter((u) => Boolean(u.uid && u.email));
        onUpdate(list);
      },
      () => {}
    );
  } catch {
    return () => {};
  }
}

// Admin action: Update user account status ('active' / 'deactivated' / 'pending') or role
export async function updateCloudUserAccountStatus(
  uid: string,
  email: string,
  displayName: string,
  status: UserAccountStatus,
  adminIdentifier?: string,
  role?: UserRole
): Promise<boolean> {
  const path = `users/${uid}`;
  const now = new Date().toISOString();
  const payload: Record<string, any> = {
    uid,
    email: email.trim().toLowerCase(),
    displayName: displayName || 'Pengguna Dompt',
    status,
    updatedAt: now,
  };
  if (role) {
    payload.role = role;
  }
  if (status === 'active') {
    payload.approvedAt = now;
    if (adminIdentifier) {
      payload.approvedBy = adminIdentifier.substring(0, 120);
    }
  } else if (status === 'deactivated') {
    payload.deactivatedAt = now;
  }

  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      payload.createdAt = now;
    }
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch {
    const setRes = await cloudRestApi('set', path, payload, true);
    return Boolean(setRes?.ok);
  }
}

// Bug Reports & User Feedback
function mapDocToBugReport(d: any): BugReport {
  return {
    id: d.id || '',
    userId: d.userId || '',
    userEmail: d.userEmail || 'user@dompt.com',
    userName: d.userName || 'Pengguna',
    type:
      d.type === 'bug' || d.type === 'feedback' || d.type === 'feature' || d.type === 'other'
        ? d.type
        : 'feedback',
    priority:
      d.priority === 'low' || d.priority === 'medium' || d.priority === 'high'
        ? d.priority
        : 'medium',
    title: d.title || 'Laporan Pengguna',
    description: d.description || '',
    pageContext: d.pageContext || undefined,
    status:
      d.status === 'open' ||
      d.status === 'in_progress' ||
      d.status === 'resolved' ||
      d.status === 'closed'
        ? d.status
        : 'open',
    adminReply: d.adminReply || undefined,
    repliedAt: d.repliedAt || undefined,
    repliedBy: d.repliedBy || undefined,
    createdAt: d.createdAt || new Date().toISOString(),
    updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
  };
}

export async function fetchCloudBugReports(): Promise<BugReport[]> {
  try {
    const colRef = collection(db, 'bugReports');
    const snap = await getDocs(query(colRef));
    return snap.docs
      .map((docSnap) => mapDocToBugReport({ id: docSnap.id, ...docSnap.data() }))
      .filter((r) => Boolean(r.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    const listRes = await cloudRestApi('list', 'bugReports');
    if (listRes?.ok && Array.isArray(listRes.docs)) {
      return listRes.docs
        .map((d: any) => mapDocToBugReport(d))
        .filter((r: BugReport) => Boolean(r.id))
        .sort(
          (a: BugReport, b: BugReport) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    return [];
  }
}

export function subscribeToCloudBugReports(
  onUpdate: (reports: BugReport[]) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  try {
    const colRef = collection(db, 'bugReports');
    return onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs
          .map((docSnap) => mapDocToBugReport({ id: docSnap.id, ...docSnap.data() }))
          .filter((r) => Boolean(r.id))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      () => {}
    );
  } catch {
    return () => {};
  }
}

export async function saveCloudBugReport(report: BugReport): Promise<boolean> {
  const path = `bugReports/${report.id}`;
  const payload: Record<string, any> = {
    id: report.id,
    userId: report.userId.substring(0, 128),
    userEmail: report.userEmail.substring(0, 256),
    userName: report.userName.substring(0, 128),
    type: report.type,
    priority: report.priority,
    title: report.title.substring(0, 200),
    description: report.description.substring(0, 3000),
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    ...(report.pageContext ? { pageContext: report.pageContext.substring(0, 100) } : {}),
    ...(report.adminReply ? { adminReply: report.adminReply.substring(0, 2000) } : {}),
    ...(report.repliedAt ? { repliedAt: report.repliedAt.substring(0, 50) } : {}),
    ...(report.repliedBy ? { repliedBy: report.repliedBy.substring(0, 128) } : {}),
  };

  try {
    const docRef = doc(db, 'bugReports', report.id);
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch {
    const setRes = await cloudRestApi('set', path, payload, true);
    return Boolean(setRes?.ok);
  }
}

export async function deleteCloudBugReport(reportId: string): Promise<boolean> {
  const path = `bugReports/${reportId}`;
  try {
    const docRef = doc(db, 'bugReports', reportId);
    await deleteDoc(docRef);
    return true;
  } catch {
    const delRes = await cloudRestApi('delete', path);
    return Boolean(delRes?.ok);
  }
}

// Wallets (Pure read-only fetch - zero writes during load)
export async function fetchUserWallets(
  userId: string
): Promise<Wallet[]> {
  const path = `users/${userId}/wallets`;
  const mapWalletDoc = (d: any): Wallet => ({
    id: d.id,
    name: d.name || 'Dompet Utama',
    type: d.type || 'cash',
    initialBalance: Number(d.initialBalance) || 0,
    reservedAmount: Number(d.reservedAmount) || 0,
    color: d.color || '#10b981',
    icon: d.icon || 'wallet',
    isVerified: d.isVerified !== undefined ? Boolean(d.isVerified) : true,
    createdAt: d.createdAt || new Date().toISOString(),
    updatedAt: d.updatedAt || new Date().toISOString(),
  });

  try {
    const colRef = collection(db, 'users', userId, 'wallets');
    const snap = await getDocs(query(colRef));
    if (snap.empty) {
      return [];
    }
    return snap.docs.map((docSnap) => mapWalletDoc(docSnap.data()));
  } catch (error) {
    const listRes = await cloudRestApi('list', path);
    if (listRes?.ok && Array.isArray(listRes.docs)) {
      return listRes.docs.map(mapWalletDoc);
    }
    handleFirestoreError(error, OperationType.GET, path);
    return [];
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
    isVerified: wallet.isVerified !== undefined ? Boolean(wallet.isVerified) : true,
    createdAt: wallet.createdAt || new Date().toISOString(),
    updatedAt: wallet.updatedAt || new Date().toISOString(),
  };
  try {
    const docRef = doc(db, 'users', userId, 'wallets', wallet.id);
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    const setRes = await cloudRestApi('set', path, payload, false);
    if (setRes?.ok) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserWallet(userId: string, walletId: string): Promise<void> {
  const path = `users/${userId}/wallets/${walletId}`;
  try {
    const docRef = doc(db, 'users', userId, 'wallets', walletId);
    await deleteDoc(docRef);
  } catch (error) {
    const delRes = await cloudRestApi('delete', path);
    if (delRes?.ok) return;
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
    createdAt: d.createdAt || d.date || new Date().toISOString(),
    updatedAt: d.updatedAt || d.createdAt || d.date || new Date().toISOString(),
  });

  try {
    const colRef = collection(db, 'users', userId, 'transactions');
    const snap = await getDocs(query(colRef));
    return snap.docs.map((docSnap) => mapTxDoc(docSnap.data()));
  } catch (error) {
    const listRes = await cloudRestApi('list', path);
    if (listRes?.ok && Array.isArray(listRes.docs)) {
      return listRes.docs.map(mapTxDoc);
    }
    handleFirestoreError(error, OperationType.GET, path);
    return [];
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
    updatedAt: tx.updatedAt || new Date().toISOString(),
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
    const setRes = await cloudRestApi('set', path, restPayload, false);
    if (setRes?.ok) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserTransaction(userId: string, txId: string): Promise<void> {
  const path = `users/${userId}/transactions/${txId}`;
  try {
    const docRef = doc(db, 'users', userId, 'transactions', txId);
    await deleteDoc(docRef);
  } catch (error) {
    const delRes = await cloudRestApi('delete', path);
    if (delRes?.ok) return;
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
    monthlyTargetSaving:
      Number(d.monthlyTargetSaving) || Math.round((Number(d.targetAmount) || 0) / 12),
    createdAt: d.createdAt || new Date().toISOString(),
    updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
  });

  try {
    const colRef = collection(db, 'users', userId, 'goals');
    const snap = await getDocs(query(colRef));
    return snap.docs.map((docSnap) => mapGoalDoc(docSnap.data()));
  } catch (error) {
    const listRes = await cloudRestApi('list', path);
    if (listRes?.ok && Array.isArray(listRes.docs)) {
      return listRes.docs.map(mapGoalDoc);
    }
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function saveUserGoal(userId: string, goal: Goal): Promise<void> {
  const path = `users/${userId}/goals/${goal.id}`;
  const payload: Record<string, any> = {
    id: goal.id,
    userId,
    title: (goal.name || 'Target Tabungan').substring(0, 100),
    targetAmount: Number(goal.targetAmount) || 0,
    currentAmount: Number(goal.currentAmount) || 0,
    createdAt: goal.createdAt || new Date().toISOString(),
    updatedAt: goal.updatedAt || new Date().toISOString(),
  };
  if (goal.targetDate) payload.deadline = goal.targetDate.substring(0, 30);
  if (goal.emoji) payload.emoji = goal.emoji.substring(0, 20);
  if (goal.walletId) payload.walletId = goal.walletId.substring(0, 128);
  if (goal.isEmergencyFund !== undefined) payload.isEmergencyFund = Boolean(goal.isEmergencyFund);
  if (goal.monthlyTargetSaving !== undefined) {
    payload.monthlyTargetSaving = Number(goal.monthlyTargetSaving) || 0;
  }
  if (goal.isLocked !== undefined) payload.isLocked = Boolean(goal.isLocked);

  try {
    const docRef = doc(db, 'users', userId, 'goals', goal.id);
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    const setRes = await cloudRestApi('set', path, payload, false);
    if (setRes?.ok) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserGoal(userId: string, goalId: string): Promise<void> {
  const path = `users/${userId}/goals/${goalId}`;
  try {
    const docRef = doc(db, 'users', userId, 'goals', goalId);
    await deleteDoc(docRef);
  } catch (error) {
    const delRes = await cloudRestApi('delete', path);
    if (delRes?.ok) return;
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Budget Config + Extended Cross-Device State (Pure read-only fetch - zero writes during load)
export async function fetchUserBudgetConfig(
  userId: string
): Promise<BudgetConfig | null> {
  const path = `users/${userId}/budgetConfig/main`;
  const parseBudgetData = (data: Record<string, any>): BudgetConfig => {
    const parsedSubcategories = safeJsonParse<BudgetSubcategory[]>(data.subcategoriesJson, []);
    const parsedSubscriptions = data.subscriptionsJson
      ? safeJsonParse<RecurringItem[]>(data.subscriptionsJson, [])
      : undefined;
    const parsedLiquidAssets = data.liquidAssetsJson
      ? safeJsonParse<AssetItem[]>(data.liquidAssetsJson, [])
      : undefined;
    const parsedFixedAssets = data.fixedAssetsJson
      ? safeJsonParse<AssetItem[]>(data.fixedAssetsJson, [])
      : undefined;
    const parsedInvestments = data.investmentsJson
      ? safeJsonParse<InvestmentItem[]>(data.investmentsJson, [])
      : undefined;
    const parsedCategoryBudgets = data.categoryBudgetsJson
      ? safeJsonParse<Budget[]>(data.categoryBudgetsJson, [])
      : undefined;
    const parsedSettings = data.settingsJson
      ? safeJsonParse<Partial<AppSettings>>(data.settingsJson, {})
      : undefined;
    const parsedDeletedIds = data.deletedIdsJson
      ? safeJsonParse<string[]>(data.deletedIdsJson, [])
      : undefined;
    const resolvedPaydayDay = Number(data.paydayDay || parsedSettings?.paydayDay) || undefined;

    return {
      estimatedIncome: Number(data.estimatedIncome) || 0,
      needsPercent:
        data.needsPercent !== undefined && data.needsPercent !== null
          ? Number(data.needsPercent)
          : 50,
      wantsPercent:
        data.wantsPercent !== undefined && data.wantsPercent !== null
          ? Number(data.wantsPercent)
          : 30,
      savingsPercent:
        data.savingsPercent !== undefined && data.savingsPercent !== null
          ? Number(data.savingsPercent)
          : 20,
      ...(resolvedPaydayDay ? { paydayDay: resolvedPaydayDay } : {}),
      subcategories: Array.isArray(parsedSubcategories) ? parsedSubcategories : [],
      ...(parsedSubscriptions !== undefined ? { subscriptions: parsedSubscriptions } : {}),
      ...(parsedLiquidAssets !== undefined ? { liquidAssets: parsedLiquidAssets } : {}),
      ...(parsedFixedAssets !== undefined ? { fixedAssets: parsedFixedAssets } : {}),
      ...(parsedInvestments !== undefined ? { investments: parsedInvestments } : {}),
      ...(parsedCategoryBudgets !== undefined ? { categoryBudgets: parsedCategoryBudgets } : {}),
      ...(parsedSettings !== undefined ? { settings: parsedSettings } : {}),
      ...(parsedDeletedIds !== undefined ? { deletedIds: parsedDeletedIds } : {}),
      updatedAt: data.updatedAt || data.createdAt || undefined,
    };
  };

  try {
    const docRef = doc(db, 'users', userId, 'budgetConfig', 'main');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return parseBudgetData(data);
  } catch (error) {
    const getRes = await cloudRestApi('get', path);
    if (getRes?.ok) {
      if (!getRes.exists || !getRes.data) {
        return null;
      }
      return parseBudgetData(getRes.data);
    }
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserBudgetConfig(userId: string, config: BudgetConfig): Promise<void> {
  const path = `users/${userId}/budgetConfig/main`;
  const now = new Date().toISOString();
  const payload: Record<string, any> = {
    id: 'main',
    userId,
    estimatedIncome: Number(config.estimatedIncome) || 0,
    needsPercent:
      config.needsPercent !== undefined && config.needsPercent !== null
        ? Number(config.needsPercent)
        : 50,
    wantsPercent:
      config.wantsPercent !== undefined && config.wantsPercent !== null
        ? Number(config.wantsPercent)
        : 30,
    savingsPercent:
      config.savingsPercent !== undefined && config.savingsPercent !== null
        ? Number(config.savingsPercent)
        : 20,
    subcategoriesJson: JSON.stringify(config.subcategories || []).substring(0, 19500),
    createdAt: now,
    updatedAt: now,
  };
  if (config.subscriptions !== undefined) {
    payload.subscriptionsJson = JSON.stringify(config.subscriptions).substring(0, 19500);
  }
  if (config.liquidAssets !== undefined) {
    payload.liquidAssetsJson = JSON.stringify(config.liquidAssets).substring(0, 19500);
  }
  if (config.fixedAssets !== undefined) {
    payload.fixedAssetsJson = JSON.stringify(config.fixedAssets).substring(0, 19500);
  }
  if (config.investments !== undefined) {
    payload.investmentsJson = JSON.stringify(config.investments).substring(0, 19500);
  }
  if (config.categoryBudgets !== undefined) {
    payload.categoryBudgetsJson = JSON.stringify(config.categoryBudgets).substring(0, 19500);
  }
  if (config.settings !== undefined || config.paydayDay !== undefined) {
    const mergedSettings = {
      ...(config.settings || {}),
      ...(config.paydayDay ? { paydayDay: config.paydayDay } : {}),
    };
    payload.settingsJson = JSON.stringify(mergedSettings).substring(0, 9500);
  }
  if (config.deletedIds !== undefined) {
    payload.deletedIdsJson = JSON.stringify(config.deletedIds.slice(-400)).substring(0, 19500);
  }

  try {
    const docRef = doc(db, 'users', userId, 'budgetConfig', 'main');
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    const setRes = await cloudRestApi('set', path, payload, true);
    if (setRes?.ok) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export type ExtendedSyncDataPartial = {
  subscriptions?: RecurringItem[];
  liquidAssets?: AssetItem[];
  fixedAssets?: AssetItem[];
  investments?: InvestmentItem[];
  categoryBudgets?: Budget[];
  settings?: Partial<AppSettings>;
  deletedIds?: string[];
};

export async function saveUserExtendedSyncData(
  userId: string,
  configOrPartial: BudgetConfig | ExtendedSyncDataPartial,
  maybePartial?: ExtendedSyncDataPartial
): Promise<void> {
  if (maybePartial !== undefined) {
    const baseConfig = configOrPartial as BudgetConfig;
    await saveUserBudgetConfig(userId, {
      ...baseConfig,
      ...maybePartial,
    });
    return;
  }

  const partial = configOrPartial as ExtendedSyncDataPartial;
  const path = `users/${userId}/budgetConfig/main`;
  const now = new Date().toISOString();
  const payload: Record<string, any> = {
    id: 'main',
    userId,
    updatedAt: now,
  };
  if (partial.subscriptions !== undefined) {
    payload.subscriptionsJson = JSON.stringify(partial.subscriptions).substring(0, 19500);
  }
  if (partial.liquidAssets !== undefined) {
    payload.liquidAssetsJson = JSON.stringify(partial.liquidAssets).substring(0, 19500);
  }
  if (partial.fixedAssets !== undefined) {
    payload.fixedAssetsJson = JSON.stringify(partial.fixedAssets).substring(0, 19500);
  }
  if (partial.investments !== undefined) {
    payload.investmentsJson = JSON.stringify(partial.investments).substring(0, 19500);
  }
  if (partial.categoryBudgets !== undefined) {
    payload.categoryBudgetsJson = JSON.stringify(partial.categoryBudgets).substring(0, 19500);
  }
  if (partial.settings !== undefined) {
    payload.settingsJson = JSON.stringify(partial.settings).substring(0, 9500);
  }
  if (partial.deletedIds !== undefined) {
    payload.deletedIdsJson = JSON.stringify(partial.deletedIds.slice(-400)).substring(0, 19500);
  }

  try {
    const docRef = doc(db, 'users', userId, 'budgetConfig', 'main');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await saveUserBudgetConfig(userId, {
        ...EMPTY_BUDGET_CONFIG,
        ...partial,
      });
      return;
    }
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    const existingRes = await cloudRestApi('get', path);
    if (existingRes?.ok && !existingRes.exists) {
      await saveUserBudgetConfig(userId, {
        ...EMPTY_BUDGET_CONFIG,
        ...partial,
      });
      return;
    }
    const setRes = await cloudRestApi('set', path, payload, true);
    if (setRes?.ok) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserBudgetConfig(
  userId: string,
  onRemoteUpdate: (updatedAt?: string, deletedIds?: string[]) => void
): () => void {
  if (!userId || typeof window === 'undefined') return () => {};
  const path = `users/${userId}/budgetConfig/main`;
  try {
    const docRef = doc(db, 'users', userId, 'budgetConfig', 'main');
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const remoteDeleted = data?.deletedIdsJson
          ? safeJsonParse<string[]>(data.deletedIdsJson, [])
          : undefined;
        onRemoteUpdate(data?.updatedAt, remoteDeleted);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch {
          // Handled by background polling fallback
        }
      }
    );
  } catch {
    return () => {};
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
      remainingAmount:
        d.remainingAmount !== undefined
          ? Number(d.remainingAmount)
          : Number(d.totalAmount) || 0,
      dueDate: d.dueDate || '',
      startDate: d.startDate || '',
      walletId: d.walletId || undefined,
      category: d.category || 'cicilan',
      interestRate: Number(d.interestRate) || 0,
      isInstallment: d.isInstallment !== undefined ? Boolean(d.isInstallment) : (d.category === 'cicilan' || Boolean(d.tenorMonths)),
      tenorMonths: d.tenorMonths !== undefined ? Number(d.tenorMonths) : undefined,
      monthlyInstallment: d.monthlyInstallment !== undefined ? Number(d.monthlyInstallment) : undefined,
      dueDayOfMonth: d.dueDayOfMonth !== undefined ? Number(d.dueDayOfMonth) : undefined,
      status: d.status === 'paid' || Number(d.remainingAmount) <= 0 ? 'paid' : 'active',
      note: d.note || '',
      payments,
      createdAt: d.createdAt || new Date().toISOString(),
      updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
    };
  };

  try {
    const colRef = collection(db, 'users', userId, 'debts');
    const snap = await getDocs(query(colRef));
    return snap.docs.map((docSnap) => mapDebtDoc(docSnap.data()));
  } catch (error) {
    const listRes = await cloudRestApi('list', path);
    if (listRes?.ok && Array.isArray(listRes.docs)) {
      return listRes.docs.map(mapDebtDoc);
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
    name: debt.name.substring(0, 100),
    type: debt.type,
    contactName: (debt.contactName || 'Pihak Terkait').substring(0, 100),
    totalAmount: Number(debt.totalAmount) || 0,
    remainingAmount: Number(debt.remainingAmount) || 0,
    dueDate: (debt.dueDate || '').substring(0, 50),
    status: debt.status,
    paymentsJson: JSON.stringify(debt.payments || []).substring(0, 19500),
    createdAt: debt.createdAt || new Date().toISOString(),
    updatedAt: debt.updatedAt || new Date().toISOString(),
    ...(debt.startDate ? { startDate: debt.startDate.substring(0, 50) } : {}),
    ...(debt.walletId ? { walletId: debt.walletId.substring(0, 128) } : {}),
    ...(debt.category ? { category: debt.category.substring(0, 50) } : {}),
    ...(debt.interestRate ? { interestRate: Number(debt.interestRate) } : {}),
    ...(debt.isInstallment !== undefined ? { isInstallment: Boolean(debt.isInstallment) } : {}),
    ...(debt.tenorMonths !== undefined ? { tenorMonths: Number(debt.tenorMonths) } : {}),
    ...(debt.monthlyInstallment !== undefined ? { monthlyInstallment: Number(debt.monthlyInstallment) } : {}),
    ...(debt.dueDayOfMonth !== undefined ? { dueDayOfMonth: Number(debt.dueDayOfMonth) } : {}),
    ...(debt.note ? { note: debt.note.substring(0, 500) } : {}),
  };

  try {
    const docRef = doc(db, 'users', userId, 'debts', debt.id);
    await setDoc(docRef, restPayload, { merge: true });
  } catch (error) {
    const setRes = await cloudRestApi('set', path, restPayload, false);
    if (setRes?.ok) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserDebt(userId: string, debtId: string): Promise<void> {
  const path = `users/${userId}/debts/${debtId}`;
  try {
    const docRef = doc(db, 'users', userId, 'debts', debtId);
    await deleteDoc(docRef);
  } catch (error) {
    const delRes = await cloudRestApi('delete', path);
    if (delRes?.ok) return;
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
    walletId: d.walletId || 'wallet-cash-main',
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
    createdAt: d.createdAt || new Date().toISOString(),
    updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
  });

  try {
    const colRef = collection(db, 'users', userId, 'subscriptions');
    const snap = await getDocs(query(colRef));
    return snap.docs.map((docSnap) => mapSubDoc(docSnap.data()));
  } catch (error) {
    const listRes = await cloudRestApi('list', path);
    if (listRes?.ok && Array.isArray(listRes.docs)) {
      return listRes.docs.map(mapSubDoc);
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
    name: (item.name || 'Langganan').substring(0, 100),
    emoji: (item.emoji || (item.type === 'income' ? '💰' : '🔁')).substring(0, 20),
    type: item.type,
    amount: Number(item.amount) || 0,
    frequency: item.frequency || 'monthly',
    billingDay: Number(item.billingDay) || 1,
    walletId: (item.walletId || 'wallet-cash-main').substring(0, 128),
    categoryId: (item.categoryId || (item.type === 'income' ? 'cat-gaji' : 'cat-tagihan')).substring(0, 100),
    isActive: Boolean(item.isActive),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    ...(item.subcategoryId ? { subcategoryId: item.subcategoryId.substring(0, 128) } : {}),
    ...(item.budgetGroup ? { budgetGroup: item.budgetGroup.substring(0, 50) } : {}),
    ...(item.lastRecordedPeriod
      ? { lastRecordedPeriod: item.lastRecordedPeriod.substring(0, 20) }
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
    const setRes = await cloudRestApi('set', path, restPayload, false);
    if (setRes?.ok) return;
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
    const delRes = await cloudRestApi('delete', path);
    if (delRes?.ok) return;
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Reset all user data in Firestore
export async function resetUserFirestoreData(userId: string): Promise<Wallet[]> {
  try {
    const subcollections = ['transactions', 'goals', 'debts', 'subscriptions', 'wallets'];
    for (const subName of subcollections) {
      try {
        const colRef = collection(db, 'users', userId, subName);
        const snap = await getDocs(query(colRef));
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      } catch {
        const listRes = await cloudRestApi('list', `users/${userId}/${subName}`);
        if (listRes?.ok && Array.isArray(listRes.docs)) {
          for (const d of listRes.docs) {
            if (d?.id) {
              await cloudRestApi('delete', `users/${userId}/${subName}/${d.id}`);
            }
          }
        }
      }
    }

    const cleanWallet: Wallet = {
      id: 'wallet-cash-main',
      name: 'Dompet Utama',
      type: 'cash',
      initialBalance: 0,
      reservedAmount: 0,
      color: '#10b981',
      icon: 'wallet',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveUserWallet(userId, cleanWallet);

    await saveUserBudgetConfig(userId, {
      ...EMPTY_BUDGET_CONFIG,
      subscriptions: [],
      liquidAssets: [],
      fixedAssets: [],
      investments: [],
      categoryBudgets: [],
      deletedIds: [],
    });

    return [cleanWallet];
  } catch (error) {
    const cleanWallet: Wallet = {
      id: 'wallet-cash-main',
      name: 'Dompet Utama',
      type: 'cash',
      initialBalance: 0,
      reservedAmount: 0,
      color: '#10b981',
      icon: 'wallet',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveUserWallet(userId, cleanWallet);
    await saveUserBudgetConfig(userId, {
      ...EMPTY_BUDGET_CONFIG,
      subscriptions: [],
      liquidAssets: [],
      fixedAssets: [],
      investments: [],
      categoryBudgets: [],
      deletedIds: [],
    });
    return [cleanWallet];
  }
}
