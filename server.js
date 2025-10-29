// server.js
require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to Database");
    console.log("DB Name:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Example app listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Connection Failed", err.message);
    process.exit(1);
  }
})();
