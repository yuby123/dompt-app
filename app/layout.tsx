import type {Metadata, Viewport} from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#090A10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Dompt. — Dompet & Keuangan Pribadi',
  description: 'Offline-first personal finance tracker. Kelola pemasukan, pengeluaran, dompet, dan anggaran keuangan pribadi dengan cepat, aman, dan tanpa iklan.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/dompt-logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/icons/dompt-logo.svg',
  },
  openGraph: {
    title: 'Dompt. — Dompet & Keuangan Pribadi',
    description: 'Offline-first personal finance tracker. Kelola pemasukan, pengeluaran, dompet, dan anggaran.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dompt. — Dompet & Keuangan Pribadi',
    description: 'Offline-first personal finance tracker. Kelola pemasukan, pengeluaran, dompet, dan anggaran.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var raw = localStorage.getItem('budggt_settings');
                var isDark = false;
                var accent = 'lime';
                if (raw) {
                  var s = JSON.parse(raw);
                  if (s.themeMode === 'dark' || (s.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    isDark = true;
                  }
                  if (s.accentColor) accent = s.accentColor;
                } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  isDark = true;
                }
                var root = document.documentElement;
                if (isDark) {
                  root.classList.add('dark');
                  root.style.colorScheme = 'dark';
                } else {
                  root.classList.remove('dark');
                  root.style.colorScheme = 'light';
                }
                if (accent) {
                  root.setAttribute('data-accent', accent);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${plusJakartaSans.className} h-full bg-[#F6F7FB] dark:bg-[#08090F] text-[#0F172A] dark:text-[#F8FAFC] transition-colors duration-200`}
      >
        {children}
      </body>
    </html>
  );
}
