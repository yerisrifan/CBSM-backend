const express = require("express");
const router = express.Router();
const Canary = require("../models/canary.model");
const userMiddleware = require("../middleware/index");
const uuid = require("uuid");
const { getAllRelatedCanaries, deleteAllRelatedCanaries } = require("../lib");

// @route GET /canary
// @desc Get all canaries filtered by gender
// @access Private
router.get("/", userMiddleware, async (req, res) => {
  try {
    const { gender } = req.query; // Get the gender query parameter
    const query = { owner: req.user.id }; // Start with owner filter

    // If gender is provided, add it to the query
    if (gender) {
      query["data.gender"] = gender;
    }
    // create query to get all canaries with gender filter gender in data short by created date
    const canaries = await Canary.find(query)
      .populate("owner")
      .populate("rels.father rels.mother")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).send({
      msg: "Succefully get canary data",
      count: canaries.length,
      canaries,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ msg: "Error getting canary data", error });
  }
});

// Get a Canary
// GET /canary/:id
// Access: Private
router.get("/:id", userMiddleware, async (req, res) => {
  try {
    const canary = await Canary.findOne({ _id: req.params.id })
      .populate("owner")
      .populate("rels.father rels.mother")
      .lean();
    if (!canary) {
      return res.status(404).send({ msg: "Canary not found!" });
    }
    if (canary.owner._id.toString() !== req.user.id) {
      return res.status(401).send({ msg: "Not authorized" });
    }
    res.status(200).send({ msg: "successfully get canary data", canary });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Error getting canary data", error });
  }
});

// Create a new Canary
// POST /canary
// Access: Private
router.post("/", userMiddleware, async (req, res) => {
  try {
    const canary = new Canary({
      owner: req.user.id,
      data: req.body,
    });
    await canary.save();
    res.status(201).send({ msg: "Canary created successfully!", canary });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Error creating canary", error });
  }
});

// Put a Canary
// PUT /canary/:id
// Access: Private
router.put("/:id", userMiddleware, async (req, res) => {
  try {
    let canary = await Canary.findOne({ _id: req.params.id });
    if (!canary) {
      return res.status(404).send({ msg: "Canary not found!" });
    }
    if (canary.owner.toString() !== req.user.id) {
      return res.status(401).send({ msg: "Not authorized" });
    }
    // just update data entered
    const data = {
      data: req.body,
    };
    canary = await Canary.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      {
        new: true,
      }
    );
    res.send({ msg: "Canary updated successfully!", canary });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error });
  }
});

// Delete a Canary
// DELETE /canary/:id
// Access: Private
// router.delete("/:id", async (req, res) => {
//   try {
//     const _id = req.params.id;
//     await deleteAllRelatedCanaries(_id);
//     res
//       .status(200)
//       .json({ message: "Canary and related records deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });
router.delete("/:id", async (req, res) => {
  try {
    const canaryId = req.params.id;

    // 1. Cari canary yang akan dihapus
    const canary = await Canary.findById(canaryId);
    if (!canary) {
      return res.status(404).json({ msg: "Canary not found" });
    }
    // jika canary rels.chilren tidak kosong
    if (canary.rels.children.length > 0) {
      return res.status(400).json({
        msg: "Canary cannot be deleted because it has children",
      });
    }

    // Mencari semua dokumen yang mengandung `canaryId` dalam relasi
    const docsToUpdate = await Canary.find({
      $or: [{ "rels.spouses": canaryId }, { "rels.children": canaryId }],
    });

    // Memperbarui setiap dokumen untuk menghapus `canaryId` dari relasi yang ditemukan
    for (const doc of docsToUpdate) {
      const updateObj = {};

      if (doc.rels.spouses && doc.rels.spouses.includes(canaryId)) {
        updateObj["rels.spouses"] = canaryId;
      }
      if (doc.rels.children && doc.rels.children.includes(canaryId)) {
        updateObj["rels.children"] = canaryId;
      }

      // Menghapus referensi `canaryId` dari array `rels.spouses` dan `rels.children`
      if (updateObj["rels.spouses"]) {
        await Canary.updateOne(
          { _id: doc._id },
          { $pull: { "rels.spouses": canaryId } }
        );
      }
      if (updateObj["rels.children"]) {
        await Canary.updateOne(
          { _id: doc._id },
          { $pull: { "rels.children": canaryId } }
        );
      }
    }

    // Menghapus dokumen canary itu sendiri
    await Canary.findByIdAndDelete(canaryId);

    res.status(200).json({ msg: "Canary deleted successfully" });
  } catch (error) {
    res.status(500).send({ msg: "Error deleting canary", error });
  }
});

// Add a spouse to a Canary
// POST /canary/:id/spouse
// Access: Private
router.post("/:id/spouse", userMiddleware, async (req, res) => {
  try {
    const canary = await Canary.findOne({ _id: req.params.id });
    if (!canary) {
      return res.status(404).send({ msg: "Canary not found!" });
    }
    const spouse = await Canary.findOne({ _id: req.body.spouse_id });
    if (!spouse) {
      return res.status(404).send({ msg: "Spouse not found!" });
    }
    // i want spose not duplicate
    if (canary.rels.spouses.includes(spouse.id)) {
      return res.status(400).send({ msg: "Spouse already exists!" });
    }

    canary.rels.spouses.push(spouse.id);

    // also add spose to spouse from spose_id
    spouse.rels.spouses.push(canary.id);
    await spouse.save();
    await canary.save();
    res.send({ msg: "Spouse added successfully!", canary });
  } catch (error) {
    res.status(500).send({ error });
  }
});

// Post Child
// POST /canary/child
// Access: Private
router.post("/child", userMiddleware, async (req, res) => {
  const { ring, gender, father_id, mother_id } = req.body;
  try {
    const father = await Canary.findOne({ _id: father_id });
    if (!father) {
      return res.status(404).send({ msg: "Father not found!" });
    }
    const mother = await Canary.findOne({ _id: mother_id });
    if (!mother) {
      return res.status(404).send({ msg: "Mother not found!" });
    }
    const child = new Canary({
      owner: req.user.id,
      data: {
        ring,
        gender,
      },
      rels: {
        father: father.id,
        mother: mother.id,
      },
    });
    await child.save();
    father.rels.children.push(child.id);
    mother.rels.children.push(child.id);
    await father.save();
    await mother.save();
    res.status(201).send({ msg: "Child created successfully!", child });
  } catch (error) {
    res.status(500).send({ error });
  }
});

// Get Family Tree
// GET /canary/:id/family
// Access: Private
router.get("/:id/related", async (req, res) => {
  try {
    const bird = await Canary.findById(req.params.id);
    if (!bird) {
      return res.status(404).send({ msg: "Bird not found!" });
    }
    const family = await getAllRelatedCanaries(bird.id);
    //res.send({ count: family.length, family });
    res.render("family-tree", {
      familyData: family,
      family: family,
      layout: false,
    });
  } catch (error) {
    res.status(500).send({ error });
  }
});

module.exports = router;
