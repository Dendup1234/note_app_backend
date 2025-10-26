require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");

//Routes imports
const authRoutes = require("./routes/auth.route");
const noteRoutes = require("./routes/note.route");

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method")); //Enable put and delete method

//Health Checkup
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

//Setting up the ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/public", express.static(path.join(__dirname, "public")));

//Routes
app.use("/auth", authRoutes);
app.use("/notes", noteRoutes);

// Home: redirect to notes if logged in, else login
app.get("/", (req, res) => {
  const hasToken = Boolean(req.cookies && req.cookies.token);
  return hasToken ? res.redirect("/notes") : res.redirect("/auth/login");
});

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

//Listen to the app
app.listen(
  process.env.PORT || 3000,
  "0.0.0.0",
  () => {},
  () => {
    console.log(`Example app listening on port ${process.env.PORT}`);
  }
);
