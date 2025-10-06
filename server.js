require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Allow your Next.js origin in dev
// Middlware to let the two local host to communicate
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
    credentials: true,
  })
);

// Simple health check to test connectivity
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "express", time: new Date().toISOString() });
});

// Example API route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express API" });
});

app.listen(PORT, () => {
  console.log(`Express API listening on http://localhost:${PORT}`);
});
