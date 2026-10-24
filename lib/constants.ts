import { AppSettings, BudgetConfig, Category, Debt, Goal, UpcomingBill, Wallet } from './types';

export const DEFAULT_DEBTS: Debt[] = [
  {
    id: 'debt-cicilan-gadget',
    name: 'Cicilan Gadget Kerja',
    type: 'payable',
    contactName: 'BCA Smartcash / Paylater',
    totalAmount: 6000000,
    remainingAmount: 2000000,
    dueDate: '2026-07-10',
    startDate: '2026-01-10',
    category: 'cicilan',
    isInstallment: true,
    tenorMonths: 6,
    monthlyInstallment: 1000000,
    dueDayOfMonth: 10,
    status: 'active',
    note: 'Cicilan 6 bulan, tersisa 2 bulan lagi (Tiap tgl 10)',
    payments: [
      {
        id: 'pay-sample-1',
        debtId: 'debt-cicilan-gadget',
        amount: 4000000,
        date: '2026-04-10',
        walletName: 'BCA',
        note: 'Pembayaran bulan 1 sampai 4',
      },
    ],
    createdAt: '2026-01-10T00:00:00',
    updatedAt: '2026-04-10T00:00:00',
  },
  {
    id: 'debt-piutang-rekan',
    name: 'Talangan Tiket Kereta Liburan',
    type: 'receivable',
    contactName: 'Dimas Prasetyo',
    totalAmount: 750000,
    remainingAmount: 750000,
    dueDate: '2026-05-02',
    startDate: '2026-04-12',
    category: 'personal',
    status: 'active',
    note: 'Janji transfer setelah gajian awal bulan',
    payments: [],
    createdAt: '2026-04-12T00:00:00',
    updatedAt: '2026-04-12T00:00:00',
  },
];

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
    createdAt: '2026-03-01T00:00:00',
    updatedAt: '2026-03-01T00:00:00',
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
    createdAt: '2026-03-01T00:00:00',
    updatedAt: '2026-03-01T00:00:00',
  },
  {
    id: 'wallet-gopay',
    name: 'Gopay',
    type: 'ewallet',
    initialBalance: 20000,
    color: '#00AED6',
    icon: 'Smartphone',
    createdAt: '2026-03-01T00:00:00',
    updatedAt: '2026-03-01T00:00:00',
  },
  {
    id: 'wallet-cash',
    name: 'Cash',
    type: 'cash',
    initialBalance: 75000,
    color: '#16A34A',
    icon: 'Banknote',
    createdAt: '2026-03-01T00:00:00',
    updatedAt: '2026-03-01T00:00:00',
  },
  {
    id: 'wallet-rdn',
    name: 'RDN BCA',
    type: 'investment',
    initialBalance: 500000,
    accountNumber: '**** 8890',
    color: '#2563EB',
    icon: 'TrendingUp',
    createdAt: '2026-03-01T00:00:00',
    updatedAt: '2026-03-01T00:00:00',
  },
  {
    id: 'wallet-krisflyer',
    name: 'BCA KrisFlyer',
    type: 'credit',
    initialBalance: -2030500,
    color: '#E11D48',
    icon: 'CreditCard',
    createdAt: '2026-03-01T00:00:00',
    updatedAt: '2026-03-01T00:00:00',
  },
  {
    id: 'wallet-spaylater',
    name: 'ShopeePayLater',
    type: 'paylater',
    initialBalance: -120000,
    color: '#F97316',
    icon: 'Clock',
    createdAt: '2026-03-01T00:00:00',
    updatedAt: '2026-03-01T00:00:00',
  },
];

