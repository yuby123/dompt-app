'use client';

import React, { useState, useMemo } from 'react';
import {
  Pencil,
  Plus,
  MoreVertical,
  X,
  Sliders,
  SlidersHorizontal,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Eye,
  Check,
  AlertTriangle,
  Calendar,
  Trash2,
  Smile,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { EmojiPickerModal } from '../EmojiPickerModal';
import { formatRupiah, formatNominalInput, parseNominalInput } from '@/lib/formatters';
import { BudgetGroup, BudgetSubcategory } from '@/lib/types';
import { FIXED_CATEGORY_IDS, FIXED_EXPENSE_KEYWORDS_REGEX } from '@/lib/budgetUtils';

export function BudgetTab() {
  const {
    budgetConfig,
    dashboardSummary,
    subscriptions,
    setActiveTab,
    updateBudgetConfig,
    addBudgetSubcategory,
    deleteBudgetSubcategory,
    updateBudgetSubcategory,
    settings,
    transactions,
    categories,
    activeYear,
    activeMonth,
  } = useApp();

  const hide = settings.hideBalance;

  // Modals state
  const [isEditIncomeOpen, setIsEditIncomeOpen] = useState(false);
  const [tempIncomeInput, setTempIncomeInput] = useState(String(budgetConfig.estimatedIncome));

  const [isEditPercentagesOpen, setIsEditPercentagesOpen] = useState(false);
  const [needsPercent, setNeedsPercent] = useState(budgetConfig.needsPercent);
  const [wantsPercent, setWantsPercent] = useState(budgetConfig.wantsPercent);
  const [savingsPercent, setSavingsPercent] = useState(budgetConfig.savingsPercent);

  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [targetGroup, setTargetGroup] = useState<BudgetGroup>('kebutuhan');
  const [newSubName, setNewSubName] = useState('');
  const [newSubAmount, setNewSubAmount] = useState('');
  const [newSubEmoji, setNewSubEmoji] = useState('📦');
  const [newSubDueDay, setNewSubDueDay] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const [activeMenuSubId, setActiveMenuSubId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<BudgetGroup, boolean>>({
    kebutuhan: false,
    keinginan: false,
    tabungan: false,
  });
  const [showArchived, setShowArchived] = useState(false);

  const toggleGroupCollapse = (group: BudgetGroup) => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const quickEmojiSuggestions = useMemo(() => {
    if (targetGroup === 'kebutuhan') {
      return ['⚡', '📶', '🛒', '🍔', '🚗', '🛵', '⛽', '🏠', '💧', '💊', '🏥', '🧴', '🍞', '📦'];
    }
    if (targetGroup === 'keinginan') {
      return ['🎬', '🍿', '☕', '🎮', '🛍️', '👗', '👟', '🍕', '🎧', '📱', '💻', '✈️', '💄', '🍔'];
    }
    return ['💰', '🪙', '🏦', '📈', '🏅', '🎯', '💵', '🔒', '💎', '🏡', '🥇', '📊', '🧾', '🏧'];
  }, [targetGroup]);

  // Group limits
  const totalIncome = budgetConfig.estimatedIncome ?? 0;
  const needsLimit = Math.round((totalIncome * budgetConfig.needsPercent) / 100);
  const wantsLimit = Math.round((totalIncome * budgetConfig.wantsPercent) / 100);
  const savingsLimit = Math.round((totalIncome * budgetConfig.savingsPercent) / 100);

  const curMonthDate = new Date(activeYear, activeMonth, 1);
  const daysInCurMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
  const curMonthShort = curMonthDate.toLocaleString('id-ID', { month: 'short' });

  // Filter subcategories
  const needsSubs = budgetConfig.subcategories.filter((s) => s.group === 'kebutuhan');
  const wantsSubs = budgetConfig.subcategories.filter((s) => s.group === 'keinginan');
  const savingsSubs = budgetConfig.subcategories.filter((s) => s.group === 'tabungan');

  // Subcategories recognized as fixed monthly obligations (Wi-Fi, Netflix, Listrik, etc.)
  // Single source of truth: only subcategories currently in budgetConfig.subcategories (Kebutuhan & Keinginan)
  const fixedSubcategories = useMemo(() => {
    const expenseSubs = (subscriptions || []).filter((s) => s.type === 'expense');
    const list: { id: string; name: string; allocatedAmount: number }[] = [];

    budgetConfig.subcategories.forEach((sub) => {
      if (sub.group === 'tabungan') return;

      const subNameLower = sub.name.toLowerCase().trim();
      const linkedRec = expenseSubs.find(
        (rec) =>
          rec.id === sub.subscriptionId ||
          rec.subcategoryId === sub.id ||
          rec.name.toLowerCase().trim() === subNameLower
      );
      if (linkedRec) {
        if (!linkedRec.isActive) return;
      } else if (sub.isSubscriptionActive === false) {
        return;
      }

      const isFixed =
        Boolean(sub.dueDateDay) ||
        Boolean(sub.subscriptionId) ||
        Boolean(linkedRec) ||
        FIXED_CATEGORY_IDS.has(sub.id.replace('sub-', 'cat-')) ||
        FIXED_EXPENSE_KEYWORDS_REGEX.test(sub.name);

      if (isFixed) {
        list.push({
          id: sub.id,
          name: sub.name,
          allocatedAmount: sub.allocatedAmount,
        });
      }
    });

    return list;
  }, [budgetConfig.subcategories, subscriptions]);

  // Dynamic subcategory spent amounts calculated from transactions this month
  const { subSpentMap, unallocatedGroupSpent } = useMemo(() => {
    const map: Record<string, number> = {};
    const unallocatedMap: Record<BudgetGroup, number> = {
      kebutuhan: 0,
      keinginan: 0,
      tabungan: 0,
    };

    const catMap = new Map<string, { name: string; group?: BudgetGroup }>(
      categories.map((c) => [c.id, { name: c.name.toLowerCase(), group: c.budgetGroup }])
    );

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getFullYear() === activeYear && d.getMonth() === activeMonth) {
        if (tx.type === 'expense') {
          const catInfo = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
          const catName = catInfo?.name || '';
          const txGroup = tx.budgetGroup || catInfo?.group;

          const cleanTxNote = (tx.note || '')
            .toLowerCase()
            .replace(/\(otomatis rutin\)|\(rutin\)|\(langganan\)|\(bulanan\)/gi, '')
            .trim();
          const rawTxNote = (tx.note || '').toLowerCase().trim();

          // 1. Try matching subcategory in the same budget group first (if txGroup is known)
          let matchSub = budgetConfig.subcategories.find((s) => {
            if (txGroup && s.group !== txGroup) return false;

            const subNameLower = s.name.toLowerCase().trim();

            // A. Direct ID match (e.g. sub-makan vs cat-makan)
            if (tx.categoryId && s.id.replace('sub-', '') === tx.categoryId.replace('cat-', '')) {
              return true;
            }

            // B. Note matches subcategory name (bidirectional)
            if (subNameLower) {
              if (
                cleanTxNote === subNameLower ||
                rawTxNote.includes(subNameLower) ||
                cleanTxNote.includes(subNameLower) ||
                subNameLower.includes(cleanTxNote)
              ) {
                return true;
              }

              // C. Keyword overlap (e.g. "wifi" in "wifi & internet")
              const subWords = subNameLower.split(/[\s&/,-]+/).filter((w) => w.length >= 3);
              const noteWords = cleanTxNote.split(/[\s&/,-]+/).filter((w) => w.length >= 3);
              if (subWords.length > 0 && noteWords.length > 0) {
                const hasCommon = subWords.some((sw) =>
                  noteWords.some((nw) => nw === sw || nw.includes(sw) || sw.includes(nw))
                );
                if (hasCommon) return true;
              }
            }

            // D. Category Name matches subcategory name
            if (catName && subNameLower) {
              if (catName.includes(subNameLower) || subNameLower.includes(catName)) {
                return true;
              }
            }

            return false;
          });

          // 2. If no match within group, search all subcategories by note / keywords
          if (!matchSub && (cleanTxNote || rawTxNote)) {
            matchSub = budgetConfig.subcategories.find((s) => {
              const subNameLower = s.name.toLowerCase().trim();
              if (!subNameLower) return false;
              if (
                cleanTxNote === subNameLower ||
                rawTxNote.includes(subNameLower) ||
                cleanTxNote.includes(subNameLower) ||
                subNameLower.includes(cleanTxNote)
              ) {
                return true;
              }
              const subWords = subNameLower.split(/[\s&/,-]+/).filter((w) => w.length >= 3);
              const noteWords = cleanTxNote.split(/[\s&/,-]+/).filter((w) => w.length >= 3);
              return subWords.some((sw) =>
                noteWords.some((nw) => nw === sw || nw.includes(sw) || sw.includes(nw))
              );
            });
          }

          if (matchSub) {
            map[matchSub.id] = (map[matchSub.id] || 0) + tx.amount;
          } else if (txGroup) {
            unallocatedMap[txGroup] = (unallocatedMap[txGroup] || 0) + tx.amount;
          } else {
            unallocatedMap['kebutuhan'] = (unallocatedMap['kebutuhan'] || 0) + tx.amount;
          }
        } else if (tx.type === 'transfer' && tx.budgetGroup === 'tabungan') {
          const matchSub = budgetConfig.subcategories.find((s) => s.group === 'tabungan');
          if (matchSub) {
            map[matchSub.id] = (map[matchSub.id] || 0) + tx.amount;
          } else {
            unallocatedMap['tabungan'] = (unallocatedMap['tabungan'] || 0) + tx.amount;
          }
        }
      }
    });

    return { subSpentMap: map, unallocatedGroupSpent: unallocatedMap };
  }, [transactions, categories, budgetConfig.subcategories, activeYear, activeMonth]);

  const calculateGroupSpent = (group: BudgetGroup) => {
    const subTotal = budgetConfig.subcategories
      .filter((s) => s.group === group)
      .reduce((acc, s) => acc + (subSpentMap[s.id] || 0), 0);
    return subTotal + (unallocatedGroupSpent[group] || 0);
  };

  const needsSpent = calculateGroupSpent('kebutuhan');
  const wantsSpent = calculateGroupSpent('keinginan');
  const savingsSpent = calculateGroupSpent('tabungan');

  const totalPercentage = needsPercent + wantsPercent + savingsPercent;

  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNominalInput(tempIncomeInput);
    updateBudgetConfig({ estimatedIncome: val });
    setIsEditIncomeOpen(false);
  };

  const handleSavePercentages = () => {
    if (totalPercentage === 100) {
      updateBudgetConfig({
        needsPercent,
        wantsPercent,
        savingsPercent,
      });
      setIsEditPercentagesOpen(false);
    }
  };

  const handleCreateSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseNominalInput(newSubAmount);
    if (!newSubName.trim()) return;

    if (editingSubId) {
      updateBudgetSubcategory(editingSubId, {
        name: newSubName.trim(),
        allocatedAmount: amountVal || 0,
        emoji: newSubEmoji || '📦',
        dueDateDay: newSubDueDay ? Number(newSubDueDay) : undefined,
      });
    } else {
      addBudgetSubcategory({
        name: newSubName.trim(),
        group: targetGroup,
        allocatedAmount: amountVal || 100000,
        emoji: newSubEmoji || '📦',
        dueDateDay: newSubDueDay ? Number(newSubDueDay) : undefined,
      });
    }

    setIsAddSubOpen(false);
    setEditingSubId(null);
    setNewSubName('');
    setNewSubAmount('');
    setNewSubEmoji('📦');
    setNewSubDueDay('');
  };

  const openAddForGroup = (group: BudgetGroup) => {
    setEditingSubId(null);
    setTargetGroup(group);
    setNewSubName('');
    setNewSubAmount('');
    setNewSubEmoji(group === 'kebutuhan' ? '⚡' : group === 'keinginan' ? '🎬' : '💰');
    setNewSubDueDay('');
    setIsAddSubOpen(true);
  };

  const openEditSub = (sub: { id: string; name: string; group: BudgetGroup; allocatedAmount: number; emoji: string; dueDateDay?: number }) => {
    setEditingSubId(sub.id);
    setTargetGroup(sub.group);
    setNewSubName(sub.name);
    setNewSubAmount(formatNominalInput(sub.allocatedAmount));
    setNewSubEmoji(sub.emoji || '📦');
    setNewSubDueDay(sub.dueDateDay ? String(sub.dueDateDay) : '');
    setActiveMenuSubId(null);
    setIsAddSubOpen(true);
  };

  const renderGroupSection = (params: {
    group: BudgetGroup;
    title: string;
    tooltip: string;
    dotColor: string;
    sectionBarColor: string;
    itemBarColor: string;
    subs: BudgetSubcategory[];
    groupSpent: number;
    groupLimit: number;
    spentLabel?: string;
  }) => {
    const {
      group,
      title,
      tooltip,
      dotColor,
      sectionBarColor,
      itemBarColor,
      subs,
      groupSpent,
      groupLimit,
      spentLabel = 'TERPAKAI',
    } = params;

    const isCollapsed = collapsedGroups[group];
    const groupSpentPct = groupLimit > 0 ? Math.min(100, Math.round((groupSpent / groupLimit) * 100)) : 0;
    const isNearOrOverLimit = groupSpentPct >= 85;

    const groupAllocated = subs.reduce((sum, s) => sum + (Number(s.allocatedAmount) || 0), 0);
    const allocPct = groupLimit > 0 ? Math.round((groupAllocated / groupLimit) * 100) : 0;
    const remainingUnallocated = groupLimit - groupAllocated;

    return (
      <div className="space-y-3.5 pt-2">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
            <h3 className="text-xs font-extrabold tracking-[0.22em] text-gray-900 dark:text-white uppercase">
              {title}
            </h3>
            <button
              type="button"
              onClick={() => {
                setNeedsPercent(budgetConfig.needsPercent);
                setWantsPercent(budgetConfig.wantsPercent);
                setSavingsPercent(budgetConfig.savingsPercent);
                setIsEditPercentagesOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <SlidersHorizontal size={11} />
              <span>Ubah</span>
            </button>
            <span
              className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-help transition-colors"
              title={tooltip}
            >
              <HelpCircle size={14} />
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleGroupCollapse(group)}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg cursor-pointer transition-colors"
            title={isCollapsed ? 'Tampilkan' : 'Sembunyikan'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {/* Section-Level Full-Width Progress Bar & Labels */}
        <div className="space-y-1.5 px-1">
          <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isNearOrOverLimit ? 'bg-[#EF4444]' : sectionBarColor
              }`}
              style={{ width: `${groupSpentPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-extrabold tracking-wider text-gray-400 uppercase tabular-nums">
            <span>
              {spentLabel}: {formatRupiah(groupSpent, hide)}
            </span>
            <span>BATAS: {formatRupiah(groupLimit, hide)}</span>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* 2-Column Subcategory Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {subs.map((sub) => {
                const spent = subSpentMap[sub.id] || 0;
                const rawPct = sub.allocatedAmount > 0 ? Math.round((spent / sub.allocatedAmount) * 100) : 0;
                const pct = Math.min(100, rawPct);
                const isMenuOpen = activeMenuSubId === sub.id;

                return (
                  <div
                    key={sub.id}
                    className={`bg-white dark:bg-[#16181D] rounded-[22px] px-5 py-4 border transition-all flex items-center gap-4 relative group ${
                      isMenuOpen
                        ? 'border-[#D4F826] shadow-[0_4px_20px_rgba(212,248,38,0.15)]'
                        : 'border-gray-100 dark:border-gray-800/80 hover:border-[#D4F826] dark:hover:border-[#D4F826]/70 shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                    }`}
                  >
                    {/* Left Emoji Icon */}
                    <div className="text-[28px] leading-none w-9 text-center shrink-0 select-none">
                      {sub.emoji}
                    </div>

                    {/* Center Info + Bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[13px] font-extrabold text-gray-900 dark:text-white truncate">
                            {sub.name}
                          </span>
                          {(sub.subscriptionId || sub.dueDateDay) && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('subscriptions')}
                              className="text-[10px] font-semibold text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 shrink-0 cursor-pointer transition-colors"
                              title="Terhubung dengan Jadwal Langganan & Tagihan Bulanan"
                            >
                              {sub.isSubscriptionActive === false
                                ? '· Dijeda'
                                : sub.dueDateDay
                                ? `· Tgl ${sub.dueDateDay}`
                                : '· Rutin'}
                            </button>
                          )}
                        </div>

                        <span className="text-[13px] font-black text-gray-900 dark:text-white tabular-nums shrink-0">
                          {formatRupiah(spent, hide)}
                        </span>
                      </div>

                      {/* Subcategory Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            rawPct > 100 ? 'bg-red-500' : itemBarColor
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Bottom Right "dari Rp ..." */}
                      <div className="flex items-center justify-end mt-1.5">
                        <span className="text-[11px] font-semibold text-gray-400 tabular-nums">
                          dari {formatRupiah(sub.allocatedAmount, hide)}
                        </span>
                      </div>
                    </div>

                    {/* Right 3-Dots Action Button */}
                    <button
                      type="button"
                      onClick={() => setActiveMenuSubId(isMenuOpen ? null : sub.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                        isMenuOpen
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <MoreVertical size={15} />
                    </button>

                    {/* Subcategory Menu Dropdown */}
                    {isMenuOpen && (
                      <div className="absolute right-4 top-14 z-30 bg-white dark:bg-[#1E2026] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-1.5 min-w-[130px] text-xs font-bold space-y-1">
                        <button
                          type="button"
                          onClick={() => openEditSub(sub)}
                          className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center gap-2 cursor-pointer"
                        >
                          <Pencil size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteBudgetSubcategory(sub.id);
                            setActiveMenuSubId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Full-Width Dashed + TAMBAH SUBKATEGORI Button */}
            <button
              type="button"
              onClick={() => openAddForGroup(group)}
              className="w-full py-3.5 rounded-[20px] border border-dashed border-gray-200 dark:border-gray-800 text-[11px] font-extrabold tracking-[0.15em] text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-600 flex items-center justify-center gap-2 cursor-pointer transition-all uppercase bg-white/50 dark:bg-transparent"
            >
              <Plus size={14} />
              <span>TAMBAH SUBKATEGORI</span>
            </button>

            {/* Allocation Footer Status Bar */}
            <div className="bg-gray-50/90 dark:bg-[#16181D]/90 rounded-2xl px-4 py-3 flex items-center justify-between border border-gray-100/80 dark:border-gray-800/70">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    remainingUnallocated < 0
                      ? 'bg-red-500'
                      : allocPct === 100
                      ? 'bg-[#D4F826]'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="text-[10px] font-extrabold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
                  {remainingUnallocated === 0 && groupLimit > 0
                    ? 'ALOKASI PENUH 100%'
                    : remainingUnallocated < 0
                    ? `MELEBIHI BATAS ALOKASI (${allocPct}%)`
                    : `TERALOKASI ${allocPct}% · SISA ALOKASI`}
                </span>
              </div>
              <span
                className={`text-xs font-black tabular-nums ${
                  remainingUnallocated < 0
                    ? 'text-red-500'
                    : 'text-[#84CC16] dark:text-[#D4F826]'
                }`}
              >
                {formatRupiah(remainingUnallocated, hide)}
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 lg:space-y-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="pt-2 lg:pt-0 px-1">
        <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Atur Budget
        </h1>
        <p className="text-xs lg:text-sm font-semibold text-gray-400 mt-0.5">
          Kasih tugas buat setiap Rupiahmu.
        </p>
      </div>

      {/* Full-Width Black Hero Card (matching Dashboard full-width style) */}
      <div className="w-full bg-[#121316] rounded-[28px] lg:rounded-[32px] p-5 lg:px-9 lg:py-7 text-white shadow-xl space-y-5 border border-white/5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left: Perkiraan Pemasukan + Nominal + Badges */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-[#D4F826] uppercase tracking-widest">
                PERKIRAAN PEMASUKAN
              </span>
              <button
                type="button"
                onClick={() => {
                  setTempIncomeInput(formatNominalInput(totalIncome));
                  setIsEditIncomeOpen(true);
                }}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Ubah Pemasukan"
              >
                <Pencil size={15} />
              </button>
            </div>

            <div className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight tabular-nums text-white leading-none">
              {formatRupiah(totalIncome, hide)}
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] font-bold pt-1">
              <span className="bg-white/10 px-3 py-1 rounded-xl text-gray-300">
                BERBASIS PERSENTASE
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-xl text-gray-300">
                BULANAN
              </span>
            </div>
          </div>

          {/* Right on Desktop: Quick Allocation Summary */}
          <div className="hidden lg:flex items-center gap-8">
            <div>
              <span className="text-[10px] font-extrabold text-violet-400 uppercase tracking-wider block">
                KEBUTUHAN ({budgetConfig.needsPercent}%)
              </span>
              <span className="text-base font-black text-white mt-1 block tabular-nums">
                {formatRupiah(needsLimit, hide)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-pink-400 uppercase tracking-wider block">
                KEINGINAN ({budgetConfig.wantsPercent}%)
              </span>
              <span className="text-base font-black text-white mt-1 block tabular-nums">
                {formatRupiah(wantsLimit, hide)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider block">
                TABUNGAN ({budgetConfig.savingsPercent}%)
              </span>
              <span className="text-base font-black text-white mt-1 block tabular-nums">
                {formatRupiah(savingsLimit, hide)}
              </span>
            </div>
          </div>
        </div>

        {/* Pos Anggaran: Tagihan Bulanan (Fixed) vs Pengeluaran Harian (Variable) */}
        {budgetConfig.estimatedIncome > 0 && (
          <div className="pt-4 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider">
                    POS TAGIHAN BULANAN (FIXED)
                  </span>
                </div>
                <div className="text-sm text-gray-100 font-black tabular-nums">
                  {formatRupiah(dashboardSummary.monthlyFixedBudget, hide)}
                </div>
              </div>
              <div className="text-[11px] text-gray-400 font-medium pl-7">
                {fixedSubcategories.length > 0 ? (
                  <span>
                    Dari alokasi: {fixedSubcategories.map((s) => `${s.name} (${formatRupiah(s.allocatedAmount, hide)})`).join(' + ')}
                  </span>
                ) : (
                  <span>Belum ada alokasi tagihan berjadwal</span>
                )}
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥪</span>
                  <span className="text-[10px] font-black text-[#D4F826] uppercase tracking-wider">
                    POS PENGELUARAN HARIAN (OPERASIONAL)
                  </span>
                </div>
                <div className="text-sm text-gray-100 font-black tabular-nums">
                  {formatRupiah(dashboardSummary.monthlyVariableBudget, hide)}
                  <span className="text-[10px] text-gray-400 font-normal ml-1">
                    (~{formatRupiah(dashboardSummary.dailyBudgetQuota, hide)}/hari)
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-gray-400 font-medium pl-7">
                Makan, jajan, transportasi (dasar perhitungan budget harian)
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar: Periode Aktif */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                PERIODE AKTIF
              </span>
              <span className="font-extrabold text-white mt-0.5 block">
                01 {curMonthShort} - {daysInCurMonth} {curMonthShort}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Right "Tampilkan Arsip" Pill Control (matching reference screenshot) */}
      <div className="flex justify-end px-1 -mb-2">
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="px-3.5 py-1.5 rounded-full bg-gray-100/90 dark:bg-gray-800/70 hover:bg-gray-200/80 dark:hover:bg-gray-800 text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Eye size={13} />
          <span>{showArchived ? 'Sembunyikan Arsip' : 'Tampilkan Arsip'}</span>
        </button>
      </div>

      {/* Category Sections (Matching Reference 2-Column Card Grid UI) */}
      <div className="space-y-8">
        {renderGroupSection({
          group: 'kebutuhan',
          title: 'KEBUTUHAN',
          tooltip: `Alokasi Kebutuhan Pokok & Tagihan Rutin (${budgetConfig.needsPercent}%)`,
          dotColor: 'bg-[#A594F9]',
          sectionBarColor: 'bg-[#A594F9]',
          itemBarColor: 'bg-[#A594F9]',
          subs: showArchived ? needsSubs : needsSubs.filter((s) => s.isSubscriptionActive !== false),
          groupSpent: needsSpent,
          groupLimit: needsLimit,
          spentLabel: 'TERPAKAI',
        })}

        {renderGroupSection({
          group: 'keinginan',
          title: 'KEINGINAN',
          tooltip: `Alokasi Gaya Hidup, Hiburan & Keinginan (${budgetConfig.wantsPercent}%)`,
          dotColor: 'bg-pink-400',
          sectionBarColor: 'bg-pink-500',
          itemBarColor: 'bg-pink-400',
          subs: showArchived ? wantsSubs : wantsSubs.filter((s) => s.isSubscriptionActive !== false),
          groupSpent: wantsSpent,
          groupLimit: wantsLimit,
          spentLabel: 'TERPAKAI',
        })}

        {renderGroupSection({
          group: 'tabungan',
          title: 'TABUNGAN',
          tooltip: `Alokasi Dana Darurat, Tabungan & Investasi (${budgetConfig.savingsPercent}%)`,
          dotColor: 'bg-teal-400',
          sectionBarColor: 'bg-teal-500',
          itemBarColor: 'bg-teal-400',
          subs: savingsSubs,
          groupSpent: savingsSpent,
          groupLimit: savingsLimit,
          spentLabel: 'REALISASI',
        })}
      </div>

      {/* Modal: Ubah Pemasukan */}
      <AnimatePresence>
        {isEditIncomeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Ubah Pemasukan
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditIncomeOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveIncome} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">
                    Perkiraan Pemasukan Bulanan
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tempIncomeInput}
                    onChange={(e) => setTempIncomeInput(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 5.000.000"
                    className="w-full p-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-base font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditIncomeOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-[#D4F826] text-black text-xs font-black shadow-xs cursor-pointer hover:bg-[#c6ec15]"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Ubah Kategori (50/30/20 Sliders) */}
      <AnimatePresence>
        {isEditPercentagesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    Ubah Kategori
                  </h3>
                  <span className="text-[10px] font-bold text-[#65A30D] dark:text-[#D4F826] bg-[#D4F826]/20 px-2 py-0.5 rounded-full mt-1 inline-block">
                    BERBASIS PERSENTASE
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditPercentagesOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sliders */}
              {(() => {
                const totalSubNeeds = needsSubs.reduce((acc, s) => acc + s.allocatedAmount, 0);
                const minNeedsPct = Math.ceil((totalSubNeeds / (totalIncome || 1)) * 100);
                const isNeedsOverflow = (totalIncome * needsPercent) / 100 < totalSubNeeds;

                return (
                  <>
                    <div className="space-y-4 pt-2">
                      {/* Kebutuhan */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-extrabold text-violet-600 block">KEBUTUHAN</span>
                            {isNeedsOverflow && (
                              <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400">
                                Min {minNeedsPct}% (sub-kategori butuh {formatRupiah(totalSubNeeds)})
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-black text-gray-900 dark:text-white">
                              {needsPercent}%
                            </span>
                            <span className="text-[10px] text-gray-400 block tabular-nums">
                              {formatRupiah((totalIncome * needsPercent) / 100, hide)}
                            </span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="80"
                          value={needsPercent}
                          onChange={(e) => setNeedsPercent(Number(e.target.value))}
                          className="w-full accent-violet-600 cursor-pointer"
                        />
                      </div>

                      {/* Keinginan */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-pink-500">KEINGINAN</span>
                          <div className="text-right">
                            <span className="font-black text-gray-900 dark:text-white">
                              {wantsPercent}%
                            </span>
                            <span className="text-[10px] text-gray-400 block tabular-nums">
                              {formatRupiah((totalIncome * wantsPercent) / 100, hide)}
                            </span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="70"
                          value={wantsPercent}
                          onChange={(e) => setWantsPercent(Number(e.target.value))}
                          className="w-full accent-pink-500 cursor-pointer"
                        />
                      </div>

                      {/* Tabungan */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-teal-500">TABUNGAN</span>
                          <div className="text-right">
                            <span className="font-black text-gray-900 dark:text-white">
                              {savingsPercent}%
                            </span>
                            <span className="text-[10px] text-gray-400 block tabular-nums">
                              {formatRupiah((totalIncome * savingsPercent) / 100, hide)}
                            </span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="60"
                          value={savingsPercent}
                          onChange={(e) => setSavingsPercent(Number(e.target.value))}
                          className="w-full accent-teal-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Total indicator */}
                    <div className="text-center pt-2">
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full ${
                          totalPercentage === 100 && !isNeedsOverflow
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        TOTAL: {totalPercentage}% / 100%
                      </span>
                      {totalPercentage !== 100 ? (
                        <p className="text-[11px] text-red-500 mt-1 font-semibold">
                          Pastikan total 100%
                        </p>
                      ) : isNeedsOverflow ? (
                        <p className="text-[11px] text-red-500 mt-2 font-medium bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900/40 text-left">
                          Total sub-kategori Kebutuhan ({formatRupiah(totalSubNeeds)}) melebihi alokasi baru ({formatRupiah((totalIncome * needsPercent) / 100)}). Kurangi anggaran sub-kategori di Kebutuhan terlebih dahulu.
                        </p>
                      ) : null}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditPercentagesOpen(false)}
                        className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={totalPercentage !== 100 || isNeedsOverflow}
                        onClick={handleSavePercentages}
                        className="flex-1 py-3 rounded-2xl bg-[#D4F826] disabled:opacity-50 text-black text-xs font-black shadow-xs cursor-pointer hover:bg-[#c6ec15]"
                      >
                        Simpan
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Tambah Subkategori */}
      <AnimatePresence>
        {isAddSubOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16181D] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  {editingSubId ? 'Edit Subkategori' : 'Tambah Subkategori'} ({targetGroup.toUpperCase()})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddSubOpen(false)}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubcategory} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">
                    Nama Subkategori
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="e.g. Netflix, Wifi, Bensin"
                      required
                      className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="w-14 h-12 flex flex-col items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#D4F826] transition-all cursor-pointer group shrink-0 active:scale-95"
                      title="Pilih Icon / Emoticon"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform leading-none">{newSubEmoji || '📦'}</span>
                      <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 leading-none mt-0.5">Icon</span>
                    </button>
                  </div>
                </div>

                {/* Quick Icon Selector */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    <span>Pilihan Icon:</span>
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="text-[11px] font-black text-lime-600 dark:text-[#D4F826] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Smile size={13} />
                      <span>Banyak Pilihan</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickEmojiSuggestions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewSubEmoji(emoji)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all cursor-pointer ${
                          newSubEmoji === emoji
                            ? 'bg-[#D4F826] text-black shadow-xs scale-110 ring-2 ring-black dark:ring-white font-black'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
                        }`}
                        title={`Pilih ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Jumlah Alokasi (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newSubAmount}
                    onChange={(e) => setNewSubAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 200.000"
                    required
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Jatuh Tempo (Opsional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newSubDueDay}
                    onChange={(e) => setNewSubDueDay(e.target.value)}
                    placeholder="Hari (1-31)"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4F826]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSubOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-[#D4F826] text-black text-xs font-black shadow-xs cursor-pointer hover:bg-[#c6ec15]"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Emoji Picker Modal with Categories & Search */}
      <EmojiPickerModal
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        selectedEmoji={newSubEmoji}
        onSelect={(emoji) => setNewSubEmoji(emoji)}
        title="Pilih Icon Subkategori"
      />
    </div>
  );
}
