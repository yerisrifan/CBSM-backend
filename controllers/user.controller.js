const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const UserService = require("../services/user.service");

class UserController {
  static async getUser(req, res) {
    try {
      const user = await UserService.getUserById(req.user.id);
      res.status(200).send({ msg: "User found", user });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error getting user", error });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).send(users);
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error getting users", error });
    }
  }

  static async createUser(req, res) {
    try {
      const { email } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).send({ msg: "User already exists" });
      }
      const user = await UserService.createUser(req.body);
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.status(201).send({ msg: "User created", token, user });
    } catch (error) {
      console.error(error.message);
      res.status(400).send(error);
    }
  }

  static async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).send({ msg: "Invalid login credentials" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).send({ msg: "Invalid login credentials" });
      }
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.status(200).send({ token, user, msg: "Successfully logged in" });
    } catch (error) {
      res.status(500).send({ msg: "Error logging in", error });
    }
  }

  static async updateUser(req, res) {
    const userID = req.user._id || req.user.id;
    try {
      const user = await UserService.updateUser(userID, req.body);
      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }
      res.status(200).send({ msg: "User updated", user });
    } catch (error) {
      console.error(error.message);
      res.status(400).send(error);
    }
  }

  static async deleteUser(req, res) {
    try {
      const user = await UserService.deleteUser(req.params.id);
      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }
      res.send(user);
    } catch (error) {
      console.error(error.message);
      res.status(500).send(error);
    }
  }

  static async updateUserFCMToken(req, res) {
    const id = req.user._id || req.user.id;
    const { fcm_token } = req.body;
    try {
      const user = await UserService.getUserById(id);
      // chek if user fcm_token is already saved
      if (user.fcm_token === fcm_token) {
        return res.status(200).send({ msg: "User FCM token already saved" });
      }
      const save_token = await UserService.updateUserFCMToken(id, fcm_token);
      res.status(200).send({ msg: "User FCM token updated" });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
}

module.exports = UserController;
