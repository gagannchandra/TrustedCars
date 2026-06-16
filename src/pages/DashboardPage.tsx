import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CARS } from "../data/mockData";
import CarCard from "../components/CarCard";
import { toast } from "../components/Toast";

type Tab = "overview" | "saved" | "purchases" | "testdrives" | "kyc" | "notifications" | "listings" | "inquiries" | "wallet";

export default function DashboardPage() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "overview";
  const [role, setRole] = useState<"buyer" | "seller">(user?.role === "admin" ? "buyer" : (user?.role as "buyer" | "seller") || "buyer");
  const wishlist = CARS.slice(0, 3);
  const [kycDoc, setKycDoc] = useState<"pan" | "aadhaar" | null>(null);
  const [kycUploading, setKycUploading] = useState(false);

  if (!user) return null;

  const setTab = (t: Tab) => {
    setParams({ tab: t });
  };

  const handleKycUpload = (doc: "pan" | "aadhaar") => {
    setKycDoc(doc);
    setKycUploading(true);
    setTimeout(() => {
      setKycUploading(false);
      updateProfile({ kycStatus: "submitted" });
      toast.success(`${doc.toUpperCase()} uploaded — under review`);
    }, 1500);
  };

  const buyerTabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "saved", label: "Saved cars" },
    { id: "testdrives", label: "Test drives" },
    { id: "purchases", label: "Purchases" },
    { id: "kyc", label: "KYC" },
    { id: "notifications", label: "Notifications" },
  ];

  const sellerTabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "listings", label: "My listings" },
    { id: "inquiries", label: "Inquiries" },
    { id: "wallet", label: "Wallet & payouts" },
    { id: "kyc", label: "KYC" },
  ];

  const tabs = role === "seller" ? sellerTabs : buyerTabs;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* User header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-lg font-semibold">
            {user.avatar}
          </div>
          <div>
            <div className="text-xs text-slate-400">Welcome back,</div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <div className="text-xs text-slate-400">{user.phone} · {user.city}</div>
          </div>
          <div className="ml-2 flex flex-col items-start gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              user.kycStatus === "approved" ? "bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30" : 
              user.kycStatus === "submitted" ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30" :
              "bg-slate-700/50 text-slate-300 ring-1 ring-slate-500/30"
            }`}>
              KYC: {user.kycStatus}
            </span>
            {user.kycStatus !== "approved" && (
              <button onClick={() => setTab("kyc")} className="text-[10px] font-semibold text-brand-300 hover:text-brand-200">
                Complete now →
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.role === "admin" && (
            <div className="flex rounded-md bg-slate-800 p-1">
              <button
                onClick={() => setRole("buyer")}
                className={`rounded px-3 py-1.5 text-xs font-semibold ${role === "buyer" ? "bg-white text-slate-900" : "text-slate-300"}`}
              >
                Buyer
              </button>
              <button
                onClick={() => setRole("seller")}
                className={`rounded px-3 py-1.5 text-xs font-semibold ${role === "seller" ? "bg-white text-slate-900" : "text-slate-300"}`}
              >
                Seller
              </button>
            </div>
          )}
          <button onClick={() => { logout(); navigate("/"); }} className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-md border border-slate-200 bg-white p-1">
        {tabs.map((t) => (
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

      {/* Content */}
      {role === "buyer" && (
        <>
          {tab === "overview" && <BuyerOverview wishlist={wishlist} onSelectCar={(id) => navigate(`/car/${id}`)} />}
          {tab === "saved" && <BuyerSaved wishlist={wishlist} onSelectCar={(id) => navigate(`/car/${id}`)} />}
          {tab === "testdrives" && <BuyerTestDrives />}
          {tab === "purchases" && <BuyerPurchases />}
          {tab === "kyc" && <KYCStep kycDoc={kycDoc} kycUploading={kycUploading} onUpload={handleKycUpload} kycStatus={user.kycStatus} />}
          {tab === "notifications" && <BuyerNotifications />}
        </>
      )}

      {role === "seller" && (
        <>
          {tab === "overview" && <SellerOverview />}
          {tab === "listings" && <SellerListings />}
          {tab === "inquiries" && <SellerInquiries />}
          {tab === "wallet" && <SellerWallet />}
          {tab === "kyc" && <KYCStep kycDoc={kycDoc} kycUploading={kycUploading} onUpload={handleKycUpload} kycStatus={user.kycStatus} />}
        </>
      )}
    </div>
  );
}

function BuyerOverview({ wishlist, onSelectCar }: { wishlist: typeof CARS; onSelectCar: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="❤️" label="Saved cars" value="3" change="+1 this week" color="bg-red-50 text-red-700" />
        <StatCard icon="🔍" label="Saved searches" value="7" change="+1 active" color="bg-blue-50 text-blue-700" />
        <StatCard icon="🚗" label="Test drives" value="2" change="1 upcoming" color="bg-amber-50 text-amber-700" />
        <StatCard icon="💬" label="Active chats" value="4" change="3 unread" color="bg-brand-50 text-brand-700" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Your wishlist</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {wishlist.map((c) => (
              <CarCard key={c.id} car={c} onSelect={onSelectCar} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-900">Wallet</h3>
            <div className="mt-3 text-3xl font-bold text-slate-900">₹0</div>
            <div className="text-xs text-slate-500">No outstanding balance</div>
            <button className="mt-3 w-full rounded-md border border-slate-200 py-2 text-xs font-semibold">Top up wallet</button>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-700">Price drop alert</div>
            <div className="mt-2 font-semibold text-slate-900">2022 Honda City ZX CVT</div>
            <div className="mt-1 text-sm text-slate-600">Dropped by <span className="font-bold text-brand-600">₹45,000</span></div>
            <button className="mt-3 w-full rounded-md bg-slate-900 py-2 text-xs font-bold text-white">View car →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuyerSaved({ wishlist, onSelectCar }: { wishlist: typeof CARS; onSelectCar: (id: string) => void }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-900">Saved cars</h2>
      <p className="text-sm text-slate-500">Cars you've shortlisted</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wishlist.map((c) => (
          <CarCard key={c.id} car={c} onSelect={onSelectCar} />
        ))}
      </div>
    </div>
  );
}

function BuyerTestDrives() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Test drives</h2>
        <button className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Schedule new</button>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="divide-y divide-slate-100">
          {[
            { car: "2022 Hyundai Creta SX(O)", when: "Tomorrow · 11:00 AM", where: "TrustedCars Indiranagar", status: "Confirmed" },
            { car: "2023 Kia Seltos HTX+", when: "Sat, 14 Feb · 3:30 PM", where: "Home pickup", status: "Pending" },
          ].map((t) => (
            <div key={t.car} className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-slate-100 text-xl">🚗</div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{t.car}</div>
                <div className="text-xs text-slate-500">{t.when} · {t.where}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.status === "Confirmed" ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"}`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BuyerPurchases() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-900">Your purchases</h2>
      <div className="mt-4 space-y-3">
        {[
          { car: "2021 Honda City ZX CVT", amount: "₹13.25 L", date: "15 Jan 2026", status: "Delivered" },
        ].map((p) => (
          <div key={p.car} className="flex items-center gap-4 rounded-lg border border-slate-200 p-4">
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{p.car}</div>
              <div className="text-xs text-slate-500">Purchased on {p.date}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-900">{p.amount}</div>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">{p.status}</span>
            </div>
          </div>
        ))}
        {[
        ].length === 0 && (
          <div className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-600">
            No purchases yet. <a href="/cars" className="font-semibold text-brand-600">Browse cars →</a>
          </div>
        )}
      </div>
    </div>
  );
}

