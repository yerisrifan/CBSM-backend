const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const UserService = require("../services/user.service");
const { OAuth2Client } = require("google-auth-library");
const { deleteUserAndRelatedData } = require("../utils");
const { sendNotificationToUserById } = require("../utils/notification");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class UserController {
  static async getUser(req, res) {
    try {
      const user = await UserService.getUserById(req.user.id);
      // create token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.status(200).send({ msg: "User found", user, token });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error getting user", error });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await UserService.getAllUsers(page, limit);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getAllUsers controller:", error.message);
      res
        .status(500)
        .json({ msg: "Error getting users", error: error.message });
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
      console.error(error);
      res.status(400).send(error);
    }
  }

  static async deleteUser(req, res) {
    const userID = req.params.id;
    try {
      const user = await deleteUserAndRelatedData(userID);
      res.send(`User ${userID} and all related data deleted successfully`);
    } catch (error) {
      console.error(error.message);
      res.status(500).send(error);
    }
  }

  static async updateUserFCMToken(req, res) {
    const id = req.user._id || req.user.id;
    const { fcm_token, deviceInfo } = req.body;
    try {
      const user = await UserService.getUserById(id);
      // chek if user fcm_token is already saved
      if (user.notification.fcm_token === fcm_token) {
        return res.status(200).send({ msg: "User FCM token already saved" });
      }
      const save_token = await UserService.updateUserFCMToken(
        id,
        fcm_token,
        deviceInfo
      );
      res.status(200).send({ msg: "User FCM token updated" });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }

  static async googleSignIn(req, res) {
    const { idToken, name, photo, id } = req.body.idToken;
    console.log("Google Sign-In request:", name);

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const { email } = ticket.getPayload();

      // Check if user exists in database
      let user = await User.findOne({ email });
      if (!user) {
        // Create new user if not exists
        user = new User({
          email,
          password: "", // or generate a random password
          owner_name: name,
          googleId: id,
          // other fields as needed
        });
        await user.save();
      }

      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      // Return token and user data
      res.status(200).json({ token, user });
    } catch (error) {
      console.error("Google Sign-In error:", error);
      res.status(500).json({ message: "Error signing in with Google" });
    }
  }

  static async sendNotificationToAllUsers(req, res) {
    const { title, body } = req.body;
    // if user.level !== 2 then return error
    if (req.user.user_level !== 2) {
      return res.status(400).send({ msg: "Unauthorized" });
    }
    try {
      const notification = await UserService.sendNotificationToAllUsers(
        title,
        body
      );
      res.status(200).send(notification);
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error sending notification", error });
    }
  }

  static async sendNotificationToUserById(req, res) {
    const { userId } = req.params;
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: "Missing title or body" });
    }
    try {
      await sendNotificationToUserById(userId, title, body);
      res.json({
        success: true,
        message: `Notification sent to user ${userId}`,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: `Error sending notification to user ${userId}` });
    }
  }
}

module.exports = UserController;
