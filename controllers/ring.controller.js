const RingService = require("../services/ring.service");

class RingController {
  static async getAllRings(req, res) {
    try {
      // create short by alphabet

      const rings = await RingService.getAllRings();
      res.status(200).send({
        msg: "Successfully retrieved ring data",
        count: rings.length,
        rings,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error retrieving ring data", error });
    }
  }

  static async createRing(req, res) {
    const { ring_code } = req.body;
    console.log(ring_code);
    try {
      const ring = await RingService.createRing({
        ring_code,
      });
      res.status(201).send({ msg: "Successfully created a ring", ring });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error creating ring", error });
    }
  }

  static async getRingById(req, res) {
    try {
      const ring = await RingService.getRingById(req.params.id);
      if (!ring) {
        return res.status(404).send({ msg: "Ring not found" });
      }
      res.status(200).send({ msg: "Successfully retrieved ring data", ring });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error retrieving ring data", error });
    }
  }

  static async updateRing(req, res) {
    try {
      const ring = await RingService.updateRing(req.params.id, req.body);
      res.status(200).send({ msg: "Successfully updated ring data", ring });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error updating ring data", error });
    }
  }

  static async deleteRing(req, res) {
    try {
      await RingService.deleteRing(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error deleting ring", error });
    }
  }
}

module.exports = RingController;
