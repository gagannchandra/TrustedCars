import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Phone, MessageSquare, Star, Shield, CheckCircle, Calendar, Gauge, Fuel, Users, Eye, Share2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { carsApi } from '../../shared/api/client';
import { formatPrice, formatOdometer, getQualityBadgeConfig, calculateEMI, timeAgo, DEFAULT_AVATAR_URL } from '../../shared/utils/utils';
import { useAuth } from '../../shared/hooks/useAuth';
import CarCard from '../../components/cars/CarCard';

import ImageGallery from './components/ImageGallery';
import InquiryModal from './components/InquiryModal';
import EMIModal from './components/EMIModal';

const SPEC_LABELS: Record<string, string> = {
  petrol: 'Petrol', diesel: 'Diesel', electric: 'Electric', cng: 'CNG', hybrid: 'Hybrid',
  manual: 'Manual', automatic: 'Automatic', amt: 'AMT',
  sedan: 'Sedan', suv: 'SUV', hatchback: 'Hatchback', mpv: 'MPV', coupe: 'Coupe', pickup: 'Pickup',
};

export default function CarDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, isAuthenticated } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [showInquiry, setShowInquiry] = useState(false);
  const [showEMI, setShowEMI] = useState(false);
  
  const { data: car, isLoading } = useQuery({
    queryKey: ['car', id],
    queryFn: () => carsApi.getCarById(id!),
    enabled: !!id
  });

  const { data: similarCars = [] } = useQuery({
    queryKey: ['similarCars', id],
    queryFn: () => carsApi.getSimilarCars(car!),
    enabled: !!car
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface pt-16">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  if (!car) return (
    <div className="min-h-screen flex items-center justify-center bg-surface pt-16">
      <div className="text-center bg-white p-12 rounded-3xl border border-slate-100 shadow-sm">
        <div className="text-6xl mb-6">🚗</div>
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Vehicle not found</h2>
        <p className="text-slate-500 font-medium mb-8">This vehicle may have been sold or removed.</p>
        <button onClick={() => navigate('/cars')} className="bg-primary text-white px-8 py-3.5 rounded-full font-bold shadow-md hover:bg-blue-800">Browse Inventory</button>
      </div>
    </div>
  );

  const isWishlisted = wishlist.includes(car.id);
  const badge = null;
  const images = car.images || [];
    const emi = calculateEMI(car.asking_price * 0.8, 9.5, 60);
  

  return (
    <div className="min-h-screen bg-surface pt-16">
      <Helmet>
        <title>{`${car.year} ${car.make} ${car.model} | TrustedCars`}</title>
        <meta name="description" content={`Buy this ${car.year} ${car.make} ${car.model} for ${formatPrice(car.asking_price)}. Inspected, certified, and ready to drive.`} />
        <meta property="og:title" content={`${car.year} ${car.make} ${car.model}`} />
        <meta property="og:image" content={images[0]?.url} />
      </Helmet>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/cars" className="hover:text-primary transition-colors">Inventory</Link>
          <span>/</span>
          <span className="text-slate-900">{car.year} {car.make} {car.model}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            <ImageGallery images={images} activeImage={activeImage} setActiveImage={setActiveImage} badge={badge} />

            {/* Title & Quick Facts */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                  <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">{car.year} {car.make} {car.model}</h1>
                  <p className="text-xl text-slate-500 font-medium mt-1">{car.variant}</p>
                  
                  <div className="flex flex-wrap gap-2.5 mt-5">
                    {[
                      car.ownership_count === 1 ? '1st Owner' : `${car.ownership_count}nd Owner`,
                      SPEC_LABELS[car.fuel_type],
                      SPEC_LABELS[car.transmission],
                      car.city,
                    ].map(chip => (
                      <span key={chip} className="text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wide px-3.5 py-1.5 rounded-full">{chip}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-5 text-sm font-medium text-slate-400">
                    <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{car.view_count.toLocaleString()} views</span>
                    <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" />{car.wishlist_count} saves</span>
                    <span>Listed {timeAgo(car.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => toggleWishlist(car.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all shadow-sm hover:scale-105 ${isWishlisted ? 'bg-error/10 border-error/20 text-error' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:text-slate-600'}`}>
                    <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard!');
                    }}
                    className="p-3.5 rounded-2xl border-2 border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:text-slate-600 transition-all shadow-sm hover:scale-105">
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Highlights */}
              {car.highlights && car.highlights.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-100 flex flex-wrap gap-3">
                  {car.highlights.map(h => (
                    <span key={h} className="inline-flex items-center gap-2 text-sm font-bold text-success bg-success/10 border border-success/20 px-4 py-2 rounded-xl">
                      <CheckCircle className="w-4 h-4" />{h}
                    </span>
                  ))}
                </div>
              )}

              {car.description && (
                <p className="mt-6 text-base text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">{car.description}</p>
              )}
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
              <h2 className="font-display font-bold text-2xl text-slate-900 mb-6 tracking-tight">Technical Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 divide-y divide-slate-100">
                {[
                  { label: 'Make / Model', value: `${car.make} / ${car.model}` },
                  { label: 'Variant', value: car.variant || '—' },
                  { label: 'Manufacturing Year', value: car.year },
                  { label: 'Fuel System', value: SPEC_LABELS[car.fuel_type] },
                  { label: 'Transmission', value: SPEC_LABELS[car.transmission] },
                  { label: 'Body Category', value: car.body_type ? SPEC_LABELS[car.body_type] : '—' },
                  { label: 'Engine Capacity', value: car.engine_cc ? `${car.engine_cc} cc` : '—' },
                  { label: 'Fuel Economy', value: car.mileage_kmpl ? `${car.mileage_kmpl} kmpl` : '—' },
                  { label: 'Seating', value: car.seating_capacity ? `${car.seating_capacity} Seater` : '—' },
                  { label: 'Exterior Color', value: car.color || '—' },
                  { label: 'Odometer Reading', value: formatOdometer(car.odometer_km) },
                  { label: 'Ownership History', value: `${car.ownership_count === 1 ? '1st' : car.ownership_count === 2 ? '2nd' : '3rd+'} Owner` },
                  { label: 'Registration City', value: `${car.city}, ${car.state}` },
                  { label: 'Price Negotiability', value: car.price_negotiable ? 'Negotiable' : 'Fixed Price' },
                ].map(spec => (
                  <div key={spec.label} className="flex items-center py-4">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider w-44 shrink-0">{spec.label}</span>
                    <span className="text-base font-bold text-slate-800">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

                        
            {/* Similar Cars */}
            {similarCars.length > 0 && (
              <div className="pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Similar Inventory</h2>
                  <Link to="/cars" className="text-sm font-bold text-primary hover:text-blue-800">View All →</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {similarCars.map((c, index) => <CarCard key={c.id} car={c} compact index={index} />)}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT STICKY COLUMN */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 sticky top-24">
              {/* Price */}
              <div className="mb-8">
                <div className="font-display font-bold text-4xl text-slate-900 tracking-tight mb-2">{formatPrice(car.asking_price)}</div>

                <div className="text-sm font-medium text-slate-500 mt-3">Estimated EMI from <span className="font-bold text-slate-800">{formatPrice(emi)}/mo</span></div>
              </div>

              {/* Actions */}
              <div className="space-y-3 mb-8">
                <button onClick={() => setShowInquiry(true)} className="w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-blue-800 text-white font-bold py-4 rounded-xl transition-all shadow-md text-base hover:-translate-y-0.5">
                  <MessageSquare className="w-5 h-5" />Send Inquiry
                </button>
                <button className="w-full flex items-center justify-center gap-2.5 border-2 border-primary text-primary hover:bg-primary/5 font-bold py-4 rounded-xl transition-all text-base hover:-translate-y-0.5">
                  <Phone className="w-5 h-5" />Contact Seller
                </button>
                <button onClick={() => setShowEMI(true)} className="w-full flex items-center justify-center gap-2.5 border-2 border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50 font-bold py-4 rounded-xl transition-all text-base mt-2">
                  Calculate EMI
                </button>
                <button onClick={() => { if (isAuthenticated) toggleWishlist(car.id); else navigate('/login'); }}
                  className={`w-full flex items-center justify-center gap-2.5 font-bold py-4 rounded-xl transition-all text-base border-2 mt-2 ${isWishlisted ? 'bg-error/10 border-error/20 text-error' : 'border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'}`}>
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  {isWishlisted ? 'Saved to Wishlist' : 'Save Vehicle'}
                </button>
              </div>

              {/* Location & Seller */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{car.city}, {car.state}</span>
                </div>
                {car.seller && (
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <img src={car.seller.avatar_url || DEFAULT_AVATAR_URL} onError={e => e.currentTarget.src = DEFAULT_AVATAR_URL} alt={car.seller.full_name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                    <div>
                      <div className="text-sm font-bold text-slate-900">{car.seller.full_name}</div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mt-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <span className="text-slate-700">{car.seller.rating}</span> ({car.seller.review_count} reviews)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Trust Promise */}
              <div className="mt-6 border-t border-slate-100 pt-6 bg-primary/5 -mx-8 -mb-8 p-8 rounded-b-3xl border-x border-b border-primary/10">
                <div className="flex items-center gap-2 text-base font-bold text-primary mb-4 tracking-tight">
                  <Shield className="w-5 h-5" /> Enterprise Promise
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    'Free RC Transfer Assistance',
                    'Pre-approved Financing',
                    '7-Day Money Back Guarantee',
                    'Comprehensive 6-Month Warranty',
                  ].map(p => (
                    <div key={p} className="flex items-center gap-2.5 text-sm font-bold text-slate-700">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />{p}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Gauge className="w-5 h-5 text-primary" />, label: 'KM Driven', value: formatOdometer(car.odometer_km) },
                { icon: <Fuel className="w-5 h-5 text-primary" />, label: 'Fuel', value: SPEC_LABELS[car.fuel_type] },
                { icon: <Users className="w-5 h-5 text-primary" />, label: 'Owners', value: `${car.ownership_count === 1 ? '1st' : car.ownership_count === 2 ? '2nd' : '3rd+'}` },
                { icon: <Calendar className="w-5 h-5 text-primary" />, label: 'Year', value: car.year },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2 bg-slate-50 w-fit p-2 rounded-lg">{stat.icon}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{stat.label}</div>
                  <div className="font-bold text-base text-slate-900">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showInquiry && <InquiryModal car={car} onClose={() => setShowInquiry(false)} />}
      {showEMI && <EMIModal price={car.asking_price} onClose={() => setShowEMI(false)} />}
    </div>
  );
}
