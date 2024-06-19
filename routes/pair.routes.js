const express = require("express");
const router = express.Router();
const Pair = require("../models/pair.model");
const Canary = require("../models/canary.model");
const Incubation = require("../models/incubation.model");
const Egg = require("../models/eggs.model");
const userMiddleware = require("../middleware/index");
const { checkAndUpdateSpouses, removeSpouses } = require("../utils");

// @route GET /pair
// @desc Get all pairs
// @access Private
router.get("/", userMiddleware, async (req, res) => {
  try {
    const pairs = await Pair.find({ owner: req.user._id })
      .populate("male")
      .populate("female")
      .lean();

    res.status(200).send({
      msg: "Successfully retrieved pair data",
      count: pairs.length,
      pairs,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error retrieving pair data", error });
  }
});

// @route POST /pair
// @desc Create a pair
// @access Private
router.post("/", userMiddleware, async (req, res) => {
  const { male, female, cage } = req.body;

  try {
    const [maleData, femaleData] = await Promise.all([
      Canary.findById(male),
      Canary.findById(female),
    ]);

    if (!maleData || maleData.data.gender !== "M") {
      return res
        .status(400)
        .send({ msg: "Father must be a Male and must exist" });
    }

    if (!femaleData || femaleData.data.gender !== "F") {
      return res
        .status(400)
        .send({ msg: "Mother must be Female and must exist" });
    }

    await checkAndUpdateSpouses(male, female);

    const pair = new Pair({ male, female, cage, owner: req.user._id });
    await pair.save();

    res.status(201).send({ msg: "Successfully created a pair", pair });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Error creating pair", error });
  }
});

// @route GET /pair/:id
// @desc Get a pair by id
// @access Private
router.get("/:id", userMiddleware, async (req, res) => {
  try {
    const pair = await Pair.findById(req.params.id)
      .populate("incubation")
      .populate("male")
      .populate("female")
      .lean();

    if (!pair) {
      return res.status(404).send({ msg: "Pair not found" });
    }

    res.status(200).send({ msg: "Successfully retrieved pair data", pair });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error retrieving pair data", error });
  }
});

// @route PUT /pair/:id
// @desc Update a pair by id
// @access Private
router.put("/:id", userMiddleware, async (req, res) => {
  try {
    const pair = await Pair.findById(req.params.id);

    if (!pair) {
      return res.status(404).send({ msg: "Pair not found" });
    }

    if (pair.owner.toString() !== req.user._id.toString()) {
      return res.status(401).send({ msg: "Unauthorized" });
    }

    await Pair.findByIdAndUpdate(req.params.id, { $set: req.body });

    res.status(200).send({ msg: "Successfully updated pair data", pair });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error updating pair data", error });
  }
});

// @route DELETE /pair/:id
// @desc Delete a pair by id
// @access Private
router.delete("/:id", userMiddleware, async (req, res) => {
  try {
    const pair = await Pair.findById(req.params.id);

    if (!pair) {
      return res.status(404).send({ msg: "Pair not found" });
    }

    const children = await Canary.find({
      $or: [{ "rels.father": pair.father }, { "rels.mother": pair.mother }],
    });

    if (children.length === 0) {
      await removeSpouses(pair.father, pair.mother);
    }

    await Promise.all([
      Incubation.deleteMany({ pair: req.params.id }),
      Egg.deleteMany({ pair: req.params.id }),
      Pair.findByIdAndDelete(req.params.id),
    ]);

    res.status(200).send({ msg: "Successfully deleted the pair" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error deleting pair", error });
  }
});

module.exports = router;
