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
  CalendarClock,
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
    <div className="min-h-screen w-full bg-[#F6F7FB] dark:bg-[#08090F] bg-noise-subtle text-slate-900 dark:text-white flex flex-col selection:bg-[#D4F826] selection:text-black">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#F6F7FB]/85 dark:bg-[#08090F]/85 border-b border-slate-200/80 dark:border-white/[0.08] px-6 py-4 flex items-center justify-between gap-8">
        <a
          href="#auth-hero"
          className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          Dompt.
        </a>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <a
            href="#auth-hero"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Arsitektur
          </a>
          <a
            href="#capabilities"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Kapabilitas
          </a>
          <a
            href="#proof"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Bukti Dampak
          </a>
          <a
            href="#testimonials"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Studi Kasus
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="px-4 py-2 rounded-full bg-[#D4F826] hover:bg-[#cbf11e] text-black font-bold text-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            {mode === 'login' ? 'Buat Akun Baru' : 'Masuk ke Akun'}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-16 lg:space-y-24">
        {/* Section 1: Split Aspherical Hero + Auth Portal */}
        <section id="auth-hero" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left 7 Cols: Editorial Value Proposition & Custom 3D Geometric Visual Art */}
          <div className="lg:col-span-7 rounded-[32px] p-8 sm:p-10 lg:p-12 bg-gradient-to-br from-[#0D0F1A] via-[#13172B] to-[#090A10] text-white border border-white/10 flex flex-col justify-between relative overflow-hidden">
            {/* Ambient Deep Indigo, Cyber-Orange & Holographic Violet Glows */}
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#8B5CF6]/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#FF6B2B]/15 blur-3xl pointer-events-none" />

            {/* Top Utility Row inside Hero */}
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="text-[#D4F826] font-semibold">Personal Finance OS</span>
                <span aria-hidden="true">·</span>
                <span>Isolasi Multi-Akun Mandiri</span>
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
                className="font-display font-extrabold tracking-tight text-white leading-[1.08] text-balance"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)' }}
              >
                Kendalikan Arus Kas, Dompet & Anggaran 50/30/20 Secara Presisi.
              </h1>
              <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-xl">
                Setiap akun memiliki ruang pencatatan mandiri yang terisolasi. Pisahkan kuota
                operasional harian dari tagihan rutin, pantau mutasi dompet secara real-time,
                dan bangun ketahanan dana darurat dari nol.
              </p>
            </div>

            {/* Interactive Live Telemetry Preview Strip inside Hero */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-white/10">
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08]">
                <span className="text-[11px] text-slate-400 block">Alokasi Otomatis</span>
                <span className="font-display font-mono-num text-lg font-extrabold text-[#D4F826] mt-0.5 block">
                  50 / 30 / 20
                </span>
                <span className="text-[11px] text-slate-400">Kebutuhan · Gaya Hidup · Tabungan</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08]">
                <span className="text-[11px] text-slate-400 block">Sinkronisasi Saldo</span>
                <span className="font-display font-mono-num text-lg font-extrabold text-white mt-0.5 block">
                  Real-Time
                </span>
                <span className="text-[11px] text-slate-400">Multi-Dompet & Cicilan Utang</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08]">
                <span className="text-[11px] text-slate-400 block">Keamanan Ruang</span>
                <span className="font-display font-mono-num text-lg font-extrabold text-[#FF6B2B] mt-0.5 block">
                  100% Terisolasi
                </span>
                <span className="text-[11px] text-slate-400">Terenkripsi per Akun Email</span>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Glassmorphic Authentication & Registration Card */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#11131E] rounded-[32px] p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.08] space-y-6 h-full flex flex-col justify-between"
            >
              <div className="space-y-5">
                {/* Header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-[#D4F826] text-black font-display font-extrabold flex items-center justify-center text-lg">
                      D.
                    </div>
                    <span className="text-xs text-slate-400 font-mono-num">
                      Akses Cloud & Lokal
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white pt-2">
                    {mode === 'login' ? 'Masuk ke Ruang Finansial' : 'Buat Akun Dompt Baru'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {mode === 'login'
                      ? 'Gunakan email dan password untuk membuka catatan keuangan pribadi Anda.'
                      : 'Daftar sekarang untuk memulai pencatatan keuangan pribadi yang bersih dari Rp 0.'}
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
                    Masuk
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
                          placeholder="Contoh: Trisna"
                          required
                          autoComplete="name"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#0B0D15] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826] transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
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
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#0B0D15] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
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
                        className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50 dark:bg-[#0B0D15] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826] transition-colors"
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
                    <div className="space-y-1.5">
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
                          className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50 dark:bg-[#0B0D15] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826] transition-colors"
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
                        <span>{mode === 'login' ? 'Masuk ke Akun' : 'Daftar & Buat Akun'}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Footer Switch Link */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] text-center">
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
            </motion.div>
          </div>
        </section>

        {/* Section 2: Asymmetric Bento Capabilities Grid */}
        <section id="capabilities" className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold text-indigo-600 dark:text-[#D4F826]">
              Kapabilitas Sistem
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance">
              Dirancang untuk Kejelasan Likuiditas & Disiplin Anggaran
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-white dark:bg-[#11131E] rounded-[28px] p-7 border border-slate-200/80 dark:border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
                <Wallet size={20} />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                01. Rekonsiliasi Multi-Dompet & Dana Dicadangkan
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Setiap transaksi otomatis memotong saldo Siap Pakai pada dompet aktif, sambil
                memisahkan dana yang sudah dialokasikan untuk Goals dan Tabungan agar tidak
                terpakai tanpa sengaja.
              </p>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-[#11131E] rounded-[28px] p-7 border border-slate-200/80 dark:border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6B2B]/15 text-[#FF6B2B] flex items-center justify-center">
                <PieChart size={20} />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                02. Orkestrasi Anggaran 50/30/20
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Bagi estimasi pemasukan ke pos Kebutuhan, Keinginan, dan Tabungan dengan perhitungan
                kuota operasional harian otomatis.
              </p>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-[#11131E] rounded-[28px] p-7 border border-slate-200/80 dark:border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
                <CalendarClock size={20} />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                03. Relasi Tagihan Rutin & Cicilan Utang
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Jadwal langganan bulanan dan pembayaran cicilan utang langsung terhubung ke pos
                anggaran bulan berjalan tanpa duplikasi pencatatan.
              </p>
            </div>

            <div className="lg:col-span-7 bg-white dark:bg-[#11131E] rounded-[28px] p-7 border border-slate-200/80 dark:border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D4F826]/30 dark:bg-[#D4F826]/15 text-slate-900 dark:text-[#D4F826] flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                04. Ekstraksi Struk AI & Skor Kesehatan Finansial
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Unggah foto struk belanja untuk mengisi nominal dan kategori secara otomatis, serta
                evaluasi rasio likuiditas, utang, dan dana darurat Anda setiap bulan.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Proof of Impact & Attributable Testimonials */}
        <section id="proof" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 bg-[#0E101A] text-white rounded-[28px] p-7 border border-white/10 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#D4F826]">Dampak Terukur</span>
              <h3 className="font-display text-2xl font-extrabold tracking-tight">
                Transparansi Penuh Atas Setiap Rupiah
              </h3>
            </div>
            <div className="space-y-4">
              <div className="pt-3 border-t border-white/10">
                <div className="font-display font-mono-num text-2xl font-extrabold text-[#D4F826]">
                  +34% Rasio Tabungan
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Peningkatan rata-rata alokasi tabungan pengguna setelah 3 siklus anggaran bulanan
                </p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <div className="font-display font-mono-num text-2xl font-extrabold text-white">
                  Rp 4,8 Jt / Tahun
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rata-rata penghematan dari deteksi tagihan langganan pasif dan pengeluaran mikro
                </p>
              </div>
            </div>
          </div>

          <div
            id="testimonials"
            className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            <div className="bg-white dark:bg-[#11131E] rounded-[28px] p-6 border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                &ldquo;Pemisahan antara kuota harian dan pos tagihan tetap membuat saya tidak pernah lagi
                kehabisan saldo sebelum akhir bulan. Seluruh mutasi dompet langsung sinkron.&rdquo;
              </p>
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Nadia Kusuma</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Product Operations Lead · Studio Kinetik Jakarta
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#11131E] rounded-[28px] p-6 border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                &ldquo;Relasi antara pembayaran cicilan utang dan pemotongan budget otomatis sangat
                membantu menjaga arus kas keluarga tetap realistis dan terukur.&rdquo;
              </p>
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Rendra Pratama</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Principal Architect · Arka Spatial Design
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Architectural Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/[0.08] py-8 px-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-500" />
            <span>Dompt Personal Finance · Enkripsi & Isolasi Data Mandiri per Akun</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#auth-hero" className="hover:text-slate-900 dark:hover:text-white">
              Masuk Akun
            </a>
            <span aria-hidden="true">·</span>
            <a href="#capabilities" className="hover:text-slate-900 dark:hover:text-white">
              Kapabilitas
            </a>
            <span aria-hidden="true">·</span>
            <span>© {new Date().getFullYear()} Dompt.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
