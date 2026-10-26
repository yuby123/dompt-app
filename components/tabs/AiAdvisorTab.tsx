'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  Check,
  Plus,
  Loader2,
  MessageSquare,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';

interface TransactionDraft {
  type: 'expense' | 'income';
  amount: number;
  note: string;
  category?: string;
  wallet?: string;
  walletId?: string;
  date?: string;
  added?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  transactionData?: TransactionDraft;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

const ACCENT_STYLES = {
  lime: {
    bg: 'bg-[#D4F826] hover:bg-[#c5e91b] text-black',
    softBg: 'bg-[#EEF9B4]/80 dark:bg-[#D4F826]/15 border-[#D4F826]/60',
    icon: 'text-[#84CC16] dark:text-[#D4F826]',
    hoverBorder: 'hover:border-[#D4F826]',
  },
  pink: {
    bg: 'bg-[#FF6FB5] hover:bg-[#f25da6] text-black',
    softBg: 'bg-[#FFE4F2]/80 dark:bg-[#FF6FB5]/15 border-[#FF6FB5]/60',
    icon: 'text-[#EC4899] dark:text-[#FF6FB5]',
    hoverBorder: 'hover:border-[#FF6FB5]',
  },
  orange: {
    bg: 'bg-[#FF8A3D] hover:bg-[#f07b2e] text-black',
    softBg: 'bg-[#FFEAD8]/80 dark:bg-[#FF8A3D]/15 border-[#FF8A3D]/60',
    icon: 'text-[#F97316] dark:text-[#FF8A3D]',
    hoverBorder: 'hover:border-[#FF8A3D]',
  },
  plum: {
    bg: 'bg-[#A855F7] hover:bg-[#9333EA] text-white',
    softBg: 'bg-[#F3E8FF]/80 dark:bg-[#A855F7]/15 border-[#A855F7]/60',
    icon: 'text-[#9333EA] dark:text-[#C084FC]',
    hoverBorder: 'hover:border-[#A855F7]',
  },
};

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^[•\-]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderInlineMarkdown(line: string): React.ReactNode[] {
  const parts = line.split(/(\*\*.*?\*\*|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-gray-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderFormattedText(text: string) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={i} className="h-1" />;
        }
        return (
          <p key={i} className="leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

let msgCounter = 100;
function nextMsgId(prefix: string) {
  msgCounter += 1;
  return `${prefix}-${Date.now()}-${msgCounter}`;
}

export function AiAdvisorTab() {
  const {
    user,
    settings,
    addTransaction,
    walletsWithBalance: wallets,
    categories,
    dashboardSummary,
    addToast,
  } = useApp();

  const accent = ACCENT_STYLES[settings.accentColor] || ACCENT_STYLES.lime;

  const displayName = user?.displayName
    ? user.displayName.split(' ')[0]
    : settings.userName
    ? settings.userName.split(' ')[0]
    : 'Sobat';

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });

  const storageKey = `dompt_ai_sessions_v2_${user?.uid || 'guest'}`;

  const createWelcomeMessage = (name: string): ChatMessage => ({
    id: 'msg-welcome',
    sender: 'ai',
    text: `Halo **${name}**! Tanya soal budget atau langsung ketik transaksi.\nContoh: *"Catat kopi 25rb pakai Tunai"*`,
  });

  const loadInitialSessions = (key: string): ChatSession[] => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Ignore storage errors
      }
    }
    return [
      {
        id: 'session-1',
        title: 'Diskusi Keuangan',
        updatedAt: todayFormatted,
        messages: [createWelcomeMessage(displayName)],
      },
    ];
  };

  const [sessions, setSessions] = useState<ChatSession[]>(() => loadInitialSessions(storageKey));
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const init = loadInitialSessions(storageKey);
    return init[0]?.id || 'session-1';
  });

  // Reload sessions if user account / storageKey changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const loaded = loadInitialSessions(storageKey);
      setSessions(loaded);
      setActiveSessionId(loaded[0]?.id || 'session-1');
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(sessions.slice(0, 15)));
    } catch {
      // Ignore storage errors
    }
  }, [sessions, storageKey]);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  const updateSessionMessages = (
    sessionId: string,
    updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])
  ) => {
    setSessions((prevSessions) =>
      prevSessions.map((sess) => {
        if (sess.id !== sessionId) return sess;
        const nextMsgs =
          typeof updater === 'function' ? updater(sess.messages) : updater;
        const firstUserMsg = nextMsgs.find((m) => m.sender === 'user');
        const nextTitle = firstUserMsg
          ? stripMarkdown(firstUserMsg.text).slice(0, 26)
          : sess.title;
        return {
          ...sess,
          title: nextTitle,
          updatedAt: todayFormatted,
          messages: nextMsgs,
        };
      })
    );
  };

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length, isLoading, activeSessionId]);

  const promptChips = [
    { label: 'Cek Budget', prompt: 'Evaluasi pengeluaran dan sisa budgetku bulan ini' },
    { label: 'Sisa Harian', prompt: 'Berapa batas aman pengeluaran harianku?' },
    { label: 'Roasting', prompt: 'Roasting pengeluaranku bulan ini secara singkat' },
    { label: 'Catat 25rb', prompt: 'Catat makan siang 25rb pakai Tunai' },
  ];

  const resolveDefaultWallet = (walletHint?: string, txType?: string, amount?: number) => {
    const liquidWallets = wallets.filter(
      (w) => w.type !== 'credit' && w.type !== 'paylater' && w.type !== 'investment'
    );
    const pool = liquidWallets.length > 0 ? liquidWallets : wallets;
    if (pool.length === 0) return undefined;

    if (walletHint) {
      const lowerHint = walletHint.toLowerCase().trim();
      const exactOrPartial = pool.find(
        (w) =>
          w.name.toLowerCase() === lowerHint ||
          w.name.toLowerCase().includes(lowerHint) ||
          lowerHint.includes(w.name.toLowerCase())
      );
      if (exactOrPartial) return exactOrPartial;
    }

    // For expenses, prefer a liquid wallet that has enough balance
    if (txType !== 'income' && amount && amount > 0) {
      const funded = pool.find((w) => w.balance >= amount);
      if (funded) return funded;
    }

    return pool[0];
  };

  const handleNewSession = () => {
    const newId = nextMsgId('session');
    const newSess: ChatSession = {
      id: newId,
      title: 'Obrolan Baru',
      updatedAt: todayFormatted,
      messages: [createWelcomeMessage(displayName)],
    };
    setSessions((prev) => [newSess, ...prev]);
    setActiveSessionId(newId);
    setInputMessage('');
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleClearHistory();
      return;
    }
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
  };

  const handleClearHistory = () => {
    updateSessionMessages(activeSession.id, [createWelcomeMessage(displayName)]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputMessage).trim();
    if (!text || isLoading) return;

    const targetSessionId = activeSession.id;
    const userMsg: ChatMessage = {
      id: nextMsgId('user'),
      sender: 'user',
      text,
    };

    const historyPayload = messages
      .filter((m) => m.id !== 'msg-welcome')
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

    updateSessionMessages(targetSessionId, (prev) => [...prev, userMsg]);
    if (!textToSend) {
      setInputMessage('');
    }
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          contextData: {
            totalBalance: formatRupiah(dashboardSummary.totalBalance),
            monthlyIncome: formatRupiah(dashboardSummary.monthlyIncome),
            monthlyExpense: formatRupiah(dashboardSummary.monthlyExpense),
            budgetLimit: formatRupiah(dashboardSummary.budgetLimit),
            dailyBudgetQuota: formatRupiah(dashboardSummary.dailyBudgetQuota),
            dailyBudgetRemaining: formatRupiah(dashboardSummary.dailyBudgetRemaining),
            todayVariableExpense: formatRupiah(dashboardSummary.todayVariableExpense),
            remainingVariableBudget: formatRupiah(dashboardSummary.remainingVariableBudget),
            safeDailyBudgetUntilPayday: formatRupiah(dashboardSummary.safeDailyBudgetUntilPayday),
            runway: `${dashboardSummary.emergencyFundRunwayMonths} Bulan`,
            wallets: wallets.map((w) => w.name),
            categories: categories.map((c) => c.name),
          },
        }),
      });

      const data = await res.json();
      let rawText = data.text || 'Halo! Ada yang ingin kamu tanyakan soal keuanganmu?';
      let parsedTx: TransactionDraft | undefined;

      const jsonMatch = rawText.match(/```transaction_json([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const rawObj = JSON.parse(jsonMatch[1].trim());
          const txType: 'expense' | 'income' =
            rawObj.type === 'income' ? 'income' : 'expense';
          const txAmount = Math.max(0, Number(rawObj.amount) || 0);
          const matchedWallet = resolveDefaultWallet(
            rawObj.wallet,
            txType,
            txAmount
          );
          parsedTx = {
            type: txType,
            amount: txAmount,
            note: rawObj.note || 'Transaksi',
            category: rawObj.category || (txType === 'income' ? 'Gaji' : 'Makan'),
            wallet: matchedWallet?.name || rawObj.wallet || 'Tunai',
            walletId: matchedWallet?.id,
            date: rawObj.date,
            added: false,
          };
          rawText = rawText.replace(/```transaction_json[\s\S]*?```/, '').trim();
        } catch (e) {
          console.error('Failed to parse transaction JSON from AI:', e);
        }
      }

      const aiMsg: ChatMessage = {
        id: nextMsgId('ai'),
        sender: 'ai',
        text: rawText || 'Periksa draf transaksi berikut:',
        transactionData: parsedTx,
      };

      updateSessionMessages(targetSessionId, (prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error contacting AI:', err);
      updateSessionMessages(targetSessionId, (prev) => [
        ...prev,
        {
          id: nextMsgId('err'),
          sender: 'ai',
          text: 'Koneksi sedang terganggu. Silakan coba kirim ulang.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeDraftWallet = (msgId: string, newWalletId: string) => {
    const selectedWallet = wallets.find((w) => w.id === newWalletId);
    if (!selectedWallet) return;

    updateSessionMessages(activeSession.id, (prev) =>
      prev.map((m) =>
        m.id === msgId && m.transactionData
          ? {
              ...m,
              transactionData: {
                ...m.transactionData,
                walletId: selectedWallet.id,
                wallet: selectedWallet.name,
              },
            }
          : m
      )
    );
  };

  const handleApplyTransaction = (msgId: string, txData: TransactionDraft) => {
    const txType: 'expense' | 'income' =
      txData.type === 'income' ? 'income' : 'expense';

    const targetWallet =
      (txData.walletId ? wallets.find((w) => w.id === txData.walletId) : undefined) ||
      resolveDefaultWallet(txData.wallet, txType, txData.amount);

    if (!targetWallet) {
      addToast('Dompet Kosong', 'Tambahkan dompet terlebih dahulu.', 'error');
      return;
    }

    const typedCategories = categories.filter((c) => c.type === txType);
    const categoryPool = typedCategories.length > 0 ? typedCategories : categories;
    const lowerCatHint = (txData.category || '').toLowerCase().trim();

    const targetCategory =
      categoryPool.find(
        (c) =>
          c.name.toLowerCase() === lowerCatHint ||
          c.name.toLowerCase().includes(lowerCatHint) ||
          (lowerCatHint && lowerCatHint.includes(c.name.toLowerCase()))
      ) || categoryPool[0];

    let finalIsoDate = new Date().toISOString();
    if (txData.date) {
      const parsedDate = new Date(txData.date);
      if (!isNaN(parsedDate.getTime())) {
        finalIsoDate = parsedDate.toISOString();
      }
    }

    const createdId = addTransaction({
      type: txType,
      amount: Math.max(1, Number(txData.amount) || 0),
      note: txData.note || targetCategory?.name || 'Transaksi AI',
      walletId: targetWallet.id,
      categoryId: targetCategory?.id || null,
      budgetGroup: targetCategory?.budgetGroup,
      expenseNature: targetCategory?.expenseNature,
      date: finalIsoDate,
    });

    // Only mark as saved if addTransaction succeeded (non-empty ID)
    if (!createdId) {
      return;
    }

    updateSessionMessages(activeSession.id, (prev) =>
      prev.map((m) =>
        m.id === msgId && m.transactionData
          ? {
              ...m,
              transactionData: {
                ...m.transactionData,
                walletId: targetWallet.id,
                wallet: targetWallet.name,
                added: true,
              },
            }
          : m
      )
    );
  };

  return (
    <div className="pb-28 lg:pb-6">
      <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-12 lg:bg-white lg:dark:bg-[#16181D] lg:rounded-3xl lg:border lg:border-gray-100 lg:dark:border-gray-800 lg:shadow-xs lg:overflow-hidden lg:min-h-[640px]">
        {/* Left Sidebar: Chat History (Desktop) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col border-r border-gray-100 dark:border-gray-800 p-5 bg-gray-50/40 dark:bg-[#121418]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                Riwayat Sesi
              </h2>
              <p className="text-[11px] text-gray-400 font-medium">
                {sessions.length} percakapan tersimpan
              </p>
            </div>
            <button
              type="button"
              onClick={handleNewSession}
              className={`w-8 h-8 rounded-xl ${accent.bg} flex items-center justify-center font-bold shadow-xs cursor-pointer transition-transform active:scale-95`}
              title="Sesi Baru"
            >
              <Plus size={16} strokeWidth={2.6} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {sessions.map((sess) => {
              const isSelected = sess.id === activeSession.id;
              const lastMsg = sess.messages[sess.messages.length - 1];
              const cleanPreview = lastMsg
                ? stripMarkdown(lastMsg.text)
                : 'Mulai obrolan...';
              return (
                <div
                  key={sess.id}
                  onClick={() => setActiveSessionId(sess.id)}
                  className={`group p-3 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? accent.softBg
                      : 'bg-white dark:bg-[#16181D] border-gray-100 dark:border-gray-800/80 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare
                        size={13}
                        className={
                          isSelected
                            ? 'text-gray-900 dark:text-white shrink-0'
                            : 'text-gray-400 shrink-0'
                        }
                      />
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {sess.title}
                      </p>
                    </div>
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity cursor-pointer"
                        title="Hapus Sesi"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-1">
                    {cleanPreview}
                  </p>
                  <span className="text-[10px] text-gray-400 font-medium mt-1 block">
                    {sess.updatedAt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Chat Area */}
        <div className="lg:col-span-8 flex flex-col justify-between lg:p-6 space-y-3 lg:space-y-0">
          {/* Header */}
          <div className="flex items-center justify-between pt-1 lg:pt-0 px-1 lg:pb-4 lg:border-b lg:border-gray-100 lg:dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Sparkles size={16} className={accent.icon} />
              </div>
              <div>
                <h1 className="text-base lg:text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none">
                  AI Advisor
                </h1>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                  Asisten & catat cepat
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleNewSession}
                className="lg:hidden px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#16181D] border border-gray-200 dark:border-gray-800 text-[11px] font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1 cursor-pointer"
                title="Sesi Baru"
              >
                <Plus size={13} />
                <span>Baru</span>
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                title="Reset Percakapan"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="space-y-3 min-h-[360px] lg:min-h-[430px] lg:max-h-[470px] lg:overflow-y-auto lg:py-4 lg:pr-1">
            {messages.map((msg) => {
              const tx = msg.transactionData;
              const selectedWalletId =
                tx?.walletId ||
                resolveDefaultWallet(tx?.wallet, tx?.type, tx?.amount)?.id ||
                wallets[0]?.id ||
                '';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[86%] lg:max-w-[76%] rounded-2xl px-4 py-3 text-xs font-medium ${
                      msg.sender === 'user'
                        ? 'bg-[#14161C] text-white dark:bg-white dark:text-black rounded-br-xs'
                        : 'bg-white lg:bg-gray-50/90 dark:bg-[#16181D] lg:dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {msg.sender === 'ai' ? (
                      renderFormattedText(msg.text)
                    ) : (
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    )}

                    {/* Transaction Draft Card */}
                    {tx && (
                      <div className="mt-3 p-3 rounded-xl bg-gray-50 lg:bg-white dark:bg-[#121418] border border-gray-200/80 dark:border-gray-700/80 text-left space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                              tx.type === 'income'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                          <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
                            {formatRupiah(tx.amount)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-gray-900 dark:text-white truncate">
                            {tx.note}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0">
                            {tx.category || 'Makan'}
                          </span>
                        </div>

                        {/* Wallet Selector */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/60 dark:border-gray-800">
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                            <Wallet size={12} />
                            <span>Dompet:</span>
                          </div>
                          {tx.added ? (
                            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                              {tx.wallet}
                            </span>
                          ) : (
                            <select
                              value={selectedWalletId}
                              onChange={(e) =>
                                handleChangeDraftWallet(msg.id, e.target.value)
                              }
                              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-[11px] font-bold text-gray-900 dark:text-white focus:outline-none cursor-pointer"
                            >
                              {wallets.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name} ({formatRupiah(w.balance)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {tx.added ? (
                          <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                            <Check size={13} strokeWidth={2.5} />
                            <span>Tercatat</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApplyTransaction(msg.id, tx)}
                            className={`w-full py-2 ${accent.bg} font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-[0.99]`}
                          >
                            <Plus size={14} strokeWidth={2.5} />
                            <span>Simpan Transaksi</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-[#16181D] rounded-2xl w-fit border border-gray-100 dark:border-gray-800 text-xs text-gray-500 font-semibold">
                <Loader2 size={14} className={`animate-spin ${accent.icon}`} />
                <span>Memproses...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Composer Area */}
          <div className="space-y-2.5 lg:pt-3 lg:border-t lg:border-gray-100 lg:dark:border-gray-800">
            {/* Quick Chips */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {promptChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSendMessage(chip.prompt)}
                  className={`px-3 py-1.5 rounded-xl bg-white lg:bg-gray-50 dark:bg-[#16181D] lg:dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 text-[11px] font-bold text-gray-700 dark:text-gray-300 ${accent.hoverBorder} disabled:opacity-50 shrink-0 transition-colors cursor-pointer`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-white lg:bg-gray-50 dark:bg-[#16181D] lg:dark:bg-gray-800/90 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xs"
            >
              <input
                type="text"
                value={inputMessage}
                disabled={isLoading}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tanya budget atau ketik 'Catat kopi 25rb'..."
                className="flex-1 bg-transparent px-3 py-2 text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className={`w-9 h-9 rounded-xl ${accent.bg} disabled:opacity-40 flex items-center justify-center shadow-2xs cursor-pointer transition-transform active:scale-95 shrink-0`}
                title="Kirim"
              >
                <Send size={15} strokeWidth={2.4} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
