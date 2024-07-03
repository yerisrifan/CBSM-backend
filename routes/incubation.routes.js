const express = require("express");
const router = express.Router();
const IncubationController = require("../controllers/incubation.controller");
const userMiddleware = require("../middleware");

router.get("/", userMiddleware, IncubationController.getAllIncubations);
router.post("/", userMiddleware, IncubationController.createIncubation);
router.get("/:id", userMiddleware, IncubationController.getIncubationById);
router.put("/:id", userMiddleware, IncubationController.updateIncubation);
router.delete("/:id", userMiddleware, IncubationController.deleteIncubation);

module.exports = router;
