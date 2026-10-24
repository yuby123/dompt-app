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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'register') {
      if (!nameInput.trim()) {
        setErrorMsg('Mohon masukkan nama panggilan Anda.');
        return;
      }
      if (!emailInput.trim() || !emailInput.includes('@')) {
        setErrorMsg('Mohon masukkan alamat email yang valid.');
        return;
      }
      if (passwordInput.length < 6) {
        setErrorMsg('Password minimal harus terdiri dari 6 karakter.');
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
          setErrorMsg(res.error || 'Gagal mendaftar akun baru.');
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
        setErrorMsg('Mohon masukkan alamat email Anda.');
        return;
      }
      if (!passwordInput) {
        setErrorMsg('Mohon masukkan password Anda.');
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
      console.error('Sign out error:', err);
      setErrorMsg(err?.message || 'Gagal keluar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

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
              setErrorMsg(null);
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
                <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <CheckCircle2 size={14} />
                  <span>
                    Peran: {isAdmin ? 'Admin Super App' : 'Akun User'} · Status:{' '}
                    {userAccountStatus === 'active'
                      ? 'Aktif (Di-ACC)'
                      : userAccountStatus === 'pending'
                      ? 'Menunggu ACC'
                      : 'Nonaktif'}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-[#10b981] shrink-0 mt-0.5" />
                  <span>
                    Data catatan, dompet, dan anggaran untuk <strong>{user.email}</strong> terisolasi
                    secara mandiri dan dilindungi dengan password.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Cloud size={16} className="text-[#3b82f6] shrink-0 mt-0.5" />
                  <span>
                    Setiap pendaftaran akun User baru wajib di-ACC oleh Admin sebelum aktif.
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
                  onClick={() => {
                    setErrorMsg(null);
                    setShowSwitchForm(true);
                  }}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Users size={16} />
                  <span>Ganti / Daftar Akun Lain</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Switch / Login / Register with Email & Password */
            <div className="space-y-4">
              <div className="text-center space-y-1.5">
                <BrandLogo size="lg" className="mx-auto shadow-md" />
                <h2 className="text-xl font-black">
                  {mode === 'login' ? 'Masuk ke Akun Lain' : 'Daftar Akun User Baru'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {mode === 'login'
                    ? 'Masukkan email dan password akun User atau Admin.'
                    : 'Akun User baru akan berstatus Menunggu ACC Admin sebelum aktif.'}
                </p>
              </div>

              {/* Segmented Toggle */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-gray-100 dark:bg-[#0F1115] border border-gray-200/60 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white dark:bg-[#1E2128] text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-gray-400'
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
                  className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white dark:bg-[#1E2128] text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Daftar Baru
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 font-semibold">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-3">
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300">
                      Nama Lengkap / Panggilan
                    </label>
                    <div className="relative">
                      <UserIcon
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0F1115] border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0F1115] border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder={mode === 'register' ? 'Minimal 6 karakter' : 'Masukkan password'}
                      required
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0F1115] border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300">
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Ulangi password Anda"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0F1115] border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#D4F826] hover:bg-[#cbf11e] text-black font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin text-black" />
                  ) : (
                    <>
                      <span>
                        {mode === 'login' ? 'Masuk ke Akun' : 'Daftar User Baru (Menunggu ACC)'}
                      </span>
                      <ArrowRight size={15} />
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


