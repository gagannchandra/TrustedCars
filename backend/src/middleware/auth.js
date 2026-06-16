import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { store } from "../db.js";
import { forbidden, unauthorized } from "../errors.js";

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function signRefreshToken(user) {
  const token = jwt.sign({ sub: user.id, type: "refresh" }, config.jwtSecret, { expiresIn: config.refreshExpiresIn });
  store.refreshTokens.set(token, { user_id: user.id, created_at: new Date().toISOString() });
  return token;
}

export function setAuthCookies(res, accessToken, refreshToken) {
  const cookieBase = {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSecure ? "none" : "lax",
    path: "/",
  };
  res.cookie("tc_access", accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 });
  res.cookie("tc_refresh", refreshToken, { ...cookieBase, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res) {
  res.clearCookie("tc_access", { path: "/" });
  res.clearCookie("tc_refresh", { path: "/" });
}

export function getPublicUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = bearer || req.cookies?.tc_access;
  if (!token) return next(unauthorized());

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = store.users.find((item) => item.id === payload.sub);
    if (!user) return next(unauthorized("User session is no longer valid"));
    req.user = getPublicUser(user);
    next();
  } catch (_error) {
    next(unauthorized("Invalid or expired token"));
  }
}

export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = bearer || req.cookies?.tc_access;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = store.users.find((item) => item.id === payload.sub);
    if (user) req.user = getPublicUser(user);
  } catch (_error) {
    // optional auth intentionally ignores invalid tokens
  }
  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}