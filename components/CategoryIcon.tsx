import React from 'react';
import {
  Utensils, Coffee, ShoppingCart, Bus, Fuel, Car, Wifi, Shirt, Home,
  Zap, Droplets, Key, CreditCard, Layers, Tv, Pill, Stethoscope, Smile,
  Activity, BookOpen, GraduationCap, Printer, Briefcase, Film, Gamepad2,
  Plane, Tag, TrendingUp, Heart, Receipt, MoreHorizontal, Award, Clock,
  Laptop, FolderKanban, Store, Percent, Sparkles, RotateCcw, Coins,
  Wallet as WalletIcon, Gift, ArrowRightLeft, DollarSign, LucideIcon
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Coffee,
  ShoppingCart,
  Bus,
  Fuel,
  Car,
  Wifi,
  Shirt,
  Home,
  Zap,
  Droplets,
  Key,
  CreditCard,
  Layers,
  Tv,
  Pill,
  Stethoscope,
  Smile,
  Activity,
  BookOpen,
  GraduationCap,
  Printer,
  Briefcase,
  Film,
  Gamepad2,
  Plane,
  Tag,
  TrendingUp,
  Heart,
  Receipt,
  MoreHorizontal,
  Award,
  Clock,
  Laptop,
  FolderKanban,
  Store,
  Percent,
  Sparkles,
  RotateCcw,
  Coins,
  Wallet: WalletIcon,
  Gift,
  ArrowRightLeft,
  DollarSign,
};

interface CategoryIconProps {
  iconKey?: string;
  size?: number;
  className?: string;
  color?: string;
}

export function CategoryIcon({ iconKey = 'MoreHorizontal', size = 20, className = '', color }: CategoryIconProps) {
  const IconComponent = ICON_MAP[iconKey] || MoreHorizontal;
  return <IconComponent size={size} className={className} style={color ? { color } : undefined} />;
}
