import crypto from "crypto";
import { config } from "../config.js";
import { store } from "../db.js";
import { badRequest } from "../errors.js";
import { id, orderNumber } from "../utils/id.js";

export function createRazorpayOrder({ amount_paise, receipt, notes = {} }) {
  return {
    id: `order_${crypto.randomBytes(8).toString("hex")}`,
    entity: "order",
    amount: amount_paise,
    amount_paid: 0,
    amount_due: amount_paise,
    currency: "INR",
    receipt,
    status: "created",
    key_id: config.razorpayKeyId,
    notes,
  };
}

export function createTokenDeposit({ buyer_id, car_id, method }) {
  const car = store.cars.find((item) => item.id === car_id);
  if (!car) throw badRequest("Car not found");
  if (car.status !== "active") throw badRequest("Car is not available for checkout");

  const payment = {
    id: id("pay"),
    user_id: buyer_id,
    car_id,
    amount_paise: 500000,
    method,
    gateway: "razorpay_mock",
    gateway_order_id: createRazorpayOrder({ amount_paise: 500000, receipt: `token_${car_id}` }).id,
    escrow_status: "held",
    status: "paid",
    created_at: new Date().toISOString(),
  };
  store.payments.push(payment);

  let order = store.orders.find((item) => item.car_id === car_id && item.buyer_id === buyer_id && item.status === "reserved");
  if (!order) {
    order = {
      id: id("ord"),
      order_number: orderNumber(),
      car_id,
      buyer_id,
      seller_id: car.seller_id,
      token_payment_id: payment.id,
      full_payment_id: null,
      amount_paise: car.price_paise,
      status: "reserved",
      delivery_date: null,
      created_at: new Date().toISOString(),
    };
    store.orders.push(order);
  }
  return { payment, order };
}

export function createFullPayment({ buyer_id, car_id, method }) {
  const car = store.cars.find((item) => item.id === car_id);
  if (!car) throw badRequest("Car not found");
  const order = store.orders.find((item) => item.car_id === car_id && item.buyer_id === buyer_id && item.status === "reserved");
  if (!order) throw badRequest("Pay token deposit before full payment");

  const amount = Math.max(car.price_paise - 500000, 0);
  const payment = {
    id: id("pay"),
    user_id: buyer_id,
    car_id,
    amount_paise: amount,
    method,
    gateway: "razorpay_mock",
    gateway_order_id: createRazorpayOrder({ amount_paise: amount, receipt: `full_${car_id}` }).id,
    escrow_status: "held",
    status: "paid",
    created_at: new Date().toISOString(),
  };
  store.payments.push(payment);
  order.full_payment_id = payment.id;
  order.status = "paid";
  return { payment, order };
}