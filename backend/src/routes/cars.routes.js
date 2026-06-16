import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { authenticate, optionalAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { addCarImage, createListing, getCar, moderateListing, searchCars } from "../services/car.service.js";
import { store } from "../db.js";
import { id } from "../utils/id.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 12 } });
const router = Router();

const createSchema = z.object({ body: z.object({ make: z.string().min(2), model: z.string().min(1), variant: z.string().optional(), year: z.coerce.number().int().min(2005), price_lakh: z.coerce.number().positive(), km_driven: z.coerce.number().nonnegative(), fuel_type: z.string(), transmission: z.string(), owner_count: z.coerce.number().int().min(1).max(5).default(1), body_type: z.string().optional(), color: z.string().optional(), registration_number: z.string().min(5), city_id: z.string().optional(), city_slug: z.string().optional(), primary_image_url: z.string().url().optional(), description: z.string().optional(), images: z.array(z.string().url()).optional() }) });

router.get("/", optionalAuth, (req, res) => {
  res.json({ success: true, data: searchCars(req.query), meta: { engine: "algolia-ready-local-search" } });
});

router.get("/featured", (_req, res) => {
  const items = searchCars({ status: "active", sort: "quality_desc", limit: 8 }).items;
  res.json({ success: true, data: items });
});

router.get("/recent", (_req, res) => {
  const items = searchCars({ status: "active", sort: "newest", limit: 8 }).items;
  res.json({ success: true, data: items });
});

router.get("/compare", (req, res) => {
  const ids = String(req.query.ids || "").split(",").filter(Boolean);
  res.json({ success: true, data: ids.map((carId) => getCar(carId)) });
});

router.get("/:id", (req, res) => {
  res.json({ success: true, data: getCar(req.params.id) });
});

router.post("/", authenticate, requireRole("seller", "admin"), validate(createSchema), asyncHandler(async (req, res) => {
  const result = createListing(req.user, req.validated.body);
  res.status(201).json({ success: true, data: result });
}));

router.post("/:id/images", authenticate, requireRole("seller", "admin"), upload.array("images", 12), (req, res) => {
  const images = (req.files || []).map((file) => addCarImage(req.user, req.params.id, file));
  res.status(201).json({ success: true, data: images });
});

router.post("/:id/wishlist", authenticate, requireRole("buyer", "admin"), (req, res) => {
  const existing = store.wishlists.find((item) => item.buyer_id === req.user.id && item.car_id === req.params.id);
  if (existing) {
    store.wishlists = store.wishlists.filter((item) => item.id !== existing.id);
    return res.json({ success: true, data: { wishlisted: false } });
  }
  const wishlist = { id: id("wish"), buyer_id: req.user.id, car_id: req.params.id, created_at: new Date().toISOString() };
  store.wishlists.push(wishlist);
  res.status(201).json({ success: true, data: { wishlisted: true, wishlist } });
});

router.patch("/:id/moderate", authenticate, requireRole("admin"), (req, res) => {
  const car = moderateListing(req.user, req.params.id, req.body.action, req.body.reason);
  res.json({ success: true, data: car });
});

export default router;