const mongoose = require("mongoose");
const Egg = require("./eggs.model");

const incubationSchema = mongoose.Schema(
  {
    start_date: {
      type: Date,
      default: Date.now,
    },
    eggs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Egg",
      },
    ],
    pair: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pair",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

incubationSchema.index({ pair: 1, owner: 1 });

// Middleware to remove eggs documents when an incubation is removed
incubationSchema.pre("remove", async function (next) {
  try {
    // Find all eggs associated with this incubation
    const eggs = await Egg.find({ incubation: this._id });

    // Remove each egg
    await Promise.all(
      eggs.map(async (egg) => {
        await egg.remove();
      })
    );

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Incubation", incubationSchema);
