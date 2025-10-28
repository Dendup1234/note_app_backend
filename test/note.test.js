const request = require("supertest");
const app = require("../server"); // make sure your app is exported in server.js
const mongoose = require("mongoose");

describe("Notes API", () => {
  beforeAll(async () => {
    const MONGO_URI =
      process.env.MONGO_URI || "mongodb://localhost:27017/noteapp";
    await mongoose.connect(MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return health status 200", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
  });

  it("should create a note", async () => {
    const res = await request(app)
      .post("/notes")
      .send({ title: "Test note", description: "From CI test" });
    expect(res.statusCode).toBe(302); // adjust if your route redirects
  });
});
