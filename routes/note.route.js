const express = require("express");
const router = express.Router();
const Note = require("../models/note.model");
const { protect } = require("../middleware/auth");

//Middleware
async function loadAndAuthorizeNote(req, res, next) {
  try {
    const noteId = req.params.id;
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).send("Note not found");

    // Ensure this note belongs to the logged-in user
    if (note.user.toString() !== req.user.id) {
      return res.status(403).send("Forbidden");
    }

    req.note = note;
    next();
  } catch (err) {
    console.error(err);
    res.status(400).send("Invalid note id");
  }
}

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

// Update a note (protected)
router.put("/:id", protect, loadAndAuthorizeNote, async (req, res) => {
  const { title, description, isCompleted } = req.body;

  // Only update the fields you allow
  if (typeof title !== "undefined") req.note.title = title;
  if (typeof description !== "undefined") req.note.description = description;
  if (typeof isCompleted !== "undefined") {
    // Convert "on"/"true" to boolean if coming from a form
    req.note.isCompleted =
      isCompleted === true || isCompleted === "true" || isCompleted === "on";
  }

  await req.note.save();

  //redirect back and send JSON
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    return res.json(req.note);
  }
  res.redirect("/notes");
});

// Delete a note (protected)
router.delete("/:id", protect, loadAndAuthorizeNote, async (req, res) => {
  await req.note.deleteOne();

  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    return res.json({ ok: true });
  }
  res.redirect("/notes");
});

module.exports = router;
