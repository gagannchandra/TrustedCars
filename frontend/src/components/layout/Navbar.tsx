import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Heart, Menu, X, ChevronDown, Bell, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth';
import { DEFAULT_AVATAR_URL } from '../../shared/utils/utils';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    return '/dashboard';
  };

  const navItemClass = (path: string) => {
    const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
    return `text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-slate-600 hover:text-primary'}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:bg-blue-800 transition-colors shadow-sm">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-slate-900 text-lg leading-none tracking-tight">TrustedCars</span>
              <div className="text-[10px] text-primary/80 leading-none font-medium tracking-wide mt-0.5">Enterprise Marketplace</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {isAuthenticated && (
              <Link to={getDashboardPath()} className={navItemClass(getDashboardPath())}>
                Dashboard
              </Link>
            )}
            <Link to="/cars" className={navItemClass('/cars')}>
              Browse Cars
            </Link>
            <Link to="/sell" className={navItemClass('/sell')}>
              Sell Your Car
            </Link>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard/wishlist" className="relative p-2 text-slate-500 hover:text-primary transition-colors">
                  <Heart className="w-5 h-5" />
                </Link>
                <div className="relative" ref={notificationsRef}>
                  <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative p-2 text-slate-500 hover:text-primary transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border border-white"></span>
                  </button>
                  {notificationsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                        <p className="font-bold text-slate-900 text-sm">Notifications</p>
                        <button onClick={() => { setNotificationsOpen(false); toast.success('All notifications marked as read'); }} className="text-xs text-primary font-bold hover:text-blue-800 transition-colors">Mark all read</button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        <div className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                          <p className="text-sm text-slate-900 font-medium">New inquiry for <span className="font-bold">Honda City 2021</span></p>
                          <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                        </div>
                        <div className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                          <p className="text-sm text-slate-900 font-medium">Your listing <span className="font-bold">Hyundai Creta</span> was approved.</p>
                          <p className="text-xs text-slate-500 mt-1">5 hours ago</p>
                        </div>
                        <div className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                          <p className="text-sm text-slate-900 font-medium">Price drop alert on <span className="font-bold">Toyota Fortuner</span></p>
                          <p className="text-xs text-slate-500 mt-1">1 day ago</p>
                        </div>
                      </div>
                      <div className="px-4 py-2 border-t border-slate-50 text-center">
                        <button onClick={() => { setNotificationsOpen(false); toast('Notification center coming soon!', { icon: '🔔' }); }} className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">View all notifications</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    <img src={user?.avatar_url || DEFAULT_AVATAR_URL} onError={e => e.currentTarget.src = DEFAULT_AVATAR_URL} alt={user?.full_name} className="w-6 h-6 rounded-full" />
                    <span className="text-sm font-medium text-slate-700 max-w-24 truncate">{user?.full_name.split(' ')[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-50">
                        <p className="font-semibold text-slate-900 text-sm">{user?.full_name}</p>
                        <p className="text-xs text-slate-500 capitalize">{user?.role} · {user?.city}</p>
                      </div>
                      <Link to={getDashboardPath()} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">
                        <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
                      </Link>
                      <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">
                        <Settings className="w-4 h-4 text-slate-400" /> Profile Settings
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors px-3 py-1.5">
                  Sign In
                </Link>
                <Link to="/register" className="text-sm font-medium bg-primary hover:bg-blue-800 text-white px-5 py-2 rounded-full shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-primary"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 px-4 py-4 shadow-lg max-h-[calc(100vh-64px)] overflow-y-auto">
          {isAuthenticated && (
            <Link to={getDashboardPath()} onClick={() => setMobileOpen(false)} className="block text-slate-700 hover:text-primary py-2 text-sm font-medium">Dashboard</Link>
          )}
          <Link to="/cars" onClick={() => setMobileOpen(false)} className="block text-slate-700 hover:text-primary py-2 text-sm font-medium">Browse Cars</Link>
          <Link to="/sell" onClick={() => setMobileOpen(false)} className="block text-slate-700 hover:text-primary py-2 text-sm font-medium">Sell Your Car</Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard/wishlist" onClick={() => setMobileOpen(false)} className="block text-slate-700 hover:text-primary py-2 text-sm font-medium">Wishlist</Link>
              <button onClick={handleLogout} className="block w-full text-left text-error hover:text-red-600 py-2 text-sm font-medium">Sign Out</button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-slate-700 hover:text-primary py-2 text-center text-sm font-medium border border-slate-200 rounded-lg">Sign In</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block bg-primary text-white text-center py-2.5 rounded-lg text-sm font-medium">Get Started</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
