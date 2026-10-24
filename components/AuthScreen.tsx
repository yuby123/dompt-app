'use client';

import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Sun,
  Moon,
  AlertCircle,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './AppContext';
import { BrandLogo } from './BrandLogo';

const emptySubscribe = () => () => {};

export function AuthScreen() {
  const {
    loginWithEmailPassword,
    registerWithEmailPassword,
    settings,
    setThemeMode,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDarkMode = mounted
    ? settings.themeMode === 'dark' ||
      (settings.themeMode === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    : settings.themeMode === 'dark';

  const toggleTheme = () => {
    setThemeMode(isDarkMode ? 'light' : 'dark');
  };

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setErrorMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMsg('Mohon masukkan nama lengkap atau nama panggilan Anda.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Mohon masukkan alamat email yang valid.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password minimal harus terdiri dari 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Konfirmasi password tidak cocok dengan password Anda.');
        return;
      }

      setLoading(true);
      try {
        const res = await registerWithEmailPassword(name, email, password);
        if (!res.ok) {
          setErrorMsg(res.error || 'Gagal mendaftarkan akun. Silakan coba lagi.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Mohon masukkan alamat email Anda.');
        return;
      }
      if (!password) {
        setErrorMsg('Mohon masukkan password akun Anda.');
        return;
      }

      setLoading(true);
      try {
        const res = await loginWithEmailPassword(email, password);
        if (!res.ok) {
          setErrorMsg(res.error || 'Email atau password salah.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] dark:bg-[#08090F] bg-noise-subtle text-slate-900 dark:text-white flex flex-col selection:bg-[#D4F826] selection:text-black">
      {/* Clean Top Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#F6F7FB]/85 dark:bg-[#08090F]/85 border-b border-slate-200/80 dark:border-white/[0.08] px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <BrandLogo size="sm" className="w-9 h-9 shadow-2xs" />
          <span className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            Dompt.
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold">
            Super App
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="px-4 py-2 rounded-full bg-[#D4F826] hover:bg-[#cbf11e] text-black font-bold text-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            {mode === 'login' ? 'Buat Akun Baru' : 'Masuk ke Akun'}
          </button>
        </div>
      </header>

      {/* Main Content Container: Side-by-Side (Kanan-Kiri) Cards Only */}
      <main className="flex-1 flex items-center justify-center max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <section
          id="auth-hero"
          className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch"
        >
          {/* Left 7 Cols: Editorial Value Proposition Card */}
          <div className="lg:col-span-7 rounded-[32px] p-8 sm:p-10 lg:p-12 bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] text-white border border-white/10 flex flex-col justify-between relative overflow-hidden">
            {/* Ambient Theme-Adaptive Glows */}
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#8B5CF6]/20 blur-3xl pointer-events-none transition-colors duration-500" />
            <div
              className={`absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
                settings.accentColor === 'orange'
                  ? 'bg-[#FF6B2B]/15'
                  : settings.accentColor === 'pink'
                  ? 'bg-[#FFA4A4]/15'
                  : 'bg-[#D4F826]/15'
              }`}
            />

            {/* Top Utility Row inside Hero */}
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="text-[#D4F826] font-semibold">Dompt. Super App</span>
                <span aria-hidden="true">·</span>
                <span>Sistem Multi-Peran Admin & User</span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 transition-colors cursor-pointer"
                title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                aria-label="Ganti Tema"
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>

            {/* Hero Headline & Prose */}
            <div className="relative z-10 my-8 space-y-5">
              <h1
                className="font-display font-extrabold tracking-tight text-white leading-[1.1] text-balance"
                style={{ fontSize: 'clamp(2.1rem, 3.8vw, 3.25rem)' }}
              >
                Atur Gaji, Jatah Harian & Tabungan Jadi Lebih Tenang.
              </h1>
              <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-xl">
                Dilengkapi ekosistem Super App: akun User untuk mengelola keuangan harian &
                mengirim laporan bug, serta Dashboard Admin untuk menyetujui (ACC) pendaftaran user
                baru dan mengelola akses akun.
              </p>
            </div>

            {/* Bottom 3 Feature Highlights inside Hero */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-white/10">
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08]">
                <span className="text-[11px] text-slate-400 block">Siklus Tanggal Gajian</span>
                <span className="font-display text-base sm:text-lg font-extrabold text-[#D4F826] mt-0.5 block">
                  Jatah Harian Aman
                </span>
                <span className="text-[11px] text-slate-400">
                  Jaga uang tetap cukup sampai gajian bulan depan
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08]">
                <span className="text-[11px] text-slate-400 block">Verifikasi Pendaftaran</span>
                <span className="font-display text-base sm:text-lg font-extrabold text-white mt-0.5 block">
                  ACC oleh Admin
                </span>
                <span className="text-[11px] text-slate-400">
                  Setiap pendaftaran user baru diverifikasi oleh Admin
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08]">
                <span className="text-[11px] text-slate-400 block">Layanan Pengguna</span>
                <span className="font-display text-base sm:text-lg font-extrabold text-[#D4F826] mt-0.5 block">
                  Lapor Bug & Saran
                </span>
                <span className="text-[11px] text-slate-400">
                  Kirim masukan langsung ke Dashboard Admin
                </span>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Authentication & Registration Card */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#11131E] rounded-[32px] p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.08] space-y-5 h-full flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <BrandLogo size="md" className="w-11 h-11 shadow-xs" />
                    <span className="text-xs text-slate-400 font-medium">
                      Admin & User Portal
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white pt-1">
                    {mode === 'login' ? 'Masuk ke Super App' : 'Daftar Akun User Baru'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {mode === 'login'
                      ? 'Masuk sebagai User atau Admin menggunakan email dan password Anda.'
                      : 'Pendaftaran akun User baru akan menunggu ACC dari Admin sebelum aktif.'}
                  </p>
                </div>

                {/* Segmented Mode Switcher */}
                <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-[#0B0D15] border border-slate-200/60 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      mode === 'login'
                        ? 'bg-white dark:bg-[#191C2B] text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Masuk (User / Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      mode === 'register'
                        ? 'bg-white dark:bg-[#191C2B] text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Daftar User Baru
                  </button>
                </div>

                {mode === 'register' && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                    <Clock size={14} className="shrink-0 mt-0.5" />
                    <span>
                      Setiap pendaftaran akun User baru wajib di-ACC oleh Admin di Dashboard Admin
                      agar akun dapat aktif.
                    </span>
                  </div>
                )}

                {/* Error Alert */}
                <AnimatePresence mode="wait">
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400 font-semibold"
                    >
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {mode === 'register' && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Nama Lengkap / Panggilan
                      </label>
                      <div className="relative">
                        <UserIcon
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Contoh: Budi Santoso"
                          required
                          autoComplete="name"
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#0B0D15] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826] transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                        required
                        autoComplete="email"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#0B0D15] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'register' ? 'Minimal 6 karakter' : 'Masukkan password'}
                        required
                        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                        className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#0B0D15] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Konfirmasi Password
                      </label>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi password Anda"
                          required
                          autoComplete="new-password"
                          className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#0B0D15] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                          tabIndex={-1}
                          aria-label={
                            showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'
                          }
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-5 rounded-full bg-[#D4F826] hover:bg-[#cbf11e] text-black font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2 whitespace-nowrap"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin text-black" />
                    ) : (
                      <>
                        <span>
                          {mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun User (Menunggu ACC)'}
                        </span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Footer Switch Link */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5">
                <div className="text-center">
                  {mode === 'login' ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Belum memiliki akun?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('register')}
                        className="font-bold text-slate-900 dark:text-[#D4F826] hover:underline cursor-pointer"
                      >
                        Daftar Akun Baru
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sudah memiliki akun?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="font-bold text-slate-900 dark:text-[#D4F826] hover:underline cursor-pointer"
                      >
                        Masuk di sini
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}

