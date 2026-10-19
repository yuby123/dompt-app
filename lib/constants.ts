import { AppSettings, BudgetConfig, Category, Goal, UpcomingBill, Wallet } from './types';

export const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'wallet-bca',
    name: 'BCA',
    type: 'bank',
    initialBalance: 19115000,
    accountNumber: '**** 2345',
    color: '#005E9E',
    icon: 'Landmark',
    isVerified: true,
    reservedAmount: 14500000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wallet-mandiri',
    name: 'Mandiri',
    type: 'bank',
    initialBalance: 3657000,
    accountNumber: '**** 4567',
    color: '#003366',
    icon: 'Landmark',
    isVerified: true,
    reservedAmount: 2500000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wallet-gopay',
    name: 'Gopay',
    type: 'ewallet',
    initialBalance: 20000,
    color: '#00AED6',
    icon: 'Smartphone',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wallet-cash',
    name: 'Cash',
    type: 'cash',
    initialBalance: 75000,
    color: '#16A34A',
    icon: 'Banknote',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wallet-rdn',
    name: 'RDN BCA',
    type: 'investment',
    initialBalance: 500000,
    accountNumber: '**** 8890',
    color: '#2563EB',
    icon: 'TrendingUp',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wallet-krisflyer',
    name: 'BCA KrisFlyer',
    type: 'credit',
    initialBalance: -2030500,
    color: '#E11D48',
    icon: 'CreditCard',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wallet-spaylater',
    name: 'ShopeePayLater',
    type: 'paylater',
    initialBalance: -120000,
    color: '#F97316',
    icon: 'Clock',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  estimatedIncome: 5000000,
  needsPercent: 50,
  wantsPercent: 30,
  savingsPercent: 20,
  subcategories: [
    { id: 'sub-makan', name: 'Makan', group: 'kebutuhan', allocatedAmount: 1500000, emoji: '🍽️' },
    { id: 'sub-listrik', name: 'Listrik', group: 'kebutuhan', allocatedAmount: 200000, emoji: '⚡', dueDateDay: 20 },
    { id: 'sub-air', name: 'Air PAM', group: 'kebutuhan', allocatedAmount: 35000, emoji: '💧', dueDateDay: 15 },
    { id: 'sub-transport', name: 'Transportasi', group: 'kebutuhan', allocatedAmount: 200000, emoji: '🚌' },
    { id: 'sub-bpjs', name: 'BPJS', group: 'kebutuhan', allocatedAmount: 80000, emoji: '🏥', dueDateDay: 10 },
    { id: 'sub-lainnya', name: 'Kebutuhan Lain', group: 'kebutuhan', allocatedAmount: 85000, emoji: '📦' },
    { id: 'sub-kuota', name: 'Kuota', group: 'kebutuhan', allocatedAmount: 50000, emoji: '📱', dueDateDay: 25 },
    { id: 'sub-ortu', name: 'Orang Tua', group: 'kebutuhan', allocatedAmount: 300000, emoji: '👱' },
    { id: 'sub-belanja', name: 'Belanja Online', group: 'keinginan', allocatedAmount: 500000, emoji: '🛍️' },
    { id: 'sub-hangout', name: 'Hangout', group: 'keinginan', allocatedAmount: 500000, emoji: '☕' },
    { id: 'sub-jajan', name: 'Jajan', group: 'keinginan', allocatedAmount: 250000, emoji: '🍿' },
    { id: 'sub-hobi', name: 'Hobi', group: 'keinginan', allocatedAmount: 100000, emoji: '🎨' },
    { id: 'sub-gaya', name: 'Gaya Hidup', group: 'keinginan', allocatedAmount: 150000, emoji: '💅' },
    { id: 'sub-darurat', name: 'Nabung Dana Darurat', group: 'tabungan', allocatedAmount: 500000, emoji: '🚨' },
    { id: 'sub-invest', name: 'Investasi', group: 'tabungan', allocatedAmount: 500000, emoji: '🤑' },
  ],
};

export const DEFAULT_GOALS: Goal[] = [
  {
    id: 'goal-darurat',
    name: 'Dana Darurat',
    targetAmount: 15000000,
    currentAmount: 14500000,
    targetDate: '2026-03-25',
    emoji: '🚨',
    walletId: 'wallet-bca',
    isEmergencyFund: true,
    isLocked: true,
    monthlyTargetSaving: 500000,
  },
  {
    id: 'goal-jogja',
    name: 'Jalan ke Jogja',
    targetAmount: 5000000,
    currentAmount: 150000,
    targetDate: '2027-03-25',
    emoji: '🌲',
    walletId: 'wallet-mandiri',
    monthlyTargetSaving: 400000,
  },
  {
    id: 'goal-mama',
    name: 'Kado Mama',
    targetAmount: 1000000,
    currentAmount: 300000,
    targetDate: '2026-11-25',
    emoji: '👱',
    walletId: 'wallet-mandiri',
    monthlyTargetSaving: 100000,
  },
  {
    id: 'goal-sepeda',
    name: 'Sepeda Adik',
    targetAmount: 350000,
    currentAmount: 50000,
    targetDate: '2027-01-10',
    emoji: '🚲',
    walletId: 'wallet-mandiri',
    monthlyTargetSaving: 50000,
  },
  {
    id: 'goal-emas',
    name: 'Emas 5gr',
    targetAmount: 15000000,
    currentAmount: 2000000,
    targetDate: '2026-12-31',
    emoji: '🥇',
    walletId: 'wallet-mandiri',
    monthlyTargetSaving: 1500000,
  },
  {
    id: 'goal-rumah',
    name: 'Rumah Impian',
    targetAmount: 500000000,
    currentAmount: 500000,
    targetDate: '2045-01-01',
    emoji: '🏠',
    walletId: 'wallet-rdn',
    monthlyTargetSaving: 2000000,
  },
];

