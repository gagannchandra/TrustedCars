import { SlidersHorizontal } from 'lucide-react';
import { MAKES, CITIES } from '../../../data/mockData';
import { FilterState, FuelType, Transmission, BodyType } from '../../../types';

const FUEL_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'cng', label: 'CNG' },
  { value: 'hybrid', label: 'Hybrid' },
];

const BODY_OPTIONS = [
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'mpv', label: 'MPV' },
  { value: 'coupe', label: 'Coupe' },
  { value: 'pickup', label: 'Pickup' },
];

interface CarFiltersProps {
  filters: FilterState;
  onChange: (key: keyof FilterState, value: FilterState[keyof FilterState]) => void;
  onReset: () => void;
}

export default function CarFilters({ filters, onChange, onReset }: CarFiltersProps) {
  const activeCount = Object.entries(filters).filter(([k, v]) => k !== 'sort' && k !== 'page' && v !== undefined && v !== '').length;

  return (
    <aside className="w-72 shrink-0">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sticky top-24">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2 tracking-tight">
            <SlidersHorizontal className="w-5 h-5 text-primary" /> Filters
            {activeCount > 0 && <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{activeCount}</span>}
          </h3>
          {activeCount > 0 && (
            <button onClick={onReset} className="text-xs text-error hover:text-red-600 font-bold uppercase tracking-wide">Reset all</button>
          )}
        </div>

        <div className="space-y-6">
          {/* Budget */}
          <div>
            <label className="text-sm font-bold text-slate-900 block mb-3">Budget Range</label>
            <div className="flex gap-3">
              <input type="number" placeholder="Min ₹" value={filters.price_min ?? ''} onChange={e => onChange('price_min', e.target.value ? Number(e.target.value) : undefined)}
                className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 focus:bg-white" />
              <input type="number" placeholder="Max ₹" value={filters.price_max ?? ''} onChange={e => onChange('price_max', e.target.value ? Number(e.target.value) : undefined)}
                className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 focus:bg-white" />
            </div>
          </div>

          {/* Make */}
          <div>
            <label className="text-sm font-bold text-slate-900 block mb-3">Make</label>
            <select value={filters.make || ''} onChange={e => onChange('make', e.target.value || undefined)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 focus:bg-white cursor-pointer">
              <option value="">All Makes</option>
              {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="text-sm font-bold text-slate-900 block mb-3">Manufacturing Year</label>
            <div className="flex gap-3">
              <input type="number" placeholder="From" min={2010} max={new Date().getFullYear()} value={filters.year_min ?? ''} onChange={e => onChange('year_min', e.target.value ? Number(e.target.value) : undefined)}
                className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 focus:bg-white" />
              <input type="number" placeholder="To" min={2010} max={new Date().getFullYear()} value={filters.year_max ?? ''} onChange={e => onChange('year_max', e.target.value ? Number(e.target.value) : undefined)}
                className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 focus:bg-white" />
            </div>
          </div>

          {/* Fuel Type */}
          <div>
            <label className="text-sm font-bold text-slate-900 block mb-3">Fuel Type</label>
            <div className="flex flex-wrap gap-2">
              {FUEL_OPTIONS.map(f => (
                <button key={f.value} onClick={() => onChange('fuel_type', f.value as FuelType || undefined)}
                  className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${filters.fuel_type === f.value || (!filters.fuel_type && !f.value) ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 bg-white'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transmission */}
          <div>
            <label className="text-sm font-bold text-slate-900 block mb-3">Transmission</label>
            <div className="flex gap-2">
              {[{ v: undefined, l: 'Any' }, { v: 'manual', l: 'Manual' }, { v: 'automatic', l: 'Automatic' }].map(t => (
                <button key={t.l} onClick={() => onChange('transmission', t.v as Transmission)}
                  className={`flex-1 text-xs font-bold py-2.5 rounded-xl border transition-all ${filters.transmission === t.v ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 bg-white'}`}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          {/* KM Driven */}
          <div>
            <label className="text-sm font-bold text-slate-900 block mb-3">Max KM Driven</label>
            <select value={filters.km_max ?? ''} onChange={e => onChange('km_max', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 focus:bg-white cursor-pointer">
              <option value="">Any</option>
              <option value="30000">Under 30,000 km</option>
              <option value="50000">Under 50,000 km</option>
              <option value="80000">Under 80,000 km</option>
              <option value="120000">Under 1,20,000 km</option>
            </select>
          </div>

          {/* Body Type */}
          <div>
            <label className="text-sm font-bold text-slate-900 block mb-3">Body Type</label>
            <div className="grid grid-cols-2 gap-2">
              {BODY_OPTIONS.map(b => (
                <button key={b.value} onClick={() => onChange('body_type', filters.body_type === b.value as BodyType ? undefined : b.value as BodyType)}
                  className={`text-xs font-bold py-2.5 rounded-xl border transition-all ${filters.body_type === b.value ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 bg-white'}`}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ownership */}
          <div>
            <label className="text-sm font-bold text-slate-900 block mb-3">Ownership</label>
            <div className="flex gap-2">
              {[{ v: 1, l: '1st Owner' }, { v: 2, l: '2nd Owner' }, { v: 3, l: '3rd+' }].map(o => (
                <button key={o.l} onClick={() => onChange('ownership', filters.ownership === o.v ? undefined : o.v)}
                  className={`flex-1 text-xs font-bold py-2.5 rounded-xl border transition-all ${filters.ownership === o.v ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 bg-white'}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {/* City */}
          <div>
            <label className="text-sm font-bold text-slate-900 block mb-3">City</label>
            <select value={filters.city || ''} onChange={e => onChange('city', e.target.value || undefined)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 focus:bg-white cursor-pointer">
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}
