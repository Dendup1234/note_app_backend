/**
 * Integration tests for auth:
 * - GET /auth/register, /auth/login render
 * - POST /auth/register creates user and sets cookie
 * - POST /auth/login sets cookie
 * - GET /notes requires auth
 * - GET /auth/logout clears cookie
 */

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/user.model");

jest.setTimeout(20000);

const TEST_DB =
  process.env.MONGO_URI_TEST || "mongodb://localhost:27017/noteapp_test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "ci-secret";

describe("Auth flow", () => {
  let agent;
  let email; // unique per test run
  const password = "secret123";

  beforeAll(async () => {
    await mongoose.connect(TEST_DB);
    agent = request.agent(app);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase(); // clean test DB
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // ensure a clean users collection per test (optional)
    await User.deleteMany({});
    email = `user_${Date.now()}@example.com`;
  });

  it("renders login and register pages", async () => {
    const r1 = await agent.get("/auth/login");
    expect([200, 304]).toContain(r1.statusCode);

    const r2 = await agent.get("/auth/register");
    expect([200, 304]).toContain(r2.statusCode);
  });

  it("registers a new user and sets token cookie, then can access /notes", async () => {
    // Register
    const reg = await agent
      .post("/auth/register")
      .type("form")
      .send({ name: "Test User", email, password, password2: password });

    // Your route redirects after success
    expect([302, 303]).toContain(reg.statusCode);

    // Should have a Set-Cookie header with token=...
    const setCookie = reg.headers["set-cookie"] || [];
    const hasToken = setCookie.some((c) => /^token=/.test(c));
    expect(hasToken).toBe(true);

    // Access a protected route with the same agent (cookie persisted)
    const notes = await agent.get("/notes");
    expect([200, 304]).toContain(notes.statusCode);
  });

  it("fails login with wrong password (401) and succeeds with correct password", async () => {
    // Seed a user using your app route or directly the model
    await agent
      .post("/auth/register")
      .type("form")
      .send({ name: "Another User", email, password, password2: password });

    // Wrong password
    const bad = await agent
      .post("/auth/login")
      .type("form")
      .send({ email, password: "wrongpass" });

    expect(bad.statusCode).toBe(401);

    // Correct password
    const ok = await agent
      .post("/auth/login")
      .type("form")
      .send({ email, password });

    expect([302, 303]).toContain(ok.statusCode);
    const setCookie = ok.headers["set-cookie"] || [];
    const hasToken = setCookie.some((c) => /^token=/.test(c));
    expect(hasToken).toBe(true);
  });

  it("blocks /notes without cookie and allows with cookie", async () => {
    // Without cookie (new, stateless client)
    const anon = await request(app).get("/notes");
    expect([401, 302].includes(anon.statusCode)).toBe(true); // 302 if it redirects to login page

    // With a logged-in agent
    await agent
      .post("/auth/register")
      .type("form")
      .send({ name: "Test User", email, password, password2: password });

    const authed = await agent.get("/notes");
    expect(authed.statusCode).toBe(200);
  });

  it("logout clears the token cookie", async () => {
    // Register to get a cookie
    await agent
      .post("/auth/register")
      .type("form")
      .send({ name: "Test User", email, password, password2: password });

    // Now logout
    const out = await agent.get("/auth/logout");
    expect([302, 303]).toContain(out.statusCode);

    // Manually check we can no longer access /notes if your route enforces auth
    const blocked = await agent.get("/notes");
    expect([401, 302].includes(blocked.statusCode)).toBe(true);
  });
});
