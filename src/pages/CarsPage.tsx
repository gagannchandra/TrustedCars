import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CARS } from "../data/mockData";
import type { Car } from "../data/mockData";
import CarCard from "../components/CarCard";

type SortKey = "relevance" | "price-asc" | "price-desc" | "year-desc" | "km-asc";

export default function CarsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [make, setMake] = useState<string[]>(params.get("make")?.split(",").filter(Boolean) || []);
  const [body, setBody] = useState<string[]>(params.get("body")?.split(",").filter(Boolean) || []);
  const [fuel, setFuel] = useState<string[]>(params.get("fuel")?.split(",").filter(Boolean) || []);
  const [trans, setTrans] = useState<string[]>(params.get("trans")?.split(",").filter(Boolean) || []);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(params.get("pmin")) || 0,
    Number(params.get("pmax")) || 80,
  ]);
  const [yearRange, setYearRange] = useState<[number, number]>([
    Number(params.get("ymin")) || 2015,
    Number(params.get("ymax")) || 2025,
  ]);
  const [sort, setSort] = useState<SortKey>((params.get("sort") as SortKey) || "relevance");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState(params.get("q") || "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams();
    if (make.length) p.set("make", make.join(","));
    if (body.length) p.set("body", body.join(","));
    if (fuel.length) p.set("fuel", fuel.join(","));
    if (trans.length) p.set("trans", trans.join(","));
    if (priceRange[0] > 0) p.set("pmin", String(priceRange[0]));
    if (priceRange[1] < 80) p.set("pmax", String(priceRange[1]));
    if (yearRange[0] > 2015) p.set("ymin", String(yearRange[0]));
    if (yearRange[1] < 2025) p.set("ymax", String(yearRange[1]));
    if (search) p.set("q", search);
    if (sort !== "relevance") p.set("sort", sort);
    setParams(p, { replace: true });
  }, [make, body, fuel, trans, priceRange, yearRange, sort, search, setParams]);

  const makes = useMemo(() => Array.from(new Set(CARS.map((c) => c.make))).sort(), []);
  const bodies = useMemo(() => Array.from(new Set(CARS.map((c) => c.body))).sort(), []);
  const fuels = useMemo(() => Array.from(new Set(CARS.map((c) => c.fuel))).sort(), []);

  const filtered = useMemo(() => {
    let r = CARS.filter((c) => {
      if (make.length && !make.includes(c.make)) return false;
      if (body.length && !body.includes(c.body)) return false;
      if (fuel.length && !fuel.includes(c.fuel)) return false;
      if (trans.length && !trans.includes(c.transmission)) return false;
      if (c.price < priceRange[0] || c.price > priceRange[1]) return false;
      if (c.year < yearRange[0] || c.year > yearRange[1]) return false;
      if (search && !`${c.make} ${c.model} ${c.variant}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    switch (sort) {
      case "price-asc": r = [...r].sort((a, b) => a.price - b.price); break;
      case "price-desc": r = [...r].sort((a, b) => b.price - a.price); break;
      case "year-desc": r = [...r].sort((a, b) => b.year - a.year); break;
      case "km-asc": r = [...r].sort((a, b) => a.km - b.km); break;
      default: r = [...r].sort((a, b) => b.inspectionScore - a.inspectionScore);
    }
    return r;
  }, [make, body, fuel, trans, priceRange, yearRange, sort, search]);

  const clearAll = () => {
    setMake([]); setBody([]); setFuel([]); setTrans([]);
    setPriceRange([0, 80]); setYearRange([2015, 2025]); setSearch("");
  };

  const activeCount = [make.length, body.length, fuel.length, trans.length, search ? 1 : 0, priceRange[0] > 0 || priceRange[1] < 80 ? 1 : 0, yearRange[0] > 2015 || yearRange[1] < 2025 ? 1 : 0].reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900">Home</Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">Used cars</span>
      </div>
      <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Used cars in India</h1>
          <p className="mt-1 text-slate-600">
            <span className="font-semibold">{filtered.length}</span> of {CARS.length} certified cars
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search make, model…"
              className="tc-input pl-10"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="tc-input h-11 w-auto pr-8"
          >
            <option value="relevance">Inspection score</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="year-desc">Year: Newest</option>
            <option value="km-asc">KM: Lowest</option>
          </select>
          <div className="hidden rounded-md border border-slate-200 bg-white p-1 md:flex">
            <button
              onClick={() => setView("grid")}
              className={`rounded px-2 py-1 ${view === "grid" ? "bg-slate-100" : "text-slate-500"}`}
              aria-label="Grid view"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded px-2 py-1 ${view === "list" ? "bg-slate-100" : "text-slate-500"}`}
              aria-label="List view"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="5" width="18" height="2" rx="1" />
                <rect x="3" y="11" width="18" height="2" rx="1" />
                <rect x="3" y="17" width="18" height="2" rx="1" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex h-11 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 lg:hidden"
          >
            Filters {activeCount > 0 && <span className="rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{activeCount}</span>}
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {make.map((m) => (
            <FilterChip key={m} label={m} onRemove={() => setMake(make.filter((x) => x !== m))} />
          ))}
          {body.map((b) => (
            <FilterChip key={b} label={b} onRemove={() => setBody(body.filter((x) => x !== b))} />
          ))}
          {fuel.map((f) => (
            <FilterChip key={f} label={f} onRemove={() => setFuel(fuel.filter((x) => x !== f))} />
          ))}
          {trans.map((t) => (
            <FilterChip key={t} label={t} onRemove={() => setTrans(trans.filter((x) => x !== t))} />
          ))}
          {search && <FilterChip label={`"${search}"`} onRemove={() => setSearch("")} />}
          <button onClick={clearAll} className="text-xs font-semibold text-amber-600 hover:text-amber-700">Clear all</button>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className={`${mobileFiltersOpen ? "fixed inset-0 z-50 bg-white" : "hidden"} lg:block lg:static lg:bg-transparent`}>
          <div className="h-full overflow-y-auto p-4 lg:p-0">
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <h2 className="text-lg font-bold text-slate-900">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="text-slate-500">✕</button>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Filters {activeCount > 0 && `(${activeCount})`}</div>
              {activeCount > 0 && (
                <button onClick={clearAll} className="text-xs font-semibold text-amber-600 hover:text-amber-700">Clear all</button>
              )}
            </div>

            <FilterGroup title="Brand">
              {makes.map((m) => (
                <CheckRow key={m} label={m} count={CARS.filter((c) => c.make === m).length} checked={make.includes(m)} onChange={(v) => setMake(v ? [...make, m] : make.filter((x) => x !== m))} />
              ))}
            </FilterGroup>

            <FilterGroup title="Body type">
              {bodies.map((b) => (
                <CheckRow key={b} label={b} count={CARS.filter((c) => c.body === b).length} checked={body.includes(b)} onChange={(v) => setBody(v ? [...body, b] : body.filter((x) => x !== b))} />
              ))}
            </FilterGroup>

            <FilterGroup title="Fuel type">
              {fuels.map((f) => (
                <CheckRow key={f} label={f} count={CARS.filter((c) => c.fuel === f).length} checked={fuel.includes(f)} onChange={(v) => setFuel(v ? [...fuel, f] : fuel.filter((x) => x !== f))} />
              ))}
            </FilterGroup>

            <FilterGroup title="Transmission">
              {["Manual", "Automatic"].map((t) => (
                <CheckRow key={t} label={t} count={CARS.filter((c) => c.transmission === t).length} checked={trans.includes(t)} onChange={(v) => setTrans(v ? [...trans, t] : trans.filter((x) => x !== t))} />
              ))}
            </FilterGroup>

            <div className="mb-2 rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Price range</div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                <span>₹{priceRange[0]} L</span>
                <span>₹{priceRange[1]} L</span>
              </div>
              <input type="range" min={0} max={80} step={1} value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} className="mt-1 w-full accent-brand-500" />
            </div>

            <div className="mb-2 rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Year</div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                <span>{yearRange[0]}</span>
                <span>{yearRange[1]}</span>
              </div>
              <input type="range" min={2015} max={2025} step={1} value={yearRange[0]} onChange={(e) => setYearRange([Number(e.target.value), yearRange[1]])} className="mt-1 w-full accent-brand-500" />
            </div>

            <button onClick={() => setMobileFiltersOpen(false)} className="mt-4 w-full rounded-md bg-slate-900 py-3 text-sm font-semibold text-white lg:hidden">
              Show {filtered.length} cars
            </button>
          </div>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white py-20 text-center">
              <div className="text-5xl">🔍</div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">No cars match your filters</h3>
              <p className="mt-1 text-sm text-slate-600">Try removing some filters or clearing search.</p>
              <button onClick={clearAll} className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Clear filters</button>
            </div>
          ) : view === "grid" ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => (
                <CarCard key={c.id} car={c} onSelect={(id) => navigate(`/car/${id}`)} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((c) => (
                <CarListRow key={c.id} car={c} onSelect={(id) => navigate(`/car/${id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
      {label}
      <button onClick={onRemove} className="text-slate-400 hover:text-slate-700">✕</button>
    </span>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 max-h-52 space-y-1 overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
}

function CheckRow({ label, count, checked, onChange }: { label: string; count: number; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-brand-500" />
        <span className="text-slate-700">{label}</span>
      </div>
      <span className="text-xs text-slate-400">{count}</span>
    </label>
  );
}

function CarListRow({ car, onSelect }: { car: Car; onSelect: (id: string) => void }) {
  return (
    <button onClick={() => onSelect(car.id)} className="group grid w-full grid-cols-12 gap-4 rounded-lg border border-slate-200 bg-white p-3 text-left transition-all hover:border-slate-300 hover:shadow-md">
      <div className="col-span-12 sm:col-span-4">
        <div className="aspect-4-3 overflow-hidden rounded-md bg-slate-100">
          <img src={car.image} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
      <div className="col-span-12 sm:col-span-8">
        <h3 className="text-base font-bold text-slate-900">{car.make} {car.model} <span className="text-slate-500">{car.variant}</span></h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span>{car.year}</span>
          <span>·</span>
          <span>{car.km.toLocaleString()} km</span>
          <span>·</span>
          <span>{car.fuel}</span>
          <span>·</span>
          <span>{car.transmission}</span>
          <span>·</span>
          <span>{car.city}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">✓ {car.inspectionScore}/100</span>
            {car.badges.slice(0, 2).map((b) => (
              <span key={b} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{b}</span>
            ))}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900">₹{car.price} L</div>
          </div>
        </div>
      </div>
    </button>
  );
}
