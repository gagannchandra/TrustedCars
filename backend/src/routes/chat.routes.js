import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { store } from "../db.js";
import { badRequest, notFound } from "../errors.js";
import { id } from "../utils/id.js";

const router = Router();
router.use(authenticate);

router.get("/rooms", (req, res) => {
  const rooms = store.chatRooms.filter((room) => [room.buyer_id, room.seller_id].includes(req.user.id));
  res.json({ success: true, data: rooms });
});

router.post("/rooms", (req, res, next) => {
  const { car_id, seller_id } = req.body;
  const car = store.cars.find((item) => item.id === car_id);
  if (!car) return next(notFound("Car not found"));
  const sellerId = seller_id || car.seller_id;
  if (sellerId === req.user.id) return next(badRequest("Cannot start a chat with yourself"));
  let room = store.chatRooms.find((item) => item.car_id === car_id && item.buyer_id === req.user.id && item.seller_id === sellerId);
  if (!room) {
    room = { id: id("room"), buyer_id: req.user.id, seller_id: sellerId, car_id, last_message_at: null, created_at: new Date().toISOString() };
    store.chatRooms.push(room);
  }
  res.status(201).json({ success: true, data: room });
});

router.get("/rooms/:id/messages", (req, res, next) => {
  const room = store.chatRooms.find((item) => item.id === req.params.id);
  if (!room || ![room.buyer_id, room.seller_id].includes(req.user.id)) return next(notFound("Room not found"));
  res.json({ success: true, data: store.chatMessages.filter((item) => item.room_id === room.id) });
});

router.post("/rooms/:id/messages", (req, res, next) => {
  const room = store.chatRooms.find((item) => item.id === req.params.id);
  if (!room || ![room.buyer_id, room.seller_id].includes(req.user.id)) return next(notFound("Room not found"));
  const message = { id: id("msg"), room_id: room.id, sender_id: req.user.id, content: req.body.content, type: req.body.type || "text", offer_amount_paise: req.body.offer_amount_paise || null, read_at: null, created_at: new Date().toISOString() };
  store.chatMessages.push(message);
  room.last_message_at = message.created_at;
  res.status(201).json({ success: true, data: message });
});

export default router;