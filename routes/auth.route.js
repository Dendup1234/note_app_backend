const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const { signToken } = require("../middleware/auth");

// GET forms
router.get("/login", (req, res) => res.render("login", { error: null }));
router.get("/register", (req, res) => res.render("register", { error: null }));

// POST register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, password2 } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .render("register", { error: "All fields required" });
    }
    if (password !== password2) {
      return res
        .status(400)
        .render("register", { error: "Passwords do not match" });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res
        .status(400)
        .render("register", { error: "Email already in use" });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user);

    // Send token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect("/"); // or /notes
  } catch (err) {
    console.error(err);
    res.status(500).render("register", { error: "Server error" });
  }
});

// POST login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).render("login", { error: "Invalid credentials" });
    }

    const token = signToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect("/"); // or /notes
  } catch (err) {
    console.error(err);
    res.status(500).render("login", { error: "Server error" });
  }
});

// GET logout
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/auth/login");
});

module.exports = router;
