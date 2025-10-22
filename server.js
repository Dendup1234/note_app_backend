require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Notes = require("./models/note.model.js");
const path = require("path");

//Middleware
app.use(express.json());

//Health Checkup
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

//Setting up the ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to Database");
    console.log("DB Name:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);
  })
  .catch(() => {
    console.log("Connection Failed");
  });

app.get("/", (req, res) => {
  res.send("Hello from the another world this is me dendup");
});

// Get Functionality of the notes
app.get("/notes", async (req, res) => {
  try {
    const notes = await Notes.find({}).lean();
    res.render("notes", { notes });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

// Post Functionality of the notes
app.post("/api/notes", async (req, res) => {
  try {
    const payload = {
      title: req.body.title,
      description: req.body.description,
      isCompleted: !!req.body.isCompleted,
    };
    await Notes.create(payload);
    res.redirect("/notes");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// handle the form
app.post("/notes", async (req, res) => {
  await Notes.create({
    title: req.body.title,
    description: req.body.description,
    isCompleted: !!req.body.isCompleted,
  });
  res.redirect("/notes");
});

//Listen to the app
app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});
