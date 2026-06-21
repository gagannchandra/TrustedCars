import { Search, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../shared/api/client';

export default function DealerRegistryTab({ allDealers, search, setSearch }: any) {
  const queryClient = useQueryClient();

  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminApi.suspendDealer(id, 'Suspended via admin panel'),
    onSuccess: () => {
      toast.success('Dealer suspended.');
      queryClient.invalidateQueries({ queryKey: ['adminAllDealers'] });
      // Invalidate cars as well since their inventory gets hidden
      queryClient.invalidateQueries({ queryKey: ['adminAllCars'] });
    },
    onError: () => toast.error('Failed to suspend dealer')
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => adminApi.restoreDealer(id),
    onSuccess: () => {
      toast.success('Dealer restored.');
      queryClient.invalidateQueries({ queryKey: ['adminAllDealers'] });
      queryClient.invalidateQueries({ queryKey: ['adminAllCars'] });
    },
    onError: () => toast.error('Failed to restore dealer')
  });

  const filteredDealers = allDealers.filter((d: any) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Dealer Network</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage dealership accounts and their aggregated inventory</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search dealership name..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white transition-all shadow-sm" />
        </div>
      </div>
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs">Dealership</th>
                <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs hidden md:table-cell">Status</th>
                <th className="text-right px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDealers.map((d: any) => {
                const isBanned = !!d.is_suspended;
                return (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <div className="text-xs font-medium text-slate-500 mt-0.5">{d.id}</div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${isBanned ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                        {isBanned ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {isBanned ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        disabled={suspendMutation.isPending || restoreMutation.isPending}
                        onClick={() => isBanned ? restoreMutation.mutate(d.id) : suspendMutation.mutate(d.id)}
                        className={`text-xs px-4 py-2 rounded-xl font-bold uppercase tracking-wider transition-all shadow-sm disabled:opacity-50 ${isBanned ? 'bg-success hover:bg-green-600 text-white' : 'bg-white border-2 border-error text-error hover:bg-error hover:text-white'}`}>
                        {isBanned ? 'Restore Access' : 'Suspend'}
                      </button>
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
