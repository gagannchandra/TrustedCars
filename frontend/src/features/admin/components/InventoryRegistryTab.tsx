import { Link } from 'react-router-dom';
import { Search, Eye, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Car } from '../../../types';
import { formatPrice } from '../../../shared/utils/utils';

interface InventoryRegistryTabProps {
  filteredCars: Car[];
  approvedCars: string[];
  rejectedCars: string[];
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  setApprovedCars: React.Dispatch<React.SetStateAction<string[]>>;
  setRejectedCars: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function InventoryRegistryTab({ filteredCars, approvedCars, rejectedCars, search, setSearch, setApprovedCars, setRejectedCars }: InventoryRegistryTabProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Inventory Registry</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Master list of all vehicles on the platform</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search make, model, ID..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white transition-all shadow-sm" />
        </div>
      </div>
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs">Vehicle</th>
                <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs">Seller</th>
                <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs">Status</th>
                <th className="text-right px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs">Valuation</th>
                <th className="text-right px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCars.map(car => {
                const isApproved = approvedCars.includes(car.id);
                const isRejected = rejectedCars.includes(car.id);
                const statusLabel = isApproved ? 'Active' : isRejected ? 'Rejected' : car.status.charAt(0).toUpperCase() + car.status.slice(1);
                const statusClass = isApproved ? 'bg-success/10 text-success border border-success/20' : isRejected ? 'bg-error/10 text-error border border-error/20' : car.status === 'active' ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20';
                
                return (
                  <tr key={car.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 shadow-sm border border-slate-200">
                          <img src={car.images?.[0]?.url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-base">{car.year} {car.make} {car.model}</div>
                          <div className="text-xs font-medium text-slate-500 mt-0.5">{car.id.toUpperCase()} · {car.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{car.seller?.full_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${statusClass}`}>{statusLabel}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-display font-bold text-base text-slate-900">
                      {formatPrice(car.asking_price)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/cars/${car.id}`} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View Listing">
                          <Eye className="w-5 h-5" />
                        </Link>
                        {!isApproved && !isRejected && car.status !== 'active' && (
                          <>
                            <button onClick={() => { setApprovedCars(prev => [...prev, car.id]); toast.success('Approved'); }} className="p-2 text-slate-400 hover:text-success hover:bg-success/10 rounded-lg transition-colors" title="Quick Approve">
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button onClick={() => { setRejectedCars(prev => [...prev, car.id]); toast.error('Rejected'); }} className="p-2 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors" title="Quick Reject">
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
