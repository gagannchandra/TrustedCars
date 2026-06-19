import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Users, Clock, BarChart3, Settings, ShieldAlert, Shield, Eye, LogOut, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { carsApi, usersApi } from '../../shared/api/client';

import OverviewTab from './components/OverviewTab';
import PendingReviewsTab from './components/PendingReviewsTab';
import InventoryRegistryTab from './components/InventoryRegistryTab';
import UserDirectoryTab from './components/UserDirectoryTab';
import SystemSettingsTab from './components/SystemSettingsTab';

type Tab = 'overview' | 'pending' | 'listings' | 'users' | 'settings';

const ROLE_CONFIG: Record<string, { className: string; label: string }> = {
  admin: { className: 'bg-error/10 text-error border border-error/20', label: 'Administrator' },
  seller: { className: 'bg-success/10 text-success border border-success/20', label: 'Enterprise Seller' },
  buyer: { className: 'bg-primary/10 text-primary border border-primary/20', label: 'Verified Buyer' },
  user: { className: 'bg-slate-100 text-slate-700 border border-slate-200', label: 'Standard User' },
};

export default function AdminPanel() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [approvedCars, setApprovedCars] = useState<string[]>([]);
  const [rejectedCars, setRejectedCars] = useState<string[]>([]);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);

  const { data: allCars = [], isLoading: loadingCars } = useQuery({ queryKey: ['adminAllCars'], queryFn: carsApi.getAllCarsAdmin, enabled: isAuthenticated && user?.role === 'admin' });
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({ queryKey: ['adminAllUsers'], queryFn: usersApi.getAllUsers, enabled: isAuthenticated && user?.role === 'admin' });

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center bg-white p-12 rounded-[32px] shadow-2xl border border-slate-100 max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-error via-red-500 to-orange-500" />
          <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-error/20">
            <ShieldAlert className="w-10 h-10 text-error" />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-2 tracking-tight">Restricted Access</h2>
          <p className="text-slate-500 font-medium mb-8 text-sm">Enterprise System Administration requires elevated privileges. Use admin credentials.</p>
          <div className="bg-slate-50 p-4 rounded-xl text-xs font-mono text-slate-500 mb-8 border border-slate-200">
            admin@trustedcars.in / Admin@123
          </div>
          <button onClick={() => navigate('/login')} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors shadow-md">Authenticate as Admin</button>
        </div>
      </div>
    );
  }

  if (loadingCars || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface pt-16">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const pendingCars = allCars.filter(c => !approvedCars.includes(c.id) && !rejectedCars.includes(c.id) && (c.status === 'pending' || c.id === 'c1'));
  const activeCars = allCars.filter(c => c.status === 'active' && approvedCars.includes(c.id) || (c.status === 'active' && !rejectedCars.includes(c.id)));
  const filteredCars = allCars.filter(c => c.make.toLowerCase().includes(search.toLowerCase()) || c.model.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()));
  const filteredUsers = allUsers.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: allCars.length,
    active: activeCars.length,
    pending: pendingCars.length,
    users: allUsers.length,
    soldToday: 3,
    totalRevenue: '₹2.4 Cr',
  };

  const TABS = [
    { id: 'overview' as Tab, label: 'Control Center', icon: BarChart3 },
    { id: 'pending' as Tab, label: `Pending Reviews (${pendingCars.length})`, icon: Clock },
    { id: 'listings' as Tab, label: `Inventory Registry (${allCars.length})`, icon: Car },
    { id: 'users' as Tab, label: `User Directory (${allUsers.length})`, icon: Users },
    { id: 'settings' as Tab, label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-surface pt-16">
      {/* Header */}
      <div className="bg-slate-900 text-white pt-10 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=80')] opacity-10 mix-blend-overlay object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Shield className="w-8 h-8 text-primary" />
                <h1 className="font-display font-bold text-3xl tracking-tight">Enterprise Operations</h1>
              </div>
              <p className="text-slate-400 font-medium text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> System Online • Superadmin: {user?.full_name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all border border-white/10 backdrop-blur-sm">
                <Eye className="w-4 h-4" /> View Portal
              </Link>
              <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 bg-error/20 hover:bg-error/40 text-red-100 text-sm font-bold px-5 py-2.5 rounded-xl transition-all border border-error/30 backdrop-blur-sm">
                <LogOut className="w-4 h-4" /> Terminate Session
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <nav className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="p-4 space-y-1">
                {TABS.map(t => {
                  const Icon = t.icon;
                  const isActive = tab === t.id;
                  return (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={`w-full flex items-center text-left gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tab === 'overview' && <OverviewTab pendingCars={pendingCars} stats={stats} setTab={setTab} />}
            {tab === 'pending' && <PendingReviewsTab pendingCars={pendingCars} setApprovedCars={setApprovedCars} setRejectedCars={setRejectedCars} />}
            {tab === 'listings' && <InventoryRegistryTab filteredCars={filteredCars} approvedCars={approvedCars} rejectedCars={rejectedCars} search={search} setSearch={setSearch} setApprovedCars={setApprovedCars} setRejectedCars={setRejectedCars} />}
            {tab === 'users' && <UserDirectoryTab filteredUsers={filteredUsers} bannedUsers={bannedUsers} search={search} setSearch={setSearch} setBannedUsers={setBannedUsers} roleConfig={ROLE_CONFIG} />}
            {tab === 'settings' && <SystemSettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
