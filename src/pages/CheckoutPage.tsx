import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CARS } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Toast";

type Step = "documents" | "payment" | "delivery" | "confirm";

export default function CheckoutPage() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const car = CARS.find((c) => c.id === carId);

  const [step, setStep] = useState<Step>("documents");
  const [documents, setDocuments] = useState({
    pan: { number: "", file: null as File | null, verified: false },
    aadhaar: { number: "", file: null as File | null, verified: false },
  });
  const [tokenPaid, setTokenPaid] = useState(false);
  const [fullPaid, setFullPaid] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });
  const [orderId, setOrderId] = useState<string | null>(null);

  if (!car) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Car not found</h1>
        <Link to="/cars" className="mt-4 inline-block text-brand-600">Browse cars →</Link>
      </div>
    );
  }

  const handleFileUpload = (type: "pan" | "aadhaar") => {
    setDocuments((d) => ({ ...d, [type]: { ...d[type], file: { name: type + ".pdf" } as File } }));
    setTimeout(() => {
      setDocuments((d) => ({ ...d, [type]: { ...d[type], verified: true } }));
      toast.success(`${type.toUpperCase()} verified ✓`);
    }, 1200);
  };

  const handleTokenPay = () => {
    toast.success("Processing payment...");
    setTimeout(() => {
      setTokenPaid(true);
      toast.success("Token deposit of ₹5,000 received");
      setStep("payment");
    }, 1500);
  };

  const handleFullPay = () => {
    toast.success("Processing payment...");
    setTimeout(() => {
      setFullPaid(true);
      toast.success("Payment successful!");
      setStep("delivery");
    }, 1500);
  };

  const handleConfirmOrder = () => {
    const newOrderId = "TC-" + Date.now().toString().slice(-7);
    setOrderId(newOrderId);
    if (user) updateProfile({ kycStatus: "approved" });
    setStep("confirm");
    toast.success("Order confirmed!");
  };

  const steps: { id: Step; label: string; done: boolean }[] = [
    { id: "documents", label: "KYC", done: documents.pan.verified && documents.aadhaar.verified },
    { id: "payment", label: "Payment", done: tokenPaid && fullPaid },
    { id: "delivery", label: "Delivery", done: false },
    { id: "confirm", label: "Confirm", done: false },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-4">
        <Link to={`/car/${car.id}`} className="text-sm text-slate-600 hover:text-slate-900">← Back to car</Link>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Secure checkout</h1>
      <p className="mt-1 text-sm text-slate-600">Token deposit, document verification, and home delivery.</p>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-semibold ${
              s.done ? "bg-brand-500 text-white" : step === s.id ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
            }`}>
              {s.done ? "✓" : i + 1}
            </div>
            <span className={`text-sm font-medium ${step === s.id ? "text-slate-900" : "text-slate-500"} hidden sm:inline`}>{s.label}</span>
            {i < steps.length - 1 && <div className="h-px w-6 bg-slate-200" />}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {step === "documents" && (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">KYC documents</h2>
              <p className="mt-1 text-sm text-slate-600">Required by RBI for transactions above ₹2 lakh.</p>

              <div className="mt-5 space-y-4">
                {(["pan", "aadhaar"] as const).map((type) => (
                  <div key={type} className="rounded-md border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">{type === "pan" ? "PAN Card" : "Aadhaar Card"}</div>
                      {documents[type].verified && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">✓ Verified</span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder={type === "pan" ? "ABCDE1234F" : "1234 5678 9012"}
                      value={documents[type].number}
                      onChange={(e) => setDocuments((d) => ({ ...d, [type]: { ...d[type], number: e.target.value } }))}
                      className="tc-input mt-3"
                      maxLength={type === "pan" ? 10 : 14}
                    />
                    <button
                      onClick={() => handleFileUpload(type)}
                      disabled={documents[type].verified}
                      className="mt-3 w-full rounded-md border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-600 disabled:opacity-50"
                    >
                      {documents[type].verified ? `✓ ${type.toUpperCase()} verified` : `Upload ${type.toUpperCase()}`}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  if (!documents.pan.number || !documents.aadhaar.number) {
                    toast.error("Please fill in both document numbers");
                    return;
                  }
                  setStep("payment");
                }}
                className="tc-btn tc-btn-dark mt-5 w-full"
              >
                Continue to payment
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 1 · Token deposit</h2>
                    <p className="mt-1 text-sm text-slate-600">Refundable ₹5,000 token to reserve the car for 24 hours.</p>
                  </div>
                  {tokenPaid && <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">✓ Paid</span>}
                </div>
                {!tokenPaid ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {["UPI", "Card", "Net banking"].map((m) => (
                      <button key={m} onClick={handleTokenPay} className="flex h-11 items-center justify-center rounded-md border-2 border-slate-200 text-sm font-semibold transition-colors hover:border-brand-500">
                        {m}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-md border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
                    <strong>Token received.</strong> Car reserved for 24 hours.
                  </div>
                )}
              </div>

              {tokenPaid && (
                <div className="rounded-lg border border-slate-200 bg-white p-6">
                  <h2 className="text-lg font-bold text-slate-900">Step 2 · Final payment</h2>
                  <p className="mt-1 text-sm text-slate-600">Pay the remaining amount to confirm your purchase.</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {["UPI", "Debit card", "Credit card", "Net banking", "Wallet", "Pay later"].map((m) => (
                      <button key={m} className="rounded-md border-2 border-slate-200 py-2.5 text-sm font-semibold transition-colors hover:border-brand-500">
                        {m}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleFullPay} disabled={fullPaid} className="tc-btn tc-btn-primary mt-4 w-full">
                    {fullPaid ? "✓ Payment complete" : `Pay ₹${(car.price * 100000 - 5000).toLocaleString("en-IN")} →`}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === "delivery" && (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">Schedule delivery</h2>
              <p className="mt-1 text-sm text-slate-600">We deliver to your doorstep between 9 AM and 6 PM.</p>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Delivery date</label>
                <input type="date" value={deliveryDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setDeliveryDate(e.target.value)} className="tc-input" />
              </div>
              <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm">
                <div className="font-semibold text-slate-900">What's included</div>
                <ul className="mt-2 space-y-1 text-slate-600">
                  <li>✓ Free home delivery in {user?.city || "your city"}</li>
                  <li>✓ RC transfer handled by us</li>
                  <li>✓ Insurance activated same day</li>
                  <li>✓ 7-day money-back guarantee begins</li>
                </ul>
              </div>
              <button onClick={handleConfirmOrder} className="tc-btn tc-btn-dark mt-4 w-full">
                Confirm order
              </button>
            </div>
          )}

          {step === "confirm" && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-3xl text-white">✓</div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">Order confirmed!</h2>
              <p className="mt-2 text-sm text-slate-600">Order ID: <span className="font-mono font-semibold">{orderId}</span></p>
              <p className="mt-1 text-sm text-slate-600">
                Delivery on <span className="font-semibold">{new Date(deliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button className="tc-btn tc-btn-ghost text-sm">📄 Invoice</button>
                <button onClick={() => navigate("/dashboard")} className="tc-btn tc-btn-dark text-sm">Dashboard</button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-900">Order summary</h3>
            <div className="mt-3 flex gap-3">
              <div className="aspect-4-3 h-14 w-20 flex-none overflow-hidden rounded bg-slate-100">
                <img src={car.image} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{car.year} {car.make} {car.model}</div>
                <div className="text-xs text-slate-500">{car.km.toLocaleString()} km · {car.fuel}</div>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <Row label="Car price" value={`₹${(car.price * 100000).toLocaleString("en-IN")}`} />
              <Row label="Token (paid)" value={tokenPaid ? "₹5,000 ✓" : "₹5,000"} />
              <Row label="RC transfer" value="Free" />
              <Row label="Insurance (1 yr)" value="Free ✓" />
              <Row label="Fast-tag" value="Free" />
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-slate-900">Total</div>
                <div className="text-lg font-bold text-slate-900">₹{(car.price * 100000).toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-md bg-slate-50 p-3 text-[11px] text-slate-600">
            <strong>100% safe.</strong> Payment held in escrow until 7-day return window expires.
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