export const EMPTY_BUDGET_CONFIG: BudgetConfig = {
  estimatedIncome: 0,
  needsPercent: 50,
  wantsPercent: 30,
  savingsPercent: 20,
  subcategories: [],
};

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
    emoji: '🧓',
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
    emoji: '🏅',
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
  { id: 'cat-makan', name: 'Makan', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', expenseNature: 'variable', iconKey: 'Utensils', emoji: '🍽️', colorValue: '#DC2626', isDefault: true },
  { id: 'cat-belanja-bulanan', name: 'Belanja Bulanan & Masak', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', expenseNature: 'grocery', iconKey: 'ShoppingCart', emoji: '🛒', colorValue: '#D97706', isDefault: true },
  { id: 'cat-jajan', name: 'Jajan', type: 'expense', groupName: 'Keinginan', budgetGroup: 'keinginan', expenseNature: 'variable', iconKey: 'Coffee', emoji: '☕', colorValue: '#EC4899', isDefault: true },
  { id: 'cat-belanja', name: 'Belanja Online', type: 'expense', groupName: 'Keinginan', budgetGroup: 'keinginan', expenseNature: 'variable', iconKey: 'ShoppingCart', emoji: '🛍️', colorValue: '#8B5CF6', isDefault: true },
  { id: 'cat-listrik', name: 'Listrik', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', expenseNature: 'fixed', iconKey: 'Zap', emoji: '⚡', colorValue: '#F97316', isDefault: true },
  { id: 'cat-transport', name: 'Transportasi', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', expenseNature: 'variable', iconKey: 'Bus', emoji: '🚌', colorValue: '#2563EB', isDefault: true },
  { id: 'cat-ortu', name: 'Orang Tua', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', expenseNature: 'variable', iconKey: 'Heart', emoji: '👱', colorValue: '#EC4899', isDefault: true },
  { id: 'cat-hangout', name: 'Hangout', type: 'expense', groupName: 'Keinginan', budgetGroup: 'keinginan', expenseNature: 'variable', iconKey: 'Coffee', emoji: '☕', colorValue: '#D97706', isDefault: true },
  { id: 'cat-gaya-hidup', name: 'Gaya Hidup', type: 'expense', groupName: 'Keinginan', budgetGroup: 'keinginan', expenseNature: 'variable', iconKey: 'Smile', emoji: '💅', colorValue: '#DB2777', isDefault: true },
  { id: 'cat-air', name: 'Air PAM', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', expenseNature: 'fixed', iconKey: 'Droplets', emoji: '💧', colorValue: '#0284C7', isDefault: true },
  { id: 'cat-bpjs', name: 'BPJS', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', expenseNature: 'fixed', iconKey: 'Activity', emoji: '🏥', colorValue: '#059669', isDefault: true },
  { id: 'cat-kuota', name: 'Kuota', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', expenseNature: 'fixed', iconKey: 'Smartphone', emoji: '📱', colorValue: '#4F46E5', isDefault: true },
  { id: 'cat-kondangan', name: 'Kondangan & Sosial', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', expenseNature: 'non_daily', iconKey: 'Gift', emoji: '✉️', colorValue: '#E11D48', isDefault: true },
  { id: 'cat-sedekah', name: 'Sedekah & Donasi', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', expenseNature: 'non_daily', iconKey: 'Heart', emoji: '🤲', colorValue: '#F59E0B', isDefault: true },
  { id: 'cat-hobi', name: 'Hobi', type: 'expense', groupName: 'Keinginan', budgetGroup: 'keinginan', expenseNature: 'variable', iconKey: 'Film', emoji: '🎨', colorValue: '#7C3AED', isDefault: true },
  { id: 'cat-tagihan', name: 'Tagihan & Utilitas', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', expenseNature: 'fixed', iconKey: 'FileText', emoji: '🧾', colorValue: '#0284C7', isDefault: true },
  { id: 'cat-hiburan', name: 'Hiburan & Langganan', type: 'expense', groupName: 'Keinginan', budgetGroup: 'keinginan', expenseNature: 'variable', iconKey: 'Film', emoji: '🎬', colorValue: '#EC4899', isDefault: true },
  { id: 'cat-tabungan', name: 'Tabungan', type: 'expense', groupName: 'Tabungan', budgetGroup: 'tabungan', expenseNature: 'savings', iconKey: 'PiggyBank', emoji: '🏦', colorValue: '#0D9488', isDefault: true },
  { id: 'cat-investasi', name: 'Investasi', type: 'expense', groupName: 'Tabungan', budgetGroup: 'tabungan', expenseNature: 'savings', iconKey: 'TrendingUp', emoji: '📈', colorValue: '#10B981', isDefault: true },
  
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

export interface TutorialArticle {
  id: string;
  number: string;
  title: string;
  badge: string;
  category: 'Memulai' | 'Home' | 'Dompet' | 'Budget' | 'AI & Transaksi' | 'Kekayaan' | 'Akun';
  summary: string;
  targetTab?: string;
  targetLabel?: string;
  steps?: string[];
  tips?: string;
  content: string;
}

export const TUTORIAL_ARTICLES: TutorialArticle[] = [
  {
    id: 'tut-setup',
    number: '01',
    title: 'Langkah Awal Pengguna Baru (Mulai dari Rp 0)',
    badge: 'START HERE',
    category: 'Memulai',
    summary: 'Urutan 4 langkah mudah mengatur Dompet, Budget 50/30/20, tanggal gajian, hingga mencatat transaksi pertama.',
    targetTab: 'wallets',
    targetLabel: 'Buka Menu Dompet',
    steps: [
      'Buka menu Dompet, pilih salah satu dompet (misal BCA atau Tunai), lalu klik Edit untuk mengisi Saldo Awal Anda saat ini.',
      'Buka menu Atur Budget, isi Estimasi Pemasukan Bulanan serta pilih Tanggal Gajian (siklus awal bulan anggaran Anda).',
      'Tambahkan subkategori pengeluaran rutin di pos Kebutuhan (50%), Keinginan (30%), dan Tabungan (20%).',
      'Klik tombol (+) di navigasi untuk mulai mencatat pengeluaran, pemasukan, atau transfer antar dompet.',
    ],
    tips: 'Saat pertama kali login atau setelah melakukan Reset Data, seluruh angka otomatis dimulai dari Rp 0 agar Anda bisa mencatat keuangan asli dari awal.',
    content: `Selamat datang di Dompt! Agar pencatatan keuangan Anda rapi dan akurat sejak hari pertama, ikuti urutan berikut:

1. Atur Saldo Awal Dompet: Masuk ke tab Dompet, pilih rekening bank/e-wallet yang Anda miliki atau tambah dompet baru, lalu masukkan saldo riil Anda saat ini.
2. Tetapkan Estimasi Pemasukan & Tanggal Gajian: Masuk ke menu Budget, klik "Atur Gaji" untuk memasukkan target pemasukan bulanan dan tanggal gajian Anda.
3. Buat Pos Subkategori: Di halaman Budget, tambahkan rincian pos seperti Makan, Transportasi, Tagihan Listrik, hingga Tabungan.
4. Catat Transaksi Harian: Gunakan tombol (+) atau fitur Scanner Struk AI setiap kali Anda bertransaksi.`,
  },
  {
    id: 'tut-login-sync',
    number: '02',
    title: 'Login Google / Email, Keamanan Data & Cloud Sync',
    badge: 'ESSENTIAL',
    category: 'Akun',
    summary: 'Cara kerja penyimpanan Cloud pribadi per akun (Google atau Email) dan keamanan privasi data Anda.',
    targetTab: 'settings',
    targetLabel: 'Buka Pengaturan Akun',
    steps: [
      'Klik tombol "Masuk" di pojok kanan atas aplikasi atau melalui menu Pengaturan.',
      'Pilih masuk dengan Akun Google atau daftar/masuk menggunakan alamat Email & Password.',
      'Data keuangan Anda langsung tersimpan secara terpisah di Cloud Firestore khusus untuk akun Anda.',
      'Anda dapat login dari HP maupun laptop dan seluruh dompet, budget, serta transaksi akan tersinkronisasi otomatis.',
    ],
    tips: 'Setiap akun memiliki ruang penyimpanan yang terisolasi sehingga data antar pengguna tidak akan pernah tercampur.',
    content: `Dompt mendukung mode Multi-User dengan sinkronisasi Cloud:

• Tanpa Login (Mode Tamu / Demo): Data disimpan di memori browser perangkat (LocalStorage) dan menampilkan contoh simulasi agar Anda bisa mencoba fitur.
• Setelah Login (Google / Email): Anda mendapatkan ruang penyimpanan Cloud pribadi. Pengguna baru otomatis dimulai dengan saldo Rp 0 (bersih tanpa data contoh).
• Privasi Terjamin: Pengguna lain tidak dapat melihat dompet, transaksi, maupun target tabungan Anda.`,
  },
  {
    id: 'tut-home',
    number: '03',
    title: 'Membaca Dashboard, Limit Harian & Kalender Aktivitas',
    badge: 'PANDUAN',
    category: 'Home',
    summary: 'Memahami batas aman belanja harian, progres 50/30/20, kalender pengeluaran, dan tagihan mendatang.',
    targetTab: 'dashboard',
    targetLabel: 'Lihat Dashboard',
    steps: [
      'Kartu utama menampilkan Total Saldo Aktif serta batas aman pengeluaran harian (Safe-to-Spend) hingga tanggal gajian berikutnya.',
      'Klik ikon Mata di kartu utama untuk menyembunyikan atau menampilkan nominal rupiah (Mode Privasi Saldo).',
      'Lihat "Progres Pengeluaran" untuk memantau persentase pemakaian pos Kebutuhan, Keinginan, dan Tabungan.',
      'Cek "Kalender Aktivitas" dan "Tagihan Mendatang" untuk memantau tanggal pengeluaran terbesar serta jadwal jatuh tempo.',
    ],
    tips: 'Daftar "Tagihan Mendatang" otomatis muncul dari tagihan Kartu Kredit/Paylater, Langganan aktif, Cicilan Utang, maupun subkategori Budget yang memiliki tanggal jatuh tempo.',
    content: `Dashboard dirancang sebagai pusat kendali harian Anda:

• Jatah Belanja Harian (Safe-to-Spend): Menghitung otomatis berapa rupiah yang aman dibelanjakan hari ini dari sisa Pos Pengeluaran Harian dibagi sisa hari menuju gajian berikutnya.
• Ketahanan Dana Darurat (Runway): Menghitung berapa bulan Anda bisa bertahan hidup dari saldo kas likuid saat ini.
• Tagihan Mendatang: Pengingat otomatis untuk cicilan kartu kredit, paylater, utang, maupun tagihan rutin bulanan.`,
  },
  {
    id: 'tut-dompet',
    number: '04',
    title: 'Mengelola Dompet, E-Wallet & Verifikasi Saldo',
    badge: 'DOMPET',
    category: 'Dompet',
    summary: 'Cara menambah rekening bank, e-wallet, tabungan, investasi (RDN), dan mencocokkan saldo fisik.',
    targetTab: 'wallets',
    targetLabel: 'Kelola Dompet',
    steps: [
      'Buka menu Dompet, lalu klik tombol "+ Tambah Dompet" di pojok kanan atas untuk membuat dompet baru.',
      'Pilih tipe dompet: Bank, E-Wallet, Tunai, Tabungan, Investasi (RDN), Kartu Kredit, atau Paylater.',
      'Lihat ringkasan Total Saldo Aktif, Bebas Pakai, Dicadangkan, dan Tagihan Kredit pada kartu utama Dompet.',
      'Gunakan fitur Edit pada kartu dompet jika Anda ingin menyesuaikan informasi atau mencocokkan saldo dengan mutasi bank asli.',
    ],
    tips: 'Pisahkan dompet operasional harian (misal e-wallet/bank utama) dengan dompet khusus Tabungan agar uang belanja tidak tercampur.',
    content: `Di menu Dompet & Rekening:

• Multi-Tipe Dompet: Mendukung rekening bank, dompet digital (Gopay, OVO, Dana, ShopeePay), uang tunai, rekening dana nasabah (RDN), hingga kartu kredit.
• Ringkasan Transparan: Setiap kartu dompet menampilkan pemasukan dan pengeluaran bulan berjalan serta jumlah transaksi yang tercatat pada dompet tersebut.`,
  },
  {
    id: 'tut-dicadangkan-kredit',
    number: '05',
    title: 'Cara Mengisi Dana Dicadangkan & Tagihan Kredit',
    badge: 'FITUR BARU',
    category: 'Dompet',
    summary: 'Panduan lengkap mengunci saldo "Dicadangkan" agar tidak terpakai dan mencatat "Tagihan Kredit".',
    targetTab: 'wallets',
    targetLabel: 'Buka Menu Dompet',
    steps: [
      'Cara 1 Isi "Dicadangkan" (Otomatis lewat Goals): Buka menu Target Tabungan (Goals), buat Goal dan pilih dompet penyimpanannya. Saldo Goal otomatis menjadi dana Dicadangkan di dompet tersebut.',
      'Cara 2 Isi "Dicadangkan" (Manual di Dompet): Buka menu Dompet, klik Edit pada dompet, lalu isi kolom "Nominal Dicadangkan / Dikunci (Opsional)".',
      'Cara 1 Isi "Tagihan Kredit": Buat atau edit dompet bertipe "Kartu Kredit" atau "Paylater", lalu masukkan nominal tagihan berjalan atau catat pengeluaran memakai dompet tersebut.',
      'Cara 2 Isi "Tagihan Kredit" (Lewat Menu Utang): Buka menu Utang & Piutang, lalu tambahkan catatan pada tab "Utang Saya".',
    ],
    tips: 'Dana yang masuk ke "Dicadangkan" otomatis mengurangi angka "Bebas Pakai", sehingga Anda tahu persis berapa sisa uang yang benar-benar aman untuk dibelanjakan.',
    content: `Pada kartu utama menu Dompet terdapat dua indikator penting:

1. DICADANGKAN (Dana Dikunci / Disisihkan):
Berfungsi memisahkan uang tabungan atau dana darurat yang masih berada di dalam rekening bank yang sama agar tidak sengaja terpakai. Jumlahnya adalah gabungan dari saldo Goals di dompet tersebut ditambah nominal cadangan manual yang Anda atur di pengaturan dompet.

2. TAGIHAN KREDIT (Kewajiban Berjalan):
Menampilkan total tagihan terpakai dari dompet bertipe Kartu Kredit & Paylater, serta selaras dengan catatan kewajiban di menu Utang.`,
  },
  {
    id: 'tut-anti-minus',
    number: '06',
    title: 'Proteksi Saldo Anti-Minus & Peringatan Saldo Kurang',
    badge: 'FITUR BARU',
    category: 'Dompet',
    summary: 'Simulasi proteksi pembayaran otomatis ketika saldo dompet tidak mencukupi nominal transaksi.',
    targetTab: 'wallets',
    targetLabel: 'Cek Saldo Dompet',
    steps: [
      'Setiap kali Anda mencatat pengeluaran, transfer, bayar langganan, setor ke Goals, atau bayar cicilan utang, sistem otomatis mengecek saldo dompet yang dipilih.',
      'Jika saldo dompet lebih kecil dari nominal pembayaran, transaksi akan ditahan agar saldo dompet tidak menjadi minus.',
      'Layar akan menampilkan pop-up "Peringatan Saldo Tidak Cukup" berisi rincian saldo saat ini, nominal pembayaran, dan selisih kekurangannya.',
      'Pilih tombol "Top Up / Tambah Pemasukan" untuk mengisi saldo dompet terlebih dahulu, atau "Pindah / Kelola Dompet Lain" untuk memakai dompet lain yang saldonya cukup.',
    ],
    tips: 'Proteksi ini memastikan catatan saldo di aplikasi selalu realistis sesuai uang riil yang Anda miliki tanpa ada saldo minus yang membingungkan.',
    content: `Dompt dilengkapi sistem validasi saldo real-time (Anti-Minus Protection) di seluruh titik pembayaran:

• Transaksi Pengeluaran & Edit Transaksi
• Transfer Saldo Antar Dompet
• Scan Struk Belanja AI
• Pembayaran Tagihan Berulang / Langganan
• Setor Saldo ke Target Tabungan (Goals)
• Pembayaran Cicilan Utang`,
  },
  {
    id: 'tut-budget',
    number: '07',
    title: 'Atur Budget 50/30/20, Siklus Gajian & Pos Harian/Tagihan',
    badge: 'DIPERBARUI',
    category: 'Budget',
    summary: 'Mengatur siklus tanggal gajian serta memisahkan Pos Tagihan Bulanan (Fixed) dan Pos Pengeluaran Harian.',
    targetTab: 'budget',
    targetLabel: 'Atur Budget Sekarang',
    steps: [
      'Buka menu Atur Budget, klik "Atur Gaji" di kartu utama untuk mengisi Estimasi Pemasukan dan Tanggal Gajian (misal tanggal 25).',
      'Klik baris menu ringkas "Pos Tagihan Bulanan (Fixed)" atau "Pos Pengeluaran Harian (Operasional)" di kartu utama untuk membuka rinciannya.',
      'Pilih rumus alokasi otomatis (50/30/20, 60/20/20, atau 70/20/10) dan tambahkan subkategori di masing-masing pos.',
      'Isi "Tanggal Jatuh Tempo" pada subkategori tagihan wajib agar otomatis dihitung dalam Pos Tagihan Bulanan (Fixed).',
    ],
    tips: 'Menu Pos Tagihan Bulanan dan Pos Pengeluaran Harian disembunyikan secara ringkas agar tampilan bersih—cukup klik judul posnya kapan saja untuk membuka detailnya!',
    content: `Keunggulan sistem Budget di Dompt:

• Siklus Tanggal Gajian (Payday Cycle): Jika Anda gajian setiap tanggal 25, siklus anggaran otomatis dihitung dari 25 bulan ini hingga 24 bulan depan.
• Pemisahan Tagihan Tetap vs Belanja Harian: Pembayaran tagihan besar (seperti Kost, Listrik, Cicilan) masuk ke Pos Tagihan Bulanan (Fixed) sehingga tidak merusak kuota makan/jajan harian Anda di Pos Pengeluaran Harian.`,
  },
  {
    id: 'tut-transaksi-ai',
    number: '08',
    title: 'Catat Transaksi, Sifat Pengeluaran Otomatis & Paste Struk',
    badge: 'DIPERBARUI',
    category: 'AI & Transaksi',
    summary: 'Otomatisasi sifat pengeluaran (Harian, Tagihan Bulanan, Alokasi Tabungan) dan deteksi gambar clipboard.',
    targetTab: 'transactions',
    targetLabel: 'Lihat Riwayat Transaksi',
    steps: [
      'Tekan tombol (+) untuk membuka form transaksi, lalu pilih Pengeluaran, Pemasukan, atau Transfer.',
      'Pilih Kategori: Sistem otomatis menyesuaikan "Sifat Pengeluaran" (misal pilih kategori Tabungan/Investasi otomatis berpindah ke "Alokasi Tabungan").',
      'Pilih kategori Listrik/BPJS/Kuota/Tagihan untuk otomatis masuk ke "Tagihan Bulanan", atau Makan/Jajan untuk "Pengeluaran Harian".',
      'Gunakan pencarian dan filter di tab Riwayat Transaksi untuk mengecek, mengedit, atau menghapus transaksi.',
    ],
    tips: 'Ketika Anda mencatat pengeluaran berkategori Tabungan atau Investasi, sistem otomatis menandainya sebagai Alokasi Tabungan sehingga jatah belanja harian Anda tidak terpotong!',
    content: `Semua transaksi yang Anda catat bekerja secara cerdas:
1. Memastikan saldo dompet mencukupi sebelum transaksi disimpan.
2. Mengelompokkan transaksi ke Pos Harian, Pos Tagihan Bulanan, atau Pos Tabungan secara otomatis sesuai kategori.
3. Mendukung fitur Paste (Ctrl+V) gambar bukti transfer/struk langsung dari clipboard perangkat Anda.`,
  },
  {
    id: 'tut-scanner',
    number: '09',
    title: 'Scan Struk Belanja Otomatis dengan AI',
    badge: 'AI FITUR',
    category: 'AI & Transaksi',
    summary: 'Unggah foto struk minimarket, restoran, atau bukti QRIS untuk otomatis menjadi catatan transaksi.',
    targetTab: 'scanner',
    targetLabel: 'Coba Scanner Struk AI',
    steps: [
      'Klik tombol "Scan Struk" di Dashboard atau di dalam form tambah transaksi.',
      'Pilih foto struk belanjaan dari galeri HP/laptop atau tempel (Paste) screenshot bukti bayar.',
      'AI otomatis membaca nama toko/merchant, tanggal, total nominal, serta menyarankan kategori yang paling tepat.',
      'Periksa hasilnya, pastikan dompet pembayaran memiliki saldo cukup, lalu klik Simpan Transaksi.',
    ],
    tips: 'Setiap pemindaian struk menggunakan 1 AI Credit. Anda dapat melakukan Top Up AI Credits secara gratis kapan saja di menu Pengaturan.',
    content: `Tidak perlu lagi mengetik satu per satu sehabis belanja! Teknologi Vision AI di Dompt mampu mengenali struk fisik (minimarket, supermarket, restoran) maupun tangkapan layar bukti pembayaran digital (QRIS, m-banking, e-wallet).`,
  },
  {
    id: 'tut-subscriptions',
    number: '10',
    title: 'Langganan & Tagihan Berulang Otomatis',
    badge: 'TAGIHAN',
    category: 'AI & Transaksi',
    summary: 'Kelola tagihan bulanan (Netflix, Spotify, WiFi, Listrik, Kost) dan jadwal Gaji dengan pencatatan 1 klik.',
    targetTab: 'subscriptions',
    targetLabel: 'Buka Menu Langganan',
    steps: [
      'Buka menu "Langganan" dari navigasi atau Dashboard, lalu klik tombol (+) untuk menambah jadwal baru.',
      'Pilih template cepat (Netflix, Spotify, WiFi, Listrik PLN, Kost, Gaji) atau ketik manual beserta tanggal jatuh temponya (1–31).',
      'Pantau total beban langganan per bulan dan estimasi biaya per tahun agar tidak ada biaya tersembunyi.',
      'Klik tombol "Bayar & Catat" (atau "Terima & Catat" untuk gaji) agar transaksi langsung tercatat ke dompet dan budget Anda.',
    ],
    tips: 'Saat menekan "Bayar & Catat", sistem juga otomatis mengecek kecukupan saldo dompet yang terhubung.',
    content: `Fitur Langganan & Transaksi Berulang terhubung langsung dengan subkategori Budget dan daftar Tagihan Mendatang di Dashboard, sehingga Anda tidak pernah terlewat membayar tagihan rutin.`,
  },
  {
    id: 'tut-goals',
    number: '11',
    title: 'Target Tabungan (Goals) & Kunci Dana Darurat',
    badge: 'GOALS',
    category: 'Kekayaan',
    summary: 'Wujudkan impian finansial dengan progres terukur, tambah/tarik tabungan, dan fitur Lock.',
    targetTab: 'goals',
    targetLabel: 'Buka Menu Goals',
    steps: [
      'Buka menu Target Tabungan (Goals), lalu klik tombol (+) untuk membuat target baru.',
      'Masukkan nama target (misal: Dana Darurat, Liburan, Beli Laptop), target nominal, tanggal tercapai, dan dompet tempat menyimpan uangnya.',
      'Klik kartu Goal untuk menambah saldo (+ Tambah Saldo) atau menarik saldo (- Tarik Saldo).',
      'Aktifkan tombol "Lock" pada Dana Darurat agar saldo tabungan terkunci dan tidak bisa ditarik sembarangan.',
    ],
    tips: 'Saat Anda menambah saldo ke Goal, sistem otomatis memastikan saldo bebas pakai di dompet yang terhubung mencukupi.',
    content: `Fitur Goals membantu Anda memisahkan uang tabungan dari uang belanja harian meskipun disimpan di rekening bank yang sama. Saldo yang terkumpul di Goal otomatis tercatat sebagai dana "Dicadangkan" pada dompet tersebut.`,
  },
  {
    id: 'tut-debt-installment',
    number: '12',
    title: 'Utang, Skema Cicilan Otomatis & Piutang',
    badge: 'DIPERBARUI',
    category: 'Kekayaan',
    summary: 'Kelola Utang Saya (termasuk cicilan bulanan yang terhubung ke Budget) serta tagih Piutang teman.',
    targetTab: 'debt',
    targetLabel: 'Buka Menu Utang',
    steps: [
      'Buka menu Utang & Piutang, pilih tab "Utang Saya" (kewajiban kita) atau "Piutang" (uang kita yang dipinjam orang).',
      'Saat menambah Utang, aktifkan opsi "Skema Cicilan Bulanan" jika pembayaran dicicil per bulan (isi tenor, cicilan/bulan, dan tanggal jatuh tempo).',
      'Cicilan bulanan aktif akan otomatis dibuatkan pos di Budget Kebutuhan (Tagihan Bulanan) dan muncul di pengingat Tagihan Mendatang.',
      'Klik tombol "Bayar Cicilan" dan pilih dompet pembayaran untuk langsung memotong sisa utang sekaligus mencatat pengeluaran di dompet.',
    ],
    tips: 'Jika Anda menghapus transaksi pembayaran cicilan di Riwayat Transaksi, sisa pokok utang akan otomatis dikembalikan secara akurat.',
    content: `Manajemen Utang & Piutang di Dompt terintegrasi penuh dengan Arus Kas:
• Pembayaran Utang Saya otomatis memotong saldo dompet dan tercatat sebagai pengeluaran Tagihan Bulanan.
• Penerimaan pelunasan Piutang otomatis menambah saldo dompet yang Anda pilih.`,
  },
  {
    id: 'tut-assets-wealth',
    number: '13',
    title: 'Aset Likuid, Aset Tetap & Portofolio Investasi',
    badge: 'KEKAYAAN',
    category: 'Kekayaan',
    summary: 'Pantau Total Kekayaan Bersih (Net Worth), piramida level kekayaan, dan kelola hasil investasi.',
    targetTab: 'assets',
    targetLabel: 'Buka Menu Aset',
    steps: [
      'Di menu Aset: Catat Aset Likuid tambahan (deposito, emas cair) dan Aset Tetap (kendaraan, properti, gadget) untuk menghitung Total Kekayaan Bersih (Net Worth).',
      'Pantau perkembangan Level Finansial Anda berdasarkan akumulasi aset bersih setelah dikurangi total utang.',
      'Di menu Investasi: Tambahkan portofolio Saham, Reksadana, Emas, atau Crypto beserta persentase imbal hasilnya (return).',
    ],
    tips: 'Aset Likuid yang Anda catat di menu Aset juga ikut memperkuat perhitungan Ketahanan Dana Darurat (Runway) Anda.',
    content: `Keuangan yang sehat bukan hanya soal mencatat pengeluaran harian, tetapi juga memastikan nilai Aset Bersih (Net Worth) dan Investasi Anda terus bertumbuh dari waktu ke waktu.`,
  },
  {
    id: 'tut-analytics-score',
    number: '14',
    title: 'Membaca Menu Analisis & Skor Keuangan (0–100)',
    badge: 'DIPERBARUI',
    category: 'AI & Transaksi',
    summary: 'Cara mudah memahami Skor Kesehatan Finansial, perbandingan Rupiah 4 Pilar, dan langkah menaikkan skor.',
    targetTab: 'analytics',
    targetLabel: 'Buka Analisis & Skor',
    steps: [
      'Buka menu "Analisis & Skor": Kartu utama menampilkan Skor Kesehatan Finansial (0–100), Panduan Arti Skor, serta 4 Angka Kunci (Kas Likuid, Pemasukan, Pengeluaran, dan Ditabung).',
      'Periksa "Rincian 4 Pilar Penentu Skor": Bandingkan langsung angka Kondisi Saat Ini (dalam Rupiah & %) dengan Target Idealnya.',
      'Lihat kartu "Cara Menaikkan Skor Anda": Sistem mengurutkan langkah perbaikan dari potensi tambahan poin terbesar (misal +28 Poin).',
      'Pantau "Porsi Pengeluaran per Kategori" dan "Pola Pengeluaran Harian" untuk melihat kategori paling boros serta jumlah hari hemat (No-Spend Day).',
    ],
    tips: 'Gunakan tab filter di bagian atas ("Semua Ringkasan", "Skor & 4 Pilar", atau "Pengeluaran & Tren") untuk fokus pada tampilan yang ingin Anda evaluasi.',
    content: `Skor Kesehatan Keuangan (0–100 Poin) dihitung secara transparan dari 4 Pilar:
1. Rasio Menabung (Maks 30 Poin) — Ideal minimal 20% dari pemasukan.
2. Ketahanan Dana Darurat (Maks 25 Poin) — Ideal kas likuid cukup untuk 3–6 bulan biaya hidup.
3. Kedisiplinan Budget Bulanan (Maks 25 Poin) — Ideal pengeluaran terjaga ≤ 85% kuota budget.
4. Kesehatan Beban Utang (Maks 20 Poin) — Ideal total utang/kredit di bawah 20% aset likuid.`,
  },
  {
    id: 'tut-ai-reports',
    number: '15',
    title: 'Konsultasi AI Financial Advisor & Ekspor CSV',
    badge: 'ANALITIK',
    category: 'AI & Transaksi',
    summary: 'Diskusi strategi keuangan personal dengan AI Advisor dan unduh laporan transaksi ke Excel/CSV.',
    targetTab: 'ai-advisor',
    targetLabel: 'Tanya AI Advisor',
    steps: [
      'Buka menu "AI Advisor" untuk berdiskusi langsung mengenai strategi tabungan, budget, atau pelunasan utang Anda.',
      'Gunakan tombol pertanyaan cepat atau ketik pertanyaan spesifik sesuai kondisi keuangan Anda bulan ini.',
      'Klik tombol "Unduh CSV" di menu Analisis & Skor atau Pengaturan untuk mengekspor seluruh transaksi ke Excel / Google Sheets.',
    ],
    tips: 'AI Advisor memahami konteks saldo dompet, estimasi pemasukan, pengeluaran, dan skor kesehatan keuangan Anda sehingga sarannya relevan dan langsung bisa dipraktikkan.',
    content: `Kombinasikan evaluasi di menu Analisis & Skor dengan konsultasi bersama Dompt AI Advisor setiap akhir periode gajian agar rencana keuangan bulan berikutnya semakin matang.`,
  },
  {
    id: 'tut-security-reset',
    number: '16',
    title: 'Kunci PIN, 3 Warna Tema Dinamis & Reset Data ke 0',
    badge: 'DIPERBARUI',
    category: 'Akun',
    summary: 'Mengunci aplikasi dengan PIN, mengganti warna aksen (Lime, Pink, Orange) beserta logo dinamis, dan reset data.',
    targetTab: 'settings',
    targetLabel: 'Buka Pengaturan',
    steps: [
      'Buka menu Pengaturan untuk menyesuaikan tampilan Mode Terang / Mode Gelap / Mengikuti Sistem.',
      'Pilih Warna Aksen favorit Anda: Lime Green, Soft Coral Pink, atau Vibrant Sunset Orange (warna aksen dan logo D dompet akan otomatis menyesuaikan tema).',
      'Pada bagian "Keamanan & PIN", aktifkan Kunci PIN untuk melindungi privasi aplikasi saat dibuka.',
      'Pada bagian "Data & Ekspor", klik "Reset Semua Data Aplikasi" jika ingin menghapus seluruh catatan dan memulai ulang dari Rp 0.',
    ],
    tips: 'Ikon tab browser (favicon) dan logo aplikasi di pojok kiri atas otomatis berubah mengikuti warna aksen tema yang Anda pilih!',
    content: `Menu Pengaturan memberikan kendali penuh atas profil akun, tema visual, keamanan PIN aplikasi, kuota AI Credits, pencadangan CSV, hingga reset seluruh data.`,
  },
  {
    id: 'tut-install',
    number: '17',
    title: 'Cara Install Aplikasi ke Layar Utama HP (PWA)',
    badge: 'TIPS HP',
    category: 'Memulai',
    summary: 'Pasang ikon Dompt di layar utama Android atau iPhone tanpa perlu download lewat toko aplikasi.',
    steps: [
      'Buka aplikasi Dompt menggunakan Google Chrome (di Android) atau Safari (di iPhone/iPad).',
      'Di Android: Ketuk ikon titik tiga di pojok kanan atas Chrome, lalu pilih "Tambahkan ke Layar Utama" atau "Install Aplikasi".',
      'Di iPhone: Ketuk tombol Share di bagian bawah Safari, lalu pilih "Add to Home Screen".',
      'Sekarang aplikasi dapat dibuka layar penuh (full-screen) dengan cepat layaknya aplikasi native!',
    ],
    tips: 'Dengan menginstall ke layar utama, akses mencatat transaksi harian dan scan struk belanja menjadi jauh lebih praktis hanya dalam 1 ketukan.',
    content: `Dompt dirancang dengan standar Progressive Web App (PWA) modern sehingga sangat ringan, hemat memori penyimpanan HP, dan responsif di layar HP, tablet, maupun desktop.`,
  },
];

