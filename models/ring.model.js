const mongoose = require("mongoose");

const ringSchema = new mongoose.Schema(
  {
    ring_code: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ring", ringSchema);
