'use client';

import React, { useState } from 'react';
import { Search, BookOpen, X, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TUTORIAL_ARTICLES } from '@/lib/constants';

export function TutorialTab() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [activeArticle, setActiveArticle] = useState<(typeof TUTORIAL_ARTICLES)[0] | null>(null);

  const categories = ['Semua', 'Memulai', 'Home', 'Dompet', 'Budget'];

  const filtered = TUTORIAL_ARTICLES.filter((item) => {
    if (selectedCategory !== 'Semua' && item.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="pt-2 px-1">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Tutorial
        </h1>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
          Panduan lengkap mulai dari install, penggunaan sampai analisis keuangan.
        </p>
        <span className="text-[10px] text-gray-400 font-bold mt-1 block">
          Terakhir diperbarui: 2026-03-24
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari tutorial..."
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#16181D] border border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4F826] shadow-xs"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${
              selectedCategory === cat
                ? 'bg-black text-white dark:bg-white dark:text-black font-black'
                : 'bg-white dark:bg-[#16181D] text-gray-500 hover:text-black dark:hover:text-white border border-gray-100 dark:border-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="text-[11px] font-bold text-gray-400 px-1">
        {selectedCategory} • {filtered.length} artikel
      </div>

      {/* Article Cards */}
      <div className="space-y-3">
        {filtered.map((art) => (
          <div
            key={art.id}
            onClick={() => setActiveArticle(art)}
            className="bg-white dark:bg-[#16181D] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-gray-800 space-y-2 hover:border-[#D4F826] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-gray-400">{art.number}</span>
              {art.badge && (
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase ${
                    art.badge.includes('START')
                      ? 'bg-[#D4F826] text-black'
                      : art.badge.includes('ESSENTIAL')
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {art.badge}
                </span>
              )}
            </div>

            <h3 className="text-sm font-black text-gray-900 dark:text-white">{art.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {art.summary}
            </p>
          </div>
        ))}
      </div>

      {/* Article Reader Modal */}
      <AnimatePresence>
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black bg-[#D4F826] text-black px-2 py-0.5 rounded-full uppercase">
                  {activeArticle.badge || 'PANDUAN'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <span className="text-xs font-black text-gray-400">{activeArticle.number}</span>
                <h2 className="text-lg font-black text-gray-900 dark:text-white mt-1">
                  {activeArticle.title}
                </h2>
              </div>

              <div className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                {activeArticle.content}
              </div>

              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="w-full py-3 bg-[#D4F826] text-black font-black text-xs rounded-2xl hover:bg-[#c6ec15] cursor-pointer"
              >
                Tutup Panduan
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
