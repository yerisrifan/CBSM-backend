const express = require("express");
const router = express.Router();
const EggController = require("../controllers/egg.controller");
const userMiddleware = require("../middleware");

router.get("/", userMiddleware, EggController.getAllEggs);
router.post("/multi", userMiddleware, EggController.createMultiEgg);
router.post("/", userMiddleware, EggController.createEgg);
router.get("/:id", userMiddleware, EggController.getEggById);
router.put("/:id", userMiddleware, EggController.updateEgg);
router.delete("/:id", userMiddleware, EggController.deleteEgg);

module.exports = router;
