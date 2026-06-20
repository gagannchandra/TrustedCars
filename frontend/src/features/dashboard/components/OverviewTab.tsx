import { Heart, Car, MessageSquare, Eye } from 'lucide-react';
import type { Car as CarType, Inquiry } from '../../../types';



interface OverviewTabProps {
  wishlistCars: CarType[];
  myCars: CarType[];
  sentInquiries: Inquiry[];
  receivedInquiries: Inquiry[];
}

export default function OverviewTab({ wishlistCars, myCars, sentInquiries, receivedInquiries }: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Saved Vehicles', value: wishlistCars.length, icon: Heart, bg: 'bg-error/10', color: 'text-error' },
          { label: 'Active Listings', value: myCars.filter(c => c.status === 'active').length, icon: Car, bg: 'bg-success/10', color: 'text-success' },
          { label: 'Total Inquiries', value: sentInquiries.length + receivedInquiries.length, icon: MessageSquare, bg: 'bg-warning/10', color: 'text-warning' },
          { label: 'Total Views', value: myCars.reduce((sum, c) => sum + (c.view_count || 0), 0).toLocaleString(), icon: Eye, bg: 'bg-indigo-100', color: 'text-indigo-600' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="font-display font-bold text-3xl text-slate-900 tracking-tight">{stat.value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Portfolio Performance (if they have cars) */}
      {myCars.length > 0 && (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900 tracking-tight">Listing Views</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Total views across your garage this week</p>
            </div>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 border-dashed">
            <div className="text-center">
              <Eye className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700">Analytics Coming Soon</h4>
              <p className="text-sm font-medium text-slate-500 mt-1">We are building detailed view tracking for your garage.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
