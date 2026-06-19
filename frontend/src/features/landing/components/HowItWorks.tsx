import { useNavigate } from 'react-router-dom';
import { Search, Zap, ChevronRight } from 'lucide-react';

const HOW_IT_WORKS_BUYER = [
  { step: '01', title: 'Search & Filter', desc: 'Browse 12,000+ certified cars by make, budget, city, and more' },
  { step: '02', title: 'View Inspection Report', desc: 'Read the 200-point inspection report and price analysis before deciding' },
  { step: '03', title: 'Book a Test Drive', desc: 'Contact the seller, schedule a visit, and drive the car of your choice' },
];

const HOW_IT_WORKS_SELLER = [
  { step: '01', title: 'List Your Car Free', desc: 'Upload photos, fill in details, and set your price in under 10 minutes' },
  { step: '02', title: 'Free Inspection', desc: 'Our certified inspector visits and rates your car, building buyer trust' },
  { step: '03', title: 'Sell Fast & Safe', desc: 'Receive genuine inquiries, negotiate, and complete the sale securely' },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-primary font-bold tracking-wide text-sm mb-2 uppercase">Simple & Transparent</p>
          <h2 className="font-display font-bold text-4xl text-slate-900 tracking-tight">The Enterprise Process</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Buyer */}
          <div className="bg-surface rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-2xl text-slate-900">For Buyers</h3>
            </div>
            <div className="space-y-8">
              {HOW_IT_WORKS_BUYER.map((step, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className="shrink-0 w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-primary font-bold text-sm shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                    {step.step}
                  </div>
                  <div className="pt-1">
                    <h4 className="font-display font-bold text-lg text-slate-900 mb-1.5">{step.title}</h4>
                    <p className="text-base text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/cars')} className="mt-10 w-full flex justify-center items-center gap-2 bg-primary hover:bg-blue-800 text-white font-semibold px-6 py-4 rounded-xl text-base transition-colors shadow-md">
              Browse Collection <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Seller */}
          <div className="bg-surface rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                <Zap className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-display font-bold text-2xl text-slate-900">For Sellers</h3>
            </div>
            <div className="space-y-8">
              {HOW_IT_WORKS_SELLER.map((step, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className="shrink-0 w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-success font-bold text-sm shadow-sm group-hover:bg-success group-hover:text-white transition-colors">
                    {step.step}
                  </div>
                  <div className="pt-1">
                    <h4 className="font-display font-bold text-lg text-slate-900 mb-1.5">{step.title}</h4>
                    <p className="text-base text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/sell')} className="mt-10 w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-black text-white font-semibold px-6 py-4 rounded-xl text-base transition-colors shadow-md">
              Sell Your Vehicle <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
