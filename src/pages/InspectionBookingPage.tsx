import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CARS } from "../data/mockData";
import { getCity, CITIES } from "../data/cities";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Toast";

const INSPECTORS = [
  { id: "i1", name: "Ramesh Kumar", region: "Bengaluru", rating: 4.9, jobs: 1284, distance: "2.3 km", lat: 12.97, lng: 77.59 },
  { id: "i2", name: "Suresh Nair", region: "Kochi", rating: 5.0, jobs: 942, distance: "3.8 km", lat: 9.93, lng: 76.27 },
  { id: "i3", name: "Vijay Singh", region: "Delhi NCR", rating: 4.8, jobs: 1142, distance: "1.7 km", lat: 28.70, lng: 77.10 },
  { id: "i4", name: "Prakash Rao", region: "Hyderabad", rating: 4.9, jobs: 824, distance: "4.1 km", lat: 17.38, lng: 78.49 },
  { id: "i5", name: "Manoj Patel", region: "Mumbai", rating: 4.7, jobs: 1086, distance: "2.9 km", lat: 19.08, lng: 72.88 },
];

const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

export default function InspectionBookingPage() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const car = CARS.find((c) => c.id === carId);
  
  const [city] = useState(car?.city.split(" ")[0] || user?.city || "Mumbai");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [slot, setSlot] = useState("11:00 AM");
  const [selectedInspector, setSelectedInspector] = useState<string | null>("i1");
  const [address, setAddress] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const cityData = getCity(CITIES.find((c) => c.name === city)?.slug || "");
  const inspectors = useMemo(() => {
    const target = cityData?.coordinates;
    if (!target) return INSPECTORS;
    return INSPECTORS.map((i) => ({
      ...i,
      distance: `${(Math.random() * 4 + 1).toFixed(1)} km`,
    }));
  }, [cityData]);

  const selected = inspectors.find((i) => i.id === selectedInspector);

  if (!car) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Car not found</h1>
        <Link to="/cars" className="mt-4 inline-block text-brand-600">Browse cars →</Link>
      </div>
    );
  }

  const handleConfirm = () => {
    if (!isAuthenticated) {
      navigate(`/auth?redirect=/inspection/${carId}`);
      return;
    }
    if (!address) {
      toast.error("Please enter the inspection address");
      return;
    }
    setConfirmed(true);
    toast.success("Inspection booked! You'll receive an SMS shortly.");
  };

  if (confirmed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-3xl">✓</div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Inspection booked!</h1>
        <p className="mt-2 text-slate-600">Your booking is confirmed for {date} at {slot}.</p>
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-left">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Booking ID</div>
              <div className="mt-0.5 font-mono font-semibold text-slate-900">#INSP-{Math.floor(Math.random() * 90000) + 10000}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date & Time</div>
              <div className="mt-0.5 font-semibold text-slate-900">{new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {slot}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Inspector</div>
              <div className="mt-0.5 font-semibold text-slate-900">{selected?.name}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Address</div>
              <div className="mt-0.5 font-semibold text-slate-900">{address}</div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => navigate("/dashboard")} className="tc-btn tc-btn-dark">View dashboard</button>
          <button onClick={() => navigate("/")} className="tc-btn tc-btn-ghost">Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900">Home</Link>
        <span>/</span>
        <Link to={`/car/${car.id}`} className="hover:text-slate-900">{car.make} {car.model}</Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">Book inspection</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Book free inspection</h1>
      <p className="mt-1 text-slate-600">Our certified engineers visit your doorstep in 30 minutes. No obligation.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* City + Inspector map */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">Nearest inspector</h2>
            <p className="text-xs text-slate-500">Showing inspectors in {city}</p>
            
            <div className="mt-4 aspect-[16/9] overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
              <div className="relative flex h-full items-center justify-center">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 200">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="400" height="200" fill="url(#grid)" />
                  <path d="M 50 150 Q 150 50 250 130 T 380 100" stroke="#1D9E75" strokeWidth="2" fill="none" strokeDasharray="4 4" opacity="0.6" />
                </svg>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg ring-4 ring-brand-200">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" /></svg>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {inspectors.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setSelectedInspector(i.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selectedInspector === i.id ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-semibold text-white">
                    {i.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">{i.name}</div>
                    <div className="text-xs text-slate-500">{i.region} · {i.jobs} jobs · ⭐ {i.rating}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-brand-600">{i.distance}</div>
                    <div className="text-[10px] text-slate-500">away</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date + Time */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">Pick a slot</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="tc-input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Time</label>
                <select value={slot} onChange={(e) => setSlot(e.target.value)} className="tc-input">
                  {TIME_SLOTS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TIME_SLOTS.slice(0, 5).map((t) => (
                <button
                  key={t}
                  onClick={() => setSlot(t)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                    slot === t ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">Where should we inspect?</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House/Flat no., building, street, area, city, pincode"
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <strong>Keep ready:</strong> RC book, insurance papers, both keys, and the car should have at least 5L of fuel.
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-900">You're inspecting</h3>
            <div className="mt-3 flex gap-3">
              <img src={car.image} alt="" className="h-16 w-20 flex-none rounded object-cover" />
              <div>
                <div className="text-sm font-semibold text-slate-900">{car.year} {car.make} {car.model}</div>
                <div className="text-xs text-slate-500">{car.km.toLocaleString()} km · {car.fuel}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Date" value={new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long" })} />
              <Row label="Time" value={slot} />
              <Row label="Inspector" value={selected?.name || "—"} />
              <Row label="Fee" value="Free" />
            </div>
            <button onClick={handleConfirm} className="tc-btn tc-btn-primary mt-5 w-full">
              Confirm booking
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-500">You'll get SMS and email reminders</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">What happens next</h3>
            <ol className="mt-3 space-y-2 text-xs text-slate-600">
              <li className="flex gap-2"><span className="font-semibold text-slate-900">1.</span> Inspector calls 30 min before arrival</li>
              <li className="flex gap-2"><span className="font-semibold text-slate-900">2.</span> 200-point inspection (~30 min)</li>
              <li className="flex gap-2"><span className="font-semibold text-slate-900">3.</span> Real-time tracking on the app</li>
              <li className="flex gap-2"><span className="font-semibold text-slate-900">4.</span> Report within 2 hours</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
