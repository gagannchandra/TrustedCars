import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, CheckCircle, ShieldCheck, Award, Lock } from 'lucide-react';
import { CITIES } from '../../../data/cities';

export default function Hero() {
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');
  const [searchCity, setSearchCity] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQ) params.set('q', searchQ);
    if (searchCity) params.set('city', searchCity);
    navigate(`/cars?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[95vh] flex items-center overflow-hidden" style={{ background: 'radial-gradient(circle at top left, #1E5AA8 0%, #0B3A6E 45%, #082A4F 100%)' }}>
      {/* Background Image Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80"
          alt="Hero background"
          className="w-full h-full object-cover opacity-10 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#082A4F]/80" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 z-10 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#0B3A6E]/50 border border-[#BAE6FD]/20 rounded-full px-5 py-2 mb-10 backdrop-blur-md shadow-lg transform transition-transform hover:scale-105">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span className="text-sm text-[#BAE6FD] font-bold tracking-wide uppercase">Enterprise-Grade Automotive Platform</span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-7xl text-white leading-[1.1] mb-6 sm:mb-8 tracking-tight max-w-4xl">
          Buy & Sell Cars<br />
          <span className="text-[#BAE6FD]">With Absolute Trust</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl text-white/80 mb-12 leading-relaxed max-w-2xl font-body font-medium">
          Every vehicle is rigorously vetted with a 200-point inspection, historical background check, and transparent pricing. Experience premium automotive commerce.
        </p>

        {/* Search Bar - Premium Pill Shape */}
        <form onSubmit={handleSearch} className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-full p-2.5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row gap-2 border-2 border-white/10 relative z-20">
          <div className="flex items-center gap-4 flex-1 px-4 sm:px-6">
            <Search className="w-6 h-6 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search make, model, or keyword..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="flex-1 py-4 text-slate-900 placeholder-slate-400 bg-transparent outline-none text-lg font-medium font-body"
            />
          </div>
          <div className="hidden sm:block w-px h-10 bg-slate-200 self-center"></div>
          <div className="flex items-center gap-3 px-4 sm:px-6 sm:w-64 border-t border-slate-100 sm:border-0 pt-2 sm:pt-0 mt-2 sm:mt-0">
            <MapPin className="w-6 h-6 text-slate-400 shrink-0" />
            <select
              value={searchCity}
              onChange={e => setSearchCity(e.target.value)}
              className="w-full py-4 text-slate-700 bg-transparent outline-none text-lg font-medium appearance-none cursor-pointer font-body"
            >
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full sm:w-auto bg-[#10B981] hover:bg-[#059669] text-white font-bold px-10 py-4 rounded-xl sm:rounded-full text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] whitespace-nowrap font-display tracking-wide">
            Explore Inventory
          </button>
        </form>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          {[
            { label: 'Under ₹5L', params: 'price_max=500000' },
            { label: 'Premium SUVs', params: 'body_type=suv' },
            { label: 'Certified Pre-Owned', params: 'ownership=1' },
            { label: 'Electric Vehicles', params: 'fuel_type=electric' },
          ].map(f => (
            <button
              key={f.label}
              onClick={() => navigate(`/cars?${f.params}`)}
              className="text-sm font-bold text-white/90 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 px-5 py-2.5 rounded-full transition-all backdrop-blur-sm"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trust Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#082A4F]/80 backdrop-blur-xl border-t border-white/5 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 sm:gap-y-0 gap-x-4 sm:gap-x-6 text-center divide-x-0 md:divide-x divide-white/10">
            {[
              { icon: <CheckCircle className="w-5 h-5 text-[#10B981]" />, label: '200-Point Inspected' },
              { icon: <ShieldCheck className="w-5 h-5 text-[#10B981]" />, label: 'Comprehensive Warranty' },
              { icon: <Lock className="w-5 h-5 text-[#10B981]" />, label: 'Secure Transactions' },
              { icon: <Award className="w-5 h-5 text-[#10B981]" />, label: 'Verified Ownership' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-2 px-2 sm:px-4">
                <div className="flex items-center justify-center bg-white/5 w-10 h-10 rounded-full mb-1 border border-white/5 shadow-inner">
                  {stat.icon}
                </div>
                <div className="text-xs sm:text-sm text-white/90 font-bold tracking-wide font-display">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
