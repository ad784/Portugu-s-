const ACCESS_COOKIE = "portugues_access";
const REFRESH_COOKIE = "portugues_refresh";

function readCookies(req) {
  const values = {};
  for (const item of (req.get("cookie") || "").split(";")) {
    const index = item.indexOf("=");
    if (index < 0) continue;
    try {
      values[item.slice(0, index).trim()] = decodeURIComponent(
        item.slice(index + 1),
      );
    } catch {
      /* Ignore malformed cookies. */
    }
  }
  return values;
}

function cookieOptions(req) {
  return {
    httpOnly: true,
    secure:
      req.secure ||
      process.env.VERCEL === "1" ||
      process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api",
  };
}

function writeSession(req, res, session) {
  const options = { ...cookieOptions(req), maxAge: 30 * 24 * 60 * 60 * 1000 };
  res.cookie(ACCESS_COOKIE, session.access_token, options);
  res.cookie(REFRESH_COOKIE, session.refresh_token, options);
}

function clearSession(req, res) {
  res.clearCookie(ACCESS_COOKIE, cookieOptions(req));
  res.clearCookie(REFRESH_COOKIE, cookieOptions(req));
}

function accessToken(req) {
  return (
    (req.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1] ||
    readCookies(req)[ACCESS_COOKIE]
  );
}

function protectCookieRequests(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const cookies = readCookies(req);
  if (
    !req.path.startsWith("/auth/") &&
    !cookies[ACCESS_COOKIE] &&
    !cookies[REFRESH_COOKIE]
  )
    return next();
  // A custom header prevents cross-site HTML forms from submitting cookie-authenticated requests.
  if (req.get("X-Portugues-Request") !== "1")
    return res.status(403).json({ erro: "Requisição de origem inválida." });
  const origin = req.get("origin");
  const allowed = new Set([`${req.protocol}://${req.get("host")}`]);
  if (process.env.APP_ORIGIN) {
    try {
      allowed.add(new URL(process.env.APP_ORIGIN).origin);
    } catch {
      /* An invalid origin never grants access. */
    }
  }
  if (process.env.VERCEL === "1") allowed.add(`https://${req.get("host")}`);
  if (
    req.get("sec-fetch-site") === "cross-site" ||
    (origin && !allowed.has(origin))
  )
    return res.status(403).json({ erro: "Requisição de origem inválida." });
  next();
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  readCookies,
  accessToken,
  writeSession,
  clearSession,
  protectCookieRequests,
};
