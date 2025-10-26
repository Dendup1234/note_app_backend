const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 6 }, // stored in plain text (for dev/testing)
  },
  { timestamps: true }
);

// Simple password comparison (plain-text, not recommended for production)
UserSchema.methods.matchPassword = function (candidate) {
  return candidate === this.password;
};

module.exports = mongoose.model("User", UserSchema, "users");
