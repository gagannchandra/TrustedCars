import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CARS, BRANDS, TESTIMONIALS, FAQS, STATS, HERO_IMAGE } from "../data/mockData";
import CarCard from "../components/CarCard";

export default function HomePage() {
  const navigate = useNavigate();
  const featured = CARS.filter((c) => c.featured).slice(0, 6);

  return (
    <div>
      <Hero onNavigate={navigate} />
      <TrustBar />
      <ValueProps />
      <FeaturedCars cars={featured} onSelectCar={(id) => navigate(`/car/${id}`)} onNavigate={navigate} />
      <HowItWorks />
      <PopularBrands />
      <Testimonials />
      <FAQSection />
      <CTABanner onNavigate={navigate} />
    </div>
  );
}

function Hero({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [make, setMake] = useState("");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900 text-white">
      <div className="absolute inset-0 opacity-30">
        <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0" style={{
        background: `radial-gradient(circle at 20% 30%, rgba(29, 158, 117, 0.2), transparent 40%), radial-gradient(circle at 80% 70%, rgba(29, 158, 117, 0.1), transparent 40%)`
      }} />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            Trusted by 42,000+ Indian families
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Buy & sell pre-owned cars — <span className="text-brand-400">transparently.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
            200-point certified. 7-day return. 6-month warranty. Transparent pricing and doorstep delivery.
          </p>
        </div>

        {/* Search card */}
        <div className="mt-8 rounded-2xl bg-white/95 p-2 shadow-2xl backdrop-blur">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 sm:w-fit">
            {(["buy", "sell"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all sm:flex-none ${
                  tab === t ? "bg-white text-slate-900 shadow" : "text-slate-600"
                }`}
              >
                {t === "buy" ? "🚗 Buy a car" : "💰 Sell my car"}
              </button>
            ))}
          </div>

          <div className="mt-2 grid gap-2 rounded-xl bg-white p-3 text-slate-900 sm:grid-cols-4 sm:gap-0 sm:p-1.5">
            {tab === "buy" ? (
              <>
                <SearchField label="Make" value={make} onChange={setMake} placeholder="Maruti, Hyundai…" />
                <SearchField label="Budget" value={budget} onChange={setBudget} placeholder="₹5-10 Lakh" />
                <SearchField label="City" value={city} onChange={setCity} placeholder="Mumbai, Delhi…" />
                <button
                  onClick={() => onNavigate("/cars")}
                  className="group flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 sm:m-1 sm:rounded-lg"
                >
                  Search 15k+ cars
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </button>
              </>
            ) : (
              <>
                <SearchField label="Car number" value={make} onChange={setMake} placeholder="MH12AB1234" />
                <SearchField label="Make & Model" value={budget} onChange={setBudget} placeholder="Hyundai Creta" />
                <SearchField label="Year" value={city} onChange={setCity} placeholder="2020" />
                <button
                  onClick={() => onNavigate("/sell")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400 sm:m-1 sm:rounded-lg"
                >
                  Get instant offer →
                </button>
              </>
            )}
          </div>
        </div>

        {/* Trust pills */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300 sm:gap-4 sm:text-sm">
          {["200-point inspection", "7-day return", "6-month warranty", "Free home inspection"].map((label) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="text-brand-400">✓</span> {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function SearchField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block rounded-xl p-3 transition-colors hover:bg-slate-50 sm:rounded-lg sm:border-r sm:border-slate-100 last:border-r-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-0.5 w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />
    </label>
  );
}

function TrustBar() {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="px-4 py-6 text-center">
            <div className="text-2xl font-bold text-slate-900 sm:text-3xl">{s.value}</div>
            <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValueProps() {
  const props = [
    {
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "200-point certified",
      desc: "Every car is inspected on 200+ parameters by certified engineers.",
    },
    {
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
        </svg>
      ),
      title: "7-day money-back",
      desc: "Don't love it? Return within 7 days for a full refund. No questions.",
    },
    {
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5" />
        </svg>
      ),
      title: "Transparent pricing",
      desc: "AI-powered valuation using 200+ market signals. No haggling.",
    },
    {
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10h18M3 6h18M3 14h18M3 18h18" />
        </svg>
      ),
      title: "Zero paperwork",
      desc: "RC transfer, insurance, fast-tag — all handled by us.",
    },
  ];
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        {props.map((p) => (
          <div key={p.title} className="bg-white p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              {p.icon}
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-900">{p.title}</h3>
            <p className="mt-1 text-xs text-slate-500">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedCars({ cars, onSelectCar, onNavigate }: { cars: typeof CARS; onSelectCar: (id: string) => void; onNavigate: (path: string) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Handpicked"
        title="Featured certified cars"
        subtitle="Best-value cars inspected and listed this week."
        action={{ label: "View all cars", onClick: () => onNavigate("/cars") }}
      />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cars.map((c, i) => (
          <div key={c.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <CarCard car={c} onSelect={onSelectCar} />
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Browse & compare", desc: "Search 15,000+ cars with 50+ filters. Compare specs and inspection reports side-by-side." },
    { n: "02", title: "Book a test drive", desc: "Schedule a free test drive at our hub or at your doorstep. No commitment, no pressure." },
    { n: "03", title: "Reserve your car", desc: "Pay a refundable ₹5,000 token to reserve the car for 24 hours while you decide." },
    { n: "04", title: "Drive home happy", desc: "We handle RC transfer, insurance, and home delivery. 7-day return guarantee." },
  ];
  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="From search to keys in 4 steps"
          subtitle="The most trusted way to buy a pre-owned car in India."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="text-3xl font-bold text-brand-500">{s.n}</div>
              <h3 className="mt-3 text-base font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularBrands() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Browse by make"
        title="Popular brands"
        subtitle="From India's favourite hatchbacks to European luxury icons."
      />
      <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {BRANDS.map((b) => (
          <Link
            key={b.name}
            to="/cars"
            className="group flex flex-col items-center rounded-lg border border-slate-200 bg-white p-5 text-center transition-all hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-3xl transition-transform group-hover:scale-110">
              {b.logo}
            </div>
            <div className="mt-3 text-sm font-bold text-slate-900">{b.name}</div>
            <div className="text-xs text-slate-500">{b.count} cars</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Real customers"
          title="What our buyers are saying"
          subtitle="4.8/5 from 42,000+ verified reviews on Google."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.slice(0, 3).map((t) => (
            <div key={t.name} className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-1 text-amber-500">★★★★★</div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="FAQ"
        title="Common questions"
        subtitle="Everything you need to know before buying or selling."
        center
      />
      <div className="mt-10 space-y-3">
        {FAQS.map((f, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
              <span className="text-sm font-semibold text-slate-900">{f.q}</span>
              <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-transform ${open === i ? "rotate-45" : ""}`}>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
              </span>
            </button>
            {open === i && (
              <div className="animate-fade-in border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function CTABanner({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-brand-500 p-8 text-white sm:p-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Got a car to sell?</h2>
            <p className="mt-3 text-lg text-brand-50">Get a fair price in 48 hours. Doorstep inspection. Instant payment.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => onNavigate("/sell")} className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-brand-600 hover:bg-brand-50">
                Get my car's value →
              </button>
              <button onClick={() => onNavigate("/support")} className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20">
                Talk to expert
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/10 p-5 backdrop-blur">
            {[
              { stat: "48h", label: "Avg. sale time" },
              { stat: "₹3.2L", label: "Above dealer offers" },
              { stat: "0%", label: "Haggling" },
              { stat: "28", label: "Cities covered" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold">{s.stat}</div>
                <div className="text-sm text-brand-100">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow, title, subtitle, action, center,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  center?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-4 ${center ? "items-center text-center" : ""} md:flex-row md:items-end md:justify-between`}>
      <div className="max-w-2xl">
        {eyebrow && <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600">{eyebrow}</div>}
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-slate-600 sm:text-base">{subtitle}</p>}
      </div>
      {action && (
        <button onClick={action.onClick} className="group flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:text-slate-700">
          {action.label}
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      )}
    </div>
  );
}
