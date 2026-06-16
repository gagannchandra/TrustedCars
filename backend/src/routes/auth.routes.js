import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authenticate, clearAuthCookies, getPublicUser, setAuthCookies } from "../middleware/auth.js";
import * as auth from "../services/auth.service.js";
import { store } from "../db.js";

const router = Router();

const registerSchema = z.object({ body: z.object({ name: z.string().min(2), email: z.string().email(), phone: z.string().min(10), password: z.string().min(6), role: z.enum(["buyer", "seller", "admin"]).default("buyer"), city_id: z.string().optional() }) });
const loginSchema = z.object({ body: z.object({ phone: z.string().min(10), password: z.string().min(6) }) });
const otpSendSchema = z.object({ body: z.object({ phone: z.string().min(10) }) });
const otpVerifySchema = z.object({ body: z.object({ phone: z.string().min(10), otp: z.string().length(6) }) });
const googleSchema = z.object({ body: z.object({ email: z.string().email(), name: z.string().min(2), google_id: z.string().min(2), role: z.enum(["buyer", "seller"]).default("buyer") }) });

router.post("/register", validate(registerSchema), asyncHandler(async (req, res) => {
  const session = await auth.register(req.validated.body);
  setAuthCookies(res, session.accessToken, session.refreshToken);
  res.status(201).json({ success: true, data: session });
}));

router.post("/login", validate(loginSchema), asyncHandler(async (req, res) => {
  const session = await auth.login(req.validated.body);
  setAuthCookies(res, session.accessToken, session.refreshToken);
  res.json({ success: true, data: session });
}));

router.post("/otp/send", validate(otpSendSchema), asyncHandler(async (req, res) => {
  const result = auth.sendOtp(req.validated.body.phone);
  res.json({ success: true, data: { ...result, demo_otp: "123456" } });
}));

router.post("/otp/verify", validate(otpVerifySchema), asyncHandler(async (req, res) => {
  const session = auth.verifyOtp(req.validated.body);
  setAuthCookies(res, session.accessToken, session.refreshToken);
  res.json({ success: true, data: session });
}));

router.post("/google", validate(googleSchema), asyncHandler(async (req, res) => {
  const session = auth.googleOAuth(req.validated.body);
  setAuthCookies(res, session.accessToken, session.refreshToken);
  res.json({ success: true, data: session });
}));

router.post("/refresh", asyncHandler(async (req, res) => {
  const token = req.cookies?.tc_refresh || req.body?.refreshToken;
  const session = auth.refresh(token);
  setAuthCookies(res, session.accessToken, session.refreshToken);
  res.json({ success: true, data: session });
}));

router.post("/logout", (req, res) => {
  auth.logout(req.cookies?.tc_refresh || req.body?.refreshToken);
  clearAuthCookies(res);
  res.json({ success: true });
});

router.get("/me", authenticate, (req, res) => {
  const user = store.users.find((item) => item.id === req.user.id);
  res.json({ success: true, data: getPublicUser(user) });
});

export default router;