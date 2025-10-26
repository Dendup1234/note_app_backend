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

exports.protect = (req, res, next) => {
  const token = getToken(req);
  if (!token) return res.status(401).send("Unauthorized");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email }
    return next();
  } catch {
    return res.status(401).send("Invalid token");
  }
};

exports.signToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
