const IncubationService = require("../services/incubation.service");

class IncubationController {
  static async getAllIncubations(req, res) {
    const owner = req.user._id;
    try {
      const incubations = await IncubationService.getAllIncubations(owner);
      res.status(200).send({
        msg: "Successfully get incubation data",
        count: incubations.length,
        incubations,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error getting incubation data", error });
    }
  }

  static async createIncubation(req, res) {
    const { pair, eggs } = req.body;
    const owner = req.user._id;
    try {
      const incubation = await IncubationService.createIncubation({
        pair,
        eggs,
        owner,
      });
      res
        .status(201)
        .send({ msg: "Successfully create an incubation", incubation });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error creating an incubation", error });
    }
  }

  static async getIncubationById(req, res) {
    const owner = req.user._id;
    const incubationId = req.params.id;
    try {
      const incubation = await IncubationService.getIncubationById(
        incubationId,
        owner
      );
      res
        .status(200)
        .send({ msg: "Successfully get incubation data", incubation });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error getting incubation data", error });
    }
  }

  static async updateIncubation(req, res) {
    const owner = req.user._id;
    const incubationId = req.params.id;
    const updates = req.body;
    try {
      const incubation = await IncubationService.updateIncubation(
        incubationId,
        owner,
        updates
      );
      res
        .status(200)
        .send({ msg: "Successfully update an incubation", incubation });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error updating an incubation", error });
    }
  }

  static async deleteIncubation(req, res) {
    const owner = req.user._id;
    const incubationId = req.params.id;
    try {
      await IncubationService.deleteIncubation(incubationId, owner);
      res.status(200).send({ msg: "Successfully delete an incubation" });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error deleting an incubation", error });
    }
  }
}

module.exports = IncubationController;
