'use client';

import React from 'react';
import { AppProvider, useApp } from '@/components/AppContext';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { DesktopSidebar } from '@/components/DesktopSidebar';
import { Footer } from '@/components/Footer';
import { DashboardTab } from '@/components/tabs/DashboardTab';
import { WalletsTab } from '@/components/tabs/WalletsTab';
import { TransactionsTab } from '@/components/tabs/TransactionsTab';
import { SettingsTab } from '@/components/tabs/SettingsTab';
import { BudgetTab } from '@/components/tabs/BudgetTab';
import { GoalsTab } from '@/components/tabs/GoalsTab';
import { AssetsTab } from '@/components/tabs/AssetsTab';
import { DebtTab } from '@/components/tabs/DebtTab';
import { InvestTab } from '@/components/tabs/InvestTab';
import { AiAdvisorTab } from '@/components/tabs/AiAdvisorTab';
import { ReportsTab } from '@/components/tabs/ReportsTab';
import { TutorialTab } from '@/components/tabs/TutorialTab';
import { AnalyticsTab } from '@/components/tabs/AnalyticsTab';
import { SubscriptionsTab } from '@/components/tabs/SubscriptionsTab';
import { HealthScoreTab } from '@/components/tabs/HealthScoreTab';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { ScanReceiptModal } from '@/components/ScanReceiptModal';
import { WalletModal } from '@/components/WalletModal';
import { AppLockModal } from '@/components/AppLockModal';
import { ToastContainer } from '@/components/ToastContainer';
import { AuthModal } from '@/components/AuthModal';
import { AuthScreen } from '@/components/AuthScreen';
import { ClipboardScreenshotDetector } from '@/components/ClipboardScreenshotDetector';
import { motion, AnimatePresence } from 'motion/react';

function MainAppContent() {
  const { activeTab, user, settings } = useApp();
  const accentAttr = settings.accentColor || 'lime';

  if (!user) {
    return (
      <div data-accent={accentAttr}>
        <AuthScreen />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div
      data-accent={accentAttr}
      className="min-h-screen bg-[#F6F7FB] dark:bg-[#08090F] bg-noise-subtle text-slate-900 dark:text-slate-100 transition-colors selection:bg-[#D4F826] selection:text-black lg:flex"
    >
      {/* Desktop Left Sidebar (visible on lg+ website view) */}
      <DesktopSidebar />

      {/* Main Content Container: Mobile Frame (<lg) vs Wide Desktop Canvas (lg+) */}
      <div className="max-w-md mx-auto min-h-screen flex flex-col px-3 sm:px-4 relative lg:max-w-none lg:mx-0 lg:flex-1 lg:px-8 xl:px-10 lg:pb-8 lg:overflow-x-hidden">
        {/* Top Bar Contract Header */}
        <Header />

        {/* Dynamic Tab View */}
        <main className="flex-1 pt-1 lg:pt-2 lg:max-w-[1200px] lg:w-full lg:mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
            >
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'wallets' && <WalletsTab />}
              {activeTab === 'transactions' && <TransactionsTab />}
              {activeTab === 'settings' && <SettingsTab />}
              {activeTab === 'budget' && <BudgetTab />}
              {activeTab === 'goals' && <GoalsTab />}
              {activeTab === 'assets' && <AssetsTab />}
              {activeTab === 'debt' && <DebtTab />}
              {activeTab === 'invest' && <InvestTab />}
              {activeTab === 'ai-advisor' && <AiAdvisorTab />}
              {activeTab === 'reports' && <ReportsTab />}
              {activeTab === 'tutorial' && <TutorialTab />}
              {activeTab === 'analytics' && <AnalyticsTab />}
              {activeTab === 'subscriptions' && <SubscriptionsTab />}
              {activeTab === 'health-score' && <HealthScoreTab />}
            </motion.div>
          </AnimatePresence>

          {/* Architectural Footer */}
          <Footer />
        </main>

        {/* Bottom Floating Pill Navigation (mobile only) */}
        <Navigation />
      </div>

      {/* Modals & Overlays */}
      <AddTransactionModal />
      <ScanReceiptModal />
      <WalletModal />
      <AuthModal />
      <AppLockModal />
      <ToastContainer />
      <ClipboardScreenshotDetector />
    </div>
  );
}

export default function HomePage() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

