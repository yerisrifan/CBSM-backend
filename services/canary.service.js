const Canary = require("../models/canary.model");
const Egg = require("../models/eggs.model");
const fs = require("fs");
const { getAllRelatedCanaries } = require("../utils");

class CanaryService {
  static async getAllCanaries(userId, gender) {
    const query = { owner: userId };
    if (gender) {
      query["data.gender"] = gender;
    }
    return Canary.find(query)
      .populate("owner")
      .populate("rels.father rels.mother")
      .sort({ createdAt: -1 })
      .lean();
  }

  static async getCanaryById(canaryId, userId) {
    const canary = await Canary.findOne({ _id: canaryId })
      .populate("owner")
      .populate("rels.father rels.mother")
      .lean();
    // if (canary && canary.owner._id.toString() !== userId) {
    //   throw new Error("Not authorized");
    // }
    return canary;
  }

  static async createCanary(userId, canaryData) {
    const { date_of_banding, date_of_birth, ring, gender, status, photos } =
      canaryData;
    const canary = new Canary({
      owner: userId,
      data: {
        date_of_banding,
        date_of_birth,
        ring,
        gender,
        status,
        avatar: photos.avatar,
      },
    });
    await canary.save();
    return canary;
  }

  static async updateCanary(canaryId, userId, canaryData) {
    let canary = await Canary.findOne({ _id: canaryId });
    if (!canary || canary.owner.toString() !== userId) {
      throw new Error("Not authorized or Canary not found!");
    }
    canary = await Canary.findByIdAndUpdate(
      canaryId,
      { $set: canaryData },
      { new: true }
    );
    return canary;
  }

  static async deleteCanary(canaryId) {
    const canary = await Canary.findById(canaryId);
    if (!canary) {
      throw new Error("Canary not found");
    }
    if (canary.rels.children.length > 0) {
      throw new Error("Canary cannot be deleted because it has children");
    }

    // check if canary has paired
    if (canary.rels.spouses.length > 0) {
      throw new Error("Canary cannot be deleted because it has paired");
    }
    await CanaryService._removeCanaryFromRelations(canaryId);
    if (canary.data.avatar !== "uploads/assets/default-bird.png") {
      await fs.unlink(canary.data.avatar, (err) => {
        if (err) console.log(err);
      });
    }
    await Canary.findByIdAndDelete(canaryId);
  }

  static async _removeCanaryFromRelations(canaryId) {
    const docsToUpdate = await Canary.find({
      $or: [{ "rels.spouses": canaryId }, { "rels.children": canaryId }],
    });
    for (const doc of docsToUpdate) {
      const updateObj = {};
      if (doc.rels.spouses.includes(canaryId)) {
        updateObj["rels.spouses"] = canaryId;
      }
      if (doc.rels.children.includes(canaryId)) {
        updateObj["rels.children"] = canaryId;
      }
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
  }

  static async addSpouse(canaryId, spouseId) {
    const canary = await Canary.findOne({ _id: canaryId });
    if (!canary) {
      throw new Error("Canary not found!");
    }
    const spouse = await Canary.findOne({ _id: spouseId });
    if (!spouse) {
      throw new Error("Spouse not found!");
    }
    if (canary.rels.spouses.includes(spouse.id)) {
      throw new Error("Spouse already exists!");
    }
    canary.rels.spouses.push(spouse.id);
    spouse.rels.spouses.push(canary.id);
    await spouse.save();
    await canary.save();
    return canary;
  }

  static async addChild(userId, childData) {
    const { ring, gender, father_id, mother_id, egg_id } = childData;
    const father = await Canary.findOne({ _id: father_id });
    if (!father) {
      throw new Error("Father not found!");
    }
    const mother = await Canary.findOne({ _id: mother_id });
    if (!mother) {
      throw new Error("Mother not found!");
    }
    const child = new Canary({
      owner: userId,
      data: {
        date_of_birth: new Date(),
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
    await Egg.findByIdAndDelete(egg_id);
    return child;
  }

  static async getRelatedCanaries(canaryId) {
    const bird = await Canary.findById(canaryId).lean();
    if (!bird) {
      throw new Error("Bird not found!");
    }
    return getAllRelatedCanaries(bird.id);
  }
  static async getCanariesByRing(ring) {
    return Canary.find({
      "data.ring": { $regex: new RegExp(`^${ring}$`, "i") },
    }).lean();
  }
  static async getCanaryByStatus(status) {
    const canaries = await Canary.find({
      "data.status": status,
    })
      .populate({
        path: "owner",
        match: { user_level: { $ne: 0 } },
        select: "user_level",
      })
      .lean();

    // Filter out canaries where owner is null (due to not matching the user_level criteria)
    return canaries.filter((canary) => canary.owner !== null);
  }
}

module.exports = CanaryService;
