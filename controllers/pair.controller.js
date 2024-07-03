const PairService = require("../services/pair.service");

class PairController {
  static async getAllPairs(req, res) {
    try {
      const pairs = await PairService.getAllPairs(req.user._id);
      res.status(200).send({
        msg: "Successfully retrieved pair data",
        count: pairs.length,
        pairs,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error retrieving pair data", error });
    }
  }

  static async createPair(req, res) {
    const { male, female, cage } = req.body;
    try {
      const pair = await PairService.createPair({
        male,
        female,
        cage,
        owner: req.user._id,
      });
      res.status(201).send({ msg: "Successfully created a pair", pair });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error creating pair", error });
    }
  }

  static async getPairById(req, res) {
    try {
      const pair = await PairService.getPairById(req.params.id);
      if (!pair) {
        return res.status(404).send({ msg: "Pair not found" });
      }
      res.status(200).send({ msg: "Successfully retrieved pair data", pair });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error retrieving pair data", error });
    }
  }

  static async updatePair(req, res) {
    try {
      const pair = await PairService.updatePair(
        req.params.id,
        req.body,
        req.user._id
      );
      res.status(200).send({ msg: "Successfully updated pair data", pair });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error updating pair data", error });
    }
  }

  static async deletePair(req, res) {
    try {
      await PairService.deletePair(req.params.id, req.user._id);
      res.status(200).send({ msg: "Successfully deleted the pair" });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error deleting pair", error });
    }
  }
}

module.exports = PairController;
