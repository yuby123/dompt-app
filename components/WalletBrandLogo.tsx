'use client';

import React from 'react';
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
  | 'jago'
  | 'jenius'
  | 'seabank'
  | 'blu'
  | 'neobank'
  | 'gopay'
  | 'ovo'
  | 'dana'
  | 'shopeepay'
  | 'linkaja'
  | 'isaku';

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
}

export const WALLET_BRANDS: WalletBrandDefinition[] = [
  // 1. Bank Konvensional & Syariah
  {
    id: 'bca',
    name: 'BCA',
    shortName: 'BCA',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#005BAA',
    secondaryColor: '#003B73',
    cardGradient: 'from-[#005BAA] via-[#004A8F] to-[#003366]',
    badgeText: 'Bank Central Asia',
    keywords: ['bca', 'bank central asia', 'tahapan bca', 'xpresi bca', 'mybca'],
  },
  {
    id: 'bri',
    name: 'BRI',
    shortName: 'BRI',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#00529C',
    secondaryColor: '#F37021',
    cardGradient: 'from-[#00529C] via-[#004380] to-[#002E5B]',
    badgeText: 'Bank Rakyat Indonesia',
    keywords: ['bri', 'bank rakyat indonesia', 'britama', 'simpedes', 'brimo'],
  },
  {
    id: 'mandiri',
    name: 'Bank Mandiri',
    shortName: 'mandiri',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#003D79',
    secondaryColor: '#FFB700',
    cardGradient: 'from-[#003D79] via-[#002F5F] to-[#001F42]',
    badgeText: 'Livin’ by Mandiri',
    keywords: ['mandiri', 'bank mandiri', 'livin'],
  },
  {
    id: 'bni',
    name: 'BNI',
    shortName: 'BNI',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#006677',
    secondaryColor: '#F15A22',
    cardGradient: 'from-[#006677] via-[#005260] to-[#003B46]',
    badgeText: 'Bank Negara Indonesia',
    keywords: ['bni', 'bank negara indonesia', 'taplus', 'wondr'],
  },
  {
    id: 'btn',
    name: 'BTN',
    shortName: 'BTN',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#003399',
    secondaryColor: '#E31E24',
    cardGradient: 'from-[#003399] via-[#00287A] to-[#001B54]',
    badgeText: 'Bank Tabungan Negara',
    keywords: ['btn', 'bank tabungan negara', 'batara'],
  },
  {
    id: 'bsi',
    name: 'BSI',
    shortName: 'BSI',
    category: 'Bank Konvensional & Syariah',
    walletType: 'bank',
    primaryColor: '#00A39D',
    secondaryColor: '#F7A600',
    cardGradient: 'from-[#00A39D] via-[#008782] to-[#006663]',
    badgeText: 'Bank Syariah Indonesia',
    keywords: ['bsi', 'bank syariah indonesia', 'byond', 'wadiah'],
  },

  // 2. Bank Digital
  {
    id: 'jago',
    name: 'Bank Jago',
    shortName: 'Jago',
    category: 'Bank Digital',
    walletType: 'bank',
    primaryColor: '#FFAD00',
    secondaryColor: '#5C2D91',
    cardGradient: 'from-[#FFAD00] via-[#F59E0B] to-[#D97706]',
    badgeText: 'Kantong Bank Jago',
    keywords: ['jago', 'bank jago', 'kantong jago', 'jago syariah'],
  },
  {
    id: 'jenius',
    name: 'Jenius',
    shortName: 'Jenius',
    category: 'Bank Digital',
    walletType: 'bank',
    primaryColor: '#00A4E4',
    secondaryColor: '#0077B5',
    cardGradient: 'from-[#00A4E4] via-[#0284C7] to-[#0369A1]',
    badgeText: 'Jenius SMBC / BTPN',
    keywords: ['jenius', 'btpn', 'flexi saver', 'dream saver', 'maxi saver'],
  },
  {
    id: 'seabank',
    name: 'SeaBank',
    shortName: 'SeaBank',
    category: 'Bank Digital',
    walletType: 'bank',
    primaryColor: '#FF5722',
    secondaryColor: '#E64A19',
    cardGradient: 'from-[#FF6D00] via-[#FF5722] to-[#D84315]',
    badgeText: 'SeaBank Indonesia',
    keywords: ['seabank', 'sea bank'],
  },
  {
    id: 'blu',
    name: 'blu by BCA Digital',
    shortName: 'blu',
    category: 'Bank Digital',
    walletType: 'bank',
    primaryColor: '#00B5CC',
    secondaryColor: '#005BAA',
    cardGradient: 'from-[#00B5CC] via-[#0095B6] to-[#005BAA]',
    badgeText: 'BCA Digital',
    keywords: ['blu', 'bca digital', 'blusaving', 'bluaccount'],
  },
  {
    id: 'neobank',
    name: 'NeoBank',
    shortName: 'neobank',
    category: 'Bank Digital',
    walletType: 'bank',
    primaryColor: '#FFD400',
    secondaryColor: '#111111',
    cardGradient: 'from-[#262626] via-[#171717] to-[#0A0A0A]',
    badgeText: 'Bank Neo Commerce',
    keywords: ['neobank', 'neo bank', 'bank neo', 'bnc', 'neo now'],
  },

  // 3. E-Wallet (Dompet Digital)
  {
    id: 'gopay',
    name: 'GoPay',
    shortName: 'gopay',
    category: 'E-Wallet (Dompet Digital)',
    walletType: 'ewallet',
    primaryColor: '#00AED6',
    secondaryColor: '#0088AA',
    cardGradient: 'from-[#00AED6] via-[#0093B8] to-[#00718F]',
    badgeText: 'Dompet Digital GoPay',
    keywords: ['gopay', 'go-pay', 'gojek'],
  },
  {
    id: 'ovo',
    name: 'OVO',
    shortName: 'OVO',
    category: 'E-Wallet (Dompet Digital)',
    walletType: 'ewallet',
    primaryColor: '#4C3494',
    secondaryColor: '#362270',
    cardGradient: 'from-[#5B3EB0] via-[#4C3494] to-[#311F66]',
    badgeText: 'OVO Cash & Points',
    keywords: ['ovo', 'ovo cash'],
  },
  {
    id: 'dana',
    name: 'DANA',
    shortName: 'DANA',
    category: 'E-Wallet (Dompet Digital)',
    walletType: 'ewallet',
    primaryColor: '#118EEA',
    secondaryColor: '#0B6EC4',
    cardGradient: 'from-[#118EEA] via-[#0E76C7] to-[#095696]',
    badgeText: 'Dompet Digital DANA',
    keywords: ['dana'],
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    shortName: 'ShopeePay',
    category: 'E-Wallet (Dompet Digital)',
    walletType: 'ewallet',
    primaryColor: '#EE4D2D',
    secondaryColor: '#D03B1D',
    cardGradient: 'from-[#FF5722] via-[#EE4D2D] to-[#C6361B]',
    badgeText: 'ShopeePay Indonesia',
    keywords: ['shopeepay', 'shopee pay', 'spay'],
  },
  {
    id: 'linkaja',
    name: 'LinkAja',
    shortName: 'LinkAja!',
    category: 'E-Wallet (Dompet Digital)',
    walletType: 'ewallet',
    primaryColor: '#E31E24',
    secondaryColor: '#B81419',
    cardGradient: 'from-[#E31E24] via-[#C8191E] to-[#991115]',
    badgeText: 'LinkAja Syariah & Reguler',
    keywords: ['linkaja', 'link aja'],
  },
  {
    id: 'isaku',
    name: 'i.Saku',
    shortName: 'i.saku',
    category: 'E-Wallet (Dompet Digital)',
    walletType: 'ewallet',
    primaryColor: '#0072BC',
    secondaryColor: '#E31E24',
    cardGradient: 'from-[#0072BC] via-[#005B99] to-[#004273]',
    badgeText: 'Dompet Digital Indomaret',
    keywords: ['i.saku', 'isaku', 'i saku', 'indomaret'],
  },
];

