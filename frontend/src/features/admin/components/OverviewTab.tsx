import { AlertTriangle, Car, CheckCircle, Clock, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Car as CarType } from '../../../types';

const MONTHLY_DATA = [
  { month: 'Aug', listed: 45, sold: 32 },
  { month: 'Sep', listed: 52, sold: 38 },
  { month: 'Oct', listed: 61, sold: 44 },
  { month: 'Nov', listed: 78, sold: 56 },
  { month: 'Dec', listed: 89, sold: 67 },
  { month: 'Jan', listed: 95, sold: 71 },
];

interface OverviewTabProps {
  pendingCars: CarType[];
  stats: {
    total: number;
    active: number;
    pending: number;
    users: number;
    soldToday: number;
    totalRevenue: string;
  };
  setTab: (tab: any) => void;
}

export default function OverviewTab({ pendingCars, stats, setTab }: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Pending Alert */}
      {pendingCars.length > 0 && (
        <div className="bg-white border border-warning/30 rounded-[24px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-2 bg-warning"></div>
          <div className="flex items-center gap-4 pl-2">
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Action Required</h3>
              <p className="text-sm font-medium text-slate-600">There are <strong className="text-slate-900">{pendingCars.length} vehicle listings</strong> awaiting quality inspection and approval.</p>
            </div>
          </div>
          <button onClick={() => setTab('pending')} className="shrink-0 bg-warning text-white hover:bg-yellow-600 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
            Review Submissions
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Total Inventory', value: stats.total, icon: Car, bg: 'bg-primary/10', color: 'text-primary' },
          { label: 'Active Listings', value: stats.active, icon: CheckCircle, bg: 'bg-success/10', color: 'text-success' },
          { label: 'Pending Review', value: stats.pending, icon: Clock, bg: 'bg-warning/10', color: 'text-warning' },
          { label: 'Registered Users', value: stats.users, icon: Users, bg: 'bg-indigo-100', color: 'text-indigo-600' },
          { label: 'Transactions Today', value: stats.soldToday, icon: TrendingUp, bg: 'bg-teal-100', color: 'text-teal-600' },
          { label: 'Total Gross Value', value: stats.totalRevenue, icon: BarChart3, bg: 'bg-slate-100', color: 'text-slate-600' },
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

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8">
        <div className="mb-8">
          <h3 className="font-display font-bold text-xl text-slate-900 tracking-tight">Platform Performance Analytics</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Listing volume vs Completed transactions over 6 months</p>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
              <Bar dataKey="listed" name="New Listings" fill="#0F4C81" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="sold" name="Completed Sales" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
