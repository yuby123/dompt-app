'use client';

import React, { useState } from 'react';
import {
  X,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  Users,
  Cloud,
  Loader2,
  Mail,
  User as UserIcon,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './AppContext';
import { loadSavedLocalAccounts, LocalAccountProfile } from '@/lib/storage';
import { effectiveFirebaseConfig } from '@/lib/firebase';

export function AuthModal() {
  const {
    isLoginModalOpen,
    setIsLoginModalOpen,
    user,
    authLoading,
    signInWithGoogle,
    signInWithLocalAccount,
    signOutUser,
    addToast,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [showSwitchForm, setShowSwitchForm] = useState(false);

  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  if (!isLoginModalOpen) return null;

  const currentDomain =
    typeof window !== 'undefined' ? window.location.hostname : 'nama-app.vercel.app';
  const savedAccounts: LocalAccountProfile[] =
    typeof window !== 'undefined' ? loadSavedLocalAccounts() : [];

  const handleCopyDomain = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentDomain);
      setCopiedDomain(true);
      addToast('Domain Disalin', `${currentDomain} berhasil disalin ke clipboard.`, 'info');
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim()) {
      setErrorMsg('Mohon isi Nama Panggilan dan Alamat Email Anda.');
      return;
    }
    setErrorMsg(null);
    setIsUnauthorizedDomain(false);
    signInWithLocalAccount(nameInput, emailInput);
    setNameInput('');
    setEmailInput('');
    setShowSwitchForm(false);
    setIsLoginModalOpen(false);
  };

  const handleSelectSavedAccount = (acc: LocalAccountProfile) => {
    setErrorMsg(null);
    setIsUnauthorizedDomain(false);
    signInWithLocalAccount(acc.displayName, acc.email);
    setShowSwitchForm(false);
    setIsLoginModalOpen(false);
  };

  const handleSignInGoogle = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setIsUnauthorizedDomain(false);
      await signInWithGoogle();
      setShowSwitchForm(false);
      setIsLoginModalOpen(false);
    } catch (err: any) {
      console.error('Sign in error:', err);
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setIsUnauthorizedDomain(true);
        setErrorMsg(
          `Domain "${currentDomain}" belum didaftarkan di Firebase Console (Authorized Domains).`
        );
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMsg('Jendela login Google ditutup sebelum selesai.');
      } else {
        setErrorMsg(msg || 'Gagal masuk dengan Google. Silakan gunakan Masuk Cepat di bawah.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signOutUser();
      setShowSwitchForm(false);
      setIsLoginModalOpen(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setErrorMsg(err?.message || 'Gagal keluar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const isLocal = Boolean((user as any)?.isLocalAccount);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-[#16181D] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              setShowSwitchForm(false);
              setIsLoginModalOpen(false);
            }}
            className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>

          {user && !showSwitchForm ? (
            /* Logged in state */
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#D4F826]/20 border-2 border-[#D4F826] overflow-hidden flex items-center justify-center">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Pengguna'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-black text-gray-900 dark:text-[#D4F826]">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black">{user.displayName || 'Pengguna Dompt'}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{user.email}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 size={14} />
                  <span>
                    {isLocal
                      ? 'Akun Pribadi Aktif & Terisolasi'
                      : 'Akun Cloud Aktif & Tersimpan di Firestore'}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-[#10b981] shrink-0 mt-0.5" />
                  <span>
                    Data catatan, dompet, dan anggaran untuk <strong>{user.email}</strong> terisolasi
                    secara mandiri dan tidak tercampur dengan pengguna lain.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Cloud size={16} className="text-[#3b82f6] shrink-0 mt-0.5" />
                  <span>
                    {isLocal
                      ? 'Tersimpan aman di ruang penyimpanan khusus akun ini pada perangkat Anda.'
                      : 'Perubahan otomatis tersinkronisasi ke Firebase Firestore secara real-time.'}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/50">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSwitchForm(true)}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Users size={16} />
                  <span>Ganti Akun Lain</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                  <span>Keluar dari Akun Ini</span>
                </button>
              </div>
            </div>
          ) : (
            /* Not logged in (Guest) or Switching Account state */
            <div className="space-y-4">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#D4F826] text-black font-black flex items-center justify-center text-xl shadow-md">
                  D.
                </div>
                <h2 className="text-xl font-black">
                  {showSwitchForm ? 'Ganti Akun Dompt' : 'Masuk ke Dompt'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tiap akun memiliki catatan keuangan, saldo & budget pribadi masing-masing (dimulai
                  dari Rp 0 untuk akun baru).
                </p>
              </div>

              {/* Saved Local Accounts Quick Switcher */}
              {savedAccounts.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Akun Tersimpan di Perangkat Ini
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {savedAccounts.map((acc) => (
                      <button
                        key={acc.uid}
                        type="button"
                        onClick={() => handleSelectSavedAccount(acc)}
                        className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800 border border-gray-200/70 dark:border-gray-700/70 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#D4F826] text-black font-black text-xs flex items-center justify-center shrink-0">
                            {acc.displayName[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                              {acc.displayName}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {acc.email}
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={15} className="text-gray-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Method 1: Instant Login Form (Always works on Vercel without Firebase domain config) */}
              <form
                onSubmit={handleQuickLogin}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                    Masuk Cepat dengan Email & Nama
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    Langsung Aktif
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <UserIcon
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Nama panggilan (cth: Trisna)"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#16181D] border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                    />
                  </div>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Alamat email (cth: nama@gmail.com)"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#16181D] border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#D4F826] hover:bg-[#cbf11e] text-black font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Masuk Sekarang</span>
                  <ArrowRight size={15} />
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex py-0.5 items-center">
                <div className="grow border-t border-gray-200 dark:border-gray-800" />
                <span className="shrink mx-3 text-[11px] font-bold text-gray-400 uppercase">
                  atau Cloud Google
                </span>
                <div className="grow border-t border-gray-200 dark:border-gray-800" />
              </div>

              {/* Unauthorized Domain Diagnostic Helper for Vercel */}
              {isUnauthorizedDomain && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-left space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-extrabold text-amber-900 dark:text-amber-300">
                        Kenapa Google Login Ditolak di Vercel?
                      </p>
                      <p className="text-[11px] text-amber-800 dark:text-amber-200/90 leading-relaxed">
                        Demi keamanan, Firebase memblokir login Google dari domain baru yang belum
                        didaftarkan. Anda bisa langsung pakai <strong>Masuk Cepat</strong> di atas,
                        atau daftarkan domain Vercel Anda ke Firebase:
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#16181D] px-3 py-2 rounded-xl border border-amber-200/80 dark:border-amber-800/50">
                    <code className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">
                      {currentDomain}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      {copiedDomain ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedDomain ? 'Tersalin' : 'Salin Domain'}</span>
                    </button>
                  </div>

                  <ol className="text-[11px] text-amber-900 dark:text-amber-200/90 list-decimal list-inside space-y-1">
                    <li>
                      Buka <strong>Firebase Console</strong> (Project:{' '}
                      <code className="font-bold">{effectiveFirebaseConfig.projectId}</code>)
                    </li>
                    <li>
                      Pilih menu <strong>Authentication</strong> &rarr; tab{' '}
                      <strong>Settings</strong> &rarr; <strong>Authorized domains</strong>
                    </li>
                    <li>
                      Klik <strong>Add domain</strong> lalu tempel{' '}
                      <code className="font-bold">{currentDomain}</code>
                    </li>
                  </ol>
                </div>
              )}

              {errorMsg && !isUnauthorizedDomain && (
                <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/50">
                  {errorMsg}
                </div>
              )}

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleSignInGoogle}
                disabled={loading || authLoading}
                className="w-full py-3 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Masuk dengan Akun Google (Firebase Cloud)</span>
              </button>

              {showSwitchForm && (
                <button
                  type="button"
                  onClick={() => setShowSwitchForm(false)}
                  className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                >
                  Batal & Kembali ke Akun Saat Ini
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

