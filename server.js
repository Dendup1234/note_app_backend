require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Notes = require("./models/product.model.js");

//Middleware
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to Database");
  })
  .catch(() => {
    console.log("Connection Failed");
  });

app.get("/", (req, res) => {
  res.send("Hello from the another world this is me dendup");
});

app.post("/api/notes", async (req, res) => {
  try {
    const note = await Notes.create(req.body);
    res.status(200).json({ message: note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT} || 3000`);
});
