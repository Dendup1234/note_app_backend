const mongoose = require("mongoose");

const NoteSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Note title is required"],
    },
    description: {
      type: String,
      required: true,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notes = mongoose.model("Note", NoteSchema, "notes");
module.exports = Notes;
