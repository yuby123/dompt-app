'use client';

import React from 'react';
import Image from 'next/image';
import {
  Landmark,
  Smartphone,
  Banknote,
  TrendingUp,
  CreditCard,
  Clock,
  PiggyBank,
  Wallet as WalletIcon,
} from 'lucide-react';
import { WalletType } from '@/lib/types';

export type WalletBrandId =
  | 'bca'
  | 'bri'
  | 'mandiri'
  | 'bni'
  | 'btn'
  | 'bsi'
  | 'cimb'
  | 'permata'
  | 'danamon'
  | 'ocbc'
  | 'maybank'
  | 'mega'
  | 'panin'
  | 'jago'
  | 'jenius'
  | 'seabank'
  | 'blu'
  | 'neobank'
  | 'superbank'
  | 'allo'
  | 'gopay'
  | 'ovo'
  | 'dana'
  | 'shopeepay'
  | 'linkaja'
  | 'isaku'
  | 'doku';

export type WalletBrandCategory =
  | 'Bank Konvensional & Syariah'
  | 'Bank Digital'
  | 'E-Wallet (Dompet Digital)';

export interface WalletBrandDefinition {
  id: WalletBrandId;
  name: string;
  shortName: string;
  category: WalletBrandCategory;
  walletType: WalletType;
  primaryColor: string;
  secondaryColor: string;
  cardGradient: string;
  badgeText: string;
  keywords: string[];
  logo: string;
}

