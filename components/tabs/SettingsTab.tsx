'use client';

import React, { useState } from 'react';
import {
  Lock,
  Coins,
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
    addAiCredits,
    exportToCSV,
    resetAllAppData,
    addToast,
    user,
    openLoginModal,
    signOutUser,
    setActiveTab,
  } = useApp();

  const [userNameInput, setUserNameInput] = useState(settings.userName || 'Trisna');
  const [emailInput, setEmailInput] = useState(settings.userEmail || 'creator1@dompt.com');
  const [currencyInput, setCurrencyInput] = useState(settings.currency || 'IDR (Rp)');
  const [languageInput, setLanguageInput] = useState(settings.language || 'Bahasa Indonesia');
  const [showDecimals, setShowDecimals] = useState(settings.showDecimals || false);

  const themeChoice = settings.themeMode || 'light';
  const accentChoice = settings.accentColor || 'lime';

  // PIN states
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Reset Confirmation Modal state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userName: userNameInput.trim() || 'Trisna',
      userEmail: emailInput.trim() || 'creator1@dompt.com',
      currency: currencyInput,
      language: languageInput,
      showDecimals,
    });
    addToast('Perubahan Disimpan', 'Preferensi akun berhasil diperbarui.');
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
              <div className="w-full h-full rounded-full border-4 border-[#D4F826] overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-md">
                <span className="text-4xl">👩‍💼</span>
              </div>
              <button
                type="button"
                onClick={() => addToast('Pilih Avatar', 'Pilih foto baru dari galeri Anda.')}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xs cursor-pointer hover:scale-105"
                title="Ganti Avatar"
              >
                <Camera size={14} />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                {userNameInput}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-[10px] font-black bg-[#D4F826] text-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
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
                onClick={() => addToast('Ganti Avatar', 'Fitur ganti foto profil aktif.')}
                className="flex-1 py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-extrabold text-gray-800 dark:text-gray-200 hover:bg-gray-200 cursor-pointer"
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
                className="flex-1 py-2.5 rounded-2xl bg-[#D4F826] text-black text-xs font-black shadow-xs hover:bg-[#c6ec15] cursor-pointer"
              >
                Kelola Langganan
              </button>
            </div>
          </div>

          {/* 2. Akun & Multi-User Card */}
          <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D4F826] text-black flex items-center justify-center font-black">
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
                  Cloud Aktif
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
                  <div className="w-10 h-10 rounded-full bg-[#D4F826] text-black font-black flex items-center justify-center overflow-hidden shrink-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (user.displayName || user.email || 'U')[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                      {user.displayName || 'Pengguna Dompt'}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Catatan dompet, transaksi, dan target Anda tersimpan aman di cloud Firebase
                  Firestore dan terisolasi dari pengguna lain.
                </p>

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
                  Saat ini Anda menggunakan <strong>Mode Tamu</strong> (data hanya ada di
                  browser ini). Masuk dengan akun Google Anda agar catatan tersimpan di cloud
                  dan terpisah untuk setiap pengguna.
                </p>
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#D4F826] hover:bg-[#cbf11e] text-black text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <LogIn size={15} />
                  <span>Masuk dengan Akun Google</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. AI Credits Card */}
          <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <Coins size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                  AI Credits
                </h3>
                <p className="text-[10px] text-gray-400">
                  Gunakan kredit untuk fitur pintar AI.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  SISA KREDIT
                </span>
                <span className="text-xl font-black text-gray-900 dark:text-white mt-0.5 block tabular-nums">
                  {settings.aiCredits}
                </span>
              </div>

              <button
                type="button"
                onClick={() => addAiCredits(100)}
                className="px-4 py-2 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black text-xs font-black shadow-xs cursor-pointer"
              >
                + Top Up
              </button>
            </div>
          </div>

          {/* 4. Keamanan & PIN */}
          <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-[#84CC16]" />
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
                    className="flex-1 py-2 bg-[#D4F826] text-black rounded-xl text-xs font-bold"
                  >
                    Simpan PIN
                  </button>
                </div>
              </form>
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
                className="w-full p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
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
                className="w-full p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
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
                  className="w-full p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
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
                  className="w-full p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
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
                      ? 'bg-[#EEF9B4] text-black border-[#84CC16] shadow-xs'
                      : 'bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Sun
                    size={15}
                    className={
                      themeChoice === 'light' ? 'text-[#65A30D]' : 'text-gray-400'
                    }
                  />
                  <span>Terang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    themeChoice === 'dark'
                      ? 'bg-gray-900 text-white border-gray-900 dark:bg-[#EEF9B4]/20 dark:text-[#D4F826] dark:border-[#D4F826] shadow-xs'
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
                    onClick={() => setAccentColor('pink')}
                    className={`w-8 h-8 rounded-full bg-[#FFA4A4] border-2 cursor-pointer transition-transform ${
                      accentChoice === 'pink'
                        ? 'scale-110 border-black dark:border-white shadow-xs'
                        : 'border-transparent'
                    }`}
                    title="Soft Coral Pink"
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
                      showDecimals ? 'bg-[#D4F826]' : 'bg-gray-200 dark:bg-gray-700'
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
              className={`w-full py-3.5 ${
                accentChoice === 'pink'
                  ? 'bg-[#FFA4A4] hover:bg-[#ff8e8e]'
                  : 'bg-[#D4F826] hover:bg-[#c6ec15]'
              } text-black text-xs font-black rounded-2xl shadow-xs transition-colors cursor-pointer mt-2 flex items-center justify-center gap-1.5`}
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
    </div>
  );
}
