import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Car, FilterState, QualityBadge } from '../../types';

export const DEFAULT_AVATAR_URL = 'https://ui-avatars.com/api/?name=User&background=0F4C81&color=fff';
export const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`;
  return `₹${price.toLocaleString('en-IN')}`;
}

export function formatOdometer(km: number): string {
  if (km >= 100000) return `${(km / 100000).toFixed(1)} L km`;
  return `${km.toLocaleString('en-IN')} km`;
}

export function getQualityBadgeConfig(badge?: QualityBadge | null) {
  switch (badge) {
    case 'excellent':
      return { label: 'Excellent', className: 'bg-green-100 text-green-800 border border-green-200', dot: 'bg-green-500' };
    case 'good':
      return { label: 'Good', className: 'bg-blue-100 text-blue-800 border border-blue-200', dot: 'bg-blue-500' };
    case 'fair':
      return { label: 'Fair', className: 'bg-amber-100 text-amber-800 border border-amber-200', dot: 'bg-amber-500' };
    default:
      return { label: 'Inspected', className: 'bg-gray-100 text-gray-700 border border-gray-200', dot: 'bg-gray-400' };
  }
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#16A34A';
  if (score >= 75) return '#2563EB';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

export function calculateEMI(principal: number, ratePerYear: number, tenureMonths: number): number {
  const r = ratePerYear / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi);
}

export function timeAgo(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function filterCars(cars: Car[], filters: FilterState): Car[] {
  let result = [...cars];

  if (filters.q) {
    const q = filters.q.toLowerCase();
    result = result.filter(c =>
      c.make.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      c.variant?.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.color?.toLowerCase().includes(q)
    );
  }

  if (filters.make) result = result.filter(c => c.make === filters.make);
  if (filters.model) result = result.filter(c => c.model === filters.model);
  if (filters.year_min !== undefined) result = result.filter(c => c.year >= filters.year_min!);
  if (filters.year_max !== undefined) result = result.filter(c => c.year <= filters.year_max!);
  if (filters.price_min !== undefined) result = result.filter(c => c.asking_price >= filters.price_min!);
  if (filters.price_max !== undefined) result = result.filter(c => c.asking_price <= filters.price_max!);
  if (filters.fuel_type) result = result.filter(c => c.fuel_type === filters.fuel_type);
  if (filters.transmission) result = result.filter(c => c.transmission === filters.transmission);
  if (filters.city) result = result.filter(c => c.city.toLowerCase().includes(filters.city!.toLowerCase()));
  if (filters.km_max !== undefined) result = result.filter(c => c.odometer_km <= filters.km_max!);
  if (filters.body_type) result = result.filter(c => c.body_type === filters.body_type);
  if (filters.ownership !== undefined) {
    if (filters.ownership >= 3) {
      result = result.filter(c => c.ownership_count >= 3);
    } else {
      result = result.filter(c => c.ownership_count === filters.ownership);
    }
  }

  switch (filters.sort) {
    case 'price_asc': result.sort((a, b) => a.asking_price - b.asking_price); break;
    case 'price_desc': result.sort((a, b) => b.asking_price - a.asking_price); break;
    case 'year_desc': result.sort((a, b) => b.year - a.year); break;
    case 'km_asc': result.sort((a, b) => a.odometer_km - b.odometer_km); break;
    default: result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return result;
}

