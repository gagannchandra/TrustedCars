import { ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { carsApi } from '../../../shared/api/client';
import CarCard from '../../../components/cars/CarCard';

export default function FeaturedCars() {
  const navigate = useNavigate();
  const { data: featuredCars = [], isLoading } = useQuery({
    queryKey: ['featuredCars'],
    queryFn: carsApi.getFeaturedCars
  });

  if (isLoading) {
    return (
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-primary font-bold tracking-wide text-sm mb-2 uppercase">Handpicked for You</p>
            <h2 className="font-display font-bold text-4xl text-slate-900 tracking-tight">Featured Collection</h2>
          </div>
          <button onClick={() => navigate('/cars')} className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-blue-800 transition-colors bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200">
            View Inventory <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCars.map((car, index) => (
            <div key={car.id} className="transform hover:-translate-y-1 transition-all duration-300">
              <CarCard car={car} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