function BuyerNotifications() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="divide-y divide-slate-100">
        {[
          { icon: "🔔", title: "Price drop on Honda City", desc: "Saved car dropped by ₹45,000", time: "2h ago", unread: true },
          { icon: "💬", title: "New message from Priya", desc: "Hey, is the Creta still available?", time: "5h ago", unread: true },
          { icon: "📅", title: "Test drive tomorrow", desc: "Your Creta test drive is at 11 AM", time: "1d ago", unread: false },
          { icon: "✓", title: "Inspection report ready", desc: "Your car passed 200-point inspection", time: "3d ago", unread: false },
        ].map((n) => (
          <div key={n.title} className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-slate-100 text-xl">{n.icon}</div>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{n.title}</div>
              <div className="text-xs text-slate-500">{n.desc}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">{n.time}</div>
              {n.unread && <div className="mt-1 h-2 w-2 rounded-full bg-brand-500 ml-auto" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SellerOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="🏷️" label="Active listings" value="3" change="All live" color="bg-brand-50 text-brand-700" />
        <StatCard icon="👀" label="Total views" value="2.4k" change="+18% this week" color="bg-blue-50 text-blue-700" />
        <StatCard icon="💬" label="Inquiries" value="28" change="12 unread" color="bg-amber-50 text-amber-700" />
        <StatCard icon="⭐" label="Seller rating" value="4.9" change="Top 5%" color="bg-purple-50 text-purple-700" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Your listings</h2>
        <div className="mt-4 space-y-2">
          {[
            { car: "Hyundai Creta 2022", price: "₹16.45 L", views: "1,240", inq: 12, status: "Active" },
            { car: "Honda City 2021", price: "₹13.25 L", views: "842", inq: 9, status: "Active" },
            { car: "Maruti Swift 2023", price: "₹7.85 L", views: "318", inq: 7, status: "Under review" },
          ].map((l) => (
            <div key={l.car} className="flex items-center gap-4 rounded-md border border-slate-200 p-3">
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{l.car}</div>
                <div className="text-xs text-slate-500">{l.views} views · {l.inq} inquiries</div>
              </div>
              <div className="font-bold">{l.price}</div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${l.status === "Active" ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"}`}>
                {l.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SellerListings() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <h2 className="font-bold text-slate-900">My listings</h2>
        <button className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">+ List new car</button>
      </div>
      <div className="divide-y divide-slate-100">
        {[
          { car: "Hyundai Creta 2022", price: "₹16.45 L", views: "1,240", inq: 12, status: "Active" },
          { car: "Honda City 2021", price: "₹13.25 L", views: "842", inq: 9, status: "Active" },
        ].map((l) => (
          <div key={l.car} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{l.car}</div>
              <div className="text-xs text-slate-500">{l.views} views · {l.inq} inquiries</div>
            </div>
            <div className="font-bold">{l.price}</div>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">{l.status}</span>
            <button className="text-xs font-semibold text-brand-600">Manage →</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SellerInquiries() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="divide-y divide-slate-100">
        {[
          { name: "Rahul Kumar", car: "Hyundai Creta", time: "5 min ago", status: "New" },
          { name: "Priya Sharma", car: "Honda City", time: "1 hour ago", status: "Replied" },
          { name: "Amit Patel", car: "Swift", time: "3 hours ago", status: "Viewed" },
        ].map((i) => (
          <div key={i.name} className="flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
              {i.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{i.name}</div>
              <div className="text-xs text-slate-500">Interested in {i.car} · {i.time}</div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              i.status === "New" ? "bg-brand-50 text-brand-700" : i.status === "Replied" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
            }`}>{i.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SellerWallet() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard icon="💰" label="Available balance" value="₹42,800" change="Ready to withdraw" color="bg-brand-50 text-brand-700" />
      <StatCard icon="⏳" label="Pending" value="₹12,400" change="Settles in 3 days" color="bg-amber-50 text-amber-700" />
      <StatCard icon="🏦" label="Lifetime payouts" value="₹4.2L" change="Across 18 sales" color="bg-blue-50 text-blue-700" />
    </div>
  );
}

function KYCStep({ kycDoc, kycUploading, onUpload, kycStatus }: { kycDoc: "pan" | "aadhaar" | null; kycUploading: boolean; onUpload: (doc: "pan" | "aadhaar") => void; kycStatus: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-900">KYC verification</h2>
      <p className="text-sm text-slate-500">Required by RBI for transactions above ₹2 lakh. Your data is encrypted and never shared.</p>
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current status</div>
        <div className="mt-1 text-base font-bold text-slate-900 capitalize">{kycStatus}</div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {(["pan", "aadhaar"] as const).map((doc) => (
          <div key={doc} className="rounded-lg border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">{doc === "pan" ? "PAN Card" : "Aadhaar Card"}</div>
            <div className="text-xs text-slate-500">{doc === "pan" ? "10-character alphanumeric" : "12-digit number"}</div>
            <input
              type="text"
              placeholder={doc === "pan" ? "ABCDE1234F" : "1234 5678 9012"}
              className="tc-input mt-3"
              maxLength={doc === "pan" ? 10 : 14}
            />
            <button
              onClick={() => onUpload(doc)}
              disabled={kycUploading && kycDoc === doc}
              className="mt-3 w-full rounded-md bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {kycUploading && kycDoc === doc ? "Uploading..." : `Upload ${doc.toUpperCase()}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, change, color }: { icon: string; label: string; value: string; change: string; color: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-md text-lg ${color}`}>{icon}</div>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-[11px] text-slate-500">{change}</div>
    </div>
  );
}
