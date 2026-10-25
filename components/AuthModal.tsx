'use client';

import React, { useState } from 'react';
import {
  X,
  LogOut,
  Users,
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './AppContext';
import { BrandLogo } from './BrandLogo';

export function AuthModal() {
  const {
    isLoginModalOpen,
    setIsLoginModalOpen,
    user,
    settings,
    isAdmin,
    userAccountStatus,
    loginWithEmailPassword,
    registerWithEmailPassword,
    signOutUser,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSwitchForm, setShowSwitchForm] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isLoginModalOpen) return null;

  const displayName = settings.userName || user?.displayName || 'Pengguna';
  const avatarSource = settings.avatarUrl || user?.photoURL || '';
  const isImageAvatar =
    avatarSource.startsWith('http') || avatarSource.startsWith('data:');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'register') {
      if (!nameInput.trim()) {
        setErrorMsg('Masukkan nama panggilan.');
        return;
      }
      if (!emailInput.trim() || !emailInput.includes('@')) {
        setErrorMsg('Masukkan email yang valid.');
        return;
      }
      if (passwordInput.length < 6) {
        setErrorMsg('Password minimal 6 karakter.');
        return;
      }
      if (passwordInput !== confirmPasswordInput) {
        setErrorMsg('Konfirmasi password tidak cocok.');
        return;
      }

      setLoading(true);
      try {
        const res = await registerWithEmailPassword(nameInput, emailInput, passwordInput);
        if (!res.ok) {
          setErrorMsg(res.error || 'Gagal mendaftar akun.');
          return;
        }
        setNameInput('');
        setEmailInput('');
        setPasswordInput('');
        setConfirmPasswordInput('');
        setShowSwitchForm(false);
        setIsLoginModalOpen(false);
      } finally {
        setLoading(false);
      }
    } else {
      if (!emailInput.trim() || !emailInput.includes('@')) {
        setErrorMsg('Masukkan email akun.');
        return;
      }
      if (!passwordInput) {
        setErrorMsg('Masukkan password.');
        return;
      }

      setLoading(true);
      try {
        const res = await loginWithEmailPassword(emailInput, passwordInput);
        if (!res.ok) {
          setErrorMsg(res.error || 'Email atau password salah.');
          return;
        }
        setEmailInput('');
        setPasswordInput('');
        setShowSwitchForm(false);
        setIsLoginModalOpen(false);
      } finally {
        setLoading(false);
      }
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
      setErrorMsg(err?.message || 'Gagal keluar akun.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-white/[0.08] text-slate-900 dark:text-white"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              setShowSwitchForm(false);
              setErrorMsg(null);
              setIsLoginModalOpen(false);
            }}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>

          {user && !showSwitchForm ? (
            /* Logged in state */
            <div className="space-y-5 pt-1">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-[#D4F826] overflow-hidden flex items-center justify-center">
                  {isImageAvatar ? (
                    <img
                      src={avatarSource}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : avatarSource ? (
                    <span className="text-3xl">{avatarSource}</span>
                  ) : (
                    <span className="font-display text-xl font-extrabold text-slate-900 dark:text-[#D4F826]">
                      {(displayName || user.email || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-lg font-extrabold tracking-tight">
                    {displayName}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {isAdmin ? 'Admin' : 'User'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {userAccountStatus === 'active'
                      ? 'Aktif'
                      : userAccountStatus === 'pending'
                      ? 'Menunggu ACC'
                      : 'Nonaktif'}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/50">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setShowSwitchForm(true);
                  }}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-white/10 font-bold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Users size={15} />
                  <span>Ganti Akun</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          ) : (
            /* Switch / Login / Register with Email & Password */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <BrandLogo size="md" className="mx-auto shadow-xs" />
                <h2 className="font-display text-lg font-extrabold tracking-tight pt-1">
                  {mode === 'login' ? 'Masuk Akun' : 'Daftar Akun Baru'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mode === 'login'
                    ? 'Masuk dengan email dan password.'
                    : 'Akun baru aktif setelah disetujui Admin.'}
                </p>
              </div>

              {/* Segmented Toggle */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-[#0F1115]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white dark:bg-[#1E2128] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white dark:bg-[#1E2128] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Daftar
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 font-medium">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-3">
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nama Panggilan
                    </label>
                    <div className="relative">
                      <UserIcon
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Nama Anda"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder={mode === 'register' ? 'Min. 6 karakter' : 'Password'}
                      required
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Ulangi Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Ulangi password"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#D4F826] hover:bg-[#cbf11e] text-black font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin text-black" />
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Masuk' : 'Daftar'}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSwitchForm(false);
                    setErrorMsg(null);
                  }}
                  className="w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Kembali
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
