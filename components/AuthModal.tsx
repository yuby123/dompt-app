'use client';

import React, { useState } from 'react';
import { X, LogIn, LogOut, CheckCircle2, ShieldCheck, Users, Cloud, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './AppContext';

export function AuthModal() {
  const {
    isLoginModalOpen,
    setIsLoginModalOpen,
    user,
    authLoading,
    signInWithGoogle,
    signOutUser,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
      setIsLoginModalOpen(false);
    } catch (err: any) {
      console.error('Sign in error:', err);
      setErrorMsg(err?.message || 'Gagal masuk dengan Google. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signOutUser();
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white dark:bg-[#16181D] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>

          {user ? (
            /* Logged in state */
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#D4F826]/20 border-2 border-[#D4F826] overflow-hidden flex items-center justify-center">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Pengguna'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-black text-black">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black">{user.displayName || 'Pengguna Dompt'}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{user.email}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 size={14} />
                  <span>Akun Aktif & Catatan Tersimpan di Cloud</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-[#10b981] shrink-0 mt-0.5" />
                  <span>Data catatan, dompet, dan anggaran Anda sepenuhnya terisolasi dan hanya dapat diakses oleh akun Anda.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Cloud size={16} className="text-[#3b82f6] shrink-0 mt-0.5" />
                  <span>Perubahan otomatis tersinkronisasi ke Firebase Firestore secara real-time.</span>
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
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Users size={16} />
                  <span>Ganti Akun Google Lain</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                  <span>Keluar dari Akun Ini</span>
                </button>
              </div>
            </div>
          ) : (
            /* Not logged in (Guest) state */
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D4F826] text-black font-black flex items-center justify-center text-2xl shadow-md">
                  D.
                </div>
                <h2 className="text-xl font-black">Masuk ke Dompt</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Gunakan akun Google Anda agar tiap orang memiliki catatan keuangan pribadi masing-masing.
                </p>
              </div>

              {/* Benefits list */}
              <div className="space-y-2.5 py-1">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Users size={18} />
                  </div>
                  <div className="text-xs text-left">
                    <p className="font-bold text-gray-900 dark:text-white">Multi-User Mandiri</p>
                    <p className="text-gray-500 dark:text-gray-400">Tiap orang memiliki catatan, saldo & transaksi sendiri yang tidak tercampur.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Cloud size={18} />
                  </div>
                  <div className="text-xs text-left">
                    <p className="font-bold text-gray-900 dark:text-white">Penyimpanan Cloud Aman</p>
                    <p className="text-gray-500 dark:text-gray-400">Tersimpan di Firebase Firestore, tidak hilang walau ganti browser atau HP.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="text-xs text-left">
                    <p className="font-bold text-gray-900 dark:text-white">Privasi Terjamin</p>
                    <p className="text-gray-500 dark:text-gray-400">Data Anda dilindungi aturan keamanan Firestore berbasis akun.</p>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/50">
                  {errorMsg}
                </div>
              )}

              {/* Login Button */}
              <button
                type="button"
                onClick={handleSignIn}
                disabled={loading || authLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#D4F826] hover:bg-[#cbf11e] text-black font-black text-sm transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin text-black" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Masuk dengan Akun Google</span>
              </button>

              <p className="text-center text-[11px] text-gray-400">
                Data Anda aman, terenkripsi, dan hanya dapat dilihat oleh Anda.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
