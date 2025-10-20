const mongoose = require("mongoose");

const NoteSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product name is required"],
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
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Note = mongoose.model("Note", NoteSchema);
module.exports = Note;
