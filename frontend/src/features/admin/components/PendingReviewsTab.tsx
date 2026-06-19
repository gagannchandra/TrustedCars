import { Link } from 'react-router-dom';
import { CheckCircle, Eye, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Car } from '../../../types';
import { formatPrice, formatOdometer, getQualityBadgeConfig, timeAgo } from '../../../shared/utils/utils';

interface PendingReviewsTabProps {
  pendingCars: Car[];
  setApprovedCars: React.Dispatch<React.SetStateAction<string[]>>;
  setRejectedCars: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function PendingReviewsTab({ pendingCars, setApprovedCars, setRejectedCars }: PendingReviewsTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Quality Control Queue</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Review pending listings for compliance before publishing</p>
        </div>
      </div>
      {pendingCars.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-900 mb-2">Queue is empty</h3>
          <p className="text-slate-500 font-medium">All pending listings have been processed.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingCars.map(car => {
            const badge = getQualityBadgeConfig(car.quality_badge);
            return (
              <div key={car.id} className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 transition-all hover:shadow-md">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-64 h-40 rounded-2xl overflow-hidden shrink-0 bg-slate-100 relative">
                    <img src={car.images?.[0]?.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-warning/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      Awaiting QC
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-display font-bold text-2xl text-slate-900 tracking-tight">{car.year} {car.make} {car.model}</h4>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-wider mt-2">
                          <span className="bg-slate-50 px-2 py-1 rounded-md">{formatOdometer(car.odometer_km)}</span>
                          <span className="bg-slate-50 px-2 py-1 rounded-md">{car.city}</span>
                          <span className="bg-slate-50 px-2 py-1 rounded-md">{car.fuel_type}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-2xl text-primary tracking-tight">{formatPrice(car.asking_price)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={car.seller?.avatar_url} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">Seller: {car.seller?.full_name}</p>
                          <p className="text-xs font-medium text-slate-500">Submitted {timeAgo(car.created_at)}</p>
                        </div>
                      </div>
                      {car.inspection_score && (
                        <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${badge.className}`}>
                          QC Score: {car.inspection_score}/10
                        </div>
                      )}
                    </div>

                    <div className="mt-auto flex flex-wrap gap-3">
                      <button onClick={() => { setApprovedCars(prev => [...prev, car.id]); toast.success('Listing approved and published!'); }}
                        className="flex items-center gap-2 text-sm bg-success hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-md hover:-translate-y-0.5">
                        <CheckCircle className="w-4 h-4" /> Approve Listing
                      </button>
                      <button onClick={() => { setRejectedCars(prev => [...prev, car.id]); toast.error('Listing rejected.'); }}
                        className="flex items-center gap-2 text-sm bg-error hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-md hover:-translate-y-0.5">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <Link to={`/cars/${car.id}`} className="flex items-center gap-2 text-sm border-2 border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-50 font-bold transition-colors ml-auto">
                        <Eye className="w-4 h-4" /> Inspect Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
