const jwt = require("jsonwebtoken");

// Read token from HTTP-only cookie or Authorization header
function getToken(req) {
  // Cookie first
  if (req.cookies && req.cookies.token) return req.cookies.token;

  // Then Bearer header
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

function wantsHtml(req) {
  const a = req.headers.accept || "";
  return a.includes("text/html");
}

function protect(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return wantsHtml(req)
      ? res.redirect("/auth/login")
      : res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch {
    // token invalid/expired → clear it
    if (req.cookies?.token) {
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    return wantsHtml(req)
      ? res.redirect("/auth/login")
      : res.status(401).json({ error: "Invalid token" });
  }
}

function signToken(user) {
  // 7-day token
  const token = jwt.sign(
    { id: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  // decode to get exp (seconds since epoch)
  const { exp } = jwt.decode(token);
  const maxAgeMs = exp * 1000 - Date.now(); // align cookie to JWT
  return { token, maxAgeMs: Math.max(0, maxAgeMs) };
}
module.exports = { protect, signToken };
