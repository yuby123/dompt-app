'use client';

import React, { useState } from 'react';
import {
  Clock,
  ShieldAlert,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Users,
  CheckCircle2,
  Mail,
  User as UserIcon,
  Calendar,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from './AppContext';
import { BrandLogo } from './BrandLogo';

export function AccountStatusGate() {
  const {
    user,
    userAccountStatus,
    refreshUserAccountStatus,
    signOutUser,
    openLoginModal,
  } = useApp();

  const [checking, setChecking] = useState(false);

  const isPending = userAccountStatus === 'pending';
  const displayName = user?.displayName || 'Pengguna Baru';
  const email = user?.email || '-';

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      await refreshUserAccountStatus();
    } finally {
      setTimeout(() => setChecking(false), 400);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] dark:bg-[#08090F] text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <BrandLogo size="sm" />
          <span className="font-display text-xl font-black tracking-tight">Dompt.</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold">
            Super App
          </span>
        </div>

        <button
          type="button"
          onClick={() => signOutUser()}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16181D] border border-slate-200 dark:border-white/10 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut size={14} />
          <span>Keluar</span>
        </button>
      </header>

      {/* Center Status Card */}
      <main className="flex-1 flex items-center justify-center py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full bg-white dark:bg-[#12141C] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-white/10 shadow-xl space-y-6"
        >
          {/* Icon & Status Headline */}
          <div className="text-center space-y-3">
            <div
              className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border ${
                isPending
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              }`}
            >
              {isPending ? <Clock size={32} strokeWidth={2.2} /> : <ShieldAlert size={32} strokeWidth={2.2} />}
            </div>

            <div className="space-y-1.5">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-md border ${
                  isPending
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                }`}
              >
                {isPending ? 'Status: Menunggu ACC Admin' : 'Status: Akun Dinonaktifkan'}
              </span>

              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white pt-1">
                {isPending
                  ? 'Pendaftaran Menunggu Persetujuan Admin'
                  : 'Akun Anda Sedang Dinonaktifkan'}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {isPending
                  ? 'Terima kasih telah mendaftar! Sesuai kebijakan keamanan Super App, setiap pendaftaran akun User baru harus di-ACC oleh Admin terlebih dahulu sebelum dapat mengakses fitur keuangan.'
                  : 'Akses akun Anda saat ini telah dinonaktifkan oleh Administrator. Silakan hubungi Admin apabila Anda memerlukan pengaktifan kembali akun ini.'}
              </p>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="rounded-2xl bg-slate-50 dark:bg-[#0B0D14] border border-slate-200/80 dark:border-white/10 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <UserIcon size={14} />
                <span>Nama Pengguna</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{displayName}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Mail size={14} />
                <span>Email Terdaftar</span>
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{email}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar size={14} />
                <span>Peran & Status</span>
              </span>
              <span
                className={`font-mono font-bold ${
                  isPending ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                USER · {isPending ? 'PENDING ACC' : 'NONAKTIF'}
              </span>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#D4F826] hover:bg-[#c8ec1c] text-black font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
              <span>{checking ? 'Memeriksa Status...' : 'Cek Status Persetujuan Sekarang'}</span>
            </button>

            <button
              type="button"
              onClick={() => openLoginModal()}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users size={15} />
              <span>Ganti ke Akun Lain</span>
            </button>
          </div>

          {/* Info Note */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Halaman ini terhubung secara real-time dengan Cloud Database. Begitu Admin menekan tombol{' '}
              <strong>ACC / Aktifkan</strong> pada akun Anda, halaman aplikasi akan terbuka otomatis.
            </span>
          </div>
        </motion.div>
      </main>

      <footer className="text-center text-[11px] text-slate-400 py-2">
        Dompt. Super App · Sistem Manajemen Akses User & Admin
      </footer>
    </div>
  );
}
