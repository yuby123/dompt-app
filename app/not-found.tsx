import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F7FB] dark:bg-[#08090F] text-slate-900 dark:text-slate-100 p-6 text-center">
      <div className="max-w-sm space-y-4">
        <div className="text-4xl font-extrabold text-teal-600 dark:text-teal-400">404</div>
        <h1 className="text-lg font-bold">Halaman Tidak Ditemukan</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Maaf, halaman yang Anda cari tidak tersedia.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