export const WALLET_BRAND_CATEGORIES: WalletBrandCategory[] = [
  'Bank Konvensional & Syariah',
  'Bank Digital',
  'E-Wallet (Dompet Digital)',
];

/**
 * Detects if a wallet corresponds to one of the 17 supported Indonesian Banks / E-Wallets.
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

  // Check blu by BCA Digital before BCA so "blu by BCA Digital" matches blu, not BCA
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
      // Match whole word or exact substring for distinct brand names
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

/**
 * Renders an authentic, recognizable visual brand logo lockup for the 17 Indonesian
 * Banks & E-Wallets using crisp CSS geometry and official brand typography/colors.
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

  const dims =
    size === 'sm'
      ? 'w-9 h-9 rounded-xl'
      : size === 'lg'
      ? 'w-14 h-14 rounded-2xl'
      : 'w-12 h-12 rounded-2xl';

  if (!detectedBrand) {
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
        className={`${dims} flex items-center justify-center text-white shadow-xs shrink-0 border border-white/15 ${className}`}
        style={{ backgroundColor: walletColor || '#312E81' }}
      >
        <FallbackIcon size={iconSize} strokeWidth={2.2} />
      </div>
    );
  }

  const id = detectedBrand.id;

  // 1. BCA - Iconic Royal Blue with Lotus Petal Mark & Bold Italic BCA
  if (id === 'bca') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#0066AE] to-[#004481] flex flex-col items-center justify-center shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="Bank Central Asia (BCA)"
      >
        <div className="flex items-center gap-0.5">
          {/* Stylized 4-petal lotus emblem */}
          <div className="relative w-2.5 h-2.5 grid grid-cols-2 gap-[1px] rotate-45 shrink-0 mr-0.5">
            <span className="bg-white rounded-tl-full rounded-br-full block" />
            <span className="bg-white/90 rounded-tr-full rounded-bl-full block" />
            <span className="bg-white/90 rounded-tr-full rounded-bl-full block" />
            <span className="bg-white rounded-tl-full rounded-br-full block" />
          </div>
          <span
            className={`font-black italic tracking-tighter text-white leading-none ${
              size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-[16px]' : 'text-[13px]'
            }`}
          >
            BCA
          </span>
        </div>
        <span className="text-[6px] font-bold tracking-widest text-sky-200/90 uppercase mt-0.5 leading-none">
          BANK BCA
        </span>
      </div>
    );
  }

  // 2. BRI - BRI Blue with White Monogram Box & Orange Accent
  if (id === 'bri') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#00529C] to-[#003A70] flex flex-col items-center justify-center shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="Bank Rakyat Indonesia (BRI)"
      >
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded-[4px] border-[1.5px] border-white flex items-center justify-center bg-[#F37021] shrink-0">
            <span className="text-[8px] font-black text-white leading-none">B</span>
          </div>
          <span
            className={`font-black tracking-tight text-white leading-none ${
              size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-[15px]' : 'text-[13px]'
            }`}
          >
            BRI
          </span>
        </div>
        <div className="w-6 h-[2px] rounded-full bg-[#F37021] mt-1" />
      </div>
    );
  }

  // 3. Bank Mandiri - Deep Navy with Golden Yellow Flowing Wave Ribbon & lowercase "mandiri"
  if (id === 'mandiri') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#003D79] to-[#00254D] flex flex-col items-center justify-center px-1 shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="Bank Mandiri"
      >
        {/* Golden yellow wave ribbon */}
        <div className="w-full flex justify-end pr-1 mb-0.5">
          <div className="w-6 h-1.5 rounded-full bg-gradient-to-r from-[#FFB700] via-[#FDE047] to-[#F59E0B] -rotate-6 shadow-2xs" />
        </div>
        <span
          className={`font-black italic tracking-tight text-white leading-none ${
            size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-[12px]' : 'text-[10.5px]'
          }`}
        >
          mandiri
        </span>
      </div>
    );
  }

  // 4. BNI - BNI Teal with Burnt Orange 46 Badge & Bold White BNI
  if (id === 'bni') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#006677] to-[#004855] flex flex-col items-center justify-center shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="Bank Negara Indonesia (BNI)"
      >
        <div className="flex items-center gap-0.5">
          <div className="px-1 py-0.5 rounded-[3px] bg-[#F15A22] -skew-x-12 flex items-center justify-center shrink-0">
            <span className="text-[7px] font-black text-white leading-none skew-x-12">46</span>
          </div>
          <span
            className={`font-black tracking-tight text-white leading-none ${
              size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-[15px]' : 'text-[13px]'
            }`}
          >
            BNI
          </span>
        </div>
        <span className="text-[6px] font-bold text-[#FDBA74] tracking-wider uppercase mt-0.5 leading-none">
          wondr
        </span>
      </div>
    );
  }

  // 5. BTN - BTN Corporate Blue with Red & Amber Star/Hex Accent
  if (id === 'btn') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#003399] to-[#001F66] flex flex-col items-center justify-center shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="Bank Tabungan Negara (BTN)"
      >
        <div className="flex items-center gap-1">
          <span
            className={`font-black italic tracking-tight text-white leading-none ${
              size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-[15px]' : 'text-[13px]'
            }`}
          >
            BTN
          </span>
          <span className="w-2 h-2 rotate-45 bg-gradient-to-tr from-[#E31E24] to-[#FDB913] rounded-[1px] shrink-0" />
        </div>
        <div className="w-6 h-[2.5px] rounded-full bg-gradient-to-r from-[#E31E24] to-[#FDB913] mt-1" />
      </div>
    );
  }

  // 6. BSI - Bank Syariah Indonesia Tosca with Golden Star
  if (id === 'bsi') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#00A39D] to-[#007571] flex flex-col items-center justify-center shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="Bank Syariah Indonesia (BSI)"
      >
        <div className="relative flex items-start">
          <span
            className={`font-black tracking-tight text-white leading-none ${
              size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-[16px]' : 'text-[14px]'
            }`}
          >
            BSI
          </span>
          <span className="text-[8px] font-black text-[#F7A600] leading-none -mt-1 ml-0.5">
            ★
          </span>
        </div>
        <span className="text-[6px] font-bold tracking-widest text-teal-100 uppercase mt-0.5 leading-none">
          SYARIAH
        </span>
      </div>
    );
  }

  // 7. Bank Jago - Warm Amber Gold & Deep Purple with Bold Geometric "Jago"
  if (id === 'jago') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#FFAD00] via-[#F59E0B] to-[#EA580C] flex flex-col items-center justify-center shadow-xs shrink-0 border border-white/25 select-none ${className}`}
        title="Bank Jago"
      >
        <span
          className={`font-black tracking-tight text-[#3B0764] leading-none ${
            size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-[15px]' : 'text-[13px]'
          }`}
        >
          Jago
        </span>
        <span className="w-4 h-1 rounded-full bg-[#5C2D91] mt-0.5" />
      </div>
    );
  }

  // 8. Jenius - Cyan Blue with White Co.Create Circle & Jenius Typography
  if (id === 'jenius') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#00A4E4] to-[#0077B5] flex flex-col items-center justify-center shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="Jenius"
      >
        <div className="w-3 h-3 rounded-full border-[1.8px] border-white flex items-center justify-center mb-0.5">
          <div className="w-1 h-1 rounded-full bg-white" />
        </div>
        <span
          className={`font-extrabold tracking-tight text-white leading-none ${
            size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-[12px]' : 'text-[10px]'
          }`}
        >
          Jenius
        </span>
      </div>
    );
  }

  // 9. SeaBank - Vibrant Orange with Wave Coin Emblem & SeaBank
  if (id === 'seabank') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#FF6D00] to-[#E64A19] flex flex-col items-center justify-center shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="SeaBank"
      >
        <div className="w-4 h-4 rounded-full bg-white flex flex-col items-center justify-center gap-[1.5px] mb-0.5 shadow-2xs">
          <span className="w-2.5 h-[1.5px] rounded-full bg-[#FF5722]" />
          <span className="w-2 h-[1.5px] rounded-full bg-[#FF5722]" />
        </div>
        <span
          className={`font-black tracking-tight text-white leading-none ${
            size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-[11px]' : 'text-[9.5px]'
          }`}
        >
          SeaBank
        </span>
      </div>
    );
  }

  // 10. blu by BCA Digital - Cyan Teal with Bold Lowercase "blu"
  if (id === 'blu') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#00C4D6] via-[#0099B8] to-[#005BAA] flex flex-col items-center justify-center shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="blu by BCA Digital"
      >
        <span
          className={`font-black tracking-tighter text-white leading-none ${
            size === 'sm' ? 'text-[13px]' : size === 'lg' ? 'text-[18px]' : 'text-[15px]'
          }`}
        >
          blu
        </span>
        <span className="text-[5.5px] font-bold text-cyan-100 tracking-wider uppercase mt-0.5 leading-none">
          BCA digital
        </span>
      </div>
    );
  }

  // 11. NeoBank - Bright BNC Yellow & Jet Black with "neo" Cat/Ears Badge
  if (id === 'neobank') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-[#FFD400] flex flex-col items-center justify-center shadow-xs shrink-0 border border-black/15 select-none ${className}`}
        title="NeoBank (Bank Neo Commerce)"
      >
        <div className="px-1.5 py-0.5 rounded-md bg-[#111111] flex items-center justify-center">
          <span
            className={`font-black tracking-tighter text-[#FFD400] leading-none ${
              size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-[12px]' : 'text-[10.5px]'
            }`}
          >
            neo
          </span>
        </div>
        <span className="text-[6.5px] font-black text-[#111111] tracking-tight lowercase mt-0.5 leading-none">
          neobank
        </span>
      </div>
    );
  }

  // 12. GoPay - GoPay Cyan Blue with White Wallet Badge & "gopay"
  if (id === 'gopay') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#00AED6] to-[#0081A7] flex flex-col items-center justify-center shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="GoPay"
      >
        <div className="w-4 h-3 rounded-[4px] bg-white flex items-center justify-end pr-0.5 mb-0.5 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00AED6]" />
        </div>
        <span
          className={`font-black tracking-tight text-white leading-none ${
            size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-[12px]' : 'text-[10px]'
          }`}
        >
          gopay
        </span>
      </div>
    );
  }

  // 13. OVO - Royal Purple with Bold Geometric "OVO"
  if (id === 'ovo') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#5B3EB0] via-[#4C3494] to-[#2E1A63] flex flex-col items-center justify-center shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="OVO"
      >
        <span
          className={`font-black tracking-wider text-white leading-none ${
            size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-[16px]' : 'text-[13px]'
          }`}
        >
          OVO
        </span>
        <span className="w-4 h-[2px] rounded-full bg-[#A78BFA] mt-1" />
      </div>
    );
  }

  // 14. DANA - Bright Azure Blue with White Wave Emblem & Bold "DANA"
  if (id === 'dana') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#118EEA] to-[#0A64B0] flex flex-col items-center justify-center shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="DANA"
      >
        <div className="flex items-center gap-0.5">
          <div className="w-3 h-3 rounded-full bg-white flex items-center justify-center shrink-0">
            <span className="w-2 h-1 rounded-full bg-[#118EEA] -rotate-12" />
          </div>
          <span
            className={`font-black tracking-tight text-white leading-none ${
              size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-[13px]' : 'text-[10.5px]'
            }`}
          >
            DANA
          </span>
        </div>
      </div>
    );
  }

  // 15. ShopeePay - Shopee Orange-Red with White S-Wallet Emblem & Pay
  if (id === 'shopeepay') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#FF5722] to-[#D6381A] flex flex-col items-center justify-center shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="ShopeePay"
      >
        <div className="w-4 h-4 rounded-[5px] bg-white flex items-center justify-center mb-0.5 shadow-2xs">
          <span className="text-[10px] font-black text-[#EE4D2D] leading-none">S</span>
        </div>
        <span
          className={`font-extrabold tracking-tight text-white leading-none ${
            size === 'sm' ? 'text-[7.5px]' : size === 'lg' ? 'text-[10px]' : 'text-[8.5px]'
          }`}
        >
          ShopeePay
        </span>
      </div>
    );
  }

  // 16. LinkAja - Crimson Red with Bold White "LinkAja!"
  if (id === 'linkaja') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#E31E24] to-[#A81015] flex flex-col items-center justify-center px-1 shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="LinkAja"
      >
        <span
          className={`font-black tracking-tighter text-white leading-none ${
            size === 'sm' ? 'text-[8.5px]' : size === 'lg' ? 'text-[12px]' : 'text-[10px]'
          }`}
        >
          LinkAja!
        </span>
        <span className="w-4 h-1 rounded-full bg-white/80 mt-0.5" />
      </div>
    );
  }

  // 17. i.Saku - Indomaret Blue with Red/Yellow Accent Dot & "i.saku"
  if (id === 'isaku') {
    return (
      <div
        className={`${dims} relative overflow-hidden bg-gradient-to-br from-[#0072BC] to-[#004B80] flex flex-col items-center justify-center px-1 shadow-xs shrink-0 border border-white/20 select-none ${className}`}
        title="i.Saku"
      >
        <div className="flex items-baseline">
          <span
            className={`font-black text-white leading-none ${
              size === 'sm' ? 'text-[9.5px]' : size === 'lg' ? 'text-[13px]' : 'text-[11px]'
            }`}
          >
            i
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD100] mx-[1px] inline-block" />
          <span
            className={`font-black tracking-tight text-white leading-none ${
              size === 'sm' ? 'text-[9.5px]' : size === 'lg' ? 'text-[13px]' : 'text-[11px]'
            }`}
          >
            saku
          </span>
        </div>
        <div className="w-6 h-[2px] rounded-full bg-gradient-to-r from-[#E31E24] via-[#FFD100] to-[#0072BC] mt-1" />
      </div>
    );
  }

  return null;
}
