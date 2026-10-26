'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Check,
  FileSpreadsheet,
  RotateCcw,
  Camera,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Users,
  AlertTriangle,
  Loader2,
  BookOpen,
  Upload,
  X,
  ShieldCheck,
  Bug,
  KeyRound,
  Eye,
  EyeOff,
  ChevronRight,
  UserPen,
  Palette,
  SlidersHorizontal,
  Database,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { DailyDeficitMode, DailySurplusMode } from '@/lib/types';
import { formatRupiah } from '@/lib/formatters';

export function SettingsTab() {
  const {
    settings,
    updateSettings,
    dashboardSummary,
    budgetConfig,
    toggleHideBalance,
    setThemeMode,
    setAccentColor,
    setAppPin,
    disableAppPin,
    verifyPinCode,
    lockApp,
    exportToCSV,
    resetAllAppData,
    addToast,
    user,
    openLoginModal,
    signOutUser,
    setActiveTab,
    dataResetVersion,
    isAdmin,
    userAccountStatus,
    managedUsers,
    bugReports,
    changeAccountPassword,
  } = useApp();

  const savedDisplayName = settings.userName || user?.displayName || 'Pengguna';
  const savedEmail = user?.email || settings.userEmail || '';

  const [userNameInput, setUserNameInput] = useState(savedDisplayName);
  const [emailInput, setEmailInput] = useState(savedEmail);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Sync local form inputs whenever user session or settings change
  useEffect(() => {
    const timer = setTimeout(() => {
      setUserNameInput(settings.userName || user?.displayName || 'Pengguna');
      setEmailInput(user?.email || settings.userEmail || '');
    }, 0);
    return () => clearTimeout(timer);
  }, [settings.userName, settings.userEmail, user?.displayName, user?.email, dataResetVersion]);

  const themeChoice = settings.themeMode || 'light';
  const accentChoice = settings.accentColor || 'lime';
  const isPink = accentChoice === 'pink';
  const isOrange = accentChoice === 'orange';
  const isPlum = accentChoice === 'plum';

  const accentBg = isPlum
    ? 'bg-[#71325A] text-white'
    : isOrange
    ? 'bg-[#FF6B00] text-white'
    : isPink
    ? 'bg-[#FFA4A4] text-black'
    : 'bg-[#D4F826] text-black';

  const accentBtn = isPlum
    ? 'bg-[#71325A] hover:bg-[#5E274A] text-white'
    : isOrange
    ? 'bg-[#FF6B00] hover:bg-[#ea5e00] text-white'
    : isPink
    ? 'bg-[#FFA4A4] hover:bg-[#ff8e8e] text-black'
    : 'bg-[#D4F826] hover:bg-[#c6ec15] text-black';

  const accentBorder = isPlum
    ? 'border-[#71325A]'
    : isOrange
    ? 'border-[#FF6B00]'
    : isPink
    ? 'border-[#FFA4A4]'
    : 'border-[#D4F826]';

  const accentFocusRing = isPlum
    ? 'focus:ring-[#71325A]'
    : isOrange
    ? 'focus:ring-[#FF6B00]'
    : isPink
    ? 'focus:ring-[#FFA4A4]'
    : 'focus:ring-[#D4F826]';

  const accentIconColor = isPlum
    ? 'text-[#A855F7]'
    : isOrange
    ? 'text-[#EA580C]'
    : isPink
    ? 'text-[#F43F5E]'
    : 'text-[#65A30D] dark:text-[#D4F826]';

  // PIN states (Create, Change with verification, Disable with verification)
  const [pinActionMode, setPinActionMode] = useState<'none' | 'create' | 'change' | 'disable'>('none');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Change Password states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [showPwdFields, setShowPwdFields] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  // Reset Confirmation Modal state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Avatar Modal & Upload state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const currentAvatar = settings.avatarUrl || user?.photoURL || '👩‍💼';
  const [avatarPreview, setAvatarPreview] = useState<string>(currentAvatar);
  const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);
  const [failedPreviewSrc, setFailedPreviewSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PRESET_AVATARS = [
    '👩‍💼', '👨‍💼', '🧑‍💻', '👩‍💻', '🦊', '🦁', '🐱', '🐼',
    '🐻', '🦄', '🚀', '💎', '👑', '💼', '🕶️', '☕',
    '🌟', '💰', '🎯', '🏖️', '⚡', '🏆', '🔥', '🛡️',
  ];

  const pendingAdminTasks =
    managedUsers.filter((u) => u.status === 'pending').length +
    bugReports.filter((b) => b.status === 'open').length;

  const currentSurplusMode: DailySurplusMode =
    settings.dailySurplusMode ||
    budgetConfig?.dailySurplusMode ||
    budgetConfig?.settings?.dailySurplusMode ||
    'rollover';

  const currentDeficitMode: DailyDeficitMode =
    settings.dailyDeficitMode ||
    budgetConfig?.dailyDeficitMode ||
    budgetConfig?.settings?.dailyDeficitMode ||
    'spread_deficit';

  const isProfileDirty =
    userNameInput.trim() !== savedDisplayName ||
    (!user?.email && emailInput.trim() !== savedEmail);

  const resetPinForm = () => {
    setPinActionMode('none');
    setCurrentPinInput('');
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (!oldPasswordInput) {
      setPwdError('Masukkan password lama Anda.');
      return;
    }
    if (newPasswordInput.length < 6) {
      setPwdError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      setPwdError('Konfirmasi password baru tidak cocok.');
      return;
    }
    setPwdSaving(true);
    try {
      const res = await changeAccountPassword(oldPasswordInput, newPasswordInput);
      if (!res.ok) {
        setPwdError(res.error || 'Gagal mengubah password.');
        return;
      }
      setOldPasswordInput('');
      setNewPasswordInput('');
      setConfirmNewPasswordInput('');
      setIsChangingPassword(false);
    } finally {
      setPwdSaving(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Format Tidak Didukung', 'Pilih file gambar (JPG, PNG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarPreview(dataUrl);
          setFailedPreviewSrc(null);
        }
      };
      img.onerror = () => {
        addToast('Gagal Memuat Gambar', 'File gambar tidak dapat diproses.', 'error');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveAvatar = () => {
    updateSettings({ avatarUrl: avatarPreview }, true);
    setIsAvatarModalOpen(false);
    addToast('Foto Diperbarui', 'Avatar profil berhasil disimpan.');
  };

  const handleResetAvatar = () => {
    const defaultAvatar = '👩‍💼';
    setAvatarPreview(defaultAvatar);
    updateSettings({ avatarUrl: defaultAvatar }, true);
    setIsAvatarModalOpen(false);
    addToast('Avatar Direset', 'Avatar dikembalikan ke karakter default.');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = userNameInput.trim() || user?.displayName || 'Pengguna';
    const cleanEmail = user?.email ? user.email : emailInput.trim();
    updateSettings(
      {
        userName: cleanName,
        userEmail: cleanEmail,
      },
      true
    );
    setUserNameInput(cleanName);
    setEmailInput(cleanEmail);
    setIsEditingProfile(false);
    addToast('Profil Diperbarui', 'Identitas tampilan berhasil disimpan.');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (pinActionMode === 'disable') {
      if (currentPinInput.length !== 4) {
        setPinError('Masukkan 4 digit PIN saat ini.');
        return;
      }
      if (!verifyPinCode(currentPinInput)) {
        setPinError('PIN saat ini tidak sesuai.');
        return;
      }
      disableAppPin();
      resetPinForm();
      return;
    }

    if (pinActionMode === 'change') {
      if (currentPinInput.length !== 4) {
        setPinError('Masukkan 4 digit PIN lama Anda.');
        return;
      }
      if (!verifyPinCode(currentPinInput)) {
        setPinError('PIN lama yang dimasukkan salah.');
        return;
      }
    }

    if (newPin.length !== 4) {
      setPinError('PIN baru wajib terdiri dari 4 angka.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    setAppPin(newPin);
    resetPinForm();
  };

  const isAvatarImage =
    failedAvatarSrc !== currentAvatar &&
    (currentAvatar.startsWith('http') || currentAvatar.startsWith('data:'));
  const isPreviewImage =
    failedPreviewSrc !== avatarPreview &&
    (avatarPreview.startsWith('http') || avatarPreview.startsWith('data:'));

  return (
    <div className="space-y-5 lg:space-y-6 pb-28 lg:pb-12">
      {/* Page Header */}
      <div className="pt-2 lg:pt-0 px-1 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Profil & Pengaturan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola identitas akun, tampilan antarmuka, logika kuota harian, serta keamanan data.
          </p>
        </div>
      </div>

      {/* Balanced 2-Column Desktop Grid */}
      <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
        {/* LEFT COLUMN: 1. Profil & Akun + 2. Tampilan & Privasi + 3. Keamanan */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. KARTU PROFIL & IDENTITAS AKUN */}
          <section className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-white/[0.08] space-y-5">
            {/* Top Identity Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 shrink-0">
                  <div
                    className={`w-full h-full rounded-2xl border-2 ${accentBorder} overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-colors`}
                  >
                    {isAvatarImage ? (
                      <img
                        src={currentAvatar}
                        alt={savedDisplayName}
                        referrerPolicy="no-referrer"
                        onError={() => setFailedAvatarSrc(currentAvatar)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl select-none">
                        {currentAvatar.startsWith('http') || currentAvatar.startsWith('data:')
                          ? '👩‍💼'
                          : currentAvatar}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarPreview(currentAvatar);
                      setIsAvatarModalOpen(true);
                    }}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    title="Ubah Foto Profil"
                    aria-label="Ubah Foto Profil"
                  >
                    <Camera size={13} />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                      {savedDisplayName}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {savedEmail || 'Belum ada email tersimpan'}
                  </p>
                  <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isAdmin ? 'Administrator' : user ? 'Akun Cloud' : 'Mode Tamu'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        user
                          ? userAccountStatus === 'active'
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-amber-600 dark:text-amber-400 font-semibold'
                          : 'text-slate-400 dark:text-slate-500'
                      }
                    >
                      {user
                        ? userAccountStatus === 'active'
                          ? 'Sinkronisasi Aktif'
                          : userAccountStatus === 'pending'
                          ? 'Menunggu ACC'
                          : 'Nonaktif'
                        : 'Penyimpanan Lokal'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingProfile((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border ${
                  isEditingProfile
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10'
                }`}
              >
                <UserPen size={13} />
                <span>{isEditingProfile ? 'Tutup' : 'Edit'}</span>
              </button>
            </div>

            {/* Inline Collapsible Profile Editor */}
            <AnimatePresence initial={false}>
              {isEditingProfile && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSaveProfile}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] space-y-3.5">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                          Nama Tampilan
                        </label>
                        <input
                          type="text"
                          value={userNameInput}
                          onChange={(e) => setUserNameInput(e.target.value)}
                          placeholder="Nama panggilan Anda"
                          required
                          className={`w-full px-3.5 py-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                          Alamat Email {user?.email ? '(Terhubung ke Akun)' : '(Opsional)'}
                        </label>
                        <input
                          type="email"
                          value={emailInput}
                          readOnly={Boolean(user?.email)}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="nama@email.com"
                          className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium focus:outline-none ${
                            user?.email
                              ? 'bg-slate-100 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 cursor-not-allowed'
                              : `bg-white dark:bg-[#11131A] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 ${accentFocusRing}`
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserNameInput(savedDisplayName);
                          setEmailInput(savedEmail);
                          setIsEditingProfile(false);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-200/70 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={!isProfileDirty && userNameInput.trim() === savedDisplayName}
                        className={`px-4 py-2 ${accentBtn} text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50`}
                      >
                        <Check size={14} strokeWidth={2.5} />
                        <span>Simpan Perubahan</span>
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Account Actions */}
            {user ? (
              <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Users size={15} />
                    <span>Ganti Akun</span>
                  </button>
                  <button
                    type="button"
                    onClick={signOutUser}
                    className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span>Keluar</span>
                  </button>
                </div>

                <div className={`grid gap-2.5 ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('feedback')}
                    className="py-2.5 px-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Bug size={14} className="text-amber-500" />
                    <span>Lapor Kendala / Bug</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('admin')}
                      className={`py-2.5 px-3.5 rounded-xl ${accentBtn} text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer`}
                    >
                      <ShieldCheck size={15} />
                      <span>
                        Panel Admin
                        {pendingAdminTasks > 0 ? ` (${pendingAdminTasks})` : ''}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Masuk atau daftarkan akun agar catatan transaksi, dompet, dan anggaran tersinkronisasi otomatis di semua perangkat.
                </p>
                <button
                  type="button"
                  onClick={openLoginModal}
                  className={`w-full py-2.5 px-4 rounded-xl ${accentBtn} text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer`}
                >
                  <LogIn size={15} />
                  <span>Masuk / Daftar Akun Cloud</span>
                </button>
              </div>
            )}
          </section>

          {/* 2. TAMPILAN & PRIVASI */}
          <section className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-white/[0.08] space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center shrink-0">
                <Palette size={17} className={accentIconColor} />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Tampilan & Privasi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sesuaikan tema layar, warna aksen, dan visibilitas saldo.
                </p>
              </div>
            </div>

            {/* Privasi Nominal Saldo */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Samarkan Nominal Saldo
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sembunyikan angka rupiah di beranda & dompet (<span className="font-mono">Rp •••••••</span>).
                </p>
              </div>
              <button
                type="button"
                onClick={toggleHideBalance}
                role="switch"
                aria-checked={settings.hideBalance}
                aria-label="Samarkan Nominal Saldo"
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer shrink-0 ${
                  settings.hideBalance ? accentBg : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    settings.hideBalance ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Mode Tema */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Mode Tema
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    themeChoice === 'light'
                      ? 'bg-white dark:bg-[#1E222B] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sun
                    size={15}
                    className={themeChoice === 'light' ? 'text-amber-500' : 'text-slate-400'}
                  />
                  <span>Mode Terang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    themeChoice === 'dark'
                      ? 'bg-white dark:bg-[#1E222B] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Moon
                    size={15}
                    className={themeChoice === 'dark' ? 'text-indigo-400' : 'text-slate-400'}
                  />
                  <span>Mode Gelap</span>
                </button>
              </div>
            </div>

            {/* Warna Aksen */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Warna Aksen Utama
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'lime' as const, label: 'Lime', hex: '#D4F826' },
                  { id: 'pink' as const, label: 'Pink', hex: '#FFA4A4' },
                  { id: 'orange' as const, label: 'Oranye', hex: '#FF6B00' },
                  { id: 'plum' as const, label: 'Plum', hex: '#71325A' },
                ].map((swatch) => {
                  const active = accentChoice === swatch.id;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      data-swatch={swatch.id}
                      onClick={() => {
                        setAccentColor(swatch.id);
                        if (accentChoice !== swatch.id) {
                          addToast('Warna Aksen', `Tema aksen diubah ke ${swatch.label}.`, 'info');
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        active
                          ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-white/[0.08] text-slate-900 dark:text-white font-bold shadow-2xs'
                          : 'border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <svg
                          viewBox="0 0 16 16"
                          className="w-3.5 h-3.5 shrink-0 overflow-visible"
                          aria-hidden="true"
                        >
                          <circle
                            cx="8"
                            cy="8"
                            r="7"
                            fill={swatch.hex}
                            stroke="currentColor"
                            strokeOpacity="0.15"
                            strokeWidth="1"
                          />
                        </svg>
                        <span className="truncate">{swatch.label}</span>
                      </span>
                      {active && <Check size={13} strokeWidth={2.5} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 3. KEAMANAN & AKSES */}
          <section className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center shrink-0">
                  <Lock size={17} className={accentIconColor} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Keamanan & PIN
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kunci layar aplikasi & kata sandi akun.
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                PIN ·{' '}
                <strong
                  className={
                    settings.pinEnabled
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-slate-400 dark:text-slate-500'
                  }
                >
                  {settings.pinEnabled ? 'Aktif' : 'Nonaktif'}
                </strong>
              </span>
            </div>

            {settings.pinEnabled ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={lockApp}
                  className={`py-2.5 px-3 rounded-xl ${accentBtn} text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5`}
                >
                  <Lock size={13} />
                  <span>Kunci</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pinActionMode === 'change') {
                      resetPinForm();
                    } else {
                      resetPinForm();
                      setPinActionMode('change');
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    pinActionMode === 'change'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200'
                  }`}
                >
                  Ubah PIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pinActionMode === 'disable') {
                      resetPinForm();
                    } else {
                      resetPinForm();
                      setPinActionMode('disable');
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    pinActionMode === 'disable'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  Matikan
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (pinActionMode === 'create') {
                    resetPinForm();
                  } else {
                    resetPinForm();
                    setPinActionMode('create');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
              >
                {pinActionMode === 'create' ? 'Batal Pasang PIN' : 'Pasang Kunci PIN 4 Digit'}
              </button>
            )}

            {/* Form PIN (Create / Change / Disable) */}
            {pinActionMode !== 'none' && (
              <form
                onSubmit={handlePinSubmit}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] space-y-3"
              >
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {pinActionMode === 'create'
                    ? 'Buat PIN 4 angka baru'
                    : pinActionMode === 'change'
                    ? 'Verifikasi PIN lama & masukkan PIN baru'
                    : 'Masukkan PIN saat ini untuk menonaktifkan kunci aplikasi'}
                </p>

                {(pinActionMode === 'change' || pinActionMode === 'disable') && (
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      PIN Saat Ini
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={currentPinInput}
                      onChange={(e) => {
                        setPinError('');
                        setCurrentPinInput(e.target.value.replace(/\D/g, ''));
                      }}
                      placeholder="••••"
                      required
                      className="w-full p-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-center font-mono text-sm font-bold tracking-widest tabular-nums text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                )}

                {(pinActionMode === 'create' || pinActionMode === 'change') && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        PIN Baru
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => {
                          setPinError('');
                          setNewPin(e.target.value.replace(/\D/g, ''));
                        }}
                        placeholder="4 Angka"
                        required
                        className="w-full p-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-center font-mono text-sm font-bold tracking-widest tabular-nums text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Ulangi PIN
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={confirmPin}
                        onChange={(e) => {
                          setPinError('');
                          setConfirmPin(e.target.value.replace(/\D/g, ''));
                        }}
                        placeholder="4 Angka"
                        required
                        className="w-full p-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-center font-mono text-sm font-bold tracking-widest tabular-nums text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {pinError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    {pinError}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetPinForm}
                    className="flex-1 py-2 bg-slate-200/70 dark:bg-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                      pinActionMode === 'disable'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : accentBtn
                    }`}
                  >
                    {pinActionMode === 'disable' ? 'Nonaktifkan PIN' : 'Simpan PIN'}
                  </button>
                </div>
              </form>
            )}

            {/* Ubah Password Login Section */}
            {user && (
              <div className="pt-3.5 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound size={15} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Kata Sandi Akun ({user.email})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPwdError('');
                      setIsChangingPassword((prev) => !prev);
                    }}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer shrink-0"
                  >
                    {isChangingPassword ? 'Tutup' : 'Ubah Sandi'}
                  </button>
                </div>

                {isChangingPassword && (
                  <form
                    onSubmit={handleSaveNewPassword}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Perbarui Kata Sandi
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPwdFields((p) => !p)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {showPwdFields ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{showPwdFields ? 'Sembunyikan' : 'Tampilkan'}</span>
                      </button>
                    </div>

                    <input
                      type={showPwdFields ? 'text' : 'password'}
                      value={oldPasswordInput}
                      onChange={(e) => setOldPasswordInput(e.target.value)}
                      placeholder="Password saat ini"
                      required
                      className="w-full px-3 py-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    />
                    <input
                      type={showPwdFields ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Password baru (min. 6 karakter)"
                      required
                      className="w-full px-3 py-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    />
                    <input
                      type={showPwdFields ? 'text' : 'password'}
                      value={confirmNewPasswordInput}
                      onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                      placeholder="Konfirmasi password baru"
                      required
                      className="w-full px-3 py-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    />

                    {pwdError && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                        {pwdError}
                      </p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPwdError('');
                        }}
                        className="flex-1 py-2 bg-slate-200/70 dark:bg-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={pwdSaving}
                        className={`flex-1 py-2 ${accentBtn} rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50`}
                      >
                        {pwdSaving ? 'Menyimpan...' : 'Simpan Sandi'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: 4. Logika Kuota Harian + 5. Manajemen Data & Panduan */}
        <div className="lg:col-span-7 space-y-5">
          {/* 4. LOGIKA KUOTA HARIAN (SURPLUS & DEFISIT) */}
          <section className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-white/[0.08] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center shrink-0">
                  <SlidersHorizontal size={17} className={accentIconColor} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Logika Kuota Harian
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Atur cara sistem mengolah sisa (surplus) atau kelebihan (defisit) budget harian.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('budget')}
                className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 self-start sm:self-auto shrink-0 cursor-pointer transition-colors"
              >
                <span>Buka Anggaran</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            {/* Live Telemetry Bar: Ringkasan Kuota */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] grid grid-cols-3 gap-3 divide-x divide-slate-200/70 dark:divide-white/[0.08]">
              <div className="pr-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Jatah Hari Ini
                </span>
                <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1 block truncate">
                  {formatRupiah(dashboardSummary.dailyBudgetQuota, settings.hideBalance)}
                </span>
              </div>
              <div className="px-2 sm:px-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Proyeksi Besok
                </span>
                <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-emerald-600 dark:text-[#D4F826] mt-1 block truncate">
                  {settings.hideBalance
                    ? 'Rp •••••••'
                    : `~${formatRupiah(dashboardSummary.tomorrowDailyQuota, false)}`}
                </span>
              </div>
              <div className="pl-2 sm:pl-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block truncate">
                  {currentSurplusMode === 'save_weekend' ? 'Kuota Weekend' : 'Basis Normal'}
                </span>
                <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 mt-1 block truncate">
                  {settings.hideBalance
                    ? 'Rp •••••••'
                    : currentSurplusMode === 'save_weekend'
                    ? formatRupiah(dashboardSummary.weekendBudgetPool, false)
                    : `${formatRupiah(dashboardSummary.baseDailyQuota, false)}/hr`}
                </span>
              </div>
            </div>

            {/* 1. Skenario Surplus */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    1. Skenario Surplus · Jika Hari Ini Ada Sisa Budget
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {(
                  [
                    {
                      id: 'rollover' as DailySurplusMode,
                      title: 'Rollover (100% ke Hari Esok)',
                      desc: 'Sisa kuota hari ini ditambahkan penuh ke limit pengeluaran esok hari.',
                    },
                    {
                      id: 'averaging' as DailySurplusMode,
                      title: 'Averaging (Bagi Rata Sisa Hari)',
                      desc: 'Sisa kuota hari ini dibagi rata untuk menaikkan limit harian di seluruh sisa hari periode.',
                    },
                    {
                      id: 'save_weekend' as DailySurplusMode,
                      title: 'Save Weekend (Tabung ke Akhir Pekan)',
                      desc: 'Sisa kuota hari kerja disimpan ke kantong khusus Sabtu & Minggu (limit harian biasa tetap normal).',
                    },
                  ] as const
                ).map((opt) => {
                  const isSelected = currentSurplusMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        updateSettings({ dailySurplusMode: opt.id }, true);
                        addToast(
                          'Mode Surplus Diperbarui',
                          `Skenario surplus diatur ke ${opt.title}.`
                        );
                      }}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3.5 ${
                        isSelected
                          ? `${accentBorder} bg-slate-50/90 dark:bg-white/[0.06] shadow-2xs`
                          : 'border-slate-200/80 dark:border-white/10 hover:bg-slate-50/60 dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {opt.title}
                          </span>
                          {isSelected && (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              · Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? `${accentBg} border-transparent`
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Skenario Defisit */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <TrendingDown size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    2. Skenario Defisit · Jika Pengeluaran Melebihi Kuota
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(
                  [
                    {
                      id: 'spread_deficit' as DailyDeficitMode,
                      title: 'Spread Deficit (Bagi Rata)',
                      desc: 'Kelebihan pengeluaran hari ini dibagi rata untuk mengurangi limit harian di sisa hari periode.',
                    },
                    {
                      id: 'strict_penalty' as DailyDeficitMode,
                      title: 'Strict Penalty (Potong Besok)',
                      desc: 'Limit kuota esok hari langsung dipotong penuh sebesar kelebihan pengeluaran hari ini.',
                    },
                  ] as const
                ).map((opt) => {
                  const isSelected = currentDeficitMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        updateSettings({ dailyDeficitMode: opt.id }, true);
                        addToast(
                          'Mode Defisit Diperbarui',
                          `Skenario defisit diatur ke ${opt.title}.`
                        );
                      }}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? `${accentBorder} bg-slate-50/90 dark:bg-white/[0.06] shadow-2xs`
                          : 'border-slate-200/80 dark:border-white/10 hover:bg-slate-50/60 dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="space-y-1.5 w-full">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {opt.title}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                              isSelected
                                ? `${accentBg} border-transparent`
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 5. MANAJEMEN DATA & PANDUAN */}
          <section className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-white/[0.08] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center shrink-0">
                <Database size={17} className={accentIconColor} />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Data & Panduan Aplikasi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pelajari fitur Dompt, unduh laporan CSV, atau kosongkan seluruh data.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('tutorial')}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-3 text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <BookOpen size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Panduan Penggunaan Aplikasi
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Cara mengatur periode gajian, kuota harian, dompet, & scan struk AI.
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={exportToCSV}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3 text-left cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Ekspor CSV
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Unduh riwayat transaksi
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 hover:bg-rose-100/80 dark:hover:bg-rose-950/35 border border-rose-200/60 dark:border-rose-900/40 flex items-center gap-3 text-left cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <RotateCcw size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      Reset Semua Data
                    </p>
                    <p className="text-xs text-rose-500/80 dark:text-rose-400/70 truncate">
                      Kosongkan saldo & catatan
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Confirmation Modal for Reset Data */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#16181D] rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-white/[0.08] text-slate-900 dark:text-white space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="font-display text-lg font-extrabold">Reset Semua Data?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Seluruh transaksi, saldo dompet, dan konfigurasi anggaran akan dikosongkan ke nol. Tindakan ini bersifat permanen.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-white/[0.06] font-bold text-xs text-slate-700 dark:text-slate-300 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={async () => {
                    try {
                      setIsResetting(true);
                      await resetAllAppData();
                      setIsResetConfirmOpen(false);
                    } finally {
                      setIsResetting(false);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <RotateCcw size={15} />
                  )}
                  <span>{isResetting ? 'Mereset...' : 'Ya, Reset Data'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Avatar Picker & Upload Modal */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAvatarModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-white/[0.08] z-10 overflow-hidden space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    Foto & Karakter Profil
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Unggah foto pribadi atau pilih karakter avatar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Live Preview + Upload */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06]">
                <div
                  className={`w-16 h-16 rounded-2xl border-2 ${accentBorder} overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center shrink-0`}
                >
                  {isPreviewImage ? (
                    <img
                      src={avatarPreview}
                      alt="Pratinjau"
                      referrerPolicy="no-referrer"
                      onError={() => setFailedPreviewSrc(avatarPreview)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl select-none">
                      {avatarPreview.startsWith('http') || avatarPreview.startsWith('data:')
                        ? '👩‍💼'
                        : avatarPreview}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload size={14} />
                    <span>Unggah Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    className="w-full py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Kembalikan Default
                  </button>
                </div>
              </div>

              {/* Preset Emojis Grid */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Pilih Karakter Avatar
                </span>
                <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06]">
                  {PRESET_AVATARS.map((emoji) => {
                    const isSelected = avatarPreview === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatarPreview(emoji)}
                        className={`h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? `${accentBg} scale-105 shadow-2xs`
                            : 'hover:bg-white dark:hover:bg-white/[0.08]'
                        }`}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  className={`flex-1 py-2.5 rounded-2xl ${accentBtn} text-xs font-bold shadow-2xs cursor-pointer flex items-center justify-center gap-1.5`}
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>Simpan Avatar</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
