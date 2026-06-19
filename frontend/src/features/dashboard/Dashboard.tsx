import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, User, LogOut, Car, TrendingUp, Shield, CheckCircle, Star, Plus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { carsApi, inquiriesApi, reviewsApi } from '../../shared/api/client';

import OverviewTab from './components/OverviewTab';
import WishlistTab from './components/WishlistTab';
import GarageTab from './components/GarageTab';
import InquiriesTab from './components/InquiriesTab';
import ReviewsTab from './components/ReviewsTab';
import ProfileTab from './components/ProfileTab';

type Tab = 'overview' | 'wishlist' | 'garage' | 'inquiries' | 'reviews' | 'profile';

export default function Dashboard() {
  const { user, isAuthenticated, logout, wishlist } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');

  const { data: cars = [], isLoading: loadingCars } = useQuery({ queryKey: ['allCars'], queryFn: carsApi.getAllCarsAdmin, enabled: isAuthenticated });
  const { data: inquiries = [], isLoading: loadingInquiries } = useQuery({ queryKey: ['allInquiries'], queryFn: inquiriesApi.getAllInquiries, enabled: isAuthenticated });
  const { data: reviews = [], isLoading: loadingReviews } = useQuery({ queryKey: ['allReviews'], queryFn: reviewsApi.getAllReviews, enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center bg-white p-12 rounded-[32px] shadow-sm border border-slate-100 max-w-md w-full">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 tracking-tight">Access Required</h2>
          <p className="text-slate-500 font-medium mb-8">Please sign in to access your dashboard.</p>
          <button onClick={() => navigate('/login')} className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-md">Secure Sign In</button>
        </div>
      </div>
    );
  }

  if (loadingCars || loadingInquiries || loadingReviews) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface pt-16">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const wishlistCars = cars.filter(c => wishlist.includes(c.id));
  const myCars = cars.filter(c => c.seller_id === user?.id || c.seller_id === 'u2');
  const sentInquiries = inquiries.filter(i => i.buyer_id === user?.id || i.buyer_id === 'u5');
  const receivedInquiries = inquiries.filter(i => i.seller_id === user?.id || i.seller_id === 'u2');
  const myReviews = reviews.filter(r => r.seller_id === user?.id || r.seller_id === 'u2');

  const TABS = [
    { id: 'overview' as Tab, label: 'Overview', icon: TrendingUp },
    { id: 'wishlist' as Tab, label: `Wishlist (${wishlistCars.length})`, icon: Heart },
    { id: 'garage' as Tab, label: `My Garage (${myCars.length})`, icon: Car },
    { id: 'inquiries' as Tab, label: `Inquiries (${sentInquiries.length + receivedInquiries.length})`, icon: MessageSquare },
    { id: 'reviews' as Tab, label: `Reviews (${myReviews.length})`, icon: Star },
    { id: 'profile' as Tab, label: 'Profile Settings', icon: User },
  ];

  return (
    <div className="min-h-screen bg-surface pt-16">
      {/* Header */}
      <div className="bg-primary text-white pt-12 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80')] opacity-5 mix-blend-overlay object-cover"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img src={user?.avatar_url} alt={user?.full_name} className="w-20 h-20 rounded-2xl border-4 border-white/20 shadow-lg object-cover" />
                <div className="absolute -bottom-2 -right-2 bg-success text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-primary shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <h1 className="font-display font-bold text-3xl tracking-tight">Welcome, {user?.full_name.split(' ')[0]}</h1>
                <p className="text-blue-200 font-medium text-sm flex items-center gap-2 mt-1">
                  <span className="uppercase tracking-wider">TrustedCars Member</span> • {user?.city}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/sell" className="flex items-center gap-2 bg-success text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-green-600 transition-colors border border-transparent">
                <Plus className="w-4 h-4" /> Sell Car
              </Link>
              <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-colors backdrop-blur-sm border border-white/10">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <nav className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="p-4 space-y-1">
                {TABS.map(t => {
                  const Icon = t.icon;
                  const isActive = tab === t.id;
                  return (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={`w-full flex items-center text-left gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${isActive ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tab === 'overview' && <OverviewTab wishlistCars={wishlistCars} myCars={myCars} sentInquiries={sentInquiries} receivedInquiries={receivedInquiries} />}
            {tab === 'wishlist' && <WishlistTab wishlistCars={wishlistCars} />}
            {tab === 'garage' && <GarageTab myCars={myCars} />}
            {tab === 'inquiries' && <InquiriesTab sentInquiries={sentInquiries} receivedInquiries={receivedInquiries} />}
            {tab === 'reviews' && <ReviewsTab myReviews={myReviews} />}
            {tab === 'profile' && <ProfileTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
