import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CARS } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Toast";

const STEPS = ["Car details", "AI estimate", "Inspection", "Get paid"];

export default function SellPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(0);
  const [number, setNumber] = useState("");
  const [make, setMake] = useState("Hyundai");
  const [model, setModel] = useState("Creta");
  const [year, setYear] = useState(2022);
  const [km, setKm] = useState(25000);
  const [condition, setCondition] = useState("excellent");
  const [photos, setPhotos] = useState<string[]>([]);

  // AI price estimate
  const basePrice = 20;
  const ageDepreciation = (2026 - year) * 1.2;
  const kmDepreciation = km / 15000;
  const conditionBonus = condition === "excellent" ? 0.8 : condition === "good" ? 0 : condition === "fair" ? -1.2 : -2.4;
  const estimate = Math.max(3, Math.round((basePrice - ageDepreciation - kmDepreciation + conditionBonus) * 10) / 10);
  const high = Math.round(estimate * 1.08 * 10) / 10;
  const low = Math.round(estimate * 0.92 * 10) / 10;

  const handleContinue = () => {
    if (step === 0) {
      if (!number) {
        toast.error("Please enter your car registration number");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!isAuthenticated) {
        navigate("/auth?redirect=/sell&mode=register");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      navigate("/dashboard");
    }
  };

  const addPhoto = () => {
    if (photos.length >= 8) return;
    setPhotos([...photos, `photo-${Date.now()}`]);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          💰 Sell your car
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Get a fair price in <span className="text-brand-600">48 hours</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">
          No haggling, no lowball offers, no hidden fees. Our AI prices your car in seconds.
        </p>
      </div>

      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  i <= step ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 hidden sm:block">{s}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 ${i < step ? "bg-brand-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Tell us about your car</h2>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Registration number</label>
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value.toUpperCase())}
                  placeholder="MH12AB1234"
                  className="tc-input font-mono text-lg font-bold tracking-wider uppercase"
                />
                <p className="mt-1 text-xs text-slate-500">We'll fetch RC and insurance details automatically.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Make</label>
                  <select value={make} onChange={(e) => setMake(e.target.value)} className="tc-input">
                    {Array.from(new Set(CARS.map((c) => c.make))).map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Model</label>
                  <input value={model} onChange={(e) => setModel(e.target.value)} className="tc-input" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Year</label>
                  <input type="number" min={2005} max={2026} value={year} onChange={(e) => setYear(Number(e.target.value))} className="tc-input" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Kilometres driven</label>
                  <input type="number" min={0} value={km} onChange={(e) => setKm(Number(e.target.value))} className="tc-input" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Overall condition</label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[
                    { value: "excellent", label: "Excellent", desc: "Like new" },
                    { value: "good", label: "Good", desc: "Minor wear" },
                    { value: "fair", label: "Fair", desc: "Some issues" },
                    { value: "poor", label: "Poor", desc: "Needs work" },
                  ].map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCondition(c.value)}
                      className={`rounded-md border-2 px-2 py-3 text-center transition-all ${
                        condition === c.value ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-sm font-semibold capitalize text-slate-900">{c.label}</div>
                      <div className="text-[10px] text-slate-500">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo upload */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Photos ({photos.length}/8)</label>
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((p) => (
                    <div key={p} className="aspect-4-3 rounded-md border border-slate-200 bg-slate-100 bg-gradient-to-br from-slate-100 to-slate-200" />
                  ))}
                  {photos.length < 8 && (
                    <button
                      onClick={addPhoto}
                      className="flex aspect-4-3 items-center justify-center rounded-md border-2 border-dashed border-slate-300 text-xs font-semibold text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600"
                    >
                      + Add photo
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">Cars with 6+ photos sell 2.3x faster.</p>
              </div>

              <button onClick={handleContinue} className="tc-btn tc-btn-dark w-full">
                Get my car's value →
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
                  ✓ AI valuation complete
                </div>
                <h2 className="mt-3 text-xl font-bold text-slate-900">
                  Your {year} {make} {model} is worth
                </h2>
              </div>

              <div className="rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 p-7 text-white">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-brand-400">TrustedCars offer</div>
                    <div className="mt-1 text-4xl font-bold">₹{estimate} L</div>
                    <div className="mt-0.5 text-xs text-slate-400">Payment in 48h · Free RC transfer</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Market range</div>
                    <div className="text-sm font-semibold">₹{low} - ₹{high} L</div>
                    <div className="mt-1 text-xs text-brand-400">✓ Above dealer</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-5">
                <div className="text-sm font-semibold text-slate-900">How we calculated this</div>
                <div className="mt-3 space-y-2 text-sm">
                  {[
                    { label: "Base price (make + model)", val: `₹${basePrice} L` },
                    { label: `Age depreciation (${2026 - year} years)`, val: `-₹${ageDepreciation.toFixed(1)} L` },
                    { label: `KM depreciation (${km.toLocaleString()} km)`, val: `-₹${kmDepreciation.toFixed(1)} L` },
                    { label: `Condition (${condition})`, val: `${conditionBonus >= 0 ? "+" : ""}₹${conditionBonus} L` },
                    { label: "Current demand", val: "+₹1.2 L" },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-slate-600">{r.label}</span>
                      <span className="font-semibold text-slate-900">{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="tc-btn tc-btn-ghost flex-1">← Edit details</button>
                <button onClick={handleContinue} className="tc-btn tc-btn-primary flex-1">
                  Accept offer & schedule inspection →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Schedule free home inspection</h2>
              <p className="text-sm text-slate-600">Our inspector will visit you, verify condition, and confirm the final offer on the spot.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Date</label>
                  <input type="date" className="tc-input" defaultValue={new Date(Date.now() + 86400000).toISOString().split("T")[0]} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Time slot</label>
                  <select className="tc-input">
                    <option>Morning (9 AM - 12 PM)</option>
                    <option>Afternoon (12 PM - 4 PM)</option>
                    <option>Evening (4 PM - 7 PM)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
                <textarea
                  placeholder="House/Flat no., building, street, area, city, pincode"
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <strong>What to keep ready:</strong> RC book, insurance papers, PUC, both keys, and at least 5L of fuel.
              </div>
              <button onClick={handleContinue} className="tc-btn tc-btn-dark w-full">
                Confirm inspection →
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-3xl">🎉</div>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">You're all set!</h2>
              <p className="mt-2 text-slate-600">Our inspector will call you within 2 hours to confirm the slot.</p>
              <div className="mt-6 rounded-lg bg-slate-50 p-5 text-left text-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">What happens next</div>
                <ol className="mt-3 space-y-2 text-slate-700">
                  <li>1. Inspector verifies condition (30 min)</li>
                  <li>2. Final offer confirmed on the spot</li>
                  <li>3. Accept → instant 50% payment via UPI/NEFT</li>
                  <li>4. We handle RC transfer & remaining payment in 48h</li>
                </ol>
              </div>
              <button onClick={() => navigate("/dashboard")} className="mt-6 tc-btn tc-btn-dark">
                View dashboard
              </button>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-900">Why sell with us?</h3>
              <ul className="mt-3 space-y-3 text-sm">
              {[
                { icon: "⚡", title: "Fastest in India", desc: "48h from inspection to payment" },
                { icon: "💰", title: "Best price guarantee", desc: "Match or beat any offer" },
                { icon: "📜", title: "Paperwork handled", desc: "RC, NOC, challans — all on us" },
                { icon: "🔒", title: "Zero spam", desc: "No tyre-kickers" },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <div className="text-xl">{item.icon}</div>
                  <div>
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    <div className="text-xs text-slate-600">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-slate-900 p-5 text-white">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Recent sales</div>
            <div className="mt-3 space-y-3 text-sm">
              {[
                { car: "Hyundai Creta 2022", price: "14.8L", days: "42h" },
                { car: "Maruti Swift 2021", price: "5.2L", days: "28h" },
                { car: "Honda City 2020", price: "9.1L", days: "51h" },
                { car: "BMW 330Li 2022", price: "38.4L", days: "46h" },
              ].map((s) => (
                <div key={s.car} className="flex items-center justify-between border-t border-slate-800 pt-3 first:border-t-0 first:pt-0">
                  <div>
                    <div className="font-semibold">{s.car}</div>
                    <div className="text-[11px] text-slate-400">Sold in {s.days}</div>
                  </div>
                  <div className="text-sm font-bold text-amber-400">₹{s.price}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
