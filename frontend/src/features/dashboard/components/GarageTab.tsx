import { Link } from 'react-router-dom';
import { Car, Plus, Eye, Heart, Edit, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Car as CarType } from '../../../types';
import { formatPrice, formatOdometer } from '../../../shared/utils/utils';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  active: { label: 'Active', icon: <CheckCircle className="w-3.5 h-3.5" />, className: 'bg-success/10 text-success border border-success/20' },
  pending: { label: 'Pending', icon: <Clock className="w-3.5 h-3.5" />, className: 'bg-warning/10 text-warning border border-warning/20' },
  sold: { label: 'Sold', icon: <CheckCircle className="w-3.5 h-3.5" />, className: 'bg-primary/10 text-primary border border-primary/20' },
  rejected: { label: 'Rejected', icon: <XCircle className="w-3.5 h-3.5" />, className: 'bg-error/10 text-error border border-error/20' },
  archived: { label: 'Archived', icon: <XCircle className="w-3.5 h-3.5" />, className: 'bg-slate-100 text-slate-600 border border-slate-200' },
};

interface GarageTabProps {
  myCars: CarType[];
}

export default function GarageTab({ myCars }: GarageTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">My Garage</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your active and pending listings</p>
        </div>
        <Link to="/sell" className="flex items-center gap-2 bg-success text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-green-600 transition-colors hover:-translate-y-0.5">
          <Plus className="w-5 h-5" /> Add Vehicle
        </Link>
      </div>
      
      {myCars.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Car className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-900 mb-2">No vehicles listed yet</h3>
          <p className="text-slate-500 font-medium mb-8">Sell your car to millions of buyers on TrustedCars.</p>
          <Link to="/sell" className="inline-block bg-primary text-white px-8 py-3.5 rounded-full font-bold shadow-md hover:bg-blue-800 transition-all">List a Vehicle</Link>
        </div>
      ) : (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs">Vehicle</th>
                  <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs hidden md:table-cell">Status</th>
                  <th className="text-right px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs hidden sm:table-cell">Engagement</th>
                  <th className="text-right px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs">Price</th>
                  <th className="text-right px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {myCars.map(car => {
                  const statusConfig = STATUS_CONFIG[car.status] || STATUS_CONFIG['pending'];
                  return (
                    <tr key={car.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img src={car.images?.[0]?.url} alt="" className="w-16 h-12 rounded-lg object-cover bg-slate-100 shadow-sm hidden sm:block" />
                          <div>
                            <div className="font-bold text-slate-900 text-base">{car.year} {car.make} {car.model}</div>
                            <div className="text-xs font-medium text-slate-500 mt-0.5">{formatOdometer(car.odometer_km)} · {car.city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${statusConfig.className}`}>
                          {statusConfig.icon}{statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right hidden sm:table-cell">
                        <div className="flex items-center justify-end gap-1.5 text-slate-700 font-bold">
                          <Eye className="w-4 h-4 text-slate-400" />{(car.view_count || 0).toLocaleString()}
                        </div>
                        <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500 font-medium mt-1">
                          <Heart className="w-3.5 h-3.5 text-error/70" />{car.wishlist_count} saves
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-display font-bold text-lg text-slate-900">
                        {formatPrice(car.asking_price)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/cars/${car.id}`} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <Eye className="w-5 h-5" />
                          </Link>
                          <button onClick={() => toast.success('Editing functionality coming soon!')} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <Edit className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
