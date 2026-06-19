import { Star, MapPin } from 'lucide-react';

const TESTIMONIALS = [
  { name: 'Arjun Mehta', city: 'Bangalore', rating: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun', quote: 'Bought a Honda City through TrustedCars. The inspection report gave me complete confidence. Zero surprises after purchase!' },
  { name: 'Divya Nair', city: 'Kochi', rating: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=divya', quote: 'Sold my Creta in 4 days! The free inspection helped me price it right and buyers were confident. Amazing platform!' },
  { name: 'Kabir Singh', city: 'Chandigarh', rating: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kabir', quote: 'As someone who knows nothing about cars, TrustedCars\' inspection report was a lifesaver. Transparent and trustworthy!' },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <p className="text-teal-300 font-bold tracking-wide text-sm mb-2 uppercase">Client Success</p>
          <h2 className="font-display font-bold text-4xl text-white tracking-tight">Trusted by Thousands</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 hover:bg-white/15 transition-colors shadow-xl">
              <div className="flex gap-1 mb-6">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-5 h-5 text-warning fill-current" />
                ))}
              </div>
              <p className="text-white/90 text-base leading-relaxed mb-8 font-medium">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30" />
                <div>
                  <div className="font-display font-bold text-white text-base">{t.name}</div>
                  <div className="text-sm text-white/60 flex items-center gap-1.5 mt-0.5"><MapPin className="w-3.5 h-3.5" />{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
