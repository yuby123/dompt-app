'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface EmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmoji?: string;
  onSelect: (emoji: string) => void;
  title?: string;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  emojis: string[];
}

export const APP_EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'populer',
    name: 'Populer',
    icon: '⭐',
    emojis: [
      '⚡', '📶', '🛒', '🍔', '☕', '🏠', '🚗', '🛵', '⛽', '🎬',
      '🍿', '🎮', '💻', '📱', '💊', '🛍️', '💰', '🪙', '🎯', '📦',
      '🎁', '💧', '🍕', '👗', '👟', '🩺', '🚲', '✈️', '🌴', '🏅',
    ],
  },
  {
    id: 'makanan',
    name: 'Makanan & Belanja',
    icon: '🍔',
    emojis: [
      '🍔', '☕', '🍜', '🍕', '🥗', '🍱', '🍞', '🍎', '🛒', '🥛',
      '🥩', '🍗', '🥪', '🍩', '🍦', '🍫', '🥤', '🧃', '🍳', '🍉',
      '🍓', '🥑', '🌽', '🍿', '🍣', '🍲', '🍛', '🥟', '🍰', '🍪',
    ],
  },
  {
    id: 'tagihan',
    name: 'Tagihan & Utilitas',
    icon: '⚡',
    emojis: [
      '⚡', '💧', '📶', '🏠', '🏢', '🛋️', '🔑', '🧹', '🧴', '📺',
      '🛏️', '🚪', '🛁', '🔨', '🗑️', '🪟', '🕯️', '🔌', '📦', '🧻',
      '🚿', '🧺', '🪴', '🛠️', '🧯',
    ],
  },
  {
    id: 'transport',
    name: 'Transport & Kendaraan',
    icon: '🚗',
    emojis: [
      '🚗', '🛵', '⛽', '🚆', '🚌', '🚕', '🚲', '✈️', '🅿️', '🔧',
      '🎫', '🚀', '🛳️', '⛵', '🏍️', '🏎️', '🚁', '🚤', '🧳', '🗺️',
      '🏖️', '🏝️', '🏕️', '🌲', '🏔️',
    ],
  },
  {
    id: 'hiburan',
    name: 'Hiburan & Langganan',
    icon: '🎬',
    emojis: [
      '🎬', '🍿', '🎵', '🎧', '🎮', '📱', '💻', '📺', '⚽', '🏋️',
      '🏸', '🎨', '📚', '🎟️', '🎪', '🎤', '🕹️', '🎳', '🏊', '🚴',
      '🎸', '🎹', '📷', '⛺', '🎢', '🎡', '🥊', '🎯',
    ],
  },
  {
    id: 'gaya-hidup',
    name: 'Belanja & Lifestyle',
    icon: '🛍️',
    emojis: [
      '🛍️', '👗', '👕', '👟', '💄', '💈', '⌚', '👓', '🎁', '💎',
      '💍', '👜', '🎒', '👠', '🧥', '🧴', '✂️', '🧢', '🏖️', '🕶️',
      '💅', '👔', '👢', '👡', '🪙',
    ],
  },
  {
    id: 'kesehatan',
    name: 'Kesehatan & Medis',
    icon: '💊',
    emojis: [
      '💊', '🏥', '🩺', '🩹', '🦷', '🧘', '🧴', '🧼', '🚑', '💉',
      '🌡️', '💆', '👓', '🥗', '🍎', '🍵', '🪥', '🧪',
    ],
  },
  {
    id: 'keluarga',
    name: 'Keluarga, Donasi & Edukasi',
    icon: '👨‍👩‍👧',
    emojis: [
      '🧓', '👱', '👶', '👨‍👩‍👧', '👩‍❤️‍👨', '🎓', '📚', '💼', '✏️', '🎒',
      '📑', '🐾', '🐱', '🐶', '🤲', '🕌', '⛪', '💐', '🎂', '🎉',
      '🎊', '💒', '🎁', '❤️', '💌',
    ],
  },
  {
    id: 'finansial',
    name: 'Tabungan & Investasi',
    icon: '💰',
    emojis: [
      '💰', '🪙', '💵', '💳', '🏦', '📈', '📉', '🏅', '🥇', '💎',
      '📦', '🧾', '🏧', '🔒', '🔐', '📊', '💼', '💴', '💶', '💸',
      '🪙', '💲', '🎯', '💱',
    ],
  },
];

