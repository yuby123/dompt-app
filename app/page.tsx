'use client';

import React, { useSyncExternalStore } from 'react';
import { AppProvider, useApp } from '@/components/AppContext';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { DashboardTab } from '@/components/tabs/DashboardTab';
import { TransactionsTab } from '@/components/tabs/TransactionsTab';
import { AnalyticsTab } from '@/components/tabs/AnalyticsTab';
import { WalletsTab } from '@/components/tabs/WalletsTab';
import { SettingsTab } from '@/components/tabs/SettingsTab';
import { BudgetTab } from '@/components/tabs/BudgetTab';
import { GoalsTab } from '@/components/tabs/GoalsTab';
import { AssetsTab } from '@/components/tabs/AssetsTab';
import { AiAdvisorTab } from '@/components/tabs/AiAdvisorTab';
import { TutorialTab } from '@/components/tabs/TutorialTab';
import { DebtTab } from '@/components/tabs/DebtTab';
import { InvestTab } from '@/components/tabs/InvestTab';
import { ReportsTab } from '@/components/tabs/ReportsTab';

import { AddTransactionModal } from '@/components/AddTransactionModal';
import { TransferModal } from '@/components/TransferModal';
import { WalletModal } from '@/components/WalletModal';
import { AppLockModal } from '@/components/AppLockModal';
import { ScanReceiptModal } from '@/components/ScanReceiptModal';
import { ClipboardScreenshotDetector } from '@/components/ClipboardScreenshotDetector';
import { ToastContainer } from '@/components/ToastContainer';

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function MainAppShell() {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-[#F6F7F9] dark:bg-[#0E1015] text-[#111827] dark:text-[#F9FAFB] flex flex-col justify-between selection:bg-[#D4F826] selection:text-black transition-colors duration-200">
      {/* Auto-responsive phone canvas: Portrait fits phone, Landscape widens smoothly without 2-column split */}
      <div className="w-full portrait:max-w-md landscape:w-full landscape:max-w-3xl md:max-w-2xl mx-auto flex-1 flex flex-col relative min-h-screen px-3 sm:px-6 safe-area-left safe-area-right transition-all duration-300">
        <Header />

        <main className="flex-1 pt-1 pb-24">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'wallets' && <WalletsTab />}
          {activeTab === 'transactions' && <TransactionsTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'budget' && <BudgetTab />}
          {activeTab === 'scanner' && <DashboardTab />}
          {activeTab === 'goals' && <GoalsTab />}
          {activeTab === 'assets' && <AssetsTab />}
          {activeTab === 'debt' && <DebtTab />}
          {activeTab === 'invest' && <InvestTab />}
          {activeTab === 'ai-advisor' && <AiAdvisorTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'tutorial' && <TutorialTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </main>

        <Navigation />

        {/* Modals & Dialogs */}
        <AddTransactionModal />
        <ScanReceiptModal />
        <ClipboardScreenshotDetector />
        <TransferModal />
        <WalletModal />
        <AppLockModal />
        <ToastContainer />
      </div>
    </div>
  );
}

export default function Page() {
  const isMounted = useMounted();

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] dark:bg-[#0E1015] flex items-center justify-center p-4">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#D4F826] text-black font-black text-2xl flex items-center justify-center shadow-lg animate-pulse">
            D.
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Dompt.</h2>
            <p className="text-xs text-gray-400 font-medium">Memuat keuangan Anda...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <MainAppShell />
    </AppProvider>
  );
}
