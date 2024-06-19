const express = require("express");
const router = express.Router();
const Egg = require("../models/eggs.model");
const Incubation = require("../models/incubation.model");
const userMiddleware = require("../middleware/index");

// @route GET /eggs
// @desc Get all eggs
// @access Private
router.get("/", userMiddleware, async (req, res) => {
  const owner = req.user._id;
  try {
    const eggs = await Egg.find({ owner }).lean();
    res.status(200).send({
      msg: "Successfully get egg data",
      count: eggs.length,
      eggs,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error getting egg data", error });
  }
});

// @route POST /eggs
// @desc Create an egg
// @access Private
router.post("/", userMiddleware, async (req, res) => {
  const { incubation, laid_date, status } = req.body;
  try {
    // create an egg
    const egg = new Egg({ laid_date, status, incubation, owner: req.user._id });
    // also save egg to the incubation
    const incubationData = await Incubation.findById(incubation);
    incubationData.eggs.push(egg._id);
    await incubationData.save();
    // save the egg
    await egg.save();
    res.status(201).send({ msg: "Successfully create an egg", egg });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error creating an egg", error });
  }
});

// @route GET /eggs/:id
// @desc Get an egg by id
// @access Private
router.get("/:id", userMiddleware, async (req, res) => {
  const owner = req.user._id;
  try {
    const egg = await Egg.findById(req.params.id).lean();
    if (egg.owner.toString() !== owner) {
      return res.status(403).send({ msg: "Forbidden" });
    }
    res.status(200).send({
      msg: "Successfully get egg data",
      egg,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error getting egg data", error });
  }
});

// @route PUT /eggs/:id
// @desc Update an egg by id
// @access Private
router.put("/:id", userMiddleware, async (req, res) => {
  const owner = req.user._id;
  try {
    const egg = await Egg.findById(req.params.id);
    if (!egg) {
      return res.status(404).send({ msg: "Egg not found" });
    }
    const { laid_date, status } = req.body;
    egg.laid_date = laid_date;
    egg.status = status;
    await egg.save();
    res.status(200).send({ msg: "Successfully update an egg", egg });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error updating an egg", error });
  }
});

// @route DELETE /eggs/:id
// @desc Delete an egg by id
// @access Private
router.delete("/:id", userMiddleware, async (req, res) => {
  const owner = req.user._id;
  try {
    const egg = await Egg.findById(req.params.id);
    if (!egg) {
      return res.status(404).send({ msg: "Egg not found" });
    }
    if (egg.owner.toString() !== owner) {
      return res.status(403).send({ msg: "Forbidden" });
    }
    await Egg.findByIdAndDelete(req.params.id);
    res.status(200).send({ msg: "Successfully delete an egg" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error deleting an egg", error });
  }
});

module.exports = router;
