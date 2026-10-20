import { TransactionDetail } from './types';

export function formatNumberOnly(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  return abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatRupiah(amount: number, hidden = false): string {
  if (hidden) {
    return 'Rp •••••••';
  }
  const isNegative = amount < 0;
  const formattedNumber = formatNumberOnly(amount);
  return isNegative ? `-Rp${formattedNumber}` : `Rp${formattedNumber}`;
}

export function formatCompactRupiah(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '+';
  if (abs >= 1000000) {
    const val = abs / 1000000;
    return `${sign}${val % 1 === 0 ? val : val.toFixed(1)}JT`;
  }
  if (abs >= 1000) {
    const val = Math.round(abs / 1000);
    return `${sign}${val}RB`;
  }
  return `${sign}${abs}`;
}

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_NAMES_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export function formatMonthYear(date: Date = new Date()): string {
  return `${MONTH_NAMES_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatFullDateIndo(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = MONTH_NAMES_ID[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatRelativeDate(dateStr: string, baseDateStr?: string): string {
  const target = new Date(dateStr);
  const now = baseDateStr
    ? new Date(baseDateStr.includes('T') ? baseDateStr : `${baseDateStr}T12:00:00`)
    : new Date();
  
  const isToday =
    target.getDate() === now.getDate() &&
    target.getMonth() === now.getMonth() &&
    target.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    target.getDate() === yesterday.getDate() &&
    target.getMonth() === yesterday.getMonth() &&
    target.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Hari ini';
  if (isYesterday) return 'Kemarin';

  return `${target.getDate()} ${MONTH_NAMES_SHORT_ID[target.getMonth()]} ${target.getFullYear()}`;
}

export function formatTimeOnly(dateStr: string): string {
  const d = new Date(dateStr);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function exportTransactionsToCSV(transactions: TransactionDetail[]): string {
  const headers = ['ID', 'Tanggal', 'Jam', 'Tipe', 'Kategori', 'Dompet', 'Tujuan Transfer', 'Nominal (IDR)', 'Catatan'];
  
  const rows = transactions.map(t => {
    const d = new Date(t.transaction.date);
    const dateFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const timeFormatted = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const typeLabel = t.transaction.type === 'expense' ? 'Pengeluaran' : t.transaction.type === 'income' ? 'Pemasukan' : 'Transfer';
    const catName = t.category?.name || '-';
    const walletName = t.wallet.name;
    const targetWalletName = t.transferWallet?.name || '-';
    const note = (t.transaction.note || '').replace(/"/g, '""');

    return [
      t.transaction.id,
      dateFormatted,
      timeFormatted,
      typeLabel,
      `"${catName}"`,
      `"${walletName}"`,
      `"${targetWalletName}"`,
      t.transaction.amount,
      `"${note}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
