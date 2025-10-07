require("dotenv").config();

//Intialization of the dependencies
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const secret = process.env.TOKEN_SECRET;

app.use(express.json());
app.use(cookieParser());

//Cors middleware to connect the frontend
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, //Allowing the cookie
  })
);
// Simple get method for health checkup
app.get("/", (req, res) => {
  res.send("Hi i am dendup");
});

//Example auth route that returns a token (simulate login/signup)
app.post("/api/createNewUser", (req, res) => {
  const { username } = req.body;

  // TODO: validate input, check DB, hash password, create user, etc.
  if (!username)
    return res.status(400).json({ message: "username is required" });

  // Sign token with what you need later (keep it minimal)
  const token = generateAccessToken({ username });

  //Send the jwt token as http-only cookie
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true in production behind HTTPS
    maxAge: 1800 * 1000, // 30 min
  });

  res.json({ message: "user created / logged in", token });
});

// Protected route
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({ message: "protected data", user: req.user });
});

app.listen(PORT);

//Function to give the token to the username
function generateAccessToken(payload) {
  return jwt.sign(
    payload, // payload (who the token is about)
    secret, // secret from your .env
    { expiresIn: "1800s" } // token lifetime (30 minutes)
  );
}

//Middleware to verify a token for protected routes
function authenticateToken(req, res, next) {
  // Prefer cookie; fallback to Authorization header
  const bearer = req.headers["authorization"];
  const headerToken = bearer?.split(" ")[1];
  const cookieToken = req.cookies?.token;
  const token = cookieToken || headerToken;

  if (!token) return res.sendStatus(401);

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
