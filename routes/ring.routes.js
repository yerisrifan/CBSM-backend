const express = require("express");
const router = express.Router();
const RingController = require("../controllers/ring.controller");
const userMiddleware = require("../middleware");

router.get("/", userMiddleware, RingController.getAllRings);
router.post("/", userMiddleware, RingController.createRing);
router.get("/:id", userMiddleware, RingController.getRingById);
router.put("/:id", userMiddleware, RingController.updateRing);
router.delete("/:id", userMiddleware, RingController.deleteRing);

module.exports = router;