export const WALLET_BRANDS: WalletBrandDefinition[] = [
  // 1. Bank Konvensional & Syariah
  {
    id: 'bca',
    name: 'BCA',
    shortName: 'BCA',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#0060AF',
    secondaryColor: '#003B73',
    cardGradient: 'from-[#0060AF] via-[#004A8F] to-[#003366]',
    badgeText: 'Bank Central Asia',
    keywords: ['bca', 'bank central asia', 'tahapan bca', 'xpresi bca', 'mybca', 'klikbca', 'flazz'],
    logo: '/brands/bca.svg',
  },
  {
    id: 'mandiri',
    name: 'Bank Mandiri',
    shortName: 'Mandiri',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#003A70',
    secondaryColor: '#FFB700',
    cardGradient: 'from-[#003A70] via-[#002F5F] to-[#001F42]',
    badgeText: 'Livin’ by Mandiri',
    keywords: ['mandiri', 'bank mandiri', 'livin', 'e-money mandiri', 'emoney mandiri'],
    logo: '/brands/mandiri.svg',
  },
  {
    id: 'bri',
    name: 'BRI',
    shortName: 'BRI',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#0857C3',
    secondaryColor: '#F37021',
    cardGradient: 'from-[#0857C3] via-[#004380] to-[#002E5B]',
    badgeText: 'Bank Rakyat Indonesia',
    keywords: ['bri', 'bank rakyat indonesia', 'britama', 'simpedes', 'brimo', 'brizzi'],
    logo: '/brands/bri.svg',
  },
  {
    id: 'bni',
    name: 'BNI',
    shortName: 'BNI',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#005E6A',
    secondaryColor: '#F15A23',
    cardGradient: 'from-[#005E6A] via-[#004B56] to-[#00353D]',
    badgeText: 'Bank Negara Indonesia',
    keywords: ['bni', 'bank negara indonesia', 'taplus', 'wondr', 'tapcash'],
    logo: '/brands/bni.svg',
  },
  {
    id: 'bsi',
    name: 'BSI',
    shortName: 'BSI',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#00A39D',
    secondaryColor: '#F8AD3C',
    cardGradient: 'from-[#00A39D] via-[#008782] to-[#006663]',
    badgeText: 'Bank Syariah Indonesia',
    keywords: ['bsi', 'bank syariah indonesia', 'byond', 'wadiah'],
    logo: '/brands/bsi.svg',
  },
  {
    id: 'btn',
    name: 'BTN',
    shortName: 'BTN',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#015BFD',
    secondaryColor: '#E31E24',
    cardGradient: 'from-[#015BFD] via-[#003DB3] to-[#002673]',
    badgeText: 'Bank Tabungan Negara',
    keywords: ['btn', 'bank tabungan negara', 'batara', 'bale by btn'],
    logo: '/brands/btn.svg',
  },
  {
    id: 'cimb',
    name: 'CIMB Niaga',
    shortName: 'CIMB Niaga',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#790008',
    secondaryColor: '#ED3024',
    cardGradient: 'from-[#A3000B] via-[#790008] to-[#4A0005]',
    badgeText: 'OCTO by CIMB Niaga',
    keywords: ['cimb', 'cimb niaga', 'octo', 'octo mobile', 'rekening ponsel'],
    logo: '/brands/cimb.svg',
  },
  {
    id: 'permata',
    name: 'PermataBank',
    shortName: 'Permata',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#0064FF',
    secondaryColor: '#030303',
    cardGradient: 'from-[#0064FF] via-[#004CC4] to-[#003385]',
    badgeText: 'Permata ME',
    keywords: ['permata', 'permatabank', 'bank permata', 'permatame', 'permata me'],
    logo: '/brands/permata.svg',
  },
  {
    id: 'danamon',
    name: 'Bank Danamon',
    shortName: 'Danamon',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#EF9826',
    secondaryColor: '#046148',
    cardGradient: 'from-[#046148] via-[#034B37] to-[#023326]',
    badgeText: 'D-Bank PRO Danamon',
    keywords: ['danamon', 'bank danamon', 'd-bank', 'dbank'],
    logo: '/brands/danamon.svg',
  },
  {
    id: 'ocbc',
    name: 'OCBC',
    shortName: 'OCBC',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#D10A10',
    secondaryColor: '#990509',
    cardGradient: 'from-[#D10A10] via-[#A8070C] to-[#730408]',
    badgeText: 'OCBC Indonesia',
    keywords: ['ocbc', 'ocbc nisp', 'nyala ocbc'],
    logo: '/brands/ocbc.svg',
  },
  {
    id: 'maybank',
    name: 'Maybank',
    shortName: 'Maybank',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#FFC600',
    secondaryColor: '#231F20',
    cardGradient: 'from-[#231F20] via-[#1A1718] to-[#0F0D0E]',
    badgeText: 'M2U Maybank',
    keywords: ['maybank', 'm2u'],
    logo: '/brands/maybank.svg',
  },
  {
    id: 'mega',
    name: 'Bank Mega',
    shortName: 'Bank Mega',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#F37022',
    secondaryColor: '#FFCA08',
    cardGradient: 'from-[#F37022] via-[#D95B14] to-[#A6420A]',
    badgeText: 'M-Smile Bank Mega',
    keywords: ['bank mega', 'm-smile', 'mega syariah'],
    logo: '/brands/mega.svg',
  },
  {
    id: 'panin',
    name: 'PaninBank',
    shortName: 'Panin',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#007DC5',
    secondaryColor: '#D71920',
    cardGradient: 'from-[#007DC5] via-[#006199] to-[#00446B]',
    badgeText: 'PaninBank Indonesia',
    keywords: ['panin', 'paninbank', 'bank panin'],
    logo: '/brands/panin.svg',
  },

  // 2. Bank Digital
  {
    id: 'seabank',
    name: 'SeaBank',
    shortName: 'SeaBank',
    category: 'Bank Digital',
    walletType: 'bank',
    primaryColor: '#EA5F00',
    secondaryColor: '#2673DD',
    cardGradient: 'from-[#FF6D00] via-[#EA5F00] to-[#C24700]',
    badgeText: 'SeaBank Indonesia',
    keywords: ['seabank', 'sea bank'],
    logo: '/brands/seabank.svg',
  },
  {
    id: 'jago',
    name: 'Bank Jago',
    shortName: 'Bank Jago',
    category: 'Bank Digital',
    walletType: 'bank',
    primaryColor: '#FDAF27',
    secondaryColor: '#5C2D91',
    cardGradient: 'from-[#FDAF27] via-[#F59E0B] to-[#D97706]',
    badgeText: 'Kantong Bank Jago',
    keywords: ['jago', 'bank jago', 'kantong jago', 'jago syariah'],
    logo: '/brands/jago.svg',
  },
  {
    id: 'blu',
    name: 'blu by BCA Digital',
    shortName: 'blu BCA',
    category: 'Bank Digital',
    walletType: 'bank',
    primaryColor: '#00B5CC',
    secondaryColor: '#0060AF',
    cardGradient: 'from-[#00B5CC] via-[#0095B6] to-[#0060AF]',
    badgeText: 'BCA Digital',
    keywords: ['blu', 'bca digital', 'blusaving', 'bluaccount', 'blu bca'],
    logo: '/brands/blu.svg',
  },
  {
    id: 'jenius',
    name: 'Jenius',
    shortName: 'Jenius',
    category: 'Bank Digital',
    walletType: 'bank',
    primaryColor: '#00A4DE',
    secondaryColor: '#0077B5',
    cardGradient: 'from-[#00A4DE] via-[#0284C7] to-[#0369A1]',
    badgeText: 'Jenius SMBC Indonesia',
    keywords: ['jenius', 'btpn', 'smbc', 'flexi saver', 'dream saver', 'maxi saver'],
    logo: '/brands/jenius.svg',
  },
  {
    id: 'neobank',
    name: 'NeoBank',
    shortName: 'NeoBank',
    category: 'Bank Digital',
    walletType: 'bank',
    primaryColor: '#FFBE00',
    secondaryColor: '#111111',
    cardGradient: 'from-[#262626] via-[#171717] to-[#0A0A0A]',
    badgeText: 'Bank Neo Commerce',
    keywords: ['neobank', 'neo bank', 'bank neo', 'bnc', 'neo now'],
    logo: '/brands/neobank.svg',
  },
  {
    id: 'superbank',
    name: 'Superbank',
    shortName: 'Superbank',
    category: 'Bank Digital',
    walletType: 'bank',
    primaryColor: '#012A31',
    secondaryColor: '#AFEE01',
    cardGradient: 'from-[#013D47] via-[#012A31] to-[#011B20]',
    badgeText: 'Superbank Indonesia',
    keywords: ['superbank', 'super bank', 'celengan by superbank', 'saku by superbank'],
    logo: '/brands/superbank.svg',
  },
  {
    id: 'allo',
    name: 'Allo Bank',
    shortName: 'Allo Bank',
    category: 'Bank Digital',
    walletType: 'bank',
    primaryColor: '#FFBC25',
    secondaryColor: '#282828',
    cardGradient: 'from-[#282828] via-[#1C1C1C] to-[#111111]',
    badgeText: 'Allo Prime / Allo Pay',
    keywords: ['allo', 'allo bank', 'allobank', 'allo prime', 'allo pay'],
    logo: '/brands/allo.svg',
  },

  // 3. E-Wallet (Dompet Digital)
  {
    id: 'gopay',
    name: 'GoPay',
    shortName: 'GoPay',
    category: 'E-Wallet (Dompet Digital)',
    walletType: 'ewallet',
    primaryColor: '#00AED6',
    secondaryColor: '#0088AA',
    cardGradient: 'from-[#00AED6] via-[#0093B8] to-[#00718F]',
    badgeText: 'Dompet Digital GoPay',
    keywords: ['gopay', 'go-pay', 'gojek'],
    logo: '/brands/gopay.svg',
  },
  {
    id: 'ovo',
    name: 'OVO',
    shortName: 'OVO',
    category: 'E-Wallet (Dompet Digital)',
    walletType: 'ewallet',
    primaryColor: '#5827D4',
    secondaryColor: '#362270',
    cardGradient: 'from-[#5827D4] via-[#4C3494] to-[#311F66]',
    badgeText: 'OVO Cash & Points',
    keywords: ['ovo', 'ovo cash'],
    logo: '/brands/ovo.svg',
  },
  {
    id: 'dana',
    name: 'DANA',
    shortName: 'DANA',
    category: 'E-Wallet (Dompet Digital)',
    walletType: 'ewallet',
    primaryColor: '#008CEB',
    secondaryColor: '#0B6EC4',
    cardGradient: 'from-[#008CEB] via-[#0E76C7] to-[#095696]',
    badgeText: 'Dompet Digital DANA',
    keywords: ['dana', 'dompet dana', 'saldo dana'],
    logo: '/brands/dana.svg',
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    shortName: 'ShopeePay',
    category: 'E-Wallet (Dompet Digital)',
    walletType: 'ewallet',
    primaryColor: '#E8451E',
    secondaryColor: '#D03B1D',
    cardGradient: 'from-[#FF5722] via-[#E8451E] to-[#C6361B]',
    badgeText: 'ShopeePay Indonesia',
    keywords: ['shopeepay', 'shopee pay', 'spay', 'shopee'],
    logo: '/brands/shopeepay.svg',
  },
  {
    id: 'linkaja',
    name: 'LinkAja',
    shortName: 'LinkAja',
    category: 'E-Wallet (Dompet Digital)',
    walletType: 'ewallet',
    primaryColor: '#E82529',
    secondaryColor: '#B81419',
    cardGradient: 'from-[#E82529] via-[#C8191E] to-[#991115]',
    badgeText: 'LinkAja Syariah & Reguler',
    keywords: ['linkaja', 'link aja'],
    logo: '/brands/linkaja.svg',
  },
  {
    id: 'isaku',
    name: 'i.Saku',
    shortName: 'i.Saku',
    category: 'E-Wallet (Dompet Digital)',
    walletType: 'ewallet',
    primaryColor: '#0072BC',
    secondaryColor: '#E31E24',
    cardGradient: 'from-[#0072BC] via-[#005B99] to-[#004273]',
    badgeText: 'Dompet Digital Indomaret',
    keywords: ['i.saku', 'isaku', 'i saku', 'i-saku', 'indomaret'],
    logo: '/brands/isaku.svg',
  },
  {
    id: 'doku',
    name: 'DOKU',
    shortName: 'DOKU',
    category: 'E-Wallet (Dompet Digital)',
    walletType: 'ewallet',
    primaryColor: '#E2261D',
    secondaryColor: '#B0160F',
    cardGradient: 'from-[#E2261D] via-[#C21B13] to-[#8F110B]',
    badgeText: 'DOKU e-Wallet',
    keywords: ['doku', 'doku wallet'],
    logo: '/brands/doku.svg',
  },
];