export const DEFAULT_UPCOMING_BILLS: UpcomingBill[] = [
  {
    id: 'bill-krisflyer',
    name: 'BCA KrisFlyer',
    dueDate: '10 Apr',
    amount: 2030500,
    iconEmoji: '💳',
    category: 'Kartu Kredit',
  },
  {
    id: 'bill-spaylater',
    name: 'ShopeePayLater',
    dueDate: '14 Apr',
    amount: 120000,
    iconEmoji: '⏰',
    category: 'Paylater',
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-makan', name: 'Makan', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', iconKey: 'Utensils', emoji: '🍽️', colorValue: '#DC2626', isDefault: true },
  { id: 'cat-jajan', name: 'Jajan', type: 'expense', groupName: 'Keinginan', budgetGroup: 'keinginan', iconKey: 'Coffee', emoji: '☕', colorValue: '#EC4899', isDefault: true },
  { id: 'cat-belanja', name: 'Belanja Online', type: 'expense', groupName: 'Keinginan', budgetGroup: 'keinginan', iconKey: 'ShoppingCart', emoji: '🛍️', colorValue: '#8B5CF6', isDefault: true },
  { id: 'cat-listrik', name: 'Listrik', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', iconKey: 'Zap', emoji: '⚡', colorValue: '#F97316', isDefault: true },
  { id: 'cat-transport', name: 'Transportasi', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', iconKey: 'Bus', emoji: '🚌', colorValue: '#2563EB', isDefault: true },
  { id: 'cat-ortu', name: 'Orang Tua', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', iconKey: 'Heart', emoji: '👱', colorValue: '#EC4899', isDefault: true },
  { id: 'cat-hangout', name: 'Hangout', type: 'expense', groupName: 'Keinginan', budgetGroup: 'keinginan', iconKey: 'Coffee', emoji: '☕', colorValue: '#D97706', isDefault: true },
  { id: 'cat-gaya-hidup', name: 'Gaya Hidup', type: 'expense', groupName: 'Keinginan', budgetGroup: 'keinginan', iconKey: 'Smile', emoji: '💅', colorValue: '#DB2777', isDefault: true },
  { id: 'cat-air', name: 'Air PAM', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', iconKey: 'Droplets', emoji: '💧', colorValue: '#0284C7', isDefault: true },
  { id: 'cat-bpjs', name: 'BPJS', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', iconKey: 'Activity', emoji: '🏥', colorValue: '#059669', isDefault: true },
  { id: 'cat-kuota', name: 'Kuota', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', iconKey: 'Smartphone', emoji: '📱', colorValue: '#4F46E5', isDefault: true },
  { id: 'cat-sedekah', name: 'Sedekah', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', iconKey: 'Heart', emoji: '🤲', colorValue: '#F59E0B', isDefault: true },
  { id: 'cat-hobi', name: 'Hobi', type: 'expense', groupName: 'Keinginan', budgetGroup: 'keinginan', iconKey: 'Film', emoji: '🎨', colorValue: '#7C3AED', isDefault: true },
  { id: 'cat-tabungan', name: 'Tabungan', type: 'expense', groupName: 'Tabungan', budgetGroup: 'tabungan', iconKey: 'PiggyBank', emoji: '🏦', colorValue: '#0D9488', isDefault: true },
  { id: 'cat-investasi', name: 'Investasi', type: 'expense', groupName: 'Tabungan', budgetGroup: 'tabungan', iconKey: 'TrendingUp', emoji: '📈', colorValue: '#10B981', isDefault: true },
  
  // Income
  { id: 'cat-gaji', name: 'Gaji Pokok', type: 'income', groupName: 'Penghasilan', iconKey: 'Briefcase', emoji: '💼', colorValue: '#16A34A', isDefault: true },
  { id: 'cat-bonus', name: 'Bonus', type: 'income', groupName: 'Penghasilan', iconKey: 'Award', emoji: '🎁', colorValue: '#16A34A', isDefault: true },
  { id: 'cat-freelance', name: 'Side Job', type: 'income', groupName: 'Penghasilan', iconKey: 'Laptop', emoji: '💻', colorValue: '#0F766E', isDefault: true },
];

export const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Trisna',
  userEmail: 'creator1@dompt.com',
  currency: 'IDR (Rp)',
  language: 'Bahasa Indonesia',
  themeMode: 'light',
  accentColor: 'lime',
  showDecimals: false,
  hideBalance: true,
  onboardingCompleted: true,
  aiCredits: 1173,
  pinEnabled: false,
  pinLength: 4,
  autoLockMinutes: 1,
  avatarUrl: '/icons/user-sketch.png',
};

export const TUTORIAL_ARTICLES = [
  {
    id: 'tut-install',
    number: '01',
    title: 'Cara Install Dompt',
    badge: 'START HERE',
    category: 'Memulai',
    summary: 'Install Dompt ke HP atau laptop tanpa download aplikasi berat lewat browser.',
    content: `Dompt dapat diinstall langsung sebagai Progressive Web App (PWA) di HP Anda:
1. Buka link Dompt di Google Chrome (Android) atau Safari (iPhone).
2. Tekan menu titik tiga atau tombol Share di Safari.
3. Pilih "Tambahkan ke Layar Utama" (Add to Home Screen).
4. Icon Dompt akan langsung muncul di menu HP Anda dan bisa dibuka kapan saja!`,
  },
  {
    id: 'tut-setup',
    number: '02',
    title: 'Pengaturan Awal',
    badge: 'ESSENTIAL',
    category: 'Memulai',
    summary: 'Setup dompet, budget 50/30/20, dan transaksi pertama kamu.',
    content: `Langkah pertama menggunakan Dompt:
1. Sesuaikan nama dompet Anda (BCA, Mandiri, Cash, dll.) di menu Dompet.
2. Masukkan perkiraan pemasukan bulanan di menu "Atur Budget".
3. Tentukan alokasi 50% Kebutuhan, 30% Keinginan, dan 20% Tabungan.`,
  },
  {
    id: 'tut-home',
    number: '03',
    title: 'Home (Dashboard)',
    badge: 'PANDUAN',
    category: 'Home',
    summary: 'Halaman utama yang menampilkan ringkasan harian, kalender aktivitas, dan runway dana darurat.',
    content: `Di dashboard, Anda dapat melihat:
- Sekilas Hari Ini: sisa budget harian yang boleh dibelanjakan.
- Progres Pengeluaran 50/30/20: status persentase Kebutuhan, Keinginan, dan Tabungan.
- Aktivitas Kalender: jumlah pengeluaran di setiap tanggal.
- Runway Dana Darurat: estimasi berapa bulan dana darurat Anda bisa menopang biaya hidup.`,
  },
  {
    id: 'tut-dompet',
    number: '04',
    title: 'Mengelola Dompet & Rekening',
    badge: 'DOMPET',
    category: 'Dompet',
    summary: 'Cara menambah rekening bank, e-wallet, dan mencadangkan dana untuk goals.',
    content: `Di menu Dompet:
- Pisahkan saldo aktif dan saldo yang dicadangkan untuk target tabungan (Goals).
- Lakukan verifikasi saldo harian agar catatan selalu akurat dengan rekening fisik Anda.
- Catat utang kartu kredit dan paylater sebagai saldo negatif agar total kekayaan bersih terhitung akurat.`,
  },
  {
    id: 'tut-budget',
    number: '05',
    title: 'Atur Budget 50/30/20',
    badge: 'FINANSIAL',
    category: 'Budget',
    summary: 'Membagi uang ke 3 pos utama: Kebutuhan, Keinginan, dan Tabungan.',
    content: `Metode 50/30/20 adalah formula keuangan paling efektif:
- 50% Kebutuhan (Makan, Listrik, Sewa, Transportasi)
- 30% Keinginan (Hangout, Belanja, Jajan, Hobi)
- 20% Tabungan (Dana Darurat, Investasi)
Jika pengeluaran mendekati batas, Dompt akan memberikan peringatan visual berwarna kuning/merah.`,
  },
  {
    id: 'tut-scanner',
    number: '06',
    title: 'Scan Struk dengan AI',
    badge: 'AI FITUR',
    category: 'Home',
    summary: 'Foto struk belanjaan untuk otomatis membuat transaksi tanpa ketik manual.',
    content: `Cukup arahkan kamera ke struk belanjaan (Indomaret, Alfamart, kafe, dll.), sistem AI akan langsung mengenali nama toko, total rupiah, dan kategorinya secara otomatis.`,
  },
  {
    id: 'tut-goals',
    number: '07',
    title: 'Target Tabungan (Goals)',
    badge: 'GOALS',
    category: 'Home',
    summary: 'Pantau impian besar: Dana Darurat, Jalan-jalan, Emas, hingga Rumah Impian.',
    content: `Tetapkan target nominal dan tanggal jatuh tempo. Kunci dana darurat agar tidak sengaja terpakai untuk pos keinginan harian.`,
  },
];
