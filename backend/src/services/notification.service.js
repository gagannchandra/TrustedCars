import { id } from "../utils/id.js";
import { store } from "../db.js";

export function notify(userId, type, title, message, actionUrl = null) {
  const notification = {
    id: id("ntf"),
    user_id: userId,
    type,
    title,
    message,
    action_url: actionUrl,
    read: false,
    created_at: new Date().toISOString(),
  };
  store.notifications.unshift(notification);
  return notification;
}

export function sendSms(phone, message) {
  return { provider: "mock-sms", to: phone, message, status: "queued" };
}

export function sendEmail(email, subject, message) {
  return { provider: "mock-email", to: email, subject, message, status: "queued" };
}