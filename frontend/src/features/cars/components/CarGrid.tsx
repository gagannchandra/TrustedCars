import CarCard from '../../../components/cars/CarCard';
import type { Car, FilterState } from '../../../types';

interface CarGridProps {
  pageCars: Car[];
  page: number;
  totalPages: number;
  handleFilterChange: (key: keyof FilterState, value: FilterState[keyof FilterState]) => void;
  resetFilters: () => void;
  isLoading?: boolean;
}

export default function CarGrid({ pageCars, page, totalPages, handleFilterChange, resetFilters, isLoading }: CarGridProps) {
  return (
    <div className="flex-1 min-w-0">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm">
          <div className="w-12 h-12 border-4 border-[#E2E8F0] border-t-[#0B3A6E] rounded-full animate-spin mb-4"></div>
          <p className="text-[#64748B] font-bold animate-pulse">Loading premium vehicles...</p>
        </div>
      ) : pageCars.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm">
          <div className="text-6xl mb-6">🚗</div>
          <h3 className="font-display font-bold text-[#0F172A] text-2xl mb-2 tracking-tight">No vehicles found</h3>
          <p className="text-[#64748B] font-medium text-base mb-8">Try adjusting your filters to see more results from our inventory</p>
          <button onClick={resetFilters} className="bg-[#0B3A6E] text-white px-8 py-3.5 rounded-full font-bold hover:bg-[#082A4F] transition-colors shadow-lg">
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {pageCars.map((car, index) => <CarCard key={car.id} car={car} index={index} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button disabled={page <= 1} onClick={() => handleFilterChange('page', page - 1)}
                className="px-5 py-2.5 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all bg-slate-50">
                Previous
              </button>
              <div className="flex gap-1.5 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => handleFilterChange('page', p)}
                    className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${p === page ? 'bg-primary text-white shadow-md shadow-primary/30' : 'border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 bg-slate-50'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <button disabled={page >= totalPages} onClick={() => handleFilterChange('page', page + 1)}
                className="px-5 py-2.5 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all bg-slate-50">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
