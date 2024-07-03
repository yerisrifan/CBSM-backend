const Egg = require("../models/eggs.model");
const Incubation = require("../models/incubation.model");

class EggService {
  static async getAllEggs(owner) {
    return Egg.find({ owner }).lean();
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
    const egg = await Egg.findById(id);
    // if (!egg || egg.owner.toString() !== owner) {
    //   return null;
    // }
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
