const Pair = require("../models/pair.model");
const Canary = require("../models/canary.model");
const Incubation = require("../models/incubation.model");
const Egg = require("../models/eggs.model");
const { checkAndUpdateSpouses, removeSpouses } = require("../utils");

class PairService {
  static async getAllPairs(owner) {
    return Pair.find({ owner })
      .populate("male")
      .populate("female")
      .populate("incubation")
      .lean();
  }

  static async createPair({ male, female, cage, owner }) {
    const [maleData, femaleData] = await Promise.all([
      Canary.findById(male),
      Canary.findById(female),
    ]);

    if (!maleData || maleData.data.gender !== "M") {
      throw new Error("Father must be a Male and must exist");
    }

    if (!femaleData || femaleData.data.gender !== "F") {
      throw new Error("Mother must be Female and must exist");
    }

    await checkAndUpdateSpouses(male, female);

    const pair = new Pair({ male, female, cage, owner });
    await pair.save();
    return pair;
  }

  static async getPairById(pairId) {
    return Pair.findById(pairId)
      .populate("incubation")
      .populate("male")
      .populate("female")
      .lean();
  }

  static async updatePair(pairId, updates, owner) {
    const pair = await Pair.findById(pairId);

    if (!pair) {
      throw new Error("Pair not found");
    }

    if (pair.owner.toString() !== owner.toString()) {
      throw new Error("Unauthorized");
    }

    Object.assign(pair, updates);
    await pair.save();
    return pair;
  }

  static async deletePair(pairId, owner) {
    const pair = await Pair.findById(pairId);
    const fatherId = await Canary.findOne({ _id: pair.male });
    const motherId = await Canary.findOne({ _id: pair.female });

    if (!pair) {
      throw new Error("Pair not found");
    }

    if (pair.owner.toString() !== owner.toString()) {
      throw new Error("Unauthorized");
    }

    const children = await Canary.find({
      $or: [{ "rels.father": pair.male }, { "rels.mother": pair.male }],
    });

    if (children.length === 0) {
      await removeSpouses(pair.male, pair.female);
    }

    // aslo update canary.data.status to available for father and mother
    await Canary.findByIdAndUpdate(fatherId, { "data.status": 0 });
    await Canary.findByIdAndUpdate(motherId, { "data.status": 0 });

    await Promise.all([
      Incubation.deleteMany({ pair: pairId }),
      Egg.deleteMany({ pair: pairId }),
      Pair.findByIdAndDelete(pairId),
    ]);
  }
}

module.exports = PairService;
