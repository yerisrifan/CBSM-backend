const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const Canary = require("../models/canary.model");
const Incubation = require("../models/incubation.model");
const Pair = require("../models/pair.model");
const Eggs = require("../models/eggs.model");
const userMiddleware = require("../middleware");

router.get("/", (req, res) => {
  res.send({
    message: "Welcome to Canary API",
    uptime: "99%",
    date: Date.now(),
  });
});

router.get("/allData", userMiddleware, async (req, res) => {
  const userID = req.user;
  const user = await User.findById(userID._id).select("-password");
  const canary = await Canary.find({ owner: userID._id }).populate("owner");
  const incubation = await Incubation.find({ owner: userID._id })
    .populate("eggs")
    .populate({
      path: "pair",
      populate: [
        { path: "male", model: "Canary" },
        { path: "female", model: "Canary" },
        { path: "incubation", model: "Incubation" },
      ],
    });
  const pair = await Pair.find({ owner: userID._id }).populate(
    "owner incubation male female"
  );
  const eggs = await Eggs.find({ owner: userID._id });

  res.send({
    canaryCount: canary.length,
    pairCount: pair.length,
    incubationCount: incubation.length,
    eggsCount: eggs.length,
    data: {
      user: user,
      canary: canary,
      incubation: incubation,
      pair: pair,
      eggs: eggs,
    },
  });
});

router.get("/status", (req, res) => {
  res.send({
    status: "live",
    uptime: "99%",
    date: Date.now(),
  });
});

module.exports = router;
