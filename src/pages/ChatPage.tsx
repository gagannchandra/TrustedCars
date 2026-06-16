import { useState } from "react";
import { toast } from "../components/Toast";

type Message = {
  id: number;
  sender: "me" | "them";
  text: string;
  time: string;
  type?: "text" | "offer";
  amount?: number;
};

const conversations: {
  id: number;
  name: string;
  car: string;
  avatar: string;
  unread: number;
  online: boolean;
  lastMessage: string;
  messages: Message[];
}[] = [
  {
    id: 1,
    name: "TrustedCars Indiranagar",
    car: "2022 Hyundai Creta SX(O)",
    avatar: "TC",
    unread: 2,
    online: true,
    lastMessage: "Test drive confirmed for tomorrow at 11 AM!",
    messages: [
      { id: 1, sender: "them", text: "Hi Arjun! Thanks for your interest in the Creta. How can I help?", time: "Yesterday 3:42 PM" },
      { id: 2, sender: "me", text: "Hi! Is the car still available? I'd love to schedule a test drive.", time: "Yesterday 3:45 PM" },
      { id: 3, sender: "them", text: "Absolutely! We have slots tomorrow at 11 AM, 2 PM, and 5 PM. Which works?", time: "Yesterday 3:47 PM" },
      { id: 4, sender: "me", text: "11 AM works perfectly. Where do I come?", time: "Yesterday 4:12 PM" },
      { id: 5, sender: "them", text: "Our Indiranagar hub — 100ft Road, near Metro. I'll send you the exact location.", time: "Yesterday 4:15 PM" },
      { id: 6, sender: "them", text: "Test drive confirmed for tomorrow at 11 AM!", time: "Today 9:02 AM" },
    ],
  },
  {
    id: 2,
    name: "Rohan Mehta",
    car: "2021 Honda City ZX CVT",
    avatar: "RM",
    unread: 0,
    online: false,
    lastMessage: "Thanks, I'll check and get back.",
    messages: [
      { id: 1, sender: "them", text: "Hello, asking price is firm at ₹13.25L. Single owner, full service history.", time: "2 days ago" },
      { id: 2, sender: "me", type: "offer", amount: 1250000, text: "Offered ₹12.5 L", time: "2 days ago" },
      { id: 3, sender: "them", text: "Thanks, I'll check and get back.", time: "Yesterday" },
    ],
  },
  {
    id: 3,
    name: "TrustedCars Support",
    car: "Inspection booking",
    avatar: "TS",
    unread: 1,
    online: true,
    lastMessage: "Your inspection is confirmed for tomorrow at 11 AM!",
    messages: [
      { id: 1, sender: "them", text: "Your inspection is confirmed for tomorrow at 11 AM!", time: "Today 10:30 AM" },
    ],
  },
];

export default function ChatPage() {
  const [activeId, setActiveId] = useState(1);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(conversations[0].messages);

  const active = conversations.find((c) => c.id === activeId)!;

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: "me", text: input, time: "Just now" }]);
    setInput("");
    toast.success("Message sent");
  };

  const switchConvo = (id: number) => {
    setActiveId(id);
    setMessages(conversations.find((c) => c.id === id)!.messages);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
        {/* Conversation list */}
        <aside className="hidden w-80 flex-none border-r border-slate-200 md:block">
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-lg font-bold text-slate-900">Messages</h2>
            <p className="text-xs text-slate-500">3 active conversations</p>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => switchConvo(c.id)}
                className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${activeId === c.id ? "bg-brand-50" : "hover:bg-slate-50"}`}
              >
                <div className="relative flex-none">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    {c.avatar}
                  </div>
                  {c.online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-semibold text-slate-900">{c.name}</span>
                    {c.unread > 0 && <span className="rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">{c.unread}</span>}
                  </div>
                  <div className="truncate text-[11px] text-slate-500">{c.car}</div>
                  <div className="truncate text-xs text-slate-600">{c.lastMessage}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-slate-100 p-4">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {active.avatar}
              </div>
              {active.online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{active.name}</div>
              <div className="text-xs text-slate-500">{active.car} · {active.online ? "Online" : "Offline"}</div>
            </div>
            <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50">📞 Call</button>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
            <div className="mx-auto max-w-2xl space-y-3">
              <div className="text-center text-[10px] text-slate-500">🔒 End-to-end encrypted · Today</div>
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
                  {m.type === "offer" ? (
                    <div className="max-w-sm rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">💰 Offer made</div>
                      <div className="mt-1 text-xl font-bold text-slate-900">₹{(m.amount! / 100000).toFixed(2)} Lakh</div>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => toast.success("Offer accepted!")} className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-bold text-white">Accept</button>
                        <button onClick={() => toast.info("Counter offer flow")} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold">Counter</button>
                        <button onClick={() => toast.info("Offer declined")} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600">Decline</button>
                      </div>
                    </div>
                  ) : (
                    <div className={`max-w-sm rounded-2xl px-4 py-2.5 ${
                      m.sender === "me" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-900"
                    }`}>
                      <div className="text-sm">{m.text}</div>
                      <div className={`mt-1 text-[10px] ${m.sender === "me" ? "text-slate-400" : "text-slate-500"}`}>{m.time}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-2">
              <button className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">📎</button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={`Message ${active.name}…`}
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
              <button
                onClick={() => {
                  setMessages([...messages, { id: Date.now(), sender: "me", type: "offer", amount: 1400000, text: "Offered ₹14.0 L", time: "Just now" }]);
                  toast.success("Offer sent");
                }}
                className="rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
              >
                💰
              </button>
              <button onClick={send} className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600">
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
