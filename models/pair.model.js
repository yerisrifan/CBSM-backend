const mongoose = require("mongoose");
const Incubation = require("./incubation.model");

const pairSchema = mongoose.Schema(
  {
    cage: {
      type: Number,
      validate: {
        validator: function (v) {
          return v > 0;
        },
        message: "Cage number must be positive",
      },
    },
    male: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canary",
    },
    female: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canary",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    incubation: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Incubation",
      },
    ],
  },
  {
    timestamps: true,
  }
);

pairSchema.index({ owner: 1 });

// Middleware to remove incubation and egg documents when a pair is removed
pairSchema.pre("remove", async function (next) {
  try {
    // Find all incubations associated with this pair
    const incubations = await Incubation.find({ pair: this._id });

    // Remove each incubation
    await Promise.all(
      incubations.map(async (incubation) => {
        await incubation.remove();
      })
    );

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Pair", pairSchema);
