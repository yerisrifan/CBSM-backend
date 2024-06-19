const express = require("express");
const router = express.Router();
const Incubation = require("../models/incubation.model");
const Egg = require("../models/eggs.model");
const Pair = require("../models/pair.model");
const userMiddleware = require("../middleware/index");

// @route GET /incubation
// @desc Get all incubation
// @access Private
router.get("/", userMiddleware, async (req, res) => {
  const owner = req.user._id;
  try {
    const incubations = await Incubation.find({ owner })
      .populate("pair")
      .lean();
    res.status(200).send({
      msg: "Successfully get incubation data",
      count: incubations.length,
      incubations,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error getting incubation data", error });
  }
});

// @route POST /incubation
// @desc Create an incubation
// @access Private
router.post("/", userMiddleware, async (req, res) => {
  const { pair, male, female, eggs } = req.body;
  console.log(req.body);
  try {
    // create an incubation
    const incubation = new Incubation({
      pair,
      owner: req.user._id,
    });
    // create eggs is array of object so we need to loop through it
    const eggsData = await Promise.all(
      eggs.map(async (egg) => {
        const newEgg = new Egg({
          ...egg,
          incubation: incubation._id,
          owner: req.user._id,
        });
        await newEgg.save();
        return newEgg._id;
      })
    );
    // save the eggs
    incubation.eggs = eggsData;
    // also save incubation to the pair
    const pairData = await Pair.findById(pair);
    pairData.incubation.push(incubation._id);
    await pairData.save();

    // save the incubation
    await incubation.save();
    res
      .status(201)
      .send({ msg: "Successfully create an incubation", incubation });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error creating an incubation", error });
  }
});

// @route GET /incubation/:id
// @desc Get an incubation by id
// @access Private
router.get("/:id", userMiddleware, async (req, res) => {
  const owner = req.user._id;
  try {
    const incubation = await Incubation.findById(req.params.id).populate(
      "pair eggs"
    );
    // if (incubation.owner.toString() !== owner) {
    //   return res.status(403).send({ msg: "Forbidden" });
    // }
    res.status(200).send({
      msg: "Successfully get incubation data",
      incubation,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error getting incubation data", error });
  }
});

// @route PUT /incubation/:id
// @desc Update an incubation by id
// @access Private
router.put("/:id", userMiddleware, async (req, res) => {
  const owner = req.user._id;
  try {
    const incubation = await Incubation.findById(req.params.id);
    if (!incubation) {
      return res.status(404).send({ msg: "Incubation not found" });
    }
    if (incubation.owner.toString() !== owner) {
      return res.status(403).send({ msg: "Forbidden" });
    }
    await Incubation.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).send({ msg: "Successfully update an incubation" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error updating an incubation", error });
  }
});

// @route DELETE /incubation/:id
// @desc Delete an incubation by id
// @access Private
router.delete("/:id", userMiddleware, async (req, res) => {
  const owner = req.user._id;
  try {
    const incubation = await Incubation.findById(req.params.id);
    if (!incubation) {
      return res.status(404).send({ msg: "Incubation not found" });
    }
    if (incubation.owner._id.toString() !== owner.toString()) {
      return res.status(403).send({ msg: "Forbidden" });
    }
    // also delete in egg related to this incubation
    await Egg.deleteMany({ incubation: req.params.id });
    await Incubation.findByIdAndDelete(req.params.id);
    res.status(200).send({ msg: "Successfully delete an incubation" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error deleting an incubation", error });
  }
});

module.exports = router;
