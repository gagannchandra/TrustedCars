import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CITIES, getCity } from "../data/cities";
import { cn } from "../utils/cn";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const activeCity = location.pathname.startsWith("/cars/")
    ? getCity(location.pathname.split("/")[2])
    : null;
  const currentCity = activeCity || (() => {
    const saved = localStorage.getItem("tc_city");
    return saved ? getCity(saved) : null;
  })();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selectCity = (slug: string) => {
    localStorage.setItem("tc_city", slug);
    setCityOpen(false);
    if (location.pathname === "/" || location.pathname.startsWith("/cars/")) {
      navigate(`/cars/${slug}`);
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* Top utility bar */}
      <div className="hidden border-b border-slate-100 bg-white text-xs text-slate-600 md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="relative" ref={cityRef}>
              <button
                onClick={() => setCityOpen(!cityOpen)}
                className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-slate-900"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {currentCity ? currentCity.name : "Select city"}
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {cityOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Active cities</div>
                  {CITIES.filter((c) => c.active).map((c) => (
                    <button
                      key={c.slug}
                      onClick={() => selectCity(c.slug)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-900">{c.name}</span>
                      <span className="text-xs text-slate-500">{c.carCount.toLocaleString()} cars</span>
                    </button>
                  ))}
                  <div className="mt-2 border-t border-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Coming soon</div>
                  {CITIES.filter((c) => !c.active).map((c) => (
                    <div key={c.slug} className="flex items-center justify-between rounded-md px-3 py-2 text-sm">
                      <span className="text-slate-500">{c.name}</span>
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Soon</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-slate-300">·</span>
            <span>200-point certified · 7-day return · 6-month warranty</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+918000123456" className="hover:text-slate-900">+91 80 0012 3456</a>
            <a href="#" className="hover:text-slate-900">Help & Support</a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
                <path d="M3 13l1.5-4.5A2 2 0 016.4 7h11.2a2 2 0 011.9 1.5L21 13v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="7.5" cy="15.5" r="1.2" fill="currentColor" />
                <circle cx="16.5" cy="15.5" r="1.2" fill="currentColor" />
                <path d="M5 12.5l1.2-1M19 12.5l-1.2-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[17px] font-bold tracking-tight text-slate-900">TrustedCars</span>
              <span className="hidden text-[10px] font-medium uppercase tracking-widest text-slate-500 sm:block">Certified · Insured · Loved</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              to="/"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive("/") ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Buy
            </Link>
            <Link
              to="/sell"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive("/sell") ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Sell
            </Link>
            <Link
              to="/support"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive("/support") ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Support
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive("/dashboard") ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === "admin" && (
              <Link
                to="/admin"
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive("/admin") ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              className="hidden h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 sm:flex"
              aria-label="Search"
              onClick={() => navigate("/cars")}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" strokeLinecap="round" />
              </svg>
            </button>

            {isAuthenticated && user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-md p-1 hover:bg-slate-100"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                    {user.avatar}
                  </div>
                  <div className="hidden text-left sm:block">
                    <div className="text-xs font-semibold text-slate-900">{user.name.split(" ")[0]}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{user.role}</div>
                  </div>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 p-3">
                      <div className="font-semibold text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.phone}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                    <div className="py-1">
                      {[
                        { label: "Dashboard", icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z", path: "/dashboard" },
                        { label: "Saved cars", icon: "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6C19 16.5 12 21 12 21z", path: "/dashboard?tab=saved" },
                        { label: "Messages", icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z", path: "/chat" },
                        { label: "KYC & documents", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8", path: "/dashboard?tab=kyc" },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            navigate(item.path);
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d={item.icon} />
                          </svg>
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" />
                        </svg>
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth" className="hidden h-9 items-center rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:flex">
                Sign in
              </Link>
            )}

            <Link to="/sell" className="hidden h-9 items-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 sm:flex">
              Sell my car
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Menu"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                {mobileOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
              {[
                { label: "Buy cars", path: "/cars" },
                { label: "Sell my car", path: "/sell" },
                { label: "Support", path: "/support" },
                ...(isAuthenticated ? [{ label: "Dashboard", path: "/dashboard" }] : []),
                ...(isAuthenticated && user?.role === "admin" ? [{ label: "Admin", path: "/admin" }] : []),
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-md px-3 py-2.5 text-sm font-medium",
                    isActive(item.path) ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 block rounded-md bg-slate-900 px-3 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Sign in
                </Link>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="mt-2 block w-full rounded-md bg-red-50 px-3 py-2.5 text-center text-sm font-semibold text-red-600"
                >
                  Log out
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
