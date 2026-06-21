import { useQuery } from '@tanstack/react-query';
import { carsApi } from '../../../shared/api/client';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Car, Plus, ExternalLink, Calendar, MapPin, Edit, Trash2 } from 'lucide-react';

export default function SellerListings() {
  const queryClient = useQueryClient();
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        await carsApi.deleteCar(id);
        toast.success("Listing deleted successfully");
        queryClient.invalidateQueries({ queryKey: ['myCars'] });
      } catch (err) {
        toast.error("Failed to delete listing");
      }
    }
  };

  const { data: myCars = [], isLoading } = useQuery({
    queryKey: ['myCars'],
    queryFn: carsApi.getMyCars,
  });

  return (
    <div className="min-h-screen bg-surface pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">My Listings</h1>
            <p className="text-slate-500 font-medium mt-1">Manage your active and sold vehicles</p>
          </div>
          <Link to="/sell" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-blue-800 transition-colors">
            <Plus className="w-4 h-4" /> Add New Vehicle
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : myCars.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="font-display font-bold text-2xl text-slate-900 mb-2">No Listings Yet</h2>
            <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">You haven't listed any vehicles for sale yet. Start your journey by creating your first listing.</p>
            <Link to="/sell" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-800 transition-colors">
              <Plus className="w-5 h-5" /> Create Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCars.map(car => (
              <div key={car.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group">
                <div className="aspect-[16/9] bg-slate-100 relative">
                  {car.status === 'sold' && (
                    <div className="absolute inset-0 bg-slate-900/60 z-10 flex items-center justify-center">
                      <span className="bg-white text-slate-900 px-4 py-1.5 rounded-full font-bold text-sm tracking-wide">SOLD</span>
                    </div>
                  )}
                  {car.images?.[0] ? (
                    <img src={car.images[0].url} alt={car.model} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">
                      {car.year} {car.make} {car.model}
                    </h3>
                    <span className="font-bold text-primary">₹{(car.asking_price / 100000).toFixed(2)}L</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Calendar className="w-4 h-4 text-slate-400" /> {car.year}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="w-4 h-4 text-slate-400" /> {car.city}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                    <Link to={`/cars/${car.id}`} className="flex-1 inline-flex justify-center items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                      <ExternalLink className="w-4 h-4" /> View
                    </Link>
                    <Link to={`/sell/edit/${car.id}`} className="flex-1 inline-flex justify-center items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                      <Edit className="w-4 h-4" /> Edit
                    </Link>
                    <button onClick={() => handleDelete(car.id)} className="inline-flex justify-center items-center px-4 py-2 border border-error/20 bg-error/5 rounded-lg text-sm font-bold text-error hover:bg-error/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
