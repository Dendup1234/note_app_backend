const express = require("express");
const router = express.Router();
const Note = require("../models/note.model");
const { protect } = require("../middleware/auth");

// List current user's notes (protected)
router.get("/", protect, async (req, res) => {
  const notes = await Note.find({ user: req.user.id }).sort({ createdAt: -1 });
  // If you have a notes.ejs, render it; otherwise return JSON
  try {
    res.render("notes", { notes }); // requires views/notes.ejs
  } catch {
    res.json(notes);
  }
});

// Create a note (protected)
router.post("/", protect, async (req, res) => {
  const { title, description } = req.body;
  const note = await Note.create({
    user: req.user.id,
    title,
    description,
  });
  res.redirect("/notes"); // or res.json(note)
});

module.exports = router;
