const mongoose = require("mongoose");
const Incubation = require("./incubation.model");

const eggSchema = mongoose.Schema(
  {
    laid_date: {
      type: Date,
      default: Date.now,
    },
    hatched_date: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "Incubating",
        "Hatched",
        "Dead in shell",
        "Dead after hatched",
        "Not fertilized",
      ],
      default: "Incubating",
      required: true,
    },
    incubation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incubation",
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

eggSchema.index({ owner: 1 }); // No need for unique index

// Middleware to remove egg from incubation when egg is removed
eggSchema.pre("remove", async function (next) {
  try {
    // Find incubation associated with this egg
    const incubation = await Incubation.findOne({ eggs: this._id });

    if (incubation) {
      // Remove egg from incubation
      incubation.eggs.pull(this._id);
      await incubation.save();
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Egg", eggSchema);
