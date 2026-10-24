'use client';

import React, { useState, useMemo } from 'react';
import {
  Bug,
  MessageSquarePlus,
  Sparkles,
  HelpCircle,
  Send,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { BugReportCategory, BugReportPriority } from '@/lib/types';

export function FeedbackTab() {
  const { user, settings, bugReports, submitBugReport, deleteBugReportById } = useApp();

  const [category, setCategory] = useState<BugReportCategory>('bug');
  const [priority, setPriority] = useState<BugReportPriority>('medium');
  const [pageContext, setPageContext] = useState<string>('Dashboard / Umum');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const myReports = useMemo(() => {
    if (!user) return [];
    const myEmail = (user.email || '').toLowerCase();
    return bugReports.filter(
      (r) => r.userId === user.uid || r.userEmail.toLowerCase() === myEmail
    );
  }, [bugReports, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await submitBugReport({
        type: category,
        priority,
        title,
        description,
        pageContext,
      });
      setTitle('');
      setDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return {
          label: 'Selesai Diperbaiki',
          className:
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
        };
      case 'in_progress':
        return {
          label: 'Sedang Diproses Admin',
          className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
        };
      case 'closed':
        return {
          label: 'Ditutup',
          className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
        };
      default:
        return {
          label: 'Menunggu Review Admin',
          className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
        };
    }
  };

  const getTypeLabel = (type: BugReportCategory) => {
    switch (type) {
      case 'bug':
        return 'Laporan Bug / Error';
      case 'feature':
        return 'Usulan Fitur Baru';
      case 'feedback':
        return 'Masukan & Saran';
      default:
        return 'Lainnya';
    }
  };

  return (
    <div className="space-y-6 pb-28 lg:pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 lg:pt-0 px-1">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Masukan & Laporkan Bug
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kirim laporan kendala (bug), saran perbaikan, atau usulan fitur langsung ke Dashboard Admin.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#141620] border border-slate-200/80 dark:border-white/10 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 self-start sm:self-auto">
          <span>Laporan Saya:</span>
          <span className="text-slate-900 dark:text-[#D4F826] tabular-nums">{myReports.length}</span>
        </div>
      </div>

      {/* Main 12-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Cols: Submit Form */}
        <div className="lg:col-span-6 bg-white dark:bg-[#12141E] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
            <div>
              <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                Buat Laporan Baru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Terhubung langsung ke pusat pemantauan Admin
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
              {user?.email || settings.userEmail}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Jenis Laporan
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'bug' as const, label: 'Lapor Bug', icon: Bug },
                  { id: 'feedback' as const, label: 'Masukan', icon: MessageSquarePlus },
                  { id: 'feature' as const, label: 'Usul Fitur', icon: Sparkles },
                  { id: 'other' as const, label: 'Lainnya', icon: HelpCircle },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        active
                          ? 'bg-[#D4F826] border-[#D4F826] text-black shadow-2xs'
                          : 'bg-slate-50 dark:bg-[#0B0D14] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Context & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Menu / Fitur Terkait
                </label>
                <select
                  value={pageContext}
                  onChange={(e) => setPageContext(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0D14] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
                >
                  <option value="Dashboard / Umum">Dashboard / Umum</option>
                  <option value="Dompet & Rekening">Dompet & Rekening</option>
                  <option value="Catat Transaksi">Catat Transaksi</option>
                  <option value="Budget & Siklus Gajian">Budget & Siklus Gajian</option>
                  <option value="Utang & Cicilan">Utang & Cicilan</option>
                  <option value="Goals & Aset">Goals & Aset</option>
                  <option value="Langganan Rutin">Langganan Rutin</option>
                  <option value="Laporan & Analisis">Laporan & Analisis</option>
                  <option value="Akun & Sinkronisasi">Akun & Sinkronisasi</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tingkat Prioritas
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'low' as const, label: 'Rendah' },
                    { id: 'medium' as const, label: 'Sedang' },
                    { id: 'high' as const, label: 'Tinggi' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        priority === p.id
                          ? p.id === 'high'
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : p.id === 'medium'
                            ? 'bg-amber-500 border-amber-500 text-black'
                            : 'bg-slate-800 dark:bg-white text-white dark:text-black border-transparent'
                          : 'bg-slate-50 dark:bg-[#0B0D14] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Judul Masukan / Bug
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Tombol simpan di menu utang tidak merespons atau usulan fitur baru..."
                required
                maxLength={150}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0D14] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826]"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Detail Penjelasan / Langkah Kejadian
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan secara singkat apa yang terjadi, bagian mana yang perlu diperbaiki, atau ide fitur yang Anda harapkan..."
                required
                maxLength={2000}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0D14] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#D4F826] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#D4F826] hover:bg-[#c8ec1c] text-black font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mengirim Laporan...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Kirim Laporan ke Admin</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right 6 Cols: User's Submitted Reports History & Admin Replies */}
        <div className="lg:col-span-6 bg-white dark:bg-[#12141E] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
            <div>
              <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                Riwayat Laporan & Tanggapan Admin
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pantau progres tindak lanjut laporan Anda
              </p>
            </div>
          </div>

          {myReports.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                <MessageSquarePlus size={22} />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Belum Ada Laporan Terkirim
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Jika Anda menemukan bug atau memiliki saran fitur, gunakan formulir di samping untuk mengirimkannya ke Admin.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {myReports.map((rep) => {
                const badge = getStatusBadge(rep.status);
                return (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0D14] border border-slate-200/80 dark:border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                            {getTypeLabel(rep.type)}
                          </span>
                          {rep.pageContext && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              · {rep.pageContext}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {rep.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          {new Date(rep.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteBugReportById(rep.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Hapus laporan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {rep.description}
                    </p>

                    {rep.adminReply && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck size={14} />
                            <span>Balasan Admin ({rep.repliedBy || 'Admin'})</span>
                          </span>
                          {rep.repliedAt && (
                            <span className="font-mono text-[10px] opacity-80 tabular-nums">
                              {new Date(rep.repliedAt).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                          {rep.adminReply}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
