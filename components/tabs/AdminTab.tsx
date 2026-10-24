'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Clock,
  UserCheck,
  UserX,
  Bug,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  Trash2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { BugReportStatus, UserAccountStatus } from '@/lib/types';
import { isBootstrappedAdminEmail } from '@/lib/storage';

export function AdminTab() {
  const {
    user,
    isAdmin,
    managedUsers,
    bugReports,
    approveUserAccount,
    deactivateUserAccount,
    setPendingUserAccount,
    updateUserAccountRole,
    refreshAdminData,
    updateBugReportByAdmin,
    deleteBugReportById,
    openLoginModal,
    adminResetUserPassword,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'users' | 'reports'>('users');
  const [userFilter, setUserFilter] = useState<'all' | UserAccountStatus>('all');
  const [userSearch, setUserSearch] = useState('');
  const [reportFilter, setReportFilter] = useState<'all' | BugReportStatus>('all');
  const [reportSearch, setReportSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Admin password reset per user email
  const [editingPasswordEmail, setEditingPasswordEmail] = useState<string | null>(null);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<{
    email: string;
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Admin reply draft per report ID
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, BugReportStatus>>({});
  const [savingReportId, setSavingReportId] = useState<string | null>(null);

  const pendingUsersCount = useMemo(
    () => managedUsers.filter((u) => u.status === 'pending').length,
    [managedUsers]
  );
  const activeUsersCount = useMemo(
    () => managedUsers.filter((u) => u.status === 'active').length,
    [managedUsers]
  );
  const deactivatedUsersCount = useMemo(
    () => managedUsers.filter((u) => u.status === 'deactivated').length,
    [managedUsers]
  );
  const openReportsCount = useMemo(
    () => bugReports.filter((r) => r.status === 'open' || r.status === 'in_progress').length,
    [bugReports]
  );

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return managedUsers.filter((u) => {
      if (userFilter !== 'all' && u.status !== userFilter) return false;
      if (!q) return true;
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [managedUsers, userFilter, userSearch]);

  const filteredReports = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    return bugReports.filter((r) => {
      if (reportFilter !== 'all' && r.status !== reportFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q)
      );
    });
  }, [bugReports, reportFilter, reportSearch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAdminData();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  const handleApproveAllPending = async () => {
    const pendingList = managedUsers.filter((u) => u.status === 'pending');
    for (const u of pendingList) {
      await approveUserAccount(u.uid, u.email, u.displayName);
    }
  };

  const handleSaveReportResponse = async (reportId: string, currentStatus: BugReportStatus, currentReply?: string) => {
    setSavingReportId(reportId);
    try {
      const nextStatus = statusDrafts[reportId] ?? currentStatus;
      const nextReply = replyDrafts[reportId] !== undefined ? replyDrafts[reportId] : currentReply;
      await updateBugReportByAdmin(reportId, nextStatus, nextReply);
    } finally {
      setSavingReportId(null);
    }
  };

  const handleAdminPasswordReset = async (targetEmail: string) => {
    setPasswordFeedback(null);
    if (newUserPassword.trim().length < 6) {
      setPasswordFeedback({
        email: targetEmail,
        type: 'error',
        text: 'Password baru minimal 6 karakter.',
      });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await adminResetUserPassword(targetEmail, newUserPassword.trim());
      if (res.ok) {
        setPasswordFeedback({
          email: targetEmail,
          type: 'success',
          text: `Password untuk ${targetEmail} berhasil diperbarui.`,
        });
        setNewUserPassword('');
        setEditingPasswordEmail(null);
      } else {
        setPasswordFeedback({
          email: targetEmail,
          type: 'error',
          text: res.error || 'Gagal memperbarui password.',
        });
      }
    } finally {
      setSavingPassword(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="py-12 px-4 max-w-lg mx-auto">
        <div className="bg-white dark:bg-[#12141E] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center mx-auto">
            <ShieldCheck size={28} />
          </div>
          <h2 className="font-display text-xl font-black text-slate-900 dark:text-white">
            Area Khusus Administrator
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Saat ini Anda masuk sebagai akun <strong>User ({user?.email})</strong>. Hanya Administrator yang memiliki email &amp; password Admin yang dapat membuka halaman ini.
          </p>
          <button
            type="button"
            onClick={() => openLoginModal()}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#D4F826] hover:bg-[#c8ec1c] text-black font-extrabold text-xs sm:text-sm transition-all cursor-pointer"
          >
            Keluar / Masuk dengan Akun Lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 lg:pb-10">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 lg:pt-0 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#D4F826] text-black">
              SUPER APP ADMIN CONSOLE
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {user?.email}
            </span>
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Dashboard Admin
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Kelola persetujuan (ACC) pendaftaran user baru, aktif/nonaktifkan akun user, dan pantau laporan bug.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-white dark:bg-[#141722] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#D4F826] transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Sinkronkan Data Cloud</span>
        </button>
      </div>

      {/* 4 KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#12141E] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Akun Terdaftar</span>
            <Users size={15} className="text-slate-400" />
          </div>
          <p className="font-mono text-2xl font-black text-slate-900 dark:text-white mt-2 tabular-nums">
            {managedUsers.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
             Seluruh akun Admin & User
          </p>
        </div>

        <div
          onClick={() => {
            setActiveSection('users');
            setUserFilter('pending');
          }}
          className={`rounded-2xl p-4 border transition-all cursor-pointer ${
            pendingUsersCount > 0
              ? 'bg-amber-500/10 border-amber-500/40'
              : 'bg-white dark:bg-[#12141E] border-slate-200/80 dark:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-bold">
            <span>Menunggu ACC Admin</span>
            <Clock size={15} />
          </div>
          <p className="font-mono text-2xl font-black text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            {pendingUsersCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {pendingUsersCount > 0 ? 'Klik untuk segera ACC user' : 'Tidak ada antrean baru'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#12141E] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Status Akun User</span>
            <UserCheck size={15} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-3 mt-2 font-mono tabular-nums">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {activeUsersCount} <span className="text-xs font-semibold">Aktif</span>
            </span>
            <span className="text-sm font-bold text-rose-500">
              {deactivatedUsersCount} Nonaktif
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Kontrol akses aktif / nonaktif
          </p>
        </div>

        <div
          onClick={() => setActiveSection('reports')}
          className="bg-white dark:bg-[#12141E] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 cursor-pointer hover:border-[#D4F826] transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Laporan Bug & Masukan</span>
            <Bug size={15} className="text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2.5 mt-2 font-mono tabular-nums">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {bugReports.length}
            </span>
            {openReportsCount > 0 && (
              <span className="text-xs font-bold text-amber-500">
                ({openReportsCount} perlu ditinjau)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Klik untuk lihat laporan user
          </p>
        </div>
      </div>

      {/* Main Segmented Navigation: Kelola User vs Laporan Bug User */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#12141E] p-2 rounded-2xl border border-slate-200/80 dark:border-white/10">
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveSection('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === 'users'
                ? 'bg-[#D4F826] text-black shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users size={15} />
            <span>Kelola User Terdaftar ({managedUsers.length})</span>
            {pendingUsersCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-black rounded bg-amber-500 text-black tabular-nums">
                {pendingUsersCount} Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('reports')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === 'reports'
                ? 'bg-[#D4F826] text-black shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bug size={15} />
            <span>Laporan & Masukan User ({bugReports.length})</span>
            {openReportsCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-black rounded bg-rose-500 text-white tabular-nums">
                {openReportsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeSection === 'users' ? (
        /* SECTION 1: USER MANAGEMENT (ACC PENDAFTARAN & AKTIF/NONAKTIFKAN USER) */
        <div className="bg-white dark:bg-[#12141E] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 space-y-5">
          {/* Pending Users Banner if any */}
          {pendingUsersCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    Ada {pendingUsersCount} Pendaftaran User Baru Menunggu ACC Admin
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    User yang baru mendaftar tidak dapat membuka fitur aplikasi sebelum akunnya Anda setujui (ACC).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleApproveAllPending}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} />
                <span>ACC Semua ({pendingUsersCount})</span>
              </button>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all' as const, label: `Semua (${managedUsers.length})` },
                { id: 'pending' as const, label: `Menunggu ACC (${pendingUsersCount})` },
                { id: 'active' as const, label: `Aktif (${activeUsersCount})` },
                { id: 'deactivated' as const, label: `Nonaktif (${deactivatedUsersCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setUserFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    userFilter === tab.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-transparent'
                      : 'bg-slate-50 dark:bg-[#0B0D14] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Cari nama atau email user..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0D14] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
              />
            </div>
          </div>

          {/* Users Table / List */}
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Tidak Ada Data User yang Cocok
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah filter status atau kata kunci pencarian di atas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/70 dark:divide-white/10 border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden">
              {filteredUsers.map((u) => {
                const isRootAdmin = isBootstrappedAdminEmail(u.email);
                const isCurrentAccount =
                  (user?.email || '').toLowerCase() === u.email.toLowerCase();

                return (
                  <div
                    key={u.uid || u.email}
                    className="p-4 bg-white dark:bg-[#12141E] hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors flex flex-col gap-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* User Info */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center font-display font-black text-sm text-slate-800 dark:text-[#D4F826] shrink-0">
                          {(u.displayName || u.email || 'U')[0].toUpperCase()}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-sm font-extrabold text-slate-900 dark:text-white truncate">
                              {u.displayName}
                            </span>

                            {/* Role Badge */}
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                                u.role === 'admin'
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30'
                                  : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                              }`}
                            >
                              {u.role === 'admin' ? 'ADMIN' : 'USER'}
                            </span>

                            {/* Status Badge */}
                            {u.status === 'pending' ? (
                              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                MENUNGGU ACC
                              </span>
                            ) : u.status === 'deactivated' ? (
                              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                NONAKTIF
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                AKTIF (DI-ACC)
                              </span>
                            )}

                            {isCurrentAccount && (
                              <span className="text-[10px] font-mono text-slate-400">
                                (Anda)
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono">{u.email}</span>
                            <span className="font-mono text-[11px] tabular-nums">
                              Daftar:{' '}
                              {new Date(u.createdAt).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Controls */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {u.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => approveUserAccount(u.uid, u.email, u.displayName)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 size={14} />
                              <span>ACC & Aktifkan</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deactivateUserAccount(u.uid, u.email, u.displayName)}
                              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <XCircle size={14} />
                              <span>Tolak / Nonaktifkan</span>
                            </button>
                          </>
                        )}

                        {u.status === 'active' && !isRootAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                updateUserAccountRole(
                                  u.uid,
                                  u.email,
                                  u.displayName,
                                  u.role === 'admin' ? 'user' : 'admin'
                                )
                              }
                              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                            >
                              {u.role === 'admin' ? 'Jadikan User' : 'Jadikan Admin'}
                            </button>

                            <button
                              type="button"
                              onClick={() => deactivateUserAccount(u.uid, u.email, u.displayName)}
                              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <UserX size={14} />
                              <span>Nonaktifkan Akun</span>
                            </button>
                          </>
                        )}

                        {u.status === 'deactivated' && (
                          <>
                            <button
                              type="button"
                              onClick={() => approveUserAccount(u.uid, u.email, u.displayName)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <UserCheck size={14} />
                              <span>Aktifkan Kembali (ACC)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingUserAccount(u.uid, u.email, u.displayName)}
                              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
                            >
                              Set Pending
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setPasswordFeedback(null);
                            if (editingPasswordEmail === u.email) {
                              setEditingPasswordEmail(null);
                              setNewUserPassword('');
                            } else {
                              setEditingPasswordEmail(u.email);
                              setNewUserPassword('');
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <KeyRound size={13} />
                          <span>Ubah Password</span>
                        </button>

                        {isRootAdmin && (
                          <span className="text-[11px] font-mono font-bold text-slate-400 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                            Admin Utama (Aktif Permanen)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inline Password Change Form for this account */}
                    {editingPasswordEmail === u.email && (
                      <div className="w-full pt-3 mt-1 border-t border-slate-200/70 dark:border-white/10 flex flex-col sm:flex-row sm:items-center gap-2.5">
                        <div className="flex-1">
                          <input
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder={`Ketik password baru untuk ${u.email} (min. 6 karakter)`}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0D14] border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={savingPassword}
                            onClick={() => handleAdminPasswordReset(u.email)}
                            className="px-4 py-2 rounded-xl bg-[#D4F826] hover:bg-[#c8ec1c] text-black font-extrabold text-xs cursor-pointer disabled:opacity-50"
                          >
                            {savingPassword ? 'Menyimpan...' : 'Simpan Password'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPasswordEmail(null);
                              setNewUserPassword('');
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold text-xs cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}

                    {passwordFeedback && passwordFeedback.email === u.email && (
                      <div
                        className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold ${
                          passwordFeedback.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                        }`}
                      >
                        {passwordFeedback.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* SECTION 2: USER BUG REPORTS & FEEDBACK MANAGEMENT */
        <div className="bg-white dark:bg-[#12141E] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 space-y-5">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all' as const, label: `Semua (${bugReports.length})` },
                {
                  id: 'open' as const,
                  label: `Menunggu (${bugReports.filter((r) => r.status === 'open').length})`,
                },
                {
                  id: 'in_progress' as const,
                  label: `Diproses (${bugReports.filter((r) => r.status === 'in_progress').length})`,
                },
                {
                  id: 'resolved' as const,
                  label: `Selesai (${bugReports.filter((r) => r.status === 'resolved').length})`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReportFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    reportFilter === tab.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-transparent'
                      : 'bg-slate-50 dark:bg-[#0B0D14] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Cari laporan atau nama user..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0D14] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
              />
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                <MessageSquare size={22} />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Belum Ada Laporan dari Akun User
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Semua masukan atau laporan bug yang dikirim oleh akun User akan langsung muncul di halaman ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((rep) => {
                const currentStatus = statusDrafts[rep.id] ?? rep.status;
                const currentReply =
                  replyDrafts[rep.id] !== undefined ? replyDrafts[rep.id] : rep.adminReply || '';

                return (
                  <div
                    key={rep.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#0B0D14] border border-slate-200/80 dark:border-white/10 space-y-4"
                  >
                    {/* Top Metadata Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 dark:border-white/10 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            rep.type === 'bug'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                              : rep.type === 'feature'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25'
                          }`}
                        >
                          {rep.type === 'bug'
                            ? 'BUG / ERROR'
                            : rep.type === 'feature'
                            ? 'USUL FITUR'
                            : 'MASUKAN USER'}
                        </span>

                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            rep.priority === 'high'
                              ? 'bg-rose-600 text-white'
                              : rep.priority === 'medium'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                              : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          Prioritas: {rep.priority === 'high' ? 'Tinggi' : rep.priority === 'medium' ? 'Sedang' : 'Rendah'}
                        </span>

                        {rep.pageContext && (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Menu: {rep.pageContext}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          Pelapor: <strong className="text-slate-800 dark:text-slate-200">{rep.userName}</strong> ({rep.userEmail})
                        </span>
                        <span className="font-mono text-[11px] tabular-nums">
                          {new Date(rep.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteBugReportById(rep.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Hapus laporan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1.5">
                      <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                        {rep.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {rep.description}
                      </p>
                    </div>

                    {/* Admin Response & Status Controls */}
                    <div className="pt-3 border-t border-slate-200/70 dark:border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                      <div className="lg:col-span-4 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          Status Penanganan
                        </label>
                        <select
                          value={currentStatus}
                          onChange={(e) =>
                            setStatusDrafts((prev) => ({
                              ...prev,
                              [rep.id]: e.target.value as BugReportStatus,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12141E] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                        >
                          <option value="open">Menunggu Review (Open)</option>
                          <option value="in_progress">Sedang Diproses (In Progress)</option>
                          <option value="resolved">Selesai Diperbaiki (Resolved)</option>
                          <option value="closed">Ditutup (Closed)</option>
                        </select>
                      </div>

                      <div className="lg:col-span-6 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          Tanggapan / Balasan ke User
                        </label>
                        <input
                          type="text"
                          value={currentReply}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({
                              ...prev,
                              [rep.id]: e.target.value,
                            }))
                          }
                          placeholder="Tulis tanggapan Admin untuk dilihat oleh User..."
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#12141E] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <button
                          type="button"
                          onClick={() => handleSaveReportResponse(rep.id, rep.status, rep.adminReply)}
                          disabled={savingReportId === rep.id}
                          className="w-full py-2 px-3 rounded-xl bg-[#D4F826] hover:bg-[#c8ec1c] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Send size={13} />
                          <span>{savingReportId === rep.id ? 'Menyimpan...' : 'Simpan'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
