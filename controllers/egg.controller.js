const EggService = require("../services/egg.service");

class EggController {
  static async getAllEggs(req, res) {
    const owner = req.user._id;
    try {
      const eggs = await EggService.getAllEggs(owner);
      res.status(200).send({
        msg: "Successfully get egg data",
        count: eggs.length,
        eggs,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error getting egg data", error });
    }
  }

  static async createEgg(req, res) {
    const { incubation, laid_date, status } = req.body;
    const owner = req.user._id;
    try {
      const egg = await EggService.createEgg({
        incubation,
        laid_date,
        status,
        owner,
      });
      res.status(201).send({ msg: "Successfully create an egg", egg });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error creating an egg", error });
    }
  }

  static async getEggById(req, res) {
    const owner = req.user._id;
    try {
      const egg = await EggService.getEggById(req.params.id, owner);
      if (!egg) {
        return res.status(403).send({ msg: "Forbidden" });
      }
      res.status(200).send({
        msg: "Successfully get egg data",
        egg,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error getting egg data", error });
    }
  }

  static async updateEgg(req, res) {
    const owner = req.user._id;
    const { laid_date, status } = req.body;
    try {
      const egg = await EggService.updateEgg(
        req.params.id,
        { laid_date, status },
        owner
      );
      if (!egg) {
        return res.status(404).send({ msg: "Egg not found" });
      }
      res.status(200).send({ msg: "Successfully update an egg", egg });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error updating an egg", error });
    }
  }

  static async deleteEgg(req, res) {
    const owner = req.user._id;
    try {
      const egg = await EggService.deleteEgg(req.params.id, owner);
      if (!egg) {
        return res.status(404).send({ msg: "Egg not found" });
      }
      res.status(200).send({ msg: "Successfully delete an egg" });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error deleting an egg", error });
    }
  }
}

module.exports = EggController;
