import { useState } from "react";
import { toast } from "../components/Toast";

const FAQ_GROUPS = [
  {
    title: "Buying a car",
    items: [
      { q: "How does TrustedCars certification work?", a: "Every car undergoes a 200-point inspection by certified engineers covering engine, transmission, electrical, body, interior, tyres, battery, and more. We also verify RC, insurance, and challan history." },
      { q: "What is the 7-day return policy?", a: "Drive the car for 7 days or 300 km (whichever comes first). If you're not 100% happy, return it for a full refund — no questions asked. We'll pick it up from your doorstep." },
      { q: "What does the listed price include?", a: "The listed price includes TrustedCars certification, RC transfer support, standard delivery, insurance activation assistance, and the 7-day return guarantee." },
      { q: "Can I take a test drive before buying?", a: "Absolutely. Schedule a free test drive at our hub or at your doorstep through any car listing page. No commitment required." },
    ],
  },
  {
    title: "Selling a car",
    items: [
      { q: "How fast will I get paid?", a: "After a free doorstep inspection (30 min), we confirm our offer on the spot. You receive 50% instantly via UPI/NEFT and the remaining 48 hours after RC transfer." },
      { q: "Are there any fees?", a: "Zero. No commission, no hidden charges, no inspection fees. The price we offer is what you receive." },
      { q: "What documents do I need?", a: "RC book, insurance papers, PUC certificate, service history, and both keys. Our team handles RC transfer, NOC, and challan clearance at no extra cost." },
    ],
  },
  {
    title: "Account & KYC",
    items: [
      { q: "Why is KYC required?", a: "KYC (PAN + Aadhaar) is mandatory under RBI guidelines for transactions above ₹2 lakh. It protects you from fraud and enables instant payments." },
      { q: "How long does KYC approval take?", a: "Most KYC submissions are auto-approved within 2 hours. Manual reviews take up to 24 hours." },
      { q: "Is my data safe?", a: "We use bank-grade 256-bit encryption and never share your data with third parties without consent. All documents are stored in ISO 27001 certified data centres." },
    ],
  },
];

const VIDEOS = [
  { title: "How a 200-point inspection works", duration: "2:14", thumbnail: "🎥" },
  { title: "Selling your car in 48 hours", duration: "3:08", thumbnail: "💰" },
  { title: "Understanding your inspection report", duration: "4:21", thumbnail: "📋" },
  { title: "RC transfer and handover explained", duration: "5:42", thumbnail: "📄" },
];

export default function SupportPage() {
  const [openItem, setOpenItem] = useState<string | null>("0-0");
  const [ticketForm, setTicketForm] = useState({ subject: "", description: "", category: "Buying" });
  const [showCallback, setShowCallback] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          How can we help?
        </h1>
        <p className="mt-2 text-slate-600">
          Search our help centre, watch video guides, or chat with our support team.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for answers..."
            className="tc-input h-12 pl-12"
          />
          <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Quick action cards */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: "💬", title: "Live chat", desc: "Avg. response 2 min", action: "Start chat" },
          { icon: "📞", title: "Request callback", desc: "We'll call you in 5 min", action: "Call me" },
          { icon: "📧", title: "Email support", desc: "Reply within 4 hours", action: "Send email" },
          { icon: "🎫", title: "Track ticket", desc: "Check existing status", action: "View tickets" },
        ].map((card) => (
          <div key={card.title} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="text-3xl">{card.icon}</div>
            <h3 className="mt-3 font-semibold text-slate-900">{card.title}</h3>
            <p className="mt-1 text-xs text-slate-500">{card.desc}</p>
            <button
              onClick={() => {
                if (card.title === "Request callback") {
                  setShowCallback(true);
                } else if (card.title === "Live chat") {
                  toast.info("Live chat coming soon — please use the form below to create a ticket.");
                } else {
                  toast.info(`${card.title} flow coming soon`);
                }
              }}
              className="mt-3 w-full rounded-md border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              {card.action} →
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        {/* FAQ Accordion */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Frequently asked questions</h2>
          {FAQ_GROUPS.map((group, gi) => (
            <div key={group.title}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{group.title}</h3>
              <div className="mt-3 space-y-2">
                {group.items.map((item, ii) => {
                  const key = `${gi}-${ii}`;
                  const isOpen = openItem === key;
                  return (
                    <div key={key} className="rounded-lg border border-slate-200 bg-white">
                      <button
                        onClick={() => setOpenItem(isOpen ? null : key)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
                      >
                        <span className="font-semibold text-slate-900">{item.q}</span>
                        <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-transform ${isOpen ? "rotate-45" : ""}`}>
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                        </span>
                      </button>
                      {isOpen && (
                        <div className="animate-fade-in border-t border-slate-100 px-4 py-3.5 text-sm leading-relaxed text-slate-600">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar - Create ticket */}
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">Create a ticket</h3>
            <p className="text-xs text-slate-500">We typically reply in 2 hours</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!ticketForm.subject) return;
                toast.success("Ticket #TC-" + Math.floor(1000 + Math.random() * 9000) + " created. We'll email you shortly.");
                setTicketForm({ subject: "", description: "", category: "Buying" });
              }}
              className="mt-4 space-y-3"
            >
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                className="tc-input"
              >
                <option>Buying</option>
                <option>Selling</option>
                <option>Inspection</option>
                <option>Payment</option>
                <option>Other</option>
              </select>
              <input
                type="text"
                placeholder="Subject"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                className="tc-input"
              />
              <textarea
                placeholder="Describe your issue..."
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                rows={4}
                className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <button type="submit" className="tc-btn tc-btn-dark w-full">
                Submit ticket
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">Video guides</h3>
            <div className="mt-4 space-y-2">
              {VIDEOS.map((v) => (
                <button
                  key={v.title}
                  onClick={() => toast.info("Video player coming soon")}
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-slate-50"
                >
                  <div className="flex h-12 w-16 flex-none items-center justify-center rounded bg-slate-100 text-xl">
                    {v.thumbnail}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{v.title}</div>
                    <div className="text-xs text-slate-500">{v.duration}</div>
                  </div>
                  <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-bold text-slate-900">Direct contact</h3>
            <div className="mt-3 space-y-2 text-sm">
              <a href="tel:+918000123456" className="flex items-center gap-2 text-slate-700 hover:text-slate-900">
                <span>📞</span> +91 80 0012 3456
              </a>
              <a href="mailto:help@trustedcars.in" className="flex items-center gap-2 text-slate-700 hover:text-slate-900">
                <span>✉️</span> help@trustedcars.in
              </a>
              <div className="flex items-center gap-2 text-slate-700">
                <span>⏰</span> Mon-Sat, 9 AM - 9 PM
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Callback modal */}
      {showCallback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setShowCallback(false)} />
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Request a callback</h3>
            <p className="mt-1 text-sm text-slate-600">We'll call you in 5 minutes during business hours.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Callback requested! We'll call you shortly.");
                setShowCallback(false);
              }}
              className="mt-4 space-y-3"
            >
              <input type="text" placeholder="Your name" className="tc-input" required />
              <input type="tel" placeholder="+91 98765 43210" className="tc-input" required />
              <select className="tc-input">
                <option>Buying</option>
                <option>Selling</option>
                <option>Financing</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCallback(false)} className="tc-btn tc-btn-ghost flex-1">
                  Cancel
                </button>
                <button type="submit" className="tc-btn tc-btn-primary flex-1">
                  Request callback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
