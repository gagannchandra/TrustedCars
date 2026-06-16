import { Router } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { store } from "../db.js";
import { badRequest, notFound } from "../errors.js";
import { id } from "../utils/id.js";
import { notify, sendEmail, sendSms } from "../services/notification.service.js";

const router = Router();

const bookingSchema = z.object({ body: z.object({ car_id: z.string(), date: z.string(), slot: z.string(), address: z.string().min(10), lat: z.coerce.number().optional(), lng: z.coerce.number().optional() }) });

router.post("/bookings", authenticate, validate(bookingSchema), (req, res, next) => {
  const car = store.cars.find((item) => item.id === req.validated.body.car_id);
  if (!car) return next(notFound("Car not found"));
  const booking = {
    id: id("book"),
    buyer_id: req.user.id,
    seller_id: car.seller_id,
    car_id: car.id,
    inspector_id: "usr_admin",
    status: "confirmed",
    slot: req.validated.body.slot,
    scheduled_at: `${req.validated.body.date}T${to24h(req.validated.body.slot)}:00.000Z`,
    address: req.validated.body.address,
    lat: req.validated.body.lat,
    lng: req.validated.body.lng,
    tracking_token: id("track"),
    created_at: new Date().toISOString(),
  };
  store.bookings.push(booking);
  notify(req.user.id, "inspection", "Inspection confirmed", `Your inspection for ${car.make} ${car.model} is confirmed.`, `/inspection/${car.id}`);
  if (req.user.phone) sendSms(req.user.phone, `TrustedCars inspection confirmed for ${car.make} ${car.model} at ${booking.slot}.`);
  if (req.user.email) sendEmail(req.user.email, "Inspection confirmed", `Your TrustedCars inspection is confirmed for ${booking.slot}.`);
  res.status(201).json({ success: true, data: booking });
});

router.get("/bookings/:id/tracking", authenticate, (req, res, next) => {
  const booking = store.bookings.find((item) => item.id === req.params.id || item.tracking_token === req.params.id);
  if (!booking) return next(notFound("Booking not found"));
  res.json({ success: true, data: { ...booking, inspector_location: { lat: 12.9716 + Math.random() / 100, lng: 77.5946 + Math.random() / 100 }, eta_minutes: 18 } });
});

router.get("/reports/:inspectionId", (req, res, next) => {
  const inspection = store.inspections.find((item) => item.id === req.params.inspectionId || item.car_id === req.params.inspectionId || item.share_token === req.params.inspectionId);
  if (!inspection) return next(notFound("Inspection report not found"));
  const checklist = store.checklistItems.filter((item) => item.inspection_id === inspection.id);
  res.json({ success: true, data: { inspection, categories: groupChecklist(checklist), checklist, share_url: `/api/v1/inspections/reports/${inspection.share_token}` } });
});

router.get("/reports/:inspectionId/pdf", (req, res, next) => {
  const inspection = store.inspections.find((item) => item.id === req.params.inspectionId || item.car_id === req.params.inspectionId || item.share_token === req.params.inspectionId);
  if (!inspection) return next(notFound("Inspection report not found"));
  const pdf = `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj\n4 0 obj << /Length 95 >> stream\nBT /F1 18 Tf 72 720 Td (TrustedCars Inspection Report ${inspection.score}/100) Tj ET\nendstream endobj\nxref\n0 5\n0000000000 65535 f\ntrailer << /Root 1 0 R >>\nstartxref\n290\n%%EOF`;
  res.setHeader("content-type", "application/pdf");
  res.setHeader("content-disposition", `attachment; filename="trustedcars-${inspection.id}.pdf"`);
  res.send(Buffer.from(pdf));
});

router.patch("/:id/checklist", authenticate, requireRole("admin"), (req, res, next) => {
  const inspection = store.inspections.find((item) => item.id === req.params.id);
  if (!inspection) return next(notFound("Inspection not found"));
  if (!Array.isArray(req.body.items)) return next(badRequest("items must be an array"));
  req.body.items.forEach((item) => store.checklistItems.push({ id: id("chk"), inspection_id: inspection.id, ...item }));
  inspection.score = Math.round((store.checklistItems.filter((item) => item.inspection_id === inspection.id && item.condition === "pass").length / store.checklistItems.filter((item) => item.inspection_id === inspection.id).length) * 100);
  res.json({ success: true, data: inspection });
});

function groupChecklist(items) {
  return items.reduce((acc, item) => {
    acc[item.category] ||= { total: 0, passed: 0, defects: [] };
    acc[item.category].total += 1;
    if (item.condition === "pass") acc[item.category].passed += 1;
    if (item.condition !== "pass") acc[item.category].defects.push(item);
    return acc;
  }, {});
}

function to24h(slot) {
  const match = String(slot).match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
  if (!match) return "11:00";
  let hour = Number(match[1]);
  const minute = match[2] || "00";
  const meridian = match[3].toUpperCase();
  if (meridian === "PM" && hour !== 12) hour += 12;
  if (meridian === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export default router;