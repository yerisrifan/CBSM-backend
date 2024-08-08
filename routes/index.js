const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const Canary = require("../models/canary.model");
const Incubation = require("../models/incubation.model");
const Pair = require("../models/pair.model");
const Eggs = require("../models/eggs.model");
const Guide = require("../models/guide.model");
const userMiddleware = require("../middleware");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { render } = require("ejs");
const CanaryService = require("../services/canary.service");

function jwtSignKey(key) {
  return jwt.sign({ secret_key: key }, process.env.JWTSECRET, {
    expiresIn: "7d",
  });
}

router.get("/", (req, res) => {
  res.render("index", {
    title: "404 Not Fount",
    layout: "layout-auth",
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

router.get("/statistics", userMiddleware, async (req, res) => {
  const userID = req.user;
  const year = req.query.year || new Date().getFullYear();
  const canary = await CanaryService.getStatistics(year, userID._id);

  res
    .status(200)
    .send({ msg: "Successfully get statistics", statistic: canary });
});

router.get("/status", (req, res) => {
  res.send({
    status: "live",
    uptime: "99%",
    date: Date.now(),
  });
});

router.get("/login", (req, res) => {
  res.render("login", { title: "Login", layout: "layout-auth" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ msg: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ msg: "Invalid login credentials" });
    }
    jwt.sign({ id: user._id }, process.env.JWT_SECRET, (err, token) => {
      if (err) throw err;
      req.session.save(() => {
        res.cookie("access_token", token, {
          signed: true,
          httpOnly: true,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        req.session.user = {
          id: user._id,
          email: user.email,
          user_level: user.user_level,
        };
        res.redirect("/dashboard");
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

router.get("/dashboard", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const user = await User.countDocuments();
  const canary = await Canary.countDocuments();
  const pair = await Pair.countDocuments();
  const incubation = await Incubation.countDocuments();
  const eggs = await Eggs.countDocuments();

  console.log(canary, pair, incubation, eggs);

  res.render("dashboard", {
    title: "Dashboard",
    layout: "layout",
    user,
    canary,
    pair,
    incubation,
    eggs,
  });
});

router.get("/members", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const users = await User.find().lean();
  res.render("members", { title: "Members", layout: "layout", members: users });
});

router.get("/edit-member/:id", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const user = await User.findById(req.params.id).lean();
  res.render("edit-member", {
    title: "Edit Member",
    layout: "layout",
    member: user,
  });
});

router.post("/edit-member/:id", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const { user_level } = req.body;
  try {
    await User.updateOne(
      { _id: req.params.id },
      {
        $set: {
          user_level,
        },
      }
    );
    res.redirect("/members");
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get("/articles", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const articles = await Guide.find().sort({ createdAt: "desc" }).lean();
  res.render("articles", { title: "Guide", layout: "layout", articles });
});

router.post("/add-article", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  if (!req.session.user.id) {
    return res.redirect("/login");
  }
  const { title, content, is_member_only, status } = req.body;
  const guide = new Guide({
    title,
    is_member_only,
    content,
    status,
    author: req.session.user.id,
  });
  try {
    await guide.save();
    res.redirect("/articles");
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get("/add-article", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("add-article", { title: "Add Article", layout: "layout" });
});

router.get("/edit-article/:id", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const article = await Guide.findById(req.params.id);
  res.render("edit-article", {
    title: "Add Article",
    layout: "layout",
    article,
  });
});

router.post("/edit-article/:id", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  if (!req.session.user.id) {
    return res.redirect("/login");
  }
  const { title, content, is_member_only, status } = req.body;
  try {
    await Guide.findByIdAndUpdate(req.params.id, {
      title,
      content,
      is_member_only,
      status,
      author: req.session.user.id,
    });
    res.redirect("/articles");
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get("/delete-article/:id", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  try {
    await Guide.findByIdAndDelete(req.params.id);
    res.redirect("/articles");
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
