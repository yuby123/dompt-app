'use client';

import React, { useState } from 'react';
import {
  User,
  Sparkles,
  Lock,
  Unlock,
  Coins,
  Check,
  FileSpreadsheet,
  RotateCcw,
  ShieldCheck,
  Camera,
  Sun,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { AccentColor, ThemeMode } from '@/lib/types';

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

  // Top Up Modal
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

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
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="pt-2 px-1">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Pengaturan
        </h1>
      </div>

      {/* 1. Profile Avatar & Badge Card */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-gray-800 text-center space-y-3">
        {/* Avatar circle */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="w-full h-full rounded-full border-4 border-[#D4F826] overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-md">
            {/* Sketch illustration placeholder */}
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
          <h2 className="text-xl font-black text-gray-900 dark:text-white">{userNameInput}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-[10px] font-black bg-[#D4F826] text-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              PRO
            </span>
            <span className="text-[11px] text-gray-400 font-semibold">Diperbarui 26 Mar 2026</span>
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
            onClick={() => addToast('Status Langganan', 'Akun Anda aktif sebagai Dompt PRO Seumur Hidup.')}
            className="flex-1 py-2.5 rounded-2xl bg-[#D4F826] text-black text-xs font-black shadow-xs hover:bg-[#c6ec15] cursor-pointer"
          >
            Kelola Langganan
          </button>
        </div>
      </div>

      {/* 2. Form Preferensi */}
      <form
        onSubmit={handleSavePreferences}
        className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-4"
      >
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Preferensi</h3>

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
            ALAMAT EMAIL
          </label>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="w-full p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
          />
        </div>

        {/* Mata Uang & Bahasa */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
              MATA UANG
            </label>
            <select
              value={currencyInput}
              onChange={(e) => setCurrencyInput(e.target.value)}
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
            >
              <option value="IDR (Rp)">IDR (Rp)</option>
              <option value="USD ($)">USD ($)</option>
              <option value="EUR (€)">EUR (€)</option>
              <option value="SGD (S$)">SGD (S$)</option>
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
            MODE TAMPILAN
          </label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                themeChoice === 'light'
                  ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-600 shadow-xs ring-1 ring-amber-400'
                  : 'bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Sun size={15} className={themeChoice === 'light' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'} />
              <span>Mode Terang</span>
            </button>
            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                themeChoice === 'dark'
                  ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-800 dark:border-gray-600 shadow-xs ring-1 ring-gray-700'
                  : 'bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Moon size={15} className={themeChoice === 'dark' ? 'text-blue-400' : 'text-gray-400'} />
              <span>Mode Gelap</span>
            </button>
          </div>
        </div>

        {/* Warna Aksen & Desimal */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Theme Color Circles */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
              WARNA AKSEN
            </label>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setAccentColor('lime')}
                className={`w-8 h-8 rounded-full bg-[#D4F826] border-2 cursor-pointer transition-transform ${
                  accentChoice === 'lime' ? 'scale-110 border-black dark:border-white shadow-xs' : 'border-transparent'
                }`}
                title="Lime Green"
              />
              <button
                type="button"
                onClick={() => setAccentColor('pink')}
                className={`w-8 h-8 rounded-full bg-[#FFA4A4] border-2 cursor-pointer transition-transform ${
                  accentChoice === 'pink' ? 'scale-110 border-black dark:border-white shadow-xs' : 'border-transparent'
                }`}
                title="Soft Coral Pink"
              />
            </div>
          </div>

          {/* Toggle Desimal */}
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
            accentChoice === 'pink' ? 'bg-[#FFA4A4] hover:bg-[#ff8e8e]' : 'bg-[#D4F826] hover:bg-[#c6ec15]'
          } text-black text-xs font-black rounded-2xl shadow-xs transition-colors cursor-pointer mt-2 flex items-center justify-center gap-1.5`}
        >
          <Check size={16} strokeWidth={2.8} />
          <span>Simpan Perubahan</span>
        </button>
      </form>

      {/* 3. AI Credits Card */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
            <Coins size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">AI Credits</h3>
            <p className="text-[10px] text-gray-400">Use credits for AI-powered features.</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              BALANCE
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
            Top Up
          </button>
        </div>
      </div>

      {/* 4. Keamanan & PIN */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-[#84CC16]" />
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Keamanan & PIN
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
            Aktifkan Kunci PIN
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

      {/* 5. Cadangan & Reset Data */}
      <div className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-2.5">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Data & Ekspor</h3>

        <button
          type="button"
          onClick={exportToCSV}
          className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Ekspor Semua Transaksi (CSV)</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (confirm('Apakah Anda yakin ingin mereset seluruh data kembali ke awal?')) {
              resetAllAppData();
            }
          }}
          className="w-full p-3 rounded-2xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <RotateCcw size={16} />
            <span>Reset Semua Data Aplikasi</span>
          </div>
        </button>
      </div>
    </div>
  );
}
