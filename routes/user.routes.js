const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user.controller");
const userMiddleware = require("../middleware");
const { sendNotifications } = require("../utils");
const UserService = require("../services/user.service");

router.get("/", userMiddleware, UserController.getUser);
router.get("/all", userMiddleware, UserController.getAllUsers);
router.get("/:id", userMiddleware, UserController.getUserById);
router.post("/", UserController.createUser);
router.post("/auth", UserController.loginUser);
router.put("/", userMiddleware, UserController.updateUser);
router.delete("/:id", UserController.deleteUser);
router.post("/fcm_token", userMiddleware, UserController.updateUserFCMToken);
router.post(
  "/send-notification",
  userMiddleware,
  UserController.sendNotificationToAllUsers
);
router.get(
  "/send-notification/:userId",
  UserController.sendNotificationToUserById
);

// Google OAuth routes
router.post("/google/signin", UserController.googleSignIn);

module.exports = router;
