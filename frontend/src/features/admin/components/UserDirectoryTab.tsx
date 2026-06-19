import { Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '../../../types';

interface UserDirectoryTabProps {
  filteredUsers: User[];
  bannedUsers: string[];
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  setBannedUsers: React.Dispatch<React.SetStateAction<string[]>>;
  roleConfig: Record<string, { className: string; label: string }>;
}

export default function UserDirectoryTab({ filteredUsers, bannedUsers, search, setSearch, setBannedUsers, roleConfig }: UserDirectoryTabProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">User Directory</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage accounts and platform access</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search name, email..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white transition-all shadow-sm" />
        </div>
      </div>
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs">Account</th>
                <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs">Role</th>
                <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs hidden md:table-cell">Location</th>
                <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs hidden md:table-cell">Status</th>
                <th className="text-right px-6 py-4 font-bold text-slate-500 uppercase tracking-wide text-xs">Security Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => {
                const isBanned = bannedUsers.includes(u.id);
                const config = roleConfig[u.role] || { className: 'bg-slate-100 text-slate-700 border border-slate-200', label: 'User' };
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm" />
                        <div>
                          <div className="font-bold text-slate-900">{u.full_name}</div>
                          <div className="text-xs font-medium text-slate-500 mt-0.5">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${config.className}`}>{config.label}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium hidden md:table-cell">{u.city || '—'}</td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${isBanned ? 'bg-error/10 text-error' : u.is_verified ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>
                        {isBanned ? <XCircle className="w-3.5 h-3.5" /> : u.is_verified ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {isBanned ? 'Banned' : u.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'admin' ? (
                        <button onClick={() => { setBannedUsers(prev => isBanned ? prev.filter(id => id !== u.id) : [...prev, u.id]); toast(isBanned ? 'User restored.' : 'User suspended.', { icon: isBanned ? '✅' : '🚫' }); }}
                          className={`text-xs px-4 py-2 rounded-xl font-bold uppercase tracking-wider transition-all shadow-sm ${isBanned ? 'bg-success hover:bg-green-600 text-white' : 'bg-white border-2 border-error text-error hover:bg-error hover:text-white'}`}>
                          {isBanned ? 'Restore Access' : 'Suspend'}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Protected</span>
                      )}
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
