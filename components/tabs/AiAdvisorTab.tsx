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
} from 'lucide-react';
import { useApp } from '../AppContext';
import { formatRupiah } from '@/lib/formatters';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  transactionData?: {
    type: 'expense' | 'income' | 'transfer';
    amount: number;
    note: string;
    category?: string;
    wallet?: string;
    date?: string;
    added?: boolean;
  };
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

let msgCounter = 100;
function nextMsgId(prefix: string) {
  msgCounter += 1;
  return `${prefix}-${msgCounter}`;
}

export function AiAdvisorTab() {
  const {
    user,
    settings,
    addTransaction,
    wallets,
    categories,
    dashboardSummary,
    addToast,
  } = useApp();

  const displayName = user?.displayName
    ? user.displayName.split(' ')[0]
    : settings.userName || 'Sobat';

  const todayFormatted = new Date().toLocaleDateString('id-ID');

  const createWelcomeMessage = (): ChatMessage => ({
    id: 'msg-welcome',
    sender: 'ai',
    text: `Halo ${displayName}! Saya AI Advisor finansialmu. Mau konsultasi pengeluaran, evaluasi target tabungan, atau langsung catat transaksi lewat obrolan santai?\n\nContoh ketik langsung: "Catat beli kopi 25rb pakai Tunai"`,
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => [
    {
      id: 'session-1',
      title: 'Konsultasi Keuangan',
      updatedAt: todayFormatted,
      messages: [createWelcomeMessage()],
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;

  const setMessages = (
    updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])
  ) => {
    setSessions((prevSessions) =>
      prevSessions.map((sess) => {
        if (sess.id !== activeSession.id) return sess;
        const nextMsgs =
          typeof updater === 'function' ? updater(sess.messages) : updater;
        const firstUserMsg = nextMsgs.find((m) => m.sender === 'user');
        const nextTitle = firstUserMsg
          ? firstUserMsg.text.slice(0, 28)
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
    'Roasting pengeluaranku dong 🔥',
    'Bisa beli HP baru?',
    'Analisis gaya hidupku bulan ini',
    'Catat makan siang 35rb pakai Tunai',
  ];

  const handleNewSession = () => {
    const newId = nextMsgId('session');
    const newSess: ChatSession = {
      id: newId,
      title: 'Obrolan Baru',
      updatedAt: todayFormatted,
      messages: [createWelcomeMessage()],
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

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputMessage).trim();
    if (!text || isLoading) return;

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

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) {
      setInputMessage('');
    }
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          contextData: {
            totalBalance: formatRupiah(dashboardSummary.totalBalance),
            monthlyIncome: formatRupiah(dashboardSummary.monthlyIncome),
            monthlyExpense: formatRupiah(dashboardSummary.monthlyExpense),
            runway: `${dashboardSummary.emergencyFundRunwayMonths} Bulan`,
            wallets: wallets.map((w) => w.name),
            categories: categories.map((c) => c.name),
          },
        }),
      });

      const data = await res.json();
      let rawText = data.text || 'Halo! Saya siap membantumu mengelola keuangan.';
      let parsedTx: any = null;

      // Extract transaction json if present
      const jsonMatch = rawText.match(/```transaction_json([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          parsedTx = JSON.parse(jsonMatch[1].trim());
          rawText = rawText.replace(/```transaction_json[\s\S]*?```/, '').trim();
        } catch (e) {
          console.error('Failed to parse tx JSON from AI:', e);
        }
      }

      const aiMsg: ChatMessage = {
        id: nextMsgId('ai'),
        sender: 'ai',
        text: rawText || 'Berikut draf catatan transaksimu:',
        transactionData: parsedTx ? { ...parsedTx, added: false } : undefined,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error contacting AI:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: nextMsgId('err'),
          sender: 'ai',
          text: 'Maaf, terjadi gangguan jaringan saat memproses pesan. Silakan coba lagi ya!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTransaction = (msgId: string, txData: any) => {
    const targetWallet =
      wallets.find((w) =>
        w.name.toLowerCase().includes((txData.wallet || '').toLowerCase())
      ) || wallets[0];

    const targetCategory =
      categories.find((c) =>
        c.name.toLowerCase().includes((txData.category || '').toLowerCase())
      ) || categories[0];

    if (!targetWallet) {
      addToast('Dompet Tidak Ditemukan', 'Silakan buat dompet terlebih dahulu.', 'error');
      return;
    }

    let finalIsoDate = new Date().toISOString();
    if (txData.date) {
      const parsedDate = new Date(txData.date);
      if (!isNaN(parsedDate.getTime())) {
        finalIsoDate = parsedDate.toISOString();
      }
    }

    addTransaction({
      type: txData.type === 'income' ? 'income' : 'expense',
      amount: Number(txData.amount) || 25000,
      note: txData.note || 'Transaksi dari AI Advisor',
      walletId: targetWallet.id,
      categoryId: targetCategory?.id || null,
      budgetGroup: targetCategory?.budgetGroup,
      date: finalIsoDate,
    });

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.transactionData
          ? { ...m, transactionData: { ...m.transactionData, added: true } }
          : m
      )
    );
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'ai',
        text: `Percakapan telah direset. Halo ${displayName}, ada yang ingin kamu diskusikan atau catat hari ini?`,
      },
    ]);
  };

  return (
    <div className="pb-28 lg:pb-6">
      {/* Desktop 2-Column Chat Container / Mobile Single-Column Container */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:bg-white lg:dark:bg-[#16181D] lg:rounded-3xl lg:border lg:border-gray-100 lg:dark:border-gray-800 lg:shadow-xs lg:overflow-hidden lg:min-h-[660px]">
        {/* Left Sidebar: Chat History (Desktop Only, matching video at 1:11) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col border-r border-gray-100 dark:border-gray-800 p-5 bg-gray-50/40 dark:bg-[#121418]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-gray-900 dark:text-white">
              Riwayat Obrolan
            </h2>
            <button
              type="button"
              onClick={handleNewSession}
              className="w-8 h-8 rounded-xl bg-[#D4F826] hover:bg-[#c6ec15] text-black flex items-center justify-center font-bold shadow-xs cursor-pointer transition-transform active:scale-95"
              title="Obrolan Baru"
            >
              <Plus size={16} strokeWidth={2.8} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {sessions.map((sess) => {
              const isSelected = sess.id === activeSession.id;
              const lastMsg = sess.messages[sess.messages.length - 1];
              return (
                <div
                  key={sess.id}
                  onClick={() => setActiveSessionId(sess.id)}
                  className={`group p-3.5 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#EEF9B4] dark:bg-[#D4F826]/20 border-[#D4F826]/60'
                      : 'bg-white dark:bg-[#16181D] border-gray-100 dark:border-gray-800/80 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare
                        size={14}
                        className={
                          isSelected
                            ? 'text-gray-900 dark:text-[#D4F826] shrink-0'
                            : 'text-gray-400 shrink-0'
                        }
                      />
                      <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                        {sess.title}
                      </p>
                    </div>
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity cursor-pointer"
                        title="Hapus Obrolan"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-1">
                    {lastMsg?.text || 'Mulai percakapan...'}
                  </p>
                  <span className="text-[10px] text-gray-400 font-semibold mt-1.5 block">
                    {sess.updatedAt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Chat Area */}
        <div className="lg:col-span-8 flex flex-col justify-between lg:p-6 space-y-4 lg:space-y-0">
          {/* Header */}
          <div className="flex items-center justify-between pt-2 lg:pt-0 px-1 lg:pb-4 lg:border-b lg:border-gray-100 lg:dark:border-gray-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white rounded-xl cursor-pointer"
                title="Reset Chat"
              >
                <RotateCcw size={16} />
              </button>
              <div className="flex items-center gap-1.5">
                <Sparkles size={20} className="text-[#84CC16] dark:text-[#D4F826]" />
                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  AI Advisor
                </h1>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="space-y-3.5 min-h-[350px] lg:min-h-[430px] lg:max-h-[480px] lg:overflow-y-auto lg:py-4 lg:pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] lg:max-w-[75%] rounded-3xl p-4 text-xs font-medium leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#14161C] text-white dark:bg-white dark:text-black rounded-br-xs'
                      : 'bg-white lg:bg-gray-50/90 dark:bg-[#16181D] lg:dark:bg-gray-800/70 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-bl-xs shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Transaction Suggestion Card */}
                  {msg.transactionData && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-gray-50 lg:bg-white dark:bg-gray-800/80 lg:dark:bg-[#16181D] border border-gray-200 dark:border-gray-700 text-left space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-black uppercase text-gray-400">
                          ⚡ TAMBAH TRANSAKSI?
                        </span>
                        <span className="text-xs font-black text-gray-900 dark:text-white tabular-nums">
                          {formatRupiah(msg.transactionData.amount)}
                        </span>
                      </div>

                      <p className="text-xs font-black text-gray-900 dark:text-white">
                        {msg.transactionData.note}
                      </p>

                      <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                        <div>
                          <span>Tipe: </span>
                          <span
                            className={`font-bold uppercase ${
                              msg.transactionData.type === 'income'
                                ? 'text-emerald-500'
                                : 'text-red-500'
                            }`}
                          >
                            {msg.transactionData.type}
                          </span>
                        </div>
                        <div>
                          <span>Wallet: </span>
                          <span className="font-bold text-gray-700 dark:text-gray-200">
                            {msg.transactionData.wallet || wallets[0]?.name || 'Tunai'}
                          </span>
                        </div>
                        <div>
                          <span>Kategori: </span>
                          <span className="font-bold text-gray-700 dark:text-gray-200">
                            {msg.transactionData.category || 'Makan'}
                          </span>
                        </div>
                        <div>
                          <span>Tanggal: </span>
                          <span className="font-bold text-gray-700 dark:text-gray-200">
                            {msg.transactionData.date || 'Hari ini'}
                          </span>
                        </div>
                      </div>

                      {msg.transactionData.added ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] pt-1">
                          <Check size={14} />
                          <span>Ditambahkan ke catatan</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyTransaction(msg.id, msg.transactionData)}
                          className="w-full py-2 bg-[#D4F826] text-black font-black text-xs rounded-xl shadow-xs hover:bg-[#c6ec15] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus size={14} />
                          <span>Catat Sekarang</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-[#16181D] rounded-2xl max-w-xs border border-gray-100 dark:border-gray-800 text-xs text-gray-400 font-bold">
                <Loader2 size={16} className="animate-spin text-[#84CC16]" />
                <span>AI Advisor sedang menganalisis...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Composer Area */}
          <div className="space-y-3 lg:pt-2 lg:border-t lg:border-gray-100 lg:dark:border-gray-800">
            {/* Prompt Suggestion Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
              {promptChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSendMessage(chip)}
                  className="px-3 py-1.5 rounded-full bg-white lg:bg-gray-50 dark:bg-[#16181D] lg:dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-[#D4F826] disabled:opacity-50 shrink-0 transition-colors cursor-pointer shadow-xs"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-white lg:bg-gray-50 dark:bg-[#16181D] lg:dark:bg-gray-800/90 p-2 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <input
                type="text"
                value={inputMessage}
                disabled={isLoading}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ketik pesan atau 'Catat makan siang 35rb pakai Tunai'..."
                className="flex-1 bg-transparent px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="w-10 h-10 rounded-2xl bg-[#D4F826] hover:bg-[#c6ec15] disabled:opacity-40 text-black flex items-center justify-center shadow-xs cursor-pointer transition-transform active:scale-95 shrink-0"
                title="Kirim Pesan"
              >
                <Send size={16} strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
