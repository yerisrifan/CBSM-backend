const express = require("express");
const router = express.Router();
const CanaryController = require("../controllers/canary.controller");
const userMiddleware = require("../middleware");

router.get("/", userMiddleware, CanaryController.getAllCanaries);
router.get("/:id", userMiddleware, CanaryController.getCanaryById);
router.post("/", userMiddleware, CanaryController.createCanary);
router.put("/:id", userMiddleware, CanaryController.updateCanary);
router.delete("/:id", userMiddleware, CanaryController.deleteCanary);
router.post("/:id/spouse", userMiddleware, CanaryController.addSpouse);
router.post("/child", userMiddleware, CanaryController.addChild);
router.get("/:id/related", CanaryController.getRelatedCanaries);
router.get("/:id/download", CanaryController.downloadPDF);

module.exports = router;
