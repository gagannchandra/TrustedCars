import { useParams, Link, useNavigate } from "react-router-dom";
import { getCity, CITIES } from "../data/cities";
import { CARS } from "../data/mockData";
import CarCard from "../components/CarCard";
import { useEffect, useMemo } from "react";
import { toast } from "../components/Toast";

export default function CityPage() {
  const { city } = useParams();
  const navigate = useNavigate();
  const cityData = getCity(city || "");

  useEffect(() => {
    if (city && cityData) {
      localStorage.setItem("tc_city", city);
    }
  }, [city, cityData]);

  const cityCars = useMemo(() => {
    if (!cityData) return [];
    return CARS.filter((c) => c.city.toLowerCase().includes(cityData.name.toLowerCase()) || c.city.toLowerCase().includes(cityData.state.toLowerCase()));
  }, [cityData]);

  if (!cityData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">City not found</h1>
        <p className="mt-2 text-slate-600">We're not operating in this city yet.</p>
        <Link to="/cars" className="mt-6 inline-block rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">
          Browse all cities
        </Link>
      </div>
    );
  }

  if (!cityData.active) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="text-6xl">🚧</div>
        <h1 className="mt-4 text-3xl font-bold">Coming soon to {cityData.name}</h1>
        <p className="mt-2 text-slate-600">We're setting up inspection centres in your city. Notify me when we launch.</p>
        <button
          onClick={() => {
            toast.success("We'll notify you when TrustedCars launches in " + cityData.name);
          }}
          className="mt-6 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white"
        >
          Notify me on launch
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AutoDealer",
            name: `TrustedCars ${cityData.name}`,
            address: { "@type": "PostalAddress", addressLocality: cityData.name, addressRegion: cityData.state, addressCountry: "IN" },
            geo: { "@type": "GeoCoordinates", latitude: cityData.coordinates.lat, longitude: cityData.coordinates.lng },
            aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "12480" },
            priceRange: "₹₹",
          }),
        }}
      />

      <div className="bg-gradient-to-b from-brand-50 to-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-slate-900">Home</Link>
            <span>/</span>
            <Link to="/cars" className="hover:text-slate-900">Used cars</Link>
            <span>/</span>
            <span className="font-semibold text-slate-900">{cityData.name}</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Used cars in {cityData.name}
          </h1>
          <p className="mt-2 text-slate-600">
            {cityData.carCount.toLocaleString()} certified pre-owned cars · {cityData.inspectionCenters} inspection centres · Avg. price ₹{cityData.avgPrice} L
          </p>

          {/* Quick stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Cars available" value={cityData.carCount.toLocaleString()} />
            <Stat label="Inspection centres" value={String(cityData.inspectionCenters)} />
            <Stat label="Avg. price" value={`₹${cityData.avgPrice} L`} />
            <Stat label="YoY growth" value={`+${cityData.growth}%`} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {cityCars.length > 0 ? `${cityCars.length} cars in ${cityData.name}` : `Cars across ${cityData.state}`}
            </h2>
            
            {cityCars.length === 0 && (
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                No live inventory in {cityData.name} right now. Browse from nearby cities or get notified about new listings.
              </div>
            )}

            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {cityCars.map((c) => (
                <CarCard key={c.id} car={c} onSelect={(id) => navigate(`/car/${id}`)} />
              ))}
              {cityCars.length === 0 && CARS.slice(0, 6).map((c) => (
                <CarCard key={c.id} car={c} onSelect={(id) => navigate(`/car/${id}`)} />
              ))}
            </div>

            {/* Price trend */}
            <div className="mt-10 rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-bold text-slate-900">Price trend in {cityData.name}</h3>
              <p className="text-sm text-slate-500">Average used car prices, last 12 months</p>
              <div className="mt-6 flex h-40 items-end gap-2">
                {[
                  { m: "Feb", p: 11.4 },
                  { m: "Mar", p: 11.2 },
                  { m: "Apr", p: 10.8 },
                  { m: "May", p: 10.9 },
                  { m: "Jun", p: 11.3 },
                  { m: "Jul", p: 11.6 },
                  { m: "Aug", p: 12.1 },
                  { m: "Sep", p: 12.4 },
                  { m: "Oct", p: 12.5 },
                  { m: "Nov", p: 12.3 },
                  { m: "Dec", p: 12.6 },
                  { m: "Jan", p: cityData.avgPrice },
                ].map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-brand-500 to-brand-300 transition-all hover:from-brand-600"
                      style={{ height: `${(d.p / 14) * 100}%` }}
                      title={`₹${d.p} L`}
                    />
                    <div className="text-[10px] font-medium text-slate-500">{d.m}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">Inspection centre in {cityData.name}</h3>
              <div className="mt-3 aspect-4-3 overflow-hidden rounded-lg bg-slate-100">
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  <svg className="h-12 w-12 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <div className="font-semibold text-slate-900">TrustedCars {cityData.name}</div>
                <div className="text-slate-600">100ft Road, {cityData.name}, {cityData.state}</div>
                <div className="mt-1 text-xs text-slate-500">Open 9 AM - 8 PM · Mon-Sat</div>
              </div>
              <button className="mt-3 w-full rounded-md bg-slate-900 py-2 text-xs font-semibold text-white">Get directions</button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">Other cities</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {CITIES.filter((c) => c.active && c.slug !== cityData.slug).slice(0, 8).map((c) => (
                  <Link
                    key={c.slug}
                    to={`/cars/${c.slug}`}
                    className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm transition-colors hover:bg-slate-100"
                  >
                    <span className="font-medium text-slate-900">{c.name}</span>
                    <span className="text-xs text-slate-500">{c.carCount.toLocaleString()}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
