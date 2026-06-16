import { Router } from "express";
import { authenticate, optionalAuth, requireRole } from "../middleware/auth.js";
import { store } from "../db.js";
import { id } from "../utils/id.js";
import { notFound } from "../errors.js";

const router = Router();

const faqs = [
  { category: "Buying", q: "How does TrustedCars certification work?", a: "Every car undergoes a 200-point inspection covering engine, body, interior, tyres, battery and documentation." },
  { category: "Buying", q: "What is the 7-day return policy?", a: "Return the car within 7 days or 300 km for a full refund if you are not satisfied." },
  { category: "Selling", q: "How fast will I get paid?", a: "Most sellers receive payment within 48 hours after inspection and offer acceptance." },
  { category: "KYC", q: "Why is KYC required?", a: "KYC is required for large vehicle transactions and protects buyers and sellers from fraud." },
];

router.get("/faqs", (_req, res) => res.json({ success: true, data: faqs }));

router.post("/tickets", optionalAuth, (req, res) => {
  const ticket = { id: id("tkt"), user_id: req.user?.id || null, category: req.body.category || "General", subject: req.body.subject, description: req.body.description, status: "open", priority: req.body.priority || "medium", created_at: new Date().toISOString() };
  store.supportTickets.unshift(ticket);
  res.status(201).json({ success: true, data: ticket });
});

router.get("/tickets", authenticate, (req, res) => {
  const tickets = req.user.role === "admin" ? store.supportTickets : store.supportTickets.filter((item) => item.user_id === req.user.id);
  res.json({ success: true, data: tickets });
});

router.patch("/tickets/:id", authenticate, requireRole("admin"), (req, res, next) => {
  const ticket = store.supportTickets.find((item) => item.id === req.params.id);
  if (!ticket) return next(notFound("Ticket not found"));
  Object.assign(ticket, req.body, { updated_at: new Date().toISOString() });
  res.json({ success: true, data: ticket });
});

router.post("/callback", optionalAuth, (req, res) => {
  const callback = { id: id("cb"), user_id: req.user?.id || null, name: req.body.name, phone: req.body.phone, topic: req.body.topic || "Buying", status: "queued", eta_minutes: 5, created_at: new Date().toISOString() };
  res.status(201).json({ success: true, data: callback });
});

export default router;