export const GOAL_EMOJI_CATEGORIES = APP_EMOJI_CATEGORIES;

export function EmojiPickerModal({
  isOpen,
  onClose,
  selectedEmoji = '🎯',
  onSelect,
  title = 'Pilih Emoticon',
}: EmojiPickerModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('populer');
  const [searchQuery, setSearchQuery] = useState('');
  const [customEmojiInput, setCustomEmojiInput] = useState('');

  const currentCategory = useMemo(() => {
    return GOAL_EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || GOAL_EMOJI_CATEGORIES[0];
  }, [activeCategory]);

  const allFilteredEmojis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    // Search matches category name or direct emoji character
    const found: string[] = [];
    GOAL_EMOJI_CATEGORIES.forEach((cat) => {
      cat.emojis.forEach((em) => {
        if (em.includes(q) && !found.includes(em)) {
          found.push(em);
        }
      });
    });
    return found;
  }, [searchQuery]);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmojiInput.trim()) {
      handleSelect(customEmojiInput.trim());
      setCustomEmojiInput('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white dark:bg-[#16181D] rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border border-stone-100 dark:border-stone-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                  {title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Emoji Preview & Custom Input */}
            <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-100 dark:border-stone-700/60">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-stone-800 flex items-center justify-center text-3xl shadow-xs border border-stone-200/60 dark:border-stone-700 shrink-0">
                {selectedEmoji || '🎯'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Emoticon Terpilih
                </div>
                <form onSubmit={handleCustomSubmit} className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={customEmojiInput}
                    onChange={(e) => setCustomEmojiInput(e.target.value)}
                    placeholder="Atau ketik/paste emot..."
                    maxLength={4}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                  <button
                    type="submit"
                    disabled={!customEmojiInput.trim()}
                    className="px-3 py-1.5 bg-[#D4F826] hover:bg-[#c6ec15] disabled:opacity-40 text-black text-xs font-extrabold rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    Pilih
                  </button>
                </form>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {GOAL_EMOJI_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id && !searchQuery;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[#D4F826] text-black shadow-2xs scale-102'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Emoji Grid */}
            <div className="h-56 overflow-y-auto p-2 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border border-stone-100 dark:border-stone-800">
              {allFilteredEmojis ? (
                <div>
                  <div className="text-[11px] font-bold text-stone-400 mb-2 px-1">
                    Hasil Pencarian ({allFilteredEmojis.length})
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-7 gap-2">
                    {allFilteredEmojis.map((em, idx) => (
                      <button
                        key={`${em}-${idx}`}
                        type="button"
                        onClick={() => handleSelect(em)}
                        className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-all cursor-pointer hover:scale-115 active:scale-95 ${
                          selectedEmoji === em
                            ? 'bg-[#D4F826]/30 ring-2 ring-[#D4F826]'
                            : 'hover:bg-white dark:hover:bg-stone-800'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-6 sm:grid-cols-7 gap-2">
                  {currentCategory.emojis.map((em, idx) => (
                    <button
                      key={`${em}-${idx}`}
                      type="button"
                      onClick={() => handleSelect(em)}
                      className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-all cursor-pointer hover:scale-115 active:scale-95 ${
                        selectedEmoji === em
                          ? 'bg-[#D4F826]/40 ring-2 ring-[#D4F826]'
                          : 'hover:bg-white dark:hover:bg-stone-800'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