export const WALLET_BRAND_CATEGORIES: WalletBrandCategory[] = [
  'Bank Konvensional & Syariah',
  'Bank Digital',
  'E-Wallet (Dompet Digital)',
];

/**
 * Detects if a wallet corresponds to one of the supported Indonesian Banks / E-Wallets.
 * Checks explicit `brand:<id>` in `icon`, or matches `name` against brand keywords.
 */
export function detectWalletBrand(
  name?: string,
  icon?: string
): WalletBrandDefinition | null {
  if (icon && icon.startsWith('brand:')) {
    const brandId = icon.replace('brand:', '').trim().toLowerCase();
    const matchedByIcon = WALLET_BRANDS.find((b) => b.id === brandId);
    if (matchedByIcon) return matchedByIcon;
  }

  if (!name) return null;
  const normalized = name.trim().toLowerCase();

  // Check blu by BCA Digital before BCA so "blu by BCA Digital" or "blu BCA" matches blu, not BCA
  const orderedBrands = [
    ...WALLET_BRANDS.filter((b) => b.id === 'blu'),
    ...WALLET_BRANDS.filter((b) => b.id !== 'blu'),
  ];

  for (const brand of orderedBrands) {
    if (
      brand.id === 'dana' &&
      /\bdana\s+(darurat|cadangan|pensiun|pendidikan|tunai|usaha|nikah|liburan|operasional|sosial|kesehatan|investasi|tabungan|kas|siaga|talangan)\b/i.test(
        normalized
      )
    ) {
      continue;
    }
    for (const kw of brand.keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\b|\\s|[-_()])${escaped}($|\\b|\\s|[-_()])`, 'i');
      if (regex.test(normalized) || normalized === kw) {
        return brand;
      }
    }
  }

  return null;
}

interface WalletBrandLogoProps {
  brandId?: WalletBrandId | null;
  walletName?: string;
  walletType?: WalletType | string;
  walletIcon?: string;
  walletColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Square/emblem-shaped SVGs need slightly more vertical/uniform padding than wide wordmark SVGs
const SQUARE_OR_TALL_BRANDS = new Set<WalletBrandId>([
  'neobank',
  'superbank',
  'allo',
  'ovo',
  'linkaja',
  'isaku',
  'doku',
  'cimb',
  'ocbc',
  'maybank',
  'mega',
  'panin',
  'bsi',
  'btn',
  'bri',
]);

/**
 * Renders the authentic official SVG logo for Indonesian Banks & E-Wallets
 * on a crisp white badge container for true-to-brand fidelity.
 */
export function WalletBrandLogo({
  brandId,
  walletName,
  walletType = 'bank',
  walletIcon,
  walletColor,
  size = 'md',
  className = '',
}: WalletBrandLogoProps) {
  const detectedBrand =
    (brandId ? WALLET_BRANDS.find((b) => b.id === brandId) : null) ||
    detectWalletBrand(walletName, walletIcon);

  if (!detectedBrand) {
    const fallbackDims =
      size === 'sm'
        ? 'w-10 h-9 rounded-xl'
        : size === 'lg'
        ? 'w-14 h-12 rounded-2xl'
        : 'w-13 h-11 rounded-2xl';

    const FallbackIcon =
      walletType === 'ewallet'
        ? Smartphone
        : walletType === 'cash'
        ? Banknote
        : walletType === 'investment'
        ? TrendingUp
        : walletType === 'credit'
        ? CreditCard
        : walletType === 'paylater'
        ? Clock
        : walletType === 'savings'
        ? PiggyBank
        : walletType === 'bank'
        ? Landmark
        : WalletIcon;

    const iconSize = size === 'sm' ? 17 : size === 'lg' ? 24 : 20;

    return (
      <div
        className={`${fallbackDims} flex items-center justify-center text-white shadow-xs shrink-0 border border-white/15 ${className}`}
        style={{ backgroundColor: walletColor || '#312E81' }}
      >
        <FallbackIcon size={iconSize} strokeWidth={2.2} />
      </div>
    );
  }

  const isSquareOrTall = SQUARE_OR_TALL_BRANDS.has(detectedBrand.id);

  const badgeDims =
    size === 'sm'
      ? 'w-11 h-9 rounded-xl'
      : size === 'lg'
      ? 'w-16 h-12 rounded-2xl'
      : 'w-14 h-11 rounded-2xl';

  const padClass = isSquareOrTall
    ? size === 'sm'
      ? 'p-1.5'
      : 'p-1.5'
    : size === 'sm'
    ? 'px-1.5 py-1.5'
    : 'px-2 py-1.5';

  return (
    <div
      className={`${badgeDims} ${padClass} relative overflow-hidden bg-white flex items-center justify-center shadow-xs shrink-0 border border-slate-200/90 dark:border-white/20 select-none ${className}`}
      title={detectedBrand.name}
    >
      <Image
        src={detectedBrand.logo}
        alt={detectedBrand.name}
        width={120}
        height={60}
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
}
