require("dotenv").config();

//Intialization of the dependencies
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const secret = process.env.TOKEN_SECRET;

app.use(express.json());

// Simple get method
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

  res.json({ message: "user created / logged in", token });
});

// Example protected route
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({ message: "protected data", user: req.user });
});

app.listen(PORT);

//Function to give the token to the username
function generateAccessToken(username) {
  return jwt.sign(
    username, // payload (who the token is about)
    secret, // secret from your .env
    { expiresIn: "1800s" } // token lifetime (30 minutes)
  );
}

//Middleware to verify a token for protected routes
function authenticateToken(req, res, next) {
  // Expect header: Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401); // no token

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // invalid/expired
    req.user = user; // payload we signed earlier
    next();
  });
}
