import { nanoid } from "nanoid";

export function id(prefix) {
  return `${prefix}_${nanoid(12)}`;
}

export function orderNumber(prefix = "TC") {
  return `${prefix}-${Date.now().toString().slice(-8)}-${nanoid(4).toUpperCase()}`;
}