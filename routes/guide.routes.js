const express = require("express");
const router = express.Router();
const GuideController = require("../controllers/guide.controller");
const userMiddleware = require("../middleware");

router.post("/", userMiddleware, GuideController.createGuide);
router.get("/", GuideController.getAllGuides);
router.get("/:id", GuideController.getGuideById);
router.patch("/:id", userMiddleware, GuideController.updateGuide);
router.delete("/:id", userMiddleware, GuideController.deleteGuide);

module.exports = router;
