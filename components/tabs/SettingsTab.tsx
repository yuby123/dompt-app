'use client';

import React, { useState, useRef } from 'react';
import {
  Lock,
  Check,
  FileSpreadsheet,
  RotateCcw,
  Camera,
  Sun,
  Moon,
  LogIn,
  Users,
  Cloud,
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';

export function SettingsTab() {
  const {
    settings,
    updateSettings,
    setThemeMode,
    setAccentColor,
    setAppPin,
    disableAppPin,
    exportToCSV,
    resetAllAppData,
    addToast,
    user,
    openLoginModal,
    signOutUser,
    setActiveTab,
    dataResetVersion,
    isAdmin,
    userRole,
    userAccountStatus,
    managedUsers,
    bugReports,
    changeAccountPassword,
  } = useApp();

  const syncKey = `${user?.uid || 'guest'}_${settings.userName}_${settings.userEmail}_${dataResetVersion}`;
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);

  const [userNameInput, setUserNameInput] = useState(
    user?.displayName || settings.userName || 'Trisna'
  );
  const [emailInput, setEmailInput] = useState(
    user?.email || settings.userEmail || 'creator1@dompt.com'
  );
  const [currencyInput, setCurrencyInput] = useState(settings.currency || 'IDR (Rp)');
  const [languageInput, setLanguageInput] = useState(settings.language || 'Bahasa Indonesia');
  const [showDecimals, setShowDecimals] = useState(settings.showDecimals || false);

  if (prevSyncKey !== syncKey) {
    setPrevSyncKey(syncKey);
    setUserNameInput(user?.displayName || settings.userName || 'Trisna');
    setEmailInput(user?.email || settings.userEmail || 'creator1@dompt.com');
    setCurrencyInput(settings.currency || 'IDR (Rp)');
    setLanguageInput(settings.language || 'Bahasa Indonesia');
    setShowDecimals(Boolean(settings.showDecimals));
  }

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

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (!oldPasswordInput) {
      setPwdError('Masukkan password lama Anda.');
      return;
    }
    if (newPasswordInput.length < 6) {
      setPwdError('Password baru minimal harus 6 karakter.');
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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Format Tidak Didukung', 'Harap pilih file gambar (JPG, PNG, WebP).', 'error');
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
  };

  const handleSaveAvatar = () => {
    updateSettings({ avatarUrl: avatarPreview });
    setIsAvatarModalOpen(false);
    addToast('Avatar Diperbarui', 'Foto profil Anda berhasil diubah.');
  };

  const handleResetAvatar = () => {
    setAvatarPreview('👩‍💼');
    updateSettings({ avatarUrl: '👩‍💼' });
    setIsAvatarModalOpen(false);
    addToast('Avatar Direset', 'Avatar kembali ke karakter default.');
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userName: userNameInput.trim() || 'Trisna',
      userEmail: emailInput.trim() || 'creator1@dompt.com',
      currency: currencyInput,
      language: languageInput,
      showDecimals,
    }, true);
    addToast('Pengaturan Disimpan', 'Preferensi akun berhasil diperbarui.');
  };

  const handleCreatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      setPinError('PIN harus tepat 4 angka');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Konfirmasi PIN tidak cocok');
      return;
    }
    setAppPin(newPin);
    setIsSettingPin(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  return (
    <div className="space-y-4 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="pt-2 lg:pt-0 px-1">
        <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Pengaturan
        </h1>
      </div>

      {/* Responsive Container: Single-Column on Mobile (<lg), 2-Column on Desktop (lg+) */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
        {/* Left Column on Desktop: Profile, Account, Security, AI Credits */}
        <div className="lg:col-span-5 space-y-4 lg:space-y-5">
          {/* 1. Profile Avatar & Badge Card */}
          <div className="bg-white dark:bg-[#16181D] rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-gray-800 text-center space-y-3">
            <div className="relative w-24 h-24 mx-auto">
              <div className={`w-full h-full rounded-full border-4 ${accentBorder} overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-md transition-colors`}>
                {currentAvatar.startsWith('http') || currentAvatar.startsWith('data:') ? (
                  <img
                    src={currentAvatar}
                    alt={userNameInput}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">{currentAvatar}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setAvatarPreview(currentAvatar);
                  setIsAvatarModalOpen(true);
                }}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                title="Ganti Foto Profil / Avatar"
              >
                <Camera size={14} />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                {userNameInput}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className={`text-[10px] font-black ${accentBg} text-black px-2.5 py-0.5 rounded-full uppercase tracking-wider transition-colors`}>
                  PRO
                </span>
                <span className="text-[11px] text-gray-400 font-semibold">
                  Diperbarui 26 Mar 2026
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAvatarPreview(currentAvatar);
                  setIsAvatarModalOpen(true);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-extrabold text-gray-800 dark:text-gray-200 hover:bg-gray-200 cursor-pointer active:scale-95 transition-transform"
              >
                Ganti Avatar
              </button>
              <button
                type="button"
                onClick={() =>
                  addToast(
                    'Status Langganan',
                    'Akun Anda aktif sebagai Dompt PRO Seumur Hidup.'
                  )
                }
                className={`flex-1 py-2.5 rounded-2xl ${accentBtn} text-black text-xs font-black shadow-xs transition-colors cursor-pointer`}
              >
                Kelola Langganan
              </button>
            </div>
          </div>

          {/* 2. Akun & Multi-User Card */}
          <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl ${accentBg} text-black flex items-center justify-center font-black transition-colors`}>
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                    Akun & Multi-User
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Tiap pengguna memiliki catatan pribadi terpisah
                  </p>
                </div>
              </div>
              {user ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <Cloud size={12} />
                  {(user as any).isLocalAccount ? 'Akun Aktif' : 'Cloud Aktif'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-500/20">
                  Mode Tamu
                </span>
              )}
            </div>

            {user ? (
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${accentBg} text-black font-black flex items-center justify-center overflow-hidden shrink-0 transition-colors`}>
                    {currentAvatar.startsWith('http') || currentAvatar.startsWith('data:') ? (
                      <img
                        src={currentAvatar}
                        alt={user.displayName || 'User'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : currentAvatar ? (
                      <span className="text-lg">{currentAvatar}</span>
                    ) : (
                      (user.displayName || user.email || 'U')[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                        {user.displayName || 'Pengguna Dompt'}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isAdmin
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-500/20'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/20'
                        }`}
                      >
                        {isAdmin ? 'Admin Super App' : `User (${userAccountStatus === 'active' ? 'ACC Aktif' : userAccountStatus})`}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Catatan dompet, transaksi, dan target untuk <strong>{user.email}</strong> tersimpan
                  aman dan terisolasi dari pengguna lain.
                </p>

                {/* Super App Quick Navigation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('feedback')}
                    className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Bug size={14} />
                    <span>Masukan / Lapor Bug</span>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('admin')}
                      className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                    >
                      <ShieldCheck size={14} />
                      <span>
                        Dashboard Admin
                        {managedUsers.filter((u) => u.status === 'pending').length +
                          bugReports.filter((b) => b.status === 'open').length >
                          0 &&
                          ` (${
                            managedUsers.filter((u) => u.status === 'pending').length +
                            bugReports.filter((b) => b.status === 'open').length
                          })`}
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="flex-1 py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
                  >
                    Ganti Akun
                  </button>
                  <button
                    type="button"
                    onClick={signOutUser}
                    className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-3">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Saat ini Anda menggunakan <strong>Mode Tamu</strong>. Masuk dengan{' '}
                  <strong>Email & Password</strong> agar catatan terpisah untuk setiap pengguna.
                </p>
                <button
                  type="button"
                  onClick={openLoginModal}
                  className={`w-full py-2.5 px-3 rounded-xl ${accentBtn} text-black text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer`}
                >
                  <LogIn size={15} />
                  <span>Masuk / Pilih Akun Pribadi</span>
                </button>
              </div>
            )}
          </div>


          {/* 4. Keamanan & PIN */}
          <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={16} className={isOrange ? 'text-[#EA580C]' : isPink ? 'text-[#F43F5E]' : 'text-[#84CC16]'} />
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                  Keamanan Aplikasi
                </h3>
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  settings.pinEnabled
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                }`}
              >
                {settings.pinEnabled ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>

            {settings.pinEnabled ? (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSettingPin(true)}
                  className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Ubah PIN
                </button>
                <button
                  type="button"
                  onClick={disableAppPin}
                  className="flex-1 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer"
                >
                  Matikan PIN
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSettingPin(true)}
                className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer hover:bg-gray-200"
              >
                Aktifkan Kunci Aplikasi (PIN)
              </button>
            )}

            {isSettingPin && (
              <form onSubmit={handleCreatePin} className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="4 Digit PIN"
                    required
                    className="p-3 bg-gray-50 dark:bg-gray-800 border rounded-xl text-center text-sm font-bold"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ulangi PIN"
                    required
                    className="p-3 bg-gray-50 dark:bg-gray-800 border rounded-xl text-center text-sm font-bold"
                  />
                </div>
                {pinError && <p className="text-[10px] text-red-500 font-bold">{pinError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingPin(false)}
                    className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2 ${accentBg} text-black rounded-xl text-xs font-bold`}
                  >
                    Simpan PIN
                  </button>
                </div>
              </form>
            )}

            {/* Ubah Password Login Section */}
            {user && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound size={15} className="text-indigo-500" />
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                      Password Login Akun
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPwdError('');
                      setIsChangingPassword((prev) => !prev);
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {isChangingPassword ? 'Tutup' : 'Ubah Password'}
                  </button>
                </div>

                {isChangingPassword && (
                  <form
                    onSubmit={handleSaveNewPassword}
                    className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/70 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                        Akun: {user.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPwdFields((p) => !p)}
                        className="text-[11px] font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {showPwdFields ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{showPwdFields ? 'Sembunyikan' : 'Lihat'}</span>
                      </button>
                    </div>

                    <input
                      type={showPwdFields ? 'text' : 'password'}
                      value={oldPasswordInput}
                      onChange={(e) => setOldPasswordInput(e.target.value)}
                      placeholder="Masukkan Password Lama"
                      required
                      className="w-full p-2.5 bg-white dark:bg-[#11131A] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                    />
                    <input
                      type={showPwdFields ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Password Baru (minimal 6 karakter)"
                      required
                      className="w-full p-2.5 bg-white dark:bg-[#11131A] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                    />
                    <input
                      type={showPwdFields ? 'text' : 'password'}
                      value={confirmNewPasswordInput}
                      onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                      placeholder="Ulangi Password Baru"
                      required
                      className="w-full p-2.5 bg-white dark:bg-[#11131A] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                    />

                    {pwdError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
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
                        className="flex-1 py-2 bg-gray-200/70 dark:bg-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={pwdSaving}
                        className={`flex-1 py-2 ${accentBg} text-black rounded-xl text-xs font-black cursor-pointer disabled:opacity-50`}
                      >
                        {pwdSaving ? 'Menyimpan...' : 'Simpan Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column on Desktop: Preferensi + Manajemen Data */}
        <div className="lg:col-span-7 space-y-4 lg:space-y-5">
          {/* Form Preferensi */}
          <form
            onSubmit={handleSavePreferences}
            className="bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4"
          >
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Preferensi
            </h3>

            {/* Nama Tampilan */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                NAMA TAMPILAN
              </label>
              <input
                type="text"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                className={`w-full p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
              />
            </div>

            {/* Alamat Email */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                EMAIL
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className={`w-full p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
              />
            </div>

            {/* Mata Uang & Bahasa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                  MATA UANG UTAMA
                </label>
                <select
                  value={currencyInput}
                  onChange={(e) => setCurrencyInput(e.target.value)}
                  className={`w-full p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                >
                  <option value="IDR (Rp)">IDR (Rp) - Rupiah</option>
                  <option value="USD ($)">USD ($) - Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="SGD (S$)">SGD (S$) - Dollar</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                  BAHASA
                </label>
                <select
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  className={`w-full p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${accentFocusRing}`}
                >
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>

            {/* Mode Tampilan (Terang / Gelap) */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                MODE TEMA
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    themeChoice === 'light'
                      ? isOrange
                        ? 'bg-[#FFEDD5] text-orange-950 border-[#FF6B00] shadow-xs'
                        : isPink
                        ? 'bg-[#FFE4E8] text-black border-[#F43F5E] shadow-xs'
                        : 'bg-[#EEF9B4] text-black border-[#84CC16] shadow-xs'
                      : 'bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Sun
                    size={15}
                    className={
                      themeChoice === 'light'
                        ? isOrange
                          ? 'text-[#EA580C]'
                          : isPink
                          ? 'text-[#E11D48]'
                          : 'text-[#65A30D]'
                        : 'text-gray-400'
                    }
                  />
                  <span>Terang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    themeChoice === 'dark'
                      ? isOrange
                        ? 'bg-gray-900 text-white border-gray-900 dark:bg-[#FF6B00]/25 dark:text-[#FF8A3D] dark:border-[#FF6B00] shadow-xs'
                        : isPink
                        ? 'bg-gray-900 text-white border-gray-900 dark:bg-[#FFA4A4]/20 dark:text-[#FFA4A4] dark:border-[#FFA4A4] shadow-xs'
                        : 'bg-gray-900 text-white border-gray-900 dark:bg-[#EEF9B4]/20 dark:text-[#D4F826] dark:border-[#D4F826] shadow-xs'
                      : 'bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Moon
                    size={15}
                    className={themeChoice === 'dark' ? 'text-blue-400' : 'text-gray-400'}
                  />
                  <span>Gelap</span>
                </button>
              </div>
            </div>

            {/* Warna Aksen & Desimal */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                  WARNA AKSEN
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    data-swatch="lime"
                    onClick={() => setAccentColor('lime')}
                    className={`w-8 h-8 rounded-full bg-[#D4F826] border-2 cursor-pointer transition-transform ${
                      accentChoice === 'lime'
                        ? 'scale-110 border-black dark:border-white shadow-xs'
                        : 'border-transparent'
                    }`}
                    title="Lime Green"
                  />
                  <button
                    type="button"
                    data-swatch="pink"
                    onClick={() => setAccentColor('pink')}
                    className={`w-8 h-8 rounded-full bg-[#FFA4A4] border-2 cursor-pointer transition-transform ${
                      accentChoice === 'pink'
                        ? 'scale-110 border-black dark:border-white shadow-xs'
                        : 'border-transparent'
                    }`}
                    title="Soft Coral Pink"
                  />
                  <button
                    type="button"
                    data-swatch="orange"
                    onClick={() => setAccentColor('orange')}
                    className={`w-8 h-8 rounded-full bg-[#FF6B00] border-2 cursor-pointer transition-transform ${
                      accentChoice === 'orange'
                        ? 'scale-110 border-black dark:border-white shadow-xs'
                        : 'border-transparent'
                    }`}
                    title="Sunset Orange"
                  />
                  <button
                    type="button"
                    data-swatch="plum"
                    onClick={() => setAccentColor('plum')}
                    className={`w-8 h-8 rounded-full bg-[#71325A] border-2 cursor-pointer transition-transform ${
                      accentChoice === 'plum'
                        ? 'scale-110 border-black dark:border-white shadow-xs ring-2 ring-[#71325A]/40'
                        : 'border-transparent'
                    }`}
                    title="Deep Plum (#71325A)"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                  TAMPILKAN DESIMAL
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowDecimals(!showDecimals)}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors relative cursor-pointer ${
                      showDecimals ? accentBg : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                        showDecimals ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-[11px] font-bold text-gray-500">10.50</span>
                </div>
              </div>
            </div>

            {/* Simpan Perubahan Button */}
            <button
              type="submit"
              className={`w-full py-3.5 ${accentBtn} text-black text-xs font-black rounded-2xl shadow-xs transition-colors cursor-pointer mt-2 flex items-center justify-center gap-1.5`}
            >
              <Check size={16} strokeWidth={2.8} />
              <span>Simpan Perubahan</span>
            </button>
          </form>

          {/* 5. Manajemen Data & Panduan */}
          <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 lg:p-6 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Manajemen Data
            </h3>

            <button
              type="button"
              onClick={() => setActiveTab('tutorial')}
              className="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-amber-500" />
                <span>Buka Panduan Fitur & Cara Penggunaan</span>
              </div>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={exportToCSV}
                className="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 flex items-center justify-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer border border-gray-200/60 dark:border-gray-700/60"
              >
                <FileSpreadsheet size={16} className="text-emerald-600" />
                <span>Export ke CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="w-full p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 flex items-center justify-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer border border-red-200/60 dark:border-red-900/40 transition-colors"
              >
                <RotateCcw size={16} />
                <span>Reset Semua Data</span>
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
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#16181D] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-black">Reset Seluruh Data?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {user
                    ? `Semua catatan transaksi, saldo dompet, dan target pada akun cloud Anda (${user.email}) akan dihapus dan dikosongkan. Tindakan ini tidak dapat dibatalkan.`
                    : 'Semua transaksi dan dompet pada perangkat ini akan dikosongkan kembali ke pengaturan awal. Tindakan ini tidak dapat dibatalkan.'}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
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
                  className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RotateCcw size={16} />
                  )}
                  <span>{isResetting ? 'Mereset Data...' : 'Ya, Reset Semua Data'}</span>
                </button>

                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="w-full py-2.5 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 font-bold text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 cursor-pointer disabled:opacity-50"
                >
                  Batal
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-md bg-white dark:bg-[#16181D] rounded-[28px] p-6 shadow-2xl border border-gray-100 dark:border-gray-800 z-10 overflow-hidden space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    Pilih Foto Profil / Avatar
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Unggah foto dari galeri atau pilih karakter emoji favorit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Big Live Preview */}
              <div className="flex flex-col items-center justify-center py-2 space-y-2">
                <div className={`relative w-24 h-24 rounded-full border-4 ${accentBorder} overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-lg transition-colors`}>
                  {avatarPreview.startsWith('http') || avatarPreview.startsWith('data:') ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">{avatarPreview}</span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                  Pratinjau Avatar
                </span>
              </div>

              {/* Upload Photo Button */}
              <div>
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
                  className="w-full py-3 px-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/80 border border-dashed border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload size={16} />
                  <span>Unggah Foto dari Galeri / Kamera</span>
                </button>
              </div>

              {/* Preset Emojis Grid */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  ATAU PILIH DARI KARAKTER FAVORIT
                </span>
                <div className="grid grid-cols-6 gap-2 max-h-44 overflow-y-auto p-1.5 rounded-2xl bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                  {PRESET_AVATARS.map((emoji) => {
                    const isSelected = avatarPreview === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatarPreview(emoji)}
                        className={`h-11 rounded-xl text-2xl flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? `${accentBg} scale-105 shadow-xs ring-2 ring-black/10 dark:ring-white/20`
                            : 'hover:bg-white dark:hover:bg-gray-700/60 hover:scale-105'
                        }`}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={handleResetAvatar}
                  className="px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer"
                  title="Kembalikan ke default"
                >
                  <RotateCcw size={13} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  className={`flex-1 py-2.5 rounded-xl ${accentBtn} text-black text-xs font-black shadow-xs cursor-pointer flex items-center justify-center gap-1.5`}
                >
                  <Check size={14} strokeWidth={3} />
                  <span>Terapkan</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
