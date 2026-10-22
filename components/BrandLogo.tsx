'use client';

import React from 'react';
import { useApp } from './AppContext';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  const { settings } = useApp();
  const accent = settings?.accentColor || 'lime';

  const bgClass =
    accent === 'orange'
      ? 'bg-[#FF6B00]'
      : accent === 'pink'
      ? 'bg-[#FFA4A4]'
      : 'bg-[#D4F826]';

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-14 h-14 rounded-2xl',
  }[size];

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center shrink-0 transition-colors duration-300 ${bgClass} ${sizeClasses} ${className}`}
    >
      <img
        src="/assets/aistudio/Gemini_Generated_Image_20y12o20y12o20y1_052c8469.jpeg"
        alt="Dompt. Logo"
        className="w-full h-full object-cover scale-[1.38] mix-blend-multiply grayscale contrast-[8] brightness-115 select-none pointer-events-none"
      />
    </div>
  );
}
