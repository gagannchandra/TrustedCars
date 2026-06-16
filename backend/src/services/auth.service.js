import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { store } from "../db.js";
import { badRequest, unauthorized } from "../errors.js";
import { id } from "../utils/id.js";
import { getPublicUser, signAccessToken, signRefreshToken } from "../middleware/auth.js";
import { sendSms } from "./notification.service.js";

function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (String(phone).startsWith("+")) return phone;
  return `+${digits}`;
}

export async function register({ name, email, phone, password, role = "buyer", city_id = "city_mumbai" }) {
  const normalizedPhone = normalizePhone(phone);
  if (store.users.some((user) => user.phone === normalizedPhone || user.email === email)) {
    throw badRequest("A user with this phone or email already exists");
  }
  const user = {
    id: id("usr"),
    name,
    email,
    phone: normalizedPhone,
    password_hash: await bcrypt.hash(password, 10),
    role,
    kyc_status: "pending",
    city_id,
    avatar_url: null,
    is_verified: true,
    wallet_balance_paise: 0,
    created_at: new Date().toISOString(),
  };
  store.users.push(user);
  return issueSession(user);
}

export async function login({ phone, password }) {
  const normalizedPhone = normalizePhone(phone);
  const user = store.users.find((item) => item.phone === normalizedPhone);
  if (!user) throw unauthorized("No account found with this phone number");
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw unauthorized("Incorrect password");
  return issueSession(user);
}

export function sendOtp(phone) {
  const normalizedPhone = normalizePhone(phone);
  const otp = config.demoOtp;
  store.otpCodes.set(normalizedPhone, { otp, expires_at: Date.now() + 5 * 60 * 1000 });
  return sendSms(normalizedPhone, `Your TrustedCars OTP is ${otp}. It expires in 5 minutes.`);
}

export function verifyOtp({ phone, otp }) {
  const normalizedPhone = normalizePhone(phone);
  const record = store.otpCodes.get(normalizedPhone);
  if (!record || record.expires_at < Date.now()) throw unauthorized("OTP expired. Please request a new code.");
  if (record.otp !== otp) throw unauthorized("Invalid OTP");
  store.otpCodes.delete(normalizedPhone);
  const user = store.users.find((item) => item.phone === normalizedPhone);
  if (!user) throw unauthorized("No account found with this phone number");
  return issueSession(user);
}

export function googleOAuth({ email, name, google_id, role = "buyer" }) {
  let user = store.users.find((item) => item.email === email);
  if (!user) {
    user = {
      id: id("usr"),
      name,
      email,
      phone: null,
      password_hash: null,
      role,
      kyc_status: "pending",
      city_id: "city_mumbai",
      avatar_url: null,
      is_verified: true,
      google_id,
      wallet_balance_paise: 0,
      created_at: new Date().toISOString(),
    };
    store.users.push(user);
  }
  return issueSession(user);
}

export function refresh(token) {
  if (!store.refreshTokens.has(token)) throw unauthorized("Refresh token is invalid");
  const payload = jwt.verify(token, config.jwtSecret);
  const user = store.users.find((item) => item.id === payload.sub);
  if (!user) throw unauthorized("User not found");
  return issueSession(user);
}

export function logout(refreshToken) {
  if (refreshToken) store.refreshTokens.delete(refreshToken);
}

function issueSession(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  return { user: getPublicUser(user), accessToken, refreshToken };
}