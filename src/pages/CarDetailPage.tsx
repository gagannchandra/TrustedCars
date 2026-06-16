import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CARS } from "../data/mockData";
import ScoreRing from "../components/ScoreRing";
import CarCard from "../components/CarCard";
import { toast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

type Tab = "overview" | "specs" | "inspection" | "history";

const INSPECTION_CATEGORIES = [
  { name: "Engine & Drivetrain", items: 52, pass: 49, status: "Excellent" },
  { name: "Exterior & Body", items: 45, pass: 44, status: "Excellent" },
  { name: "Interior & Comfort", items: 38, pass: 37, status: "Excellent" },
  { name: "Electrical", items: 28, pass: 27, status: "Great" },
  { name: "Tyres & Brakes", items: 22, pass: 19, status: "Good" },
  { name: "Underbody & Frame", items: 15, pass: 14, status: "Good" },
];

const DEFECT_ANNOTATIONS = [
  { x: 28, y: 65, label: "Minor scratch on rear bumper", severity: "minor" },
  { x: 72, y: 38, label: "Stone chip on windshield", severity: "minor" },
];

export default function CarDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const car = CARS.find((c) => c.id === id) ?? CARS[0];
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState<Tab>("overview");
  const [wishlisted, setWishlisted] = useState(false);

  const similar = useMemo(() => CARS.filter((c) => c.id !== car.id && c.body === car.body).slice(0, 3), [car]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Vehicle",
            name: `${car.year} ${car.make} ${car.model}`,
            brand: { "@type": "Brand", name: car.make },
            model: car.model,
            vehicleModelDate: car.year,
            vehicleEngine: { "@type": "EngineSpecification", enginePower: { "@type": "QuantitativeValue", value: car.specs.power } },
            fuelType: car.fuel,
            vehicleTransmission: car.transmission,
            mileageFromOdometer: { "@type": "QuantitativeValue", value: car.km, unitCode: "KMT" },
            offers: {
              "@type": "Offer",
              price: car.price * 100000,
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
              seller: { "@type": "AutoDealer", name: car.seller.name },
            },
          }),
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-slate-900">Home</Link>
          <span>/</span>
          <Link to="/cars" className="hover:text-slate-900">Cars</Link>
          <span>/</span>
          <span className="font-semibold text-slate-900">{car.make} {car.model}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            {/* Gallery */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <div className="relative aspect-4-3 overflow-hidden bg-slate-900">
                <img src={car.gallery[activeImg]} alt="" className="h-full w-full object-cover" />
                <button className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 backdrop-blur transition-colors hover:bg-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 backdrop-blur transition-colors hover:bg-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <div className="absolute right-4 top-4 flex gap-1.5">
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 backdrop-blur" title="360° view">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M3 12h18 M12 3a14 14 0 010 18 M12 3a14 14 0 000 18" /></svg>
                  </button>
                  <button
                    onClick={() => {
                      setWishlisted(!wishlisted);
                      toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition-colors ${
                      wishlisted ? "bg-red-500 text-white" : "bg-white/90 text-slate-900"
                    }`}
                    title="Wishlist"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6C19 16.5 12 21 12 21z" />
                    </svg>
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {car.inspectionScore}/100 inspected
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto p-3">
                {car.gallery.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-none overflow-hidden rounded-md ring-2 transition-all ${i === activeImg ? "ring-brand-500" : "ring-transparent hover:ring-slate-300"}`}
                  >
                    <div className="aspect-4-3 w-20 bg-slate-100">
                      <img src={g} alt="" className="h-full w-full object-cover" />
                    </div>
                  </button>
                ))}
                <button className="flex aspect-4-3 w-20 flex-none flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 text-xs font-semibold text-slate-500">
                  <span className="text-xl">+</span>
                  <span>5 more</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {car.badges.slice(0, 3).map((b) => (
                      <span key={b} className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{b}</span>
                    ))}
                  </div>
                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {car.year} {car.make} {car.model}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">{car.variant}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span>⭐ {car.rating}</span>
                    <span>·</span>
                    <span>📍 {car.city}</span>
                    <span>·</span>
                    <span>{car.ownership} owner</span>
                    <span>·</span>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">✓ Certified</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">₹{car.price} L</div>
                  <div className="text-xs text-slate-500">On-road, all-inclusive</div>
                  <div className="mt-1 text-xs font-semibold text-brand-600">✓ 12% below market</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetaCell label="Year" value={String(car.year)} />
                <MetaCell label="KM" value={`${(car.km / 1000).toFixed(1)}k`} />
                <MetaCell label="Fuel" value={car.fuel} />
                <MetaCell label="Trans." value={car.transmission} />
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 rounded-lg border border-slate-200 bg-white">
              <div className="flex border-b border-slate-200 overflow-x-auto">
                {([
                  { id: "overview", label: "Overview" },
                  { id: "specs", label: "Specifications" },
                  { id: "inspection", label: "Inspection report" },
                  { id: "history", label: "History" },
                ] as { id: Tab; label: string }[]).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative whitespace-nowrap px-5 py-4 text-sm font-semibold transition-colors ${
                      tab === t.id ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {t.label}
                    {tab === t.id && <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-brand-500" />}
                  </button>
                ))}
              </div>
              <div className="p-6">
                {tab === "overview" && <OverviewTab car={car} />}
                {tab === "specs" && <SpecsTab car={car} />}
                {tab === "inspection" && <InspectionTab />}
                {tab === "history" && <HistoryTab car={car} />}
              </div>
            </div>
          </div>

          {/* Sticky sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-600">On-road price</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">₹{(car.price * 100000).toLocaleString("en-IN")}</div>
              <div className="mt-1 text-xs text-slate-500">Inclusive of RC transfer, insurance & delivery</div>
              <div className="mt-3 flex items-center gap-2 rounded-md bg-brand-50 px-3 py-2 text-xs">
                <span className="font-semibold text-brand-700">₹{Math.round((car.price * 100000) / 60).toLocaleString("en-IN")}/mo</span>
                <span className="text-slate-600">for 60 months</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-bold text-white">
                  {car.seller.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-bold text-slate-900">{car.seller.name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    {car.seller.verified && <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">✓ Verified</span>}
                    <span>· ⭐ {car.seller.rating}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate("/auth?redirect=" + encodeURIComponent(`/car/${car.id}`));
                    } else {
                      toast.info("Calling seller... (demo)");
                    }
                  }}
                  className="rounded-md bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
                >
                  📞 Call
                </button>
                <Link to="/chat" className="rounded-md border border-slate-200 py-2.5 text-center text-sm font-bold text-slate-900 hover:bg-slate-50">
                  💬 Chat
                </Link>
              </div>
              <Link
                to={`/checkout/${car.id}`}
                className="mt-2 block w-full rounded-md bg-slate-900 py-3 text-center text-sm font-bold text-white hover:bg-slate-800"
              >
                Reserve with ₹5,000 →
              </Link>
              <Link
                to={`/inspection/${car.id}`}
                className="mt-2 block w-full rounded-md border border-slate-200 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Schedule free inspection
              </Link>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <div className="text-xl">💡</div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Make an offer</div>
                  <p className="mt-0.5 text-xs text-slate-600">Car is priced 12% below market. You can still negotiate.</p>
                  <button
                    onClick={() => toast.info("Offer flow coming soon")}
                    className="mt-2 w-full rounded-md bg-white px-3 py-1.5 text-xs font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    Make an offer →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar cars */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-900">Similar cars</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((c) => (
              <CarCard key={c.id} car={c} onSelect={(id) => navigate(`/car/${id}`)} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function OverviewTab({ car }: { car: any }) {
  return (
    <div>
      <p className="text-sm leading-relaxed text-slate-700">{car.description}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <FeatureItem title="Exterior" desc="Body panels in excellent condition. Minor swirl marks on bonnet. Paint depth consistent across all panels." score={92} />
        <FeatureItem title="Interior" desc="Seats, dashboard, carpets in pristine condition. No odour, no tears. AC blows cold." score={96} />
        <FeatureItem title="Engine & Transmission" desc="No oil leaks, smooth shifts, consistent compression. Recently serviced at authorised centre." score={94} />
        <FeatureItem title="Tyres & Battery" desc="Front tyres 70% life, rears 80%. Battery health 95%. Brake pads 60%." score={88} />
      </div>
    </div>
  );
}

function SpecsTab({ car }: { car: any }) {
  return (
    <div className="grid gap-x-10 gap-y-3 text-sm sm:grid-cols-2">
      {Object.entries(car.specs as Record<string, string>).map(([k, v]) => (
        <div key={k} className="flex items-center justify-between border-b border-dashed border-slate-200 py-2.5">
          <span className="capitalize text-slate-500">{k.replace(/([A-Z])/g, " $1")}</span>
          <span className="font-semibold text-slate-900">{v}</span>
        </div>
      ))}
    </div>
  );
}

function InspectionTab() {
  return (
    <div>
      <div className="flex flex-col items-center justify-between gap-4 rounded-lg bg-gradient-to-br from-brand-50 to-white p-5 ring-1 ring-brand-200 sm:flex-row">
        <div className="flex items-center gap-4">
          <ScoreRing score={94} size={100} strokeWidth={8} />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Overall score</div>
            <div className="mt-0.5 text-3xl font-bold text-slate-900">94<span className="text-base text-slate-500">/100</span></div>
            <div className="text-xs text-slate-600">Top 6% of inspected vehicles</div>
          </div>
        </div>
        <div className="text-right">
          <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            Download PDF
          </button>
          <div className="mt-1 text-[11px] text-slate-500">Report #TC-2026-0482</div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {INSPECTION_CATEGORIES.map((cat) => (
          <div key={cat.name} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-900">{cat.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                cat.status === "Excellent" ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"
              }`}>
                {cat.status}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">{cat.pass} of {cat.items} points passed</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${(cat.pass / cat.items) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Defect gallery with annotations */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-slate-900">Defect photos with callouts</h3>
        <div className="mt-3 aspect-4-3 overflow-hidden rounded-lg bg-slate-100">
          <img src="https://images.pexels.com/photos/33686091/pexels-photo-33686091.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200" alt="" className="h-full w-full object-cover" />
          {DEFECT_ANNOTATIONS.map((d, i) => (
            <div
              key={i}
              className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white ring-4 ring-amber-200"
              style={{ left: `${d.x}%`, top: `${d.y}%` }}
              title={d.label}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-1 text-xs text-slate-600">
          {DEFECT_ANNOTATIONS.map((d, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">{i + 1}</span>
              <span>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryTab({ car }: { car: any }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-slate-200 pl-6">
      {[
        { date: "Jan 2026", title: "Listed on TrustedCars", desc: "Passed 200-point inspection. Certified and priced algorithmically." },
        { date: "Mar 2024", title: "Last service at authorised dealer", desc: "Full service with oil, filter, and brake fluid replacement." },
        { date: "Aug 2023", title: "Insurance renewed", desc: "Comprehensive insurance with zero-dep cover." },
        { date: "Feb 2022", title: "First registered", desc: `Registered in ${car.city}. ${car.ownership} owner.` },
      ].map((h) => (
        <li key={h.date} className="relative">
          <div className="absolute -left-[31px] h-4 w-4 rounded-full border-2 border-brand-500 bg-white" />
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h.date}</div>
          <div className="mt-0.5 text-sm font-bold text-slate-900">{h.title}</div>
          <div className="text-sm text-slate-600">{h.desc}</div>
        </li>
      ))}
    </ol>
  );
}

function FeatureItem({ title, desc, score }: { title: string; desc: string; score: number }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-slate-900">{title}</div>
        <div className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
          {score}/100
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{desc}</p>
    </div>
  );
}
