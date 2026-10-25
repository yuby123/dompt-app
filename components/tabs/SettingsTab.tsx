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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';

export function SettingsTab() {
  const {
    settings,
    updateSettings,
    toggleHideBalance,
    setThemeMode,
    setAccentColor,
    setAppPin,
    disableAppPin,
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

  // Sync local form inputs whenever user session or settings change
  useEffect(() => {
    setUserNameInput(settings.userName || user?.displayName || 'Pengguna');
    setEmailInput(user?.email || settings.userEmail || '');
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

  // PIN states
  const [isSettingPin, setIsSettingPin] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PRESET_AVATARS = [
    '👩‍💼', '👨‍💼', '🧑‍💻', '👩‍💻', '🦊', '🦁', '🐱', '🐼',
    '🐻', '🦄', '🚀', '💎', '👑', '💼', '🕶️', '☕',
    '🌟', '💰', '🎯', '🏖️', '⚡', '🏆', '🔥', '🛡️',
  ];

  const pendingAdminTasks =
    managedUsers.filter((u) => u.status === 'pending').length +
    bugReports.filter((b) => b.status === 'open').length;

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (!oldPasswordInput) {
      setPwdError('Masukkan password lama.');
      return;
    }
    if (newPasswordInput.length < 6) {
      setPwdError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      setPwdError('Konfirmasi password tidak cocok.');
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
        }
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
    setAvatarPreview('👩‍💼');
    updateSettings({ avatarUrl: '👩‍💼' }, true);
    setIsAvatarModalOpen(false);
    addToast('Avatar Direset', 'Avatar dikembalikan ke default.');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = userNameInput.trim() || user?.displayName || 'Pengguna';
    const cleanEmail = user?.email || emailInput.trim() || '';
    updateSettings(
      {
        userName: cleanName,
        userEmail: cleanEmail,
      },
      true
    );
    addToast('Profil Disimpan', 'Nama tampilan berhasil diperbarui.');
  };

  const handleCreatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      setPinError('PIN wajib 4 angka.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Konfirmasi PIN tidak cocok.');
      return;
    }
    setAppPin(newPin);
    setIsSettingPin(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  const isAvatarImage =
    currentAvatar.startsWith('http') || currentAvatar.startsWith('data:');
  const isPreviewImage =
    avatarPreview.startsWith('http') || avatarPreview.startsWith('data:');

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="pt-2 lg:pt-0 px-1">
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Profil & Pengaturan
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Kelola akun, keamanan, dan tampilan aplikasi.
        </p>
      </div>

      {/* Main Layout: 2 Columns on Desktop */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
        {/* Left Column: Unified Profile & Account + Security */}
        <div className="lg:col-span-5 space-y-4 lg:space-y-5">
          {/* 1. Unified Profile & Account Card */}
          <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/[0.08] space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative w-18 h-18 shrink-0">
                <div
                  className={`w-full h-full rounded-full border-2 ${accentBorder} overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-colors`}
                >
                  {isAvatarImage ? (
                    <img
                      src={currentAvatar}
                      alt={savedDisplayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">{currentAvatar}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview(currentAvatar);
                    setIsAvatarModalOpen(true);
                  }}
                  className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                  title="Ubah Foto Profil"
                  aria-label="Ubah Foto Profil"
                >
                  <Camera size={13} />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  {savedDisplayName}
                </h2>
                {savedEmail && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {savedEmail}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {isAdmin ? 'Admin' : user ? 'Akun Terhubung' : 'Mode Tamu'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      user
                        ? userAccountStatus === 'active'
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-amber-600 dark:text-amber-400 font-medium'
                        : 'text-slate-400'
                    }
                  >
                    {user
                      ? userAccountStatus === 'active'
                        ? 'Aktif'
                        : userAccountStatus === 'pending'
                        ? 'Menunggu ACC'
                        : 'Nonaktif'
                      : 'Penyimpanan Lokal'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Account Actions */}
            {user ? (
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Users size={14} />
                    <span>Ganti Akun</span>
                  </button>
                  <button
                    type="button"
                    onClick={signOutUser}
                    className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Keluar</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('feedback')}
                    className="py-2.5 px-3 rounded-xl border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Bug size={14} className="text-amber-500" />
                    <span>Lapor Bug</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('admin')}
                      className={`py-2.5 px-3 rounded-xl ${accentBtn} text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer`}
                    >
                      <ShieldCheck size={14} />
                      <span>
                        Panel Admin
                        {pendingAdminTasks > 0 ? ` (${pendingAdminTasks})` : ''}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Masuk akun untuk sinkronisasi otomatis antar perangkat.
                </p>
                <button
                  type="button"
                  onClick={openLoginModal}
                  className={`w-full py-2.5 px-4 rounded-xl ${accentBtn} text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer`}
                >
                  <LogIn size={15} />
                  <span>Masuk / Daftar Akun</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Keamanan Aplikasi */}
          <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock
                  size={16}
                  className={
                    isPlum
                      ? 'text-[#A855F7]'
                      : isOrange
                      ? 'text-[#EA580C]'
                      : isPink
                      ? 'text-[#F43F5E]'
                      : 'text-[#84CC16]'
                  }
                />
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Keamanan
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                PIN ·{' '}
                <strong
                  className={
                    settings.pinEnabled
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
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
                  className={`py-2 px-2.5 rounded-xl ${accentBtn} text-xs font-bold cursor-pointer transition-colors`}
                >
                  Kunci
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPinError('');
                    setNewPin('');
                    setConfirmPin('');
                    setIsSettingPin((v) => !v);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                >
                  Ubah PIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingPin(false);
                    disableAppPin();
                  }}
                  className="py-2 px-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer transition-colors"
                >
                  Matikan
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPinError('');
                  setNewPin('');
                  setConfirmPin('');
                  setIsSettingPin((v) => !v);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
              >
                Pasang PIN 4 Digit
              </button>
            )}

            {isSettingPin && (
              <form
                onSubmit={handleCreatePin}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] space-y-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => {
                      setPinError('');
                      setNewPin(e.target.value.replace(/\D/g, ''));
                    }}
                    placeholder="PIN 4 Angka"
                    required
                    className="p-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-center font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white focus:outline-none"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => {
                      setPinError('');
                      setConfirmPin(e.target.value.replace(/\D/g, ''));
                    }}
                    placeholder="Ulangi PIN"
                    required
                    className="p-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-center font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                {pinError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    {pinError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingPin(false);
                      setPinError('');
                    }}
                    className="flex-1 py-2 bg-slate-200/70 dark:bg-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2 ${accentBtn} rounded-xl text-xs font-bold cursor-pointer`}
                  >
                    Simpan PIN
                  </button>
                </div>
              </form>
            )}

            {/* Ubah Password Login Section */}
            {user && (
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound size={15} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Password Akun
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPwdError('');
                      setIsChangingPassword((prev) => !prev);
                    }}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                  >
                    {isChangingPassword ? 'Tutup' : 'Ubah'}
                  </button>
                </div>

                {isChangingPassword && (
                  <form
                    onSubmit={handleSaveNewPassword}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPwdFields((p) => !p)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {showPwdFields ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{showPwdFields ? 'Sembunyikan' : 'Lihat'}</span>
                      </button>
                    </div>

                    <input
                      type={showPwdFields ? 'text' : 'password'}
                      value={oldPasswordInput}
                      onChange={(e) => setOldPasswordInput(e.target.value)}
                      placeholder="Password lama"
                      required
                      className="w-full p-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    />
                    <input
                      type={showPwdFields ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Password baru (min. 6 karakter)"
                      required
                      className="w-full p-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    />
                    <input
                      type={showPwdFields ? 'text' : 'password'}
                      value={confirmNewPasswordInput}
                      onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                      placeholder="Ulangi password baru"
                      required
                      className="w-full p-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
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
                        className="flex-1 py-2 bg-slate-200/70 dark:bg-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={pwdSaving}
                        className={`flex-1 py-2 ${accentBtn} rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50`}
                      >
                        {pwdSaving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Preferensi Tampilan & Manajemen Data */}
        <div className="lg:col-span-7 space-y-4 lg:space-y-5">
          {/* 3. Preferensi & Tampilan */}
          <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/[0.08] space-y-5">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Tampilan & Preferensi
            </h3>

            {/* Form Profil Tampilan */}
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                    Nama Tampilan
                  </label>
                  <input
                    type="text"
                    value={userNameInput}
                    onChange={(e) => setUserNameInput(e.target.value)}
                    placeholder="Nama Anda"
                    className={`w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                    Email {user?.email ? '(Akun Login)' : '(Opsional)'}
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    readOnly={Boolean(user?.email)}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="nama@email.com"
                    className={`w-full p-3 border rounded-2xl text-xs font-bold focus:outline-none ${
                      user?.email
                        ? 'bg-slate-100 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 cursor-not-allowed'
                        : `bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 ${accentFocusRing}`
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 ${accentBtn} text-xs font-bold rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-1.5`}
              >
                <Check size={15} strokeWidth={2.5} />
                <span>Simpan Profil</span>
              </button>
            </form>

            <div className="border-t border-slate-100 dark:border-white/[0.06] pt-4 space-y-4">
              {/* Privasi Saldo Toggle */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Sembunyikan Nominal Saldo
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Samarkan angka rupiah di layar utama (Rp •••••••).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleHideBalance}
                  role="switch"
                  aria-checked={settings.hideBalance}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer shrink-0 ${
                    settings.hideBalance ? accentBg : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-2xs transition-transform ${
                      settings.hideBalance ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Mode Tema */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                  Tema Aplikasi
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => setThemeMode('light')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      themeChoice === 'light'
                        ? 'bg-white dark:bg-[#1E222B] text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sun
                      size={15}
                      className={themeChoice === 'light' ? 'text-amber-500' : 'text-slate-400'}
                    />
                    <span>Terang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode('dark')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      themeChoice === 'dark'
                        ? 'bg-white dark:bg-[#1E222B] text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Moon
                      size={15}
                      className={themeChoice === 'dark' ? 'text-indigo-400' : 'text-slate-400'}
                    />
                    <span>Gelap</span>
                  </button>
                </div>
              </div>

              {/* Warna Aksen */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                  Warna Aksen
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'lime' as const, label: 'Lime', bg: 'bg-[#D4F826]' },
                    { id: 'pink' as const, label: 'Pink', bg: 'bg-[#FFA4A4]' },
                    { id: 'orange' as const, label: 'Oranye', bg: 'bg-[#FF6B00]' },
                    { id: 'plum' as const, label: 'Plum', bg: 'bg-[#71325A]' },
                  ].map((swatch) => {
                    const active = accentChoice === swatch.id;
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        data-swatch={swatch.id}
                        onClick={() => setAccentColor(swatch.id)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          active
                            ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-white/[0.06] text-slate-900 dark:text-white font-bold'
                            : 'border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${swatch.bg} shrink-0`} />
                        <span className="truncate">{swatch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Data & Bantuan */}
          <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/[0.08] space-y-3">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Data & Panduan
            </h3>

            <button
              type="button"
              onClick={() => setActiveTab('tutorial')}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-amber-500" />
                <span>Panduan Aplikasi</span>
              </div>
              <ChevronRight size={15} className="text-slate-400" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={exportToCSV}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] flex items-center justify-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer border border-slate-200/60 dark:border-white/[0.06] transition-colors"
              >
                <FileSpreadsheet size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Ekspor CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="w-full p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 flex items-center justify-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer border border-rose-200/60 dark:border-rose-900/40 transition-colors"
              >
                <RotateCcw size={16} />
                <span>Reset Data</span>
              </button>
            </div>
          </div>
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
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle size={22} />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-display text-base font-extrabold">Reset Semua Data?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transaksi, dompet, dan anggaran akan dikosongkan ke nol. Tindakan ini permanen.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
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
                  <span>{isResetting ? 'Mereset...' : 'Ya, Reset'}</span>
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
                    Foto Profil
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Unggah foto atau pilih avatar.
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
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                <div
                  className={`w-16 h-16 rounded-full border-2 ${accentBorder} overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center shrink-0`}
                >
                  {isPreviewImage ? (
                    <img
                      src={avatarPreview}
                      alt="Pratinjau"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">{avatarPreview}</span>
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
                    className="w-full py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Kembalikan Default
                  </button>
                </div>
              </div>

              {/* Preset Emojis Grid */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                  Karakter Avatar
                </span>
                <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
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
              <div className="flex gap-2 pt-1">
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
                  <span>Simpan</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
