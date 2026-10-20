'use client';

import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  PieChart,
  Sparkles,
  Loader2,
  Sun,
  Moon,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './AppContext';

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
    <div className="min-h-screen w-full bg-[#F5F6F8] dark:bg-[#0B0C10] text-gray-900 dark:text-white flex flex-col lg:flex-row selection:bg-[#D4F826] selection:text-black">
      {/* Left Column: Brand Hero Panel (Visible on Desktop lg+) */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] bg-[#14161C] text-white p-12 xl:p-16 flex-col justify-between relative overflow-hidden">
        {/* Subtle ambient glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#D4F826]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#D4F826] text-black font-black flex items-center justify-center text-xl shadow-md">
            D.
          </div>
          <span className="text-2xl font-black tracking-tight text-white">Dompt.</span>
        </div>

        {/* Main Value Proposition */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto py-12">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#D4F826]">
            Smart Personal Finance Tracker
          </p>
          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.12] text-white">
            Kelola uang, anggaran & target finansial dalam satu ruang pribadi.
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Setiap akun memiliki ruang pencatatan mandiri yang terisolasi. Pantau arus kas harian,
            atur alokasi 50/30/20, dan capai target tabungan Anda mulai dari nol.
          </p>

          <div className="pt-4 space-y-3.5">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 text-[#D4F826] flex items-center justify-center shrink-0 mt-0.5">
                <Wallet size={18} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Multi-Dompet & Akun Mandiri</h3>
                <p className="text-xs text-gray-400">
                  Data dompet, transaksi, aset, dan tagihan tersimpan khusus untuk akun Anda.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 text-[#D4F826] flex items-center justify-center shrink-0 mt-0.5">
                <PieChart size={18} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Budgeting Otomatis 50/30/20</h3>
                <p className="text-xs text-gray-400">
                  Bagi pemasukan bulanan ke Kebutuhan, Keinginan, dan Tabungan secara terukur.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 text-[#D4F826] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Scan Struk & AI Financial Advisor</h3>
                <p className="text-xs text-gray-400">
                  Catat transaksi otomatis dari foto struk belanja dan analisis kesehatan keuangan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security Footnote */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-gray-400">
          <ShieldCheck size={16} className="text-[#D4F826]" />
          <span>Data terenkripsi & terpisah untuk setiap akun email terdaftar</span>
        </div>
      </div>

      {/* Right Column: Login & Register Form */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative">
        {/* Top Bar (Mobile Logo + Theme Toggle) */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto lg:max-w-none">
          <div className="flex items-center gap-2.5 lg:invisible">
            <div className="w-9 h-9 rounded-xl bg-[#D4F826] text-black font-black flex items-center justify-center text-lg shadow-xs">
              D.
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
              Dompt.
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-[#16181D] border border-gray-200/80 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shadow-2xs"
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            aria-label="Ganti Tema"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Auth Card Container */}
        <div className="w-full max-w-md mx-auto my-auto py-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-[#16181D] rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-gray-800/90 space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D4F826] text-black font-black flex items-center justify-center text-2xl shadow-md">
                D.
              </div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                {mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Dompt Baru'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {mode === 'login'
                  ? 'Masuk dengan email dan password untuk mengakses catatan keuangan Anda.'
                  : 'Daftar sekarang untuk memulai pencatatan keuangan pribadi dari Rp 0.'}
              </p>
            </div>

            {/* Segmented Mode Switcher (Masuk / Daftar Baru) */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-gray-100 dark:bg-[#0F1115] border border-gray-200/60 dark:border-gray-800">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-[#1E2128] text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white dark:bg-[#1E2128] text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Daftar Baru
              </button>
            </div>

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
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300">
                    Nama Lengkap / Panggilan
                  </label>
                  <div className="relative">
                    <UserIcon
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Trisna"
                      required
                      autoComplete="name"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#0F1115] border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#D4F826] transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#0F1115] border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#D4F826] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Minimal 6 karakter' : 'Masukkan password'}
                    required
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    className="w-full pl-10 pr-11 py-3 rounded-2xl bg-gray-50 dark:bg-[#0F1115] border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#D4F826] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password Anda"
                      required
                      autoComplete="new-password"
                      className="w-full pl-10 pr-11 py-3 rounded-2xl bg-gray-50 dark:bg-[#0F1115] border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#D4F826] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
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
                className="w-full py-3.5 px-4 rounded-2xl bg-[#D4F826] hover:bg-[#cbf11e] text-black font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin text-black" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Masuk ke Akun' : 'Daftar & Buat Akun'}</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Footer Switch Link */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 text-center">
              {mode === 'login' ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Belum memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-extrabold text-gray-900 dark:text-[#D4F826] hover:underline cursor-pointer"
                  >
                    Daftar Akun Baru
                  </button>
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sudah memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-extrabold text-gray-900 dark:text-[#D4F826] hover:underline cursor-pointer"
                  >
                    Masuk di sini
                  </button>
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom Copyright */}
        <div className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>Dompt Personal Finance &bull; Privasi & Keamanan Terjaga</span>
        </div>
      </div>
    </div>
  );
}
