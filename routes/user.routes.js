const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user.controller");
const userMiddleware = require("../middleware");
const { sendNotifications } = require("../utils");
const UserService = require("../services/user.service");

router.get("/", userMiddleware, UserController.getUser);
router.get("/all", userMiddleware, UserController.getAllUsers);
router.post("/", UserController.createUser);
router.post("/auth", UserController.loginUser);
router.put("/", userMiddleware, UserController.updateUser);
router.delete("/:id", UserController.deleteUser);
router.post("/fcm_token", userMiddleware, UserController.updateUserFCMToken);
router.get("/send-notification/:id", async (req, res) => {
  const { id } = req.params;
  const user = await UserService.getUserById(id);
  const fcm_token = user.notification.fcm_token;
  const title = "Test Notification";
  const body = "This is a test notification";
  const data = { title, body };
  const response = await sendNotifications([fcm_token], title, body, data);
  res.send({ response, fcm_token });
});

// Google OAuth routes
router.post("/google/signin", UserController.googleSignIn);

module.exports = router;
