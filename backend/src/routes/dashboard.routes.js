import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { store } from "../db.js";
import { hydrateCar } from "../services/car.service.js";

const router = Router();

router.get("/", authenticate, (req, res) => {
  const activeListings = store.cars.filter((car) => car.seller_id === req.user.id).map(hydrateCar);
  const purchases = store.orders.filter((order) => order.buyer_id === req.user.id);
  const appointments = store.bookings.filter((booking) => booking.buyer_id === req.user.id || booking.seller_id === req.user.id);
  const savedCars = store.wishlists.filter((wish) => wish.buyer_id === req.user.id).map((wish) => hydrateCar(store.cars.find((car) => car.id === wish.car_id))).filter(Boolean);
  const notifications = store.notifications.filter((item) => item.user_id === req.user.id);
  const payouts = store.payments.filter((payment) => {
    const car = store.cars.find((item) => item.id === payment.car_id);
    return car?.seller_id === req.user.id;
  });

  res.json({
    success: true,
    data: {
      user: req.user,
      active_listings: activeListings,
      purchases,
      inspection_appointments: appointments,
      wallet: { balance_paise: req.user.wallet_balance_paise || 0, payouts },
      saved_cars: savedCars,
      notifications,
      kyc_status: req.user.kyc_status,
    },
  });
});

router.post("/saved-searches", authenticate, (req, res) => {
  const saved = { id: `ss_${Date.now()}`, buyer_id: req.user.id, name: req.body.name, filters_json: req.body.filters || {}, alert_enabled: Boolean(req.body.alert_enabled), created_at: new Date().toISOString() };
  store.savedSearches.push(saved);
  res.status(201).json({ success: true, data: saved });
});

router.patch("/notifications/:id/read", authenticate, (req, res) => {
  const notification = store.notifications.find((item) => item.id === req.params.id && item.user_id === req.user.id);
  if (notification) notification.read = true;
  res.json({ success: true, data: notification || null });
});

export default router;