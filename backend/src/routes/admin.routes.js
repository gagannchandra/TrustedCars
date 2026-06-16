import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { store } from "../db.js";
import { hydrateCar, moderateListing } from "../services/car.service.js";
import { riskLabel } from "../services/fraud.service.js";
import { notFound } from "../errors.js";

const router = Router();
router.use(authenticate, requireRole("admin"));

router.get("/metrics", (_req, res) => {
  const gmv = store.orders.reduce((sum, order) => sum + order.amount_paise, 0);
  res.json({
    success: true,
    data: {
      total_users: store.users.length,
      total_listings: store.cars.length,
      active_listings: store.cars.filter((car) => car.status === "active").length,
      pending_listings: store.cars.filter((car) => car.status === "pending").length,
      orders: store.orders.length,
      gmv_paise: gmv,
      revenue_paise: Math.round(gmv * 0.025),
      inspections_completed: store.inspections.filter((insp) => insp.status === "completed").length,
      open_tickets: store.supportTickets.filter((ticket) => ticket.status !== "resolved").length,
    },
  });
});

router.get("/moderation/listings", (_req, res) => {
  res.json({ success: true, data: store.cars.filter((car) => car.status === "pending").map(hydrateCar) });
});

router.patch("/moderation/listings/:id", (req, res) => {
  res.json({ success: true, data: moderateListing(req.user, req.params.id, req.body.action, req.body.reason) });
});

router.get("/kyc", (_req, res) => {
  res.json({ success: true, data: store.users.filter((user) => user.kyc_status === "submitted" || user.kyc_status === "pending") });
});

router.patch("/kyc/:userId", (req, res, next) => {
  const user = store.users.find((item) => item.id === req.params.userId);
  if (!user) return next(notFound("User not found"));
  user.kyc_status = req.body.status || "approved";
  user.kyc_reviewed_at = new Date().toISOString();
  res.json({ success: true, data: user });
});

router.get("/fraud", (_req, res) => {
  const items = store.cars.map((car) => ({ car: hydrateCar(car), score: car.fraud_score, risk: riskLabel(car.fraud_score), reasons: car.fraud_score >= 40 ? ["Manual review recommended"] : [] })).sort((a, b) => b.score - a.score);
  res.json({ success: true, data: items });
});

router.get("/inspectors", (_req, res) => {
  res.json({ success: true, data: [
    { id: "insp_1", name: "Ramesh Kumar", city: "Bengaluru", active_jobs: 4, completed_today: 8, avg_score: 92.4, rating: 4.9 },
    { id: "insp_2", name: "Manoj Patel", city: "Mumbai", active_jobs: 6, completed_today: 7, avg_score: 90.7, rating: 4.7 },
    { id: "insp_3", name: "Vijay Singh", city: "Delhi", active_jobs: 5, completed_today: 6, avg_score: 91.8, rating: 4.8 },
  ] });
});

router.get("/cities", (_req, res) => res.json({ success: true, data: store.cities }));

router.patch("/cities/:slug", (req, res, next) => {
  const city = store.cities.find((item) => item.slug === req.params.slug);
  if (!city) return next(notFound("City not found"));
  Object.assign(city, req.body, { updated_at: new Date().toISOString() });
  res.json({ success: true, data: city });
});

export default router;