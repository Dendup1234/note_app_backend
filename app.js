// app.js
require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const jwt = require("jsonwebtoken");

// Routes imports
const authRoutes = require("./routes/auth.route");
const noteRoutes = require("./routes/note.route");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method")); // Enable PUT and DELETE

// Health Check
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/public", express.static(path.join(__dirname, "public")));

// Routes
app.use("/auth", authRoutes);
app.use("/notes", noteRoutes);

// Home route
app.get("/", (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.redirect("/auth/login");

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return res.redirect("/notes");
  } catch {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res.redirect("/auth/login");
  }
});

module.exports = app;
