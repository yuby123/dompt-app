import type {Metadata, Viewport} from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#D4F826',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'FadDompet — Dompet & Keuangan Pribadi',
  description: 'Offline-first personal finance tracker. Kelola pemasukan, pengeluaran, dompet, dan anggaran keuangan pribadi dengan cepat, aman, dan tanpa iklan.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/faddompet-lightmode.svg',
    apple: '/icons/app_icon.png',
  },
  openGraph: {
    title: 'FadDompet — Dompet & Keuangan Pribadi',
    description: 'Offline-first personal finance tracker. Kelola pemasukan, pengeluaran, dompet, dan anggaran.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FadDompet — Dompet & Keuangan Pribadi',
    description: 'Offline-first personal finance tracker. Kelola pemasukan, pengeluaran, dompet, dan anggaran.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
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
      <body suppressHydrationWarning className="h-full bg-[#F6F7F9] dark:bg-[#0E1015] text-[#111827] dark:text-[#F9FAFB] transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
