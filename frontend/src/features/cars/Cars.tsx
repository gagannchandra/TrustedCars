import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown, Search, ArrowUpDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { carsApi } from '../../shared/api/client';
import { FilterState, FuelType, Transmission, BodyType } from '../../types';
import CarFilters from './components/CarFilters';
import CarGrid from './components/CarGrid';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Year: Newest First' },
  { value: 'km_asc', label: 'KM: Lowest First' },
];

export default function Cars() {
  const [searchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>(() => ({
    q: searchParams.get('q') || undefined,
    make: searchParams.get('make') || undefined,
    model: searchParams.get('model') || undefined,
    city: searchParams.get('city') || undefined,
    fuel_type: searchParams.get('fuel_type') as FuelType || undefined,
    transmission: searchParams.get('transmission') as Transmission || undefined,
    body_type: searchParams.get('body_type') as BodyType || undefined,
    price_min: searchParams.get('price_min') ? Number(searchParams.get('price_min')) : undefined,
    price_max: searchParams.get('price_max') ? Number(searchParams.get('price_max')) : undefined,
    km_max: searchParams.get('km_max') ? Number(searchParams.get('km_max')) : undefined,
    ownership: searchParams.get('ownership') ? Number(searchParams.get('ownership')) : undefined,
    sort: searchParams.get('sort') || 'newest',
    page: 1,
  }));

  const [searchInput, setSearchInput] = useState(filters.q || '');

  const { data: response = { items: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['cars', filters],
    queryFn: () => carsApi.getCars(filters)
  });

  const filteredCars = response.items;
  const PAGE_SIZE = 12;
  const page = filters.page || 1;
  const totalPages = Math.ceil(response.total / PAGE_SIZE);
  const pageCars = filteredCars; // No longer slice client-side

  const handleFilterChange = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
    if (key === 'page') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetFilters = () => {
    setFilters({ sort: 'newest', page: 1 });
    setSearchInput('');
  };

  const activeChips = Object.entries(filters).filter(([k, v]) => !['sort', 'page', 'q'].includes(k) && v !== undefined && v !== '');

  const removeFilter = (key: keyof FilterState) => {
    setFilters(prev => { const n = { ...prev }; delete n[key]; return { ...n, page: 1 }; });
  };

  const LABELS: Record<string, (v: string | number) => string> = {
    make: v => `Make: ${v}`,
    model: v => `Model: ${v}`,
    city: v => `City: ${v}`,
    fuel_type: v => `Fuel: ${v}`,
    transmission: v => `Trans: ${v}`,
    body_type: v => `Body: ${v}`,
    price_min: v => `Min: ₹${Number(v).toLocaleString('en-IN')}`,
    price_max: v => `Max: ₹${Number(v).toLocaleString('en-IN')}`,
    km_max: v => `KM < ${Number(v).toLocaleString('en-IN')}`,
    year_min: v => `Year ≥ ${v}`,
    year_max: v => `Year ≤ ${v}`,
    ownership: v => `${v === 1 ? '1st' : v === 2 ? '2nd' : '3rd+'} Owner`,
  };

  return (
    <div className="min-h-screen bg-surface pt-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">Explore Inventory <span className="text-slate-400 font-medium text-lg ml-2">{response.total} vehicles</span></h1>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search make, model..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFilterChange('q', searchInput || undefined)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 rounded-full outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-slate-50 focus:bg-white transition-all shadow-sm"
                />
              </div>

              {/* Sort */}
              <div className="relative shrink-0">
                <select value={filters.sort || 'newest'} onChange={e => handleFilterChange('sort', e.target.value)}
                  className="appearance-none pl-10 pr-10 py-2.5 text-sm font-bold border border-slate-200 rounded-full outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white cursor-pointer shadow-sm hover:bg-slate-50 transition-colors">
                  {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>

              {/* Mobile Filter */}
              <button onClick={() => setDrawerOpen(true)} className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-full text-sm font-bold bg-white shadow-sm hover:bg-slate-50">
                <SlidersHorizontal className="w-4 h-4 text-primary" /> Filters
              </button>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mr-2">Active Filters:</span>
              {activeChips.map(([key, value]) => (
                <button key={key} onClick={() => removeFilter(key as keyof FilterState)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
                  {LABELS[key]?.(value as string | number) || `${key}: ${value}`}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
              <button onClick={resetFilters} className="text-xs font-bold text-error hover:text-red-700 px-3 uppercase tracking-wide">Clear all</button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <CarFilters filters={filters} onChange={handleFilterChange} onReset={resetFilters} />
          </div>

          <CarGrid pageCars={pageCars} page={page} totalPages={totalPages} handleFilterChange={handleFilterChange} resetFilters={resetFilters} isLoading={isLoading} />
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[320px] bg-white overflow-y-auto p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-xl text-slate-900">Filters</h3>
              <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <CarFilters filters={filters} onChange={handleFilterChange} onReset={() => { resetFilters(); setDrawerOpen(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}
