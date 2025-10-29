// test/note.test.js
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

jest.setTimeout(20000);

describe("Notes API", () => {
  let agent;
  let authCookie; // e.g. "token=eyJ..."

  beforeAll(async () => {
    const uri =
      process.env.MONGO_URI || "mongodb://localhost:27017/noteapp_test";
    await mongoose.connect(uri);

    agent = request.agent(app);

    // 1) Register (if your API allows duplicate emails, you can upsert or ignore errors)
    await agent.post("/auth/register").send({
      name: "T User",
      email: "t@example.com",
      password: "secret123",
      password2: "secret123",
    });

    // 2) Login and capture Set-Cookie
    const login = await agent
      .post("/auth/login")
      .send({ email: "t@example.com", password: "secret123" });

    const setCookie = login.headers["set-cookie"];
    // Cookie header like: ["token=...; Path=/; HttpOnly; ..."]
    authCookie =
      setCookie && setCookie[0] ? setCookie[0].split(";")[0] : undefined;
    expect(authCookie).toBeDefined();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return health status 200", async () => {
    const res = await agent.get("/health");
    expect(res.statusCode).toBe(200);
  });

  it("should create a note (authorized)", async () => {
    const res = await agent
      .post("/notes")
      .set("Cookie", authCookie) // <-- use cookie
      .send({ title: "Test note", description: "From CI test" });

    // your route may redirect after create; accept 200/201/302
    expect([200, 201, 302]).toContain(res.statusCode);
  });
});
