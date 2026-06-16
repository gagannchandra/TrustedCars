import { Router } from "express";
import multer from "multer";
import { authenticate, requireRole } from "../middleware/auth.js";
import { store } from "../db.js";
import { badRequest, notFound } from "../errors.js";
import { id } from "../utils/id.js";
import { createFullPayment, createTokenDeposit } from "../services/payment.service.js";
import { notify } from "../services/notification.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.post("/documents", authenticate, requireRole("buyer", "admin"), upload.fields([{ name: "pan", maxCount: 1 }, { name: "aadhaar", maxCount: 1 }]), (req, res) => {
  const user = store.users.find((item) => item.id === req.user.id);
  user.kyc_status = "submitted";
  const documents = ["pan", "aadhaar"].map((type) => ({ id: id("doc"), user_id: user.id, type, number: req.body?.[`${type}_number`] || null, file_url: `https://res.cloudinary.com/trustedcars-demo/kyc/${user.id}_${type}.pdf`, status: "submitted", created_at: new Date().toISOString() }));
  res.status(201).json({ success: true, data: { kyc_status: user.kyc_status, documents } });
});

router.post("/token", authenticate, requireRole("buyer", "admin"), (req, res) => {
  const { car_id, method = "upi" } = req.body;
  const result = createTokenDeposit({ buyer_id: req.user.id, car_id, method });
  notify(req.user.id, "payment", "Token received", "Your ₹5,000 token deposit is safely held in escrow.", `/checkout/${car_id}`);
  res.status(201).json({ success: true, data: result });
});

router.post("/full-payment", authenticate, requireRole("buyer", "admin"), (req, res) => {
  const { car_id, method = "upi" } = req.body;
  const result = createFullPayment({ buyer_id: req.user.id, car_id, method });
  notify(req.user.id, "payment", "Payment received", "Your payment is held in escrow until handover is complete.", `/checkout/${car_id}`);
  res.status(201).json({ success: true, data: result });
});

router.post("/confirm", authenticate, requireRole("buyer", "admin"), (req, res, next) => {
  const { order_id, delivery_date } = req.body;
  const order = store.orders.find((item) => item.id === order_id && item.buyer_id === req.user.id);
  if (!order) return next(notFound("Order not found"));
  if (order.status !== "paid") return next(badRequest("Full payment is required before confirmation"));
  order.delivery_date = delivery_date;
  order.status = "delivery_scheduled";
  const car = store.cars.find((item) => item.id === order.car_id);
  if (car) car.status = "reserved";
  res.json({ success: true, data: { order, confirmation_pdf_url: `/api/v1/checkout/orders/${order.id}/confirmation.pdf` } });
});

router.get("/orders/:id", authenticate, (req, res, next) => {
  const order = store.orders.find((item) => item.id === req.params.id || item.order_number === req.params.id);
  if (!order) return next(notFound("Order not found"));
  if (req.user.role !== "admin" && ![order.buyer_id, order.seller_id].includes(req.user.id)) return next(notFound("Order not found"));
  res.json({ success: true, data: order });
});

export default router;