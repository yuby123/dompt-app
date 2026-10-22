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
  { id: 'cat-sedekah', name: 'Sedekah', type: 'expense', groupName: 'Kebutuhan', budgetGroup: 'kebutuhan', expenseNature: 'variable', iconKey: 'Heart', emoji: '🤲', colorValue: '#F59E0B', isDefault: true },
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
    summary: 'Urutan 4 langkah mudah mengatur Dompet, Budget 50/30/20, hingga mencatat transaksi pertama.',
    targetTab: 'wallets',
    targetLabel: 'Buka Menu Dompet',
    steps: [
      'Buka menu Dompet di navigasi bawah, klik salah satu dompet (misal BCA atau Tunai), lalu klik Edit untuk mengisi Saldo Awal Anda saat ini.',
      'Buka menu Budget dari Dashboard, lalu isi Estimasi Pemasukan Bulanan Anda (misal gaji/penghasilan bulanan).',
      'Tambahkan subkategori pengeluaran rutin di pos Kebutuhan (50%), Keinginan (30%), dan Tabungan (20%).',
      'Klik tombol (+) hijau di tengah bawah kapan saja untuk mulai mencatat pengeluaran, pemasukan, atau transfer antar dompet.',
    ],
    tips: 'Saat pertama kali login dengan akun Google atau setelah melakukan Reset Data, seluruh angka otomatis dimulai dari Rp 0 agar Anda bisa mencatat keuangan asli dari awal.',
    content: `Selamat datang di Dompt! Agar pencatatan keuangan Anda rapi dan akurat sejak hari pertama, ikuti urutan berikut:

1. Atur Saldo Awal Dompet: Masuk ke tab Dompet (ikon dompet di bawah), pilih rekening/e-wallet yang Anda miliki atau tambah dompet baru, lalu masukkan saldo riil Anda saat ini.
2. Tetapkan Estimasi Pemasukan: Masuk ke menu Budget, klik ikon pensil pada "Estimasi Pemasukan Bulanan", lalu masukkan target pemasukan Anda bulan ini.
3. Buat Pos Subkategori: Di halaman Budget, tambahkan rincian pos seperti Makan, Transportasi, Tagihan Listrik, hingga Tabungan.
4. Catat Transaksi Harian: Gunakan tombol (+) di tengah navigasi bawah atau fitur Scanner Struk AI setiap kali Anda berbelanja.`,
  },
  {
    id: 'tut-login-sync',
    number: '02',
    title: 'Login Google, Keamanan Data & Cloud Sync',
    badge: 'ESSENTIAL',
    category: 'Akun',
    summary: 'Cara kerja penyimpanan Cloud pribadi per akun Google dan keamanan privasi data Anda.',
    targetTab: 'settings',
    targetLabel: 'Buka Pengaturan Akun',
    steps: [
      'Klik tombol "Masuk" di pojok kanan atas aplikasi atau melalui menu Pengaturan.',
      'Pilih akun Google Anda melalui jendela resmi Google Sign-In.',
      'Data keuangan Anda langsung tersimpan secara terpisah dan terenkripsi di Cloud Firestore khusus untuk akun Anda.',
      'Anda dapat login dari HP maupun laptop dan data akan tersinkronisasi secara real-time.',
    ],
    tips: 'Aplikasi hanya membaca nama, email, dan foto profil publik Google Anda sebagai identitas akun. Kata sandi Google Anda 100% aman di server Google.',
    content: `Dompt mendukung mode Multi-User dengan Google Authentication:

• Tanpa Login (Mode Tamu / Demo): Data disimpan di memori browser perangkat (LocalStorage) dan menampilkan contoh simulasi agar Anda bisa mencoba fitur.
• Setelah Login Google: Anda mendapatkan ruang penyimpanan Cloud pribadi yang terisolasi. Pengguna baru otomatis dimulai dengan saldo Rp 0 (bersih tanpa data contoh).
• Privasi Terjamin: Pengguna lain tidak dapat melihat dompet, transaksi, maupun target tabungan Anda.`,
  },
  {
    id: 'tut-home',
    number: '03',
    title: 'Membaca Dashboard & Kalender Aktivitas',
    badge: 'PANDUAN',
    category: 'Home',
    summary: 'Memahami sisa budget harian, progres 50/30/20, kalender pengeluaran, dan tagihan mendatang.',
    targetTab: 'dashboard',
    targetLabel: 'Lihat Dashboard',
    steps: [
      'Kartu "Sekilas Hari Ini" menampilkan sisa jatah uang harian Anda agar pengeluaran bulanan tidak bocor.',
      'Klik ikon Gembok/Mata di kartu utama untuk menyembunyikan atau menampilkan nominal rupiah (Privasi Saldo).',
      'Lihat "Progres Pengeluaran" untuk memantau persentase pemakaian pos Kebutuhan, Keinginan, dan Tabungan.',
      'Cek "Aktivitas Kalender" untuk melihat tanggal berapa saja Anda paling sering mengeluarkan uang.',
    ],
    tips: 'Daftar "Tagihan Mendatang" di bagian bawah Dashboard otomatis muncul jika Anda memiliki saldo negatif di dompet Kredit/Paylater atau mengatur tanggal jatuh tempo di subkategori Budget.',
    content: `Dashboard dirancang sebagai pusat kendali harian Anda:

• Sekilas Hari Ini: Menghitung otomatis berapa rupiah yang aman dibelanjakan hari ini berdasarkan sisa budget bulanan dibagi sisa hari di bulan berjalan.
• Dana Darurat (Runway): Menghitung berapa bulan Anda bisa bertahan hidup dari saldo kas/tabungan likuid jika tidak ada pemasukan.
• Tagihan Mendatang: Pengingat otomatis untuk cicilan kartu kredit, paylater, maupun tagihan bulanan rutin.`,
  },
  {
    id: 'tut-dompet',
    number: '04',
    title: 'Mengelola Dompet, E-Wallet & Kartu Kredit',
    badge: 'DOMPET',
    category: 'Dompet',
    summary: 'Cara menambah rekening bank, e-wallet, verifikasi saldo fisik, dan mencatat limit kredit/paylater.',
    targetTab: 'wallets',
    targetLabel: 'Kelola Dompet',
    steps: [
      'Buka tab Dompet di navigasi bawah, lalu klik tombol (+) di pojok kanan atas untuk membuat dompet baru.',
      'Pilih tipe dompet: Bank, E-Wallet, Tunai, Investasi (RDN), Kartu Kredit, atau Paylater.',
      'Klik kartu dompet untuk melihat rincian Saldo Bebas Pakai vs Dana Cadangan (yang terikat ke Goals).',
      'Klik tombol "Verifikasi Saldo" setelah Anda mencocokkan saldo aplikasi dengan mutasi m-banking asli.',
    ],
    tips: 'Untuk Kartu Kredit atau Paylater yang sedang terpakai (utang berjalan), masukkan nilai negatif atau catat pengeluaran menggunakan dompet tersebut agar kewajiban dihitung akurat.',
    content: `Di menu Dompet & Rekening:

• Saldo Bebas Pakai vs Dicadangkan: Jika Anda menautkan Goal (misal Dana Darurat) ke dompet BCA, aplikasi akan memisahkan mana uang yang benar-benar bebas dipakai dan mana yang sedang dikunci untuk tabungan.
• Edit & Hapus Dompet: Buka detail dompet lalu klik tombol "Edit" untuk mengubah nama, tipe, warna kartu, atau memperbarui Saldo Awal.`,
  },
  {
    id: 'tut-budget',
    number: '05',
    title: 'Atur Budget 50/30/20 & Subkategori',
    badge: 'FINANSIAL',
    category: 'Budget',
    summary: 'Membagi penghasilan ke pos Kebutuhan (50%), Keinginan (30%), dan Tabungan (20%).',
    targetTab: 'budget',
    targetLabel: 'Atur Budget Sekarang',
    steps: [
      'Buka menu Budget, lalu klik ikon Edit pada kartu "Estimasi Pemasukan Bulanan" untuk mengisi penghasilan Anda.',
      'Pilih rumus alokasi otomatis (50/30/20, 60/20/20, atau 70/20/10) sesuai gaya hidup Anda.',
      'Klik tombol "+ Subkategori" pada masing-masing grup untuk merinci anggaran (contoh: Makan Rp 1.500.000, Kost Rp 1.200.000).',
      'Isi "Tanggal Jatuh Tempo" (opsional) jika subkategori tersebut adalah tagihan bulanan seperti WiFi atau Listrik.',
    ],
    tips: 'Anda bisa mengedit nominal subkategori kapan saja dengan menekan ikon pensil di samping nama subkategori.',
    content: `Metode 50/30/20 membantu Anda mengatur gaji tanpa stres:

• 50% Kebutuhan (Needs): Pengeluaran wajib seperti makan pokok, sewa tempat tinggal, listrik, kuota, dan transportasi kerja.
• 30% Keinginan (Wants): Pengeluaran gaya hidup seperti kopi, nongkrong, langganan streaming, hobi, dan belanja online.
• 20% Tabungan (Savings): Alokasi masa depan untuk dana darurat, investasi, dan pembayaran pokok utang.`,
  },
  {
    id: 'tut-transaksi-ai',
    number: '06',
    title: 'Catat Transaksi, Transfer & Paste Screenshot',
    badge: 'TRANSAKSI',
    category: 'AI & Transaksi',
    summary: 'Cara mencatat pengeluaran, pemasukan, pindah dana antar dompet, dan deteksi gambar dari clipboard.',
    targetTab: 'transactions',
    targetLabel: 'Lihat Riwayat Transaksi',
    steps: [
      'Tekan tombol (+) besar di tengah navigasi bawah untuk membuka form transaksi cepat.',
      'Pilih tipe transaksi: Pengeluaran, Pemasukan, atau Transfer (pindah saldo antar dompet).',
      'Gunakan kolom pencarian dan filter (Dompet, Tipe, Subkategori) di tab Transaksi untuk melacak pengeluaran masa lalu.',
      'Klik salah satu baris transaksi untuk melihat detail lengkap, mengubah (Ubah), atau menghapusnya (Hapus).',
    ],
    tips: 'Fitur Pintar: Jika Anda menyalin (Copy) gambar bukti transfer atau struk di perangkat Anda lalu menekan Ctrl+V / Paste di dalam aplikasi, pemindai AI akan otomatis terbuka!',
    content: `Semua transaksi yang Anda catat otomatis memperbarui:
1. Saldo dompet terkait secara real-time.
2. Sisa kuota budget harian dan progres 50/30/20 di bulan aktif.
3. Grafik analitik dan laporan arus kas bulanan.`,
  },
  {
    id: 'tut-scanner',
    number: '07',
    title: 'Scan Struk Belanja Otomatis dengan AI',
    badge: 'AI FITUR',
    category: 'AI & Transaksi',
    summary: 'Unggah foto struk minimarket, restoran, atau bukti QRIS untuk otomatis menjadi catatan transaksi.',
    targetTab: 'scanner',
    targetLabel: 'Coba Scanner Struk AI',
    steps: [
      'Klik menu "Scanner" di halaman Dashboard atau tombol "Scan Struk dengan AI" di dalam form tambah transaksi.',
      'Pilih foto struk belanjaan dari galeri HP/laptop atau ambil foto langsung.',
      'Tunggu beberapa detik hingga AI membaca nama toko/merchant, tanggal, daftar barang, dan total nominal.',
      'Periksa hasilnya, pilih dompet pembayaran, lalu klik Simpan Transaksi.',
    ],
    tips: 'Setiap pemindaian struk atau konsultasi AI menggunakan 1 AI Credit. Anda dapat melakukan Top Up AI Credits secara gratis kapan saja di menu Pengaturan.',
    content: `Tidak perlu lagi mengetik satu per satu sehabis belanja bulanan! Teknologi Vision AI di Dompt mampu mengenali struk fisik (Indomaret, Alfamart, supermarket, restoran) maupun tangkapan layar bukti pembayaran digital (QRIS, m-banking, e-wallet).`,
  },
  {
    id: 'tut-goals',
    number: '08',
    title: 'Target Tabungan (Goals) & Kunci Dana Darurat',
    badge: 'GOALS',
    category: 'Kekayaan',
    summary: 'Wujudkan impian finansial dengan progres terukur, tambah/tarik tabungan, dan fitur Lock.',
    targetTab: 'goals',
    targetLabel: 'Buka Menu Goals',
    steps: [
      'Buka menu Goals dari Dashboard, lalu klik tombol (+) di pojok kanan atas.',
      'Masukkan nama target (misal: Dana Darurat, Liburan, Beli Laptop), pilih emoji, target nominal, dan dompet tempat menyimpan uangnya.',
      'Klik kartu Goal untuk membuka rincian, lalu gunakan kolom "Update Saldo Tabungan" untuk menambah (+ Tambah Saldo) atau menarik (- Tarik Saldo).',
      'Aktifkan tombol "Lock" pada Dana Darurat agar saldo tabungan terkunci dan tidak bisa ditarik sembarangan.',
    ],
    tips: 'Centang opsi "Dana Darurat" saat membuat Goal agar sistem menandainya dengan perisai khusus.',
    content: `Fitur Goals membantu Anda memisahkan uang tabungan dari uang jajan meskipun berada di rekening bank yang sama. Sistem juga otomatis menghitung berapa rupiah yang perlu Anda sisihkan setiap bulan hingga tanggal target tercapai.`,
  },
  {
    id: 'tut-assets-wealth',
    number: '09',
    title: 'Aset, Utang & Portofolio Investasi',
    badge: 'KEKAYAAN',
    category: 'Kekayaan',
    summary: 'Pantau Total Kekayaan Bersih (Net Worth), catat pelunasan utang, dan kelola hasil investasi.',
    targetTab: 'assets',
    targetLabel: 'Buka Menu Aset',
    steps: [
      'Di menu Aset: Catat Aset Likuid (deposito, tabungan emas cair) dan Aset Tetap (kendaraan, properti, gadget) untuk melihat Total Kekayaan Bersih & Level Finansial Anda.',
      'Di menu Utang: Catat pinjaman atau cicilan berjalan beserta tanggal jatuh temponya, lalu klik "Tandai Lunas" saat sudah dibayar.',
      'Di menu Investasi: Tambahkan portofolio Saham, Reksadana, Emas, atau Crypto beserta persentase imbal hasilnya (return).',
    ],
    tips: 'Level Kekayaan Anda di menu Aset akan naik secara otomatis dari "Mulai Mencatat" hingga "Merdeka Finansial" seiring bertambahnya saldo dompet dan nilai aset Anda.',
    content: `Keuangan yang sehat bukan hanya soal mencatat pengeluaran harian, tetapi juga memastikan nilai Aset dan Investasi Anda bertumbuh lebih besar daripada total kewajiban Utang.`,
  },
  {
    id: 'tut-ai-reports',
    number: '10',
    title: 'AI Financial Advisor & Ekspor Laporan CSV',
    badge: 'ANALITIK',
    category: 'AI & Transaksi',
    summary: 'Konsultasi keuangan interaktif dengan AI dan unduh laporan keuangan bulanan ke Excel/CSV.',
    targetTab: 'ai-advisor',
    targetLabel: 'Tanya AI Advisor',
    steps: [
      'Buka menu "AI Advisor" dari Dashboard untuk berdiskusi langsung mengenai kondisi keuangan Anda.',
      'Gunakan tombol pertanyaan cepat atau ketik pertanyaan spesifik (misal: "Bagaimana cara melunasi utang saya lebih cepat?" atau "Evaluasi budget saya bulan ini").',
      'Buka menu "Laporan" untuk melihat rasio Tabungan (Savings Rate), distribusi pengeluaran per kategori, dan klik "Unduh CSV" untuk membuka data di Excel/Google Sheets.',
    ],
    tips: 'AI Advisor menganalisis konteks saldo dompet, pemasukan, pengeluaran, dan budget Anda secara langsung sehingga sarannya dipersonalisasi khusus untuk Anda.',
    content: `Gunakan kombinasi AI Advisor dan menu Laporan setiap akhir bulan untuk melakukan evaluasi keuangan (Monthly Financial Review) agar tabungan bulan berikutnya semakin optimal.`,
  },
  {
    id: 'tut-security-reset',
    number: '11',
    title: 'Kunci PIN, Tema Tampilan & Reset Data ke 0',
    badge: 'PENGATURAN',
    category: 'Akun',
    summary: 'Cara mengunci aplikasi dengan PIN 4 digit, mengganti mode gelap/terang, dan mereset seluruh data.',
    targetTab: 'settings',
    targetLabel: 'Buka Pengaturan',
    steps: [
      'Buka tab Pengaturan (ikon profil di pojok kanan bawah).',
      'Pilih Mode Terang / Mode Gelap dan Warna Aksen (Lime Green atau Soft Coral Pink) sesuai selera Anda.',
      'Pada kartu "Keamanan & PIN", klik "Aktifkan Kunci PIN" dan masukkan 4 digit angka untuk melindungi privasi aplikasi.',
      'Pada kartu "Data & Ekspor", klik "Reset Semua Data Aplikasi" jika Anda ingin menghapus seluruh catatan dan memulai ulang semua saldo dari Rp 0.',
    ],
    tips: 'Jika Anda sedang login dengan akun Google, fitur Reset Data akan membersihkan data di Cloud Firestore Anda sekaligus mengembalikan semua saldo dompet ke Rp 0.',
    content: `Menu Pengaturan memberikan kendali penuh atas profil, mata uang, keamanan PIN aplikasi, kuota AI Credits, pencadangan CSV, hingga penghapusan/reset seluruh data akun.`,
  },
  {
    id: 'tut-install',
    number: '12',
    title: 'Cara Install Aplikasi ke Layar Utama HP (PWA)',
    badge: 'TIPS HP',
    category: 'Memulai',
    summary: 'Pasang ikon Dompt di layar utama Android atau iPhone tanpa perlu download lewat toko aplikasi.',
    steps: [
      'Buka aplikasi Dompt menggunakan Google Chrome (di Android) atau Safari (di iPhone/iPad).',
      'Di Android: Ketuk ikon titik tiga di pojok kanan atas Chrome, lalu pilih "Tambahkan ke Layar Utama" (Add to Home Screen) atau "Install Aplikasi".',
      'Di iPhone: Ketuk tombol Share (ikon kotak dengan panah ke atas) di bagian bawah Safari, lalu pilih "Add to Home Screen".',
      'Sekarang aplikasi dapat dibuka layar penuh (full-screen) layaknya aplikasi native!',
    ],
    tips: 'Dengan menginstall ke layar utama, akses mencatat transaksi harian menjadi jauh lebih cepat hanya dalam 1 ketukan.',
    content: `Dompt dirancang dengan standar Progressive Web App (PWA) modern sehingga sangat ringan, hemat memori penyimpanan HP, dan memiliki tampilan responsif baik di layar potret maupun lanskap.`,
  },
  {
    id: 'tut-subscriptions',
    number: '13',
    title: 'Langganan & Transaksi Berulang Otomatis',
    badge: 'BARU',
    category: 'AI & Transaksi',
    summary: 'Kelola tagihan bulanan (Netflix, Spotify, WiFi, Listrik, Kost) dan jadwal Gaji dengan pencatatan 1 klik.',
    targetTab: 'subscriptions',
    targetLabel: 'Buka Menu Langganan',
    steps: [
      'Buka menu "Langganan" dari Menu Utama di Dashboard, lalu klik tombol (+) di pojok kanan atas.',
      'Pilih template cepat (Netflix, Spotify, WiFi, Listrik PLN, Kost, Gaji) atau ketik manual beserta tanggal jatuh temponya (1-31).',
      'Pantau total beban langganan per bulan dan estimasi biaya per tahun agar tidak ada biaya tersembunyi.',
      'Klik tombol "Bayar & Catat" (atau "Terima & Catat" untuk gaji) agar transaksi langsung tercatat ke dompet Anda bulan ini.',
    ],
    tips: 'Anda dapat menjeda (Jeda) langganan yang sedang tidak aktif tanpa harus menghapusnya dari daftar.',
    content: `Fitur Langganan & Transaksi Berulang mencegah Anda lupa membayar tagihan penting sekaligus memperlihatkan berapa total uang yang habis untuk layanan berlangganan setiap tahunnya.`,
  },
  {
    id: 'tut-health-score',
    number: '14',
    title: 'Skor Kesehatan Keuangan (0–100)',
    badge: 'BARU',
    category: 'Kekayaan',
    summary: 'Evaluasi menyeluruh kesehatan finansial Anda dari 4 pilar: Rasio Tabungan, Dana Darurat, Disiplin Budget, dan Rasio Utang.',
    targetTab: 'health-score',
    targetLabel: 'Lihat Skor Sehat Saya',
    steps: [
      'Buka menu "Skor Sehat" dari Menu Utama di Dashboard.',
      'Lihat skor total Anda (0–100) beserta status kesehatan keuangan Anda saat ini.',
      'Periksa nilai pada masing-masing dari 4 Pilar Finansial untuk mengetahui area mana yang sudah kuat dan mana yang perlu ditingkatkan.',
      'Klik tombol tindakan di setiap pilar untuk langsung memperbaiki alokasi budget, menambah dana darurat, atau berkonsultasi dengan AI Advisor.',
    ],
    tips: 'Targetkan Skor Kesehatan Keuangan minimal 70/100 (Sehat & Stabil) dengan menyisihkan minimal 20% pemasukan dan menjaga dana darurat 3-6 bulan.',
    content: `Skor Kesehatan Keuangan dihitung secara objektif dari data riil Anda:
• Rasio Menabung (Maks 30 Poin)
• Ketahanan Dana Darurat (Maks 25 Poin)
• Kedisiplinan Budget Bulanan (Maks 25 Poin)
• Kesehatan Beban Utang & Kredit (Maks 20 Poin)`,
  },
];
