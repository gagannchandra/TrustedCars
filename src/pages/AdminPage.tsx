import { useState } from "react";
import { CARS } from "../data/mockData";
import { CITIES } from "../data/cities";

type Tab = "overview" | "listings" | "users" | "inspections" | "support" | "cities" | "fraud";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [pendingListings, setPendingListings] = useState(CARS.slice(0, 5));
  const [pendingKYC, setPendingKYC] = useState([
    { id: "k1", name: "Rajesh Kumar", phone: "+91 98765 11111", submitted: "1h ago", risk: "low" },
    { id: "k2", name: "Anita Desai", phone: "+91 98765 22222", submitted: "3h ago", risk: "medium" },
    { id: "k3", name: "Mohammed Ali", phone: "+91 98765 33333", submitted: "Yesterday", risk: "low" },
  ]);

  const approve = (id: string) => {
    setPendingListings((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
            🔒 Admin console
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Platform overview</h1>
        </div>
        <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
          All systems operational
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-md border border-slate-200 bg-white p-1">
        {([
          { id: "overview", label: "Overview" },
          { id: "listings", label: "Listings" },
          { id: "users", label: "Users & KYC" },
          { id: "inspections", label: "Inspections" },
          { id: "support", label: "Support" },
          { id: "cities", label: "Cities" },
          { id: "fraud", label: "Fraud" },
        ] as { id: Tab; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "listings" && <Listings pending={pendingListings} onApprove={approve} onReject={approve} />}
      {tab === "users" && <UsersKYC pending={pendingKYC} onApprove={(id) => setPendingKYC((p) => p.filter((k) => k.id !== id))} />}
      {tab === "inspections" && <Inspections />}
      {tab === "support" && <Support />}
      {tab === "cities" && <Cities />}
      {tab === "fraud" && <Fraud />}
    </div>
  );
}

function Overview() {
  const stats = [
    { label: "Total listings", value: "15,284", change: "+342 today" },
    { label: "Active users", value: "42,890", change: "+1.2k today" },
    { label: "Cars sold (MTD)", value: "842", change: "+23% MoM" },
    { label: "GMV (MTD)", value: "₹84 Cr", change: "+18% MoM" },
    { label: "Avg. inspection time", value: "28 min", change: "-4 min" },
    { label: "Pending moderation", value: "67", change: "Needs attention" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-3xl font-bold text-slate-900">{s.value}</div>
              <span className="text-xs font-semibold text-brand-600">{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Sales trend (30 days)</h3>
          <p className="text-xs text-slate-500">Cars sold per day</p>
          <div className="mt-6 flex h-40 items-end gap-1">
            {[18, 22, 15, 28, 32, 25, 42, 38, 30, 45, 52, 48, 58, 62, 55, 48, 52, 68, 72, 65, 78, 82, 74, 88, 92, 85, 95, 102, 98, 112].map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-slate-900 to-brand-500 transition-all hover:from-brand-600 hover:to-brand-400"
                style={{ height: `${(v / 112) * 100}%` }}
                title={`${v} cars`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Top brands</h3>
          <p className="text-xs text-slate-500">Share of total listings</p>
          <div className="mt-6 space-y-3">
            {[
              { brand: "Maruti Suzuki", pct: 28, count: 4280 },
              { brand: "Hyundai", pct: 22, count: 3360 },
              { brand: "Tata", pct: 14, count: 2140 },
              { brand: "Mahindra", pct: 12, count: 1834 },
              { brand: "Kia", pct: 10, count: 1528 },
              { brand: "Others", pct: 14, count: 2142 },
            ].map((b) => (
              <div key={b.brand}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">{b.brand}</span>
                  <span className="text-slate-500">{b.count.toLocaleString()} · {b.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${b.pct * 3.5}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">Conversion funnel (last 30 days)</h3>
        <div className="mt-6 space-y-2">
          {[
            { step: "Homepage visits", count: 842000, pct: 100 },
            { step: "Viewed a car listing", count: 512000, pct: 60.8 },
            { step: "Saved / contacted", count: 48000, pct: 5.7 },
            { step: "Booked test drive", count: 12400, pct: 1.47 },
            { step: "Reserve with token", count: 4800, pct: 0.57 },
            { step: "Completed purchase", count: 842, pct: 0.1 },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-4">
              <div className="w-40 text-sm font-medium text-slate-700">{s.step}</div>
              <div className="flex-1">
                <div className="h-8 overflow-hidden rounded-md bg-slate-100">
                  <div
                    className="flex h-full items-center gap-2 rounded-md bg-gradient-to-r from-slate-900 to-slate-700 px-3 text-xs font-semibold text-white"
                    style={{ width: `${Math.max(8, s.pct)}%` }}
                  >
                    {s.pct >= 5 && `${s.pct.toFixed(1)}%`}
                  </div>
                </div>
              </div>
              <div className="w-20 text-right text-sm font-semibold text-slate-900">{s.count.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Listings({ pending, onApprove, onReject }: { pending: typeof CARS; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Pending" value="67" />
        <Stat label="Approved today" value="184" />
        <Stat label="Rejected today" value="12" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <h3 className="font-bold text-slate-900">Moderation queue</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {pending.map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-4">
              <div className="aspect-4-3 h-14 w-20 flex-none overflow-hidden rounded-md bg-slate-100">
                <img src={c.image} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate font-semibold text-slate-900">{c.year} {c.make} {c.model}</div>
                <div className="text-xs text-slate-500">by {c.seller.name} · ₹{c.price} L · {c.city}</div>
                <div className="mt-1 flex gap-1">
                  {c.seller.verified && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">✓ Verified</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onReject(c.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">Reject</button>
                <button onClick={() => onApprove(c.id)} className="rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">Approve</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersKYC({ pending, onApprove }: { pending: { id: string; name: string; phone: string; submitted: string; risk: string }[]; onApprove: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Pending KYC" value={String(pending.length)} />
        <Stat label="Approved today" value="42" />
        <Stat label="Flagged" value="3" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <h3 className="font-bold text-slate-900">KYC approval queue</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {pending.map((k) => (
            <div key={k.id} className="flex items-center gap-4 p-4">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
                {k.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{k.name}</div>
                <div className="text-xs text-slate-500">{k.phone} · Submitted {k.submitted}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                k.risk === "low" ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"
              }`}>
                {k.risk} risk
              </span>
              <button onClick={() => onApprove(k.id)} className="rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">
                Approve
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Inspections() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Today" value="142" />
        <Stat label="Completed" value="98" />
        <Stat label="Avg. score" value="91.4" />
        <Stat label="Pass rate" value="94%" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-slate-900">Inspector performance</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Ramesh Kumar", region: "Bengaluru", active: 4, done: 8, rating: 4.9 },
            { name: "Suresh Nair", region: "Kochi", active: 3, done: 12, rating: 5.0 },
            { name: "Vijay Singh", region: "Delhi NCR", active: 5, done: 6, rating: 4.8 },
            { name: "Prakash Rao", region: "Hyderabad", active: 2, done: 10, rating: 4.9 },
            { name: "Manoj Patel", region: "Mumbai", active: 6, done: 7, rating: 4.7 },
            { name: "Ashwin Das", region: "Pune", active: 4, done: 9, rating: 4.8 },
          ].map((i) => (
            <div key={i.name} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">{i.name}</div>
                <div className="text-xs font-semibold text-amber-600">⭐ {i.rating}</div>
              </div>
              <div className="text-xs text-slate-500">{i.region}</div>
              <div className="mt-2 flex items-center gap-4 text-xs">
                <div>
                  <div className="font-bold text-blue-600">{i.active}</div>
                  <div className="text-slate-500">Active</div>
                </div>
                <div>
                  <div className="font-bold text-brand-600">{i.done}</div>
                  <div className="text-slate-500">Done today</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Support() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4">
        <h3 className="font-bold text-slate-900">Support tickets</h3>
        <p className="text-xs text-slate-500">23 open · 4 high priority</p>
      </div>
      <div className="divide-y divide-slate-100">
        {[
          { id: "#TK-2841", user: "Arjun Sharma", subject: "RC transfer delay — Creta MH12", priority: "High", age: "2h ago" },
          { id: "#TK-2840", user: "Priya Nair", subject: "Refund not received — Swift return", priority: "High", age: "4h ago" },
          { id: "#TK-2839", user: "Rohan Mehta", subject: "Insurance claim assistance", priority: "Medium", age: "6h ago" },
        ].map((t) => (
          <div key={t.id} className="flex items-center gap-4 p-4">
            <span className="flex-none font-mono text-xs text-slate-500">{t.id}</span>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{t.subject}</div>
              <div className="text-xs text-slate-500">{t.user} · {t.age}</div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              t.priority === "High" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
            }`}>
              {t.priority}
            </span>
            <button className="text-xs font-semibold text-brand-600">Open →</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cities() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4">
        <h3 className="font-bold text-slate-900">City expansion</h3>
        <p className="text-xs text-slate-500">12 active · 3 in pipeline</p>
      </div>
      <div className="divide-y divide-slate-100">
        {CITIES.map((c) => (
          <div key={c.slug} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{c.name}, {c.state}</div>
              <div className="text-xs text-slate-500">
                {c.active ? `${c.carCount.toLocaleString()} cars · ${c.inspectionCenters} centres` : "Not yet launched"}
              </div>
            </div>
            {c.active ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                Active · +{c.growth}% YoY
              </span>
            ) : (
              <button className="rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">
                Launch
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Fraud() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="High risk" value="3" />
        <Stat label="Pending review" value="12" />
        <Stat label="Blocked (24h)" value="8" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <h3 className="font-bold text-slate-900">Fraud risk queue</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { user: "User @u3841", score: 92, reason: "Velocity: 5 listings in 1h from new account", action: "Block" },
            { user: "User @u2956", score: 78, reason: "Image mismatch: stock photo detected", action: "Flag" },
            { user: "User @u1923", score: 65, reason: "Phone verified, KYC missing", action: "Review" },
          ].map((f) => (
            <div key={f.user} className="flex items-center gap-4 p-4">
              <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold ${
                f.score >= 80 ? "bg-red-100 text-red-700" : f.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
              }`}>
                {f.score}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{f.user}</div>
                <div className="text-xs text-slate-500">{f.reason}</div>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">{f.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
