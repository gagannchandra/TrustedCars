import { useNavigate } from 'react-router-dom';

const POPULAR_MAKES = [
  { name: 'Maruti', emoji: '🚗', count: 234 },
  { name: 'Hyundai', emoji: '🚙', count: 189 },
  { name: 'Honda', emoji: '🏎️', count: 145 },
  { name: 'Tata', emoji: '🚘', count: 167 },
  { name: 'Toyota', emoji: '🚐', count: 98 },
  { name: 'Mahindra', emoji: '🛻', count: 112 },
  { name: 'Kia', emoji: '🚗', count: 87 },
  { name: 'MG', emoji: '🚙', count: 54 },
];

export default function PopularBrands() {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-primary font-bold tracking-wide text-sm mb-2 uppercase">Explore Inventory</p>
          <h2 className="font-display font-bold text-4xl text-slate-900 tracking-tight">Popular Brands</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {POPULAR_MAKES.map((make) => (
            <button
              key={make.name}
              onClick={() => navigate(`/cars?make=${make.name}`)}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-slate-100 hover:border-primary hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all group"
            >
              <span className="text-4xl transform group-hover:scale-110 transition-transform">{make.emoji}</span>
              <span className="text-sm font-display font-bold text-slate-900 group-hover:text-primary">{make.name}</span>
              <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{make.count} cars</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
