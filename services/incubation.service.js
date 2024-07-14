const Incubation = require("../models/incubation.model");
const Egg = require("../models/eggs.model");
const Pair = require("../models/pair.model");

class IncubationService {
  static async getAllIncubations(owner) {
    return Incubation.find({ owner }).populate("pair").populate("eggs").lean();
  }

  static async createIncubation({ pair, eggs, owner }) {
    const incubation = new Incubation({ pair, owner });
    const eggsData = await Promise.all(
      eggs.map(async (egg) => {
        const newEgg = new Egg({ ...egg, incubation: incubation._id, owner });
        await newEgg.save();
        return newEgg._id;
      })
    );
    incubation.eggs = eggsData;
    const pairData = await Pair.findById(pair);
    pairData.incubation.push(incubation._id);
    await pairData.save();
    await incubation.save();
    return incubation;
  }

  static async getIncubationById(incubationId, owner) {
    const incubation = await Incubation.findById(incubationId).populate(
      "pair eggs"
    );
    if (incubation.owner.toString() !== owner.toString()) {
      throw new Error("Forbidden");
    }
    return incubation;
  }

  static async updateIncubation(incubationId, owner, updates) {
    const incubation = await Incubation.findById(incubationId);
    if (!incubation) {
      throw new Error("Incubation not found");
    }
    if (incubation.owner.toString() !== owner.toString()) {
      throw new Error("Forbidden");
    }
    Object.assign(incubation, updates);
    await incubation.save();
    return incubation;
  }

  static async deleteIncubation(incubationId, owner) {
    const incubation = await Incubation.findById(incubationId);
    if (!incubation) {
      throw new Error("Incubation not found");
    }
    if (incubation.owner.toString() !== owner.toString()) {
      throw new Error("Forbidden");
    }
    await Egg.deleteMany({ incubation: incubationId });
    await Incubation.findByIdAndDelete(incubationId);
    const pair = await Pair.findById(incubation.pair);
    pair.incubation = pair.incubation.filter(
      (incubation) => incubation.toString() !== incubationId.toString()
    );
    await pair.save();
  }
}

module.exports = IncubationService;
