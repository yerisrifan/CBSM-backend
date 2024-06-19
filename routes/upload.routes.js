const express = require("express");
const router = express.Router();
const multer = require("multer");
const userMiddleware = require("../middleware");

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, "./uploads/canary");
  },
  filename(req, file, callback) {
    callback(null, `${Date.now()}_${file.originalname}`);
  },
});

const storageProfile = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, "./uploads/user");
  },
  filename(req, file, callback) {
    callback(null, `${Date.now()}_${file.originalname}`);
  },
});

router.get("/", (req, res) => {
  res.send("upload");
});

const upload = multer({ storage });
const uploadProfile = multer({ storage: storageProfile });

// @route POST /upload/profile
// @desc Upload picture
// @access Private
router.post("/profile", uploadProfile.single("photo"), async (req, res) => {
  console.log("file", req.file);
  console.log("body", req.body);
  res.status(200).json({
    message: "success!",
    path: req.file.path,
  });
});

// @route POST /upload
// @desc Upload picture
// @access Private
router.post("/", userMiddleware, upload.single("photo"), (req, res) => {
  console.log("file", req.files);
  console.log("body", req.body);
  res.status(200).json({
    message: "success!",
    path: req.file.path,
  });
});

module.exports = router;
