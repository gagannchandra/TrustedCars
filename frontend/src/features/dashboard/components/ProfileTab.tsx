import { useState } from 'react';
import { Settings, Edit, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function ProfileTab() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({ 
    full_name: user?.full_name || '', 
    phone: user?.phone || '', 
    city: user?.city || '' 
  });

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-8 sm:p-10">
      <div className="flex items-center gap-3 mb-10 border-b border-slate-100 pb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Profile Settings</h2>
          <p className="text-sm font-medium text-slate-500">Manage your account preferences</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-10">
        <div className="relative shrink-0">
          <img src={user?.avatar_url} alt={user?.full_name} className="w-28 h-28 rounded-3xl object-cover shadow-sm border border-slate-100" />
          <button onClick={() => toast.success('Avatar upload dialog opened.')} className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-blue-800 transition-colors border-2 border-white">
            <Edit className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center sm:text-left mt-2">
          <div className="font-display font-bold text-2xl text-slate-900 tracking-tight">{user?.full_name}</div>
          <div className="text-base font-medium text-slate-500 mt-1">{user?.email}</div>
          {user?.rating && (
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 text-sm font-bold bg-amber-50 text-amber-700 w-fit sm:mx-0 mx-auto px-3 py-1.5 rounded-lg">
              <Star className="w-4 h-4 fill-current text-amber-500" />
              <span>{user?.rating}</span>
              <span className="text-amber-600/70">({user?.review_count} ratings)</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 max-w-xl">
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Full Name</label>
          <input value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
            className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Phone Number</label>
          <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Primary City</label>
          <input value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))}
            className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
        </div>
        
        <div className="flex flex-wrap gap-4 pt-4">
          <button onClick={() => toast.success('Profile settings saved successfully!')} className="bg-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-md hover:bg-blue-800 transition-colors hover:-translate-y-0.5">
            Save Changes
          </button>
          <button onClick={() => toast.success('Password reset email sent!')} className="border-2 border-slate-200 bg-white text-slate-700 px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors">
            Update Password
          </button>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-100">
        <button onClick={() => { if(window.confirm('Are you sure you want to delete your account?')) { logout(); navigate('/'); } }} className="flex items-center gap-2 text-sm font-bold text-error hover:text-red-700 bg-error/5 hover:bg-error/10 px-6 py-3 rounded-xl transition-colors uppercase tracking-wide">
          <Trash2 className="w-4 h-4" /> Delete Account
        </button>
      </div>
    </div>
  );
}
