import { Router } from "express";
import { store } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { notFound } from "../errors.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ success: true, data: store.cities });
});

router.get("/:slug", (req, res, next) => {
  const city = store.cities.find((item) => item.slug === req.params.slug);
  if (!city) return next(notFound("City not found"));
  const cars = store.cars.filter((car) => car.city_id === city.id && car.status === "active");
  res.json({ success: true, data: { ...city, cars_count_live: cars.length } });
});

router.patch("/:slug", authenticate, requireRole("admin"), (req, res, next) => {
  const city = store.cities.find((item) => item.slug === req.params.slug);
  if (!city) return next(notFound("City not found"));
  Object.assign(city, req.body, { updated_at: new Date().toISOString() });
  res.json({ success: true, data: city });
});

export default router;