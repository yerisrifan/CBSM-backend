const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user.controller");
const userMiddleware = require("../middleware");

router.get("/", userMiddleware, UserController.getUser);
router.get("/all", userMiddleware, UserController.getAllUsers);
router.post("/", UserController.createUser);
router.post("/auth", UserController.loginUser);
router.put("/", userMiddleware, UserController.updateUser);
router.delete("/:id", UserController.deleteUser);
router.post("/fcm_token", userMiddleware, UserController.updateUserFCMToken);

// Google OAuth routes
router.post("/google/signin", UserController.googleSignIn);

module.exports = router;
