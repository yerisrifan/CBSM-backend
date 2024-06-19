const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userMiddleware = require("../middleware");

// Get Users by token
// GET /users
// access: private
router.get("/", userMiddleware, async (req, res) => {
  try {
    const users = await User.findById(req.user.id);
    res.status(200).send({ msg: "User found", users });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get All Users
// GET /users/all
// access: public
router.get("/all", userMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send({ msg: "Error getting users", error });
  }
});

// Create a new User
// POST /users
// access: public
router.post("/", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Login a User
// POST /users/auth
// access: public
router.post("/auth", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ error: "Invalid login credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ error: "Invalid login credentials" });
    }
    jwt.sign({ id: user._id }, process.env.JWT_SECRET, (err, token) => {
      if (err) throw err;
      res.status(200).send({ token, user });
    });
  } catch (error) {
    res.status;
  }
});

// Edit a User
// PUT /users/:id
// access: private
router.put("/", userMiddleware, async (req, res) => {
  const userID = req.user._id || req.user.id;
  try {
    const user = await User.findByIdAndUpdate(userID, req.body, {
      new: true,
    });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    res.status(200).send({ msg: "User updated", user });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a User
// DELETE /users/:id
// access: private
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// @route POST /auth/fcm_token
// @desc Update / Register user fcm_token
// @access Private
router.post("/fcm_token", userMiddleware, async (req, res) => {
  const id = req.user._id || req.user.id;
  const { fcm_token } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      { _id: id },
      { $set: { fcm_token: fcm_token } },
      { new: true }
    );
    res.status(200).send({ msg: "User fcm_token added" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
