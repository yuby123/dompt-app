'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  History,
  RotateCcw,
  Check,
  Plus,
  Coins,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { motion } from 'motion/react';
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

let msgCounter = 100;
function nextMsgId(prefix: string) {
  msgCounter += 1;
  return `${prefix}-${msgCounter}`;
}

export function AiAdvisorTab() {
  const {
    settings,
    deductAiCredit,
    addTransaction,
    wallets,
    categories,
    dashboardSummary,
    addToast,
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Halo Trisna! Saya AI Advisor finansialmu. Mau konsultasi pengeluaran, evaluasi target tabungan, atau langsung catat transaksi lewat obrolan santai?',
    },
    {
      id: 'msg-2',
      sender: 'user',
      text: 'Belanja bahan makanan mingguan 375rb tgl 1 maret 2026 pakai bca',
    },
    {
      id: 'msg-3',
      sender: 'ai',
      text: 'Siap, aku sudah siapkan catatan transaksimu:',
      transactionData: {
        type: 'expense',
        amount: 375000,
        note: 'Belanja bahan makanan mingguan',
        category: 'Makan',
        wallet: 'BCA',
        date: '2026-03-01',
        added: true,
      },
    },
  ]);

  const promptChips = [
    'Roasting pengeluaranku dong 🔥',
    'Bisa beli HP baru?',
    'Analisis gaya hidupku bulan ini',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    if (!deductAiCredit(1)) {
      addToast('Kredit Habis', 'Top up AI Credits di menu Pengaturan.', 'error');
      return;
    }

    const userMsg: ChatMessage = {
      id: nextMsgId('user'),
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          contextData: {
            totalBalance: formatRupiah(dashboardSummary.totalBalance),
            monthlyIncome: formatRupiah(dashboardSummary.monthlyIncome),
            monthlyExpense: formatRupiah(dashboardSummary.monthlyExpense),
            runway: `${dashboardSummary.emergencyFundRunwayMonths} Bulan`,
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
        text: rawText,
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
      wallets.find((w) => w.name.toLowerCase().includes((txData.wallet || '').toLowerCase())) ||
      wallets[0];

    const targetCategory =
      categories.find((c) =>
        c.name.toLowerCase().includes((txData.category || '').toLowerCase())
      ) || categories[0];

    addTransaction({
      type: txData.type || 'expense',
      amount: txData.amount || 50000,
      note: txData.note || 'Transaksi dari AI Advisor',
      walletId: targetWallet.id,
      categoryId: targetCategory.id,
      date: txData.date ? new Date(txData.date).toISOString() : new Date().toISOString(),
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
        id: nextMsgId('init'),
        sender: 'ai',
        text: 'Percakapan telah direset. Ada yang ingin kamu diskusikan tentang keuanganmu hari ini?',
      },
    ]);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 px-1">
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

        {/* AI Credits Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-black text-gray-700 dark:text-gray-200">
          <Coins size={14} className="text-[#84CC16] dark:text-[#D4F826]" />
          <span>{settings.aiCredits}</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="space-y-3.5 min-h-[350px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-3xl p-4 text-xs font-medium leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-black text-white dark:bg-white dark:text-black rounded-br-xs'
                  : 'bg-white dark:bg-[#16181D] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-bl-xs shadow-xs'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>

              {/* Transaction Suggestion Card */}
              {msg.transactionData && (
                <div className="mt-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-left space-y-2">
                  <div className="flex items-center justify-between">
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
                      <span className="font-bold text-red-500 uppercase">
                        {msg.transactionData.type}
                      </span>
                    </div>
                    <div>
                      <span>Wallet: </span>
                      <span className="font-bold text-gray-700 dark:text-gray-200">
                        {msg.transactionData.wallet || 'BCA'}
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
                      className="w-full py-2 bg-[#D4F826] text-black font-black text-xs rounded-xl shadow-xs hover:bg-[#c6ec15] flex items-center justify-center gap-1 cursor-pointer"
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
      </div>

      {/* Prompt Suggestion Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2 pb-1">
        {promptChips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleSendMessage(chip)}
            className="px-3 py-1.5 rounded-full bg-white dark:bg-[#16181D] border border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-[#D4F826] shrink-0 transition-colors cursor-pointer shadow-xs"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="relative pt-1">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Tanya apa saja tentang keuangan..."
          className="w-full pl-4 pr-12 py-3.5 bg-white dark:bg-[#16181D] border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4F826] shadow-xs"
        />
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-[#D4F826] disabled:opacity-40 text-black flex items-center justify-center font-bold hover:bg-[#c6ec15] transition-colors cursor-pointer"
        >
          <Send size={16} />
        </button>
      </div>

      <p className="text-[10px] text-center text-gray-400">
        Saran AI hanya untuk tujuan informasi • 1 kredit/pesan
      </p>
    </div>
  );
}
