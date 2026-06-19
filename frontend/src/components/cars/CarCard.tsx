import { Link } from 'react-router-dom';
import { Heart, MapPin, Eye, Fuel, Gauge, Users, CheckCircle, ShieldCheck } from 'lucide-react';
import { Car } from '../../types';
import { formatPrice, formatOdometer, getQualityBadgeConfig, calculateEMI } from '../../shared/utils/utils';
import { useAuthStore } from '../../store/authStore';

interface CarCardProps {
  car: Car;
  compact?: boolean;
  index?: number;
}

const FUEL_LABELS: Record<string, string> = {
  petrol: 'Petrol', diesel: 'Diesel', electric: 'Electric', cng: 'CNG', hybrid: 'Hybrid',
};

export default function CarCard({ car, compact = false, index = 0 }: CarCardProps) {
  const { wishlist, toggleWishlist, isAuthenticated } = useAuthStore();
  const isWishlisted = wishlist.includes(car.id);
  const emi = calculateEMI(car.asking_price * 0.8, 9.5, 60);
  const primaryImage = car.images?.[0]?.url || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80';
  const priceDiff = car.market_value ? Math.round(((car.market_value - car.asking_price) / car.market_value) * 100) : 0;

  return (
    <div 
      className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(15,23,42,0.1)] transition-all duration-500 overflow-hidden group animate-fade-in-up flex flex-col"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-50 shrink-0">
        <Link to={`/cars/${car.id}`} className="block w-full h-full">
          <img
            src={primaryImage}
            alt={`${car.year} ${car.make} ${car.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/40 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-md bg-white/90 text-slate-800 border border-white/20`}>
              <ShieldCheck className={`w-4 h-4 text-[#10B981]`} />
              Certified Pre-Owned
            </span>
            {car.is_featured && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-md bg-[#0B3A6E] text-white border border-[#0B3A6E]/20 w-fit">
                <CheckCircle className="w-3.5 h-3.5" /> Featured
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => { e.preventDefault(); if (isAuthenticated) toggleWishlist(car.id); }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md backdrop-blur-md ${isWishlisted ? 'bg-error text-white' : 'bg-white/90 text-slate-500 hover:text-error hover:bg-white'}`}
          >
            <Heart className={`w-4.5 h-4.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Price Tag Overlay */}
        {priceDiff >= 5 && (
          <div className="absolute bottom-4 left-4 bg-[#10B981] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            {priceDiff}% below market
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <Link to={`/cars/${car.id}`} className="group-hover:text-[#0B3A6E] transition-colors">
          <h3 className="font-display font-bold text-[#0F172A] text-xl tracking-tight line-clamp-1">
            {car.year} {car.make} {car.model}
          </h3>
          <p className="text-sm font-medium text-[#64748B] mt-1 line-clamp-1">{car.variant || 'Base Edition'}</p>
        </Link>

        {/* Quick Specs - Premium Pill layout */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {[
            { icon: Gauge, label: formatOdometer(car.odometer_km) },
            { icon: Fuel, label: FUEL_LABELS[car.fuel_type] },
            { icon: Users, label: car.ownership_count === 1 ? '1st Owner' : '2nd Owner' },
          ].map((spec, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] bg-slate-50 border border-[#E2E8F0] px-2.5 py-1.5 rounded-lg">
              <spec.icon className="w-3.5 h-3.5 text-slate-400" />
              {spec.label}
            </span>
          ))}
        </div>

        {!compact && car.city && (
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#64748B]">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {car.city}
          </div>
        )}

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Asking Price</div>
              <div className="font-display font-extrabold text-2xl text-[#0F172A] tracking-tight">{formatPrice(car.asking_price)}</div>
            </div>
            {!compact && (
              <div className="text-right">
                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Estimated EMI</div>
                <div className="text-sm font-bold text-[#0B3A6E]">{formatPrice(emi)}/mo</div>
              </div>
            )}
          </div>
        </div>

        {/* Inspection Score */}
        {car.inspection_score && !compact && (
          <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                  <circle cx="16" cy="16" r="14" fill="none" stroke="#10B981" strokeWidth="4"
                    strokeDasharray={`${(car.inspection_score / 100) * 87.96} 87.96`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#0F172A]">{car.inspection_score}</span>
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A]">Quality Score</div>
                <div className="text-[10px] font-semibold text-[#10B981]">Verified by TrustedCars</div>
              </div>
            </div>
            <Link to={`/cars/${car.id}`} className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-[#0B3A6E] group-hover:bg-[#0B3A6E] group-hover:text-white transition-colors">
              <Eye className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
