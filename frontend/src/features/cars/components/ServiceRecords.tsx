import { MapPin, Gauge, Settings } from 'lucide-react';
import type { ServiceRecord } from '../../../types';

interface ServiceRecordsProps {
  records: ServiceRecord[];
}

export default function ServiceRecords({ records }: ServiceRecordsProps) {
  if (!records || records.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
      <h2 className="font-display font-bold text-2xl text-slate-900 mb-8 tracking-tight">Maintenance History</h2>
      <div className="relative pl-4">
        <div className="absolute left-9 top-4 bottom-4 w-0.5 bg-slate-200 rounded-full" />
        <div className="space-y-6">
          {records.map((svc) => (
            <div key={svc.id} className="flex gap-6 relative">
              <div className="w-11 h-11 rounded-full bg-primary/10 border-4 border-white flex items-center justify-center shrink-0 z-10 shadow-sm mt-1">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 flex-1 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-base text-slate-900">{svc.service_type}</span>
                  <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {new Date(svc.service_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {svc.service_center} 
                  <span className="mx-2 text-slate-300">|</span> 
                  <Gauge className="w-4 h-4" /> {svc.odometer_at_service?.toLocaleString('en-IN')} km
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
