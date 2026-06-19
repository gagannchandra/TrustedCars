import { CheckCircle, Shield, Award, TrendingUp } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: <CheckCircle className="w-6 h-6 text-success" />, title: '200-Point Inspection', desc: 'Every car certified' },
  { icon: <Shield className="w-6 h-6 text-primary" />, title: 'Free RC Transfer', desc: 'Hassle-free ownership' },
  { icon: <Award className="w-6 h-6 text-warning" />, title: 'Best Price Guarantee', desc: 'Fair market pricing' },
  { icon: <TrendingUp className="w-6 h-6 text-blue-500" />, title: '6-Month Warranty', desc: 'Peace of mind' },
];

export default function TrustStrip() {
  return (
    <section className="bg-surface border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_ITEMS.map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="shrink-0 p-3 bg-slate-50 rounded-xl">{item.icon}</div>
              <div>
                <div className="font-display font-bold text-base text-slate-900 mb-1">{item.title}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
