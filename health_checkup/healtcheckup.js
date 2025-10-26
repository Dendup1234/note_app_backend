require("http")
  .get(`http://localhost:${process.env.PORT || 3000}/health`, (res) => {
    process.exit(res.statusCode === 200 ? 0 : 1);
  })
  .on("error", () => process.exit(1));
