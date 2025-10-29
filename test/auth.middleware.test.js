// test/auth.middleware.test.js
const express = require("express");
const request = require("supertest");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

// Import your middleware exactly as implemented
const { protect, signToken } = require("../middleware/auth");

// Ensure a secret exists for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || "ci-secret";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Unprotected health route for sanity checks
  app.get("/health", (_req, res) => res.sendStatus(200));

  // Protected route for testing middleware behavior
  app.get("/protected", protect, (req, res) => {
    // Return the normalized user injected by protect
    res.status(200).json({ ok: true, user: req.user });
  });

  // Simulate your login route that sets the cookie using signToken
  app.get("/simulate-login", (req, res) => {
    const fakeUser = { _id: "64d1f5a3f1a2b3c4d5e6f7a8", email: "t@t.com" };
    const { token, maxAgeMs } = signToken(fakeUser);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: maxAgeMs,
      path: "/",
    });
    res.json({ ok: true });
  });

  return app;
}

describe("auth middleware (protect/signToken)", () => {
  let app;

  beforeAll(() => {
    app = buildApp();
  });

  test("no token + Accept: application/json → 401 JSON", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Accept", "application/json");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  test("no token + Accept: text/html → 302 redirect to /auth/login", async () => {
    const res = await request(app).get("/protected").set("Accept", "text/html");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/auth/login");
  });

  test("valid token via cookie → 200 and user payload present", async () => {
    // Use signToken to generate a valid cookie
    const { token } = signToken({
      _id: "507f1f77bcf86cd799439011",
      email: "x@y.com",
    });
    const res = await request(app)
      .get("/protected")
      .set("Accept", "application/json")
      .set("Cookie", [`token=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user).toEqual({
      id: "507f1f77bcf86cd799439011",
      email: "x@y.com",
    });
  });

  test("valid token via Authorization: Bearer → 200", async () => {
    const { token } = signToken({
      _id: "000000000000000000000001",
      email: "b@y.com",
    });
    const res = await request(app)
      .get("/protected")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      id: "000000000000000000000001",
      email: "b@y.com",
    });
  });

  test("expired token (cookie) + Accept: text/html → 302 and cookie cleared", async () => {
    // Create an already-expired JWT by setting exp in the past
    const expPast = Math.floor(Date.now() / 1000) - 30;
    const expired = jwt.sign(
      { id: "deadbeefdeadbeefdeadbeef", email: "old@t.com", exp: expPast },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get("/protected")
      .set("Accept", "text/html")
      .set("Cookie", [`token=${expired}`]);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/auth/login");

    // Express clearCookie should set a Set-Cookie header that effectively expires token
    const setCookies = res.headers["set-cookie"] || [];
    const cleared = setCookies.some(
      (c) => /token=;/.test(c) || /token=; Max-Age=0/.test(c)
    );
    expect(cleared).toBe(true);
  });

  test("invalid token (garbage) + Accept: application/json → 401 and cookie cleared if present", async () => {
    const bogus = "not-a-real-jwt-token";
    const res = await request(app)
      .get("/protected")
      .set("Accept", "application/json")
      .set("Cookie", [`token=${bogus}`]);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid or expired token" });

    const setCookies = res.headers["set-cookie"] || [];
    const cleared = setCookies.some(
      (c) => /token=;/.test(c) || /Max-Age=0/.test(c)
    );
    expect(cleared).toBe(true);
  });

  test("simulate-login sets token cookie, then protected returns 200", async () => {
    const agent = request.agent(app);

    const login = await agent.get("/simulate-login");
    expect(login.status).toBe(200);
    const setCookies = login.headers["set-cookie"] || [];
    const hasToken = setCookies.some((c) => /^token=/.test(c));
    expect(hasToken).toBe(true);

    const res = await agent.get("/protected").set("Accept", "application/json");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("email");
  });
});
