import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  const sections = [
    {
      title: "Buy Cars",
      links: [
        { label: "All used cars", path: "/cars" },
        { label: "Cars in Mumbai", path: "/cars/mumbai" },
        { label: "Cars in Delhi", path: "/cars/delhi" },
        { label: "Cars in Bengaluru", path: "/cars/bengaluru" },
        { label: "Electric cars", path: "/cars?fuel=Electric" },
      ],
    },
    {
      title: "Sell Your Car",
      links: [
        { label: "Get instant offer", path: "/sell" },
        { label: "How it works", path: "/sell" },
        { label: "Documents needed", path: "/support" },
      ],
    },
    {
      title: "Services",
      links: [
        { label: "RC transfer", path: "/support" },
        { label: "Insurance", path: "/support" },
        { label: "Extended warranty", path: "/support" },
        { label: "Documents needed", path: "/support" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About us", path: "/" },
        { label: "Careers", path: "/" },
        { label: "Press", path: "/" },
        { label: "Contact", path: "/support" },
      ],
    },
  ];

  return (
    <footer className="mt-20 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 border-b border-slate-800 pb-10 md:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
                  <path d="M3 13l1.5-4.5A2 2 0 016.4 7h11.2a2 2 0 011.9 1.5L21 13v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="7.5" cy="15.5" r="1.2" fill="currentColor" />
                  <circle cx="16.5" cy="15.5" r="1.2" fill="currentColor" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">TrustedCars</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              India's most trusted marketplace for certified pre-owned cars. 200-point inspected, 7-day return, 6-month warranty.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold text-brand-400 ring-1 ring-brand-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> ISO 9001 certified
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400 ring-1 ring-amber-500/30">
                ⭐ 4.8 · 42k+ reviews
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              {["twitter", "instagram", "youtube", "linkedin"].map((s) => (
                <a
                  key={s}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-800/60 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  aria-label={s}
                >
                  <SocialIcon name={s} />
                </a>
              ))}
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white">{section.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.path} className="text-sm text-slate-400 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="grid gap-6 py-8 md:grid-cols-3">
          <div>
            <h4 className="text-sm font-semibold text-white">Download the app</h4>
            <p className="mt-1 text-xs text-slate-400">Scan the QR code</p>
            <div className="mt-3 flex h-16 w-16 items-center justify-center rounded-md bg-white p-1.5">
              <div className="grid h-full w-full grid-cols-6 grid-rows-6 gap-0.5">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={
                      Math.random() > 0.55 ? "bg-slate-900" : "bg-transparent"
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Stay in the loop</h4>
            <p className="mt-1 text-xs text-slate-400">Price-drop alerts on saved cars</p>
            <div className="mt-3 flex gap-2">
              <input
                type="email"
                placeholder="you@example.com"
                className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
              />
              <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
                Subscribe
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">We're hiring</h4>
            <p className="mt-1 text-xs text-slate-400">1,200+ team members across 28 cities</p>
            <Link to="/" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300">
              View open roles →
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-800 py-5 text-xs text-slate-500 md:flex-row md:items-center">
          <div>© {year} TrustedCars Mobility Pvt. Ltd. All rights reserved.</div>
          <div className="flex flex-wrap gap-4">
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">Privacy</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">Terms</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">Refund</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    twitter: "M18 4l-5.5 7.5L19 20h-3l-4.5-5.5L6.5 20H4l6-8L4 4h3l4 5L15 4h3z",
    instagram: "M12 7a5 5 0 100 10 5 5 0 000-10zm5.5-1a1 1 0 100-2 1 1 0 000 2zM4 8a4 4 0 014-4h8a4 4 0 014 4v8a4 4 0 01-4 4H8a4 4 0 01-4-4V8z",
    youtube: "M23 7l-7 5 7 5V7zM1 5h15v14H1V5z",
    linkedin: "M4 4h3v16H4V4zm1.5-2a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM9 8h3v2.2c.5-1 1.8-2.2 4-2.2 4 0 4.5 2.6 4.5 6V20h-3v-5.5c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V20H10V8H9z",
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d={paths[name]} />
    </svg>
  );
}
