import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Car } from '../../../types';
import { formatPrice } from '../../../shared/utils/utils';

interface WishlistTabProps {
  wishlistCars: Car[];
}

export default function WishlistTab({ wishlistCars }: WishlistTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Saved Vehicles</h2>
        <span className="text-sm font-bold text-slate-500">{wishlistCars.length} items</span>
      </div>
      {wishlistCars.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-900 mb-2">Your wishlist is empty</h3>
          <p className="text-slate-500 font-medium mb-8">Explore our premium inventory and save the vehicles you love.</p>
          <Link to="/cars" className="inline-block bg-primary text-white px-8 py-3.5 rounded-full font-bold shadow-md hover:bg-blue-800 transition-all">Explore Inventory</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {wishlistCars.map(car => (
            <div key={car.id} className="relative group">
              <Link to={`/cars/${car.id}`}>
                <img src={car.images?.[0]?.url} alt="" className="w-full h-48 object-cover rounded-[24px] shadow-sm mb-4" />
                <h3 className="font-bold text-slate-900">{car.year} {car.make} {car.model}</h3>
                <p className="text-primary font-bold">{formatPrice(car.asking_price)}</p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
