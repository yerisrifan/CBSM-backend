const Egg = require("../models/eggs.model");
const Incubation = require("../models/incubation.model");

class EggService {
  static async getAllEggs(owner) {
    return Egg.find({ owner }).lean();
  }

  static async createMultiEgg({ incubation, eggs, owner }) {
    const arrayEgg = Array.from({ length: eggs }, () => ({
      laid_date: new Date(),
      status: "Incubating",
      incubation, // Include incubation in each egg
      owner, // Include owner in each egg
    }));
    // Use insertMany to insert all eggs at once and return them as an array
    const eggDocuments = await Egg.insertMany(arrayEgg);
    const incubationData = await Incubation.findById(incubation);
    incubationData.eggs.push(...eggDocuments.map((e) => e._id)); // Now eggDocuments is an array, so .map() can be used
    await incubationData.save();
    return eggDocuments; // Return the array of created egg documents
  }

  static async createEgg({ incubation, laid_date, status, owner }) {
    const egg = new Egg({ laid_date, status, incubation, owner });
    const incubationData = await Incubation.findById(incubation);
    incubationData.eggs.push(egg._id);
    await incubationData.save();
    await egg.save();
    return egg;
  }

  static async getEggById(id, owner) {
    const egg = await Egg.findById(id).lean();
    if (egg.owner.toString() !== owner) {
      return null;
    }
    return egg;
  }

  static async updateEgg(id, { laid_date, status }, owner) {
    console.log(status);
    const egg = await Egg.findById(id);
    if (status === "Hatched") {
      egg.hatched_date = new Date();
    } else {
      egg.hatched_date = null;
    }
    egg.laid_date = laid_date;
    egg.status = status;
    await egg.save();
    return egg;
  }

  static async deleteEgg(id, owner) {
    const egg = await Egg.findById(id);
    await Egg.findByIdAndDelete(id);
    return egg;
  }
}

module.exports = EggService;
