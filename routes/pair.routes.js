const express = require("express");
const router = express.Router();
const PairController = require("../controllers/pair.controller");
const userMiddleware = require("../middleware");

router.get("/", userMiddleware, PairController.getAllPairs);
router.post("/", userMiddleware, PairController.createPair);
router.get("/:id", userMiddleware, PairController.getPairById);
router.put("/:id", userMiddleware, PairController.updatePair);
router.delete("/:id", userMiddleware, PairController.deletePair);

module.exports = router;
